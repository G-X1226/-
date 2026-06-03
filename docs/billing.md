# Billing

Billing uses integer micro credits to avoid floating-point precision errors.

Rules:

- Token usage is recorded separately from request logs.
- Balance changes must have ledger entries.
- Provider cost and user-facing cost are tracked separately.
- Critical billing writes run inside database transactions.
- Request logs are created before usage records so usage can safely reference `request_id`.

## MVP charging flow

1. Validate API key and model permissions.
2. Apply Redis request-per-minute limits.
3. Estimate requested tokens and apply token-per-minute limits.
4. Check that the user has positive free or paid balance before calling an upstream provider.
5. After the provider returns usage, calculate cost from model pricing.
6. In one PostgreSQL transaction:
   - deduct free credits first;
   - deduct paid balance for the remainder;
   - create `usage_records`;
   - create `balance_transactions`.

For streams, provider-reported usage is preferred. If the stream does not provide usage, the gateway records an estimated usage entry.
