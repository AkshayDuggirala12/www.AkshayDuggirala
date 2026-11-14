"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "../lib/api";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  experience: string;
  linkedin_url: string | null;
  github_url: string | null;
  cover_note: string | null;
  resume_filename: string;
  assessment_url: string | null;
  interview_at: string | null;
  interview_type: string | null;
  created_at: string;
  updated_at: string;
}

const SESSION_KEY = "applicant-session";

export default function ApplicantPortal() {
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "sending" | "error">("loading");
  const [message, setMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const loadApplication = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const oneTimeToken = query.get("token");
        let sessionToken = sessionStorage.getItem(SESSION_KEY);

        if (oneTimeToken) {
          const form = new FormData();
          form.set("token", oneTimeToken);
          const response = await api.post<{ access_token: string }>("/careers/verify-link", form);
          sessionToken = response.data.access_token;
          sessionStorage.setItem(SESSION_KEY, sessionToken);
          window.history.replaceState({}, "", window.location.pathname);
        }

        if (!sessionToken) {
          if (active) setStatus("ready");
          return;
        }

        const response = await api.get<Application>("/careers/me", {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        if (active) {
          setApplication(response.data);
          setStatus("ready");
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
        if (active) {
          setMessage("This sign-in link may have expired. Request a new one below.");
          setStatus("ready");
        }
      }
    };
    void loadApplication();
    return () => {
      active = false;
    };
  }, []);

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const response = await api.post<{ message: string }>("/careers/request-link", { email });
      setMessage(response.data.message);
      setStatus("ready");
    } catch (error) {
      console.error("Unable to request applicant sign-in link:", error);
      setMessage("We couldn’t send a sign-in link. Please try again later.");
      setStatus("error");
    }
  }

  async function downloadResume() {
    const sessionToken = sessionStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;
    try {
      const response = await api.get("/careers/me/resume", {
        headers: { Authorization: `Bearer ${sessionToken}` },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "my-resume.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Unable to download applicant resume:", error);
      setMessage("Your resume couldn’t be downloaded right now.");
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sessionToken = sessionStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;
    setProfileSaving(true);
    setMessage("");
    try {
      const formValues = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await api.patch<Application>("/careers/me", formValues, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setApplication(response.data);
      setMessage("Your application profile has been updated.");
    } catch (error) {
      console.error("Unable to update applicant profile:", error);
      setMessage("Your profile could not be updated. Please check the details and try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function updateResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sessionToken = sessionStorage.getItem(SESSION_KEY);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedResume = formData.get("resume");
    if (!(selectedResume instanceof File) || selectedResume.size === 0) {
      setMessage("Choose a PDF resume to upload.");
      return;
    }
    setProfileSaving(true);
    setMessage("");
    try {
      const response = await api.put<{ message: string }>("/careers/me/resume", formData, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setMessage(response.data.message);
      form.reset();
    } catch (error) {
      console.error("Unable to update applicant resume:", error);
      setMessage("Your resume could not be updated. Please check that it is a PDF under 5 MB.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    setApplication(null);
    setMessage("You have been signed out.");
  }

  const stages = [
    "Applied",
    "Screening",
    "Exam/assessment",
    "Technical interview",
    "HR interview",
    "Offer",
    "Hired",
    "Rejected",
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/#careers" className="text-sm font-semibold text-teal-800 hover:text-teal-600">
          ← Back to portfolio
        </Link>
        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Applicant portal</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Your application
          </h1>
        </header>

        {status === "loading" && <p className="mt-8 text-slate-600">Checking your sign-in link…</p>}

        {application && status !== "loading" ? (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{application.full_name}</h2>
                <p className="mt-1 text-sm text-slate-500">{application.email}</p>
              </div>
              <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
                {application.status}
              </span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-600">
              Your application is in the <strong>{application.status}</strong> stage. We’ll email you
              when there is an update.
            </p>
            {application.assessment_url && (
              <a
                href={application.assessment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block font-semibold text-teal-800 underline underline-offset-4"
              >
                Open your assessment
              </a>
            )}
            {application.interview_at && (
              <p className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm text-sky-950">
                {application.interview_type ? `${application.interview_type} scheduled for ` : "Interview scheduled for "}
                {new Date(application.interview_at).toLocaleString()}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadResume}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-800"
              >
                Download your resume
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
              >
                Sign out
              </button>
            </div>
            <details className="mt-7 border-t border-slate-100 pt-5">
              <summary className="cursor-pointer font-semibold text-teal-800">
                Update your application profile
              </summary>
              <form onSubmit={updateProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Full name
                  <input name="full_name" required minLength={2} maxLength={160} defaultValue={application.full_name} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 focus:border-teal-500 focus:outline-none" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Phone
                  <input name="phone" type="tel" required minLength={7} maxLength={40} defaultValue={application.phone} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 focus:border-teal-500 focus:outline-none" />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Relevant experience
                  <input name="experience" required minLength={2} maxLength={200} defaultValue={application.experience} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 focus:border-teal-500 focus:outline-none" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  LinkedIn
                  <input name="linkedin_url" type="url" maxLength={500} defaultValue={application.linkedin_url ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 focus:border-teal-500 focus:outline-none" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  GitHub / portfolio
                  <input name="github_url" type="url" maxLength={500} defaultValue={application.github_url ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 focus:border-teal-500 focus:outline-none" />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Introduction
                  <textarea name="cover_note" rows={4} maxLength={5000} defaultValue={application.cover_note ?? ""} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 focus:border-teal-500 focus:outline-none" />
                </label>
                <button type="submit" disabled={profileSaving} className="w-fit rounded-full bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">
                  {profileSaving ? "Saving…" : "Save profile"}
                </button>
              </form>
              <form onSubmit={updateResume} className="mt-5 flex flex-wrap items-end gap-3">
                <label className="flex-1 text-sm font-semibold text-slate-700">
                  Replace resume (PDF, max 5 MB)
                  <input name="resume" type="file" accept="application/pdf,.pdf" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-700" />
                </label>
                <button type="submit" disabled={profileSaving} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60">
                  Update resume
                </button>
              </form>
            </details>
            {["Hired", "Rejected"].includes(application.status) ? (
              <p className="mt-8 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Application outcome: {application.status}
              </p>
            ) : (
              <ol aria-label="Hiring process" className="mt-8 grid gap-2 sm:grid-cols-2">
                {stages.slice(0, 6).map((stage, index) => {
                  const stageIndex = stages.indexOf(application.status);
                  const isCurrent = stage === application.status;
                  const isPast = stageIndex >= 0 && index < stageIndex;
                  return (
                    <li
                      key={stage}
                      className={`rounded-xl px-4 py-3 text-sm font-medium ${
                        isCurrent
                          ? "bg-teal-100 text-teal-900"
                          : isPast
                            ? "bg-teal-50 text-teal-800"
                            : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {isPast ? "✓ " : isCurrent ? "• " : ""}
                      {stage}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ) : status !== "loading" ? (
          <form onSubmit={requestLink} className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="leading-relaxed text-slate-600">
              Enter the email address you used to apply. We’ll send you a one-time sign-in link if
              there’s an application for that address.
            </p>
            <label htmlFor="applicant-email" className="mt-6 block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="applicant-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-4 rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {message && <p role="status" className="mt-4 text-sm text-slate-600">{message}</p>}
          </form>
        ) : null}
      </div>
    </main>
  );
}
