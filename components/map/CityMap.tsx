"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import { STORE_SKINS } from "@/components/storefront";
import { TagFilterBar } from "@/components/map/TagFilterBar";
import type { CityMapPin, CityMapProps } from "@/components/map/types";
import { skinIndex } from "@/lib/exploreUtils";

// CARTO basemaps require a free key outside the CARTO platform (since Sept
// 2026); without one tiles render an "API KEY REQUIRED" watermark. The key is
// sent from the browser, so it is a public NEXT_PUBLIC_ value, not a secret.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_BASEMAPS_KEY;
const TILE_URL = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${
  CARTO_KEY ? `?key=${encodeURIComponent(CARTO_KEY)}` : ""
}`;
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const OCTAGON =
  "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)";

// Static per café so Leaflet never swaps the focused DOM node; highlight is a
// data attribute toggled on the existing element (see CafePin).
function pinIcon(fill: string, stamped: boolean): L.DivIcon {
  const lockedFilter = stamped ? "" : "filter:grayscale(0.95);";
  const badge = stamped
    ? `<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:9999px;background:#9EB09E;border:1px solid #3B2621;color:#3B2621;font:700 7px/8px sans-serif;text-align:center">✓</span>`
    : "";
  return L.divIcon({
    className: "group",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="position:relative;display:grid;place-items:center;width:22px;height:22px">
      <span class="opacity-0 transition-opacity duration-200 group-data-[highlighted=true]:opacity-100" style="position:absolute;inset:0;clip-path:${OCTAGON};background:#D4A84F"></span>
      <span style="position:relative;display:grid;place-items:center;width:15px;height:15px;clip-path:${OCTAGON};background:#3B2621">
        <span style="width:11px;height:11px;clip-path:${OCTAGON};background:${fill};${lockedFilter}"></span>
      </span>
      ${badge}
    </span>`,
  });
}

interface CafePinProps {
  pin: CityMapPin;
  highlighted: boolean;
  onHover: (cafeId: string | null) => void;
  onSelect: (cafeId: string) => void;
}

function CafePin({ pin, highlighted, onHover, onSelect }: CafePinProps) {
  const { cafe, index, stamped } = pin;
  const markerRef = useRef<L.Marker>(null);
  const handlers = useRef({ onHover, onSelect });
  handlers.current = { onHover, onSelect };

  const fill = stamped ? STORE_SKINS[skinIndex(index)].wall : "#EAE7E1";
  const icon = useMemo(() => pinIcon(fill, stamped), [fill, stamped]);
  const label = `${cafe.name}, ${stamped ? "stamped" : "not stamped"}`;

  // Leaflet 1.9 gives keyboard-enabled marker icons tabindex=0 and role=button
  // but no key activation; we add the label, focus → hover sync, and Enter/Space.
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    el.setAttribute("aria-label", label);
    const focus = () => handlers.current.onHover(cafe.id);
    const blur = () => handlers.current.onHover(null);
    const keydown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      handlers.current.onSelect(cafe.id);
    };
    el.addEventListener("focus", focus);
    el.addEventListener("blur", blur);
    el.addEventListener("keydown", keydown);
    return () => {
      el.removeEventListener("focus", focus);
      el.removeEventListener("blur", blur);
      el.removeEventListener("keydown", keydown);
    };
  }, [cafe.id, icon, label]);

  useEffect(() => {
    markerRef.current
      ?.getElement()
      ?.setAttribute("data-highlighted", String(highlighted));
    markerRef.current?.setZIndexOffset(highlighted ? 1000 : 0);
  }, [highlighted, icon]);

  const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({
      mouseover: () => handlers.current.onHover(cafe.id),
      mouseout: () => handlers.current.onHover(null),
      click: () => handlers.current.onSelect(cafe.id),
    }),
    [cafe.id]
  );

  return (
    <Marker
      ref={markerRef}
      position={[cafe.latitude, cafe.longitude]}
      icon={icon}
      keyboard
      title={cafe.name}
      eventHandlers={eventHandlers}
    />
  );
}

export function CityMap({
  pins,
  highlightId,
  onHover,
  onSelect,
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  routeOverlay,
}: CityMapProps) {
  // Fit once to the initial (unfiltered) pins; filtering should not jump the map.
  const initialBounds = useRef(
    L.latLngBounds(pins.map((p) => [p.cafe.latitude, p.cafe.longitude]))
  );

  return (
    <div className="relative isolate h-full overflow-hidden rounded-card border-2 border-ink shadow-hard [&_.leaflet-tile-pane]:[filter:sepia(0.35)_saturate(0.85)_brightness(1.02)]">
      <MapContainer
        bounds={initialBounds.current}
        boundsOptions={{
          paddingTopLeft: [40, 90],
          paddingBottomRight: [40, 40],
        }}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "#E6DCC5" }}
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} subdomains="abcd" />
        <ZoomControl position="bottomright" />
        {pins.map((pin) => (
          <CafePin
            key={pin.cafe.id}
            pin={pin}
            highlighted={highlightId === pin.cafe.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
        {routeOverlay && routeOverlay.points.length > 1 && (
          <Polyline
            positions={routeOverlay.points.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#6B2133", weight: 2.6, dashArray: "6 4" }}
          />
        )}
      </MapContainer>

      <div className="absolute left-[10px] right-[10px] top-[10px] z-[1000]">
        <TagFilterBar
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={onToggleTag}
          onClearTags={onClearTags}
        />
      </div>
    </div>
  );
}
