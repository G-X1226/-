# AI API Gateway Platform

An OpenAI-compatible AI model API gateway designed for commercial SaaS use.

## Stack

- Node.js + TypeScript
- NestJS
- PostgreSQL
- Redis
- Prisma
- Docker Compose

## Development

```bash
cp .env.example .env
docker compose up -d postgres redis
pnpm install
pnpm prisma:generate
pnpm dev
```

## MVP Scope

- User/auth module skeleton
- API key hashing/auth module skeleton
- Prisma schema for users, keys, providers, models, usage, billing, and logs
- Provider adapter interfaces and initial provider registry
- OpenAI-compatible `/v1/chat/completions` protocol skeleton
- Redis, PostgreSQL, health checks, and Docker Compose


## Authentication MVP

Dashboard users can register and log in with JWT-backed endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Authenticated users can manage machine credentials through:

- `POST /api-keys`
- `GET /api-keys`
- `DELETE /api-keys/:id`

Full API keys are only returned once at creation time. Stored keys are HMAC-SHA256 hashed using `API_KEY_HASH_SECRET`.
