import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { REQUEST_ID_HEADER } from '../../common/constants/headers.constants';
import { safeJsonStringify } from '../../common/utils/safe-json.util';
import type { NormalizedStreamChunk } from '../../providers/domain/normalized-stream-chunk.type';

@Injectable()
export class SseResponseService {
  async writeOpenAiStream(
    response: Response,
    model: string,
    chunks: AsyncIterable<NormalizedStreamChunk>,
    options: { requestId: string },
  ): Promise<void> {
    response.setHeader(REQUEST_ID_HEADER, options.requestId);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    for await (const chunk of chunks) {
      response.write(
        `data: ${safeJsonStringify({
          id: chunk.id || options.requestId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [
            {
              index: 0,
              delta: chunk.delta ? { content: chunk.delta } : {},
              finish_reason: chunk.finishReason ?? null,
            },
          ],
          usage: chunk.usage
            ? {
                prompt_tokens: chunk.usage.promptTokens,
                completion_tokens: chunk.usage.completionTokens,
                total_tokens: chunk.usage.totalTokens,
              }
            : undefined,
        })}\n\n`,
      );
    }

    response.write('data: [DONE]\n\n');
    response.end();
  }
}
