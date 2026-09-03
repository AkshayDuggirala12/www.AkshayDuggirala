import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-6 border-b border-white/10">
      {/* Logo / Name */}
      <div className="text-sm md:text-base font-bold uppercase tracking-widest text-white">
        AKSHAY DUGGIRALA
      </div>

      {/* Links & Button */}
      <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
        <Link 
          href="https://github.com/AkshayDuggirala12" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-400 hover:text-white transition-colors hidden md:block"
        >
          GitHub
        </Link>
        <Link 
          href="https://www.linkedin.com/in/akshay-duggirala-051502248/" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-400 hover:text-white transition-colors hidden md:block"
        >
          LinkedIn
        </Link>
        
      </div>
    </nav>
  );
}