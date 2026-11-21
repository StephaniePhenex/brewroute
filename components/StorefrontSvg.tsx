// Storefront façades for the hero streetscape — see docs/Design.md §2.
// Stops cycle through four skins in lockstep with map pins and passport cards (`index % 4`).

export interface StoreSkin {
  wall: string;
  frame: string;
  trim: string;
  /** Alternating awning stripes; skins with a panelled fascia have none. */
  awning: readonly [string, string] | null;
}

const GLASS = "#848E96";

export const STORE_SKINS: readonly StoreSkin[] = [
  {
    wall: "#F5EFE6",
    frame: "#FCF8F1",
    trim: "#E6D8C2",
    awning: ["#8E9AA3", "#F2DCC4"],
  },
  {
    wall: "#F2B8C6",
    frame: "#F8D2DB",
    trim: "#E29AAE",
    awning: ["#F2B8C6", "#FBF4EA"],
  },
  { wall: "#9EB09E", frame: "#B4C3B2", trim: "#879A88", awning: null },
  { wall: "#D4A84F", frame: "#E2C27E", trim: "#B88D3A", awning: null },
];

const LOCKED_FILTER =
  "grayscale(0.95) sepia(0.1) brightness(1.04) contrast(0.9)";

export interface StorefrontSvgProps {
  /** Zero-based position in the active season's café order. */
  index: number;
  name: string;
  /** Stop label shown on the door kick panel, e.g. `"01"`. */
  stop: string;
  /** `true` renders full pastel; `false` renders the locked grayscale state. */
  stamped: boolean;
  className?: string;
}

