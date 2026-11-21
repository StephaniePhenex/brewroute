import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExploreView } from "@/components/explore/ExploreView";
import type { CityMapProps } from "@/components/map/types";
import { MOCK_EXPLORE_DATA, MOCK_EXPLORER } from "@/lib/mocks/explore";

// Leaflet cannot render in jsdom. Swap the client map for a stub that honours
// the same CityMapProps contract: the real TagFilterBar plus one button per pin.
vi.mock("@/components/map/CityMapClient", async () => {
  const { TagFilterBar } = await import("@/components/map/TagFilterBar");
  function CityMapClient(props: CityMapProps) {
    return (
      <div>
        <TagFilterBar
          tags={props.tags}
          selectedTags={props.selectedTags}
          onToggleTag={props.onToggleTag}
          onClearTags={props.onClearTags}
        />
        {props.pins.map(({ cafe, stamped }) => (
          <button
            key={cafe.id}
            type="button"
            data-testid={`pin-${cafe.id}`}
            data-stamped={String(stamped)}
            data-highlighted={String(props.highlightId === cafe.id)}
            onMouseEnter={() => props.onHover(cafe.id)}
            onMouseLeave={() => props.onHover(null)}
            onClick={() => props.onSelect(cafe.id)}
          >
            {cafe.name}
          </button>
        ))}
      </div>
    );
  }
  return { CityMapClient };
});

const LIVE_IDS = [
  "cafe-paper-lantern",
  "cafe-rosehip",
  "cafe-fern-filter",
  "cafe-ochre-hour",
  "cafe-little-atlas",
  "cafe-gilded-kettle",
];

const scrollSpy = vi.fn();

beforeEach(() => {
  scrollSpy.mockClear();
  Element.prototype.scrollIntoView = scrollSpy;
});

function renderSignedIn() {
  return render(
    <ExploreView data={MOCK_EXPLORE_DATA} session={MOCK_EXPLORER} />
  );
}

const storefront = (id: string) => screen.getByTestId(`storefront-${id}`);
const pin = (id: string) => screen.queryByTestId(`pin-${id}`);
const card = (id: string) => screen.queryByTestId(`card-${id}`);

describe("AC 4.1 — masthead navigation and stamp counter", () => {
  it("highlights EXPLORE and shows X/Y STAMPS when signed in", () => {
    renderSignedIn();
    const nav = screen.getByRole("navigation", { name: /explorer/i });
    expect(within(nav).getByText("EXPLORE")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(within(nav).getByText("STAMP")).not.toHaveAttribute("aria-current");
    expect(within(nav).getByText("CONCIERGE")).toBeInTheDocument();
    expect(screen.getByText("2/6 STAMPS")).toBeInTheDocument();
  });

  it("shows SIGNED OUT and renders every stop locked when signed out", () => {
    render(<ExploreView data={MOCK_EXPLORE_DATA} session={null} />);
    expect(screen.getByText("SIGNED OUT")).toBeInTheDocument();
    for (const id of LIVE_IDS) {
      expect(storefront(id)).toHaveAccessibleName(/not stamped$/);
      expect(pin(id)).toHaveAttribute("data-stamped", "false");
      expect(
        within(card(id)!).getByText("Unstamped — click to check in")
      ).toBeInTheDocument();
    }
  });
});

describe("AC 4.2 / 4.4 — streetscape, season header, and progress", () => {
  it("renders one storefront per live café (soft-deleted omitted)", () => {
    renderSignedIn();
    const street = screen.getByRole("region", { name: "Streetscape" });
    expect(within(street).getAllByRole("button")).toHaveLength(6);
    expect(screen.queryByTestId("storefront-cafe-marigold")).toBeNull();
    expect(storefront("cafe-paper-lantern")).toHaveAccessibleName(
      "Stop 01, Paper Lantern Coffee, stamped"
    );
    expect(storefront("cafe-rosehip")).toHaveAccessibleName(
      "Stop 02, Rosehip Espresso Bar, not stamped"
    );
  });

  it("shows the season title and a 2 / 3 raffle progress bar", () => {
    renderSignedIn();
    expect(
      screen.getByRole("heading", { name: "Autumn Pour-Over Crawl" })
    ).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: /raffle/i });
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
    expect(
      screen.getByText("2 / 3 cafés visited to unlock raffle entry")
    ).toBeInTheDocument();
  });
});

