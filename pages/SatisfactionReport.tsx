import React, { useState, useMemo, useEffect } from 'react';
import { SatisfactionFeedback, Assignment, Rombel, Student, UserRole, SchoolProfile } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';

interface SatisfactionReportProps {
  feedbacks: SatisfactionFeedback[];
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  rombels: Rombel[];
  students: Student[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
}

const SatisfactionReport: React.FC<SatisfactionReportProps & { schoolProfile: SchoolProfile }> = ({ 
  feedbacks, assignments, setAssignments, rombels, students, notify, userRole, schoolProfile 
}) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const isSuperAdmin = userRole === 'super_admin';
  const isPrincipal = userRole === 'principal';
  const isCounselor = userRole === 'counselor';
  
  // LOGIKA FILTER VIEW (Melihat Laporan)
  // Kepsek bisa lihat keduanya, Konselor hanya BK
  const [filterSource, setFilterSource] = useState<'All' | 'BK' | 'Sekolah'>(
    isCounselor ? 'BK' : 'All'
  );
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  
  // Form State for new collection session
  const [targetType, setTargetType] = useState<'Rombel' | 'Individu'>('Rombel');
  const [targetId, setTargetId] = useState('');
  
  // LOGIKA SOURCE PENILAIAN (Mengatur Sesi Baru)
  // Default berdasarkan role
  const [collectSource, setCollectSource] = useState<'BK' | 'Sekolah'>(
    isPrincipal ? 'Sekolah' : 'BK'
  );

  // Sinkronisasi default jika user role terdeteksi
  useEffect(() => {
    if (isPrincipal) {
      setCollectSource('Sekolah');
    } else if (isCounselor) {
      setCollectSource('BK');
      setFilterSource('BK'); // Konselor dikunci ke view BK
    }
  }, [userRole, isPrincipal, isCounselor]);

  const canManage = isSuperAdmin || isCounselor || isPrincipal;

