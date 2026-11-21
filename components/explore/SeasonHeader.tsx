import type { RaffleProgress, Season } from "@/lib/types/explore";

export interface SeasonHeaderProps {
  season: Season;
  progress: RaffleProgress;
}

export function SeasonHeader({ season, progress }: SeasonHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-label text-xs font-semibold tracking-[0.18em] text-muted">
          THIS SEASON
        </p>
        <h2 className="font-display text-3xl font-bold text-burg md:text-4xl">
          {season.name}
        </h2>
        <p className="font-serif text-lg italic text-muted">{season.theme}</p>
      </div>

      <div className="flex max-w-xl flex-col gap-2">
        <div
          role="progressbar"
          aria-label="Raffle progress"
          aria-valuemin={0}
          aria-valuemax={progress.max}
          aria-valuenow={progress.value}
          className="h-[14px] overflow-hidden rounded-full border-2 border-ink bg-paper"
        >
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-500 motion-reduce:transition-none ${
              progress.complete ? "bg-sage" : "bg-mustard"
            }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="font-label text-sm font-semibold text-ink">
          {progress.value} / {progress.max} cafés visited to unlock raffle entry
        </p>
      </div>
    </div>
  );
}
