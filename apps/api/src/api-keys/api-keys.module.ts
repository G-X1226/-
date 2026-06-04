import { Module } from '@nestjs/common';
import { ApiKeysController } from './controllers/api-keys.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { ApiKeysRepository } from './repositories/api-keys.repository';
import { ApiKeyAuthService } from './services/api-key-auth.service';
import { ApiKeyGeneratorService } from './services/api-key-generator.service';
import { ApiKeyHasherService } from './services/api-key-hasher.service';
import { ApiKeysService } from './services/api-keys.service';

@Module({
  controllers: [ApiKeysController],
  providers: [
    ApiKeysService,
    ApiKeyGeneratorService,
    ApiKeyHasherService,
    ApiKeyAuthService,
    ApiKeyAuthGuard,
    ApiKeysRepository,
  ],
  exports: [ApiKeyAuthGuard, ApiKeyAuthService, ApiKeysService],
})
export class ApiKeysModule {}
