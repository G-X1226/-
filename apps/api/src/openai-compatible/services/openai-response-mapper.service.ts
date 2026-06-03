import { Injectable } from '@nestjs/common';
import type { NormalizedChatResponse } from '../../providers/domain/normalized-chat-response.type';

@Injectable()
export class OpenAiResponseMapperService {
  mapChatCompletion(response: NormalizedChatResponse): Record<string, unknown> {
    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: response.content },
          finish_reason: response.finishReason,
        },
      ],
      usage: {
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
      },
    };
  }
}
