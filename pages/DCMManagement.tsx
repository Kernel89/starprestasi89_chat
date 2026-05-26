
import React, { useState, useMemo, useEffect } from 'react';
import { Student, DCMSubmission, DCMQuestion, UserRole, Assignment, Rombel, SchoolProfile } from '../types';
import { ICONS } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { analyzeDcmData } from '../geminiService';

interface DCMManagementProps {
  students: Student[];
  submissions: DCMSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<DCMSubmission[]>>;
  questions: DCMQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<DCMQuestion[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  currentUserId?: string;
  assignments: Assignment[];
  rombels: Rombel[];
}

const DCMManagement: React.FC<DCMManagementProps & { schoolProfile: SchoolProfile }> = ({
  students,
  submissions,
  setSubmissions,
  questions,
  setQuestions,
  notify,
  userRole,
  currentUserId,
  assignments,
  rombels,
  schoolProfile
}) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const isStudent = userRole === 'student' || userRole === 'ketua_murid';
  const [selectedDomain, setSelectedDomain] = useState<DCMQuestion['domain']>('Pribadi');
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [analyzingClass, setAnalyzingClass] = useState<string | null>(null);

  // Counselor States
  const [activeTab, setActiveTab] = useState<'kelas' | 'individu' | 'angkatan'>('kelas');
  const [selectedClassView, setSelectedClassView] = useState('Semua');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const domains = ['Pribadi', 'Sosial', 'Belajar', 'Karir'];

  // --- LOGIKA SISWA (Sama seperti sebelumnya) ---
  const activeDcmAssignment = useMemo(() => {
    if (!isStudent || !currentUserId) return null;
    const student = students.find(s => s.id === currentUserId);
    if (!student) return null;

    const normalize = (str: string, grade: string) => {
      if (!str) return '';
      const g = grade.trim().toUpperCase();
      return str.toUpperCase()
        .replace(new RegExp(`^${g}\\s*`, 'i'), '')
        .replace(/\s+/g, ' ')
        .replace(/\b0+(\d)/g, '$1')
        .trim();
    };

    const studentClassNormalized = normalize(student.class, student.grade);

    const studentRombel = rombels.find(r => {
        if (r.grade.trim().toUpperCase() !== student.grade.trim().toUpperCase()) return false;
        return normalize(r.name, r.grade) === studentClassNormalized;
    });

    return assignments.find(a => 
      a.type === 'DCM' && a.status === 'Aktif' && 
      ((a.targetType === 'Individu' && a.targetId === currentUserId) || 
       (a.targetType === 'Rombel' && studentRombel && a.targetId === studentRombel.id))
    );
  }, [isStudent, currentUserId, assignments, rombels, students]);

  useEffect(() => {
    if (isStudent && currentUserId) {
        const existing = submissions.find(s => s.studentId === currentUserId);
        if (existing) {
            setAnswers(existing.selectedIssues);
        }
    }
  }, [isStudent, currentUserId, submissions]);

  const handleToggleOption = (id: string) => {
    setAnswers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!currentUserId || !activeDcmAssignment) return;
    setIsSubmitting(true);
    
    const existingIndex = submissions.findIndex(s => s.studentId === currentUserId);
    const newSubmission: DCMSubmission = {
        id: existingIndex !== -1 ? submissions[existingIndex].id : `dcm-sub-${Date.now()}`,
        studentId: currentUserId,
        date: new Date().toISOString(),
        selectedIssues: answers
    };

