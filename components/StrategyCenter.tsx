import React, { useState, useRef } from 'react';
import { analyzeStrategy } from '../services/gemini';

const StrategyCenter: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(true);

  const handleSend = async () => {
    if (!input && !selectedImage) return;

    const newMessage = { role: 'user', text: input, image: selectedImage };
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);
    setInput('');

    try {
      const result = await analyzeStrategy(input || "Analyze this image.", selectedImage ? selectedImage.split(',')[1] : undefined, useSearch);
      
      setMessages(prev => [...prev, {
          role: 'model',
          text: result.text,
          sources: result.grounding?.map((g: any) => ({ uri: g.web?.uri || g.maps?.uri, title: g.web?.title || 'Source' })).filter((s:any) => s.uri)
      }]);
      setSelectedImage(null); // Clear image after send
    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { role: 'model', text: "Error: Could not retrieve strategic data." }]);
    } finally {
        setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSelectedImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-zinc-800 rounded-lg border-2 border-blue-600 overflow-hidden">
      <div className="bg-blue-900 p-3 flex justify-between items-center">
          <h2 className="text-blue-100 font-mono text-lg"><i className="fas fa-search-location mr-2"></i>INTEL DATABASE</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-blue-200 flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={useSearch} onChange={e => setUseSearch(e.target.checked)} />
                WEB SEARCH
            </label>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             <div className={`max-w-[80%] p-3 rounded ${msg.role === 'user' ? 'bg-blue-700 text-white' : 'bg-zinc-700 text-blue-100'}`}>
                {msg.image && <img src={msg.image} className="w-48 mb-2 rounded border border-white/20" alt="upload" />}
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                        <p className="opacity-70 mb-1">SOURCES:</p>
                        {msg.sources.map((s: any, i: number) => (
                            <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="block text-blue-300 hover:underline truncate">{s.title}</a>
                        ))}
                    </div>
                )}
             </div>
          </div>
        ))}
        {loading && <div className="text-blue-400 animate-pulse text-sm">Processing Intel...</div>}
      </div>

      <div className="p-3 bg-zinc-800 border-t border-zinc-700">
         {selectedImage && (
             <div className="mb-2 flex items-center gap-2 bg-zinc-900 p-1 rounded w-fit px-2">
                 <span className="text-xs text-green-400">Image Attached</span>
                 <button onClick={() => setSelectedImage(null)} className="text-red-400 hover:text-red-300"><i className="fas fa-times"></i></button>
             </div>
         )}
         <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-zinc-700 text-blue-300 rounded hover:bg-zinc-600">
                <i className="fas fa-camera"></i>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <input 
              className="flex-1 bg-black text-white p-2 rounded border border-zinc-600 focus:border-blue-500 outline-none font-mono"
              placeholder="Ask about game strategy, history, or upload a map..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="px-4 bg-blue-600 text-white rounded font-bold hover:bg-blue-500">SEND</button>
         </div>
      </div>
    </div>
  );
};

export default StrategyCenter;