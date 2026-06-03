import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AUTHORIZATION_HEADER } from '../../common/constants/headers.constants';
import type { AuthenticatedApiKey } from '../types/authenticated-api-key.type';
import { ApiKeyAuthService } from '../services/api-key-auth.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeyAuthService: ApiKeyAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { apiKey?: AuthenticatedApiKey }>();
    const authorization = request.header(AUTHORIZATION_HEADER);

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing API key.');
    }

    request.apiKey = await this.apiKeyAuthService.authenticate(
      authorization.slice('Bearer '.length),
      request.ip,
    );
    return true;
  }
}
