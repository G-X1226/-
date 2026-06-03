import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';

export function mapAnthropicRequest(request: NormalizedChatRequest): Record<string, unknown> {
  return {
    model: request.providerModel,
    messages: request.messages,
    stream: request.stream,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
  };
}
