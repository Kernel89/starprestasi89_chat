
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Student, Mood, Teacher, Rombel, Appointment, GuidanceSession, HomeVisit, Advocacy, CaseConference, Referral, StarPrestasi, UserRole, Assignment } from '../types';
import * as XLSX from 'xlsx';

interface StudentsListProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  rombels: Rombel[];
  teachers: Teacher[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setGuidanceSessions: React.Dispatch<React.SetStateAction<GuidanceSession[]>>;
  setHomeVisits: React.Dispatch<React.SetStateAction<HomeVisit[]>>;
  setAdvocacyCases: React.Dispatch<React.SetStateAction<Advocacy[]>>;
  setConferences: React.Dispatch<React.SetStateAction<CaseConference[]>>;
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  setStarPrestasiData: React.Dispatch<React.SetStateAction<StarPrestasi[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  userRole?: UserRole;
  currentUser?: any;
  handleDeleteStudent: (studentId: string) => void;
  handleCleanup: (mode: 'MUTASI' | 'PROMOTION' | 'GRADUATE', ids: string[]) => void;
  setAlumni: React.Dispatch<React.SetStateAction<Student[]>>;
}

const StudentsList: React.FC<StudentsListProps> = ({
  students,
  setStudents,
  rombels,
  teachers,
  notify,
  setAppointments,
  setGuidanceSessions,
  setHomeVisits,
  setAdvocacyCases,
  setConferences,
  setReferrals,
  setStarPrestasiData,
  setAssignments,
  userRole,
  currentUser,
  handleDeleteStudent,
  handleCleanup,
  setAlumni
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Pindah'>('Aktif');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [studentToProcess, setStudentToProcess] = useState<Student | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';

  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    nisn: '',
    username: '',
    password: '',
    class: '',
    grade: 'X',
    isLocked: false,
    isKM: false,
    role: 'student' as UserRole
  });

  const [mutationData, setMutationData] = useState({
    type: 'PROMOTION',
    targetRombelId: ''
  });

  const getShortClassName = (rombelName: string, grade: string) => {
    if (!rombelName) return '';
    const normalizedGrade = grade.trim().toUpperCase();
    const withoutGrade = rombelName.trim().replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
    return withoutGrade.trim().toUpperCase();
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  };

  const downloadTemplate = () => {
    const templateData = [
      { "Nama Lengkap": "Andi Pratama", "NIS": "2223001", "NISN": "0061234567", "Tingkat": "X", "Nama Kelas": "Umum 1" },
      { "Nama Lengkap": "Siti Aminah", "NIS": "2223002", "NISN": "0061234568", "Tingkat": "XI", "Nama Kelas": "MIPA 1" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
  };

  const downloadAccounts = () => {
    // Filter active students only
    let targetStudents = students.filter(s => s.status === 'Aktif');

    // If counselor, restrict to counselor's assigned students only!
    if (userRole === 'counselor' && counselorStudentIds) {
      targetStudents = targetStudents.filter(s => counselorStudentIds.has(s.id));
    }

    if (targetStudents.length === 0) {
      notify("Tidak ada data siswa aktif yang dapat diunduh.", "error");
      return;
    }

    // Sort targetStudents: Grade (X -> XI -> XII), then Class, then Name
    const sortedStudents = [...targetStudents].sort((a, b) => {
      const grades = ['X', 'XI', 'XII'];
      const gradeDiff = grades.indexOf(a.grade) - grades.indexOf(b.grade);
      if (gradeDiff !== 0) return gradeDiff;

      const classDiff = (a.class || '').localeCompare(b.class || '', undefined, { numeric: true, sensitivity: 'base' });
      if (classDiff !== 0) return classDiff;

      return (a.name || '').localeCompare(b.name || '');
    });

    const exportData = sortedStudents.map((s, index) => ({
      "No": index + 1,
      "Nama Lengkap": s.name,
      "NIS": s.nis,
      "NISN": s.nisn || '-',
      "Kelas": `${s.grade} ${s.class}`,
      "Username": s.username,
      "Password": s.password || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Akun Siswa");
    
    const fileName = userRole === 'super_admin' 
      ? "Akun_Seluruh_Siswa_Aktif.xlsx" 
      : `Akun_Siswa_Asuh_${currentUser?.name || 'Konselor'}.xlsx`;

    XLSX.writeFile(wb, fileName);
    notify(`Berhasil mengunduh ${sortedStudents.length} akun siswa.`);
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) { notify("File kosong.", "error"); return; }

        // 1. Parsing Data Excel ke Format Student
        const importedList: Student[] = data.map((row: any, index) => {
          const name = row['Nama Lengkap'] || row['Nama'] || 'Siswa Baru';
          const nis = String(row['NIS'] || '');
          const nisn = String(row['NISN'] || '');
          return {
            id: `s-imp-${Date.now()}-${index}`,
            name, nis, nisn,
            username: nisn ? `$${nisn}#` : `$${nis.padEnd(10, '0')}#`,
            password: generateRandomPassword(),
            grade: String(row['Tingkat'] || 'X').toUpperCase(),
            class: String(row['Nama Kelas'] || 'Umum').toUpperCase(),
            lastMood: Mood.Netral,
            attendanceRate: 100, totalSessions: 0, riskLevel: 'Rendah',
            email: '-', phone: '-', parentName: '-', parentPhone: '-', address: '-', status: 'Aktif', isLocked: false
          };
        });

        // 2. Logic Upsert (Update jika NIS ada, Insert jika belum)
        setStudents(prev => {
          const updatedList = [...prev];
          let addedCount = 0;
          let updatedCount = 0;

          importedList.forEach(importedStudent => {
            // Cari apakah NIS sudah ada di database
            const existingIndex = updatedList.findIndex(s => s.nis === importedStudent.nis);

            if (existingIndex !== -1) {
              // UPDATE: Ganti data biodata, TAPI pertahankan ID sistem dan Statistik
              const existing = updatedList[existingIndex];
              updatedList[existingIndex] = {
                ...importedStudent, // Timpa dengan data baru dari Excel
                id: existing.id, // PENTING: Pertahankan ID agar relasi tidak putus
                // Pertahankan statistik yang sudah berjalan
                attendanceRate: existing.attendanceRate,
                totalSessions: existing.totalSessions,
                lastMood: existing.lastMood,
                riskLevel: existing.riskLevel,
                // Pertahankan data kontak jika di excel kosong (opsional, disini kita timpa sesuai instruksi 'ganti data')
              };
              updatedCount++;
            } else {
              // INSERT: Tambahkan sebagai siswa baru
              updatedList.unshift(importedStudent);
              addedCount++;
            }
          });

          notify(`Proses selesai: ${addedCount} siswa baru, ${updatedCount} data diperbarui.`);
          return updatedList;
        });

        setIsImportModalOpen(false);
      } catch (err) { notify("Gagal baca file.", "error"); }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (isAddModalOpen) {
      const generatedUsername = formData.nisn ? `$${formData.nisn}#` : formData.nis ? `$${formData.nis.padEnd(10, '0')}#` : '$#';
      setFormData(prev => ({ ...prev, username: generatedUsername }));
    }
  }, [formData.nisn, formData.nis, isAddModalOpen]);

  const handleOpenEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({
      name: student.name,
      nis: student.nis,
      nisn: student.nisn || '',
      username: student.username,
      password: student.password || '',
      class: student.class,
      grade: student.grade,
      isLocked: student.isLocked || false,
      isKM: student.isKM || false,
      role: student.role || 'student'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    setStudents(prev => prev.map(s => s.id === editingStudentId ? { ...s, ...formData } : s));
    setIsEditModalOpen(false);
    setEditingStudentId(null);
    notify(`Data ${formData.name} diperbarui.`);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis || !formData.class) {
      notify("Nama, NIS, dan Kelas wajib diisi.", "error");
      return;
    }
    const newStudent: Student = {
      id: `s-${Date.now()}`,
      ...formData,
      lastMood: Mood.Netral,
      attendanceRate: 100, totalSessions: 0, riskLevel: 'Rendah',
      email: '-', phone: '-', parentName: '-', parentPhone: '-', address: '-', status: 'Aktif', isLocked: false
    };
    setStudents(prev => [newStudent, ...prev]);
    setIsAddModalOpen(false);
    notify(`Siswa ${newStudent.name} ditambahkan.`);
  };

  const handleMutation = () => {
    if (!studentToProcess) return;
    const currentYear = new Date().getFullYear();

    if (mutationData.type === 'GRADUATE') {
      const alumniData: Student = {
        ...studentToProcess,
        status: 'Alumni',
        grade: 'Alumni',
        class: 'Alumni',
        graduationClass: `${studentToProcess.grade} ${studentToProcess.class}`,
        graduationYear: currentYear,
        alumniStatus: 'Lain-lain',
        lastMood: 'Biasa Saja' as any,
        attendanceRate: 0,
        totalSessions: 0,
        riskLevel: 'Rendah'
      };
      setAlumni(prev => [alumniData, ...prev]);
      setStudents(prev => prev.filter(s => s.id !== studentToProcess.id));
      handleCleanup('GRADUATE', [studentToProcess.id]);
    } else {
      setStudents(prev => prev.map(s => {
        if (s.id !== studentToProcess.id) return s;
        if (mutationData.type === 'PROMOTION') {
          const target = rombels.find(r => r.id === mutationData.targetRombelId);
          return target ? { ...s, grade: target.grade, class: getShortClassName(target.name, target.grade) } : s;
        }
        return { ...s, status: 'Pindah' };
      }));

      if (mutationData.type === 'WITHDRAW') {
        handleCleanup('MUTASI', [studentToProcess.id]);
      }
    }
    
    setIsMutationModalOpen(false);
    notify("Mutasi berhasil.");
  };

  // Find counselor's assigned student IDs ("Siswa Asuh")
  const counselorStudentIds = useMemo(() => {
    if (userRole !== 'counselor') return null;
    const myTeacherProfile = teachers.find(t => t.name === currentUser?.name);
    if (!myTeacherProfile) return new Set<string>();

    const myRombelIds = new Set<string>();
    rombels.filter(r => r.homeroomTeacherId === myTeacherProfile.id).forEach(r => myRombelIds.add(r.id));

    const gradeMatch = myTeacherProfile.assignment.match(/Tingkat (X|XI|XII)/i);
    if (gradeMatch) {
      const targetGrade = gradeMatch[1].toUpperCase();
      rombels.filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
    }

    const ids = new Set<string>();
    const normalizeClassSuffix = (str: string) => {
      if (!str) return '';
      let cleaned = str.trim().replace(/\s+/g, ' ').toUpperCase();
      const parts = cleaned.split(' ');
      const lastPart = parts[parts.length - 1];
      if (!isNaN(Number(lastPart)) && /^\d+$/.test(lastPart)) {
        parts[parts.length - 1] = parseInt(lastPart, 10).toString();
      }
      return parts.join(' ');
    };

    const extractShortName = (fullName: string, grade: string) => {
      const normalizedGrade = grade.trim().toUpperCase();
      const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
      return normalizeClassSuffix(nameWithoutGrade);
    };

    rombels.filter(r => myRombelIds.has(r.id)).forEach(rombel => {
      const targetGrade = rombel.grade.trim().toUpperCase();
      const targetSuffix = extractShortName(rombel.name, rombel.grade);

      students.forEach(s => {
        const sGrade = (s.grade || '').trim().toUpperCase();
        const sSuffix = normalizeClassSuffix(s.class || '');
        if (sGrade === targetGrade && sSuffix === targetSuffix) {
          ids.add(s.id);
        }
      });
    });

    return ids;
  }, [userRole, teachers, currentUser, rombels, students]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        const name = s.name || '';
        const nis = s.nis || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || nis.includes(searchTerm);
        
        // If counselor, restrict to assigned students ("Siswa Asuh") only
        if (userRole === 'counselor' && counselorStudentIds && !counselorStudentIds.has(s.id)) {
          return false;
        }

        return matchesSearch && s.status === activeTab;
      })
      .sort((a, b) => {
        // 1. Sort by Grade (X < XI < XII)
        const grades = ['X', 'XI', 'XII', 'Alumni'];
        const gradeDiff = grades.indexOf(a.grade) - grades.indexOf(b.grade);
        if (gradeDiff !== 0) return gradeDiff;

        // 2. Sort by Class Name/Number (e.g., MIPA 1, MIPA 2)
        const classA = a.class || '';
        const classB = b.class || '';
        const classDiff = classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' });
        if (classDiff !== 0) return classDiff;

        // 3. Sort by Name (A-Z)
        return a.name.localeCompare(b.name);
      });
  }, [students, searchTerm, activeTab, userRole, counselorStudentIds]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const availableClasses = useMemo(() => {
    return rombels.filter(r => r.grade === formData.grade).map(r => getShortClassName(r.name, r.grade));
  }, [rombels, formData.grade]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Database Siswa</h2>
          <p className="text-slate-500 text-sm">Kelola profil dan mutasi kelulusan siswa.</p>
        </div>
        {!isPrincipal && (
          <div className="flex gap-2">
            <button onClick={downloadAccounts} className="bg-violet-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-violet-700 transition-all flex items-center gap-2" title="Unduh Akun Siswa (Username & Password)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
              Unduh Akun
            </button>
            {userRole === 'super_admin' && (
              <>
                <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-emerald-700 transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                  Import
                </button>
                <button onClick={() => { setFormData({ name: '', nis: '', nisn: '', username: '$#', password: generateRandomPassword(), class: '', grade: 'X', isLocked: false, isKM: false, role: 'student' as UserRole }); setIsAddModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  Siswa Baru
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('Aktif')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'Aktif' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Aktif</button>
        <button onClick={() => setActiveTab('Pindah')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'Pindah' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Pindah</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <input type="text" placeholder="Cari nama atau NIS..." className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Kelas</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Akses Akun</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">{s.name.charAt(0)}</div>
                      <div><p className="font-bold text-slate-800">{s.name}</p><p className="text-[10px] text-slate-400 font-mono">NIS: {s.nis}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black">{s.grade} {s.class}</span></td>
                  <td className="px-6 py-4 text-[10px] font-mono"><span className="text-indigo-600">{s.username}</span><br /><span className="text-slate-400">{s.password}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {userRole === 'super_admin' && (
                        <>
                          <button onClick={() => handleOpenEdit(s)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg></button>
                          <button onClick={() => { setStudentToProcess(s); setIsMutationModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 18H3a2 2 0 0 1-2-2V9" /><path d="M10 5h10a2 2 0 0 1 2 2v7" /><path d="m18 13 5-5-5-5" /><path d="m2 13 5-5-5-5" /></svg></button>
                          <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                        </>
                      )}
                      <Link to={`/students/${s.id}`} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> dari <span className="font-bold text-slate-800">{filteredStudents.length}</span> siswa
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
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show current page, and few pages around it
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>;
                  }
                  return null;
                })}
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
      </div>

      {/* Modal Tambah/Edit Siswa Manual */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className={`p-8 text-white ${isEditModalOpen ? 'bg-amber-600' : 'bg-blue-600'}`}>
              <h3 className="text-xl font-black uppercase tracking-tight">{isEditModalOpen ? 'Edit Biodata Siswa' : 'Tambah Siswa Manual'}</h3>
              <p className="text-white/80 text-xs mt-1">Username akan dibuat otomatis berdasarkan NISN/NIS.</p>
            </div>
            <form onSubmit={isEditModalOpen ? handleUpdateStudent : handleSaveNewStudent} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nama Lengkap</label>
                <input required className="w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">NIS</label>
                  <input required className="w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={formData.nis} onChange={e => setFormData({ ...formData, nis: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">NISN</label>
                  <input className="w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm font-bold outline-none" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Tingkat</label>
                  <select className="w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm font-bold" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value, class: '' })}>
                    <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nama Kelas</label>
                  <select required className="w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm font-bold" value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })}>
                    <option value="">-- Pilih --</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Password Login</label>
                <input required className="w-full bg-slate-100 border rounded-2xl px-5 py-3 text-sm font-mono font-bold text-indigo-600" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isLocked ? 'bg-rose-500' : 'bg-slate-300'}`} onClick={() => setFormData({ ...formData, isLocked: !formData.isLocked })}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.isLocked ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-700">Kunci Biodata</p>
                    <p className="text-[8px] text-slate-400">Siswa tidak bisa edit biodata.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isKM ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => setFormData({ ...formData, isKM: !formData.isKM, role: !formData.isKM ? 'ketua_murid' : 'student' })}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.isKM ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-700">Ketua Murid (KM)</p>
                    <p className="text-[8px] text-indigo-400">Dapat melakukan absensi kelas.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Role Akun</label>
                <select className="w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm font-bold" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole, isKM: e.target.value === 'ketua_murid' })}>
                  <option value="student">Siswa Biasa</option>
                  <option value="ketua_murid">Ketua Murid (KM)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase">Batal</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-emerald-600 p-8 text-white">
              <h3 className="text-xl font-black">Import Database Siswa</h3>
              <p className="text-emerald-100 text-xs mt-1">Tambahkan data siswa secara massal menggunakan file Excel.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format Kolom Excel:</h4>
                  <button onClick={downloadTemplate} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Unduh Template
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs font-bold text-slate-600">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nama Lengkap</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> NIS</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> NISN</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tingkat (X/XI/XII)</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nama Kelas</div>
                </div>
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-700">
                  <span className="uppercase font-black">Info:</span> Jika NIS sudah terdaftar, data siswa akan <u>diperbarui</u> (Update). Jika belum, akan <u>ditambahkan</u> (Insert).
                </div>
              </div>

              <label className="block w-full cursor-pointer">
                <div className="w-full p-10 border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50 hover:bg-emerald-100 transition-all text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-3 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                  </div>
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Klik Pilih File Excel</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Format: .xlsx, .xls</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={() => setIsImportModalOpen(false)} className="w-full py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Mutation Modal */}
      {isMutationModalOpen && studentToProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-md shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-slate-900 p-8 text-white">
              <h3 className="text-xl font-black">Mutasi: {studentToProcess.name}</h3>
              <p className="text-slate-400 text-xs mt-1">Pilih tindakan mutasi untuk siswa ini.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setMutationData({ ...mutationData, type: 'PROMOTION' })} className={`py-3 rounded-xl text-[10px] font-black uppercase ${mutationData.type === 'PROMOTION' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>Naik</button>
                <button onClick={() => setMutationData({ ...mutationData, type: 'GRADUATE' })} className={`py-3 rounded-xl text-[10px] font-black uppercase ${mutationData.type === 'GRADUATE' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400'}`}>Lulus</button>
                <button onClick={() => setMutationData({ ...mutationData, type: 'WITHDRAW' })} className={`py-3 rounded-xl text-[10px] font-black uppercase ${mutationData.type === 'WITHDRAW' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-400'}`}>Keluar</button>
              </div>
              {mutationData.type === 'PROMOTION' && (
                <select className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold" value={mutationData.targetRombelId} onChange={e => setMutationData({ ...mutationData, targetRombelId: e.target.value })}>
                  <option value="">Pilih Rombel Tujuan...</option>
                  {rombels.filter(r => r.id !== studentToProcess.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsMutationModalOpen(false)} className="py-4 text-sm font-bold text-slate-400">Batal</button>
                <button onClick={handleMutation} className="py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl">Eksekusi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
