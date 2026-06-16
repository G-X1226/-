// Refresh tokens are intentionally deferred until persistent session storage is added.
// The file is kept as an explicit extension point for the SaaS dashboard auth flow.
export const REFRESH_JWT_STRATEGY_RESERVED = 'refresh-jwt-reserved';
