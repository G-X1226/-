import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';

export function mapAnthropicStreamChunk(raw: unknown): NormalizedStreamChunk {
  return {
    id: 'chunk_pending',
    delta: typeof raw === 'string' ? raw : '',
    rawChunk: raw,
  };
}
