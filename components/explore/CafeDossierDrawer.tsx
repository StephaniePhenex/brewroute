"use client";

import { useEffect, useRef } from "react";
import type { ExploreStop } from "@/components/explore/types";
import {
  appleMapsUrl,
  criterionAverages,
  formatRating,
  googleMapsUrl,
} from "@/lib/exploreUtils";

// Archive dates are stored in UTC and shown in Vancouver time.
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Vancouver",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CRITERIA = [
  { key: "coffeeQuality", label: "Coffee quality" },
  { key: "ambiance", label: "Ambiance" },
  { key: "workspaceFriendliness", label: "Workspace friendliness" },
] as const;

export interface CafeDossierDrawerProps {
  stop: ExploreStop;
  onClose: () => void;
}

export function CafeDossierDrawer({
  stop: s,
  onClose,
}: CafeDossierDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `dossier-${s.cafe.id}`;
  const criteria = criterionAverages(s.reviews);
  const notes = [...s.reviews].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  useEffect(() => {
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      returnFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[rgba(43,27,23,0.35)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-lg animate-drawer-in flex-col overflow-y-auto rounded-l-drawer border-l-2 border-ink bg-paper"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-2 border-ink bg-pink px-6 py-5">
          <div>
            <p className="font-label text-xs font-bold tracking-[0.18em] text-burg">
              STOP {s.stop} · {s.stamped ? "STAMPED" : "NOT YET STAMPED"}
            </p>
            <h2
              id={titleId}
              className="font-display text-2xl font-bold leading-tight text-burg"
            >
              {s.cafe.name}
            </h2>
            <p className="text-sm text-muted">{s.cafe.address}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close dossier"
            onClick={onClose}
            className="awa-btn flex h-9 w-9 shrink-0 items-center justify-center bg-paper text-ink"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-6 px-6 py-6">
          <section aria-label="Ratings" className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-burg">
                {formatRating(s.rating)}
              </span>
              {s.rating !== null && (
                <span className="text-sm text-muted">
                  / 5 · {s.reviews.length}{" "}
                  {s.reviews.length === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>
            {criteria &&
              CRITERIA.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{label}</span>
                    <span>{criteria[key].toFixed(1)}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={criteria[key]}
                    className="h-[10px] overflow-hidden rounded-full border border-ink bg-paper"
                  >
                    <div
                      className="h-full rounded-full bg-mustard"
                      style={{ width: `${(criteria[key] / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            <div className="flex flex-wrap gap-1">
              {s.cafe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-ink bg-paper px-2 py-0.5 text-[11px] font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section
            aria-label="Community tasting notes"
            className="flex flex-col gap-3"
          >
            <h3 className="font-label text-xs font-bold tracking-[0.18em] text-burg">
              COMMUNITY TASTING NOTES
            </h3>
            {notes.length === 0 ? (
              <p className="text-sm text-muted">
                No tasting notes yet — be the first to stamp this stop.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notes.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-card border-2 border-ink bg-surface p-3 text-sm"
                  >
                    <p className="font-serif text-base italic">“{r.note}”</p>
                    <p className="mt-2 font-mono text-[11px] text-muted">
                      {r.authorName} ·{" "}
                      {dateFormat.format(new Date(r.createdAt))} · C
                      {r.coffeeQuality}/A{r.ambiance}/W
                      {r.workspaceFriendliness}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Directions" className="flex flex-wrap gap-3">
            <a
              href={googleMapsUrl(s.cafe)}
              target="_blank"
              rel="noopener noreferrer"
              className="awa-btn bg-paper px-4 py-2 font-label text-sm font-semibold"
            >
              Open in Google Maps
            </a>
            <a
              href={appleMapsUrl(s.cafe)}
              target="_blank"
              rel="noopener noreferrer"
              className="awa-btn bg-paper px-4 py-2 font-label text-sm font-semibold"
            >
              Open in Apple Maps
            </a>
          </section>

          <p className="rounded-card border-[1.5px] border-dashed border-lockedLine bg-lockedBg p-4 text-sm text-lockedInk">
            Check-ins are opening soon — your rating and tasting note will
            unlock this café&apos;s colours.
          </p>
        </div>
      </div>
    </div>
  );
}
