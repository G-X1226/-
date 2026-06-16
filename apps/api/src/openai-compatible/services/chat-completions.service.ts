import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { BillingService } from '../../billing/services/billing.service';
import { CostCalculatorService } from '../../billing/services/cost-calculator.service';
import { PricingService } from '../../billing/services/pricing.service';
import { API_KEY_SCOPES } from '../../common/constants/scopes.constants';
import { createRequestId } from '../../common/utils/ids.util';
import { ErrorLogService } from '../../logs/services/error-log.service';
import { RequestLogService } from '../../logs/services/request-log.service';
import { ModelPermissionService } from '../../model-routing/services/model-permission.service';
import { ModelRoutingService } from '../../model-routing/services/model-routing.service';
import type { ModelRoute } from '../../model-routing/types/model-route.type';
import { ProviderExecutorService } from '../../providers/application/provider-executor.service';
import { isProviderError } from '../../providers/domain/provider-error.type';
import type { NormalizedChatRequest } from '../../providers/domain/normalized-chat-request.type';
import type { NormalizedStreamChunk } from '../../providers/domain/normalized-stream-chunk.type';
import { RateLimitService } from '../../rate-limit/services/rate-limit.service';
import { TokenEstimatorService } from '../../usage/services/token-estimator.service';
import type { TokenUsageRecord } from '../../usage/types/token-usage.type';
import type { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import type { OpenAiChatCompletionResult } from '../types/openai-chat.types';
import { assertValidChatCompletionRequest } from '../validators/chat-completion.validator';
import { OpenAiResponseMapperService } from './openai-response-mapper.service';
import { SseResponseService } from './sse-response.service';

interface RequestMetadata {
  clientIp?: string;
  userAgent?: string;
}

@Injectable()
export class ChatCompletionsService {
  constructor(
    private readonly modelRouting: ModelRoutingService,
    private readonly modelPermission: ModelPermissionService,
    private readonly providerExecutor: ProviderExecutorService,
    private readonly responseMapper: OpenAiResponseMapperService,
    private readonly sseResponse: SseResponseService,
    private readonly billing: BillingService,
    private readonly pricing: PricingService,
    private readonly costCalculator: CostCalculatorService,
    private readonly requestLog: RequestLogService,
    private readonly errorLog: ErrorLogService,
    private readonly rateLimit: RateLimitService,
    private readonly tokenEstimator: TokenEstimatorService,
  ) {}

  async createCompletion(
    request: ChatCompletionRequestDto,
    apiKey: AuthenticatedApiKey,
    metadata: RequestMetadata,
  ): Promise<OpenAiChatCompletionResult> {
    const startedAt = Date.now();
    console.log(`[系统提示] 收到普通 Chat 请求，用户想用模型：${request.model}`);
    const { routes, normalizedRequest } = await this.prepareRequest(request, apiKey, false);
    console.log(`[系统提示] 模型路由完成，优先上游：${routes[0]?.providerName ?? '未找到'}`);
    await this.startRequestLog(normalizedRequest, routes[0], apiKey, metadata);
    console.log('[系统提示] 请求日志已创建，开始检查余额和 token 限流。');
    await this.billing.assertCanSpend(apiKey.userId);
    await this.rateLimit.assertApiKeyTokenMinuteLimit(apiKey, this.estimateRequestedTokens(request));

    let lastError: unknown;

    for (const route of routes) {
      try {
        console.log(`[系统提示] 正在调用上游 ${route.providerName}，真实模型：${route.providerModel}`);
        const providerResponse = await this.providerExecutor.execute(
          route.providerName,
          { ...normalizedRequest, providerModel: route.providerModel },
          {
            timeoutMs: route.timeoutMs,
            maxRetries: route.maxRetries,
          },
        );
        console.log(`[系统提示] 上游 ${route.providerName} 已返回，开始计算费用和写入用量。`);
        const costCreditsMicro = await this.calculateCost(route.modelId, providerResponse.usage);
        await this.billing.chargeUsage({
          requestId: normalizedRequest.requestId,
          userId: apiKey.userId,
          apiKeyId: apiKey.id,
          modelId: route.modelId,
          providerId: route.providerId,
          providerModel: route.providerModel,
          ...providerResponse.usage,
          costCreditsMicro,
        });
        await this.requestLog.complete({
          requestId: normalizedRequest.requestId,
          modelId: route.modelId,
          providerId: route.providerId,
          latencyMs: Date.now() - startedAt,
          status: 'SUCCESS',
        });

        console.log(`[系统提示] 普通 Chat 请求完成，requestId：${normalizedRequest.requestId}`);
        return {
          requestId: normalizedRequest.requestId,
          body: this.responseMapper.mapChatCompletion(providerResponse, normalizedRequest.requestId),
        };
      } catch (error) {
        lastError = error;
        console.log(`[系统提示] 上游 ${route.providerName} 调用失败，准备判断是否可以重试或 fallback。`);
        if (!isProviderError(error) || !error.options.retryable) {
          await this.recordFailure(normalizedRequest.requestId, apiKey, error, Date.now() - startedAt);
          throw error;
        }
      }
    }

    await this.recordFailure(normalizedRequest.requestId, apiKey, lastError, Date.now() - startedAt);
    throw lastError;
  }

  async streamCompletion(
    request: ChatCompletionRequestDto,
    apiKey: AuthenticatedApiKey,
    response: Response,
    metadata: RequestMetadata,
  ): Promise<void> {
    const startedAt = Date.now();
    console.log(`[系统提示] 收到流式 Chat 请求，用户想用模型：${request.model}`);
    const { routes, normalizedRequest } = await this.prepareRequest(request, apiKey, true);
    const route = routes[0];
    if (!route) {
      throw new NotFoundException(`No active provider mapping for model ${request.model}.`);
    }

    await this.startRequestLog(normalizedRequest, route, apiKey, metadata);
    console.log(`[系统提示] 流式请求日志已创建，准备调用上游 ${route.providerName}。`);
    await this.billing.assertCanSpend(apiKey.userId);
    await this.rateLimit.assertApiKeyTokenMinuteLimit(apiKey, this.estimateRequestedTokens(request));

    const usageRef: { usage?: TokenUsageRecord } = {};

    try {
      console.log(`[系统提示] 正在调用上游 ${route.providerName} 的流式接口，真实模型：${route.providerModel}`);
      const chunks = this.captureStreamUsage(
        this.providerExecutor.stream(route.providerName, {
          ...normalizedRequest,
          providerModel: route.providerModel,
        }),
        usageRef,
      );
      await this.sseResponse.writeOpenAiStream(response, normalizedRequest.model, chunks, {
        requestId: normalizedRequest.requestId,
      });

      console.log('[系统提示] 流式输出已结束，开始统计用量和扣费。');
      const usage = usageRef.usage ?? this.estimateUsage(request, 'ESTIMATED');
      const costCreditsMicro = await this.calculateCost(route.modelId, usage);
      await this.billing.chargeUsage({
        requestId: normalizedRequest.requestId,
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        modelId: route.modelId,
        providerId: route.providerId,
        providerModel: route.providerModel,
        ...usage,
        costCreditsMicro,
        status: usageRef.usage ? 'COMPLETED' : 'ESTIMATED',
      });
      await this.requestLog.complete({
        requestId: normalizedRequest.requestId,
        modelId: route.modelId,
        providerId: route.providerId,
        latencyMs: Date.now() - startedAt,
        status: 'SUCCESS',
      });
      console.log(`[系统提示] 流式 Chat 请求完成，requestId：${normalizedRequest.requestId}`);
    } catch (error) {
      await this.recordFailure(normalizedRequest.requestId, apiKey, error, Date.now() - startedAt);
      throw error;
    }
  }

  private async prepareRequest(
    request: ChatCompletionRequestDto,
    apiKey: AuthenticatedApiKey,
    stream: boolean,
  ): Promise<{ routes: ModelRoute[]; normalizedRequest: NormalizedChatRequest }> {
    console.log('[系统提示] 正在校验请求格式，就像门卫先检查表格有没有填完整。');
    assertValidChatCompletionRequest(request);
    console.log('[系统提示] 正在校验 API Key 权限，就像门卫检查通行证权限。');
    this.assertScope(apiKey, API_KEY_SCOPES.CHAT_COMPLETIONS_CREATE);
    this.modelPermission.assertAllowed(request.model, apiKey.allowedModels);

    console.log(`[系统提示] 正在查找模型 ${request.model} 应该走哪个上游 provider。`);
    const routes = await this.modelRouting.resolve(request.model);
    const route = routes[0];
    if (!route) {
      throw new NotFoundException(`No active provider mapping for model ${request.model}.`);
    }

    return {
      routes,
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

  private async calculateCost(modelId: string | undefined, usage: TokenUsageRecord): Promise<bigint> {
    return this.costCalculator.calculate(
      usage.promptTokens,
      usage.completionTokens,
      await this.pricing.getModelPricing(modelId),
    );
  }

  private estimateRequestedTokens(request: ChatCompletionRequestDto): number {
    return this.estimateUsage(request, 'ESTIMATED').totalTokens;
  }

  private estimateUsage(request: ChatCompletionRequestDto, _status: 'ESTIMATED'): TokenUsageRecord {
    const promptTokens = request.messages.reduce(
      (sum, message) => sum + this.tokenEstimator.estimateFromText(message.content),
      0,
    );
    const completionTokens = request.max_tokens ?? request.max_completion_tokens ?? 1024;
    return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
  }

  private async *captureStreamUsage(
    chunks: AsyncIterable<NormalizedStreamChunk>,
    usageRef: { usage?: TokenUsageRecord },
  ): AsyncIterable<NormalizedStreamChunk> {
    for await (const chunk of chunks) {
      if (chunk.usage) usageRef.usage = chunk.usage;
      yield chunk;
    }
  }

  private startRequestLog(
    request: NormalizedChatRequest,
    route: ModelRoute,
    apiKey: AuthenticatedApiKey,
    metadata: RequestMetadata,
  ) {
    return this.requestLog.start({
      requestId: request.requestId,
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      modelId: route.modelId,
      providerId: route.providerId,
      endpoint: '/v1/chat/completions',
      method: 'POST',
      stream: request.stream,
      clientIp: metadata.clientIp,
      userAgent: metadata.userAgent,
    });
  }

  private async recordFailure(
    requestId: string,
    apiKey: AuthenticatedApiKey,
    error: unknown,
    latencyMs: number,
  ): Promise<void> {
    console.log(`[系统提示] 请求失败，正在写入错误日志，requestId：${requestId}`);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const providerError = isProviderError(error) ? error : null;
    await this.requestLog.complete({
      requestId,
      latencyMs,
      status: 'FAILED',
      errorCode: providerError?.options.code ?? 'gateway_error',
      upstreamStatusCode: providerError?.options.statusCode,
    });
    await this.errorLog.create({
      requestId,
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      errorType: providerError?.options.type ?? 'GATEWAY_ERROR',
      errorCode: providerError?.options.code ?? 'gateway_error',
      message,
      providerName: providerError?.options.provider,
      upstreamStatusCode: providerError?.options.statusCode,
    });
  }

  private assertScope(apiKey: AuthenticatedApiKey, requiredScope: string): void {
    if (!apiKey.scopes.includes(requiredScope)) {
      throw new ForbiddenException(`API key is missing required scope: ${requiredScope}.`);
    }
  }
}
