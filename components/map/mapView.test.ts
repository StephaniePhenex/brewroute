import { describe, expect, it } from "vitest";
import {
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  SINGLE_PIN_ZOOM,
  initialMapView,
} from "@/components/map/mapView";
import { MOCK_CAFES } from "@/lib/mocks/explore";
import type { Cafe } from "@/lib/types/explore";

const pin = (latitude: number, longitude: number) => ({
  cafe: { ...MOCK_CAFES[0], latitude, longitude } satisfies Cafe,
});

describe("initialMapView — empty-season guard for CityMap", () => {
  it("falls back to a fixed center and zoom when there are no pins", () => {
    expect(initialMapView([])).toEqual({
      kind: "center",
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
    });
  });

  it("ignores pins with non-finite coordinates", () => {
    expect(initialMapView([pin(Number.NaN, -123.1)])).toEqual({
      kind: "center",
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
    });
  });

  it("centers on a single pin instead of fitting zero-area bounds", () => {
    expect(initialMapView([pin(49.27, -123.1)])).toEqual({
      kind: "center",
      center: [49.27, -123.1],
      zoom: SINGLE_PIN_ZOOM,
    });
  });

  it("fits bounds around two or more pins", () => {
    expect(initialMapView([pin(49.27, -123.1), pin(49.26, -123.14)])).toEqual({
      kind: "bounds",
      bounds: [
        [49.27, -123.1],
        [49.26, -123.14],
      ],
    });
  });
});
