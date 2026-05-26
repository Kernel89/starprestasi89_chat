
import React, { useState } from 'react';
import { GradeConfig } from '../App';
import { Rombel, UserRole, Quote } from '../types';

interface SchoolSettingsProps {
  gradesConfig: GradeConfig[];
  setGradesConfig: React.Dispatch<React.SetStateAction<GradeConfig[]>>;
  rombels: Rombel[];
  setRombels: React.Dispatch<React.SetStateAction<Rombel[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
}

const SchoolSettings: React.FC<SchoolSettingsProps> = ({ gradesConfig, setGradesConfig, rombels, setRombels, notify, userRole, quotes, setQuotes }) => {
  const [newPrefix, setNewPrefix] = useState<{ [key: string]: string }>({});
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteForm, setQuoteForm] = useState({ text: '', author: '' });

  const isSuperAdmin = userRole === 'super_admin';
  const isCounselor = userRole === 'counselor';
  const canManage = isSuperAdmin || isCounselor;

  const updateClassCount = (id: string, count: number) => {
    if (!isSuperAdmin) {
      notify("Hanya Super Admin yang dapat mengubah konfigurasi struktur sekolah.", "error");
      return;
    }
    setGradesConfig(prev => prev.map(g => g.id === id ? { ...g, classCount: Math.max(1, count) } : g));
  };

