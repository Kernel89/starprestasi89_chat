
import React, { useState, useMemo } from 'react';
import { Student, Referral, SchoolProfile, Appointment, UserRole, CounselorProfileData, Rombel, Teacher } from '../types';
import Letterhead from '../components/Letterhead';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';

interface ReferralListProps {
  students: Student[];
  rombels: Rombel[];
  teachers: Teacher[];
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  counselorProfile?: CounselorProfileData;
  currentUser?: any;
}

const ReferralList: React.FC<ReferralListProps> = ({ students, rombels, teachers, referrals, setReferrals, setAppointments, schoolProfile, notify, userRole, counselorProfile, currentUser }) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedClassString, setSelectedClassString] = useState(''); // NEW: Filter Kelas
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    reason: 'Masalah Psikologis Klinis',
    targetAgency: '',
    summary: ''
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

  const sanitizeReferral = (id: string) => {
    setReferrals(prev => prev.map(r => 
      r.id === id && r.summary !== '[DATA PRIBADI DIHAPUS]'
        ? { ...r, summary: '[DATA PRIBADI DIHAPUS]' } 
        : r
    ));
  };

  const handleClosePreview = () => {
    if (selectedReferral) {
      sanitizeReferral(selectedReferral.id);
    }
    setSelectedReferral(null);
  };

  const syncToAgenda = (ref: Referral) => {
    const student = getStudent(ref.studentId);
    const appointmentId = `apt-sync-${ref.id}`;
    const newApt: Appointment = {
      id: appointmentId,
      studentId: ref.studentId,
      studentName: getInitials(student?.name || 'Siswa'),
      date: ref.date.split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reason: `Alih Tangan Kasus ke: ${ref.targetAgency}`,
      status: 'Selesai'
    };
    setAppointments(prev => {
      const filtered = prev.filter(a => a.id !== appointmentId);
      return [newApt, ...filtered];
    });
  };

  const handleExportAll = () => {
    if (referrals.length === 0) return;
    const doc = new jsPDF();
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(`DATABASE ALIH TANGAN KASUS`, 105, startY + 5, { align: 'center' });
    
    const tableData = referrals.map(r => [
      new Date(r.date).toLocaleDateString('id-ID'),
      getInitials(getStudent(r.studentId)?.name || 'Siswa'),
      r.targetAgency,
      r.status
    ]);
    autoTable(doc, { head: [['Tanggal', 'Siswa (Inisial)', 'Instansi Tujuan', 'Status']], body: tableData, startY: startY + 15 });
    doc.save(`Database_Rujukan_${Date.now()}.pdf`);
    notify("Database rujukan berhasil diunduh.");
  };

  const handleDownloadSingle = (r: Referral) => {
    if (r.summary === '[DATA PRIBADI DIHAPUS]') {
      notify("Maaf, data rujukan ini sudah dihapus demi privasi digital.", "error");
      return;
    }

    const doc = new jsPDF();
    const student = getStudent(r.studentId);
    const studentFullName = student?.name || '';
    
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text("SURAT RUJUKAN (ALIH TANGAN KASUS)", 105, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.text(`Nomor: BK/REF/${new Date(r.date).getFullYear()}/${r.id.split('-')[1]}`, 105, startY + 10, { align: 'center' });

    doc.setFont("times", "normal"); doc.setFontSize(11);
    doc.text(`Yth. ${r.targetAgency}`, 20, startY + 25);
    doc.text("Di Tempat", 20, startY + 30);
    doc.text("Dengan hormat,", 20, startY + 40);
    doc.text("Bersama ini kami kirimkan rujukan atas siswa kami dengan identitas sebagai berikut:", 20, startY + 45);

    autoTable(doc, {
      startY: startY + 50, theme: 'plain', styles: { font: 'times', fontSize: 11, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } },
      body: [
        ['Nama Siswa (Inisial)', ':', getInitials(studentFullName)],
        ['NIS / NISN', ':', `${student?.nis || '-'} / ${student?.nisn || '-'}`],
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("times", "bold"); doc.text("Uraian Kasus & Permohonan Bantuan:", 20, currentY);
    doc.setFont("times", "normal");
    const splitSummary = doc.splitTextToSize(r.summary, 170);
    doc.text(splitSummary, 20, currentY + 7, { align: 'justify' });
    
    currentY += (splitSummary.length * 6) + 15;
    doc.setFont("times", "normal");
    doc.text("Demikian surat rujukan ini kami buat untuk dapat ditindaklanjuti sebagaimana mestinya.", 20, currentY);
    doc.text("Atas perhatiannya kami ucapkan terima kasih.", 20, currentY + 7);

    currentY += 25;
    if (currentY > 230) { doc.addPage(); currentY = 30; }

    doc.text("Mengetahui,", 40, currentY);
    doc.text("Kepala Sekolah", 40, currentY + 5);
    const placeDate = `${schoolProfile.city || '...............'}, ${new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(placeDate, 140, currentY);
    doc.text("Guru BK / Konselor,", 140, currentY + 5);
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, currentY + 35);
    doc.text(r.counselorName || counselorProfile?.name || schoolProfile.counselorName, 140, currentY + 35);
    doc.setFont("times", "normal"); doc.setFontSize(8);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, currentY + 40);
    doc.text(`NIP. ${counselorProfile?.nip || schoolProfile.counselorNip}`, 140, currentY + 40);

    doc.save(`Surat_Rujukan_${getInitials(studentFullName).replace(/\./g, '')}.pdf`);
    notify("Surat rujukan berhasil diunduh. Data detail kini disamarkan.");
    sanitizeReferral(r.id);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ studentId: '', date: new Date().toISOString().split('T')[0], reason: 'Masalah Psikologis Klinis', targetAgency: '', summary: '' });
    setSelectedClassString('');
    setIsAddMode(true);
  };

  const handleSaveReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.targetAgency) return;
    const activeCounselor = counselorProfile?.name || schoolProfile.counselorName;
    let savedRef: Referral;
    if (editingId) {
      savedRef = { ...formData, id: editingId, status: 'Terkirim', counselorName: activeCounselor } as Referral;
      setReferrals(prev => prev.map(r => r.id === editingId ? savedRef : r));
      notify("Data rujukan diperbarui.");
    } else {
      savedRef = { id: `ref-${Date.now()}`, ...formData, status: 'Terkirim', counselorName: activeCounselor, gradeAtTime: getStudent(formData.studentId)?.grade } as Referral;
      setReferrals(prev => [savedRef, ...prev]);
      notify("Rujukan baru dibuat.");
    }
    syncToAgenda(savedRef);
    setIsAddMode(false);
    setSelectedReferral(savedRef);
    setSelectedClassString(''); 
  };

  const myReferrals = (referrals || []).filter(r => {
    const student = getStudent(r.studentId);
    if (student) {
      return !r.gradeAtTime || r.gradeAtTime === student.grade;
    }
    return true;
  });

  const totalPages = Math.ceil(myReferrals.length / itemsPerPage);
  const paginatedReferrals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return myReferrals.slice(start, start + itemsPerPage);
  }, [myReferrals, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [isAddMode]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div><h2 className="text-2xl font-bold text-slate-900">Alih Tangan Kasus (Referral)</h2><p className="text-slate-500 text-sm">Prosedur rujukan ke tenaga ahli eksternal dengan protokol privasi otomatis.</p></div>
        <div className="flex gap-2">
          {!isAddMode && referrals.length > 0 && !isPrincipal && (
            <button onClick={handleExportAll} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Unduh Rekap
            </button>
          )}
          {!isAddMode && userRole !== 'principal' && userRole !== 'supervisor' && (
            <button onClick={handleOpenAdd} className="bg-rose-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Rujukan Baru
            </button>
          )}
        </div>
      </header>

      {isAddMode ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 max-w-4xl mx-auto no-print space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas (Opsional)</label>
                <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/10"
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

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Siswa</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/10 transition-all" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Rujukan</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/10 transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Instansi / Tenaga Ahli Tujuan</label>
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/10" placeholder="E.g. RSUD Dr. Soetomo (Psikologi Klinis)" value={formData.targetAgency} onChange={e => setFormData({...formData, targetAgency: e.target.value})} />
              </div>
           </div>
           
           <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ringkasan Kasus (Akan dihapus setelah unduh PDF)</label>
             <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold h-40 resize-none outline-none focus:ring-4 focus:ring-rose-500/10" placeholder="Jelaskan alasan rujukan secara ringkas..." value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
           </div>
           <div className="flex gap-4">
              <button onClick={() => { setIsAddMode(false); setSelectedClassString(''); }} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
              <button onClick={handleSaveReferral} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95">
                Simpan dan Pratinjau
              </button>
           </div>
        </div>
      ) : userRole === 'supervisor' ? (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-6">Statistik Alih Tangan Kasus per Konselor</h3>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={Object.entries(referrals.reduce((acc, curr) => {
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
                       {Object.entries(referrals.reduce((acc, curr) => {
                        const name = curr.counselorName || 'Tidak Diketahui';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#be123c', '#9f1239', '#881337', '#7f1d1d'][index % 4]} />
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
            {paginatedReferrals.map(ref => {
              const student = getStudent(ref.studentId);
              const sanitized = ref.summary === '[DATA PRIBADI DIHAPUS]';
              return (
                <div key={ref.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group" onClick={() => setSelectedReferral(ref)}>
                  <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border ${sanitized ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {student?.name.charAt(0) || 'S'}
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${sanitized ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {sanitized ? 'Arsip Aman' : 'Alih Tangan'}
                      </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1 truncate">{getInitials(student?.name || 'Siswa')}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 truncate">Ke: {ref.targetAgency}</p>
                  <p className="text-[9px] text-slate-300 font-medium truncate italic">Konselor: {ref.counselorName || '-'}</p>
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 mt-auto pt-4 border-t border-slate-50">
                      <span>{new Date(ref.date).toLocaleDateString('id-ID')}</span>
                      <span className="text-rose-600 uppercase group-hover:translate-x-1 transition-all">Lihat Surat →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, myReferrals.length)}</span> dari <span className="font-bold text-slate-800">{myReferrals.length}</span> rujukan
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
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}
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

          {myReferrals.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <p className="text-slate-400 italic">Belum ada rujukan kasus yang tercatat.</p>
            </div>
          )}
        </div>
      )}

      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
             <header className="p-8 bg-rose-600 text-white flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-xl font-black">Pratinjau Surat Rujukan</h3>
                  <p className="text-rose-100 text-xs mt-1">Siswa: {getInitials(getStudent(selectedReferral.studentId)?.name || 'Siswa')}</p>
               </div>
               <div className="flex gap-2">
                 {!isPrincipal && userRole !== 'supervisor' && selectedReferral.summary !== '[DATA PRIBADI DIHAPUS]' && (
                   <button 
                      onClick={() => {
                        setFormData({
                          studentId: selectedReferral.studentId,
                          date: selectedReferral.date,
                          reason: selectedReferral.reason,
                          targetAgency: selectedReferral.targetAgency,
                          summary: selectedReferral.summary
                        });
                        setEditingId(selectedReferral.id);
                        setIsAddMode(true);
                        setSelectedReferral(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                   </button>
                 )}
                 <button onClick={() => handleDownloadSingle(selectedReferral)} disabled={selectedReferral.summary === '[DATA PRIBADI DIHAPUS]'} className={`bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${selectedReferral.summary === '[DATA PRIBADI DIHAPUS]' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Simpan PDF
                 </button>
                 <button onClick={handleClosePreview} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
               </div>
             </header>
             <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar">
                <div id="print-letter" className="bg-white shadow-xl mx-auto w-full max-w-[800px] border border-slate-100 p-12 min-h-[1000px]">
                   <Letterhead profile={schoolProfile} />
                   <div className="p-8 space-y-8 font-serif text-slate-900 leading-relaxed text-sm text-justify">
                      <div className="text-center space-y-1"><h2 className="text-lg font-bold uppercase underline">SURAT RUJUKAN (ALIH TANGAN KASUS)</h2><p>Nomor: BK/REF/{new Date(selectedReferral.date).getFullYear()}/{selectedReferral.id.split('-')[1]}</p></div>
                      <div className="space-y-4 pt-4">
                         <p>Yth. <strong>{selectedReferral.targetAgency}</strong><br/>Di Tempat</p>
                         <p>Dengan hormat,<br/>Bersama ini kami kirimkan rujukan atas siswa kami dengan identitas:</p>
                         <table className="w-full ml-4">
                            <tbody>
                               <tr><td className="w-40 py-1">Nama (Inisial)</td><td className="w-4">:</td><td className="font-bold">{getInitials(getStudent(selectedReferral.studentId)?.name || 'Siswa')}</td></tr>
                               {selectedReferral.summary !== '[DATA PRIBADI DIHAPUS]' && (
                                 <>
                                   <tr><td className="py-1">NIS / NISN</td><td>:</td><td>{getStudent(selectedReferral.studentId)?.nis} / {getStudent(selectedReferral.studentId)?.nisn}</td></tr>
                                 </>
                               )}
                            </tbody>
                         </table>
                         <p><strong>Uraian Kasus & Permohonan Bantuan:</strong></p>
                         <div className={`whitespace-pre-wrap border-l-4 border-slate-200 pl-6 py-2 leading-relaxed text-justify ${selectedReferral.summary === '[DATA PRIBADI DIHAPUS]' ? 'italic text-rose-500 bg-rose-50/30' : 'italic text-slate-700'}`}>{selectedReferral.summary}</div>
                         <p className="pt-6">Demikian surat rujukan ini kami buat untuk dapat ditindaklanjuti sebagaimana mestinya. Atas perhatiannya kami ucapkan terima kasih.</p>
                      </div>
                      <div className="pt-20 grid grid-cols-2 gap-20 text-center">
                        <div className="space-y-20">
                          <div><p>Mengetahui,<br/>Kepala Sekolah</p></div>
                          <div><p className="font-bold underline uppercase">{schoolProfile.principalName}</p><p className="text-[10px] font-sans">NIP. {schoolProfile.principalNip}</p></div>
                        </div>
                        <div className="space-y-20">
                          <div><p>{schoolProfile.city || "...................."}, {new Date(selectedReferral.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru BK / Konselor,</p></div>
                          <div><p className="font-bold underline uppercase">{selectedReferral.counselorName || counselorProfile?.name || schoolProfile.counselorName}</p><p className="text-[10px] font-sans">NIP. {counselorProfile?.nip || schoolProfile.counselorNip}</p></div>
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

export default ReferralList;
