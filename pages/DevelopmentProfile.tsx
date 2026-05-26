
import React, { useRef, useState } from 'react';
import { UserRole, DevBioData } from '../types';

interface DevelopmentProfileProps {
    bioData: DevBioData;
    setBioData: React.Dispatch<React.SetStateAction<DevBioData>>;
    userRole?: UserRole;
    notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const BenefitCard: React.FC<{ icon: string, title: string, desc: string, color: string }> = ({ icon, title, desc, color }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all group flex flex-col h-full">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 text-${color}-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={icon} /></svg>
        </div>
        <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-wide">{title}</h4>
        <p className="text-slate-400 text-xs leading-relaxed font-medium">{desc}</p>
    </div>
);

const DevelopmentProfile: React.FC<DevelopmentProfileProps> = ({ bioData, setBioData, userRole, notify }) => {
    const [isEditing, setIsEditing] = useState(false);
    const wallpaperInputRef = useRef<HTMLInputElement>(null);
    const profilePhotoInputRef = useRef<HTMLInputElement>(null);

    // Allow super_admin to edit ONLY IF not locked
    const canEdit = (userRole === 'super_admin') && !bioData.isLocked;

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
                        sWidth = srcHeight;
                        sX = (srcWidth - srcHeight) / 2;
                    } else if (srcHeight > srcWidth) {
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'wallpaper' | 'photo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            notify("Format file tidak didukung. Harap pilih gambar.", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            notify("Ukuran gambar maksimal 5MB.", "error");
            return;
        }

        try {
            if (field === 'photo') {
                const resizedBase64 = await resizeImageToSquare(file, 400);
                setBioData(prev => ({ ...prev, photo: resizedBase64 }));
                notify("Foto Profil berhasil diunggah dan otomatis diatur menjadi 400x400 px.", "success");
            } else {
                // Keep wallpaper original
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const base64 = evt.target?.result as string;
                    setBioData(prev => ({ ...prev, wallpaper: base64 }));
                    notify("Wallpaper berhasil diperbarui.", "success");
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            notify("Gagal memproses gambar.", "error");
        }
    };

    const removeWallpaper = () => {
        if (confirm("Hapus wallpaper dan kembali ke tampilan default?")) {
            setBioData(prev => ({ ...prev, wallpaper: '' }));
            notify("Wallpaper telah dihapus.");
        }
    };

    const handleChange = (field: keyof DevBioData, value: string) => {
        setBioData(prev => ({ ...prev, [field]: value }));
    };

    const handleBenefitChange = (id: string, field: 'title' | 'desc', value: string) => {
        setBioData(prev => ({
            ...prev,
            benefits: prev.benefits.map(b => b.id === id ? { ...b, [field]: value } : b)
        }));
    };

    const handleSavePermanently = () => {
        if (confirm("PERINGATAN PENTING:\n\nAnda akan menyimpan perubahan ini secara permanen ke server.\nSetelah disimpan, PROFIL TIDAK DAPAT DIEDIT LAGI (Terkunci).\n\nApakah Anda yakin data sudah benar?")) {
            setBioData(prev => ({ ...prev, isLocked: true }));
            setIsEditing(false);
            notify("Profil berhasil disimpan ke server dan dikunci secara permanen.", "success");
        }
    };

