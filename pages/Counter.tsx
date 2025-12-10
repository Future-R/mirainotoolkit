import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

const Counter: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [isPressed, setIsPressed] = useState(false);

  // Sound effect generator
  const playClick = useCallback((type: 'tick' | 'reset') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  }, []);

  const handleIncrement = () => {
    setCount(c => c + 1);
    setIsPressed(true);
    playClick('tick');
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setIsPressed(false), 150);
  };

  const handleReset = () => {
    setCount(0);
    playClick('reset');
    if (navigator.vibrate) navigator.vibrate(30);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleIncrement();
      }
      if (e.code === 'Backspace' || e.code === 'Escape') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playClick]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full animate-in fade-in duration-500">
      
      {/* Device Container */}
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-zinc-200 relative overflow-hidden">
        
        {/* Decorative screws */}
        <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center">
          <div className="w-full h-[1px] bg-zinc-400 transform rotate-45"></div>
        </div>
        <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center">
          <div className="w-full h-[1px] bg-zinc-400 transform rotate-45"></div>
        </div>
        <div className="absolute bottom-6 left-6 w-3 h-3 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center">
          <div className="w-full h-[1px] bg-zinc-400 transform rotate-45"></div>
        </div>
        <div className="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center">
          <div className="w-full h-[1px] bg-zinc-400 transform rotate-45"></div>
        </div>

        {/* Display Screen */}
        <div className="mb-10 relative">
          <div className="bg-[#F5F5F0] border-2 border-zinc-200 rounded-2xl p-8 pt-10 pb-6 text-center shadow-inner relative overflow-hidden">
             {/* Screen Glare */}
            <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
            
            <p className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[0.3em] text-zinc-400 uppercase">
              当前计数
            </p>
            
            <span className="block text-9xl font-mono font-bold text-zinc-800 tracking-tighter tabular-nums leading-none drop-shadow-sm select-none">
              {count.toString().padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8">
          
          {/* Main Button */}
          <div className="relative">
             {/* Button Shadow/Depth */}
            <div className={`
              absolute inset-0 rounded-full bg-red-700 blur-[1px] transform translate-y-2
              transition-all duration-100
              ${isPressed ? 'translate-y-1' : 'translate-y-2'}
            `}></div>

            <button
              onClick={handleIncrement}
              className={`
                relative w-32 h-32 rounded-full 
                bg-gradient-to-b from-red-500 to-red-600
                border-[4px] border-zinc-100 ring-1 ring-zinc-300
                flex items-center justify-center
                shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.1)]
                active:scale-[0.98] active:translate-y-1
                transition-all duration-100 ease-out
                outline-none
                group
              `}
            >
              <div className="text-red-100 opacity-90 font-bold text-4xl select-none group-hover:scale-110 transition-transform">
                +
              </div>
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="
              flex items-center gap-2 px-6 py-3 rounded-full 
              bg-zinc-100 border border-zinc-200 
              text-zinc-500 hover:text-red-600 hover:border-red-300 hover:bg-white
              transition-all duration-300
              uppercase font-bold text-xs tracking-widest
              outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2
            "
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置</span>
          </button>

        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-8 text-center opacity-60">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          按 [空格] 计数 • 按 [Esc] 重置
        </p>
      </div>
    </div>
  );
};

export default Counter;