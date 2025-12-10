import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Atom, ChevronLeft, Github, Radio } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#dcdcd9] text-zinc-800 flex flex-col overflow-x-hidden relative selection:bg-amber-400 selection:text-zinc-900 font-sans">
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Retro Gradient Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f0f0eb_0%,#dcdcd9_100%)]"></div>
        
        {/* Abstract Atomic Shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vh] h-[60vh] bg-sky-200/40 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vh] h-[50vh] bg-amber-200/40 rounded-full blur-[80px] mix-blend-multiply"></div>
      </div>

      {/* Retro Header Bar */}
      <header className="relative z-20 w-full pt-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="
            bg-gradient-to-b from-white to-[#f0f0eb] 
            rounded-[2rem] 
            shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] 
            border border-[#d4d4d0]
            p-4 flex items-center justify-between
            relative overflow-hidden
          ">
            {/* Chrome Shine Effect */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent pointer-events-none"></div>

            <div 
              className="flex items-center gap-4 group cursor-pointer relative z-10" 
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="
                  w-14 h-14 rounded-full 
                  bg-gradient-to-br from-zinc-100 to-zinc-300 
                  border-[3px] border-white 
                  shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.1)] 
                  flex items-center justify-center
                  group-hover:scale-105 transition-transform duration-300
                ">
                  <Atom className="w-8 h-8 text-sky-600 animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-widest uppercase text-zinc-800 drop-shadow-sm">
                  未来的<span className="text-sky-600">工具箱</span>
                </h1>
                <div className="flex gap-1 mt-1">
                  <div className="h-1.5 w-8 bg-amber-400 rounded-full"></div>
                  <div className="h-1.5 w-4 bg-sky-400 rounded-full"></div>
                  <div className="h-1.5 w-2 bg-red-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {!isHome && (
              <button 
                onClick={() => navigate('/')}
                className="
                  relative z-10 flex items-center gap-2 px-6 py-2.5 
                  bg-[#e8e8e3] hover:bg-white 
                  rounded-full 
                  shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]
                  text-zinc-600 hover:text-sky-600 font-bold uppercase tracking-wider text-sm
                  transition-all duration-200 active:scale-95
                  border border-[#d4d4d0]
                "
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                <span>返回</span>
              </button>
            )}
            
            {/* Decorative Fins */}
            {isHome && (
              <div className="hidden md:flex items-center gap-2 mr-4 opacity-30">
                 <Radio className="w-6 h-6" />
                 <span className="font-mono text-xs">V.1.0.4 // 在线</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center mt-auto">
        <div className="max-w-md mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-300 -z-10"></div>
          <div className="bg-[#dcdcd9] inline-block px-4">
            <div className="flex flex-col items-center gap-2">
              <a 
                href="https://github.com/Future-R" 
                target="_blank" 
                rel="noopener noreferrer"
                className="
                  flex items-center gap-2 px-4 py-1.5 rounded-full
                  bg-zinc-800 text-zinc-200
                  hover:bg-sky-600 hover:text-white
                  transition-all duration-300
                  shadow-lg
                "
              >
                <Github className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest">FUTURE-R</span>
              </a>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">
                未来科技 © 2025
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;