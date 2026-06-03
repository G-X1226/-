import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { API_KEY_SCOPES } from '../../common/constants/scopes.constants';
import { createRequestId } from '../../common/utils/ids.util';
import { ModelPermissionService } from '../../model-routing/services/model-permission.service';
import { ModelRoutingService } from '../../model-routing/services/model-routing.service';
import type { ModelRoute } from '../../model-routing/types/model-route.type';
import { ProviderExecutorService } from '../../providers/application/provider-executor.service';
import type { NormalizedChatRequest } from '../../providers/domain/normalized-chat-request.type';
import type { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import type { OpenAiChatCompletionResult } from '../types/openai-chat.types';
import { assertValidChatCompletionRequest } from '../validators/chat-completion.validator';
import { OpenAiResponseMapperService } from './openai-response-mapper.service';
import { SseResponseService } from './sse-response.service';

@Injectable()
export class ChatCompletionsService {
  constructor(
    private readonly modelRouting: ModelRoutingService,
    private readonly modelPermission: ModelPermissionService,
    private readonly providerExecutor: ProviderExecutorService,
    private readonly responseMapper: OpenAiResponseMapperService,
    private readonly sseResponse: SseResponseService,
  ) {}

  async createCompletion(
    request: ChatCompletionRequestDto,
    apiKey: AuthenticatedApiKey,
  ): Promise<OpenAiChatCompletionResult> {
    const { route, normalizedRequest } = await this.prepareRequest(request, apiKey, false);

    const providerResponse = await this.providerExecutor.execute(route.providerName, normalizedRequest, {
      timeoutMs: route.timeoutMs,
      maxRetries: route.maxRetries,
    });

    return {
      requestId: normalizedRequest.requestId,
      body: this.responseMapper.mapChatCompletion(providerResponse, normalizedRequest.requestId),
    };
  }

  async streamCompletion(
    request: ChatCompletionRequestDto,
    apiKey: AuthenticatedApiKey,
    response: Response,
  ): Promise<void> {
    const { route, normalizedRequest } = await this.prepareRequest(request, apiKey, true);
    const chunks = this.providerExecutor.stream(route.providerName, normalizedRequest);
    await this.sseResponse.writeOpenAiStream(response, normalizedRequest.model, chunks, {
      requestId: normalizedRequest.requestId,
    });
  }

  private async prepareRequest(
    request: ChatCompletionRequestDto,
    apiKey: AuthenticatedApiKey,
    stream: boolean,
  ): Promise<{ route: ModelRoute; normalizedRequest: NormalizedChatRequest }> {
    assertValidChatCompletionRequest(request);
    this.assertScope(apiKey, API_KEY_SCOPES.CHAT_COMPLETIONS_CREATE);
    this.modelPermission.assertAllowed(request.model, apiKey.allowedModels);

    const routes = await this.modelRouting.resolve(request.model);
    const route = routes[0];
    if (!route) {
      throw new NotFoundException(`No active provider mapping for model ${request.model}.`);
    }

    return {
      route,
      normalizedRequest: this.toNormalizedRequest(request, route, stream),
    };
  }

  private toNormalizedRequest(
    request: ChatCompletionRequestDto,
    route: ModelRoute,
    stream: boolean,
  ): NormalizedChatRequest {
    return {
      requestId: createRequestId(),
      model: request.model,
      providerModel: route.providerModel,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
        name: message.name,
        toolCallId: message.tool_call_id,
      })),
      stream,
      temperature: request.temperature,
      maxTokens: request.max_tokens ?? request.max_completion_tokens,
      stop: request.stop,
      presencePenalty: request.presence_penalty,
      frequencyPenalty: request.frequency_penalty,
      responseFormat: request.response_format,
      tools: request.tools,
      toolChoice: request.tool_choice,
      user: request.user,
    };
  }

  private assertScope(apiKey: AuthenticatedApiKey, requiredScope: string): void {
    if (!apiKey.scopes.includes(requiredScope)) {
      throw new ForbiddenException(`API key is missing required scope: ${requiredScope}.`);
    }
  }
}
