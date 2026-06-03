import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';

export function mapOpenaiRequest(request: NormalizedChatRequest): Record<string, unknown> {
  return stripUndefined({
    model: request.providerModel,
    messages: request.messages.map((message) =>
      stripUndefined({
        role: message.role,
        content: message.content,
        name: message.name,
        tool_call_id: message.toolCallId,
      }),
    ),
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
  });
}

function stripUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
