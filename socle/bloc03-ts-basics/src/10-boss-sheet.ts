/* Quest 10 · BOSS · The full sheet
   Your functions from the previous quests are imported here: reuse them. */
import type { Movie } from "./types.ts";
import { formatDuration } from "./02-durations.ts";
import { stars, totalEpisodes } from "./04-loops.ts";

function capitalize(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

function ratingLine(movie: Movie): string {
  if (movie.rating === null || movie.rating === undefined) {
    return "Non noté";
  }
  return `${stars(Math.round(movie.rating))} ${movie.rating}/5`;
}

function lengthLine(movie: Movie): string {
  if (movie.seasons) {
    const seasonCount = movie.seasons.length;
    const episodeCount = totalEpisodes(movie.seasons);
    const seasonWord = seasonCount > 1 ? "saisons" : "saison";
    const episodeWord = episodeCount > 1 ? "épisodes" : "épisode";
    return `${seasonCount} ${seasonWord} · ${episodeCount} ${episodeWord}`;
  }
  return formatDuration(movie.runtime ?? 0);
}

export function sheet(title: Movie): string {
  const ageLabel = (title.minimumAge ?? 0) === 0 ? "Tout public" : "16+";
  const line1 = `${title.title.toUpperCase()} (${title.year}) · ${ageLabel}`;
  const line2 = `${ratingLine(title)} · ${lengthLine(title)}`;
  const line3 = (title.genres ?? []).map(capitalize).join(", ");
  const line4 = title.credits?.director
    ? `Réalisé par ${title.credits.director}`
    : "Réalisation inconnue";

  return [line1, line2, line3, line4].join("\n");
}

export function catalogueText(titles: Movie[]): string {
  return titles.map(sheet).join("\n\n");
}
