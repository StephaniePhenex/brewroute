"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CafeDossierDrawer } from "@/components/explore/CafeDossierDrawer";
import { Masthead } from "@/components/explore/Masthead";
import { PassportGrid } from "@/components/explore/PassportGrid";
import { PavementStrip } from "@/components/explore/PavementStrip";
import { SeasonHeader } from "@/components/explore/SeasonHeader";
import { Streetscape } from "@/components/explore/Streetscape";
import type { ExploreStop } from "@/components/explore/types";
import { CityMapClient } from "@/components/map/CityMapClient";
import {
  averageRating,
  collectTags,
  liveCafes,
  matchesAllTags,
  raffleCafeIds,
  raffleProgress,
  stampCounter,
  stampedCafeIds,
  stopLabel,
  toggleTag,
} from "@/lib/exploreUtils";
import type {
  ExploreData,
  ExplorerSession,
  RouteOverlay,
} from "@/lib/types/explore";

export interface ExploreViewProps {
  data: ExploreData;
  session: ExplorerSession | null;
  routeOverlay?: RouteOverlay;
}

export function ExploreView({ data, session, routeOverlay }: ExploreViewProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());

  const live = useMemo(() => liveCafes(data.cafes), [data.cafes]);
  const tags = useMemo(() => collectTags(live), [live]);
  const stampedIds = useMemo(
    () =>
      stampedCafeIds(
        data.reviews,
        session,
        data.season.id,
        new Set(live.map((c) => c.id))
      ),
    [data.reviews, data.season.id, live, session]
  );

  const stops = useMemo<ExploreStop[]>(
    () =>
      live.map((cafe, index) => {
        const reviews = data.reviews.filter((r) => r.cafeId === cafe.id);
        return {
          cafe,
          index,
          stop: stopLabel(index),
          stamped: stampedIds.has(cafe.id),
          visible: matchesAllTags(cafe, selectedTags),
          reviews,
          rating: averageRating(reviews),
        };
      }),
    [live, data.reviews, stampedIds, selectedTags]
  );

  // A concierge route (Issue 11) highlights its first stop until the user
  // hovers or opens another café.
  const highlightId =
    hoveredId ?? openId ?? routeOverlay?.highlightCafeId ?? null;
  const openStop = stops.find((s) => s.cafe.id === openId) ?? null;
  // Raffle progress uses the eligibility count (retired cafés included), not
  // the live stamp count shown in the header.
  const raffleCount = useMemo(
    () => raffleCafeIds(data.reviews, session, data.season.id).size,
    [data.reviews, data.season.id, session]
  );
  const progress = raffleProgress(raffleCount, data.season.minCheckins);

  const registerCard = useCallback(
    (cafeId: string, el: HTMLButtonElement | null) => {
      if (el) cardRefs.current.set(cafeId, el);
      else cardRefs.current.delete(cafeId);
    },
    []
  );

  const selectFromMap = useCallback((cafeId: string) => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    cardRefs.current.get(cafeId)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
    setOpenId(cafeId);
  }, []);

  const closeDrawer = useCallback(() => setOpenId(null), []);

  return (
    <div className="flex min-h-screen flex-col">
      <Masthead
        active="EXPLORE"
        counter={stampCounter(session, stampedIds.size, live.length)}
      />
      <Streetscape
        stops={stops}
        highlightId={highlightId}
        onHover={setHoveredId}
        onOpen={setOpenId}
      />
      <PavementStrip />

      <main className="flex-1 bg-paper px-6 pb-20 pt-10 md:px-12">
        <SeasonHeader season={data.season} progress={progress} />

        <div className="mt-8 grid gap-[28px] lg:grid-cols-[45fr_55fr]">
          <div className="h-[420px] lg:sticky lg:top-6 lg:h-[min(640px,calc(100vh-3rem))]">
            <CityMapClient
              pins={stops.filter((s) => s.visible)}
              highlightId={highlightId}
              onHover={setHoveredId}
              onSelect={selectFromMap}
              tags={tags}
              selectedTags={selectedTags}
              onToggleTag={(tag) => setSelectedTags((t) => toggleTag(t, tag))}
              onClearTags={() => setSelectedTags([])}
              routeOverlay={routeOverlay}
            />
          </div>
          <PassportGrid
            stops={stops}
            highlightId={highlightId}
            registerCard={registerCard}
            onHover={setHoveredId}
            onOpen={setOpenId}
          />
        </div>
      </main>

      <footer aria-hidden="true" className="h-3 bg-burg" />

      {openStop && <CafeDossierDrawer stop={openStop} onClose={closeDrawer} />}
    </div>
  );
}
