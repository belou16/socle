/* Quest 7 · Do not touch the original
   Every function returns a NEW catalogue. The tests freeze the one you receive. */
import type { Catalogue, Title } from "./types.ts";

export function rate(catalogue: Readonly<Catalogue>, id: string, rating: number): Catalogue {
  const titles = catalogue.titles.map((t) => (t.id === id ? { ...t, rating } : t));
  return { ...catalogue, titles };
}

export function addTitle(catalogue: Readonly<Catalogue>, title: Title): Catalogue {
  return { ...catalogue, titles: [...catalogue.titles, title] };
}

export function removeTitle(catalogue: Readonly<Catalogue>, id: string): Catalogue {
  const titles = catalogue.titles.filter((t) => t.id !== id);
  const rows = catalogue.rows.map((row) => ({ ...row, ids: row.ids.filter((i) => i !== id) }));
  return { ...catalogue, titles, rows };
}

// Challenge ⭐: renameGenre(catalogue: Readonly<Catalogue>, from: string, to: string): Catalogue
export function renameGenre(catalogue: Readonly<Catalogue>, from: string, to: string): Catalogue {
  const titles = catalogue.titles.map((t) =>
    t.genres.includes(from) ? { ...t, genres: t.genres.map((g) => (g === from ? to : g)) } : t,
  );
  return { ...catalogue, titles };
}
