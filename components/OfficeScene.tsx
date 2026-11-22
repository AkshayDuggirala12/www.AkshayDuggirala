"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";

/* ───────────────────────── geometry ───────────────────────── */
const VIEWBOX = { x: -300, y: 0, w: 1720, h: 720 };
const VB = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`;
const HEAD = { x: 560, y: 245 };

/** Screen position of the developer's head — Hero aims the eyes from here. */
export function getHeadPoint(bounds: DOMRect) {
  const scale = Math.max(bounds.width / VIEWBOX.w, bounds.height / VIEWBOX.h);
  const offsetX = (bounds.width - VIEWBOX.w * scale) / 2;
  const offsetY = (bounds.height - VIEWBOX.h * scale) / 2;
  return {
    x: bounds.left + offsetX + (HEAD.x - VIEWBOX.x) * scale,
    y: bounds.top + offsetY + (HEAD.y - VIEWBOX.y) * scale,
  };
}

/* ───────────────────────── photorealistic procedural skyline ───────────────────────── */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Building = {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  faceFill: string;
  sideFill: string;
  crownH: number;
};
type Mast = { x: number; y: number; h: number };
type Layer = {
  buildings: Building[];
  slabs: string;
  mullions: string;
  warm: string;
  cool: string;
  amber: string;
  dim: string;
  masts: Mast[];
};

function buildRealisticSkyline(
  seed: number,
  facePalette: string[],
  sidePalette: string[],
  size: { hMin: number; hMax: number; wMin: number; wMax: number; depth: number },
  grid: { gx: number; gy: number; litProb: number },
): Layer {
  const r = rng(seed);
  const buildings: Building[] = [];
  const masts: Mast[] = [];
  let slabs = "";
  let mullions = "";
  let warm = "";
  let cool = "";
  let amber = "";
  let dim = "";

  let x = VIEWBOX.x - 60;
  while (x < VIEWBOX.x + VIEWBOX.w + 60) {
    const w = Math.round(size.wMin + r() * (size.wMax - size.wMin));
    const h = Math.round(size.hMin + r() * (size.hMax - size.hMin));
    const y = 560 - h;
    const idx = Math.floor(r() * facePalette.length);
    const crownH = r() < 0.55 ? Math.round(8 + r() * 14) : 0;

    buildings.push({
      x,
      y,
      w,
      h,
      depth: size.depth,
      faceFill: facePalette[idx],
      sideFill: sidePalette[idx],
      crownH,
    });

    for (let sy = y + grid.gy; sy < 556; sy += grid.gy) {
      slabs += `M${x} ${sy}h${w}`;
    }
    for (let sx = x + grid.gx; sx < x + w; sx += grid.gx) {
      mullions += `M${sx} ${y}v${h}`;
    }

    const cols = Math.floor((w - 6) / grid.gx);
    const rows = Math.floor((h - 12) / grid.gy);
    const winW = Math.max(2, grid.gx - 2);
    const winH = Math.max(1.5, Math.round(grid.gy * 0.42));

    for (let j = 0; j < rows; j++) {
      const floorActive = r() < 0.38 ? 2.1 : 0.25;
      const wy = y + 6 + j * grid.gy;
      for (let i = 0; i < cols; i++) {
        const p = r();
        const wx = x + 3 + i * grid.gx;
        const seg = `M${wx} ${wy}h${winW}v${winH}h-${winW}z`;
        if (p < grid.litProb * floorActive) {
          const tone = r();
          if (tone < 0.52) warm += seg;
          else if (tone < 0.85) cool += seg;
          else amber += seg;
        } else if (p < grid.litProb * floorActive + 0.18) {
          dim += seg;
        }
      }
    }

    if (r() < 0.45) {
      masts.push({ x: x + w * (0.35 + r() * 0.3), y: y - crownH, h: 18 + Math.round(r() * 34) });
    }
    x += w + Math.round(r() * 14 - 4);
  }

  return { buildings, slabs, mullions, warm, cool, amber, dim, masts };
}

const FAR_CITY = buildRealisticSkyline(
  14,
  ["#0D1726", "#0F1B2D", "#0B1422"],
  ["#070D17", "#08101B", "#060B14"],
  { hMin: 210, hMax: 420, wMin: 48, wMax: 92, depth: 8 },
  { gx: 5, gy: 7, litProb: 0.16 },
);

const MID_CITY = buildRealisticSkyline(
  29,
  ["#09111E", "#0B1524", "#08101B"],
  ["#050A12", "#060C16", "#04080F"],
  { hMin: 140, hMax: 330, wMin: 64, wMax: 118, depth: 12 },
  { gx: 7, gy: 9, litProb: 0.22 },
);

const NEAR_CITY = buildRealisticSkyline(
  43,
  ["#060C16", "#070E1A", "#050A13"],
  ["#03060C", "#04070E", "#02050A"],
  { hMin: 80, hMax: 220, wMin: 85, wMax: 145, depth: 16 },
  { gx: 9, gy: 12, litProb: 0.24 },
);

const STARS = (() => {
  const r = rng(9);
  return Array.from({ length: 70 }, () => ({
    x: -260 + r() * 1640,
    y: 50 + r() * 240,
    r: 0.4 + r() * 0.9,
    o: 0.2 + r() * 0.55,
  }));
})();

/* ───────────────────────── look settings (easy switches) ───────────────────────── */
/** Your reference photo has no glasses. Set to true to put them back. */
const WEARS_GLASSES = false;
/** Navy shirt colours (light → dark), matching your reference photo. */
const JACKET = ["#456BB5", "#2F4F8E", "#18294F"];

/* ───────────────────────── glossy-floor reflections of the city lights ───────────────────────── */
const FLOOR_STREAKS = (() => {
  const r = rng(31);
  return Array.from({ length: 26 }, () => ({
    x: -250 + r() * 1600,
    w: 2 + r() * 5,
    h: 26 + r() * 70,
    warm: r() < 0.6,
    o: 0.35 + r() * 0.5,
  }));
})();

/* ───────────────────────── voluminous curly hair (built from overlapping curls) ───────────────────────── */
const HAIR_CURLS = (() => {
  const r = rng(77);
  const out: { x: number; y: number; r: number; tone: number }[] = [];
  const ring = (rx: number, ry: number, cy: number, n: number, rMin: number, rMax: number, t0: number, t1: number) => {
    for (let i = 0; i < n; i++) {
      const t = t0 + ((t1 - t0) * (i + r() * 0.6)) / n;
      out.push({
        x: 560 + rx * Math.cos(t) + (r() - 0.5) * 3,
        y: cy + ry * Math.sin(t) + (r() - 0.5) * 3,
        r: rMin + r() * (rMax - rMin),
        tone: r(),
      });
    }
  };
  ring(57, 44, 198, 26, 9, 14, Math.PI * 0.93, Math.PI * 2.07); // outer crown
  ring(42, 31, 192, 16, 9, 13, Math.PI * 1.05, Math.PI * 1.95); // mid layer
  ring(24, 17, 190, 8, 8, 12, Math.PI * 1.1, Math.PI * 1.9); // top layer
  ring(38, 5, 209, 9, 5, 8, Math.PI * 1.08, Math.PI * 1.92); // broken curly hairline
  return out;
})();

/* ───────────────────────── walnut wood grain on the desk top ───────────────────────── */
const WOOD_GRAIN = (() => {
  const r = rng(5);
  let d = "";
  for (let i = 0; i < 24; i++) {
    const t = (i + 0.5) / 24;
    const y = 506 + t * 35;
    const lx = 276 - 46 * t;
    const rx = 844 + 46 * t;
    const w = (r() - 0.5) * 2.4;
    const c1 = lx + (rx - lx) * 0.3;
    const c2 = lx + (rx - lx) * 0.65;
    d += `M${lx.toFixed(1)} ${y.toFixed(1)}C${c1.toFixed(1)} ${(y + w).toFixed(1)} ${c2.toFixed(1)} ${(y - w).toFixed(1)} ${rx.toFixed(1)} ${(y + w * 0.4).toFixed(1)}`;
  }
  return d;
})();

function RealisticCity({ layer, filter, opacity = 1 }: { layer: Layer; filter?: string; opacity?: number }) {
  return (
    <g filter={filter} opacity={opacity}>
      {layer.buildings.map((b, i) => (
        <g key={i}>
          <path
            d={`M${b.x + b.w} ${b.y}L${b.x + b.w + b.depth} ${b.y + 6}V560H${b.x + b.w}Z`}
            fill={b.sideFill}
          />
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.faceFill} />
          {b.crownH > 0 && (
            <g>
              <rect
                x={b.x + b.w * 0.15}
                y={b.y - b.crownH}
                width={b.w * 0.7}
                height={b.crownH}
                fill={b.sideFill}
              />
              <rect
                x={b.x + b.w * 0.15}
                y={b.y - b.crownH}
                width={b.w * 0.7}
                height={1.5}
                fill="#93C5FD"
                fillOpacity=".35"
              />
            </g>
          )}
          <path d={`M${b.x} ${b.y}H${b.x + b.w}`} stroke="#64748B" strokeOpacity=".35" strokeWidth="1" />
          <path d={`M${b.x} ${b.y}V560`} stroke="#94A3B8" strokeOpacity=".15" strokeWidth="1" />
        </g>
      ))}
      <path d={layer.dim} fill="#1E293B" fillOpacity=".65" />
      <path d={layer.cool} fill="#E0F2FE" fillOpacity=".75" />
      <path d={layer.warm} fill="#FEF3C7" fillOpacity=".82" />
      <path d={layer.amber} fill="#FDE68A" fillOpacity=".68" />
      <path d={layer.slabs} stroke="#020617" strokeOpacity=".75" strokeWidth="1.2" />
      <path d={layer.mullions} stroke="#020617" strokeOpacity=".55" strokeWidth="0.8" />
      {layer.masts.map((m, i) => (
        <g key={i}>
          <path d={`M${m.x} ${m.y}V${m.y - m.h}`} stroke="#334155" strokeOpacity=".8" strokeWidth="1.2" />
          <circle className="beacon" cx={m.x} cy={m.y - m.h} r="1.5" fill="#F87171" />
          <circle className="beacon" cx={m.x} cy={m.y - m.h} r="4" fill="#EF4444" fillOpacity=".25" />
        </g>
      ))}
    </g>
  );
}

/* ───────────────────────── plants ───────────────────────── */
type Leaf = { x: number; y: number; r: number; s: number; shade: "dark" | "mid" | "light" };
const shadeFill = (s: Leaf["shade"]) =>
  s === "dark" ? "url(#botanical-dark)" : s === "mid" ? "url(#botanical-mid)" : "url(#botanical-light)";

/** Broad glossy fiddle-leaf-fig leaf with midrib and side veins. */
function FigLeaf({ x, y, r, s, shade }: Leaf) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path
        d="M0 0C-5 -4 -17 -10 -21 -27C-25 -44 -14 -64 0 -74C14 -64 25 -44 21 -27C17 -10 5 -4 0 0Z"
        fill={shadeFill(shade)}
        stroke="#8FC49B"
        strokeOpacity=".3"
        strokeWidth=".9"
      />
      <path d="M-13 -30C-11 -47 -5 -60 3 -67C-1 -52 -3 -40 -7 -27Z" fill="#fff" fillOpacity=".09" />
      <path d="M0 -2C1 -26 0 -52 0 -72" stroke="#B9E0BF" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M0 -14L-15 -24M0 -26L-18 -38M0 -38L-16 -52M0 -50L-10 -62M0 -14L15 -24M0 -26L18 -38M0 -38L16 -52M0 -50L10 -62"
        stroke="#B9E0BF"
        strokeOpacity=".22"
        strokeWidth=".9"
        strokeLinecap="round"
      />
    </g>
  );
}

const FIG_LEAVES: Leaf[] = [
  { x: 149, y: 600, r: -78, s: 0.82, shade: "dark" },
  { x: 168, y: 588, r: 76, s: 0.86, shade: "dark" },
  { x: 150, y: 560, r: -62, s: 0.98, shade: "mid" },
  { x: 168, y: 548, r: 60, s: 1.0, shade: "mid" },
  { x: 151, y: 520, r: -46, s: 1.0, shade: "light" },
  { x: 168, y: 508, r: 46, s: 1.02, shade: "mid" },
  { x: 152, y: 482, r: -30, s: 0.96, shade: "light" },
  { x: 167, y: 470, r: 30, s: 0.94, shade: "mid" },
  { x: 156, y: 448, r: -14, s: 0.86, shade: "light" },
  { x: 164, y: 440, r: 14, s: 0.8, shade: "mid" },
  { x: 160, y: 430, r: 0, s: 0.72, shade: "light" },
];

/** Snake-plant blade: wide, pointed, yellow-edged, with dark cross-banding. */
function SnakeBlade({ dx, h, w, lean }: { dx: number; h: number; w: number; lean: number }) {
  const bands = [0.16, 0.3, 0.44, 0.58, 0.72].map((u) => {
    const y = -h * u;
    const cx = lean * u * u;
    const hw = w * (1 - u * 0.8) * 0.85;
    return `M${(cx - hw).toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${(y - 5).toFixed(1)} ${(cx + hw).toFixed(1)} ${y.toFixed(1)}`;
  });
  return (
    <g transform={`translate(${1090 + dx} 654)`}>
      <path
        d={`M${-w} 0C${-w * 1.05} ${-h * 0.35} ${-w * 0.6 + lean * 0.5} ${-h * 0.72} ${lean} ${-h}C${w * 0.6 + lean * 0.5} ${-h * 0.72} ${w * 1.05} ${-h * 0.35} ${w} 0Z`}
        fill="url(#botanical-mid)"
        stroke="#C7D58A"
        strokeOpacity=".5"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d={bands.join("")} stroke="#0C1F14" strokeOpacity=".38" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d={`M0 -4C${lean * 0.1} ${-h * 0.35} ${lean * 0.4} ${-h * 0.72} ${lean} ${-h + 4}`}
        stroke="#A7D3AE"
        strokeOpacity=".22"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

const SNAKE_BLADES = [
  { dx: 5, h: 224, w: 15, lean: 3 },
  { dx: -7, h: 196, w: 15, lean: -7 },
  { dx: 17, h: 178, w: 14, lean: 12 },
  { dx: -19, h: 150, w: 13, lean: -16 },
  { dx: 28, h: 132, w: 12, lean: 20 },
  { dx: -30, h: 104, w: 11, lean: -22 },
  { dx: 36, h: 86, w: 10, lean: 26 },
];

/* ───────────────────────── anatomically synced legs & arms ───────────────────────── */
function SeatedLeg({ side }: { side: "left" | "right" }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      <ellipse cx="505" cy="673" rx="38" ry="4.5" fill="#000" fillOpacity=".6" />

      {/* knee (tucked under the desk) and tapered shin */}
      <path d="M481 564C481 556 491 552 505 552C519 552 529 556 529 564L526 598C525 620 524 638 523 652H487C486 638 485 620 484 598Z" fill="url(#pants)" />
      <ellipse cx="505" cy="571" rx="14" ry="9" fill="#94A3B8" fillOpacity=".14" filter="url(#blur-small)" />
      <path d="M500 592C501 612 501 630 500 646" stroke="#94A3B8" strokeOpacity=".09" strokeWidth="8" strokeLinecap="round" filter="url(#blur-small)" />
      <path d="M489 579Q505 586 521 579" stroke="#020617" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M492 613Q505 618 518 613" stroke="#020617" strokeOpacity=".28" strokeWidth="1.2" strokeLinecap="round" />

      {/* hem bunching + sock */}
      <path d="M487 642C494 647 499 643 505 648C511 643 517 647 523 642L524 654H486Z" fill="#0A101C" />
      <rect x="490" y="650" width="30" height="5" fill="#0B1220" />

      {/* sneaker */}
      <path d="M483 652H523C531 652 538 657 539 665L540 668H471C470 660 474 653 483 652Z" fill="url(#shoe)" />
      <path d="M514 660C523 658.5 534 661 539 667H516Z" fill="#fff" fillOpacity=".07" />
      <path d="M492 656H512M490 660H514M488 664H516" stroke="#CBD5E1" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M469 667H541C541 671 539 673.5 535 674H473C470 673.5 469 671 469 667Z" fill="#E2E8F0" />
      <path d="M470 672.4H540" stroke="#0F172A" strokeOpacity=".4" strokeWidth="1.6" />
    </g>
  );
}

function RealisticArm({ side, attentive }: { side: "left" | "right"; attentive: boolean }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      <g className={`typing-arm typing-arm--${side} ${attentive ? "is-resting" : ""}`}>
        {/* forearm resting on the desk, running in toward the keys behind the lid */}
        <path d="M430 468C432 490 450 510 486 521L494 506C478 500 468 488 465 466Z" fill="url(#skin-arm)" />
        <path d="M434 480C442 498 460 512 484 520" stroke="#6B3E24" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
        <path d="M440 470C446 488 462 500 482 507" stroke="#E0A67C" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
        {/* rolled sleeve cuff */}
        <path d="M423 457L466 446L468 463L426 475Z" fill="#1B3263" stroke="#0E1B3C" strokeWidth="1" strokeLinejoin="round" />
        <path d="M424 459L465 448" stroke="#8FB0F0" strokeOpacity=".3" strokeWidth="1.2" strokeLinecap="round" />
        {/* wristwatch (left wrist) */}
        {!isRight && (
          <g>
            <path d="M450 506L466 488" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <circle cx="458" cy="497" r="5.2" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.2" />
            <circle cx="458" cy="497" r="2.6" fill="#38BDF8" fillOpacity=".5" />
          </g>
        )}
        {/* hand tucked behind the lid */}
        <path d="M476 508C472 514 476 523 486 525L512 524C516 523 518 516 513 512L488 502Z" fill="url(#skin-arm)" />
      </g>
    </g>
  );
}

/* ───────────────────────── realistic lip paths ───────────────────────── */
const UPPER_LIP_PATH = {
  focused: "M548 294 C552 291.8 556 292.4 560 293.2 C564 292.4 568 291.8 572 294 C566 295 554 295 548 294Z",
  attentive: "M546 293 C551 290.8 556 291.8 560 292.8 C564 291.8 569 290.8 574 293 C566 296.5 554 296.5 546 293Z",
};
const LOWER_LIP_PATH = {
  focused: "M549 294.5 C554 298.5 566 298.5 571 294.5 C565 295.5 555 295.5 549 294.5Z",
  attentive: "M547 293.5 C553 300.5 567 300.5 573 293.5 C566 297 554 297 547 293.5Z",
};
const MOUTH_LINE_PATH = {
  focused: "M547.5 294.2 Q560 295.8 572.5 294.2",
  attentive: "M545.5 292.8 Q560 297.8 574.5 292.8",
};

function useLook(
  lx: MotionValue<number>,
  ly: MotionValue<number>,
  attention: MotionValue<number>,
  fn: (x: number, y: number, a: number) => number,
) {
  return useTransform([lx, ly, attention], ([x, y, a]: number[]) => fn(x, y, a));
}

type Props = {
  /** true = developer stops typing and looks at the cursor */
  attentive: boolean;
  /** cursor direction from the head, -1 (left/up) … 1 (right/down) */
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
};

export default function OfficeScene({ attentive, lookX, lookY }: Props) {
  const attention = useSpring(0, { stiffness: 90, damping: 18 });
  const lx = useSpring(lookX, { stiffness: 140, damping: 20, mass: 0.5 });
  const ly = useSpring(lookY, { stiffness: 140, damping: 20, mass: 0.5 });

  useEffect(() => {
    attention.set(attentive ? 1 : 0);
  }, [attentive, attention]);

  const torsoY = useLook(lx, ly, attention, (_x, _y, a) => -a * 3);

  // Smooth anatomical head movement synced with the neck
  const headX = useLook(lx, ly, attention, (x, _y, a) => x * a * 5);
  const headY = useLook(lx, ly, attention, (_x, y, a) => (1 - a) * 6 + y * a * 3.5);
  const headRotate = useLook(lx, ly, attention, (x, _y, a) => x * a * 4.2);

  // Subtle 3D perspective shift for facial features
  const faceX = useLook(lx, ly, attention, (x, _y, a) => x * a * 3.8);
  const faceY = useLook(lx, ly, attention, (_x, y, a) => (1 - a) * 3.2 + y * a * 3);

  // Realistic pupil tracking
  const pupilX = useLook(lx, ly, attention, (x, _y, a) => x * a * 3.2);
  const pupilY = useLook(lx, ly, attention, (_x, y, a) => (1 - a) * 2.8 + y * a * 2.2);

  const screenSpill = useTransform(attention, [0, 1], [0.55, 0.22]);

  return (
    <>
      {/* ═════════ LAYER 1 — Architectural Glass Office & Photorealistic Skyline ═════════ */}
      <svg
        aria-hidden="true"
        className="office-scene-art"
        viewBox={VB}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#02050B" />
            <stop offset=".45" stopColor="#081224" />
            <stop offset=".8" stopColor="#13233F" />
            <stop offset="1" stopColor="#26334D" />
          </linearGradient>
          <linearGradient id="city-haze" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#0F172A" stopOpacity="0" />
            <stop offset=".6" stopColor="#1E293B" stopOpacity=".28" />
            <stop offset="1" stopColor="#F59E0B" stopOpacity=".14" />
          </linearGradient>
          <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#030509" />
            <stop offset="1" stopColor="#0B111E" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#0D1524" />
            <stop offset="1" stopColor="#03060C" />
          </linearGradient>
          <linearGradient id="floor-glow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#38BDF8" stopOpacity=".07" />
            <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="moon-halo">
            <stop stopColor="#F8FAFC" stopOpacity=".3" />
            <stop offset=".4" stopColor="#E2E8F0" stopOpacity=".1" />
            <stop offset="1" stopColor="#E2E8F0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="downlight">
            <stop stopColor="#FEF3C7" stopOpacity=".42" />
            <stop offset="1" stopColor="#FEF3C7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cone-down" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#FEF3C7" stopOpacity=".1" />
            <stop offset="1" stopColor="#FEF3C7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="streak-warm" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#FDE68A" stopOpacity=".5" />
            <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="streak-cool" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#BAE6FD" stopOpacity=".5" />
            <stop offset="1" stopColor="#BAE6FD" stopOpacity="0" />
          </linearGradient>
          <clipPath id="glass-clip">
            <rect x="-260" y="48" width="1640" height="512" />
          </clipPath>
          <filter id="dof-far" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <filter id="dof-mid" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>

        <rect x="-300" y="0" width="1720" height="720" fill="#050912" />

        <g clipPath="url(#glass-clip)">
          <rect x="-260" y="48" width="1640" height="512" fill="url(#night-sky)" />
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F8FAFC" fillOpacity={s.o} />
          ))}

          <circle cx="670" cy="118" r="85" fill="url(#moon-halo)" />
          <circle cx="670" cy="118" r="16" fill="#F8FAFC" />
          <circle cx="665" cy="114" r="4" fill="#CBD5E1" fillOpacity=".45" />
          <circle cx="674" cy="121" r="3" fill="#CBD5E1" fillOpacity=".35" />
          <circle cx="668" cy="123" r="2" fill="#CBD5E1" fillOpacity=".3" />

          <RealisticCity layer={FAR_CITY} filter="url(#dof-far)" opacity={0.75} />
          <rect x="-300" y="280" width="1720" height="280" fill="url(#city-haze)" />
          <RealisticCity layer={MID_CITY} filter="url(#dof-mid)" opacity={0.9} />
          <rect x="-300" y="360" width="1720" height="200" fill="url(#city-haze)" opacity=".65" />
          <RealisticCity layer={NEAR_CITY} />

          <rect x="-260" y="48" width="1640" height="512" fill="#93C5FD" fillOpacity=".018" />
          <path d="M-60 48H80L-90 560H-230Z" fill="#fff" fillOpacity=".022" />
          <path d="M250 48H275L105 560H80Z" fill="#fff" fillOpacity=".018" />
          <path d="M830 48H930L760 560H660Z" fill="#fff" fillOpacity=".02" />
        </g>

        <rect x="-260" y="48" width="1640" height="8" fill="#04070E" />
        <rect x="-260" y="552" width="1640" height="12" fill="#04070E" />
        {[35, 385, 735, 1085].map((x) => (
          <g key={x}>
            <rect x={x - 5} y="48" width="10" height="512" fill="#04070E" />
            <rect x={x - 5} y="48" width="1.2" height="512" fill="#94A3B8" fillOpacity=".22" />
            <rect x={x + 4} y="48" width="0.8" height="512" fill="#475569" fillOpacity=".18" />
          </g>
        ))}

        <rect x="-300" y="0" width="1720" height="48" fill="url(#ceiling)" />
        {[-120, 160, 430, 700, 980, 1260].map((x) => (
          <g key={x}>
            <path d={`M${x - 12} 34L${x - 95} 330L${x + 95} 330L${x + 12} 34Z`} fill="url(#cone-down)" />
            <ellipse cx={x} cy="40" rx="68" ry="14" fill="url(#downlight)" />
            <ellipse cx={x} cy="28" rx="13" ry="3" fill="#FEF3C7" />
          </g>
        ))}

        <rect x="-300" y="564" width="1720" height="156" fill="url(#floor)" />
        <rect x="-300" y="564" width="1720" height="70" fill="url(#floor-glow)" />
        {FLOOR_STREAKS.map((s, i) => (
          <rect key={i} x={s.x} y="564" width={s.w} height={s.h} fill={s.warm ? "url(#streak-warm)" : "url(#streak-cool)"} opacity={s.o} />
        ))}
      </svg>

      {/* ═════════ LAYER 2 — Plants, Desk, Synced Developer, Phone on Stand & Real MacBook ═════════ */}
      <svg
        aria-hidden="true"
        className={`office-scene-art ${attentive ? "is-attentive" : ""}`}
        viewBox={VB}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="botanical-light" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#1E3F2B" />
            <stop offset=".6" stopColor="#2E5A3E" />
            <stop offset="1" stopColor="#4A7C59" />
          </linearGradient>
          <linearGradient id="botanical-mid" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#142E1F" />
            <stop offset=".6" stopColor="#234832" />
            <stop offset="1" stopColor="#386648" />
          </linearGradient>
          <linearGradient id="botanical-dark" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#0C1F14" />
            <stop offset="1" stopColor="#1F3D2B" />
          </linearGradient>
          <linearGradient id="ceramic-pot" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#1A2233" />
            <stop offset=".22" stopColor="#4A5873" />
            <stop offset=".5" stopColor="#2A3550" />
            <stop offset="1" stopColor="#080B14" />
          </linearGradient>
          <linearGradient id="walnut-top" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8C6240" />
            <stop offset=".5" stopColor="#6E492D" />
            <stop offset="1" stopColor="#4A2F1B" />
          </linearGradient>
          <linearGradient id="walnut-edge" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#5C3B23" />
            <stop offset="1" stopColor="#2E1C0F" />
          </linearGradient>
          {/* Authentic Anodized Space-Gray MacBook Pro Aluminum Gradient */}
          <linearGradient id="mac-lid" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8893A5" />
            <stop offset=".35" stopColor="#626D80" />
            <stop offset=".7" stopColor="#465061" />
            <stop offset="1" stopColor="#2E3645" />
          </linearGradient>
          <linearGradient id="lid-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff" stopOpacity=".16" />
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".18" />
          </linearGradient>
          <linearGradient id="alu-stand" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#CBD5E1" />
            <stop offset=".5" stopColor="#64748B" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="jacket" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={JACKET[0]} />
            <stop offset=".5" stopColor={JACKET[1]} />
            <stop offset="1" stopColor={JACKET[2]} />
          </linearGradient>
          <linearGradient id="inner-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#F8FAFC" />
            <stop offset="1" stopColor="#CBD5E1" />
          </linearGradient>
          {/* Smooth, natural human skin shading */}
          <radialGradient id="skin-face" cx=".48" cy=".36" r=".68">
            <stop stopColor="#D49A70" />
            <stop offset=".55" stopColor="#BC7F55" />
            <stop offset=".85" stopColor="#9B6240" />
            <stop offset="1" stopColor="#744427" />
          </radialGradient>
          <linearGradient id="skin-arm" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#CC9068" />
            <stop offset="1" stopColor="#94603E" />
          </linearGradient>
          <linearGradient id="neck-grad" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#744427" />
            <stop offset=".3" stopColor="#96603B" />
            <stop offset="1" stopColor="#B8805A" />
          </linearGradient>
          <linearGradient id="shirt-shade" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#000" stopOpacity=".34" />
            <stop offset=".18" stopColor="#000" stopOpacity="0" />
            <stop offset=".82" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".34" />
          </linearGradient>
          <linearGradient id="beard-fade" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#15110F" stopOpacity=".08" />
            <stop offset=".32" stopColor="#15110F" stopOpacity=".82" />
            <stop offset="1" stopColor="#15110F" stopOpacity=".97" />
          </linearGradient>
          <filter id="blur-fine" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation=".7" />
          </filter>
          <filter id="blur-cone" x="-40%" y="-20%" width="180%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <linearGradient id="hair-real" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#1C1D23" />
            <stop offset=".5" stopColor="#101116" />
            <stop offset="1" stopColor="#050608" />
          </linearGradient>
          <radialGradient id="iris-real" cx=".4" cy=".35" r=".75">
            <stop stopColor="#4F2E17" />
            <stop offset=".6" stopColor="#2A170B" />
            <stop offset="1" stopColor="#100803" />
          </radialGradient>
          <radialGradient id="screen-spill">
            <stop stopColor="#60A5FA" stopOpacity=".75" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="warm-glow">
            <stop stopColor="#FDE68A" stopOpacity=".4" />
            <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pants" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#2A3750" />
            <stop offset=".35" stopColor="#1C2639" />
            <stop offset=".75" stopColor="#121A2A" />
            <stop offset="1" stopColor="#0A0F1A" />
          </linearGradient>
          <linearGradient id="shoe" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#46536A" />
            <stop offset=".5" stopColor="#222C3F" />
            <stop offset="1" stopColor="#0B1220" />
          </linearGradient>
          <clipPath id="eye-l">
            <path d="M527 256 C531.5 249.5 543.5 249.5 548 256 C543.5 261.5 531.5 261.5 527 256Z" />
          </clipPath>
          <clipPath id="eye-r">
            <path d="M572 256 C576.5 249.5 588.5 249.5 593 256 C588.5 261.5 576.5 261.5 572 256Z" />
          </clipPath>
          <filter id="blur-soft" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          {/* True Optical Backlight Glow Filter for the MacBook Apple Logo */}
          <filter id="apple-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <mask id="apple-bite" maskUnits="userSpaceOnUse" x="-25" y="-25" width="50" height="50">
            <rect x="-25" y="-25" width="50" height="50" fill="#fff" />
            <circle cx="11.5" cy="-2" r="4.5" fill="#000" />
          </mask>
        <filter id="blur-small" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          {/* brushed-aluminium grain for the MacBook lid */}
          <filter id="brushed" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.85" numOctaves="2" seed="4" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 0 0 0 -0.5" />
          </filter>
          <clipPath id="lid-clip">
            <rect x="468" y="406" width="184" height="122" rx="9" />
          </clipPath>
          <clipPath id="desk-top-clip">
            <path d="M276 506H844L890 541H230Z" />
          </clipPath>
          <linearGradient id="desk-leg" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#94A3B8" />
            <stop offset=".25" stopColor="#475569" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="desk-apron" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#4A2F1B" />
            <stop offset="1" stopColor="#140C06" />
          </linearGradient>
          <linearGradient id="under-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#000" stopOpacity=".6" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lamp-shade" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#BFAE86" />
            <stop offset=".5" stopColor="#F3E9CB" />
            <stop offset="1" stopColor="#B7A57C" />
          </linearGradient>
          <linearGradient id="lamp-cone" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#FDE68A" stopOpacity=".26" />
            <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="soil" cx=".5" cy=".4" r=".7">
            <stop stopColor="#2B1D14" />
            <stop offset="1" stopColor="#0E0907" />
          </radialGradient>
          {/* fine beard stubble texture */}
          <pattern id="stubble" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
            <circle cx=".7" cy=".8" r=".45" fill="#000" fillOpacity=".55" />
            <circle cx="2.3" cy="2.2" r=".4" fill="#000" fillOpacity=".45" />
          </pattern>
        </defs>

        {/* ───── Left fiddle-leaf fig tree in a ceramic pot ───── */}
        <ellipse cx="158" cy="708" rx="62" ry="9" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          {/* woody trunk with a light edge */}
          <path d="M158 640C154 600 164 560 158 520C153 490 162 460 160 426" stroke="#3E2C1E" strokeWidth="6" strokeLinecap="round" />
          <path d="M160 640C156 600 166 560 160 520C155 490 164 460 162 426" stroke="#8A6A4A" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />
          {/* short petioles joining each leaf to the trunk */}
          {FIG_LEAVES.map((l, i) => (
            <path key={`p${i}`} d={`M159 ${l.y + 3}L${l.x} ${l.y}`} stroke="#2F4A2E" strokeWidth="2" strokeLinecap="round" />
          ))}
          {FIG_LEAVES.map((l, i) => (
            <FigLeaf key={i} {...l} />
          ))}
          {/* pot body, rim, soil, pebbles, highlight */}
          <path d="M122 640H194L186 708H130Z" fill="url(#ceramic-pot)" />
          <path d="M118 632H198L196 644H120Z" fill="url(#ceramic-pot)" />
          <path d="M118 632H198" stroke="#94A3B8" strokeOpacity=".35" strokeWidth="1" />
          <ellipse cx="158" cy="633" rx="39" ry="5.5" fill="url(#soil)" />
          <circle cx="146" cy="632" r="1.6" fill="#475569" />
          <circle cx="170" cy="634" r="1.3" fill="#64748B" />
          <path d="M134 652L140 702" stroke="#fff" strokeOpacity=".07" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* ───── Floor lamp (glowing shade, soft light cone) + snake plant ───── */}
        <ellipse cx="962" cy="340" rx="190" ry="130" fill="url(#warm-glow)" />
        <ellipse cx="962" cy="268" rx="46" ry="18" fill="#FDE68A" fillOpacity=".14" filter="url(#blur-small)" />
        <path d="M936 340H988L1100 668H826Z" fill="url(#lamp-cone)" filter="url(#blur-cone)" />
        <ellipse cx="962" cy="668" rx="130" ry="12" fill="#FDE68A" fillOpacity=".09" filter="url(#blur-small)" />
        <rect x="959" y="332" width="5" height="332" fill="#334155" />
        <rect x="959" y="332" width="1.5" height="332" fill="#94A3B8" fillOpacity=".35" />
        <ellipse cx="962" cy="666" rx="32" ry="7" fill="#1E293B" />
        <ellipse cx="962" cy="664" rx="32" ry="4" fill="#475569" fillOpacity=".5" />
        <path d="M928 334H996L985 284H939Z" fill="url(#lamp-shade)" />
        <path d="M939 284H985" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
        <ellipse cx="962" cy="334" rx="34" ry="5" fill="#FFF3C4" />
        <ellipse cx="962" cy="335" rx="22" ry="2.8" fill="#fff" fillOpacity=".95" />

        <ellipse cx="1090" cy="708" rx="48" ry="8" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          {SNAKE_BLADES.map((b, i) => (
            <SnakeBlade key={i} {...b} />
          ))}
          <path d="M1060 652H1120L1113 708H1067Z" fill="url(#ceramic-pot)" />
          <path d="M1055 644H1125L1123 656H1057Z" fill="url(#ceramic-pot)" />
          <path d="M1055 644H1125" stroke="#94A3B8" strokeOpacity=".35" strokeWidth="1" />
          <ellipse cx="1090" cy="645" rx="33" ry="5" fill="url(#soil)" />
          <circle cx="1080" cy="645" r="1.4" fill="#475569" />
          <circle cx="1100" cy="646" r="1.2" fill="#64748B" />
          <path d="M1070 662L1074 702" stroke="#fff" strokeOpacity=".07" strokeWidth="5" strokeLinecap="round" />
          {/* warm lamp light catching the pot */}
          <path d="M1110 652L1106 702" stroke="#FDE68A" strokeOpacity=".12" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* ───── Ergonomic Executive Chair ───── */}
        <g>
          <rect x="522" y="218" width="76" height="40" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <rect x="484" y="284" width="152" height="252" rx="28" fill="#0B111E" stroke="#334155" strokeWidth="2" />
          <rect x="494" y="296" width="132" height="226" rx="22" fill="#151F32" />
          <path d="M502 320H618M502 344H618M502 368H618M502 392H618M502 416H618M502 440H618M502 464H618M502 488H618" stroke="#334155" strokeOpacity=".28" strokeWidth="1" />
          <path d="M560 562V604M560 604L486 650M560 604L634 650" stroke="#0F172A" strokeWidth="9" strokeLinecap="round" />
          <circle cx="486" cy="654" r="5.5" fill="#020617" />
          <circle cx="634" cy="654" r="5.5" fill="#020617" />
        </g>

        {/* ───── Seated Legs (Properly aligned with hips & shoulders) ───── */}
        <SeatedLeg side="left" />
        <SeatedLeg side="right" />

        {/* ───── Realistic, Synced Developer Character ───── */}
        <motion.g style={{ y: torsoY }}>
          <g className="breathe">
            {/* LAYER A: neck and open-collar chest drawn as one continuous shape */}
            <path
              d="M535 296C536 320 534 334 528 342L560 374L592 342C586 334 584 320 585 296Z"
              fill="url(#neck-grad)"
            />
            {/* shadow the jaw throws on the neck */}
            <path d="M535 300C546 320 574 320 585 300V328C573 340 547 340 535 328Z" fill="#000" fillOpacity=".28" />

            {/* LAYER B: Head Unit (Pivots smoothly from the neck without any harsh cut line) */}
            <motion.g
              style={{
                x: headX,
                y: headY,
                rotate: headRotate,
                transformBox: "fill-box",
                transformOrigin: "50% 90%",
              }}
            >
              {/* Ears */}
              <g>
                <path d="M515 248C508 247 505 254 507 264C508 271 512 275 516 273Z" fill="url(#skin-face)" />
                <path d="M510 253C508 258 509 264 513 268" stroke="#7D4B2F" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M605 248C612 247 615 254 613 264C612 271 608 275 604 273Z" fill="url(#skin-face)" />
                <path d="M610 253C612 258 611 264 607 268" stroke="#7D4B2F" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round" />
              </g>

              {/* Natural Human Head & Jawline */}
              <path
                d="M513 232
                   C513 202 532 186 560 186
                   C588 186 607 202 607 232
                   C607 250 605 266 600 280
                   C595 294 585 305 572 312
                   C566 315.5 563 317 560 317
                   C557 317 554 315.5 548 312
                   C535 305 525 294 520 280
                   C515 266 513 250 513 232Z"
                fill="url(#skin-face)"
              />

              {/* Subtle realistic facial contour & warm cheek shading */}
              <path
                d="M517 256C521 276 530 292 544 304C532 290 524 274 521 256Z
                   M603 256C599 276 590 292 576 304C588 290 596 274 599 256Z"
                fill="#7D4B2F"
                fillOpacity=".14"
              />

              {/* Subtle, natural light stubble */}
              <path
                d="M520 268
                   C523 285 533 299 547 308
                   C553 312 557 314 560 314
                   C563 314 567 312 573 308
                   C587 299 597 285 600 268
                   C596 281 588 292 577 298
                   C572 290 566 288 560 288
                   C554 288 548 290 543 298
                   C532 292 524 281 520 268Z"
                fill="#1E242B"
                fillOpacity=".15"
              />

              {/* Full short beard — follows the jaw, joins the sideburns, goatee under the lip */}
              <g>
                <path
                  d="M515.5 258
                     C517 276 521 290 530 301
                     C537 308 543 311 548 313
                     C553 316.5 557 318.5 560 318.5
                     C563 318.5 567 316.5 572 313
                     C577 311 583 308 590 301
                     C599 290 603 276 604.5 258
                     C603 272 598 283 591 290
                     C586 295 582 299 575 302
                     C570 304.5 565 306 560 306
                     C555 306 550 304.5 545 302
                     C538 299 534 295 529 290
                     C522 283 517 272 515.5 258Z"
                  fill="url(#beard-fade)" filter="url(#blur-fine)"
                />
                <path
                  d="M515.5 258
                     C517 276 521 290 530 301
                     C537 308 543 311 548 313
                     C553 316.5 557 318.5 560 318.5
                     C563 318.5 567 316.5 572 313
                     C577 311 583 308 590 301
                     C599 290 603 276 604.5 258
                     C603 272 598 283 591 290
                     C586 295 582 299 575 302
                     C570 304.5 565 306 560 306
                     C555 306 550 304.5 545 302
                     C538 299 534 295 529 290
                     C522 283 517 272 515.5 258Z"
                  fill="url(#stubble)"
                  fillOpacity=".5"
                />
                {/* soft light on the beard from the laptop */}
                <path d="M538 308C549 314 571 314 582 308" stroke="#60A5FA" strokeOpacity=".16" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Screen backlight glow on chin & cheeks */}
              <motion.ellipse
                cx="560"
                cy="296"
                rx="42"
                ry="22"
                fill="url(#screen-spill)"
                style={{ opacity: screenSpill }}
              />

              {/* Facial Features */}
              <motion.g style={{ x: faceX, y: faceY }}>
                <ellipse cx="537" cy="255" rx="12" ry="7" fill="#7D4B2F" fillOpacity=".14" />
                <ellipse cx="583" cy="255" rx="12" ry="7" fill="#7D4B2F" fillOpacity=".14" />

                {/* Eyes */}
                <g className="eye-blink">
                  <path d="M527 256 C531.5 249.5 543.5 249.5 548 256 C543.5 261.5 531.5 261.5 527 256Z" fill="#F8FAFC" />
                  <path d="M572 256 C576.5 249.5 588.5 249.5 593 256 C588.5 261.5 576.5 261.5 572 256Z" fill="#F8FAFC" />

                  <g clipPath="url(#eye-l)">
                    <motion.g style={{ x: pupilX, y: pupilY }}>
                      <circle cx="537.5" cy="255.5" r="4.7" fill="url(#iris-real)" />
                      <circle cx="537.5" cy="255.5" r="2.2" fill="#090D16" />
                      <circle cx="536.2" cy="254.2" r="1.0" fill="#fff" fillOpacity=".95" />
                    </motion.g>
                  </g>

                  <g clipPath="url(#eye-r)">
                    <motion.g style={{ x: pupilX, y: pupilY }}>
                      <circle cx="582.5" cy="255.5" r="4.7" fill="url(#iris-real)" />
                      <circle cx="582.5" cy="255.5" r="2.2" fill="#090D16" />
                      <circle cx="581.2" cy="254.2" r="1.0" fill="#fff" fillOpacity=".95" />
                    </motion.g>
                  </g>

                  <path
                    d="M527 256 C532 249.5 543 249.5 548 256
                       M572 256 C577 249.5 588 249.5 593 256"
                    stroke="#1E1510"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M529 252 C534 247.5 542 247.5 546 252
                       M574 252 C578 247.5 586 247.5 591 252"
                    stroke="#6E3F26"
                    strokeOpacity=".4"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </g>

                {/* Sleek Half-Rim Developer Glasses (off by default — see WEARS_GLASSES) */}
                {WEARS_GLASSES && (
                <g>
                  <rect
                    x="522"
                    y="246"
                    width="31"
                    height="20"
                    rx="4"
                    fill="#93C5FD"
                    fillOpacity=".05"
                    stroke="#334155"
                    strokeWidth="1.1"
                  />
                  <rect
                    x="567"
                    y="246"
                    width="31"
                    height="20"
                    rx="4"
                    fill="#93C5FD"
                    fillOpacity=".05"
                    stroke="#334155"
                    strokeWidth="1.1"
                  />
                  <path
                    d="M522 249 C522 246.5 524 246 527 246 H549 C552 246 553 246.5 553 249
                       M567 249 C567 246.5 568 246 571 246 H593 C596 246 598 246.5 598 249"
                    stroke="#0F172A"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                  <path d="M553 251 Q560 249 567 251 M522 250 L514 249 M598 250 L606 249" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M526 250L532 248M571 250L577 248" stroke="#fff" strokeOpacity=".38" strokeWidth="1.3" strokeLinecap="round" />
                </g>
                )}

                {/* Eyebrows */}
                <motion.g initial={false} animate={{ y: attentive ? -2.2 : 0 }} transition={{ duration: 0.28 }}>
                  <path
                    d="M523 243.5 C530 239 542 238.6 549 242.4
                       M597 243.5 C590 239 578 238.6 571 242.4"
                    stroke="#0E0D0D"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />
                </motion.g>

                {/* Subtle, well-proportioned nose */}
                <g>
                  <path d="M557 253 C556 263 556 271 555 277" stroke="#7D4B2F" strokeOpacity=".26" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M562 256 C564 266 565 274 563 280 C561 282 558 282 556 280" fill="#8C5233" fillOpacity=".18" />
                  <ellipse cx="560" cy="278.5" rx="3.8" ry="2.1" fill="#E0AC85" fillOpacity=".3" />
                  <ellipse cx="555.2" cy="281" rx="1.9" ry="1" fill="#3A1C0F" fillOpacity=".6" />
                  <ellipse cx="564.8" cy="281" rx="1.9" ry="1" fill="#3A1C0F" fillOpacity=".6" />
                </g>

                {/* Natural Lips */}
                <g>
                  <motion.path
                    initial={false}
                    animate={{ d: attentive ? UPPER_LIP_PATH.attentive : UPPER_LIP_PATH.focused }}
                    transition={{ duration: 0.3 }}
                    fill="#8E5444"
                  />
                  <motion.path
                    initial={false}
                    animate={{ d: attentive ? LOWER_LIP_PATH.attentive : LOWER_LIP_PATH.focused }}
                    transition={{ duration: 0.3 }}
                    fill="#A5664F"
                  />
                  <motion.path
                    initial={false}
                    animate={{ d: attentive ? MOUTH_LINE_PATH.attentive : MOUTH_LINE_PATH.focused }}
                    transition={{ duration: 0.3 }}
                    stroke="#5C2D22"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              {/* Mustache joined to the beard around the mouth (inside the face group so it moves with the lips) */}
                <path
                  d="M545 288.5 C549 284 555 284.2 560 286.2 C565 284.2 571 284 575 288.5
                     C572 291.5 566 292.4 560 291.4 C554 292.4 548 291.5 545 288.5Z"
                  fill="#17120F"
                  fillOpacity=".96"
                />
                <path
                  d="M545 288.5 C541 292 540 298 545 302 L548 301 C546 297 546 293 548 290Z
                     M575 288.5 C579 292 580 298 575 302 L572 301 C574 297 574 293 572 290Z"
                  fill="#17120F"
                  fillOpacity=".96"
                />
                <path d="M552 303C556 306 564 306 568 303C566 309 554 309 552 303Z" fill="#17120F" fillOpacity=".96" />
              </motion.g>

              {/* Voluminous curly hair, built from overlapping curls */}
              <g>
                {/* dark base mass + curly hairline */}
                <path
                  d="M510 252 C500 226 500 196 516 176 C530 160 548 156 560 156
                     C574 156 592 160 606 176 C620 196 620 226 610 252
                     C608 238 604 226 597 217 C588 210 574 207 560 207
                     C546 207 532 210 523 217 C516 226 512 238 510 252Z"
                  fill="#0A0B0E"
                />
                {HAIR_CURLS.map((c, i) => (
                  <circle key={`c${i}`} cx={c.x} cy={c.y} r={c.r} fill={c.tone > 0.5 ? "url(#hair-real)" : "#0D0E12"} />
                ))}
                {/* tiny specular highlights so every curl reads as a curl */}
                {HAIR_CURLS.map((c, i) => (
                  <path
                    key={`h${i}`}
                    d={`M${(c.x - c.r * 0.6).toFixed(1)} ${(c.y - c.r * 0.15).toFixed(1)}A${(c.r * 0.6).toFixed(1)} ${(c.r * 0.6).toFixed(1)} 0 0 1 ${(c.x + c.r * 0.1).toFixed(1)} ${(c.y - c.r * 0.65).toFixed(1)}`}
                    stroke="#94A3B8" strokeOpacity=".11" strokeWidth="1" strokeLinecap="round"
                  />
                ))}
                {/* sideburns that run into the beard */}
                <path d="M511 238L514 262L519 262L518 236ZM609 238L606 262L601 262L602 236Z" fill="#0D0E12" />
              </g>
            </motion.g>

            {/* LAYER C: navy button-up — shoulders, upper arms and torso in one piece */}
            <path d="M530 338C508 341 484 347 462 358C440 370 427 394 423 428C420 446 421 460 425 474L466 464C461 450 461 434 464 420C462 456 460 500 458 534H662C660 500 658 456 656 420C659 434 659 450 654 464L695 474C699 460 700 446 697 428C693 394 680 370 658 358C636 347 612 341 590 338L560 372Z" fill="url(#jacket)" />
            <path d="M530 338C508 341 484 347 462 358C440 370 427 394 423 428C420 446 421 460 425 474L466 464C461 450 461 434 464 420C462 456 460 500 458 534H662C660 500 658 456 656 420C659 434 659 450 654 464L695 474C699 460 700 446 697 428C693 394 680 370 658 358C636 347 612 341 590 338L560 372Z" fill="url(#shirt-shade)" />
            {/* trapezius / shoulder highlight and armpit shadows */}
            <path d="M486 350C466 358 446 372 436 396" stroke="#fff" strokeOpacity=".1" strokeWidth="5" strokeLinecap="round" />
            <path d="M634 350C654 358 674 372 684 396" stroke="#fff" strokeOpacity=".1" strokeWidth="5" strokeLinecap="round" />
            <path d="M464 420C474 432 478 446 478 470M656 420C646 432 642 446 642 470" stroke="#050A18" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
            <path d="M440 400C436 420 436 440 440 460M680 400C684 420 684 440 680 460" stroke="#050A18" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
            {/* chest folds */}
            <path d="M500 400C508 430 510 470 506 528M620 400C612 430 610 470 614 528" stroke="#050A18" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
            {/* button placket + buttons */}
            <path d="M560 372V534" stroke="#0B1530" strokeOpacity=".7" strokeWidth="9" />
            <path d="M555.5 372V534M564.5 372V534" stroke="#6B8BC9" strokeOpacity=".22" strokeWidth="1" />
            {[392, 424, 456, 488, 516].map((y) => (
              <g key={y}>
                <circle cx="560" cy={y} r="2.6" fill="#C7D2E8" />
                <circle cx="560" cy={y} r="1" fill="#0B1530" fillOpacity=".5" />
              </g>
            ))}
            {/* chest pocket */}
            <path
              d="M596 420H628V452C628 455 626 456 623 456H601C598 456 596 455 596 452Z"
              fill="#fff"
              fillOpacity=".03"
              stroke="#0B1530"
              strokeOpacity=".7"
              strokeWidth="1.4"
            />
            <path d="M596 424H628" stroke="#6B8BC9" strokeOpacity=".25" strokeWidth="1" />
            {/* collar: back stand + two flaps */}
            <path d="M526 336C540 344 548 352 560 356C572 352 580 344 594 336L594 342C580 350 570 358 560 362C550 358 540 350 526 342Z" fill="#1E3869" />
            <path d="M524 335L558 372L543 392L514 360Z" fill="#2B4B8C" stroke="#0E1B3C" strokeWidth="1" strokeLinejoin="round" />
            <path d="M596 335L562 372L577 392L606 360Z" fill="#2B4B8C" stroke="#0E1B3C" strokeWidth="1" strokeLinejoin="round" />
            <path d="M525 337L516 359M595 337L604 359" stroke="#8FB0F0" strokeOpacity=".3" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          
        </motion.g>

        {/* ───── Executive Walnut Desk ───── */}
        <ellipse cx="560" cy="684" rx="340" ry="20" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          {/* brushed-steel legs with adjustable feet */}
          <path d="M270 563H290L288 666H272Z" fill="url(#desk-leg)" />
          <path d="M272 563H274.5L274 666H272Z" fill="#E2E8F0" fillOpacity=".35" />
          <rect x="264" y="664" width="30" height="7" rx="3" fill="#0B111E" />
          <rect x="264" y="664" width="30" height="1.6" rx=".8" fill="#94A3B8" fillOpacity=".4" />
          <path d="M830 563H850L848 666H832Z" fill="url(#desk-leg)" />
          <path d="M832 563H834.5L834 666H832Z" fill="#E2E8F0" fillOpacity=".35" />
          <rect x="826" y="664" width="30" height="7" rx="3" fill="#0B111E" />
          <rect x="826" y="664" width="30" height="1.6" rx=".8" fill="#94A3B8" fillOpacity=".4" />
          {/* apron under the top + shadow the desk casts on the knees */}
          <rect x="250" y="553" width="620" height="10" fill="url(#desk-apron)" />
          <rect x="262" y="563" width="596" height="46" fill="url(#under-shadow)" />
          {/* walnut top surface with grain, sheen and lamp reflection */}
          <path d="M276 506H844L890 541H230Z" fill="url(#walnut-top)" />
          <g clipPath="url(#desk-top-clip)">
            <path d={WOOD_GRAIN} stroke="#2A1709" strokeOpacity=".28" strokeWidth=".9" />
            <path d="M276 506H844L852 516H268Z" fill="#fff" fillOpacity=".06" />
            <path d="M276 506.5H844" stroke="#D9A066" strokeOpacity=".3" strokeWidth="1" />
            {/* pools of light from the ceiling downlights + the floor lamp */}
            <ellipse cx="430" cy="526" rx="70" ry="9" fill="#FEF3C7" fillOpacity=".11" filter="url(#blur-small)" />
            <ellipse cx="700" cy="526" rx="70" ry="9" fill="#FEF3C7" fillOpacity=".09" filter="url(#blur-small)" />
            <ellipse cx="800" cy="528" rx="64" ry="8" fill="#FDE68A" fillOpacity=".14" filter="url(#blur-small)" />
            {/* soft contact shadows of everything standing on the desk */}
            <ellipse cx="560" cy="535" rx="112" ry="5" fill="#000" fillOpacity=".45" filter="url(#blur-small)" />
            <ellipse cx="354" cy="538" rx="30" ry="4" fill="#000" fillOpacity=".5" filter="url(#blur-small)" />
            <ellipse cx="781" cy="539" rx="22" ry="3.2" fill="#000" fillOpacity=".5" filter="url(#blur-small)" />
            <ellipse cx="742" cy="537" rx="15" ry="2.6" fill="#000" fillOpacity=".45" filter="url(#blur-small)" />
          </g>
          <rect x="230" y="541" width="660" height="12" rx="2.5" fill="url(#walnut-edge)" />
          <path d="M232 541.5H888" stroke="#D97706" strokeOpacity=".25" strokeWidth="1" />
          <path d="M232 543H888" stroke="#fff" strokeOpacity=".08" strokeWidth="1" />
          <ellipse cx="560" cy="534" rx="190" ry="8" fill="#60A5FA" fillOpacity=".14" />
        </g>

        {/* Matte Desk Pad */}
        <path d="M390 528H730L744 540H376Z" fill="#090D16" />
        <path d="M390 528H730" stroke="#334155" strokeOpacity=".4" strokeWidth="1" />

        {/* Forearms resting on the desk */}
        <motion.g style={{ y: torsoY }}>
          <RealisticArm side="left" attentive={attentive} />
          <RealisticArm side="right" attentive={attentive} />
        </motion.g>

        {/* ───── iPhone on a weighted aluminium dock + USB-C cable to the MacBook ───── */}
        <g>
          <ellipse cx="355" cy="538" rx="31" ry="4.5" fill="#000" fillOpacity=".55" />
          {/* round weighted base */}
          <path d="M326 534C326 531 338 529 353 529C368 529 380 531 380 534V537C380 540 368 542 353 542C338 542 326 540 326 537Z" fill="url(#alu-stand)" />
          <ellipse cx="353" cy="531" rx="26" ry="3.2" fill="#E2E8F0" fillOpacity=".45" />
          {/* neck + cradle */}
          <path d="M349 531L350 512H356L357 531Z" fill="url(#alu-stand)" />
          <rect x="336" y="500" width="34" height="12" rx="4" transform="rotate(-5 353 506)" fill="url(#alu-stand)" />

          {/* the phone */}
          <g transform="translate(324 426) rotate(-5)">
            <rect x="0" y="0" width="44" height="84" rx="8" fill="#1E293B" stroke="#A7B4C6" strokeWidth="1.5" />
            <rect x="-1" y="18" width="1.6" height="9" rx=".8" fill="#94A3B8" />
            <rect x="-1" y="30" width="1.6" height="14" rx=".8" fill="#94A3B8" />
            <rect x="43.4" y="26" width="1.6" height="18" rx=".8" fill="#94A3B8" />
            <rect x="2.2" y="2.2" width="39.6" height="79.6" rx="6.5" fill="#020617" />
            <rect x="15" y="4.5" width="14" height="3.2" rx="1.6" fill="#000" />
            <rect x="6" y="12" width="32" height="14" rx="2.5" fill="#0F172A" />
            <path d="M9 17H22" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 21.5H31" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="6" y="30" width="14.5" height="16" rx="2" fill="#1E1B4B" />
            <rect x="23.5" y="30" width="14.5" height="16" rx="2" fill="#172554" />
            <g strokeWidth="1.8" strokeLinecap="round" opacity=".85">
              <path d="M7 52H26" stroke="#F472B6" />
              <path d="M7 57H34" stroke="#60A5FA" />
              <path d="M7 62H29" stroke="#A7F3D0" />
              <path d="M7 67H20" stroke="#FBBF24" />
            </g>
            <circle cx="35" cy="6.1" r="1.2" fill="#34D399" />
            <rect x="14" y="78.5" width="16" height="1.4" rx="0.7" fill="#64748B" />
            <path d="M3 3H24L8 80H3Z" fill="#fff" fillOpacity=".05" />
          </g>
          {/* front lip of the cradle holding the phone */}
          <rect x="338" y="503" width="30" height="5" rx="2" transform="rotate(-5 353 506)" fill="url(#alu-stand)" />
          {/* screen glow on the desk */}
          <ellipse cx="352" cy="537" rx="34" ry="3.5" fill="#38BDF8" fillOpacity=".1" />

          {/* cable from the dock to the MacBook's left port */}
          <path d="M378 537C398 544 428 541 455 530" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M378 537C398 544 428 541 455 530" stroke="#64748B" strokeOpacity=".5" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <rect x="453" y="527.2" width="6" height="3.5" rx="1" fill="#CBD5E1" />
        </g>

        {/* ───── Realistic Space-Gray MacBook Pro with True Glowing Apple Logo ───── */}
        <g>
          <ellipse cx="560" cy="536" rx="125" ry="6" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
          {/* Ambient Screen Backlight Spill */}
          <ellipse cx="560" cy="445" rx="115" ry="65" fill="url(#screen-spill)" opacity={attentive ? 0.22 : 0.5} />

          {/* Precision Unibody Aluminum Display Lid */}
          <rect x="468" y="406" width="184" height="122" rx="9" fill="url(#mac-lid)" />
          {/* Machined CNC Aluminum Chamfered Edge */}
          <rect x="468.5" y="406.5" width="183" height="121" rx="8.5" stroke="#CBD5E1" strokeOpacity=".5" strokeWidth="1" />
          {/* Subtle Metallic Anodized Sheen (No Diagonal Clipping Over Logo) */}
          <path d="M476 408H545L498 526H476Z" fill="#fff" fillOpacity=".035" />
          {/* brushed-aluminium grain, top-edge catch-light, lower shading */}
          <g clipPath="url(#lid-clip)">
            <rect x="468" y="406" width="184" height="122" fill="url(#lid-sheen)" />
            <path d="M590 406H640L560 528H510Z" fill="#fff" fillOpacity=".045" />
            <path d="M468 410H652" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
          </g>
          {/* hinge barrel */}
          <rect x="512" y="523" width="96" height="5" rx="2.5" fill="#1B2230" />
          <rect x="512" y="523" width="96" height="1.2" rx=".6" fill="#94A3B8" fillOpacity=".35" />
          {/* lid thickness on the right edge */}
          <path d="M652 412Q655 414 655 418V520Q655 524 652 526Z" fill="#334155" />

          {/* Unibody Base Deck, Clutch Hinge & Rubber Feet */}
          <rect x="458" y="526" width="204" height="7" rx="3" fill="#475569" />
          <path d="M459 526.8H661" stroke="#CBD5E1" strokeOpacity=".45" strokeWidth="1" />
          <rect x="518" y="525" width="84" height="3" rx="1" fill="#0F172A" />
          <rect x="470" y="533" width="18" height="1.8" rx="0.9" fill="#090D16" />
          <rect x="632" y="533" width="18" height="1.8" rx="0.9" fill="#090D16" />

          {/* REAL Backlit Glowing Apple Logo (Soft Optical Bloom, Zero Ugly Circle) */}
          <g transform="translate(560 467) scale(1.04)">
            {/* Outer optical bloom diffused straight from the Apple silhouette */}
            <g filter="url(#apple-glow)" opacity=".85">
              <g mask="url(#apple-bite)">
                <path
                  d="M0 -6C-4 -9 -11 -6 -11 2C-11 9 -6 15 -3 15C-1.5 15 -1 14 0 14C1 14 1.5 15 3 15C6 15 10 10 11 6C7 4 7 -2 11 -4C9 -7 5 -8 2 -7C1 -6.5 .5 -6 0 -6Z"
                  fill="#FFFFFF"
                />
              </g>
              <path d="M1 -8C1 -12 4 -14 7.5 -14.5C7.5 -11 5 -8 1 -8Z" fill="#FFFFFF" />
            </g>
            {/* Crisp luminous white core */}
            <g mask="url(#apple-bite)">
              <path
                d="M0 -6C-4 -9 -11 -6 -11 2C-11 9 -6 15 -3 15C-1.5 15 -1 14 0 14C1 14 1.5 15 3 15C6 15 10 10 11 6C7 4 7 -2 11 -4C9 -7 5 -8 2 -7C1 -6.5 .5 -6 0 -6Z"
                fill="#FFFFFF"
              />
            </g>
            <path d="M1 -8C1 -12 4 -14 7.5 -14.5C7.5 -11 5 -8 1 -8Z" fill="#FFFFFF" />
          </g>
        </g>

        {/* ───── Ceramic Espresso Mug & Wireless Mouse (Right) ───── */}
        <g>
          <rect x="766" y="508" width="26" height="29" rx="5" fill="#E2E8F0" />
          <path d="M792 515Q805 517 803 527Q801 533 792 531" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="779" cy="509" rx="11" ry="2.4" fill="#2E1C0F" />
          <path className="steam" d="M774 502Q770 494 776 488" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />
          <path className="steam steam--b" d="M784 502Q788 494 782 488" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />

          <ellipse cx="742" cy="534" rx="13" ry="4" fill="#64748B" />
          <path d="M730 534C732 528.5 752 528.5 754 534" fill="#CBD5E1" />
        </g>
      </svg>

      {/* ═════════ LAYER 3 — Cinematic Vignette ═════════ */}
      <svg
        aria-hidden="true"
        className="office-scene-art pointer-events-none"
        viewBox={VB}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="vignette" cx=".5" cy=".5" r=".75">
            <stop offset=".55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".6" />
          </radialGradient>
        </defs>
        <rect x="-300" y="0" width="1720" height="720" fill="url(#vignette)" />
      </svg>
    </>
  );
}