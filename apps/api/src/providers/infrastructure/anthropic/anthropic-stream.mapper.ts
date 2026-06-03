import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';

interface AnthropicDeltaEvent {
  type?: string;
  message?: { id?: string; usage?: { input_tokens?: number; output_tokens?: number } };
  delta?: { text?: string; stop_reason?: string | null };
  usage?: { input_tokens?: number; output_tokens?: number };
}

export function mapAnthropicStreamChunk(raw: Record<string, unknown>): NormalizedStreamChunk | null {
  const event = raw as AnthropicDeltaEvent;

  if (event.type === 'content_block_delta') {
    return {
      id: event.message?.id ?? 'chunk_pending',
      delta: event.delta?.text ?? '',
      rawChunk: raw,
    };
  }

  if (event.type === 'message_delta') {
    const promptTokens = event.usage?.input_tokens ?? 0;
    const completionTokens = event.usage?.output_tokens ?? 0;
    return {
      id: event.message?.id ?? 'chunk_pending',
      delta: '',
      finishReason: event.delta?.stop_reason ?? null,
      usage: event.usage
        ? {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          }
        : undefined,
      rawChunk: raw,
    };
  }

  return null;
}
