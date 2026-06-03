import { Injectable } from '@nestjs/common';
import type { ModelRoute } from '../types/model-route.type';

@Injectable()
export class FallbackPlannerService {
  createPlan(routes: ModelRoute[]): ModelRoute[] {
    return routes;
  }
}
