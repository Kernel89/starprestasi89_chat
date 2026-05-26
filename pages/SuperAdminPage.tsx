import React, { useState, useEffect } from 'react';
import { ClassReport, AttendanceLog, Student } from '../types';
import { pushToCloud, pullFromCloud } from '../syncService';
import { idbGet } from '../useLocalStorage';

interface SuperAdminPageProps {
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  classReports: ClassReport[];
  attendanceLogs: AttendanceLog[];
  students: Student[];
  forumPosts: any[];
  submissions: any[];
  eqSubmissions?: any[];
  aqSubmissions?: any[];
  sqSubmissions?: any[];
  // Add all the 'set' functions for your data states here
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setTeachers: React.Dispatch<React.SetStateAction<any[]>>;
  setRombels: React.Dispatch<React.SetStateAction<any[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<any[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>;
  setSessions: React.Dispatch<React.SetStateAction<any[]>>;
  setHomeVisits: React.Dispatch<React.SetStateAction<any[]>>;
  setAdvocacies: React.Dispatch<React.SetStateAction<any[]>>;
  setConferences: React.Dispatch<React.SetStateAction<any[]>>;
  setReferrals: React.Dispatch<React.SetStateAction<any[]>>;
  setMaterials: React.Dispatch<React.SetStateAction<any[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<any[]>>;
  setSubmissions: React.Dispatch<React.SetStateAction<any[]>>;
  setQuestionnaireSubmissions: React.Dispatch<React.SetStateAction<any[]>>;
  setStarData: React.Dispatch<React.SetStateAction<any[]>>;
  setFeedbacks: React.Dispatch<React.SetStateAction<any[]>>;
  setSociometrySessions: React.Dispatch<React.SetStateAction<any[]>>;
  setAttendanceLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setClassReports: React.Dispatch<React.SetStateAction<any[]>>;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setEqSubmissions?: React.Dispatch<React.SetStateAction<any[]>>;
  setAqSubmissions?: React.Dispatch<React.SetStateAction<any[]>>;
  setSqSubmissions?: React.Dispatch<React.SetStateAction<any[]>>;
}

const SuperAdminPage: React.FC<SuperAdminPageProps> = ({
  notify,
  classReports,
  attendanceLogs,
  students,
  forumPosts,
  submissions,
  setStudents,
  setTeachers,
  setRombels,
  setSchedule,
  setAppointments,
  setSessions,
  setHomeVisits,
  setAdvocacies,
  setConferences,
  setReferrals,
  setMaterials,
  setAssignments,
  setSubmissions,
  setQuestionnaireSubmissions,
  setStarData,
  setFeedbacks,
  setSociometrySessions,
  setAttendanceLogs,
  setClassReports,
  setMessages,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA';

  const handleReconstructAttendance = () => {
    const approvedReports = classReports.filter(r => r.status === 'Approved');
    let addedCount = 0;

    const newLogs: AttendanceLog[] = [];

    approvedReports.forEach(report => {
      report.absentees.forEach(absentee => {
        const logId = `att-report-${report.id}-${absentee.studentId}`;
        const exists = attendanceLogs.some(l => l.id === logId);

        if (!exists) {
          newLogs.push({
            id: logId,
            studentId: absentee.studentId,
            slotId: `report-${report.rombelId}`,
            date: report.date,
            timestamp: new Date().toISOString(),
            status: absentee.status === 'H' ? 'Hadir' : absentee.status === 'S' ? 'Sakit' : absentee.status === 'I' ? 'Izin' : 'Alfa',
          });
          addedCount++;
        }
      });
    });

    if (newLogs.length > 0) {
      setAttendanceLogs(prev => [...prev, ...newLogs]);
      notify(`Berhasil memulihkan ${addedCount} data absensi dari laporan yang sudah disetujui.`, 'success');
    } else {
      notify('Tidak ada data absensi yang perlu dipulihkan.', 'info');
    }
  };

  const handleBackupData = async () => {
    try {
      const allLocalStorageData: { [key: string]: string } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allLocalStorageData[key] = localStorage.getItem(key) || '';
        }
      }

      const blob = new Blob([JSON.stringify(allLocalStorageData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `star_prestasi_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('Data berhasil di-backup dan diunduh.', 'success');
    } catch (error) {
      console.error('Error backing up data:', error);
      notify('Gagal melakukan backup data.', 'error');
    }
  };

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      notify('Tidak ada file yang dipilih untuk restore.', 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const dataToRestore = JSON.parse(content);

        if (window.confirm('Apakah Anda yakin ingin mengembalikan data? Sistem akan dimuat ulang setelah proses selesai untuk menerapkan data baru.')) {
          // Clear existing localStorage data related to the app
          const appKeys = Object.keys(localStorage).filter(key => key.startsWith('star_'));
          appKeys.forEach(key => {
            localStorage.removeItem(key);
          });

          // Apply restored data
          for (const key in dataToRestore) {
            if (Object.prototype.hasOwnProperty.call(dataToRestore, key)) {
              localStorage.setItem(key, dataToRestore[key]);
            }
          }

          notify('Data berhasil dipulihkan. Sistem sedang dimuat ulang...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        console.error('Error restoring data:', error);
        notify('Gagal memulihkan data. Pastikan file adalah JSON yang valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAllData = async () => {
    if (confirmationText === CONFIRMATION_PHRASE) {
      // Auto backup first before deleting
      await handleBackupData();

      // Reset data states except preserved ones:
      // Preserved: Manajemen User (appUsers), Pusat Karir (universities, etc), 
      // Tracer Alumni (students with status 'Alumni'), Info Pengembang (devBioData), 
      // Materi & Modul (materials), Konfigurasi Sekolah (schoolProfile, gradesConfig, quotes)

      setStudents(prev => prev.filter(s => s.status === 'Alumni'));
      setTeachers([]);
      setRombels([]);
      setSchedule([]);
      setAppointments([]);
      setSessions([]);
      setHomeVisits([]);
      setAdvocacies([]);
      setConferences([]);
      setReferrals([]);
      // setMaterials([]); // Preserved: Materi & Modul
      setAssignments([]);
      setSubmissions([]);
      setQuestionnaireSubmissions([]);
      setStarData([]);
      setFeedbacks([]);
      setSociometrySessions([]);
      setAttendanceLogs([]);
      setClassReports([]);
      setMessages([]);

      localStorage.removeItem('star_forumPosts');

      notify('Data aplikasi telah direset. Sistem sedang dimuat ulang untuk membersihkan memori...', 'success');
      setConfirmationText('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      notify('Teks konfirmasi tidak cocok. Aksi dibatalkan.', 'error');
    }
  };

  const handleDeduplicateStudents = () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data siswa yang ganda? Aksi ini akan membersihkan data lokal berdasarkan kesamaan Nama, NIS, dan NISN.')) return;

    setStudents(prev => {
      const seen = new Set();
      const cleaned: any[] = [];
      let duplicateCount = 0;

      prev.forEach(student => {
        const key = `${student.name || ''}-${student.nis || ''}-${student.nisn || ''}`.trim().toLowerCase();
        if (seen.has(key)) {
          duplicateCount++;
        } else {
          seen.add(key);
          cleaned.push(student);
        }
      });

      if (duplicateCount > 0) {
        notify(`Berhasil menemukan dan menghapus ${duplicateCount} data siswa ganda.`, 'success');
        
        // Trigger auto-sync (push) after state update
        setTimeout(() => {
          pushToCloud(notify);
        }, 1000);
        
        return cleaned;
      } else {
        notify('Tidak ditemukan data siswa yang ganda.', 'info');
        return prev;
      }
    });
  };

  const handleDeduplicateKampusProdi = () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ganda untuk Kampus Umum dan Rasio Prodi? Data yang dipertahankan adalah data yang terbaru.')) return;

    try {
      let duplicateCountUni = 0;
      let duplicateCountProdi = 0;

      // Deduplicate Kampus Umum
      const rawUni = localStorage.getItem('star_universities');
      if (rawUni) {
        const uniArr = JSON.parse(rawUni);
        if (Array.isArray(uniArr)) {
          // Keep newest (last occurrence)
          const seenUni = new Map();
          const keepItemsUni = [];
          for (const item of uniArr) {
            const key = (item.name || '').trim().toLowerCase();
            if (key) {
              seenUni.set(key, item); // overwrites with newer
            } else {
              keepItemsUni.push(item);
            }
          }
          const cleanedUni = [...Array.from(seenUni.values()), ...keepItemsUni];
          duplicateCountUni = uniArr.length - cleanedUni.length;
          if (duplicateCountUni > 0) {
            localStorage.setItem('star_universities', JSON.stringify(cleanedUni));
          }
        }
      }

      // Deduplicate Rasio Prodi
      const rawProdi = localStorage.getItem('star_studyPrograms');
      if (rawProdi) {
        const prodiArr = JSON.parse(rawProdi);
        if (Array.isArray(prodiArr)) {
          // Keep newest (last occurrence)
          const seenProdi = new Map();
          const keepItemsProdi = [];
          for (const item of prodiArr) {
            const ptName = (item.pt_name || '').trim().toLowerCase();
            const prodiName = (item.nama_prodi || '').trim().toLowerCase();
            const key = `${ptName}-${prodiName}`;
            if (key !== '-') {
              seenProdi.set(key, item); // overwrites with newer
            } else {
              keepItemsProdi.push(item);
            }
          }
          const cleanedProdi = [...Array.from(seenProdi.values()), ...keepItemsProdi];
          duplicateCountProdi = prodiArr.length - cleanedProdi.length;
          if (duplicateCountProdi > 0) {
            localStorage.setItem('star_studyPrograms', JSON.stringify(cleanedProdi));
          }
        }
      }

      if (duplicateCountUni > 0 || duplicateCountProdi > 0) {
        notify(`Berhasil menghapus ${duplicateCountUni} data kampus ganda dan ${duplicateCountProdi} data prodi ganda. Memuat ulang sistem...`, 'success');
        setTimeout(() => {
          pushToCloud(notify);
          setTimeout(() => window.location.reload(), 1000);
        }, 500);
      } else {
        notify('Tidak ditemukan data ganda pada kampus maupun prodi.', 'info');
      }
    } catch (e) {
      console.error(e);
      notify('Gagal menghapus data ganda.', 'error');
    }
  };

  const TABLE_GROUPS = [
    {
      title: 'Data Master Akademik',
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50',
      borderColor: 'border-indigo-100',
      tables: [
        { key: 'star_students', dbName: 'star_students', label: 'Daftar Siswa', desc: 'Biodata siswa aktif', icon: '👤' },
        { key: 'star_alumni', dbName: 'star_alumni', label: 'Tracer Alumni', desc: 'Data penelusuran lulusan', icon: '🎓' },
        { key: 'star_teachers', dbName: 'star_teachers', label: 'Daftar Guru', desc: 'Direktori pendidik & wali kelas', icon: '👥' },
        { key: 'star_rombels', dbName: 'star_rombels', label: 'Rombongan Belajar', desc: 'Data pembagian kelas', icon: '🏫' },
        { key: 'star_appUsers', dbName: 'star_appUsers', label: 'Akun Pengguna', desc: 'Kredensial login sistem', icon: '🔑' },
      ]
    },
    {
      title: 'Layanan & Bimbingan BK',
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50',
      borderColor: 'border-emerald-100',
      tables: [
        { key: 'star_sessions', dbName: 'star_sessions', label: 'Sesi Konseling', desc: 'Bimbingan Pribadi/Kelompok/Klasikal', icon: '💬' },
        { key: 'star_privateCounseling', dbName: 'star_privateCounseling', label: 'Konseling Privat Chat', desc: 'Konseling online real-time', icon: '🔒' },
        { key: 'star_appointments', dbName: 'star_appointments', label: 'Janji Temu', desc: 'Kalender agenda terjadwal', icon: '📅' },
        { key: 'star_homeVisits', dbName: 'star_homeVisits', label: 'Kunjungan Rumah', desc: 'Log kunjungan ke rumah siswa', icon: '🏠' },
        { key: 'star_advocacies', dbName: 'star_advocacies', label: 'Kasus Advokasi', desc: 'Pendampingan masalah siswa', icon: '🛡️' },
        { key: 'star_conferences', dbName: 'star_conferences', label: 'Konferensi Kasus', desc: 'Musyawarah penyelesaian kasus', icon: '🤝' },
        { key: 'star_referrals', dbName: 'star_referrals', label: 'Alih Tangan Kasus', desc: 'Delegasi kasus ke pakar luar', icon: '📤' },
      ]
    },
    {
      title: 'Asesmen & Instrumen Evaluasi',
      color: 'from-rose-600 to-orange-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50/50',
      borderColor: 'border-rose-100',
      tables: [
        { key: 'star_assignments', dbName: 'star_assignments', label: 'Tugas & Angket', desc: 'Daftar penugasan aktif', icon: '📝' },
        { key: 'star_submissions', dbName: 'star_submissions', label: 'Pengumpulan DCM', desc: 'Riwayat pengumpulan DCM siswa', icon: '📝' },
        { key: 'star_questionnaireSubmissions', dbName: 'star_questionnaireSubmissions', label: 'Jawaban MBTI', desc: 'Hasil tes kepribadian MBTI', icon: '🧠' },
        { key: 'star_eqSubmissions', dbName: 'star_eqSubmissions', label: 'Jawaban EQ', desc: 'Hasil tes kecerdasan emosional', icon: '❤️' },
        { key: 'star_aqSubmissions', dbName: 'star_aqSubmissions', label: 'Jawaban AQ', desc: 'Hasil tes adversity quotient', icon: '🛡️' },
        { key: 'star_sqSubmissions', dbName: 'star_sqSubmissions', label: 'Jawaban SQ', desc: 'Hasil tes kecerdasan spiritual', icon: '✨' },
        { key: 'star_sociometrySessions', dbName: 'star_sociometrySessions', label: 'Sesi Sosiometri', desc: 'Pemetaan hubungan sosial kelas', icon: '🌐' },
        { key: 'star_feedbacks', dbName: 'star_feedbacks', label: 'Kepuasan Layanan', desc: 'E-Kepuasan penilaian BK', icon: '⭐' },
      ]
    },
    {
      title: 'Pusat Karir & Pendidikan',
      color: 'from-violet-600 to-purple-600',
      textColor: 'text-violet-600',
      bgColor: 'bg-violet-50/50',
      borderColor: 'border-violet-100',
      tables: [
        { key: 'star_mengenalProdi', dbName: 'star_mengenalProdi', label: 'Mengenal Prodi', desc: 'Selayang pandang materi prodi', icon: '📖' },
        { key: 'star_universities', dbName: 'star_universities', label: 'Daftar Kampus PT', desc: 'Informasi kampus PTN/PTS', icon: '🏛️' },
        { key: 'star_studyPrograms', dbName: 'star_studyPrograms', label: 'Program Studi & Rasio', desc: 'Rasio daya tampung prodi', icon: '📈' },
      ]
    },
    {
      title: 'Log, Sistem & Konfigurasi',
      color: 'from-slate-600 to-slate-800',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50/50',
      borderColor: 'border-slate-100',
      tables: [
        { key: 'star_attendanceLogs', dbName: 'star_attendanceLogs', label: 'Log Absensi', desc: 'Catatan kehadiran siswa', icon: '📋' },
        { key: 'star_classReports', dbName: 'star_classReports', label: 'Laporan Ketua Kelas', desc: 'Jurnal harian kondisi kelas', icon: '✏️' },
        { key: 'star_materials', dbName: 'star_materials', label: 'Materi & Modul', desc: 'Bahan bacaan & panduan BK', icon: '📚' },
        { key: 'star_forumPosts', dbName: 'star_forumPosts', label: 'Postingan Forum', desc: 'Interaksi di forum angkatan', icon: '📣' },
        { key: 'star_messages', dbName: 'star_messages', label: 'Pesan Chat', desc: 'Pesan di chat massal/umum', icon: '✉️' },
        { key: 'star_quotes', dbName: 'star_quotes', label: 'Kata Mutiara', desc: 'Quotes motivasi dashboard', icon: '💭' },
        { key: 'star_methodSteps', dbName: 'star_methodSteps', label: 'Metode Layanan BK', desc: 'Langkah alur kerja BK', icon: '🔄' },
        { key: 'star_counselorProfiles', dbName: 'star_counselorProfiles', label: 'Profil Konselor', desc: 'Biodata staf BK aktif', icon: '👔' },
        { key: 'star_schoolProfile', dbName: 'star_schoolProfile', label: 'Profil Sekolah', desc: 'Informasi umum instansi', icon: '🏠' },
      ]
    }
  ];

  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const group of TABLE_GROUPS) {
        for (const tbl of group.tables) {
          if (tbl.key === 'star_students') counts[tbl.key] = students.length;
          else if (tbl.key === 'star_attendanceLogs') counts[tbl.key] = attendanceLogs.length;
          else if (tbl.key === 'star_classReports') counts[tbl.key] = classReports.length;
          else if (tbl.key === 'star_forumPosts') counts[tbl.key] = forumPosts.length;
          else if (tbl.key === 'star_submissions') counts[tbl.key] = submissions.length;
          else {
            try {
              const data = await idbGet(tbl.key);
              if (data) {
                if (Array.isArray(data)) counts[tbl.key] = data.length;
                else if (typeof data === 'object') counts[tbl.key] = tbl.key === 'star_schoolProfile' ? (data.name ? 1 : 0) : Object.keys(data).length;
                else counts[tbl.key] = 1;
              } else {
                counts[tbl.key] = 0;
              }
            } catch {
              counts[tbl.key] = 0;
            }
          }
        }
      }
      setTableCounts(counts);
    };
    fetchCounts();
  }, [refreshTrigger, students, attendanceLogs, classReports, forumPosts, submissions]);

  // Memoized counts to avoid unnecessary re-calculations on every render
  const tableStats = React.useMemo(() => {
    let grandTotal = 0;
    let tablesWithData = 0;
    const computedGroups = TABLE_GROUPS.map(group => {
      let groupTotal = 0;
      const computedTables = group.tables.map(tbl => {
        const count = tableCounts[tbl.key] || 0;
        groupTotal += count;
        grandTotal += count;
        if (count > 0) tablesWithData++;
        return { ...tbl, count };
      });
      return { ...group, tables: computedTables, groupTotal };
    });

    return {
      groups: computedGroups,
      grandTotal,
      tablesWithData,
      totalTables: TABLE_GROUPS.reduce((acc, g) => acc + g.tables.length, 0),
    };
  }, [tableCounts]);

  const handleRefreshCounts = () => {
    setRefreshTrigger(prev => prev + 1);
    notify('Status dan jumlah baris database diperbarui!', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Super Admin Hub</h2>
          <p className="text-slate-500 text-sm">Panel konfigurasi tingkat tinggi, sinkronisasi cloud, dan audit database.</p>
        </div>
        <button
          onClick={handleRefreshCounts}
          className="self-start md:self-auto bg-white hover:bg-slate-50 text-indigo-900 border-2 border-indigo-100 font-black text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all active:scale-95 uppercase tracking-widest"
        >
          <svg className="w-4 h-4 animate-spin-slow text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Segarkan Data Audit
        </button>
      </header>

      {/* Spectacular Database Row Audit Section */}
      <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Real-Time Database Inspector</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">Laporan Kapasitas Tabel (D1 & Local)</h3>
            <p className="text-slate-500 text-xs mt-1">Audit mendalam jumlah baris data yang tersimpan di seluruh 30 tabel aplikasi.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama tabel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 placeholder-slate-400 px-4 py-2.5 w-60 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Audit KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute -right-4 -bottom-4 text-white/5 text-8xl font-black select-none pointer-events-none group-hover:scale-110 transition-transform">Σ</div>
            <p className="text-[10px] font-black tracking-widest uppercase text-indigo-300">Grand Total Data</p>
            <h4 className="text-4xl font-black mt-2 tracking-tight">{tableStats.grandTotal.toLocaleString('id-ID')}</h4>
            <p className="text-[10px] text-indigo-200 font-medium mt-1">Baris data aktif di memori</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Total Tabel Terdaftar</p>
            <h4 className="text-4xl font-black mt-2 tracking-tight text-slate-800">{tableStats.totalTables}</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Skema Cloud D1 sinkron</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Tabel Terisi Data</p>
            <h4 className="text-4xl font-black mt-2 tracking-tight text-emerald-600">{tableStats.tablesWithData} <span className="text-xs text-slate-400">/ {tableStats.totalTables}</span></h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Efisiensi penggunaan skema</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Rata-rata Kepadatan</p>
            <h4 className="text-4xl font-black mt-2 tracking-tight text-indigo-600">{Math.round(tableStats.grandTotal / tableStats.totalTables)}</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Baris per tabel skema</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 overflow-x-auto gap-2 mb-8 pb-1 custom-scrollbar">
          <button
            onClick={() => setActiveTab(0)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 0
                ? 'bg-indigo-900 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600 bg-slate-50'
            }`}
          >
            Semua Grup ({tableStats.totalTables} Tabel)
          </button>
          {tableStats.groups.map((grp, i) => (
            <button
              key={grp.title}
              onClick={() => setActiveTab(i + 1)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === i + 1
                  ? 'bg-indigo-900 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600 bg-slate-50'
              }`}
            >
              {grp.title} ({grp.tables.length})
            </button>
          ))}
        </div>

        {/* Group Render */}
        <div className="space-y-10">
          {tableStats.groups
            .filter((_, i) => activeTab === 0 || activeTab === i + 1)
            .map((grp) => {
              const filteredTables = grp.tables.filter(
                tbl => tbl.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       tbl.dbName.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredTables.length === 0) return null;

              return (
                <div key={grp.title} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${grp.color}`} />
                      {grp.title}
                    </h4>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${grp.bgColor} ${grp.textColor} uppercase tracking-widest border ${grp.borderColor}`}>
                      {grp.groupTotal} Baris Data
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTables.map((tbl) => {
                      const percentage = tableStats.grandTotal > 0 ? (tbl.count / tableStats.grandTotal) * 100 : 0;
                      return (
                        <div
                          key={tbl.key}
                          className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 hover:border-slate-200 transition-all flex flex-col hover:scale-[1.01] hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-2.5 bg-white rounded-2xl shadow-sm border border-slate-50">
                                {tbl.icon}
                              </span>
                              <div>
                                <h5 className="text-xs font-black text-slate-800 tracking-tight">{tbl.label}</h5>
                                <p className="text-[9px] text-slate-400 font-mono select-all uppercase tracking-wide">{tbl.dbName}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-2xl text-xs font-black tracking-tight ${
                              tbl.count > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {tbl.count.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium leading-normal mb-4 flex-1">
                            {tbl.desc}
                          </p>

                          <div className="space-y-1.5 mt-auto">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
                              <span>Kepadatan</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${grp.color}`}
                                style={{ width: `${Math.max(percentage > 0 ? 4 : 0, percentage)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Cloud Synchronization Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
        <div className="absolute -top-3 -left-3 bg-indigo-900 text-white rounded-2xl px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-md">Layanan Cloud</div>
        <h3 className="text-xl font-bold text-slate-800">Cloud Synchronization</h3>
        <p className="text-slate-500 text-sm mt-1">Sinkronisasi data LocalStorage dengan Cloudflare D1 Database.</p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => pushToCloud(notify)}
            className="w-full sm:flex-1 bg-indigo-900 hover:bg-black text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            Push to Cloud (Upload)
          </button>
          <button
            onClick={() => pullFromCloud(notify)}
            className="w-full sm:flex-1 bg-white border-2 border-indigo-900 text-indigo-900 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            Pull from Cloud (Download)
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
          * Pastikan koneksi internet aktif. Proses ini akan menimpa data yang ada di tujuan.
        </p>
      </div>

      {/* Data Recovery Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">Data Recovery</h3>
        <p className="text-slate-500 text-sm mt-1">Gunakan fitur ini jika data absensi hilang namun laporan kelas masih ada.</p>

        <div className="mt-6 space-y-4">
          <h4 className="font-bold text-slate-800">Rekonstruksi Data Absensi</h4>
          <p className="text-sm text-slate-600">Sistem akan memindai semua laporan kelas yang berstatus "Approved" dan memastikan data absensi yang sesuai telah tercatat di log sistem.</p>

          <button
            onClick={handleReconstructAttendance}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all"
          >
            Pulihkan Log Absensi
          </button>

          <h4 className="font-bold text-slate-800 mt-6">Deduplikasi Data Siswa</h4>
          <p className="text-sm text-slate-600">Sistem akan menghapus data siswa yang ganda berdasarkan kesamaan Nama, NIS, dan NISN. Data yang diproses adalah data yang saat ini tampil di aplikasi.</p>

          <button
            onClick={handleDeduplicateStudents}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all"
          >
            Hapus Data Siswa Ganda
          </button>

          <h4 className="font-bold text-slate-800 mt-6">Deduplikasi Data Kampus & Prodi</h4>
          <p className="text-sm text-slate-600">Sistem akan menghapus data ganda pada direktori Kampus Umum dan Rasio Prodi. Data yang dipertahankan adalah data terbaru yang dimasukkan.</p>

          <button
            onClick={handleDeduplicateKampusProdi}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all"
          >
            Hapus Data Ganda Kampus & Prodi
          </button>

          <h4 className="font-bold text-slate-800 mt-8">Backup & Restore Data Aplikasi</h4>
          <p className="text-sm text-slate-600">Cadangkan semua data aplikasi (Akun Siswa, Konselor, Super Admin, Laporan, dll) ke file lokal atau pulihkan dari file yang sudah ada.</p>

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleBackupData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all"
            >
              Backup Data
            </button>
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer">
              Restore Data
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-rose-50 border-2 border-dashed border-rose-200 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-bold text-rose-800">Danger Zone</h3>
        <p className="text-rose-600 text-sm mt-1">Aksi di bawah ini tidak dapat diurungkan. Lanjutkan dengan hati-hati.</p>

        <div className="mt-6 space-y-4">
          <h4 className="font-bold text-slate-800">Hapus Data Transaksional</h4>
          <p className="text-sm text-slate-600">Aksi ini akan menghapus data siswa (kecuali alumni), guru, rombel, jadwal, sesi konseling, laporan, dan log lainnya. Data Manajemen User, Pusat Karir, Materi, dan Konfigurasi Sekolah akan tetap dipertahankan. Sistem akan otomatis melakukan backup sebelum penghapusan, dan data yang dihapus dapat dikembalikan dengan cara Restore Data.</p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Ketik "{CONFIRMATION_PHRASE}" untuk konfirmasi:</label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full max-w-md bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <button
            onClick={handleDeleteAllData}
            disabled={confirmationText !== CONFIRMATION_PHRASE}
            className="bg-rose-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hapus Data Transaksional
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;

