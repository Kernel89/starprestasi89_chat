
import React, { useState, useMemo } from 'react';
import { Student, Advocacy, SchoolProfile, Appointment, UserRole, CounselorProfileData, Rombel, Teacher } from '../types';
import Letterhead from '../components/Letterhead';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';

interface AdvocacyListProps {
  students: Student[];
  rombels: Rombel[];
  teachers: Teacher[];
  advocacyCases: Advocacy[];
  setAdvocacyCases: React.Dispatch<React.SetStateAction<Advocacy[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  counselorProfile?: CounselorProfileData;
  currentUser?: any;
}

const AdvocacyList: React.FC<AdvocacyListProps> = ({ students, rombels, teachers, advocacyCases, setAdvocacyCases, setAppointments, schoolProfile, notify, userRole, counselorProfile, currentUser }) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Advocacy | null>(null);
  const [selectedClassString, setSelectedClassString] = useState(''); // NEW: Filter Kelas
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState<Partial<Advocacy>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Diskriminasi',
    incidentDescription: '',
    witnesses: '',
    stepsTaken: '',
    status: 'Investigasi'
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

  const sanitizeAdvocacy = (id: string) => {
    setAdvocacyCases(prev => prev.map(a => 
      a.id === id && a.incidentDescription !== '[DATA KRONOLOGI DIHAPUS]'
        ? { 
            ...a, 
            incidentDescription: '[DATA KRONOLOGI DIHAPUS]',
            stepsTaken: '[DATA TINDAKAN DIHAPUS]'
          } 
        : a
    ));
  };

  const handleClosePreview = () => {
    if (selectedCase) {
      sanitizeAdvocacy(selectedCase.id);
    }
    setSelectedCase(null);
  };

  const syncToAgenda = (adv: Advocacy) => {
    const student = getStudent(adv.studentId);
    const appointmentId = `apt-sync-${adv.id}`;
    
    const newApt: Appointment = {
      id: appointmentId,
      studentId: adv.studentId,
      studentName: getInitials(student?.name || 'Siswa'),
      date: adv.date.split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reason: `Pendampingan Advokasi: ${adv.category}`,
      status: 'Selesai'
    };

    setAppointments(prev => {
      const filtered = prev.filter(a => a.id !== appointmentId);
      return [newApt, ...filtered];
    });
  };

  const handleExportAll = () => {
    if (advocacyCases.length === 0) return;
    const doc = new jsPDF();
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(`LAPORAN REKAPITULASI ADVOKASI`, 105, startY + 5, { align: 'center' });
    
    const tableData = advocacyCases.map(a => [
      new Date(a.date).toLocaleDateString('id-ID'),
      getInitials(getStudent(a.studentId)?.name || 'Siswa'),
      a.category,
      a.status
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Siswa (Inisial)', 'Kategori', 'Status']],
      body: tableData,
      startY: startY + 15,
    });

    doc.save(`Database_Advokasi_${Date.now()}.pdf`);
    notify("Database advokasi berhasil diunduh dalam format PDF.");
  };

