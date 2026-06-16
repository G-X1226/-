export interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface OpenAiChatCompletionRequest {
  model: string;
  messages: OpenAiChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string | string[];
  n?: number;
  response_format?: Record<string, unknown>;
  tools?: unknown[];
  tool_choice?: unknown;
  user?: string;
}

export interface OpenAiChatCompletionResult {
  requestId: string;
  body: Record<string, unknown>;
}
