import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-white/10 py-5 md:py-6">
      <Link href="#" className="group flex items-center gap-3" aria-label="Akshay Duggirala home">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-300 text-sm font-black text-slate-950 transition group-hover:bg-blue-200">
          AD
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-bold tracking-wide text-white">AKSHAY DUGGIRALA</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Engineer &amp; product builder
          </span>
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-300">
        <Link href="#about" className="transition-colors hover:text-white">
          About
        </Link>
        <Link href="#experience" className="transition-colors hover:text-white">
          Work
        </Link>
        <Link href="#product" className="transition-colors hover:text-white">
          Product
        </Link>
        <Link href="#connect" className="transition-colors hover:text-white">
          Contact
        </Link>
        <Link
          href="https://www.linkedin.com/in/akshay-duggirala-051502248/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-blue-300 hover:text-blue-200"
        >
          LinkedIn
        </Link>
      </div>
    </nav>
  );
}