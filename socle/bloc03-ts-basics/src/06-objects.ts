/* Quest 6 · The movie card */
import type { Movie } from "./types.ts";

export function createMovie(title: string, year: number, rating: number): Movie {
  return { title, year, rating };
}

export function summary(movie: Movie): string {
  if (movie.rating === null || movie.rating === undefined) {
    return `${movie.title} (${movie.year}) · non noté`;
  }
  return `${movie.title} (${movie.year}) · ★ ${movie.rating}`;
}

export function rate(movie: Movie, rating: number): Movie {
  movie.rating = rating;
  return movie;
}

export function hasGenre(movie: Movie, genre: string): boolean {
  return movie.genres?.includes(genre) ?? false;
}

export function fields(movie: Movie): string[] {
  return Object.keys(movie);
}
