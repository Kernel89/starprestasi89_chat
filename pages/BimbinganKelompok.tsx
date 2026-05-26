
import React, { useState, useMemo } from 'react';
import { Student, GuidanceSession, SchoolProfile, Rombel, Appointment, UserRole, CounselorProfileData, Teacher, UserSession } from '../types';
import Letterhead from '../components/Letterhead';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface BimbinganKelompokProps {
  students: Student[];
  rombels: Rombel[];
  assignedRombels?: Rombel[]; 
  sessions: GuidanceSession[];
  setSessions: React.Dispatch<React.SetStateAction<GuidanceSession[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  counselorProfile?: CounselorProfileData;
  teachers?: Teacher[];
  currentUser?: UserSession;
}

type ServiceNature = 'Bimbingan' | 'Konseling';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4338ca', '#3730a3'];

const BimbinganKelompok: React.FC<BimbinganKelompokProps> = ({ 
  students, 
  rombels, 
  assignedRombels, 
  sessions, 
  setSessions, 
  setAppointments, 
  schoolProfile, 
  notify, 
  userRole, 
  counselorProfile,
  teachers,
  currentUser
}) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [activeSession, setActiveSession] = useState<GuidanceSession | null>(null);
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGradeTab, setActiveGradeTab] = useState<'X' | 'XI' | 'XII'>('X');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState({
    studentIds: [] as string[],
    nature: 'Bimbingan' as ServiceNature,
    category: 'Pribadi',
    date: new Date().toISOString().split('T')[0],
    topic: '', 
    objective: '', 
    content: '',
  });

  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';

  // --- LOGIKA FILTER ROMBEL UNTUK KONSELOR ---
  const selectableRombels = useMemo(() => {
    // Jika user bukan konselor (misal Admin), atau data guru tidak ada, tampilkan semua/assigned
    if (userRole !== 'counselor' || !currentUser || !teachers) {
      return assignedRombels || rombels;
    }

    // Cari profil guru yang sesuai dengan user yang login
    const me = teachers.find(t => t.name === currentUser.name);
    
    // Jika profil guru tidak ditemukan, fallback ke semua rombel (atau kosongkan jika ingin ketat)
    if (!me) return rombels;

    // 1. Filter berdasarkan penugasan langsung di Rombel (homeroomTeacherId)
    const directAssignments = rombels.filter(r => r.homeroomTeacherId === me.id);

    // 2. Filter berdasarkan String Penugasan (Misal: "BK Tingkat XII")
    const gradeMatch = me.assignment.match(/Tingkat (X|XI|XII)/i);
    const gradeAssignments = gradeMatch 
      ? rombels.filter(r => r.grade === gradeMatch[1].toUpperCase())
      : [];

    // Gabungkan dan hapus duplikat
    const combined = [...directAssignments, ...gradeAssignments];
    const uniqueMap = new Map(combined.map(r => [r.id, r]));
    const uniqueRombels = Array.from(uniqueMap.values());

    // Jika Konselor belum punya binaan, default tampilkan semua (opsional, bisa diubah jadi [])
    return uniqueRombels.length > 0 ? uniqueRombels : rombels;
  }, [rombels, assignedRombels, userRole, currentUser, teachers]);

  const weeklyChartData = useMemo(() => {
    if (!isPrincipal) return [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySessions = sessions.filter(s => s.type === 'Kelompok' && new Date(s.date) >= weekAgo);
    const counselorStats: Record<string, number> = {};
    weeklySessions.forEach(s => {
      const name = s.counselorName || 'Tidak Teridentifikasi';
      counselorStats[name] = (counselorStats[name] || 0) + 1;
    });
    return Object.entries(counselorStats).map(([name, count]) => ({ name, value: count }));
  }, [sessions, isPrincipal]);

  const getStudentName = (id: string) => (students || []).find(s => s.id === id)?.name || 'Siswa';
  const getStudentData = (id: string) => (students || []).find(s => s.id === id);

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const sanitizeGroupSession = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id && s.topic.includes('Konseling') && s.content !== '[Data Dihapus untuk Privasi]'
        ? { ...s, content: '[Data Dihapus untuk Privasi]', objective: '[Data Dihapus untuk Privasi]' } 
        : s
    ));
  };

  const handleClosePreview = () => {
    if (activeSession && activeSession.topic.includes('Konseling')) {
      sanitizeGroupSession(activeSession.id);
    }
    setActiveSession(null);
  };

  /**
   * Helper: Normalisasi nama kelas agar "Umum 9" sama dengan "Umum 09"
   */
  const normalizeClassString = (str: string) => {
    if (!str) return '';
    const parts = str.trim().toUpperCase().split(/\s+/);
    const lastPart = parts[parts.length - 1];
    if (!isNaN(Number(lastPart))) {
      parts[parts.length - 1] = Number(lastPart).toString().padStart(2, '0');
    }
    return parts.join(' ');
  };

  const filteredStudentsToSelect = useMemo(() => {
    const isCounselingMode = formData.nature === 'Konseling';
    
    if (!isCounselingMode && !selectedRombelId) return [];

    let filtered = (students || []).filter(s => s.status === 'Aktif');

    if (!isCounselingMode) {
      const rombel = rombels.find(r => r.id === selectedRombelId);
      if (!rombel) return [];
      
      const targetGrade = rombel.grade.trim().toUpperCase();
      const rawRombelSuffix = rombel.name.replace(new RegExp(`^${targetGrade}\\s*`, 'i'), '').trim();
      const targetSuffixNormalized = normalizeClassString(rawRombelSuffix);
      
      filtered = filtered.filter(s => {
        const sGrade = (s.grade || '').trim().toUpperCase();
        if (sGrade !== targetGrade) return false;
        const sClassNormalized = normalizeClassString(s.class || '');
        return sClassNormalized === targetSuffixNormalized;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedRombelId, rombels, searchTerm, formData.nature]);

  const handleDownloadPDF = (session: GuidanceSession) => {
    if (session.content === '[Data Dihapus untuk Privasi]') {
      notify("Maaf, detail dinamika sesi ini sudah dihapus demi privasi.", "error");
      return;
    }

    const doc = new jsPDF();
    const isCounseling = session.topic.includes('Konseling');
    
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text(`BERITA ACARA LAYANAN ${isCounseling ? 'KONSELING' : 'BIMBINGAN'} KELOMPOK`, 105, startY + 5, { align: 'center' });
    doc.setFontSize(10); 
    doc.text(`Nomor: BK/GRP/${new Date(session.date).getFullYear()}/${session.id.split('-')[1]}`, 105, startY + 10, { align: 'center' });

    doc.setFontSize(11);
    doc.text("I. INFORMASI UMUM", 20, startY + 21);
    autoTable(doc, {
      startY: startY + 23, theme: 'plain', styles: { font: 'times', fontSize: 11, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } },
      body: [
        ['Topik Bahasan', ':', session.topic.split('] ')[1] || session.topic],
        ['Hari, Tanggal', ':', new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Jumlah Anggota', ':', `${session.studentIds.length} Siswa`],
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("times", "bold"); 
    doc.text("II. DAFTAR ANGGOTA KELOMPOK", 20, currentY);
    
    const studentTableData = session.studentIds.map((id, i) => {
      const s = getStudentData(id);
      const nameToDisplay = isCounseling ? getInitials(s?.name || '-') : (s?.name || '-');
      return [i + 1, nameToDisplay];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['No', 'Nama Siswa']],
      body: studentTableData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 10, cellPadding: 1.5 },
      headStyles: { fillColor: [60, 60, 60], halign: 'center' },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont("times", "bold"); 
    doc.text("III. CATATAN DINAMIKA KELOMPOK", 20, currentY);
    doc.setFont("times", "normal");
    const splitContent = doc.splitTextToSize(session.content, 170);
    doc.text(splitContent, 20, currentY + 7, { align: 'justify' });

    currentY += (splitContent.length * 5) + 30;
    if (currentY > 230) { doc.addPage(); currentY = 30; }
    
    doc.setFont("times", "normal");
    doc.text("Mengetahui,", 40, currentY);
    doc.text("Kepala Sekolah", 40, currentY + 5);
    const placeDate = `${schoolProfile.city || '...............'}, ${new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(placeDate, 140, currentY);
    doc.text("Guru BK / Konselor,", 140, currentY + 5);
    
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, currentY + 35);
    doc.text(session.counselorName || counselorProfile?.name || schoolProfile.counselorName, 140, currentY + 35);
    
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, currentY + 40);
    doc.text(`NIP. ${counselorProfile?.nip || schoolProfile.counselorNip}`, 140, currentY + 40);

    doc.save(`Berita_Acara_Kelompok_${isCounseling ? 'Konseling' : 'Bimbingan'}_${Date.now()}.pdf`);
    notify("Berita acara kelompok berhasil diunduh.");
    if (isCounseling) sanitizeGroupSession(session.id);
  };

  const syncToAgenda = (session: GuidanceSession) => {
    const firstStudent = getStudentData(session.studentIds[0]);
    const groupCount = session.studentIds.length;
    const appointmentId = `apt-sync-${session.id}`;
    const displayName = `${getInitials(firstStudent?.name || 'Siswa')} dkk (${groupCount} Siswa)`;
    const newApt: Appointment = {
      id: appointmentId,
      studentId: session.studentIds[0], 
      studentName: displayName,
      date: session.date.split('T')[0],
      time: new Date(session.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reason: session.topic,
      status: 'Selesai'
    };
    setAppointments(prev => {
      const filtered = prev.filter(a => a.id !== appointmentId);
      return [newApt, ...filtered];
    });
  };

  const handleSave = () => {
    if ((formData.studentIds || []).length < 2) {
      notify("Pilih minimal 2 siswa untuk bimbingan kelompok.", "error");
      return;
    }
    if (!formData.content?.trim()) {
      notify("Isi catatan bimbingan terlebih dahulu.", "error");
      return;
    }
    const fullTopic = `[${formData.nature} ${formData.category}] ${formData.topic || "Dinamika Kelompok"}`;
    const newSession: GuidanceSession = {
      id: `bk-${Date.now()}`,
      type: 'Kelompok',
      date: new Date(formData.date).toISOString(),
      studentIds: formData.studentIds,
      topic: fullTopic,
      objective: formData.objective || "Penyelesaian masalah kelompok",
      content: formData.content,
      urgency: 'Rendah',
      counselorName: counselorProfile?.name || schoolProfile.counselorName,
      gradeAtTime: getStudentData(formData.studentIds[0])?.grade
    };
    setSessions(prev => [newSession, ...(prev || [])]);
    syncToAgenda(newSession);
    setIsAddMode(false);
    setActiveSession(newSession); 
    setFormData({ studentIds: [], nature: 'Bimbingan', category: 'Pribadi', date: new Date().toISOString().split('T')[0], topic: '', objective: '', content: '' });
    setSelectedRombelId('');
    setSearchTerm('');
    notify("Laporan disimpan & Agenda disinkronkan.");
  };

  const mySessions = (sessions || []).filter(s => {
    if (s.type !== 'Kelompok') return false;
    
    const student = getStudentData(s.studentIds[0]);
    if (!student) return false;

    // Filter berdasarkan Tab Kelas yang Aktif
    return student.grade === activeGradeTab;
  });

  const totalPages = Math.ceil(mySessions.length / itemsPerPage);
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return mySessions.slice(start, start + itemsPerPage);
  }, [mySessions, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeGradeTab]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">BK Kelompok</h2>
          <p className="text-slate-400 text-sm font-medium">
            {isPrincipal ? 'Laporan statistik performa konselor mingguan.' : 'Layanan berbasis dinamika kelompok kecil.'}
          </p>
        </div>
        {!isPrincipal && (
          <div className="flex gap-2">
            {!isAddMode && (
              <button onClick={() => setIsAddMode(true)} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Sesi Kelompok Baru
              </button>
            )}
          </div>
        )}
      </header>

      {/* TAB PEMISAH KELAS */}
      {!isAddMode && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit no-print">
          {(['X', 'XI', 'XII'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => setActiveGradeTab(grade)}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeGradeTab === grade 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Kelas {grade}
            </button>
          ))}
        </div>
      )}

      {isPrincipal ? (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan Minggu Ini</p>
                        <p className="text-2xl font-black text-slate-800">{weeklyChartData.reduce((acc, curr) => acc + curr.value, 0)}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
                <div className="mb-8">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Aktivitas Konselor (Kelompok)</h3>
                    <p className="text-xs text-slate-400 font-medium">Distribusi jumlah layanan per akun konselor (7 hari terakhir)</p>
                </div>
                <div className="flex-1 w-full min-h-0">
                    {weeklyChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <PieChart>
                                <Pie data={weeklyChartData} cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {weeklyChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 700}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 italic text-center">
                            <p className="text-xs font-bold uppercase tracking-widest">Belum ada data bimbingan kelompok minggu ini</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      ) : isAddMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 no-print">
          <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[700px]">
             <div className="space-y-4 mb-4">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">Anggota Terpilih</p>
                   <div className="flex items-center gap-2 px-2">
                      <span className="text-2xl font-black text-teal-600">{formData.studentIds.length}</span>
                      <span className="text-xs font-bold text-slate-500">Siswa</span>
                   </div>
                 </div>
                 {formData.studentIds.length > 0 && (
                   <button onClick={() => setFormData({...formData, studentIds: []})} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline px-2 pb-1">Reset</button>
                 )}
               </div>
               {formData.nature === 'Bimbingan' ? (
                 <div className="space-y-1.5 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Pilih Kelas</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={selectedRombelId} onChange={(e) => { setSelectedRombelId(e.target.value); setFormData(prev => ({ ...prev, studentIds: [] })); }}>
                      <option value="">-- Klik Pilih Rombel --</option>
                      {selectableRombels.sort((a,b) => a.name.localeCompare(b.name)).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                 </div>
               ) : (
                 <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Mode Lintas Kelas</h4>
                    <p className="text-[9px] text-teal-400 font-bold leading-relaxed">Menampilkan seluruh database siswa aktif untuk konseling kelompok.</p>
                 </div>
               )}
               <div className="relative">
                  <input type="text" placeholder={`Cari nama ${formData.nature === 'Konseling' ? 'di seluruh sekolah' : 'di kelas ini'}...`} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/10 ${formData.nature === 'Bimbingan' && !selectedRombelId ? 'opacity-50 cursor-not-allowed' : ''}`} value={searchTerm} disabled={formData.nature === 'Bimbingan' && !selectedRombelId} onChange={e => setSearchTerm(e.target.value)} />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               </div>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
               {formData.nature === 'Bimbingan' && !selectedRombelId ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">Silakan pilih kelas<br/>untuk memuat siswa.</p>
                 </div>
               ) : (
                 <>
                   {filteredStudentsToSelect.map(s => (
                     <button key={s.id} onClick={() => { setFormData(prev => ({ ...prev, studentIds: prev.studentIds.includes(s.id) ? prev.studentIds.filter(id => id !== s.id) : [...prev.studentIds, s.id] })); }} className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${formData.studentIds.includes(s.id) ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${formData.studentIds.includes(s.id) ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'}`}>{s.name.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-black truncate ${formData.studentIds.includes(s.id) ? 'text-white' : 'text-slate-800'}`}>{s.name}</p>
                        </div>
                     </button>
                   ))}
                   {filteredStudentsToSelect.length === 0 && (
                     <div className="py-10 text-center text-slate-400 text-xs italic">
                        Tidak ada data siswa ditemukan.
                     </div>
                   )}
                 </>
               )}
             </div>
          </div>

          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 no-print">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Jenis Layanan Kelompok</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={formData.nature} onChange={e => { const val = e.target.value as ServiceNature; setFormData({ ...formData, nature: val, studentIds: [] }); setSelectedRombelId(''); setSearchTerm(''); }}>
                     <option value="Bimbingan">Bimbingan Kelompok (Per Kelas Binaan)</option>
                     <option value="Konseling">Konseling Kelompok (Semua Siswa)</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Pelaksanaan</label>
                   <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bidang Layanan</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                     <option value="Pribadi">Pribadi</option><option value="Sosial">Sosial</option><option value="Belajar">Belajar</option><option value="Karir">Karir</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Topik / Fokus Bahasan</label>
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="E.g. Kerjasama Tim, Dampak Bullying..." value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Uraian Dinamika Kelompok (Narasi Proses)</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-8 text-sm font-bold h-64 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="Tuliskan bagaimana jalannya diskusi, respon anggota, dan kesepakatan kelompok..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
             </div>
             <div className="flex gap-4">
                <button onClick={() => setIsAddMode(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                <button onClick={handleSave} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-teal-100 hover:bg-teal-700 active:scale-95 transition-all">Simpan Laporan & Lihat Berita Acara</button>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedSessions.map(session => {
              const isCounseling = session.topic.includes('Konseling');
              const isSanitized = session.content === '[Data Dihapus untuk Privasi]';
              return (
                <div key={session.id} onClick={() => setActiveSession(session)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden">
                  {isSanitized && isCounseling && <div className="absolute top-0 right-0 p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-tighter">Arsip Aman</span></div>}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 text-lg ${isCounseling ? 'bg-violet-600 text-white shadow-violet-100' : 'bg-teal-600 text-white shadow-teal-100'}`}>{session.studentIds.length}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black text-slate-800 leading-tight truncate">{session.topic}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-tighter">{new Date(session.date).toLocaleDateString('id-ID')}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${isCounseling ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-600'}`}>Kelompok</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, mySessions.length)}</span> dari <span className="font-bold text-slate-800">{mySessions.length}</span> laporan
              </p>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="flex gap-1 mx-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}

          {mySessions.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold italic">Belum ada laporan bimbingan kelompok yang tercatat.</p>
            </div>
          )}
        </div>
      )}

      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
             <header className={`p-8 text-white flex justify-between items-center shrink-0 ${activeSession.topic.includes('Konseling') ? 'bg-violet-600' : 'bg-teal-600'}`}>
                <div>
                  <h3 className="text-xl font-black">Berita Acara {activeSession.topic.includes('Konseling') ? 'Konseling' : 'Bimbingan'} Kelompok</h3>
                  <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Sesi: {activeSession.topic}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownloadPDF(activeSession)} disabled={activeSession.content === '[Data Dihapus untuk Privasi]'} className={`bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${activeSession.content === '[Data Dihapus untuk Privasi]' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Unduh PDF
                  </button>
                  <button onClick={handleClosePreview} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
             </header>
             <div className="flex-1 overflow-y-auto p-12 bg-slate-50 custom-scrollbar">
                <div className="bg-white shadow-xl mx-auto w-full max-w-[800px] border border-slate-100 p-16 min-h-[1000px] space-y-10 font-serif">
                   <Letterhead profile={schoolProfile} />
                   <div className="text-center space-y-1">
                     <h2 className="text-lg font-bold underline uppercase">BERITA ACARA LAYANAN {activeSession.topic.includes('Konseling') ? 'KONSELING' : 'BIMBINGAN'} KELOMPOK</h2>
                     <p>Nomor: BK/GRP/{new Date(activeSession.date).getFullYear()}/{activeSession.id.split('-')[1]}</p>
                   </div>
                   <div className="space-y-6">
                      <p className="font-bold text-slate-800 border-b-2 border-slate-900 pb-1 uppercase text-xs tracking-widest">I. DATA UMUM SESI</p>
                      <table className="w-full ml-4">
                         <tbody>
                            <tr><td className="w-40 py-1 font-sans text-[11px] uppercase font-bold text-slate-400 tracking-wider">Topik / Bahasan</td><td className="w-4">:</td><td className="font-bold text-slate-900">{activeSession.topic.split('] ')[1]}</td></tr>
                            <tr><td className="py-1 font-sans text-[11px] uppercase font-bold text-slate-400 tracking-wider">Hari, Tanggal</td><td>:</td><td className="font-bold">{new Date(activeSession.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                         </tbody>
                      </table>
                      <p className="font-bold text-slate-800 border-b-2 border-slate-900 pb-1 uppercase text-xs tracking-widest pt-4">II. DAFTAR ANGGOTA KELOMPOK</p>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-2 ml-4">
                      {activeSession.studentIds.map((id, i) => {
                        const isCounseling = activeSession.topic.includes('Konseling');
                        const nameToDisplay = isCounseling ? getInitials(getStudentName(id)) : getStudentName(id);
                        return (
                          <div key={id} className="text-[12px] font-sans text-slate-700 flex justify-between border-b border-slate-50 pb-1">
                            <span className="font-medium">{i+1}. {nameToDisplay}</span>
                          </div>
                        );
                      })}
                      </div>
                      <p className="font-bold text-slate-800 border-b-2 border-slate-900 pb-1 uppercase text-xs tracking-widest pt-4">III. DINAMIKA KELOMPOK & HASIL</p>
                      <div className="ml-4">
                         <p className={`text-sm italic leading-relaxed whitespace-pre-wrap p-6 rounded-2xl border ${activeSession.content === '[Data Dihapus untuk Privasi]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>"{activeSession.content}"</p>
                      </div>
                   </div>
                   <div className="pt-20 grid grid-cols-2 gap-12 text-center">
                    <div className="space-y-24">
                      <div><p className="font-sans text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Mengetahui,</p><p>Kepala Sekolah</p></div>
                      <div><p className="font-bold underline uppercase text-slate-900">{schoolProfile.principalName}</p><p className="text-[10px] font-sans text-slate-500">NIP. {schoolProfile.principalNip}</p></div>
                    </div>
                    <div className="space-y-24">
                      <div><p className="font-sans text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">{schoolProfile.city || "...................."}, {new Date(activeSession.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>Guru BK / Konselor,</p></div>
                      <div><p className="font-bold underline uppercase text-slate-900">{activeSession.counselorName || counselorProfile?.name || schoolProfile.counselorName}</p><p className="text-[10px] font-sans text-slate-500">NIP. {counselorProfile?.nip || schoolProfile.counselorNip}</p></div>
                    </div>
                  </div>
                </div>
             </div>
             <div className="p-8 border-t bg-white flex justify-end shrink-0">
                <button onClick={handleClosePreview} className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Tutup & Simpan Privasi</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BimbinganKelompok;
