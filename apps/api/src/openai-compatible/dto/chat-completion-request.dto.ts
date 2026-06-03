import { ChatMessageDto } from './chat-message.dto';

export class ChatCompletionRequestDto {
  model!: string;
  messages!: ChatMessageDto[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}
