"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import OfficeScene, { getHeadPoint } from "./OfficeScene";

const IDLE_MS = 15000;
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export default function Hero() {
  const [attentive, setAttentive] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const backToWork = () => {
      setAttentive(false);
      lookX.set(0);
      lookY.set(0);
    };

    const onPointer = (event: PointerEvent) => {
      const bounds = sceneRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const head = getHeadPoint(bounds);
      lookX.set(clamp((event.clientX - head.x) / (window.innerWidth * 0.4)));
      lookY.set(clamp((event.clientY - head.y) / (window.innerHeight * 0.4)));
      setAttentive(true);
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(backToWork, IDLE_MS);
    };

    const onMouseLeavePage = () => {
      if (idleTimer) clearTimeout(idleTimer);
      backToWork();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeavePage);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.removeEventListener("mouseleave", onMouseLeavePage);
    };
  }, [lookX, lookY]);

  return (
    <section
      aria-label="Akshay's work and office"
      className="relative -mx-6 overflow-hidden bg-[radial-gradient(ellipse_at_50%_25%,rgba(204,244,238,0.65),transparent_44%),linear-gradient(115deg,#f8fbff_0%,#f8f6fb_48%,#f8fcfa_100%)] px-6 pb-12 pt-16 md:-mx-10 md:px-10 md:pt-20 lg:-mx-16 lg:px-16 lg:pt-24 xl:-mx-24 xl:px-24"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700 md:text-sm">
          Software engineer 
        </p>
        <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">
          Turning complex problems 
          <span className="block bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
            into simple digital solutions.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          I’m Akshay Duggirala, a software engineer who enjoys turning practical problems into thoughtful web,
          backend, and mobile products.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#products"
            className="rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Explore my products
          </a>
          <a
            href="#connect"
            className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-teal-500 hover:text-teal-700"
          >
            Get in touch
          </a>
        </div>
      </div>

      <div className="office-scene-frame mx-auto mt-12 max-w-7xl">
        <div
          ref={sceneRef}
          role="img"
          aria-label="Animated illustration of a developer working at a computer in a glass office. The developer looks toward your pointer."
          className="office-stage relative h-[22rem] w-full overflow-hidden rounded-[1.75rem] border border-slate-700/40 bg-slate-950 shadow-2xl shadow-slate-900/20 sm:h-[28rem] lg:h-[34rem]"
        >
          <OfficeScene attentive={attentive} lookX={lookX} lookY={lookY} />
          <div aria-hidden="true" className="office-stage__glint" />
        </div>
      </div>
    </section>
  );
}
