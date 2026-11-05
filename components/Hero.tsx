"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import OfficeScene, { getHeadPoint } from "./OfficeScene";

// How long the cursor/finger can stay still before he goes back to typing (ms).
// Use a huge number (e.g. 600000) if you want him to keep watching while the pointer is on the page.
const IDLE_MS = 4000;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export default function Hero() {
  const [attentive, setAttentive] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  // where the pointer is relative to his head (-1 … 1)
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const backToWork = () => {
      setAttentive(false);
      lookX.set(0);
      lookY.set(0);
    };

    // works for mouse, pen and touch (tap or drag)
    const onPointer = (event: PointerEvent) => {
      const bounds = sceneRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const head = getHeadPoint(bounds);
      lookX.set(clamp((event.clientX - head.x) / (window.innerWidth * 0.35)));
      lookY.set(clamp((event.clientY - head.y) / (window.innerHeight * 0.35)));

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
    // full-bleed: breaks out of any max-width parent and spans the whole viewport
    <section
      aria-label="Animated glass office workspace"
      className="interactive-hero relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
    >
      <div
        ref={sceneRef}
        role="img"
        aria-label="A developer working on a laptop in a glass office. He looks up at your cursor when you move the mouse."
        className="office-stage relative h-[calc(100svh-6rem)] min-h-[30rem] w-full"
      >
        <OfficeScene attentive={attentive} lookX={lookX} lookY={lookY} />
        <div aria-hidden="true" className="office-stage__glint" />
      </div>
    </section>
  );
}