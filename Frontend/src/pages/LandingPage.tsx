import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { SignInButton } from '@clerk/clerk-react';
import { Terminal, Code2, Zap, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const blobRef1 = useRef<HTMLDivElement>(null);
  const blobRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Staggered text entrance
    const timeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    if (titleRef.current && subtitleRef.current && ctaRef.current) {
      timeline
        .add({
          targets: titleRef.current,
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 1200,
          delay: 200,
        })
        .add(
          {
            targets: subtitleRef.current,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 1000,
          },
          '-=800'
        )
        .add(
          {
            targets: ctaRef.current,
            opacity: [0, 1],
            translateY: [15, 0],
            duration: 800,
          },
          '-=600'
        );
    }

    // Grid items animation
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.feature-card');
      timeline.add(
        {
          targets: cards,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 800,
          delay: anime.stagger(150),
        },
        '-=600'
      );
    }

    // Background Blobs Floating Animation
    anime({
      targets: blobRef1.current,
      translateX: () => anime.random(-50, 50),
      translateY: () => anime.random(-50, 50),
      scale: () => anime.random(1, 1.2),
      duration: 5000,
      easing: 'easeInOutQuad',
      direction: 'alternate',
      loop: true,
    });

    anime({
      targets: blobRef2.current,
      translateX: () => anime.random(-50, 50),
      translateY: () => anime.random(-50, 50),
      scale: () => anime.random(1, 1.2),
      duration: 6000,
      easing: 'easeInOutQuad',
      direction: 'alternate',
      loop: true,
    });
  }, []);

  // Hover animation for feature cards
  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    anime({
      targets: e.currentTarget,
      translateY: -5,
      scale: 1.02,
      boxShadow: '0 10px 30px -10px rgba(59, 130, 246, 0.3)',
      duration: 300,
      easing: 'easeOutQuad',
    });
  };

  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    anime({
      targets: e.currentTarget,
      translateY: 0,
      scale: 1,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      duration: 400,
      easing: 'easeOutQuad',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Animated Blobs */}
      <div
        ref={blobRef1}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"
      />
      <div
        ref={blobRef2}
        className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"
      />

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Pycord
          </span>
        </div>
        <div>
          <SignInButton mode="modal">
            <button className="text-gray-300 hover:text-white font-medium px-4 py-2 transition-colors">
              Log In
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 lg:pt-32 flex flex-col items-center text-center">
        <div className="max-w-4xl">
          <h1
            ref={titleRef}
            className="text-5xl md:text-7xl font-extrabold tracking-tight opacity-0 leading-[1.1]"
          >
            Realtime chat & code <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">
              without the friction.
            </span>
          </h1>
          
          <p
            ref={subtitleRef}
            className="mt-8 text-xl text-gray-400 max-w-2xl mx-auto opacity-0"
          >
            A lightweight alternative to Discord focused purely on fast room creation and seamless code sharing among friends.
          </p>
          
          <div ref={ctaRef} className="mt-10 flex gap-4 justify-center opacity-0">
            <SignInButton mode="modal">
              <button className="group relative px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg overflow-hidden transition-transform hover:scale-105">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  Get Started <Zap className="w-4 h-4" />
                </span>
              </button>
            </SignInButton>
          </div>
        </div>

        {/* Features Grid */}
        <div ref={gridRef} className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          <div 
            className="feature-card bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm opacity-0 cursor-default"
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Instant Rooms</h3>
            <p className="text-gray-400 leading-relaxed">No servers, no roles, no clutter. Generate a unique code and invite friends instantly.</p>
          </div>

          <div 
            className="feature-card bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm opacity-0 cursor-default"
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
              <Code2 className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Native Code Sharing</h3>
            <p className="text-gray-400 leading-relaxed">Built for developers. Share blocks of code with perfect syntax highlighting natively.</p>
          </div>

          <div 
            className="feature-card bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm opacity-0 cursor-default"
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Realtime Sync</h3>
            <p className="text-gray-400 leading-relaxed">Zero latency communication powered by WebSockets for an uninterrupted experience.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Pycord. Designed for friends.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
