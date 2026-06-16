import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';

export function mapGeminiRequest(request: NormalizedChatRequest): Record<string, unknown> {
  const systemMessages = request.messages.filter((message) => message.role === 'system');
  const conversationalMessages = request.messages.filter((message) => message.role !== 'system');

  return stripUndefined({
    systemInstruction: systemMessages.length
      ? { parts: systemMessages.map((message) => ({ text: message.content })) }
      : undefined,
    contents: conversationalMessages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    generationConfig: stripUndefined({
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
      stopSequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
      presencePenalty: request.presencePenalty,
      frequencyPenalty: request.frequencyPenalty,
    }),
  });
}

export function buildGeminiUrl(baseUrl: string, providerModel: string, apiKey: string, stream: boolean): string {
  const action = stream ? 'streamGenerateContent' : 'generateContent';
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/models/${providerModel}:${action}`);
  url.searchParams.set('key', apiKey);
  if (stream) url.searchParams.set('alt', 'sse');
  return url.toString();
}

function stripUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
