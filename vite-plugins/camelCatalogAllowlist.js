import { existsSync, readFileSync } from 'fs';

// Loads a Camel-component scheme allowlist from a JSON file with the shape
// `{ components: ["scheme1", "scheme2", ...] }` and returns a `Set<string>`.
//
// Returns `null` when the file is absent, unreadable, malformed, or missing a
// `components` array — `null` is the sentinel for "no filter; pass everything",
// preserving backward compatibility with caller code that pre-dates the allowlist.
export function loadComponentAllowlist(filePath) {
  if (typeof filePath !== 'string' || !existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.components)) return null;
    return new Set(parsed.components.filter(name => typeof name === 'string' && name.length > 0));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[serve-camel-catalog] failed to parse component allowlist:', e.message);
    return null;
  }
}
