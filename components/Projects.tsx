"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProjectItem {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  link: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://akshaywebsitebackend.onrender.com/projects");
      setProjects(response.data);
      setIsFetched(true);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="projects" className="w-full py-24 border-t border-white/5 min-h-[40vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h2 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-blue-300 mb-3">
            Product exploration
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-white">
            An idea I’m working on
          </p>
        </div>
        {!isFetched && !loading && (
          <motion.button
            onClick={fetchProjects}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>Load other projects</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </motion.button>
        )}
      </div>

      <motion.article
        id="product"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
      >
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
            <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
              Early-stage prototype
            </span>
            <h3 className="mt-6 text-3xl font-bold leading-tight text-white md:text-4xl">
              Making local work easier to find.
            </h3>
            <p className="mt-5 leading-relaxed text-slate-300">
              I’m exploring a platform that could help local businesses find
              workers when they need extra hands, while helping people discover
              flexible work opportunities nearby.
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">
              The idea is still being developed and tested. It isn’t a public
              service yet; this is an early step toward building a useful
              product for real people.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["Local businesses", "Flexible work", "Mobile-first"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-blue-400/20 via-slate-900 to-indigo-400/20 p-7 md:min-h-full md:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-blue-200/10" />
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-blue-200/10" />
            <div className="relative flex h-full min-h-52 flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  The opportunity
                </p>
                <p className="mt-3 max-w-sm text-2xl font-semibold leading-snug text-white">
                  A busy shop needs a helping hand. A local worker is ready.
                </p>
              </div>
              <p className="mt-8 text-sm text-slate-300">
                Exploring a better connection between the two.
              </p>
            </div>
          </div>
        </div>
      </motion.article>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isFetched && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/40 transition-all flex flex-col h-full justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                    {project.title}
                  </h3>
                  {project.link !== "#" && (
                    <Link href={project.link} target="_blank" className="text-gray-400 hover:text-white transition-colors">
                      <ExternalLink size={24} />
                    </Link>
                  )}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tech_stack.split(",").map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs rounded-md bg-green-500/10 text-green-300 border border-green-500/20 font-mono"
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