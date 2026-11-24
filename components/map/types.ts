import type { Cafe, RouteOverlay } from "@/lib/types/explore";

export interface CityMapPin {
  cafe: Cafe;
  /** Position in the live stop order (drives the 4-skin colour). */
  index: number;
  stamped: boolean;
}

export interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export interface CityMapProps extends TagFilterProps {
  /** Pins that pass the active tag filter; filtered-out pins are not passed. */
  pins: CityMapPin[];
  highlightId: string | null;
  onHover: (cafeId: string | null) => void;
  onSelect: (cafeId: string) => void;
  /** Optional concierge route (Issue 11) — drawn as a dashed burgundy line. */
  routeOverlay?: RouteOverlay;
}
