# Architecture

This platform is an OpenAI-compatible AI API Gateway designed for SaaS commercialization.

Core request path:

1. Client calls `/v1/chat/completions` with an OpenAI SDK-compatible request.
2. API key authentication validates a hashed key.
3. Redis-backed rate limiting protects IPs, users, and API keys.
4. Model routing resolves the public model name to provider mappings.
5. Provider adapters normalize upstream requests and responses.
6. Usage, billing, and request logs are recorded with a shared request id.

The project intentionally separates protocol compatibility, provider adapters, model routing, billing, usage, and logs.
