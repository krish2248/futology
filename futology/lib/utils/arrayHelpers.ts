/**
 * Splits `items` into groups of size `size`. Last group may be shorter.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2)  // → [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Returns `items` with duplicates removed, preserving first-seen order.
 *
 * @example
 * unique([1, 2, 2, 3, 1])  // → [1, 2, 3]
 */
export function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}

/**
 * Groups items by the value returned from `key`. Returns a Map so
 * insertion order is preserved.
 *
 * @example
 * groupBy(matches, (m) => m.leagueName)  // → Map<string, Match[]>
 */
export function groupBy<T, K>(
  items: readonly T[],
  key: (item: T) => K,
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

/**
 * Returns up to `n` items uniformly sampled from `items` without
 * replacement, using a seeded RNG so results are reproducible.
 */
export function sampleSeeded<T>(
  items: readonly T[],
  n: number,
  seed: number,
): T[] {
  let s = seed % 4294967296;
  if (s < 0) s += 4294967296;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(rnd() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}
