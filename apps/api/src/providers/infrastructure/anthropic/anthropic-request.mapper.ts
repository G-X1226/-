import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';

export function mapAnthropicRequest(request: NormalizedChatRequest): Record<string, unknown> {
  const systemMessages = request.messages.filter((message) => message.role === 'system');
  const nonSystemMessages = request.messages.filter((message) => message.role !== 'system');

  return stripUndefined({
    model: request.providerModel,
    system: systemMessages.length ? systemMessages.map((message) => message.content).join('\n\n') : undefined,
    messages: nonSystemMessages.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    })),
    stream: request.stream,
    temperature: request.temperature,
    max_tokens: request.maxTokens ?? 1024,
    stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
    metadata: request.user ? { user_id: request.user } : undefined,
  });
}

function stripUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
