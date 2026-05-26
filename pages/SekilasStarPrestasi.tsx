import React, { useState } from 'react';
import { UserRole } from '../types';
import { StarMethodStep } from '../App';

interface SekilasStarPrestasiProps {
  methodSteps: StarMethodStep[];
  setMethodSteps: React.Dispatch<React.SetStateAction<StarMethodStep[]>>;
  introText: string;
  setIntroText: (text: string) => void;
  philosophyDesc: string;
  setPhilosophyDesc: (text: string) => void;
  quoteText: string;
  setQuoteText: (text: string) => void;
  devText: string;
  setDevText: (text: string) => void;
  userRole?: UserRole;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onPushCloud?: () => void;
  onPullCloud?: () => void;
}

const SekilasStarPrestasi: React.FC<SekilasStarPrestasiProps> = ({ 
  methodSteps, 
  setMethodSteps, 
  introText, 
  setIntroText, 
  philosophyDesc,
  setPhilosophyDesc,
  quoteText,
  setQuoteText,
  devText,
  setDevText,
  userRole, 
  notify,
  onPushCloud,
  onPullCloud 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSteps, setEditingSteps] = useState<StarMethodStep[]>(methodSteps);
  const [editingIntro, setEditingIntro] = useState(introText);
  const [editingPhil, setEditingPhil] = useState(philosophyDesc);
  const [editingQuote, setEditingQuote] = useState(quoteText);
  const [editingDev, setEditingDev] = useState(devText);

  const canEdit = userRole === 'super_admin';

  const handleSaveEdit = () => {
    setMethodSteps(editingSteps);
    setIntroText(editingIntro);
    setPhilosophyDesc(editingPhil);
    setQuoteText(editingQuote);
    setDevText(editingDev);
    setIsEditModalOpen(false);
    notify("Konfigurasi Database STAR PRESTASI berhasil disimpan.", "success");
  };

  const updateStep = (index: number, field: keyof StarMethodStep, value: string) => {
    const newSteps = [...editingSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditingSteps(newSteps);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* DINAMIC INTRO BOX AT THE TOP */}
      <div className="max-w-5xl mx-auto px-4 animate-in slide-in-from-top-4 duration-500">
         <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div className="flex-1 text-center md:text-left">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Tentang Kami</p>
               <p className="text-sm md:text-base font-bold text-slate-700 leading-relaxed italic">
                  "{introText}"
               </p>
            </div>
         </div>
      </div>

      <header className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Filosofi <span className="text-indigo-600">STAR PRESTASI</span></h2>
        <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base px-4">
          {philosophyDesc}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {methodSteps.map((step, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col items-center text-center relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${step.color}-50 rounded-bl-[5rem] -mr-12 -mt-12 transition-transform group-hover:scale-110`} />
            <div className={`w-16 h-16 rounded-[1.75rem] bg-${step.color}-100 text-${step.color}-600 flex items-center justify-center mb-6 relative z-10 shadow-inner`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={step.icon}/></svg>
            </div>
            <h3 className={`text-xl font-black text-${step.color}-700 tracking-tight mb-1 relative z-10`}>{step.title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 relative z-10">{step.subtitle}</p>
            <p className="text-xs font-bold text-slate-500 leading-relaxed relative z-10 px-2 italic">
              "{step.desc}"
            </p>
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-8">
        {/* DEVELOPMENT SECTION */}
        <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-slate-200">
               <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div className="flex-1 text-center lg:text-left">
               <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic mb-4">Keamanan data Aplikasi</h4>
               <p className="text-sm md:text-base font-medium text-slate-500 leading-relaxed">
                  {devText}
               </p>
            </div>
        </div>

        {userRole !== 'super_admin' && (
          <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-indigo-100 shadow-sm flex flex-col lg:flex-row items-center gap-10 bg-gradient-to-r from-white to-indigo-50/30">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-200">
                 <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a3.5 3.5 0 0 0 0-7h-1.5a7 7 0 1 0-11.85 2.14"/><polyline points="9 11 12 14 15 11"/><line x1="12" y1="14" x2="12" y2="21"/></svg>
              </div>
              <div className="flex-1 text-center lg:text-left">
                 <h4 className="text-2xl font-black text-indigo-900 uppercase tracking-tight italic mb-4">Cloud Synchronization</h4>
                 <p className="text-sm md:text-base font-medium text-slate-600 leading-relaxed">
                    Data Anda terhubung dengan server awan STAR PRESTASI secara otomatis. Anda dapat mengakses data bimbingan yang sama di berbagai perangkat melalui domain <span className="font-bold text-indigo-600">konselingsmandak.info</span>. Gunakan fitur sinkronisasi di bawah ini jika data di perangkat Anda tidak mutakhir.
                 </p>
                 <div className="flex flex-wrap gap-4 mt-6">
                   <button 
                     onClick={onPushCloud}
                     className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                     Push to Cloud (Upload)
                   </button>
                   <button 
                     onClick={onPullCloud}
                     className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                     Pull from Cloud (Download)
                   </button>
                 </div>
              </div>
          </div>
        )}

        <div className="bg-slate-900 text-white p-10 md:p-16 rounded-[4rem] text-center space-y-8 relative overflow-hidden shadow-2xl shadow-slate-200 w-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4f46e555,transparent)]" />
            <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter relative z-10 whitespace-pre-line">"{quoteText}"</h3>
            <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full relative z-10" />
            <p className="text-slate-400 text-xs md:text-sm font-medium max-w-2xl mx-auto relative z-10 leading-loose">
                Aplikasi STAR PRESTASI dikembangkan untuk menjembatani cita-cita siswa dengan dukungan konselor profesional dalam satu ekosistem data yang terpadu and aman.
            </p>
        </div>

        {canEdit && (
            <div className="flex justify-center">
                <button 
                    onClick={() => { 
                    setEditingSteps(methodSteps); 
                    setEditingIntro(introText); 
                    setEditingPhil(philosophyDesc);
                    setEditingQuote(quoteText);
                    setEditingDev(devText);
                    setIsEditModalOpen(true); 
                    }}
                    className="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Edit Konfigurasi Database
                </button>
            </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-6xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <header className="p-8 bg-indigo-600 text-white shrink-0">
               <h3 className="text-2xl font-black uppercase tracking-tight italic">Edit Database Sekitar STAR PRESTASI</h3>
               <p className="text-indigo-100 text-xs mt-1">Perubahan ini akan tersimpan ke database lokal aplikasi.</p>
            </header>
            
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-10 flex-1">
               {/* EDIT TEXT AREAS */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </div>
                        <h4 className="font-black text-[10px] text-indigo-700 uppercase tracking-widest">Tentang Kami</h4>
                    </div>
                    <textarea className="w-full bg-white border border-indigo-200 rounded-xl px-5 py-4 text-xs font-bold h-24 resize-none outline-none" value={editingIntro} onChange={e => setEditingIntro(e.target.value)} />
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-200 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <h4 className="font-black text-[10px] text-slate-700 uppercase tracking-widest">Narasi Filosofi</h4>
                    </div>
                    <textarea className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-xs font-bold h-24 resize-none outline-none" value={editingPhil} onChange={e => setEditingPhil(e.target.value)} />
                  </div>

                  <div className="p-6 bg-amber-50/50 rounded-[2rem] border-2 border-amber-100 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <h4 className="font-black text-[10px] text-amber-700 uppercase tracking-widest">Kutipan Penutup</h4>
                    </div>
                    <textarea className="w-full bg-white border border-amber-200 rounded-xl px-5 py-4 text-xs font-bold h-24 resize-none outline-none" value={editingQuote} onChange={e => setEditingQuote(e.target.value)} />
                  </div>

                  <div className="p-6 bg-slate-900 rounded-[2rem] border-2 border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-black text-xs">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        </div>
                        <h4 className="font-black text-[10px] text-indigo-400 uppercase tracking-widest">Development</h4>
                    </div>
                    <textarea className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-xs font-bold text-white h-24 resize-none outline-none focus:bg-white/20" value={editingDev} onChange={e => setEditingDev(e.target.value)} />
                  </div>
               </div>

               {/* EDIT 6 STEPS */}
               <div className="space-y-6 pt-4 border-t border-slate-100">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-2">Konfigurasi Butir 6 Langkah Transformasi</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {editingSteps.map((step, idx) => (
                      <div key={idx} className={`p-6 rounded-[2rem] border-2 border-${step.color}-100 bg-${step.color}-50/30 space-y-4`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${step.color}-600 text-white flex items-center justify-center font-black text-xs`}>{idx + 1}</div>
                            <h4 className={`font-black text-[10px] text-${step.color}-700 uppercase tracking-widest`}>Langkah {idx + 1}</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase px-1">Judul Langkah</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" value={step.title} onChange={e => updateStep(idx, 'title', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase px-1">Sub-judul (Konsep)</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" value={step.subtitle} onChange={e => updateStep(idx, 'subtitle', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase px-1">Deskripsi Penjelasan</label>
                                <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium h-16 resize-none" value={step.desc} onChange={e => updateStep(idx, 'desc', e.target.value)} />
                            </div>
                          </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            <footer className="p-8 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
               <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-600">Batal</button>
               <button onClick={handleSaveEdit} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Perubahan Database</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SekilasStarPrestasi;