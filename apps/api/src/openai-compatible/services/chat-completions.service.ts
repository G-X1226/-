import { Injectable, NotFoundException } from '@nestjs/common';
import { createRequestId } from '../../common/utils/ids.util';
import { ModelRoutingService } from '../../model-routing/services/model-routing.service';
import { ProviderExecutorService } from '../../providers/application/provider-executor.service';
import type { NormalizedChatRequest } from '../../providers/domain/normalized-chat-request.type';
import type { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { assertValidChatCompletionRequest } from '../validators/chat-completion.validator';
import { OpenAiResponseMapperService } from './openai-response-mapper.service';

@Injectable()
export class ChatCompletionsService {
  constructor(
    private readonly modelRouting: ModelRoutingService,
    private readonly providerExecutor: ProviderExecutorService,
    private readonly responseMapper: OpenAiResponseMapperService,
  ) {}

  async createCompletion(request: ChatCompletionRequestDto): Promise<Record<string, unknown>> {
    assertValidChatCompletionRequest(request);
    const routes = await this.modelRouting.resolve(request.model);
    const route = routes[0];
    if (!route) {
      throw new NotFoundException(`No active provider mapping for model ${request.model}.`);
    }

    const normalizedRequest: NormalizedChatRequest = {
      requestId: createRequestId(),
      model: request.model,
      providerModel: route.providerModel,
      messages: request.messages.map((message) => ({ role: message.role, content: message.content })),
      stream: Boolean(request.stream),
      temperature: request.temperature,
      maxTokens: request.max_tokens,
    };

    const providerResponse = await this.providerExecutor.execute(route.providerName, normalizedRequest, {
      timeoutMs: route.timeoutMs,
      maxRetries: route.maxRetries,
    });

    return this.responseMapper.mapChatCompletion(providerResponse);
  }
}
