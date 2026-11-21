import type { ReactElement } from "react";

// Storefront façades for the hero streetscape — see docs/Design.md §2.
// Stops cycle through four skins in lockstep with map pins and passport cards (`index % 4`).

export type StorefrontSkinName = "cream" | "rose" | "sage" | "ochre";

export interface StorefrontSkin {
  name: StorefrontSkinName;
  wall: string;
  ink: string;
  frame: string;
  trim: string;
  /** Alternating awning stripes; skins with a panelled fascia have none. */
  awning: readonly [string, string] | null;
}

export const STOREFRONT_SKINS: readonly StorefrontSkin[] = [
  {
    name: "cream",
    wall: "#F5EFE6",
    ink: "#6B2133",
    frame: "#FCF8F1",
    trim: "#E6D8C2",
    awning: ["#8E9AA3", "#F2DCC4"],
  },
  {
    name: "rose",
    wall: "#F2B8C6",
    ink: "#5E1D2E",
    frame: "#F8D2DB",
    trim: "#E29AAE",
    awning: ["#F2B8C6", "#FBF4EA"],
  },
  {
    name: "sage",
    wall: "#9EB09E",
    ink: "#1F2D24",
    frame: "#B4C3B2",
    trim: "#879A88",
    awning: null,
  },
  {
    name: "ochre",
    wall: "#D4A84F",
    ink: "#362218",
    frame: "#E2C27E",
    trim: "#B88D3A",
    awning: null,
  },
];

// Fixed illustration accents shared by every skin.
const INK = "#3B2621";
const GLASS = "#848E96";
const TERRACOTTA = "#C98F72";
const FOLIAGE = "#7F9A6E";
const LOCKED_LINE = "#A8A29A";
const BURG = "#6B2133";

export function storefrontSkin(index: number): StorefrontSkin {
  const i = ((Math.trunc(index) % 4) + 4) % 4;
  return STOREFRONT_SKINS[i];
}

export function stopLabel(index: number): string {
  return String(Math.trunc(index) + 1).padStart(2, "0");
}

export interface StorefrontSvgProps {
  /** Zero-based position in the active season's café order. */
  index: number;
  name: string;
  /** `true` renders full pastel; `false` renders the locked grayscale state. */
  stamped: boolean;
  className?: string;
}

// Shopfront geometry (viewBox 0 0 320 274).
const WINDOW = { x: 52, y: 140, w: 108, h: 92 } as const;
const DOOR = { x: 196, y: 138, w: 68, h: 130 } as const;
const AWNING = { x: 36, y: 90, w: 248, h: 22, stripes: 8 } as const;

