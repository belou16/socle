/* Quest 8 · Quality control
   `input` is unknown: the data comes from outside, nothing is guaranteed. */
import type { ValidationReport } from "./types.ts";

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
}

export function validate(input: unknown): string[] {
  const errors: string[] = [];
  const record = asRecord(input);

  if (typeof record.id !== "string" || record.id.trim() === "") errors.push("missing id");
  if (typeof record.title !== "string" || record.title.trim() === "") errors.push("missing title");
  if (record.kind !== "movie" && record.kind !== "series") errors.push("invalid kind");

  const year = record.year;
  if (typeof year !== "number" || !Number.isInteger(year) || year < 1895 || year > 2030) {
    errors.push("invalid year");
  }

  const rating = record.rating;
  if (rating !== undefined && rating !== null) {
    if (typeof rating !== "number" || Number.isNaN(rating) || rating < 0 || rating > 5) {
      errors.push("invalid rating");
    }
  }

  const genres = record.genres;
  if (
    !Array.isArray(genres) ||
    genres.length === 0 ||
    !genres.every((g) => typeof g === "string")
  ) {
    errors.push("invalid genres");
  }

  return errors;
}

export function validateCatalogue(inputs: unknown[]): ValidationReport {
  const errors: Record<string, string[]> = {};
  const seen = new Set<string>();
  let valid = 0;

  inputs.forEach((input, index) => {
    const record = asRecord(input);
    const id = typeof record.id === "string" ? record.id : undefined;
    const isDuplicate = id !== undefined && seen.has(id);
    if (id !== undefined) seen.add(id);

    const entryErrors = isDuplicate ? [...validate(input), "duplicate id"] : validate(input);
    if (entryErrors.length === 0) {
      valid++;
      return;
    }
    errors[id ?? `#${index}`] = entryErrors;
  });

  return { valid, errors };
}
