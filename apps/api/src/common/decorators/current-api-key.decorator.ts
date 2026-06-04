import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';

export const CurrentApiKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedApiKey => {
    const request = context.switchToHttp().getRequest<Request & { apiKey: AuthenticatedApiKey }>();
    return request.apiKey;
  },
);
