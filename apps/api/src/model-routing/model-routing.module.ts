import { Module } from '@nestjs/common';
import { ModelProviderMappingsRepository } from './repositories/model-provider-mappings.repository';
import { ModelsRepository } from './repositories/models.repository';
import { FallbackPlannerService } from './services/fallback-planner.service';
import { ModelPermissionService } from './services/model-permission.service';
import { ModelRoutingService } from './services/model-routing.service';
import { RoutingCacheService } from './services/routing-cache.service';

@Module({
  providers: [
    ModelRoutingService,
    ModelPermissionService,
    FallbackPlannerService,
    RoutingCacheService,
    ModelsRepository,
    ModelProviderMappingsRepository,
  ],
  exports: [ModelRoutingService, ModelPermissionService, ModelsRepository],
})
export class ModelRoutingModule {}
