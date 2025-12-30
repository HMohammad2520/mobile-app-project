import React, { useState } from 'react';
import { generateGameAsset, generateVideo } from '../services/gemini';
import { AspectRatio } from '../types';

const Studio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [status, setStatus] = useState('');

  const checkVeoKey = async () => {
    // Check for Veo Key requirement
    if (mode === 'VIDEO' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setStatus('Initializing Model...');
    try {
      if (mode === 'IMAGE') {
        setStatus('Generating High-Res Asset...');
        const img = await generateGameAsset(prompt, ratio);
        setGeneratedImage(img);
        setGeneratedVideo(null); // Clear video
      } else {
        await checkVeoKey();
        setStatus('Synthesizing Video (this may take a moment)...');
        // Use generated image as input if available
        const vid = await generateVideo(prompt, generatedImage ? generatedImage.split(',')[1] : null, ratio === AspectRatio.LANDSCAPE ? '16:9' : '9:16');
        setGeneratedVideo(vid);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-800 p-4 rounded-lg border-2 border-purple-700">
      <div className="flex justify-between items-center mb-4 border-b border-purple-900 pb-2">
        <h2 className="text-purple-400 font-mono text-2xl"><i className="fas fa-magic mr-2"></i>ASSET STUDIO</h2>
        <div className="flex gap-2">
            <button onClick={() => setMode('IMAGE')} className={`px-3 py-1 text-sm rounded ${mode === 'IMAGE' ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-gray-400'}`}>IMAGEN</button>
            <button onClick={() => setMode('VIDEO')} className={`px-3 py-1 text-sm rounded ${mode === 'VIDEO' ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-gray-400'}`}>VEO</button>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'IMAGE' ? "Describe a retro spaceship, pixel art explosion, or alien landscape..." : "Describe a cinematic camera move, or animation for the image above..."}
          className="w-full bg-black text-purple-200 p-3 rounded border border-purple-900 focus:outline-none focus:border-purple-500 font-mono"
          rows={3}
        />

        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 uppercase">Aspect Ratio:</span>
            {Object.entries(AspectRatio).map(([key, val]) => (
                <button 
                    key={key} 
                    onClick={() => setRatio(val)}
                    className={`text-xs px-2 py-1 rounded border ${ratio === val ? 'bg-purple-500 border-purple-500 text-black' : 'border-zinc-600 text-zinc-400'}`}
                >
                    {val}
                </button>
            ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded disabled:opacity-50 transition-all"
        >
          {loading ? (
              <span className="animate-pulse">{status}</span>
          ) : (
              <span><i className="fas fa-bolt mr-2"></i>GENERATE {mode}</span>
          )}
        </button>

        <div className="mt-6 bg-black min-h-[300px] rounded border border-zinc-700 flex items-center justify-center relative overflow-hidden">
            {!generatedImage && !generatedVideo && <div className="text-zinc-600">OUTPUT DISPLAY</div>}
            
            {generatedImage && (
                <div className="relative group w-full h-full flex items-center justify-center">
                    <img src={generatedImage} alt="Generated" className="max-h-[400px] object-contain shadow-lg" />
                    {mode === 'VIDEO' && !generatedVideo && (
                         <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                             Using as Ref Image
                         </div>
                    )}
                </div>
            )}
            
            {generatedVideo && (
                <video controls autoPlay loop src={generatedVideo} className="w-full max-h-[400px]" />
            )}
        </div>
        
        {mode === 'VIDEO' && (
            <div className="text-xs text-zinc-500 text-center">
                <p>Veo generation requires a paid API key.</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-purple-400">View Billing Docs</a>
            </div>
        )}
      </div>
    </div>
  );
};

export default Studio;