  const filteredData = useMemo(() => {
    return feedbacks.filter(f => f.serviceSource === filterSource);
  }, [feedbacks, filterSource]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSource]);

  const activeCollections = useMemo(() => {
    return assignments.filter(a => {
      const isSat = a.type === 'Satisfaction' && a.status === 'Aktif';
      if (!isSat) return false;
      
      // Filter sesi yang muncul di list "Aktif" berdasarkan role
      if (isCounselor) return a.satisfactionType === 'BK';
      // Kepsek & Admin bisa lihat semua sesi aktif
      return true;
    });
  }, [assignments, isCounselor]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const sum = filteredData.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = (sum / filteredData.length).toFixed(1);
    
    const ratingDist = [
      { name: 'Sangat Puas', value: filteredData.filter(f => f.rating === 5).length, color: '#10b981' },
      { name: 'Puas', value: filteredData.filter(f => f.rating === 4).length, color: '#3b82f6' },
      { name: 'Cukup', value: filteredData.filter(f => f.rating === 3).length, color: '#f59e0b' },
      { name: 'Kurang', value: filteredData.filter(f => f.rating === 2).length, color: '#f97316' },
      { name: 'Buruk', value: filteredData.filter(f => f.rating === 1).length, color: '#ef4444' }
    ];

    const categoryDist: Record<string, number> = {};
    filteredData.forEach(f => {
      categoryDist[f.category] = (categoryDist[f.category] || 0) + 1;
    });

    const uniqueRespondersCount = new Set(filteredData.map(f => f.studentId)).size;

    return {
      avg,
      total: uniqueRespondersCount,
      ratingDist,
      categoryStats: Object.entries(categoryDist).map(([name, value]) => ({ name, value }))
    };
  }, [filteredData]);

  const handleOpenCollection = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId) {
      notify("Silakan pilih target pengisian (Kelas/Siswa).", "error");
      return;
    }

    // Double Check Wewenang
    if (isPrincipal && collectSource === 'BK') {
      notify("Kepala Sekolah hanya diizinkan mengatur survei Layanan Sekolah.", "error");
      return;
    }
    if (isCounselor && collectSource === 'Sekolah') {
      notify("Konselor hanya diizinkan mengatur survei Layanan BK.", "error");
      return;
    }

    const newAssignment: Assignment = {
      id: `sat-task-${Date.now()}`,
      title: `Penilaian Kepuasan ${collectSource === 'BK' ? 'Layanan BK' : 'Layanan Sekolah'}`,
      type: 'Satisfaction',
      satisfactionType: collectSource,
      category: collectSource === 'BK' ? 'Pribadi' : 'Sosial',
      instructions: collectSource === 'BK' 
        ? "Bimbingan kami butuh masukan Anda. Mohon isi penilaian ini dengan jujur."
        : "Mohon berikan penilaian Anda mengenai fasilitas dan kenyamanan sekolah.",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      targetType: targetType,
      targetId: targetId,
      status: 'Aktif',
      dateCreated: new Date().toISOString()
    };

    setAssignments(prev => [newAssignment, ...prev]);
    setIsManageModalOpen(false);
    notify(`Akses pengisian ${collectSource} telah dibuka untuk target terpilih.`, "success");
  };

  const stopCollection = (id: string) => {
    const task = assignments.find(a => a.id === id);
    // Proteksi penghentian sesi
    if (isPrincipal && task?.satisfactionType === 'BK') {
      notify("Anda tidak berwenang menutup kuesioner layanan BK.", "error");
      return;
    }
    if (isCounselor && task?.satisfactionType === 'Sekolah') {
      notify("Anda tidak berwenang menutup kuesioner layanan sekolah.", "error");
      return;
    }
    
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'Selesai' } : a));
    notify("Akses pengisian ditutup.");
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const doc = new jsPDF('portrait');
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("LAPORAN ANALISIS KEPUASAN LAYANAN", 105, startY + 5, { align: 'center' });
    doc.setFontSize(11); doc.setFont("times", "normal");
    doc.text(`Sumber: ${filterSource === 'All' ? 'Semua Layanan' : filterSource}`, 105, startY + 11, { align: 'center' });
    doc.text(`Rata-rata Skor: ${stats?.avg}/5.0 | Responden: ${stats?.total} Siswa`, 105, startY + 17, { align: 'center' });

    autoTable(doc, {
      startY: startY + 25,
      head: [['No', 'Nama Siswa (Inisial)', 'Layanan', 'Rating', 'Komentar']],
      body: filteredData.map((f, idx) => [
        idx + 1,
        getInitials(f.studentName),
        f.serviceSource,
        f.rating,
        f.comment || '-'
      ]),
      styles: { font: 'times', fontSize: 9 },
      headStyles: { fillColor: [63, 81, 181] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 240 ? 30 : finalY;
    if (finalY > 240) doc.addPage();

    doc.text("Mengetahui,", 30, signY);
    doc.text("Kepala Sekolah,", 30, signY + 5);
    doc.text(schoolProfile.principalName, 30, signY + 30);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 30, signY + 35);

    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, signY);
    doc.text("Guru BK / Konselor,", 140, signY + 5);
    doc.text(schoolProfile.counselorName, 140, signY + 30);
    doc.text(`NIP. ${schoolProfile.counselorNip}`, 140, signY + 35);

    doc.save(`Laporan_Kepuasan_${filterSource}_${Date.now()}.pdf`);
    notify("Laporan kepuasan berhasil diunduh.", "success");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analisis Kepuasan Pelanggan</h2>
          <p className="text-slate-500 text-sm">Monitoring persepsi kepuasan siswa terhadap kualitas bimbingan dan fasilitas sekolah.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {canManage && (
              <div className="flex gap-2">
                <button 
                  onClick={handleExportPDF}
                  className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  PDF
                </button>
                <button 
                  onClick={() => setIsManageModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Atur Survei Baru
                </button>
              </div>
            )}
            
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
              {(isSuperAdmin || isPrincipal) && (
                <button 
                  onClick={() => setFilterSource('All')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterSource === 'All' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Semua
                </button>
              )}
              
              {(isSuperAdmin || isPrincipal || isCounselor) && (
                <button 
                  onClick={() => setFilterSource('BK')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterSource === 'BK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Layanan BK
                </button>
              )}

              {(isSuperAdmin || isPrincipal) && (
                <button 
                  onClick={() => setFilterSource('Sekolah')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterSource === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Layanan Sekolah
                </button>
              )}
            </div>
        </div>
      </header>

      {/* Sesi Pengisian Aktif */}
      {canManage && activeCollections.length > 0 && (
        <div className={`p-6 rounded-[2.5rem] space-y-4 ${isPrincipal ? 'bg-emerald-50 border border-emerald-100' : 'bg-indigo-50 border border-indigo-100'}`}>
          <div className="flex items-center justify-between px-2">
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${isPrincipal ? 'text-emerald-500' : 'text-indigo-400'}`}>
               Survei Aktif ({isPrincipal ? 'Layanan Sekolah' : isCounselor ? 'Layanan BK' : 'Semua'})
            </h4>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isPrincipal ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
          </div>
          <div className="flex flex-wrap gap-3">
             {activeCollections.map(a => (
               <div key={a.id} className="bg-white px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-4 animate-in slide-in-from-left-2">
                  <div>
                    <p className={`text-[10px] font-black uppercase ${a.satisfactionType === 'Sekolah' ? 'text-emerald-600' : 'text-indigo-600'}`}>{a.satisfactionType} - {a.targetType === 'Rombel' ? rombels.find(r => r.id === a.targetId)?.name : 'Individu'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Hingga: {new Date(a.dueDate).toLocaleDateString('id-ID')}</p>
                  </div>
                  <button onClick={() => stopCollection(a.id)} className="text-rose-500 hover:text-rose-700 transition-colors" title="Tutup Akses">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </button>
               </div>
             ))}
          </div>
        </div>
      )}

      {filteredData.length === 0 ? (
        <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
           <p className="text-slate-400 font-bold italic">Belum ada data umpan balik pelanggan yang masuk untuk kategori ini.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className={`${filterSource === 'Sekolah' ? 'bg-emerald-600' : filterSource === 'BK' ? 'bg-indigo-600' : 'bg-slate-800'} p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between transition-colors duration-500`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Rata-rata Skor {filterSource === 'All' ? 'Sekolah' : filterSource}</p>
                <h3 className="text-5xl font-black my-2">{stats?.avg}</h3>
                <div className="flex gap-0.5 text-amber-300">
                   {[1,2,3,4,5].map(s => (
                     <svg key={s} width="16" height="16" fill={Number(stats?.avg) >= s ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                   ))}
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responden Siswa</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.total}</h3>
                <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Siswa Berpartisipasi</p>
             </div>
             <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribusi Rating</h4>
                <div className="h-[120px]">
                   <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={stats?.ratingDist}>
                         <XAxis dataKey="name" hide />
                         <YAxis hide />
                         <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '10px'}} />
                         <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {stats?.ratingDist.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8 italic">Ulasan Langsung Siswa</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4 flex-1">
                   {paginatedFeedbacks.map(f => (
                     <div key={f.id} className={`p-6 rounded-2xl border space-y-3 transition-colors ${f.serviceSource === 'Sekolah' ? 'bg-emerald-50/20 border-emerald-50' : 'bg-indigo-50/20 border-indigo-50'}`}>
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${f.serviceSource === 'Sekolah' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>{getInitials(f.studentName).charAt(0)}</div>
                              <div>
                                 <p className="text-xs font-black text-slate-800">{getInitials(f.studentName)}</p>
                                 <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${f.serviceSource === 'Sekolah' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{f.serviceSource}</span>
                              </div>
                           </div>
                           <div className="flex gap-0.5 text-amber-400">
                              {Array.from({ length: f.rating }).map((_, i) => (
                                <svg key={i} width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                              ))}
                           </div>
                        </div>
                        <p className="text-xs text-slate-600 italic font-medium leading-relaxed">"{f.comment || 'Tanpa komentar.'}"</p>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                           <span className="text-[9px] font-black text-slate-400 uppercase">{f.category}</span>
                           <span className="text-[8px] font-bold text-slate-300">{new Date(f.date).toLocaleDateString('id-ID')}</span>
                        </div>
                     </div>
                   ))}
                </div>
                {totalPages > 1 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                       <p className="text-[10px] text-slate-400 font-bold uppercase">
                          Halaman {currentPage} / {totalPages}
                       </p>
                       <div className="flex gap-1">
                          <button 
                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                             disabled={currentPage === 1}
                             className="p-1.5 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                          </button>
                          <button 
                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                             disabled={currentPage === totalPages}
                             className="p-1.5 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                       </div>
                    </div>
                 )}
             </div>

             <div className="space-y-8">
               <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8 italic">Analisis Topik</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={stats?.categoryStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px'}} />
                          <Bar dataKey="value" fill={filterSource === 'Sekolah' ? '#059669' : '#4f46e5'} radius={[0, 8, 8, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className={`p-8 rounded-[3rem] border shadow-sm transition-all duration-500 ${filterSource === 'Sekolah' ? 'bg-emerald-900 border-emerald-800' : 'bg-indigo-900 border-indigo-800'}`}>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-white opacity-40">Insight Eksekutif</h5>
                  <p className="text-sm font-bold leading-relaxed italic text-white">
                    "Tingkat kepuasan rata-rata untuk {filterSource === 'All' ? 'seluruh layanan' : filterSource} berada pada angka {stats?.avg}/5.0. 
                    Monitor topik dengan jumlah respon negatif terendah untuk perbaikan strategi bimbingan atau sekolah."
                  </p>
               </div>
             </div>
          </div>
        </>
      )}

      {/* Modal Kontrol Akses (Hanya untuk yang punya hak manage) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
              <header className={`p-8 ${collectSource === 'Sekolah' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white shrink-0 transition-colors`}>
                 <h3 className="text-xl font-black uppercase tracking-tight italic">Aktifkan Survei Kepuasan</h3>
                 <p className="text-white/80 text-xs mt-1">Buka akses pengisian kuesioner bagi siswa terpilih.</p>
              </header>
              <form onSubmit={handleOpenCollection} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sumber Penilaian</label>
                    <div className="grid grid-cols-2 gap-2">
                       {/* Opsi BK - Hanya Admin & Konselor */}
                       {(isSuperAdmin || isCounselor) ? (
                         <button 
                          type="button" 
                          onClick={() => setCollectSource('BK')} 
                          className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${collectSource === 'BK' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                         >
                          Layanan BK
                         </button>
                       ) : (
                         <div className="py-4 rounded-2xl text-[10px] font-black uppercase bg-slate-100 text-slate-300 border border-slate-100 flex items-center justify-center cursor-not-allowed opacity-50">
                           Layanan BK
                         </div>
                       )}

                       {/* Opsi Sekolah - Hanya Admin & Kepsek */}
                       {(isSuperAdmin || isPrincipal) ? (
                         <button 
                          type="button" 
                          onClick={() => setCollectSource('Sekolah')} 
                          className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${collectSource === 'Sekolah' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                         >
                          Layanan Sekolah
                         </button>
                       ) : (
                         <div className="py-4 rounded-2xl text-[10px] font-black uppercase bg-slate-100 text-slate-300 border border-slate-100 flex items-center justify-center cursor-not-allowed opacity-50">
                           Layanan Sekolah
                         </div>
                       )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold italic px-1">
                      {isPrincipal ? "*Wewenang Anda: Mengelola Kepuasan Layanan Sekolah." : isCounselor ? "*Wewenang Anda: Mengelola Kepuasan Layanan BK." : "*Wewenang Anda: Mengelola Seluruh Layanan."}
                    </p>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Siswa</label>
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-3">
                       <button type="button" onClick={() => { setTargetType('Rombel'); setTargetId(''); }} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${targetType === 'Rombel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Per Kelas</button>
                       <button type="button" onClick={() => { setTargetType('Individu'); setTargetId(''); }} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${targetType === 'Individu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Per Siswa</button>
                    </div>
                    <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={targetId} onChange={e => setTargetId(e.target.value)}>
                        <option value="">-- Pilih {targetType} --</option>
                        {targetType === 'Rombel' 
                          ? rombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                          : students.filter(s => s.status === 'Aktif').map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.class})</option>)
                        }
                    </select>
                 </div>

                 <div className="flex gap-4 pt-4 border-t">
                    <button type="button" onClick={() => setIsManageModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
                    <button type="submit" className={`flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all ${collectSource === 'Sekolah' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                       Buka Akses Pengisian
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SatisfactionReport;
