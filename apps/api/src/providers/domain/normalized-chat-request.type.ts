export interface NormalizedChatRequest {
  requestId: string;
  model: string;
  providerModel: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
}
