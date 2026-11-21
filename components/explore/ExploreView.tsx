"use client";

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

export function ExploreView(_props: ExploreViewProps) {
  return null;
}
