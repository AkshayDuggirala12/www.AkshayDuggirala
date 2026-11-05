"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import OfficeScene, { getHeadPoint } from "./OfficeScene";

// Time before returning to typing if the mouse stays completely still (ms)
const IDLE_MS = 15000;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export default function Hero() {
  const [attentive, setAttentive] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Normalized pointer direction relative to the developer's head (-1 to 1)
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
    window.addEventListener("mouseenter", onPointer as EventListener, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeavePage);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("mouseenter", onPointer as EventListener);
      document.documentElement.removeEventListener("mouseleave", onMouseLeavePage);
    };
  }, [lookX, lookY]);

  return (
    <section
      aria-label="Animated glass office workspace"
      className="interactive-hero relative -mx-6 w-[calc(100%+3rem)] overflow-hidden md:-mx-10 md:w-[calc(100%+5rem)] lg:-mx-16 lg:w-[calc(100%+8rem)] xl:-mx-24 xl:w-[calc(100%+12rem)]"
    >
      <div
        ref={sceneRef}
        role="img"
        aria-label="A developer working on a MacBook in a glass office. When you place your mouse on the website, he stops typing and looks at your cursor."
        className="office-stage relative h-[calc(100svh-6rem)] min-h-[30rem] w-full"
      >
        <OfficeScene attentive={attentive} lookX={lookX} lookY={lookY} />
        <div aria-hidden="true" className="office-stage__glint" />
      </div>
    </section>
  );
}