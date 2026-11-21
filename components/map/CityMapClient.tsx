"use client";

import dynamic from "next/dynamic";
import type { CityMapProps } from "@/components/map/types";

// Leaflet touches `window` at import time, so the map is client-only.
const CityMap = dynamic(
  () => import("@/components/map/CityMap").then((m) => m.CityMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="flex h-full items-center justify-center rounded-card border-2 border-ink bg-[#E6DCC5] font-label text-xs font-semibold tracking-[0.18em] text-muted shadow-hard"
      >
        UNFOLDING THE MAP…
      </div>
    ),
  }
);

export function CityMapClient(props: CityMapProps) {
  return <CityMap {...props} />;
}
