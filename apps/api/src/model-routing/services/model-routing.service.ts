import { Injectable, NotFoundException } from '@nestjs/common';
import { ModelProviderMappingsRepository } from '../repositories/model-provider-mappings.repository';
import { ModelsRepository } from '../repositories/models.repository';
import type { ModelRoute } from '../types/model-route.type';
import { FallbackPlannerService } from './fallback-planner.service';

@Injectable()
export class ModelRoutingService {
  constructor(
    private readonly modelsRepository: ModelsRepository,
    private readonly mappingsRepository: ModelProviderMappingsRepository,
    private readonly fallbackPlanner: FallbackPlannerService,
  ) {}

  async resolve(modelName: string): Promise<ModelRoute[]> {
    const model = await this.modelsRepository.findActiveByName(modelName);
    if (!model) {
      throw new NotFoundException(`Model ${modelName} was not found.`);
    }

    const mappings = await this.mappingsRepository.findActiveMappings(model.id);
    const routes = mappings.map((mapping) => ({
      modelId: model.id,
      providerId: mapping.providerId,
      providerName: mapping.provider.name,
      providerModel: mapping.providerModel,
      timeoutMs: mapping.timeoutMs,
      maxRetries: mapping.maxRetries,
    }));

    return this.fallbackPlanner.createPlan(routes);
  }
}