describe("AC 4.5 — multi-tag AND filter", () => {
  it("hides non-matching pins and cards, dims storefronts, and All resets", async () => {
    const user = userEvent.setup();
    renderSignedIn();

    await user.click(screen.getByRole("button", { name: "quiet" }));
    await user.click(screen.getByRole("button", { name: "wifi" }));
    expect(screen.getByRole("button", { name: "quiet" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    const matching = ["cafe-paper-lantern", "cafe-little-atlas"];
    for (const id of LIVE_IDS) {
      const hit = matching.includes(id);
      expect(Boolean(pin(id))).toBe(hit);
      expect(Boolean(card(id))).toBe(hit);
      // Storefronts stay on the street but dim when filtered out.
      expect(storefront(id)).toHaveStyle({ opacity: hit ? "1" : "0.38" });
    }

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    for (const id of LIVE_IDS) {
      expect(pin(id)).not.toBeNull();
      expect(card(id)).not.toBeNull();
      expect(storefront(id)).toHaveStyle({ opacity: "1" });
    }
  });
});

describe("AC 4.6 — stamped vs unstamped styling", () => {
  it("badges stamped cards and slots unstamped cards", () => {
    renderSignedIn();
    expect(
      within(card("cafe-paper-lantern")!).getByText("✓ STAMPED")
    ).toBeInTheDocument();
    expect(pin("cafe-paper-lantern")).toHaveAttribute("data-stamped", "true");
    expect(
      within(card("cafe-rosehip")!).getByText("Unstamped — click to check in")
    ).toBeInTheDocument();
    expect(within(card("cafe-rosehip")!).queryByText("✓ STAMPED")).toBeNull();
  });
});

describe("AC 4.7 — three-way synchronised highlight", () => {
  const expectHighlighted = (id: string) => {
    expect(storefront(id)).toHaveAttribute("data-highlighted", "true");
    expect(pin(id)).toHaveAttribute("data-highlighted", "true");
    expect(card(id)).toHaveAttribute("data-highlighted", "true");
  };

  it("syncs hover from storefront, pin, and card focus; leaving clears", async () => {
    const user = userEvent.setup();
    renderSignedIn();

    await user.hover(storefront("cafe-fern-filter"));
    expectHighlighted("cafe-fern-filter");

    await user.unhover(storefront("cafe-fern-filter"));
    await user.hover(pin("cafe-ochre-hour")!);
    expectHighlighted("cafe-ochre-hour");
    expect(storefront("cafe-fern-filter")).toHaveAttribute(
      "data-highlighted",
      "false"
    );

    await user.unhover(pin("cafe-ochre-hour")!);
    act(() => card("cafe-rosehip")!.focus());
    expectHighlighted("cafe-rosehip");

    act(() => card("cafe-rosehip")!.blur());
    for (const id of LIVE_IDS) {
      expect(card(id)).toHaveAttribute("data-highlighted", "false");
    }
  });

  it("clicking a pin scrolls its card into view and opens the drawer", async () => {
    const user = userEvent.setup();
    renderSignedIn();
    await user.click(pin("cafe-little-atlas")!);
    expect(scrollSpy.mock.contexts).toContain(card("cafe-little-atlas"));
    expect(
      screen.getByRole("dialog", { name: "Little Atlas Roasters" })
    ).toBeInTheDocument();
  });

  it("clicking a card or storefront opens the drawer", async () => {
    const user = userEvent.setup();
    renderSignedIn();
    await user.click(card("cafe-rosehip")!);
    expect(
      screen.getByRole("dialog", { name: "Rosehip Espresso Bar" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close dossier" }));
    await user.click(storefront("cafe-ochre-hour"));
    expect(
      screen.getByRole("dialog", { name: "Ochre Hour" })
    ).toBeInTheDocument();
  });
});

describe("AC 4.8 — Café Dossier drawer", () => {
  it("shows No ratings yet (never NaN) for a café with zero reviews", async () => {
    const user = userEvent.setup();
    renderSignedIn();
    await user.click(card("cafe-gilded-kettle")!);
    const dialog = screen.getByRole("dialog", { name: "The Gilded Kettle" });
    expect(within(dialog).getByText("No ratings yet")).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/NaN/);
    expect(within(dialog).queryAllByRole("progressbar")).toHaveLength(0);
  });

  it("shows the average, criterion bars, notes, and safe Maps links", async () => {
    const user = userEvent.setup();
    renderSignedIn();
    await user.click(card("cafe-paper-lantern")!);
    const dialog = screen.getByRole("dialog", { name: "Paper Lantern Coffee" });

    // (5+5+4)/3 and (4+5+5)/3 → 4.7
    expect(within(dialog).getByText("4.7")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("progressbar")).toHaveLength(3);
    expect(within(dialog).getByText(/jasmine and peach/)).toBeInTheDocument();

    for (const name of [/google maps/i, /apple maps/i]) {
      const link = within(dialog).getByRole("link", { name });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("is read-only this sprint and closes on Escape", async () => {
    const user = userEvent.setup();
    renderSignedIn();
    await user.click(card("cafe-rosehip")!);
    const dialog = screen.getByRole("dialog", { name: "Rosehip Espresso Bar" });
    expect(dialog.querySelector("form")).toBeNull();
    expect(within(dialog).queryByRole("textbox")).toBeNull();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
