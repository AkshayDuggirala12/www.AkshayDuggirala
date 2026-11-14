"use client";

import { motion } from "framer-motion";

const principles = [
  {
    number: "01",
    title: "Start with the problem",
    description:
      "Understand the people and the work behind a challenge before reaching for a technical solution.",
  },
  {
    number: "02",
    title: "Build to learn",
    description:
      "Turn ideas into prototypes, learn from the process, and keep improving what is useful.",
  },
  {
    number: "03",
    title: "Think beyond launch",
    description:
      "Care about the details that make software clear, dependable, and easier to use over time.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="mx-auto w-full max-w-7xl border-t border-slate-200 py-20 md:py-28"
    >
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            About me
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">
            Curious about how things can work better.
          </h2>
        </div>
        <div className="flex flex-col gap-5 text-lg leading-relaxed text-slate-600">
          <p>
            I’m Akshay, a software engineer who enjoys bringing ideas to life
            across web, backend, and mobile. I’m interested in the space where
            thoughtful engineering meets the everyday problems people face.
          </p>
          <p>
            Alongside my role at Vivid Minds (Quixy), I’m exploring an
            early stage product idea around flexible local work. This site is
            where I share the work, lessons, and ideas behind that journey.
          </p>
        </div>
      </div>

      <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3">
        {principles.map((principle, index) => (
          <motion.article
            key={principle.number}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7"
          >
            <p className="text-sm font-bold tracking-widest text-teal-700">
              {principle.number}
            </p>
            <h3 className="mt-6 text-xl font-bold text-slate-950">
              {principle.title}
            </h3>
            <p className="mt-3 leading-relaxed text-slate-600">
              {principle.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
