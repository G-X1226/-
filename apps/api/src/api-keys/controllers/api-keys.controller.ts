import { Controller, Get } from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get('status')
  getStatus(): { status: string } {
    this.apiKeysService.previewNewKey();
    return { status: 'api_keys_module_initialized' };
  }
}
