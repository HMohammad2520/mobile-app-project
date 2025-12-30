import React, { useState, useRef, useEffect } from 'react';
import { connectToCoPilot } from '../services/gemini';

const AICoPilot: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("SYSTEM OFFLINE");
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To hold the session promise/object if needed for cleaning
  const closeRef = useRef<() => void>(() => {});

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const handleAudioData = async (base64: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Simulate volume meter
    setVolume(Math.random() * 100);
    setTimeout(() => setVolume(0), 200);

    const buffer = await decodeAudioData(base64, ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const now = ctx.currentTime;
    // Schedule seamlessly
    const start = Math.max(now, nextStartTimeRef.current);
    source.start(start);
    nextStartTimeRef.current = start + buffer.duration;
  };

  const toggleConnection = async () => {
    if (isConnected) {
      closeRef.current();
      setIsConnected(false);
      setStatus("DISCONNECTED");
      return;
    }

    try {
      setStatus("INITIALIZING UPLINK...");
      initAudio();
      
      // Capture mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      
      const sessionPromise = connectToCoPilot(handleAudioData, () => {
          console.log("Session closed");
          setIsConnected(false);
          setStatus("LINK LOST");
          stream.getTracks().forEach(t => t.stop());
          processor.disconnect();
          source.disconnect();
          ctx.close();
      });

      // Send audio input
      processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i=0; i<l; i++) int16[i] = inputData[i] * 32768;
          
          // Basic base64 encode for PCM 16-bit
          let binary = '';
          const bytes = new Uint8Array(int16.buffer);
          for(let i=0; i<bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const base64 = btoa(binary);

          sessionPromise.then(session => {
             session.sendRealtimeInput({
                 media: {
                     mimeType: 'audio/pcm;rate=16000',
                     data: base64
                 }
             });
          });
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      
      closeRef.current = () => {
          sessionPromise.then(s => s.close());
      };

      setIsConnected(true);
      setStatus("CO-PILOT ONLINE");

    } catch (e) {
      console.error(e);
      setStatus("CONNECTION FAILED");
      setIsConnected(false);
    }
  };

  return (
    <div className="bg-zinc-800 p-4 rounded-lg border-2 border-green-700 w-full max-w-md mx-auto mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-green-400 font-mono text-xl"><i className="fas fa-headset mr-2"></i>TACTICAL CO-PILOT</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="bg-black p-4 rounded mb-4 font-mono h-24 flex flex-col items-center justify-center border border-green-900 relative overflow-hidden">
         <p className="text-green-500 z-10">{status}</p>
         {/* Audio Viz */}
         <div className="absolute bottom-0 left-0 w-full h-1 bg-green-900/50">
            <div className="h-full bg-green-400 transition-all duration-75" style={{ width: `${volume}%` }}></div>
         </div>
      </div>

      <button 
        onClick={toggleConnection}
        className={`w-full py-3 font-bold rounded tracking-wider ${isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}
      >
        {isConnected ? 'TERMINATE UPLINK' : 'ESTABLISH LINK'}
      </button>
      <p className="text-xs text-zinc-500 mt-2 text-center">Powered by Gemini 2.5 Native Audio</p>
    </div>
  );
};

export default AICoPilot;