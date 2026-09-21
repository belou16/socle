/* Quest 5 · My list
   `<T>` is a generic: the function works for an array of anything. */

export function first<T>(list: T[]): T | undefined {
  return list[0];
}

export function last<T>(list: T[]): T | undefined {
  return list.at(-1);
}

export function add(list: string[], title: string): string[] {
  return [...list, title];
}

export function contains(list: string[], title: string): boolean {
  return list.includes(title);
}

export function positionOf(list: string[], title: string): number {
  return list.indexOf(title);
}

export function reversed<T>(list: T[]): T[] {
  return [...list].reverse();
}
