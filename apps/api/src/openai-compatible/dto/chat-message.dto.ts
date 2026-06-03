import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsIn(['system', 'user', 'assistant', 'tool'])
  role!: 'system' | 'user' | 'assistant' | 'tool';

  @IsString()
  @MaxLength(1_000_000)
  content!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tool_call_id?: string;
}
