import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { apiKey?: AuthenticatedApiKey }>();
    if (!request.apiKey) return true;

    await this.rateLimitService.assertApiKeyMinuteLimit(request.apiKey);
    return true;
  }
}
