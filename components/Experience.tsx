"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

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

  const fetchExperience = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://akshaywebsitebackend.onrender.com/experience");
      setExperiences(response.data);
      setIsFetched(true);
    } catch (error) {
      console.error("Error fetching experience:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="experience" className="w-full py-24 border-t border-white/5 min-h-[40vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-gray-500 mb-2">
            03. Work History
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-white">
            Professional Experience & Live Deployments
          </p>
        </div>

        {/* Micro-Interaction Button */}
        {!isFetched && !loading && (
          <motion.button
            onClick={fetchExperience}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>Load Work History</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </motion.button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-white">{exp.role}</h3>
                  <p className="text-lg font-medium text-purple-400">{exp.company} • <span className="text-gray-400 text-sm">{exp.location}</span></p>
                </div>
                <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {exp.duration}
                </span>
              </div>

              <p className="text-gray-300 leading-relaxed mt-2">{exp.description}</p>

              {/* Technologies Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {exp.technologies.split(",").map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs rounded-md bg-white/5 text-gray-400 border border-white/5 font-mono"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}