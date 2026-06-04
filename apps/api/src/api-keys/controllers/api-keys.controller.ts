import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import type { ApiKeyResponseDto, CreatedApiKeyResponseDto } from '../dto/api-key-response.dto';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { ApiKeysService } from '../services/api-keys.service';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: CreateApiKeyDto,
  ): Promise<CreatedApiKeyResponseDto> {
    return this.apiKeysService.create(currentUser.id, body);
  }

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.list(currentUser.id);
  }

  @Delete(':id')
  revoke(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') apiKeyId: string,
  ): Promise<{ revoked: true }> {
    return this.apiKeysService.revoke(currentUser.id, apiKeyId);
  }
}
