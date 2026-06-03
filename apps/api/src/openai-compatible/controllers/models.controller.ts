import { Controller, Get } from '@nestjs/common';

@Controller('v1/models')
export class ModelsController {
  @Get()
  listModelsPlaceholder(): { object: 'list'; data: unknown[] } {
    return { object: 'list', data: [] };
  }
}
