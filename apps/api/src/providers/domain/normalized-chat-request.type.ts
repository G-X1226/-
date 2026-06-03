export interface NormalizedChatRequest {
  requestId: string;
  model: string;
  providerModel: string;
  messages: Array<{ role: string; content: string; name?: string; toolCallId?: string }>;
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
  stop?: string | string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseFormat?: Record<string, unknown>;
  tools?: unknown[];
  toolChoice?: unknown;
  user?: string;
}
