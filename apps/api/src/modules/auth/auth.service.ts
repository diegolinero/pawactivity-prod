import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  async register(input: RegisterDto, meta: RequestMeta) {
    this.assertRegistrationAllowed(input.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      this.metricsService.increment('auth_register_conflict_total');
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        timezone: input.timezone ?? 'UTC',
      },
    });

    const session = await this.createSession(user.id, user.email, meta, true);
    this.metricsService.increment('auth_register_success_total');
    this.logger.log(JSON.stringify({ event: 'auth_register_success', userId: user.id, email: user.email }));
    return session;
  }

  async login(input: LoginDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      this.metricsService.increment('auth_login_failed_total');
      this.logger.warn(JSON.stringify({ event: 'auth_login_failed', email: input.email, reason: 'user_not_found' }));
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      this.metricsService.increment('auth_login_failed_total');
      this.logger.warn(JSON.stringify({ event: 'auth_login_failed', email: input.email, reason: 'invalid_password', userId: user.id }));
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await this.createSession(user.id, user.email, meta);
    this.metricsService.increment('auth_login_success_total');
    this.logger.log(JSON.stringify({ event: 'auth_login_success', userId: user.id, email: user.email }));
    return session;
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({ where: { id: payload.sessionId } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      this.metricsService.increment('auth_refresh_failed_total');
      this.logger.warn(JSON.stringify({ event: 'auth_refresh_failed', sessionId: payload.sessionId, reason: 'session_invalid' }));
      throw new UnauthorizedException('Session is not valid');
    }

    const validToken = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!validToken) {
      this.metricsService.increment('auth_refresh_failed_total');
      this.logger.warn(JSON.stringify({ event: 'auth_refresh_failed', sessionId: payload.sessionId, reason: 'token_hash_mismatch' }));
      throw new UnauthorizedException('Session is not valid');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const nextSession = await this.createSession(session.userId, payload.email, meta);
    this.metricsService.increment('auth_refresh_success_total');
    this.logger.log(JSON.stringify({ event: 'auth_refresh_success', userId: session.userId, previousSessionId: session.id, nextSessionId: nextSession.session.sessionId }));
    return nextSession;
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { id: payload.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(JSON.stringify({ event: 'auth_logout', userId: payload.sub, sessionId: payload.sessionId }));
    this.metricsService.increment('auth_logout_total');
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        timezone: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async createSession(userId: string, email: string, meta: RequestMeta, updateLastLogin = false) {
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpiresAt = this.addDuration(refreshExpiresIn);

    const provisionalSession = await this.prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash: 'pending',
        deviceName: meta.deviceName,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: refreshExpiresAt,
      },
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, sessionId: provisionalSession.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change-me-refresh',
        expiresIn: refreshExpiresIn,
      },
    );

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, sessionId: provisionalSession.id, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
        expiresIn: accessExpiresIn,
      },
    );

    await this.prisma.authSession.update({
      where: { id: provisionalSession.id },
      data: {
        refreshTokenHash: await argon2.hash(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    if (updateLastLogin) {
      await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    }

    return {
      tokenType: 'Bearer' as const,
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: this.durationToSeconds(accessExpiresIn),
      refreshTokenExpiresInSeconds: this.durationToSeconds(refreshExpiresIn),
      session: {
        sessionId: provisionalSession.id,
        deviceName: meta.deviceName ?? null,
        expiresAt: refreshExpiresAt.toISOString(),
      },
      user: await this.me(userId),
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change-me-refresh',
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private assertRegistrationAllowed(email: string) {
    const allowPublicRegistration = (this.configService.get<string>('ALLOW_PUBLIC_REGISTRATION') ?? 'true').toLowerCase() === 'true';
    if (allowPublicRegistration) {
      return;
    }

    const allowlist = (this.configService.get<string>('REGISTRATION_EMAIL_ALLOWLIST') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!allowlist.includes(email.toLowerCase())) {
      this.metricsService.increment('auth_register_blocked_total');
      throw new ForbiddenException('Registration is currently limited');
    }
  }

  private addDuration(duration: string) {
    const now = new Date();
    if (duration.endsWith('d')) {
      now.setDate(now.getDate() + Number(duration.slice(0, -1)));
      return now;
    }
    if (duration.endsWith('h')) {
      now.setHours(now.getHours() + Number(duration.slice(0, -1)));
      return now;
    }
    if (duration.endsWith('m')) {
      now.setMinutes(now.getMinutes() + Number(duration.slice(0, -1)));
      return now;
    }
    now.setDate(now.getDate() + 7);
    return now;
  }

  private durationToSeconds(duration: string) {
    if (duration.endsWith('d')) {
      return Number(duration.slice(0, -1)) * 86400;
    }
    if (duration.endsWith('h')) {
      return Number(duration.slice(0, -1)) * 3600;
    }
    if (duration.endsWith('m')) {
      return Number(duration.slice(0, -1)) * 60;
    }
    return 7 * 86400;
  }
}

type RefreshPayload = {
  sub: string;
  email: string;
  sessionId: string;
  type: 'refresh';
};

type RequestMeta = {
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
};
