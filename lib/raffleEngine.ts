/**
 * Deterministic, auditable raffle engine (ADR-4, AC 3.3 / 3.4 / 3.7 / 3.8).
 * RED-phase stub: signatures only.
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

export function hashSeed(publicSeed: string): number {
  void publicSeed;
  throw new Error("not implemented");
}

export function mulberry32(seed: number): () => number {
  void seed;
  throw new Error("not implemented");
}

export function normalizePool(userIds: readonly string[]): string[] {
  void userIds;
  throw new Error("not implemented");
}

export function drawWinners(
  userIds: readonly string[],
  publicSeed: string,
  winnerCount: number,
): string[] {
  void userIds;
  void publicSeed;
  void winnerCount;
  throw new Error("not implemented");
}

export function verifyDraw(input: VerifyDrawInput): VerifyDrawResult {
  void input;
  throw new Error("not implemented");
}
