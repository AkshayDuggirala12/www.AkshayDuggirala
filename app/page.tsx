import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Education from "../components/Education";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Connect from "../components/Connect";
import Journey from "../components/Journey";
import Careers from "../components/Careers";
import TrustBar from "../components/TrustBar";
export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 pb-16 md:px-10 lg:px-16 xl:px-24">
      <Navbar />

      <Hero />
      <TrustBar />
      <About />
      <Experience />
      <Projects />
      <Careers />
      <Journey />
      <Education />
      <Connect />

      <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
          <p>© {new Date().getFullYear()} Akshay Duggirala</p>
          <p>Building thoughtfully, one step at a time.</p>
        </div>
      </footer>
    </main>
  );
}