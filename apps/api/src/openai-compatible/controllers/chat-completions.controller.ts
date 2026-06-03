import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../../api-keys/guards/api-key-auth.guard';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { CurrentApiKey } from '../../common/decorators/current-api-key.decorator';
import { IpRateLimitGuard } from '../../rate-limit/guards/ip-rate-limit.guard';
import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionsService } from '../services/chat-completions.service';

@Controller('v1/chat/completions')
export class ChatCompletionsController {
  constructor(private readonly chatCompletionsService: ChatCompletionsService) {}

  @Post()
  @UseGuards(ApiKeyAuthGuard, IpRateLimitGuard)
  create(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Body() body: ChatCompletionRequestDto,
  ): Promise<Record<string, unknown>> {
    return this.chatCompletionsService.createCompletion(body, apiKey);
  }
}
