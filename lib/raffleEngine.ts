/**
 * Deterministic, auditable raffle engine (ADR-4, AC 3.3 / 3.4 / 3.7 / 3.8).
 *
 * Pure functions only: no I/O, no persistence. Preview, run, and verify
 * (Issue 12) all call `drawWinners`, so identical inputs always produce
 * identical, ordered winners.
 *
 * Audit contract:
 * - Seed hash: FNV-1a 32-bit over the UTF-8 bytes of `public_seed`.
 * - `pool_snapshot`: JSON array of eligible user ids as returned by
 *   `normalizePool` (deduplicated, sorted by UTF-16 code unit).
 */

export interface VerifyDrawInput {
  poolSnapshot: readonly string[];
  publicSeed: string;
  winnerCount: number;
  publishedWinners: readonly string[];
}

export interface VerifyDrawResult {
  verified: boolean;
  expected: string[];
}

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a 32-bit hash of the UTF-8 bytes of `publicSeed` (unsigned). */
export function hashSeed(publicSeed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (const byte of new TextEncoder().encode(publicSeed)) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG: returns a generator of floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Dedupe and sort ids by UTF-16 code unit. Deliberately not
 * `localeCompare`, whose order can differ between runtimes.
 */
export function normalizePool(userIds: readonly string[]): string[] {
  return [...new Set(userIds)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Draw `min(winnerCount, pool.length)` distinct winners, in ticket order.
 * Throws `RangeError` unless `winnerCount` is a non-negative integer.
 */
export function drawWinners(
  userIds: readonly string[],
  publicSeed: string,
  winnerCount: number,
): string[] {
  if (!Number.isInteger(winnerCount) || winnerCount < 0) {
    throw new RangeError(
      `winnerCount must be a non-negative integer, got ${winnerCount}`,
    );
  }

  const pool = normalizePool(userIds);
  const rng = mulberry32(hashSeed(publicSeed));

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(winnerCount, pool.length));
}

/** Replay the draw from the frozen snapshot and compare in ticket order. */
export function verifyDraw(input: VerifyDrawInput): VerifyDrawResult {
  const expected = drawWinners(
    input.poolSnapshot,
    input.publicSeed,
    input.winnerCount,
  );
  const verified =
    expected.length === input.publishedWinners.length &&
    expected.every((id, i) => id === input.publishedWinners[i]);
  return { verified, expected };
}
