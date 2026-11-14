"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpRight, Smartphone } from "lucide-react";
import { api } from "../lib/api";

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
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<ProjectItem[]>("/projects");
      if (!Array.isArray(response.data)) {
        throw new Error("The projects service returned an unexpected response.");
      }
      setProjects(response.data);
      setIsFetched(true);
    } catch (fetchError) {
      console.error("Error fetching projects:", fetchError);
      setError("More projects could not be loaded. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="products"
      className="mx-auto w-full max-w-7xl border-t border-slate-200 py-20 md:py-28"
    >
      <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 md:text-sm">
            Products
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Things I’m building.
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            A growing collection of products and experiments. More details are on the way.
          </p>
        </div>
        {!isFetched && (
          <motion.button
            onClick={fetchProjects}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-wait disabled:opacity-60"
          >
            <ArrowDownToLine size={16} aria-hidden="true" />
            {loading ? "Loading projects..." : "Load more projects"}
          </motion.button>
        )}
      </div>

      <motion.article
        id="paddy-brokerage"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
            <span className="w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-800">
              Android app
            </span>
            <h3 className="mt-6 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
              StarFreight
            </h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              A mobile office for paddy brokers and freight agents. Manage digital waybills, keep
              payee records, and track freight charges, advances, and driver payments.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.ssst.paddybrokerage"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-105"
            >
              View StarFreight on Google Play <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-indigo-50 p-8 md:p-12">
            <div className="flex h-48 w-48 items-center justify-center rounded-[2.5rem] border border-white bg-white/80 text-teal-700 shadow-xl shadow-teal-900/10">
              <Smartphone size={76} strokeWidth={1.2} aria-hidden="true" />
            </div>
          </div>
        </div>
      </motion.article>

      <motion.article
        id="sremasethu"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
            <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-800">
              In development · My product
            </span>
            <h3 className="mt-6 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
              SremaSethu
            </h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              A two-sided local gig platform I’m building. Sethu helps businesses post and manage
              shifts; Srema helps workers discover nearby gigs, manage active work, and follow their
              earnings.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              The merchant and partner apps are in development. A public product website is planned
              for the future.
            </p>
          </div>
          <div className="flex min-h-64 items-center justify-center gap-4 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-8 md:p-12">
            <div className="flex h-36 w-36 flex-col items-center justify-center rounded-[2rem] border border-white bg-white/80 text-slate-800 shadow-lg shadow-sky-900/5">
              <span className="text-4xl font-black tracking-tight text-sky-700">S</span>
              <span className="mt-1 text-sm font-bold">Sethu</span>
              <span className="mt-1 text-xs text-slate-500">For businesses</span>
            </div>
            <div className="flex h-36 w-36 flex-col items-center justify-center rounded-[2rem] border border-white bg-white/80 text-slate-800 shadow-lg shadow-teal-900/5">
              <span className="text-4xl font-black tracking-tight text-teal-700">S</span>
              <span className="mt-1 text-sm font-bold">Srema</span>
              <span className="mt-1 text-xs text-slate-500">For partners</span>
            </div>
          </div>
        </div>
      </motion.article>

      {error && (
        <p role="status" className="mt-5 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      {isFetched && projects.length === 0 && (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No additional projects have been published yet.
        </p>
      )}

      {isFetched && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          {projects.map((project) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-950">{project.title}</h3>
                  {project.link !== "#" && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${project.title}`}
                      className="text-slate-500 transition-colors hover:text-teal-700"
                    >
                      <ArrowUpRight size={20} />
                    </a>
                  )}
                </div>
                <p className="leading-relaxed text-slate-600">{project.description}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.tech_stack.split(",").filter(Boolean).map((tech) => (
                  <span
                    key={tech.trim()}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </section>
  );
}
