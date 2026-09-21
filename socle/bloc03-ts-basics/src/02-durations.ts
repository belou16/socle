/* Quest 2 · The time counter */

export function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours > 0 && remainder > 0) {
    return `${hours} h ${remainder} min`;
  }
  if (hours > 0) {
    return `${hours} h`;
  }
  return `${remainder} min`;
}

export function percentWatched(position: number, duration: number): number {
  if (duration <= 0) {
    return 0;
  }
  return Math.min(Math.round((position / duration) * 100), 100);
}
