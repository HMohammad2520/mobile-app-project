import React, { useState } from 'react';
import GameEngine from './components/GameEngine';
import AICoPilot from './components/AICoPilot';
import Studio from './components/Studio';
import StrategyCenter from './components/StrategyCenter';
import AboutDeveloper from './components/AboutDeveloper';
import IntroScreen from './components/IntroScreen';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GAME);
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
      return <IntroScreen onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 animate-fadeIn">
      <header className="bg-black/90 border-b border-zinc-700 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl text-green-500 font-bold tracking-widest uppercase drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                <i className="fas fa-fighter-jet mr-2"></i>AIR ALFA
            </h1>
            <div className="text-xs text-zinc-500 hidden md:block font-mono">GEMINI SYSTEM v2.5</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-2 md:p-4 flex flex-col items-center w-full">
        {mode === AppMode.GAME && (
            <div className="w-full flex flex-col items-center">
                <GameEngine onGameOver={(score) => console.log('Game Over', score)} />
            </div>
        )}
        
        {mode === AppMode.COPILOT && <AICoPilot />}
        {mode === AppMode.STUDIO && <Studio />}
        {mode === AppMode.STRATEGY && <StrategyCenter />}
        {mode === AppMode.ABOUT && <AboutDeveloper />}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-black/90 border-t border-zinc-700 p-2 z-50 backdrop-blur-lg">
        <div className="max-w-xl mx-auto flex justify-around">
            <NavBtn icon="fa-gamepad" label="GAME" active={mode === AppMode.GAME} onClick={() => setMode(AppMode.GAME)} />
            <NavBtn icon="fa-headset" label="CO-PILOT" active={mode === AppMode.COPILOT} onClick={() => setMode(AppMode.COPILOT)} />
            <NavBtn icon="fa-photo-video" label="STUDIO" active={mode === AppMode.STUDIO} onClick={() => setMode(AppMode.STUDIO)} />
            <NavBtn icon="fa-book" label="INTEL" active={mode === AppMode.STRATEGY} onClick={() => setMode(AppMode.STRATEGY)} />
            <NavBtn icon="fa-users" label="PROGRAMMERS" active={mode === AppMode.ABOUT} onClick={() => setMode(AppMode.ABOUT)} />
        </div>
      </nav>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 1s ease-out; }
      `}</style>
    </div>
  );
};

const NavBtn: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center p-2 rounded w-16 md:w-20 transition-all ${active ? 'text-green-400 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
        <i className={`fas ${icon} text-lg md:text-xl mb-1`}></i>
        <span className="text-[9px] md:text-[10px] font-mono font-bold">{label}</span>
    </button>
);

export default App;