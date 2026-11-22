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

/** Outline of the shirt (shoulders, sleeves, torso) — reused as a clip for fabric detail. */
const SHIRT_PATH =
  "M530 338C508 341 484 347 462 358C440 370 427 394 423 428C420 446 421 460 425 474L466 464C461 450 461 434 464 420C462 456 460 500 458 534H662C660 500 658 456 656 420C659 434 659 450 654 464L695 474C699 460 700 446 697 428C693 394 680 370 658 358C636 347 612 341 590 338L560 372Z";

/** Trouser leg outline (left leg, right leg is mirrored) — also used as a clip. */
const LEG_PATH =
  "M480 560C480 553 491 549 505 549C519 549 530 553 530 560L528 596C527 618 526 636 525 652C517 655.5 511 653 505 655.5C499 653 493 655.5 485 652C484 636 483 618 482 596Z";

/** Fine forearm hair, scattered inside the forearm shape. */
const FOREARM_HAIR = (() => {
  const r = rng(12);
  let d = "";
  for (let i = 0; i < 46; i++) {
    const y = 470 + r() * 44;
    const left = 428 + (y - 470) * 0.55;
    const right = 465 + (y - 464) * 0.25;
    const x = left + 3 + r() * Math.max(4, right - left - 6);
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(1.6 + r() * 1.6).toFixed(1)} ${(1 + r() * 1.2).toFixed(1)}`;
  }
  return d;
})();

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

/** Fiddle-leaf-fig leaf: waxy, slightly wavy edge, tapered midrib, curved side veins, one half catching the light. */
function FigLeaf({ x, y, r, s, shade }: Leaf) {
  const veinsL = "M0 -9C-6 -11 -12 -16 -16 -22M0 -19C-7 -21 -14 -27 -19 -35M0 -29C-8 -31 -14 -38 -18 -47M0 -40C-7 -42 -12 -48 -15 -56M0 -51C-5 -53 -9 -58 -10 -64";
  const veinsR = "M0 -9C6 -11 12 -16 16 -22M0 -19C7 -21 14 -27 19 -35M0 -29C8 -31 14 -38 18 -47M0 -40C7 -42 12 -48 15 -56M0 -51C5 -53 9 -58 10 -64";
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {/* soft shadow under the leaf */}
      <path d="M3 -1C-2 -5 -13 -11 -18 -25C-23 -41 -16 -60 -6 -70C1 -75 10 -74 12 -69C22 -59 28 -41 23 -25C18 -11 8 -4 3 -1Z" fill="#000" fillOpacity=".28" filter="url(#blur-fine)" />
      {/* leaf blade */}
      <path
        d="M0 0C-5 -5 -16 -11 -21 -26C-26 -41 -20 -58 -12 -68C-8 -73 -3 -73 0 -75C3 -73 9 -74 12 -69C20 -60 26 -42 21 -26C16 -11 5 -5 0 0Z"
        fill={shadeFill(shade)}
        stroke="#0B1D12"
        strokeOpacity=".55"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      {/* light-facing half */}
      <path d="M0 -1C4 -6 14 -12 19 -26C23 -42 18 -59 9 -69C5 -73 1 -73 0 -74Z" fill="url(#leaf-sheen)" />
      {/* waxy specular streak */}
      <path d="M-13 -28C-12 -46 -6 -60 2 -68C-2 -54 -4 -40 -8 -26Z" fill="#fff" fillOpacity=".09" />
      {/* veins */}
      <path d={veinsL} stroke="#C9E3B8" strokeOpacity=".3" strokeWidth=".7" strokeLinecap="round" />
      <path d={veinsR} stroke="#C9E3B8" strokeOpacity=".26" strokeWidth=".7" strokeLinecap="round" />
      <path d="M0 -1C.6 -26 .3 -52 0 -73" stroke="#0B1D12" strokeOpacity=".45" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M0 -1C.6 -26 .3 -52 0 -73" stroke="#D5EBC2" strokeOpacity=".75" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

const FIG_LEAVES: Leaf[] = [
  { x: 149, y: 604, r: -80, s: 0.8, shade: "dark" },
  { x: 168, y: 592, r: 78, s: 0.84, shade: "dark" },
  { x: 150, y: 574, r: -68, s: 0.9, shade: "dark" },
  { x: 150, y: 560, r: -62, s: 0.98, shade: "mid" },
  { x: 168, y: 548, r: 60, s: 1.0, shade: "mid" },
  { x: 168, y: 530, r: 70, s: 0.88, shade: "dark" },
  { x: 151, y: 520, r: -46, s: 1.0, shade: "light" },
  { x: 168, y: 508, r: 46, s: 1.02, shade: "mid" },
  { x: 150, y: 496, r: -58, s: 0.84, shade: "mid" },
  { x: 152, y: 482, r: -30, s: 0.96, shade: "light" },
  { x: 167, y: 470, r: 30, s: 0.94, shade: "mid" },
  { x: 168, y: 458, r: 54, s: 0.78, shade: "light" },
  { x: 156, y: 448, r: -14, s: 0.86, shade: "light" },
  { x: 164, y: 440, r: 14, s: 0.8, shade: "mid" },
  { x: 160, y: 430, r: 0, s: 0.72, shade: "light" },
];

/** Snake-plant blade: sword shape, yellow margin, mottled cross-banding, glossy centre groove, warm lamp rim. */
function SnakeBlade({ dx, h, w, lean }: { dx: number; h: number; w: number; lean: number }) {
  const outline = `M${-w} 0C${-w * 1.08} ${-h * 0.3} ${-w * 0.7 + lean * 0.4} ${-h * 0.7} ${lean} ${-h}C${w * 0.7 + lean * 0.4} ${-h * 0.7} ${w * 1.08} ${-h * 0.3} ${w} 0Z`;
  const band = (u: number) => {
    const y = -h * u;
    const cx = lean * u * u;
    const hw = w * (1 - u * 0.78) * 0.8;
    return `M${(cx - hw).toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${(y - 6).toFixed(1)} ${(cx + hw).toFixed(1)} ${y.toFixed(1)}`;
  };
  const dark = [0.12, 0.26, 0.4, 0.54, 0.68, 0.82].map(band).join("");
  const light = [0.19, 0.33, 0.47, 0.61, 0.75].map(band).join("");
  return (
    <g transform={`translate(${1090 + dx} 650)`}>
      <path d={outline} fill="url(#snake-body)" stroke="#CFCF7E" strokeOpacity=".55" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={dark} stroke="#07150E" strokeOpacity=".5" strokeWidth="2.2" strokeLinecap="round" />
      <path d={light} stroke="#7FB08A" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round" />
      {/* glossy centre groove */}
      <path d={`M0 -4C${lean * 0.1} ${-h * 0.35} ${lean * 0.4} ${-h * 0.72} ${lean} ${-h + 4}`} stroke="#B8E0BE" strokeOpacity=".3" strokeWidth="1.8" strokeLinecap="round" />
      {/* warm light from the floor lamp on the lamp-facing edge */}
      <path d={`M${-w} -2C${-w * 1.05} ${-h * 0.3} ${-w * 0.7 + lean * 0.4} ${-h * 0.7} ${lean} ${-h}`} stroke="#FDE68A" strokeOpacity=".32" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

const SNAKE_BLADES = [
  { dx: 0, h: 236, w: 15, lean: 4 },
  { dx: -7, h: 205, w: 14, lean: -10 },
  { dx: 9, h: 190, w: 13, lean: 16 },
  { dx: -13, h: 168, w: 13, lean: -22 },
  { dx: 15, h: 150, w: 12, lean: 26 },
  { dx: -17, h: 128, w: 11, lean: -30 },
  { dx: 18, h: 118, w: 11, lean: 34 },
  { dx: -20, h: 92, w: 10, lean: -32 },
  { dx: 21, h: 84, w: 9, lean: 36 },
];

/* ───────────────────────── anatomically synced legs & arms ───────────────────────── */
function SeatedLeg({ side }: { side: "left" | "right" }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      <ellipse cx="505" cy="678" rx="42" ry="5" fill="#000" fillOpacity=".65" filter="url(#blur-small)" />

      {/* sneaker, front three-quarter view */}
      <path d="M489 650H521L525 659C531 662 537 665 537 669H473C473 665 479 662 485 659Z" fill="url(#shoe)" />
      <path d="M497 652H513L514 659H496Z" fill="#334155" />
      <path d="M494 655.5H516M493 659H517" stroke="#CBD5E1" strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="493" cy="655.5" r=".9" fill="#0B1220" />
      <circle cx="517" cy="655.5" r=".9" fill="#0B1220" />
      <path d="M475 669C475 663 486 660 505 660C524 660 535 663 535 669Z" fill="#1E293B" />
      <path d="M478 667C484 662.5 526 662.5 532 667" stroke="#94A3B8" strokeOpacity=".4" strokeWidth=".8" strokeDasharray="2 1.6" />
      <path d="M480 664.5C490 661.5 505 661.5 514 662.5" stroke="#fff" strokeOpacity=".16" strokeWidth="1.8" strokeLinecap="round" filter="url(#blur-fine)" />
      {/* midsole + outsole */}
      <path d="M472 668H538C539.5 673 537.5 677.5 532 678H478C472.5 677.5 470.5 673 472 668Z" fill="#E2E8F0" />
      <path d="M472 668.4H538" stroke="#fff" strokeOpacity=".8" strokeWidth="1" />
      <path d="M471.5 674H538.5" stroke="#0F172A" strokeOpacity=".3" strokeWidth="1.3" />
      <path d="M478 678.2H532" stroke="#020617" strokeOpacity=".65" strokeWidth="1.6" strokeLinecap="round" />

      {/* trouser leg: cloth texture, knee bulge, stress creases, front crease, hem break */}
      <g clipPath="url(#leg-clip)">
        <path d={LEG_PATH} fill="url(#pants)" />
        <rect x="478" y="548" width="54" height="110" fill="#000" filter="url(#fabric-tex)" opacity=".55" />
        <ellipse cx="503" cy="573" rx="15" ry="11" fill="#94A3B8" fillOpacity=".17" filter="url(#blur-small)" />
        <path d="M486 584C496 590 514 590 524 584M488 592C497 597 513 597 523 592M490 600C498 604 512 604 520 600" stroke="#020617" strokeOpacity=".38" strokeWidth="1.5" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M487 583C497 588 513 588 523 583" stroke="#94A3B8" strokeOpacity=".16" strokeWidth="1" strokeLinecap="round" />
        <path d="M505 602C506 620 506 636 505 654" stroke="#020617" strokeOpacity=".32" strokeWidth="1.8" filter="url(#blur-fine)" />
        <path d="M507.8 602C508.8 620 508.8 636 507.8 654" stroke="#94A3B8" strokeOpacity=".11" strokeWidth="1.2" />
        <path d="M527 560C528 592 527 630 526 654" stroke="#000" strokeOpacity=".34" strokeWidth="10" filter="url(#blur-small)" />
        <path d="M486 641C494 647 500 642 505 647C510 642 516 647 524 641M487 647C495 652 501 648 505 652C510 648 516 652 523 647" stroke="#020617" strokeOpacity=".42" strokeWidth="1.4" strokeLinecap="round" fill="none" filter="url(#blur-fine)" />
        <rect x="480" y="642" width="52" height="14" fill="#000" fillOpacity=".2" />
      </g>
      <path d="M485 652C493 655.5 499 653 505 655.5C511 653 517 655.5 525 652" stroke="#05080F" strokeOpacity=".7" strokeWidth="1.3" fill="none" />
    </g>
  );
}

function RealisticArm({ side, attentive }: { side: "left" | "right"; attentive: boolean }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      <g className={`typing-arm typing-arm--${side} ${attentive ? "is-resting" : ""}`}>
        {/* shadow cast on the desk */}
        <ellipse cx="462" cy="535" rx="30" ry="4" fill="#000" fillOpacity=".42" filter="url(#blur-small)" />

        {/* thumb + back of the hand resting on the desk pad (rest tucks behind the lid) */}
        <path d="M449 517C447 527 452 535 462 537C469 538 476 536 481 532L484 520L474 512Z" fill="url(#forearm)" />
        <path d="M448 520C441 527 443 536 452 539C457 540 461 538 459 534C456 533 454 530 455 526Z" fill="url(#forearm)" />
        <path d="M444.5 531C445 535 448 538 452 538.5" stroke="#4A2814" strokeOpacity=".35" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="449.5" cy="535" rx="3" ry="2" fill="#F1D3BC" fillOpacity=".55" transform="rotate(-35 449.5 535)" />
        <path d="M456 528C460 531 466 532 472 531" stroke="#E7B28A" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
        <path d="M451 537C458 540 468 539 478 535" stroke="#3A1F0E" strokeOpacity=".4" strokeWidth="1.2" strokeLinecap="round" />

        {/* forearm */}
        <path d="M427 468C425 492 436 512 456 524L478 516C471 504 467 488 466 464Z" fill="url(#forearm)" />
        <path d="M436 476C438 494 446 508 460 517" stroke="#E7B28A" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M463 472C464 490 469 503 475 513" stroke="#3A1F0E" strokeOpacity=".4" strokeWidth="4" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d={FOREARM_HAIR} stroke="#241208" strokeOpacity=".42" strokeWidth=".6" strokeLinecap="round" />
        <path d="M452 505C456 511 461 515 466 518M458 500C462 506 466 511 471 514" stroke="#6B3E24" strokeOpacity=".3" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="445" cy="513" rx="4" ry="3" fill="#E0A67C" fillOpacity=".25" />

        {/* wristwatch (left wrist) */}
        {!isRight && (
          <g>
            <path d="M432 502L469 490" stroke="#0A101C" strokeWidth="7.5" strokeLinecap="round" />
            <path d="M434 499.5L467 489" stroke="#475569" strokeOpacity=".5" strokeWidth="1" strokeLinecap="round" />
            <circle cx="451" cy="495" r="6.6" fill="#0F172A" stroke="#9CA3AF" strokeWidth="1.4" />
            <circle cx="451" cy="495" r="4.7" fill="#05080F" />
            <path d="M451 495V491.6M451 495L453.6 496.6" stroke="#E5E7EB" strokeWidth=".9" strokeLinecap="round" />
            <circle cx="451" cy="495" r=".8" fill="#38BDF8" />
            <path d="M446.5 491.5C448.5 489.8 452 489.6 454 490.4" stroke="#fff" strokeOpacity=".5" strokeWidth=".9" strokeLinecap="round" />
          </g>
        )}

        {/* rolled sleeve cuff with stitching and a shadow on the skin */}
        <path d="M426 475L468 463L469 471L428 483Z" fill="#000" fillOpacity=".28" filter="url(#blur-fine)" />
        <path d="M423 457L466 446L468 463L426 475Z" fill="#1B3263" stroke="#0E1B3C" strokeWidth="1" strokeLinejoin="round" />
        <path d="M424 459L465 448" stroke="#8FB0F0" strokeOpacity=".32" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M425 470L467 458" stroke="#0A1430" strokeOpacity=".55" strokeWidth=".8" strokeDasharray="2.4 2" />
        <path d="M430 464L458 456" stroke="#050A18" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" filter="url(#blur-fine)" />
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
          {/* ── realism additions ── */}
          <linearGradient id="forearm" x1="0" y1="0" x2="1" y2="0.3">
            <stop stopColor="#8E5B3A" />
            <stop offset=".35" stopColor="#CB8E64" />
            <stop offset=".7" stopColor="#B27A52" />
            <stop offset="1" stopColor="#7E4D30" />
          </linearGradient>
          <linearGradient id="leaf-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#D9F99D" stopOpacity="0" />
            <stop offset=".55" stopColor="#D9F99D" stopOpacity=".2" />
            <stop offset="1" stopColor="#D9F99D" stopOpacity=".05" />
          </linearGradient>
          <linearGradient id="snake-body" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#3C6E4C" />
            <stop offset=".4" stopColor="#24503A" />
            <stop offset=".8" stopColor="#12301F" />
            <stop offset="1" stopColor="#0C2016" />
          </linearGradient>
          <linearGradient id="pot-glaze" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#141B2A" />
            <stop offset=".2" stopColor="#5B6A85" />
            <stop offset=".48" stopColor="#2C3850" />
            <stop offset="1" stopColor="#080B14" />
          </linearGradient>
          <filter id="wood-tex" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.24" numOctaves="4" seed="8" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.09  0 0 0 0 0.04  0 0 0 1.7 -0.6" result="g" />
            <feComposite in="g" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="fabric-tex" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.7" numOctaves="2" seed="3" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -0.38" />
          </filter>
          <clipPath id="shirt-clip">
            <path d={SHIRT_PATH} />
          </clipPath>
          <clipPath id="leg-clip">
            <path d={LEG_PATH} />
          </clipPath>
        </defs>

        {/* ───── Left fiddle-leaf fig tree in a ceramic pot ───── */}
        <ellipse cx="158" cy="708" rx="62" ry="9" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          {/* trunk: dark core, bark highlight, growth nodes */}
          <path d="M158 640C154 600 164 560 158 520C153 490 162 460 160 426" stroke="#2B1E14" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M159 640C155 600 165 560 159 520C154 490 163 460 161 426" stroke="#5A4230" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M161 640C157 600 167 560 161 520C156 490 165 460 163 426" stroke="#B38E66" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M153 596h9M156 556h9M153 518h8M156 484h7M157 452h6" stroke="#1B120B" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
          {/* petioles */}
          {FIG_LEAVES.map((l, i) => (
            <path key={`p${i}`} d={`M159 ${l.y + 3}L${l.x} ${l.y}`} stroke="#2F4A2E" strokeWidth="2.2" strokeLinecap="round" />
          ))}
          {FIG_LEAVES.map((l, i) => (
            <FigLeaf key={i} {...l} />
          ))}
          {/* glazed ceramic pot */}
          <path d="M122 640H194L186 708H130Z" fill="url(#pot-glaze)" />
          <path d="M130 708H186L187 699H129Z" fill="#000" fillOpacity=".3" />
          <path d="M118 632H198L196 644H120Z" fill="url(#pot-glaze)" />
          <path d="M118 632H198" stroke="#CBD5E1" strokeOpacity=".45" strokeWidth="1" />
          <path d="M120 644H196" stroke="#000" strokeOpacity=".45" strokeWidth="2" filter="url(#blur-fine)" />
          <ellipse cx="158" cy="633" rx="39" ry="5.5" fill="url(#soil)" />
          <g fill="#64748B">
            <circle cx="142" cy="632" r="1.7" />
            <circle cx="149" cy="635" r="1.3" fill="#475569" />
            <circle cx="168" cy="634" r="1.4" />
            <circle cx="175" cy="632" r="1.6" fill="#475569" />
            <circle cx="158" cy="636" r="1.2" />
          </g>
          <path d="M136 650L141 700" stroke="#fff" strokeOpacity=".17" strokeWidth="5" strokeLinecap="round" filter="url(#blur-fine)" />
          <path d="M186 650L182 700" stroke="#000" strokeOpacity=".3" strokeWidth="7" strokeLinecap="round" filter="url(#blur-small)" />
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
          <path d="M1060 652H1120L1113 708H1067Z" fill="url(#pot-glaze)" />
          <path d="M1067 708H1113L1114 699H1066Z" fill="#000" fillOpacity=".3" />
          <path d="M1055 644H1125L1123 656H1057Z" fill="url(#pot-glaze)" />
          <path d="M1055 644H1125" stroke="#CBD5E1" strokeOpacity=".45" strokeWidth="1" />
          <path d="M1057 656H1123" stroke="#000" strokeOpacity=".45" strokeWidth="2" filter="url(#blur-fine)" />
          <ellipse cx="1090" cy="645" rx="33" ry="5" fill="url(#soil)" />
          <g fill="#64748B">
            <circle cx="1078" cy="645" r="1.5" />
            <circle cx="1088" cy="647" r="1.2" fill="#475569" />
            <circle cx="1100" cy="646" r="1.4" />
            <circle cx="1108" cy="644.5" r="1.2" fill="#475569" />
          </g>
          <path d="M1070 662L1074 702" stroke="#fff" strokeOpacity=".15" strokeWidth="5" strokeLinecap="round" filter="url(#blur-fine)" />
          <path d="M1111 652L1107 702" stroke="#000" strokeOpacity=".3" strokeWidth="6" strokeLinecap="round" filter="url(#blur-small)" />
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
            {/* neck anatomy: sternocleidomastoid cords, throat hollow, collarbones */}
            <path d="M541 318C543 330 548 342 556 352M579 318C577 330 572 342 564 352" stroke="#4A2814" strokeOpacity=".34" strokeWidth="3.4" strokeLinecap="round" filter="url(#blur-fine)" />
            <path d="M545 320C547 330 551 338 556 345M575 320C573 330 569 338 564 345" stroke="#E0A67C" strokeOpacity=".2" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M552 352Q560 358 568 352" stroke="#3A1F0E" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" filter="url(#blur-fine)" />
            <path d="M548 350C538 349 528 345 521 340M572 350C582 349 592 345 599 340" stroke="#E0A67C" strokeOpacity=".28" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M548 353C538 352 528 348 521 343M572 353C582 352 592 348 599 343" stroke="#3A1F0E" strokeOpacity=".3" strokeWidth="1.8" strokeLinecap="round" filter="url(#blur-fine)" />
            <path d="M560 356V372" stroke="#3A1F0E" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" filter="url(#blur-fine)" />

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
            {/* cotton weave, soft folds, seams and light — all clipped to the shirt */}
            <g clipPath="url(#shirt-clip)">
              <rect x="420" y="330" width="280" height="210" fill="#000" filter="url(#fabric-tex)" opacity=".5" />
              <ellipse cx="560" cy="396" rx="96" ry="34" fill="url(#screen-spill)" opacity=".16" />
              <path d="M648 362C672 372 688 392 694 422" stroke="#FDE68A" strokeOpacity=".24" strokeWidth="7" strokeLinecap="round" filter="url(#blur-small)" />
              <path d="M516 346C540 362 580 362 604 346" stroke="#050A18" strokeOpacity=".4" strokeWidth="8" strokeLinecap="round" filter="url(#blur-small)" />
              {/* upper-arm folds + elbow creases (mirrored on both sleeves) */}
              <path d="M444 392C440 412 440 430 444 446M676 392C680 412 680 430 676 446" stroke="#050A18" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" filter="url(#blur-fine)" />
              <path d="M428 452C440 450 452 454 464 462M427 460C440 458 452 462 466 470M692 452C680 450 668 454 656 462M693 460C680 458 668 462 654 470" stroke="#050A18" strokeOpacity=".34" strokeWidth="2.6" strokeLinecap="round" filter="url(#blur-fine)" />
              <path d="M430 449C441 447 453 451 463 458M690 449C679 447 667 451 657 458" stroke="#8FB0F0" strokeOpacity=".16" strokeWidth="1" strokeLinecap="round" />
              {/* shoulder / armhole seams (stitched) */}
              <path d="M470 352C462 372 458 394 462 420M650 352C658 372 662 394 658 420" stroke="#0A1430" strokeOpacity=".6" strokeWidth=".9" strokeDasharray="2.6 2" />
              <path d="M520 342C506 346 490 351 474 358M600 342C614 346 630 351 646 358" stroke="#0A1430" strokeOpacity=".5" strokeWidth=".9" strokeDasharray="2.6 2" />
              {/* lower body: falls into shadow under the desk lip */}
              <rect x="440" y="486" width="240" height="52" fill="#000" fillOpacity=".24" />
            </g>
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
            <path d="M524 338L556 372M596 338L564 372" stroke="#0A1430" strokeOpacity=".55" strokeWidth=".8" strokeDasharray="2.2 1.8" />
            <path d="M516 361L543 391M604 361L577 391" stroke="#050A18" strokeOpacity=".35" strokeWidth="2.4" strokeLinecap="round" filter="url(#blur-fine)" />
          </g>

          
        </motion.g>

        {/* ───── Executive Walnut Desk ───── */}
        <ellipse cx="560" cy="684" rx="340" ry="20" fill="#000" fillOpacity=".55" filter="url(#blur-soft)" />
        <g>
          {/* brushed-steel legs: bevelled tube, dark side face, bolt, adjustable feet */}
          {[[268, 292], [828, 852]].map(([a, b]) => (
            <g key={a}>
              <path d={`M${a} 563H${b}L${b - 2} 666H${a + 2}Z`} fill="url(#desk-leg)" />
              <path d={`M${a} 563H${a + 4}L${a + 3} 666H${a + 2}Z`} fill="#E2E8F0" fillOpacity=".45" />
              <path d={`M${b - 4} 563H${b}L${b - 2} 666H${b - 5}Z`} fill="#000" fillOpacity=".38" />
              <circle cx={(a + b) / 2} cy="580" r="1.8" fill="#0F172A" />
              <circle cx={(a + b) / 2 - 0.6} cy="579.5" r=".7" fill="#CBD5E1" fillOpacity=".7" />
              <path d={`M${a - 5} 664H${b + 5}L${b + 3} 671H${a - 3}Z`} fill="#0B111E" />
              <path d={`M${a - 5} 664H${b + 5}`} stroke="#94A3B8" strokeOpacity=".45" strokeWidth="1.4" />
            </g>
          ))}
          {/* apron under the top + shadow the desk casts on the knees */}
          <rect x="250" y="553" width="620" height="10" fill="url(#desk-apron)" />
          <rect x="262" y="563" width="596" height="46" fill="url(#under-shadow)" />
          {/* walnut top surface with grain, sheen and lamp reflection */}
          <path d="M276 506H844L890 541H230Z" fill="url(#walnut-top)" />
          <g clipPath="url(#desk-top-clip)">
            <path d={WOOD_GRAIN} stroke="#2A1709" strokeOpacity=".28" strokeWidth=".9" />
            {/* real wood figure: stretched noise, plank seams, depth */}
            <path d="M276 506H844L890 541H230Z" fill="#000" filter="url(#wood-tex)" opacity=".6" />
            <path d="M418 506L395 541M560 506L560 541M702 506L725 541" stroke="#1A0E05" strokeOpacity=".35" strokeWidth=".9" />
            <path d="M419 506L396 541M561 506L561 541M703 506L726 541" stroke="#D9A066" strokeOpacity=".12" strokeWidth=".8" />
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
          <rect x="230" y="541" width="660" height="12" rx="2.5" fill="#000" filter="url(#wood-tex)" opacity=".55" />
          <path d="M231 552.4H889" stroke="#000" strokeOpacity=".5" strokeWidth="1.4" />
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
            <rect x="468" y="406" width="184" height="122" fill="#000" filter="url(#brushed)" opacity=".15" />
            <path d="M474 414H520L492 520H474Z" fill="#fff" fillOpacity=".04" />
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