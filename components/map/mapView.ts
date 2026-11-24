import type { CityMapPin } from "@/components/map/types";

// Downtown Vancouver, shown when a season has no live cafés yet.
export const FALLBACK_CENTER: LatLngTuple = [49.2827, -123.1207];
export const FALLBACK_ZOOM = 13;
export const SINGLE_PIN_ZOOM = 15;

export type LatLngTuple = [number, number];

export type InitialMapView =
  | { kind: "bounds"; bounds: LatLngTuple[] }
  | { kind: "center"; center: LatLngTuple; zoom: number };

export function initialMapView(
  _pins: readonly Pick<CityMapPin, "cafe">[]
): InitialMapView {
  throw new Error("not implemented");
}
