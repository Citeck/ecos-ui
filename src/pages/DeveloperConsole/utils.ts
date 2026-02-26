/**
 * Safely serialize objects with circular references
 *
 * @param obj Object to serialize
 * @param space Number of spaces for formatting
 *
 * @returns Serialized string or 'undefined' if object is undefined
 */
export function safeStringify(obj: any, space?: number): string {
  if (obj === undefined) {
    return 'undefined';
  }

  if (obj === null) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    return String(obj);
  }

  const seen = new WeakSet();

  try {
    return JSON.stringify(
      obj,
      (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular Reference]';
          }

          seen.add(val);
        }

        return val;
      },
      space
    );
  } catch (error) {
    return String(obj);
  }
}
