// Pure helpers for the EXPLORE view (stop labels, tag filtering, stamps,
// raffle progress, rating averages, external Maps links).

import type {
  Cafe,
  CriterionAverages,
  ExplorerSession,
  RaffleProgress,
  Review,
} from "@/lib/types/explore";

type MapsTarget = Pick<Cafe, "name" | "latitude" | "longitude">;

const round1 = (n: number): number => Math.round(n * 10) / 10;

const mean = (values: readonly number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

/** Live cafés (not soft-deleted) in stop order. */
export function liveCafes(cafes: readonly Cafe[]): Cafe[] {
  return cafes
    .filter((c) => c.deletedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Zero-based position → two-digit stop label (`0` → `"01"`). */
export function stopLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Position in the 4-skin cycle shared by storefronts, pins, and cards. */
export function skinIndex(index: number): 0 | 1 | 2 | 3 {
  return (((index % 4) + 4) % 4) as 0 | 1 | 2 | 3;
}

export function collectTags(cafes: readonly Cafe[]): string[] {
  return [...new Set(cafes.flatMap((c) => c.tags))].sort();
}

export function toggleTag(selected: readonly string[], tag: string): string[] {
  return selected.includes(tag)
    ? selected.filter((t) => t !== tag)
    : [...selected, tag];
}

/** AND filter: a café matches only if it carries every selected tag. */
export function matchesAllTags(
  cafe: Pick<Cafe, "tags">,
  selected: readonly string[]
): boolean {
  return selected.every((t) => cafe.tags.includes(t));
}

/** Unique cafés (including later-retired ones) reviewed this season — AC 3.1. */
export function raffleCafeIds(
  _reviews: readonly Review[],
  _session: ExplorerSession | null,
  _seasonId: string
): Set<string> {
  throw new Error("not implemented");
}

/** Unique live cafés the signed-in explorer has reviewed this season. */
export function stampedCafeIds(
  reviews: readonly Review[],
  session: ExplorerSession | null,
  seasonId: string,
  liveIds: ReadonlySet<string>
): Set<string> {
  if (!session) return new Set();
  return new Set(
    reviews
      .filter(
        (r) =>
          r.userId === session.userId &&
          r.seasonId === seasonId &&
          liveIds.has(r.cafeId)
      )
      .map((r) => r.cafeId)
  );
}

export function stampCounter(
  session: ExplorerSession | null,
  stamped: number,
  total: number
): string {
  return session ? `${stamped}/${total} STAMPS` : "SIGNED OUT";
}

export function raffleProgress(unique: number, min: number): RaffleProgress {
  if (min <= 0)
    return { value: unique, max: min, percent: 100, complete: true };
  return {
    value: unique,
    max: min,
    percent: Math.min(100, Math.round((unique / min) * 100)),
    complete: unique >= min,
  };
}

/** Mean of each review's 3-criterion mean; `null` (never `NaN`) when empty. */
export function averageRating(reviews: readonly Review[]): number | null {
  if (reviews.length === 0) return null;
  return round1(
    mean(
      reviews.map((r) =>
        mean([r.coffeeQuality, r.ambiance, r.workspaceFriendliness])
      )
    )
  );
}

export function criterionAverages(
  reviews: readonly Review[]
): CriterionAverages | null {
  if (reviews.length === 0) return null;
  return {
    coffeeQuality: round1(mean(reviews.map((r) => r.coffeeQuality))),
    ambiance: round1(mean(reviews.map((r) => r.ambiance))),
    workspaceFriendliness: round1(
      mean(reviews.map((r) => r.workspaceFriendliness))
    ),
  };
}

export function formatRating(avg: number | null): string {
  return avg === null ? "No ratings yet" : avg.toFixed(1);
}

export function googleMapsUrl(cafe: MapsTarget): string {
  const params = new URLSearchParams({
    api: "1",
    query: `${cafe.latitude},${cafe.longitude}`,
  });
  return `https://www.google.com/maps/search/?${params}`;
}

export function appleMapsUrl(cafe: MapsTarget): string {
  const params = new URLSearchParams({
    ll: `${cafe.latitude},${cafe.longitude}`,
    q: cafe.name,
  });
  return `https://maps.apple.com/?${params}`;
}
