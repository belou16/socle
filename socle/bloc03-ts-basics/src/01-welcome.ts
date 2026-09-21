/* Quest 1 · The first word
   Run `npm run play`: the lesson and the tests show up in the terminal.
   Complete each function below, then save. The `?` after `name` means the
   parameter is optional (challenge ⭐). */

export function welcome(name?: string): string {
  if (name === undefined) {
    return "Bienvenue sur NOLANFLIX !";
  }
  return `Bienvenue sur NOLANFLIX, ${name} !`;
}

export function uppercase(title: string): string {
  return title.toUpperCase();
}

export function titleLength(title: string): number {
  return title.length;
}
