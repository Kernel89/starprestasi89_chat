
import React, { useState, useMemo } from 'react';
import { QuestionnaireSubmission, Student, Rombel, Assignment, SchoolProfile, CounselorProfileData, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { ICONS } from '../constants';
import { deleteFromCloud } from '../syncService';

interface EqReportProps {
  submissions: QuestionnaireSubmission[];
  students: Student[];
  rombels: Rombel[];
  assignments: Assignment[];
  schoolProfile: SchoolProfile;
  counselorProfile: CounselorProfileData;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  setSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  userRole?: UserRole;
}

const EQ_LEVELS = [
  { name: 'Tinggi', min: 148, color: '#db2777', label: 'Matang Emosional' },
  { name: 'Moderat', min: 94, color: '#f472b6', label: 'Berkembang' },
  { name: 'Rendah', min: 0, color: '#f9a8d4', label: 'Butuh Stimulasi' }
];

const EqReport: React.FC<EqReportProps> = ({ submissions, setSubmissions, students, rombels, assignments, schoolProfile, counselorProfile, notify, userRole }) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedGrade, setSelectedGrade] = useState('Semua');

  const isPrincipal = userRole === 'principal' || userRole === 'supervisor';

  const eqSubmissions = useMemo(() => {
    return submissions.filter(s => {
        const assign = assignments.find(a => a.id === s.assignmentId);
        return s.eqScore !== undefined && (assign?.type === 'EQ' || !assign);
    });
  }, [submissions, assignments]);

  const filteredResults = useMemo(() => {
    let list = eqSubmissions.map(sub => {
      const student = students.find(s => s.id === sub.studentId);
      const score = sub.eqScore || 0;
      const level = score >= 148 ? 'Tinggi' : score >= 94 ? 'Moderat' : 'Rendah';
      return {
        ...sub,
        studentName: student?.name || 'Siswa Terhapus',
        studentClass: student ? `${student.grade}-${student.class}` : 'Tanpa Kelas',
        grade: student?.grade || '',
        rawClassName: student ? `${student.grade} ${student.class}`.toUpperCase() : '',
        level
      };
    });

    if (selectedClass !== 'Semua') {
      list = list.filter(item => item.rawClassName.includes(selectedClass.toUpperCase()));
    }

    if (selectedGrade !== 'Semua') {
      list = list.filter(item => item.grade === selectedGrade);
    }

    return list.sort((a, b) => (b.eqScore || 0) - (a.eqScore || 0));
  }, [eqSubmissions, students, selectedClass, selectedGrade]);

  const stats = useMemo(() => {
    const counts = { Tinggi: 0, Moderat: 0, Rendah: 0 };
    filteredResults.forEach(r => {
      counts[r.level as keyof typeof counts]++;
    });

    return [
      { name: 'Tinggi', value: counts.Tinggi, color: '#db2777' },
      { name: 'Moderat', value: counts.Moderat, color: '#f472b6' },
      { name: 'Rendah', value: counts.Rendah, color: '#f9a8d4' }
    ];
  }, [filteredResults]);

  const handlePrintPDF = () => {
    const doc = new jsPDF('landscape');
    const periodStr = selectedClass === 'Semua' ? 'Seluruh Kelas' : `Kelas: ${selectedClass}`;

    const startY = drawLetterhead(doc, schoolProfile, 'l');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text(`LAPORAN HASIL TES KECERDASAN EMOSIONAL (EQ)`, 148.5, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.setFont("times", "normal");
    doc.text(periodStr, 148.5, startY + 10, { align: 'center' });

    autoTable(doc, {
      startY: startY + 20,
      head: [['No', 'Nama Lengkap Siswa', 'Tgl Tes', 'Skor EQ', 'Kategori', 'Status']],
      body: filteredResults.map((r, i) => [
        i + 1, 
        r.studentName.toUpperCase(),
        new Date(r.date).toLocaleDateString('id-ID'),
        r.eqScore || '0',
        r.level || '-',
        EQ_LEVELS.find(l => l.name === r.level)?.label || '-'
      ]),
      styles: { font: 'times', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [219, 39, 119], halign: 'center' },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 },
        3: { fontStyle: 'bold', halign: 'center' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 170 ? 30 : finalY;
    if (finalY > 170) doc.addPage();
    
    doc.text("Mengetahui,", 40, signY);
    doc.text("Kepala Sekolah,", 40, signY + 5);
    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, signY);
    doc.text("Guru BK / Konselor,", 220, signY + 5);
    
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, signY + 30);
    doc.text(counselorProfile.name || schoolProfile.counselorName, 220, signY + 30);
    doc.setFont("times", "normal"); doc.setFontSize(9);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, signY + 35);
    doc.text(`NIP. ${counselorProfile.nip || '-'}`, 220, signY + 35);

    doc.save(`Laporan_EQ_${selectedClass.replace(/\s+/g, '_')}.pdf`);
    notify("Laporan EQ berhasil diunduh.");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus hasil tes ini? Siswa yang bersangkutan akan dapat mengulang kembali tes EQ.")) {
        if (setSubmissions) {
            setSubmissions(prev => prev.filter(s => !(s.id === id && s.eqScore !== undefined)));
            await deleteFromCloud('star_eqSubmissions', id);
            notify("Hasil tes EQ berhasil dihapus.", "success");
        }
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Laporan EQ Siswa</h2>
          <p className="text-slate-500 text-sm font-medium">Rekapitulasi indeks kecerdasan emosional untuk pemetaan profil psikologis.</p>
        </div>
        <div className="flex gap-2">
            {!isPrincipal && (
            <button onClick={handlePrintPDF} className="bg-pink-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pink-700 shadow-xl shadow-pink-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                Cetak Rekap (PDF)
            </button>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM8 9h.01M16 9h.01M12 13c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5-1.5-3.5-3.5-3.5Z"/></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Kelas</p>
                        <select 
                            className="bg-transparent text-sm font-black text-slate-800 outline-none cursor-pointer"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            <option value="Semua">Semua Kelas</option>
                            {rombels.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Angkatan</p>
                        <select 
                            className="bg-transparent text-sm font-black text-slate-800 outline-none cursor-pointer"
                            value={selectedGrade}
                            onChange={e => setSelectedGrade(e.target.value)}
                        >
                            <option value="Semua">Semua Angkatan</option>
                            {['X', 'XI', 'XII'].map(g => <option key={g} value={g}>Kelas {g}</option>)}
                        </select>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Responden</p>
                    <p className="text-2xl font-black text-pink-600">{filteredResults.length} Siswa</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                <div className="mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Distribusi Kategori EQ</h3>
                </div>
                <div className="flex-1 w-full min-h-0">
                    {filteredResults.length > 0 ? (
                        <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-full">
                                <p className="text-[10px] font-black text-slate-400 uppercase text-center mb-2">Grafik Batang</p>
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                                        <YAxis hide />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px'}} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                            {stats.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {isPrincipal && (
                                <div className="h-full">
                                    <p className="text-[10px] font-black text-slate-400 uppercase text-center mb-2">Grafik Lingkaran (Pie)</p>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <PieChart>
                                            <Pie
                                                data={stats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px'}} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs font-bold">Belum ada data pengisian EQ.</div>
                    )}
                </div>
            </div>
         </div>

         <div className="lg:col-span-4 bg-pink-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50">EQ Matrix</h4>
            <div className="space-y-6">
                {EQ_LEVELS.map(lvl => (
                    <div key={lvl.name} className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lvl.color }} />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">{lvl.name}</p>
                            <p className="text-[10px] opacity-60 font-bold">{lvl.label}</p>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {!isPrincipal && (
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Hasil Skor Emosional</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap Siswa</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Skor EQ</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Kategori</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredResults.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-sm">{res.studentName}</p>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-pink-600 text-lg">{res.eqScore}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase text-white`} style={{ backgroundColor: EQ_LEVELS.find(l => l.name === res.level)?.color }}>
                        {res.level}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {(userRole === 'super_admin' || userRole === 'counselor') && (
                        <button onClick={() => handleDelete(res.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Hapus Hasil & Izinkan Remedial">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default EqReport;
