import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, type RateLimitOptions } from '../decorators/rate-limit.decorator';

type Entry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Entry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const options = this.reflector.get<RateLimitOptions | undefined>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identifier = options.scope === 'user'
      ? request.user?.id ?? request.ip
      : request.ip;

    const key = `${options.keyPrefix}:${identifier}`;
    const now = Date.now();
    const current = this.store.get(key);

    if (!current || current.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + options.windowMs });
      this.cleanup(now);
      return true;
    }

    if (current.count >= options.limit) {
      throw new TooManyRequestsException(`Rate limit exceeded for ${options.keyPrefix}`);
    }

    current.count += 1;
    this.store.set(key, current);
    this.cleanup(now);
    return true;
  }

  private cleanup(now: number) {
    if (this.store.size < 500) {
      return;
    }

    for (const [key, value] of this.store.entries()) {
      if (value.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
