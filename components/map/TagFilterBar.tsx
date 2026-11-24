"use client";

import type { TagFilterProps } from "@/components/map/types";

const chip =
  "rounded-full border-[1.5px] border-ink px-2.5 py-0.5 font-label text-[10px] font-bold tracking-[0.12em] uppercase transition-colors";

export function TagFilterBar({
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: TagFilterProps) {
  const chipClass = (on: boolean) =>
    `${chip} ${on ? "bg-burg text-pink" : "bg-paper text-ink hover:bg-pink"}`;

  return (
    <div
      role="group"
      aria-label="Filter cafés by tag"
      className="flex flex-wrap gap-1.5 rounded-card border-2 border-ink bg-paper p-2 shadow-hard"
    >
      <button
        type="button"
        aria-pressed={selectedTags.length === 0}
        onClick={onClearTags}
        className={chipClass(selectedTags.length === 0)}
      >
        All
      </button>
      {tags.map((tag) => {
        const on = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={on}
            onClick={() => onToggleTag(tag)}
            className={chipClass(on)}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
