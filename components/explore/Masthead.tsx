import Link from "next/link";

const TABS = [
  { label: "EXPLORE", href: "/" },
  { label: "STAMP", href: "/stamp" },
  { label: "CONCIERGE", href: "/concierge" },
] as const;

type Tab = (typeof TABS)[number]["label"];

function MokaPot() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="#F7C5D0"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 2.5h5l-.5 2h-4z" />
      <path d="M8.5 4.5h7l1.5 7H7z" />
      <path d="M7 11.5h10l-2 9.5H9z" />
      <path d="M17 6h2.5l-1.8 4.5" />
      <path d="M8.5 6.5 6 5.5" />
    </svg>
  );
}

export interface MastheadProps {
  active: Tab;
  /** `"X/Y STAMPS"` or `"SIGNED OUT"`. */
  counter: string;
}

export function Masthead({ active, counter }: MastheadProps) {
  return (
    <header className="relative flex min-h-[150px] flex-col items-center justify-center gap-3 bg-pink px-6 py-6 md:px-12">
      <div className="flex items-center gap-3">
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-burg">
          <MokaPot />
        </span>
        <h1 className="font-display text-4xl font-bold tracking-wide text-burg md:text-5xl">
          BREWROUTE
        </h1>
      </div>

      <nav aria-label="Explorer sections">
        <ul className="flex items-center gap-1 font-label text-[13px] font-semibold tracking-[0.18em] text-burg">
          {TABS.map((tab, i) => (
            <li key={tab.label} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">•</span>}
              <Link
                href={tab.href}
                aria-current={tab.label === active ? "page" : undefined}
                className={`rounded-full px-3 py-1 transition-colors ${
                  tab.label === active
                    ? "bg-burg text-pink"
                    : "hover:bg-burg/10"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="font-label text-base font-bold tracking-[0.12em] text-burg md:absolute md:right-12 md:top-6">
        {counter}
      </p>
    </header>
  );
}