  const handleDownloadSingle = (a: Advocacy) => {
    if (a.incidentDescription === '[DATA KRONOLOGI DIHAPUS]') {
      notify("Maaf, data detail laporan ini sudah dihapus demi keamanan privasi digital.", "error");
      return;
    }

    const doc = new jsPDF();
    const student = getStudent(a.studentId);
    const studentFullName = student?.name || '';
    
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text("BERITA ACARA LAYANAN ADVOKASI SISWA", 105, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.text(`Nomor: BK/ADV/${new Date(a.date).getFullYear()}/${a.id.split('-')[1]}`, 105, startY + 10, { align: 'center' });
    
    const infoTable = [
      ["Peserta Didik (Inisial)", ":", getInitials(studentFullName)],
      ["Kategori Masalah", ":", a.category],
      ["Tanggal Pelaksanaan", ":", new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
      ["Status", ":", a.status]
    ];

    autoTable(doc, {
      startY: startY + 20, theme: 'plain', styles: { font: 'times', fontSize: 10, cellPadding: 1 },
      body: infoTable,
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("times", "bold"); doc.text("I. KRONOLOGI & DESKRIPSI KEJADIAN", 20, currentY);
    doc.setFont("times", "normal");
    const splitIncident = doc.splitTextToSize(a.incidentDescription, 170);
    doc.text(splitIncident, 20, currentY + 7);
    currentY += (splitIncident.length * 5) + 15;

    doc.setFont("times", "bold"); doc.text("II. TINDAKAN PENDAMPINGAN & ADVOKASI", 20, currentY);
    doc.setFont("times", "normal");
    const splitSteps = doc.splitTextToSize(a.stepsTaken || "Sedang dalam proses penanganan.", 170);
    doc.text(splitSteps, 20, currentY + 7);
    
    currentY += (splitSteps.length * 5) + 30;
    if (currentY > 230) { doc.addPage(); currentY = 30; }

    doc.setFont("times", "normal");
    doc.text("Mengetahui,", 40, currentY);
    doc.text("Kepala Sekolah", 40, currentY + 5);
    const placeDate = `${schoolProfile.city || '...............'}, ${new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(placeDate, 140, currentY);
    doc.text("Guru BK / Konselor,", 140, currentY + 5);
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, currentY + 35);
    doc.text(a.counselorName || counselorProfile?.name || schoolProfile.counselorName, 140, currentY + 35);
    doc.setFont("times", "normal"); doc.setFontSize(8);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, currentY + 40);
    doc.text(`NIP. ${counselorProfile?.nip || schoolProfile.counselorNip}`, 140, currentY + 40);

    doc.save(`Advokasi_${getInitials(studentFullName).replace(/\./g, '')}.pdf`);
    notify("Laporan advokasi berhasil diunduh. Data sensitif kini disamarkan.");
    
    sanitizeAdvocacy(a.id);
  };

  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.incidentDescription) return;

    const activeCounselor = counselorProfile?.name || schoolProfile.counselorName;
    const student = students.find(s => s.id === formData.studentId);

    let savedCase: Advocacy;
    if (editingId) {
      savedCase = { ...formData, id: editingId, counselorName: activeCounselor } as Advocacy;
      setAdvocacyCases(prev => prev.map(a => a.id === editingId ? savedCase : a));
      notify("Data diperbarui & Agenda disinkronkan.");
    } else {
      savedCase = { id: `adv-${Date.now()}`, ...formData as Advocacy, counselorName: activeCounselor, gradeAtTime: student?.grade };
      setAdvocacyCases(prev => [savedCase, ...prev]);
      notify("Kasus baru disimpan & Agenda disinkronkan.");
    }

    syncToAgenda(savedCase);
    setIsAddMode(false);
    setEditingId(null);
    setFormData({
      studentId: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Diskriminasi',
      incidentDescription: '',
      witnesses: '',
      stepsTaken: '',
      status: 'Investigasi'
    });
    setSelectedCase(savedCase); 
    setSelectedClassString('');
  };

  const myAdvocacyCases = advocacyCases.filter(a => {
    const student = getStudent(a.studentId);
    if (student) {
      return !a.gradeAtTime || a.gradeAtTime === student.grade;
    }
    return true;
  });

  const totalPages = Math.ceil(myAdvocacyCases.length / itemsPerPage);
  const paginatedAdvocacy = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return myAdvocacyCases.slice(start, start + itemsPerPage);
  }, [myAdvocacyCases, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [isAddMode]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div><h2 className="text-2xl font-bold text-slate-900">Layanan Advokasi</h2><p className="text-slate-500 text-sm">Pendampingan perlindungan hak-hak siswa dengan protokol privasi otomatis.</p></div>
        <div className="flex gap-2">
          {!isAddMode && advocacyCases.length > 0 && !isPrincipal && (
            <button onClick={handleExportAll} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Unduh Rekap
            </button>
          )}
          {!isAddMode && userRole !== 'principal' && userRole !== 'supervisor' && (
            <button onClick={() => { setFormData({...formData, date: new Date().toISOString().split('T')[0]}); setIsAddMode(true); setSelectedClassString(''); }} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-amber-700 flex items-center gap-2 transition-all active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Catat Advokasi
            </button>
          )}
        </div>
      </header>

      {isAddMode ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 max-w-4xl mx-auto no-print space-y-6">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">{editingId ? 'Edit Laporan Advokasi' : 'Input Advokasi Baru'}</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas (Opsional)</label>
                <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/10"
                    value={selectedClassString}
                    onChange={(e) => {
                        setSelectedClassString(e.target.value);
                        setFormData({...formData, studentId: ''}); // Reset student selection
                    }}
                >
                    <option value="">-- Semua Kelas --</option>
                    {uniqueStudentClasses.map((cls, idx) => (
                        <option key={idx} value={cls}>{cls}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Siswa</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-amber-500/10" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                  <option value="">-- Pilih Siswa --</option>
                  {filteredStudentsDropdown.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {filteredStudentsDropdown.length === 0 && (
                    <p className="text-[9px] text-slate-400 italic px-1 mt-1">Tidak ada siswa ditemukan di kelas yang dipilih.</p>
                )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Layanan</label>
                <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-amber-500/10" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori Pelanggaran</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                  {['Diskriminasi', 'Kekerasan', 'Pelecehan', 'Tindak Kriminal', 'Malpraktik', 'Perlakuan Tidak Mendidik'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kronologi & Deskripsi Kejadian (Akan dihapus setelah unduh PDF)</label>
              <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-40 resize-none outline-none transition-all leading-relaxed" placeholder="Ceritakan detail kejadian secara kronologis..." value={formData.incidentDescription} onChange={e => setFormData({...formData, incidentDescription: e.target.value})} />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Langkah-langkah Penanganan (Akan dihapus setelah unduh PDF)</label>
              <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-32 resize-none outline-none transition-all leading-relaxed" placeholder="Apa saja tindakan yang sudah dilakukan oleh pihak sekolah..." value={formData.stepsTaken} onChange={e => setFormData({...formData, stepsTaken: e.target.value})} />
           </div>
           <div className="flex gap-4 pt-4">
              <button onClick={() => { setIsAddMode(false); setEditingId(null); setSelectedClassString(''); }} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
              <button onClick={handleSaveCase} className="flex-[2] py-4 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-amber-700 transition-all active:scale-95">
                Simpan dan Pratinjau
              </button>
           </div>
        </div>
      ) : userRole === 'supervisor' ? (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-6">Statistik Advokasi per Konselor</h3>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={Object.entries(advocacyCases.reduce((acc, curr) => {
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
                       {Object.entries(advocacyCases.reduce((acc, curr) => {
                        const name = curr.counselorName || 'Tidak Diketahui';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#ca8a04', '#a16207', '#854d0e', '#713f12'][index % 4]} />
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
            {paginatedAdvocacy.map(advCase => {
              const student = getStudent(advCase.studentId);
              const sanitized = advCase.incidentDescription === '[DATA KRONOLOGI DIHAPUS]';
              return (
                <div key={advCase.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col min-h-[280px]" onClick={() => setSelectedCase(advCase)}>
                  <div className="flex justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border ${sanitized ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {student?.name.charAt(0) || 'A'}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${sanitized ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {sanitized ? 'Arsip Aman' : 'Advokasi'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1 truncate">
                    {getInitials(student?.name || 'Siswa')}
                  </h4>
                  <p className="text-[10px] text-amber-600 font-black uppercase mb-2">{advCase.category}</p>
                  <p className="text-[9px] text-slate-300 font-medium truncate italic mb-4">Konselor: {advCase.counselorName || '-'}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 italic mb-4 leading-relaxed">
                    {sanitized ? "Detail kejadian dan tindakan telah disamarkan demi perlindungan data." : `"${advCase.incidentDescription}"`}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 mt-auto pt-4 border-t border-slate-50">
                    <span>{new Date(advCase.date).toLocaleDateString('id-ID')}</span>
                    <span className="text-amber-600 group-hover:translate-x-1 transition-all uppercase">Lihat Berita Acara →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, myAdvocacyCases.length)}</span> dari <span className="font-bold text-slate-800">{myAdvocacyCases.length}</span> laporan
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
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}
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

          {myAdvocacyCases.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <p className="text-slate-400 italic">Belum ada laporan advokasi yang tercatat.</p>
            </div>
          )}
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
             <header className="p-8 bg-amber-600 text-white flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-xl font-black">Berita Acara Layanan Advokasi</h3>
                  <p className="text-amber-100 text-xs mt-1">
                    Siswa: {getInitials(getStudent(selectedCase.studentId)?.name || 'Siswa')}
                  </p>
               </div>
               <div className="flex gap-2">
                 {!isPrincipal && userRole !== 'supervisor' && selectedCase.incidentDescription !== '[DATA KRONOLOGI DIHAPUS]' && (
                   <button 
                      onClick={() => {
                        setFormData({
                          studentId: selectedCase.studentId,
                          date: selectedCase.date,
                          category: selectedCase.category,
                          incidentDescription: selectedCase.incidentDescription,
                          witnesses: selectedCase.witnesses,
                          stepsTaken: selectedCase.stepsTaken,
                          status: selectedCase.status
                        });
                        setEditingId(selectedCase.id);
                        setIsAddMode(true);
                        setSelectedCase(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                   </button>
                 )}
                 <button 
                    onClick={() => handleDownloadSingle(selectedCase)} 
                    disabled={selectedCase.incidentDescription === '[DATA KRONOLOGI DIHAPUS]'}
                    className={`bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${selectedCase.incidentDescription === '[DATA KRONOLOGI DIHAPUS]' ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Simpan PDF
                 </button>
                 <button onClick={handleClosePreview} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
               </div>
             </header>
             <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar">
                <div id="print-advocacy" className="bg-white shadow-xl mx-auto w-full max-w-[800px] border border-slate-100 p-16 min-h-[1000px]">
                   <Letterhead profile={schoolProfile} />
                   <div className="p-8 space-y-8 font-serif text-slate-900 text-sm leading-relaxed text-justify">
                      <div className="text-center space-y-1"><h2 className="text-lg font-bold uppercase underline">BERITA ACARA LAYANAN ADVOKASI SISWA</h2><p>Nomor: BK/ADV/{new Date(selectedCase.date).getFullYear()}/{selectedCase.id.split('-')[1]}</p></div>
                      <table className="w-full ml-4 pt-4">
                        <tbody>
                           <tr>
                             <td className="w-40 py-1 font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama (Inisial)</td>
                             <td className="w-4">:</td>
                             <td className="font-bold uppercase">
                               {getInitials(getStudent(selectedCase.studentId)?.name || 'Siswa')}
                             </td>
                           </tr>
                           <tr><td className="py-1 font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kategori Masalah</td><td>:</td><td className="font-black text-amber-700">{selectedCase.category}</td></tr>
                           <tr><td className="py-1 font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tanggal Layanan</td><td>:</td><td>{new Date(selectedCase.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                        </tbody>
                      </table>
                      <div className="space-y-6 pt-4">
                         <div>
                            <p className="font-bold mb-2">I. Kronologi & Deskripsi Kejadian:</p>
                            <div className={`whitespace-pre-wrap p-6 border rounded-2xl italic leading-relaxed ${selectedCase.incidentDescription === '[DATA KRONOLOGI DIHAPUS]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                              "{selectedCase.incidentDescription}"
                            </div>
                         </div>
                         <div>
                            <p className="font-bold mb-2">II. Tindakan Pendampingan & Advokasi:</p>
                            <div className={`whitespace-pre-wrap p-6 border rounded-2xl leading-relaxed ${selectedCase.stepsTaken === '[DATA TINDAKAN DIHAPUS]' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'border-slate-100 bg-slate-50/20'}`}>
                              {selectedCase.stepsTaken}
                            </div>
                         </div>
                      </div>
                      <p className="pt-6">Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya dan menjunjung tinggi perlindungan hak-hak peserta didik.</p>
                      
                      <div className="pt-20 grid grid-cols-2 gap-12 text-center">
                        <div className="space-y-24">
                          <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-slate-400">Mengetahui,<br/><span className="text-slate-900 text-sm font-serif font-normal">Kepala Sekolah</span></p>
                          <div>
                            <p className="font-bold underline uppercase text-slate-900">{schoolProfile.principalName}</p>
                            <p className="text-[10px] font-sans text-slate-500">NIP. {schoolProfile.principalNip}</p>
                          </div>
                        </div>
                        <div className="space-y-24">
                          <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-slate-400">
                            {schoolProfile.city || "...................."}, {new Date(selectedCase.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            <br/><span className="text-slate-900 text-sm font-serif font-normal">Guru BK / Konselor</span>
                          </p>
                          <div>
                            <p className="font-bold underline uppercase text-slate-900">{selectedCase.counselorName || counselorProfile?.name || schoolProfile.counselorName}</p>
                            <p className="text-[10px] font-sans">NIP. {counselorProfile?.nip || schoolProfile.counselorNip}</p>
                          </div>
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

export default AdvocacyList;
