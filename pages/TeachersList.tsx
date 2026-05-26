import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Teacher, Student, Rombel, TeachingSlot, UserRole, AppUser } from '../types';
import * as XLSX from 'xlsx';
import { deleteFromCloud } from '../syncService';

interface TeachersListProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  students: Student[];
  rombels: Rombel[];
  schedule: TeachingSlot[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  appUsers: AppUser[];
  setAppUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

const TeachersList: React.FC<TeachersListProps> = ({
  teachers, setTeachers, students, rombels, schedule, notify, userRole, appUsers, setAppUsers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'Semua' | 'Konselor' | 'Wali Kelas' | 'Guru Mapel' | 'Humas' | 'Kepala Sekolah' | 'Pengawas' | 'Kurikulum'>('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';

  const [newTeacher, setNewTeacher] = useState<Partial<Teacher> & { createAccount?: boolean }>({
    role: 'Wali Kelas',
    createAccount: false
  });

  const [editFormData, setEditFormData] = useState<Partial<Teacher>>({});

  // Helper: Generate Username & Password
  const generateAutoUsername = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '.');
  };

  const generateAutoPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  /**
   * FUNGSI KUNCI UNTUK MEMBEDAKAN KELAS 1, 10, 11, 12
   * Normalisasi string kelas agar "Umum 1" dibaca sama dengan "Umum 01",
   * tapi "Umum 1" TIDAK SAMA dengan "Umum 10".
   * UPDATE: Menghapus leading zero agar "09" dianggap sama dengan "9".
   */
  const normalizeClassSuffix = (str: string) => {
    if (!str) return '';
    // 1. Bersihkan spasi berlebih dan uppercase
    let cleaned = str.trim().replace(/\s+/g, ' ').toUpperCase();

    // 2. Ambil bagian terakhir (nomor kelas)
    const parts = cleaned.split(' ');
    const lastPart = parts[parts.length - 1];

    // 3. Jika bagian terakhir adalah angka, format standar integer (hapus leading zero)
    // Contoh: "09" -> "9", "9" -> "9", "10" -> "10"
    if (!isNaN(Number(lastPart)) && /^\d+$/.test(lastPart)) {
      parts[parts.length - 1] = parseInt(lastPart, 10).toString();
    }

    // Gabungkan kembali: "UMUM 1", "UMUM 10", "UMUM 9"
    return parts.join(' ');
  };

  /**
   * Ekstrak nama kelas (jurusan + nomor) dari nama lengkap rombel
   * Contoh: "X MIPA 1" -> grade "X", return "MIPA 1" (normalized)
   */
  const extractShortName = (fullName: string, grade: string) => {
    const normalizedGrade = grade.trim().toUpperCase();
    // Hapus Grade dari depan nama (case insensitive)
    const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\s*`, 'i'), '');
    return normalizeClassSuffix(nameWithoutGrade);
  };

  // Helper: Auto-Create User Account for Teachers
  const provisionTeacherUser = (teacher: Teacher, forceCreate: boolean) => {
    if (teacher.role !== 'Konselor' && !forceCreate) return null;

    const emailPrefix = teacher.email ? teacher.email.split('@')[0] : generateAutoUsername(teacher.name);
    let assignedUsername = emailPrefix;
    
    // Cek apakah user sudah ada
    const userExists = appUsers.some(u => u.username === assignedUsername || u.name === teacher.name || (u.email && u.email === teacher.email));
    if (userExists) return null;

    let appRole: UserRole = 'teacher';
    if (teacher.role === 'Konselor') appRole = 'counselor';
    if (teacher.role === 'Wali Kelas') appRole = 'homeroom';
    if (teacher.role === 'Humas') appRole = 'humas';
    if (teacher.role === 'Kepala Sekolah') appRole = 'principal';

    const newUserAccount: AppUser = {
      id: `user-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: teacher.name,
      username: assignedUsername,
      email: teacher.email,
      password: generateAutoPassword(),
      role: appRole
    };

    setAppUsers(prev => [...prev, newUserAccount]);
    return newUserAccount;
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const name = t.name || '';
      const nip = t.nip || '';
      const assignment = t.assignment || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nip.includes(searchTerm) ||
        assignment.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'Semua') return matchesSearch;
      return matchesSearch && t.role === activeTab;
    });
  }, [teachers, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(start, start + itemsPerPage);
  }, [filteredTeachers, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const getBinaanInfo = (teacher: Teacher) => {
    if (!teacher) return { count: 0, classNames: '' };
    
    let managedRombels: Rombel[] = [];

    if (teacher.role === 'Wali Kelas') {
      managedRombels = (rombels || []).filter(r => r.homeroomTeacherId === teacher.id);
    } else if (teacher.role === 'Konselor') {
      const scheduledRombelIds = (schedule || [])
        .filter(s => s.teacherId === teacher.id)
        .map(s => s.rombelId);

      const rombelsFromSchedule = (rombels || []).filter(r => scheduledRombelIds.includes(r.id));
      
      // Safety check for assignment string
      const assignmentStr = teacher.assignment || '';
      const gradeMatch = assignmentStr.match(/Tingkat (X|XI|XII)/i);
      
      const rombelsFromGrade = (gradeMatch && gradeMatch[1])
        ? (rombels || []).filter(r => r.grade === gradeMatch[1].toUpperCase())
        : [];

      const combined = [...rombelsFromSchedule, ...rombelsFromGrade];
      managedRombels = Array.from(new Map(combined.map(r => [r.id, r])).values());
    }

    let totalStudents = 0;
    managedRombels.forEach(r => {
      if (!r || !r.grade) return;
      
      const targetGrade = r.grade.trim().toUpperCase();
      const targetSuffix = extractShortName(r.name || '', r.grade);

      totalStudents += (students || []).filter(s =>
        s && s.status === 'Aktif' &&
        (s.grade || '').trim().toUpperCase() === targetGrade &&
        normalizeClassSuffix(s.class || '') === targetSuffix
      ).length;
    });

    return {
      count: totalStudents,
      classNames: managedRombels.map(r => r.name).filter(Boolean).join(', ')
    };
  };

  const downloadTemplate = () => {
    const templateData = [
      { "Nama Lengkap": "Drs. Budi Santoso", "NIP": "197001011995031001", "Peran": "Guru Mapel", "Penugasan": "Matematika" },
      { "Nama Lengkap": "Siti Aminah, S.Pd", "NIP": "198502022010012005", "Peran": "Wali Kelas", "Penugasan": "-" },
      { "Nama Lengkap": "Ahmad Fauzi, M.Psi", "NIP": "199003032015021002", "Peran": "Konselor", "Penugasan": "BK Tingkat X" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Guru");
    XLSX.writeFile(wb, "Template_Import_Guru.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        notify("File kosong atau format salah.", "error");
        return;
      }

      let successCount = 0;
      let provisionedCount = 0;
      const newTeachersList: Teacher[] = [];

      data.forEach((row: any) => {
        if (!row['Nama Lengkap'] || !row['NIP']) return;

        const name = row['Nama Lengkap'];
        const nip = String(row['NIP']);
        const generatedEmail = `${name.toLowerCase().trim().replace(/[^a-z0-9]/g, '.')}@sma.sch.id`;

        let role: 'Konselor' | 'Wali Kelas' | 'Guru Mapel' | 'Humas' = 'Guru Mapel';
        const rawRole = (row['Peran'] || '').toLowerCase();
        if (rawRole.includes('konselor') || rawRole.includes('bk')) role = 'Konselor';
        else if (rawRole.includes('wali')) role = 'Wali Kelas';
        else if (rawRole.includes('humas')) role = 'Humas';
        else if (rawRole.includes('pengawas')) role = 'Pengawas' as any;
        else if (rawRole.includes('kurikulum')) role = 'Kurikulum' as any;

        const teacher: Teacher = {
          id: `t-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: name,
          nip: nip,
          role: role,
          assignment: row['Penugasan'] || '-',
          email: generatedEmail
        };

        newTeachersList.push(teacher);

        // Auto Provision if Counselor
        if (role === 'Konselor') {
          const account = provisionTeacherUser(teacher, false);
          if (account) provisionedCount++;
        }

        successCount++;
      });

      if (successCount > 0) {
        setTeachers(prev => {
          const prevMap = new Map<string, Teacher>(prev.map(t => [t.nip, t]));
          newTeachersList.forEach(newT => {
            if (prevMap.has(newT.nip)) {
              const oldData = prevMap.get(newT.nip)!;
              prevMap.set(newT.nip, { ...newT, id: oldData.id });
            } else {
              prevMap.set(newT.nip, newT);
            }
          });
          return Array.from(prevMap.values());
        });

        setIsImportModalOpen(false);
        const msg = provisionedCount > 0
          ? `Berhasil memproses ${successCount} data. ${provisionedCount} akun Konselor telah diaktifkan otomatis di Manajemen Pengguna.`
          : `Berhasil memproses ${successCount} data.`;
        notify(msg, "success");
      } else {
        notify("Gagal membaca data. Pastikan format sesuai template.", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacher.name && newTeacher.nip) {
      const defaultEmail = `${newTeacher.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '.')}@sma.sch.id`;
      const finalEmail = newTeacher.email?.trim() || defaultEmail;

      const teacherToAdd: Teacher = {
        id: `t${Date.now()}`,
        name: newTeacher.name as string,
        nip: newTeacher.nip as string,
        role: newTeacher.role as any,
        assignment: '-',
        email: finalEmail
      };

      setTeachers([...teachers, teacherToAdd]);

      // Auto Provision
      let provisionMsg = "";
      const account = provisionTeacherUser(teacherToAdd, newTeacher.createAccount || false);
      
      if (account) {
        provisionMsg = ` & Akun akses sistem untuk Login telah dibuat otomatis.`;
      } else if (teacherToAdd.role === 'Konselor') {
        provisionMsg = ` (Gagal membuat akun otomatis, nama/email mungkin sudah terdaftar).`;
      }

      setIsModalOpen(false);
      setNewTeacher({ role: 'Wali Kelas', createAccount: false, email: '' });
      notify(`Guru ${teacherToAdd.name} berhasil didaftarkan${provisionMsg}`, "success");
    }
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({ ...teacher });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher && editFormData.name && editFormData.nip) {
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? (editFormData as Teacher) : t));
      setIsEditModalOpen(false);
      setEditingTeacher(null);
      notify(`Data guru ${editFormData.name} berhasil diperbarui.`, "success");
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data guru ${name}?`)) {
      // Dapatkan data user yang terkait dengan guru ini sebelum dihapus
      const usersToDelete = appUsers.filter(u => u.name === name && u.role === 'counselor');
      
      setTeachers(prev => prev.filter(t => t.id !== id));
      await deleteFromCloud('star_teachers', id);

      // Hapus juga akses akun jika ada (untuk Konselor)
      setAppUsers(prev => prev.filter(u => !(u.name === name && u.role === 'counselor')));
      
      // Hapus user terkait dari cloud
      for (const u of usersToDelete) {
          await deleteFromCloud('star_users', u.id);
      }

      notify(`Data guru ${name} telah dihapus.`, "info");
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Database Guru</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-slate-500 text-sm">Status Sinkronisasi: {students.filter(s => s.status === 'Aktif').length} Siswa Aktif Terhubung</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              type="text"
              placeholder="Cari guru..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!isPrincipal && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Import Excel
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                Tambah Guru
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit mb-6">
        <button onClick={() => setActiveTab('Semua')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Semua' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Semua</button>
        <button onClick={() => setActiveTab('Konselor')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Konselor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Konselor</button>
        <button onClick={() => setActiveTab('Wali Kelas')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Wali Kelas' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Wali Kelas</button>
        <button onClick={() => setActiveTab('Humas')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Humas' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Humas</button>
        <button onClick={() => setActiveTab('Guru Mapel')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Guru Mapel' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500'}`}>Guru Mapel</button>
        <button onClick={() => setActiveTab('Kurikulum')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Kurikulum' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>Kurikulum</button>
        <button onClick={() => setActiveTab('Kepala Sekolah')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Kepala Sekolah' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Kepala Sekolah</button>
        <button onClick={() => setActiveTab('Pengawas')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'Pengawas' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Pengawas</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Guru</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Peran</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Penugasan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa Binaan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTeachers.map((teacher) => {
                const binaan = getBinaanInfo(teacher);
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black border border-indigo-100 shadow-sm">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{teacher.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{teacher.nip}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${teacher.role === 'Konselor' ? 'bg-blue-100 text-blue-700' :
                          teacher.role === 'Wali Kelas' ? 'bg-emerald-100 text-emerald-700' : 
                          teacher.role === 'Humas' ? 'bg-orange-100 text-orange-700' : 
                          teacher.role === 'Pengawas' ? 'bg-purple-100 text-purple-700' :
                          teacher.role === 'Kurikulum' ? 'bg-pink-100 text-pink-700' :
                          teacher.role === 'Kepala Sekolah' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {teacher.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-700 text-xs">{teacher.assignment}</p>
                      <p className="text-[10px] text-slate-400 truncate">{teacher.email}</p>
                    </td>
                    <td className="px-8 py-5">
                      {binaan.count > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-indigo-600">{binaan.count} Siswa</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1 truncate max-w-[150px]" title={binaan.classNames}>
                            {binaan.classNames}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">Belum Ada Binaan</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {!isPrincipal && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2.5 text-slate-400 hover:text-blue-600 transition-all bg-slate-50 rounded-xl hover:bg-blue-50"
                            title="Lihat Biodata"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(teacher)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all bg-slate-50 rounded-xl hover:bg-indigo-50"
                            title="Edit Data"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                          </button>
                          {userRole === 'super_admin' && (
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                              className="p-2.5 text-slate-300 hover:text-rose-500 transition-all bg-slate-50 rounded-xl hover:bg-rose-50"
                              title="Hapus Guru"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredTeachers.length)}</span> dari <span className="font-bold text-slate-800">{filteredTeachers.length}</span> guru
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
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
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

        {filteredTeachers.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 italic">Data guru tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* Modal Import Excel Guru */}
      {isImportModalOpen && !isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-emerald-600 p-8 text-white">
              <h3 className="text-xl font-black">Import Data Guru</h3>
              <p className="text-emerald-100 text-xs mt-1">Tambahkan banyak guru sekaligus menggunakan Excel.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-600 text-sm leading-relaxed">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-xs uppercase tracking-widest text-slate-400">Template Format:</p>
                  <button onClick={downloadTemplate} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Download Template
                  </button>
                </div>
                <p className="text-xs mb-2">Pastikan kolom Excel sesuai dengan template:</p>
                <ul className="list-disc list-inside text-[10px] text-slate-500 font-medium grid grid-cols-2 gap-1">
                  <li>Nama Lengkap (Wajib)</li>
                  <li>NIP (Wajib)</li>
                  <li>Peran (Wali Kelas / Konselor / Humas)</li>
                  <li>Penugasan (Opsional)</li>
                </ul>
                <p className="text-[10px] font-bold text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  *Perhatian: Akun Manajemen Pengguna untuk Konselor baru akan dibuat otomatis.
                </p>
              </div>

              <label className="block w-full cursor-pointer">
                <div className="w-full p-8 border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                  </div>
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Klik untuk Upload File</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Format: .xlsx, .xls</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>

              <div className="flex gap-4">
                <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Guru */}
      {isModalOpen && !isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20">
            <div className="bg-indigo-600 p-8 text-white">
              <h3 className="text-xl font-black">Daftarkan Guru Baru</h3>
              <p className="text-indigo-100 text-xs mt-1">Lengkapi data utama guru. Akun akses sistem (jika Konselor) akan dibuat otomatis.</p>
            </div>
            <form onSubmit={handleAddTeacher} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap & Gelar</label>
                <input
                  autoFocus
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="Contoh: Siti Aminah, S.Pd"
                  value={newTeacher.name || ''}
                  onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIP (18 Digit)</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="19xxxxxxxxxxxxxxxx"
                  value={newTeacher.nip || ''}
                  onChange={e => setNewTeacher({ ...newTeacher, nip: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Opsional)</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="email@sekolah.com"
                  value={newTeacher.email || ''}
                  onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peran Utama</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                  value={newTeacher.role}
                  onChange={e => setNewTeacher({ ...newTeacher, role: e.target.value as any })}
                >
                  <option value="Wali Kelas">Wali Kelas</option>
                  <option value="Konselor">Konselor</option>
                  <option value="Guru Mapel">Guru Mapel</option>
                  <option value="Humas">Humas</option>
                  <option value="Kurikulum">Kurikulum</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Pengawas">Pengawas</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-2 italic">*Jika Konselor, akun akses akan aktif otomatis.</p>
              </div>

              {newTeacher.role !== 'Konselor' && (
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl transition-all hover:bg-indigo-50">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg accent-indigo-600"
                    checked={newTeacher.createAccount}
                    onChange={e => setNewTeacher({ ...newTeacher, createAccount: e.target.checked })}
                  />
                  <div>
                    <p className="text-xs font-bold text-indigo-900">Buat Akun Login Akses Sistem</p>
                    <p className="text-[10px] text-indigo-600">Otomatis buatkan akses login berdasarkan nama / email ini.</p>
                  </div>
                </label>
              )}

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Guru */}
      {isEditModalOpen && editingTeacher && !isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20">
            <div className="bg-slate-900 p-8 text-white">
              <h3 className="text-xl font-black">Edit Data Guru</h3>
              <p className="text-slate-400 text-xs mt-1">Perbarui informasi guru yang terdaftar.</p>
            </div>
            <form onSubmit={handleUpdateTeacher} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap & Gelar</label>
                <input
                  autoFocus
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={editFormData.name || ''}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIP (18 Digit)</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={editFormData.nip || ''}
                  onChange={e => setEditFormData({ ...editFormData, nip: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Instansi</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={editFormData.email || ''}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peran Utama</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                  value={editFormData.role}
                  onChange={e => setEditFormData({ ...editFormData, role: e.target.value as any })}
                >
                  <option value="Wali Kelas">Wali Kelas</option>
                  <option value="Konselor">Konselor</option>
                  <option value="Guru Mapel">Guru Mapel</option>
                  <option value="Humas">Humas</option>
                  <option value="Kurikulum">Kurikulum</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Pengawas">Pengawas</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTeacher(null);
                  }}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest bg-slate-900 text-white rounded-2xl hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL BIODATA GURU (VIEW ONLY) */}
      {isViewModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            {/* Header Profil */}
            <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-blue-600">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="px-8 pb-10 -mt-16 relative">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-xl mb-4">
                  <div className="w-full h-full rounded-[2rem] bg-indigo-50 flex items-center justify-center text-4xl font-black text-indigo-600 border-4 border-indigo-100">
                    {selectedTeacher.name.charAt(0)}
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 text-center">{selectedTeacher.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedTeacher.role === 'Konselor' ? 'bg-blue-100 text-blue-700' :
                    selectedTeacher.role === 'Wali Kelas' ? 'bg-emerald-100 text-emerald-700' : 
                    selectedTeacher.role === 'Humas' ? 'bg-orange-100 text-orange-700' :
                    selectedTeacher.role === 'Pengawas' ? 'bg-purple-100 text-purple-700' :
                    selectedTeacher.role === 'Kurikulum' ? 'bg-pink-100 text-pink-700' :
                    selectedTeacher.role === 'Kepala Sekolah' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedTeacher.role}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {/* Informasi Utama */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Induk Pegawai</p>
                    <p className="font-mono font-bold text-slate-700">{selectedTeacher.nip}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Siswa Binaan</p>
                    <p className="text-lg font-black text-indigo-600">{getBinaanInfo(selectedTeacher).count} <span className="text-xs font-bold text-slate-400">Siswa</span></p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kontak & Penugasan</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <p className="text-sm font-bold text-slate-600">{selectedTeacher.email || '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                      </div>
                      <p className="text-sm font-bold text-slate-600">{selectedTeacher.assignment}</p>
                    </div>
                  </div>
                </div>

                {/* Detail Binaan */}
                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Detail Kelas Binaan</p>
                  <p className="text-sm font-bold text-indigo-700 leading-relaxed italic">
                    {getBinaanInfo(selectedTeacher).classNames || "Belum ada kelas binaan yang terdaftar dalam jadwal."}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  Tutup Biodata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersList;