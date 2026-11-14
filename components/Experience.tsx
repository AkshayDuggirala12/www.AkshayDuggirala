"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

interface ExperienceItem {
  id: number;
  role: string;
  company: string;
  duration: string;
  location: string;
  description: string;
  technologies: string;
}

export default function Experience() {
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [error, setError] = useState("");

  const fetchExperience = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<ExperienceItem[]>("/experience");
      setExperiences(response.data);
      setIsFetched(true);
    } catch (error) {
      console.error("Error fetching experience:", error);
      setError("Additional experience could not be loaded. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="experience" className="mx-auto w-full max-w-7xl border-t border-slate-200 py-20 md:py-28">
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 md:text-sm">
            Experience
          </h2>
          <p className="text-2xl font-bold text-slate-950 md:text-3xl">
            Growing through product engineering
          </p>
        </div>
        {!isFetched && !loading && (
          <motion.button
            onClick={fetchExperience}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-teal-500 hover:text-teal-700 md:self-auto"
          >
            <span>Load additional experience</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </motion.button>
        )}
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

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
        </div>
      )}

      {isFetched && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {experiences.map((exp) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-teal-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950">{exp.role}</h3>
                  <p className="text-lg font-medium text-teal-800">{exp.company} • <span className="text-sm text-slate-500">{exp.location}</span></p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-600">
                  {exp.duration}
                </span>
              </div>

              <p className="mt-2 leading-relaxed text-slate-600">{exp.description}</p>

              {/* Technologies Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {exp.technologies.split(",").map((tech, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono text-slate-600"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
      {error && <p role="status" className="mt-5 text-sm font-medium text-rose-700">{error}</p>}
    </section>
  );
}