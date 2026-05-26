
import React, { useState, useRef, useEffect } from 'react';
import { SchoolProfile } from '../types';
import Letterhead from '../components/Letterhead';

interface SchoolProfileProps {
  profile: SchoolProfile;
  setProfile: React.Dispatch<React.SetStateAction<SchoolProfile>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: string;
}

const SchoolProfilePage: React.FC<SchoolProfileProps> = ({ profile, setProfile, notify, userRole }) => {
  const isEffectivelyLocked = profile.isLocked && userRole !== 'super_admin';
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<SchoolProfile>(profile);
  const [newMission, setNewMission] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const alumniBgInputRef = useRef<HTMLInputElement>(null);
  const counselorBgInputRef = useRef<HTMLInputElement>(null);

  // Sinkronkan formData saat profile dari parent berubah atau saat masuk mode edit
  useEffect(() => {
    if (!isEditMode) {
      setFormData(profile);
    }
  }, [profile, isEditMode]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      notify("Nama sekolah tidak boleh kosong.", "error");
      return;
    }
    if (!formData.agencyName.trim()) {
      notify("Instansi atasan tidak boleh kosong untuk kop surat.", "error");
      return;
    }

    const isSuperAdmin = userRole === 'super_admin';
    const newEditCount = isSuperAdmin ? (formData.editCount || 0) : (formData.editCount || 0) + 1;
    // Super Admin akan mengunci secara permanen setelah simpan.
    // User lain mengunci jika sudah mencapai 4x edit.
    const isNowLocked = isSuperAdmin ? true : newEditCount >= 4;

    const updatedProfile = { 
        ...formData, 
        editCount: newEditCount, 
        isLocked: isNowLocked,
        updated_at: new Date().toISOString()
    };
    setProfile(updatedProfile);
    setIsEditMode(false);
    notify(isSuperAdmin ? "Profil sekolah berhasil diperbarui dan dikunci." : "Profil sekolah berhasil diperbarui.", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify("File harus berupa gambar.", "error");
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit for Logo
      notify("Ukuran gambar maksimal 1MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFormData(prev => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify("File harus berupa gambar.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for Background
      notify("Ukuran background maksimal 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFormData(prev => ({ ...prev, loginBackground: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleAlumniBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify("File harus berupa gambar.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for Background
      notify("Ukuran background maksimal 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFormData(prev => ({ ...prev, alumniCardBackground: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleCounselorBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify("File harus berupa gambar.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for Background
      notify("Ukuran background maksimal 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFormData(prev => ({ ...prev, counselorCardBackground: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeBackground = () => {
    setFormData(prev => ({ ...prev, loginBackground: undefined }));
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const removeAlumniBackground = () => {
    setFormData(prev => ({ ...prev, alumniCardBackground: undefined }));
    if (alumniBgInputRef.current) alumniBgInputRef.current.value = '';
  };

  const removeCounselorBackground = () => {
    setFormData(prev => ({ ...prev, counselorCardBackground: undefined }));
    if (counselorBgInputRef.current) counselorBgInputRef.current.value = '';
  };

  const addMission = () => {
    if (!newMission.trim()) return;
    setFormData({
      ...formData,
      mission: [...(formData.mission || []), newMission.trim()]
    });
    setNewMission('');
  };

  const removeMission = (index: number) => {
    setFormData({
      ...formData,
      mission: (formData.mission || []).filter((_, i) => i !== index)
    });
  };

  const addAcademicYear = () => {
    if (!newAcademicYear.trim()) return;
    const currentYears = formData.academicYears || [];
    if (currentYears.includes(newAcademicYear.trim())) {
      notify("Tahun pelajaran sudah ada.", "error");
      return;
    }
    setFormData({
      ...formData,
      academicYears: [...currentYears, newAcademicYear.trim()],
      activeAcademicYear: (!formData.activeAcademicYear) ? newAcademicYear.trim() : formData.activeAcademicYear
    });
    setNewAcademicYear('');
  };

  const removeAcademicYear = (index: number) => {
    const currentYears = formData.academicYears || [];
    const yearToRemove = currentYears[index];
    const newYears = currentYears.filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      academicYears: newYears,
      activeAcademicYear: formData.activeAcademicYear === yearToRemove ? (newYears.length > 0 ? newYears[0] : '') : formData.activeAcademicYear
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Profil & Biodata Sekolah</h2>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            Informasi identitas resmi institusi pendidikan.
            {userRole === 'super_admin' ? (
              <div className="flex gap-2 items-center">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">Akses Super Admin</span>
                {profile.isLocked ? (
                  <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Data Terkunci
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                    Terbuka (Siap Edit)
                  </span>
                )}
              </div>
            ) : isEffectivelyLocked ? (
              <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-xs font-bold">Terkunci (Maksimal 4x Edit)</span>
            ) : (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">Sisa Edit: {4 - (profile.editCount || 0)}x</span>
            )}
          </p>
        </div>
        {!isEditMode ? (
          <button
            onClick={() => {
              if (userRole === 'super_admin') {
                setProfile(prev => ({ ...prev, isLocked: false }));
              }
              setIsEditMode(true);
            }}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
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

      {/* Letterhead Preview Section */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Pratinjau Kop Surat Resmi</h4>
        <div className="bg-slate-200 p-8 rounded-[2.5rem] border border-slate-300 shadow-inner flex justify-center">
          <div className="w-full max-w-[800px] shadow-2xl overflow-hidden rounded-sm bg-white">
            <Letterhead profile={isEditMode ? formData : profile} />
            <div className="h-40 bg-white p-8">
              <div className="w-32 h-2 bg-slate-100 rounded mb-2"></div>
              <div className="w-full h-2 bg-slate-50 rounded mb-2"></div>
              <div className="w-full h-2 bg-slate-50 rounded mb-2"></div>
              <div className="w-2/3 h-2 bg-slate-50 rounded"></div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Identity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row items-center gap-8">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-[2rem] border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-white/40">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-5xl font-black italic">{formData.name.charAt(0) || '?'}</div>
                  )}
                </div>
                {isEditMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                    </button>
                    {formData.logo && (
                      <button
                        onClick={removeLogo}
                        className="p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      </button>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="min-w-0 text-center md:text-left flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Instansi Atasan / Pemerintah Daerah</p>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="bg-transparent border-b-2 border-indigo-500/50 text-base font-bold outline-none w-full text-center md:text-left text-white mb-3"
                    placeholder="Contoh: PEMERINTAH DAERAH PROVINSI..."
                    value={formData.agencyName}
                    onChange={e => setFormData({ ...formData, agencyName: e.target.value.toUpperCase() })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-400 mb-2">{profile.agencyName}</p>
                )}

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Dinas Pendidikan</p>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="bg-transparent border-b-2 border-indigo-500/50 text-base font-bold outline-none w-full text-center md:text-left text-white mb-3"
                    placeholder="Contoh: DINAS PENDIDIKAN"
                    value={formData.subAgencyName}
                    onChange={e => setFormData({ ...formData, subAgencyName: e.target.value.toUpperCase() })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-400 mb-2">{profile.subAgencyName}</p>
                )}

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Cabang Dinas</p>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="bg-transparent border-b-2 border-indigo-500/50 text-base font-bold outline-none w-full text-center md:text-left text-white mb-4"
                    placeholder="Contoh: CABANG DINAS PENDIDIKAN WILAYAH V"
                    value={formData.branchAgencyName}
                    onChange={e => setFormData({ ...formData, branchAgencyName: e.target.value.toUpperCase() })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-400 mb-2">{profile.branchAgencyName}</p>
                )}

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Nama Institusi / Sekolah</p>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="bg-transparent border-b-2 border-indigo-500/50 text-2xl font-black outline-none w-full text-center md:text-left text-white"
                    placeholder="Masukkan Nama Sekolah..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <h3 className="text-2xl font-black truncate">{profile.name}</h3>
                )}
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-1.5 border-b border-slate-50 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemerintah Daerah</label>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-indigo-600"
                    value={formData.agencyName}
                    onChange={e => setFormData({ ...formData, agencyName: e.target.value.toUpperCase() })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 uppercase">{profile.agencyName}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5 border-b border-slate-50 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dinas Pendidikan</label>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-indigo-600"
                    value={formData.subAgencyName}
                    onChange={e => setFormData({ ...formData, subAgencyName: e.target.value.toUpperCase() })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 uppercase">{profile.subAgencyName}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5 border-b border-slate-50 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cabang Dinas Pendidikan</label>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-indigo-600"
                    value={formData.branchAgencyName}
                    onChange={e => setFormData({ ...formData, branchAgencyName: e.target.value.toUpperCase() })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 uppercase">{profile.branchAgencyName}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5 border-b border-slate-50 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Resmi Sekolah (Biodata)</label>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-indigo-600"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{profile.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NPSN</label>
                {isEditMode && !isEffectivelyLocked ? (
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={formData.npsn}
                    onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{profile.npsn}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Akreditasi</label>
                {isEditMode && !isEffectivelyLocked ? (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={formData.accreditation}
                    onChange={e => setFormData({ ...formData, accreditation: e.target.value })}
                  >
                    <option value="A (Unggul)">A (Unggul)</option>
                    <option value="B (Baik)">B (Baik)</option>
                    <option value="C (Cukup)">C (Cukup)</option>
                    <option value="Belum Akreditasi">Belum Akreditasi</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">{profile.accreditation}</p>
                )}
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap Sekolah</label>
                  {isEditMode && !isEffectivelyLocked ? (
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold h-24 resize-none"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic h-full bg-slate-50 p-3 rounded-xl border border-slate-100">"{profile.address}"</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kabupaten / Kota</label>
                  {isEditMode && !isEffectivelyLocked ? (
                    <>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                      <p className="text-[9px] text-emerald-600 font-bold italic mt-1">*Digunakan untuk 'Titi Mangsa' di laporan PDF.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{profile.city || '-'}</p>
                      <p className="text-[9px] text-slate-400 italic mt-1">*(Lokasi untuk tanggal surat)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              Visi & Misi Sekolah
            </h4>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visi</label>
                {isEditMode ? (
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold h-24 resize-none"
                    value={formData.vision}
                    onChange={e => setFormData({ ...formData, vision: e.target.value })}
                  />
                ) : (
                  <p className="text-base font-medium text-slate-700 bg-slate-50 p-6 rounded-3xl border border-slate-100 italic leading-relaxed">
                    "{profile.vision}"
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Misi</label>
                <div className="space-y-3">
                  {((isEditMode ? formData.mission : profile.mission) || []).map((m, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl group transition-all hover:border-indigo-100">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium text-slate-600 flex-1">{m}</p>
                      {isEditMode && (
                        <button onClick={() => removeMission(i)} className="text-rose-300 hover:text-rose-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditMode && (
                  <div className="flex gap-2 pt-2">
                    <input
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="Tambah poin misi..."
                      value={newMission}
                      onChange={e => setNewMission(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addMission()}
                    />
                    <button
                      onClick={addMission}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                    >
                      Tambah
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tahun Pelajaran Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              Tahun Pelajaran
            </h4>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Pelajaran Aktif</label>
                {isEditMode ? (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                    value={formData.activeAcademicYear || ''}
                    onChange={e => setFormData({ ...formData, activeAcademicYear: e.target.value })}
                  >
                    <option value="">-- Pilih Tahun Pelajaran Aktif --</option>
                    {(formData.academicYears || []).map((ay, i) => (
                      <option key={i} value={ay}>{ay}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    {profile.activeAcademicYear || 'Belum diatur'}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Tahun Pelajaran</label>
                <div className="space-y-3">
                  {(isEditMode ? formData.academicYears || [] : profile.academicYears || []).map((ay, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl group transition-all hover:border-emerald-100">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium text-slate-600 flex-1">{ay}</p>
                      {isEditMode && (
                        <button type="button" onClick={() => removeAcademicYear(i)} className="text-rose-300 hover:text-rose-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {(!isEditMode && (!profile.academicYears || profile.academicYears.length === 0)) && (
                    <p className="text-xs text-slate-400 italic">Belum ada tahun pelajaran yang ditambahkan.</p>
                  )}
                </div>
                {isEditMode && (
                  <div className="flex gap-2 pt-2">
                    <input
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Contoh: 2024/2025"
                      value={newAcademicYear}
                      onChange={e => setNewAcademicYear(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAcademicYear();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addAcademicYear}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                    >
                      Tambah
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Principal & Contact */}
        <div className="space-y-8">

          {/* LOGIN BACKGROUND SETTINGS */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              Tampilan Halaman Login
            </h4>
            <div className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 flex items-center justify-center group">
              {formData.loginBackground ? (
                <img src={formData.loginBackground} alt="Login Background" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 text-xs font-bold flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
                  Default (Polos)
                </div>
              )}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                  >
                    Upload
                  </button>
                  {formData.loginBackground && (
                    <button
                      onClick={removeBackground}
                      className="mt-2 text-white text-[10px] font-bold hover:text-rose-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
              <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed text-center">Upload gambar untuk mempercantik halaman login aplikasi.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              Latar Belakang Kartu Alumni
            </h4>
            <div className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 flex items-center justify-center group">
              {formData.alumniCardBackground ? (
                <img src={formData.alumniCardBackground} alt="Alumni Card Background" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 text-xs font-bold flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="10" y1="9" x2="8" y2="9" /><rect x="6" y="5" width="4" height="4" rx="1" /></svg>
                  Default (Putih)
                </div>
              )}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <button
                    onClick={() => alumniBgInputRef.current?.click()}
                    className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                  >
                    Upload
                  </button>
                  {formData.alumniCardBackground && (
                    <button
                      onClick={removeAlumniBackground}
                      className="mt-2 text-white text-[10px] font-bold hover:text-rose-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
              <input type="file" ref={alumniBgInputRef} className="hidden" accept="image/*" onChange={handleAlumniBgUpload} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed text-center">Gunakan gambar (85.6mm x 53.98mm) untuk latar belakang kartu alumni Anda.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              Latar Belakang Kartu Konselor
            </h4>
            <div className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 flex items-center justify-center group">
              {formData.counselorCardBackground ? (
                <img src={formData.counselorCardBackground} alt="Counselor Card Background" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 text-xs font-bold flex flex-col items-center text-center px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 11h2"/><path d="M7 15h2"/><path d="M13 11h4"/><path d="M13 15h4"/></svg>
                  Default (Plain White)
                </div>
              )}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <button
                    onClick={() => counselorBgInputRef.current?.click()}
                    className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                  >
                    Upload
                  </button>
                  {formData.counselorCardBackground && (
                    <button
                      onClick={removeCounselorBackground}
                      className="mt-2 text-white text-[10px] font-bold hover:text-rose-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
              <input type="file" ref={counselorBgInputRef} className="hidden" accept="image/*" onChange={handleCounselorBgUpload} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed text-center">Gunakan gambar (85.6mm x 53.98mm) untuk latar belakang kartu konselor Anda.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kepala Sekolah</h4>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <div className="space-y-1 w-full text-left">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">Nama Kepala Sekolah</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                        value={formData.principalName}
                        onChange={e => setFormData({ ...formData, principalName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">NIP Kepala Sekolah</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                        value={formData.principalNip}
                        onChange={e => setFormData({ ...formData, principalNip: e.target.value })}
                      />
                      <p className="text-[8px] text-emerald-600 font-bold italic mt-0.5">
                        *Otomatis sinkron dari Daftar Guru (Peran: Kepala Sekolah).
                        Akan muncul di tanda tangan Kepala Sekolah pada laporan PDF.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className="text-base font-black text-slate-800 text-center">{profile.principalName}</h5>
                    <p className="text-[10px] font-mono text-slate-400 uppercase text-center">NIP. {profile.principalNip}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guru BK / Konselor Utama</h4>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path d="M12 11v6" /></svg>
              </div>
              <div className="space-y-1 w-full text-left">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">Nama Guru BK</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                        value={formData.counselorName}
                        onChange={e => setFormData({ ...formData, counselorName: e.target.value })}
                      />
                      <p className="text-[8px] text-indigo-400 font-bold italic mt-0.5">*Dipakai jika konselor tidak login/profil kosong.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">NIP Guru BK</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                        value={formData.counselorNip}
                        onChange={e => setFormData({ ...formData, counselorNip: e.target.value })}
                      />
                      <p className="text-[8px] text-emerald-600 font-bold italic mt-0.5">*Akan muncul di tanda tangan Konselor jika profil individu kosong.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className="text-base font-black text-slate-800 text-center">{profile.counselorName}</h5>
                    <p className="text-[10px] font-mono text-slate-400 uppercase text-center">NIP. {profile.counselorNip}</p>
                    <p className="text-[8px] text-slate-300 italic text-center mt-2">*Nama ini muncul di tanda tangan PDF jika user bukan konselor.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak & Media</h4>
            <div className="space-y-4">
              {[
                { label: 'Telepon', key: 'phone', val: profile.phone, icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
                { label: 'Fax', key: 'fax', val: profile.fax, icon: 'M17 3v18h-10v-18h10zm-2 2h-6v14h6v-14zm-4 10h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2z' },
                { label: 'Email', key: 'email', val: profile.email, icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
                { label: 'Website', key: 'website', val: profile.website, icon: 'M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9' }
              ].map(item => (
                <div key={item.key} className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">{item.label}</label>
                  {isEditMode ? (
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
                      value={(formData as any)[item.key]}
                      onChange={e => setFormData({ ...formData, [item.key]: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <svg className="w-4 h-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d={item.icon} /></svg>
                      <p className="text-xs font-bold text-slate-600 truncate">{(profile as any)[item.key]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolProfilePage;

