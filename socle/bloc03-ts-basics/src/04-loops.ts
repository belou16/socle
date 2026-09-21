/* Quest 4 · Again, again, again */

export function stars(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating - full === 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return "★".repeat(full) + (hasHalf ? "½" : "") + "☆".repeat(empty);
}

export function totalEpisodes(seasons: number[]): number {
  let total = 0;
  for (const episodes of seasons) {
    total += episodes;
  }
  return total;
}

export function countdown(n: number): string {
  let text = "";
  for (let i = n; i >= 1; i--) {
    text += `${i}, `;
  }
  return `${text}Action !`;
}
