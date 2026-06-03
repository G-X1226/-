# Authentication and API Keys

Dashboard/API management authentication uses short-lived JWT access tokens.

Machine access to OpenAI-compatible `/v1/*` endpoints uses API keys. API keys are generated once, returned once, and then stored only as an HMAC-SHA256 hash with a server-side secret.

## Dashboard endpoints

```http
POST /auth/register
POST /auth/login
GET /auth/me
GET /users/me
```

## API key endpoints

All API key management endpoints require a dashboard JWT:

```http
POST /api-keys
GET /api-keys
DELETE /api-keys/:id
```

API keys support:

- `scopes`, for example `chat.completions:create`
- `allowedModels`
- `allowedIps`
- environment separation with `TEST` and `LIVE`
- revocation without deleting historical usage records
