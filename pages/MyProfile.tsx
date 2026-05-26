
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, Mood, AttendanceLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MyProfileProps {
  student: Student;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  attendanceLogs?: AttendanceLog[];
}

const MyProfile: React.FC<MyProfileProps> = ({ student, setStudents, notify, attendanceLogs = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [formData, setFormData] = useState<Student>(student);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form data if student prop changes
  useEffect(() => {
    setFormData(student);
  }, [student]);

  if (!student) return null;

  // Jika data terkunci, paksa isEditing menjadi false (kecuali saat komponen baru mount)
  useEffect(() => {
    if (student.isLocked) setIsEditing(false);
  }, [student.isLocked]);

  const moodEmojis: Record<string, string> = {
    [Mood.SangatSenang]: '😁',
    [Mood.Senang]: '🙂',
    [Mood.Netral]: '😐',
    [Mood.Sedih]: '🙁',
    [Mood.SangatSedih]: '😭',
    [Mood.Cemas]: '😰',
    [Mood.Marah]: '😠'
  };

  const birthOrderOptions = Array.from({ length: 11 }, (_, i) => i + 1); // 1 sampai 11
  const acceptedClassOptions = Array.from({ length: 12 }, (_, i) => i + 1); // 1 sampai 12
  const religionOptions = ['Islam', 'Protestan', 'Katolik', 'Budha', 'Hindu', 'Konghuchu'];

  const constructAddress = (street?: string, rtrw?: string, village?: string, district?: string, regency?: string, province?: string) => {
    if (!street && !district) return '';
    const parts = [];
    if (street) parts.push(street);
    if (rtrw) parts.push(`RT/RW ${rtrw}`);
    if (village) parts.push(village);
    if (district) parts.push(`Kec. ${district}`);
    if (regency) parts.push(`${regency}`);
    if (province) parts.push(province);
    return parts.join(', ');
  };

  const resizeImageToSquare = (file: File, size: number = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Gagal membuat canvas context"));
            return;
          }

          const srcWidth = img.width;
          const srcHeight = img.height;
          let sX = 0;
          let sY = 0;
          let sWidth = srcWidth;
          let sHeight = srcHeight;

          if (srcWidth > srcHeight) {
            // Landscape: potong sisi kiri & kanan (center crop)
            sWidth = srcHeight;
            sX = (srcWidth - srcHeight) / 2;
          } else if (srcHeight > srcWidth) {
            // Portrait: potong sisi atas & bawah (center crop)
            sHeight = srcWidth;
            sY = (srcHeight - srcWidth) / 2;
          }

          ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error("Gagal memuat gambar"));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify("File harus berupa gambar.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      notify("Ukuran foto maksimal 5MB.", "error");
      return;
    }

    try {
      const resizedBase64 = await resizeImageToSquare(file, 400);
      setFormData(prev => ({ ...prev, photo: resizedBase64 }));
      notify("Foto berhasil diunggah dan otomatis diatur menjadi 400x400 px.", "success");
    } catch (err) {
      notify("Gagal memproses gambar.", "error");
    }
  };

  const handleSave = () => {
    if (confirm("Apakah data sudah benar? Data akan disimpan permanen dan tidak dapat diubah lagi.")) {
        // Construct addresses
        const finalStudentAddress = constructAddress(
            formData.addressStreet, formData.addressRtRw, formData.addressVillage, 
            formData.addressDistrict, formData.addressRegency, formData.addressProvince
        ) || formData.address;

        const finalFatherAddress = constructAddress(
            formData.fatherAddressStreet, formData.fatherAddressRtRw, formData.fatherAddressVillage,
            formData.fatherAddressDistrict, formData.fatherAddressRegency, formData.fatherAddressProvince
        ) || formData.fatherAddress || '';

        const finalMotherAddress = constructAddress(
            formData.motherAddressStreet, formData.motherAddressRtRw, formData.motherAddressVillage,
            formData.motherAddressDistrict, formData.motherAddressRegency, formData.motherAddressProvince
        ) || formData.motherAddress || '';

        let finalGuardianAddress = '';
        if (formData.hasGuardian) {
            finalGuardianAddress = constructAddress(
                formData.guardianAddressStreet, formData.guardianAddressRtRw, formData.guardianAddressVillage,
                formData.guardianAddressDistrict, formData.guardianAddressRegency, formData.guardianAddressProvince
            ) || formData.guardianAddress || '';
        }

        const updatedStudent = {
            ...formData,
            address: finalStudentAddress,
            fatherAddress: finalFatherAddress,
            motherAddress: finalMotherAddress,
            guardianAddress: finalGuardianAddress,
            // Update legacy fields for compatibility
            parentName: formData.fatherName || formData.parentName, 
            parentPhone: formData.fatherPhone || formData.parentPhone,
            isLocked: true // LOCK DATA PERMANENTLY
        };

        setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
        setIsEditing(false);
        notify("Biodata berhasil disimpan permanen.", "success");
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setIsEditing(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notify("Mohon lengkapi semua kolom password.", "error");
      return;
    }

    if (passwordForm.currentPassword !== student.password) {
      notify("Kata sandi lama salah.", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify("Konfirmasi kata sandi baru tidak cocok.", "error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      notify("Kata sandi baru minimal 6 karakter.", "error");
      return;
    }

    // Update password in global state
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, password: passwordForm.newPassword } : s));
    
    setIsChangePasswordOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    notify("Kata sandi berhasil diubah.", "success");
  };

  const absenceData = useMemo(() => {
    const studentLogs = (attendanceLogs || []).filter(l => l.studentId === student.id);
    const counts = {
      Sakit: studentLogs.filter(l => l.status === 'Sakit').length,
      Izin: studentLogs.filter(l => l.status === 'Izin').length,
      Alfa: studentLogs.filter(l => l.status === 'Alfa').length,
    };

    return [
      { name: 'Sakit', value: counts.Sakit, color: '#f59e0b' },
      { name: 'Izin', value: counts.Izin, color: '#3b82f6' },
      { name: 'Alfa', value: counts.Alfa, color: '#f43f5e' },
    ];
  }, [attendanceLogs, student.id]);

  const hasAbsenceData = useMemo(() => absenceData.some(d => d.value > 0), [absenceData]);

  const renderAddressForm = (
    prefix: 'address' | 'fatherAddress' | 'motherAddress' | 'guardianAddress', 
    label: string
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/50 rounded-2xl border border-slate-200">
      <div className="md:col-span-2 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Kp. / Jalan / Dusun</label>
          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" value={(formData as any)[`${prefix}Street`] || ''} onChange={e => setFormData({...formData, [`${prefix}Street`]: e.target.value})} placeholder="Nama Jalan / Kampung" />
      </div>
      <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">RT / RW</label>
          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" value={(formData as any)[`${prefix}RtRw`] || ''} onChange={e => setFormData({...formData, [`${prefix}RtRw`]: e.target.value})} placeholder="001/002" />
      </div>
      <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Kelurahan / Desa</label>
          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" value={(formData as any)[`${prefix}Village`] || ''} onChange={e => setFormData({...formData, [`${prefix}Village`]: e.target.value})} placeholder="Nama Desa" />
      </div>
      <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Kecamatan</label>
          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" value={(formData as any)[`${prefix}District`] || ''} onChange={e => setFormData({...formData, [`${prefix}District`]: e.target.value})} placeholder="Nama Kecamatan" />
      </div>
      <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Kabupaten / Kota</label>
          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" value={(formData as any)[`${prefix}Regency`] || ''} onChange={e => setFormData({...formData, [`${prefix}Regency`]: e.target.value})} placeholder="Nama Kab/Kota" />
      </div>
      <div className="space-y-1 md:col-span-2">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Provinsi</label>
          <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold" value={(formData as any)[`${prefix}Province`] || ''} onChange={e => setFormData({...formData, [`${prefix}Province`]: e.target.value})} placeholder="Nama Provinsi" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Biodata Saya</h2>
          <p className="text-slate-500 text-sm">Informasi profil peserta didik dan data keluarga.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsChangePasswordOpen(true);
             }}
             className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             Ubah Kata Sandi
           </button>

           <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status:</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{student.status}</span>
           </div>
           
           {student.isLocked ? (
             <div className="bg-amber-50 text-amber-700 px-6 py-2.5 rounded-2xl text-xs font-bold border border-amber-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Data Terkunci (Hubungi Konselor)
             </div>
           ) : !isEditing ? (
             <button 
               onClick={() => setIsEditing(true)}
               className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
               Lengkapi Biodata
             </button>
           ) : (
             <div className="flex gap-2">
               <button 
                 onClick={handleCancel}
                 className="px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
               >
                 Batal
               </button>
               <button 
                 onClick={handleSave}
                 className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                 Simpan Permanen
               </button>
             </div>
           )}
        </div>
      </header>

      {/* Main Profile Content */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
           {/* Decorative Background */}
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
           </div>

           <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-indigo-500 border-4 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                {formData.photo ? (
                    <img src={formData.photo} alt="Foto Siswa" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-5xl font-black text-white">{student.name.charAt(0)}</span>
                )}
              </div>
              
              {/* Photo Upload Overlay */}
              {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ubah Foto</span>
                          <span className="block text-[8px] text-white/80">Max 500KB</span>
                      </div>
                  </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
           </div>
           
           <div className="text-center md:text-left min-w-0 flex-1 relative z-10">
              <h3 className="text-3xl md:text-4xl font-black mb-2">{student.name}</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                 <span className="px-4 py-1.5 bg-white/10 rounded-xl text-xs font-bold font-mono border border-white/10">NISN: {student.nisn || '-'}</span>
                 <span className="px-4 py-1.5 bg-white/10 rounded-xl text-xs font-bold font-mono border border-white/10">NIS: {student.nis}</span>
                 <span className="px-4 py-1.5 bg-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/20">{student.grade} - {student.class}</span>
                 {student.gender && (
                   <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 ${student.gender === 'Laki-laki' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                     {student.gender}
                   </span>
                 )}
              </div>
           </div>
        </div>

        <div className="p-10 space-y-10">
           {/* Section 1: Identitas Diri */}
           <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                 </div>
                 <h4 className="text-lg font-black text-slate-800">Identitas Diri</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Panggilan</p>
                    {isEditing ? (
                      <input 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.nickname || ''}
                        onChange={e => setFormData({...formData, nickname: e.target.value})}
                        placeholder="Contoh: Andi"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.nickname || '-'}</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempat Lahir</p>
                    {isEditing ? (
                      <input 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.birthPlace || ''}
                        onChange={e => setFormData({...formData, birthPlace: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.birthPlace || '-'}</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Lahir</p>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.birthDate || ''}
                        onChange={e => setFormData({...formData, birthDate: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                        {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Kelamin</p>
                    {isEditing ? (
                      <select 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.gender || ''}
                        onChange={e => setFormData({...formData, gender: e.target.value as 'Laki-laki' | 'Perempuan'})}
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.gender || '-'}</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agama</p>
                    {isEditing ? (
                      <select 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.religion || ''}
                        onChange={e => setFormData({...formData, religion: e.target.value as any})}
                      >
                        <option value="">Pilih Agama</option>
                        {religionOptions.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.religion || '-'}</p>
                    )}
                 </div>
              </div>
           </div>

           {/* Section 2: Latar Belakang & Sekolah */}
           <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.91A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.09L21 9"/><path d="M12 3v6"/></svg>
                 </div>
                 <h4 className="text-lg font-black text-slate-800">Latar Belakang Keluarga & Sekolah</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status dalam Keluarga</p>
                    {isEditing ? (
                      <select 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.familyStatus || ''}
                        onChange={e => setFormData({...formData, familyStatus: e.target.value as any})}
                      >
                        <option value="">Pilih Status</option>
                        <option value="Kandung">Anak Kandung</option>
                        <option value="Tiri">Anak Tiri</option>
                        <option value="Asuh">Anak Asuh</option>
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.familyStatus || '-'}</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anak ke-</p>
                    {isEditing ? (
                      <select 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.birthOrder || ''}
                        onChange={e => setFormData({...formData, birthOrder: parseInt(e.target.value)})}
                      >
                        <option value="">Pilih Urutan</option>
                        {birthOrderOptions.map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.birthOrder || '-'}</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asal SMP</p>
                    {isEditing ? (
                      <input 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.juniorHighOrigin || ''}
                        onChange={e => setFormData({...formData, juniorHighOrigin: e.target.value})}
                        placeholder="Nama SMP Asal"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.juniorHighOrigin || '-'}</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diterima di Kelas X-</p>
                    {isEditing ? (
                      <select 
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={formData.acceptedClassX || ''}
                        onChange={e => setFormData({...formData, acceptedClassX: e.target.value})}
                      >
                        <option value="">Pilih Kelas Awal</option>
                        {acceptedClassOptions.map(num => (
                          <option key={num} value={`X-${num}`}>X-{num}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.acceptedClassX || '-'}</p>
                    )}
                 </div>
              </div>
           </div>

           {/* Section 3: Kontak & Keluarga */}
           <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                 </div>
                 <h4 className="text-lg font-black text-slate-800">Kontak & Keluarga</h4>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Telepon / WA Siswa</p>
                        {isEditing ? (
                          <input 
                            className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.phone || '-'}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram</p>
                        {isEditing ? (
                          <input 
                            className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                            value={formData.instagram || ''}
                            onChange={e => setFormData({...formData, instagram: e.target.value})}
                            placeholder="@username"
                          />
                        ) : (
                          <p className="text-sm font-bold text-slate-800 truncate bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{student.instagram || '-'}</p>
                        )}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili Siswa Lengkap</p>
                    {isEditing ? renderAddressForm('address', 'Siswa') : (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed">
                         {student.addressStreet || student.addressDistrict ? (
                             <div className="space-y-1">
                                 <p className="font-bold">{student.addressStreet} {student.addressRtRw ? `, RT/RW ${student.addressRtRw}` : ''}</p>
                                 <p>{student.addressVillage ? `${student.addressVillage}, ` : ''}{student.addressDistrict ? `Kec. ${student.addressDistrict}` : ''}</p>
                                 <p>{student.addressRegency ? `${student.addressRegency}, ` : ''}{student.addressProvince}</p>
                             </div>
                         ) : (
                             <p className="italic">"{student.address}"</p>
                         )}
                      </div>
                    )}
                 </div>
                 
                 {/* Data Ayah & Ibu Split */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Data Ayah */}
                    <div className="space-y-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <h5 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-2a5.5 5.5 0 0 0-5.5-5.5h-5A5.5 5.5 0 0 0 4 17.5v2a1.5 1.5 0 0 0 1.5 1.5Z"/></svg>
                            Data Ayah
                        </h5>
                        
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Ayah</label>
                            {isEditing ? (
                                <input className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold" value={formData.fatherName || formData.parentName || ''} onChange={e => setFormData({...formData, fatherName: e.target.value})} placeholder="Nama Ayah" />
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{student.fatherName || student.parentName || '-'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Pekerjaan Ayah</label>
                            {isEditing ? (
                                <input className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold" value={formData.fatherJob || ''} onChange={e => setFormData({...formData, fatherJob: e.target.value})} placeholder="Pekerjaan" />
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{student.fatherJob || '-'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">No. Telepon Ayah</label>
                            {isEditing ? (
                                <input className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold" value={formData.fatherPhone || formData.parentPhone || ''} onChange={e => setFormData({...formData, fatherPhone: e.target.value})} placeholder="08..." />
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{student.fatherPhone || student.parentPhone || '-'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Alamat Ayah</label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    {renderAddressForm('fatherAddress', 'Ayah')}
                                </div>
                            ) : (
                                <div className="text-sm font-medium text-slate-600">
                                    {student.fatherAddressStreet || student.fatherAddressDistrict ? (
                                        <div className="space-y-0.5">
                                            <p>{student.fatherAddressStreet} {student.fatherAddressRtRw ? `, RT/RW ${student.fatherAddressRtRw}` : ''}</p>
                                            <p>{student.fatherAddressVillage ? `${student.fatherAddressVillage}, ` : ''}{student.fatherAddressDistrict ? `Kec. ${student.fatherAddressDistrict}` : ''}</p>
                                            <p>{student.fatherAddressRegency ? `${student.fatherAddressRegency}, ` : ''}{student.fatherAddressProvince}</p>
                                        </div>
                                    ) : (
                                        <p className="italic">"{student.fatherAddress || '-'}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Ibu */}
                    <div className="space-y-4 p-5 bg-pink-50/50 rounded-2xl border border-pink-100">
                        <h5 className="text-xs font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z"/><path d="M4 22v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/><path d="m15 11 1-1"/><path d="m9 11-1-1"/></svg>
                            Data Ibu
                        </h5>
                        
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Ibu</label>
                            {isEditing ? (
                                <input className="w-full bg-white border border-pink-100 rounded-xl px-4 py-2 text-sm font-bold" value={formData.motherName || ''} onChange={e => setFormData({...formData, motherName: e.target.value})} placeholder="Nama Ibu" />
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{student.motherName || '-'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Pekerjaan Ibu</label>
                            {isEditing ? (
                                <input className="w-full bg-white border border-pink-100 rounded-xl px-4 py-2 text-sm font-bold" value={formData.motherJob || ''} onChange={e => setFormData({...formData, motherJob: e.target.value})} placeholder="Pekerjaan" />
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{student.motherJob || '-'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">No. Telepon Ibu</label>
                            {isEditing ? (
                                <input className="w-full bg-white border border-pink-100 rounded-xl px-4 py-2 text-sm font-bold" value={formData.motherPhone || ''} onChange={e => setFormData({...formData, motherPhone: e.target.value})} placeholder="08..." />
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{student.motherPhone || '-'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Alamat Ibu</label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    {renderAddressForm('motherAddress', 'Ibu')}
                                </div>
                            ) : (
                                <div className="text-sm font-medium text-slate-600">
                                    {student.motherAddressStreet || student.motherAddressDistrict ? (
                                        <div className="space-y-0.5">
                                            <p>{student.motherAddressStreet} {student.motherAddressRtRw ? `, RT/RW ${student.motherAddressRtRw}` : ''}</p>
                                            <p>{student.motherAddressVillage ? `${student.motherAddressVillage}, ` : ''}{student.motherAddressDistrict ? `Kec. ${student.motherAddressDistrict}` : ''}</p>
                                            <p>{student.motherAddressRegency ? `${student.motherAddressRegency}, ` : ''}{student.motherAddressProvince}</p>
                                        </div>
                                    ) : (
                                        <p className="italic">"{student.motherAddress || '-'}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* SECTION WALI */}
                 <div className="space-y-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M4 20c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v2H4v-2z"/></svg>
                            Data Wali (Opsional)
                        </h5>
                        {isEditing && (
                            <select 
                                className="bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none"
                                value={formData.hasGuardian ? "true" : "false"}
                                onChange={e => setFormData({...formData, hasGuardian: e.target.value === "true"})}
                            >
                                <option value="false">Tidak Punya Wali</option>
                                <option value="true">Punya Wali</option>
                            </select>
                        )}
                    </div>

                    {!isEditing && !student.hasGuardian ? (
                        <p className="text-sm font-medium text-slate-500 italic">Tidak memiliki wali.</p>
                    ) : (isEditing && formData.hasGuardian) || (!isEditing && student.hasGuardian) ? (
                        <div className="grid grid-cols-1 gap-4 mt-2">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Nama Wali</label>
                                {isEditing ? (
                                    <input className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm font-bold" value={formData.guardianName || ''} onChange={e => setFormData({...formData, guardianName: e.target.value})} placeholder="Nama Wali" />
                                ) : (
                                    <p className="text-sm font-bold text-slate-800">{student.guardianName || '-'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Pekerjaan Wali</label>
                                {isEditing ? (
                                    <input className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm font-bold" value={formData.guardianJob || ''} onChange={e => setFormData({...formData, guardianJob: e.target.value})} placeholder="Pekerjaan" />
                                ) : (
                                    <p className="text-sm font-bold text-slate-800">{student.guardianJob || '-'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Alamat Wali</label>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        {renderAddressForm('guardianAddress', 'Wali')}
                                    </div>
                                ) : (
                                    <div className="text-sm font-medium text-slate-600">
                                        {student.guardianAddressStreet || student.guardianAddressDistrict ? (
                                            <div className="space-y-0.5">
                                                <p>{student.guardianAddressStreet} {student.guardianAddressRtRw ? `, RT/RW ${student.guardianAddressRtRw}` : ''}</p>
                                                <p>{student.guardianAddressVillage ? `${student.guardianAddressVillage}, ` : ''}{student.guardianAddressDistrict ? `Kec. ${student.guardianAddressDistrict}` : ''}</p>
                                                <p>{student.guardianAddressRegency ? `${student.guardianAddressRegency}, ` : ''}{student.guardianAddressProvince}</p>
                                            </div>
                                        ) : (
                                            <p className="italic">"{student.guardianAddress || '-'}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                 </div>

              </div>
           </div>
        </div>
      </div>

      {/* Modal Ubah Password */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <header className="p-8 bg-indigo-600 text-white shrink-0">
               <h3 className="text-xl font-black uppercase tracking-tight italic">Ubah Kata Sandi</h3>
               <p className="text-indigo-100 text-xs mt-1">Amankan akun Anda dengan kata sandi baru.</p>
            </header>
            <form onSubmit={handleSavePassword} className="p-8 space-y-5">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kata Sandi Saat Ini</label>
                 <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} placeholder="Masukkan password lama" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kata Sandi Baru</label>
                 <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} placeholder="Minimal 6 karakter" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Konfirmasi Kata Sandi Baru</label>
                 <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} placeholder="Ulangi password baru" />
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-50">
                 <button type="button" onClick={() => setIsChangePasswordOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                 <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Simpan Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
