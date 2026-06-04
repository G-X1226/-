# Security

Security principles:

- API keys are only shown once.
- API keys are stored as HMAC-SHA256 hashes with a server-side secret.
- Provider API keys should be loaded from environment variables or a secret manager.
- Logs must redact Authorization headers and provider secrets.
- Prompt and completion bodies are not stored by default.
