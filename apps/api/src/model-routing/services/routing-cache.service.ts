import { Injectable } from '@nestjs/common';

@Injectable()
export class RoutingCacheService {
  getCacheKey(modelName: string): string {
    return `model-route:${modelName}`;
  }
}
