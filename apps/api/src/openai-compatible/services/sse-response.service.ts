import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { NormalizedStreamChunk } from '../../providers/domain/normalized-stream-chunk.type';
import { safeJsonStringify } from '../../common/utils/safe-json.util';

@Injectable()
export class SseResponseService {
  async writeOpenAiStream(
    response: Response,
    model: string,
    chunks: AsyncIterable<NormalizedStreamChunk>,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');

    for await (const chunk of chunks) {
      response.write(
        `data: ${safeJsonStringify({
          id: chunk.id,
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
        })}\n\n`,
      );
    }

    response.write('data: [DONE]\n\n');
    response.end();
  }
}
