import type { Cafe, Review } from "@/lib/types/explore";

/** One live café as rendered across storefront, pin, card, and drawer. */
export interface ExploreStop {
  cafe: Cafe;
  /** Position in the live stop order (drives the 4-skin colour). */
  index: number;
  /** Two-digit stop label, e.g. `"01"`. */
  stop: string;
  stamped: boolean;
  /** `false` when the active tag filter excludes this café. */
  visible: boolean;
  reviews: Review[];
  rating: number | null;
}

export interface StopHandlers {
  onHover: (cafeId: string | null) => void;
  onOpen: (cafeId: string) => void;
}
