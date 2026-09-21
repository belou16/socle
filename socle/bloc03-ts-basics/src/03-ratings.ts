/* Quest 3 · All ages? */
import type { Flags } from "./types.ts";

export function canWatch(age: number, minimumAge: number): boolean {
  return age >= minimumAge;
}

export function badge(flags: Flags): string {
  if (flags.isNew) {
    return "NOUVEAU";
  }
  if (flags.top10) {
    return "TOP 10";
  }
  return "";
}

export function ratingLabel(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) {
    return "Pas encore noté";
  }
  if (rating >= 4.5) {
    return "Coup de cœur";
  }
  if (rating >= 3.5) {
    return "Recommandé";
  }
  if (rating >= 2) {
    return "Mitigé";
  }
  return "À éviter";
}
