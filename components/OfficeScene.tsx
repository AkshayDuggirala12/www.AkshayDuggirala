"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";

/* ───────────────────────── geometry ───────────────────────── */
const VIEWBOX = { x: -300, y: 0, w: 1720, h: 720 };
const VB = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`;
/**
 * Scene scale. The developer, desk, chair, laptop and phone are drawn in "design units" (floor at y=1048) with
 * real-world proportions (desk top = 75 cm, seated shin ≈ 45 cm …) and then scaled down as one group so the
 * whole figure — down to the shoes — fits in the frame. HEAD is where the eyes end up on screen.
 */
const SCENE_S = 0.66;
const SCENE_FLOOR = 700;
const SCENE_TF = `translate(560 ${SCENE_FLOOR}) scale(${SCENE_S}) translate(-560 -1048)`;
const HEAD = { x: 560, y: SCENE_FLOOR + (245 - 1048) * SCENE_S };

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

/** Outline of the shirt (shoulders, sleeves, torso) — natural shoulder slope, upper arms hanging at the sides. */
const SHIRT_PATH =
  "M530 338C514 341 494 345 478 352C460 360 446 370 440 386C435 402 433 432 435 470L472 458C470 446 470 432 472 418C470 460 466 500 464 534H656C654 500 650 460 648 418C650 432 650 446 648 458L685 470C687 432 685 402 680 386C674 370 660 360 642 352C626 345 606 341 590 338L560 372Z";

/** Slim trouser leg (left leg — the right one is mirrored): thigh under the desk, knee, shin, ankle hem. */
const LEG_PATH =
  "M422 630C418 656 417 682 419 702C421 740 424 800 428 860C431 905 432 940 432 970C446 977 462 978 488 974C489 940 492 900 497 855C503 800 512 745 522 700C527 680 530 656 530 630Z";

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

/* ───────────────────────── long, swept-back wavy hair (hero style) ───────────────────────── */
/** Catmull-Rom → cubic Bézier, so every strand is a smooth hand-drawn-looking curve. */
function smoothPath(p: [number, number][]) {
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Dark-chocolate brown with warm highlights — matches your hair reference photo. */
const HAIR_TONES = ["#0F0805", "#170C07", "#21120A", "#2E1A0E", "#42281A", "#5A3922", "#7A5336"];
type Strand = { d: string; w: number; c: string; o: number };

/** Top hair: strands radiate from the front hairline, wave back over the crown and sweep slightly to one side. */
const HAIR_FRONT: Strand[] = (() => {
  const r = rng(101);
  const out: Strand[] = [];
  const N = 120;
  for (let i = 0; i < N; i++) {
    const t = (i + r() * 0.9) / N;
    const th = Math.PI + t * Math.PI;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    const hx = 560 + 47 * cs;
    const hy = 236 + 24 * sn;
    const ox = 560 + (66 + r() * 5) * cs;
    const oy = 212 + (66 + r() * 5) * sn;
    const s0 = r() * 0.6;
    const sx = hx + (ox - hx) * s0;
    const sy = hy + (oy - hy) * s0;
    const dx = ox - sx;
    const dy = oy - sy;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    const amp = 2.5 + r() * 4;
    const ph = r() * 6.28;
    const fr = 1.1 + r() * 1.3;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 5; k++) {
      const u = k / 5;
      const wave = Math.sin(ph + u * fr * Math.PI * 2) * amp * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1));
      pts.push([sx + dx * u + nx * wave + u * u * 7, sy + dy * u + ny * wave]);
    }
    const tr = r();
    const c = tr < 0.35 ? HAIR_TONES[1 + Math.floor(r() * 2)] : tr < 0.85 ? HAIR_TONES[3 + Math.floor(r() * 2)] : HAIR_TONES[5];
    out.push({ d: smoothPath(pts), w: 1.3 + r() * 1.5, c, o: 0.28 + r() * 0.32 });
  }
  return out;
})();

/** Long hair that falls behind the ears down to the collar (one list per side, different seeds → not mirror-perfect). */
function backStrands(seed: number, side: -1 | 1): Strand[] {
  const r = rng(seed);
  const out: Strand[] = [];
  for (let i = 0; i < 30; i++) {
    const x0 = 560 + side * (34 + r() * 26);
    const y0 = 212 + r() * 34;
    const y1 = 316 + r() * 28;
    const amp = 2 + r() * 2.2;
    const ph = r() * 6.28;
    const fr = 1.2 + r() * 1.4;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 7; k++) {
      const u = k / 7;
      const y = y0 + (y1 - y0) * u;
      const x = x0 + side * Math.sin(u * Math.PI) * 2.5 + Math.sin(ph + u * fr * Math.PI * 2) * amp + side * Math.pow(u, 3) * (4 + r() * 4);
      pts.push([x, y]);
    }
    const tr = r();
    out.push({
      d: smoothPath(pts),
      w: 1.6 + r() * 1.8,
      c: tr < 0.5 ? HAIR_TONES[2] : tr < 0.85 ? HAIR_TONES[3 + Math.floor(r() * 2)] : HAIR_TONES[5],
      o: 0.25 + r() * 0.3,
    });
  }
  return out;
}
const HAIR_BACK_L = backStrands(211, -1);
const HAIR_BACK_R = backStrands(317, 1);

/** Hair that hangs behind the head — two lobes that follow the edge of the neck (so the neck stays in front). */
const HAIR_LOBE_L =
  "M560 196C534 196 514 208 508 232C503 252 500 276 500 298C500 316 503 330 498 346C506 349 515 344 520 337C523 344 526 345 528 343L531.5 334L535 320L535 296L541 250L560 205Z";
const HAIR_LOBE_R =
  "M560 196C586 196 606 208 612 232C617 252 620 276 620 298C620 316 617 330 622 346C614 349 605 344 600 337C597 344 594 345 592 343L588.5 334L585 320L585 296L579 250L560 205Z";

/** Silhouette of the top hair: lifted, swept-back volume with a high, slightly irregular hairline. */
const HAIR_FRONT_PATH =
  "M507 252C494 226 493 192 510 170C524 152 543 144 562 144C583 144 603 153 615 171C629 192 627 228 613 252C611 241 608 231 601 224C593 217 582 213 571 211C563 209.5 556 209.5 549 211C538 214 528 218 521 224C513 231 509 241 507 252Z";

/* ───────────────────────── sheesham wood grain on the table top (runs along the length, like your table photo) ───────────────────────── */
const WOOD_GRAIN = (() => {
  const r = rng(17);
  const dark: string[] = [];
  const light: string[] = [];
  for (let i = 0; i < 46; i++) {
    const t = (i + r()) / 46;
    const y = 506 + t * 39;
    const lx = 190 - 54 * t;
    const rx = 930 + 54 * t;
    const w1 = (r() - 0.5) * 3.2;
    const w2 = (r() - 0.5) * 3.2;
    const c1 = lx + (rx - lx) * (0.2 + r() * 0.15);
    const c2 = lx + (rx - lx) * (0.55 + r() * 0.2);
    const seg = `M${lx.toFixed(1)} ${y.toFixed(1)}C${c1.toFixed(1)} ${(y + w1).toFixed(1)} ${c2.toFixed(1)} ${(y + w2).toFixed(1)} ${rx.toFixed(1)} ${(y + (w1 + w2) * 0.3).toFixed(1)}`;
    (r() < 0.55 ? dark : light).push(seg);
  }
  return { dark: dark.join(""), light: light.join("") };
})();

/** Vertical grain for the table legs. */
const LEG_GRAIN = (() => {
  const r = rng(23);
  let d = "";
  for (let i = 0; i < 7; i++) {
    const x = 2 + i * 5.5 + r() * 2;
    d += `M${x.toFixed(1)} 0C${(x + (r() - 0.5) * 3).toFixed(1)} 150 ${(x + (r() - 0.5) * 3).toFixed(1)} 330 ${(x + (r() - 0.5) * 2).toFixed(1)} 490`;
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

/* ───────────────────────── Campus sneaker: taupe suede + canvas, maroon stripes, white midsole, gum outsole ───────────────────────── */
/** Drawn in a 112×60 box with the toe pointing right (same view as your product photo). */
function CampusShoe() {
  return (
    <g>
      {/* gum rubber outsole + toe-bumper ring pattern */}
      <path d="M2 46C8 52 30 56 56 58C80 60 100 58 107 49" stroke="url(#n-shoe-gum)" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 51.5C30 56.5 56 59 82 59.5" stroke="#4A2A0E" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" />
      <circle cx="102" cy="50.5" r="3.1" stroke="#6E4119" strokeOpacity=".6" strokeWidth=".9" />
      <circle cx="102" cy="50.5" r="1.2" fill="#6E4119" fillOpacity=".55" />
      {/* chunky white midsole */}
      <path d="M2 35C20 38 50 44 78 48C90 50 100 50 106 45C109 50 105 55 96 56.5C80 58.5 62 57.5 50 55.5C28 52 8 49 3 44C1 41 1 37 2 35Z" fill="url(#n-shoe-sole)" />
      <path d="M3 36C22 39 50 45 78 49C91 51 101 51 106 46" stroke="#fff" strokeOpacity=".9" strokeWidth="1" strokeLinecap="round" />
      <path d="M4 45C10 49.5 28 53 50 55.5C62 57 80 58 95 56" stroke="#8F887A" strokeOpacity=".4" strokeWidth="1" />

      {/* upper */}
      <path d="M2 35C0 24 3 12 9 6C14 2 28 0 36 1C42 -1 50 1 54 6C62 11 74 17 86 24C98 29 105 36 106 45C100 49 90 49 78 48C50 44 20 38 2 35Z" fill="url(#n-shoe-canvas)" />
      <g clipPath="url(#n-shoe-upper)">
        {/* suede heel counter, eyestay and toe cap */}
        <path d="M0 18C6 27 20 33 42 38L0 40Z" fill="url(#n-shoe-suede)" />
        <path d="M38 5C50 9 66 16 82 24" stroke="url(#n-shoe-suede)" strokeWidth="7" strokeLinecap="round" />
        <path d="M70 21C88 27 103 36 108 47C98 51 88 50 79 48C78 40 75 30 70 21Z" fill="url(#n-shoe-suede)" />
        {/* maroon side stripes */}
        <path d="M20 36L26 38.5L40 21L35 18Z" fill="url(#n-shoe-maroon)" />
        <path d="M33 41L39 43.5L53 29L48 26Z" fill="url(#n-shoe-maroon)" />
        <path d="M21 35.3L36 19M34 40.2L49 26.5" stroke="#E7B7BE" strokeOpacity=".25" strokeWidth=".6" />
        {/* stitching */}
        <path d="M71 22C79 26 88 31 95 37" stroke="#6F5A46" strokeOpacity=".7" strokeWidth=".6" strokeDasharray="1.6 1.4" />
        <path d="M3 22C9 28 20 33 38 36.5" stroke="#6F5A46" strokeOpacity=".7" strokeWidth=".6" strokeDasharray="1.6 1.4" />
        {/* fabric weave + soft form shading */}
        <rect x="0" y="-2" width="112" height="56" fill="#000" filter="url(#fabric-tex)" opacity=".22" />
        <rect x="0" y="-2" width="112" height="56" fill="url(#n-shoe-shade)" />
        <path d="M60 14C74 20 90 28 100 36" stroke="#fff" strokeOpacity=".16" strokeWidth="2.2" strokeLinecap="round" filter="url(#blur-fine)" />
      </g>
      <path d="M2 35C0 24 3 12 9 6C14 2 28 0 36 1C42 -1 50 1 54 6C62 11 74 17 86 24C98 29 105 36 106 45" stroke="#3A2C20" strokeOpacity=".35" strokeWidth=".7" />

      {/* cream padded collar + maroon tongue tab + laces */}
      <path d="M9 6C12 2 27 0 36 1C40 2 41 5 40 8C30 8 18 9 10 12C8 10 8 8 9 6Z" fill="#EFE8D9" stroke="#B9AE98" strokeWidth=".5" />
      <path d="M14 3.5L13 10.5M19 2.5L18 9.5M24 2L23.5 9M29 1.8L29 8.6M34 1.8L34.5 8.2" stroke="#B9AE98" strokeOpacity=".55" strokeWidth=".6" />
      <path d="M39 1C44 0 50 1 54 6L51 12L42 9Z" fill="url(#n-shoe-maroon)" />
      <text x="44.6" y="7.4" fontSize="3.1" fontWeight="700" fill="#F6EDEA" fontFamily="Arial, Helvetica, sans-serif" transform="rotate(14 44.6 7.4)">CAMPUS</text>
      <g strokeLinecap="round">
        <path d="M45 10.2L52 11.5M52 12.6L59 15.2M59.5 16.6L66.5 19.4M67 20.6L74 23.6M74.5 24.4L80 27" stroke="#3A3226" strokeOpacity=".45" strokeWidth="3.4" />
        <path d="M44 9.2L51 10.5M51 11.6L58 14.2M58.5 15.6L65.5 18.4M66 19.6L73 22.6M73.5 23.4L79 26" stroke="#F1EBDD" strokeWidth="2.6" />
        <path d="M45.5 9.8L50 12.2C46 14 43 13.5 42.5 11.8C42 10.2 44 9.4 45.5 9.8ZM47 11.6L53 10.8C54.4 13.2 52 15.2 49 14.4" stroke="#C9BFAA" strokeWidth=".6" fill="#F1EBDD" />
      </g>
    </g>
  );
}

/* ───────────────────────── seated legs: thigh under the desk → knee → long shin → ankle hem → sneaker ───────────────────────── */
function SeatedLeg({ side }: { side: "left" | "right" }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      <ellipse cx="436" cy="1038" rx="88" ry="9" fill="#000" fillOpacity=".62" filter="url(#blur-small)" />

      {/* sneaker (toe turned slightly outward, flipped so the left foot points left) */}
      <g transform="translate(490 968) scale(-1.1 1.15)">
        <CampusShoe />
      </g>

      {/* trousers: slim dark denim with knee, shin and hem detail */}
      <g clipPath="url(#n-leg-clip)">
        <path d={LEG_PATH} fill="url(#n-pants)" />
        <rect x="410" y="620" width="130" height="370" fill="url(#n-denim)" />
        <rect x="410" y="620" width="130" height="370" fill="#000" filter="url(#fabric-tex)" opacity=".45" />
        <rect x="410" y="620" width="130" height="90" fill="url(#n-thigh-shade)" />
        <ellipse cx="470" cy="694" rx="36" ry="21" fill="#9DB0D0" fillOpacity=".15" filter="url(#blur-small)" />
        <ellipse cx="464" cy="688" rx="15" ry="8" fill="#C3D0E6" fillOpacity=".1" filter="url(#blur-fine)" />
        {/* knee wrinkles */}
        <path d="M426 718C442 730 482 730 516 718M431 728C447 738 481 738 509 729M437 738C450 745 480 745 503 738" stroke="#050912" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M428 716C446 726 484 726 518 715M434 726C449 735 481 735 507 726" stroke="#8FA3C7" strokeOpacity=".16" strokeWidth="1" strokeLinecap="round" />
        {/* shin form: front crease, inner shadow, outer rim light */}
        <path d="M464 744C463 800 462 872 462 944" stroke="#050912" strokeOpacity=".26" strokeWidth="2.2" filter="url(#blur-fine)" />
        <path d="M468 744C467 800 466 872 466 944" stroke="#8FA3C7" strokeOpacity=".1" strokeWidth="1.2" />
        <path d="M494 700C497 780 494 880 490 962" stroke="#000" strokeOpacity=".42" strokeWidth="16" filter="url(#blur-small)" />
        <path d="M430 722C432 800 434 880 435 950" stroke="#6F86B0" strokeOpacity=".24" strokeWidth="3" strokeLinecap="round" filter="url(#blur-fine)" />
        {/* stacked hem */}
        <path d="M432 940C446 948 462 946 490 938M432 950C446 958 464 956 490 948M433 959C447 966 463 965 489 958" stroke="#050912" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M432 943C446 951 462 949 490 941" stroke="#8FA3C7" strokeOpacity=".14" strokeWidth="1" />
        <rect x="420" y="962" width="76" height="20" fill="#000" fillOpacity=".25" />
      </g>
      <path d="M432 970C446 977 462 978 488 974" stroke="#05080F" strokeOpacity=".75" strokeWidth="1.6" fill="none" />
      <path d="M433 965.5C447 972.5 462 973.5 487 969.5" stroke="#9DB0D0" strokeOpacity=".22" strokeWidth=".9" strokeDasharray="2.4 2" fill="none" />
    </g>
  );
}

/** Long hair behind the head — falls past the ears to the collar; clipped so it never covers the neck. */
function HairBack() {
  return (
    <g>
      <path d={HAIR_LOBE_L} fill="url(#n-hair-back)" />
      <path d={HAIR_LOBE_R} fill="url(#n-hair-back)" />
      <g clipPath="url(#n-hair-back-clip)">
        {[...HAIR_BACK_L, ...HAIR_BACK_R].map((s, i) => (
          <path key={i} d={s.d} stroke={s.c} strokeOpacity={s.o} strokeWidth={s.w} strokeLinecap="round" />
        ))}
        <path d="M503 250C500 280 502 310 500 340M617 250C620 280 618 310 620 340" stroke="#7A5336" strokeOpacity=".2" strokeWidth="2" strokeLinecap="round" filter="url(#blur-fine)" />
        <rect x="495" y="300" width="130" height="50" fill="url(#n-hair-tipshade)" />
      </g>
    </g>
  );
}

/** Top hair: high hairline, lifted swept-back waves with sheen, a few loose strands over the forehead. */
function HairFront() {
  return (
    <g>
      <path d={HAIR_FRONT_PATH} fill="url(#n-hair-top)" />
      <g clipPath="url(#n-hair-front-clip)">
        {HAIR_FRONT.map((s, i) => (
          <path key={i} d={s.d} stroke={s.c} strokeOpacity={s.o} strokeWidth={s.w} strokeLinecap="round" />
        ))}
        {/* quiff lift + soft sheen bands following the waves */}
        <path d="M520 200C524 170 552 150 584 152C556 158 538 176 534 204Z" fill="#5A3922" fillOpacity=".18" filter="url(#blur-fine)" />
        <path d="M514 196C526 168 556 156 588 164" stroke="#D29B68" strokeOpacity=".16" strokeWidth="9" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M548 158C578 156 606 172 614 200" stroke="#C48A5A" strokeOpacity=".13" strokeWidth="8" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M530 186C546 174 570 172 592 184" stroke="#E0AE7C" strokeOpacity=".1" strokeWidth="4" strokeLinecap="round" filter="url(#blur-fine)" />
        <path d="M502 214C500 230 503 242 508 250M618 214C620 230 617 242 612 250" stroke="#8A5E3C" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" filter="url(#blur-fine)" />
      </g>
      {/* soft hairline so skin → hair is not a hard cut */}
      <path d="M521 224C528 218 538 214 549 211C556 209.5 563 209.5 571 211C582 213 593 217 601 224" stroke="#1A0E08" strokeOpacity=".5" strokeWidth="3.2" strokeLinecap="round" filter="url(#blur-fine)" />
      {/* sideburns that run into the beard */}
      <path d="M511 240C512 250 514 258 516 262L519 261C518 254 518 246 518 238ZM609 240C608 250 606 258 604 262L601 261C602 254 602 246 602 238Z" fill="#241309" fillOpacity=".75" />
    </g>
  );
}


function RealisticArm({ side, attentive }: { side: "left" | "right"; attentive: boolean }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(1120 0) scale(-1 1)" : undefined}>
      <g className={`typing-arm typing-arm--${side} ${attentive ? "is-resting" : ""}`}>
        <g transform="translate(9 0)">
        {/* shadow cast on the desk */}
        <ellipse cx="462" cy="535" rx="30" ry="4" fill="#000" fillOpacity=".42" filter="url(#blur-small)" />

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
          {/* ───── sheesham table (warm honey-brown, dark grain streaks) ───── */}
          <linearGradient id="n-wood-top" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#B06A33" />
            <stop offset=".28" stopColor="#C6834A" />
            <stop offset=".55" stopColor="#CF8E52" />
            <stop offset=".8" stopColor="#BC7840" />
            <stop offset="1" stopColor="#A05C2A" />
          </linearGradient>
          <linearGradient id="n-wood-edge" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#A5622F" />
            <stop offset=".5" stopColor="#8A4D24" />
            <stop offset="1" stopColor="#5A2E14" />
          </linearGradient>
          <linearGradient id="n-wood-apron" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#94572A" />
            <stop offset="1" stopColor="#6A3718" />
          </linearGradient>
          <linearGradient id="n-wood-drawer" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#B27040" />
            <stop offset="1" stopColor="#8F5228" />
          </linearGradient>
          <linearGradient id="n-wood-leg" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#9A5A2B" />
            <stop offset=".4" stopColor="#B06E3A" />
            <stop offset="1" stopColor="#6E391A" />
          </linearGradient>
          <radialGradient id="n-knob" cx=".35" cy=".3" r=".8">
            <stop stopColor="#6B4126" />
            <stop offset=".5" stopColor="#2F170A" />
            <stop offset="1" stopColor="#140A04" />
          </radialGradient>
          <linearGradient id="n-apron-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#000" stopOpacity=".55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="n-under-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#000" stopOpacity=".72" />
            <stop offset=".55" stopColor="#000" stopOpacity=".28" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="n-chrome" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#1E293B" />
            <stop offset=".35" stopColor="#94A3B8" />
            <stop offset=".6" stopColor="#334155" />
            <stop offset="1" stopColor="#0B1220" />
          </linearGradient>
          <clipPath id="n-top-clip">
            <path d="M190 506H930L984 545H136Z" />
          </clipPath>
          <clipPath id="n-leg-front-clip">
            <path d="M0 0H42L35 495H7Z" />
          </clipPath>

          {/* ───── trousers ───── */}
          <linearGradient id="n-pants" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#33425F" />
            <stop offset=".3" stopColor="#243148" />
            <stop offset=".7" stopColor="#161E30" />
            <stop offset="1" stopColor="#0B101B" />
          </linearGradient>
          <pattern id="n-denim" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
            <rect width="3" height="1" fill="#9DB0D0" fillOpacity=".07" />
            <rect y="1.5" width="3" height=".6" fill="#000" fillOpacity=".12" />
          </pattern>
          <linearGradient id="n-thigh-shade" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#000" stopOpacity=".5" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <clipPath id="n-leg-clip">
            <path d={LEG_PATH} />
          </clipPath>

          {/* ───── Campus sneaker ───── */}
          <linearGradient id="n-shoe-canvas" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#D8CBB8" />
            <stop offset=".5" stopColor="#C6B7A2" />
            <stop offset="1" stopColor="#A89782" />
          </linearGradient>
          <linearGradient id="n-shoe-suede" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#BBA38B" />
            <stop offset="1" stopColor="#8F7A64" />
          </linearGradient>
          <linearGradient id="n-shoe-maroon" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8E2A39" />
            <stop offset="1" stopColor="#5F1824" />
          </linearGradient>
          <linearGradient id="n-shoe-sole" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#FFFFFF" />
            <stop offset=".55" stopColor="#F1ECE2" />
            <stop offset="1" stopColor="#CFC8BA" />
          </linearGradient>
          <linearGradient id="n-shoe-gum" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#A66E36" />
            <stop offset=".5" stopColor="#C58A4A" />
            <stop offset="1" stopColor="#9A6330" />
          </linearGradient>
          <linearGradient id="n-shoe-shade" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff" stopOpacity=".1" />
            <stop offset=".5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".28" />
          </linearGradient>
          <clipPath id="n-shoe-upper">
            <path d="M2 35C0 24 3 12 9 6C14 2 28 0 36 1C42 -1 50 1 54 6C62 11 74 17 86 24C98 29 105 36 106 45C100 49 90 49 78 48C50 44 20 38 2 35Z" />
          </clipPath>

          {/* ───── hair ───── */}
          <radialGradient id="n-hair-top" cx=".5" cy=".55" r=".62">
            <stop stopColor="#3A2314" />
            <stop offset=".6" stopColor="#1C0F08" />
            <stop offset="1" stopColor="#0C0604" />
          </radialGradient>
          <linearGradient id="n-hair-back" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#26150C" />
            <stop offset="1" stopColor="#0E0705" />
          </linearGradient>
          <linearGradient id="n-hair-tipshade" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".45" />
          </linearGradient>
          <clipPath id="n-hair-front-clip">
            <path d={HAIR_FRONT_PATH} />
          </clipPath>
          <clipPath id="n-hair-back-clip">
            <path d={HAIR_LOBE_L} />
            <path d={HAIR_LOBE_R} />
          </clipPath>

          {/* ───── iPhone 18 Pro Max ───── */}
          <linearGradient id="n-phone-frame" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#C4CEDB" />
            <stop offset=".3" stopColor="#8794A8" />
            <stop offset=".6" stopColor="#D5DDE8" />
            <stop offset="1" stopColor="#6D7A8E" />
          </linearGradient>
          <linearGradient id="n-phone-screen" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#0A1330" />
            <stop offset=".55" stopColor="#060C22" />
            <stop offset="1" stopColor="#02040E" />
          </linearGradient>
          <linearGradient id="n-adtech" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#6366F1" />
            <stop offset=".55" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <radialGradient id="n-phone-glow">
            <stop stopColor="#38BDF8" stopOpacity=".55" />
            <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ───── Fiddle-leaf fig (scaled to a real ~1.2 m houseplant next to the desk) ───── */}
        <g transform="translate(110 704) scale(1.35) translate(-158 -708)">
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
        </g>

        {/* ───── Floor lamp (warm light cone) ───── */}
        <g transform="translate(1000 700) scale(1.12) translate(-962 -666)">
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
        </g>

        {/* ───── Snake plant (scaled to real size) ───── */}
        <g transform="translate(1150 702) scale(1.2) translate(-1090 -708)">
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
        </g>

        {/* ═════ Everything below shares one real-world scale: desk 75 cm, seated shin ≈ 45 cm, etc. ═════ */}
        <g transform={SCENE_TF}>
          {/* floor contact shadow of the table */}
          <ellipse cx="560" cy="1056" rx="480" ry="24" fill="#000" fillOpacity=".6" filter="url(#blur-soft)" />

          {/* back table legs (sit in the shade under the desk) */}
          {[[230, 258, 236, 254], [890, 862, 884, 866]].map(([a, b, c, d]) => (
            <g key={a}>
              <path d={`M${a} 600H${b}L${d} 1022H${c}Z`} fill="url(#n-wood-leg)" />
              <path d={`M${a} 600H${b}L${d} 1022H${c}Z`} fill="#000" fillOpacity=".5" />
              <ellipse cx={(c + d) / 2} cy="1022" rx="16" ry="3.5" fill="#000" fillOpacity=".55" filter="url(#blur-fine)" />
            </g>
          ))}

          {/* ───── Ergonomic executive chair: tall back, gas-lift column, 5-star base on casters ───── */}
          <g>
            <rect x="520" y="226" width="80" height="46" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            <rect x="468" y="272" width="184" height="290" rx="30" fill="#0B111E" stroke="#334155" strokeWidth="2" />
            <rect x="480" y="284" width="160" height="264" rx="24" fill="#151F32" />
            <path d="M488 312H632M488 338H632M488 364H632M488 390H632M488 416H632M488 442H632M488 468H632M488 494H632" stroke="#334155" strokeOpacity=".28" strokeWidth="1" />
            {/* seat edge, column, star base */}
            <path d="M440 748H680V772C680 782 660 788 640 788H480C460 788 440 782 440 772Z" fill="#0A0F1B" />
            <rect x="553" y="786" width="14" height="176" fill="url(#n-chrome)" />
            <path d="M560 958L462 1006M560 958L658 1006M560 958L560 1026M560 958L512 996M560 958L608 996" stroke="#0B1220" strokeWidth="11" strokeLinecap="round" />
            <path d="M560 955L463 1003M560 955L657 1003" stroke="#64748B" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
            {[[458, 1014], [662, 1014], [560, 1032]].map(([x, y]) => (
              <g key={x}>
                <circle cx={x} cy={y} r="8.5" fill="#020617" />
                <circle cx={x - 2} cy={y - 2.5} r="3" fill="#94A3B8" fillOpacity=".35" />
              </g>
            ))}
          </g>

          {/* ───── Legs: knees under the desk, long shins, Campus sneakers ───── */}
          <SeatedLeg side="left" />
          <SeatedLeg side="right" />
          {/* the table top throws a shadow over the knees and shins */}
          <rect x="204" y="600" width="712" height="190" fill="url(#n-under-shadow)" />

          {/* ───── The developer ───── */}
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
              <HairBack />
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

              <HairFront />
            </motion.g>

            {/* LAYER C: navy button-up — shoulders, upper arms and torso in one piece */}
            <path d={SHIRT_PATH} fill="url(#jacket)" />
            <path d={SHIRT_PATH} fill="url(#shirt-shade)" />
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

          {/* ───── Sheesham-wood table (4 tapered legs, drawer in the apron — like your photo) ───── */}
          <g>
            {/* apron + drawer */}
            <rect x="204" y="567" width="712" height="67" fill="url(#n-wood-apron)" />
            <rect x="204" y="567" width="712" height="67" fill="#000" filter="url(#wood-tex)" opacity=".5" />
            <rect x="204" y="567" width="712" height="26" fill="url(#n-apron-shadow)" />
            <path d="M204 633.5H916" stroke="#2E1608" strokeOpacity=".6" strokeWidth="1.4" />
            <rect x="425" y="580" width="270" height="46" rx="3" fill="url(#n-wood-drawer)" stroke="#3A1C09" strokeOpacity=".75" strokeWidth="1.6" />
            <rect x="425" y="580" width="270" height="46" rx="3" fill="#000" filter="url(#wood-tex)" opacity=".42" />
            <rect x="431" y="585.5" width="258" height="35" rx="2" stroke="#EAB982" strokeOpacity=".22" strokeWidth="1" />
            <path d="M426 581.5H694" stroke="#EAB982" strokeOpacity=".3" strokeWidth="1" />
            <ellipse cx="560" cy="607.5" rx="6.5" ry="2.6" fill="#000" fillOpacity=".35" filter="url(#blur-fine)" />
            <circle cx="560" cy="603" r="5.6" fill="url(#n-knob)" />
            <circle cx="558.4" cy="601.2" r="1.5" fill="#fff" fillOpacity=".5" />

            {/* front legs: square, tapered, with a darker inner side face */}
            {[[169, 1], [951, -1]].map(([x, s]) => (
              <g key={x} transform={`translate(${x} 567) scale(${s} 1)`}>
                <path d="M0 0H42L35 495H7Z" fill="url(#n-wood-leg)" />
                <g clipPath="url(#n-leg-front-clip)">
                  <path d={LEG_GRAIN} stroke="#4A230C" strokeOpacity=".32" strokeWidth=".9" />
                  <path d="M0 0H42L35 495H7Z" fill="#000" filter="url(#wood-tex)" opacity=".4" />
                  <path d="M36 0H42L35 495H31Z" fill="#2E1608" fillOpacity=".5" />
                  <path d="M0.8 0L7.6 495" stroke="#F0C48E" strokeOpacity=".3" strokeWidth="1.2" />
                  <rect x="0" y="0" width="45" height="40" fill="url(#n-apron-shadow)" />
                </g>
                <path d="M5 488H37L36 495H6Z" fill="#241207" />
                <path d="M5.5 488.5H36.5" stroke="#C99A62" strokeOpacity=".4" strokeWidth=".8" />
              </g>
            ))}

            {/* table top: honey-brown sheesham with long dark grain streaks and a satin varnish */}
            <path d="M190 506H930L984 545H136Z" fill="url(#n-wood-top)" />
            <g clipPath="url(#n-top-clip)">
              <path d={WOOD_GRAIN.dark} stroke="#5B2C0F" strokeOpacity=".32" strokeWidth=".9" />
              <path d={WOOD_GRAIN.light} stroke="#EDBF85" strokeOpacity=".3" strokeWidth=".9" />
              <path d="M190 506H930L984 545H136Z" fill="#000" filter="url(#wood-tex)" opacity=".5" />
              <path d="M190 506H930L942 517H178Z" fill="#fff" fillOpacity=".07" />
              <path d="M190 506.6H930" stroke="#F2C48C" strokeOpacity=".45" strokeWidth="1" />
              {/* satin reflection of the ceiling downlights + the floor lamp */}
              <ellipse cx="420" cy="522" rx="100" ry="8" fill="#FFF1CC" fillOpacity=".14" filter="url(#blur-small)" />
              <ellipse cx="700" cy="522" rx="100" ry="8" fill="#FFF1CC" fillOpacity=".11" filter="url(#blur-small)" />
              <ellipse cx="860" cy="526" rx="90" ry="9" fill="#FDE68A" fillOpacity=".18" filter="url(#blur-small)" />
              {/* contact shadows of everything on the desk */}
              <ellipse cx="560" cy="535" rx="130" ry="5" fill="#000" fillOpacity=".45" filter="url(#blur-small)" />
              <ellipse cx="318" cy="540" rx="36" ry="4" fill="#000" fillOpacity=".5" filter="url(#blur-small)" />
              <ellipse cx="781" cy="539" rx="22" ry="3.2" fill="#000" fillOpacity=".5" filter="url(#blur-small)" />
              <ellipse cx="742" cy="537" rx="15" ry="2.6" fill="#000" fillOpacity=".45" filter="url(#blur-small)" />
            </g>
            {/* front edge of the top */}
            <rect x="136" y="545" width="848" height="22" rx="2.5" fill="url(#n-wood-edge)" />
            <rect x="136" y="545" width="848" height="22" rx="2.5" fill="#000" filter="url(#wood-tex)" opacity=".45" />
            <path d="M138 545.8H982" stroke="#F0C48E" strokeOpacity=".4" strokeWidth="1" />
            <path d="M138 566.3H982" stroke="#000" strokeOpacity=".5" strokeWidth="1.4" />
            <ellipse cx="560" cy="534" rx="215" ry="8" fill="#60A5FA" fillOpacity=".14" />
          </g>

          {/* leather desk mat */}
          <path d="M376 514H744L760 541H360Z" fill="#0E1119" />
          <path d="M376 514H744" stroke="#475569" strokeOpacity=".35" strokeWidth="1" />
          <path d="M381 517.5H739L752 538H368Z" stroke="#64748B" strokeOpacity=".28" strokeWidth=".8" strokeDasharray="3 2.4" />

          {/* forearms: elbows at the desk edge, wrists disappear behind the lid where the hands are typing */}
          <motion.g style={{ y: torsoY }}>
            <RealisticArm side="left" attentive={attentive} />
            <RealisticArm side="right" attentive={attentive} />
          </motion.g>

          {/* ───── iPhone 18 Pro Max on a weighted aluminium dock + USB-C cable to the MacBook ───── */}
          <g>
            <ellipse cx="318" cy="540" rx="36" ry="5" fill="#000" fillOpacity=".55" />
            <path d="M287 535C287 532 301 530 318 530C335 530 349 532 349 535V538C349 541 335 543 318 543C301 543 287 541 287 538Z" fill="url(#alu-stand)" />
            <ellipse cx="318" cy="532" rx="29" ry="3.2" fill="#E2E8F0" fillOpacity=".45" />
            <path d="M313 532L314 514H322L323 532Z" fill="url(#alu-stand)" />
            <g transform="translate(318 520) rotate(-5)">
              <rect x="-21" y="-4" width="42" height="9" rx="3.5" fill="url(#alu-stand)" />
            </g>

            <g transform="translate(318 519) rotate(-5) translate(-26 -110)">
              {/* titanium frame + bright rim + side buttons */}
              <rect x="-0.9" y="16" width="1.6" height="6" rx=".8" fill="#9AA6B8" />
              <rect x="-0.9" y="27" width="1.6" height="10" rx=".8" fill="#9AA6B8" />
              <rect x="-0.9" y="40" width="1.6" height="10" rx=".8" fill="#9AA6B8" />
              <rect x="51.3" y="34" width="1.6" height="16" rx=".8" fill="#9AA6B8" />
              <rect x="51.3" y="76" width="1.6" height="9" rx=".8" fill="#B4BFCF" />
              <rect x="0" y="0" width="52" height="110" rx="10" fill="url(#n-phone-frame)" />
              <rect x=".6" y=".6" width="50.8" height="108.8" rx="9.5" stroke="#F1F5F9" strokeOpacity=".75" strokeWidth=".8" />
              <rect x="1.7" y="1.7" width="48.6" height="106.6" rx="8.5" fill="#02040A" />
              <rect x="2.5" y="2.5" width="47" height="105" rx="7.8" fill="url(#n-phone-screen)" />

              {/* status bar + Dynamic Island */}
              <text x="8" y="9.3" fontSize="4.1" fontWeight="700" fill="#fff" fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif">9:41</text>
              <rect x="18.5" y="4.4" width="15" height="4.4" rx="2.2" fill="#000" />
              <circle cx="31" cy="6.6" r=".9" fill="#0F1A33" />
              <g fill="#fff">
                <rect x="37.2" y="7.6" width="1" height="1.6" rx=".3" />
                <rect x="38.8" y="6.8" width="1" height="2.4" rx=".3" />
                <rect x="40.4" y="6" width="1" height="3.2" rx=".3" />
                <rect x="43" y="6" width="5" height="3.2" rx="1" fillOpacity=".9" />
              </g>

              {/* lock-screen date + time */}
              <text x="26" y="19.5" textAnchor="middle" fontSize="3.4" fill="#fff" fillOpacity=".85" fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif">Sunday 22 November</text>
              <text x="26" y="32.5" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#fff" fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif">9:41</text>

              {/* AD Tech brand mark on the display */}
              <circle cx="26" cy="63" r="24" fill="url(#n-phone-glow)" />
              <rect x="12.5" y="49.5" width="27" height="27" rx="7" fill="url(#n-adtech)" />
              <rect x="13" y="50" width="26" height="26" rx="6.6" stroke="#fff" strokeOpacity=".4" strokeWidth=".7" />
              <path d="M16 52.5C22 50.5 31 50.5 37 53" stroke="#fff" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" />
              <text x="26" y="68.8" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#fff" letterSpacing="-.6" fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif">AD</text>
              <text x="26" y="86" textAnchor="middle" fontSize="7.4" fontWeight="700" fill="#fff" letterSpacing=".3" fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif">AD Tech</text>
              <rect x="15" y="90" width="22" height="1.1" rx=".55" fill="#7DD3FC" fillOpacity=".55" />
              <rect x="19" y="93" width="14" height="1" rx=".5" fill="#fff" fillOpacity=".3" />

              {/* lock-screen shortcuts + home indicator */}
              <circle cx="11.5" cy="99" r="3.4" fill="#fff" fillOpacity=".18" />
              <circle cx="40.5" cy="99" r="3.4" fill="#fff" fillOpacity=".18" />
              <rect x="17" y="104.2" width="18" height="1.1" rx=".55" fill="#fff" fillOpacity=".75" />

              {/* glass reflection */}
              <path d="M2.6 3H26L9 106H2.6Z" fill="#fff" fillOpacity=".055" />
            </g>
            <g transform="translate(318 520) rotate(-5)">
              <rect x="-19" y="1" width="38" height="4.4" rx="2" fill="url(#alu-stand)" />
            </g>
            <ellipse cx="318" cy="538" rx="40" ry="3.6" fill="#38BDF8" fillOpacity=".1" />

            {/* cable from the dock to the MacBook's left port */}
            <path d="M347 538C384 548 428 544 455 530" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M347 538C384 548 428 544 455 530" stroke="#64748B" strokeOpacity=".5" strokeWidth="1.1" strokeLinecap="round" fill="none" />
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

          {/* backlit Apple logo: crisp white core + soft bloom */}
          <g transform="translate(560 467) scale(.95) translate(-12 -12.5)">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="#fff" filter="url(#apple-glow)" opacity=".8" />
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="#fff" />
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