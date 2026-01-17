'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, ArrowUpRight, Play, Star, 
  Zap, Code, PenTool, Globe, Music 
} from 'lucide-react';

// --- Types ---
interface SearchResult {
  id: string;
  type: 'course' | 'teacher' | 'event';
  title: string;
  subtitle: string;
  image: string;
  video?: string; // Auto-play on hover
  tags: string[];
  size: 'small' | 'medium' | 'large' | 'wide'; // For Bento Grid
  stats?: string;
}

// --- Mock Data (Editions Style) ---
const RESULTS: SearchResult[] = [
  {
    id: '1',
    type: 'teacher',
    title: 'Sarah Jenkins',
    subtitle: 'Ex-Google Python Expert',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    tags: ['Development', 'Python'],
    size: 'large',
    stats: '4.9 ★',
  },
  {
    id: '2',
    type: 'course',
    title: 'React 2026',
    subtitle: 'The Complete Guide to Server Components',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    video: 'https://pw-assets-production-c.squarecdn.com/video/5mObdhW0r5D0lyp3iVJFA6/b4d81931-7cfa-4402-bb41-efc4126e3f95-en-ee526a6b-3ca3-4ae5-9bc2-be60cb21229f-en-Homepage_Edit-updated.webm',
    tags: ['Coding', 'New'],
    size: 'wide',
    stats: '2k Students',
  },
  {
    id: '3',
    type: 'event',
    title: 'Design Systems',
    subtitle: 'Live Workshop with Figma Team',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    tags: ['Design', 'Live'],
    size: 'medium',
    stats: 'Tomorrow',
  },
  {
    id: '4',
    type: 'teacher',
    title: 'Alex Rivera',
    subtitle: 'Guitar for Beginners',
    image: 'https://images.unsplash.com/photo-1549488398-6f588523a229?auto=format&fit=crop&q=80&w=800',
    tags: ['Music'],
    size: 'small',
  },
  {
    id: '5',
    type: 'course',
    title: 'AI Engineering',
    subtitle: 'Build LLMs from Scratch',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
    tags: ['AI', 'Trending'],
    size: 'medium',
    stats: 'Best Seller',
  },
  {
    id: '6',
    type: 'event',
    title: 'Startup Pitch',
    subtitle: 'Weekly Founder Meetup',
    image: 'https://images.unsplash.com/photo-1559136555-930d72f1d37a?auto=format&fit=crop&q=80&w=800',
    tags: ['Business'],
    size: 'wide',
    stats: 'Free',
  },
  {
    id: '7',
    type: 'teacher',
    title: 'Elena Wu',
    subtitle: 'Mandarin Chinese',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    tags: ['Language'],
    size: 'small',
  },
];

const CATEGORIES = [
  { name: 'All', icon: <Zap size={16} /> },
  { name: 'Development', icon: <Code size={16} /> },
  { name: 'Design', icon: <PenTool size={16} /> },
  { name: 'Language', icon: <Globe size={16} /> },
  { name: 'Music', icon: <Music size={16} /> },
];

