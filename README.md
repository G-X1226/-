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


## Admin Dashboard GUI

这个项目现在包含一个 Next.js 管理后台，路径是 `apps/admin-web`。如果你是新手，按下面顺序操作即可：

1. 安装基础软件：
   - Node.js 24 或更新版本。
   - pnpm：安装 Node.js 后执行 `corepack enable`。
   - Docker Desktop（Windows/macOS）或 Docker Engine（Linux），用于启动 PostgreSQL 和 Redis。
2. 准备配置文件：
   ```bash
   cp .env.example .env
   ```
3. 编辑 `.env`：至少填写 `OPENAI_API_KEY`，`OPENAI_BASE_URL` 默认可保持 `https://api.openai.com/v1`。
4. 启动数据库和缓存：
   ```bash
   docker compose up -d postgres redis
   ```
5. 安装依赖并生成 Prisma Client：
   ```bash
   pnpm install
   pnpm prisma:generate
   ```
6. 启动后端 API：
   ```bash
   pnpm dev
   ```
7. 再打开一个终端，启动 GUI：
   ```bash
   pnpm dev:admin
   ```
8. 打开浏览器访问 `http://localhost:3001`。在页面里按 1 到 6 的顺序：确认后端地址、注册/登录、创建 API Key、加载模型、测试普通和流式 Chat Completions。

GUI 默认调用 `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`。如果你通过 Nginx 测试 Docker 网关，可以把页面里的 API Base URL 改成 `http://localhost:8080`。

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
