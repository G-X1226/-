export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
