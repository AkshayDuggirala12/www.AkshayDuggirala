"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

interface EducationItem {
  id: number;
  degree: string;
  institution: string;
  year: string;
}

export default function Education() {
  const [educationData, setEducationData] = useState<EducationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [error, setError] = useState("");

  const fetchEducationData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<EducationItem[]>("/education");
      setEducationData(response.data);
      setIsFetched(true);
    } catch (error) {
      console.error("Error fetching education:", error);
      setError("Education details could not be loaded. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="education" className="mx-auto w-full max-w-7xl border-t border-slate-200 py-20 md:py-28">
      <h2 className="mb-12 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 md:text-sm">
        Education
      </h2>

      {/* State 1: The Interactive Button */}
      {!isFetched && !loading && (
        <div className="flex justify-center items-center py-10">
          <motion.button
            onClick={fetchEducationData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 rounded-full border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-800 transition hover:border-teal-500 hover:text-teal-700"
          >
            <span> Education</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </motion.button>
        </div>
      )}

      {/* State 2: Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
        </div>
      )}

      {/* State 3: The Fetched Data Cards */}
      {isFetched && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {educationData.map((edu) => (
            <motion.div 
              key={edu.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-teal-300"
            >
              <div className="w-max rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
                {edu.year}
              </div>
              <h3 className="text-xl font-bold text-slate-950">
                {edu.degree}
              </h3>
              <p className="font-medium text-slate-600">
                {edu.institution}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
      {error && <p role="status" className="mt-5 text-sm font-medium text-rose-700">{error}</p>}
    </section>
  );
}