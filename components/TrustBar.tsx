import { ArrowUpRight, BriefcaseBusiness, Globe2, Smartphone } from "lucide-react";

const relationships = [
  {
    name: "Elyon Prefab",
    detail: "Website project",
    href: "https://elyonprefab.com/",
    icon: Globe2,
  },
  {
    name: "Vivid Minds",
    detail: "Product engineering experience",
    href: "https://vividminds.ai/",
    icon: BriefcaseBusiness,
  },
  {
    name: "RBCM · StarFreight",
    detail: "Web, FastAPI & Android app for a US-based client",
    href: "https://www.rbcm.us/",
    icon: Smartphone,
    clientProfile: "https://www.linkedin.com/in/ravi-teja-pavuluri-420aa675/",
  },
];

function RelationshipCard({
  relationship,
  interactive = true,
}: {
  relationship: (typeof relationships)[number];
  interactive?: boolean;
}) {
  const Icon = relationship.icon;

  return (
    <article className="flex w-[min(82vw,25rem)] shrink-0 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-teal-300 hover:shadow-sm sm:w-[25rem]">
      <a
        href={relationship.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={interactive ? 0 : -1}
        className="group flex min-w-0 flex-1 items-center gap-4"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-sky-50 text-teal-700">
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold text-slate-900">{relationship.name}</span>
          <span className="mt-0.5 text-sm text-slate-500">{relationship.detail}</span>
        </span>
        <ArrowUpRight
          size={18}
          aria-hidden="true"
          className="shrink-0 text-slate-400 transition group-hover:text-teal-700"
        />
      </a>
      {"clientProfile" in relationship && relationship.clientProfile && (
        <a
          href={relationship.clientProfile}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={interactive ? 0 : -1}
          className="shrink-0 text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-teal-700"
        >
          Client profile
        </a>
      )}
    </article>
  );
}

export default function TrustBar() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="overflow-hidden border-b border-slate-100 bg-white py-10"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <h2
          id="trust-heading"
          className="text-center text-lg font-semibold tracking-tight text-slate-700"
        >
          Trusted by teams
        </h2>
      </div>
      <div className="trust-marquee mt-6">
        <div className="trust-marquee__track">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="trust-marquee__group"
              aria-hidden={group === 1}
            >
              {relationships.map((relationship) => (
                <RelationshipCard
                  key={`${group}-${relationship.name}`}
                  relationship={relationship}
                  interactive={group === 0}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
