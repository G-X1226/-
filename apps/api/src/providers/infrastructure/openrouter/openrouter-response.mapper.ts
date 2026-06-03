import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';

export function mapOpenrouterResponse(raw: Record<string, unknown>, provider: string): NormalizedChatResponse {
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  const firstChoice = choices[0] as { message?: { content?: string }; finish_reason?: string } | undefined;
  const usage = raw.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

  return {
    id: String(raw.id ?? 'chatcmpl_unknown'),
    model: String(raw.model ?? 'unknown'),
    provider,
    content: firstChoice?.message?.content ?? '',
    finishReason: firstChoice?.finish_reason ?? null,
    usage: {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
    },
    rawResponse: raw,
  };
}
