import React, { useState, useEffect } from 'react';

interface AcademicPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (period: { tahun_pelajaran: string; semester: string }) => void;
  currentPeriod: { tahun_pelajaran: string; semester: string } | null;
  forceSelect?: boolean;
  schoolAcademicYears?: string[];
}

const AcademicPeriodModal: React.FC<AcademicPeriodModalProps> = ({ isOpen, onClose, onSave, currentPeriod, forceSelect, schoolAcademicYears }) => {
  const [tahunPelajaran, setTahunPelajaran] = useState(currentPeriod?.tahun_pelajaran || (schoolAcademicYears && schoolAcademicYears.length > 0 ? schoolAcademicYears[schoolAcademicYears.length - 1] : '2024/2025'));
  const [semester, setSemester] = useState(currentPeriod?.semester || 'Ganjil');

  useEffect(() => {
    if (isOpen && currentPeriod) {
      setTahunPelajaran(currentPeriod.tahun_pelajaran);
      setSemester(currentPeriod.semester);
    }
  }, [isOpen, currentPeriod]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (tahunPelajaran && semester) {
      onSave({ tahun_pelajaran: tahunPelajaran, semester });
    }
  };

  const currentYear = new Date().getFullYear();
  const generateYears = () => {
    if (schoolAcademicYears && schoolAcademicYears.length > 0) {
      return schoolAcademicYears;
    }
    const years = [];
    for (let i = -2; i <= 3; i++) {
      const year1 = currentYear + i;
      const year2 = year1 + 1;
      years.push(`${year1}/${year2}`);
    }
    return years;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tahun Pelajaran</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {forceSelect ? 'Silakan pilih tahun pelajaran dan semester untuk melanjutkan ke menu kurikulum.' : 'Ubah tahun pelajaran dan semester aktif Anda.'}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tahun Pelajaran</label>
            <select
              value={tahunPelajaran}
              onChange={(e) => setTahunPelajaran(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold transition-all"
            >
              {generateYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold transition-all"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          {!forceSelect && (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            onClick={handleSave}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 ${forceSelect ? 'w-full' : ''}`}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicPeriodModal;
