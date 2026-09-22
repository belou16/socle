/* Quest 4 · The view model */
import type { Card, Catalogue, Title } from "./types.ts";

function detailLabel(title: Title): string {
  if (title.kind === "movie") return `${title.runtime ?? 0} min`;
  const count = title.seasons?.length ?? 0;
  return `${count} ${count > 1 ? "saisons" : "saison"}`;
}

export function toCard(title: Title): Card {
  const kindLabel = title.kind === "movie" ? "Film" : "Série";
  const detail = detailLabel(title);
  return {
    id: title.id,
    title: title.title,
    url: `/titres/${title.id}`,
    subtitle: `${title.year} · ${kindLabel} · ${detail}`,
    rating: title.rating ?? null,
  };
}

export function toCards(catalogue: Catalogue): Card[] {
  return catalogue.titles.map(toCard);
}

export function rowCards(catalogue: Catalogue, rowId: string): Card[] {
  const row = catalogue.rows.find((r) => r.id === rowId);
  if (!row) return [];
  return row.ids
    .map((id) => catalogue.titles.find((t) => t.id === id))
    .filter((t): t is Title => t !== undefined)
    .map(toCard);
}

// Challenge ⭐: toCsv(titles: Title[]): string
export function toCsv(titles: Title[]): string {
  const header = "id;title;year;rating";
  const lines = titles.map((t) => `${t.id};${t.title};${t.year};${t.rating ?? ""}`);
  return [header, ...lines].join("\n");
}
