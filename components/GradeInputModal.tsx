import React, { useState, useEffect, useMemo } from 'react';
import { Student, KMSubjectRecord } from '../types';

interface GradeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (studentId: string, semesterGrades: Record<string, Record<string, number>>) => void;
  kmSubjects: KMSubjectRecord[];
  setKmSubjects?: React.Dispatch<React.SetStateAction<KMSubjectRecord[]>>;
}

const K13_MIPA_SUBJECTS = ['Agama', 'PPKn', 'Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Biologi', 'Fisika', 'Kimia'];
const K13_IPS_SUBJECTS = ['Agama', 'PPKn', 'Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Geografi', 'Sejarah', 'Sosiologi', 'Ekonomi'];
const KM_COMPULSORY_SUBJECTS = ['Agama', 'PPKn', 'Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Sejarah'];
const KM_ELECTIVE_SUBJECTS = ['Biologi', 'Fisika', 'Kimia', 'Informatika', 'Sosiologi', 'Ekonomi', 'Geografi', 'Antropologi', 'Bahasa Asing Lainnya'];

const GradeInputModal: React.FC<GradeInputModalProps> = ({ isOpen, onClose, student, onSave, kmSubjects, setKmSubjects }) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'subjects'>('grades');
  const [activeSemester, setActiveSemester] = useState<string>('1');
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);

  const isKM = student.isKM;
  const isClassXIXII = useMemo(() => {
    const g = student.grade?.toUpperCase() || '';
    return g.includes('XI') || g.includes('XII') || g.includes('11') || g.includes('12');
  }, [student.grade]);

  const showSubjectSelection = isKM && isClassXIXII;

  useEffect(() => {
    if (isOpen) {
      setGrades(student.semesterGrades ? JSON.parse(JSON.stringify(student.semesterGrades)) : {});
      setActiveSemester('1');
      setActiveTab('grades');
      
      const isMIPA = student.class?.toUpperCase().includes('MIPA') || student.class?.toUpperCase().includes('IPA');
      const isIPS = student.class?.toUpperCase().includes('IPS');

      if (!isKM) {
        let defaultSubjects = K13_MIPA_SUBJECTS;
        if (isMIPA) defaultSubjects = K13_MIPA_SUBJECTS;
        else if (isIPS) defaultSubjects = K13_IPS_SUBJECTS;
        setAvailableSubjects(defaultSubjects);
      } else {
        if (showSubjectSelection) {
          const studentKm = kmSubjects.find(k => k.studentId === student.id);
          const electives = studentKm ? studentKm.subjects : [];
          setSelectedElectives(electives);
          setAvailableSubjects([...KM_COMPULSORY_SUBJECTS, ...electives]);
        } else {
          setAvailableSubjects([...KM_COMPULSORY_SUBJECTS, 'IPAS', 'Seni Budaya', 'PJOK']); 
        }
      }
    }
  }, [isOpen, student, isKM, showSubjectSelection, kmSubjects]);

  if (!isOpen) return null;

  const handleGradeChange = (subject: string, value: string) => {
    const numValue = parseFloat(value);
    setGrades(prev => ({
      ...prev,
      [activeSemester]: {
        ...(prev[activeSemester] || {}),
        [subject]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !availableSubjects.includes(newSubject.trim())) {
      const added = newSubject.trim();
      setAvailableSubjects(prev => [...prev, added]);
      if (showSubjectSelection) {
        setSelectedElectives(prev => [...prev, added]);
      }
      setNewSubject('');
    }
  };

  const handleToggleElective = (subject: string) => {
    setSelectedElectives(prev => {
      const isSelected = prev.includes(subject);
      const newElectives = isSelected ? prev.filter(s => s !== subject) : [...prev, subject];
      setAvailableSubjects([...KM_COMPULSORY_SUBJECTS, ...newElectives]);
      return newElectives;
    });
  };

  const handleSave = () => {
    if (showSubjectSelection && setKmSubjects) {
      setKmSubjects(prev => {
        const others = prev.filter(k => k.studentId !== student.id);
        return [...others, { studentId: student.id, subjects: selectedElectives }];
      });
    }
    onSave(student.id, grades);
    onClose();
  };

  const currentSemesterGrades = grades[activeSemester] || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem] shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800">Input Nilai Raport (SNBP)</h3>
            <p className="text-sm font-bold text-slate-500">{student.name} - {student.grade} {student.class}</p>
            <p className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-md inline-block mt-1 uppercase tracking-widest">
              Kurikulum: {isKM ? 'Merdeka' : '2013'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {showSubjectSelection && (
          <div className="flex border-b border-slate-100 bg-white px-6 pt-4 shrink-0">
            <button
              onClick={() => setActiveTab('grades')}
              className={`pb-4 px-4 text-sm font-black transition-all border-b-2 ${activeTab === 'grades' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Input Nilai
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'subjects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Penentuan Mata Pelajaran
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">Baru</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {activeTab === 'grades' ? (
            <div className="animate-in fade-in duration-300">
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                {['1', '2', '3', '4', '5', '6'].map(sem => (
                  <button
                    key={sem}
                    onClick={() => setActiveSemester(sem)}
                    className={`px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap border-2 ${activeSemester === sem ? 'bg-teal-50 border-teal-200 text-teal-600 shadow-sm' : 'bg-white border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                  >
                    Semester {sem}
                  </button>
                ))}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Daftar Mata Pelajaran</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableSubjects.map(subject => (
                    <div key={subject} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                      <label className="flex-1 text-xs font-bold text-slate-700 ml-2">{subject}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        value={currentSemesterGrades[subject] || ''}
                        onChange={(e) => handleGradeChange(subject, e.target.value)}
                        className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-slate-800 text-center outline-none focus:border-teal-500"
                      />
                    </div>
                  ))}
                </div>

                {!showSubjectSelection && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-500 mb-2">Tambah Mata Pelajaran Manual</h5>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nama Mata Pelajaran..."
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-teal-500 focus:bg-white transition-all"
                      />
                      <button
                        onClick={handleAddSubject}
                        className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Mata Pelajaran Wajib</h4>
                  <p className="text-xs text-slate-500 mb-4">Secara otomatis ditambahkan untuk Kurikulum Merdeka.</p>
                  <div className="flex flex-wrap gap-2">
                    {KM_COMPULSORY_SUBJECTS.map(sub => (
                      <span key={sub} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{sub}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest">Pilih Mata Pelajaran Pilihan</h4>
                  <p className="text-xs text-slate-500 mb-4">Centang mata pelajaran spesifik yang diambil oleh siswa ini.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {KM_ELECTIVE_SUBJECTS.map(sub => {
                      const isSelected = selectedElectives.includes(sub);
                      return (
                        <button
                          key={sub}
                          onClick={() => handleToggleElective(sub)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 hover:border-slate-300 text-slate-600'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-500 text-white' : 'border-2 border-slate-300'}`}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span className="text-xs font-bold">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-500 mb-2">Tambah Mata Pelajaran Khusus</h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ketik manual..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      onClick={handleAddSubject}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Tambahkan Pilihan
                    </button>
                  </div>
                  {/* Tampilkan Pilihan Kustom */}
                  {selectedElectives.filter(s => !KM_ELECTIVE_SUBJECTS.includes(s)).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedElectives.filter(s => !KM_ELECTIVE_SUBJECTS.includes(s)).map(customSub => (
                        <div key={customSub} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                          {customSub}
                          <button onClick={() => handleToggleElective(customSub)} className="text-indigo-400 hover:text-indigo-600">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-[2rem] shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Batal</button>
          <button onClick={handleSave} className="px-6 py-3 rounded-xl font-black bg-teal-600 text-white shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all active:scale-95 flex items-center gap-2">
            Simpan Nilai & Mapel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeInputModal;
