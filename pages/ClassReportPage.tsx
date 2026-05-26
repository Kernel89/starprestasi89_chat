import React, { useState, useMemo, useEffect } from 'react';
import { Rombel, Student, UserSession, ClassReport, AttendanceLog } from '../types';

interface ClassReportPageProps {
  user: UserSession;
  students: Student[];
  rombels: Rombel[];
  classReports: ClassReport[];
  attendanceLogs: AttendanceLog[];
  setClassReports: React.Dispatch<React.SetStateAction<ClassReport[]>>;
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ClassReportPage: React.FC<ClassReportPageProps> = ({ user, students, rombels, classReports, attendanceLogs, setClassReports, setAttendanceLogs, notify }) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'H' | 'S' | 'I' | 'A'>>({});
  const [notes, setNotes] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);

  const myStudentProfile = useMemo(() => students.find(s => s.id === user.id), [students, user.id]);
  const myRombel = useMemo(() => {
    if (!myStudentProfile || !myStudentProfile.class) return null;
    const studentClass = myStudentProfile.class.trim().toLowerCase();
    const studentGrade = myStudentProfile.grade.trim().toUpperCase();
    
    return rombels.find(r => {
      const rombelName = r.name.trim().toLowerCase();
      const rombelGrade = r.grade.trim().toUpperCase();
      return rombelGrade === studentGrade && (rombelName.includes(studentClass) || studentClass.includes(rombelName));
    });
  }, [myStudentProfile, rombels]);

  const classmates = useMemo(() => {
    if (!myRombel || !myStudentProfile) return [];
    const studentClass = myStudentProfile.class.trim().toLowerCase();
    const studentGrade = myStudentProfile.grade.trim().toUpperCase();
    
    return students.filter(s => 
      s.grade.trim().toUpperCase() === studentGrade && 
      s.class.trim().toLowerCase() === studentClass && 
      s.status === 'Aktif'
    );
  }, [myRombel, students, myStudentProfile]);

  const existingReportForDate = useMemo(() => {
    if (!myRombel) return null;
    return classReports.find(r => r.rombelId === myRombel.id && r.date === incidentDate);
  }, [classReports, incidentDate, myRombel]);

  const isEditable = !existingReportForDate || existingReportForDate.status === 'Pending';

  useEffect(() => {
    if (existingReportForDate) {
      const absenteesMap = existingReportForDate.absentees.reduce((acc, curr) => {
        acc[curr.studentId] = curr.status;
        return acc;
      }, {} as Record<string, 'H' | 'S' | 'I' | 'A'>);
      setAttendanceStatus(absenteesMap);
      setNotes(existingReportForDate.notes);
    } else {
      setAttendanceStatus({});
      setNotes('');
    }
  }, [existingReportForDate]);


  const isKM = myStudentProfile?.isKM || user.role === 'ketua_murid';

  const handleSetAttendance = (studentId: string, status: 'H' | 'S' | 'I' | 'A') => {
    if (!isEditable) return;
    setAttendanceStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[studentId] === status) {
        delete newStatus[studentId];
      } else {
        newStatus[studentId] = status;
      }
      return newStatus;
    });
  };

  const handleMarkAllPresent = () => {
    if (!isEditable) return;
    const newStatus: Record<string, 'H' | 'S' | 'I' | 'A'> = {};
    classmates.forEach(student => {
      newStatus[student.id] = 'H';
    });
    setAttendanceStatus(newStatus);
    notify(`Semua siswa telah ditandai 'Hadir'. Klik 'Kirim Laporan' untuk menyimpan.`, 'info');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRombel) {
      notify('Data kelas Anda tidak ditemukan di sistem. Hubungi Konselor.', 'error');
      return;
    }
    if (!isEditable) {
      notify('Laporan sudah divalidasi dan tidak dapat diubah.', 'error');
      return;
    }

    const allReportedStudents = classmates.map(student => ({
      studentId: student.id,
      studentName: student.name,
      status: attendanceStatus[student.id] || 'H'
    }));

    if (allReportedStudents.length === 0) {
      notify('Daftar siswa kosong. Tidak dapat mengirim laporan.', 'error');
      return;
    }

    if (existingReportForDate) {
      // Update existing report
      const updatedReport: ClassReport = {
        ...existingReportForDate,
        absentees: allReportedStudents,
        notes: notes.trim(),
      };
      setClassReports(prev => prev.map(r => r.id === existingReportForDate.id ? updatedReport : r));
      notify('Laporan berhasil diperbarui.', 'success');
    } else {
      // Create new report
      const newReport: ClassReport = {
        id: `report-${Date.now()}`,
        rombelId: myRombel.id,
        reporterId: user.id!,
        date: incidentDate,
        absentees: allReportedStudents,
        notes: notes.trim(),
        timestamp: new Date().toISOString(),
        status: 'Pending',
      };
      setClassReports(prev => [newReport, ...prev]);
      notify('Laporan kelas telah dikirim untuk validasi.', 'info');
    }
    
    // Clear form only if it wasn't an update
    if (!existingReportForDate) {
        setAttendanceStatus({});
        setNotes('');
    }
  };

  if (!isKM) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-slate-500">Hanya Ketua Murid (KM) yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Laporan Kelas</h2>
        <p className="text-slate-500 text-sm">Laporkan absensi dan kondisi kelas kepada Konselor.</p>
      </header>

      {!myRombel && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-rose-600">
           <p className="font-bold">Peringatan: Data Kelas Tidak Ditemukan</p>
           <p className="text-xs mt-1">Sistem tidak dapat menemukan Rombongan Belajar yang cocok dengan data profil Anda (Grade: {myStudentProfile?.grade}, Class: {myStudentProfile?.class}). Silakan hubungi admin atau konselor untuk memperbaiki data rombel.</p>
        </div>
      )}

      <form onSubmit={handleSubmitReport} className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Laporan Kehadiran Siswa</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">H: Hadir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">S: Sakit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">I: Izin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">A: Alfa</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleMarkAllPresent}
                disabled={!isEditable || classmates.length === 0}
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tandai Semua Hadir
              </button>
              <label className="text-xs font-bold text-slate-500">Tanggal Kejadian:</label>
              <input 
                type="date" 
                value={incidentDate}
                onChange={e => setIncidentDate(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
              />
            </div>
          </div>
          
          {!isEditable && existingReportForDate && (
            <div className={`p-4 mb-4 rounded-lg text-xs font-bold ${existingReportForDate.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              Laporan untuk tanggal ini sudah di-{existingReportForDate.status.toLowerCase()} oleh konselor dan tidak dapat diubah.
            </div>
          )}

          {classmates.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-400 italic">Tidak ada daftar siswa yang ditemukan untuk kelas ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classmates.map(student => {
                const studentLogs = attendanceLogs.filter(l => l.studentId === student.id);
                const summary = {
                  Sakit: studentLogs.filter(l => l.status === 'Sakit').length,
                  Izin: studentLogs.filter(l => l.status === 'Izin').length,
                  Alfa: studentLogs.filter(l => l.status === 'Alfa').length,
                };

                return (
                  <div key={student.id} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-800 truncate pr-2">{student.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => handleSetAttendance(student.id, 'H')} disabled={!isEditable} className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all ${attendanceStatus[student.id] === 'H' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-400 border border-slate-200'} disabled:opacity-50`}>H</button>
                        <button type="button" onClick={() => handleSetAttendance(student.id, 'S')} disabled={!isEditable} className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all ${attendanceStatus[student.id] === 'S' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white text-slate-400 border border-slate-200'} disabled:opacity-50`}>S</button>
                        <button type="button" onClick={() => handleSetAttendance(student.id, 'I')} disabled={!isEditable} className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all ${attendanceStatus[student.id] === 'I' ? 'bg-teal-500 text-white shadow-lg shadow-teal-100' : 'bg-white text-slate-400 border border-slate-200'} disabled:opacity-50`}>I</button>
                        <button type="button" onClick={() => handleSetAttendance(student.id, 'A')} disabled={!isEditable} className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all ${attendanceStatus[student.id] === 'A' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-white text-slate-400 border border-slate-200'} disabled:opacity-50`}>A</button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-200/50">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sakit</span>
                        <span className="text-xs font-bold text-amber-600">{summary.Sakit}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Izin</span>
                        <span className="text-xs font-bold text-teal-600">{summary.Izin}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alfa</span>
                        <span className="text-xs font-bold text-rose-600">{summary.Alfa}</span>
                      </div>
                      <div className="ml-auto flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate</span>
                        <span className="text-xs font-bold text-teal-600">{student.attendanceRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Catatan / Permasalahan Kelas</h3>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={!isEditable}
            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-50"
            placeholder="Contoh: Kelas ribut karena guru jam kosong, ada siswa yang sakit di UKS, dll."
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={!isEditable} className="bg-teal-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {existingReportForDate ? 'Perbarui Laporan' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassReportPage;
