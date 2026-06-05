import React, { useState, useRef } from 'react';
import { Student, Rombel, ClassSubjectRecord, StudentGradeRecord, SchoolProfile } from '../types';
import Letterhead from '../components/Letterhead';
import { STANDARD_SUBJECTS } from '../constants';
import * as XLSX from 'xlsx';

interface GradeManagementProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  alumni?: Student[];
  setAlumni?: (students: Student[]) => void;
  rombels: Rombel[];
  classSubjects: ClassSubjectRecord[];
  setClassSubjects: React.Dispatch<React.SetStateAction<ClassSubjectRecord[]>>;
  studentGrades: StudentGradeRecord[];
  setStudentGrades: React.Dispatch<React.SetStateAction<StudentGradeRecord[]>>;
  schoolProfile: SchoolProfile;
  gradesConfig: any[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function GradeManagement({
  students,
  setStudents,
  alumni,
  setAlumni,
  rombels,
  classSubjects,
  setClassSubjects,
  studentGrades,
  setStudentGrades,
  schoolProfile,
  gradesConfig,
  notify
}: GradeManagementProps) {
  const allStudents = [...students, ...(alumni || [])];
  const [activeTab, setActiveTab] = useState<'subject-selection-ijazah' | 'subject-selection-eligible' | 'import-grades' | 'view-grades' | 'report-psaj' | 'report-eligible' | 'report-us1' | 'report-skkb' | 'report-skl' | 'report-transcript'>('subject-selection-ijazah');
  
  // US-1 Filter
  const [reportUs1Class, setReportUs1Class] = useState<string>('semua-xii');
  
  const [reportPsajType, setReportPsajType] = useState<'per-kelas' | 'seangkatan'>('seangkatan');
  const [reportPsajClass, setReportPsajClass] = useState<string>('');
  
  // SKKB State
  const [selectedSkkbStudents, setSelectedSkkbStudents] = useState<string[]>([]);
  
  // SKL State
  const [selectedSklStudents, setSelectedSklStudents] = useState<string[]>([]);
  
  // Transcript State
  const [selectedTranscriptStudents, setSelectedTranscriptStudents] = useState<string[]>([]);
  
  // Eligible Ranking State
  const [eligibleMajor, setEligibleMajor] = useState<string>('');
  const [eligibleQuotaStr, setEligibleQuotaStr] = useState<string>('40');
  
  // Curriculum State
  const [curriculum, setCurriculum] = useState<'Merdeka' | 'K13'>(() => {
    return (localStorage.getItem('star_curriculum') as 'Merdeka' | 'K13') || 'Merdeka';
  });
  
  React.useEffect(() => {
    localStorage.setItem('star_curriculum', curriculum);
  }, [curriculum]);

  // Subject Selection State
  const [subjectMajor, setSubjectMajor] = useState<string>('');
  const [subjectSemester, setSubjectSemester] = useState<'1' | '3' | '5'>('1');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedEligibleSubjects, setSelectedEligibleSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState<string>('');

  // Import State
  const classXIIMajors = Array.from(new Set(rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => r.major).filter(Boolean)));
  const [importMajor, setImportMajor] = useState<string>('');
  const [importSemester, setImportSemester] = useState<string>('1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Grades State
  const [viewRombelId, setViewRombelId] = useState<string>('');
  const [viewSemester, setViewSemester] = useState<string>('Semua');
  const [viewGradesMode, setViewGradesMode] = useState<'per-kelas' | 'per-jurusan' | 'semua-xii'>('per-kelas');
  const [viewGradesMajor, setViewGradesMajor] = useState<string>('');

  // Derive active subject record
  const currentSubjectRecordId = `${subjectMajor}_${subjectSemester}`;
  
  React.useEffect(() => {
    if (subjectMajor && subjectSemester) {
      const record = classSubjects.find(r => r.id === currentSubjectRecordId);
      if (record) {
        setSelectedSubjects(record.subjects);
        setSelectedEligibleSubjects(record.eligibleSubjects || []);
      } else {
        setSelectedSubjects([]);
        setSelectedEligibleSubjects([]);
      }
    }
  }, [subjectMajor, subjectSemester, classSubjects]);

  // Force subjectMajor to 'Umum' when semester 1 is selected AND curriculum is Merdeka
  React.useEffect(() => {
    if (subjectSemester === '1' && curriculum === 'Merdeka') {
      setSubjectMajor('Umum');
    } else if (subjectMajor === 'Umum' && classXIIMajors.length > 0) {
      setSubjectMajor(classXIIMajors[0]);
    }
  }, [subjectSemester, curriculum, classXIIMajors]);

  React.useEffect(() => {
    if (!importMajor && classXIIMajors.length > 0) {
      setImportMajor(classXIIMajors[0]);
    }
  }, [classXIIMajors]);

  // Effect to manage import major
  React.useEffect(() => {
    if ((importSemester === '1' || importSemester === '2') && curriculum === 'Merdeka') {
      setImportMajor('Umum');
    } else if (importMajor === 'Umum' && classXIIMajors.length > 0) {
      setImportMajor(classXIIMajors[0]);
    }
  }, [importSemester, curriculum, classXIIMajors]);

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      // Auto-remove from eligible if unchecked from main list
      if (selectedEligibleSubjects.includes(subject)) {
        setSelectedEligibleSubjects(selectedEligibleSubjects.filter(s => s !== subject));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleToggleEligibleSubject = (subject: string) => {
    if (selectedEligibleSubjects.includes(subject)) {
      setSelectedEligibleSubjects(selectedEligibleSubjects.filter(s => s !== subject));
    } else {
      setSelectedEligibleSubjects([...selectedEligibleSubjects, subject]);
    }
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleSaveSubjects = () => {
    if (!subjectMajor) {
      alert("Pilih jurusan terlebih dahulu.");
      return;
    }
    const newRecord: ClassSubjectRecord = {
      id: currentSubjectRecordId,
      rombelId: subjectMajor, // Storing major in the rombelId field to reuse DB schema
      semester: subjectSemester,
      subjects: selectedSubjects,
      eligibleSubjects: selectedEligibleSubjects
    };
    const newRecords = classSubjects.filter(r => r.id !== currentSubjectRecordId);
    newRecords.push(newRecord);
    setClassSubjects(newRecords);
    alert('Mata pelajaran berhasil disimpan untuk jurusan ini.');
  };

  const normalizeClassSuffix = (str: string) => {
    if (!str) return '';
    let cleaned = str.trim().replace(/\s+/g, ' ').toUpperCase();
    const parts = cleaned.split(' ');
    const lastPart = parts[parts.length - 1];
    if (!isNaN(Number(lastPart)) && /^\d+$/.test(lastPart)) {
      parts[parts.length - 1] = lastPart;
    }
    return parts.join(' ');
  };

  const extractShortName = (fullName: string, grade: string) => {
    const normalizedGrade = grade.trim().toUpperCase();
    const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
    return normalizeClassSuffix(nameWithoutGrade);
  };

  const isStudentInRombel = (student: Student, rombel: Rombel) => {
    if (!student || !rombel) return false;
    // Cek ID class (legacy / fallback)
    if (student.class === rombel.id || rombel.name === student.class || student.class === rombel.name) return true;
    
    // Cek menggunakan logika short name (sama seperti Manajemen Kelas)
    const targetGrade = rombel.grade.trim().toUpperCase();
    const targetSuffix = extractShortName(rombel.name, rombel.grade);
    const sGrade = (student.grade || '').trim().toUpperCase();
    const sSuffix = normalizeClassSuffix(student.class || '');
    
    return sGrade === targetGrade && sSuffix === targetSuffix;
  };

  // Helper to get subjects for a class and semester
  const getSubjectsForClassAndSemester = (rombelId: string, sem: string): string[] => {
    let targetSem: '1' | '3' | '5' = '1';
    if (sem === '1' || sem === '2') targetSem = '1';
    if (sem === '3' || sem === '4') targetSem = '3';
    if (sem === '5' || sem === '6' || sem === 'PSAJ') targetSem = '5';

    const rombel = rombels.find(r => r.id === rombelId);
    if (!rombel) return STANDARD_SUBJECTS;

    // Try specific major first (for K13 or Sem 3/5)
    let record = classSubjects.find(r => r.id === `${rombel.major}_${targetSem}`);
    
    // If not found and it's semester 1, try 'Umum' (Merdeka style)
    if (!record && targetSem === '1') {
      record = classSubjects.find(r => r.id === `Umum_${targetSem}`);
    }
    
    // Fallback: if not found by major, try to find by rombelId (for legacy records)
    if (!record) {
      const legacyRecord = classSubjects.find(r => r.id === `${rombelId}_${targetSem}`);
      return legacyRecord ? legacyRecord.subjects : STANDARD_SUBJECTS;
    }
    
    return record.subjects;
  };

  // Generate Excel Template
  const generateTemplate = () => {
    const isClassX = importSemester === '1' || importSemester === '2';
    const majorStudents = allStudents.filter(s => {
      const rombel = rombels.find(r => isStudentInRombel(s, r));
      if (!rombel || !(rombel.grade === 'XII' || rombel.grade === '12')) return false;
      
      if (isClassX && curriculum === 'Merdeka') return true; // Class X: All Class XII students
      return rombel.major === importMajor;
    });

    if (majorStudents.length === 0) {
      alert(`Tidak ada siswa di jurusan ${importMajor}.`);
      return;
    }

    // Determine all subjects that apply to this major for this semester
    let targetSem: '1' | '3' | '5' = '1';
    if (importSemester === '1' || importSemester === '2') targetSem = '1';
    if (importSemester === '3' || importSemester === '4') targetSem = '3';
    if (importSemester === '5' || importSemester === '6' || importSemester === 'PSAJ') targetSem = '5';

    let record = classSubjects.find(r => r.id === `${importMajor}_${targetSem}`);
    
    // If not found and it's semester 1, try 'Umum' (Merdeka style)
    if (!record && targetSem === '1') {
      record = classSubjects.find(r => r.id === `Umum_${targetSem}`);
    }

    const subjectColumns = record ? record.subjects : STANDARD_SUBJECTS;

    const data = majorStudents.map(s => {
      const rombel = rombels.find(r => isStudentInRombel(s, r));
      const baseObj: any = {
        'NISN': s.nisn,
        'Nama': s.name,
        'Kelas': rombel ? rombel.name : ''
      };
      
      // Initialize subject columns with existing grades if any
      const studentGradeRecord = studentGrades.find(g => g.studentId === s.id && g.semester === importSemester);
      subjectColumns.forEach(sub => {
        const existingGrade = studentGradeRecord?.grades[sub];
        baseObj[sub] = existingGrade !== undefined ? existingGrade : '';
      });

      return baseObj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Nilai Sem ${importSemester} - ${importMajor}`);
    XLSX.writeFile(wb, `Template_Nilai_Semester_${importSemester}_${importMajor}.xlsx`);
  };

  // Handle Excel Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isClassX = importSemester === '1' || importSemester === '2';
    const majorStudents = allStudents.filter(s => {
      const rombel = rombels.find(r => isStudentInRombel(s, r));
      if (!rombel || !(rombel.grade === 'XII' || rombel.grade === '12')) return false;
      
      if (isClassX && curriculum === 'Merdeka') return true; // Class X: All Class XII students
      return rombel.major === importMajor;
    });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        const newGradeRecords: StudentGradeRecord[] = [];

        data.forEach((row: any) => {
          const nisn = String(row['NISN'] || '');
          const student = majorStudents.find(s => s.nisn === nisn);
          if (student) {
            const grades: Record<string, number> = {};
            Object.keys(row).forEach(key => {
              if (key !== "NISN" && key !== "Nama" && key !== "Kelas") {
                const value = parseFloat(row[key]);
                if (!isNaN(value)) {
                  grades[key] = value;
                }
              }
            });
            newGradeRecords.push({
              id: `${student.id}_${importSemester}`,
              studentId: student.id,
              semester: importSemester,
              grades: grades
            });
          }
        });

        if (newGradeRecords.length > 0) {
          setStudentGrades(prev => {
            const filtered = prev.filter(g => 
              !(g.semester === importSemester && newGradeRecords.some(ng => ng.studentId === g.studentId))
            );
            return [...filtered, ...newGradeRecords];
          });
          alert(`Berhasil mengimport nilai untuk ${newGradeRecords.length} siswa.`);
        } else {
          alert('Tidak ada data nilai yang valid untuk diimport.');
        }

      } catch (err) {
        console.error(err);
        alert("Gagal membaca file Excel. Pastikan format sesuai template.");
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manajemen Nilai Raport</h1>
          <p className="text-slate-500 text-sm mt-1">Atur mata pelajaran per kelas dan impor nilai secara massal.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('subject-selection-ijazah')}
            className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'subject-selection-ijazah' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
          Penentuan Mata Pelajaran Ijazah
        </button>
          <button
            onClick={() => setActiveTab('subject-selection-eligible')}
            className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'subject-selection-eligible' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
          Penentuan Mata Pelajaran Eligible
        </button>
          <button
            onClick={() => setActiveTab('import-grades')}
            className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'import-grades' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
          Import Nilai Massal
        </button>
        </div>
        {(activeTab === 'subject-selection-ijazah' || activeTab === 'subject-selection-eligible') && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kurikulum</label>
                <select
                  value={curriculum}
                  onChange={e => setCurriculum(e.target.value as 'Merdeka' | 'K13')}
                  disabled={activeTab !== 'subject-selection-ijazah'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Merdeka">Kurikulum Merdeka</option>
                  <option value="K13">Kurikulum 2013</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
                <select
                  value={subjectSemester}
                  onChange={e => setSubjectSemester(e.target.value as '1' | '3' | '5')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="1">Semester 1 & 2</option>
                  <option value="3">Semester 3 & 4</option>
                  <option value="5">
                    {activeTab === 'subject-selection-eligible' ? 'Semester 5' : 'Semester 5 & 6 (Termasuk PSAJ)'}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jurusan</label>
                <select
                  value={subjectMajor}
                  onChange={e => setSubjectMajor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {subjectSemester === '1' && curriculum === 'Merdeka' ? (
                    <option value="Umum">Fase E (Umum)</option>
                  ) : (
                    classXIIMajors.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {subjectMajor && activeTab === 'subject-selection-ijazah' && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Daftar Mata Pelajaran Ijazah / Raport</h3>
                    <p className="text-xs text-slate-500">Centang mata pelajaran yang akan muncul di rapor atau ijazah untuk jurusan {subjectMajor}.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => {
                        const isAllSelected = STANDARD_SUBJECTS.every(sub => selectedSubjects.includes(sub));
                        if (isAllSelected) {
                          setSelectedSubjects(selectedSubjects.filter(sub => !STANDARD_SUBJECTS.includes(sub)));
                        } else {
                          setSelectedSubjects(Array.from(new Set([...STANDARD_SUBJECTS, ...selectedSubjects])));
                        }
                      }}
                      className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                    >
                      {STANDARD_SUBJECTS.every(sub => selectedSubjects.includes(sub)) ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                    <button onClick={handleSaveSubjects} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap">
                      Simpan Mata Pelajaran
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STANDARD_SUBJECTS.map(sub => (
                    <label key={sub} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedSubjects.includes(sub)}
                        onChange={() => handleToggleSubject(sub)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{sub}</span>
                    </label>
                  ))}
                  {selectedSubjects.filter(sub => !STANDARD_SUBJECTS.includes(sub)).map(sub => (
                    <label key={sub} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={true}
                        onChange={() => handleToggleSubject(sub)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{sub}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex gap-2 max-w-md">
                  <input 
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    placeholder="Tambah Mapel Kustom..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button onClick={handleAddCustomSubject} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                    Tambah
                  </button>
                </div>
              </div>
            )}

            {subjectMajor && activeTab === 'subject-selection-eligible' && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Pilih Mata Pelajaran Eligible (SNBP)</h3>
                    <p className="text-xs text-slate-500">Tandai mata pelajaran yang nilainya akan digunakan untuk pemeringkatan Eligible SNBP secara online. (Harus dikonfigurasi di Ijazah terlebih dahulu)</p>
                  </div>
                  {selectedSubjects.length > 0 && (
                    <button
                      onClick={() => {
                        const isAllSelected = selectedSubjects.every(sub => selectedEligibleSubjects.includes(sub));
                        if (isAllSelected) {
                          setSelectedEligibleSubjects([]);
                        } else {
                          setSelectedEligibleSubjects([...selectedSubjects]);
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                    >
                      Pilih Semua
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedSubjects.map(sub => (
                    <label key={sub} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedEligibleSubjects.includes(sub)}
                        onChange={() => handleToggleEligibleSubject(sub)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{sub}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-6">
                  <button onClick={handleSaveSubjects} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all">
                    Simpan Mata Pelajaran Eligible
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {activeTab === 'import-grades' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kurikulum</label>
              <select
                value={curriculum}
                onChange={e => setCurriculum(e.target.value as 'Merdeka' | 'K13')}
                disabled={true}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="Merdeka">Kurikulum Merdeka</option>
                <option value="K13">Kurikulum 2013</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jurusan</label>
              <select
                value={importMajor}
                onChange={e => setImportMajor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {(importSemester === '1' || importSemester === '2') && curriculum === 'Merdeka' ? (
                  <option value="Umum">Fase E (Umum)</option>
                ) : (
                  classXIIMajors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester Tujuan</label>
              <select
                value={importSemester}
                onChange={e => setImportSemester(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <option key={s} value={s.toString()}>Semester {s}</option>
                ))}
                <option value="PSAJ">PSAJ</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              onClick={generateTemplate}
              className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl text-sm font-bold transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Template Excel
            </button>
            <div className="flex-1 relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl text-sm font-bold transition-all pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload & Import Nilai
              </div>
            </div>
          </div>
        </div>
      )}







      {activeTab === 'report-transcript' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
           <p className="text-center text-slate-500 py-10">Fitur Transkrip sedang dalam perbaikan.</p>
        </div>
      )}
    </div>
  );
};
