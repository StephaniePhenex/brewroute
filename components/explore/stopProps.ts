import type { ExploreStop, StopHandlers } from "@/components/explore/types";

/**
 * Shared props for any element standing in for a stop (storefront, card) so
 * hover/focus sync, click-to-open, and the accessible label never drift apart.
 */
export function stopInteractionProps(
  s: ExploreStop,
  highlightId: string | null,
  { onHover, onOpen }: StopHandlers
) {
  return {
    type: "button" as const,
    "aria-label": `Stop ${s.stop}, ${s.cafe.name}, ${s.stamped ? "stamped" : "not stamped"}`,
    "data-highlighted": String(highlightId === s.cafe.id),
    onMouseEnter: () => onHover(s.cafe.id),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(s.cafe.id),
    onBlur: () => onHover(null),
    onClick: () => onOpen(s.cafe.id),
  };
}
