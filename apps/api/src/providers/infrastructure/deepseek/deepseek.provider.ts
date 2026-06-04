import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from '../../application/provider-registry.service';
import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';
import { ProviderError } from '../../domain/provider-error.type';
import type { ModelProvider } from '../../domain/provider.interface';
import { ProviderHttpClientService } from '../http/provider-http-client.service';
import { mapOpenaiRequest } from '../openai/openai-request.mapper';
import { mapOpenaiResponse } from '../openai/openai-response.mapper';
import { mapOpenaiStreamChunk } from '../openai/openai-stream.mapper';

// DeepSeek 官方 OpenAI-compatible base_url；代码会在后面自动拼上 /chat/completions。
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

// 这个类就像“DeepSeek 专用前台”：网关把统一格式请求交给它，它负责转发给 DeepSeek。
@Injectable()
export class DeepSeekProvider implements ModelProvider, OnModuleInit {
  // Provider 名字必须和数据库 provider.name 保持一致，否则模型路由找不到它。
  readonly name = 'deepseek';

  constructor(
    // ConfigService 像“配置抽屉”，专门读取 .env 里的 DEEPSEEK_API_KEY。
    private readonly config: ConfigService,
    // HTTP client 像“快递员”，专门把请求送到 DeepSeek 服务器。
    private readonly http: ProviderHttpClientService,
    // registry 像“通讯录”，启动时把 deepseek 这个 provider 登记进去。
    private readonly registry: ProviderRegistryService,
  ) {}

  // NestJS 启动模块时会自动执行这里，把 DeepSeekProvider 注册到 provider 通讯录。
  onModuleInit(): void {
    console.log('[系统提示] DeepSeek Provider 正在注册到模型网关...');
    this.registry.register(this);
    console.log('[系统提示] DeepSeek Provider 注册完成，后续可通过模型路由调用。');
  }

  // 普通非流式请求：用户等一次完整答案返回。
  async chatCompletion(request: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    console.log(`[系统提示] 准备向 DeepSeek 发起普通请求，模型：${request.providerModel}`);

    // DeepSeek 兼容 OpenAI Chat Completions，所以这里复用 OpenAI 请求映射器。
    const raw = await this.http.requestJson<Record<string, unknown>>({
      provider: this.name,
      url: `${this.baseUrl()}/chat/completions`,
      method: 'POST',
      headers: this.authHeaders(),
      body: mapOpenaiRequest({ ...request, stream: false }),
      timeoutMs: 60_000,
    });

    console.log('[系统提示] DeepSeek 普通请求已返回，正在转换成网关统一响应格式。');
    return mapOpenaiResponse(raw, this.name);
  }

  // 流式请求：DeepSeek 一边生成，网关一边把内容吐给前端。
  async *streamChatCompletion(request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk> {
    console.log(`[系统提示] 准备向 DeepSeek 发起流式请求，模型：${request.providerModel}`);

    // requestSse 会逐条读取 DeepSeek 返回的 SSE 数据块。
    for await (const event of this.http.requestSse({
      provider: this.name,
      url: `${this.baseUrl()}/chat/completions`,
      method: 'POST',
      headers: this.authHeaders(),
      body: mapOpenaiRequest({ ...request, stream: true }),
      timeoutMs: 60_000,
    })) {
      // [DONE] 表示 DeepSeek 告诉我们：“这次流式输出结束了”。
      if (event.data === '[DONE]') {
        console.log('[系统提示] DeepSeek 流式请求结束。');
        break;
      }

      // 把 DeepSeek 的 OpenAI-compatible chunk 转成网关内部统一 chunk。
      yield mapOpenaiStreamChunk(JSON.parse(event.data) as Record<string, unknown>);
    }
  }

  // 读取 DeepSeek base URL；如果 .env 没填，就使用官方默认地址。
  private baseUrl(): string {
    return (this.config.get<string>('DEEPSEEK_BASE_URL') ?? DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, '');
  }

  // 组装 Authorization 请求头；没有 API Key 时给出小白能看懂的错误。
  private authHeaders(): Record<string, string> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');

    if (!apiKey) {
      console.log('[系统提示] 没有找到 DEEPSEEK_API_KEY，请先在 .env 文件里填写 DeepSeek API Key。');
      throw new ProviderError('DEEPSEEK_API_KEY is not configured.', {
        provider: this.name,
        type: 'PROVIDER_AUTH_ERROR',
        code: 'provider_missing_api_key',
        retryable: false,
      });
    }

    return { authorization: `Bearer ${apiKey}` };
  }
}
