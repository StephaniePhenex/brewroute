"use client";

import { PassportCard } from "@/components/explore/PassportCard";
import type { ExploreStop, StopHandlers } from "@/components/explore/types";

export interface PassportGridProps extends StopHandlers {
  stops: ExploreStop[];
  highlightId: string | null;
  registerCard: (cafeId: string, el: HTMLButtonElement | null) => void;
}

export function PassportGrid({
  stops,
  highlightId,
  registerCard,
  onHover,
  onOpen,
}: PassportGridProps) {
  const visible = stops.filter((s) => s.visible);

  return (
    <section aria-label="Passport" className="flex flex-col gap-3">
      <p className="font-label text-xs font-semibold tracking-[0.18em] text-muted">
        COFFEE PASSPORT · {visible.length} OF {stops.length} STOPS
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => (
          <PassportCard
            key={s.cafe.id}
            ref={(el) => registerCard(s.cafe.id, el)}
            stop={s}
            highlightId={highlightId}
            onHover={onHover}
            onOpen={onOpen}
          />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="rounded-card border-[1.5px] border-dashed border-lockedLine p-6 text-center text-lockedInk">
          No cafés match every selected tag.
        </p>
      )}
    </section>
  );
}
