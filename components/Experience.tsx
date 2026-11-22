"use client";

import { motion } from "framer-motion";

export default function Experience() {
  return (
    <section id="experience" className="mx-auto w-full max-w-7xl border-t border-slate-200 py-20 md:py-28">
      <div className="mb-12">
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 md:text-sm">
            Experience
          </h2>
          <p className="text-2xl font-bold text-slate-950 md:text-3xl">
            Growing through product engineering
          </p>
        </div>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-6 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-6 md:p-8"
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-800">
              October 2026 — Present
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Associate Software Engineer
            </h3>
            <p className="mt-1 text-lg text-slate-600">
              Vivid Minds <span className="text-slate-400">·</span> Quixy
            </p>
          </div>
          <span className="w-fit rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-800">
            Current role
          </span>
        </div>
        <p className="mt-5 max-w-3xl leading-relaxed text-slate-600">
          The beginning of my career in a product-based company. I’m looking
          forward to learning from the people, product, and engineering work
          around me.
        </p>
      </motion.article>
    </section>
  );
}