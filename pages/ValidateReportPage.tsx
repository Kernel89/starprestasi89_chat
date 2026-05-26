import React from 'react';
import { ClassReport, Rombel, Student, AttendanceLog, UserSession, Teacher } from '../types';

interface ValidateReportPageProps {
  classReports: ClassReport[];
  setClassReports: React.Dispatch<React.SetStateAction<ClassReport[]>>;
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  students: Student[];
  rombels: Rombel[];
  user: UserSession;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  teachers?: Teacher[];
}

const ValidateReportPage: React.FC<ValidateReportPageProps> = ({
  classReports, setClassReports, setAttendanceLogs, students, rombels, user, notify, teachers
}) => {
  const [activeTab, setActiveTab] = React.useState<'Pending' | 'History'>('Pending');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  const handleValidate = (reportId: string, newStatus: 'Approved' | 'Rejected') => {
    const report = classReports.find(r => r.id === reportId);
    if (!report) return;

    setClassReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));

    if (newStatus === 'Approved') {
      const newLogs: AttendanceLog[] = report.absentees.map(absentee => ({
        id: `att-report-${report.id}-${absentee.studentId}`,
        studentId: absentee.studentId,
        slotId: `report-${report.rombelId}`,
        date: report.date,
        timestamp: new Date().toISOString(),
        status: absentee.status === 'H' ? 'Hadir' : absentee.status === 'S' ? 'Sakit' : absentee.status === 'I' ? 'Izin' : 'Alfa',
      }));

      setAttendanceLogs(prev => [...prev, ...newLogs]);
      notify('Laporan disetujui dan absensi telah dicatat.', 'success');
    } else {
      notify('Laporan ditolak.', 'info');
    }
  };

  const handleResetToPending = (reportId: string) => {
    const report = classReports.find(r => r.id === reportId);
    if (!report) return;

    // If it was approved, remove the logs
    if (report.status === 'Approved') {
      const logIdsToRemove = report.absentees.map(a => `att-report-${report.id}-${a.studentId}`);
      setAttendanceLogs(prev => prev.filter(l => !logIdsToRemove.includes(l.id)));
    }

    setClassReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Pending' } : r));
    notify('Laporan dikembalikan ke status Pending.', 'info');
  };

  const visibleReports = React.useMemo(() => {
    if (user.role === 'counselor' && teachers) {
      const myTeacherProfile = teachers.find(t => t.name === user.name);
      if (myTeacherProfile) {
        const myRombelIds = new Set<string>();
        rombels.filter(r => r.homeroomTeacherId === myTeacherProfile.id).forEach(r => myRombelIds.add(r.id));

        const gradeMatch = myTeacherProfile.assignment.match(/Tingkat (X|XI|XII)/i);
        if (gradeMatch) {
          const targetGrade = gradeMatch[1].toUpperCase();
          rombels.filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
        }

        return classReports.filter(report => myRombelIds.has(report.rombelId));
      }
      return [];
    }
    return classReports;
  }, [classReports, user, teachers, rombels]);

  const pendingReports = visibleReports.filter(r => r.status === 'Pending').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const historyReports = visibleReports.filter(r => r.status !== 'Pending').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const reportsToDisplay = activeTab === 'Pending' ? pendingReports : historyReports;

  const totalPages = Math.ceil(reportsToDisplay.length / itemsPerPage);
  const paginatedReports = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reportsToDisplay.slice(start, start + itemsPerPage);
  }, [reportsToDisplay, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Validasi Laporan Kelas</h2>
          <p className="text-slate-500 text-sm">Review dan validasi laporan absensi dari Ketua Murid.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('Pending')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'Pending' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Menunggu ({pendingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('History')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'History' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Riwayat ({historyReports.length})
          </button>
        </div>
      </header>

      <div className="space-y-6">
        {paginatedReports.length > 0 ? paginatedReports.map(report => {
          const rombel = rombels.find(r => r.id === report.rombelId);
          const reporter = students.find(s => s.id === report.reporterId);
          return (
            <div key={report.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-indigo-600">Laporan Kelas {rombel?.name ? `- ${rombel.name}` : ''}</h3>
                  <p className="text-xs text-slate-500">Oleh: {reporter?.name || '-'} | Tanggal Kejadian: {new Date(report.date).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === 'Pending' ? (
                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-3 py-1 rounded-full tracking-widest">Pending</span>
                  ) : report.status === 'Approved' ? (
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full tracking-widest">Approved</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-3 py-1 rounded-full tracking-widest">Rejected</span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Daftar Kehadiran Siswa:</h4>
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-2 font-black text-slate-400 uppercase">Nama Siswa</th>
                          <th className="px-4 py-2 font-black text-slate-400 uppercase text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {report.absentees.map(a => (
                          <tr key={a.studentId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 font-bold text-slate-700">{students.find(s => s.id === a.studentId)?.name || a.studentName}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-block w-6 h-6 leading-6 rounded-lg font-black text-[10px] ${a.status === 'H' ? 'bg-emerald-100 text-emerald-600' :
                                  a.status === 'S' ? 'bg-amber-100 text-amber-600' :
                                    a.status === 'I' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {report.notes && (
                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Catatan / Permasalahan Kelas:</h4>
                    <p className="text-sm p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 italic">"{report.notes}"</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                {report.status === 'Pending' ? (
                  <>
                    <button onClick={() => handleValidate(report.id, 'Rejected')} className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors">Tolak</button>
                    <button onClick={() => handleValidate(report.id, 'Approved')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">Setujui</button>
                  </>
                ) : (
                  <button onClick={() => handleResetToPending(report.id)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Kembalikan ke Pending</button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 bg-white rounded-2xl border-dashed border-slate-200">
            <p className="text-slate-500">{activeTab === 'Pending' ? 'Tidak ada laporan yang menunggu validasi.' : 'Belum ada riwayat laporan.'}</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white px-8 py-4 rounded-[2rem] border shadow-sm">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Halaman {currentPage} / {totalPages}
           </div>
           <div className="flex gap-2">
              <button 
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="p-1.5 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ValidateReportPage;
