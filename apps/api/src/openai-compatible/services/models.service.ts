import { Injectable } from '@nestjs/common';
import { ModelsRepository } from '../../model-routing/repositories/models.repository';
import type { OpenAiModelsListResponse } from '../types/openai-model.types';

@Injectable()
export class ModelsService {
  constructor(private readonly modelsRepository: ModelsRepository) {}

  async list(): Promise<OpenAiModelsListResponse> {
    const models = await this.modelsRepository.listActive();

    return {
      object: 'list',
      data: models.map((model) => ({
        id: model.name,
        object: 'model',
        created: Math.floor(model.createdAt.getTime() / 1000),
        owned_by: 'gateway',
      })),
    };
  }
}
