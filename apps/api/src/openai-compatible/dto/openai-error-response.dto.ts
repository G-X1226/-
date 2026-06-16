export class OpenAiErrorResponseDto {
  error!: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}
