# Provider Adapters

Provider adapters implement the internal `ModelProvider` interface.

Each provider should own request mapping, response mapping, stream mapping, and provider-specific error mapping.

This keeps OpenAI-compatible protocol logic independent from upstream provider differences.
