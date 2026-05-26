import React, { useState, useMemo } from 'react';
import { Rombel, GuidanceSession, SchoolProfile, Appointment, UserRole, CounselorProfileData, UserSession, Teacher } from '../types';
import { ICONS } from '../constants';
import Letterhead from '../components/Letterhead';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface BimbinganKlasikalProps {
  rombels: Rombel[];
  sessions: GuidanceSession[];
  setSessions: React.Dispatch<React.SetStateAction<GuidanceSession[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  counselorProfile?: CounselorProfileData;
  currentUser?: UserSession | null;
  teachers?: Teacher[];
}

const COLORS = ['#0d9488', '#0f766e', '#115e59', '#134e4a', '#0f766e', '#0d9488', '#115e59'];

const BimbinganKlasikal: React.FC<BimbinganKlasikalProps> = ({ rombels, sessions, setSessions, setAppointments, schoolProfile, notify, userRole, counselorProfile, currentUser, teachers }) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<GuidanceSession | null>(null);
  const [activeGradeTab, setActiveGradeTab] = useState<'X' | 'XI' | 'XII'>('X');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [formData, setFormData] = useState({
    rombelId: '',
    category: 'Pribadi',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    objective: '',
    content: ''
  });

  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';

  const accessibleRombels = useMemo(() => {
    if (userRole === 'counselor' && currentUser && teachers) {
      const myTeacherProfile = teachers.find(t => t.name === currentUser.name);
      if (myTeacherProfile) {
        const myRombelIds = new Set<string>();
        (rombels || []).filter(r => r.homeroomTeacherId === myTeacherProfile.id).forEach(r => myRombelIds.add(r.id));

        const gradeMatch = myTeacherProfile.assignment.match(/Tingkat (X|XI|XII)/i);
        if (gradeMatch) {
          const targetGrade = gradeMatch[1].toUpperCase();
          (rombels || []).filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
        }
        return (rombels || [])
          .filter(r => myRombelIds.has(r.id))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return [];
    }
    return (rombels || []).sort((a, b) => a.name.localeCompare(b.name));
  }, [rombels, userRole, currentUser, teachers]);

  const weeklyChartData = useMemo(() => {
    if (!isPrincipal) return [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySessions = sessions.filter(s => s.type === 'Klasikal' && new Date(s.date) >= weekAgo);
    const counselorStats: Record<string, number> = {};
    weeklySessions.forEach(s => {
      const name = s.counselorName || 'Tidak Teridentifikasi';
      counselorStats[name] = (counselorStats[name] || 0) + 1;
    });
    return Object.entries(counselorStats).map(([name, count]) => ({ name, value: count }));
  }, [sessions, isPrincipal]);

  const getRombelName = (id?: string) => (rombels || []).find(r => r.id === id)?.name || 'Kelas';

  const handleDownloadPDF = (session: GuidanceSession) => {
    const doc = new jsPDF();
    const rombelName = getRombelName(session.rombelId);

    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text("LAPORAN PELAKSANAAN LAYANAN KLASIKAL", 105, startY + 5, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Nomor: BK/KLAS/${new Date(session.date).getFullYear()}/${session.id.split('-')[1]}`, 105, startY + 10, { align: 'center' });

    autoTable(doc, {
      startY: startY + 18,
      theme: 'plain',
      styles: { font: 'times', fontSize: 11, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } },
      body: [
        ['Bidang Layanan', ':', session.topic.split(' ')[0].replace('[', '').replace(']', '')],
        ['Materi / Topik', ':', session.topic.split('] ')[1] || session.topic],
        ['Hari, Tanggal', ':', new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Tujuan Layanan', ':', session.objective],
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont("times", "bold");
    doc.text("URAIAN KEGIATAN & NARASI PROSES", 20, currentY);
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

    doc.save(`Laporan_Klasikal_${rombelName.replace(/\s+/g, '_')}.pdf`);
    notify("Laporan klasikal berhasil diunduh.");
  };

  const syncToAgenda = (session: GuidanceSession) => {
    const rombelName = getRombelName(session.rombelId);
    const appointmentId = `apt-sync-${session.id}`;
    const newApt: Appointment = {
      id: appointmentId,
      studentId: session.rombelId || 'klasikal',
      studentName: `Klasikal: ${rombelName}`,
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
    if (!formData.rombelId) {
      notify("Pilih rombongan belajar terlebih dahulu.", "error");
      return;
    }
    if (!formData.content.trim()) {
      notify("Isi dokumentasi kegiatan terlebih dahulu.", "error");
      return;
    }
    const topicWithCategory = `[Klasikal ${formData.category}] ${formData.topic || "Layanan Klasikal BK"}`;
    let savedSession: GuidanceSession;
    if (editingId) {
      const existing = (sessions || []).find(s => s.id === editingId);
      savedSession = {
        ...existing!,
        rombelId: formData.rombelId,
        date: new Date(formData.date).toISOString(),
        topic: topicWithCategory,
        objective: formData.objective,
        content: formData.content,
        counselorName: counselorProfile?.name || schoolProfile.counselorName
      };
      setSessions(prev => (prev || []).map(s => s.id === editingId ? savedSession : s));
      notify("Laporan diperbarui & Agenda disinkronkan.");
    } else {
      savedSession = {
        id: `bk-klas-${Date.now()}`,
        type: 'Klasikal',
        date: new Date(formData.date).toISOString(),
        studentIds: [],
        rombelId: formData.rombelId,
        topic: topicWithCategory,
        objective: formData.objective || "Pemberian materi umum",
        content: formData.content,
        urgency: 'Rendah',
        counselorName: counselorProfile?.name || schoolProfile.counselorName,
        gradeAtTime: (rombels || []).find(r => r.id === formData.rombelId)?.grade
      };
      setSessions(prev => [savedSession, ...(prev || [])]);
      notify("Laporan disimpan & Agenda disinkronkan.");
    }
    syncToAgenda(savedSession);
    setIsAddMode(false);
    setEditingId(null);
    setActiveSession(savedSession);
    setFormData({ rombelId: '', category: 'Pribadi', date: new Date().toISOString().split('T')[0], topic: '', objective: '', content: '' });
  };

  const handleEditOpen = (session: GuidanceSession) => {
    setEditingId(session.id);
    setFormData({
      rombelId: session.rombelId || '',
      category: (session.topic.match(/\[Klasikal (.*?)\]/) || [])[1] || 'Pribadi',
      date: session.date.split('T')[0],
      topic: session.topic.split('] ')[1] || session.topic,
      objective: session.objective,
      content: session.content
    });
    setIsAddMode(true);
  };

  const mySessions = (sessions || []).filter(s => {
    if (s.type !== 'Klasikal') return false;
    
    // Filter berdasarkan Rombel yang ada di Tab Kelas yang Aktif
    const rombel = (rombels || []).find(r => r.id === s.rombelId);
    if (!rombel) return false;

    return rombel.grade === activeGradeTab;
  });

  const totalPages = Math.ceil(mySessions.length / itemsPerPage);
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return mySessions.slice(start, start + itemsPerPage);
  }, [mySessions, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeGradeTab]);

  const filteredAccessibleRombels = useMemo(() => {
    return accessibleRombels.filter(r => r.grade === activeGradeTab);
  }, [accessibleRombels, activeGradeTab]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">BK Klasikal</h2>
          <p className="text-slate-400 text-sm font-medium">
            {isPrincipal ? 'Laporan statistik performa konselor mingguan.' : 'Layanan bimbingan format klasikal per rombel.'}
          </p>
        </div>
        {!isPrincipal && (
          <div className="flex gap-2">
            {!isAddMode && (
              <button onClick={() => {
                setEditingId(null);
                setFormData({ rombelId: '', category: 'Pribadi', date: new Date().toISOString().split('T')[0], topic: '', objective: '', content: '' });
                setIsAddMode(true);
              }} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 active:scale-95 transition-all">
                Materi Klasikal Baru
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan Minggu Ini</p>
                <p className="text-2xl font-black text-slate-800">{weeklyChartData.reduce((acc, curr) => acc + curr.value, 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
            <div className="mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Aktivitas Konselor (Klasikal)</h3>
              <p className="text-xs text-slate-400 font-medium">Distribusi jumlah layanan per akun konselor (7 hari terakhir)</p>
            </div>
            <div className="flex-1 w-full min-h-0">
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie data={weeklyChartData} cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {weeklyChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 italic text-center">
                  <p className="text-xs font-bold uppercase tracking-widest">Belum ada data bimbingan klasikal minggu ini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isAddMode ? (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl mx-auto space-y-8 no-print">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.rombelId} onChange={e => setFormData({ ...formData, rombelId: e.target.value })}>
                <option value="">Pilih Rombel...</option>
                {filteredAccessibleRombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Pelaksanaan</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bidang Layanan</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                <option value="Pribadi">Pribadi</option><option value="Sosial">Sosial</option><option value="Belajar">Belajar</option><option value="Karir">Karir</option>
              </select>
            </div>
            <div className="md:col-span-12 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Judul Materi / Topik</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="Isi topik bahasan..." value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Narasi Kegiatan & Evaluasi</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-60 resize-none outline-none leading-relaxed" placeholder="Deskripsikan jalannya layanan klasikal, respon siswa, dan evaluasi singkat..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setIsAddMode(false); setEditingId(null); }} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
            <button onClick={handleSave} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Simpan Laporan</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paginatedSessions.map(session => (
              <div key={session.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-start hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                <div onClick={() => setActiveSession(session)} className="absolute inset-0 z-0"></div>
                <div className="flex justify-between w-full relative z-10 mb-4">
                  <div className="px-6 py-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 font-black text-sm">{getRombelName(session.rombelId)}</div>
                  <button onClick={() => handleEditOpen(session)} className="p-2 text-slate-300 hover:text-teal-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                  </button>
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-1 relative z-10">{session.topic}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase relative z-10">{new Date(session.date).toLocaleDateString('id-ID')}</p>
                <p onClick={() => setActiveSession(session)} className="text-[9px] text-teal-500 font-black mt-4 uppercase relative z-10">Lihat Berita Acara →</p>
              </div>
            ))}
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
              <p className="text-slate-400 font-bold italic">Belum ada laporan bimbingan klasikal yang tercatat.</p>
            </div>
          )}
        </div>
      )}

      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <header className="p-8 bg-teal-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black">Detail Laporan Klasikal</h3>
                <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest mt-1">Kelas: {getRombelName(activeSession.rombelId)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadPDF(activeSession)} className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                  Unduh PDF
                </button>
                <button onClick={() => setActiveSession(null)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-12 bg-slate-50 custom-scrollbar">
              <div id="print-area-klasikal" className="bg-white shadow-xl mx-auto w-full max-w-[800px] border border-slate-100 p-12 min-h-[800px] space-y-8 font-serif">
                <Letterhead profile={schoolProfile} />
                <div className="text-center">
                  <h2 className="text-lg font-bold underline uppercase">LAPORAN PELAKSANAAN LAYANAN KLASIKAL</h2>
                  <p className="text-sm">Nomor: BK/KLAS/${new Date(activeSession.date).getFullYear()}/${activeSession.id.split('-')[1]}</p>
                </div>
                <div className="space-y-6 font-sans text-sm text-slate-800">
                  <div className="grid grid-cols-[150px_10px_1fr] gap-2">
                    <span className="font-bold">Topik Materi</span><span>:</span><span>{activeSession.topic.split('] ')[1]}</span>
                    <span className="font-bold">Tanggal Sesi</span><span>:</span><span>{new Date(activeSession.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="pt-6">
                    <p className="font-bold uppercase text-xs text-slate-400 tracking-widest mb-3">Narasi Kegiatan:</p>
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl leading-relaxed whitespace-pre-wrap italic">"{activeSession.content}"</div>
                  </div>
                </div>
                <div className="pt-20 grid grid-cols-2 gap-12 text-center">
                  <div className="space-y-24">
                    <div><p>Mengetahui,<br />Kepala Sekolah</p></div>
                    <div><p className="font-bold underline uppercase">{schoolProfile.principalName}</p><p className="text-[10px] font-sans">NIP. {schoolProfile.principalNip}</p></div>
                  </div>
                  <div className="space-y-24">
                    <div><p>{schoolProfile.city || "...................."}, {new Date(activeSession.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Guru BK / Konselor,</p></div>
                    <div><p className="font-bold underline uppercase">{activeSession.counselorName || counselorProfile?.name || schoolProfile.counselorName}</p><p className="text-[10px] font-sans">NIP. {counselorProfile?.nip || schoolProfile.counselorNip}</p></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t bg-white flex justify-end"><button onClick={() => setActiveSession(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BimbinganKlasikal;