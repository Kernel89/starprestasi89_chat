
import React, { useState, useMemo } from 'react';
import { QuestionnaireSubmission, Student, Rombel, Assignment, SchoolProfile, CounselorProfileData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import Letterhead from '../components/Letterhead';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
// Import ICONS from constants file
import { ICONS } from '../constants';

const MBTI_DESCRIPTIONS: Record<string, { title: string, desc: string, color: string }> = {
  'INTJ': { title: 'Arsitek', desc: 'Pemikir strategis dengan rencana untuk segala hal.', color: '#4f46e5' },
  'INTP': { title: 'Ahli Logika', desc: 'Penemu kreatif dengan haus akan pengetahuan.', color: '#6366f1' },
  'ENTJ': { title: 'Komandan', desc: 'Pemimpin yang berani dan penuh imajinasi.', color: '#4338ca' },
  'ENTP': { title: 'Pendebat', desc: 'Pemikir cerdas yang tidak bisa menolak tantangan intelektual.', color: '#3730a3' },
  'INFJ': { title: 'Advokat', desc: 'Pendiam dan mistis, namun inspirator yang tak kenal lelah.', color: '#8b5cf6' },
  'INFP': { title: 'Mediator', desc: 'Orang yang puitis, baik hati, dan altruistik.', color: '#a78bfa' },
  'ENFJ': { title: 'Protagonis', desc: 'Pemimpin karismatik yang mampu memukau pendengar.', color: '#7c3aed' },
  'ENFP': { title: 'Juru Kampanye', desc: 'Semangat bebas yang antusias dan kreatif.', color: '#6d28d9' },
  'ISTJ': { title: 'Logistik', desc: 'Praktis dan mengutamakan fakta.', color: '#0d9488' },
  'ISFJ': { title: 'Pembela', desc: 'Pelindung yang sangat berdedikasi dan hangat.', color: '#0f766e' },
  'ESTJ': { title: 'Eksekutif', desc: 'Administrator cakap, tak tertandingi dalam mengelola sesuatu.', color: '#115e59' },
  'ESFJ': { title: 'Konsul', desc: 'Orang yang sangat peduli, sosial, dan populer.', color: '#134e4a' },
  'ISTP': { title: 'Virtuoso', desc: 'Eksperimen yang berani dan praktis.', color: '#059669' },
  'ISFP': { title: 'Petualang', desc: 'Seniman fleksibel yang selalu siap mencoba hal baru.', color: '#10b981' },
  'ESTP': { title: 'Pengusaha', desc: 'Orang yang cerdas, energik, dan perseptif.', color: '#047857' },
  'ESFP': { title: 'Penghibur', desc: 'Orang yang spontan, energik, dan antusias.', color: '#065f46' }
};

// Fixed the missing MbtiReportProps interface
interface MbtiReportProps {
  submissions: QuestionnaireSubmission[];
  students: Student[];
  rombels: Rombel[];
  assignments: Assignment[];
  schoolProfile: SchoolProfile;
  counselorProfile: CounselorProfileData;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  setSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  userRole?: string;
}

const MbtiReport: React.FC<MbtiReportProps> = ({ submissions, setSubmissions, students, rombels, assignments, schoolProfile, counselorProfile, notify, userRole }) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const [selectedClass, setSelectedClass] = useState('Semua');
  const [viewingDetail, setViewingDetail] = useState<string | null>(null); // MBTI Code

  const mbtiSubmissions = useMemo(() => {
    return submissions.filter(s => s.mbtiResult && s.mbtiResult.length === 4);
  }, [submissions]);

  const filteredResults = useMemo(() => {
    let list = mbtiSubmissions.map(sub => {
      const student = students.find(s => s.id === sub.studentId);
      return {
        ...sub,
        studentName: student?.name || 'Siswa Terhapus',
        studentClass: student ? `${student.grade}-${student.class}` : 'Tanpa Kelas',
        rawClassName: student ? `${student.grade} ${student.class}`.toUpperCase() : ''
      };
    });

    if (selectedClass !== 'Semua') {
      list = list.filter(item => item.rawClassName.includes(selectedClass.toUpperCase()));
    }

    return list.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [mbtiSubmissions, students, selectedClass]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(MBTI_DESCRIPTIONS).forEach(code => counts[code] = 0);
    
    filteredResults.forEach(r => {
      if (r.mbtiResult) counts[r.mbtiResult] = (counts[r.mbtiResult] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: MBTI_DESCRIPTIONS[name].color }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredResults]);

  const handlePrintPDF = () => {
    const doc = new jsPDF('landscape');
    const periodStr = selectedClass === 'Semua' ? 'Seluruh Kelas' : `Kelas: ${selectedClass}`;

    const startY = drawLetterhead(doc, schoolProfile, 'l');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text(`LAPORAN HASIL TES KEPRIBADIAN MBTI (MYERS-BRIGGS TYPE INDICATOR)`, 148.5, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.setFont("times", "normal");
    doc.text(periodStr, 148.5, startY + 10, { align: 'center' });

    autoTable(doc, {
      startY: startY + 20,
      head: [['No', 'Nama Siswa (Inisial)', 'Tgl Tes', 'Hasil MBTI', 'Karakter Utama']],
      body: filteredResults.map((r, i) => [
        i + 1, 
        r.studentName.toUpperCase(),
        new Date(r.date).toLocaleDateString('id-ID'),
        r.mbtiResult || '-',
        MBTI_DESCRIPTIONS[r.mbtiResult || '']?.title || '-'
      ]),
      styles: { font: 'times', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [13, 148, 136], halign: 'center' },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 },
        3: { fontStyle: 'bold', halign: 'center' } // MBTI Result column is now at index 3
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 170 ? 30 : finalY;
    if (finalY > 170) doc.addPage();
    
    doc.text("Mengetahui,", 40, signY);
    doc.text("Kepala Sekolah,", 40, signY + 5);
    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, signY);
    doc.text("Guru BK / Konselor,", 220, signY + 5);
    
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, signY + 30);
    doc.text(counselorProfile.name || schoolProfile.counselorName, 220, signY + 30);
    doc.setFont("times", "normal"); doc.setFontSize(9);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, signY + 35);
    doc.text(`NIP. ${counselorProfile.nip || '-'}`, 220, signY + 35);

    doc.save(`Laporan_MBTI_${selectedClass.replace(/\s+/g, '_')}.pdf`);
    notify("Laporan MBTI berhasil diunduh.");
  };
  
  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus hasil tes ini? Siswa yang bersangkutan akan dapat mengulang kembali tes MBTI.")) {
        if (setSubmissions) {
            setSubmissions(prev => prev.filter(s => !(s.id === id && s.mbtiResult)));
            notify("Hasil tes MBTI berhasil dihapus.", "success");
        }
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Laporan MBTI Siswa</h2>
          <p className="text-slate-500 text-sm font-medium">Rekapitulasi sebaran tipe kepribadian untuk pemetaan potensi dan konseling.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrintPDF} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                Cetak Rekap (PDF)
            </button>
        </div>
      </header>

      {/* FILTER & STATS SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Laporan</p>
                        <select 
                            className="bg-transparent text-sm font-black text-slate-800 outline-none cursor-pointer"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            <option value="Semua">Semua Kelas</option>
                            {rombels.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Responden</p>
                    <p className="text-2xl font-black text-teal-600">{filteredResults.length} Siswa</p>
                </div>
            </div>

            {/* CHART DISTRIBUTION */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sebaran 16 Tipe Kepribadian</h3>
                    <span className="text-[9px] font-bold text-slate-400">Data Terfilter</span>
                </div>
                <div className="flex-1 w-full min-h-0">
                    {stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc', radius: 8}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                                    {stats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs font-bold">Belum ada data pengisian MBTI untuk kriteria ini.</div>
                    )}
                </div>
            </div>
         </div>

         <div className="lg:col-span-4 bg-teal-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50">Insights</h4>
            <p className="text-xl font-bold leading-relaxed italic">
                "Setiap tipe kepribadian memiliki kekuatan unik. Gunakan data MBTI ini untuk menyesuaikan pendekatan konseling dan saran pengembangan diri siswa."
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300"><ICONS.Sparkles /></div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-teal-300">Data Driven Counseling</p>
                    <p className="text-xs font-medium">Bimbingan berbasis data psikologis.</p>
                </div>
            </div>
         </div>
      </div>

      {/* RESULT LIST TABLE */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Hasil Per Individu</h3>
            <span className="px-3 py-1 bg-white border rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Real-time Data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa (Inisial)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hasil MBTI</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Karakter</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredResults.map((res) => {
                const info = MBTI_DESCRIPTIONS[res.mbtiResult || ''];
                return (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black group-hover:bg-teal-600 group-hover:text-white transition-all shadow-inner">{getInitials(res.studentName).charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{res.studentName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Diisi: {new Date(res.date).toLocaleDateString('id-ID')}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                        <span className="px-4 py-1.5 rounded-xl font-black text-white shadow-lg text-xs italic tracking-tighter" style={{ backgroundColor: info?.color || '#94a3b8' }}>
                            {res.mbtiResult}
                        </span>
                    </td>
                    <td className="px-8 py-5">
                       <p className="font-black text-slate-700 text-xs uppercase tracking-tight italic">{info?.title || '-'}</p>
                       <p className="text-[10px] text-slate-400 truncate max-w-[200px] italic">"{info?.desc || '-'}"</p>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                       <button onClick={() => setViewingDetail(res.mbtiResult || null)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="Lihat Deskripsi Tipe">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                       </button>
                       {(userRole === 'super_admin' || userRole === 'counselor') && (
                        <button onClick={() => handleDelete(res.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Hapus Hasil & Izinkan Remedial">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                       )}
                    </td>
                  </tr>
                );
              })}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-slate-300 italic text-sm font-medium">Belum ada siswa yang menyelesaikan tes MBTI untuk kategori ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL TIPE */}
      {viewingDetail && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
              <header className="p-8 text-white shrink-0 relative overflow-hidden" style={{ backgroundColor: MBTI_DESCRIPTIONS[viewingDetail].color }}>
                 <div className="absolute top-0 right-0 p-8 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                 <h3 className="text-4xl font-black italic tracking-tighter mb-1">{viewingDetail}</h3>
                 <p className="text-white/80 text-base font-black uppercase tracking-widest">{MBTI_DESCRIPTIONS[viewingDetail].title}</p>
                 <button onClick={() => setViewingDetail(null)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </header>
              <div className="p-10 bg-slate-50 space-y-6">
                 <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm leading-relaxed">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profil Kepribadian:</h4>
                    <p className="text-slate-700 font-medium italic">"{MBTI_DESCRIPTIONS[viewingDetail].desc}"</p>
                    <div className="mt-8 space-y-4 text-sm text-slate-600 font-medium leading-loose">
                        <p>Tipe <b>{viewingDetail}</b> dikenal memiliki karakteristik unik dalam memproses informasi dan mengambil keputusan. Dalam konteks sekolah, siswa dengan tipe ini biasanya menunjukkan performa tertentu dalam belajar kelompok maupun mandiri.</p>
                        <p>Konselor disarankan untuk memberikan bimbingan yang sesuai dengan kecenderungan alami siswa agar motivasi berprestasinya tetap terjaga secara optimal.</p>
                    </div>
                 </div>
                 <button onClick={() => setViewingDetail(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl active:scale-95 transition-all">Tutup Deskripsi</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MbtiReport;
