import type { TokenUsage } from './provider.types';

export interface NormalizedStreamChunk {
  id: string;
  delta: string;
  finishReason?: string | null;
  usage?: TokenUsage;
  rawChunk?: unknown;
}
