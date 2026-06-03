import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiKeyAuthGuard } from '../../api-keys/guards/api-key-auth.guard';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { CurrentApiKey } from '../../common/decorators/current-api-key.decorator';
import { REQUEST_ID_HEADER } from '../../common/constants/headers.constants';
import { IpRateLimitGuard } from '../../rate-limit/guards/ip-rate-limit.guard';
import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionsService } from '../services/chat-completions.service';

@Controller('v1/chat/completions')
export class ChatCompletionsController {
  constructor(private readonly chatCompletionsService: ChatCompletionsService) {}

  @Post()
  @UseGuards(ApiKeyAuthGuard, IpRateLimitGuard)
  async create(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Body() body: ChatCompletionRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    if (body.stream) {
      await this.chatCompletionsService.streamCompletion(body, apiKey, response);
      return;
    }

    const result = await this.chatCompletionsService.createCompletion(body, apiKey);
    response.setHeader(REQUEST_ID_HEADER, result.requestId);
    response.json(result.body);
  }
}
