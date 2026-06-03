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


## OpenAI-Compatible API MVP

Machine clients authenticate with API keys and can call:

- `POST /v1/chat/completions`
- `GET /v1/models`

`POST /v1/chat/completions` supports non-streaming JSON responses and `stream=true` OpenAI-style SSE responses ending with `data: [DONE]`.


## Docker Compose deployment

```bash
cp .env.example .env
docker compose up --build
```

Services:

- API: `http://localhost:3000`
- Nginx gateway: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Health checks are available at `/health/live` and `/health/ready`.
