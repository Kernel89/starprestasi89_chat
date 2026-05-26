
import React, { useState, useEffect, useRef } from 'react';
import { CounselorProfileData, AppUser, UserSession, Teacher, SchoolProfile } from '../types';

interface CounselorProfileProps {
  counselorProfile: CounselorProfileData;
  setCounselorProfile: React.Dispatch<React.SetStateAction<CounselorProfileData>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  // NEW PROPS FOR SYNC
  appUsers: AppUser[];
  setAppUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  currentUser: UserSession | null;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schoolProfile: SchoolProfile;
}

const CounselorProfile: React.FC<CounselorProfileProps> = ({ 
  counselorProfile, 
  setCounselorProfile, 
  notify,
  appUsers,
  setAppUsers,
  currentUser,
  teachers,
  setTeachers,
  schoolProfile
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<CounselorProfileData>(counselorProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SINKRONISASI AWAL (READ)
  // Saat komponen dimuat, jika user yang login adalah konselor, 
  // pastikan nama dan NIP di form sesuai dengan database user dan guru.
  useEffect(() => {
    if (currentUser && currentUser.role === 'counselor') {
      const userRecord = appUsers.find(u => u.id === currentUser.id);
      const currentName = userRecord ? userRecord.name : currentUser.name;
      
      // Cari data guru berdasarkan nama
      const teacherRecord = teachers.find(t => t.name === currentName);

      setFormData(prev => ({
        ...prev,
        name: currentName, // Paksa nama sesuai akun login
        nip: teacherRecord ? teacherRecord.nip : prev.nip // Sync NIP dari database guru
      }));
    } else {
      // Jika bukan konselor (misal admin melihat preview), gunakan data profil tersimpan
      setFormData(counselorProfile);
    }
  }, [currentUser, appUsers, teachers, counselorProfile]); 

  // Reset form saat toggle edit mode
  useEffect(() => {
    if (!isEditMode) {
      if (currentUser && currentUser.role === 'counselor') {
        const userRecord = appUsers.find(u => u.id === currentUser.id);
        const currentName = userRecord ? userRecord.name : currentUser.name;
        const teacherRecord = teachers.find(t => t.name === currentName);

        setFormData({
            ...counselorProfile,
            name: currentName,
            nip: teacherRecord ? teacherRecord.nip : counselorProfile.nip
        });
      } else {
        setFormData(counselorProfile);
      }
    }
  }, [isEditMode, counselorProfile, appUsers, teachers, currentUser]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      notify("Nama lengkap tidak boleh kosong.", "error");
      return;
    }

    // 1. Simpan ke State Profil Lokal
    setCounselorProfile(formData);

    // 2. SINKRONISASI SIMPAN (WRITE)
    // Jika yang mengedit adalah konselor itu sendiri, update juga di Manajemen Pengguna dan Database Guru
    if (currentUser && currentUser.role === 'counselor') {
        // Ambil nama lama dari sistem untuk referensi update database guru
        const currentUserRecord = appUsers.find(u => u.id === currentUser.id);
        const oldName = currentUserRecord ? currentUserRecord.name : currentUser.name;

        // Update di Manajemen Pengguna (AppUsers)
        setAppUsers(prev => prev.map(u => 
            u.id === currentUser.id ? { ...u, name: formData.name } : u
        ));

        // Update di Database Guru (Teachers)
        // Cari guru dengan nama lama, update nama dan NIP barunya
        setTeachers(prev => prev.map(t => 
            t.name === oldName 
                ? { ...t, name: formData.name, nip: formData.nip } 
                : t
        ));
    }

    setIsEditMode(false);
    notify("Biodata berhasil diperbarui dan disinkronkan ke seluruh sistem.", "success");
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
      notify("Ukuran gambar maksimal 5MB.", "error");
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

  const handlePrintCard = async () => {
    // Standard ID Card Size: 85.6 mm x 53.98 mm
    const scale = 12; // High quality
    const width = 85.6 * scale;
    const height = 53.98 * scale;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mmToPx = (mm: number) => mm * scale;

    const colors = {
      teal: '#0D9488',
      indigo: '#4338CA',
      slate: '#1E293B',
      slateLight: '#F1F5F9',
      white: '#FFFFFF',
      gold: '#B45309'
    };

    const loadImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    // 1. Background
    if (schoolProfile.counselorCardBackground) {
      const bgImg = await loadImage(schoolProfile.counselorCardBackground);
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      } else {
        ctx.fillStyle = colors.white;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = colors.white;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Decorative Patterns / Sidebar
    ctx.fillStyle = colors.teal;
    ctx.fillRect(0, 0, mmToPx(1.5), height);

    if (!schoolProfile.counselorCardBackground) {
      // Subtle background pattern
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = colors.indigo;
      for (let i = 0; i < width; i += mmToPx(5)) {
        for (let j = 0; j < height; j += mmToPx(5)) {
          ctx.beginPath();
          ctx.arc(i, j, mmToPx(0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 3. Header Section (School Info)
    ctx.fillStyle = colors.slateLight;
    ctx.fillRect(mmToPx(1.5), 0, width - mmToPx(1.5), mmToPx(14));

    if (schoolProfile.logo) {
      const logoImg = await loadImage(schoolProfile.logo);
      if (logoImg) {
        ctx.drawImage(logoImg, mmToPx(5), mmToPx(2), mmToPx(10), mmToPx(10));
      }
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = `bold ${mmToPx(1.8)}px Helvetica`;
    ctx.fillText(schoolProfile.agencyName.toUpperCase(), mmToPx(17), mmToPx(4.5));

    ctx.fillStyle = colors.slate;
    ctx.font = `bold ${mmToPx(2.8)}px Helvetica`;
    ctx.fillText(schoolProfile.name.toUpperCase(), mmToPx(17), mmToPx(8.5));

    ctx.fillStyle = colors.teal;
    ctx.font = `bold ${mmToPx(2.2)}px Helvetica`;
    ctx.fillText("CREDENTIAL CARD FOR PROFESSIONAL COUNSELOR", mmToPx(17), mmToPx(12.0));

    // 4. Content Section
    // Name & NIP (Shifted to Left since Photo Box is removed)
    ctx.textAlign = 'left';
    
    // Add text shadow for legibility if background is custom
    if (schoolProfile.counselorCardBackground) {
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    ctx.fillStyle = '#0F172A'; // Black-Slate for max contrast
    let nameSize = 4.2;
    ctx.font = `900 ${mmToPx(nameSize)}px Helvetica`;
    while(ctx.measureText(formData.name.toUpperCase()).width > mmToPx(70) && nameSize > 2.5) {
        nameSize -= 0.2;
        ctx.font = `900 ${mmToPx(nameSize)}px Helvetica`;
    }
    ctx.fillText(formData.name.toUpperCase(), mmToPx(8), mmToPx(24));

    ctx.fillStyle = '#1E293B'; // Dark Slate for NIP
    ctx.font = `bold ${mmToPx(2.6)}px Helvetica`;
    ctx.fillText(`NIP. ${formData.nip}`, mmToPx(8), mmToPx(30));

    // Clear shadow for other parts
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Badge
    ctx.fillStyle = colors.indigo;
    const badgeWidth = ctx.measureText("CERTIFIED PROFESSIONAL COUNSELOR").width + mmToPx(8);
    ctx.roundRect(mmToPx(8), mmToPx(34), badgeWidth, mmToPx(6), mmToPx(1.5));
    ctx.fill();
    ctx.fillStyle = colors.white;
    ctx.font = `bold ${mmToPx(1.8)}px Helvetica`;
    ctx.fillText("CERTIFIED PROFESSIONAL COUNSELOR", mmToPx(12), mmToPx(38));

    // Motto (Enhanced Legibility)
    ctx.fillStyle = '#475569'; // Dark Slate for labels
    ctx.font = `bold ${mmToPx(1.6)}px Helvetica`;
    ctx.fillText("PROFESSIONAL MOTTO:", mmToPx(8), mmToPx(45));

    ctx.fillStyle = '#0F172A'; // Black-Slate for maximum contrast
    ctx.font = `900 ${mmToPx(2.4)}px Helvetica`; // Bold & larger for clarity
    
    const mottoText = `"${formData.motto || 'Professional Counselor'}"`;
    const maxWidth = width - mmToPx(16);
    const words = mottoText.split(' ');
    let line = '';
    let mottoY = mmToPx(49);
    const lineHeight = mmToPx(3.2);

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), mmToPx(8), mottoY);
        line = words[n] + ' ';
        mottoY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), mmToPx(8), mottoY);

    // Divider
    ctx.strokeStyle = colors.slateLight;
    ctx.lineWidth = mmToPx(0.2);
    ctx.beginPath();
    ctx.moveTo(mmToPx(8), mmToPx(42));
    ctx.lineTo(width - mmToPx(5), mmToPx(42));
    ctx.stroke();

    // Trigger Download
    const link = document.createElement('a');
    link.download = `COUNSELOR_CARD_${formData.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    notify(`Kartu Kredensial ${formData.name} berhasil diunduh.`, "success");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Biodata Konselor</h2>
          <p className="text-slate-500 text-sm">Profil profesional dan informasi kontak Anda.</p>
        </div>
        {!isEditMode ? (
          <button 
            onClick={() => setIsEditMode(true)}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Edit Profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditMode(false)}
              className="px-6 py-2.5 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              className="bg-emerald-600 text-white px-8 py-2.5 rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              Simpan Perubahan
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photo & Primary Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
            <div className="relative group mb-6">
                <div className="w-40 h-40 rounded-[2.5rem] bg-teal-50 border-4 border-white shadow-xl shadow-teal-100 flex items-center justify-center overflow-hidden">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-teal-200">{formData.name.charAt(0) || 'K'}</span>
                  )}
                </div>
                {isEditMode && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Ubah Foto</span>
                    </div>
                  </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            {isEditMode ? (
              <div className="w-full space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap & Gelar</label>
                  <input 
                    className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-teal-100 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <p className="text-[9px] text-emerald-600 font-bold italic mt-1">*Nama ini akan muncul di tanda tangan PDF.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIP / NIPPPK</label>
                  <input 
                    className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:ring-4 focus:ring-teal-100 outline-none"
                    value={formData.nip}
                    onChange={e => setFormData({...formData, nip: e.target.value})}
                  />
                   <p className="text-[9px] text-emerald-600 font-bold italic mt-1">*NIP ini akan tercetak otomatis pada bagian tanda tangan laporan/surat.</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black text-slate-900">{formData.name}</h3>
                <p className="text-sm font-mono text-slate-500 font-bold mt-1">NIP. {formData.nip}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                   <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-black uppercase tracking-wide border border-teal-100">{formData.expertise}</span>
                   <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wide border border-emerald-100">Konselor</span>
                </div>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-[2.5rem] shadow-xl shadow-teal-200 p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 9.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5ZM12 9a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5A.5.5 0 0 1 12 9Z"/><path d="M12 1.5a.5.5 0 0 1 .5.5V3h5.75a.75.75 0 0 1 .7.96l-1.55 5.54a.75.75 0 0 1-.72.54h-8.36a.75.75 0 0 1-.72-.54L5.55 3.96a.75.75 0 0 1 .7-.96H11.5v-1a.5.5 0 0 1 .5-.5Z"/></svg>
             </div>
             <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80">Motto Profesional</h4>
             {isEditMode ? (
               <textarea 
                 className="w-full bg-white/20 border border-white/30 rounded-2xl px-5 py-4 text-sm font-medium text-white placeholder-white/50 outline-none focus:bg-white/30 h-32 resize-none"
                 value={formData.motto}
                 onChange={e => setFormData({...formData, motto: e.target.value})}
               />
             ) : (
               <p className="text-lg font-bold italic leading-relaxed">"{formData.motto}"</p>
             )}
          </div>

          {/* Counselor Badge Card Preview */}
          {!isEditMode && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
               <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Digital Credentials</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Professional counselor ID card.</p>
                  </div>
                  <div className="px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-teal-100">
                    Verified
                  </div>
               </div>
               
               <div className="p-8 pb-4">
                  <div className="aspect-[1.586/1] w-full bg-slate-900 rounded-3xl relative overflow-hidden shadow-2xl shadow-indigo-100/50 group-hover:scale-[1.02] transition-transform duration-500">
                    {/* Visual Card Representation */}
                     {schoolProfile.counselorCardBackground ? (
                       <img src={schoolProfile.counselorCardBackground} alt="BG" className="absolute inset-0 w-full h-full object-cover" />
                     ) : (
                       <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-900" />
                     )}
                     <div className="absolute top-0 right-0 p-4 opacity-20">
                        <img src={schoolProfile.logo} alt="Logo" className="w-12 h-12 grayscale brightness-200" />
                     </div>
                     <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        <div className="overflow-hidden">
                           <h5 className="text-white font-black text-sm leading-tight truncate uppercase drop-shadow-md">{formData.name}</h5>
                           <p className="text-teal-200 text-[10px] font-black mt-2 drop-shadow-sm">NIP. {formData.nip}</p>
                        </div>
                        <div className="mt-3 p-3 bg-black/40 rounded-2xl border border-white/10 font-bold text-[10px] text-white line-clamp-3 leading-relaxed shadow-inner">
                           "{formData.motto || 'Professional Counselor'}"
                        </div>
                        <div className="border-t border-white/10 pt-3">
                           <p className="text-white/40 text-[6px] font-black uppercase tracking-[0.2em]">{schoolProfile.name}</p>
                           <p className="text-teal-500/80 text-[5px] font-black uppercase mt-1 tracking-widest">Professional Credentials Card</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 pt-4">
                 <button 
                  onClick={handlePrintCard}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                   Cetak Kartu Profil
                 </button>
                 <p className="text-[9px] text-slate-400 text-center mt-4 italic">Unduh kartu dalam format gambar PNG untuk arsip profesional.</p>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Form */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-8">
           <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-800">Latar Belakang Pendidikan</h3>
                 <p className="text-slate-400 text-xs mt-0.5">Riwayat akademis dan sertifikasi.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pendidikan Terakhir</label>
                 {isEditMode ? (
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} placeholder="S1 Psikologi Pendidikan" />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{formData.education}</p>
                 )}
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Universitas / Institusi</label>
                 {isEditMode ? (
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} placeholder="Universitas Negeri Jakarta" />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{formData.university}</p>
                 )}
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sertifikasi / Gelar Profesi</label>
                 {isEditMode ? (
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.certification} onChange={e => setFormData({...formData, certification: e.target.value})} placeholder="Konselor Pendidikan (Kons.)" />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{formData.certification}</p>
                 )}
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motto Profesional</label>
                 {isEditMode ? (
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.motto} onChange={e => setFormData({...formData, motto: e.target.value})} placeholder="Inspirasi & Motivasi..." />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic leading-relaxed">"{formData.motto}"</p>
                 )}
              </div>
           </div>

           <div className="flex items-center gap-4 border-b border-slate-100 pb-6 pt-2">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-800">Kontak & Alamat</h3>
                 <p className="text-slate-400 text-xs mt-0.5">Informasi untuk komunikasi dinas.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                 {isEditMode ? (
                   <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{formData.email}</p>
                 )}
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nomor Telepon / WA</label>
                 {isEditMode ? (
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{formData.phone}</p>
                 )}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alamat Domisili</label>
                 {isEditMode ? (
                   <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold h-24 resize-none outline-none focus:ring-4 focus:ring-teal-500/10" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                 ) : (
                   <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed italic">"{formData.address}"</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorProfile;
