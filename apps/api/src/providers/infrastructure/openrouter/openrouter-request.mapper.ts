import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';

export function mapOpenrouterRequest(request: NormalizedChatRequest): Record<string, unknown> {
  return {
    model: request.providerModel,
    messages: request.messages,
    stream: request.stream,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
  };
}