    return (
        <div className="min-h-full bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 animate-in fade-in zoom-in-95 duration-700 relative flex flex-col">

            {/* BACKGROUND WALLPAPER ENGINE */}
            <div className="absolute inset-0 z-0 bg-slate-950 select-none">
                {bioData.wallpaper ? (
                    <div
                        className="w-full h-full bg-cover bg-center animate-in fade-in duration-1000"
                        style={{
                            backgroundImage: `url(${bioData.wallpaper})`,
                            opacity: 1.0
                        }}
                    />
                ) : bioData.photo ? (
                    <div
                        className="w-full h-full bg-cover bg-center opacity-20 pointer-events-none grayscale blur-3xl scale-125"
                        style={{
                            backgroundImage: `url(${bioData.photo})`,
                        }}
                    />
                ) : null}

                {/* Optimized Overlays for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
            </div>

            {/* ADMIN FLOATING CONTROLS */}
            <div className="absolute top-6 right-6 z-[100] flex flex-wrap gap-2 animate-in slide-in-from-right-4 duration-500 delay-300">
                {bioData.isLocked ? (
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Server Locked
                    </div>
                ) : canEdit && (
                    <>
                        {isEditing ? (
                            <button
                                onClick={handleSavePermanently}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                Simpan & Kunci
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                Edit Profil
                            </button>
                        )}

                        <div className="w-px h-8 bg-white/20 mx-1"></div>

                        <button
                            onClick={() => wallpaperInputRef.current?.click()}
                            className="bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            Ganti Wallpaper
                        </button>
                        {bioData.wallpaper && (
                            <button
                                onClick={removeWallpaper}
                                className="bg-rose-500/20 hover:bg-rose-500/40 backdrop-blur-md border border-rose-500/30 text-rose-200 p-2 rounded-xl transition-all active:scale-90"
                                title="Hapus Wallpaper"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                        )}

                        <input ref={wallpaperInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'wallpaper')} />
                        <input ref={profilePhotoInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo')} />
                    </>
                )}
            </div>

            {/* CONTENT WRAPPER */}
            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 space-y-20">

                    {/* 1. HERO HEADER */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-sm mx-auto">
                            <span className={`w-1.5 h-1.5 rounded-full ${bioData.isLocked ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'} shadow-[0_0_10px_rgba(52,211,153,0.8)]`}></span>
                            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.2em]">Verified Developer Profile {bioData.isLocked ? '(Locked)' : ''}</span>
                        </div>
                        <div className="max-w-4xl mx-auto">
                            {isEditing ? (
                                <input
                                    className="w-full bg-white/5 border-b border-white/20 text-4xl md:text-6xl font-black text-white text-center outline-none focus:border-indigo-500 py-2"
                                    value={bioData.visionTitle}
                                    onChange={(e) => handleChange('visionTitle', e.target.value)}
                                    placeholder="Judul Visi / Peran"
                                />
                            ) : (
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                                    {bioData.visionTitle || "Arsitek Sistem"}
                                </h1>
                            )}
                        </div>
                        <div className="max-w-2xl mx-auto">
                            {isEditing ? (
                                <textarea
                                    className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-slate-300 text-sm font-medium outline-none focus:border-indigo-500 h-24 text-center"
                                    value={bioData.visionDesc}
                                    onChange={(e) => handleChange('visionDesc', e.target.value)}
                                    placeholder="Deskripsi singkat visi..."
                                />
                            ) : (
                                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                                    {bioData.visionDesc}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 2. PROFILE & BIO GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                        {/* Left: Profile Card (Sticky on Large Screens) */}
                        <div className="lg:col-span-5 lg:sticky lg:top-8">
                            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                                {/* Card Background Decoration */}
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50"></div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-48 h-48 rounded-[2rem] p-1 bg-gradient-to-br from-indigo-400 to-cyan-400 shadow-2xl mb-6 overflow-hidden relative group/photo">
                                        <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-slate-800 flex items-center justify-center relative">
                                            {bioData.photo ? (
                                                <img src={bioData.photo} alt={bioData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <span className="text-6xl font-black text-white/20">{bioData.name.charAt(0)}</span>
                                            )}
                                            {isEditing && (
                                                <div
                                                    onClick={() => profilePhotoInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                                    <span className="text-[10px] font-bold text-white uppercase">Ubah Foto</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-2 w-full">
                                            <input
                                                className="w-full bg-white/5 border-b border-white/20 text-lg font-bold text-white text-center outline-none focus:border-indigo-500 pb-1"
                                                value={bioData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                placeholder="Nama Lengkap"
                                                maxLength={20}
                                            />
                                            <input
                                                className="w-full bg-white/5 border-b border-white/20 text-xs font-black text-indigo-300 text-center outline-none focus:border-indigo-500 uppercase tracking-widest pb-1"
                                                value={bioData.role}
                                                onChange={(e) => handleChange('role', e.target.value)}
                                                placeholder="Role / Jabatan"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full px-2 text-center">
                                            <h2 className="text-lg font-bold text-white mb-2 truncate" title={bioData.name}>{bioData.name}</h2>
                                            <span className="px-4 py-1 bg-white/10 rounded-lg text-[10px] font-black text-indigo-300 uppercase tracking-widest border border-white/5 inline-block truncate max-w-full">{bioData.role}</span>
                                        </div>
                                    )}

                                    <div className="w-full h-px bg-white/10 my-8"></div>

                                    <div className="w-full space-y-4 text-left">
                                        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp</p>
                                                {isEditing ? (
                                                    <input className="w-full bg-transparent border-b border-white/20 text-sm font-medium text-emerald-400 outline-none focus:border-emerald-500" value={bioData.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} />
                                                ) : (
                                                    <p className="text-sm font-medium text-emerald-400 truncate">{bioData.whatsapp}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</p>
                                                {isEditing ? (
                                                    <input className="w-full bg-transparent border-b border-white/20 text-sm font-medium text-indigo-300 outline-none focus:border-indigo-500" value={bioData.email} onChange={(e) => handleChange('email', e.target.value)} />
                                                ) : (
                                                    <p className="text-sm font-medium text-indigo-300 truncate">{bioData.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lokasi</p>
                                                {isEditing ? (
                                                    <input className="w-full bg-transparent border-b border-white/20 text-sm font-medium text-slate-300 outline-none focus:border-slate-500" value={bioData.location} onChange={(e) => handleChange('location', e.target.value)} />
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-300 truncate">{bioData.location}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Biography Content */}
                        <div className="lg:col-span-7 space-y-12">
                            {/* Skills / Bio Section */}
                            <div>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-transparent border-b border-white/20 text-2xl font-black text-white uppercase tracking-tight mb-6 outline-none focus:border-indigo-500"
                                        value={bioData.skillsTitle}
                                        onChange={(e) => handleChange('skillsTitle', e.target.value)}
                                    />
                                ) : (
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                                        {bioData.skillsTitle || "Latar Belakang"}
                                    </h3>
                                )}

                                {isEditing ? (
                                    <textarea
                                        className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-slate-300 leading-loose text-sm font-medium outline-none focus:border-indigo-500 min-h-[200px]"
                                        value={bioData.skillsDesc}
                                        onChange={(e) => handleChange('skillsDesc', e.target.value)}
                                    />
                                ) : (
                                    <div className="text-slate-300 leading-loose whitespace-pre-line text-sm md:text-base font-medium">
                                        {bioData.skillsDesc}
                                    </div>
                                )}
                            </div>

                            {/* Value & Benefits Cards */}
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>
                                    Core Values
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bioData.benefits.map((ben, idx) => (
                                        isEditing ? (
                                            <div key={ben.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex flex-col h-full space-y-3">
                                                <div className={`w-10 h-10 rounded-xl bg-${ben.color}-500/20 text-${ben.color}-300 flex items-center justify-center`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={ben.icon} /></svg>
                                                </div>
                                                <input
                                                    value={ben.title}
                                                    onChange={(e) => handleBenefitChange(ben.id, 'title', e.target.value)}
                                                    className="bg-transparent border-b border-white/20 text-white font-bold text-sm outline-none focus:border-emerald-500"
                                                    placeholder="Judul Value"
                                                />
                                                <textarea
                                                    value={ben.desc}
                                                    onChange={(e) => handleBenefitChange(ben.id, 'desc', e.target.value)}
                                                    className="bg-transparent border border-white/20 rounded p-2 text-slate-400 text-xs w-full h-20 resize-none outline-none focus:border-emerald-500"
                                                    placeholder="Deskripsi..."
                                                />
                                            </div>
                                        ) : (
                                            <BenefitCard
                                                key={ben.id}
                                                color={ben.color}
                                                title={ben.title}
                                                desc={ben.desc}
                                                icon={ben.icon}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* Privacy Section */}
                            <div className="bg-indigo-900/20 border border-indigo-500/20 p-8 rounded-[2rem]">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <input
                                            className="w-full bg-transparent border-b border-indigo-500/30 text-lg font-bold text-indigo-300 outline-none focus:border-indigo-500"
                                            value={bioData.privacyTitle}
                                            onChange={(e) => handleChange('privacyTitle', e.target.value)}
                                        />
                                        <textarea
                                            className="w-full bg-white/5 border border-indigo-500/30 rounded-xl p-3 text-slate-400 text-sm outline-none focus:border-indigo-500 h-24"
                                            value={bioData.privacyDesc}
                                            onChange={(e) => handleChange('privacyDesc', e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="text-lg font-bold text-indigo-300 mb-3">{bioData.privacyTitle}</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed">{bioData.privacyDesc}</p>
                                    </>
                                )}
                            </div>

                            {/* Tech Stack - Simple Row (Hidden by request) 
                            <div className="pt-8 border-t border-white/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Built With Modern Stack</p>
                                <div className="flex flex-wrap gap-8 opacity-70">
                                    {[
                                        { name: 'React', icon: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' },
                                        { name: 'Tailwind', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                                        { name: 'Typescript', icon: 'M16.5 12h-9m9 0v-8m0 8l-4 4m4-4l-4-4' },
                                        { name: 'Local DB', icon: 'M21 12V7a5 5 0 0 0-18 0v10a5 5 0 0 0 18 0' }
                                    ].map((t, i) => (
                                        <div key={i} className="flex items-center gap-2 text-slate-400 group cursor-default">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-white transition-colors"><path d={t.icon} /></svg>
                                            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            */}
                        </div>
                    </div>

                    {/* 3. QUOTE SECTION */}
                    <div className="py-12 border-t border-white/10">
                        <div className="max-w-3xl mx-auto text-center space-y-6">
                            <svg className="w-12 h-12 text-indigo-500 mx-auto opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3C14.017 2.44772 14.4647 2 15.017 2H21.017C21.5693 2 22.017 2.44772 22.017 3V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM2.01695 21L2.01695 18C2.01695 16.8954 2.91238 16 4.01695 16H7.01695C7.56923 16 8.01695 15.5523 8.01695 15V9C8.01695 8.44772 7.56923 8 7.01695 8H4.01695C2.91238 8 2.01695 7.10457 2.01695 6V3C2.01695 2.44772 2.46467 2 3.01695 2H9.01695C9.56923 2 10.017 2.44772 10.017 3V15C10.017 18.3137 7.33066 21 4.01695 21H2.01695Z" /></svg>
                            {isEditing ? (
                                <textarea
                                    className="w-full bg-transparent border-b border-white/20 text-xl md:text-2xl font-medium text-white italic leading-relaxed text-center outline-none focus:border-indigo-500 h-32 resize-none"
                                    value={bioData.quote}
                                    onChange={(e) => handleChange('quote', e.target.value)}
                                    placeholder="Kutipan Inspiratif..."
                                />
                            ) : (
                                <p className="text-xl md:text-2xl font-medium text-white italic leading-relaxed">"{bioData.quote}"</p>
                            )}
                            <div className="w-12 h-1 bg-white/20 mx-auto rounded-full"></div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="text-center pb-8">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">2026 STARS PRESTASI</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevelopmentProfile;
