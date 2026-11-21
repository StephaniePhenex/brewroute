// Explorer-facing domain types. Field names mirror docs/ARCHITECTURE.md columns
// in camelCase so Sprint 2 can map Supabase rows onto them 1:1.

export type SeasonStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface Season {
  id: string;
  name: string;
  theme: string;
  status: SeasonStatus;
  minCheckins: number;
  winnerCount: number;
}

export interface Cafe {
  id: string;
  seasonId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  tags: string[];
  sortOrder: number;
  /** ISO timestamp when soft-deleted; `null` while live. */
  deletedAt: string | null;
}

export interface Review {
  id: string;
  userId: string;
  cafeId: string;
  seasonId: string;
  coffeeQuality: number;
  ambiance: number;
  workspaceFriendliness: number;
  note: string;
  /** ISO timestamp (UTC). */
  createdAt: string;
  authorName: string;
}

export interface ExplorerSession {
  userId: string;
  displayName: string;
  role: "USER" | "ADMIN";
}

export interface ExploreData {
  season: Season;
  cafes: Cafe[];
  reviews: Review[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Optional concierge route drawn on the map (Issue 11). */
export interface RouteOverlay {
  points: LatLng[];
  highlightCafeId?: string;
}

export interface CriterionAverages {
  coffeeQuality: number;
  ambiance: number;
  workspaceFriendliness: number;
}

export interface RaffleProgress {
  value: number;
  max: number;
  percent: number;
  complete: boolean;
}
