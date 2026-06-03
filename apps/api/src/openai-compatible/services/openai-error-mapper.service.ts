import { Injectable } from '@nestjs/common';
import type { OpenAiErrorBody } from '../types/openai-error.types';

@Injectable()
export class OpenAiErrorMapperService {
  map(message: string, code = 'server_error'): OpenAiErrorBody {
    return {
      error: {
        message,
        type: code === 'server_error' ? 'server_error' : 'invalid_request_error',
        param: null,
        code,
      },
    };
  }
}
