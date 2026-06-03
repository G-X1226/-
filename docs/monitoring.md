# Logs and Monitoring

Every model request should be traceable by `request_id`.

## Request logs

The gateway records request logs with:

- request id
- user id
- API key id
- model id
- provider id
- endpoint and method
- stream flag
- latency
- status
- client IP
- user agent
- error code when applicable

## Error logs

Provider and gateway failures are written to `error_logs` with provider name, error type, error code, status code, and sanitized message.

## Health checks

- `GET /health/live` checks process liveness.
- `GET /health/ready` checks PostgreSQL and Redis readiness.

Docker Compose exposes the API on `3000` and Nginx on `8080`. Nginx disables proxy buffering for SSE compatibility.
