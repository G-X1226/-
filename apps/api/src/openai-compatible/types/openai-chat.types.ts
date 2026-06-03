export interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface OpenAiChatCompletionRequest {
  model: string;
  messages: OpenAiChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}
