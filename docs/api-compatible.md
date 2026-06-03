# OpenAI-Compatible API

MVP endpoint:

```http
POST /v1/chat/completions
GET /v1/models
```

The goal is for clients to keep using the OpenAI SDK and only change `base_url`.

## Authentication

All `/v1/*` API requests use machine API keys:

```http
Authorization: Bearer sk_live_xxx
```

Dashboard JWTs are intentionally not accepted for model calls.

## Chat completions

Supported MVP fields:

- `model`
- `messages`
- `stream`
- `temperature`
- `max_tokens`
- `max_completion_tokens`
- `stop`
- `presence_penalty`
- `frequency_penalty`
- `response_format`
- `tools`
- `tool_choice`
- `user`

`n > 1` is explicitly rejected for now because provider fan-out, billing, and usage accounting need separate production handling.

## Streaming

Streaming responses use OpenAI-compatible SSE events and finish with:

```text
data: [DONE]
```

The gateway also sets `x-request-id` on both JSON and SSE responses so logs, billing, and provider calls can be correlated.
