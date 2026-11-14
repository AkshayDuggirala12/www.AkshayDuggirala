"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { api } from "../lib/api";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  experience: string;
  linkedin_url: string | null;
  github_url: string | null;
  cover_note: string | null;
  resume_filename: string;
  status: string;
  admin_notes: string;
  assessment_url: string | null;
  interview_at: string | null;
  interview_type: string | null;
  created_at: string;
}

interface Dashboard {
  total_applications: number;
  applications_today: number;
  page_views_today: number;
  applications_by_stage: Record<string, number>;
  page_views_last_30_days: { date: string; page_path: string; views: number }[];
  hiring_stages: string[];
}

interface Lead {
  id: number;
  name: string;
  email: string;
  message: string;
}

export default function HiringAdmin() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");
  const [assessmentUrl, setAssessmentUrl] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const headers = { "X-Admin-Key": key };
      const [dashboardResponse, applicationsResponse, leadsResponse] = await Promise.all([
        api.get<Dashboard>("/admin/hiring/dashboard", { headers }),
        api.get<Application[]>("/admin/hiring/applications", { headers }),
        api.get<Lead[]>("/leads", { headers }),
      ]);
      setDashboard(dashboardResponse.data);
      setApplications(applicationsResponse.data);
      setLeads(leadsResponse.data);
      setAuthenticated(true);
      setMessage("");
    } catch (requestError) {
      console.error("Unable to load hiring dashboard:", requestError);
      setError("Could not access the dashboard. Check the admin key and API connection.");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedApplication = applications.find((application) => application.id === selectedId);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData(adminKey);
  }

  function selectApplication(application: Application) {
    setSelectedId(application.id);
    setStage(application.status);
    setNotes(application.admin_notes ?? "");
    setAssessmentUrl(application.assessment_url ?? "");
    setInterviewAt(
      application.interview_at
        ? new Date(application.interview_at).toISOString().slice(0, 16)
        : "",
    );
    setInterviewType(application.interview_type ?? "");
  }

  async function saveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedApplication) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const interviewTime = interviewAt ? new Date(interviewAt).toISOString() : null;
      await api.patch(
        `/admin/hiring/applications/${selectedApplication.id}`,
        {
          status: stage,
          admin_notes: notes,
          assessment_url: assessmentUrl || null,
          interview_at: interviewTime,
          interview_type: interviewType || null,
        },
        { headers: { "X-Admin-Key": adminKey } },
      );
      setMessage("Application updated.");
      await loadData(adminKey);
    } catch (requestError) {
      console.error("Unable to update hiring application:", requestError);
      const detail = axios.isAxiosError<{ detail?: string }>(requestError)
        ? requestError.response?.data?.detail
        : undefined;
      if (detail?.includes("application was updated")) {
        await loadData(adminKey);
        setMessage(detail);
      } else {
        setError(detail ?? "The application could not be updated. Check required fields and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function downloadResume(application: Application) {
    try {
      const response = await api.get(
        `/admin/hiring/applications/${application.id}/resume`,
        { headers: { "X-Admin-Key": adminKey }, responseType: "blob" },
      );
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = application.resume_filename || "resume.pdf";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      console.error("Unable to download resume:", requestError);
      setError("The resume could not be downloaded.");
    }
  }

  function signOut() {
    setAdminKey("");
    setAuthenticated(false);
    setDashboard(null);
    setApplications([]);
    setLeads([]);
    setSelectedId("");
  }

  const totalViews = dashboard?.page_views_last_30_days.reduce((sum, item) => sum + item.views, 0) ?? 0;
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-teal-500 focus:outline-none";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-teal-800 hover:text-teal-600">
          ← Back to portfolio
        </Link>
        <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Private</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Hiring dashboard
            </h1>
          </div>
          {authenticated && (
            <button type="button" onClick={signOut} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Sign out
            </button>
          )}
        </header>

        {!authenticated ? (
          <form onSubmit={signIn} className="mt-8 max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="leading-relaxed text-slate-600">
              Enter the admin API key configured privately on the backend host. The key stays in this
              tab’s memory and is sent only to the API.
            </p>
            <label htmlFor="admin-key" className="mt-6 block text-sm font-semibold text-slate-700">
              Admin API key
            </label>
            <input
              id="admin-key"
              type="password"
              required
              autoComplete="current-password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              className={`${inputClass} mt-2`}
            />
            <button type="submit" disabled={loading} className="mt-4 rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
              {loading ? "Signing in…" : "Open dashboard"}
            </button>
          </form>
        ) : (
          <>
            <section aria-label="Hiring statistics" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Applications</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{dashboard?.total_applications ?? 0}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Applications · today (UTC)</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{dashboard?.applications_today ?? 0}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Page views · today (UTC)</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{dashboard?.page_views_today ?? 0}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Page views · last 30 days</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{totalViews}</p>
              </article>
              {dashboard?.hiring_stages.map((hiringStage) => (
                <article key={hiringStage} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{hiringStage}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {dashboard.applications_by_stage[hiringStage] ?? 0}
                  </p>
                </article>
              ))}
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="grid content-start gap-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-950">Applications</h2>
                  <button
                    type="button"
                    onClick={() => loadData(adminKey)}
                    disabled={loading}
                    className="text-sm font-semibold text-teal-800 hover:text-teal-600 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-4 grid gap-2">
                  {applications.length === 0 && <p className="text-sm text-slate-500">No applications received yet.</p>}
                  {applications.map((application) => (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => selectApplication(application)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedId === application.id
                          ? "border-teal-400 bg-teal-50"
                          : "border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      <span className="block font-bold text-slate-900">{application.full_name}</span>
                      <span className="mt-1 block text-sm text-slate-500">{application.email}</span>
                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {application.status}
                      </span>
                    </button>
                  ))}
                </div>
                <h3 className="mt-7 font-bold text-slate-900">Daily page views</h3>
                <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm text-slate-600">
                  {dashboard?.page_views_last_30_days.map((item) => (
                    <li key={`${item.date}-${item.page_path}`} className="flex justify-between gap-4">
                      <span>{item.date} · {item.page_path}</span>
                      <strong>{item.views}</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-bold text-slate-950">Contact leads</h2>
                <div className="mt-4 grid max-h-[34rem] gap-3 overflow-auto">
                  {leads.length === 0 && <p className="text-sm text-slate-500">No contact leads yet.</p>}
                  {leads.map((lead) => (
                    <article key={lead.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-bold text-slate-900">{lead.name}</p>
                      <a href={`mailto:${lead.email}`} className="mt-1 inline-block text-sm text-teal-800 underline underline-offset-4">
                        {lead.email}
                      </a>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{lead.message}</p>
                    </article>
                  ))}
                </div>
              </section>
              </div>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                {!selectedApplication ? (
                  <p className="text-slate-500">Select an application to review it and manage the hiring process.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-950">{selectedApplication.full_name}</h2>
                        <a href={`mailto:${selectedApplication.email}`} className="mt-1 inline-block text-sm text-teal-800 underline underline-offset-4">
                          {selectedApplication.email}
                        </a>
                        <p className="mt-1 text-sm text-slate-600">{selectedApplication.phone}</p>
                      </div>
                      <button type="button" onClick={() => downloadResume(selectedApplication)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-800">
                        Download resume
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-slate-700"><strong>Experience:</strong> {selectedApplication.experience}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {selectedApplication.linkedin_url && <a className="font-semibold text-teal-800 underline underline-offset-4" href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                      {selectedApplication.github_url && <a className="font-semibold text-teal-800 underline underline-offset-4" href={selectedApplication.github_url} target="_blank" rel="noopener noreferrer">GitHub / portfolio</a>}
                    </div>
                    {selectedApplication.cover_note && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedApplication.cover_note}</p>}

                    <form onSubmit={saveApplication} className="mt-6 grid gap-4 border-t border-slate-100 pt-6">
                      <label className="text-sm font-semibold text-slate-700">
                        Hiring stage
                        <select value={stage} onChange={(event) => setStage(event.target.value)} className={`${inputClass} mt-2`}>
                          {dashboard?.hiring_stages.map((hiringStage) => <option key={hiringStage}>{hiringStage}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Exam / assessment link
                        <input type="url" value={assessmentUrl} onChange={(event) => setAssessmentUrl(event.target.value)} placeholder="https://…" className={`${inputClass} mt-2 font-normal`} />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Interview / exam time
                          <input type="datetime-local" value={interviewAt} onChange={(event) => setInterviewAt(event.target.value)} className={`${inputClass} mt-2 font-normal`} />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Meeting type / link
                          <input value={interviewType} onChange={(event) => setInterviewType(event.target.value)} maxLength={80} placeholder="Technical interview · Meet link" className={`${inputClass} mt-2 font-normal`} />
                        </label>
                      </div>
                      <label className="text-sm font-semibold text-slate-700">
                        Private admin notes
                        <textarea rows={4} maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} mt-2 resize-y font-normal`} />
                      </label>
                      <p className="text-xs text-slate-500">
                        Applicant emails are sent when their stage, assessment, or interview details change. Private notes are never shared.
                      </p>
                      <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                        {loading ? "Saving…" : "Save changes"}
                      </button>
                    </form>
                  </>
                )}
              </section>
            </div>
          </>
        )}
        {message && <p role="status" className="mt-5 text-sm font-medium text-teal-800">{message}</p>}
        {error && <p role="alert" className="mt-5 text-sm font-medium text-rose-700">{error}</p>}
      </div>
    </main>
  );
}
