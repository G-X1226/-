import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';

export function mapOpenaiRequest(request: NormalizedChatRequest): Record<string, unknown> {
  return {
    model: request.providerModel,
    messages: request.messages,
    stream: request.stream,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    stop: request.stop,
    presence_penalty: request.presencePenalty,
    frequency_penalty: request.frequencyPenalty,
    response_format: request.responseFormat,
    tools: request.tools,
    tool_choice: request.toolChoice,
    user: request.user,
  };
}
