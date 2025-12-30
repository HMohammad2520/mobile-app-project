import React, { useEffect, useState } from 'react';
import { audioController } from '../services/audio';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Step 1: Jet Flyby Animation
    const t1 = setTimeout(() => setAnimationStep(1), 500);
    // Step 2: Show Title
    const t2 = setTimeout(() => setAnimationStep(2), 2500);
    // Step 3: Show Button
    const t3 = setTimeout(() => setAnimationStep(3), 4000);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleStart = () => {
    // User gesture required to start AudioContext
    audioController.init();
    audioController.playShoot(); // Confirmation sound
    onComplete();
  };

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPrompt(null);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden font-mono text-green-500 select-none">
      
      {/* Background Matrix-like grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      {/* 1. Flyby Jet Animation */}
      <div className={`absolute top-1/2 left-[-100px] transform -translate-y-1/2 transition-transform duration-[2000ms] ease-in-out z-10 ${animationStep >= 1 ? 'translate-x-[150vw]' : 'translate-x-0'}`}>
          <div className="relative">
              {/* Afterburner Trail */}
              <div className="absolute top-1/2 right-full w-[300px] h-2 bg-gradient-to-l from-white via-transparent to-transparent opacity-50 blur-sm"></div>
              <i className="fas fa-fighter-jet text-8xl text-zinc-300 transform rotate-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"></i>
          </div>
      </div>

      {/* 2. Text Reveal */}
      <div className={`z-20 text-center transition-all duration-1000 ${animationStep >= 2 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-sm'}`}>
          <div className="mb-6 animate-pulse">
              <i className="fas fa-shield-alt text-6xl drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"></i>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-widest mb-2" style={{ textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>
              ALFA CYBER
          </h1>
          <div className="h-1 w-full bg-green-600 mb-2 shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
          <h2 className="text-xl md:text-3xl font-bold tracking-[0.5em] text-green-400">
              SECURITY GROUP
          </h2>
      </div>

      {/* 3. Start Button & Install Button */}
      <div className={`absolute bottom-20 flex flex-col items-center gap-4 transition-all duration-1000 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button 
              onClick={handleStart}
              className="group relative px-10 py-4 bg-transparent border-2 border-green-500 text-green-400 font-bold text-xl uppercase tracking-widest hover:text-black overflow-hidden transition-colors duration-300"
          >
              <span className="relative z-10 flex items-center gap-3">
                  <i className="fas fa-power-off"></i>
                  INITIALIZE SYSTEM
              </span>
              <div className="absolute inset-0 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out -z-0"></div>
          </button>

          {/* Install Button - Only shows if supported */}
          {installPrompt && (
             <button 
                onClick={handleInstall}
                className="text-sm text-green-600 hover:text-green-400 underline animate-bounce mt-2"
             >
                <i className="fas fa-download mr-2"></i>
                نصب خودکار بازی (Install App)
             </button>
          )}

          <div className="text-center mt-2 text-xs text-zinc-600 animate-pulse">
              WAITING FOR USER INPUT...
          </div>
      </div>

    </div>
  );
};

export default IntroScreen;