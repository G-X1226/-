export function redactPrismaLog(value: string): string {
  return value.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [REDACTED]');
}
