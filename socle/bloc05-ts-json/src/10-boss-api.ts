/* Quest 10 · BOSS · The catalogue API
   The cards come from quest 4: toCard is imported here. */
import type { Catalogue, SearchRequest, SearchResponse, SortKey, Title } from "./types.ts";
import { toCard } from "./04-transform.ts";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesQuery(title: string, q: string): boolean {
  return normalize(title).includes(normalize(q));
}

const byName = (a: Title, b: Title): number => a.title.localeCompare(b.title);

const COMPARATORS: Record<SortKey, (a: Title, b: Title) => number> = {
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || byName(a, b),
  title: byName,
  year: (a, b) => a.year - b.year || byName(a, b),
};

export function respond(
  catalogue: Readonly<Catalogue>,
  request: SearchRequest = {},
): SearchResponse {
  const { q, genre, kind, sort = "rating", page = 1, perPage = 5 } = request;

  const filtered = catalogue.titles.filter((t) => {
    if (q && !matchesQuery(t.title, q)) return false;
    if (genre && !t.genres.includes(genre)) return false;
    if (kind && t.kind !== kind) return false;
    return true;
  });

  const sorted = [...filtered].sort(COMPARATORS[sort]);
  const total = sorted.length;
  const pages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const results = sorted.slice(start, start + perPage).map(toCard);

  return { page, perPage, total, pages, results };
}
