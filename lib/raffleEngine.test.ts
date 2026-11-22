import { describe, expect, it } from "vitest";
import {
  drawWinners,
  hashSeed,
  mulberry32,
  normalizePool,
  verifyDraw,
} from "./raffleEngine";

const pool = Array.from(
  { length: 20 },
  (_, i) => `user-${String(i).padStart(2, "0")}`,
);
const seed = "AUTUMN-CRAWL-2026";

describe("hashSeed (stable 32-bit hash of public_seed)", () => {
  it("matches FNV-1a 32-bit reference vectors", () => {
    expect(hashSeed("")).toBe(0x811c9dc5);
    expect(hashSeed("a")).toBe(0xe40c292c);
    expect(hashSeed("foobar")).toBe(0xbf9cf968);
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const s of ["", "x", seed, "café-☕-2026"]) {
      const h = hashSeed(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("hashes multibyte text over UTF-8 bytes deterministically", () => {
    expect(hashSeed("café-☕")).toBe(hashSeed("café-☕"));
    expect(hashSeed("café")).not.toBe(hashSeed("cafe"));
  });
});

describe("mulberry32", () => {
  it("produces values in [0, 1)", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("diverges for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});

describe("AC 3.4 — sort, shuffle, select", () => {
  it("normalizePool dedupes and sorts by code unit, not locale", () => {
    expect(normalizePool(["b", "B", "a", "b", "A", "_"])).toEqual([
      "A",
      "B",
      "_",
      "a",
      "b",
    ]);
  });

  it("is independent of input order (pool is sorted before shuffling)", () => {
    const reversed = [...pool].reverse();
    expect(drawWinners(reversed, seed, 5)).toEqual(drawWinners(pool, seed, 5));
  });

  it("returns distinct winners drawn from the pool", () => {
    const winners = drawWinners([...pool, ...pool], seed, 10);
    expect(new Set(winners).size).toBe(10);
    for (const w of winners) expect(pool).toContain(w);
  });

  it("returns min(winnerCount, pool.length) winners", () => {
    expect(drawWinners(pool, seed, 3)).toHaveLength(3);
    expect(drawWinners(pool, seed, 20)).toHaveLength(20);
    expect(drawWinners(pool, seed, 50)).toHaveLength(20);
  });

  it("actually shuffles (full draw is a permutation, not the sorted pool)", () => {
    const all = drawWinners(pool, seed, pool.length);
    expect([...all].sort()).toEqual(normalizePool(pool));
    expect(all).not.toEqual(normalizePool(pool));
  });
});

describe("AC 3.3 — preview determinism, no writes", () => {
  it("same seed and pool always give the same winners", () => {
    const first = drawWinners(pool, seed, 4);
    for (let i = 0; i < 5; i++) {
      expect(drawWinners(pool, seed, 4)).toEqual(first);
    }
  });

  it("a different seed changes the outcome", () => {
    expect(drawWinners(pool, "OTHER-SEED-2026", pool.length)).not.toEqual(
      drawWinners(pool, seed, pool.length),
    );
  });

  it("does not mutate the input array", () => {
    const input = ["c", "a", "b", "a"];
    const copy = [...input];
    drawWinners(input, seed, 2);
    expect(input).toEqual(copy);
  });
});

describe("AC 3.7 — short and empty pools", () => {
  it("a short non-empty pool returns every eligible user", () => {
    const small = ["u3", "u1", "u2"];
    expect([...drawWinners(small, seed, 5)].sort()).toEqual(["u1", "u2", "u3"]);
  });

  it("an empty pool issues no tickets", () => {
    expect(drawWinners([], seed, 3)).toEqual([]);
  });

  it("winnerCount 0 returns no winners", () => {
    expect(drawWinners(pool, seed, 0)).toEqual([]);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid winnerCount %s",
    (n) => {
      expect(() => drawWinners(pool, seed, n)).toThrow(RangeError);
    },
  );
});

describe("golden vector (audit stability)", () => {
  // Pinned output of the published algorithm. If this changes, every past
  // draw stops verifying — treat a diff here as a breaking audit change.
  it("pins hash and winners for a fixed seed and pool", () => {
    const fixedPool = Array.from({ length: 8 }, (_, i) => `user-${i + 1}`);
    expect(hashSeed("AUTUMN-CRAWL-2026")).toBe(2542423322);
    expect(drawWinners(fixedPool, "AUTUMN-CRAWL-2026", 3)).toEqual([
      "user-1",
      "user-6",
      "user-3",
    ]);
  });
});

describe("AC 3.8 — verifyDraw", () => {
  const setup = () => {
    const published = drawWinners(pool, seed, 3);
    const base = {
      poolSnapshot: normalizePool(pool),
      publicSeed: seed,
      winnerCount: 3,
      publishedWinners: published,
    };
    return { published, base };
  };

  it("verifies (✓) when published winners match the replay", () => {
    const { published, base } = setup();
    expect(verifyDraw(base)).toEqual({ verified: true, expected: published });
  });

  it("fails (✗) when a winner was tampered with", () => {
    const { published, base } = setup();
    const outsider = pool.find((u) => !published.includes(u)) as string;
    const tampered = [outsider, ...published.slice(1)];
    expect(verifyDraw({ ...base, publishedWinners: tampered }).verified).toBe(
      false,
    );
  });

  it("fails (✗) when winners are reordered (ticket order matters)", () => {
    const { published, base } = setup();
    const reordered = [...published].reverse();
    expect(verifyDraw({ ...base, publishedWinners: reordered }).verified).toBe(
      false,
    );
  });

  it("fails (✗) with the wrong seed", () => {
    const { base } = setup();
    expect(verifyDraw({ ...base, publicSeed: "WRONG-2026" }).verified).toBe(
      false,
    );
  });

  it("fails (✗) when winner count differs", () => {
    const { base } = setup();
    expect(verifyDraw({ ...base, winnerCount: 2 }).verified).toBe(false);
  });

  it("verifies an empty draw", () => {
    expect(
      verifyDraw({
        poolSnapshot: [],
        publicSeed: seed,
        winnerCount: 3,
        publishedWinners: [],
      }),
    ).toEqual({ verified: true, expected: [] });
  });
});
