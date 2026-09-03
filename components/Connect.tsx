"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function Connect() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "General Inquiry", // New state for the dropdown
    message: "",
  });
  
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Inject the selected service into the message before sending it to the backend
    const payload = {
      name: formData.name,
      email: formData.email,
      message: `[Service Requested: ${formData.service}]\n\n${formData.message}`
    };

    try {
      await axios.post("http://localhost:8000/leads", payload);
      setStatus("success");
      setFormData({ name: "", email: "", service: "General Inquiry", message: "" }); 
      
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("Error submitting lead:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <section id="connect" className="w-full py-24 border-t border-white/5 min-h-[60vh]">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        
        {/* Left Side: Text and Info */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-gray-500">
            05. Get to Work
          </h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-white">
            Talk is cheap. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Execution matters.</span>
          </h3>
          <p className="text-gray-400 text-lg">
            Ideas are great, but shipping the actual product is the only thing that counts. I write code and build functional mobile and web applications. If you are ready to skip the fluff and turn a concept into a working reality, let's build it.
          </p>
          
          <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl w-max flex flex-col gap-3">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Direct Contact</p>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              Note: The backend server might occasionally be in sleep mode to optimize hosting costs. You can always reach me directly using the details below.
            </p>
            <div className="flex flex-col gap-1 mt-2">
              <a href="mailto:2100031105cseh@gmail.com" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                2100031105cseh@gmail.com
              </a>
              <a href="tel:+919346267529" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                +91 9346267529
              </a>
              <a href="tel:+919346267529" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                +91 9398460118
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="w-full md:w-1/2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-400 ml-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-400 ml-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="john@company.com"
              />
            </div>

            {/* NEW: Services Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="service" className="text-sm font-medium text-gray-400 ml-1">How can I help you?</label>
              <div className="relative">
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Full-Stack Web App">Full-Stack Web App Development</option>
                  <option value="Backend & API Architecture">Backend & API Architecture</option>
                  <option value="Native Android App">Native Android App (Kotlin)</option>
                  <option value="Freelance/Contract Work">Freelance / Contract Work</option>
                  <option value="Full-Time Opportunity">Full-Time Opportunity</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-400 ml-1">Project Details</label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Tell me a bit about what we are building..."
              ></textarea>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === "submitting"}
              type="submit"
              className="w-full py-4 mt-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center h-14"
            >
              {status === "idle" && "Send Message"}
              {status === "submitting" && <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
              {status === "success" && "Message Sent! ✓"}
              {status === "error" && "Error Sending ✕"}
            </motion.button>

          </form>
        </div>

      </div>
    </section>
  );
}