
import React, { useState, useMemo } from 'react';
import { Student, GuidanceSession, Mood, SchoolProfile, Appointment, UserRole, CounselorProfileData, Rombel, Teacher, UserSession } from '../types';
import { ICONS } from '../constants';
import Letterhead from '../components/Letterhead';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface BimbinganPribadiProps {
  students: Student[];
  sessions: GuidanceSession[];
  setSessions: React.Dispatch<React.SetStateAction<GuidanceSession[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  counselorProfile?: CounselorProfileData;
  // New Props for Filtering
  rombels?: Rombel[];
  teachers?: Teacher[];
  currentUser?: UserSession | null;
}

type ServiceType = 'Bimbingan' | 'Konseling';

const COLORS = ['#0d9488', '#0f766e', '#115e59', '#134e4a', '#0f766e', '#0d9488', '#115e59'];

const BimbinganPribadi: React.FC<BimbinganPribadiProps> = ({ 
  students, sessions, setSessions, setAppointments, schoolProfile, notify, userRole, counselorProfile,
  rombels = [], teachers = [], currentUser
}) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<GuidanceSession | null>(null);
  const [searchTermStudent, setSearchTermStudent] = useState('');
  const [selectedClassString, setSelectedClassString] = useState(''); // Changed: Filter by String Name from Student DB
  const [activeGradeTab, setActiveGradeTab] = useState<'X' | 'XI' | 'XII'>('X');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState({
    studentId: '',
    serviceType: 'Bimbingan' as ServiceType,
    category: 'Pribadi',
    date: new Date().toISOString().split('T')[0],
    topic: '', 
    process: '', 
    outcome: '', 
    followUp: '', 
    urgency: 'Rendah' as GuidanceSession['urgency'],
  });

  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';

  // --- LOGIKA FILTER SISWA BINAAN ---
  const availableStudents = useMemo(() => {
    if (userRole !== 'counselor' || !currentUser || !teachers) {
        return students.filter(s => s.status === 'Aktif');
    }

    const me = teachers.find(t => t.name === currentUser.name);
    if (!me) return students.filter(s => s.status === 'Aktif');

    const myRombelIds = new Set<string>();
    rombels.filter(r => r.homeroomTeacherId === me.id).forEach(r => myRombelIds.add(r.id));

    const gradeMatch = me.assignment.match(/Tingkat (X|XI|XII)/i);
    if (gradeMatch) {
        const targetGrade = gradeMatch[1].toUpperCase();
        rombels.filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
    }

    if (myRombelIds.size === 0) return students.filter(s => s.status === 'Aktif');

    const myRombelsList = rombels.filter(r => myRombelIds.has(r.id));

    return students.filter(s => {
        if (s.status !== 'Aktif') return false;
        const sGrade = s.grade.trim().toUpperCase();
        const sClass = s.class.trim().toUpperCase();

        return myRombelsList.some(r => {
             if (r.grade.trim().toUpperCase() !== sGrade) return false;
             const normalize = (str: string) => {
               if (!str) return '';
               return str.toUpperCase()
                 .replace(new RegExp(`^${r.grade.trim().toUpperCase()}\\s*`, 'i'), '')
                 .replace(/\s+/g, ' ')
                 .replace(/\b0+(\d)/g, '$1')
                 .trim();
             };
             return normalize(sClass) === normalize(r.name);
        });
    });
  }, [students, teachers, rombels, currentUser, userRole]);

  // --- LOGIKA DAFTAR KELAS DARI DATABASE SISWA ---
  // Mengambil daftar unik kelas (Grade + Class) langsung dari data siswa yang tersedia
  const uniqueStudentClasses = useMemo(() => {
    const classSet = new Set<string>();
    availableStudents.forEach(s => {
        const fullClassName = `${s.grade} ${s.class}`.trim();
        if (fullClassName) {
            classSet.add(fullClassName);
        }
    });
    // Sortir secara alfabetis agar rapi (X dulu, lalu XI, dst)
    return Array.from(classSet).sort((a, b) => {
        // Custom sort agar X < XI < XII
        const getGradeWeight = (name: string) => {
            if (name.startsWith('X ')) return 1;
            if (name.startsWith('XI ')) return 2;
            if (name.startsWith('XII ')) return 3;
            return 4;
        };
        const weightA = getGradeWeight(a);
        const weightB = getGradeWeight(b);
        if (weightA !== weightB) return weightA - weightB;
        return a.localeCompare(b);
    });
  }, [availableStudents]);

  const weeklyChartData = useMemo(() => {
    if (!isPrincipal) return [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySessions = sessions.filter(s => s.type === 'Pribadi' && new Date(s.date) >= weekAgo);
    const counselorStats: Record<string, number> = {};
    weeklySessions.forEach(s => {
      const name = s.counselorName || 'Tidak Teridentifikasi';
      counselorStats[name] = (counselorStats[name] || 0) + 1;
    });
    return Object.entries(counselorStats).map(([name, count]) => ({ name, value: count }));
  }, [sessions, isPrincipal]);

  const filteredStudentsFromDB = useMemo(() => {
    // Base filter: siswa binaan
    let result = availableStudents;

    // Filter 1: Berdasarkan Dropdown Kelas (String Match dari DB Siswa)
    if (selectedClassString) {
        result = result.filter(s => 
            `${s.grade} ${s.class}`.trim() === selectedClassString
        );
    }

    // Filter 2: Berdasarkan Search Term
    if (searchTermStudent.trim()) {
        const search = searchTermStudent.toLowerCase();
        result = result.filter(s => 
          s.name.toLowerCase().includes(search) || (s.nis || '').includes(search)
        );
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableStudents, searchTermStudent, selectedClassString]);

  const getStudent = (id: string) => (students || []).find(s => s.id === id);
  const getStudentName = (id: string) => getStudent(id)?.name || 'Siswa';

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const extractCategory = (topic: string) => {
    if (topic.includes('Pribadi')) return 'Pribadi';
    if (topic.includes('Sosial')) return 'Sosial';
    if (topic.includes('Belajar')) return 'Belajar';
    if (topic.includes('Karir')) return 'Karir';
    return '-';
  };

  const sanitizeIndividualSession = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id && s.topic.includes('Konseling') && s.content !== '[Data Dihapus untuk Privasi]'
        ? { ...s, content: '[Data Dihapus untuk Privasi]', objective: '[Data Dihapus untuk Privasi]' } 
        : s
    ));
  };

  const handleClosePreview = () => {
    if (activeSession && activeSession.topic.includes('Konseling')) {
      sanitizeIndividualSession(activeSession.id);
    }
    setActiveSession(null);
  };

  const handleDownloadPDF = (session: GuidanceSession) => {
    const isCounseling = session.topic.includes('Konseling');
    if (session.content === '[Data Dihapus untuk Privasi]') {
       notify("Maaf, data detail sesi ini sudah dihapus demi privasi digital.", "error");
       return;
    }

    const doc = new jsPDF();
    const student = getStudent(session.studentIds[0]);
    
    // Kop Surat Resmi
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text(`BERITA ACARA LAYANAN ${isCounseling ? 'KONSELING' : 'BIMBINGAN'} INDIVIDUAL`, 105, startY + 5, { align: 'center' });
    doc.setFontSize(10); 
    doc.text(`Nomor: BK/IND/${new Date(session.date).getFullYear()}/${session.id.split('-')[1]}`, 105, startY + 10, { align: 'center' });

    // Tabel Identitas Siswa
    autoTable(doc, {
      startY: startY + 18, 
      theme: 'plain', 
      styles: { font: 'times', fontSize: 11, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } },
      body: [
        [isCounseling ? 'Nama Siswa (Inisial)' : 'Nama Siswa', ':', isCounseling ? getInitials(student?.name || '-') : (student?.name || '-')],
        ['Bidang Layanan', ':', extractCategory(session.topic)],
        ['Hari, Tanggal', ':', new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Topik/Masalah', ':', session.topic.split('] ')[1] || session.topic],
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont("times", "bold"); 
    doc.text("I. URAIAN PROSES LAYANAN", 20, currentY);
    doc.setFont("times", "normal");
    const splitProcess = doc.splitTextToSize(session.content.split('---HASIL---')[0], 170);
    doc.text(splitProcess, 20, currentY + 7, { align: 'justify' });
    
    currentY += (splitProcess.length * 5) + 15;
    
    doc.setFont("times", "bold"); 
    doc.text("II. HASIL LAYANAN DAN RENCANA TINDAK LANJUT", 20, currentY);
    doc.setFont("times", "normal");
    const outcomeText = session.content.split('---HASIL---')[1] || session.objective;
    const splitOutcome = doc.splitTextToSize(outcomeText, 170);
    doc.text(splitOutcome, 20, currentY + 7, { align: 'justify' });

    currentY += (splitOutcome.length * 5) + 30;
    
    // Tanda Tangan
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

    doc.save(`Berita_Acara_Individu_${(student?.name || 'Siswa').replace(/\s+/g, '_')}.pdf`);
    notify("Berita acara berhasil diunduh.");

    if (isCounseling) sanitizeIndividualSession(session.id);
  };

  const syncToAgenda = (session: GuidanceSession) => {
    const student = getStudent(session.studentIds[0]);
    const appointmentId = `apt-sync-${session.id}`;
    const newApt: Appointment = {
      id: appointmentId,
      studentId: session.studentIds[0],
      studentName: getInitials(student?.name || 'Siswa'),
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
    if (!formData.studentId || !formData.process) {
      notify("Data belum lengkap. Minimal pilih siswa dan isi uraian proses.", "error");
      return;
    }
    const combinedContent = `${formData.process}---HASIL---${formData.outcome}`;
    const fullTopic = `[${formData.serviceType} ${formData.category}] ${formData.topic || "Layanan Individu"}`;
    const fullObjective = formData.followUp || "Belum ada rencana tindak lanjut";
    const student = students.find(s => s.id === formData.studentId);
    const fullSession: GuidanceSession = {
      id: editingSessionId || `bp-${Date.now()}`,
      type: 'Pribadi',
      date: new Date(formData.date).toISOString(),
      studentIds: [formData.studentId],
      topic: fullTopic,
      objective: fullObjective,
      content: combinedContent,
      urgency: formData.urgency,
      counselorName: counselorProfile?.name || schoolProfile.counselorName,
      gradeAtTime: student?.grade
    };
    setSessions(prev => [fullSession, ...(prev || [])]);
    syncToAgenda(fullSession);
    setIsAddMode(false);
    setEditingSessionId(null);
    setSearchTermStudent('');
    setSelectedClassString('');
    setActiveSession(fullSession); 
    notify(`Data disimpan & Metadata diarsipkan.`, "success");
    setFormData({ studentId: '', serviceType: 'Bimbingan', category: 'Pribadi', date: new Date().toISOString().split('T')[0], topic: '', process: '', outcome: '', followUp: '', urgency: 'Rendah' });
  };

  const mySessions = (sessions || []).filter(s => {
    if (s.type !== 'Pribadi') return false;
    
    const student = getStudent(s.studentIds[0]);
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">BK Pribadi</h2>
          <p className="text-slate-400 text-sm font-medium">
            {isPrincipal ? 'Laporan statistik performa konselor mingguan.' : 'Dokumentasi layanan individu secara formal.'}
          </p>
        </div>
        {!isPrincipal && (
          <div className="flex gap-2">
            {!isAddMode && (
              <button onClick={() => {
                setFormData({ studentId: '', serviceType: 'Bimbingan', category: 'Pribadi', date: new Date().toISOString().split('T')[0], topic: '', process: '', outcome: '', followUp: '', urgency: 'Rendah' });
                setSearchTermStudent('');
                setSelectedClassString('');
                setIsAddMode(true);
              }} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Sesi Individu Baru
              </button>
            )}
          </div>
        )}
      </header>

      {/* INDIKATOR MODE KONSELOR */}
      {userRole === 'counselor' && (
        <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex items-center gap-3 text-teal-700 shadow-sm animate-in slide-in-from-top-2 no-print">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span className="text-xs font-medium">
               Mode Konselor: Menampilkan kelas yang Anda ampu sebagai pembimbing.
            </span>
        </div>
      )}

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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan Minggu Ini</p>
                        <p className="text-2xl font-black text-slate-800">{weeklyChartData.reduce((acc, curr) => acc + curr.value, 0)}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
                <div className="mb-8">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Aktivitas Konselor (Individu)</h3>
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
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 italic">
                            <p className="text-xs font-bold uppercase tracking-widest">Belum ada data bimbingan pribadi minggu ini</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      ) : isAddMode ? (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl mx-auto space-y-8 no-print">
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setFormData({...formData, serviceType: 'Bimbingan'})} className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.serviceType === 'Bimbingan' ? 'border-teal-600 bg-teal-50/50' : 'border-slate-50'}`}>
                <h4 className={`font-black uppercase text-[11px] mb-1 ${formData.serviceType === 'Bimbingan' ? 'text-teal-700' : 'text-slate-400'}`}>Bimbingan Pribadi</h4>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Data disimpan lengkap di sistem.</p>
              </button>
              <button onClick={() => setFormData({...formData, serviceType: 'Konseling'})} className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.serviceType === 'Konseling' ? 'border-violet-600 bg-violet-50/50' : 'border-slate-50'}`}>
                <h4 className={`font-black uppercase text-[11px] mb-1 ${formData.serviceType === 'Konseling' ? 'text-violet-700' : 'text-slate-400'}`}>Konseling Individu</h4>
                <p className="text-[9px] text-rose-500 uppercase font-bold">Data proses akan dihapus setelah diunduh/tutup.</p>
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas (Opsional)</label>
                <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10"
                    value={selectedClassString}
                    onChange={(e) => {
                        setSelectedClassString(e.target.value);
                        // Reset student selection when class changes
                        if (formData.studentId) setFormData({...formData, studentId: ''});
                        setSearchTermStudent('');
                    }}
                >
                    <option value="">-- Semua Kelas --</option>
                    {uniqueStudentClasses.map((cls, idx) => (
                        <option key={idx} value={cls}>{cls}</option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-4 space-y-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cari & Pilih Siswa</label>
                <div className="relative">
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="Ketik Nama / NIS..." value={searchTermStudent} onChange={e => { setSearchTermStudent(e.target.value); if (formData.studentId) setFormData({...formData, studentId: ''}); }} />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                {searchTermStudent && !formData.studentId && (
                  <div className="absolute z-[10] top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredStudentsFromDB.map(s => (
                            <button key={s.id} onClick={() => { setFormData({...formData, studentId: s.id}); setSearchTermStudent(s.name); }} className="w-full flex items-center gap-3 p-4 hover:bg-teal-50 border-b border-slate-50 text-left transition-all group">
                                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-black text-[10px] group-hover:bg-teal-600 group-hover:text-white transition-colors">{s.name.charAt(0)}</div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{s.grade} - {s.class} | NIS: {s.nis}</p>
                                </div>
                            </button>
                        ))}
                        {filteredStudentsFromDB.length === 0 && (
                            <div className="p-4 text-center text-xs font-bold text-slate-400">Tidak ada siswa ditemukan di kelas binaan Anda.</div>
                        )}
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-4 space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Pelaksanaan</label>
                 <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bidang Layanan</label>
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                   <option value="Pribadi">Pribadi</option><option value="Sosial">Sosial</option><option value="Belajar">Belajar</option><option value="Karir">Karir</option>
                 </select>
              </div>
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Topik / Fokus Masalah</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="E.g. Kedisiplinan, Motivasi Belajar..." value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tingkat Resiko</label>
                <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10"
                    value={formData.urgency}
                    onChange={e => setFormData({...formData, urgency: e.target.value as GuidanceSession['urgency']})}
                >
                    <option value="Rendah">Resiko Rendah</option>
                    <option value="Menengah">Resiko Menengah</option>
                    <option value="Tinggi">Resiko Tinggi</option>
                </select>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Uraian Proses Layanan</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-32 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="Bagaimana jalannya bimbingan/konseling tadi?" value={formData.process} onChange={e => setFormData({...formData, process: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest px-1">Hasil Layanan (Outcome)</label>
                <textarea className="w-full bg-teal-50/30 border border-teal-100 rounded-[2rem] px-6 py-6 text-sm font-bold h-32 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="Apa kesimpulan atau perubahan yang didapat siswa?" value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Rencana Tindak Lanjut (Follow Up)</label>
                <textarea className="w-full bg-emerald-50/30 border border-emerald-100 rounded-[2rem] px-6 py-6 text-sm font-bold h-32 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Apa yang akan dilakukan selanjutnya?" value={formData.followUp} onChange={e => setFormData({...formData, followUp: e.target.value})} />
              </div>
           </div>

           <div className="flex gap-4">
              <button onClick={() => {setIsAddMode(false); setEditingSessionId(null); setSelectedClassString('');}} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-teal-100 active:scale-95 transition-all">Simpan & Lihat Berita Acara</button>
           </div>
        </div>
      ) : (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSessions.map(session => {
              const isCounseling = session.topic.includes('Konseling');
              const isSanitized = session.content === '[Data Dihapus untuk Privasi]';
              const student = getStudent(session.studentIds[0]);
              return (
                <div key={session.id} onClick={() => setActiveSession(session)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col min-h-[250px] relative overflow-hidden">
                    {isSanitized && <div className="absolute top-0 right-0 p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-tighter">Arsip Aman</span></div>}
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${!isCounseling ? 'bg-teal-600' : 'bg-violet-600'}`}>
                        {getStudentName(session.studentIds[0]).charAt(0)}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${session.urgency === 'Tinggi' ? 'bg-rose-100 text-rose-500' : session.urgency === 'Menengah' ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                          {session.urgency}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base mb-1 truncate">{getInitials(student?.name || 'Siswa')}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 truncate">{session.topic}</p>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed italic mt-auto">
                      {isSanitized ? "Detail sesi telah disamarkan demi perlindungan data pribadi." : `"${session.content.split('---HASIL---')[0]}"`}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-teal-600 uppercase group-hover:translate-x-1 transition-transform">
                      <span>Buka Arsip</span>
                      <span>→</span>
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
               <p className="text-slate-400 font-bold italic">Belum ada laporan bimbingan individual yang tercatat.</p>
            </div>
          )}
        </div>
      )}

      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
             <header className={`p-8 text-white shrink-0 no-print ${!activeSession.topic.includes('Konseling') ? 'bg-teal-600' : 'bg-violet-600'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black">Berita Acara Layanan Individu</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Siswa: {getInitials(getStudentName(activeSession.studentIds[0]))}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownloadPDF(activeSession)} disabled={activeSession.content === '[Data Dihapus untuk Privasi]'} className={`bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${activeSession.content === '[Data Dihapus untuk Privasi]' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      Unduh PDF
                    </button>
                    <button onClick={handleClosePreview} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                  </div>
                </div>
             </header>
             <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar">
                <div id="print-area-pribadi" className="bg-white shadow-xl mx-auto w-full max-w-[800px] border border-slate-100 p-12 min-h-[1000px] font-serif">
                   <Letterhead profile={schoolProfile} />
                   <div className="p-8 space-y-8 text-slate-900 text-sm leading-relaxed text-justify">
                      <div className="text-center space-y-1"><h2 className="text-lg font-bold uppercase underline">BERITA ACARA LAYANAN {activeSession.topic.includes('Bimbingan') ? 'BIMBINGAN' : 'KONSELING'} INDIVIDUAL</h2><p>Nomor: BK/IND/{new Date(activeSession.date).getFullYear()}/{activeSession.id.split('-')[1]}</p></div>
                      <table className="w-full ml-4 pt-4">
                        <tbody>
                           <tr><td className="w-40 py-1 font-sans text-xs">Hari, Tanggal</td><td className="w-4">:</td><td className="font-bold">{new Date(activeSession.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                           <tr><td className="py-1 font-sans text-xs">{activeSession.topic.includes('Konseling') ? 'Nama Siswa (Inisial)' : 'Nama Siswa'}</td><td>:</td><td className="font-bold uppercase">{activeSession.topic.includes('Konseling') ? getInitials(getStudentName(activeSession.studentIds[0])) : getStudentName(activeSession.studentIds[0])}</td></tr>
                           <tr><td className="py-1 font-sans text-xs">Bidang Layanan</td><td>:</td><td className="font-bold">{extractCategory(activeSession.topic)}</td></tr>
                        </tbody>
                      </table>
                      <div className="space-y-6 pt-4">
                         <div><p className="font-bold">I. Uraian Proses Layanan:</p><div className={`whitespace-pre-wrap p-5 border rounded-lg italic mt-2 ${activeSession.content === '[Data Dihapus untuk Privasi]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>"{activeSession.content.split('---HASIL---')[0]}"</div></div>
                         <div><p className="font-bold">II. Hasil Layanan & RTL:</p><div className={`whitespace-pre-wrap p-5 border rounded-lg italic mt-2 ${activeSession.content === '[Data Dihapus untuk Privasi]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>"{activeSession.content.split('---HASIL---')[1] || (activeSession.content === '[Data Dihapus untuk Privasi]' ? 'Data Detail Terhapus untuk Privasi' : '-')}"</div></div>
                      </div>
                      <div className="pt-20 grid grid-cols-2 gap-12 text-center">
                        <div className="space-y-20">
                          <p>Mengetahui,<br/>Kepala Sekolah</p>
                          <div><p className="font-bold underline uppercase">{schoolProfile.principalName}</p><p className="text-[10px] font-sans">NIP. {schoolProfile.principalNip}</p></div>
                        </div>
                        <div className="space-y-20">
                          <p>{schoolProfile.city || "...................."}, {new Date(activeSession.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru BK / Konselor,</p>
                          <div><p className="font-bold underline uppercase">{activeSession.counselorName || counselorProfile?.name || schoolProfile.counselorName}</p><p className="text-[10px] font-sans">NIP. {counselorProfile?.nip || schoolProfile.counselorNip}</p></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="p-8 border-t border-slate-100 bg-white flex justify-end no-print shrink-0">
                <button onClick={handleClosePreview} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Tutup & Simpan Privasi</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BimbinganPribadi;
