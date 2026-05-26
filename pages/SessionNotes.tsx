
import React, { useState } from 'react';

const SessionNotes: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [student, setStudent] = useState('');
  const [category, setCategory] = useState('Pribadi');

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const handleSave = () => {
    if (!notes.trim()) return;
    // Simulasi penyimpanan
    alert("Catatan sesi berhasil disimpan ke database lokal.");
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Catatan Sesi Manual</h2>
          <p className="text-slate-500 text-sm">Dokumentasikan sesi bimbingan (Journaling Konselor).</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Siswa</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
              >
                <option value="">-- Pilih Siswa --</option>
                <option value="Andi Pratama">{getInitials("Andi Pratama")} (-)</option>
                <option value="Budi Santoso">{getInitials("Budi Santoso")} (-)</option>
                <option value="Siti Aminah">{getInitials("Siti Aminah")} (-)</option>
              </select>
            </div>
            <div className="sm:w-1/3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Pribadi">Pribadi</option>
                <option value="Sosial">Sosial</option>
                <option value="Akademik">Akademik</option>
                <option value="Karir">Karir</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Sesi / Jurnal Konseling</label>
            <textarea
              className="w-full h-[400px] bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner leading-relaxed"
              placeholder="Ceritakan jalannya sesi, observasi perilaku, dan catatan penting lainnya di sini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!notes.trim()}
              className={`px-8 py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition-all active:scale-95 ${
                !notes.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
              }`}
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionNotes;
