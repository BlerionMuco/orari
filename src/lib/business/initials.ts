// Up-to-2 uppercase initials from a business name, for the logo monogram
// fallback. Pure, client-importable. "Beni's Barber" → "BB", "Tirana" → "T".
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.match(/\p{L}/u)?.[0] ?? "") // first letter, skip punctuation
    .filter(Boolean);
  return letters.slice(0, 2).join("").toUpperCase();
}
