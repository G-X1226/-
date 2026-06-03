import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class IpRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await this.rateLimitService.assertFixedWindow(`ratelimit:ip:${request.ip ?? 'unknown'}`, 120, 60_000);
    return true;
  }
}
