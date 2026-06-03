import { Injectable } from '@nestjs/common';
import { ApiKeyGeneratorService } from './api-key-generator.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly generator: ApiKeyGeneratorService) {}

  previewNewKey(): { prefix: string; suffix: string } {
    const key = this.generator.generate('live');
    return { prefix: this.generator.getPrefix(key), suffix: this.generator.getSuffix(key) };
  }
}
