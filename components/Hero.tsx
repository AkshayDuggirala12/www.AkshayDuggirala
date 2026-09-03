"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Stagger container for the left-side text block
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Hero() {
  const [splineLoaded, setSplineLoaded] = useState(false);

  // --- Mouse-parallax tilt for the 3D scene container ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section className="relative w-full min-h-[80vh] md:h-[80vh] flex flex-col-reverse md:flex-row items-center justify-between mt-6 md:mt-10 overflow-hidden">
      {/* Ambient glow blobs behind everything */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-blue-500/20 blur-[120px]"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 w-[26rem] h-[26rem] rounded-full bg-purple-600/20 blur-[120px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Left Side: Text and Intro */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full md:w-1/2 flex flex-col gap-6 z-10"
      >
        <motion.div
          variants={item}
          className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-purple-400 w-max"
        >
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-2 align-middle"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          WORK IN PROGRESS
        </motion.div>

        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight"
        >
          A fully interactive <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 bg-[length:200%_auto] animate-[gradient-shift_6s_ease_infinite]">
            3D Experience
          </span>{" "}
          is brewing.
        </motion.h1>

        <motion.p variants={item} className="text-gray-400 text-lg md:text-xl max-w-xl">
          I believe in continuous learning. Right now, I'm expanding my skill set by learning how to build highly interactive 3D web and mobile animations. A custom 3D scene is actively in development for this space. Stay tuned!
        </motion.p>

        <motion.div variants={item} className="flex gap-4 mt-4">
          <a href="#about">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="bg-white text-black px-8 py-3.5 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <span>About Me</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </motion.button>
          </a>
        </motion.div>
      </motion.div>

      {/* Right Side: Spline Iframe Embed with mouse-parallax tilt */}
      <motion.div
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay: 0.2 }}
        style={{ perspective: 1000 }}
        className="w-full md:w-1/2 h-[400px] md:h-full relative flex items-center justify-center"
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="w-full h-full relative flex items-center justify-center overflow-hidden rounded-2xl"
        >
          {!splineLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <motion.div
                className="relative w-48 h-48 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 font-semibold shadow-2xl"
                animate={{ boxShadow: [
                  "0 0 20px 0px rgba(96,165,250,0.25)",
                  "0 0 40px 10px rgba(168,85,247,0.25)",
                  "0 0 20px 0px rgba(96,165,250,0.25)",
                ] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                Loading 3D...
              </motion.div>
            </div>
          )}

          <iframe 
            src="https://my.spline.design/cube-1e07b8cd37c1fffae2b170e5ee35d97f/" 
            onLoad={() => setSplineLoaded(true)}
            className="w-full h-full border-none pointer-events-auto overflow-hidden"
            style={{ overflow: "hidden" }}
            scrolling="no"
            title="3D Experience"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}