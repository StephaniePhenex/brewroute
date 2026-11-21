import { describe, expect, it } from "vitest";
import {
  appleMapsUrl,
  averageRating,
  collectTags,
  criterionAverages,
  formatRating,
  googleMapsUrl,
  liveCafes,
  matchesAllTags,
  raffleProgress,
  skinIndex,
  stampCounter,
  stampedCafeIds,
  stopLabel,
  toggleTag,
} from "@/lib/exploreUtils";
import {
  MOCK_CAFES,
  MOCK_EXPLORER,
  MOCK_REVIEWS,
  MOCK_SEASON,
} from "@/lib/mocks/explore";
import type { Cafe, Review } from "@/lib/types/explore";

function cafe(overrides: Partial<Cafe>): Cafe {
  return {
    id: "c",
    seasonId: "s1",
    name: "Test Café",
    address: "1 Test St",
    latitude: 49.26,
    longitude: -123.1,
    tags: [],
    sortOrder: 1,
    deletedAt: null,
    ...overrides,
  };
}

function review(overrides: Partial<Review>): Review {
  return {
    id: "r",
    userId: "u-explorer",
    cafeId: "c1",
    seasonId: "s1",
    coffeeQuality: 4,
    ambiance: 4,
    workspaceFriendliness: 4,
    note: "A perfectly fine cup of coffee.",
    createdAt: "2026-10-01T00:00:00Z",
    authorName: "Wren",
    ...overrides,
  };
}

