import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

export function mapAnthropicResponse(raw: Record<string, unknown>, provider: string): NormalizedChatResponse {
  const content = Array.isArray(raw.content) ? (raw.content as AnthropicContentBlock[]) : [];
  const usage = raw.usage as AnthropicUsage | undefined;
  const promptTokens = usage?.input_tokens ?? 0;
  const completionTokens = usage?.output_tokens ?? 0;

  return {
    id: String(raw.id ?? 'msg_unknown'),
    model: String(raw.model ?? 'unknown'),
    provider,
    content: content
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join(''),
    finishReason: typeof raw.stop_reason === 'string' ? raw.stop_reason : null,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    rawResponse: raw,
  };
}
