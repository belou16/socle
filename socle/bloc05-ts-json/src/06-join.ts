/* Quest 6 · The join */
import type { Catalogue, HistoryView, Profile } from "./types.ts";

function sortedByRecency<T extends { watchedAt: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));
}

export function history(profile: Profile, catalogue: Catalogue): HistoryView[] {
  return sortedByRecency(profile.history)
    .map((entry) => {
      const title = catalogue.titles.find((t) => t.id === entry.id);
      return title
        ? {
            title: title.title,
            progress: Math.round(entry.progress * 100),
            watchedAt: entry.watchedAt,
          }
        : null;
    })
    .filter((view): view is HistoryView => view !== null);
}

export function continueWatching(profile: Profile, catalogue: Catalogue): string[] {
  return history(profile, catalogue)
    .filter((view) => view.progress > 0 && view.progress < 100)
    .map((view) => view.title);
}

export function hasWatched(profile: Profile, id: string): boolean {
  return profile.history.some((entry) => entry.id === id && entry.progress === 1);
}

// Challenge ⭐: unseenNewTitles(profile: Profile, catalogue: Catalogue): string[]
export function unseenNewTitles(profile: Profile, catalogue: Catalogue): string[] {
  const seen = new Set(profile.history.map((entry) => entry.id));
  return catalogue.titles.filter((t) => t.isNew && !seen.has(t.id)).map((t) => t.title);
}
