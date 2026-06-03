import type { NormalizedChatRequest } from './normalized-chat-request.type';
import type { NormalizedChatResponse } from './normalized-chat-response.type';
import type { NormalizedStreamChunk } from './normalized-stream-chunk.type';

export interface ModelProvider {
  readonly name: string;
  chatCompletion(request: NormalizedChatRequest): Promise<NormalizedChatResponse>;
  streamChatCompletion(request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk>;
}
