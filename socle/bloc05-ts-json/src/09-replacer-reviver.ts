/* Quest 9 · The second argument */
import type { ImportedCatalogue, Profile, Title } from "./types.ts";

export function exportFields(titles: Title[], fields: (keyof Title)[]): string {
  return JSON.stringify(titles, fields, 2);
}

export function importCatalogue(text: string): ImportedCatalogue {
  return JSON.parse(text, (key, value) =>
    key === "addedOn" || key === "generatedAt" ? new Date(value) : value,
  ) as ImportedCatalogue;
}

export function anonymize(profile: Profile): string {
  return JSON.stringify(
    profile,
    (key, value) => {
      if (key === "age") return undefined;
      if (key === "email") return "***";
      return value;
    },
    2,
  );
}

// Challenge ⭐: toNdjson(items: unknown[]): string and fromNdjson(text: string): unknown[]
export function toNdjson(items: unknown[]): string {
  return items.map((item) => JSON.stringify(item)).join("\n");
}

export function fromNdjson(text: string): unknown[] {
  return text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}
