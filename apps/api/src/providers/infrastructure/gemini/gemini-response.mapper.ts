import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export function mapGeminiResponse(raw: Record<string, unknown>, provider: string, model: string): NormalizedChatResponse {
  const candidates = Array.isArray(raw.candidates) ? raw.candidates : [];
  const firstCandidate = candidates[0] as GeminiCandidate | undefined;
  const usage = raw.usageMetadata as GeminiUsage | undefined;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;

  return {
    id: String(raw.responseId ?? 'gemini_unknown'),
    model,
    provider,
    content: firstCandidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '',
    finishReason: firstCandidate?.finishReason ?? null,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: usage?.totalTokenCount ?? promptTokens + completionTokens,
    },
    rawResponse: raw,
  };
}
