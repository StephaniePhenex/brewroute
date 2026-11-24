import type { CityMapPin } from "@/components/map/types";

// Downtown Vancouver, shown when a season has no live cafés yet.
export const FALLBACK_CENTER: LatLngTuple = [49.2827, -123.1207];
export const FALLBACK_ZOOM = 13;
export const SINGLE_PIN_ZOOM = 15;

export type LatLngTuple = [number, number];

export type InitialMapView =
  | { kind: "bounds"; bounds: LatLngTuple[] }
  | { kind: "center"; center: LatLngTuple; zoom: number };

/**
 * Starting view for CityMap. Leaflet throws on empty bounds and zooms to the
 * max on zero-area bounds, so only fit bounds when there are two or more pins.
 */
export function initialMapView(
  pins: readonly Pick<CityMapPin, "cafe">[]
): InitialMapView {
  const points = pins
    .map(({ cafe }): LatLngTuple => [cafe.latitude, cafe.longitude])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  if (points.length === 0)
    return { kind: "center", center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM };
  if (points.length === 1)
    return { kind: "center", center: points[0], zoom: SINGLE_PIN_ZOOM };
  return { kind: "bounds", bounds: points };
}