    setTimeout(() => {
        if (existingIndex !== -1) {
            setSubmissions(prev => {
                const updated = [...prev];
                updated[existingIndex] = newSubmission;
                return updated;
            });
        } else {
            setSubmissions(prev => [...prev, newSubmission]);
        }
        setIsSubmitting(false);
        notify("DCM berhasil disimpan.", "success");
    }, 800);
  };

  // --- LOGIKA KONSELOR ---

  // 1. Filter Data Kelas
  const filteredClassSubmissions = useMemo(() => {
    if (isStudent) return [];
    if (selectedClassView === 'Semua') return submissions;
    return submissions.filter(sub => {
        const student = students.find(s => s.id === sub.studentId);
        if (!student) return false;
        const rombel = rombels.find(r => r.name === selectedClassView);
        if (!rombel) return false;
        
        const rGrade = rombel.grade.trim().toUpperCase();
        const sGrade = student.grade.trim().toUpperCase();
        if (rGrade !== sGrade) return false;

        const normalize = (str: string, grade: string) => {
          if (!str) return '';
          const g = grade.trim().toUpperCase();
          return str.toUpperCase()
            .replace(new RegExp(`^${g}\\s*`, 'i'), '')
            .replace(/\s+/g, ' ')
            .replace(/\b0+(\d)/g, '$1')
            .trim();
        };

        return normalize(student.class, sGrade) === normalize(rombel.name, rGrade);
    });
  }, [submissions, selectedClassView, students, rombels, isStudent]);

  // 2. Statistik Per Kelas
  const classStats = useMemo(() => {
    if (isStudent) return null;
    const domainCounts: Record<string, number> = { Pribadi: 0, Sosial: 0, Belajar: 0, Karir: 0 };
    const issueCounts: Record<string, number> = {};
    
    // Untuk list siswa high risk
    const studentProblemCounts: {id: string, name: string, count: number, details: string[]}[] = [];

    filteredClassSubmissions.forEach(sub => {
        let personalCount = 0;
        const student = students.find(s => s.id === sub.studentId);
        
        sub.selectedIssues.forEach(issueId => {
            const q = questions.find(qu => qu.id === issueId);
            if (q) {
                domainCounts[q.domain]++;
                issueCounts[q.text] = (issueCounts[q.text] || 0) + 1;
                personalCount++;
            }
        });

        if (student) {
            studentProblemCounts.push({
                id: student.id,
                name: getInitials(student.name),
                count: personalCount,
                details: sub.selectedIssues
            });
        }
    });

    const totalSelections = Object.values(domainCounts).reduce((a,b) => a+b, 0);
    const domainStats = Object.entries(domainCounts).map(([name, val]) => ({
        domain: name,
        score: totalSelections ? Math.round((val / totalSelections) * 100) : 0,
        count: val
    }));

    const topIssues = Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([text, count]) => ({ text, count, percent: Math.round((count / (filteredClassSubmissions.length || 1)) * 100) }));

    const highRiskStudents = studentProblemCounts.sort((a, b) => b.count - a.count).slice(0, 5);

    return { domainStats, topIssues, highRiskStudents };
  }, [filteredClassSubmissions, questions, isStudent, students]);

  // 3. Analisis Per Individu
  const individualStats = useMemo(() => {
    if (!selectedStudentId) return null;
    const submission = submissions.find(s => s.studentId === selectedStudentId);
    if (!submission) return null;

    const scores = { Pribadi: 0, Sosial: 0, Belajar: 0, Karir: 0 };
    const issueList: { domain: string, text: string }[] = [];

    submission.selectedIssues.forEach(issueId => {
        const q = questions.find(qu => qu.id === issueId);
        if (q) {
            scores[q.domain as keyof typeof scores]++;
            issueList.push({ domain: q.domain, text: q.text });
        }
    });

    // Total questions per domain (Hardcoded based on constants or calculating)
    // Assuming 60 items per domain based on constants generate20Items * 3 categories usually
    const totalPerDomain = 40; // Approx normalization factor

    const radarData = Object.entries(scores).map(([subject, count]) => ({
        subject,
        A: (count / totalPerDomain) * 100, // Normalize to 100 scale
        fullMark: 100,
        count
    }));

    return { radarData, issueList };
  }, [selectedStudentId, submissions, questions]);

  // 4. Analisis Per Angkatan
  const gradeStats = useMemo(() => {
    if (isStudent) return [];
    
    const grades = ['X', 'XI', 'XII'];
    const data: any[] = [];

    grades.forEach(g => {
        const gradeStudents = students.filter(s => s.grade === g).map(s => s.id);
        const gradeSubs = submissions.filter(s => gradeStudents.includes(s.studentId));
        
        const counts = { Pribadi: 0, Sosial: 0, Belajar: 0, Karir: 0 };
        let totalItems = 0;

        gradeSubs.forEach(sub => {
            sub.selectedIssues.forEach(issueId => {
                const q = questions.find(qu => qu.id === issueId);
                if (q) {
                    counts[q.domain as keyof typeof counts]++;
                    totalItems++;
                }
            });
        });

        // Normalize by number of students to get average problems per student in that domain
        const studentCount = Math.max(1, gradeSubs.length); 
        
        data.push({
            name: `Kelas ${g}`,
            Pribadi: (counts.Pribadi / studentCount).toFixed(1),
            Sosial: (counts.Sosial / studentCount).toFixed(1),
            Belajar: (counts.Belajar / studentCount).toFixed(1),
            Karir: (counts.Karir / studentCount).toFixed(1),
            Respondent: studentCount
        });
    });

    return data;
  }, [submissions, students, questions, isStudent]);

  const handleAiAnalysis = async () => {
    if (!classStats) return;
    setAnalyzingClass(selectedClassView);
    const result = await analyzeDcmData(selectedClassView, classStats.domainStats, classStats.topIssues);
    setAiInsight(result);
    setAnalyzingClass(null);
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF('portrait');
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("LAPORAN ANALISIS DAFTAR CEK MASALAH (DCM)", 105, startY + 5, { align: 'center' });
    doc.setFontSize(11); doc.setFont("times", "normal");
    
    if (activeTab === 'individu' && selectedStudentId) {
        const student = students.find(s => s.id === selectedStudentId);
        doc.text(`Nama Siswa: ${getInitials(student?.name || '-')}`, 105, startY + 11, { align: 'center' });
        
        if (individualStats) {
            (doc as any).autoTable({
                startY: startY + 25,
                head: [['Domain', 'Jumlah Masalah']],
                body: individualStats.radarData.map(d => [d.subject, d.count]),
                styles: { font: 'times' }
            });
            
            const nextY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFont("times", "bold");
            doc.text("Detail Butir Masalah:", 14, nextY);
            doc.setFont("times", "normal");
            
            (doc as any).autoTable({
                startY: nextY + 5,
                head: [['Domain', 'Pernyataan Masalah']],
                body: individualStats.issueList.map(i => [i.domain, i.text]),
                styles: { font: 'times', fontSize: 9 }
            });
        }
    } else {
        doc.text(`Responden: ${filteredClassSubmissions.length} Siswa`, 105, startY + 11, { align: 'center' });
        
        if (classStats) {
            (doc as any).autoTable({
                startY: startY + 25,
                head: [['Domain', 'Rata-rata Skor %', 'Total Masalah']],
                body: classStats.domainStats.map(d => [d.domain, `${d.score}%`, d.count]),
                styles: { font: 'times' }
            });
            
            const nextY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFont("times", "bold");
            doc.text("5 Masalah Teratas di Kelas:", 14, nextY);
            doc.setFont("times", "normal");
            
            (doc as any).autoTable({
                startY: nextY + 5,
                head: [['No', 'Masalah', 'Jumlah Siswa', 'Persentase']],
                body: classStats.topIssues.map((i, idx) => [idx + 1, i.text, i.count, `${i.percent}%`]),
                styles: { font: 'times' }
            });
        }
    }

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 240 ? 30 : finalY;
    if (finalY > 240) doc.addPage();

    doc.setFontSize(10);
    doc.text("Mengetahui,", 30, signY);
    doc.text("Kepala Sekolah,", 30, signY + 5);
    doc.text(schoolProfile.principalName, 30, signY + 30);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 30, signY + 35);

    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, signY);
    doc.text("Guru BK / Konselor,", 140, signY + 5);
    doc.text(schoolProfile.counselorName, 140, signY + 30);
    doc.text(`NIP. ${schoolProfile.counselorNip}`, 140, signY + 35);

    doc.save(`Laporan_DCM_${selectedClassView}_${Date.now()}.pdf`);
    notify("Laporan DCM berhasil diunduh.", "success");
  };

  // --- RENDER SISWA ---
  if (isStudent) {
    if (!activeDcmAssignment) {
        return (
            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                    <ICONS.DCM />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Tidak Ada Sesi DCM Aktif</h3>
                <p className="text-slate-400 text-sm mt-2">Hubungi Guru BK untuk informasi pengisian DCM.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Cek Masalah (DCM)</h2>
                    <p className="text-slate-500 text-sm">Centang pernyataan yang sesuai dengan kondisi Anda saat ini.</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700 font-bold text-sm">
                    Terjawab: {answers.length} Item
                </div>
            </header>

            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto">
                    {domains.map(dom => (
                        <button 
                            key={dom}
                            onClick={() => setSelectedDomain(dom as any)}
                            className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all ${selectedDomain === dom ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                        >
                            {dom}
                        </button>
                    ))}
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {questions.filter(q => q.domain === selectedDomain).map(q => (
                        <label key={q.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${answers.includes(q.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                            <input 
                                type="checkbox" 
                                className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={answers.includes(q.id)}
                                onChange={() => handleToggleOption(q.id)}
                            />
                            <span className={`text-sm font-medium ${answers.includes(q.id) ? 'text-indigo-900' : 'text-slate-600'}`}>{q.text}</span>
                        </label>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Jawaban'}
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- RENDER KONSELOR ---
  return (
    <div className="space-y-8 animate-in fade-in pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analisis DCM</h2>
                <p className="text-slate-500 text-sm">Peta masalah siswa berdasarkan domain bimbingan.</p>
            </div>
            
            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-3">
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                   <button onClick={() => setActiveTab('kelas')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'kelas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Per Kelas</button>
                   <button onClick={() => setActiveTab('individu')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'individu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Per Individu</button>
                   <button onClick={() => setActiveTab('angkatan')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'angkatan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Per Angkatan</button>
                </div>
                {activeTab !== 'angkatan' && (
                    <button onClick={handlePrintPDF} className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        PDF
                    </button>
                )}
            </div>
        </header>

        {/* --- VIEW PER KELAS --- */}
        {activeTab === 'kelas' && (
            <>
                <div className="flex justify-end">
                    <select 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                        value={selectedClassView}
                        onChange={(e) => { setSelectedClassView(e.target.value); setAiInsight(null); }}
                    >
                        <option value="Semua">Semua Kelas</option>
                        {rombels.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                </div>

                {filteredClassSubmissions.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">Belum ada data DCM masuk untuk filter ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            {/* CHART SECTION */}
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 mb-6">Distribusi Masalah Dominan</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={classStats?.domainStats}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="domain" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                                            <YAxis hide />
                                            <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={60} fill="#6366f1" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* TOP ISSUES */}
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 mb-6">5 Masalah Teratas</h3>
                                <div className="space-y-4">
                                    {classStats?.topIssues.map((issue, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xs">{idx + 1}</div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-700">{issue.text}</p>
                                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${issue.percent}%` }} />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-lg font-black text-slate-800">{issue.count}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Siswa</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            {/* PRIORITY STUDENTS */}
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Siswa Perlu Perhatian</h3>
                                <div className="space-y-3">
                                    {classStats?.highRiskStudents.map((s, idx) => (
                                        <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 transition-colors cursor-pointer group" onClick={() => { setActiveTab('individu'); setSelectedStudentId(s.id); }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-rose-200 group-hover:text-rose-700 transition-colors">{idx + 1}</div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{s.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 group-hover:text-rose-400">Lihat Detail →</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-rose-600">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI ANALYSIS CARD */}
                            <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><ICONS.Sparkles /></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-indigo-300">AI Analysis</h4>
                                
                                {!aiInsight ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm font-medium opacity-80 mb-6">Dapatkan analisis mendalam mengenai kondisi kelas ini menggunakan AI.</p>
                                        <button 
                                            onClick={handleAiAnalysis}
                                            disabled={!!analyzingClass}
                                            className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                        >
                                            {analyzingClass ? 'Menganalisis...' : 'Mulai Analisis'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-sm max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        <div className="whitespace-pre-line text-xs font-medium leading-relaxed opacity-90">
                                            {aiInsight}
                                        </div>
                                        <button onClick={() => setAiInsight(null)} className="mt-6 text-[10px] font-bold text-indigo-300 hover:text-white uppercase tracking-widest">Tutup Analisis</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* --- VIEW PER INDIVIDU --- */}
        {activeTab === 'individu' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Pilih Siswa</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100"
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">-- Pilih Siswa --</option>
                            {students.filter(s => s.status === 'Aktif').sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                <option key={s.id} value={s.id}>{getInitials(s.name)}</option>
                            ))}
                        </select>

                        {selectedStudentId && individualStats && (
                            <div className="mt-8 h-[300px]">
                                <h4 className="text-center text-sm font-bold text-slate-700 mb-4">Peta Masalah Individu</h4>
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={individualStats.radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Masalah" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px'}} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm min-h-[500px]">
                        {!selectedStudentId ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <ICONS.Profile />
                                <p className="mt-4 font-bold text-sm">Pilih siswa untuk melihat detail masalah.</p>
                            </div>
                        ) : !individualStats ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <p className="font-bold text-sm">Siswa ini belum mengisi DCM.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Detail Masalah Teridentifikasi</h3>
                                    <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold">{individualStats.issueList.length} Butir Masalah</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {domains.map(dom => {
                                        const domIssues = individualStats.issueList.filter(i => i.domain === dom);
                                        if (domIssues.length === 0) return null;
                                        return (
                                            <div key={dom} className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">{dom} ({domIssues.length})</h4>
                                                <ul className="space-y-2">
                                                    {domIssues.map((issue, i) => (
                                                        <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                                                            <span className="text-rose-400 mt-0.5">•</span> {issue.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW PER ANGKATAN --- */}
        {activeTab === 'angkatan' && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-2">Komparasi Masalah Per Angkatan</h3>
                <p className="text-sm text-slate-500 mb-8">Rata-rata jumlah masalah yang dipilih siswa per bidang layanan.</p>
                
                {gradeStats.length > 0 ? (
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={gradeStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                                <YAxis />
                                <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="Pribadi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Sosial" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Belajar" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Karir" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="py-20 text-center text-slate-300 font-bold">Belum ada data yang cukup untuk analisis angkatan.</div>
                )}
                
                <div className="grid grid-cols-3 gap-6 mt-8">
                    {gradeStats.map((g, i) => (
                        <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl">
                            <p className="font-black text-slate-800">{g.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{g.Respondent} Responden</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default DCMManagement;
