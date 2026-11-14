import Link from "next/link";
import { ArrowUpRight, MapPin, Wifi } from "lucide-react";

const skills = ["React", "React Native", "FastAPI", "Python", "Backend APIs"];

export default function Careers() {
  return (
    <section
      id="careers"
      className="mx-auto w-full max-w-7xl border-t border-slate-200 py-16 md:py-20"
    >
      <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-7 sm:p-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              Freelance opportunity
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Software Engineer (Remote)
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              I’m looking for a freelance developer who can help build and improve web and mobile
              products. This role is available remotely.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-teal-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <Wifi size={16} className="text-teal-700" aria-hidden="true" />
              Work from home · Freelance
              <MapPin size={16} className="ml-2 text-teal-700" aria-hidden="true" />
              Open to remote applicants
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <Link
              href="/careers/apply"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-105"
            >
              Apply for this role <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/careers/portal"
              className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-teal-700"
            >
              Already applied? Check your application
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
