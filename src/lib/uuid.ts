/**
 * Generates a UUID v4 string with broad browser compatibility.
 *
 * Attempts to use the native `crypto.randomUUID()` if available,
 * falling back to `crypto.getRandomValues()` for older browsers
 * (particularly older iOS Safari versions).
 *
 * @returns A UUID v4 string in the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @example
 * ```ts
 * const id = generateUUID();
 * // => "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateUUID(): string {
  // Use native implementation if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback using crypto.getRandomValues for broader compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
