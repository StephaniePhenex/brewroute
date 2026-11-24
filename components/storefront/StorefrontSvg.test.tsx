import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STORE_SKINS, StorefrontSvg } from "./StorefrontSvg";

const LOCKED_FILTER =
  "grayscale(0.95) sepia(0.1) brightness(1.04) contrast(0.9)";

function renderStore(index: number, stamped = true) {
  const { container } = render(
    <StorefrontSvg index={index} name="Moka" stop="01" stamped={stamped} />
  );
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("svg not rendered");
  return { container, svg };
}

function wallFill(svg: SVGSVGElement) {
  return svg.querySelector("rect")?.getAttribute("fill");
}

describe("StorefrontSvg skins (AC 2.8)", () => {
  it("exports the four Design.md wall tones in stop order", () => {
    expect(STORE_SKINS.map((s) => s.wall)).toEqual([
      "#F5EFE6",
      "#F2B8C6",
      "#9EB09E",
      "#D4A84F",
    ]);
  });

  it.each([
    [0, 0],
    [3, 3],
    [4, 0],
    [9, 1],
    [-1, 3],
    [-6, 2],
  ])("index %i uses skin %i", (index, skin) => {
    expect(wallFill(renderStore(index).svg)).toBe(STORE_SKINS[skin].wall);
  });
});

describe("StorefrontSvg stamp state (AC 4.2)", () => {
  it("renders full color with a STAMPED postmark when stamped", () => {
    const { svg } = renderStore(0, true);
    expect(svg.style.filter).toBe("");
    expect(svg).toHaveAttribute("data-stamped", "true");
    expect(svg).toHaveTextContent("STAMPED");
  });

  it("renders the grayscale filter and no postmark when locked", () => {
    const { svg } = renderStore(0, false);
    expect(svg.style.filter).toBe(LOCKED_FILTER);
    expect(svg).toHaveAttribute("data-stamped", "false");
    expect(svg).not.toHaveTextContent("STAMPED");
  });
});

describe("StorefrontSvg markup", () => {
  it("renders the stop label and is decorative only", () => {
    const { svg } = renderStore(2);
    expect(svg).toHaveTextContent("01");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("gives each instance a unique textPath id", () => {
    const { container } = render(
      <>
        <StorefrontSvg index={1} name="Moka" stop="02" stamped />
        <StorefrontSvg index={1} name="Moka" stop="02" stamped />
      </>
    );
    const ids = Array.from(container.querySelectorAll("defs path")).map(
      (p) => p.id
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    container.querySelectorAll("textPath").forEach((tp, i) => {
      expect(tp.getAttribute("href")).toBe(`#${ids[i]}`);
    });
  });
});
