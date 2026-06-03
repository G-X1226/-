import { BadRequestException } from '@nestjs/common';
import type { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';

export function assertValidChatCompletionRequest(request: ChatCompletionRequestDto): void {
  if (!request.model) {
    throw new BadRequestException('model is required.');
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new BadRequestException('messages must be a non-empty array.');
  }

  if (request.n && request.n > 1) {
    throw new BadRequestException('n > 1 is not supported by this gateway yet.');
  }

  if (request.max_tokens && request.max_completion_tokens) {
    throw new BadRequestException('Use either max_tokens or max_completion_tokens, not both.');
  }
}