export default function EditionsSearch() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tilt effect logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (max 5 degrees)
    const rotateX = ((y - rect.height/2) / rect.height) * -5;
    const rotateY = ((x - rect.width/2) / rect.width) * 5;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    
    // Update gradient glow position
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const resetCard = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* --- 1. Cosmic Background Effects --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      {/* --- 2. Floating Header --- */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrollY > 50 
            ? 'bg-[#050505]/80 backdrop-blur-xl border-white/10 py-4' 
            : 'bg-transparent border-transparent py-8'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="font-bold text-2xl tracking-tighter flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full"></div>
            SkillSetu <span className="text-gray-500 font-normal">Editions</span>
          </Link>
          
          {/* Main Search Bar (Moves based on scroll) */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 w-full max-w-xl ${
              scrollY > 50 ? 'top-1/2 -translate-y-1/2 opacity-100 pointer-events-auto' : 'top-20 opacity-0 pointer-events-none'
            }`}
          >
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search for skills, teachers, or events..." 
                className="w-full bg-white/5 border border-white/10 rounded-full px-12 py-3 text-sm focus:bg-white/10 focus:border-white/30 outline-none transition-all placeholder:text-gray-500 text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>

          <button className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
            Sign In
          </button>
        </div>
      </header>

      {/* --- 3. Hero Search Section --- */}
      <main className="relative z-10 pt-40 pb-20 px-6 md:px-12 max-w-[1600px] mx-auto">
        
        {/* Large Search Input (Fades out on scroll) */}
        <div 
          className="max-w-4xl mx-auto text-center mb-24 transition-opacity duration-300"
          style={{ opacity: Math.max(0, 1 - scrollY / 200), pointerEvents: scrollY > 100 ? 'none' : 'auto' }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-12 tracking-tight leading-[0.9]">
            Discover <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">Knowledge.</span>
          </h1>
          <div className="relative group max-w-2xl mx-auto">
             <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
             <div className="relative flex items-center bg-[#0a0a0a] rounded-full border border-white/10 p-2">
               <Search className="ml-4 text-gray-400" size={24} />
               <input 
                 type="text"
                 className="w-full bg-transparent border-none outline-none text-xl px-4 py-3 text-white placeholder:text-gray-600 font-medium"
                 placeholder="What do you want to master?"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 autoFocus
               />
               <button className="bg-white text-black rounded-full px-8 py-3 font-bold hover:bg-gray-200 transition-colors">
                 Search
               </button>
             </div>
          </div>
        </div>

        {/* --- 4. Sticky Filter Bar --- */}
        <div className="sticky top-24 z-30 mb-12 flex justify-center">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-2 rounded-full flex gap-2 shadow-2xl overflow-x-auto max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                  activeCategory === cat.name 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- 5. The Bento Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[300px] gap-6">
          {RESULTS.map((item, idx) => (
            <div
              key={item.id}
              className={`
                group relative bg-[#111] border border-white/5 rounded-3xl overflow-hidden cursor-pointer transition-all duration-100 ease-out
                ${item.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
                ${item.size === 'wide' ? 'md:col-span-2' : ''}
                ${item.size === 'medium' ? 'md:row-span-1' : ''}
              `}
              onMouseMove={(e) => handleMouseMove(e, item.id)}
              onMouseLeave={(e) => {
                resetCard(e);
                setHoveredCard(null);
              }}
              onMouseEnter={() => setHoveredCard(item.id)}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Glow Effect Layer */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                style={{
                  background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)`
                }}
              />

              {/* Media Background */}
              <div className="absolute inset-0 z-0">
                 {/* If it has video and is hovered, show video. Else show image */}
                 {item.video && hoveredCard === item.id ? (
                   <video 
                     src={item.video} 
                     autoPlay 
                     muted 
                     loop 
                     className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                   />
                 ) : (
                   <img 
                     src={item.image} 
                     alt={item.title} 
                     className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                   />
                 )}
                 {/* Dark Gradient Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              </div>

              {/* Content Layer (3D Lift) */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-end z-10"
                style={{ transform: 'translateZ(20px)' }}
              >
                {/* Top Tags */}
                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white/90">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Main Text */}
                <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className={`font-bold leading-tight text-white ${item.size === 'large' ? 'text-4xl' : 'text-2xl'}`}>
                      {item.title}
                    </h3>
                    {item.stats && (
                       <span className="text-yellow-400 font-mono font-bold bg-black/50 backdrop-blur px-2 py-1 rounded-md border border-white/10">
                         {item.stats}
                       </span>
                    )}
                  </div>
                  <p className="text-gray-400 font-medium text-lg line-clamp-2 mb-4 group-hover:text-gray-200 transition-colors">
                    {item.subtitle}
                  </p>
                  
                  {/* Action Button (Visible on Hover) */}
                  <div className="h-0 overflow-hidden group-hover:h-12 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <button className="flex items-center gap-2 text-white font-bold hover:gap-4 transition-all">
                      {item.type === 'teacher' ? 'View Profile' : 'Start Learning'} <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- 6. Load More / Infinite Scroll Trigger --- */}
        <div className="mt-24 text-center">
           <div className="inline-block relative">
             <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
             <button className="relative px-10 py-4 bg-[#111] border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/30 transition-all font-bold tracking-widest uppercase text-xs">
               Load More Editions
             </button>
           </div>
        </div>

      </main>

      {/* --- Footer (Simple) --- */}
      <footer className="border-t border-white/5 py-12 text-center text-gray-600 text-sm">
        <p>© 2026 SkillSetu Editions. Crafted for mastery.</p>
      </footer>
    </div>
  );
}