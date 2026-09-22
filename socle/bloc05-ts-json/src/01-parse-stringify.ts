/* Quest 1 · The exchange format
   Run `npm run play`: the lesson and the tests show up in the terminal. */

export function parse(text: string): unknown {
  return JSON.parse(text);
}

export function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// Challenge ⭐: stringifyCompact(value: unknown): string
export function stringifyCompact(value: unknown): string {
  return JSON.stringify(value);
}
