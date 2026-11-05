"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

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

  const fetchEducationData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://akshaywebsitebackend.onrender.com/education");
      setEducationData(response.data);
      setIsFetched(true);
    } catch (error) {
      console.error("Error fetching education:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="education" className="w-full py-24 border-t border-white/5 min-h-[40vh]">
      <h2 className="mb-12 text-xs font-bold uppercase tracking-[0.2em] text-blue-300 md:text-sm">
        Education
      </h2>

      {/* State 1: The Interactive Button */}
      {!isFetched && !loading && (
        <div className="flex justify-center items-center py-10">
          <motion.button
            onClick={fetchEducationData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-white font-semibold hover:bg-white/10 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)] transition-all flex items-center gap-3"
          >
            <span> Education</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col gap-4"
            >
              <div className="text-sm font-semibold text-blue-400 bg-blue-400/10 w-max px-3 py-1 rounded-full">
                {edu.year}
              </div>
              <h3 className="text-xl font-bold text-white">
                {edu.degree}
              </h3>
              <p className="text-gray-400 font-medium">
                {edu.institution}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}