import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Education from "../components/Education";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Connect from "../components/Connect";
import Journey from "../components/Journey";
export default function Home() {
  return (
    <main className="min-h-screen px-6 md:px-10 lg:px-16 xl:px-24 pb-24">
      <Navbar />

      <Hero />
      <About />
      <Experience />
      <Projects />
      <Journey />
      <Education />
      <Connect />

      <footer className="border-t border-white/10 py-8 text-sm text-slate-500">
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <p>© {new Date().getFullYear()} Akshay Duggirala</p>
          <p>Building thoughtfully, one step at a time.</p>
        </div>
      </footer>
    </main>
  );
}