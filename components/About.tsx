"use client";

import Image from "next/image";
import { TypeAnimation } from "react-type-animation";

export default function About() {
  return (
    <section id="about" className="w-full min-h-screen py-24 flex flex-col md:flex-row items-center justify-between gap-12 border-t border-white/5">
      
      {/* Left Side: Text & Typing Animation */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-gray-500">
          01. About Me
        </h2>
        
        {/* The Typing Animation */}
        <div className="text-2xl md:text-4xl font-bold text-white h-20 md:h-24">
          <TypeAnimation
            sequence={[
              "I build scalable backends. using fastapi, nodejs, and django.",
              1500,
              "I craft modern React frontends. still learning nextjs and tailwindcss.",
              1500,
              "learning 3d animations for web and mobile. using threejs and react-three-fiber.",
              1500,
              "using tresding ai agent to automate tasks. and build ai powered applications.",
              1500,
              "I solve real business problems. with smart solutions. using scalable architectures.",
              1500,
              "I am a learning devops engineer. using docker, kubernetes, and ci/cd pipelines.",
              1500,
              "bring my own ideas for exsting business problems. and build innovative solutions. coming soon.",
            ]}
            wrapper="span"
            speed={50}
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
            repeat={Infinity}
          />
        </div>

        {/* Your About Me Paragraph */}
        <p className="text-gray-400 text-lg leading-relaxed">
          I'm a full-stack and Android developer fresh out of KL University.
           I focus on building real-world web apps, clean APIs, and mobile platforms. 
           Right now, I'm leveling up my UI design, exploring AI workflows, and learning 3D web animations.
        </p>
      </div>

      {/* Right Side: Your Latest Image */}
      <div className="w-full md:w-1/2 flex justify-center md:justify-end">
        <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {/* Make sure your image in the public folder is named profile.jpg */}
          <Image 
            src="/profile.jpg" 
            alt="Akshay Duggirala" 
            fill 
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

    </section>
  );
}