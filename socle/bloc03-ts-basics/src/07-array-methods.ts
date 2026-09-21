/* Quest 7 · The assembly line
   Forbidden here: for, while. Allowed: map, filter, reduce, find, some, every. */
import type { Movie } from "./types.ts";

export function titles(movies: Movie[]): string[] {
  return movies.map((movie) => movie.title);
}

export function wellRated(movies: Movie[], minimum = 4): Movie[] {
  return movies.filter((movie) => (movie.rating ?? 0) >= minimum);
}

export function totalRuntime(movies: Movie[]): number {
  return movies.reduce((total, movie) => total + (movie.runtime ?? 0), 0);
}

export function findByTitle(movies: Movie[], title: string): Movie | undefined {
  return movies.find((movie) => movie.title === title);
}

export function allKidFriendly(movies: Movie[]): boolean {
  return movies.every((movie) => (movie.minimumAge ?? 0) <= 10);
}

export function anyNew(movies: Movie[]): boolean {
  return movies.some((movie) => movie.isNew === true);
}

export function marquee(movies: Movie[]): string {
  return wellRated(movies)
    .map((movie) => movie.title.toUpperCase())
    .join(" · ");
}
