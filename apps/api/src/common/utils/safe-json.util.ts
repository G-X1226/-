export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === 'bigint' ? item.toString() : item,
  );
}
