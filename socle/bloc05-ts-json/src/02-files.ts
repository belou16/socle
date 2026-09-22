/* Quest 2 · On disk */
import { readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Catalogue, Title } from "./types.ts";

export function readJsonFile(filePath: string): unknown {
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${filePath}`);
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function loadCatalogue(): Title[] {
  const url = new URL("../data/catalogue.json", import.meta.url);
  const catalogue = JSON.parse(readFileSync(url, "utf8")) as Catalogue;
  return catalogue.titles;
}

// Challenge ⭐: loadCatalogueAsync(): Promise<Title[]> with node:fs/promises
export async function loadCatalogueAsync(): Promise<Title[]> {
  const url = new URL("../data/catalogue.json", import.meta.url);
  const catalogue = JSON.parse(await readFile(url, "utf8")) as Catalogue;
  return catalogue.titles;
}