export default function StorefrontSvg({
  index,
  name,
  stamped,
  className = "",
}: StorefrontSvgProps): ReactElement {
  const skin = storefrontSkin(index);
  const stop = stopLabel(index);
  const longName = name.length > 16;

  return (
    <svg
      viewBox="0 0 320 274"
      role="img"
      aria-label={`Stop ${stop}: ${name}, ${stamped ? "stamped" : "not yet stamped"}`}
      data-stamped={stamped}
      data-skin={skin.name}
      className={`block h-auto w-full transition-[filter] duration-500 ease-in-out motion-reduce:transition-none ${
        stamped ? "" : "grayscale"
      } ${className}`}
    >
      {/* Cornice and wall */}
      <rect
        x={12}
        y={8}
        width={296}
        height={18}
        rx={5}
        fill={skin.trim}
        stroke={INK}
        strokeWidth={2}
      />
      <rect
        x={20}
        y={24}
        width={280}
        height={250}
        rx={3}
        fill={skin.wall}
        stroke={INK}
        strokeWidth={2}
      />

      {skin.name === "rose" && <BrickQuoins color={skin.trim} />}
      {skin.awning === null && <Pilasters skin={skin} />}

      {/* Fascia sign */}
      <rect
        x={44}
        y={38}
        width={232}
        height={42}
        rx={9}
        fill={skin.frame}
        stroke={INK}
        strokeWidth={2}
      />
      {skin.awning === null && (
        <rect
          x={52}
          y={45}
          width={216}
          height={28}
          rx={6}
          fill="none"
          stroke={skin.trim}
          strokeWidth={2}
        />
      )}
      <text
        x={160}
        y={65}
        textAnchor="middle"
        fill={skin.ink}
        fontSize={longName ? 15 : 19}
        fontWeight={700}
        letterSpacing="0.12em"
        textLength={longName ? 200 : undefined}
        lengthAdjust="spacingAndGlyphs"
        style={{ fontFamily: "var(--font-label), sans-serif" }}
      >
        {name.toUpperCase()}
      </text>

      {skin.awning !== null ? (
        <Awning colors={skin.awning} />
      ) : skin.name === "ochre" ? (
        <TransomPanes skin={skin} />
      ) : (
        <rect
          x={44}
          y={98}
          width={232}
          height={8}
          rx={4}
          fill={skin.trim}
          stroke={INK}
          strokeWidth={1.5}
        />
      )}

      {/* Display window */}
      <rect
        x={WINDOW.x - 6}
        y={WINDOW.y - 6}
        width={WINDOW.w + 12}
        height={WINDOW.h + 12}
        rx={8}
        fill={skin.frame}
        stroke={INK}
        strokeWidth={2}
      />
      <rect
        x={WINDOW.x}
        y={WINDOW.y}
        width={WINDOW.w}
        height={WINDOW.h}
        rx={5}
        fill={GLASS}
        stroke={INK}
        strokeWidth={1.5}
      />
      <line
        x1={WINDOW.x + WINDOW.w / 2}
        y1={WINDOW.y}
        x2={WINDOW.x + WINDOW.w / 2}
        y2={WINDOW.y + WINDOW.h}
        stroke={skin.frame}
        strokeWidth={4}
      />
      <line
        x1={WINDOW.x}
        y1={WINDOW.y + 26}
        x2={WINDOW.x + WINDOW.w}
        y2={WINDOW.y + 26}
        stroke={skin.frame}
        strokeWidth={4}
      />
      {skin.name === "rose" && <CupDecal color={skin.frame} />}

      {/* Door */}
      <path
        d={`M${DOOR.x} ${DOOR.y + DOOR.h} V${DOOR.y + DOOR.w / 2} a${DOOR.w / 2} ${DOOR.w / 2} 0 0 1 ${DOOR.w} 0 V${DOOR.y + DOOR.h} Z`}
        fill={skin.frame}
        stroke={INK}
        strokeWidth={2}
      />
      <path
        d={`M${DOOR.x + 12} ${DOOR.y + 84} V${DOOR.y + DOOR.w / 2 + 2} a22 22 0 0 1 44 0 V${DOOR.y + 84} Z`}
        fill={GLASS}
        stroke={INK}
        strokeWidth={1.5}
      />
      <rect
        x={DOOR.x + 12}
        y={DOOR.y + 92}
        width={44}
        height={30}
        rx={4}
        fill="none"
        stroke={skin.trim}
        strokeWidth={2}
      />
      <circle cx={DOOR.x + DOOR.w - 10} cy={DOOR.y + 88} r={3} fill={INK} />
      <text
        x={DOOR.x + DOOR.w / 2}
        y={DOOR.y + 28}
        textAnchor="middle"
        fill={skin.frame}
        fontSize={13}
        fontWeight={700}
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        {stop}
      </text>
      {skin.name === "sage" && <OpenSign skin={skin} />}
      <rect
        x={DOOR.x - 8}
        y={266}
        width={DOOR.w + 16}
        height={8}
        rx={3}
        fill={skin.trim}
        stroke={INK}
        strokeWidth={1.5}
      />

      {skin.name === "cream" && (
        <>
          <FlowerBox />
          <Topiary cx={36} />
          <Topiary cx={282} />
        </>
      )}

      {stamped ? (
        <Postmark />
      ) : (
        <rect
          x={5}
          y={3}
          width={310}
          height={268}
          rx={14}
          fill="none"
          stroke={LOCKED_LINE}
          strokeWidth={1.5}
          strokeDasharray="7 5"
        />
      )}
    </svg>
  );
}

function Awning({
  colors,
}: {
  colors: readonly [string, string];
}): ReactElement {
  const w = AWNING.w / AWNING.stripes;
  return (
    <g stroke={INK} strokeWidth={1.5} strokeLinejoin="round">
      {Array.from({ length: AWNING.stripes }, (_, i) => (
        <path
          key={i}
          d={`M${AWNING.x + i * w} ${AWNING.y} h${w} v${AWNING.h} a${w / 2} ${w / 2} 0 0 1 ${-w} 0 Z`}
          fill={colors[i % 2]}
        />
      ))}
      <rect
        x={AWNING.x - 4}
        y={AWNING.y - 6}
        width={AWNING.w + 8}
        height={8}
        rx={4}
        fill={colors[0]}
      />
    </g>
  );
}

function BrickQuoins({ color }: { color: string }): ReactElement {
  return (
    <g fill={color} stroke={INK} strokeWidth={1}>
      {Array.from({ length: 15 }, (_, i) => {
        const y = 30 + i * 16;
        const w = i % 2 === 0 ? 18 : 12;
        return (
          <g key={i}>
            <rect x={22} y={y} width={w} height={12} rx={2} />
            <rect x={298 - w} y={y} width={w} height={12} rx={2} />
          </g>
        );
      })}
    </g>
  );
}