  const handleGradeNameChange = (id: string, newName: string) => {
    if (!isSuperAdmin) {
      notify("Hanya Super Admin yang dapat mengubah nama jenjang.", "error");
      return;
    }
    setGradesConfig(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
  };

  const addPrefix = (gradeId: string) => {
    if (!isSuperAdmin) {
      notify("Hanya Super Admin yang dapat menambah jurusan baru.", "error");
      return;
    }
    const val = newPrefix[gradeId];
    if (!val || val.trim() === '') return;

    setGradesConfig(prev => prev.map(g => {
      if (g.id === gradeId) {
        if (g.prefixes.includes(val)) return g;
        return { ...g, prefixes: [...g.prefixes, val.trim()] };
      }
      return g;
    }));
    setNewPrefix({ ...newPrefix, [gradeId]: '' });
  };

  const removePrefix = (gradeId: string, prefix: string) => {
    if (!isSuperAdmin) {
      notify("Hanya Super Admin yang dapat menghapus jurusan.", "error");
      return;
    }
    setGradesConfig(prev => prev.map(g => 
      g.id === gradeId ? { ...g, prefixes: g.prefixes.filter(p => p !== prefix) } : g
    ));
  };

  const handleUpdateDatabase = () => {
    notify("Konfigurasi sekolah berhasil disimpan secara permanen.");
  };

  const handleGenerateRombels = () => {
    if (!isSuperAdmin) {
      notify("Fitur sinkronisasi rombel otomatis hanya untuk Super Admin.", "error");
      return;
    }
    let createdCount = 0;
    const newRombelsList = [...rombels];

    gradesConfig.forEach(grade => {
      grade.prefixes.forEach(major => {
        for (let i = 1; i <= grade.classCount; i++) {
          const name = `${grade.name} ${major} ${i}`;
          const exists = newRombelsList.some(r => r.name.toLowerCase() === name.toLowerCase());
          
          if (!exists) {
            newRombelsList.push({
              id: `r-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: name,
              grade: grade.name,
              major: major as any,
              homeroomTeacherId: '', 
              studentCount: 0,
              averageAttendance: 100
            });
            createdCount++;
          }
        }
      });
    });

    if (createdCount > 0) {
      setRombels(newRombelsList);
      notify(`Berhasil membuat ${createdCount} rombel baru otomatis.`, "success");
    } else {
      notify("Semua kelas sudah tersedia sesuai konfigurasi.", "info");
    }
  };

  // QUOTE HANDLERS
  const handleOpenAddQuote = () => {
    setEditingQuote(null);
    setQuoteForm({ text: '', author: '' });
    setIsQuoteModalOpen(true);
  };

  const handleOpenEditQuote = (q: Quote) => {
    setEditingQuote(q);
    setQuoteForm({ text: q.text, author: q.author });
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.text.trim()) return;

    if (editingQuote) {
        setQuotes(prev => prev.map(q => q.id === editingQuote.id ? { ...q, ...quoteForm } : q));
        notify("Kata mutiara diperbarui.");
    } else {
        const newQ: Quote = {
            id: `q-${Date.now()}`,
            text: quoteForm.text,
            author: quoteForm.author || 'Inspirasi'
        };
        setQuotes(prev => [newQ, ...prev]);
        notify("Kata mutiara baru ditambahkan.");
    }
    setIsQuoteModalOpen(false);
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm("Hapus kata mutiara ini?")) {
        setQuotes(prev => prev.filter(q => q.id !== id));
        notify("Kata mutiara dihapus.");
    }
  };

  const totalClasses = gradesConfig.reduce((acc, curr) => acc + curr.classCount, 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Konfigurasi Aplikasi</h2>
          <p className="text-slate-500 text-sm mt-1">Atur kapasitas kelas, jurusan, and konten inspiratif aplikasi.</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100">
            {totalClasses}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kapasitas Rombel</p>
            <p className="text-sm font-bold text-slate-700">Terdaftar di Sistem</p>
          </div>
        </div>
      </header>

      {/* STRUKTUR KELAS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.91A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.09L21 9"/><path d="M12 3v6"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Struktur Jenjang & Jurusan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gradesConfig.map((grade) => (
            <div key={grade.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-400 select-none">Kelas</span>
                    <input 
                        type="text" 
                        value={grade.name} 
                        onChange={(e) => handleGradeNameChange(grade.id, e.target.value)}
                        readOnly={!isSuperAdmin}
                        className={`text-3xl font-black text-slate-800 bg-transparent border-b-2 border-dashed border-slate-200 outline-none w-24 transition-all ${isSuperAdmin ? 'focus:border-blue-500 cursor-text' : 'cursor-default'}`}
                    />
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Jenjang Pendidikan</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-100 shadow-sm">
                    {grade.name}
                </div>
                </div>

                <div className="relative z-10 space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Jumlah Maksimal Rombel</label>
                    <div className={`flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-fit ${!isSuperAdmin ? 'opacity-60' : ''}`}>
                    <button 
                        onClick={() => updateClassCount(grade.id, grade.classCount - 1)}
                        disabled={!isSuperAdmin}
                        className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 font-black shadow-sm transition-all ${isSuperAdmin ? 'hover:bg-slate-200 active:scale-90' : 'cursor-not-allowed'}`}
                    >
                        -
                    </button>
                    <span className="text-xl font-black text-slate-800 w-10 text-center">{grade.classCount}</span>
                    <button 
                        onClick={() => updateClassCount(grade.id, grade.classCount + 1)}
                        disabled={!isSuperAdmin}
                        className={`w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-100 transition-all ${isSuperAdmin ? 'hover:bg-blue-700 active:scale-90' : 'cursor-not-allowed'}`}
                    >
                        +
                    </button>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Kategori Jurusan</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                    {grade.prefixes.map((p, i) => (
                        <span key={i} className="group/tag flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase border border-indigo-100 transition-all hover:bg-indigo-100">
                        {p}
                        {isSuperAdmin && (
                            <button onClick={() => removePrefix(grade.id, p)} className="text-indigo-300 hover:text-rose-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                        </span>
                    ))}
                    {grade.prefixes.length === 0 && <p className="text-[10px] text-slate-300 italic font-bold">Belum ada jurusan.</p>}
                    </div>
                    
                    {isSuperAdmin && (
                    <div className="flex gap-2 animate-in slide-in-from-bottom-2">
                        <input 
                        type="text"
                        placeholder="E.g. MIPA"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                        value={newPrefix[grade.id] || ''}
                        onChange={(e) => setNewPrefix({ ...newPrefix, [grade.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addPrefix(grade.id)}
                        />
                        <button 
                        onClick={() => addPrefix(grade.id)}
                        className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                        >
                        Tambah
                        </button>
                    </div>
                    )}
                </div>
                </div>
            </div>
            ))}
        </div>
      </section>

      {/* KATA MUTIARA SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manajemen Kata Mutiara</h3>
            </div>
            {canManage && (
                <button onClick={handleOpenAddQuote} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all active:scale-95 shadow-xl shadow-amber-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    Tambah Kata Mutiara
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map(q => (
                <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => handleOpenEditQuote(q)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                        <button onClick={() => handleDeleteQuote(q.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></button>
                    </div>
                    <div className="mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-slate-100 mb-4"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3C14.017 2.44772 14.4647 2 15.017 2H21.017C21.5693 2 22.017 2.44772 22.017 3V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM2.01695 21L2.01695 18C2.01695 16.8954 2.91238 16 4.01695 16H7.01695C7.56923 16 8.01695 15.5523 8.01695 15V9C8.01695 8.44772 7.56923 8 7.01695 8H4.01695C2.91238 8 2.01695 7.10457 2.01695 6V3C2.01695 2.44772 2.46467 2 3.01695 2H9.01695C9.56923 2 10.017 2.44772 10.017 3V15C10.017 18.3137 7.33066 21 4.01695 21H2.01695Z"/></svg>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{q.text}"</p>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{q.author}</p>
                    </div>
                </div>
            ))}
            {quotes.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold italic">Belum ada kata mutiara bimbingan.</p>
                </div>
            )}
        </div>
      </section>

      <div className="flex justify-end pt-8 border-t border-slate-100 gap-4">
        <button 
          onClick={handleGenerateRombels}
          className={`px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 ${isSuperAdmin ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
          Generate Kelas Otomatis
        </button>
        <button 
          onClick={handleUpdateDatabase}
          className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Simpan Konfigurasi
        </button>
      </div>

      {/* MODAL KATA MUTIARA */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
                <header className="p-8 bg-amber-600 text-white">
                    <h3 className="text-xl font-black uppercase tracking-tight">{editingQuote ? 'Edit Kata Mutiara' : 'Tambah Kata Mutiara'}</h3>
                    <p className="text-amber-100 text-xs mt-1">Inspirasi akan muncul di halaman login and dashboard.</p>
                </header>
                <form onSubmit={handleSaveQuote} className="p-8 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Isi Kalimat Mutiara</label>
                        <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold h-32 resize-none outline-none focus:ring-4 focus:ring-amber-500/10" placeholder="Tuliskan kata inspiratif..." value={quoteForm.text} onChange={e => setQuoteForm({...quoteForm, text: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Tokoh / Sumber</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" placeholder="E.g. Ki Hajar Dewantara" value={quoteForm.author} onChange={e => setQuoteForm({...quoteForm, author: e.target.value})} />
                    </div>
                    <div className="flex gap-4 pt-4 border-t">
                        <button type="button" onClick={() => setIsQuoteModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase">Batal</button>
                        <button type="submit" className="flex-[2] py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 active:scale-95 transition-all">Simpan Inspirasi</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SchoolSettings;
