import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';

interface OpenAiStreamChoice {
  delta?: { content?: string | null };
  finish_reason?: string | null;
}

interface OpenAiStreamUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export function mapOpenaiStreamChunk(raw: Record<string, unknown>): NormalizedStreamChunk {
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  const firstChoice = choices[0] as OpenAiStreamChoice | undefined;
  const usage = raw.usage as OpenAiStreamUsage | undefined;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;

  return {
    id: String(raw.id ?? 'chunk_pending'),
    delta: firstChoice?.delta?.content ?? '',
    finishReason: firstChoice?.finish_reason ?? null,
    usage: usage
      ? {
          promptTokens,
          completionTokens,
          totalTokens: usage.total_tokens ?? promptTokens + completionTokens,
        }
      : undefined,
    rawChunk: raw,
  };
}