describe("AC 2.8 — stop order and 4-skin cycle", () => {
  it("formats zero-based indices as two-digit stop labels", () => {
    expect(stopLabel(0)).toBe("01");
    expect(stopLabel(8)).toBe("09");
    expect(stopLabel(9)).toBe("10");
  });

  it("cycles skins every 4 stops in lockstep with StorefrontSvg", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(skinIndex)).toEqual([
      0, 1, 2, 3, 0, 1, 2, 3,
    ]);
    expect(skinIndex(-1)).toBe(3);
  });

  it("drops soft-deleted cafés and orders by sortOrder", () => {
    const result = liveCafes([
      cafe({ id: "b", sortOrder: 2 }),
      cafe({ id: "gone", sortOrder: 0, deletedAt: "2026-10-01T00:00:00Z" }),
      cafe({ id: "a", sortOrder: 1 }),
    ]);
    expect(result.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("does not mutate its input", () => {
    const input = [
      cafe({ id: "b", sortOrder: 2 }),
      cafe({ id: "a", sortOrder: 1 }),
    ];
    liveCafes(input);
    expect(input.map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("leaves 6 live stops in the mock season", () => {
    expect(liveCafes(MOCK_CAFES)).toHaveLength(6);
  });
});

describe("AC 4.1 — header stamp counter", () => {
  it("reads SIGNED OUT without a session", () => {
    expect(stampCounter(null, 0, 6)).toBe("SIGNED OUT");
  });

  it("reads X/Y STAMPS for a signed-in explorer", () => {
    expect(stampCounter(MOCK_EXPLORER, 2, 6)).toBe("2/6 STAMPS");
  });
});

describe("AC 4.1 / 4.2 — stamped café ids", () => {
  const live = new Set(["c1", "c2", "c3"]);

  it("is empty when signed out", () => {
    expect(stampedCafeIds([review({})], null, "s1", live).size).toBe(0);
  });

  it("counts a repeat review of the same café once", () => {
    const ids = stampedCafeIds(
      [review({ id: "r1", cafeId: "c1" }), review({ id: "r2", cafeId: "c1" })],
      MOCK_EXPLORER,
      "s1",
      live
    );
    expect([...ids]).toEqual(["c1"]);
  });

  it("ignores other users, other seasons, and soft-deleted cafés", () => {
    const ids = stampedCafeIds(
      [
        review({ id: "r1", cafeId: "c1" }),
        review({ id: "r2", cafeId: "c2", userId: "u-other" }),
        review({ id: "r3", cafeId: "c3", seasonId: "s0" }),
        review({ id: "r4", cafeId: "c-retired" }),
      ],
      MOCK_EXPLORER,
      "s1",
      live
    );
    expect([...ids]).toEqual(["c1"]);
  });

  it("gives the mock explorer 2 unique live stamps", () => {
    const liveIds = new Set(liveCafes(MOCK_CAFES).map((c) => c.id));
    const ids = stampedCafeIds(
      MOCK_REVIEWS,
      MOCK_EXPLORER,
      MOCK_SEASON.id,
      liveIds
    );
    expect([...ids].sort()).toEqual(["cafe-fern-filter", "cafe-paper-lantern"]);
  });
});

describe("AC 4.4 — raffle progress bar", () => {
  it("reports partial progress, rounded to a whole percent", () => {
    expect(raffleProgress(2, 3)).toEqual({
      value: 2,
      max: 3,
      percent: 67,
      complete: false,
    });
  });

  it("completes when unique cafés reach min_checkins", () => {
    expect(raffleProgress(3, 3)).toEqual({
      value: 3,
      max: 3,
      percent: 100,
      complete: true,
    });
  });

  it("clamps overshoot to 100%", () => {
    expect(raffleProgress(5, 3).percent).toBe(100);
  });

  it("guards a non-positive minimum without dividing by zero", () => {
    const p = raffleProgress(0, 0);
    expect(p.percent).toBe(100);
    expect(p.complete).toBe(true);
  });
});

describe("AC 4.5 — AND tag filtering", () => {
  it("collects unique tags in alphabetical order", () => {
    expect(
      collectTags([
        cafe({ tags: ["wifi", "quiet"] }),
        cafe({ tags: ["jazz", "wifi"] }),
      ])
    ).toEqual(["jazz", "quiet", "wifi"]);
  });

  it("matches everything when no tag is selected (All)", () => {
    expect(matchesAllTags(cafe({ tags: [] }), [])).toBe(true);
  });

  it("matches a single selected tag", () => {
    expect(matchesAllTags(cafe({ tags: ["quiet"] }), ["quiet"])).toBe(true);
    expect(matchesAllTags(cafe({ tags: ["jazz"] }), ["quiet"])).toBe(false);
  });

  it("requires every selected tag (AND, not OR)", () => {
    expect(
      matchesAllTags(cafe({ tags: ["quiet", "wifi", "pastry"] }), [
        "quiet",
        "wifi",
      ])
    ).toBe(true);
    expect(
      matchesAllTags(cafe({ tags: ["quiet", "fruity"] }), ["quiet", "wifi"])
    ).toBe(false);
  });

  it("toggles a tag on and off without mutating the selection", () => {
    const start: string[] = ["quiet"];
    const added = toggleTag(start, "wifi");
    expect(added).toEqual(["quiet", "wifi"]);
    expect(toggleTag(added, "quiet")).toEqual(["wifi"]);
    expect(start).toEqual(["quiet"]);
  });

  it("narrows the mock season to 2 cafés for quiet AND wifi", () => {
    const hits = liveCafes(MOCK_CAFES).filter((c) =>
      matchesAllTags(c, ["quiet", "wifi"])
    );
    expect(hits.map((c) => c.id)).toEqual([
      "cafe-paper-lantern",
      "cafe-little-atlas",
    ]);
  });
});

describe("AC 4.8 — dossier rating averages", () => {
  it("returns null (never NaN) for zero reviews", () => {
    expect(averageRating([])).toBeNull();
    expect(criterionAverages([])).toBeNull();
  });

  it("averages the three criteria of a single review", () => {
    expect(
      averageRating([
        review({ coffeeQuality: 5, ambiance: 4, workspaceFriendliness: 3 }),
      ])
    ).toBe(4);
  });

  it("averages per-review means across reviews to 1 decimal place", () => {
    expect(
      averageRating([
        review({ coffeeQuality: 5, ambiance: 5, workspaceFriendliness: 5 }),
        review({ coffeeQuality: 3, ambiance: 3, workspaceFriendliness: 4 }),
      ])
    ).toBe(4.2);
  });

  it("averages each criterion separately to 1 decimal place", () => {
    expect(
      criterionAverages([
        review({ coffeeQuality: 5, ambiance: 4, workspaceFriendliness: 2 }),
        review({ coffeeQuality: 4, ambiance: 4, workspaceFriendliness: 3 }),
        review({ coffeeQuality: 4, ambiance: 5, workspaceFriendliness: 3 }),
      ])
    ).toEqual({
      coffeeQuality: 4.3,
      ambiance: 4.3,
      workspaceFriendliness: 2.7,
    });
  });

  it("formats ratings with one decimal, or No ratings yet", () => {
    expect(formatRating(null)).toBe("No ratings yet");
    expect(formatRating(4)).toBe("4.0");
    expect(formatRating(4.25)).toBe("4.3");
  });
});

describe("External Maps links (AC 4.8)", () => {
  const target = {
    name: "Fern & Filter",
    latitude: 49.262,
    longitude: -123.099,
  };

  it("builds a Google Maps search URL from coordinates", () => {
    expect(googleMapsUrl(target)).toBe(
      "https://www.google.com/maps/search/?api=1&query=49.262%2C-123.099"
    );
  });

  it("builds an Apple Maps URL with an encoded café name", () => {
    expect(appleMapsUrl(target)).toBe(
      "https://maps.apple.com/?ll=49.262%2C-123.099&q=Fern+%26+Filter"
    );
  });
});
