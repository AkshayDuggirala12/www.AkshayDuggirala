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

/* ───────────────────────── organic botanical plants ───────────────────────── */
type MonsteraLeafProps = { x: number; y: number; r: number; s: number; flip?: boolean; shade: "dark" | "mid" | "light" };

function OrganicLeaf({ x, y, r, s, flip = false, shade }: MonsteraLeafProps) {
  const fillId = shade === "dark" ? "url(#botanical-dark)" : shade === "mid" ? "url(#botanical-mid)" : "url(#botanical-light)";
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`}>
      <path
        d="M0 0
           C-8 -6 -22 -18 -26 -36
           C-20 -35 -12 -32 -9 -30
           C-14 -38 -27 -46 -27 -62
           C-19 -60 -11 -56 -8 -53
           C-13 -62 -24 -72 -21 -86
           C-16 -100 -5 -112 2 -118
           C10 -110 21 -96 23 -80
           C16 -77 10 -72 7 -68
           C13 -70 23 -66 25 -52
           C17 -50 10 -46 7 -42
           C14 -43 24 -36 22 -22
           C19 -10 9 -3 0 0Z"
        fill={fillId}
      />
      <path
        d="M2 -118C10 -110 21 -96 23 -80C15 -50 11 -22 0 0C6 -36 6 -82 2 -118Z"
        fill="#fff"
        fillOpacity=".06"
      />
      <path d="M0 0C2 -38 3 -78 2 -114" stroke="#6E9975" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M1 -20C-6 -24 -14 -28 -20 -33
           M2 -44C-5 -48 -14 -52 -20 -58
           M2 -68C-4 -73 -11 -78 -16 -83
           M1 -26C7 -30 13 -33 18 -36
           M2 -50C8 -54 14 -58 19 -61
           M2 -74C7 -78 13 -82 17 -86"
        stroke="#6E9975"
        strokeOpacity=".25"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

const LEFT_PLANT_LEAVES: MonsteraLeafProps[] = [
  { x: 142, y: 608, r: -78, s: 0.72, flip: false, shade: "dark" },
  { x: 174, y: 602, r: 74, s: 0.75, flip: true, shade: "dark" },
  { x: 136, y: 572, r: -58, s: 0.88, flip: false, shade: "mid" },
  { x: 180, y: 564, r: 56, s: 0.85, flip: true, shade: "mid" },
  { x: 148, y: 536, r: -38, s: 0.94, flip: false, shade: "light" },
  { x: 172, y: 528, r: 42, s: 0.92, flip: true, shade: "mid" },
  { x: 144, y: 498, r: -24, s: 0.86, flip: false, shade: "mid" },
  { x: 168, y: 492, r: 26, s: 0.84, flip: true, shade: "light" },
  { x: 156, y: 468, r: -6, s: 0.78, flip: false, shade: "light" },
  { x: 162, y: 462, r: 14, s: 0.72, flip: true, shade: "mid" },
];

const RIGHT_PLANT_BLADES = [
  { dx: -28, h: 92, c1x: -18, c2x: -26, tipX: -34, w: 6.5, shade: "dark" },
  { dx: -18, h: 138, c1x: -12, c2x: -22, tipX: -24, w: 8, shade: "mid" },
  { dx: -10, h: 176, c1x: -8, c2x: -14, tipX: -12, w: 9, shade: "light" },
  { dx: -2, h: 204, c1x: -2, c2x: 6, tipX: 4, w: 9.5, shade: "mid" },
  { dx: 6, h: 188, c1x: 8, c2x: 16, tipX: 18, w: 8.5, shade: "light" },
  { dx: 14, h: 154, c1x: 12, c2x: 24, tipX: 28, w: 8, shade: "mid" },
  { dx: 22, h: 116, c1x: 16, c2x: 28, tipX: 36, w: 7, shade: "dark" },
  { dx: -6, h: 128, c1x: 4, c2x: -8, tipX: -6, w: 7.5, shade: "dark" },
  { dx: 10, h: 132, c1x: -4, c2x: 10, tipX: 12, w: 7.5, shade: "dark" },
];

/* ───────────────────────── anatomically synced legs & arms ───────────────────────── */
function SeatedLeg({ side }: { side: "left" | "right" }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      {/* Natural seated thigh & knee aligned with torso hips */}
      <path
        d="M474 548
           H532
           L530 596
           C529 614 525 632 522 654
           H484
           C481 632 477 614 475 596
           Z"
        fill="url(#pants)"
      />
      {/* Subtle knee highlight & fabric crease */}
      <path d="M504 558C506 584 506 618 504 650" stroke="#94A3B8" strokeOpacity=".08" strokeWidth="8" strokeLinecap="round" />
      <path d="M480 594Q502 602 526 594" stroke="#020617" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      {/* Dark ankle sock */}
      <rect x="486" y="648" width="34" height="10" fill="#090D16" />
      {/* Realistic sleek sneaker */}
      <path
        d="M482 654
           H524
           C534 654 540 662 538 672
           H472
           C470 662 474 654 482 654Z"
        fill="url(#shoe)"
      />
      <path d="M486 657H520" stroke="#64748B" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" />
      <rect x="471" y="668" width="68" height="4.5" rx="2.2" fill="#CBD5E1" />
    </g>
  );
}

function RealisticArm({ side, attentive }: { side: "left" | "right"; attentive: boolean }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      {/* Forearm & hand layered naturally so they reach inward toward the MacBook keyboard */}
      <g className={`typing-arm typing-arm--${side} ${attentive ? "is-resting" : ""}`}>
        {/* Anatomically tapered bare forearm */}
        <path
          d="M432 464
             C436 490 452 512 480 522
             L492 504
             C472 494 462 478 458 456
             Z"
          fill="url(#skin-arm)"
        />
        {/* Subtle forearm muscle/ulna shading */}
        <path
          d="M438 474C446 494 460 508 482 518"
          stroke="#7D4B2F"
          strokeOpacity=".35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Properly wrapped wristwatch on left wrist (no longer sticking out) */}
        {!isRight && (
          <g>
            {/* Strap wrapping across wrist */}
            <path d="M459 506L475 491" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
            {/* Metallic watch case sitting flush on wrist */}
            <ellipse
              cx="467"
              cy="498.5"
              rx="5"
              ry="3.6"
              transform="rotate(-42 467 498.5)"
              fill="#1E293B"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
          </g>
        )}
        {/* Hand & fingers resting over the MacBook keyboard */}
        <path
          d="M476 508
             C472 514 476 523 486 525
             L512 524
             C516 523 518 516 513 512
             L488 502Z"
          fill="url(#skin-arm)"
        />
      </g>

      {/* Tailored jacket shoulder & sleeve drawn over top of upper forearm for seamless joint */}
      <path
        d="M466 356
           C444 366 430 392 424 430
           C421 446 423 460 428 470
           L462 460
           C458 446 458 430 462 412
           C466 394 474 374 484 362Z"
        fill="url(#jacket)"
      />
      {/* Rolled-up sleeve cuff */}
      <path
        d="M425 460L462 450L465 463L428 473Z"
        fill="#1E293B"
        stroke="#090D16"
        strokeWidth="1"
      />
      {/* Shoulder & sleeve rim highlight */}
      <path
        d="M464 358C444 370 432 396 426 432"
        stroke="#94A3B8"
        strokeOpacity=".25"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
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
            <ellipse cx={x} cy="40" rx="68" ry="14" fill="url(#downlight)" />
            <ellipse cx={x} cy="28" rx="13" ry="3" fill="#FEF3C7" />
          </g>
        ))}

        <rect x="-300" y="564" width="1720" height="156" fill="url(#floor)" />
        <rect x="-300" y="564" width="1720" height="70" fill="url(#floor-glow)" />
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
            <stop stopColor="#334155" />
            <stop offset=".45" stopColor="#1E293B" />
            <stop offset="1" stopColor="#090D16" />
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
            <stop stopColor="#64748B" />
            <stop offset=".45" stopColor="#475569" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="alu-stand" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#CBD5E1" />
            <stop offset=".5" stopColor="#64748B" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="jacket" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#273549" />
            <stop offset=".5" stopColor="#1E293B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="inner-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#E2E8F0" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
          {/* Smooth, natural human skin shading */}
          <radialGradient id="skin-face" cx=".48" cy=".36" r=".68">
            <stop stopColor="#E4AE8C" />
            <stop offset=".55" stopColor="#CC906C" />
            <stop offset=".85" stopColor="#AD7250" />
            <stop offset="1" stopColor="#8A5436" />
          </radialGradient>
          <linearGradient id="skin-arm" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#DDA482" />
            <stop offset="1" stopColor="#A66B49" />
          </linearGradient>
          <linearGradient id="neck-grad" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#8A5436" />
            <stop offset=".35" stopColor="#AD7250" />
            <stop offset="1" stopColor="#C88C68" />
          </linearGradient>
          <linearGradient id="hair-real" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#262930" />
            <stop offset=".5" stopColor="#14171D" />
            <stop offset="1" stopColor="#080A0E" />
          </linearGradient>
          <radialGradient id="iris-real" cx=".4" cy=".35" r=".75">
            <stop stopColor="#6E4427" />
            <stop offset=".6" stopColor="#3D2312" />
            <stop offset="1" stopColor="#1A0E06" />
          </radialGradient>
          <radialGradient id="screen-spill">
            <stop stopColor="#60A5FA" stopOpacity=".75" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="warm-glow">
            <stop stopColor="#FDE68A" stopOpacity=".3" />
            <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pants" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#1E293B" />
            <stop offset=".5" stopColor="#151E2E" />
            <stop offset="1" stopColor="#090D16" />
          </linearGradient>
          <linearGradient id="shoe" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#334155" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <clipPath id="eye-l">
            <path d="M528 256 C532 250.5 543 250.5 547 256 C543 260.5 532 260.5 528 256Z" />
          </clipPath>
          <clipPath id="eye-r">
            <path d="M573 256 C577 250.5 588 250.5 592 256 C588 260.5 577 260.5 573 256Z" />
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
        </defs>

        {/* ───── Left Botanical Plant ───── */}
        <ellipse cx="158" cy="708" rx="62" ry="9" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          <path
            d="M158 642 C154 600 144 562 138 504
               M158 642 C160 590 162 532 158 464
               M158 642 C164 604 176 568 178 524"
            stroke="#4A3525"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {LEFT_PLANT_LEAVES.map((l, i) => (
            <OrganicLeaf key={i} {...l} />
          ))}
          <path d="M122 636H194L186 708H130Z" fill="url(#ceramic-pot)" />
          <ellipse cx="158" cy="636" rx="36" ry="6" fill="#0F172A" />
          <ellipse cx="158" cy="636" rx="32" ry="4" fill="#1C1613" />
        </g>

        {/* ───── Right Floor Lamp + Dracaena Plant ───── */}
        <ellipse cx="962" cy="352" rx="130" ry="92" fill="url(#warm-glow)" />
        <rect x="959" y="332" width="5" height="332" fill="#334155" />
        <rect x="959" y="332" width="1.5" height="332" fill="#94A3B8" fillOpacity=".35" />
        <ellipse cx="962" cy="666" rx="32" ry="7" fill="#1E293B" />
        <path d="M928 334H996L985 284H939Z" fill="#E2D5B5" />
        <ellipse cx="962" cy="334" rx="34" ry="4.5" fill="#FEF3C7" />

        <ellipse cx="1090" cy="708" rx="48" ry="8" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          {RIGHT_PLANT_BLADES.map((b, i) => {
            const fillId =
              b.shade === "dark" ? "url(#botanical-dark)" : b.shade === "mid" ? "url(#botanical-mid)" : "url(#botanical-light)";
            return (
              <g key={i} transform={`translate(${1090 + b.dx} 654)`}>
                <path
                  d={`M${-b.w} 0
                      C${-b.w * 0.9 + b.c1x} ${-b.h * 0.35} ${-b.w * 0.4 + b.c2x} ${-b.h * 0.72} ${b.tipX} ${-b.h}
                      C${b.w * 0.4 + b.c2x} ${-b.h * 0.72} ${b.w * 0.9 + b.c1x} ${-b.h * 0.35} ${b.w} 0Z`}
                  fill={fillId}
                  stroke="#6E9975"
                  strokeOpacity=".4"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          <path d="M1058 648H1122L1114 708H1066Z" fill="url(#ceramic-pot)" />
          <ellipse cx="1090" cy="648" rx="32" ry="5.5" fill="#0F172A" />
          <ellipse cx="1090" cy="648" rx="28" ry="3.8" fill="#1C1613" />
        </g>

        {/* ───── Ergonomic Executive Chair ───── */}
        <g>
          <rect x="522" y="218" width="76" height="40" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <rect x="484" y="284" width="152" height="252" rx="28" fill="#0B111E" stroke="#334155" strokeWidth="2" />
          <rect x="494" y="296" width="132" height="226" rx="22" fill="#151F32" />
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
            {/* LAYER A: Neck Base (Drawn FIRST so the shirt & jacket collar sit naturally ON TOP of the neck) */}
            <path
              d="M534 298
                 C535 322 532 342 522 362
                 H598
                 C588 342 585 322 586 298Z"
              fill="url(#neck-grad)"
            />
            {/* Natural shadow cast by the jaw onto the upper neck */}
            <path
              d="M535 300C546 318 574 318 585 300V326C573 338 547 338 535 326Z"
              fill="#000"
              fillOpacity=".24"
            />

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
                d="M515 232
                   C515 202 533 186 560 186
                   C587 186 605 202 605 232
                   C605 248 603 264 598 278
                   C593 292 583 303 571 310
                   C565 313.5 562 315 560 315
                   C558 315 555 313.5 549 310
                   C537 303 527 292 522 278
                   C517 264 515 248 515 232Z"
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
                  <path d="M528 256 C532 250.5 543 250.5 547 256 C543 260.5 532 260.5 528 256Z" fill="#F8FAFC" />
                  <path d="M573 256 C577 250.5 588 250.5 592 256 C588 260.5 577 260.5 573 256Z" fill="#F8FAFC" />

                  <g clipPath="url(#eye-l)">
                    <motion.g style={{ x: pupilX, y: pupilY }}>
                      <circle cx="537.5" cy="255.5" r="4.2" fill="url(#iris-real)" />
                      <circle cx="537.5" cy="255.5" r="1.9" fill="#090D16" />
                      <circle cx="536.2" cy="254.2" r="1.0" fill="#fff" fillOpacity=".95" />
                    </motion.g>
                  </g>

                  <g clipPath="url(#eye-r)">
                    <motion.g style={{ x: pupilX, y: pupilY }}>
                      <circle cx="582.5" cy="255.5" r="4.2" fill="url(#iris-real)" />
                      <circle cx="582.5" cy="255.5" r="1.9" fill="#090D16" />
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

                {/* Sleek Half-Rim Developer Glasses */}
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

                {/* Eyebrows */}
                <motion.g initial={false} animate={{ y: attentive ? -2.2 : 0 }} transition={{ duration: 0.28 }}>
                  <path
                    d="M525 242 C531 238.5 541 238.5 548 241.5
                       M595 242 C589 238.5 579 238.5 572 241.5"
                    stroke="#181B20"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </motion.g>

                {/* Subtle, well-proportioned nose */}
                <g>
                  <path d="M557 253 C556 263 556 271 555 277" stroke="#7D4B2F" strokeOpacity=".26" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M562 256 C564 266 565 274 563 280 C561 282 558 282 556 280" fill="#8C5233" fillOpacity=".18" />
                  <ellipse cx="559.5" cy="278.5" rx="2.8" ry="1.8" fill="#F3C6A8" fillOpacity=".28" />
                  <ellipse cx="556.5" cy="281" rx="1.5" ry="0.9" fill="#4A2515" fillOpacity=".55" />
                  <ellipse cx="563" cy="281" rx="1.5" ry="0.9" fill="#4A2515" fillOpacity=".55" />
                </g>

                {/* Natural Lips */}
                <g>
                  <motion.path
                    initial={false}
                    animate={{ d: attentive ? UPPER_LIP_PATH.attentive : UPPER_LIP_PATH.focused }}
                    transition={{ duration: 0.3 }}
                    fill="#A3604E"
                  />
                  <motion.path
                    initial={false}
                    animate={{ d: attentive ? LOWER_LIP_PATH.attentive : LOWER_LIP_PATH.focused }}
                    transition={{ duration: 0.3 }}
                    fill="#BC7460"
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
              </motion.g>

              {/* Modern Side-Parted Tapered Haircut */}
              <g>
                <path
                  d="M514 248
                     C507 212 515 182 537 171
                     C552 164 575 164 590 174
                     C607 185 613 212 606 248
                     C604 232 601 218 594 208
                     C584 202 570 198 554 200
                     C538 202 525 210 519 225
                     C516 232 515 240 514 248Z"
                  fill="url(#hair-real)"
                />
                <path d="M514 236L516 258L519 258L518 234ZM606 236L604 258L601 258L602 234Z" fill="#14171D" />
                <path
                  d="M528 184C548 176 572 176 590 186
                     M522 195C548 185 578 185 598 197"
                  stroke="#64748B"
                  strokeOpacity=".18"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </g>
            </motion.g>

            {/* LAYER C: Torso, Inner Tee & Jacket Collar drawn OVER the lower neck so the neck sits cleanly inside the shirt */}
            <path
              d="M524 342
                 C496 346 472 354 462 374
                 C452 394 452 452 456 534
                 H664
                 C668 452 668 394 658 374
                 C648 354 624 346 596 342
                 C586 358 574 366 560 366
                 C546 366 534 358 524 342Z"
              fill="url(#jacket)"
            />
            {/* Inner crew-neck tee wrapping smoothly around the base of the neck */}
            <path
              d="M526 343
                 C535 358 547 365 560 365
                 C573 365 585 358 594 343
                 L586 376
                 H534
                 Z"
              fill="url(#inner-shirt)"
            />
            {/* Ribbed collar band of inner tee */}
            <path
              d="M527 343C536 357 548 364 560 364C572 364 584 357 593 343"
              stroke="#F8FAFC"
              strokeOpacity=".65"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Structured jacket collar & lapels framing the neck */}
            <path
              d="M525 340L510 360L538 416L553 366Z
                 M595 340L610 360L582 416L567 366Z"
              fill="#1E293B"
              stroke="#475569"
              strokeOpacity=".4"
              strokeWidth="1"
            />
            <path
              d="M463 372C474 354 498 346 524 342
                 M657 372C646 354 622 346 596 342"
              stroke="#94A3B8"
              strokeOpacity=".3"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M560 366V528" stroke="#090D16" strokeOpacity=".55" strokeWidth="2" />
            <path
              d="M494 410C500 450 498 492 492 528
                 M626 410C620 450 622 492 628 528"
              stroke="#090D16"
              strokeOpacity=".4"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* LAYER D: Synced Arms & Hands */}
          <RealisticArm side="left" attentive={attentive} />
          <RealisticArm side="right" attentive={attentive} />
        </motion.g>

        {/* ───── Executive Walnut Desk ───── */}
        <ellipse cx="560" cy="684" rx="340" ry="20" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          <path d="M272 553H286L283 670H274Z" fill="#334155" />
          <path d="M274 553H276.5L275.5 670H274Z" fill="#94A3B8" fillOpacity=".3" />
          <path d="M834 553H848L846 670H837Z" fill="#334155" />
          <path d="M836 553H838.5L837.5 670H836Z" fill="#94A3B8" fillOpacity=".3" />
          <rect x="250" y="553" width="620" height="10" fill="#0F172A" />
          <path d="M262 524H858L890 541H230Z" fill="url(#walnut-top)" />
          <rect x="230" y="541" width="660" height="12" rx="2.5" fill="url(#walnut-edge)" />
          <path d="M232 541.5H888" stroke="#D97706" strokeOpacity=".25" strokeWidth="1" />
          <ellipse cx="560" cy="534" rx="190" ry="8" fill="#60A5FA" fillOpacity=".14" />
        </g>

        {/* Matte Desk Pad */}
        <path d="M390 528H730L744 540H376Z" fill="#090D16" />
        <path d="M390 528H730" stroke="#334155" strokeOpacity=".4" strokeWidth="1" />

        {/* ───── iPhone on Aluminum Desk Stand + Connected USB-C Cable to MacBook ───── */}
        <g>
          {/* Shadow under phone stand */}
          <ellipse cx="348" cy="535" rx="28" ry="4" fill="#000" fillOpacity=".55" />

          {/* Heavy Anodized Aluminum Stand Base & Angled Pillar */}
          <path d="M324 531L332 526H366L374 531H324Z" fill="url(#alu-stand)" />
          <rect x="324" y="531" width="50" height="3" rx="1.2" fill="#475569" />
          <path d="M344 528L339 484H348L353 528Z" fill="url(#alu-stand)" />
          {/* MagSafe / Cradle Lip holding the phone */}
          <rect x="331" y="502" width="34" height="4" rx="2" transform="rotate(-5 348 504)" fill="#94A3B8" />

          {/* Sleek Smartphone in Portrait on the Stand */}
          <g transform="translate(324 426) rotate(-5)">
            {/* Titanium Outer Frame */}
            <rect x="0" y="0" width="44" height="84" rx="8" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
            {/* OLED Screen */}
            <rect x="2.2" y="2.2" width="39.6" height="79.6" rx="6.5" fill="#020617" />
            {/* Dynamic Island */}
            <rect x="15" y="4.5" width="14" height="3.2" rx="1.6" fill="#000" />
            {/* Mobile App Dev UI / Live Reload Screen */}
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
            {/* Connected green status pill & iOS Home Indicator */}
            <circle cx="35" cy="6.1" r="1.2" fill="#34D399" />
            <rect x="14" y="78.5" width="16" height="1.4" rx="0.7" fill="#64748B" />
            {/* Glass screen reflection */}
            <path d="M3 3H24L8 80H3Z" fill="#fff" fillOpacity=".04" />
          </g>

          {/* USB-C Connector Plugged into Bottom of Phone + Cable Connected to MacBook Left Port */}
          <rect x="348" y="509" width="5" height="7" rx="1.5" transform="rotate(-5 350 512)" fill="#CBD5E1" />
          <path
            d="M351 516 C353 534 385 536 415 533 C436 531 446 529 458 529"
            stroke="#0F172A"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M351 516 C353 534 385 536 415 533 C436 531 446 529 458 529"
            stroke="#64748B"
            strokeOpacity=".55"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* USB-C Thunderbolt Plug Inserted into MacBook Side */}
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