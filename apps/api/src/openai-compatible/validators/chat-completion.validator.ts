import { BadRequestException } from '@nestjs/common';
import type { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';

export function assertValidChatCompletionRequest(request: ChatCompletionRequestDto): void {
  if (!request.model) {
    throw new BadRequestException('model is required.');
  }
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new BadRequestException('messages must be a non-empty array.');
  }
}
