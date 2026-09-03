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

      {/* Page 1: Hero */}
      <Hero />

      {/* Page 2: About Me */}
      <About />
      <Education />
      <Journey />
      <Experience />
      <Projects />
      
      <Connect />
    </main>
  );
}