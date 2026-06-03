import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';

interface OpenAiChoice {
  message?: { content?: string | null };
  finish_reason?: string | null;
}

interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export function mapOpenaiResponse(raw: Record<string, unknown>, provider: string): NormalizedChatResponse {
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  const firstChoice = choices[0] as OpenAiChoice | undefined;
  const usage = raw.usage as OpenAiUsage | undefined;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;

  return {
    id: String(raw.id ?? 'chatcmpl_unknown'),
    model: String(raw.model ?? 'unknown'),
    provider,
    content: firstChoice?.message?.content ?? '',
    finishReason: firstChoice?.finish_reason ?? null,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: usage?.total_tokens ?? promptTokens + completionTokens,
    },
    rawResponse: raw,
  };
}
