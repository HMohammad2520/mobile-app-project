import React from 'react';

const AboutDeveloper: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-2xl mx-auto bg-zinc-900 border-4 border-green-700 rounded-lg p-8 font-mono relative overflow-hidden shadow-[0_0_20px_rgba(0,255,0,0.2)]">
      
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[linear-gradient(0deg,transparent_24%,rgba(34,197,94,1)_25%,rgba(34,197,94,1)_26%,transparent_27%,transparent_74%,rgba(34,197,94,1)_75%,rgba(34,197,94,1)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(34,197,94,1)_25%,rgba(34,197,94,1)_26%,transparent_27%,transparent_74%,rgba(34,197,94,1)_75%,rgba(34,197,94,1)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
      </div>

      <div className="z-10 text-center space-y-6 w-full">
        <div className="w-24 h-24 mx-auto bg-green-800 rounded-full flex items-center justify-center border-4 border-green-500 shadow-xl mb-4 animate-pulse">
          <i className="fas fa-code text-5xl text-white"></i>
        </div>

        <h2 className="text-4xl text-green-400 font-bold mb-2 uppercase tracking-widest drop-shadow-md">
          PROGRAMMERS
        </h2>
        <h3 className="text-xl text-green-600 font-bold mb-4 dir-rtl">برنامه نویسان</h3>

        <div className="bg-black/50 p-6 rounded-lg border border-green-600/50 backdrop-blur-sm transform transition hover:scale-105 duration-300">
          <p className="text-zinc-400 text-sm mb-4 uppercase tracking-wider">Alfa Cyber Security Group</p>
          <div className="space-y-2 text-right dir-rtl">
             <p className="text-xl text-white font-bold">نیماماهرخامنه</p>
             <p className="text-xl text-white font-bold">محمد حیدری</p>
             <p className="text-xl text-white font-bold">سروش بهمنی</p>
             <p className="text-xl text-white font-bold">علی مالمیر</p>
          </div>
        </div>

        <div className="bg-black/50 p-6 rounded-lg border border-green-600/50 backdrop-blur-sm transform transition hover:scale-105 duration-300">
          <p className="text-zinc-400 text-sm mb-2 uppercase tracking-wider">Contact</p>
          <div className="flex flex-col items-center gap-2">
             <div className="flex items-center gap-2">
                <i className="fas fa-envelope text-green-400"></i>
                <a href="mailto:lfcbrscrt@gmail.com" className="text-lg text-white hover:text-green-300">lfcbrscrt@gmail.com</a>
             </div>
             <div className="flex items-center gap-2">
                <i className="fas fa-phone text-green-400"></i>
                <a href="tel:09038907869" className="text-lg text-white font-bold hover:text-green-300">09038907869</a>
             </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-zinc-600">
           © 2025 AIR ALFA PROJECT
        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;