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

const notImplemented = (): never => {
  throw new Error("not implemented");
};

export function liveCafes(_cafes: readonly Cafe[]): Cafe[] {
  return notImplemented();
}

export function stopLabel(_index: number): string {
  return notImplemented();
}

export function skinIndex(_index: number): 0 | 1 | 2 | 3 {
  return notImplemented();
}

export function collectTags(_cafes: readonly Cafe[]): string[] {
  return notImplemented();
}

export function toggleTag(
  _selected: readonly string[],
  _tag: string
): string[] {
  return notImplemented();
}

export function matchesAllTags(
  _cafe: Pick<Cafe, "tags">,
  _selected: readonly string[]
): boolean {
  return notImplemented();
}

export function stampedCafeIds(
  _reviews: readonly Review[],
  _session: ExplorerSession | null,
  _seasonId: string,
  _liveIds: ReadonlySet<string>
): Set<string> {
  return notImplemented();
}

export function stampCounter(
  _session: ExplorerSession | null,
  _stamped: number,
  _total: number
): string {
  return notImplemented();
}

export function raffleProgress(_unique: number, _min: number): RaffleProgress {
  return notImplemented();
}

export function averageRating(_reviews: readonly Review[]): number | null {
  return notImplemented();
}

export function criterionAverages(
  _reviews: readonly Review[]
): CriterionAverages | null {
  return notImplemented();
}

export function formatRating(_avg: number | null): string {
  return notImplemented();
}

export function googleMapsUrl(_cafe: MapsTarget): string {
  return notImplemented();
}

export function appleMapsUrl(_cafe: MapsTarget): string {
  return notImplemented();
}
