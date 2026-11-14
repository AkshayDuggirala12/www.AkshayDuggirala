import Link from "next/link";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#products", label: "Products" },
  { href: "#careers", label: "Careers" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-20 -mx-6 border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-xl md:-mx-10 md:px-10 lg:-mx-16 lg:px-16 xl:-mx-24 xl:px-24">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 py-4">
        <Link href="#" className="group flex items-center gap-3" aria-label="Akshay Duggirala home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-sm font-black text-white shadow-sm transition group-hover:scale-105">
            AD
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-bold tracking-wide text-slate-950">AKSHAY DUGGIRALA</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Engineer &amp; product builder
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-700">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="transition-colors hover:text-teal-700">
              {label}
            </Link>
          ))}
          <Link
            href="#connect"
            className="rounded-full bg-gradient-to-r from-teal-500 to-sky-600 px-5 py-2.5 text-white shadow-sm transition hover:brightness-105"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
