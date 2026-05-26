
import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { getCounselingAdvice } from '../geminiService';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Halo! Saya Digital Assistant STARS PRESTASI. Ada yang bisa saya bantu terkait strategi bimbingan atau referensi penanganan kasus siswa hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const adviceResponse = await getCounselingAdvice(userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: adviceResponse || 'Maaf, terjadi kendala teknis pada sistem bantuan.' }]);
    setIsLoading(false);
  };

  const SUGGESTIONS = [
    "Bagaimana menangani siswa yang kecanduan game?",
    "Tips konseling untuk siswa korban bullying.",
    "Ide program bimbingan karir yang menarik.",
    "Cara mediasi konflik antar kelompok siswa."
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="shrink-0">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="p-2 bg-teal-600 text-white rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
          </span>
          Digital Counselor Assistant
        </h2>
        <p className="text-slate-500 text-sm mt-1">Konsultasi strategi bimbingan dengan dukungan AI Gemini.</p>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-slate-200 w-24 h-12 rounded-2xl"></div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-3">
            <input
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
              placeholder="Ketik topik bimbingan (contoh: bullying, belajar, karir)..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-100 hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>

        {/* Sidebar Suggestions */}
        <div className="w-full md:w-80 space-y-6 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Referensi Cepat</h3>
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="w-full text-left p-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-all border border-transparent hover:border-teal-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-teal-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10">Gemini AI Powered</h4>
            <p className="text-[10px] font-medium leading-relaxed opacity-70 relative z-10">Asisten ini memberikan referensi berdasarkan pangkalan data bimbingan konselor dan kecerdasan buatan Gemini untuk solusi yang lebih akurat.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

