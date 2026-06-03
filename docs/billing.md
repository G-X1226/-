# Billing

Billing uses integer micro credits to avoid floating-point precision errors.

Rules:

- Token usage is recorded separately from balance transactions.
- Balance changes must have ledger entries.
- Provider cost and user-facing cost are tracked separately.
- Critical billing writes should run inside database transactions.
