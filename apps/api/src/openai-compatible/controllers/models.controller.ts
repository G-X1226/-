import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../../api-keys/guards/api-key-auth.guard';
import type { OpenAiModelsListResponse } from '../types/openai-model.types';
import { ModelsService } from '../services/models.service';

@Controller('v1/models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @UseGuards(ApiKeyAuthGuard)
  listModels(): Promise<OpenAiModelsListResponse> {
    return this.modelsService.list();
  }
}
