"use client";

import { motion } from "framer-motion";

const milestones = [
  {
    year: "2021 - 2023",
    title: "The Foundation & The Struggle",
    paragraph: <>My journey started at K L University with a bold decision from my parents, a laptop, and a lot of nerves. During my first year, I found my voice and the confidence to interact with people. I dove deep into core subjects—grappling with how servers, networks, and databases actually work under the hood. Ultimately, I survived a steep AWS learning curve and a solo trip that truly tested my limits.</>
  },
  {
    year: "The Turning Point",
    title: "Discipline, Iron & Code",
    paragraph: <>During my B.Tech, I was struggling with my health and weighed over 130 kgs. I turned to the gym, which taught me the true meaning of discipline and consistency. I lost nearly 50 kgs, currently standing at 94 kgs with a 92 body score and 77 kgs of fat-free muscle mass. To keep myself on track, I combined my engineering skills with my fitness goals and built <a href="#projects" className="text-blue-400 font-bold hover:text-purple-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Akshay Gym</a>, a custom platform to track my workout and diet plans.</>
  },
  {
    year: "2024 - 2025",
    title: "Real-World Experience",
    paragraph: <>I faced multiple rejections in CRT classes, but I kept pushing until I landed a placement at Wipro Elite. To accelerate my growth, I took on remote freelance work under a senior mentor. This trial by fire helped me master the full stack in real-time, handling backend APIs, UI, deployment, Git, and Jira. Through this hustle, I successfully built and shipped a one-year SaaS project in just 11 months.</>
  },
  {
    year: "2026 - Present",
    title: "Bug Squashing & Bigger Vision",
    paragraph: <>Traveling to Hyderabad to test my skills, I dove right into existing codebases at Lunovian Technologies. There, I squashed critical bugs—from 120Hz unlock issues to tricky backend 401 errors. Currently, I am building a full web platform for a new client while awaiting my Wipro onboarding, and quietly developing two independent applications aimed at solving real societal problems.</>
  }
];

export default function Journey() {
  return (
    <section id="journey" className="w-full py-24 border-t border-white/5 relative">
      <div className="flex flex-col md:flex-row gap-16 relative">
        
        {/* Left Side: Sticky Title Area */}
        <div className="w-full md:w-1/3 md:sticky top-32 h-max flex flex-col gap-4">
          {/* Abstract Glowing Orb */}
          <div className="hidden md:block w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl absolute -z-10 -top-10 -left-10" />
          
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
            STORY
          </h2>
          <p className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            My <br className="hidden md:block" /> Journey.
          </p>
        </div>

        {/* Right Side: The Narrative Book Flow */}
        <div className="w-full md:w-2/3 flex flex-col gap-16">
          {milestones.map((milestone, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex flex-col gap-1">
                <h3 className="text-3xl font-bold text-white">
                  {milestone.title}
                </h3>
                <span className="text-sm font-semibold tracking-widest text-gray-500 uppercase mt-1">
                  {milestone.year}
                </span>
              </div>

              {/* Prose / Story Text */}
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed md:leading-loose max-w-3xl">
                {milestone.paragraph}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}