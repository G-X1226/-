import type { TokenUsage } from './provider.types';

export interface NormalizedChatResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  finishReason: string | null;
  usage: TokenUsage;
  rawResponse?: unknown;
}
