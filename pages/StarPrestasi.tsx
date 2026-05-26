import React, { useState, useMemo } from 'react';
import { StarPrestasi, Student, UserRole, ImplementationItem, Rombel } from '../types';
import { ICONS } from '../constants';

interface StarPrestasiPageProps {
  students: Student[];
  starData: StarPrestasi[];
  setStarData: React.Dispatch<React.SetStateAction<StarPrestasi[]>>;
  rombels: Rombel[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  currentUserId?: string;
}

const StarPrestasiPage: React.FC<StarPrestasiPageProps> = ({ 
  students, 
  starData, 
  setStarData, 
  rombels,
  notify, 
  userRole, 
  currentUserId 
}) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const isStudent = userRole === 'student' || userRole === 'ketua_murid';
  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';
  const canManage = userRole === 'super_admin' || userRole === 'counselor';
  
  const [activeView, setActiveView] = useState<'individual' | 'class'>('individual');
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [filterClass, setFilterClass] = useState('Semua');

  const [formData, setFormData] = useState({
    dream: '',
    weakness: ['', '', ''], 
    obstacle: '',
    steps: ['', '', ''], 
    aspiration: ['', ''], 
    evaluation: '',
    implementation: [] as ImplementationItem[] 
  });

  // Get active star for current student
  const myStar = useMemo(() => {
    if (!isStudent || !currentUserId) return null;
    return starData.find(s => s.studentId === currentUserId);
  }, [starData, currentUserId, isStudent]);