export function StorefrontSvg({
  index,
  name,
  stop,
  stamped,
  className = "",
}: StorefrontSvgProps) {
  const variant = ((index % 4) + 4) % 4;
  const k = STORE_SKINS[variant];
  const awning = k.awning;
  const S = {
    stroke: "#3B2621",
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
  };
  const T = {
    stroke: "#3B2621",
    strokeWidth: 1,
    strokeLinejoin: "round" as const,
  };
  const upperName = name.toUpperCase();
  const arcId = `arc-${index}-${stop}`;

  const upper = (cx: number) => (
    <g key={cx}>
      {variant === 0 && (
        <polygon
          points={`${cx - 30},26 ${cx},12 ${cx + 30},26`}
          fill={k.trim}
          {...S}
        />
      )}
      {variant === 1 && (
        <path
          d={`M${cx - 30},27 Q${cx},6 ${cx + 30},27 Z`}
          fill={k.frame}
          {...S}
        />
      )}
      {variant >= 2 && (
        <rect x={cx - 31} y="19" width="62" height="8" fill={k.frame} {...S} />
      )}
      <rect x={cx - 26} y="27" width="52" height="68" fill={k.frame} {...S} />
      <rect x={cx - 20} y="33" width="40" height="56" fill={GLASS} {...S} />
      <line x1={cx} y1="33" x2={cx} y2="89" {...T} />
      <line x1={cx - 20} y1="52" x2={cx + 20} y2="52" {...T} />
      <line x1={cx - 20} y1="71" x2={cx + 20} y2="71" {...T} />
      <rect x={cx - 30} y="95" width="60" height="6" fill={k.frame} {...S} />
      {variant === 0 && (
        <g>
          {[-15, -5, 5, 15].map((d) => (
            <circle
              key={d}
              cx={cx + d}
              cy="102"
              r="5.5"
              fill="#7F9A6E"
              {...T}
            />
          ))}
          <rect
            x={cx - 23}
            y="102"
            width="46"
            height="9"
            fill="#C98F72"
            {...S}
          />
        </g>
      )}
    </g>
  );

  const chairL = (x: number) => (
    <path
      d={`M${x},272 V246 a6,6 0 0 1 12,0 V258 M${x},258 H${x + 16} V272 M${x + 4},242 V258 M${x + 8},242 V258`}
      fill="none"
      {...S}
    />
  );
  const chairR = (x: number) => (
    <path
      d={`M${x},272 V246 a6,6 0 0 0 -12,0 V258 M${x},258 H${x - 16} V272 M${x - 4},242 V258 M${x - 8},242 V258`}
      fill="none"
      {...S}
    />
  );
  const bistro = (x: number) => (
    <g key={x}>
      {chairL(x - 34)}
      {chairR(x + 34)}
      <ellipse cx={x} cy="250" rx="14" ry="2.6" fill={k.frame} {...S} />
      <line x1={x} y1="252" x2={x} y2="271" {...S} />
      <line x1={x - 7} y1="272" x2={x + 7} y2="272" {...S} />
    </g>
  );
  const shopWindow = (x: number) => (
    <g key={x}>
      <rect x={x} y="188" width="106" height="78" fill={k.frame} {...S} />
      <rect x={x + 6} y="194" width="94" height="66" fill={GLASS} {...S} />
      {variant >= 2 && (
        <line x1={x + 6} y1="212" x2={x + 100} y2="212" {...T} />
      )}
      {variant === 2 &&
        [37, 69].map((d) => (
          <line key={d} x1={x + d} y1="194" x2={x + d} y2="260" {...T} />
        ))}
      {variant === 3 &&
        [37, 69].map((d) => (
          <line key={d} x1={x + d} y1="194" x2={x + d} y2="212" {...T} />
        ))}
    </g>
  );
  const pilaster = (x: number) => (
    <g key={x}>
      <rect x={x} y="158" width="20" height="114" fill={k.frame} {...S} />
      <rect x={x + 4} y="166" width="12" height="16" fill="none" {...T} />
      <rect x={x + 4} y="190" width="12" height="60" fill="none" {...T} />
      <rect x={x + 4} y="256" width="12" height="10" fill="none" {...T} />
    </g>
  );
  const topiary = (x: number) => (
    <g key={x}>
      <line x1={x} y1="246" x2={x} y2="258" {...S} />
      <ellipse cx={x} cy="236" rx="7" ry="14" fill="#9EB09E" {...S} />
      <polygon
        points={`${x - 8},258 ${x + 8},258 ${x + 6},272 ${x - 6},272`}
        fill="#C98F72"
        {...S}
      />
    </g>
  );

  return (
    <svg
      viewBox="0 0 320 274"
      className={`w-full h-auto block transition-[filter] duration-500 motion-reduce:transition-none ${className}`}
      style={stamped ? undefined : { filter: LOCKED_FILTER }}
      role="img"
      aria-hidden="true"
      data-stamped={stamped}
    >
      <rect x="0" y="0" width="320" height="274" fill={k.wall} />
      {variant === 1 &&
        Array.from({ length: 15 }).map((_, i) => {
          const w = i % 2 ? 10 : 16;
          return (
            <g key={i}>
              <rect
                x="0"
                y={i * 18}
                width={w}
                height="9"
                fill={k.trim}
                {...T}
              />
              <rect
                x={320 - w}
                y={i * 18}
                width={w}
                height="9"
                fill={k.trim}
                {...T}
              />
            </g>
          );
        })}
      {[64, 160, 256].map(upper)}
      {stamped && (
        <g
          transform="translate(112,62) rotate(-8)"
          opacity=".9"
          style={{ mixBlendMode: "multiply" }}
        >
          <circle r="16" fill="none" stroke="#6B2133" strokeWidth="2" />
          <circle r="12" fill="none" stroke="#6B2133" strokeWidth="1" />
          <text
            y="2"
            textAnchor="middle"
            fill="#6B2133"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 5.5,
              fontWeight: 700,
            }}
          >
            STAMPED
          </text>
        </g>
      )}
      <rect x="0" y="112" width="320" height="8" fill={k.trim} {...S} />
      <rect x="14" y="122" width="292" height="32" fill={k.frame} {...S} />
      <rect x="20" y="127" width="280" height="22" fill="none" {...T} />
      <text
        x="160"
        y="143"
        textAnchor="middle"
        fill="#3B2621"
        {...(upperName.length > 18
          ? { textLength: 256, lengthAdjust: "spacingAndGlyphs" as const }
          : {})}
        style={{
          fontFamily: "var(--font-label), sans-serif",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: "3px",
        }}
      >
        {upperName}
      </text>

      {variant >= 2 && (
        <g>
          {pilaster(6)}
          {pilaster(294)}
          <rect x="26" y="158" width="268" height="24" fill={k.frame} {...S} />
          <rect x="32" y="163" width="256" height="14" fill="none" {...T} />
        </g>
      )}
      {shopWindow(26)}
      {shopWindow(188)}
      <rect x="138" y="182" width="44" height="90" fill={k.frame} {...S} />
      <rect x="145" y="196" width="30" height="42" fill={GLASS} {...S} />
      <rect x="145" y="244" width="30" height="22" fill="#F5EFE6" {...T} />
      <text
        x="160"
        y="259"
        textAnchor="middle"
        fill="#6B2133"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {stop}
      </text>
      <line
        x1="171"
        y1="222"
        x2="171"
        y2="234"
        stroke="#3B2621"
        strokeWidth="2"
      />

      {variant === 0 && (
        <text
          x="79"
          y="230"
          textAnchor="middle"
          fill="#D4A84F"
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 24,
          }}
        >
          Café
        </text>
      )}
      {variant === 1 && (
        <g>
          <path
            d="M74,206 c-3,-4 3,-6 0,-10 M80,206 c-3,-4 3,-6 0,-10"
            fill="none"
            stroke="#F5EFE6"
            strokeWidth="1.2"
          />
          <path d="M67,212 h22 v5 a11,9 0 0 1 -22,0 Z" fill="#F5EFE6" {...T} />
          <path
            d="M89,213 a4.5,4.5 0 0 1 0,9"
            fill="none"
            stroke="#F5EFE6"
            strokeWidth="1.5"
          />
          <ellipse cx="78" cy="229" rx="15" ry="2.6" fill="#F5EFE6" {...T} />
          <defs>
            <path id={arcId} d="M209,232 Q241,212 273,232" fill="none" />
          </defs>
          <text
            fill="#F5EFE6"
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-label), sans-serif",
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "2px",
            }}
          >
            <textPath href={`#${arcId}`} startOffset="50%">
              COFFEE
            </textPath>
          </text>
        </g>
      )}
      {variant === 2 && (
        <g>
          <path d="M160,200 L152,208 M160,200 L168,208" fill="none" {...T} />
          <rect x="149" y="208" width="22" height="10" fill="#F5EFE6" {...T} />
          <text
            x="160"
            y="215.5"
            textAnchor="middle"
            fill="#3B2621"
            style={{
              fontFamily: "var(--font-label), sans-serif",
              fontWeight: 700,
              fontSize: 6.5,
            }}
          >
            OPEN
          </text>
        </g>
      )}

      {awning && (
        <g>
          {Array.from({ length: 12 }).map((_, i) => {
            const t0 = 14 + i * (292 / 12);
            const t1 = 14 + (i + 1) * (292 / 12);
            const b0 = 4 + i * 26;
            const b1 = 4 + (i + 1) * 26;
            const fill = awning[i % 2];
            return (
              <g key={i}>
                <polygon
                  points={`${t0},158 ${t1},158 ${b1},186 ${b0},186`}
                  fill={fill}
                  {...S}
                />
                <path d={`M${b0},186 a13,9 0 0 0 26,0 Z`} fill={fill} {...S} />
              </g>
            );
          })}
          <rect x="12" y="155" width="296" height="5" fill={k.trim} {...S} />
        </g>
      )}

      {bistro(79)}
      {bistro(241)}
      {variant === 0 && (
        <>
          {topiary(13)}
          {topiary(307)}
        </>
      )}
      <line x1="0.75" y1="0" x2="0.75" y2="273" {...S} />
      <line
        x1="0"
        y1="272.5"
        x2="320"
        y2="272.5"
        stroke="#3B2621"
        strokeWidth="2"
      />
    </svg>
  );
}
