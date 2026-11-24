"use client";

import { StorefrontSvg } from "@/components/storefront";
import { stopInteractionProps } from "@/components/explore/stopProps";
import type { ExploreStop, StopHandlers } from "@/components/explore/types";
import { formatRating } from "@/lib/exploreUtils";

export interface StreetscapeProps extends StopHandlers {
  stops: ExploreStop[];
  highlightId: string | null;
}

export function Streetscape({
  stops,
  highlightId,
  onHover,
  onOpen,
}: StreetscapeProps) {
  return (
    <section aria-label="Streetscape" className="flex overflow-x-auto bg-pave">
      {stops.map((s) => (
        <button
          key={s.cafe.id}
          {...stopInteractionProps(s, highlightId, { onHover, onOpen })}
          data-testid={`storefront-${s.cafe.id}`}
          style={{ opacity: s.visible ? 1 : 0.38 }}
          className="group relative min-w-[220px] flex-1 transition-opacity duration-500 focus-visible:outline-offset-[-4px] motion-reduce:transition-none"
        >
          <StorefrontSvg
            index={s.index}
            name={s.cafe.name}
            stop={s.stop}
            stamped={s.stamped}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-3 right-3 top-3 rounded-badge border-2 border-ink bg-paper px-3 py-2 text-left text-xs text-ink shadow-hard transition-opacity duration-200 ${
              highlightId === s.cafe.id ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="block font-label font-bold tracking-[0.12em]">
              STOP {s.stop} · ★ {formatRating(s.rating)}
            </span>
            <span className="block truncate">{s.cafe.tags.join(" · ")}</span>
            <span className="block font-semibold">
              {s.stamped ? "Stamped" : "Not yet stamped"}
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}
