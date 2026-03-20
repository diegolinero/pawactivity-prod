import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterDto, meta: RequestMeta) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
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

    return this.createSession(user.id, user.email, meta, true);
  }

  async login(input: LoginDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createSession(user.id, user.email, meta);
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({ where: { id: payload.sessionId } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session is not valid');
    }

    const validToken = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!validToken) {
      throw new UnauthorizedException('Session is not valid');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(session.userId, payload.email, meta);
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { id: payload.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

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

    const provisionalSession = await this.prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash: 'pending',
        deviceName: meta.deviceName,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: this.addDuration(refreshExpiresIn),
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
        expiresAt: this.addDuration(refreshExpiresIn),
      },
    });

    if (updateLastLogin) {
      await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    }

    return {
      accessToken,
      refreshToken,
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
