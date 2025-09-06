export function asEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | null {
  if (value == null) return null;
  const v = value.toLowerCase() as T;
  return allowed.includes(v) ? v : null;
}
