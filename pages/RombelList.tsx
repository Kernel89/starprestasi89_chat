
import React, { useState, useEffect, useMemo } from 'react';
import { Rombel, Teacher, Student, UserRole, UserSession } from '../types';
import { GradeConfig } from '../App';

interface RombelListProps {
  rombels: Rombel[];
  setRombels: React.Dispatch<React.SetStateAction<Rombel[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  gradesConfig: GradeConfig[];
  setGradesConfig: React.Dispatch<React.SetStateAction<GradeConfig[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  currentUser?: UserSession | null;
  onGraduateCleanup?: (studentIds: string[]) => void;
  handleCleanup?: (mode: 'MUTASI' | 'PROMOTION' | 'GRADUATE', ids: string[]) => void;
  setAlumni: React.Dispatch<React.SetStateAction<Student[]>>;
}

const RombelList: React.FC<RombelListProps> = ({
  rombels,
  setRombels,
  students,
  setStudents,
  teachers,
  gradesConfig,
  setGradesConfig,
  notify,
  userRole,
  currentUser,
  onGraduateCleanup,
  handleCleanup,
  setAlumni
}) => {
  const [activeGrade, setActiveGrade] = useState('Semua');
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [viewingStudentsRombel, setViewingStudentsRombel] = useState<Rombel | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddStudentToRombelOpen, setIsAddStudentToRombelOpen] = useState(false);
  const [newMajorInput, setNewMajorInput] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isGlobalWizardOpen, setIsGlobalWizardOpen] = useState(false);
  const [globalPromotionTarget, setGlobalPromotionTarget] = useState<string>('ALL');
  const [wizardSourceRombel, setWizardSourceRombel] = useState<Rombel | null>(null);
  const [wizardTargetRombelId, setWizardTargetRombelId] = useState('');
  const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);

  // State untuk Kenaikan Individu
  const [individualPromoStudent, setIndividualPromoStudent] = useState<Student | null>(null);
  const [individualTargetRombelId, setIndividualTargetRombelId] = useState('');

  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';
  const isSuperAdmin = userRole === 'super_admin';
  const canMoveStudents = userRole === 'super_admin' || userRole === 'counselor';

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
      parts[parts.length - 1] = lastPart;
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
    const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
    return normalizeClassSuffix(nameWithoutGrade);
  };

  const getRombelStudents = (rombel: Rombel) => {
    // 1. Tentukan target (Grade & Suffix Kelas yang dinormalisasi)
    const targetGrade = rombel.grade.trim().toUpperCase();
    const targetSuffix = extractShortName(rombel.name, rombel.grade);

    return (students || []).filter(s => {
      if (s.status !== 'Aktif') return false;

      // 2. Ambil data siswa
      const sGrade = (s.grade || '').trim().toUpperCase();
      const sSuffix = normalizeClassSuffix(s.class || '');

      // 3. Bandingkan secara presisi (Exact Match setelah normalisasi)
      return sGrade === targetGrade && sSuffix === targetSuffix;
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const cleanClassName = (rawName: string) => {
    if (!rawName) return '';
    return rawName.trim().toUpperCase();
  };

  const [editForm, setEditForm] = useState({
    classNumber: '',
    grade: '',
    major: 'Umum' as Rombel['major'],
    teacherId: '', // Ini Konselor
    classPresidentId: '' // Ini KM (Siswa)
  });

  const studentsInEditingRombel = useMemo(() => {
    if (!editingRombel) return [];
    return getRombelStudents(editingRombel);
  }, [editingRombel, students]);

  const [newRombel, setNewRombel] = useState({
    classNumber: '01',
    grade: gradesConfig?.[0]?.name || 'X',
    major: 'Umum' as Rombel['major'],
    teacherId: '', // Ini Konselor
    classPresidentId: '' // Ini KM
  });

  // LOGIKA AUTO-CALCULATE CLASS NUMBER
  useEffect(() => {
    if (isAddModalOpen) {
      const currentGrade = newRombel.grade;
      const currentMajor = newRombel.major;

      const existingRombels = rombels.filter(r =>
        r.grade === currentGrade &&
        r.major === currentMajor
      );

      const numbers = existingRombels.map(r => {
        const parts = r.name.trim().split(' ');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart) || 0;
      });

      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      // Format menjadi 2 digit (01, 02, ... 12)
      const formattedNum = nextNum > 12 ? '12' : nextNum.toString().padStart(2, '0');

      setNewRombel(prev => ({ ...prev, classNumber: formattedNum }));
    }
  }, [newRombel.grade, newRombel.major, isAddModalOpen, rombels]);

  const eligibleCounselors = useMemo(() => {
    return (teachers || []).filter(t => t.role === 'Konselor');
  }, [teachers]);

  const gradeNames = ['Semua', ...(gradesConfig?.map(g => g.name) || [])];

  // Identifikasi profil guru dari user yang login (untuk Konselor)
  const myTeacherProfile = useMemo(() => {
    if (userRole !== 'counselor' || !currentUser) return null;
    return teachers.find(t => t.name === currentUser.name);
  }, [userRole, currentUser, teachers]);

  // Filter rombel yang boleh diakses berdasarkan role
  const accessibleRombels = useMemo(() => {
    // Admin, Kepsek, Pengawas bisa lihat semua
    if (userRole === 'super_admin' || userRole === 'principal' || userRole === 'supervisor') {
      return rombels;
    }
    // Konselor hanya bisa lihat kelas yang diampunya (homeroomTeacherId matches)
    if (userRole === 'counselor' && myTeacherProfile) {
      const myRombelIds = new Set<string>();
      rombels.filter(r => r.homeroomTeacherId === myTeacherProfile.id).forEach(r => myRombelIds.add(r.id));

      const gradeMatch = myTeacherProfile.assignment.match(/Tingkat (X|XI|XII)/i);
      if (gradeMatch) {
        const targetGrade = gradeMatch[1].toUpperCase();
        rombels.filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
      }
      return rombels.filter(r => myRombelIds.has(r.id));
    }
    // Fallback (jika user tidak teridentifikasi sebagai guru, atau role lain)
    return [];
  }, [rombels, userRole, myTeacherProfile]);

  const filteredRombels = activeGrade === 'Semua'
    ? (accessibleRombels || [])
    : (accessibleRombels || []).filter(r => r.grade === activeGrade);

  const totalPages = Math.ceil(filteredRombels.length / itemsPerPage);
  const paginatedRombels = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRombels.slice(start, start + itemsPerPage);
  }, [filteredRombels, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeGrade]);

  const getTeacherName = (id: string) => {
    return (teachers || []).find(t => t.id === id)?.name || 'Belum Ditentukan';
  };

  const getStudentName = (id: string | undefined) => {
    if (!id) return 'Belum Ada KM';
    return (students || []).find(s => s.id === id)?.name || 'Siswa Tidak Ditemukan';
  };

  const getMajorColor = (major: string) => {
    switch (major) {
      case 'MIPA': return 'blue';
      case 'IPS': return 'emerald';
      case 'Bahasa': return 'amber';
      default: return 'slate';
    }
  };

  const handleRemoveStudentFromClass = (studentId: string) => {
    if (!confirm('Keluarkan siswa ini dari kelas?')) return;
    setStudents(prev => (prev || []).map(s => s.id === studentId ? { ...s, class: 'Belum Ada Kelas' } : s));
  };

  const handleAddStudentToClass = (studentId: string) => {
    if (!viewingStudentsRombel) return;
    // Gunakan normalisasi saat memasukkan siswa ke kelas (menghilangkan pad 0 untuk display natural)
    // Tapi agar konsisten, kita ambil nama short dari rombel tanpa Grade
    const normalizedGrade = viewingStudentsRombel.grade.trim().toUpperCase();
    const rawShortName = viewingStudentsRombel.name.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '').trim();

    setStudents(prev => (prev || []).map(s => s.id === studentId ? {
      ...s,
      grade: viewingStudentsRombel.grade,
      class: rawShortName
    } : s));
    setIsAddStudentToRombelOpen(false);
    notify("Siswa berhasil ditambahkan ke kelas.");
  };

  const handleExecuteIndividualPromotion = () => {
    if (!individualPromoStudent || !individualTargetRombelId) return;
    const targetRombel = rombels.find(r => r.id === individualTargetRombelId);
    if (!targetRombel) return;

    // Mutasi otomatis
    const normalizedGrade = targetRombel.grade.trim().toUpperCase();
    const targetShortName = targetRombel.name.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '').trim();

    setStudents(prev => prev.map(s => {
      if (s.id === individualPromoStudent.id) {
        return {
          ...s,
          grade: targetRombel.grade,
          class: targetShortName
        };
      }
      return s;
    }));

    notify(`Berhasil memindahkan ${individualPromoStudent.name} ke kelas ${targetRombel.name}.`, "success");
    setIndividualPromoStudent(null);
    setIndividualTargetRombelId('');
  };

  const handleDeleteRombel = (id: string, name: string) => {
    if (!isSuperAdmin) return;
    const currentStudents = getRombelStudents(rombels.find(r => r.id === id)!);

    const confirmMsg = currentStudents.length > 0
      ? `Hapus rombel ${name}? Ada ${currentStudents.length} siswa di dalamnya yang akan kehilangan status kelas.`
      : `Apakah Anda yakin ingin menghapus rombel ${name}?`;

    if (confirm(confirmMsg)) {
      setRombels(prev => prev.filter(r => r.id !== id));
      notify(`Rombel ${name} telah dihapus.`, "info");
    }
  };

  const handleExecuteWizard = () => {
    if (!wizardSourceRombel || !wizardTargetRombelId) return;

    const targetRombel = rombels.find(r => r.id === wizardTargetRombelId);
    if (!targetRombel) return;

    const sourceStudents = getRombelStudents(wizardSourceRombel);
    const selectedStudents = sourceStudents.filter(s => !excludedStudentIds.includes(s.id));
    const selectedIds = selectedStudents.map(s => s.id);

    if (selectedIds.length === 0) {
      notify("Tidak ada siswa yang dipilih untuk diproses.", "error");
      return;
    }

    if (confirm(`KONFIRMASI KENAIKAN KELAS:\n\n${selectedStudents.length} Siswa akan naik ke kelas ${targetRombel?.name}.\n\nLanjutkan?`)) {
      setStudents(prev => prev.map(s => {
        if (selectedIds.includes(s.id)) {
          const normalizedGrade = targetRombel.grade.trim().toUpperCase();
          const targetShortName = targetRombel.name.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '').trim();
          return {
            ...s,
            grade: targetRombel!.grade,
            class: targetShortName
          };
        }
        return s;
      }));

      setIsWizardOpen(false);
      setWizardSourceRombel(null);
      setWizardTargetRombelId('');
      setExcludedStudentIds([]);
      
      // Trigger cleanup for promotion (wipe collective data)
      if (handleCleanup) {
        handleCleanup('PROMOTION', selectedIds);
      }
      
      notify(`Berhasil menaikkan ${selectedStudents.length} siswa ke ${targetRombel?.name}.`, "success");
    }
  };

  const handleExecuteGlobalPromotion = () => {
    const gradeOrder = gradesConfig.map(g => g.name.trim().toUpperCase());
    let promotableGrades = gradeOrder; // Sertakan semua angkatan, termasuk jenjang akhir (yang akan diluluskan)

    if (globalPromotionTarget !== 'ALL') {
      promotableGrades = [globalPromotionTarget.trim().toUpperCase()];
    }

    const promotableStudents = students.filter(s =>
      s.status === 'Aktif' &&
      promotableGrades.includes(s.grade.trim().toUpperCase())
    );

    if (promotableStudents.length === 0) {
      notify("Tidak ada siswa yang dapat dipromosikan atau diluluskan pada target yang dipilih.", "error");
      return;
    }

    let confirmMsg = `PERHATIAN: Sistem akan memproses ${promotableStudents.length} siswa secara massal.\nSiswa kelas akhir akan DILULUSKAN dan riwayat lamanya dihapus PERMANEN.\n\nLanjutkan eksekusi massal?`;
    if (globalPromotionTarget !== 'ALL') {
      const isLast = globalPromotionTarget.trim().toUpperCase() === gradeOrder[gradeOrder.length - 1];
      if (isLast) {
         confirmMsg = `PERHATIAN: Anda akan MELULUSKAN ${promotableStudents.length} siswa kelas ${globalPromotionTarget}.\nRiwayat konseling & tes mereka akan dihapus PERMANEN.\n\nLanjutkan kelulusan?`;
      } else {
         confirmMsg = `PERHATIAN: Anda akan MENAIKKAN ${promotableStudents.length} siswa kelas ${globalPromotionTarget} ke jenjang berikutnya.\n\nLanjutkan kenaikan kelas?`;
      }
    }

    if (confirm(confirmMsg)) {
      let successCount = 0;
      let graduateCount = 0;
      let failCount = 0;
      let missingClasses: string[] = [];
      const graduatedStudentIds: string[] = [];
      const movedAlumni: Student[] = [];

      const nextStudents = students.map(s => {
        if (s.status === 'Aktif') {
          const currentGradeIdx = gradeOrder.indexOf(s.grade.trim().toUpperCase());

          if (currentGradeIdx !== -1) {
            if (currentGradeIdx < gradeOrder.length - 1) {
              const nextGradeName = gradeOrder[currentGradeIdx + 1];
              const currentClassName = cleanClassName(s.class); 

              const targetRombel = rombels.find(r =>
                r.grade.trim().toUpperCase() === nextGradeName &&
                normalizeClassSuffix(r.name.replace(nextGradeName, '')) === normalizeClassSuffix(s.class)
              );

              if (targetRombel) {
                successCount++;
                const normalizedGrade = targetRombel.grade.trim().toUpperCase();
                const targetShortName = targetRombel.name.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '').trim();
                return { ...s, grade: nextGradeName, class: targetShortName };
              } else {
                failCount++;
                const needed = `${nextGradeName} ${currentClassName}`;
                if (!missingClasses.includes(needed)) missingClasses.push(needed);
              }
            } else if (currentGradeIdx === gradeOrder.length - 1) {
               // Siswa Lulus Kelas XII
               graduateCount++;
               graduatedStudentIds.push(s.id);
               const alumniData = {
                  id: s.id,
                  name: s.name,
                  nis: s.nis,
                  nisn: s.nisn,
                  username: s.username,
                  password: s.password,
                  phone: s.phone,
                  email: s.email,
                  status: 'Alumni',
                  grade: 'Alumni',
                  class: 'Alumni',
                  graduationClass: `${s.grade} ${s.class}`,
                  graduationYear: new Date().getFullYear(),
                  alumniStatus: 'Lain-lain',
                  lastMood: 'Biasa Saja' as any,
                  attendanceRate: 0,
                  totalSessions: 0,
                  riskLevel: 'Rendah',
                  isLocked: s.isLocked
               } as Student;
               movedAlumni.push(alumniData);
               return null; // Mark for removal from students table
            }
          }
        }
        return s;
      }).filter(s => s !== null) as Student[];

      setStudents(nextStudents);
      setAlumni(prev => [...prev, ...movedAlumni]);

      setIsGlobalWizardOpen(false);
      
      if (graduatedStudentIds.length > 0 && onGraduateCleanup) {
        onGraduateCleanup(graduatedStudentIds);
      }

      if (successCount > 0 || graduateCount > 0) {
        // Trigger cleanup for promotion (wipe collective data)
        if (handleCleanup) {
          handleCleanup('PROMOTION', promotableStudents.map(s => s.id));
        }
        notify(`Proses Selesai: ${successCount} Siswa Naik Kelas, ${graduateCount} Siswa Lulus ke Tracer Alumni.`, "success");
      }
      if (failCount > 0) {
        notify(`${failCount} siswa gagal naik karena Rombel tujuan belum dibuat (${missingClasses.slice(0, 2).join(', ')}...).`, "error");
      }
    }
  };

  const handleToggleExcludeStudent = (id: string) => {
    setExcludedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const findSmartTarget = (source: Rombel) => {
    const nextGrades = (gradesConfig || []).map(g => g.name);
    const currentIdx = nextGrades.indexOf(source.grade);
    if (currentIdx === -1 || currentIdx === nextGrades.length - 1) return '';

    const nextGrade = nextGrades[currentIdx + 1];
    // Use normalized logic for matching target
    const sourceSuffix = normalizeClassSuffix(extractShortName(source.name, source.grade));

    const potential = rombels.find(r =>
      r.grade === nextGrade &&
      normalizeClassSuffix(extractShortName(r.name, r.grade)) === sourceSuffix
    );
    return potential ? potential.id : '';
  };

  const handleOpenWizard = (rombel: Rombel) => {
    setWizardSourceRombel(rombel);
    setWizardTargetRombelId(findSmartTarget(rombel));
    setExcludedStudentIds([]);
    setIsWizardOpen(true);
  };

  useEffect(() => {
    if (editingRombel) {
      const nameParts = editingRombel.name.split(' ');
      const number = nameParts[nameParts.length - 1];

      setEditForm({
        classNumber: isNaN(Number(number)) ? '' : number.padStart(2, '0'),
        grade: editingRombel.grade,
        major: editingRombel.major,
        teacherId: editingRombel.homeroomTeacherId,
        classPresidentId: editingRombel.classPresidentId || ''
      });
    }
  }, [editingRombel]);

  const handleSaveRombel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRombel) return;
    const generatedName = `${editForm.grade} ${editForm.major} ${editForm.classNumber}`;
    setRombels(prev => (prev || []).map(r => r.id === editingRombel.id ? {
      ...r,
      name: generatedName,
      grade: editForm.grade,
      major: editForm.major,
      homeroomTeacherId: editForm.teacherId,
      classPresidentId: editForm.classPresidentId
    } : r));

    // Update isKM flag on students
    if (editingRombel.classPresidentId !== editForm.classPresidentId) {
      setStudents(prev => prev.map(s => {
        if (s.id === editingRombel.classPresidentId) {
          // If they were the old KM, reset their role if it was ketua_murid
          return { ...s, isKM: false, role: s.role === 'ketua_murid' ? 'student' : s.role };
        }
        if (s.id === editForm.classPresidentId) {
          // New KM
          return { ...s, isKM: true, role: 'ketua_murid' as UserRole };
        }
        return s;
      }));
    }

    setEditingRombel(null);
    notify("Perubahan rombel berhasil disimpan.");
  };

  const handleAddNewRombel = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedName = `${newRombel.grade} ${newRombel.major} ${newRombel.classNumber}`;

    if (rombels.some(r => r.name.toLowerCase() === generatedName.toLowerCase())) {
      notify("Gagal: Rombel dengan nama tersebut sudah ada.", "error");
      return;
    }

    const addedRombel: Rombel = {
      id: `r${Date.now()}`,
      name: generatedName,
      grade: newRombel.grade,
      major: newRombel.major,
      homeroomTeacherId: newRombel.teacherId,
      classPresidentId: '',
      studentCount: 0,
      averageAttendance: 100
    };
    setRombels(prev => [...(prev || []), addedRombel]);
    setIsAddModalOpen(false);
    setNewRombel(prev => ({ ...prev, teacherId: '', classPresidentId: '' }));
    notify(`Rombel ${generatedName} berhasil ditambahkan.`);
  };

  const getMajorsForGrade = (gradeName: string): string[] => {
    const config = (gradesConfig || []).find(g => g.name === gradeName);
    return (config?.prefixes as string[]) || ['Umum'];
  };

  const handleAddMajorToGrade = (gradeName: string) => {
    if (!newMajorInput.trim()) return;
    const trimmedMajor = newMajorInput.trim().toUpperCase();

    setGradesConfig(prev => prev.map(g => {
      if (g.name === gradeName) {
        if (g.prefixes.includes(trimmedMajor)) return g;
        return { ...g, prefixes: [...g.prefixes, trimmedMajor] };
      }
      return g;
    }));
    setNewMajorInput('');
  };

  const handleRemoveMajorFromGrade = (gradeName: string, majorToRemove: string) => {
    setGradesConfig(prev => prev.map(g => {
      if (g.name === gradeName) {
        return { ...g, prefixes: g.prefixes.filter(p => p !== majorToRemove) };
      }
      return g;
    }));
  };

  const unassignedStudents = useMemo(() => {
    return students.filter(s => s.status === 'Aktif' && (s.class === 'Belum Ada Kelas' || !s.class));
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 md:px-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Rombongan Belajar</h2>
          <p className="text-slate-500 text-sm">Kelola daftar kelas, ketua murid (KM), dan penugasan Konselor.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isPrincipal && canMoveStudents && (
            <button
              onClick={() => setIsGlobalWizardOpen(true)}
              className="bg-white border border-indigo-200 text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
              Kenaikan Kelas Serentak
            </button>
          )}
          {!isPrincipal && isSuperAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              Tambah Rombel
            </button>
          )}
        </div>
      </header>

      {userRole === 'counselor' && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 text-indigo-700 shadow-sm animate-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          <span className="text-xs font-medium">
            Mode Konselor: Menampilkan kelas yang Anda ampu sebagai pembimbing.
          </span>
        </div>
      )}

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full">
        {gradeNames.map(gradeName => (
          <button
            key={gradeName}
            onClick={() => setActiveGrade(gradeName)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeGrade === gradeName ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {gradeName === 'Semua' ? 'Semua' : `Kelas ${gradeName}`}
          </button>
        ))}
      </div>

      {filteredRombels.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path d="M12 3v6" /></svg>
          </div>
          <p className="text-slate-400 font-bold italic">
            {userRole === 'counselor'
              ? "Anda belum memiliki kelas binaan yang terdaftar."
              : "Belum ada rombel untuk filter ini."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedRombels.map((rombel) => {
              const color = getMajorColor(rombel.major);
              const counselorName = getTeacherName(rombel.homeroomTeacherId);
              const kmName = getStudentName(rombel.classPresidentId);
              const currentStudentCount = getRombelStudents(rombel).length;
              const isXII = rombel.grade === 'XII' || rombel.grade === (gradesConfig[gradesConfig.length - 1]?.name || 'XII');

              return (
                <div key={rombel.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className={`h-2 bg-${color}-500`} />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-slate-800 truncate">{rombel.name}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded bg-${color}-50 text-${color}-700 text-[10px] font-bold uppercase tracking-wider`}>
                          {rombel.major}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-slate-800 leading-none">{currentStudentCount}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Siswa Aktif</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {/* KM Info */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Ketua Murid (KM)</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{kmName}</p>
                        </div>
                      </div>

                      {/* Counselor Info */}
                      <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-indigo-400 font-bold uppercase leading-none mb-1">Konselor Pengampu</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{counselorName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingStudentsRombel(rombel)}
                        className="flex-[2] py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                      >
                        Daftar Siswa
                      </button>
                      {!isPrincipal && (
                        <>
                          {!isXII && (
                            <button
                              title="Wizard Naik Kelas"
                              onClick={() => handleOpenWizard(rombel)}
                              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95"
                            >
                              Naik Kelas
                            </button>
                          )}

                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingRombel(rombel)}
                              className="p-2.5 border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all"
                              title="Edit Rombel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </button>

                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteRombel(rombel.id, rombel.name)}
                                className="p-2.5 border border-slate-200 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all"
                                title="Hapus Rombel"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white px-8 py-4 rounded-[2rem] border shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Global Promotion Confirmation Modal */}
      {isGlobalWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <header className="bg-indigo-600 p-8 text-white shrink-0">
              <h3 className="text-2xl font-black italic tracking-tight uppercase">KENAIKAN KELAS SERENTAK</h3>
              <p className="text-indigo-100 text-xs mt-1">Sistem akan memindahkan seluruh siswa antar jenjang, sekaligus meluluskan siswa tingkat akhir ke Tracer Alumni secara massal.</p>
            </header>
            <div className="p-8 space-y-6">
              <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-200 space-y-3">
                <div className="flex items-center gap-3 text-amber-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  <h4 className="font-black text-sm uppercase">Peringatan Penting</h4>
                </div>
                <ul className="text-xs text-amber-800 space-y-2 list-disc list-inside font-medium leading-relaxed">
                  <li>Pastikan seluruh Rombel target (jenjang atas) sudah dibuat di Database Kelas.</li>
                  <li>Siswa dicocokkan berdasarkan **akhiran nama kelas** (Angka terakhir).</li>
                  <li>Tingkat kelas (X/XI) di akhir nama Rombel target akan otomatis dibersihkan.</li>
                  <li>Otomatis mereset dan memindahkan data siswa tingkat atas (XII) ke *Tracer Alumni*.</li>
                  <li>Data rekam jejak bimbingan (kasus, sesi, absen) untuk siswa tingkat akhir akan <span className="font-black underline text-red-600">Dihapus Permanen</span>. Data yang dipertahankan / dipindahkan hanya Identitas, Kelas Asal, Kontak, Tahun Kelulusan, dan Status.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Target Angkatan</label>
                <div className="relative">
                  <select
                    value={globalPromotionTarget}
                    onChange={(e) => setGlobalPromotionTarget(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  >
                    <option value="ALL">Eksekusi Semua Angkatan</option>
                    {gradesConfig.map((g, idx) => {
                      const isLast = idx === gradesConfig.length - 1;
                      return (
                        <option key={g.name} value={g.name.trim().toUpperCase()}>
                          {isLast ? `Hanya Luluskan Kelas ${g.name}` : `Hanya Naikkan Kelas ${g.name}`}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <button onClick={() => setIsGlobalWizardOpen(false)} className="py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Batal</button>
                <button
                  onClick={handleExecuteGlobalPromotion}
                  className="py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95"
                >
                  Eksekusi Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Wizard Modal (Per Kelas) */}
      {isWizardOpen && wizardSourceRombel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-[95vw] max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <header className="bg-indigo-600 p-8 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight uppercase">WIZARD KENAIKAN KELAS</h3>
                  <p className="text-white/80 text-xs mt-1">
                    Proses pemindahan siswa dari {wizardSourceRombel.name} ke jenjang berikutnya.
                  </p>
                </div>
                <button onClick={() => setIsWizardOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-slate-50/50">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pemetaan Rombel Tujuan</h4>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 w-full text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Dari Kelas</p>
                    <p className="text-lg font-black text-slate-700">{wizardSourceRombel.name}</p>
                  </div>
                  <div className="text-indigo-600 shrink-0 animate-pulse hidden md:block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 px-1 text-center md:text-left">Ke Kelas Tujuan</p>
                    <select
                      className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-5 py-4 text-sm font-black text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={wizardTargetRombelId}
                      onChange={e => setWizardTargetRombelId(e.target.value)}
                    >
                      <option value="">-- Pilih Kelas Tujuan --</option>
                      {rombels.filter(r => r.id !== wizardSourceRombel.id).map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.grade})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Siswa (Ceklis yang naik)</h4>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase bg-indigo-50 text-indigo-600">
                    Total: {getRombelStudents(wizardSourceRombel).length} Siswa
                  </span>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                    {getRombelStudents(wizardSourceRombel).map(s => (
                      <label key={s.id} className={`flex items-center gap-4 p-4 transition-all cursor-pointer hover:bg-slate-50 ${excludedStudentIds.includes(s.id) ? 'bg-rose-50/30 opacity-60' : ''}`}>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg cursor-pointer accent-indigo-600"
                          checked={!excludedStudentIds.includes(s.id)}
                          onChange={() => handleToggleExcludeStudent(s.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${excludedStudentIds.includes(s.id) ? 'text-rose-600 line-through' : 'text-slate-700'}`}>{s.name}</p>
                          <p className="text-[9px] font-mono text-slate-400 uppercase">NIS: {s.nis}</p>
                        </div>
                        {excludedStudentIds.includes(s.id) && (
                          <span className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase animate-in zoom-in">Tinggal Kelas</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <footer className="p-8 bg-white border-t border-slate-100 shrink-0">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsWizardOpen(false)} className="py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                <button
                  disabled={!wizardTargetRombelId}
                  onClick={handleExecuteWizard}
                  className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${!wizardTargetRombelId
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                    } active:scale-95`}
                >
                  Eksekusi Kenaikan ({getRombelStudents(wizardSourceRombel).length - excludedStudentIds.length})
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Modal View Students */}
      {viewingStudentsRombel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl h-full max-h-[95vh] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col border border-white/20">
            <div className="bg-slate-900 p-6 md:p-8 text-white flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-xl md:text-2xl font-black">Daftar Siswa {viewingStudentsRombel.name}</h3>
                <p className="text-slate-400 text-xs mt-1">Total: {getRombelStudents(viewingStudentsRombel).length} Siswa Aktif</p>
              </div>
              {!isPrincipal && (
                <button
                  onClick={() => setIsAddStudentToRombelOpen(true)}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                  Tambah Siswa ke Kelas
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Identitas</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(viewingStudentsRombel ? getRombelStudents(viewingStudentsRombel) : []).map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{student.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono sm:hidden">NIS: {student.nis}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-mono text-slate-500 hidden sm:table-cell">
                        NIS: {student.nis}<br />NISN: {student.nisn}
                      </td>
                      <td className="py-4 text-right">
                        {canMoveStudents && (
                          <div className="flex justify-end gap-2">
                            {/* Tombol Naik Kelas Individu / Pindah Kelas */}
                            <button
                              onClick={() => setIndividualPromoStudent(student)}
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-indigo-50/50 rounded-lg"
                              title="Pindahkan Siswa ke Kelas Lain"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
                            </button>
                            <button
                              onClick={() => handleRemoveStudentFromClass(student.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-rose-50/50 rounded-lg"
                              title="Keluarkan dari Kelas"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setViewingStudentsRombel(null)} className="w-full sm:w-auto px-8 py-3 text-sm font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kenaikan Kelas Individu (Sub-Modal) / Pindah Kelas Manual */}
      {individualPromoStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <header className="bg-indigo-600 p-8 text-white">
              <h3 className="text-xl font-black uppercase tracking-tight">Pindah Kelas / Mutasi Siswa</h3>
              <p className="text-indigo-100 text-xs mt-1">Siswa: {individualPromoStudent.name}</p>
            </header>
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ketua Murid (KM)</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  value={editForm.classPresidentId}
                  onChange={e => setEditForm({ ...editForm, classPresidentId: e.target.value })}
                >
                  <option value="">-- Pilih Ketua Murid --</option>
                  {studentsInEditingRombel.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas Tujuan</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  value={individualTargetRombelId}
                  onChange={e => setIndividualTargetRombelId(e.target.value)}
                >
                  <option value="">-- Pilih Rombel --</option>
                  {rombels.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.grade})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIndividualPromoStudent(null)} className="py-4 text-sm font-bold text-slate-400 uppercase">Batal</button>
                <button
                  disabled={!individualTargetRombelId}
                  onClick={handleExecuteIndividualPromotion}
                  className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${!individualTargetRombelId ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white'}`}
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Rombel */}
      {isAddModalOpen && !isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-[92vw] sm:max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20 my-auto">
            <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-xl font-black relative z-10">Tambah Rombel Baru</h3>
              <p className="text-indigo-100 text-xs mt-1 relative z-10">Konfigurasi kelas dan penugasan guru.</p>
            </div>
            <form onSubmit={handleAddNewRombel} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pratinjau Nama Kelas</p>
                <div className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-lg font-black shadow-lg shadow-indigo-100">
                  {`${newRombel.grade} ${newRombel.major} ${newRombel.classNumber}`}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tingkat</label>
                    <select
                      className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={newRombel.grade}
                      onChange={e => setNewRombel({ ...newRombel, grade: e.target.value, major: (getMajorsForGrade(e.target.value)[0] as any) || 'Umum' })}
                    >
                      {gradesConfig.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Jurusan</label>
                    <select
                      className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={newRombel.major}
                      onChange={e => setNewRombel({ ...newRombel, major: e.target.value as any })}
                    >
                      {(getMajorsForGrade(newRombel.grade) || []).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Kelola Daftar Jurusan (Tingkat {newRombel.grade})</label>
                  <div className="flex flex-wrap gap-1.5">
                    {getMajorsForGrade(newRombel.grade).map((m, i) => (
                      <span key={i} className="group/tag inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700">
                        {m}
                        <button
                          type="button"
                          onClick={() => handleRemoveMajorFromGrade(newRombel.grade, m)}
                          className="text-indigo-300 hover:text-rose-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah baru..."
                      className="flex-1 bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newMajorInput}
                      onChange={e => setNewMajorInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddMajorToGrade(newRombel.grade))}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMajorToGrade(newRombel.grade)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nomor Kelas</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="01"
                    value={newRombel.classNumber}
                    onChange={e => setNewRombel({ ...newRombel, classNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Konselor Pengampu</label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={newRombel.teacherId}
                    onChange={e => setNewRombel({ ...newRombel, teacherId: e.target.value })}
                  >
                    <option value="">-- Pilih Konselor --</option>
                    {eligibleCounselors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-slate-50">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 active:scale-95 transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Rombel */}
      {editingRombel && !isPrincipal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-[92vw] sm:max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20 my-auto">
            <div className="bg-slate-900 p-8 text-white">
              <h3 className="text-xl font-black">Edit Data Rombel</h3>
              <p className="text-slate-400 text-xs mt-1">Perbarui informasi rombel, KM, dan konselor pengampu.</p>
            </div>
            <form onSubmit={handleSaveRombel} className="p-6 md:p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pratinjau Nama Baru</p>
                <div className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-lg font-black shadow-lg shadow-indigo-100">
                  {`${editForm.grade} ${editForm.major} ${editForm.classNumber}`}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tingkat</label>
                    <select
                      className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold"
                      value={editForm.grade}
                      onChange={e => setEditForm({ ...editForm, grade: e.target.value, major: (getMajorsForGrade(e.target.value)[0] as any) || 'Umum' })}
                    >
                      {gradesConfig.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Pilih Jurusan</label>
                    <select
                      className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold"
                      value={editForm.major}
                      onChange={e => setEditForm({ ...editForm, major: e.target.value as any })}
                    >
                      {(getMajorsForGrade(editForm.grade) || []).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Kelola Daftar Jurusan (Tingkat {editForm.grade})</label>
                  <div className="flex flex-wrap gap-1.5">
                    {getMajorsForGrade(editForm.grade).map((m, i) => (
                      <span key={i} className="group/tag inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700">
                        {m}
                        <button
                          type="button"
                          onClick={() => handleRemoveMajorFromGrade(editForm.grade, m)}
                          className="text-indigo-300 hover:text-rose-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah baru..."
                      className="flex-1 bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newMajorInput}
                      onChange={e => setNewMajorInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddMajorToGrade(editForm.grade))}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMajorToGrade(editForm.grade)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-700"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nomor Kelas</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border rounded-xl p-3 text-sm font-bold"
                    value={editForm.classNumber}
                    onChange={e => setEditForm({ ...editForm, classNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Konselor Pengampu</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={editForm.teacherId}
                    onChange={e => setEditForm({ ...editForm, teacherId: e.target.value })}
                  >
                    <option value="">-- Pilih Konselor --</option>
                    {eligibleCounselors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Ketua Murid (KM)</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={editForm.classPresidentId}
                    onChange={e => setEditForm({ ...editForm, classPresidentId: e.target.value })}
                  >
                    <option value="">-- Pilih KM dari Siswa --</option>
                    {getRombelStudents(editingRombel).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <p className="text-[9px] text-slate-400 italic mt-1">*Dipilih dari siswa yang terdaftar di kelas ini.</p>
                </div>
              </div>
              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-slate-100">
                <button type="button" onClick={() => setEditingRombel(null)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Student To Rombel Sub-Modal */}
      {isAddStudentToRombelOpen && viewingStudentsRombel && !isPrincipal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-[95vw] max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20">
            <div className="bg-indigo-600 p-8 text-white">
              <h3 className="text-xl font-black">Tambah Siswa ke {viewingStudentsRombel.name}</h3>
              <p className="text-indigo-100 text-xs mt-1">Hanya menampilkan siswa yang belum memiliki kelas aktif.</p>
            </div>
            <div className="p-6 md:p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {unassignedStudents.length > 0 ? (
                unassignedStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleAddStudentToClass(student.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-400 group-hover:text-indigo-600 shadow-sm">{student.name.charAt(0)}</div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">NIS: {student.nis}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Tambahkan +</span>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 italic text-sm">
                  Tidak ada siswa tanpa kelas yang tersedia.
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setIsAddStudentToRombelOpen(false)} className="px-6 py-2 text-sm font-bold text-slate-500 uppercase tracking-widest">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RombelList;
