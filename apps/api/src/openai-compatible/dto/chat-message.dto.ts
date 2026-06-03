export class ChatMessageDto {
  role!: 'system' | 'user' | 'assistant' | 'tool';
  content!: string;
}
