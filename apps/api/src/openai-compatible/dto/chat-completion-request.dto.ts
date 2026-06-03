import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChatMessageDto } from './chat-message.dto';

export class ChatCompletionRequestDto {
  @IsString()
  @MaxLength(200)
  model!: string;

  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  presence_penalty?: number;

  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  frequency_penalty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_tokens?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_completion_tokens?: number;

  @IsOptional()
  stop?: string | string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16)
  n?: number;

  @IsOptional()
  @IsObject()
  response_format?: Record<string, unknown>;

  @IsOptional()
  tools?: unknown[];

  @IsOptional()
  tool_choice?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user?: string;
}
