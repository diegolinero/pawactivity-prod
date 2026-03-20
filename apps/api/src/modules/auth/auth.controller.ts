import { Body, Controller, Get, Headers, Ip, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth-register', limit: 5, windowMs: 60_000, scope: 'ip' })
  register(
    @Body() body: RegisterDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-device-name') deviceName?: string,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.register(body, { userAgent, deviceName, ipAddress });
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth-login', limit: 10, windowMs: 60_000, scope: 'ip' })
  login(
    @Body() body: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-device-name') deviceName?: string,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.login(body, { userAgent, deviceName, ipAddress });
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth-refresh', limit: 20, windowMs: 60_000, scope: 'ip' })
  refresh(
    @Body() body: RefreshDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-device-name') deviceName?: string,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.refresh(body.refreshToken, { userAgent, deviceName, ipAddress });
  }

  @Post('logout')
  logout(@Body() body: LogoutDto) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }
}
