
import React, { useState, useMemo, useEffect } from 'react';
import { GuidanceMaterial, QuestionnaireType, MbtiOption, UserRole } from '../types';
import { ICONS, MBTI_TEMPLATE } from '../constants';

interface GuidanceMaterialsProps {
  materials: GuidanceMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<GuidanceMaterial[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
}

const GuidanceMaterials: React.FC<GuidanceMaterialsProps> = ({ materials, setMaterials, notify, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Semua' | GuidanceMaterial['category']>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<GuidanceMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<GuidanceMaterial | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const canManage = userRole === 'counselor' || userRole === 'super_admin';

  const [formData, setFormData] = useState<Partial<GuidanceMaterial>>({
    title: '',
    category: 'Pribadi',
    description: '',
    discussion: '',
    task: '',
    linkUrl: '',
    isQuestionnaire: false,
    qTitle: '',
    qType: 'Likert',
    qItemCount: 10,
    qOptionCount: 5,
    qItems: [],
    qReverseItems: [],
    qAdjectives: [],
    qMbtiOptions: []
  });

  useEffect(() => {
    if (formData.isQuestionnaire) {
        const count = formData.qItemCount || 0;
        const currentItems = formData.qItems || [];
        const currentMbti = formData.qMbtiOptions || [];
        
        if (formData.qType === 'MBTI') {
            if (currentMbti.length !== count) {
                setFormData(prev => ({
                    ...prev,
                    qMbtiOptions: Array.from({ length: count }, (_, i) => currentMbti[i] || { a: '', b: '', dimension: 'EI' })
                }));
            }
        } else {
            if (currentItems.length !== count) {
                setFormData(prev => ({ 
                    ...prev, 
                    qItems: Array.from({ length: count }, (_, i) => currentItems[i] || ""),
                    qAdjectives: prev.qType === 'Semantic' ? Array.from({ length: count }, (_, i) => (prev.qAdjectives?.[i] || { left: 'Pasif', right: 'Aktif' })) : []
                }));
            }
        }
    }
  }, [formData.qItemCount, formData.isQuestionnaire, formData.qType]);

  const categories: GuidanceMaterial['category'][] = ['Pribadi', 'Sosial', 'Belajar', 'Karir'];
  const questionnaireTypes: { val: QuestionnaireType, label: string }[] = [
    { val: 'Likert', label: 'Skala Likert (SS-STS)' },
    { val: 'Guttman', label: 'Skala Guttman (Ya-Tidak)' },
    { val: 'Rating', label: 'Rating Scale (Numerik)' },
    { val: 'Semantic', label: 'Semantic Differential' },
    { val: 'Essay', label: 'Pertanyaan Terbuka (Esai)' },
    { val: 'MBTI', label: 'Tes Kepribadian (Skala A/B)' }
  ];

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setFormData({ 
      title: '', category: 'Pribadi', description: '', discussion: '', task: '', linkUrl: '',
      isQuestionnaire: false, qTitle: '', qType: 'Likert', qItemCount: 5, qOptionCount: 5,
      qCalculation: 'Total Skor = (Jumlah Skor Butir Positif) + (Skor Terbalik Butir Negatif). Rendah (5-10), Sedang (11-18), Tinggi (19-25).',
      qItems: Array(5).fill(""), qReverseItems: [], qAdjectives: [], qMbtiOptions: []
    });
    setIsModalOpen(true);
  };

  const handleLoadMbtiTemplate = () => {
    setFormData({
        ...formData,
        qType: 'MBTI',
        qItemCount: MBTI_TEMPLATE.length,
        qMbtiOptions: MBTI_TEMPLATE,
        qCalculation: 'Kalkulasi Otomatis Dimensi (E/I, S/N, T/F, J/P). Skala Pilihan Ganda / Forced Choice.',
        title: 'Tes Kepribadian MBTI (80 Soal)',
        qTitle: 'Inventori MBTI 4 Dimensi',
        isQuestionnaire: true
    });
    notify("Template MBTI 80 Soal dimuat.");
  };

  const handleOpenEdit = (e: React.MouseEvent, m: GuidanceMaterial) => {
    e.stopPropagation();
    setEditingMaterial(m);
    setFormData({ ...m });
    setIsModalOpen(true);
  };

  const handleToggleReverse = (idx: number) => {
    const current = formData.qReverseItems || [];
    if (current.includes(idx)) {
        setFormData({ ...formData, qReverseItems: current.filter(i => i !== idx) });
    } else {
        setFormData({ ...formData, qReverseItems: [...current, idx] });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    
    if (formData.isQuestionnaire) {
        if (formData.qType === 'MBTI') {
            if ((formData.qMbtiOptions || []).some(o => !o.a.trim() || !o.b.trim())) {
                notify("Mohon lengkapi seluruh opsi A and B pada butir MBTI.", "error");
                return;
            }
        } else if (formData.qType !== 'Essay' && (formData.qItems || []).some(item => !item.trim())) {
            notify("Mohon lengkapi seluruh butir pernyataan.", "error");
            return;
        }
    }

    const materialData: GuidanceMaterial = {
      id: editingMaterial?.id || `mat-${Date.now()}`,
      title: formData.title!,
      category: formData.category as any,
      description: formData.description!,
      discussion: formData.discussion,
      task: formData.task,
      linkUrl: formData.linkUrl,
      dateCreated: editingMaterial?.dateCreated || new Date().toISOString(),
      isQuestionnaire: formData.isQuestionnaire,
      qTitle: formData.qTitle,
      qType: formData.qType,
      qItemCount: formData.qItemCount,
      qOptionCount: formData.qOptionCount,
      qCalculation: formData.qCalculation,
      qItems: formData.qItems,
      qReverseItems: formData.qReverseItems,
      qAdjectives: formData.qAdjectives,
      qMbtiOptions: formData.qMbtiOptions,
      isInstrumentActive: formData.isInstrumentActive
    };

    setMaterials(prev => editingMaterial ? prev.map(m => m.id === editingMaterial.id ? materialData : m) : [materialData, ...prev]);
    setIsModalOpen(false);
    notify(editingMaterial ? "Modul diperbarui." : "Modul baru ditambahkan.");
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => (activeCategory === 'Semua' || m.category === activeCategory) && m.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [materials, activeCategory, searchTerm]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(start, start + itemsPerPage);
  }, [filteredMaterials, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Repository Instrumen & Materi</h2>
          <p className="text-slate-500 text-sm">Kelola modul bimbingan and instrumen asesmen psikologis mandiri.</p>
        </div>
        {canManage && (
          <button onClick={handleOpenAdd} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            Materi/Angket Baru
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border shadow-sm">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {['Semua', ...categories].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{cat}</button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
           <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
           <input type="text" placeholder="Cari judul..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedMaterials.map(mat => (
            <div key={mat.id} onClick={() => setViewingMaterial(mat)} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer overflow-hidden flex flex-col">
               <div className={`h-1.5 bg-teal-500 group-hover:h-2 transition-all`} />
               <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{mat.category}</span>
                        {mat.isQuestionnaire && <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Skala {mat.qType}</span>}
                     </div>
                     {canManage && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => handleOpenEdit(e, mat)} className="p-2 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Hapus materi ini?')) setMaterials(prev => prev.filter(x => x.id !== mat.id)); }} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                       </div>
                     )}
                  </div>
                  <h4 className="text-xl font-black text-slate-800 leading-tight mb-3 italic">{mat.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3 mb-6">"{mat.description}"</p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-teal-600 uppercase">
                     <span>Buka Modul</span>
                     <span>→</span>
                  </div>
               </div>
            </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-8 py-4 rounded-[2rem] border shadow-sm">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Halaman {currentPage} dari {totalPages}
           </div>
           <div className="flex gap-2">
              <button 
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="p-2 rounded-xl border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all active:scale-95"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="p-2 rounded-xl border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all active:scale-95"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col border border-white/20 max-h-[90dvh]">
              <header className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic">{editingMaterial ? 'Edit Konten Modul' : 'Buat Modul & Instrumen'}</h3>
                    <p className="text-slate-400 text-xs mt-1">Konfigurasikan materi bimbingan atau instrumen angket psikologis.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </header>
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
                 {/* Detail Dasar */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[2rem] border">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Judul Utama</label>
                       <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bidang Layanan</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deskripsi Singkat</label>
                       <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold h-20 resize-none outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                 </div>

                 {/* Pengaturan Angket */}
                 <div className="bg-orange-50/50 rounded-[2.5rem] border border-orange-100 overflow-hidden shadow-sm">
                    <div className="p-6 flex items-center justify-between bg-orange-100/50 border-b border-orange-100">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 2h6"/><path d="m9 12 2 2 4-4"/></svg></div>
                          <h4 className="text-sm font-black text-orange-900 uppercase">Aktivasi Instrumen Angket</h4>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={formData.isQuestionnaire} onChange={e => setFormData({...formData, isQuestionnaire: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                       </label>
                    </div>

                    {formData.isQuestionnaire && (
                       <div className="p-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div className="lg:col-span-2 space-y-1.5">
                                <label className="text-[9px] font-black text-orange-700 uppercase px-1">Pilih Tipe Skala</label>
                                <select 
                                  className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-xs font-bold" 
                                  value={formData.qType} 
                                  onChange={e => {
                                    const val = e.target.value as QuestionnaireType;
                                    let options = formData.qOptionCount || 5;
                                    
                                    if (val === 'Likert') options = 5;
                                    else if (val === 'Guttman') options = 2;
                                    else if (val === 'Rating') options = 4;
                                    else if (val === 'Essay') options = 0;
                                    else if (val === 'MBTI') options = 2;
                                    
                                    setFormData({...formData, qType: val, qOptionCount: options});
                                  }}
                                >
                                   {questionnaireTypes.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-orange-700 uppercase px-1">Jumlah Butir</label>
                                <input type="number" className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-xs font-bold" value={formData.qItemCount} onChange={e => setFormData({...formData, qItemCount: Math.max(0, parseInt(e.target.value) || 0)})} />
                             </div>
                             {formData.qType !== 'Essay' && formData.qType !== 'MBTI' && (
                               <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-orange-700 uppercase px-1">Skala Pilihan</label>
                                  <input type="number" disabled={formData.qType === 'Guttman'} className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50" value={formData.qOptionCount} onChange={e => setFormData({...formData, qOptionCount: parseInt(e.target.value) || 0})} />
                               </div>
                             )}
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-orange-700 uppercase tracking-widest">
                                    {formData.qType === 'MBTI' ? 'Konfigurasi Butir MBTI (Forced Choice)' : `Daftar Pertanyaan / Pernyataan ${formData.qType === 'Semantic' ? '& Pasangan Adjective' : ''}`}
                                </label>
                                {formData.qType === 'MBTI' && (
                                    <button 
                                        type="button" 
                                        onClick={handleLoadMbtiTemplate}
                                        className="text-[9px] font-black uppercase text-teal-600 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-50"
                                    >
                                        Muat Template MBTI
                                    </button>
                                )}
                             </div>
                             
                             {formData.qType === 'MBTI' ? (
                                <div className="space-y-4">
                                    {formData.qMbtiOptions?.map((opt, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-black text-xs">{idx + 1}</span>
                                                <select 
                                                    className="bg-slate-50 border rounded-lg px-3 py-1 text-[10px] font-black uppercase text-violet-600"
                                                    value={opt.dimension}
                                                    onChange={e => {
                                                        const n = [...(formData.qMbtiOptions || [])];
                                                        n[idx] = { ...n[idx], dimension: e.target.value as any };
                                                        setFormData({...formData, qMbtiOptions: n});
                                                    }}
                                                >
                                                    <option value="EI">E vs I</option>
                                                    <option value="SN">S vs N</option>
                                                    <option value="TF">T vs F</option>
                                                    <option value="JP">J vs P</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Opsi A (Skor Kiri)</label>
                                                    <textarea className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold h-20 resize-none" placeholder="Misal: Saya suka keramaian" value={opt.a} onChange={e => { const n = [...(formData.qMbtiOptions || [])]; n[idx] = { ...n[idx], a: e.target.value }; setFormData({...formData, qMbtiOptions: n}); }} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Opsi B (Skor Kanan)</label>
                                                    <textarea className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold h-20 resize-none" placeholder="Misal: Saya suka ketenangan" value={opt.b} onChange={e => { const n = [...(formData.qMbtiOptions || [])]; n[idx] = { ...n[idx], b: e.target.value }; setFormData({...formData, qMbtiOptions: n}); }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <div className="space-y-3">
                                    {formData.qItems?.map((item, idx) => {
                                       const isReverse = formData.qReverseItems?.includes(idx);
                                       return (
                                       <div key={idx} className={`bg-white p-4 rounded-2xl border ${isReverse && formData.qType !== 'Essay' ? 'border-rose-200 ring-2 ring-rose-50' : 'border-orange-100'} shadow-sm flex flex-col md:flex-row gap-4 transition-all`}>
                                          <div className="flex gap-3 flex-1">
                                             <button type="button" onClick={() => formData.qType !== 'Essay' && handleToggleReverse(idx)} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-all ${isReverse && formData.qType !== 'Essay' ? 'bg-rose-600 text-white shadow-lg' : 'bg-orange-100 text-orange-600'}`}>
                                                {idx + 1}
                                             </button>
                                             <textarea className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none resize-none min-h-[40px]" placeholder={formData.qType === 'Essay' ? "Tuliskan pertanyaan terbuka..." : "Isi pernyataan..."} value={item} onChange={e => { const n = [...(formData.qItems || [])]; n[idx] = e.target.value; setFormData({...formData, qItems: n}); }} />
                                          </div>
                                          {formData.qType === 'Semantic' && (
                                             <div className="flex items-center gap-2 shrink-0 bg-slate-50 p-2 rounded-xl border">
                                                <input className="w-20 bg-white border rounded-lg px-2 py-1 text-[10px] font-bold outline-none" placeholder="Kiri..." value={formData.qAdjectives?.[idx]?.left || ''} onChange={e => { const n = [...(formData.qAdjectives || [])]; n[idx] = { ...n[idx], left: e.target.value }; setFormData({...formData, qAdjectives: n}); }} />
                                                <span className="text-[10px] font-black text-slate-300">VS</span>
                                                <input className="w-20 bg-white border rounded-lg px-2 py-1 text-[10px] font-bold outline-none" placeholder="Kanan..." value={formData.qAdjectives?.[idx]?.right || ''} onChange={e => { const n = [...(formData.qAdjectives || [])]; n[idx] = { ...n[idx], right: e.target.value }; setFormData({...formData, qAdjectives: n}); }} />
                                             </div>
                                          )}
                                          {formData.qType !== 'Essay' && (
                                            <div className="flex items-center md:border-l md:pl-4">
                                                <button type="button" onClick={() => handleToggleReverse(idx)} className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${isReverse ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
                                                  {isReverse ? 'Negatif' : 'Positif'}
                                                </button>
                                            </div>
                                          )}
                                       </div>
                                    )})}
                                </div>
                             )}
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black text-orange-700 uppercase tracking-widest px-1">Panduan Interpretasi / Catatan {formData.qType === 'Essay' || formData.qType === 'MBTI' ? 'Kualitatif' : 'Perhitungan Skor'}</label>
                             <textarea className="w-full bg-white border border-orange-200 rounded-xl px-5 py-4 text-xs font-bold h-28 resize-none outline-none" placeholder={formData.qType === 'Essay' ? "Contoh: Respon akan dianalisis untuk memetakan minat karir siswa..." : "Contoh: Skor > 20 dikategorikan Motivasi Tinggi. Rumus: (P1+P2)/2 ..."} value={formData.qCalculation} onChange={e => setFormData({...formData, qCalculation: e.target.value})} />
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest px-1">Isi Pembahasan Modul (Lengkap)</label>
                       <textarea className="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-48 resize-none outline-none focus:ring-4 focus:ring-teal-100" value={formData.discussion} onChange={e => setFormData({...formData, discussion: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Tugas / Action Plan</label>
                       <textarea className="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-32 resize-none outline-none focus:ring-4 focus:ring-emerald-100" value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} />
                    </div>
                 </div>
              </form>
              <footer className="p-8 border-t bg-white flex justify-end gap-3 shrink-0">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Batal</button>
                 <button onClick={handleSave} className="px-12 py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-teal-700 active:scale-95 transition-all">Simpan Database</button>
              </footer>
           </div>
        </div>
      )}

      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
              <header className="p-10 bg-slate-900 text-white shrink-0 flex justify-between items-start relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5"><ICONS.Sparkles /></div>
                 <div className="relative z-10">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block mb-4">{viewingMaterial.category}</span>
                    <h3 className="text-3xl font-black italic tracking-tighter leading-tight max-w-xl">{viewingMaterial.title}</h3>
                 </div>
                 <button onClick={() => setViewingMaterial(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all relative z-10"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </header>
              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                 {viewingMaterial.isQuestionnaire && (
                    <section className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
                       <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-6 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>Spesifikasi Instrumen {viewingMaterial.qType}</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">{viewingMaterial.qType === 'Essay' || viewingMaterial.qType === 'MBTI' ? 'Panduan Analisis' : 'Algoritma Perhitungan Skor'}</p><p className="text-xs font-bold text-slate-700 italic">"{viewingMaterial.qCalculation}"</p></div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-xl border text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Butir</p><p className="text-xl font-black text-slate-800">{viewingMaterial.qItemCount}</p></div>
                             <div className="bg-slate-50 p-4 rounded-xl border text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">{viewingMaterial.qType === 'Essay' || viewingMaterial.qType === 'MBTI' ? 'Format' : 'Negatif'}</p><p className={`text-xl font-black ${viewingMaterial.qType === 'Essay' || viewingMaterial.qType === 'MBTI' ? 'text-teal-600' : 'text-rose-600'}`}>{viewingMaterial.qType === 'Essay' || viewingMaterial.qType === 'MBTI' ? 'Pilihan' : (viewingMaterial.qReverseItems?.length || 0)}</p></div>
                          </div>
                       </div>
                       
                       <div className="mt-6 border-t border-orange-100 pt-6">
                          <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Daftar Pertanyaan / Pernyataan</h4>
                          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                             {viewingMaterial.qType === 'MBTI' ? (
                                viewingMaterial.qMbtiOptions?.map((opt, i) => (
                                   <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                                      <span className="font-bold text-teal-600 mr-2">{i+1}.</span>
                                      <div className="ml-6 grid grid-cols-2 gap-4 mt-1">
                                         <div className="p-2 bg-white rounded border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase block">Opsi A</span>{opt.a}</div>
                                         <div className="p-2 bg-white rounded border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase block">Opsi B</span>{opt.b}</div>
                                      </div>
                                   </div>
                                ))
                             ) : (
                                viewingMaterial.qItems?.map((item, i) => (
                                   <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                                      <span className="font-bold text-teal-600 shrink-0">{i+1}.</span>
                                      <div>
                                         <p>{item}</p>
                                         {viewingMaterial.qType === 'Semantic' && viewingMaterial.qAdjectives && (
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold">
                                               {viewingMaterial.qAdjectives[i]?.left} {'<->'} {viewingMaterial.qAdjectives[i]?.right}
                                            </p>
                                         )}
                                      </div>
                                   </div>
                                ))
                             )}
                             {((viewingMaterial.qType === 'MBTI' && (!viewingMaterial.qMbtiOptions || viewingMaterial.qMbtiOptions.length === 0)) || 
                               (viewingMaterial.qType !== 'MBTI' && (!viewingMaterial.qItems || viewingMaterial.qItems.length === 0))) && (
                                <p className="text-center text-slate-400 text-xs italic">Belum ada butir pertanyaan yang diinput.</p>
                             )}
                          </div>
                       </div>
                    </section>
                 )}
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">I. Pembahasan Materi</h4>
                    <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewingMaterial.discussion || 'Belum ada isi materi.'}</p>
                 </section>
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">II. Instruksi Tugas</h4>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-emerald-800 text-sm font-bold italic leading-relaxed">"{viewingMaterial.task || 'Belum ada instruksi tugas.'}"</div>
                 </section>
              </div>
              <footer className="p-8 border-t bg-white flex justify-end shrink-0">
                 <button onClick={() => setViewingMaterial(null)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Tutup Modul</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuidanceMaterials;
