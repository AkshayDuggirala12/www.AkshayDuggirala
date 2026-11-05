"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";

/* ───────────────────────── geometry ─────────────────────────
   The scene is drawn on a wide canvas (1720 × 720). The hero uses
   "slice", so: ultra-wide screens see more room on the sides, phones
   see the centre crop (desk, laptop, developer). */
const VIEWBOX = { x: -300, y: 0, w: 1720, h: 720 };
const VB = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`;
const HEAD = { x: 560, y: 255 };

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

/* ───────────────────────── procedural city ───────────────────────── */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rect = { x: number; y: number; w: number; h: number; fill: string };
type Mast = { x: number; y: number; h: number };
type Layer = { rects: Rect[]; warm: string; cool: string; dim: string; masts: Mast[] };

function buildLayer(
  seed: number,
  palette: string[],
  size: { hMin: number; hMax: number; wMin: number; wMax: number },
  win: { w: number; h: number; gx: number; gy: number; lit: number; dim: number },
): Layer {
  const r = rng(seed);
  const rects: Rect[] = [];
  const masts: Mast[] = [];
  let warm = "";
  let cool = "";
  let dim = "";
  let x = VIEWBOX.x - 40;
  while (x < VIEWBOX.x + VIEWBOX.w + 40) {
    const w = Math.round(size.wMin + r() * (size.wMax - size.wMin));
    const h = Math.round(size.hMin + r() * (size.hMax - size.hMin));
    const y = 560 - h;
    rects.push({ x, y, w, h, fill: palette[Math.floor(r() * palette.length)] });

    const cols = Math.floor((w - 8) / win.gx);
    const rows = Math.floor((h - 14) / win.gy);
    for (let j = 0; j < rows; j++) {
      // whole floors tend to be lit or dark, like real offices
      const floorBias = r() < 0.45 ? 1.9 : 0.35;
      for (let i = 0; i < cols; i++) {
        const p = r();
        const wx = x + 6 + i * win.gx;
        const wy = y + 9 + j * win.gy;
        const seg = `M${wx} ${wy}h${win.w}v${win.h}h-${win.w}z`;
        if (p < win.lit * floorBias) {
          if (r() < 0.78) warm += seg;
          else cool += seg;
        } else if (p < win.lit * floorBias + win.dim) {
          dim += seg;
        }
      }
    }
    if (r() < 0.4) masts.push({ x: x + w / 2, y, h: 16 + Math.round(r() * 30) });
    x += w + Math.round(r() * 8 - 2);
  }
  return { rects, warm, cool, dim, masts };
}

const FAR = buildLayer(11, ["#223E69", "#26446F", "#1F3A63"], { hMin: 190, hMax: 390, wMin: 50, wMax: 100 }, { w: 3, h: 4, gx: 8, gy: 11, lit: 0.2, dim: 0.22 });
const MID = buildLayer(23, ["#162A4B", "#1A2F52", "#142643"], { hMin: 120, hMax: 310, wMin: 60, wMax: 120 }, { w: 4, h: 6, gx: 11, gy: 15, lit: 0.25, dim: 0.2 });
const NEAR = buildLayer(37, ["#0B1629", "#0E1B31", "#0A1325"], { hMin: 70, hMax: 200, wMin: 90, wMax: 150 }, { w: 6, h: 8, gx: 16, gy: 22, lit: 0.28, dim: 0.16 });

const STARS = (() => {
  const r = rng(5);
  return Array.from({ length: 48 }, () => ({
    x: -260 + r() * 1640,
    y: 50 + r() * 260,
    r: 0.6 + r() * 1.2,
    o: 0.35 + r() * 0.5,
  }));
})();

function City({ layer, filter, dimColor }: { layer: Layer; filter?: string; dimColor: string }) {
  return (
    <g filter={filter}>
      {layer.rects.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} />
      ))}
      <path d={layer.dim} fill={dimColor} fillOpacity=".45" />
      <path d={layer.cool} fill="#BFE3FF" fillOpacity=".8" />
      <path d={layer.warm} fill="#FFD08A" fillOpacity=".9" />
      {layer.masts.map((m, i) => (
        <g key={i}>
          <path d={`M${m.x} ${m.y}V${m.y - m.h}`} stroke="#050A14" strokeOpacity=".7" strokeWidth="1.5" />
          <circle className="beacon" cx={m.x} cy={m.y - m.h} r="1.8" fill="#FF5A4D" />
        </g>
      ))}
    </g>
  );
}

/* ───────────────────────── plants ───────────────────────── */
type Fig = { x: number; y: number; r: number; s: number; flip: boolean; fill: string };

function FigLeaf({ x, y, r, s, flip, fill }: Fig) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0C-9 -12 -36 -30 -32 -70C-29 -96 -8 -112 4 -118C22 -100 40 -72 33 -40C29 -20 11 -7 0 0Z" fill={fill} />
      <path d="M4 -118C22 -100 40 -72 33 -40C29 -20 11 -7 0 0C14 -30 14 -80 4 -118Z" fill="#fff" fillOpacity=".09" />
      <path d="M0 0C-9 -12 -36 -30 -32 -70C-29 -96 -8 -112 4 -118C-2 -80 -4 -36 0 0Z" fill="#000" fillOpacity=".15" />
      <path d="M0 -2C2 -40 3 -80 4 -114" stroke="#DDF2CC" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 -22L-20 -40M2 -44L-25 -62M3 -66L-21 -84M2 -30L22 -48M3 -52L27 -68M3 -74L21 -90" stroke="#DDF2CC" strokeOpacity=".28" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

// fiddle-leaf fig: leaves alternate up the trunk, lower ones droop
const FIG: Fig[] = [
  { x: 157, y: 612, r: -96, s: 1.0, flip: false, fill: "url(#leaf-b)" },
  { x: 158, y: 592, r: 92, s: 1.05, flip: true, fill: "url(#leaf-a)" },
  { x: 159, y: 566, r: -66, s: 1.25, flip: false, fill: "url(#leaf-a)" },
  { x: 160, y: 540, r: 64, s: 1.3, flip: true, fill: "url(#leaf-b)" },
  { x: 161, y: 514, r: -46, s: 1.3, flip: false, fill: "url(#leaf-b)" },
  { x: 161, y: 494, r: 44, s: 1.2, flip: true, fill: "url(#leaf-a)" },
  { x: 159, y: 474, r: -22, s: 1.1, flip: false, fill: "url(#leaf-a)" },
  { x: 158, y: 468, r: 8, s: 1.0, flip: true, fill: "url(#leaf-b)" },
];

function bladePath(h: number, sway: number, w: number) {
  return `M${-w} 0C${-w * 1.2 + sway * 0.2} ${-h * 0.35} ${-w * 0.7 + sway * 0.8} ${-h * 0.75} ${sway} ${-h}C${w * 0.7 + sway * 0.8} ${-h * 0.75} ${w * 1.2 + sway * 0.2} ${-h * 0.35} ${w} 0Z`;
}
// snake plant: blades of different heights, each leaning a little differently
const SNAKE = [
  { dx: -34, h: 80, sway: -8, w: 9, r: -32 },
  { dx: -26, h: 120, sway: -10, w: 11, r: -22 },
  { dx: -14, h: 170, sway: -6, w: 13, r: -10 },
  { dx: -2, h: 215, sway: 4, w: 14, r: -2 },
  { dx: 10, h: 185, sway: 8, w: 13, r: 8 },
  { dx: 22, h: 140, sway: 12, w: 12, r: 18 },
  { dx: 32, h: 95, sway: 12, w: 10, r: 28 },
];

/* ───────────────────────── legs, sleeves, hands ───────────────────────── */
// left leg (the right one is a mirror of this)
function Leg() {
  return (
    <g>
      <path d="M484 548H540L544 596C542 608 538 614 536 624L532 654H494L490 624C488 614 484 606 482 596Z" fill="url(#pants)" />
      <path d="M520 560C524 580 524 610 522 650" stroke="#fff" strokeOpacity=".07" strokeWidth="6" strokeLinecap="round" />
      <path d="M488 598Q512 606 538 598" stroke="#000" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
      <path d="M488 650H538C548 650 554 660 552 672H478C476 662 480 650 488 650Z" fill="url(#shoe)" />
      <path d="M478 668H552" stroke="#9AA3B0" strokeWidth="4" strokeLinecap="round" />
      <path d="M500 654H530" stroke="#C4CBD5" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

// short sleeve (left side; mirrored for the right)
function Sleeve() {
  return (
    <g>
      <path d="M448 384C428 392 412 420 408 456L442 466C444 440 454 416 468 400Z" fill="url(#shirt)" />
      <path d="M410 446L444 456" stroke="#1F4378" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
      <path d="M450 388C436 398 424 418 420 440" stroke="#C6E3FF" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

// bare forearm + back of the hand; the fingers go on under the laptop lid
function ForearmHand() {
  return (
    <g>
      <path d="M410 452C404 486 424 516 450 528L468 512C452 500 444 484 442 462Z" fill="url(#skin)" />
      <path d="M442 462C444 484 452 500 468 512" stroke="#7A4630" strokeOpacity=".4" strokeWidth="2" />
      <path d="M446 516C438 524 440 536 452 538L490 536L492 508L464 504Z" fill="url(#skin)" />
      <path d="M448 509C442 500 446 492 456 494" stroke="#C98561" strokeWidth="7" strokeLinecap="round" />
      <path d="M470 508L488 508M472 516L490 516M470 524L488 524" stroke="#8A5236" strokeOpacity=".4" strokeWidth="1.5" />
    </g>
  );
}

/* ───────────────────────── face animation ───────────────────────── */
const UPPER_LIP = {
  neutral: "M546 293Q553 289 560 291Q567 289 574 293Q560 296 546 293Z",
  smile: "M544 291Q553 289 560 291Q567 289 576 291Q560 299 544 291Z",
};
const LOWER_LIP = {
  neutral: "M547 294Q560 301 573 294Q560 297 547 294Z",
  smile: "M545 292Q560 308 575 292Q560 300 545 292Z",
};
const LIP_SEAM = { neutral: "M546 293Q560 296 574 293", smile: "M544 291Q560 299 576 291" };

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
  const attention = useSpring(0, { stiffness: 70, damping: 16 });
  const lx = useSpring(lookX, { stiffness: 110, damping: 18, mass: 0.6 });
  const ly = useSpring(lookY, { stiffness: 110, damping: 18, mass: 0.6 });

  useEffect(() => {
    attention.set(attentive ? 1 : 0);
  }, [attentive, attention]);

  const torsoY = useLook(lx, ly, attention, (_x, _y, a) => -a * 5);
  const headX = useLook(lx, ly, attention, (x, _y, a) => x * a * 8);
  const headY = useLook(lx, ly, attention, (_x, y, a) => (1 - a) * 9 + y * a * 4);
  const headRotate = useLook(lx, ly, attention, (x, _y, a) => x * a * 7);
  const faceX = useLook(lx, ly, attention, (x, _y, a) => x * a * 13);
  const faceY = useLook(lx, ly, attention, (_x, y, a) => (1 - a) * 6 + y * a * 6);
  const pupilX = useLook(lx, ly, attention, (x, _y, a) => x * a * 3.6);
  const pupilY = useLook(lx, ly, attention, (_x, y, a) => (1 - a) * 3.8 + y * a * 3);
  const screenSpill = useTransform(attention, [0, 1], [0.42, 0.06]);

  return (
    <>
      {/* ═════════ LAYER 1 — static room (never repaints while he moves) ═════════ */}
      <svg aria-hidden="true" className="office-scene-art" viewBox={VB} preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#070D20" />
            <stop offset=".5" stopColor="#1B3463" />
            <stop offset=".85" stopColor="#C9806A" />
            <stop offset="1" stopColor="#F4B58A" />
          </linearGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#F4B58A" stopOpacity="0" />
            <stop offset="1" stopColor="#F4B58A" stopOpacity=".32" />
          </linearGradient>
          <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#05080F" />
            <stop offset="1" stopColor="#0E1829" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#142033" />
            <stop offset="1" stopColor="#04070D" />
          </linearGradient>
          <linearGradient id="floor-glow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#F4B58A" stopOpacity=".16" />
            <stop offset="1" stopColor="#F4B58A" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="moon-glow">
            <stop stopColor="#FFF1C9" stopOpacity=".5" />
            <stop offset="1" stopColor="#FFF1C9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="downlight">
            <stop stopColor="#FFF0D2" stopOpacity=".55" />
            <stop offset="1" stopColor="#FFF0D2" stopOpacity="0" />
          </radialGradient>
          <clipPath id="glass-clip">
            <rect x="-260" y="48" width="1640" height="512" />
          </clipPath>
          <filter id="dof-far" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id="dof-mid" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
          <filter id="dof-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect x="-300" y="0" width="1720" height="720" fill="#0B1424" />

        {/* sky + city seen through the glass wall */}
        <g clipPath="url(#glass-clip)">
          <rect x="-260" y="48" width="1640" height="512" fill="url(#sky)" />
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" fillOpacity={s.o} />
          ))}
          <circle cx="655" cy="125" r="70" fill="url(#moon-glow)" />
          <circle cx="655" cy="125" r="22" fill="#FFF1C9" />
          <circle cx="648" cy="120" r="5" fill="#E8D7A6" fillOpacity=".7" />
          <circle cx="663" cy="132" r="3.5" fill="#E8D7A6" fillOpacity=".6" />
          <g filter="url(#dof-soft)" fill="#F4B58A">
            <ellipse cx="60" cy="430" rx="200" ry="12" fillOpacity=".3" />
            <ellipse cx="520" cy="455" rx="240" ry="10" fillOpacity=".25" />
            <ellipse cx="1000" cy="425" rx="220" ry="12" fillOpacity=".28" />
            <ellipse cx="1300" cy="460" rx="180" ry="10" fillOpacity=".25" />
          </g>

          <City layer={FAR} filter="url(#dof-far)" dimColor="#3A5A8C" />
          <rect x="-300" y="300" width="1720" height="260" fill="url(#haze)" />
          <City layer={MID} filter="url(#dof-mid)" dimColor="#2E4A78" />
          <rect x="-300" y="380" width="1720" height="180" fill="url(#haze)" opacity=".6" />
          <City layer={NEAR} dimColor="#243C66" />

          {/* glass: faint tint, reflections of the room lights */}
          <rect x="-260" y="48" width="1640" height="512" fill="#9EC5F0" fillOpacity=".03" />
          <path d="M-60 48H90L-80 560H-230Z" fill="#fff" fillOpacity=".04" />
          <path d="M240 48H270L100 560H70Z" fill="#fff" fillOpacity=".035" />
          <path d="M820 48H940L770 560H650Z" fill="#fff" fillOpacity=".035" />
          <path d="M1160 48H1230L1060 560H990Z" fill="#fff" fillOpacity=".04" />
          <g fill="#FFF0D2" fillOpacity=".18">
            <rect x="140" y="92" width="2" height="26" rx="1" />
            <rect x="420" y="92" width="2" height="26" rx="1" />
            <rect x="700" y="92" width="2" height="26" rx="1" />
            <rect x="980" y="92" width="2" height="26" rx="1" />
          </g>
        </g>

        {/* glass wall frame — panes are centred on the developer */}
        <rect x="-260" y="48" width="1640" height="8" fill="#070D18" />
        <rect x="-260" y="552" width="1640" height="12" fill="#070D18" />
        {[35, 385, 735, 1085].map((x) => (
          <g key={x}>
            <rect x={x - 4} y="48" width="8" height="512" fill="#070D18" />
            <rect x={x - 4} y="48" width="1.5" height="512" fill="#8CB4E0" fillOpacity=".22" />
          </g>
        ))}
        <rect x="-264" y="48" width="8" height="512" fill="#070D18" />
        <rect x="1376" y="48" width="8" height="512" fill="#070D18" />

        {/* ceiling + recessed downlights */}
        <rect x="-300" y="0" width="1720" height="48" fill="url(#ceiling)" />
        {[-120, 160, 430, 700, 980, 1260].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="40" rx="64" ry="14" fill="url(#downlight)" />
            <ellipse cx={x} cy="28" rx="15" ry="4" fill="#FFF3DA" />
          </g>
        ))}

        {/* floor: polished, picking up the city glow */}
        <rect x="-300" y="564" width="1720" height="156" fill="url(#floor)" />
        <rect x="-300" y="564" width="1720" height="70" fill="url(#floor-glow)" />
        <g stroke="#fff" strokeOpacity=".035" strokeWidth="1">
          {[-300, -80, 140, 360, 560, 760, 980, 1200, 1420].map((x) => (
            <path key={x} d={`M${x} 564L${x + (x - 560) * 1.1} 720`} />
          ))}
          <path d="M-300 604H1420M-300 656H1420" />
        </g>
        {[160, 560, 960].map((x) => (
          <ellipse key={x} cx={x} cy="640" rx="170" ry="20" fill="#FFF0D2" fillOpacity=".04" />
        ))}
      </svg>

      {/* ═════════ LAYER 2 — furniture + developer (animated) ═════════ */}
      <svg aria-hidden="true" className={`office-scene-art ${attentive ? "is-attentive" : ""}`} viewBox={VB} preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leaf-a" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#2F7A5C" />
            <stop offset="1" stopColor="#6BBE96" />
          </linearGradient>
          <linearGradient id="leaf-b" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#1F5A45" />
            <stop offset="1" stopColor="#47997A" />
          </linearGradient>
          <linearGradient id="pot" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#46587A" />
            <stop offset=".6" stopColor="#2A3A57" />
            <stop offset="1" stopColor="#18233A" />
          </linearGradient>
          <linearGradient id="desk-surface" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#DDB088" />
            <stop offset="1" stopColor="#A87852" />
          </linearGradient>
          <linearGradient id="desk-edge" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#C79A72" />
            <stop offset="1" stopColor="#7E5237" />
          </linearGradient>
          <linearGradient id="lid" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#E6EBF1" />
            <stop offset=".5" stopColor="#C4CBD5" />
            <stop offset="1" stopColor="#9AA3B0" />
          </linearGradient>
          <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#6AA3E8" />
            <stop offset="1" stopColor="#3566AA" />
          </linearGradient>
          <radialGradient id="skin" cx=".42" cy=".36" r=".8">
            <stop stopColor="#E3A982" />
            <stop offset=".55" stopColor="#C98561" />
            <stop offset="1" stopColor="#8A5236" />
          </radialGradient>
          <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#343A46" />
            <stop offset="1" stopColor="#0C0F15" />
          </linearGradient>
          <radialGradient id="iris" cx=".4" cy=".35" r=".8">
            <stop stopColor="#92613A" />
            <stop offset="1" stopColor="#34200F" />
          </radialGradient>
          <linearGradient id="neck-shade" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#000" stopOpacity=".5" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="screen-spill">
            <stop stopColor="#8EC3FF" stopOpacity=".9" />
            <stop offset="1" stopColor="#8EC3FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="warm-glow">
            <stop stopColor="#FFD9A0" stopOpacity=".38" />
            <stop offset="1" stopColor="#FFD9A0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="neck" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#9A5E40" />
            <stop offset="1" stopColor="#C58360" />
          </linearGradient>
          <linearGradient id="pants" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#2C3957" />
            <stop offset="1" stopColor="#151D32" />
          </linearGradient>
          <linearGradient id="shoe" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#F3F5F8" />
            <stop offset="1" stopColor="#B7BFCB" />
          </linearGradient>
          <linearGradient id="blade" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#1B4C3B" />
            <stop offset="1" stopColor="#3F8C66" />
          </linearGradient>
          {/* keeps the neck inside the neckline however the head moves */}
          <clipPath id="neck-clip">
            <path d="M300 100H820V342H598C590 364 574 374 560 374C546 374 530 364 522 342H300Z" />
          </clipPath>
          <clipPath id="eye-l">
            <path d="M525 262Q535.5 254 546 262Q535.5 269 525 262Z" />
          </clipPath>
          <clipPath id="eye-r">
            <path d="M574 262Q584.5 254 595 262Q584.5 269 574 262Z" />
          </clipPath>
          <filter id="blur-soft" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <mask id="apple-bite" maskUnits="userSpaceOnUse" x="-20" y="-24" width="40" height="44">
            <rect x="-20" y="-24" width="40" height="44" fill="#fff" />
            <circle cx="12" cy="-2" r="4.6" fill="#000" />
          </mask>
        </defs>

        {/* ───── floor plant, left: fiddle-leaf fig ───── */}
        <ellipse cx="156" cy="708" rx="64" ry="9" fill="#000" fillOpacity=".4" filter="url(#blur-soft)" />
        <g>
          <path d="M120 640H192L184 708H128Z" fill="url(#pot)" />
          <path d="M120 640H192L190 650H122Z" fill="#fff" fillOpacity=".12" />
          <path d="M133 652L138 704" stroke="#fff" strokeOpacity=".16" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="156" cy="640" rx="36" ry="7" fill="#1B2638" />
          <ellipse cx="156" cy="639" rx="32" ry="5" fill="#2B2018" />
          <g fill="#6E5F52" fillOpacity=".8">
            <ellipse cx="140" cy="640" rx="3" ry="1.5" />
            <ellipse cx="170" cy="638" rx="3.5" ry="1.7" />
            <ellipse cx="158" cy="642" rx="2.5" ry="1.3" />
          </g>
          <path d="M156 642C153 596 163 548 158 468" stroke="#5A3F2C" strokeWidth="7" strokeLinecap="round" />
          <path d="M158 642C156 596 166 548 161 470" stroke="#9A7352" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
          {FIG.map((l, i) => (
            <FigLeaf key={i} {...l} />
          ))}
        </g>

        {/* ───── floor lamp + snake plant, right ───── */}
        <ellipse cx="962" cy="352" rx="120" ry="86" fill="url(#warm-glow)" />
        <rect x="959" y="332" width="6" height="332" fill="#243651" />
        <rect x="959" y="332" width="2" height="332" fill="#6F8DB5" fillOpacity=".4" />
        <ellipse cx="962" cy="666" rx="34" ry="8" fill="#243651" />
        <path d="M926 334H998L986 284H938Z" fill="#EBD9B2" />
        <path d="M938 284H986L984 296H940Z" fill="#fff" fillOpacity=".35" />
        <ellipse cx="962" cy="334" rx="36" ry="5" fill="#FFE9B8" />

        <ellipse cx="1090" cy="708" rx="50" ry="8" fill="#000" fillOpacity=".4" filter="url(#blur-soft)" />
        <g>
          <path d="M1060 652H1120L1112 708H1068Z" fill="url(#pot)" />
          <path d="M1060 652H1120L1118 661H1062Z" fill="#fff" fillOpacity=".12" />
          <ellipse cx="1090" cy="652" rx="30" ry="6" fill="#1B2638" />
          <ellipse cx="1090" cy="651" rx="26" ry="4" fill="#2B2018" />
          {SNAKE.map((b, i) => (
            <g key={i} transform={`translate(${1090 + b.dx} 654) rotate(${b.r})`}>
              <path d={bladePath(b.h, b.sway, b.w)} fill="url(#blade)" stroke="#C4CF6A" strokeOpacity=".85" strokeWidth="1.8" />
              <path d={`M0 -4Q${b.sway * 0.5} ${-b.h * 0.5} ${b.sway} ${-b.h + 8}`} stroke="#0F3326" strokeOpacity=".3" strokeWidth={b.w * 1.1} strokeDasharray="1.5 7" />
              <path d={`M${-b.w * 0.3} -6Q${b.sway * 0.4} ${-b.h * 0.5} ${b.sway - b.w * 0.2} ${-b.h + 14}`} stroke="#B9E6C9" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          ))}
        </g>

        {/* ───── chair ───── */}
        <g>
          <path d="M468 392C468 335 500 312 560 312C620 312 652 335 652 392V560H468Z" fill="#17243A" />
          <path d="M484 392C484 350 510 330 560 330C610 330 636 350 636 392V545H484Z" fill="#21344D" />
          <path d="M470 380C470 340 500 316 560 316" stroke="#7FA6D4" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />
          <path d="M560 562V604M560 604L486 650M560 604L634 650" stroke="#111C2E" strokeWidth="10" strokeLinecap="round" />
          <circle cx="486" cy="654" r="6" fill="#0A111E" />
          <circle cx="634" cy="654" r="6" fill="#0A111E" />
        </g>

        {/* ───── legs (seated, under the desk) ───── */}
        <Leg />
        <g transform="translate(1120 0) scale(-1 1)">
          <Leg />
        </g>

        {/* ───── developer ───── */}
        <motion.g style={{ y: torsoY }}>
          <g className="breathe">
            {/* shoulders are about 2.5 head-widths across, sloping into the neck */}
            <path d="M524 350C500 354 462 362 444 388C434 404 432 440 430 534H690C688 440 686 404 676 388C658 362 620 354 596 350Z" fill="url(#shirt)" />
            <path d="M522 342C530 364 546 374 560 374C574 374 590 364 598 342Z" fill="url(#neck)" />
            <path d="M500 410C512 456 506 504 496 534M620 410C608 456 614 504 624 534" stroke="#1F4378" strokeOpacity=".3" strokeWidth="7" strokeLinecap="round" />
            <path d="M446 388C462 364 500 354 524 350" stroke="#C6E3FF" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
            <path d="M674 388C658 364 620 354 596 350" stroke="#C6E3FF" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* arms: short sleeves, bare forearms, hands */}
          <Sleeve />
          <g transform="translate(1120 0) scale(-1 1)">
            <Sleeve />
          </g>
          <g className="typing-arm typing-arm--left">
            <ForearmHand />
          </g>
          <g transform="translate(1120 0) scale(-1 1)">
            <g className="typing-arm typing-arm--right">
              <ForearmHand />
            </g>
          </g>

          {/* head + neck: one unit, pivoting at the base of the neck */}
          <g clipPath="url(#neck-clip)">
            <motion.g style={{ x: headX, y: headY, rotate: headRotate, originX: 0.5, originY: 1 }}>
              <path d="M538 296C538 326 536 342 531 358L589 358C584 342 582 326 582 296Z" fill="url(#neck)" />
              <path d="M538 300C548 318 572 318 582 300V326C572 338 548 338 538 326Z" fill="#000" fillOpacity=".24" />

              <ellipse cx="508" cy="263" rx="7" ry="12" fill="url(#skin)" />
              <ellipse cx="612" cy="263" rx="7" ry="12" fill="url(#skin)" />
              <path d="M507 257Q504 264 508 273M613 257Q616 264 612 273" stroke="#7A4630" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />

              <path d="M508 240C508 204 530 189 560 189C590 189 612 204 612 240C612 268 603 292 586 308C576 317 568 321 560 321C552 321 544 317 534 308C517 292 508 268 508 240Z" fill="url(#skin)" />
              <path d="M612 240C612 268 603 292 586 308C576 317 568 321 560 321C590 303 604 272 604 240Z" fill="#000" fillOpacity=".16" />
              <path d="M511 262C514 288 528 308 546 317L560 321L574 317C592 308 606 288 609 262C604 282 594 296 580 304C572 298 566 301 560 301C554 301 548 298 540 304C526 296 516 282 511 262Z" fill="#1A1210" fillOpacity=".17" />
              <ellipse cx="552" cy="214" rx="26" ry="13" fill="#F2BE9A" fillOpacity=".16" />
              <ellipse cx="560" cy="313" rx="10" ry="4.5" fill="#E0A07C" fillOpacity=".2" />

              <motion.ellipse cx="560" cy="302" rx="46" ry="26" fill="url(#screen-spill)" style={{ opacity: screenSpill }} />

              <motion.g style={{ x: faceX, y: faceY }}>
                <ellipse cx="535" cy="263" rx="16" ry="10" fill="#7A4630" fillOpacity=".12" />
                <ellipse cx="585" cy="263" rx="16" ry="10" fill="#7A4630" fillOpacity=".12" />
                <ellipse cx="526" cy="287" rx="12" ry="7" fill="#E8A98A" fillOpacity=".18" />
                <ellipse cx="594" cy="287" rx="12" ry="7" fill="#E8A98A" fillOpacity=".18" />

                {/* almond eyes; the iris is clipped by the lids, so looking down hides part of it */}
                <g className="eye-blink">
                  <path d="M525 262Q535.5 254 546 262Q535.5 269 525 262Z" fill="#EDE7E1" />
                  <path d="M574 262Q584.5 254 595 262Q584.5 269 574 262Z" fill="#EDE7E1" />
                  <g clipPath="url(#eye-l)">
                    <motion.g style={{ x: pupilX, y: pupilY }}>
                      <circle cx="535.5" cy="262" r="4.8" fill="url(#iris)" />
                      <circle cx="535.5" cy="262" r="2.2" fill="#0B0807" />
                      <circle cx="534" cy="260.4" r="1.1" fill="#fff" fillOpacity=".9" />
                    </motion.g>
                  </g>
                  <g clipPath="url(#eye-r)">
                    <motion.g style={{ x: pupilX, y: pupilY }}>
                      <circle cx="584.5" cy="262" r="4.8" fill="url(#iris)" />
                      <circle cx="584.5" cy="262" r="2.2" fill="#0B0807" />
                      <circle cx="583" cy="260.4" r="1.1" fill="#fff" fillOpacity=".9" />
                    </motion.g>
                  </g>
                  <path d="M524 262Q535.5 253 547 262M573 262Q584.5 253 596 262" stroke="#2E1A12" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" />
                  <path d="M526 256Q536 249 546 256M574 256Q584 249 594 256" stroke="#8A5A44" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M527 267Q535 270 543 267M577 267Q585 270 593 267" stroke="#8A5A44" strokeOpacity=".25" strokeWidth="1.2" strokeLinecap="round" />
                </g>

                {/* slim rectangular glasses */}
                <rect x="518" y="249" width="34" height="26" rx="11" stroke="#161B25" strokeWidth="2.4" fill="#9CC4F0" fillOpacity=".06" />
                <rect x="568" y="249" width="34" height="26" rx="11" stroke="#161B25" strokeWidth="2.4" fill="#9CC4F0" fillOpacity=".06" />
                <path d="M552 258Q560 254 568 258M518 257L508 255M602 257L612 255" stroke="#161B25" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M523 256L530 253M573 256L580 253" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />

                <motion.g initial={false} animate={{ y: attentive ? -4 : 0 }} transition={{ duration: 0.35 }}>
                  <path d="M519 249C526 242 540 240 550 245M601 249C594 242 580 240 570 245" stroke="#1D2128" strokeWidth="3.2" strokeLinecap="round" />
                </motion.g>

                {/* nose */}
                <path d="M552 262Q553 272 551 279" stroke="#000" strokeOpacity=".08" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M566 270Q573 282 565 287" stroke="#000" strokeOpacity=".13" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="560" cy="281" rx="4" ry="2.4" fill="#F3C7A8" fillOpacity=".35" />
                <ellipse cx="554" cy="284" rx="2.2" ry="1.4" fill="#5A2E22" fillOpacity=".7" />
                <ellipse cx="566" cy="284" rx="2.2" ry="1.4" fill="#5A2E22" fillOpacity=".7" />
                <path d="M557 286V291M563 286V291" stroke="#000" strokeOpacity=".07" strokeWidth="1.5" />

                {/* lips */}
                <motion.path initial={false} animate={{ d: attentive ? UPPER_LIP.smile : UPPER_LIP.neutral }} transition={{ duration: 0.4 }} fill="#A8624F" />
                <motion.path initial={false} animate={{ d: attentive ? LOWER_LIP.smile : LOWER_LIP.neutral }} transition={{ duration: 0.4 }} fill="#C27C69" />
                <motion.path initial={false} animate={{ d: attentive ? LIP_SEAM.smile : LIP_SEAM.neutral }} transition={{ duration: 0.4 }} stroke="#6E3A30" strokeWidth="1.6" strokeLinecap="round" />
              </motion.g>

              {/* hair: side-swept with sideburns */}
              <path d="M505 252C492 198 520 164 562 164C606 165 630 196 617 252C612 238 608 226 602 212C588 222 570 214 556 218C538 222 520 226 508 240Z" fill="url(#hair)" />
              <path d="M508 240L511 263L516 263L514 238ZM612 240L609 263L604 263L606 238Z" fill="#171B23" />
              <path d="M528 182C546 175 572 175 592 184M520 198C548 188 586 188 608 202M536 176C556 170 582 172 600 182M514 214C536 204 566 200 596 206" stroke="#7A8598" strokeOpacity=".3" strokeWidth="1.4" strokeLinecap="round" />
            </motion.g>
          </g>

          {/* neckline of the tee, drawn over the neck so it sits inside the collar */}
          <path d="M520 341C529 364 545 374 560 374C575 374 591 364 600 341" stroke="#2B5A9A" strokeWidth="6" strokeLinecap="round" />
          <path d="M522 340C531 361 546 369 560 369C574 369 589 361 598 340" stroke="#A8CDF4" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
        </motion.g>

        {/* ───── desk ───── */}
        <ellipse cx="560" cy="684" rx="340" ry="20" fill="#000" fillOpacity=".5" filter="url(#blur-soft)" />
        <g>
          {/* legs */}
          <path d="M272 553H286L283 670H274Z" fill="#7E8A9C" />
          <path d="M274 553H277L276 670H274Z" fill="#fff" fillOpacity=".25" />
          <path d="M834 553H848L846 670H837Z" fill="#7E8A9C" />
          <path d="M836 553H839L838 670H837Z" fill="#fff" fillOpacity=".25" />
          <rect x="250" y="553" width="620" height="10" fill="#4F321F" />
          {/* top surface (slight perspective) + front edge */}
          <path d="M262 524H858L890 541H230Z" fill="url(#desk-surface)" />
          <g stroke="#7A5238" strokeOpacity=".16" strokeWidth="1.4" strokeLinecap="round">
            <path d="M270 530Q420 527 560 531T850 529" />
            <path d="M250 535Q400 532 560 536T870 534" />
            <path d="M300 527Q430 525 560 527T820 526" />
          </g>
          <rect x="230" y="541" width="660" height="12" rx="3" fill="url(#desk-edge)" />
          <path d="M232 542H888" stroke="#F8DDB8" strokeOpacity=".55" strokeWidth="1.5" />
          {/* laptop light on the desk */}
          <ellipse cx="560" cy="534" rx="200" ry="8" fill="#8EC3FF" fillOpacity=".08" />
        </g>

        {/* desk mat */}
        <path d="M400 528H720L734 540H386Z" fill="#1B2330" />
        <path d="M400 528H720" stroke="#fff" strokeOpacity=".08" strokeWidth="1" />

        {/* MacBook seen from behind */}
        <g>
          <ellipse cx="560" cy="536" rx="130" ry="6" fill="#000" fillOpacity=".4" filter="url(#blur-soft)" />
          <rect x="465" y="405" width="190" height="125" rx="9" fill="url(#lid)" />
          <rect x="465.5" y="405.5" width="189" height="124" rx="8.5" stroke="#fff" strokeOpacity=".5" />
          <path d="M477 408H590L520 528H477Z" fill="#fff" fillOpacity=".08" />
          <rect x="456" y="527" width="208" height="6" rx="3" fill="#8A94A3" />
          <rect x="456" y="527" width="208" height="1.6" rx="1" fill="#fff" fillOpacity=".4" />

          {/* simplified bitten-fruit logo, backlit */}
          <g transform="translate(560 468) scale(1.1)">
            <circle r="26" fill="#fff" fillOpacity=".1" />
            <g mask="url(#apple-bite)">
              <path d="M0 -6C-4 -9 -11 -6 -11 2C-11 9 -6 15 -3 15C-1.5 15 -1 14 0 14C1 14 1.5 15 3 15C6 15 10 10 11 6C7 4 7 -2 11 -4C9 -7 5 -8 2 -7C1 -6.5 .5 -6 0 -6Z" fill="#fff" fillOpacity=".95" />
            </g>
            <path d="M1 -8C1 -12 4 -14 7.5 -14.5C7.5 -11 5 -8 1 -8Z" fill="#fff" fillOpacity=".95" />
          </g>
        </g>

        {/* desk items */}
        <g>
          <rect x="296" y="527" width="88" height="8" rx="2" fill="#B96B60" />
          <rect x="300" y="520" width="80" height="7" rx="2" fill="#2C4A6E" />
          <rect x="300" y="520" width="80" height="1.5" fill="#fff" fillOpacity=".25" />
          <rect x="322" y="515" width="46" height="6" rx="1.5" fill="#D9C49B" />

          <rect x="766" y="508" width="28" height="30" rx="6" fill="#E8EEF5" />
          <rect x="766" y="508" width="6" height="30" rx="3" fill="#fff" fillOpacity=".5" />
          <path d="M794 516Q808 518 806 528Q804 534 794 532" stroke="#E8EEF5" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="780" cy="509" rx="12" ry="2.6" fill="#3A2418" />
          <path className="steam" d="M774 502Q770 494 776 488" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
          <path className="steam steam--b" d="M786 502Q790 494 784 488" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />

          <path d="M836 538L840 516H860L864 538Z" fill="#E8EEF5" />
          <path d="M850 516C836 504 834 492 842 484C848 496 852 506 850 516ZM850 516C864 506 868 494 860 486C854 498 852 506 850 516ZM850 516C850 502 852 494 850 488" fill="#6BB48F" />

          {/* wireless mouse */}
          <ellipse cx="760" cy="533" rx="13" ry="4.5" fill="#CBD2DC" />
          <path d="M748 533C750 528 770 528 772 533" fill="#E6EBF1" />
        </g>
      </svg>

      {/* ═════════ LAYER 3 — photographic finish (static) ═════════ */}
      <svg aria-hidden="true" className="office-scene-art pointer-events-none" viewBox={VB} preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vignette" cx=".5" cy=".5" r=".75">
            <stop offset=".55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".55" />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0" />
          </filter>
        </defs>
        <rect x="-300" y="0" width="1720" height="720" fill="url(#vignette)" />
        <rect x="-300" y="0" width="1720" height="720" filter="url(#grain)" opacity=".06" />
      </svg>
    </>
  );
}