function Pilasters({ skin }: { skin: StorefrontSkin }): ReactElement {
  return (
    <g stroke={INK} strokeWidth={1.5}>
      {[24, 280].map((x) => (
        <g key={x}>
          <rect x={x} y={30} width={16} height={244} rx={3} fill={skin.frame} />
          <rect
            x={x - 3}
            y={30}
            width={22}
            height={10}
            rx={3}
            fill={skin.trim}
          />
          <rect
            x={x - 3}
            y={262}
            width={22}
            height={12}
            rx={3}
            fill={skin.trim}
          />
        </g>
      ))}
    </g>
  );
}

function TransomPanes({ skin }: { skin: StorefrontSkin }): ReactElement {
  const panes = [
    { x: WINDOW.x - 6, w: WINDOW.w + 12, n: 3 },
    { x: DOOR.x, w: DOOR.w, n: 2 },
  ];
  return (
    <g stroke={INK} strokeWidth={1.5}>
      {panes.map(({ x, w, n }) => (
        <g key={x}>
          <rect x={x} y={94} width={w} height={32} rx={6} fill={skin.frame} />
          {Array.from({ length: n }, (_, i) => {
            const pw = (w - 8 - (n - 1) * 4) / n;
            return (
              <rect
                key={i}
                x={x + 4 + i * (pw + 4)}
                y={98}
                width={pw}
                height={24}
                rx={3}
                fill={GLASS}
              />
            );
          })}
        </g>
      ))}
    </g>
  );
}

function CupDecal({ color }: { color: string }): ReactElement {
  const cx = WINDOW.x + WINDOW.w / 2;
  const cy = WINDOW.y + 62;
  return (
    <g
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={`M${cx - 16} ${cy - 10} h32 v8 a16 16 0 0 1 -32 0 Z`}
        fill={color}
      />
      <path d={`M${cx + 16} ${cy - 6} a7 7 0 0 1 0 12`} />
      <path
        d={`M${cx - 6} ${cy - 16} q-4 -5 0 -10 M${cx + 6} ${cy - 16} q-4 -5 0 -10`}
        strokeWidth={2}
      />
    </g>
  );
}

function OpenSign({ skin }: { skin: StorefrontSkin }): ReactElement {
  const cx = DOOR.x + DOOR.w / 2;
  const top = DOOR.y + 54;
  return (
    <g>
      <path
        d={`M${cx - 14} ${top + 8} L${cx} ${top} L${cx + 14} ${top + 8}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.2}
      />
      <rect
        x={cx - 22}
        y={top + 8}
        width={44}
        height={18}
        rx={5}
        fill="#F5EFE6"
        stroke={INK}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={top + 21}
        textAnchor="middle"
        fill={skin.ink}
        fontSize={10}
        fontWeight={700}
        letterSpacing="0.14em"
        style={{ fontFamily: "var(--font-label), sans-serif" }}
      >
        OPEN
      </text>
    </g>
  );
}

function FlowerBox(): ReactElement {
  const y = WINDOW.y + WINDOW.h + 6;
  return (
    <g stroke={INK} strokeWidth={1.5}>
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={i}
          cx={WINDOW.x + 4 + i * 20}
          cy={y}
          r={8}
          fill={FOLIAGE}
        />
      ))}
      <rect
        x={WINDOW.x - 8}
        y={y}
        width={WINDOW.w + 16}
        height={16}
        rx={4}
        fill={TERRACOTTA}
      />
    </g>
  );
}

function Topiary({ cx }: { cx: number }): ReactElement {
  return (
    <g stroke={INK} strokeWidth={1.5}>
      <line x1={cx} y1={232} x2={cx} y2={254} />
      <circle cx={cx} cy={222} r={13} fill={FOLIAGE} />
      <path
        d={`M${cx - 11} 252 h22 l-3 20 h-16 Z`}
        fill={TERRACOTTA}
        strokeLinejoin="round"
      />
    </g>
  );
}

function Postmark(): ReactElement {
  return (
    <g
      transform={`translate(${WINDOW.x + WINDOW.w / 2} ${WINDOW.y + 48}) rotate(-10)`}
    >
      <g
        className="animate-stamp-in motion-reduce:animate-none"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          mixBlendMode: "multiply",
        }}
        fill="none"
        stroke={BURG}
      >
        <circle r={36} strokeWidth={3} fill="#F7C5D0" fillOpacity={0.35} />
        <circle r={29} strokeWidth={1.2} />
        <text
          y={5}
          textAnchor="middle"
          fill={BURG}
          stroke="none"
          fontSize={11}
          fontWeight={700}
          letterSpacing="0.08em"
          style={{ fontFamily: "var(--font-label), sans-serif" }}
        >
          STAMPED
        </text>
        <line x1={-22} y1={-12} x2={22} y2={-12} strokeWidth={1.2} />
        <line x1={-22} y1={14} x2={22} y2={14} strokeWidth={1.2} />
      </g>
    </g>
  );
}
