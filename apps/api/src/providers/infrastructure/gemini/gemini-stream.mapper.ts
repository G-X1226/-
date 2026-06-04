import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';

interface GeminiStreamCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export function mapGeminiStreamChunk(raw: Record<string, unknown>, model: string): NormalizedStreamChunk {
  const candidates = Array.isArray(raw.candidates) ? raw.candidates : [];
  const firstCandidate = candidates[0] as GeminiStreamCandidate | undefined;
  const usage = raw.usageMetadata as GeminiUsage | undefined;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;

  return {
    id: String(raw.responseId ?? `${model}_chunk`),
    delta: firstCandidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '',
    finishReason: firstCandidate?.finishReason ?? null,
    usage: usage
      ? {
          promptTokens,
          completionTokens,
          totalTokens: usage.totalTokenCount ?? promptTokens + completionTokens,
        }
      : undefined,
    rawChunk: raw,
  };
}
