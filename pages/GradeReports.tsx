import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, Rombel, SchoolProfile, ClassSubjectRecord, StudentGradeRecord, US1Record } from '../types';
import { generateLetterNumbersBatch } from '../utils/letterGenerator';

interface AppGradeConfig {
  id?: string;
  name: string;
  classCount?: number;
  prefixes?: string[];
  electivesByMajor?: Record<string, string[]>;
}
import Letterhead from '../components/Letterhead';

interface GradeReportsProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  alumni?: Student[];
  setAlumni?: (students: Student[]) => void;
  rombels: Rombel[];
  classSubjects: ClassSubjectRecord[];
  schoolProfile: SchoolProfile;
  studentGrades: StudentGradeRecord[];
  gradesConfig?: AppGradeConfig[];
  graduationInfo?: Record<string, any>;
  activeAcademicYear?: string;
  activeSemester?: string;
  us1Records: US1Record[];
  setUs1Records: (r: US1Record[]) => void;
}

export default function GradeReports({
  students,
  setStudents,
  alumni,
  setAlumni,
  rombels,
  classSubjects,
  schoolProfile,
  studentGrades,
  gradesConfig,
  graduationInfo,
  activeAcademicYear,
  activeSemester,
  us1Records,
  setUs1Records
}: GradeReportsProps) {
  const allStudents = [...students, ...(alumni || [])];
  const [activeTab, setActiveTab] = useState<'view-grades' | 'report-eligible' | 'report-us1' | 'report-psaj' | 'report-skkb' | 'report-skl' | 'report-transcript'>('view-grades');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Eligible Filter
  const [eligibleMajor, setEligibleMajor] = useState<string>('');

  // US-1 Filter
  const [reportUs1Class, setReportUs1Class] = useState<string>('semua-xii');
  const [us1Sort, setUs1Sort] = useState<'abjad' | 'kelas-abjad'>('abjad');
  const [us1Page, setUs1Page] = useState<number>(1);
  
  // View Grades Filter
  const [viewClass, setViewClass] = useState<string>('');
  const [viewSemester, setViewSemester] = useState<string>('1');

  // PSAJ Filter
  const [psajClass, setPsajClass] = useState<string>('');
  
  // Transcript Filter
  const [transcriptClass, setTranscriptClass] = useState<string>('');
  const [transcriptStudent, setTranscriptStudent] = useState<string>('all');
  const [transcriptPage, setTranscriptPage] = useState<number>(1);
  const [transcriptNumber, setTranscriptNumber] = useState<string>('');
  
  // SKKB Filter
  const [skkbClass, setSkkbClass] = useState<string>('');
  const [skkbStudent, setSkkbStudent] = useState<string>('all');
  const [skkbPage, setSkkbPage] = useState<number>(1);
  const [skkbNumber, setSkkbNumber] = useState<string>('');
  const [skkbGeneratedNumbers, setSkkbGeneratedNumbers] = useState<Record<string, string>>({});
  const [skkbDate, setSkkbDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // SKL Filter
  const [sklClass, setSklClass] = useState<string>('');
  const [sklStudent, setSklStudent] = useState<string>('all');
  const [sklPage, setSklPage] = useState<number>(1);
  const [sklNumber, setSklNumber] = useState<string>('');
  const [sklGeneratedNumbers, setSklGeneratedNumbers] = useState<Record<string, string>>({});
  const [sklDate, setSklDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const skkbProfileNo = graduationInfo?.[activeAcademicYear || '']?.noSkkb || '';
  const sklSuffix = graduationInfo?.[activeAcademicYear || '']?.noSkl || '';
  const transcriptProfileNo = graduationInfo?.[activeAcademicYear || '']?.noTranskripNilai || '';
  const rapatPlenoRaw = graduationInfo?.[activeAcademicYear || '']?.tanggalRapatPleno || '';
  const rapatPlenoDate = rapatPlenoRaw ? new Date(rapatPlenoRaw).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '........';

  const getSkkbNumber = (student: Student, inputNum: string, profileNo: string) => {
    if (!inputNum) return '......../......../........';
    const parts = [];
    if (profileNo) parts.push(profileNo);
    parts.push(inputNum);
    if (us1Records.find(r=>r.studentId===student.id)?.us1TranscriptNumber) parts.push(us1Records.find(r=>r.studentId===student.id)?.us1TranscriptNumber as string);
    return parts.join(' / ');
  };

  const getSklNumber = (student: Student, inputNum: string, profileNo: string) => {
    if (!inputNum) return '......../......../........';
    const parts = [];
    if (profileNo) parts.push(profileNo);
    parts.push(inputNum);
    if (us1Records.find(r=>r.studentId===student.id)?.us1TranscriptNumber) parts.push(us1Records.find(r=>r.studentId===student.id)?.us1TranscriptNumber as string);
    return parts.join(' / ');
  };

  const getTranscriptNumber = (student: Student, inputNum: string, profileNo: string) => {
    if (!inputNum) return '......../......../........';
    const parts = [];
    if (profileNo) parts.push(profileNo);
    parts.push(inputNum);
    if (us1Records.find(r=>r.studentId===student.id)?.us1TranscriptNumber) parts.push(us1Records.find(r=>r.studentId===student.id)?.us1TranscriptNumber as string);
    return parts.join(' / ');
  };

  
  const handleGenerateAndPrintSKKB = async () => {
    let targetStudents = allStudents.filter(s => {
      const r = rombels.find(rm => rm.id === skkbClass);
      return r ? isStudentInRombel(s, r) : false;
    });
    if (skkbStudent !== 'all') {
      targetStudents = targetStudents.filter(s => s.id === skkbStudent);
    }
    const studentIds = targetStudents.map(s => s.id);
    const result = await generateLetterNumbersBatch('SKKB', studentIds, schoolProfile);
    setSkkbGeneratedNumbers(result);
    setTimeout(() => window.print(), 500);
  };

  const handleGenerateAndPrintSKL = async () => {
    let targetStudents = allStudents.filter(s => {
      const r = rombels.find(rm => rm.id === sklClass);
      return r ? isStudentInRombel(s, r) : false;
    });
    if (sklStudent !== 'all') {
      targetStudents = targetStudents.filter(s => s.id === sklStudent);
    }
    const studentIds = targetStudents.map(s => s.id);
    const result = await generateLetterNumbersBatch('SKL', studentIds, schoolProfile);
    setSklGeneratedNumbers(result);
    setTimeout(() => window.print(), 500);
  };

  const downloadIjazahTemplate = () => {
    let us1Students = allStudents.filter(s => s.grade === 'XII' || s.grade === '12');
    if (reportUs1Class !== 'semua-xii') {
      const selectedRombel = rombels.find(r => r.id === reportUs1Class);
      if (selectedRombel) {
        us1Students = us1Students.filter(s => isStudentInRombel(s, selectedRombel));
      }
    }
    us1Students.sort((a, b) => a.name.localeCompare(b.name));

    const templateData = us1Students.map((s, index) => ({
      "No": index + 1,
      "NIS": s.nis,
      "Nama Lengkap": s.name,
      "No. Ijazah": us1Records.find(r=>r.studentId===s.id)?.us1DiplomaNumber || "",
      "No. Transkrip": us1Records.find(r=>r.studentId===s.id)?.us1TranscriptNumber || ""
    }));
    
    if (templateData.length === 0) {
      templateData.push({
        "No": 1,
        "NIS": "12345",
        "Nama Lengkap": "Contoh Siswa",
        "No. Ijazah": "DN-001",
        "No. Transkrip": "TR-001"
      });
    }
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Ijazah");
    XLSX.writeFile(wb, "Template_Ijazah_Transkrip.xlsx");
  };

  const handleIjazahUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) return;

        const updates = new Map<string, { ijazah: string, transkrip: string }>();
        
        data.forEach((row: any) => {
          const nis = row['NIS']?.toString().trim();
          const name = row['Nama Lengkap']?.toString().trim();
          const ijazah = row['No. Ijazah']?.toString().trim() || '';
          const transkrip = row['No. Transkrip']?.toString().trim() || '';
          
          if (nis) {
            updates.set(nis.toLowerCase(), { ijazah, transkrip });
          } else if (name) {
            updates.set(name.toLowerCase(), { ijazah, transkrip });
          }
        });

        const updateFn = (s: Student) => {
          const match = updates.get(s.nis?.toLowerCase() || '') || updates.get(s.name?.toLowerCase() || '');
          if (match) {
            return { ...s, us1DiplomaNumber: match.ijazah || s.us1DiplomaNumber, us1TranscriptNumber: match.transkrip || s.us1TranscriptNumber };
          }
          return s;
        };

        setStudents(students.map(updateFn));
        if (alumni && setAlumni) setAlumni(alumni.map(updateFn));
        alert('Berhasil mengimpor data ijazah dan transkrip!');
      } catch (err) {
        console.error("Gagal membaca file Excel:", err);
        alert('Gagal membaca file Excel.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePilihAyahUs1 = () => {
    let filtered = allStudents.filter(s => s.grade === 'XII' || s.grade === '12');
    if (reportUs1Class !== 'semua-xii') {
      const selectedRombel = rombels.find(r => r.id === reportUs1Class);
      if (selectedRombel) {
        filtered = filtered.filter(s => isStudentInRombel(s, selectedRombel));
      }
    }
    
    const filteredIds = new Set(filtered.map(s => s.id));
    
    setStudents(students.map(s => filteredIds.has(s.id) ? { ...s, us1ParentType: 'ayah' } : s));
    if (alumni && setAlumni) {
      setAlumni(alumni.map(s => filteredIds.has(s.id) ? { ...s, us1ParentType: 'ayah' } : s));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Laporan Manajemen Nilai</h1>
          <p className="text-slate-500 text-sm mt-1">Cetak rekapitulasi data ujian dan kelulusan siswa.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto print-hide">
        <button
          onClick={() => setActiveTab('view-grades')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'view-grades' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Nilai Raport
        </button>
        <button
          onClick={() => setActiveTab('report-eligible')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report-eligible' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Eligible (SNBP)
        </button>
        <button
          onClick={() => setActiveTab('report-us1')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report-us1' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Laporan US-1
        </button>
            <button
          onClick={() => setActiveTab('report-psaj')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report-psaj' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Laporan PSAJ
        </button>
            <button
          onClick={() => setActiveTab('report-skkb')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report-skkb' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          SKKB
        </button>
            <button
          onClick={() => setActiveTab('report-skl')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report-skl' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          SKL
        </button>
        <button
          onClick={() => setActiveTab('report-transcript')}
          className={`pb-4 px-4 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report-transcript' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Transkrip Nilai
        </button>
      </div>

      {activeTab === 'view-grades' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              aside, header, nav, footer, button.mobile-menu-btn { display: none !important; }
              .print-hide { display: none !important; }
              body, main, main > div { margin: 0 !important; padding: 0 !important; background: white !important; margin-left: 0 !important; display: block !important; }
              .printable-report { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
              .overflow-x-auto, .overflow-y-auto, .overflow-auto { overflow: visible !important; }
              ::-webkit-scrollbar { display: none !important; }
              @page { size: 330mm 215mm; margin: 10mm; } /* F4 Landscape */
              .page-break { page-break-before: always; display: block; }
            }
          `}</style>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Lihat Nilai Tersimpan</h3>
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200" 
                value={viewClass} 
                onChange={e => setViewClass(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200" 
                value={viewSemester} 
                onChange={e => setViewSemester(e.target.value)}
              >
                <option value="Semua">Semua Semester</option>
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <option key={s} value={s.toString()}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
          
          {(() => {
            if (!viewClass) return <div className="py-8 text-center text-slate-500 font-medium">Pilih kelas terlebih dahulu.</div>;
            
            let targetStudents = allStudents.filter(s => {
              const r = rombels.find(rm => rm.id === viewClass);
              return r ? isStudentInRombel(s, r) : false;
            }).sort((a,b) => a.name.localeCompare(b.name));
            
            if (targetStudents.length === 0) return <div className="py-8 text-center text-slate-500 font-medium">Tidak ada siswa di kelas ini.</div>;
            
            const targetRombel = rombels.find(rm => rm.id === viewClass);
            
            // Collect defined subjects based on the chosen class (major) and semester
            const subjectColumns = new Set<string>();
            
            if (targetRombel) {
                if (viewSemester === 'Semua') {
                    // Collect from all semesters
                    ['1', '2', '3', '4', '5', '6'].forEach(sem => {
                        let targetSem = '1';
                        if (sem === '3' || sem === '4') targetSem = '3';
                        if (sem === '5' || sem === '6') targetSem = '5';
                        
                        let record = classSubjects.find(r => r.rombelId === targetRombel.major && r.semester === targetSem);
                        if (!record && targetSem === '1') {
                            record = classSubjects.find(r => r.rombelId === 'Umum' && r.semester === targetSem);
                        }
                        
                        if (record && record.subjects) {
                            record.subjects.forEach(subj => subjectColumns.add(`${subj} (S${sem})`));
                        }
                    });
                } else {
                    let targetSem = '1';
                    if (viewSemester === '3' || viewSemester === '4') targetSem = '3';
                    if (viewSemester === '5' || viewSemester === '6') targetSem = '5';
                    
                    let record = classSubjects.find(r => r.rombelId === targetRombel.major && r.semester === targetSem);
                    if (!record && targetSem === '1') {
                        record = classSubjects.find(r => r.rombelId === 'Umum' && r.semester === targetSem);
                    }
                    
                    if (record && record.subjects) {
                        record.subjects.forEach(subj => subjectColumns.add(subj));
                    }
                }
            }

            const studentData = targetStudents.map(student => {
              let gradesToConsider = studentGrades.filter(g => g.studentId === student.id);
              if (viewSemester !== 'Semua') {
                gradesToConsider = gradesToConsider.filter(g => g.semester === viewSemester);
              }
              
              const combinedGrades: Record<string, string | number> = {};
              gradesToConsider.forEach(g => {
                if (g.grades) {
                  Object.entries(g.grades).forEach(([subj, score]) => {
                    const colName = viewSemester === 'Semua' ? `${subj} (S${g.semester})` : subj;
                    combinedGrades[colName] = score;
                    if (!subjectColumns.has(colName)) {
                      subjectColumns.add(colName);
                    }
                  });
                }
              });
              
              return {
                student,
                grades: combinedGrades
              };
            });
            
            const subjects = Array.from(subjectColumns);
            
            return (
              <>
                <div className="hidden print:block mb-8">
                  <Letterhead profile={schoolProfile} />
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-black text-center w-12 border-r border-slate-200">No</th>
                      <th className="py-2.5 px-3 font-black border-r border-slate-200">NIS</th>
                      <th className="py-2.5 px-3 font-black border-r border-slate-200 min-w-[150px]">Nama Lengkap</th>
                      {subjects.length > 0 ? subjects.map(subj => (
                        <th key={subj} className="py-2 px-1.5 font-black border-r border-slate-200 text-center align-bottom h-32">
                          <div style={{ writingMode: 'vertical-rl' }} className="mx-auto whitespace-nowrap">{subj}</div>
                        </th>
                      )) : (
                        <th className="py-2.5 px-3 font-black">Nilai</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentData.length === 0 ? (
                      <tr>
                        <td colSpan={subjects.length + 3} className="py-4 text-center text-slate-500">Data nilai tidak tersedia.</td>
                      </tr>
                    ) : studentData.map((data, idx) => (
                      <tr key={data.student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-700 border-r border-slate-200">{data.student.nis}</td>
                        <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">{data.student.name}</td>
                        {subjects.length > 0 ? subjects.map(subj => (
                          <td key={subj} className="py-2 px-3 text-center font-medium border-r border-slate-200">
                            {data.grades[subj] !== undefined ? data.grades[subj] : '-'}
                          </td>
                        )) : (
                          <td className="py-2 px-3 text-center text-slate-400">-</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'report-eligible' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              aside, header, nav, footer, button.mobile-menu-btn { display: none !important; }
              .print-hide { display: none !important; }
              body, main, main > div { margin: 0 !important; padding: 0 !important; background: white !important; margin-left: 0 !important; display: block !important; }
              .printable-report { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
              .overflow-x-auto, .overflow-y-auto, .overflow-auto { overflow: visible !important; }
              ::-webkit-scrollbar { display: none !important; }
              @page { size: 210mm 297mm; margin: 10mm; } /* A4 Portrait */
            }
          `}</style>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Pemeringkatan Siswa Eligible (SNBP)</h3>
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200" 
                value={eligibleMajor} 
                onChange={e => setEligibleMajor(e.target.value)}
              >
                <option value="">-- Pilih Jurusan --</option>
                <option value="eligible-finish">Eligible Finish (Semua Jurusan)</option>
                {Array.from(new Set(rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => r.major).filter(Boolean))).map(m => (
                  <option key={m as string} value={m as string}>{m as string}</option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Cetak PDF
              </button>
            </div>
          </div>
          
          {(() => {
            if (!eligibleMajor) return <div className="py-8 text-center text-slate-500 font-medium">Pilih jurusan terlebih dahulu.</div>;
            
            // 1. Setup variables
            const tiebreakerSubjects = ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Sosiologi', 'Ekonomi', 'Agama', 'Pendidikan Agama'];
            let allStudentsRanked: any[] = [];
            let eligibleStudentsFinish: any[] = [];
            let eligibleSubjectsGlobal: string[] = [];
            
            const allMajorsList = Array.from(new Set(rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => r.major).filter(Boolean)));

            // 2. Calculate for each major
            allMajorsList.forEach(major => {
              let majorStudents = allStudents.filter(s => {
                if (s.grade !== 'XII' && s.grade !== '12') return false;
                const r = rombels.find(rm => rm.id === s.class || rm.name === s.class || rm.name.includes(s.class) || s.class.includes(rm.name));
                return r?.major === major;
              });
              
              if (majorStudents.length === 0) return;
              
              const record = classSubjects.find(r => r.id === `${major}_5`) || classSubjects.find(r => r.id === `Umum_5`);
              const eligibleSubjects = record?.eligibleSubjects || [];
              
              if (eligibleSubjects.length === 0) return;

              const studentScores = majorStudents.map(student => {
                const grades = studentGrades.filter(g => g.studentId === student.id && ['1','2','3','4','5'].includes(g.semester));
                let totalScore = 0;
                let tiebreakerScore = 0;
                
                grades.forEach(g => {
                  if (g.grades) {
                    eligibleSubjects.forEach(subj => {
                      const score = parseFloat(g.grades[subj] as any);
                      if (!isNaN(score)) totalScore += score;
                    });
                    Object.keys(g.grades).forEach(subj => {
                      if (tiebreakerSubjects.some(t => subj.toLowerCase().includes(t.toLowerCase()))) {
                        const score = parseFloat(g.grades[subj] as any);
                        if (!isNaN(score)) tiebreakerScore += score;
                      }
                    });
                  }
                });
                
                return { student, totalScore, tiebreakerScore, major };
              });

              studentScores.sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                return b.tiebreakerScore - a.tiebreakerScore;
              });

              allStudentsRanked.push(...studentScores);

              const quota = Math.ceil(studentScores.length * 0.4);
              eligibleStudentsFinish.push(...studentScores.slice(0, quota));
            });
            
            if (allStudentsRanked.length === 0) {
              return <div className="py-8 text-center text-slate-500 font-medium">Data eligible belum tersedia atau mata pelajaran belum dikonfigurasi.</div>;
            }

            // 3. Global sort
            allStudentsRanked.sort((a, b) => {
              if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
              return b.tiebreakerScore - a.tiebreakerScore;
            });
            
            allStudentsRanked = allStudentsRanked.map((s, i) => ({ ...s, globalRank: i + 1 }));

            eligibleStudentsFinish = eligibleStudentsFinish.map(s => {
              const matched = allStudentsRanked.find(globalS => globalS.student.id === s.student.id);
              return { ...s, globalRank: matched ? matched.globalRank : 0 };
            });

            eligibleStudentsFinish.sort((a, b) => {
              if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
              return b.tiebreakerScore - a.tiebreakerScore;
            });

            let displayedStudents: any[] = [];
            let displayQuota = '';
            
            if (eligibleMajor === 'eligible-finish') {
              displayedStudents = eligibleStudentsFinish;
              displayQuota = `${displayedStudents.length} SISWA TOTAL DARI SEMUA JURUSAN`;
            } else {
              displayedStudents = allStudentsRanked.filter(s => s.major === eligibleMajor);
              displayedStudents.sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                return b.tiebreakerScore - a.tiebreakerScore;
              });
              displayQuota = `SEMUA SISWA (${displayedStudents.length} SISWA)`;
              
              const record = classSubjects.find(r => r.id === `${eligibleMajor}_5`) || classSubjects.find(r => r.id === `Umum_5`);
              eligibleSubjectsGlobal = record?.eligibleSubjects || [];
            }

            const displayTitle = eligibleMajor === 'eligible-finish' ? 'SEMUA JURUSAN (ELIGIBLE FINISH)' : `JURUSAN ${eligibleMajor.toUpperCase()}`;
            const displaySubjects = eligibleMajor === 'eligible-finish' ? 'Sesuai konfigurasi masing-masing jurusan' : eligibleSubjectsGlobal.join(', ');

            return (
              <>
                <div className="block mb-8">
                  <Letterhead profile={schoolProfile} />
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-black text-slate-800">DAFTAR SISWA ELIGIBLE SNBP</h2>
                  <p className="text-sm font-bold text-slate-600">{displayTitle} - {displayQuota}</p>
                  <p className="text-xs text-slate-500">Mata Pelajaran: {displaySubjects}</p>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        {eligibleMajor !== 'eligible-finish' ? (
                          <>
                            <th className="py-2.5 px-3 font-black text-center w-12 border-r border-slate-200">Peringkat Jurusan</th>
                            <th className="py-2.5 px-3 font-black text-center w-12 border-r border-slate-200">Peringkat Keseluruhan</th>
                          </>
                        ) : (
                          <th className="py-2.5 px-3 font-black text-center w-12 border-r border-slate-200">Peringkat</th>
                        )}
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">NIS/NISN</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">Nama Lengkap</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200 text-center">Kelas</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200 text-center">Total Nilai Eligible</th>
                        <th className="py-2.5 px-3 font-black text-center">Skor Penentu (Tiebreaker)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={eligibleMajor !== 'eligible-finish' ? 7 : 6} className="py-4 text-center text-slate-500">Tidak ada data untuk ditampilkan.</td>
                        </tr>
                      ) : displayedStudents.map((data, idx) => {
                        const studentRombel = rombels.find(r => (r.grade === 'XII' || r.grade === '12') && (r.id === data.student.class || r.name === data.student.class || r.name.includes(data.student.class) || data.student.class.includes(r.name)))?.name || data.student.class || '-';
                        return (
                          <tr key={data.student.id} className="hover:bg-slate-50/50 transition-colors">
                            {eligibleMajor !== 'eligible-finish' ? (
                              <>
                                <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                                <td className="py-2 px-3 text-center font-bold text-rose-500 border-r border-slate-200">{data.globalRank}</td>
                              </>
                            ) : (
                              <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{data.globalRank}</td>
                            )}
                            <td className="py-2 px-3 font-medium text-slate-700 border-r border-slate-200">
                              {data.student.nis}<br/><span className="text-[9px] text-slate-400">{data.student.nisn || '-'}</span>
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">{data.student.name}</td>
                            <td className="py-2 px-3 font-medium text-slate-600 text-center border-r border-slate-200 whitespace-nowrap">{studentRombel}</td>
                            <td className="py-2 px-3 text-center font-bold text-indigo-600 border-r border-slate-200">{data.totalScore.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center text-slate-500">{data.tiebreakerScore.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'report-us1' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              /* Sembunyikan elemen sidebar, header, footer dll di luar laporan */
              aside, header, nav, footer, button.mobile-menu-btn { display: none !important; }
              
              /* Sembunyikan elemen internal yang diberi class print-hide */
              .print-hide { display: none !important; }
              
              /* Reset margin dan padding untuk area utama agar full page dan matikan flexbox yang merusak page-break */
              body, main, main > div { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: white !important;
                margin-left: 0 !important; /* Menimpa lg:ml-64 dari main container */
                display: block !important; /* Wajib untuk mengaktifkan page-break */
              }
              
              /* Menghilangkan kotak putih pembatas laporan agar alur halaman alami */
              .printable-report { 
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
              }
              
              /* Paksa hilangkan scrollbar dan biarkan isi meluber secara alami */
              .overflow-x-auto, .overflow-y-auto, .overflow-auto {
                overflow: visible !important;
              }
              ::-webkit-scrollbar {
                display: none !important;
              }
              
              @page { size: 330mm 215mm; margin: 10mm; } /* F4 Landscape */
              .page-break { page-break-before: always; display: block; }
            }
          `}</style>
          
          <div className="flex justify-between items-center print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Rekap Data Peserta Ujian (US-1)</h3>
              <p className="text-xs text-slate-500">Merekap data spesifik US-1 untuk siswa tingkat XII.</p>
            </div>
            <div className="flex gap-2">
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
                value={reportUs1Class}
                onChange={e => { setReportUs1Class(e.target.value); setUs1Page(1); }}
              >
                <option value="semua-xii">Semua Kelas XII</option>
                {rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
                value={us1Sort}
                onChange={e => { setUs1Sort(e.target.value as any); setUs1Page(1); }}
              >
                <option value="abjad">Urut Abjad</option>
                <option value="kelas-abjad">Urut Kelas & Abjad</option>
              </select>
              <button
                onClick={downloadIjazahTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm"
                title="Download Template Excel"
              >
                Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm"
                title="Import Excel"
              >
                Import
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleIjazahUpload} />
              <button
                onClick={handlePilihAyahUs1}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                title="Pilih Ayah untuk semua siswa yang tampil"
              >
                Pilih Ayah
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Cetak PDF
              </button>
            </div>
          </div>

          {(() => {
            let us1Students = allStudents.filter(s => {
              const r = rombels.find(rm => (rm.grade === 'XII' || rm.grade === '12') && (rm.id === s.class || rm.name === s.class || rm.name.includes(s.class) || s.class.includes(rm.name)));
              return s.grade === 'XII' || s.grade === '12';
            });
            
            if (reportUs1Class !== 'semua-xii') {
              const selectedRombel = rombels.find(r => r.id === reportUs1Class);
              if (selectedRombel) {
                us1Students = us1Students.filter(s => isStudentInRombel(s, selectedRombel));
              }
            }
            
            if (us1Sort === 'kelas-abjad') {
              us1Students.sort((a, b) => {
                const rombelA = rombels.find(rm => (rm.grade === 'XII' || rm.grade === '12') && (rm.id === a.class || rm.name === a.class || rm.name.includes(a.class) || a.class.includes(rm.name)));
                const rombelB = rombels.find(rm => (rm.grade === 'XII' || rm.grade === '12') && (rm.id === b.class || rm.name === b.class || rm.name.includes(b.class) || b.class.includes(rm.name)));
                
                const getDigits = (str: string) => {
                  const match = str.match(/\d{1,2}$/);
                  return match ? parseInt(match[0], 10) : 9999;
                };

                const classA = rombelA ? rombelA.name : (a.class || '');
                const classB = rombelB ? rombelB.name : (b.class || '');

                const numA = getDigits(classA);
                const numB = getDigits(classB);

                if (numA !== numB) return numA - numB;

                const indexA = rombelA ? rombels.indexOf(rombelA) : 9999;
                const indexB = rombelB ? rombels.indexOf(rombelB) : 9999;
                
                if (indexA !== indexB) return indexA - indexB;
                return a.name.localeCompare(b.name);
              });
            } else {
              us1Students.sort((a, b) => a.name.localeCompare(b.name));
            }

            if (us1Students.length === 0) {
              return (
                <div className="py-8 text-center text-slate-500 font-medium">
                  Belum ada data siswa Kelas XII.
                </div>
              );
            }

            const chunks = [];
            if (us1Students.length > 0) {
              chunks.push(us1Students.slice(0, 8));
              let remaining = us1Students.slice(8);
              while (remaining.length > 0) {
                chunks.push(remaining.slice(0, 12));
                remaining = remaining.slice(12);
              }
            }

            return (
              <>
                {chunks.map((chunk, chunkIdx) => {
                  const isCurrentPage = (chunkIdx + 1) === us1Page;
                  return (
                    <div key={chunkIdx} className={`${chunkIdx > 0 ? "page-break mt-12" : ""} ${isCurrentPage ? 'block' : 'hidden print:block'}`}>
                      {chunkIdx === 0 && (
                        <>
                          <div className="block mb-8">
                            <Letterhead profile={schoolProfile} />
                          </div>

                          <div className="text-center mb-6">
                            <h2 className="text-lg font-black text-slate-800">REKAPITULASI PESERTA UJIAN (US-1)</h2>
                            <p className="text-sm font-bold text-slate-600">
                              {reportUs1Class === 'semua-xii' ? `TAHUN PELAJARAN ${schoolProfile.activeAcademicYear || '-'}` : `KELAS: ${rombels.find(r => r.id === reportUs1Class)?.name || '-'}`}
                            </p>
                          </div>
                        </>
                      )}

                <div className="overflow-x-auto print:overflow-visible rounded-xl border border-slate-200">
                  <table className="w-full text-[10px] sm:text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3 font-black text-center w-12 border-r border-slate-200">No</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">NIS/NISN</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">Nama Lengkap</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200 text-center">L/P</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200 text-center">Kelas</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">Tempat, Tgl Lahir</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">Nama Orang Tua</th>
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">No. Ijazah & Transkrip</th>
                        <th className="py-2.5 px-3 font-black">Mapel Pilihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chunk.map((student, innerIdx) => {
                        const globalIdx = chunkIdx === 0 ? innerIdx + 1 : (8 + (chunkIdx - 1) * 12 + innerIdx + 1);
                        const studentRombelData = rombels.find(r => (r.grade === 'XII' || r.grade === '12') && (r.id === student.class || r.name === student.class || r.name.includes(student.class) || student.class.includes(r.name)));
                        const studentRombel = studentRombelData?.name || student.class || '-';
                        const studentMajor = studentRombelData?.major || '';
                        const ttl = `${student.birthPlace || '-'}, ${student.birthDate || '-'}`;
                        const genderStr = student.gender === 'Laki-laki' || student.gender === 'L' ? 'L' : (student.gender === 'Perempuan' || student.gender === 'P' ? 'P' : '-');
                        
                        
                        const us1Rec = us1Records.find(r => r.studentId === student.id);
                        
                        const handleUpdateUs1 = (field: keyof US1Record, value: string) => {
                          let newRecords = [...us1Records];
                          const idx = newRecords.findIndex(r => r.studentId === student.id);
                          if (idx >= 0) {
                            newRecords[idx] = { ...newRecords[idx], [field]: value, updated_at: new Date().toISOString() };
                          } else {
                            newRecords.push({
                              id: `${student.id}_${activeAcademicYear?.replace(/\//g, '-')}_${activeSemester}`,
                              studentId: student.id,
                              [field]: value,
                              tahun_pelajaran: activeAcademicYear,
                              semester: activeSemester,
                              updated_at: new Date().toISOString()
                            });
                          }
                          setUs1Records(newRecords);
                          import('../syncService').then(m => m.syncTableToCloud('star_us1_records', newRecords));
                        };

                        const handleUpdateStudent = (field: string, value: string) => {
                          if (alumni && alumni.find(a => a.id === student.id)) {
                            if (setAlumni) setAlumni(alumni.map(a => a.id === student.id ? { ...a, [field]: value } : a));
                          } else {
                            setStudents(students.map(s => s.id === student.id ? { ...s, [field]: value } : s));
                          }
                        };

                        const parentDisplay = (() => {
                          if (us1Rec?.us1ParentType === 'ayah') return `Ayah: ${student.fatherName || '-'}`;
                          if (us1Rec?.us1ParentType === 'ibu') return `Ibu: ${student.motherName || '-'}`;
                          if (us1Rec?.us1ParentType === 'wali') return `Wali: ${student.guardianName || '-'}`;
                          return '-';
                        })();

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{globalIdx}</td>
                            <td className="py-2 px-3 font-medium text-slate-700 border-r border-slate-200">
                              {student.nis}<br/><span className="text-[9px] text-slate-400">{student.nisn || '-'}</span>
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">{student.name}</td>
                            <td className="py-2 px-3 font-medium text-slate-600 text-center border-r border-slate-200">{genderStr}</td>
                            <td className="py-2 px-3 font-medium text-slate-600 text-center border-r border-slate-200 whitespace-nowrap">{studentRombel}</td>
                            <td className="py-2 px-3 font-medium text-slate-600 border-r border-slate-200 max-w-[120px] truncate" title={ttl}>{ttl}</td>
                            <td className="py-2 px-3 border-r border-slate-200 min-w-[120px]">
                              <div className="flex flex-col gap-1 print:hidden">
                                <select 
                                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] outline-none focus:border-sky-300"
                                  value={us1Rec?.us1ParentType || ''}
                                  onChange={e => handleUpdateUs1('us1ParentType', e.target.value)}
                                >
                                  <option value="">-- Pilih --</option>
                                  <option value="ayah">Ayah</option>
                                  <option value="ibu">Ibu</option>
                                  <option value="wali">Wali</option>
                                </select>
                                <span className="text-[9px] text-slate-500 truncate" title={parentDisplay}>{parentDisplay}</span>
                              </div>
                              <span className="hidden print:inline font-medium text-slate-700">{parentDisplay}</span>
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 min-w-[140px]">
                              <div className="flex flex-col gap-1.5 print:hidden">
                                <input 
                                  type="text" 
                                  placeholder="No. Ijazah" 
                                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] outline-none focus:border-sky-300"
                                  value={us1Rec?.us1DiplomaNumber || ''}
                                  onChange={e => handleUpdateUs1('us1DiplomaNumber', e.target.value)}
                                />
                                <input 
                                  type="text" 
                                  placeholder="No. Transkrip" 
                                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] outline-none focus:border-sky-300"
                                  value={us1Rec?.us1TranscriptNumber || ''}
                                  onChange={e => handleUpdateUs1('us1TranscriptNumber', e.target.value)}
                                />
                              </div>
                              <div className="hidden print:flex flex-col gap-0.5 font-medium text-slate-700 text-[10px]">
                                <span>Ijazah: {us1Rec?.us1DiplomaNumber || '-'}</span>
                                <span>Transkrip: {us1Rec?.us1TranscriptNumber || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 min-w-[120px]">
                              <div className="print:hidden">
                                <input 
                                  list={`elective-options-${studentMajor}`}
                                  type="text" 
                                  placeholder="Pilih/Ketik Mapel..." 
                                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] outline-none focus:border-sky-300"
                                  value={us1Rec?.us1ElectiveSubject || (gradesConfig?.find(g => g.name === 'XII' || g.name === '12')?.electivesByMajor?.[studentMajor]?.join(', ') || '')}
                                  onChange={e => handleUpdateUs1('us1ElectiveSubject', e.target.value)}
                                />
                                <datalist id={`elective-options-${studentMajor}`}>
                                  {gradesConfig?.find(g => g.name === 'XII' || g.name === '12')?.electivesByMajor?.[studentMajor]?.map(s => (
                                    <option key={s} value={s} />
                                  ))}
                                </datalist>
                              </div>
                              <span className="hidden print:inline font-medium text-slate-700 text-[10px]">{us1Rec?.us1ElectiveSubject || (gradesConfig?.find(g => g.name === 'XII' || g.name === '12')?.electivesByMajor?.[studentMajor]?.join(', ') || '-')}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          
          {chunks.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0 print-hide">
              <p className="text-xs text-slate-500 font-medium">Halaman {us1Page} dari {chunks.length}</p>
              <div className="flex gap-1">
                <button 
                  onClick={() => setUs1Page(p => Math.max(p - 1, 1))} 
                  disabled={us1Page === 1} 
                  className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button 
                  onClick={() => setUs1Page(p => Math.min(p + 1, chunks.length))} 
                  disabled={us1Page === chunks.length} 
                  className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}
          </>
          );
          })()}
        </div>
      )}

      {activeTab === 'report-psaj' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              aside, header, nav, footer, button.mobile-menu-btn { display: none !important; }
              .print-hide { display: none !important; }
              body, main, main > div { margin: 0 !important; padding: 0 !important; background: white !important; margin-left: 0 !important; display: block !important; }
              .printable-report { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
              .overflow-x-auto, .overflow-y-auto, .overflow-auto { overflow: visible !important; }
              ::-webkit-scrollbar { display: none !important; }
              @page { size: 330mm 215mm; margin: 10mm; } /* F4 Landscape */
              .page-break { page-break-before: always; display: block; }
            }
          `}</style>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Laporan Nilai PSAJ</h3>
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-200" 
                value={psajClass} 
                onChange={e => setPsajClass(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {(() => {
            if (!psajClass) return <div className="py-8 text-center text-slate-500 font-medium">Pilih kelas terlebih dahulu.</div>;
            
            let targetStudents = allStudents.filter(s => {
              const r = rombels.find(rm => rm.id === psajClass);
              return r ? isStudentInRombel(s, r) : false;
            }).sort((a,b) => a.name.localeCompare(b.name));
            
            if (targetStudents.length === 0) return <div className="py-8 text-center text-slate-500 font-medium">Tidak ada siswa di kelas ini.</div>;
            
            const targetRombel = rombels.find(rm => rm.id === psajClass);
            
            // Collect unique subjects for PSAJ
            const subjectColumns = new Set<string>();
            let useConfiguredSubjectsOnly = false;
            
            if (targetRombel) {
                let record = classSubjects.find(r => r.id === `${targetRombel.major}_5`);
                if (!record) {
                    record = classSubjects.find(r => r.id === `Umum_5`);
                }
                
                if (record && record.subjects && record.subjects.length > 0) {
                    record.subjects.forEach(subj => subjectColumns.add(subj));
                    useConfiguredSubjectsOnly = true;
                }
            }

            const studentData = targetStudents.map(student => {
              const gradesToConsider = studentGrades.filter(g => g.studentId === student.id && g.semester === 'PSAJ');
              
              const combinedGrades: Record<string, string | number> = {};
              gradesToConsider.forEach(g => {
                if (g.grades) {
                  Object.entries(g.grades).forEach(([subj, score]) => {
                    if (useConfiguredSubjectsOnly) {
                      if (subjectColumns.has(subj)) {
                        combinedGrades[subj] = score;
                      }
                    } else {
                      combinedGrades[subj] = score;
                      if (!subjectColumns.has(subj)) {
                        subjectColumns.add(subj);
                      }
                    }
                  });
                }
              });
              
              return {
                student,
                grades: combinedGrades
              };
            });
            
            const subjects = Array.from(subjectColumns);
            
            return (
              <>
                <div className="hidden print:block mb-8">
                  <Letterhead profile={schoolProfile} />
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-black text-center w-12 border-r border-slate-200">No</th>
                      <th className="py-2.5 px-3 font-black border-r border-slate-200">NIS</th>
                      <th className="py-2.5 px-3 font-black border-r border-slate-200 min-w-[150px]">Nama Lengkap</th>
                      {subjects.length > 0 ? subjects.map(subj => (
                        <th key={subj} className="py-2 px-1.5 font-black border-r border-slate-200 text-center align-bottom h-32">
                          <div style={{ writingMode: 'vertical-rl' }} className="mx-auto whitespace-nowrap">{subj}</div>
                        </th>
                      )) : (
                        <th className="py-2.5 px-3 font-black border-r border-slate-200">Nilai</th>
                      )}
                      <th className="py-2 px-1.5 font-black border-r border-slate-200 text-center align-bottom h-32">
                        <div style={{ writingMode: 'vertical-rl' }} className="mx-auto whitespace-nowrap">Jumlah</div>
                      </th>
                      <th className="py-2 px-1.5 font-black text-center align-bottom h-32">
                        <div style={{ writingMode: 'vertical-rl' }} className="mx-auto whitespace-nowrap">Rata-rata</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentData.length === 0 ? (
                      <tr>
                        <td colSpan={subjects.length + 5} className="py-4 text-center text-slate-500">Data nilai PSAJ tidak tersedia.</td>
                      </tr>
                    ) : studentData.map((data, idx) => {
                      let total = 0;
                      let count = 0;
                      subjects.forEach(subj => {
                        const val = Number(data.grades[subj]);
                        if (!isNaN(val)) {
                          total += val;
                          count++;
                        }
                      });
                      const avg = count > 0 ? (total / count).toFixed(1) : '-';
                      
                      return (
                        <tr key={data.student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-700 border-r border-slate-200">{data.student.nis}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">{data.student.name}</td>
                          {subjects.length > 0 ? subjects.map(subj => (
                            <td key={subj} className="py-2 px-3 text-center font-medium border-r border-slate-200">
                              {data.grades[subj] !== undefined ? data.grades[subj] : '-'}
                            </td>
                          )) : (
                            <td className="py-2 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                          )}
                          <td className="py-2 px-3 text-center font-bold text-blue-600 border-r border-slate-200">{count > 0 ? total : '-'}</td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-600">{avg}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'report-skkb' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              aside, header, nav, footer, button.mobile-menu-btn { display: none !important; }
              .print-hide { display: none !important; }
              body, main, main > div { margin: 0 !important; padding: 0 !important; background: white !important; margin-left: 0 !important; display: block !important; }
              .printable-report { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
              @page { size: 215mm 330mm; margin: 10mm; } /* F4 Portrait */
              .page-break { page-break-before: always; display: block; }
            }
          `}</style>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Surat Keterangan Kelakuan Baik (SKKB)</h3>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input 
                type="text"
                placeholder="Nomor Surat (opsional)"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 max-w-[150px] outline-none focus:ring-2 focus:ring-amber-200"
                value={skkbNumber}
                onChange={e => setSkkbNumber(e.target.value)}
              />
              <input 
                type="date"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 max-w-[130px] outline-none focus:ring-2 focus:ring-amber-200"
                value={skkbDate}
                onChange={e => setSkkbDate(e.target.value)}
              />
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-200" 
                value={skkbClass} 
                onChange={e => {setSkkbClass(e.target.value); setSkkbStudent('all'); setSkkbPage(1);}}
              >
                <option value="">-- Pilih Kelas --</option>
                {rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 max-w-[200px] outline-none focus:ring-2 focus:ring-amber-200" 
                value={skkbStudent} 
                onChange={e => {setSkkbStudent(e.target.value); setSkkbPage(1);}} 
                disabled={!skkbClass}
              >
                <option value="all">Semua Siswa di Kelas Ini</option>
                {allStudents
                  .filter(s => {
                    const r = rombels.find(rm => rm.id === skkbClass);
                    return r ? isStudentInRombel(s, r) : false;
                  })
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                }
              </select>
              <button 
                onClick={handleGenerateAndPrintSKKB} 
                className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl disabled:opacity-50" 
                disabled={!skkbClass}
              >
                Cetak SKKB
              </button>
            </div>
          </div>

          {(() => {
            if (!skkbClass) return <div className="py-8 text-center text-slate-500 font-medium print-hide">Pilih kelas terlebih dahulu.</div>;
             
            let targetStudents = allStudents.filter(s => {
              const r = rombels.find(rm => rm.id === skkbClass);
              return r ? isStudentInRombel(s, r) : false;
            }).sort((a,b) => a.name.localeCompare(b.name));
            
            if (skkbStudent !== 'all') {
              targetStudents = targetStudents.filter(s => s.id === skkbStudent);
            }
            
            if (targetStudents.length === 0) return <div className="py-8 text-center text-slate-500 font-medium print-hide">Tidak ada siswa.</div>;

            const selectedRombel = rombels.find(r => r.id === skkbClass);
            const printDateStr = new Date(skkbDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

            return (
              <>
                {targetStudents.map((student, idx) => {
                  const isCurrentPage = (idx + 1) === skkbPage;
                  
                  return (
                    <div key={student.id} className={`${idx > 0 ? "page-break mt-12" : ""} ${isCurrentPage ? 'block' : 'hidden print:block'}`}>
                      <div className="block mb-8">
                        <Letterhead profile={schoolProfile} />
                      </div>
                      
                      <div className="text-center mb-10 mt-8">
                        <h2 className="text-xl font-bold text-black underline tracking-wider">SURAT KETERANGAN KELAKUAN BAIK</h2>
                        <p className="text-sm font-medium mt-1">Nomor: {skkbGeneratedNumbers[student.id] || getSkkbNumber(student, skkbNumber, skkbProfileNo)}</p>
                      </div>
                      
                      <div className="px-4 md:px-16 text-base leading-relaxed text-justify space-y-6 text-black">
                        <p>
                          Yang bertanda tangan di bawah ini Kepala <strong>{schoolProfile.name}</strong> {schoolProfile.city ? `Kota/Kabupaten ${schoolProfile.city}` : ''}, menerangkan dengan sesungguhnya bahwa:
                        </p>
                        
                        <div className="pl-4 md:pl-10 space-y-3 font-medium">
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Nama Lengkap</div>
                            <div>: {student.name}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Tempat, Tanggal Lahir</div>
                            <div>: {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Nomor Induk Siswa (NIS)</div>
                            <div>: {student.nis || '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>NISN</div>
                            <div>: {student.nisn || '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Kelas / Matpel Pilihan</div>
                            <div>: {(() => {
                              if (!selectedRombel) return student.class;
                              const config = gradesConfig?.find(g => g.name === selectedRombel.grade);
                              const electives = config?.electivesByMajor?.[selectedRombel.major] || [];
                              const mapelText = electives.length > 0 ? electives.join(', ') : selectedRombel.major;
                              return `${selectedRombel.name} / ${mapelText}`;
                            })()}</div>
                          </div>
                        </div>
                        
                        <p className="indent-8 text-justify mt-8">
                          Adalah benar siswa dari sekolah kami dan selama menjadi siswa di <strong>{schoolProfile.name}</strong> berkelakuan baik dan tidak pernah tersangkut tindak kriminal, penyalahgunaan narkoba, maupun pelanggaran tata tertib sekolah tingkat berat lainnya.
                        </p>
                        
                        <p className="indent-8 text-justify">
                          Demikian Surat Keterangan Kelakuan Baik ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana mestinya.
                        </p>
                        
                        <div className="flex justify-end mt-24 text-base">
                          <div className="w-64 text-center">
                            <p className="mb-1">{schoolProfile.city || 'Kota'}, {printDateStr}</p>
                            <p className="mb-24">Kepala Sekolah,</p>
                            <p className="font-bold underline">{schoolProfile.principalName || '________________________'}</p>
                            <p>NIP. {schoolProfile.principalNip || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {targetStudents.length > 1 && skkbStudent === 'all' && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0 print-hide">
                    <p className="text-xs text-slate-500 font-medium">Halaman {skkbPage} dari {targetStudents.length}</p>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSkkbPage(p => Math.max(p - 1, 1))} 
                        disabled={skkbPage === 1} 
                        className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path></svg>
                      </button>
                      <button 
                        onClick={() => setSkkbPage(p => Math.min(p + 1, targetStudents.length))} 
                        disabled={skkbPage === targetStudents.length} 
                        className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'report-skl' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              aside, header, nav, footer, button.mobile-menu-btn { display: none !important; }
              .print-hide { display: none !important; }
              body, main, main > div { margin: 0 !important; padding: 0 !important; background: white !important; margin-left: 0 !important; display: block !important; }
              .printable-report { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
              @page { size: 215mm 330mm; margin: 10mm; } /* F4 Portrait */
              .page-break { page-break-before: always; display: block; }
            }
          `}</style>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Surat Keterangan Lulus (SKL)</h3>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input 
                type="text"
                placeholder="Nomor Surat (opsional)"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 max-w-[150px] outline-none focus:ring-2 focus:ring-teal-200"
                value={sklNumber}
                onChange={e => setSklNumber(e.target.value)}
              />

              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-200" 
                value={sklClass} 
                onChange={e => {setSklClass(e.target.value); setSklStudent('all'); setSklPage(1);}}
              >
                <option value="">-- Pilih Kelas --</option>
                {rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 max-w-[200px] outline-none focus:ring-2 focus:ring-teal-200" 
                value={sklStudent} 
                onChange={e => {setSklStudent(e.target.value); setSklPage(1);}} 
                disabled={!sklClass}
              >
                <option value="all">Semua Siswa di Kelas Ini</option>
                {allStudents
                  .filter(s => {
                    const r = rombels.find(rm => rm.id === sklClass);
                    return r ? isStudentInRombel(s, r) : false;
                  })
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                }
              </select>
              <button 
                onClick={handleGenerateAndPrintSKL} 
                className="flex items-center justify-center gap-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50" 
                disabled={!sklClass}
              >
                Cetak SKL
              </button>
            </div>
          </div>

          {(() => {
            if (!sklClass) return <div className="py-8 text-center text-slate-500 font-medium print-hide">Pilih kelas terlebih dahulu.</div>;
             
            let targetStudents = allStudents.filter(s => {
              const r = rombels.find(rm => rm.id === sklClass);
              return r ? isStudentInRombel(s, r) : false;
            }).sort((a,b) => a.name.localeCompare(b.name));
            
            if (sklStudent !== 'all') {
              targetStudents = targetStudents.filter(s => s.id === sklStudent);
            }
            
            if (targetStudents.length === 0) return <div className="py-8 text-center text-slate-500 font-medium print-hide">Tidak ada siswa.</div>;

            const selectedRombel = rombels.find(r => r.id === sklClass);
            const printDateStr = rapatPlenoDate;

            return (
              <>
                {targetStudents.map((student, idx) => {
                  const isCurrentPage = (idx + 1) === sklPage;
                  
                  return (
                    <div key={student.id} className={`${idx > 0 ? "page-break mt-12" : ""} ${isCurrentPage ? 'block' : 'hidden print:block'}`}>
                      <div className="block mb-8">
                        <Letterhead profile={schoolProfile} />
                      </div>
                      
                      <div className="text-center mb-10 mt-8">
                        <h2 className="text-xl font-bold text-black underline tracking-wider">SURAT KETERANGAN LULUS</h2>
                        <p className="text-sm font-medium mt-1">Nomor: {sklGeneratedNumbers[student.id] || getSklNumber(student, sklNumber, sklSuffix)}</p>
                      </div>
                      
                      <div className="px-4 md:px-16 text-base leading-relaxed text-justify space-y-6 text-black">
                        <div>
                          <p>
                            Kepala {schoolProfile.name} {schoolProfile.city} Tahun Pelajaran {activeAcademicYear || ''} dengan berdasarkan:
                          </p>
                          <ol className="list-decimal pl-5 mt-2 mb-2 space-y-1">
                            <li>Penyelesaian Seluruh Program Pembelajaran pada Kurikulum Merdeka;</li>
                            <li>Kriteria kelulusan dari satuan pendidikan sesuai dengan Peraturan Perundang-undangan;</li>
                            <li>Rapat Pleno Dewan Guru tentang Kelulusan pada tanggal {rapatPlenoDate}</li>
                          </ol>
                          <p>Menerangkan bahwa :</p>
                        </div>
                        
                        <div className="pl-4 md:pl-10 space-y-3 font-medium">
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Nama Lengkap</div>
                            <div>: {student.name}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Tempat, Tanggal Lahir</div>
                            <div>: {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Nama Orang Tua</div>
                            <div>: {student.parentName || '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Nomor Induk Siswa (NIS)</div>
                            <div>: {student.nis || '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>NISN</div>
                            <div>: {student.nisn || '-'}</div>
                          </div>
                          <div className="grid grid-cols-[200px_auto] gap-4">
                            <div>Kelas / Matpel Pilihan</div>
                            <div>: {(() => {
                              if (!selectedRombel) return student.class;
                              const config = gradesConfig?.find(g => g.name === selectedRombel.grade);
                              const electives = config?.electivesByMajor?.[selectedRombel.major] || [];
                              const mapelText = electives.length > 0 ? electives.join(', ') : selectedRombel.major;
                              return `${selectedRombel.name} / ${mapelText}`;
                            })()}</div>
                          </div>
                        </div>
                        
                        <p className="indent-8 text-justify mt-8">
                          Berdasarkan hasil Keputusan Rapat Pleno Dewan Guru <strong>{schoolProfile.name}</strong> tentang Penentuan Kelulusan Peserta Didik Tahun Pelajaran {new Date().getFullYear() - 1}/{new Date().getFullYear()}, bahwa siswa tersebut di atas dinyatakan:
                        </p>

                        <div className="text-center py-6">
                          <span className="text-2xl font-black tracking-widest border-4 border-black px-8 py-3 rounded-md">L U L U S</span>
                        </div>
                        
                        <p className="indent-8 text-justify">
                          Demikian Surat Keterangan Lulus ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana mestinya, dan berlaku sampai dengan diterbitkannya Ijazah asli.
                        </p>
                        
                        <div className="flex justify-end mt-16 text-base">
                          <div className="w-64 text-center">
                            <p className="mb-1">{schoolProfile.city || 'Kota'}, {printDateStr}</p>
                            <p className="mb-24">Kepala Sekolah,</p>
                            <p className="font-bold underline">{schoolProfile.principalName || '________________________'}</p>
                            <p>NIP. {schoolProfile.principalNip || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {targetStudents.length > 1 && sklStudent === 'all' && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0 print-hide">
                    <p className="text-xs text-slate-500 font-medium">Halaman {sklPage} dari {targetStudents.length}</p>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSklPage(p => Math.max(p - 1, 1))} 
                        disabled={sklPage === 1} 
                        className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path></svg>
                      </button>
                      <button 
                        onClick={() => setSklPage(p => Math.min(p + 1, targetStudents.length))} 
                        disabled={sklPage === targetStudents.length} 
                        className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'report-transcript' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 printable-report">
          <style>{`
            @media print {
              aside, header, nav, button.mobile-menu-btn { display: none !important; }
              .print-hide { display: none !important; }
              body, main, main > div { margin: 0 !important; padding: 0 !important; background: white !important; margin-left: 0 !important; display: block !important; }
              .printable-report { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
              @page { size: 215mm 330mm; margin: 10mm; } /* F4 Portrait */
              .page-break { page-break-before: always; display: block; }
            }
          `}</style>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Transkrip Nilai (Semester 1 - 6)</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-200" 
                value={transcriptClass} 
                onChange={e => {setTranscriptClass(e.target.value); setTranscriptStudent('all'); setTranscriptPage(1);}}
              >
                <option value="">-- Pilih Kelas --</option>
                {rombels.filter(r => r.grade === 'XII' || r.grade === '12').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 max-w-[200px] outline-none focus:ring-2 focus:ring-rose-200" 
                value={transcriptStudent} 
                onChange={e => {setTranscriptStudent(e.target.value); setTranscriptPage(1);}} 
                disabled={!transcriptClass}
              >
                <option value="all">Semua Siswa di Kelas Ini</option>
                {allStudents
                  .filter(s => {
                    const r = rombels.find(rm => rm.id === transcriptClass);
                    return r ? isStudentInRombel(s, r) : false;
                  })
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                }
              </select>
              <input 
                type="text" 
                placeholder="No. Surat" 
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 w-28 outline-none focus:ring-2 focus:ring-rose-200"
                value={transcriptNumber}
                onChange={e => setTranscriptNumber(e.target.value)}
              />
              <button 
                onClick={() => window.print()} 
                className="flex items-center justify-center gap-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-50" 
                disabled={!transcriptClass}
              >
                Cetak Transkrip
              </button>
            </div>
          </div>
          
          {(() => {
             if (!transcriptClass) return <div className="py-8 text-center text-slate-500 font-medium print-hide">Pilih kelas terlebih dahulu.</div>;
             
             let targetStudents = allStudents.filter(s => {
               const r = rombels.find(rm => rm.id === transcriptClass);
               return r ? isStudentInRombel(s, r) : false;
             }).sort((a,b) => a.name.localeCompare(b.name));
             
             if (transcriptStudent !== 'all') {
               targetStudents = targetStudents.filter(s => s.id === transcriptStudent);
             }
             
             if (targetStudents.length === 0) return <div className="py-8 text-center text-slate-500 font-medium print-hide">Tidak ada siswa.</div>;

             const selectedRombel = rombels.find(r => r.id === transcriptClass);
             const major = selectedRombel?.major || '';
             
             return (
               <>
                 {targetStudents.map((student, idx) => {
                   const isCurrentPage = (idx + 1) === transcriptPage;
               const stdGrades = studentGrades.filter(g => g.studentId === student.id);
               const semesters = ['1','2','3','4','5','6'];
               
               let subjectList: string[] = [];
               let record = classSubjects.find(r => r.id === `${major}_5`);
               if (!record) {
                 record = classSubjects.find(r => r.id === `Umum_5`);
               }
               
               if (record && record.subjects && record.subjects.length > 0) {
                 subjectList = [...record.subjects];
               } else {
                 const allSubjects = new Set<string>();
                 stdGrades.forEach(g => {
                   if (g.grades) {
                     Object.keys(g.grades).forEach(subj => allSubjects.add(subj));
                   }
                 });
                 subjectList = Array.from(allSubjects).sort();
               }
               
               return (
                 <div key={student.id} className={`${idx > 0 ? "page-break mt-12 print:mt-0" : ""} ${isCurrentPage ? 'block' : 'hidden print:block'}`}>
                   <div className="block mb-6 print:mb-2">
                     <Letterhead profile={schoolProfile} />
                   </div>
                   
                   <h2 className="text-center text-lg print:text-base font-black text-slate-800 underline">TRANSKRIP NILAI</h2>
                   <p className="text-center text-sm print:text-xs font-medium mb-6 print:mb-2 mt-1">Nomor: {getTranscriptNumber(student, transcriptNumber, transcriptProfileNo)}</p>
                   
                   <div className="grid grid-cols-2 gap-x-8 gap-y-2 print:gap-y-0.5 mb-6 print:mb-2 text-xs print:text-[11px] text-slate-700 font-medium">
                     <div className="flex"><span className="w-40">Nama Lengkap</span><span>: {student.name}</span></div>
                     <div className="flex"><span className="w-40">Tempat, Tanggal Lahir</span><span>: {student.birthPlace || '-'}, {student.birthDate || '-'}</span></div>
                     <div className="flex"><span className="w-40">Nomor Induk / NISN</span><span>: {student.nis || '-'} / {student.nisn || '-'}</span></div>
                     <div className="flex"><span className="w-40">Kelas / Peminatan</span><span>: {(() => {
                       if (!selectedRombel) return student.class;
                       const config = gradesConfig?.find(g => g.name === selectedRombel.grade);
                       const electives = config?.electivesByMajor?.[selectedRombel.major] || [];
                       const mapelText = electives.length > 0 ? electives.join(', ') : selectedRombel.major;
                       return `${selectedRombel.name} / ${mapelText}`;
                     })()}</span></div>
                   </div>
                   
                   <table className="w-full text-xs print:text-[10px] text-left border-collapse border border-slate-800 mb-8 print:mb-2">
                     <thead>
                       <tr>
                         <th className="border border-slate-800 p-2 print:py-1 print:px-1 text-center bg-slate-50" rowSpan={2} style={{width: '5%'}}>NO</th>
                         <th className="border border-slate-800 p-2 print:py-1 print:px-1 text-center bg-slate-50" rowSpan={2}>MATA PELAJARAN</th>
                         <th className="border border-slate-800 p-2 print:py-1 print:px-1 text-center bg-slate-50" colSpan={6}>NILAI PENGETAHUAN SEMESTER</th>
                         <th className="border border-slate-800 p-2 print:py-1 print:px-1 text-center bg-slate-50" rowSpan={2} style={{width: '10%'}}>RATA-RATA</th>
                       </tr>
                       <tr>
                         <th className="border border-slate-800 p-1 print:py-0.5 print:px-1 text-center bg-slate-50" style={{width: '8%'}}>1</th>
                         <th className="border border-slate-800 p-1 print:py-0.5 print:px-1 text-center bg-slate-50" style={{width: '8%'}}>2</th>
                         <th className="border border-slate-800 p-1 print:py-0.5 print:px-1 text-center bg-slate-50" style={{width: '8%'}}>3</th>
                         <th className="border border-slate-800 p-1 print:py-0.5 print:px-1 text-center bg-slate-50" style={{width: '8%'}}>4</th>
                         <th className="border border-slate-800 p-1 print:py-0.5 print:px-1 text-center bg-slate-50" style={{width: '8%'}}>5</th>
                         <th className="border border-slate-800 p-1 print:py-0.5 print:px-1 text-center bg-slate-50" style={{width: '8%'}}>6</th>
                       </tr>
                     </thead>
                     <tbody>
                       {subjectList.length === 0 ? (
                         <tr><td colSpan={9} className="border border-slate-800 p-4 print:p-2 text-center">Data nilai tidak tersedia. Pastikan nilai telah diinput/diimport pada menu Manajemen Nilai.</td></tr>
                       ) : subjectList.map((subj, sIdx) => {
                         let total = 0;
                         let count = 0;
                         const scores = semesters.map(sem => {
                           const gRec = stdGrades.find(g => String(g.semester) === String(sem));
                           const score = gRec?.grades?.[subj];
                           if (typeof score === 'number') {
                             total += score;
                             count++;
                             return score;
                           }
                           return '-';
                         });
                         const avg = count > 0 ? (total / count).toFixed(1) : '-';
                         
                         return (
                           <tr key={subj}>
                             <td className="border border-slate-800 p-1.5 print:py-0.5 print:px-1 text-center">{sIdx + 1}</td>
                             <td className="border border-slate-800 p-1.5 print:py-0.5 print:px-1 font-medium">{subj}</td>
                             {scores.map((sc, i) => <td key={i} className="border border-slate-800 p-1.5 print:py-0.5 print:px-1 text-center">{sc}</td>)}
                             <td className="border border-slate-800 p-1.5 print:py-0.5 print:px-1 text-center font-bold text-rose-700 bg-rose-50/30">{avg}</td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                   
                   <div className="flex justify-end text-xs print:text-[11px] text-slate-700">
                     <div className="w-64 text-center">
                       <p className="mb-1">{schoolProfile.city || 'Kota'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                       <p className="mb-16 print:mb-8">Kepala Sekolah,</p>
                       <p className="font-bold underline">{schoolProfile.principalName || '________________________'}</p>
                       <p>NIP. {schoolProfile.principalNip || '-'}</p>
                     </div>
                   </div>
                 </div>
               )
             })}
              
              {targetStudents.length > 1 && transcriptStudent === 'all' && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0 print-hide">
                  <p className="text-xs text-slate-500 font-medium">Halaman {transcriptPage} dari {targetStudents.length}</p>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setTranscriptPage(p => Math.max(p - 1, 1))} 
                      disabled={transcriptPage === 1} 
                      className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path></svg>
                    </button>
                    <button 
                      onClick={() => setTranscriptPage(p => Math.min(p + 1, targetStudents.length))} 
                      disabled={transcriptPage === targetStudents.length} 
                      className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
                    </button>
                  </div>
                </div>
              )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
