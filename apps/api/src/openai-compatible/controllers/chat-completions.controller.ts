import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiKeyAuthGuard } from '../../api-keys/guards/api-key-auth.guard';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { CurrentApiKey } from '../../common/decorators/current-api-key.decorator';
import { REQUEST_ID_HEADER } from '../../common/constants/headers.constants';
import { ApiKeyRateLimitGuard } from '../../rate-limit/guards/api-key-rate-limit.guard';
import { IpRateLimitGuard } from '../../rate-limit/guards/ip-rate-limit.guard';
import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionsService } from '../services/chat-completions.service';

@Controller('v1/chat/completions')
export class ChatCompletionsController {
  constructor(private readonly chatCompletionsService: ChatCompletionsService) {}

  @Post()
  @UseGuards(ApiKeyAuthGuard, IpRateLimitGuard, ApiKeyRateLimitGuard)
  async create(
    @CurrentApiKey() apiKey: AuthenticatedApiKey,
    @Body() body: ChatCompletionRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const metadata = {
      clientIp: request.ip,
      userAgent: request.header('user-agent'),
    };

    if (body.stream) {
      await this.chatCompletionsService.streamCompletion(body, apiKey, response, metadata);
      return;
    }

    const result = await this.chatCompletionsService.createCompletion(body, apiKey, metadata);
    response.setHeader(REQUEST_ID_HEADER, result.requestId);
    response.json(result.body);
  }
}
