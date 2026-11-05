"use client";

import { motion } from "framer-motion";

const milestones = [
  {
    year: "The foundation",
    title: "Learning how software works",
    paragraph:
      "My engineering journey at KL University gave me a foundation in computer science and the confidence to keep learning by building. I became curious about how applications, APIs, and databases come together to solve practical problems.",
  },
  {
    year: "October 2026 — Present",
    title: "Starting my product engineering career",
    paragraph:
      "I started as an Associate Software Engineer at Vivid Minds (Quixy). It’s the next step in learning how teams build and grow software products.",
  },
  {
    year: "What’s next",
    title: "Building toward something of my own",
    paragraph:
      "I’m developing a prototype around flexible local work—an idea inspired by businesses that need extra help and people looking for opportunities. Over time, I hope to grow my own products into a company. For now, the focus is listening, learning, and building carefully.",
  }
];

export default function Journey() {
  return (
    <section id="journey" className="relative w-full border-t border-white/10 py-20 md:py-28">
      <div className="flex flex-col md:flex-row gap-16 relative">
        <div className="w-full md:w-1/3 md:sticky md:top-32 md:h-max">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
            The journey
          </h2>
          <p className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            Building, <br className="hidden md:block" />one step at a time.
          </p>
          <p className="mt-5 max-w-sm leading-relaxed text-slate-400">
            A work in progress—shaped by the things I learn, the people I meet,
            and the problems worth solving.
          </p>
        </div>

        <div className="w-full md:w-2/3">
          {milestones.map((milestone, index) => (
            <motion.div 
              key={milestone.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative border-l border-white/10 pb-12 pl-7 last:pb-0 md:pl-9"
            >
              <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-300 ring-4 ring-slate-950" />
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {milestone.year}
                </span>
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  {milestone.title}
                </h3>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
                {milestone.paragraph}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}