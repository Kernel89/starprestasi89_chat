
import React, { useState, useMemo } from 'react';
import { Student, Teacher, CaseConference, SchoolProfile, Appointment, UserRole, CounselorProfileData, Rombel } from '../types';
import Letterhead from '../components/Letterhead';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';

interface CaseConferenceListProps {
  students: Student[];
  rombels: Rombel[];
  teachers: Teacher[];
  conferences: CaseConference[];
  setConferences: React.Dispatch<React.SetStateAction<CaseConference[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  counselorProfile?: CounselorProfileData;
  currentUser?: any;
}

const CaseConferenceList: React.FC<CaseConferenceListProps> = ({ students, rombels, teachers, conferences, setConferences, setAppointments, schoolProfile, notify, userRole, counselorProfile, currentUser }) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<CaseConference | null>(null);
  const [customParticipant, setCustomParticipant] = useState('');
  const [selectedClassString, setSelectedClassString] = useState(''); // NEW: Filter Kelas
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState<Partial<CaseConference>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    location: 'Ruang Rapat Sekolah',
    participants: ['Kepala Sekolah', 'Guru BK'],
    agenda: '',
    discussionNotes: '',
    decisions: ''
  });

  const isPrincipal = userRole === 'principal';

  // --- LOGIKA DAFTAR KELAS DARI DATABASE SISWA ---
  const uniqueStudentClasses = useMemo(() => {
    const classSet = new Set<string>();
    let sourceRombels = rombels || [];

    if (userRole === 'counselor' && currentUser && teachers) {
      const myTeacherProfile = teachers.find(t => t.name === currentUser.name);
      if (myTeacherProfile) {
        const myRombelIds = new Set<string>();
        sourceRombels.filter(r => r.homeroomTeacherId === myTeacherProfile.id).forEach(r => myRombelIds.add(r.id));

        const gradeMatch = myTeacherProfile.assignment.match(/Tingkat (X|XI|XII)/i);
        if (gradeMatch) {
          const targetGrade = gradeMatch[1].toUpperCase();
          sourceRombels.filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
        }
        sourceRombels = sourceRombels.filter(r => myRombelIds.has(r.id));
      } else {
        sourceRombels = [];
      }
    }

    sourceRombels.forEach(r => {
        const fullClassName = r.name.trim();
        if (fullClassName) {
            classSet.add(fullClassName);
        }
    });
    return Array.from(classSet).sort((a, b) => {
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
  }, [rombels, userRole, currentUser, teachers]);

  // --- FILTER SISWA UNTUK DROPDOWN ---
  const filteredStudentsDropdown = useMemo(() => {
    let list = students.filter(s => s.status === 'Aktif');
    
    if (selectedClassString) {
        list = list.filter(s => `${s.grade} ${s.class}`.trim() === selectedClassString);
    }
    
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassString]);

  const getStudent = (id: string) => students.find(s => s.id === id);

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const sanitizeConference = (id: string) => {
    setConferences(prev => prev.map(c => 
      c.id === id && c.discussionNotes !== '[DATA DIHAPUS]'
        ? { 
            ...c, 
            agenda: '[AGENDA DIHAPUS]',
            discussionNotes: '[DATA DIHAPUS]',
            decisions: '[DATA DIHAPUS]'
          } 
        : c
    ));
  };

  const handleClosePreview = () => {
    if (selectedConference) {
      sanitizeConference(selectedConference.id);
    }
    setSelectedConference(null);
  };

  const syncToAgenda = (conf: CaseConference) => {
    const student = getStudent(conf.studentId);
    const appointmentId = `apt-sync-${conf.id}`;
    
    const newApt: Appointment = {
      id: appointmentId,
      studentId: conf.studentId,
      studentName: getInitials(student?.name || 'Siswa'),
      date: conf.date.split('T')[0],
      time: new Date(conf.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reason: `Rapat Konferensi: ${conf.agenda}`,
      status: 'Selesai'
    };

    setAppointments(prev => {
      const filtered = prev.filter(a => a.id !== appointmentId);
      return [newApt, ...filtered];
    });
  };

  const handleExportAll = () => {
    if (conferences.length === 0) return;
    const doc = new jsPDF();
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(`DATABASE KONFERENSI KASUS`, 105, startY + 5, { align: 'center' });
    
    const tableData = conferences.map(c => [
      new Date(c.date).toLocaleDateString('id-ID'),
      getInitials(getStudent(c.studentId)?.name || 'Siswa'),
      c.agenda,
      c.location,
      c.participants.join(', ')
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Siswa (Inisial)', 'Agenda', 'Lokasi', 'Peserta']],
      body: tableData,
      startY: startY + 15,
      styles: { fontSize: 8 }
    });

    doc.save(`Database_Konferensi_${Date.now()}.pdf`);
    notify("Database konferensi berhasil diunduh dalam format PDF.");
  };

  const handleDownloadSingle = (c: CaseConference) => {
    if (c.discussionNotes === '[DATA DIHAPUS]') {
      notify("Maaf, data detail rapat ini sudah dihapus demi keamanan privasi digital.", "error");
      return;
    }

    const doc = new jsPDF();
    const student = getStudent(c.studentId);
    const studentFullName = student?.name || '';
    
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("BERITA ACARA KONFERENSI KASUS", 105, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.text(`Nomor: BK/CONF/${new Date(c.date).getFullYear()}/${c.id.split('-')[1]}`, 105, startY + 10, { align: 'center' });
    
    const infoTable = [
      ["Peserta Didik", ":", getInitials(studentFullName)],
      ["Hari, Tanggal", ":", new Date(c.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
      ["Agenda Utama", ":", c.agenda],
      ["Lokasi", ":", c.location]
    ];

    autoTable(doc, {
      startY: startY + 18,
      theme: 'plain',
      styles: { font: 'times', fontSize: 10, cellPadding: 1 },
      body: infoTable,
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("times", "bold");
    doc.text("I. NOTULENSI DINAMIKA DISKUSI", 20, currentY);
    doc.setFont("times", "italic");
    const splitNotes = doc.splitTextToSize(c.discussionNotes, 170);
    doc.text(splitNotes, 20, currentY + 7);
    currentY += (splitNotes.length * 5) + 15;

    doc.setFont("times", "bold");
    doc.text("II. KEPUTUSAN & RENCANA TINDAK LANJUT", 20, currentY);
    doc.setFont("times", "normal");
    const splitDecisions = doc.splitTextToSize(c.decisions, 170);
    doc.text(splitDecisions, 20, currentY + 7);
    
    currentY += (splitDecisions.length * 5) + 30;
    if (currentY > 230) { doc.addPage(); currentY = 30; }

    doc.setFont("times", "normal");
    doc.text("Mengetahui,", 40, currentY);
    doc.text("Kepala Sekolah", 40, currentY + 5);
    const placeDate = `${schoolProfile.city || '...............'}, ${new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(placeDate, 140, currentY);
    doc.text("Notulis / Guru BK,", 140, currentY + 5);
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, currentY + 35);
    doc.text(c.counselorName || counselorProfile?.name || schoolProfile.counselorName, 140, currentY + 35);
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, currentY + 40);
    doc.text(`NIP. ${counselorProfile?.nip || schoolProfile.counselorNip}`, 140, currentY + 40);

    doc.save(`Berita_Acara_Konferensi_${getInitials(studentFullName).replace(/\./g, '')}.pdf`);
    notify("Laporan konferensi berhasil diunduh. Data sensitif kini disamarkan.");

    sanitizeConference(c.id);
  };

  const handleAddParticipant = (name: string) => {
    if (!name.trim()) return;
    if (formData.participants?.includes(name.trim())) return;
    setFormData(prev => ({
      ...prev,
      participants: [...(prev.participants || []), name.trim()]
    }));
    setCustomParticipant('');
  };

  const handleRemoveParticipant = (name: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants?.filter(p => p !== name)
    }));
  };

  const handleSaveConference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.agenda) return;

    const activeCounselor = counselorProfile?.name || schoolProfile.counselorName;

    let savedConf: CaseConference;
    if (editingId) {
      savedConf = { ...formData, id: editingId, counselorName: activeCounselor } as CaseConference;
      setConferences(prev => prev.map(c => c.id === editingId ? savedConf : c));
      notify("Data diperbarui & Agenda disinkronkan.");
    } else {
      savedConf = { id: `conf-${Date.now()}`, ...formData as CaseConference, counselorName: activeCounselor, gradeAtTime: getStudent(formData.studentId!)?.grade };
      setConferences(prev => [savedConf, ...prev]);
      notify("Konferensi baru disimpan & Agenda disinkronkan.");
    }

    syncToAgenda(savedConf);
    setIsAddMode(false);
    setEditingId(null);
    setSelectedConference(savedConf); 
    setSelectedClassString('');
  };

  const myConferences = conferences.filter(c => {
    const student = getStudent(c.studentId);
    if (student) {
      return !c.gradeAtTime || c.gradeAtTime === student.grade;
    }
    return true;
  });

  const totalPages = Math.ceil(myConferences.length / itemsPerPage);
  const paginatedConferences = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return myConferences.slice(start, start + itemsPerPage);
  }, [myConferences, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [isAddMode]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div><h2 className="text-2xl font-bold text-slate-900">Konferensi Kasus (Case Conference)</h2><p className="text-slate-500 text-sm">Rapat koordinasi penyelesaian masalah kompleks dengan protokol privasi.</p></div>
        <div className="flex gap-2">
          {!isAddMode && conferences.length > 0 && !isPrincipal && (
            <button onClick={handleExportAll} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Unduh Rekap
            </button>
          )}
          {!isAddMode && userRole !== 'principal' && userRole !== 'supervisor' && (
            <button onClick={() => {
              setFormData({
                studentId: '',
                date: new Date().toISOString().split('T')[0],
                location: 'Ruang Rapat Sekolah',
                participants: ['Kepala Sekolah', 'Guru BK'],
                agenda: '',
                discussionNotes: '',
                decisions: ''
              });
              setIsAddMode(true);
              setSelectedClassString('');
            }} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-teal-700 flex items-center gap-2 transition-all active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Buka Konferensi
            </button>
          )}
        </div>
      </header>

      {isAddMode ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 max-w-5xl mx-auto no-print space-y-8">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">{editingId ? 'Edit Berita Acara' : 'Input Berita Acara Baru'}</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                
                {/* FILTER KELAS & SISWA */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas (Opsional)</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10"
                            value={selectedClassString}
                            onChange={(e) => {
                                setSelectedClassString(e.target.value);
                                setFormData({...formData, studentId: ''}); // Reset student
                            }}
                        >
                            <option value="">-- Semua Kelas --</option>
                            {uniqueStudentClasses.map((cls, idx) => (
                                <option key={idx} value={cls}>{cls}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Siswa Terkait</label>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                        <option value="">Pilih Siswa...</option>
                        {filteredStudentsDropdown.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        </select>
                        {filteredStudentsDropdown.length === 0 && (
                            <p className="text-[9px] text-slate-400 italic px-1 mt-1">Tidak ada siswa ditemukan di kelas yang dipilih.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Rapat</label>
                    <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Agenda Rapat / Fokus (Akan dihapus setelah unduh PDF)</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" placeholder="E.g. Masalah Kedisiplinan Berat" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lokasi Rapat</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peserta Hadir ({formData.participants?.length || 0})</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[120px]">
                  {formData.participants?.map((p, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold animate-in zoom-in-90">
                      {p}
                      <button type="button" onClick={() => handleRemoveParticipant(p)} className="hover:text-red-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-200"
                      placeholder="Nama peserta luar sekolah..."
                      value={customParticipant}
                      onChange={e => setCustomParticipant(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant(customParticipant))}
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddParticipant(customParticipant)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Tambah
                    </button>
                  </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notulensi & Catatan Diskusi (Akan dihapus setelah unduh PDF)</label>
                 <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-48 resize-none outline-none focus:ring-4 focus:ring-teal-500/10 transition-all leading-relaxed" placeholder="Deskripsikan poin-poin yang disampaikan peserta rapat..." value={formData.discussionNotes} onChange={e => setFormData({...formData, discussionNotes: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Keputusan Akhir / Rencana Tindak Lanjut (Akan dihapus setelah unduh PDF)</label>
                 <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-32 resize-none outline-none focus:ring-4 focus:ring-teal-500/10 transition-all leading-relaxed" placeholder="Apa keputusan yang diambil dalam rapat ini..." value={formData.decisions} onChange={e => setFormData({...formData, decisions: e.target.value})} />
              </div>
           </div>

           <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button onClick={() => { setIsAddMode(false); setEditingId(null); setSelectedClassString(''); }} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
              <button onClick={handleSaveConference} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-all active:scale-95">
                Simpan dan Pratinjau
              </button>
           </div>
        </div>
      ) : userRole === 'supervisor' ? (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-6">Statistik Konferensi Kasus per Konselor</h3>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={Object.entries(conferences.reduce((acc, curr) => {
                        const name = curr.counselorName || 'Tidak Diketahui';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))}
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={5} 
                      dataKey="value"
                      nameKey="name"
                    >
                       {Object.entries(conferences.reduce((acc, curr) => {
                        const name = curr.counselorName || 'Tidak Diketahui';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'][index % 4]} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      ) : (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedConferences.map(conf => {
              const student = getStudent(conf.studentId);
              const sanitized = conf.discussionNotes === '[DATA DIHAPUS]';
              return (
                <div key={conf.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col min-h-[280px]" onClick={() => setSelectedConference(conf)}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border ${sanitized ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
                      {student?.name.charAt(0) || 'S'}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${sanitized ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'}`}>
                      {sanitized ? 'Arsip Aman' : 'Konferensi'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1 truncate">
                    {getInitials(student?.name || 'Siswa')}
                  </h4>
                  <p className="text-[10px] text-teal-600 font-black uppercase mb-2 truncate">{conf.agenda}</p>
                  <p className="text-[9px] text-slate-300 font-medium truncate italic mb-4">Konselor: {conf.counselorName || '-'}</p>
                  <p className="text-xs text-slate-500 line-clamp-3 italic mb-4 leading-relaxed">
                    {sanitized ? "Detail diskusi dan keputusan telah disamarkan demi perlindungan privasi." : `"${conf.discussionNotes}"`}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 mt-auto pt-4 border-t border-slate-50">
                    <span>{new Date(conf.date).toLocaleDateString('id-ID')}</span>
                    <span className="text-teal-600 group-hover:translate-x-1 transition-all uppercase">Detail Berita Acara →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, myConferences.length)}</span> dari <span className="font-bold text-slate-800">{myConferences.length}</span> laporan
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

          {myConferences.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <p className="text-slate-400 italic font-medium">Belum ada konferensi kasus yang tercatat.</p>
            </div>
          )}
        </div>
      )}

      {selectedConference && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
             <header className="p-8 bg-teal-600 text-white flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-xl font-black tracking-tight">Pratinjau Berita Acara Konferensi</h3>
                  <p className="text-teal-100 text-xs mt-1">Subjek: {getInitials(getStudent(selectedConference.studentId)?.name || 'Siswa')}</p>
               </div>
               <div className="flex gap-2">
                 {!isPrincipal && userRole !== 'supervisor' && selectedConference.discussionNotes !== '[DATA DIHAPUS]' && (
                   <button 
                      onClick={() => {
                        setFormData({
                          studentId: selectedConference.studentId,
                          date: selectedConference.date,
                          location: selectedConference.location,
                          participants: selectedConference.participants,
                          agenda: selectedConference.agenda,
                          discussionNotes: selectedConference.discussionNotes,
                          decisions: selectedConference.decisions
                        });
                        setEditingId(selectedConference.id);
                        setIsAddMode(true);
                        setSelectedConference(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                   </button>
                 )}
                 <button 
                    onClick={() => handleDownloadSingle(selectedConference)} 
                    disabled={selectedConference.discussionNotes === '[DATA DIHAPUS]'}
                    className={`bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${selectedConference.discussionNotes === '[DATA DIHAPUS]' ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Simpan PDF
                 </button>
                 <button onClick={handleClosePreview} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
               </div>
             </header>
             <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar">
                <div id="print-conference" className="bg-white shadow-xl mx-auto w-full max-w-[800px] border border-slate-100 p-12 min-h-[1000px]">
                   <Letterhead profile={schoolProfile} />
                   <div className="p-8 space-y-8 font-serif text-slate-900 text-sm leading-relaxed text-justify">
                      <div className="text-center space-y-1"><h2 className="text-lg font-bold uppercase underline">BERITA ACARA KONFERENSI KASUS</h2><p>Nomor: BK/CONF/{new Date(selectedConference.date).getFullYear()}/{selectedConference.id.split('-')[1]}</p></div>
                      <table className="w-full ml-4 pt-4">
                        <tbody>
                           <tr>
                             <td className="w-40 py-1 font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama (Inisial)</td>
                             <td className="w-4">:</td>
                             <td className="font-bold uppercase">
                               {getInitials(getStudent(selectedConference.studentId)?.name || 'Siswa')}
                             </td>
                           </tr>
                           <tr><td className="py-1 font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agenda Utama</td><td>:</td><td className="font-bold text-teal-700">{selectedConference.agenda}</td></tr>
                           <tr><td className="py-1 font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hari, Tanggal</td><td>:</td><td>{new Date(selectedConference.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                        </tbody>
                      </table>
                      <div className="space-y-6 pt-4">
                         <div>
                            <p className="font-bold mb-2">I. Notulensi Dinamika Diskusi:</p>
                            <div className={`whitespace-pre-wrap p-6 border rounded-2xl italic leading-relaxed ${selectedConference.discussionNotes === '[DATA DIHAPUS]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                               "{selectedConference.discussionNotes}"
                            </div>
                         </div>
                         <div>
                            <p className="font-bold mb-2">II. Keputusan & Rencana Tindak Lanjut:</p>
                            <div className={`p-6 border-2 rounded-2xl whitespace-pre-wrap font-bold ${selectedConference.decisions === '[DATA DIHAPUS]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'border-slate-100 bg-slate-50/20'}`}>
                               {selectedConference.decisions}
                            </div>
                         </div>
                      </div>
                      <div className="pt-20 grid grid-cols-2 gap-12 text-center">
                        <div className="space-y-24">
                          <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-slate-400">Mengetahui,<br/><span className="text-slate-900 text-sm font-serif font-normal">Kepala Sekolah</span></p>
                          <div><p className="font-bold underline uppercase text-slate-900">{schoolProfile.principalName}</p><p className="text-[10px] font-sans text-slate-500">NIP. {schoolProfile.principalNip}</p></div>
                        </div>
                        <div className="space-y-24">
                          <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-slate-400">{schoolProfile.city || "...................."}, {new Date(selectedConference.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/><span className="text-slate-900 text-sm font-serif font-normal">Notulis / Guru BK</span></p>
                          <div><p className="font-bold underline uppercase text-slate-900">{selectedConference.counselorName || counselorProfile?.name || schoolProfile.counselorName}</p><p className="text-[10px] font-sans text-slate-500">NIP. {counselorProfile?.nip || schoolProfile.counselorNip}</p></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="p-8 border-t border-slate-100 bg-white flex justify-end no-print shrink-0">
                <button onClick={handleClosePreview} className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Tutup & Terapkan Privasi</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseConferenceList;
