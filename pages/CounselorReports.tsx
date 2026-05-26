import React, { useState, useMemo, useEffect } from 'react';
import { GuidanceSession, HomeVisit, Referral, Advocacy, CaseConference, UserSession, SchoolProfile, CounselorProfileData, Student, Rombel, AppUser } from '../types';
import Letterhead from '../components/Letterhead';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { idbGet } from '../useLocalStorage';

interface CounselorReportsProps {
  sessions: GuidanceSession[];
  homeVisits: HomeVisit[];
  referrals: Referral[];
  advocacyCases: Advocacy[];
  conferences: CaseConference[];
  currentUser: UserSession | null;
  schoolProfile: SchoolProfile;
  counselorProfile: CounselorProfileData;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  students: Student[];
  rombels: Rombel[];
  appUsers: AppUser[];
}

const CounselorReports: React.FC<CounselorReportsProps> = ({ 
  sessions, homeVisits, referrals, advocacyCases, conferences, 
  currentUser, schoolProfile, counselorProfile, notify, students, rombels, appUsers
}) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedCounselor, setSelectedCounselor] = useState<string>(currentUser?.role === 'principal' || currentUser?.role === 'super_admin' || currentUser?.role === 'supervisor' ? 'all' : currentUser?.name || '');
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [localSessions, setLocalSessions] = useState<GuidanceSession[]>([]);
  const [localHomeVisits, setLocalHomeVisits] = useState<HomeVisit[]>([]);
  const [localReferrals, setLocalReferrals] = useState<Referral[]>([]);
  const [localAdvocacies, setLocalAdvocacies] = useState<Advocacy[]>([]);
  const [localConferences, setLocalConferences] = useState<CaseConference[]>([]);

  useEffect(() => {
    idbGet('star_sessions').then(val => val && setLocalSessions(val));
    idbGet('star_homeVisits').then(val => val && setLocalHomeVisits(val));
    idbGet('star_referrals').then(val => val && setLocalReferrals(val));
    idbGet('star_advocacies').then(val => val && setLocalAdvocacies(val));
    idbGet('star_conferences').then(val => val && setLocalConferences(val));
  }, []);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const counselors = useMemo(() => {
    return appUsers.filter(u => u.role === 'counselor' || u.role === 'super_admin');
  }, [appUsers]);

  const counselorName = selectedCounselor === 'all' ? 'Semua Konselor' : selectedCounselor;

  // --- LOGIKA FILTER DATA ---
  const reportData = useMemo(() => {
    let start: Date, end: Date;

    if (activeTab === 'weekly') {
      const d = new Date(selectedDate);
      const day = d.getDay();
      // Hitung awal minggu (Senin)
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(d.setDate(diff));
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 5); // Sampai Sabtu
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(selectedYear, selectedMonth - 1, 1);
      end = new Date(selectedYear, selectedMonth, 0);
      end.setHours(23, 59, 59, 999);
    }

    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    const filterByCounselor = (item: any) => {
      if (selectedCounselor === 'all') return true;
      return item.counselorName === selectedCounselor;
    };

    // Filter semua jenis aktivitas
    const mySessions = localSessions.filter(s => filterByCounselor(s) && filterByDate(s.date));
    const myVisits = localHomeVisits.filter(v => filterByCounselor(v) && filterByDate(v.date));
    const myRefs = localReferrals.filter(r => filterByCounselor(r) && filterByDate(r.date));
    const myAdvs = localAdvocacies.filter(a => filterByCounselor(a) && filterByDate(a.date));
    const myConfs = localConferences.filter(c => filterByCounselor(c) && filterByDate(c.date));

    const allActivities = [
      ...mySessions.map(s => ({ 
        date: s.date, 
        type: `Layanan ${s.type}`, 
        topic: s.topic.split('] ')[1] || s.topic,
        target: s.type === 'Klasikal' ? 'Seluruh Kelas' : `${(s.studentIds || []).length} Siswa`,
        outcome: s.objective,
        counselor: s.counselorName
      })),
      ...myVisits.map(v => ({ 
        date: v.date, 
        type: 'Home Visit', 
        topic: v.reason, 
        target: v.parentName,
        outcome: (v.solutions || '').substring(0, 50) + '...',
        counselor: v.counselorName
      })),
      ...myRefs.map(r => ({ 
        date: r.date, 
        type: 'Alih Tangan Kasus', 
        topic: r.reason, 
        target: getInitials(students.find(s => s.id === r.studentId)?.name || 'Siswa'),
        outcome: r.targetAgency,
        counselor: r.counselorName
      })),
      ...myAdvs.map(a => ({ 
        date: a.date, 
        type: 'Advokasi', 
        topic: a.category, 
        target: getInitials(students.find(s => s.id === a.studentId)?.name || 'Siswa'),
        outcome: 'Pendampingan',
        counselor: a.counselorName
      })),
      ...myConfs.map(c => ({ 
        date: c.date, 
        type: 'Konferensi Kasus', 
        topic: c.agenda, 
        target: getInitials(students.find(s => s.id === c.studentId)?.name || 'Siswa'),
        outcome: (c.decisions || '').substring(0, 50) + '...',
        counselor: c.counselorName
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      start, end,
      allActivities,
      stats: {
        total: allActivities.length,
        indiv: mySessions.filter(s => s.type === 'Pribadi').length,
        group: mySessions.filter(s => s.type === 'Kelompok').length,
        class: mySessions.filter(s => s.type === 'Klasikal').length,
        statsCount: myVisits.length + myRefs.length + myAdvs.length + myConfs.length
      }
    };
  }, [activeTab, selectedDate, selectedMonth, selectedYear, localSessions, localHomeVisits, localReferrals, localAdvocacies, localConferences, selectedCounselor, rombels, students]);

  const totalPages = Math.ceil(reportData.allActivities.length / itemsPerPage);
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reportData.allActivities.slice(start, start + itemsPerPage);
  }, [reportData.allActivities, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCounselor, selectedDate, selectedMonth, selectedYear]);

  const handlePrintPDF = () => {
    const doc = new jsPDF('landscape');
    const periodStr = activeTab === 'weekly' 
      ? `Minggu: ${reportData.start.toLocaleDateString('id-ID')} s.d ${reportData.end.toLocaleDateString('id-ID')}`
      : `Bulan: ${months[selectedMonth - 1]} ${selectedYear}`;

    const startY = drawLetterhead(doc, schoolProfile, 'l');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text(`JURNAL PELAKSANAAN LAYANAN BIMBINGAN DAN KONSELING (${activeTab === 'weekly' ? 'MINGGUAN' : 'BULANAN'})`, 148.5, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.setFont("times", "normal");
    doc.text(periodStr, 148.5, startY + 10, { align: 'center' });

    autoTable(doc, {
      startY: startY + 18,
      head: [['No', 'Hari/Tanggal', 'Jenis Kegiatan', 'Topik/Bahasan', 'Sasaran (Inisial)', 'Hasil/Evaluasi', 'Konselor']],
      body: reportData.allActivities.map((act, i) => [
        i + 1, 
        new Date(act.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        act.type,
        act.topic,
        act.target,
        act.outcome,
        act.counselor
      ]),
      styles: { font: 'times', fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        5: { cellWidth: 50 },
        6: { cellWidth: 30 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 170 ? 30 : finalY;
    if (finalY > 170) doc.addPage();
    
    doc.setFont("times", "normal"); doc.setFontSize(10);
    doc.text("Mengetahui,", 40, signY);
    doc.text("Kepala Sekolah,", 40, signY + 5);
    doc.text(`${schoolProfile.city || '...'}, ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, signY);
    doc.text("Guru BK / Konselor,", 220, signY + 5);
    
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 40, signY + 30);
    doc.text(counselorName, 220, signY + 30);
    doc.setFont("times", "normal"); doc.setFontSize(9);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, signY + 35);
    doc.text(`NIP. ${counselorProfile.nip || '-'}`, 220, signY + 35);

    doc.save(`Laporan_Kerja_BK_${activeTab}_${counselorName.replace(/\s+/g, '_')}.pdf`);
    notify("Laporan jurnal berhasil diunduh.");
  };

  const handleDownloadRecap = () => {
    const doc = new jsPDF('portrait');
    const periodStr = activeTab === 'weekly' 
      ? `Minggu: ${reportData.start.toLocaleDateString('id-ID')} s.d ${reportData.end.toLocaleDateString('id-ID')}`
      : `Bulan: ${months[selectedMonth - 1]} ${selectedYear}`;

    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(12); doc.setFont("times", "bold");
    doc.text(`REKAP JURNAL KONSELOR`, 105, startY + 5, { align: 'center' });
    doc.setFontSize(10); doc.setFont("times", "normal");
    doc.text(periodStr, 105, startY + 10, { align: 'center' });

    autoTable(doc, {
      startY: startY + 18,
      head: [['No', 'Nama Konselor', 'Tanggal', 'Kegiatan', 'Keterangan']],
      body: reportData.allActivities.map((act, i) => [
        i + 1,
        act.counselor,
        new Date(act.date).toLocaleDateString('id-ID'),
        act.type,
        `${act.topic} (${act.target})`
      ]),
      styles: { font: 'times', fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
      }
    });

    doc.save(`Rekap_Jurnal_Konselor_${activeTab}_${counselorName.replace(/\s+/g, '_')}.pdf`);
    notify("Rekap jurnal berhasil diunduh.");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Laporan Jurnal Konselor</h2>
          <p className="text-slate-500 text-sm font-medium">Otomatisasi rekapitulasi layanan untuk keperluan administrasi dan supervisi.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handlePrintPDF} className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            Cetak Jurnal (PDF)
          </button>
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'principal' || currentUser?.role === 'supervisor') && (
            <button onClick={handleDownloadRecap} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Rekap (PDF)
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
         {(currentUser?.role === 'principal' || currentUser?.role === 'super_admin' || currentUser?.role === 'supervisor') && (
           <div className="w-full md:w-64 space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Konselor</label>
             <select 
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10"
               value={selectedCounselor}
               onChange={(e) => setSelectedCounselor(e.target.value)}
             >
               <option value="all">Semua Konselor</option>
               {counselors.map(c => (
                 <option key={c.id} value={c.name}>{c.name}</option>
               ))}
             </select>
           </div>
         )}

         <div className="flex p-1 bg-slate-100 rounded-2xl w-fit shrink-0">
            <button onClick={() => setActiveTab('weekly')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'weekly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>Mingguan</button>
            <button onClick={() => setActiveTab('monthly')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'monthly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>Bulanan</button>
         </div>

         <div className="flex flex-1 items-center gap-4 w-full">
            {activeTab === 'weekly' ? (
               <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Minggu Laporan (Klik tanggal di minggu tersebut)</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
               </div>
            ) : (
               <div className="flex flex-1 gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Bulan</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                      {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Tahun</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                      {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Jurnal', val: reportData.stats.total, color: 'slate', sub: 'Total Log' },
          { label: 'Individu', val: reportData.stats.indiv, color: 'teal', sub: 'Sesi Pribadi' },
          { label: 'Kelompok', val: reportData.stats.group, color: 'violet', sub: 'Dinamika Grp' },
          { label: 'Klasikal', val: reportData.stats.class, color: 'emerald', sub: 'Layanan Kelas' },
          { label: 'Kasus Berat', val: reportData.stats.statsCount, color: 'rose', sub: 'HV, Adv, Ref' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 bg-${s.color}-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className={`text-3xl font-black text-${s.color}-600 tracking-tighter`}>{s.val}</h3>
            <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Jurnal Aktivitas Konselor</h3>
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black text-slate-400 uppercase">
                  {reportData.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {reportData.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
               </span>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Hari/Tgl</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Jenis</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Topik / Bahasan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Sasaran (Inisial)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Hasil</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Konselor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {paginatedActivities.map((act, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-500 text-xs">
                     {new Date(act.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-8 py-4">
                     <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                       act.type.includes('Pribadi') ? 'bg-teal-50 text-teal-600' : 
                       act.type.includes('Kelompok') ? 'bg-violet-50 text-violet-600' : 
                       act.type.includes('Klasikal') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                     }`}>{act.type}</span>
                  </td>
                  <td className="px-8 py-4 font-bold text-slate-700">{act.topic}</td>
                  <td className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight">{act.target}</td>
                  <td className="px-8 py-4 text-xs text-slate-500 italic max-w-xs truncate">{act.outcome}</td>
                  <td className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">{act.counselor}</td>
                </tr>
              ))}
               {reportData.allActivities.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <p className="text-slate-300 italic text-sm font-medium">Tidak ada aktivitas tercatat pada periode ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
            <div className="px-8 py-4 bg-white border-t border-slate-50 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Halaman {currentPage} / {totalPages}
              </p>
              <div className="flex gap-1">
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
    </div>
  );
};

export default CounselorReports;