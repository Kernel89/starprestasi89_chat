import React, { useState, useMemo } from 'react';
import { Appointment, Student, SchoolProfile, GuidanceSession, HomeVisit, Advocacy, CaseConference, Referral, Rombel, UserRole } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CalendarProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  students: Student[];
  rombels: Rombel[];
  schoolProfile: SchoolProfile;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  rawSessions?: GuidanceSession[];
  rawHomeVisits?: HomeVisit[];
  rawAdvocacies?: Advocacy[];
  rawConferences?: CaseConference[];
  rawReferrals?: Referral[];
  userRole?: UserRole;
}

const Calendar: React.FC<CalendarProps> = ({ 
  appointments, setAppointments, students, rombels, schoolProfile, notify,
  rawSessions = [], rawHomeVisits = [], rawAdvocacies = [], rawConferences = [], rawReferrals = [],
  userRole
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };
  
  const [formData, setFormData] = useState<Partial<Appointment>>({
    studentId: '',
    date: today.toISOString().split('T')[0],
    time: '08:00',
    reason: '',
    status: 'Mendatang'
  });

  // Tentukan apakah user memiliki hak akses untuk mengelola agenda
  const canManage = userRole === 'super_admin' || userRole === 'counselor';

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const years = useMemo(() => {
    const list = [];
    for (let i = today.getFullYear() - 5; i <= today.getFullYear() + 5; i++) {
      list.push(i);
    }
    return list;
  }, []);

  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNum: i, dateStr });
    }
    return days;
  }, [currentMonth, currentYear]);

  // Statistik Layanan
  const serviceStats = useMemo(() => {
    const filtered = appointments.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const counts = {
      'Pribadi': 0,
      'Sosial': 0,
      'Belajar': 0,
      'Karir': 0,
      'Lain-lain': 0
    };

    filtered.forEach(a => {
      const textToCheck = (a.reason + ' ' + a.studentName).toLowerCase();
      if (textToCheck.includes('pribadi')) counts['Pribadi']++;
      else if (textToCheck.includes('sosial')) counts['Sosial']++;
      else if (textToCheck.includes('belajar') || textToCheck.includes('akademik')) counts['Belajar']++;
      else if (textToCheck.includes('karir')) counts['Karir']++;
      else counts['Lain-lain']++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [appointments, currentMonth, currentYear]);

  const handleSyncAll = () => {
    if (!canManage) return; 
    const newSyncApts: Appointment[] = [];

    // Helper untuk membuat ID unik
    const createId = (prefix: string, id: string) => `apt-sync-${prefix}-${id}`;

    rawSessions.forEach(s => {
      let typeLabel = s.type === 'Klasikal' ? 'Klasikal' : s.type === 'Kelompok' ? 'Kelompok' : 'Pribadi';
      let name = 'Siswa';
      if (s.type === 'Klasikal') name = `Kls ${rombels?.find(r => r.id === s.rombelId)?.name || 'Umum'}`;
      else if (s.type === 'Kelompok') name = `${getInitials(students.find(st => st.id === s.studentIds[0])?.name || '')} dkk`;
      else name = getInitials(students.find(st => st.id === s.studentIds[0])?.name || '');

      newSyncApts.push({
        id: createId('session', s.id),
        studentId: s.studentIds[0] || 'multi',
        studentName: `${name} (${typeLabel})`,
        date: s.date.split('T')[0],
        time: new Date(s.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        reason: s.topic,
        status: 'Selesai'
      });
    });

    rawHomeVisits.forEach(hv => {
      newSyncApts.push({
        id: createId('hv', hv.id),
        studentId: hv.studentId,
        studentName: `${getInitials(students.find(st => st.id === hv.studentId)?.name || '')} (Home Visit)`,
        date: hv.date.split('T')[0],
        time: '09:00',
        reason: `Kunjungan: ${hv.parentName}`,
        status: 'Selesai'
      });
    });

    // Merge logic: Hapus sync lama, masukkan sync baru, pertahankan manual
    setAppointments(prev => {
      const manualApts = prev.filter(a => !a.id.startsWith('apt-sync-'));
      // Filter duplikat berdasarkan ID
      const merged = [...manualApts, ...newSyncApts];
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
      return unique;
    });

    notify("Agenda berhasil disinkronkan dengan data layanan.", "success");
  };

  const handleOpenAdd = (dateStr: string) => {
    if (!canManage) return;
    setEditingAppointment(null);
    setFormData({ studentId: '', date: dateStr, time: '08:00', reason: '', status: 'Mendatang' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (apt: Appointment) => {
    if (!canManage) return; // Siswa/Pihak lain tidak bisa mengedit agenda yang sudah ada
    setEditingAppointment(apt);
    setFormData({ ...apt });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.date || !formData.reason) return;

    const selectedStudent = students.find(s => s.id === formData.studentId);
    if (!selectedStudent) return;

    if (editingAppointment) {
      setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? { ...a, ...formData, studentName: getInitials(selectedStudent.name) } as Appointment : a));
      notify("Agenda diperbarui.", "success");
    } else {
      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        studentId: formData.studentId!,
        studentName: getInitials(selectedStudent.name),
        date: formData.date!,
        time: formData.time!,
        reason: formData.reason!,
        status: formData.status! as any
      };
      setAppointments(prev => [...prev, newApt]);
      notify("Agenda baru ditambahkan.", "success");
    }
    setIsModalOpen(false);
  };

  const changeMonth = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('portrait');
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    const dayApts = appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));

    const dateStr = new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("AGENDA KEGIATAN HARIAN", 105, startY + 5, { align: 'center' });
    doc.setFontSize(11); doc.setFont("times", "normal");
    doc.text(dateStr, 105, startY + 11, { align: 'center' });

    autoTable(doc, {
      startY: startY + 20,
      head: [['Waktu', 'Nama Siswa / Kegiatan', 'Topik / Keterangan', 'Status']],
      body: dayApts.map(a => [
        a.time,
        getInitials(a.studentName.split('(')[0].trim()) + (a.studentName.includes('(') ? ' (' + a.studentName.split('(')[1] : ''),
        a.reason,
        a.status
      ]),
      styles: { font: 'times', fontSize: 10 },
      headStyles: { fillColor: [44, 62, 80] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 240 ? 30 : finalY;
    if (finalY > 240) doc.addPage();

    doc.text("Mengetahui,", 30, signY);
    doc.text("Kepala Sekolah,", 30, signY + 5);
    doc.text(schoolProfile.principalName, 30, signY + 30);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 30, signY + 35);

    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, signY);
    doc.text("Guru BK / Konselor,", 140, signY + 5);
    doc.text(schoolProfile.counselorName, 140, signY + 30);
    doc.text(`NIP. ${schoolProfile.counselorNip}`, 140, signY + 35);

    doc.save(`Agenda_${selectedDate}.pdf`);
    notify("Agenda harian berhasil diunduh.", "success");
  };

  // Warna Statistik
  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#94a3b8'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Agenda & Jadwal BK</h2>
          <p className="text-slate-500 text-sm font-medium">
            {canManage ? 'Kelola janji temu dan pantau distribusi layanan.' : 'Lihat jadwal bimbingan dan kegiatan mendatang.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Month Navigator */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-full sm:w-auto justify-between">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg></button>
            <div className="flex items-center gap-2 px-2">
               <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none text-slate-700 cursor-pointer hover:text-teal-600" value={currentMonth} onChange={e => setCurrentMonth(parseInt(e.target.value))}>
                 {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
               </select>
               <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none text-slate-700 cursor-pointer hover:text-teal-600" value={currentYear} onChange={e => setCurrentYear(parseInt(e.target.value))}>
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg></button>
          </div>

          {canManage && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleExportPDF} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                PDF
              </button>
              <button onClick={handleSyncAll} className="flex-1 sm:flex-none bg-teal-50 text-teal-600 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-100 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                Sync
              </button>
              <button onClick={() => handleOpenAdd(selectedDate)} className="flex-1 sm:flex-none bg-teal-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Baru
              </button>
            </div>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Calendar & Chart (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Calendar Grid Container */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
              {daysOfWeek.map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 bg-slate-100 gap-px border-b border-slate-100">
              {calendarGrid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="bg-slate-50/30 min-h-[100px]" />;
                
                const dayApts = appointments.filter(a => a.date === day.dateStr);
                const isSelected = selectedDate === day.dateStr;
                const isToday = day.dateStr === today.toISOString().split('T')[0];

                return (
                  <div 
                    key={day.dateStr} 
                    onClick={() => {
                        setSelectedDate(day.dateStr);
                        // Siswa tidak bisa buka modal lewat klik tanggal
                        if (canManage) {
                            // double click logic or just keep it as selection
                        }
                    }}
                    className={`bg-white min-h-[120px] p-2 transition-all relative group flex flex-col hover:bg-teal-50/30 ${isSelected ? 'ring-2 ring-inset ring-teal-500 z-10' : ''} ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Date Number */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded-full ${isToday ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500'}`}>
                        {day.dayNum}
                      </span>
                      {dayApts.length > 0 && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 mt-1" />
                      )}
                    </div>

                    {/* Events List (Truncated) */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayApts.slice(0, 3).map(a => (
                        <div key={a.id} className={`text-[9px] font-bold px-1.5 py-1 rounded-md truncate border-l-2 ${a.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-teal-50 text-teal-700 border-teal-500'}`}>
                          {a.time} {getInitials(a.studentName.split('(')[0].trim())}
                        </div>
                      ))}
                      {dayApts.length > 3 && (
                        <div className="text-[9px] text-slate-400 font-bold pl-1">+{dayApts.length - 3} lainnya</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics Chart - Sembunyikan untuk siswa karena datanya terbatas */}
          {canManage && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-800">Statistik Bidang Layanan</h3>
                    <p className="text-xs text-slate-400 font-medium mb-6">Bulan {months[currentMonth]} {currentYear}</p>
                    <div className="flex gap-2 flex-wrap">
                    {serviceStats.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-[10px] font-bold text-slate-600 uppercase">{s.name}: {s.value}</span>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="flex-1 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={serviceStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} height={0} />
                        <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {serviceStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Daily Agenda Detail (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full min-h-[600px] sticky top-24">
              <div className="mb-6 pb-6 border-b border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agenda Harian</p>
                <h3 className="text-2xl font-black text-slate-800">
                  {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {appointments
                  .filter(a => a.date === selectedDate)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => handleOpenEdit(a)}
                      className={`relative pl-4 py-2 group ${canManage ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'} transition-all rounded-r-xl`}
                    >
                      {/* Timeline Line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${a.status === 'Selesai' ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                      
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-black text-slate-700">{a.time}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${a.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'}`}>{a.status}</span>
                      </div>
                      <p className={`text-sm font-bold text-slate-800 leading-tight ${canManage ? 'group-hover:text-teal-600' : ''} transition-colors`}>{getInitials(a.studentName.split('(')[0].trim()) + (a.studentName.includes('(') ? ' (' + a.studentName.split('(')[1] : '')}</p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">"{a.reason}"</p>
                    </div>
                  ))}
                
                {appointments.filter(a => a.date === selectedDate).length === 0 && (
                  <div className="h-48 flex flex-col items-center justify-center text-center opacity-50">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tidak Ada Agenda</p>
                  </div>
                )}
              </div>
              
              {canManage && (
                <button 
                  onClick={() => handleOpenAdd(selectedDate)}
                  className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  + Tambah Manual
                </button>
              )}
           </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className={`p-8 text-white ${editingAppointment ? 'bg-teal-600' : 'bg-teal-600'}`}>
              <h3 className="text-xl font-black uppercase tracking-tight">{editingAppointment ? 'Edit Agenda' : 'Buat Agenda Baru'}</h3>
              <p className="text-white/80 text-xs mt-1">Jadwalkan bimbingan atau catat peristiwa penting.</p>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Siswa</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                  <option value="">-- Cari Nama Siswa --</option>
                  {students.filter(s => s.status === 'Aktif').map(s => (
                    <option key={s.id} value={s.id}>{getInitials(s.name)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal</label>
                  <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Waktu</label>
                  <input type="time" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Topik / Uraian Kegiatan</label>
                <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold h-24 resize-none focus:ring-4 focus:ring-teal-500/10 outline-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Mendatang', 'Selesai', 'Dibatalkan'].map(st => (
                    <button key={st} type="button" onClick={() => setFormData({...formData, status: st as any})} className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.status === st ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                {editingAppointment && !editingAppointment.id.startsWith('apt-sync-') && (
                  <button type="button" onClick={() => { setAppointments(prev => prev.filter(a => a.id !== editingAppointment.id)); setIsModalOpen(false); }} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Batal</button>
                <button type="submit" className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Agenda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