  // Logic Laporan Per Kelas
  const classReports = useMemo(() => {
    return rombels.map(rombel => {
      const normalizedGrade = rombel.grade.trim().toUpperCase();
      const rombelShortName = rombel.name.replace(new RegExp(`^${normalizedGrade}\\s*`), '').trim().toUpperCase();
      
      const classStudents = students.filter(s => {
        const sGrade = s.grade.trim().toUpperCase();
        const sClass = s.class.trim().toUpperCase();
        return s.status === 'Aktif' && sGrade === normalizedGrade && sClass === rombelShortName;
      });

      const filledCount = starData.filter(star => 
        classStudents.some(cs => cs.id === star.studentId)
      ).length;

      const achievedCount = starData.filter(star => 
        star.status === 'Achieved' && classStudents.some(cs => cs.id === star.studentId)
      ).length;

      return {
        ...rombel,
        totalStudents: classStudents.length,
        filledCount,
        achievedCount,
        progressPercent: classStudents.length > 0 ? (filledCount / classStudents.length) * 100 : 0
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [rombels, students, starData]);

  // For Counselor/Principal View (Filtered List)
  const studentStars = useMemo(() => {
    let list = starData.map(star => {
      const student = students.find(s => s.id === star.studentId);
      return {
        ...star,
        studentName: student ? getInitials(student.name) : 'Siswa',
        studentClass: '-',
        rawClassName: student ? `${student.grade} ${student.class}`.toUpperCase() : ''
      };
    });

    if (filterClass !== 'Semua') {
      list = list.filter(item => item.rawClassName.includes(filterClass.toUpperCase()));
    }

    return list;
  }, [starData, students, filterClass]);

  const handleAddWeakness = () => {
    setFormData(prev => ({ ...prev, weakness: [...prev.weakness, ''] }));
  };

  const handleAddStep = () => {
    setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const handleAddAspiration = () => {
    setFormData(prev => ({ ...prev, aspiration: [...prev.aspiration, ''] }));
  };

  // --- Implementation Handlers ---
  const handleAddImplementation = () => {
    setFormData(prev => ({
        ...prev,
        implementation: [
            ...prev.implementation,
            { 
              id: `impl-${Date.now()}`, 
              date: '', 
              activity: '', 
              isExecuted: false 
            }
        ]
    }));
  };

  const handleRemoveImplementation = (id: string) => {
    setFormData(prev => ({
        ...prev,
        implementation: prev.implementation.filter(imp => imp.id !== id)
    }));
  };

  const handleChangeImplementation = (id: string, field: keyof ImplementationItem, value: string) => {
    setFormData(prev => ({
        ...prev,
        implementation: prev.implementation.map(imp => 
            imp.id === id ? { ...imp, [field]: value } : imp
        )
    }));
  };

  // --- WIZARD NAVIGATION HANDLERS ---
  const validateStep1 = () => {
    const hasWeakness = formData.weakness.some(w => w.trim().length > 0);
    if (!hasWeakness) {
        notify("Isi minimal satu KEKURANGAN diri.", "error");
        return false;
    }
    if (!formData.obstacle.trim()) {
        notify("Isi HAMBATAN utama.", "error");
        return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const hasSteps = formData.steps.some(s => s.trim().length > 0);
    if (!hasSteps) {
        notify("Isi minimal satu KELEBIHAN (Progres) diri.", "error");
        return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const hasAspiration = formData.aspiration.some(a => a.trim().length > 0);
    if (!hasAspiration) {
        notify("Isi minimal satu ASPIRASI yang ingin diraih.", "error");
        return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.evaluation.trim()) {
        notify("Isi EVALUASI strategi terlebih dahulu.", "error");
        return false;
    }
    return true;
  };

  const validateStep5 = () => {
    const hasImpl = formData.implementation.some(i => i.activity.trim().length > 0);
    if (!hasImpl) {
        notify("Isi minimal satu rencana IMPLEMENTASI.", "error");
        return false;
    }
    return true;
  };

  const handleNextStep = (targetStep: number) => {
    if (targetStep === 2 && validateStep1()) setCurrentStep(2);
    if (targetStep === 3 && validateStep2()) setCurrentStep(3);
    if (targetStep === 4 && validateStep3()) setCurrentStep(4);
    if (targetStep === 5 && validateStep4()) setCurrentStep(5);
    if (targetStep === 6 && validateStep5()) setCurrentStep(6);
  };

  const handleCreateStar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5()) return;

    const newStar: StarPrestasi = {
      id: `star-${Date.now()}`,
      studentId: currentUserId,
      dream: formData.dream,
      weakness: formData.weakness.filter(w => w.trim() !== ''),
      obstacle: formData.obstacle,
      steps: formData.steps.filter(s => s.trim() !== '').map((step, idx) => ({
        id: `step-${Date.now()}-${idx}`,
        text: step,
        isCompleted: false 
      })),
      aspiration: formData.aspiration.filter(a => a.trim() !== ''),
      evaluation: formData.evaluation,
      implementation: formData.implementation.filter(i => i.activity.trim() !== ''),
      status: 'On Process',
      dateCreated: new Date().toISOString()
    };

    setStarData(prev => [newStar, ...prev]);
    setIsCreating(false);
    setCurrentStep(1); 
    notify("Rencana Star Prestasi berhasil dibuat!", "success");
  };

  const handleToggleStep = (stepId: string) => {
    if (!myStar) return;
    const updatedStar = {
      ...myStar,
      steps: myStar.steps.map(s => s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s)
    };
    setStarData(prev => prev.map(s => s.id === myStar.id ? updatedStar : s));
  };

  const handleToggleImplementation = (itemId: string) => {
    if (!myStar) return;
    const updatedStar = {
      ...myStar,
      implementation: myStar.implementation?.map(imp => 
        imp.id === itemId ? { ...imp, isExecuted: !imp.isExecuted } : imp
      )
    };
    const allExecuted = updatedStar.implementation?.every(i => i.isExecuted) ?? false;
    if (allExecuted && updatedStar.status !== 'Achieved') {
        updatedStar.status = 'Achieved';
        notify("Selamat! Semua rencana implementasi terlaksana!", "success");
    }
    setStarData(prev => prev.map(s => s.id === myStar.id ? updatedStar : s));
  };

  const handleDeleteStar = (id: string) => {
    if(confirm("Hapus rencana ini?")) {
        setStarData(prev => prev.filter(s => s.id !== id));
        notify("Data dihapus.", "info");
    }
  };

  const getSectionClass = (stepRequired: number) => {
    if (currentStep < stepRequired) {
        return "opacity-40 pointer-events-none grayscale transition-all duration-500 filter";
    }
    return "transition-all duration-500 opacity-100";
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="text-amber-400 drop-shadow-md">★</span> Star Prestasi
          </h2>
          <p className="text-slate-500 text-sm font-medium">Metode 6 Langkah: Stagnasi, Progres, Aspirasi, Evaluasi, Implementasi, Eksekusi.</p>
        </div>
        {!isStudent && (
          <div className="flex p-1 bg-slate-100 rounded-2xl">
             <button 
               onClick={() => setActiveView('individual')}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'individual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
             >
               Individu
             </button>
             <button 
               onClick={() => setActiveView('class')}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'class' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
             >
               Laporan Kelas
             </button>
          </div>
        )}
      </header>

      {isStudent ? (
        // STUDENT VIEW
        <div className="max-w-5xl mx-auto">
          {!myStar && !isCreating ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6">
               <div className="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
               </div>
               <h3 className="text-2xl font-black text-slate-800">Mulai Perubahanmu</h3>
               <p className="text-slate-500 max-w-md">"Susun rencanamu melalui 6 tahapan Star Prestasi untuk mencapai tujuan."</p>
               <button 
                 onClick={() => { setIsCreating(true); setCurrentStep(1); }}
                 className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
               >
                 Buat Star Prestasi
               </button>
            </div>
          ) : isCreating ? (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
               <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 mb-8 gap-4">
                  <h3 className="text-xl font-black text-slate-800">Wizard Star Prestasi</h3>
                  <div className="flex gap-2 bg-slate-100 p-1.5 rounded-full overflow-x-auto no-scrollbar">
                     {['Stagnasi', 'Progres', 'Aspirasi', 'Evaluasi', 'Impl.', 'Eksekusi'].map((label, idx) => {
                        const step = idx + 1;
                        return (
                            <div key={step} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${currentStep === step ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                                {label}
                            </div>
                        );
                     })}
                  </div>
               </div>
               
               <form onSubmit={handleCreateStar} className="space-y-10">
                  <div className={getSectionClass(1)}>
                      <div className="space-y-2 mb-6">
                        <label className="text-sm font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg">1. STAGNASI (KONDISI SAAT INI)</label>
                        <p className="text-xs text-slate-400">Deskripsikan kondisi yang menahanmu dan hambatan yang kamu hadapi.</p>
                        <input className="w-full text-xl font-bold text-slate-800 border-b-2 border-slate-200 py-2 focus:border-amber-400 outline-none placeholder:text-slate-300 transition-colors mt-4" placeholder="Judul Kondisi Stagnasi (Contoh: Prestasi Belajar Menurun)" value={formData.dream} onChange={e => setFormData({...formData, dream: e.target.value})} autoFocus />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kekurangan Diri</label>
                          <div className="space-y-2">
                            {formData.weakness.map((w, idx) => (
                              <input key={idx} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none" placeholder={`Kekurangan ${idx+1}...`} value={w} onChange={e => { const n = [...formData.weakness]; n[idx] = e.target.value; setFormData({...formData, weakness: n}); }} />
                            ))}
                            <button type="button" onClick={handleAddWeakness} className="text-[10px] font-bold text-amber-600">+ Tambah</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hambatan Utama</label>
                          <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold h-36 resize-none focus:ring-2 focus:ring-amber-200 outline-none" placeholder="Apa halangan terbesar dari luar?" value={formData.obstacle} onChange={e => setFormData({...formData, obstacle: e.target.value})} />
                        </div>
                      </div>
                      {currentStep === 1 && <div className="mt-6 flex justify-end"><button type="button" onClick={() => handleNextStep(2)} className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-600 shadow-lg active:scale-95 transition-all">Lanjut ke Progres →</button></div>}
                  </div>
                  <div className={getSectionClass(2)}>
                     <div className="space-y-4 border-t border-slate-100 pt-6">
                        <label className="text-sm font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">2. PROGRES (KELEBIHAN & KEKUATAN)</label>
                        <p className="text-xs text-slate-400">Identifikasi kelebihan yang kamu miliki untuk mengatasi stagnasi.</p>
                        {formData.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2">
                              <input className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-400 outline-none" placeholder={`Kekuatan diri ke-${idx+1}...`} value={step} onChange={e => { const n = [...formData.steps]; n[idx] = e.target.value; setFormData({...formData, steps: n}); }} disabled={currentStep < 2} />
                          </div>
                        ))}
                        <button type="button" onClick={handleAddStep} className="text-[10px] font-bold text-indigo-600" disabled={currentStep < 2}>+ Tambah Kelebihan</button>
                     </div>
                     {currentStep === 2 && <div className="mt-6 flex justify-end"><button type="button" onClick={() => handleNextStep(3)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Lanjut ke Aspirasi →</button></div>}
                  </div>

                  <div className={getSectionClass(3)}>
                     <div className="space-y-4 border-t border-slate-100 pt-6">
                        <label className="text-sm font-black text-violet-500 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-lg">3. ASPIRASI (TUJUAN)</label>
                        <p className="text-xs text-slate-400">Apa tujuan besar yang ingin kamu capai?</p>
                        {formData.aspiration.map((asp, idx) => (
                          <input key={idx} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-violet-200 outline-none" placeholder={`Tujuan ke-${idx+1}...`} value={asp} onChange={e => { const n = [...formData.aspiration]; n[idx] = e.target.value; setFormData({...formData, aspiration: n}); }} disabled={currentStep < 3} />
                        ))}
                        <button type="button" onClick={handleAddAspiration} className="text-[10px] font-bold text-violet-600" disabled={currentStep < 3}>+ Tambah Aspirasi</button>
                     </div>
                     {currentStep === 3 && <div className="mt-6 flex justify-end"><button type="button" onClick={() => handleNextStep(4)} className="bg-violet-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-violet-700 shadow-lg active:scale-95 transition-all">Lanjut ke Evaluasi →</button></div>}
                  </div>

                  <div className={getSectionClass(4)}>
                      <div className="space-y-2 border-t border-slate-100 pt-6">
                        <label className="text-sm font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">4. EVALUASI (STRATEGI)</label>
                        <p className="text-xs text-slate-400">Bagaimana menggunakan Kekuatan (Progres) untuk mengatasi Kekurangan (Stagnasi) demi mencapai Aspirasi?</p>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-200 outline-none h-24 resize-none" placeholder="Tuliskan strategimu..." value={formData.evaluation} onChange={e => setFormData({...formData, evaluation: e.target.value})} disabled={currentStep < 4} />
                      </div>
                      {currentStep === 4 && <div className="mt-6 flex justify-end"><button type="button" onClick={() => handleNextStep(5)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Lanjut ke Implementasi →</button></div>}
                  </div>

                  <div className={getSectionClass(5)}>
                     <div className="space-y-4 border-t border-slate-100 pt-6">
                        <label className="text-sm font-black text-cyan-600 uppercase tracking-widest bg-cyan-50 px-3 py-1 rounded-lg">5. IMPLEMENTASI (JADWAL)</label>
                        <p className="text-xs text-slate-400">Rencanakan kegiatan nyata.</p>
                        <div className="space-y-3">
                            {formData.implementation.map((imp) => (
                                <div key={imp.id} className="flex gap-3">
                                    <input type="date" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" value={imp.date} onChange={(e) => handleChangeImplementation(imp.id, 'date', e.target.value)} disabled={currentStep < 5} />
                                    <input type="text" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" placeholder="Kegiatan..." value={imp.activity} onChange={(e) => handleChangeImplementation(imp.id, 'activity', e.target.value)} disabled={currentStep < 5} />
                                    <button type="button" onClick={() => handleRemoveImplementation(imp.id)} className="text-slate-300 hover:text-rose-500" disabled={currentStep < 5}>x</button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddImplementation} className="text-[10px] font-bold text-cyan-600" disabled={currentStep < 5}>+ Tambah Jadwal</button>
                        </div>
                     </div>
                     {currentStep === 5 && <div className="mt-6 flex justify-end"><button type="button" onClick={() => handleNextStep(6)} className="bg-cyan-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-700 shadow-lg active:scale-95 transition-all">Lanjut ke Eksekusi →</button></div>}
                  </div>

                  <div className={getSectionClass(6)}>
                     <div className="space-y-4 border-t border-slate-100 pt-6">
                        <label className="text-sm font-black text-teal-500 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-lg">6. EKSEKUSI (REALISASI)</label>
                        <p className="text-xs text-slate-400">Preview checklist kegiatan yang akan kamu lakukan.</p>
                        <div className="space-y-2">
                           {formData.implementation.map((imp) => (
                               <div key={`exec-${imp.id}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-70">
                                  <div className="w-4 h-4 border-2 border-slate-400 rounded"></div>
                                  <span className="text-xs font-bold text-slate-600">{imp.activity}</span>
                               </div>
                           ))}
                        </div>
                     </div>
                     <div className="pt-8 flex gap-4 border-t border-slate-100 mt-6">
                        <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest text-xs">Batal</button>
                        <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95" disabled={currentStep < 6}>Simpan Star Prestasi</button>
                     </div>
                  </div>
               </form>
            </div>
          ) : myStar && (
            <div className="space-y-8">
               <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div>
                     <h3 className="text-xl font-black text-slate-800">Star Prestasi Saya</h3>
                     <p className="text-xs text-slate-500">Status: <span className={`font-bold uppercase ${myStar.status === 'Achieved' ? 'text-emerald-600' : 'text-amber-600'}`}>{myStar.status}</span></p>
                  </div>
                  <button onClick={() => handleDeleteStar(myStar.id)} className="text-rose-400 text-xs font-bold hover:text-rose-600 border border-rose-200 px-4 py-2 rounded-xl">Hapus / Reset</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 shadow-sm flex flex-col">
                     <div className="mb-4"><span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-widest">1. STAGNASI</span></div>
                     <h4 className="text-lg font-black text-slate-800 mb-2">{myStar.dream}</h4>
                     <div className="space-y-3 text-xs text-slate-600">
                        <div><strong className="text-amber-700">Kekurangan:</strong><ul className="list-disc list-inside mt-1">{myStar.weakness.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                        <div><strong className="text-amber-700">Hambatan:</strong><p className="mt-1 italic">"{myStar.obstacle}"</p></div>
                     </div>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm flex flex-col">
                     <div className="mb-4"><span className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-lg text-[10px] font-black uppercase tracking-widest">2. PROGRES</span></div>
                     <p className="text-xs font-bold text-indigo-900 mb-2">Kelebihan & Kekuatan:</p>
                     <ul className="space-y-2">
                        {myStar.steps.map((step) => (
                           <li key={step.id} className="flex items-center gap-2 bg-white/60 p-2 rounded-xl">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                              <span className="text-xs font-bold text-slate-700">{step.text}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-violet-50 p-6 rounded-[2.5rem] border border-violet-100 shadow-sm flex flex-col">
                     <div className="mb-4"><span className="px-3 py-1 bg-violet-200 text-violet-800 rounded-lg text-[10px] font-black uppercase tracking-widest">3. ASPIRASI</span></div>
                     <ul className="space-y-2">
                        {myStar.aspiration?.map((asp, i) => (
                           <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                              {asp}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 shadow-sm flex flex-col">
                     <div className="mb-4"><span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-lg text-[10px] font-black uppercase tracking-widest">4. EVALUASI</span></div>
                     <p className="text-xs font-medium text-slate-700 italic leading-relaxed">"{myStar.evaluation}"</p>
                  </div>
                  <div className="md:col-span-2 bg-teal-50 p-6 rounded-[2.5rem] border border-teal-100 shadow-sm">
                     <div className="mb-4 flex justify-between items-center">
                        <span className="px-3 py-1 bg-teal-200 text-teal-800 rounded-lg text-[10px] font-black uppercase tracking-widest">6. EKSEKUSI (CHECKLIST)</span>
                        <span className="text-[10px] font-bold text-teal-600">{myStar.implementation?.filter(i => i.isExecuted).length}/{myStar.implementation?.length} Selesai</span>
                     </div>
                     <div className="space-y-2">
                        {myStar.implementation?.map((imp) => (
                           <label key={`exec-${imp.id}`} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${imp.isExecuted ? 'bg-teal-100 border-teal-200' : 'bg-white border-slate-100'}`}>
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${imp.isExecuted ? 'bg-teal-50 border-teal-500' : 'border-slate-300 bg-white'}`}>
                                 {imp.isExecuted && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input type="checkbox" className="hidden" checked={imp.isExecuted} onChange={() => handleToggleImplementation(imp.id)} />
                              <div className="flex-1"><span className={`text-sm font-bold block transition-all ${imp.isExecuted ? 'text-teal-800 line-through' : 'text-slate-700'}`}>{imp.activity}</span></div>
                           </label>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      ) : (
        // COUNSELOR & PRINCIPAL VIEW
        <div className="space-y-10">
          
          {activeView === 'individual' ? (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Filter Kelas:</label>
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                      >
                         <option value="Semua">Semua Kelas</option>
                         {rombels.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Menampilkan</p>
                      <p className="text-sm font-bold text-indigo-600">{studentStars.length} Rencana Terdaftar</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-8 animate-in fade-in">
                   {studentStars.map(star => (
                     <div key={star.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 border border-indigo-100">{star.studentName.charAt(0)}</div>
                              <div>
                                 <h4 className="text-lg font-black text-slate-800">{star.studentName}</h4>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">-</p>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${star.status === 'Achieved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {star.status === 'Achieved' ? 'Selesai' : 'Proses'}
                              </span>
                              {!isPrincipal && <button onClick={() => handleDeleteStar(star.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 text-[10px] font-bold transition-opacity">Hapus</button>}
                           </div>
                        </div>

                        <div className={`grid grid-cols-1 ${!isPrincipal ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
                           {!isPrincipal && (
                             <>
                                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100"><p className="text-[9px] font-black text-amber-700 uppercase mb-2">1. Stagnasi</p><p className="text-xs font-bold text-slate-700 mb-1">{star.dream}</p><p className="text-[10px] text-slate-500 italic">"{star.obstacle}"</p></div>
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100"><p className="text-[9px] font-black text-indigo-700 uppercase mb-2">2. Progres</p><ul className="list-disc list-inside text-[10px] text-slate-600 font-medium">{star.steps.slice(0, 3).map((s,i) => <li key={i}>{s.text}</li>)}</ul></div>
                             </>
                           )}
                           
                           {/* SELALU TAMPILKAN ASPIRASI (UNTUK SEMUA USER TERMASUK KEPSEK) */}
                           <div className={`bg-violet-50/50 p-6 rounded-[2rem] border border-violet-100 ${isPrincipal ? 'shadow-inner' : ''}`}>
                              <p className="text-[10px] font-black text-violet-700 uppercase mb-4 tracking-[0.2em]">3. ASPIRASI & IMPIAN</p>
                              <ul className="space-y-3">
                                 {star.aspiration?.map((a,i) => (
                                    <li key={i} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl">
                                       <svg className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                       <span className="text-sm font-bold text-slate-700">{a}</span>
                                    </li>
                                 ))}
                                 {(!star.aspiration || star.aspiration.length === 0) && <li className="text-xs text-slate-400 italic">Belum mengisi aspirasi.</li>}
                              </ul>
                           </div>

                           {!isPrincipal && (
                             <>
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100"><p className="text-[9px] font-black text-blue-700 uppercase mb-2">4. Evaluasi</p><p className="text-[10px] text-slate-600 italic line-clamp-3">"{star.evaluation}"</p></div>
                                <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100"><p className="text-[9px] font-black text-cyan-700 uppercase mb-2">5. Implementasi</p><p className="text-[10px] text-slate-600 font-bold">{star.implementation?.length || 0} Kegiatan</p></div>
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100"><p className="text-[9px] font-black text-teal-700 uppercase mb-2">6. Eksekusi</p><div className="w-full bg-teal-200 h-2 rounded-full overflow-hidden mt-1"><div className="h-full bg-teal-600" style={{ width: `${(star.implementation?.filter(i=>i.isExecuted).length || 0) / (star.implementation?.length || 1) * 100}%` }}></div></div><p className="text-[9px] text-teal-600 mt-1 font-bold text-right">{(star.implementation?.filter(i=>i.isExecuted).length || 0)}/{star.implementation?.length || 0}</p></div>
                             </>
                           )}
                        </div>
                     </div>
                   ))}
                   {studentStars.length === 0 && (
                     <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">Tidak ada data ditemukan untuk kriteria ini.</p>
                     </div>
                   )}
                </div>
             </div>
          ) : (
             // CLASS REPORT VIEW
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {classReports.map(report => (
                   <div key={report.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-100">
                            {report.grade}
                         </div>
                         <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Progres Kelas</span>
                            <span className="text-2xl font-black text-slate-800">{Math.round(report.progressPercent)}%</span>
                         </div>
                      </div>
                      
                      <h4 className="text-xl font-black text-slate-800 mb-6">{report.name}</h4>
                      
                      <div className="space-y-4 flex-1">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Partisipasi</span>
                            <span className="text-xs font-black text-indigo-600">{report.filledCount} / {report.totalStudents} Siswa</span>
                         </div>
                         <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-50">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                              style={{ width: `${report.progressPercent}%` }}
                            />
                         </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">{report.achievedCount} Achieved</span>
                         </div>
                         <button 
                           onClick={() => {
                             setFilterClass(report.name);
                             setActiveView('individual');
                           }}
                           className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1"
                         >
                           Detail Aspirasi →
                         </button>
                      </div>
                   </div>
                ))}
                {classReports.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">Data rombel tidak tersedia.</p>
                  </div>
                )}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StarPrestasiPage;