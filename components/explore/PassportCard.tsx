"use client";

import type { Ref } from "react";
import { STORE_SKINS } from "@/components/storefront";
import { CARD_INKS } from "@/components/explore/skins";
import { stopInteractionProps } from "@/components/explore/stopProps";
import type { ExploreStop, StopHandlers } from "@/components/explore/types";
import { formatRating, skinIndex } from "@/lib/exploreUtils";

export interface PassportCardProps extends StopHandlers {
  stop: ExploreStop;
  highlightId: string | null;
  ref?: Ref<HTMLButtonElement>;
}

export function PassportCard({
  stop: s,
  highlightId,
  onHover,
  onOpen,
  ref,
}: PassportCardProps) {
  const skin = skinIndex(s.index);
  const ink = CARD_INKS[skin];

  return (
    <button
      ref={ref}
      {...stopInteractionProps(s, highlightId, { onHover, onOpen })}
      data-testid={`card-${s.cafe.id}`}
      // Drives the .awa-card lift (globals.css).
      data-selected={String(highlightId === s.cafe.id)}
      className={`flex min-h-[176px] flex-col gap-2 text-left ${
        s.stamped
          ? "awa-card"
          : "rounded-card border-[1.5px] border-dashed border-lockedLine bg-lockedBg p-4 text-lockedInk transition-colors duration-500 data-[highlighted=true]:border-ink motion-reduce:transition-none"
      }`}
      style={
        s.stamped
          ? { backgroundColor: STORE_SKINS[skin].wall, color: ink }
          : undefined
      }
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-label text-xs font-bold tracking-[0.18em]">
          STOP {s.stop}
        </span>
        <span className="font-label text-xs font-semibold">
          ★ {formatRating(s.rating)}
        </span>
      </span>

      <span className="block font-display text-xl font-bold leading-tight">
        {s.cafe.name}
      </span>

      <span className="flex flex-wrap gap-1">
        {s.cafe.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              s.stamped
                ? "border border-ink bg-paper text-ink"
                : "border border-dashed border-lockedLine"
            }`}
          >
            {tag}
          </span>
        ))}
      </span>

      <span className="mt-auto pt-1">
        {s.stamped ? (
          <span
            className="inline-block -rotate-[4deg] animate-stamp-in rounded-badge border-4 border-double px-2 py-0.5 font-label text-xs font-bold tracking-[0.14em]"
            style={{ borderColor: ink }}
          >
            ✓ STAMPED
          </span>
        ) : (
          <span className="block max-w-[132px] rounded-slot border-[1.5px] border-dashed border-lockedLine px-2 py-1 text-[11px] leading-snug">
            Unstamped — click to check in
          </span>
        )}
      </span>
    </button>
  );
}
