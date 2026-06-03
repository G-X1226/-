# OpenAI-Compatible API

MVP endpoint:

```http
POST /v1/chat/completions
```

The goal is for clients to keep using the OpenAI SDK and only change `base_url`.

Streaming responses must use OpenAI-compatible SSE events and finish with `data: [DONE]`.
