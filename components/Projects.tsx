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
      const response = await axios.get("http://localhost:8000/projects");
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
          <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-gray-500 mb-2">
            04. Projects
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-white">
            Things I've Built
          </p>
        </div>

        {/* Micro-Interaction Button */}
        {!isFetched && !loading && (
          <motion.button
            onClick={fetchProjects}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>Load Projects</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </motion.button>
        )}
      </div>

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