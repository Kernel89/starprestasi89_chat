
import React, { useState, useEffect, useMemo } from 'react';
import { TeachingSlot, Teacher, Rombel, UserRole, Student, AttendanceLog } from '../types';

interface TeachingScheduleProps {
  schedule: TeachingSlot[];
  setSchedule: React.Dispatch<React.SetStateAction<TeachingSlot[]>>;
  rombels: Rombel[];
  teachers: Teacher[];
  userRole?: UserRole;
  students: Student[];
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const TeachingSchedule: React.FC<TeachingScheduleProps> = ({ 
  schedule, setSchedule, rombels, teachers, userRole, 
  students, attendanceLogs, setAttendanceLogs, notify 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TeachingSlot | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TeachingSlot>>({
    day: 'Senin',
    startTime: '08:00',
    endTime: '09:30',
    rombelId: '',
    teacherId: ''
  });

  // Logika Hak Akses: Hanya Super Admin yang bisa mengedit jadwal
  const canEdit = userRole === 'super_admin';
  const days: TeachingSlot['day'][] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // Sinkronisasi otomatis Guru BK saat Rombel dipilih
  useEffect(() => {
    if (formData.rombelId) {
      const selectedRombel = rombels.find(r => r.id === formData.rombelId);
      if (selectedRombel && selectedRombel.homeroomTeacherId) {
        setFormData(prev => ({ ...prev, teacherId: selectedRombel.homeroomTeacherId }));
      } else {
        setFormData(prev => ({ ...prev, teacherId: '' }));
      }
    }
  }, [formData.rombelId, rombels]);

  // --- FILTER AVAILABLE ROMBELS ---
  // Hanya tampilkan rombel yang BELUM ada di jadwal, atau rombel yang SEDANG diedit saat ini.
  const availableRombels = useMemo(() => {
    // Ambil daftar ID Rombel yang sudah dipakai di slot LAIN (bukan slot yang sedang diedit)
    const takenRombelIds = schedule
      .filter(s => s.id !== editingSlotId) // Kecualikan slot yang sedang diedit
      .map(s => s.rombelId);

    // Filter master rombel, buang yang sudah dipakai
    return rombels.filter(r => !takenRombelIds.includes(r.id));
  }, [rombels, schedule, editingSlotId]);

  const handleOpenAdd = () => {
    setEditingSlotId(null);
    setFormData({ day: 'Senin', startTime: '08:00', endTime: '09:30', rombelId: '', teacherId: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: TeachingSlot) => {
    if (!canEdit) {
      // Jika bukan admin, buka absensi
      handleOpenAttendance(slot);
      return;
    }
    setEditingSlotId(slot.id);
    setFormData({ ...slot });
    setIsModalOpen(true);
  };

  const handleOpenAttendance = (slot: TeachingSlot) => {
    setSelectedSlot(slot);
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = (studentId: string, status: AttendanceLog['status']) => {
    if (!selectedSlot) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    setAttendanceLogs(prev => {
      // Hapus log lama untuk siswa yang sama di slot yang sama pada hari yang sama
      const filtered = prev.filter(log => !(log.studentId === studentId && log.slotId === selectedSlot.id && log.date === today));
      
      const newLog: AttendanceLog = {
        id: `att-${Date.now()}-${studentId}`,
        studentId,
        slotId: selectedSlot.id,
        date: today,
        timestamp: new Date().toISOString(),
        status
      };
      
      return [...filtered, newLog];
    });
  };

  const getAttendanceStatus = (studentId: string) => {
    if (!selectedSlot) return null;
    const today = new Date().toISOString().split('T')[0];
    return attendanceLogs.find(log => log.studentId === studentId && log.slotId === selectedSlot.id && log.date === today)?.status;
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.teacherId && formData.rombelId && formData.day) {
      if (editingSlotId) {
        setSchedule(prev => prev.map(s => s.id === editingSlotId ? (formData as TeachingSlot) : s));
      } else {
        const slotToAdd: TeachingSlot = {
          id: `sch-${Date.now()}`,
          teacherId: formData.teacherId,
          rombelId: formData.rombelId,
          day: formData.day as any,
          startTime: formData.startTime || '08:00',
          endTime: formData.endTime || '09:30',
          room: formData.room || `R. ${rombels.find(r => r.id === formData.rombelId)?.name}`
        };
        setSchedule(prev => [...prev, slotToAdd]);
      }
      setIsModalOpen(false);
      setEditingSlotId(null);
    }
  };

  const handleDeleteSlot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Hapus jadwal mengajar ini?')) {
      setSchedule(prev => prev.filter(s => s.id !== id));
    }
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Guru Belum Ditentukan';
  const getRombelName = (id: string) => rombels.find(r => r.id === id)?.name || 'Kelas';

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Jadwal Mengajar BK</h2>
          <p className="text-slate-500 text-sm">
            {canEdit 
              ? 'Kelola pembagian jam masuk kelas untuk layanan klasikal.' 
              : 'Informasi jadwal layanan klasikal di kelas.'}
          </p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Tambah Jadwal
          </button>
        )}
      </header>

      {/* Grid Schedule Desktop */}
      <div className="hidden lg:grid grid-cols-5 gap-4">
        {days.map(day => (
          <div key={day} className="space-y-4">
            <div className="bg-slate-900 p-3 rounded-xl text-center">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{day}</h3>
            </div>
            <div className="space-y-3">
              {schedule.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                <div 
                  key={slot.id} 
                  onClick={() => handleOpenEdit(slot)}
                  className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group transition-all ${canEdit ? 'hover:border-indigo-300 hover:shadow-md cursor-pointer' : ''}`}
                >
                  {canEdit && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(slot); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg hover:bg-indigo-50"
                        title="Edit Jadwal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSlot(e, slot.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 bg-slate-50 rounded-lg hover:bg-rose-50"
                        title="Hapus Jadwal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{slot.startTime} - {slot.endTime}</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{getRombelName(slot.rombelId)}</p>
                  <p className="text-[10px] text-slate-400 truncate mb-3">{getTeacherName(slot.teacherId)}</p>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenAttendance(slot); }}
                    className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Absensi
                  </button>
                </div>
              ))}
              {schedule.filter(s => s.day === day).length === 0 && (
                <div className="py-10 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase italic">Kosong</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Schedule View */}
      <div className="lg:hidden space-y-6">
        {days.map(day => {
          const slots = schedule.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
          if (slots.length === 0) return null;
          return (
            <div key={day} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-1" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{day}</h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map(slot => (
                  <div 
                    key={slot.id} 
                    onClick={() => handleOpenEdit(slot)}
                    className={`bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between ${canEdit ? 'active:bg-slate-50 cursor-pointer' : ''}`}
                  >
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase">{slot.startTime} - {slot.endTime}</p>
                      <p className="font-bold text-slate-800">{getRombelName(slot.rombelId)}</p>
                      <p className="text-[10px] text-slate-400 mb-2">{getTeacherName(slot.teacherId)}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenAttendance(slot); }}
                        className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest"
                      >
                        Absensi
                      </button>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(slot); }}
                          className="p-2 text-slate-400 bg-slate-50 rounded-xl"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSlot(e, slot.id)}
                          className="p-2 text-rose-500 bg-rose-50 rounded-xl"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {schedule.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 italic text-sm">Belum ada jadwal mengajar yang diatur.</p>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Jadwal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className={`${editingSlotId ? 'bg-indigo-700' : 'bg-indigo-600'} p-8 text-white`}>
              <h3 className="text-xl font-black">{editingSlotId ? 'Edit Jam Masuk Kelas' : 'Tambah Jam Masuk Kelas'}</h3>
              <p className="text-indigo-100 text-xs mt-1">Atur jadwal layanan BK klasikal di kelas.</p>
            </div>
            <form onSubmit={handleSaveSlot} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</label>
                  <select 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    value={formData.day}
                    onChange={e => setFormData({...formData, day: e.target.value as any})}
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Kelas</label>
                  <select 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    value={formData.rombelId}
                    onChange={e => setFormData({...formData, rombelId: e.target.value})}
                  >
                    <option value="">Pilih Rombel...</option>
                    {availableRombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  {availableRombels.length === 0 && !formData.rombelId && (
                     <p className="text-[9px] text-amber-500 font-bold mt-1">Semua kelas sudah terjadwal.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Mulai</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Selesai</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Guru BK Pengampu (Otomatis)</label>
                <div className={`p-4 rounded-2xl border-2 transition-all ${formData.teacherId ? 'bg-indigo-50 border-indigo-200' : 'bg-rose-50 border-rose-100'}`}>
                  {formData.rombelId ? (
                    formData.teacherId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                          {getTeacherName(formData.teacherId).charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-indigo-700">{getTeacherName(formData.teacherId)}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-rose-600 italic">⚠️ Rombel ini belum memiliki Konselor Pengampu di Manajemen Rombel.</p>
                    )
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">Pilih kelas terlebih dahulu...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingSlotId(null); }} className="py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
                <button 
                  type="submit" 
                  disabled={!formData.teacherId || !formData.rombelId}
                  className={`py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all ${
                    !formData.teacherId || !formData.rombelId ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  {editingSlotId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Absensi */}
      {isAttendanceModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <header className="p-8 bg-indigo-600 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Absensi Kelas</h3>
                  <p className="text-indigo-100 text-xs mt-1">{getRombelName(selectedSlot.rombelId)} • {selectedSlot.day}, {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>
                <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </header>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-3">
                {students.filter(s => {
                  const rombel = rombels.find(r => r.id === selectedSlot.rombelId);
                  if (!rombel) return false;
                  const normalize = (str: string) => str.toUpperCase().replace(/\s+/g, ' ').replace(/\b0+(\d)/g, '$1').trim();
                  return s.grade === rombel.grade && normalize(s.class) === normalize(rombel.name.replace(new RegExp(`^${rombel.grade}\\s*`, 'i'), '').trim());
                }).map(student => {
                  const status = getAttendanceStatus(student.id);
                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.nis}</p>
                      </div>
                      <div className="flex gap-1">
                        {[
                          { label: 'H', value: 'Hadir', color: 'emerald' },
                          { label: 'S', value: 'Sakit', color: 'amber' },
                          { label: 'I', value: 'Izin', color: 'blue' },
                          { label: 'A', value: 'Alfa', color: 'rose' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleSaveAttendance(student.id, opt.value as any)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                              status === opt.value 
                                ? `bg-${opt.color}-600 text-white shadow-lg` 
                                : `bg-white text-slate-400 border border-slate-200 hover:border-${opt.color}-300 hover:text-${opt.color}-600`
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsAttendanceModalOpen(false)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingSchedule;
