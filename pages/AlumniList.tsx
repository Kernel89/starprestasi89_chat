
import React, { useState, useMemo } from 'react';
import { Student, UserRole, SchoolProfile } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AlumniListProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
}

const AlumniList: React.FC<AlumniListProps> = ({ students, setStudents, schoolProfile, notify, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [selectedGradClass, setSelectedGradClass] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAlumniId, setEditingAlumniId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingAlumni, setViewingAlumni] = useState<Student | null>(null);
  const itemsPerPage = 24;

  const alumni = students; // Prop 'students' now contains the dedicated alumni list
  
  // Roles that are primarily observers/viewers
  const isObserver = userRole === 'principal' || userRole === 'supervisor' || userRole === 'humas';
  const canEdit = userRole === 'super_admin' || userRole === 'counselor';

  const graduationYears = useMemo(() =>
    ['Semua', ...Array.from(new Set(alumni.map(a => a.graduationYear?.toString()))).filter(Boolean).sort((a, b) => Number(b) - Number(a))],
    [alumni]
  );

  const graduationClasses = useMemo(() =>
    ['Semua', ...Array.from(new Set(alumni.map(a => a.graduationClass))).filter(Boolean).sort()],
    [alumni]
  );

  const filteredAlumni = useMemo(() => {
    return alumni.filter(a => {
      const s = searchTerm.toLowerCase();
      const name = a.name || '';
      const matchesSearchInput = name.toLowerCase().includes(s) || (a.nisn || '').includes(s) || (a.alumniNumber || '').includes(s);
      const matchesYear = selectedYear === 'Semua' || a.graduationYear?.toString() === selectedYear;
      const matchesClass = selectedGradClass === 'Semua' || a.graduationClass === selectedGradClass;
      const matchesStatus = statusFilter === 'Semua' || a.alumniStatus === statusFilter;
      return matchesSearchInput && matchesYear && matchesStatus && matchesClass;
    });
  }, [alumni, searchTerm, selectedYear, selectedGradClass, statusFilter]);

  const stats = useMemo(() => {
    try {
      const dataAlumni = Array.isArray(filteredAlumni) ? filteredAlumni : [];
      const total = dataAlumni.length;
      if (total === 0) return [];
      
      const kuliah = dataAlumni.filter(a => a && a.alumniStatus === 'Kuliah').length;
      const kerja = dataAlumni.filter(a => a && a.alumniStatus === 'Kerja').length;
      const lain = Math.max(0, total - (kuliah + kerja));
      
      return [
        { name: 'Kuliah', value: kuliah, color: '#06b6d4' },
        { name: 'Kerja', value: kerja, color: '#10b981' },
        { name: 'Lainnya', value: lain, color: '#94a3b8' }
      ].filter(d => d.value > 0);
    } catch (e) {
      console.error("Error calculating alumni stats:", e);
      return [];
    }
  }, [filteredAlumni]);

  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const paginatedAlumni = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAlumni.slice(start, start + itemsPerPage);
  }, [filteredAlumni, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedGradClass, statusFilter]);

  const [form, setForm] = useState({
    name: '', nisn: '', graduationYear: new Date().getFullYear(), graduationClass: '',
    phone: '', instagram: '', linkedin: '', alumniStatus: 'Lain-lain' as 'Kerja' | 'Kuliah' | 'Lain-lain',
    universityName: '', degreeLevel: 'S-1' as 'D-3' | 'D-4' | 'S-1' | 'S-2' | 'S-3' | 'D3' | 'D4' | 'S1' as any, studyProgram: '',
    companyName: '', workUnit: '', photo: '',
    gender: '' as any, birthPlace: '', birthDate: '', religion: '', address: '',
    fatherName: '', fatherJob: '', motherName: '', motherJob: '', email: ''
  });

  const resetForm = () => {
    setEditingAlumniId(null);
    setForm({ 
      name: '', nisn: '', graduationYear: new Date().getFullYear(), graduationClass: '', 
      phone: '', instagram: '', linkedin: '', alumniStatus: 'Lain-lain', 
      universityName: '', degreeLevel: 'S1', studyProgram: '', companyName: '', workUnit: '',
      gender: '' as any, birthPlace: '', birthDate: '', religion: '', address: '',
      fatherName: '', fatherJob: '', motherName: '', motherJob: '', email: '', photo: ''
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for DB performance
        notify("Ukuran foto maksimal 1MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportAll = () => {
    if (filteredAlumni.length === 0) return;
    const doc = new jsPDF('landscape');
    const startY = drawLetterhead(doc, schoolProfile, 'l');
    doc.setFontSize(13); doc.setFont("times", "bold");
    doc.text(`LAPORAN REKAPITULASI TRACER ALUMNI`, 148.5, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.setFont("times", "normal");
    doc.text(`Filter - Tahun: ${selectedYear} | Kelas: ${selectedGradClass} | Status: ${statusFilter}`, 148.5, startY + 11, { align: 'center' });
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 148.5, startY + 17, { align: 'center' });

    const headRow = ['No', 'Nama Lengkap', 'Lulus', 'Kontak', 'Status', 'Instansi / Kampus', 'Program / Unit'];
    const tableData = filteredAlumni.map((a, index) => [
      index + 1, a.name, a.graduationYear || "-", 
      `${a.phone || '-'}\n${a.instagram || '-'}`, 
      a.alumniStatus || "Belum Isi",
      a.alumniStatus === 'Kuliah' ? (a.universityName || '-') : a.alumniStatus === 'Kerja' ? (a.companyName || '-') : "-",
      a.alumniStatus === 'Kuliah' ? (a.studyProgram || '-') : a.alumniStatus === 'Kerja' ? (a.workUnit || '-') : "-"
    ]);

    autoTable(doc, {
      head: [headRow], body: tableData, startY: startY + 25,
      styles: { font: 'times', fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save(`Rekap_Tracer_Alumni_${Date.now()}.pdf`);
    notify("Rekapitulasi PDF berhasil diunduh.");
  };

  const handlePrintIndividualCV = async (a: Student) => {
    setViewingAlumni(a);
  };

  const handleOpenEdit = (alumniData: Student) => {
    setEditingAlumniId(alumniData.id);
    setForm({ ...alumniData } as any);
    setIsEditModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.name) {
        notify("Nama alumni wajib diisi.", "error");
        return;
      }

      if (editingAlumniId) {
        setStudents(prev => {
          if (!Array.isArray(prev)) return prev;
          return prev.map(s => s.id === editingAlumniId ? { ...s, ...form } as Student : s);
        });
        notify(`Data ${form.name} diperbarui.`, "success");
      } else {
        const year = form.graduationYear || new Date().getFullYear();
        const safeName = (form.name || 'user').trim();
        const newAlumni: Student = { 
          ...form, 
          id: `alumni-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
          status: 'Alumni', 
          nis: form.nisn || '-',
          nisn: form.nisn || '-',
          alumniNumber: `${year}${Math.floor(Math.random() * 9000) + 1000}`,
          username: `alumni.${safeName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${Date.now().toString().slice(-4)}`,
          grade: 'Alumni', 
          class: 'Lulus', 
          lastMood: 'Netral' as any, 
          attendanceRate: 100, 
          totalSessions: 0, 
          riskLevel: 'Rendah'
        } as Student;

        setStudents(prev => [newAlumni, ...(Array.isArray(prev) ? prev : [])]);
        notify(`Alumni ${form.name} berhasil ditambahkan.`, "success");
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Critical error in handleSave:", err);
      notify("Terjadi kesalahan sistem saat menyimpan data.", "error");
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus data ${name}?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      notify(`Data ${name} dihapus.`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tracer Alumni</h2>
          <p className="text-slate-500 text-sm font-medium">Sistem Pemantauan Karir & Pendidikan Lulusan {schoolProfile.name}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportAll} className="flex-1 lg:flex-none bg-white text-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Rekap PDF
          </button>
          {canEdit && (
            <button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="flex-1 lg:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5v14"/></svg>
              Tambah Alumni
            </button>
          )}
        </div>
      </header>

      {/* Analytics Dashboard Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-all">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Alumni</p>
              <h4 className="text-4xl font-black text-slate-900">{alumni.length}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-2">Terdata dalam sistem</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-cyan-200 transition-all">
            <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Kuliah</p>
              <h4 className="text-4xl font-black text-cyan-600">{alumni.filter(a => a.alumniStatus === 'Kuliah').length}</h4>
              <p className="text-[10px] text-cyan-400 font-bold mt-2">Studi Lanjut</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Kerja</p>
              <h4 className="text-4xl font-black text-emerald-600">{alumni.filter(a => a.alumniStatus === 'Kerja').length}</h4>
              <p className="text-[10px] text-emerald-400 font-bold mt-2">Karir & Wirausaha</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[250px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Distribusi Status</p>
          <div className="w-full h-48 flex items-center justify-center">
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || '#cbd5e1'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[10px] font-bold text-slate-300 uppercase italic">Tidak ada data untuk grafik</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="text" placeholder="Cari nama, NISN, atau ID Alumni..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-slate-100 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Semua', 'Kuliah', 'Kerja', 'Lainnya'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s === 'Lainnya' ? 'Lain-lain' : s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${((statusFilter === 'Lain-lain' && s === 'Lainnya') || statusFilter === s) ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <select className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="Semua">Tahun</option>
            {graduationYears.filter(y => y !== 'Semua').map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none" value={selectedGradClass} onChange={e => setSelectedGradClass(e.target.value)}>
            <option value="Semua">Kelas</option>
            {graduationClasses.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {(Array.isArray(paginatedAlumni) ? paginatedAlumni : []).map(a => {
          if (!a) return null;
          return (
            <div key={a.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group flex flex-col">
            <div className={`h-3 w-full ${a.alumniStatus === 'Kuliah' ? 'bg-cyan-500' : a.alumniStatus === 'Kerja' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className="p-8 flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl border-4 ${a.alumniStatus === 'Kuliah' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : a.alumniStatus === 'Kerja' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  {a.photo ? (
                    <img src={a.photo} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    (a.name || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setViewingAlumni(a)}>
                  <h3 className="font-black text-slate-800 text-sm truncate leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{a.name || 'Tanpa Nama'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lulus {a.graduationYear || '-'}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{a.graduationClass || 'Lulus'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-bl-full -mr-12 -mt-12" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktivitas Terkini</p>
                {a.alumniStatus === 'Kuliah' ? (
                  <div className="space-y-1 relative z-10">
                    <p className="text-xs font-black text-slate-800 leading-snug">{a.universityName || '-'}</p>
                    <p className="text-[10px] text-cyan-600 font-bold">{a.studyProgram || '-'} ({a.degreeLevel || 'S-1'})</p>
                  </div>
                ) : a.alumniStatus === 'Kerja' ? (
                  <div className="space-y-1 relative z-10">
                    <p className="text-xs font-black text-slate-800 leading-snug">{a.companyName || '-'}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{a.workUnit || '-'}</p>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic">Belum mengisi informasi karir.</p>
                )}
              </div>

              {userRole !== 'humas' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <span className="text-[10px] font-bold">{a.phone || 'N/A'}</span>
                  </div>
                  {a.instagram && (
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-pink-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
                      <span className="text-[10px] font-bold">{a.instagram}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-8 pb-8 flex gap-2">
              <button onClick={() => handlePrintIndividualCV(a)} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Profil
              </button>
              {canEdit && (
                <>
                  <button onClick={() => handleOpenEdit(a)} className="p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all border border-amber-100/50"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                  <button onClick={() => handleDelete(a.id, a.name)} className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100/50"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                </>
              )}
            </div>
          </div>
        );
      })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mt-8">
          <p className="text-xs text-slate-500 font-medium">Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari <span className="font-bold text-slate-800">{totalPages}</span></p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-xl border flex items-center justify-center text-slate-400 disabled:opacity-30"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl border flex items-center justify-center text-slate-400 disabled:opacity-30"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAlumni.length === 0 && (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold italic">Tidak ada data alumni yang sesuai dengan filter.</p>
        </div>
      )}

      {/* Modals */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className={`p-10 text-white shrink-0 ${isEditModalOpen ? 'bg-amber-600' : 'bg-slate-900'}`}>
              <h3 className="text-2xl font-black uppercase tracking-tight italic">{isEditModalOpen ? 'Edit Alumni' : 'Tambah Alumni'}</h3>
              <p className="text-white/70 text-xs mt-1">Lengkapi informasi tracer untuk pelaporan mutu.</p>
            </header>
            <form onSubmit={handleSave} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center gap-4 pb-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {form.photo ? (
                      <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-black transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Alumni (Maks 1MB)</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                <input required className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-slate-100" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.nisn || ''} onChange={e => setForm({ ...form, nisn: e.target.value })} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Kelamin</label>
                   <select className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value as any })}>
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempat Lahir</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.birthPlace || ''} onChange={e => setForm({ ...form, birthPlace: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
                  <input type="date" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.birthDate || ''} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agama</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.religion || ''} onChange={e => setForm({ ...form, religion: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input type="email" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Lulus</label>
                  <input type="number" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas Saat Lulus</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" value={form.graduationClass} onChange={e => setForm({ ...form, graduationClass: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap</label>
                <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none h-20 resize-none" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-3xl">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Ayah</label>
                    <input className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" value={form.fatherName || ''} onChange={e => setForm({ ...form, fatherName: e.target.value })} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pekerjaan Ayah</label>
                    <input className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" value={form.fatherJob || ''} onChange={e => setForm({ ...form, fatherJob: e.target.value })} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Ibu</label>
                    <input className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" value={form.motherName || ''} onChange={e => setForm({ ...form, motherName: e.target.value })} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pekerjaan Ibu</label>
                    <input className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" value={form.motherJob || ''} onChange={e => setForm({ ...form, motherJob: e.target.value })} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No. WhatsApp</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" placeholder="08..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" placeholder="@username" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Tracer Terkini</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Kuliah', 'Kerja', 'Lain-lain'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setForm({ ...form, alumniStatus: s })} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.alumniStatus === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{s}</button>
                  ))}
                </div>
              </div>

              {form.alumniStatus === 'Kuliah' && (
                <div className="p-6 bg-cyan-50 rounded-3xl space-y-4 animate-in slide-in-from-top-4">
                  <input placeholder="Nama Universitas" className="w-full bg-white border-none rounded-xl p-3 text-sm font-bold" value={form.universityName || ''} onChange={e => setForm({ ...form, universityName: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <select className="w-full bg-white border-none rounded-xl p-3 text-sm font-bold" value={form.degreeLevel || ''} onChange={e => setForm({ ...form, degreeLevel: e.target.value as any })}>
                      <option value="D-3">D-3</option>
                      <option value="D-4">D-4</option>
                      <option value="S-1">S-1</option>
                      <option value="S-2">S-2</option>
                      <option value="S-3">S-3</option>
                    </select>
                    <input placeholder="Program Studi" className="w-full bg-white border-none rounded-xl p-3 text-sm font-bold" value={form.studyProgram || ''} onChange={e => setForm({ ...form, studyProgram: e.target.value })} />
                  </div>
                </div>
              )}

              {form.alumniStatus === 'Kerja' && (
                <div className="p-6 bg-emerald-50 rounded-3xl space-y-4 animate-in slide-in-from-top-4">
                  <input placeholder="Nama Perusahaan" className="w-full bg-white border-none rounded-xl p-3 text-sm font-bold" value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} />
                  <input placeholder="Jabatan / Unit" className="w-full bg-white border-none rounded-xl p-3 text-sm font-bold" value={form.workUnit || ''} onChange={e => setForm({ ...form, workUnit: e.target.value })} />
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Batal</button>
                <button type="submit" className={`flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl active:scale-95 ${isEditModalOpen ? 'bg-amber-600 shadow-amber-100' : 'bg-slate-900 shadow-slate-200'}`}>{isEditModalOpen ? 'Simpan Perubahan' : 'Terbitkan Data'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Alumni Biodata Modal */}
      {viewingAlumni && (
        <ViewingAlumniModal 
          alumni={viewingAlumni} 
          onClose={() => setViewingAlumni(null)} 
          userRole={userRole}
        />
      )}
    </div>
  );
};

/* --- VIEW MODAL COMPONENT (Internal) --- */
const ViewingAlumniModal: React.FC<{ alumni: Student, onClose: () => void, userRole?: UserRole }> = ({ alumni, onClose, userRole }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto no-print">
       <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-white/20 my-8 flex flex-col max-h-[90vh]">
          <div className="bg-slate-900 p-8 text-white shrink-0 flex justify-between items-start">
             <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Detail Biodata Alumni</h3>
                <p className="text-slate-400 text-xs mt-1">Rekam Jejak Identitas Lulusan</p>
             </div>
             <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-start gap-6 pb-6 border-b border-slate-100">
                    <div className="w-24 h-32 bg-slate-100 rounded-2xl overflow-hidden shadow-inner shrink-0 flex items-center justify-center">
                        {alumni.photo ? (
                            <img src={alumni.photo} alt={alumni.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-black italic">
                                {alumni.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{alumni.name}</h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">NISN</p>
                                <p className="font-mono text-slate-700 font-bold">{alumni.nisn || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tahun Lulus</p>
                                <p className="font-bold text-indigo-600 uppercase tracking-widest">{alumni.graduationYear || '-'} ({alumni.graduationClass || 'Alumni'})</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tempat, Tgl Lahir</p>
                                <p className="text-slate-700 font-bold">{alumni.birthPlace || '-'}, {alumni.birthDate ? new Date(alumni.birthDate).toLocaleDateString('id-ID') : '-'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jenis Kelamin</p>
                                <p className="text-slate-700 font-bold">{alumni.gender || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <section>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-8 h-1.5 bg-indigo-500 rounded-full"></span> Data Pribadi & Kontak
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agama</p>
                                <p className="font-bold text-slate-700">{alumni.religion || '-'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email / Akun</p>
                                <p className="font-bold text-slate-700 truncate">{alumni.email || '-'}</p>
                            </div>
                            {userRole !== 'humas' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                    <p className="font-bold text-slate-700">{alumni.phone || '-'}</p>
                                </div>
                            )}
                            {userRole !== 'humas' && alumni.instagram && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Instagram</p>
                                    <p className="font-bold text-slate-700">{alumni.instagram}</p>
                                </div>
                            )}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Tracer</p>
                                <p className="font-bold text-indigo-600 uppercase tracking-widest">{alumni.alumniStatus || '-'}</p>
                            </div>
                            <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Lengkap</p>
                                <p className="font-bold text-slate-700 leading-relaxed italic">"{alumni.address || '-'}"</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-8 h-1.5 bg-emerald-500 rounded-full"></span> Data Keluarga (Orang Tua)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 space-y-3">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Data Ayah</p>
                                <div className="space-y-1">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Nama Lengkap</p>
                                    <p className="font-bold text-slate-800">{alumni.fatherName || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Pekerjaan</p>
                                    <p className="font-bold text-slate-800">{alumni.fatherJob || '-'}</p>
                                </div>
                            </div>
                            <div className="p-5 bg-pink-50/50 rounded-[2rem] border border-pink-100 space-y-3">
                                <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-2">Data Ibu</p>
                                <div className="space-y-1">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Nama Lengkap</p>
                                    <p className="font-bold text-slate-800">{alumni.motherName || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Pekerjaan</p>
                                    <p className="font-bold text-slate-800">{alumni.motherJob || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
             </div>
          </div>
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
             <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Tutup Detail</button>
          </div>
       </div>
    </div>
  );
};

export default AlumniList;
