# Provider Adapters

Provider adapters implement the internal `ModelProvider` interface.

Each provider owns request mapping, response mapping, stream mapping, and provider-specific error mapping. This keeps OpenAI-compatible protocol logic independent from upstream provider differences.

## Implemented adapter responsibilities

- `OpenAiProvider`, `DeepSeekProvider`, and `OpenRouterProvider` use OpenAI-compatible chat completion request/response shapes.
- `AnthropicProvider` converts OpenAI-style messages into Anthropic Messages API requests, including system prompt extraction and `stop_sequences` mapping.
- `GeminiProvider` converts OpenAI-style messages into Google Generative Language `generateContent` requests, including `systemInstruction`, `contents`, and `generationConfig`.
- `ProviderHttpClientService` centralizes JSON calls, SSE parsing, timeout aborts, and provider HTTP error classification.
- `ProviderRetryService` retries only errors marked retryable by provider error classification.
- `DeepSeekProvider` is intended as the default low-cost local debugging provider and reads `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` from `.env`.

## Streaming

Adapters return normalized stream chunks. The OpenAI-compatible protocol layer is the only layer that formats chunks as OpenAI SSE events.

## Error handling

Provider errors are normalized into `ProviderError` with:

- `type`
- `code`
- `statusCode`
- `retryable`
- `provider`

Only retryable infrastructure-style failures should trigger retry/fallback, for example 429, 5xx, provider overload, network errors, and timeouts.
