/* Quest 9 · When it breaks */
import type { Movie } from "./types.ts";

export function directorOf(movie: Movie | null | undefined): string {
  return movie?.credits?.director ?? "Inconnu";
}

export function assertAge(age: unknown): number {
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 130) {
    throw new Error(`Invalid age: ${String(age)}`);
  }
  return age;
}

export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) {
    throw new Error("No ratings");
  }
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export function safeAverageRating(ratings: number[]): number {
  try {
    return averageRating(ratings);
  } catch {
    return 0;
  }
}

export class MovieNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MovieNotFoundError";
  }
}

export function findOrThrow(movies: Movie[], title: string): Movie {
  const movie = movies.find((candidate) => candidate.title === title);
  if (!movie) {
    throw new MovieNotFoundError(`"${title}" is not in the catalogue`);
  }
  return movie;
}
