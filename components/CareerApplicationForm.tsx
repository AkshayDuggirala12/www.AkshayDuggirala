"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { api } from "../lib/api";

type SubmissionState = "idle" | "submitting" | "success" | "saved-email-error" | "error";

export default function CareerApplicationForm() {
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("consent", "true");

    try {
      const response = await api.post<{ message: string }>("/careers/apply", formData);
      setState("success");
      setMessage(response.data.message);
      form.reset();
    } catch (error) {
      const response = axios.isAxiosError<{ detail?: string }>(error) ? error.response : undefined;
      if (response?.status === 503 && response.data?.detail?.includes("application was saved")) {
        setState("saved-email-error");
        setMessage(response.data.detail);
      } else {
        setState("error");
        const detail = response?.data?.detail;
        setMessage(
          typeof detail === "string"
            ? detail
            : "We couldn’t submit your application. Check the form and try again.",
        );
      }
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none";
  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/#careers" className="text-sm font-semibold text-teal-800 hover:text-teal-600">
          ← Back to portfolio
        </Link>
        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            Freelance · Remote
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Apply to work with me
          </h1>
          <p className="mt-3 leading-relaxed text-slate-600">
            Share your experience with React, React Native, FastAPI, and Python. Attach a PDF resume.
            If shortlisted, you’ll receive next steps by email.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8"
        >
          <label className={labelClass}>
            Full name *
            <input name="full_name" required minLength={2} maxLength={160} autoComplete="name" className={`${inputClass} mt-2 font-normal`} />
          </label>
          <label className={labelClass}>
            Email *
            <input name="email" type="email" required autoComplete="email" className={`${inputClass} mt-2 font-normal`} />
          </label>
          <label className={labelClass}>
            Phone number *
            <input name="phone" type="tel" required minLength={7} maxLength={40} autoComplete="tel" className={`${inputClass} mt-2 font-normal`} />
          </label>
          <label className={labelClass}>
            Relevant experience *
            <input name="experience" required maxLength={200} placeholder="e.g. 3 years building React apps" className={`${inputClass} mt-2 font-normal`} />
          </label>
          <label className={labelClass}>
            LinkedIn profile
            <input name="linkedin_url" type="url" maxLength={500} placeholder="https://linkedin.com/in/..." className={`${inputClass} mt-2 font-normal`} />
          </label>
          <label className={labelClass}>
            GitHub or portfolio
            <input name="github_url" type="url" maxLength={500} placeholder="https://github.com/..." className={`${inputClass} mt-2 font-normal`} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Short introduction
            <textarea name="cover_note" rows={4} maxLength={5000} placeholder="Tell me about your relevant work and availability." className={`${inputClass} mt-2 resize-y font-normal`} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Resume (PDF, max 5 MB) *
            <input name="resume" type="file" accept="application/pdf,.pdf" required className={`${inputClass} mt-2 file:mr-3 file:rounded-full file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800`} />
          </label>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 sm:col-span-2">
            <input type="checkbox" required className="mt-1 accent-teal-600" />
            <span>
              I agree that my application details and resume can be used to review my candidacy and
              contact me about this opportunity.
            </span>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={state === "submitting"}
              className="w-full rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-6 py-3.5 font-bold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
            >
              {state === "submitting" ? "Submitting..." : "Submit application"}
            </button>
            {message && (
              <p
                role="status"
                className={`mt-4 text-sm font-medium ${
                  state === "error" || state === "saved-email-error" ? "text-amber-800" : "text-teal-800"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already applied?{" "}
          <Link href="/careers/portal" className="font-semibold text-teal-800 underline underline-offset-4">
            Access your application
          </Link>
        </p>
      </div>
    </main>
  );
}
