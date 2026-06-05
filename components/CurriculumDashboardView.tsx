import React, { useMemo, useState, useEffect } from 'react';
import { Student, Rombel } from '../types';
import { ICONS } from '../constants';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const normalizeClassSuffix = (str: string) => {
  if (!str) return '';
  let cleaned = str.trim().replace(/\s+/g, ' ').toUpperCase();
  const parts = cleaned.split(' ');
  const lastPart = parts[parts.length - 1];
  if (!isNaN(Number(lastPart)) && /^\d+$/.test(lastPart)) {
    parts[parts.length - 1] = parseInt(lastPart, 10).toString();
  }
  return parts.join(' ');
};

const extractShortName = (fullName: string, grade: string) => {
  const normalizedGrade = grade.trim().toUpperCase();
  const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
  return normalizeClassSuffix(nameWithoutGrade);
};

const getRombelForStudent = (student: Student, rombels: Rombel[]) => {
  const sGrade = (student.grade || '').trim().toUpperCase();
  const sSuffix = normalizeClassSuffix(student.class || '');
  return rombels.find(r => {
    const rGrade = (r.grade || '').trim().toUpperCase();
    const rSuffix = extractShortName(r.name, r.grade);
    return rGrade === sGrade && rSuffix === sSuffix;
  });
};

interface CurriculumDashboardViewProps {
  students: Student[];
  rombels: Rombel[];
  classSubjects?: any[];
}

const CurriculumDashboardView: React.FC<CurriculumDashboardViewProps> = ({ students, rombels, classSubjects = [] }) => {
  // Aggregate grades by semester for MIPA vs IPS vs UMUM (Kurikulum Merdeka might just be UMUM or based on class)
  const chartData = useMemo(() => {
    const semesters = ['1', '2', '3', '4', '5', '6'];
    const data: any[] = [];
    
    semesters.forEach(sem => {
      let mipaTotal = 0, mipaCount = 0;
      let ipsTotal = 0, ipsCount = 0;
      let umumTotal = 0, umumCount = 0;
      
      students.forEach(student => {
        if (!student.semesterGrades || !student.semesterGrades[sem]) return;
        
        const grades = Object.values(student.semesterGrades[sem]);
        if (grades.length === 0) return;
        
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        
        const rombel = getRombelForStudent(student, rombels);
        const major = rombel?.major || 'Umum';
        
        if (major === 'MIPA') {
          mipaTotal += avg;
          mipaCount++;
        } else if (major === 'IPS') {
          ipsTotal += avg;
          ipsCount++;
        } else {
          umumTotal += avg;
          umumCount++;
        }
      });
      
      data.push({
        name: `Sem ${sem}`,
        MIPA: mipaCount > 0 ? parseFloat((mipaTotal / mipaCount).toFixed(2)) : 0,
        IPS: ipsCount > 0 ? parseFloat((ipsTotal / ipsCount).toFixed(2)) : 0,
        Umum: umumCount > 0 ? parseFloat((umumTotal / umumCount).toFixed(2)) : 0,
      });
    });
    
    return data;
  }, [students, rombels]);

  const topStudents = useMemo(() => {
    const studentAvgs = students.map(student => {
      if (!student.semesterGrades) return { student, avg: 0 };
      
      let totalAvg = 0;
      let semCount = 0;
      Object.values(student.semesterGrades).forEach(semGrades => {
        const grades = Object.values(semGrades);
        if (grades.length > 0) {
          totalAvg += grades.reduce((a, b) => a + b, 0) / grades.length;
          semCount++;
        }
      });
      
      return { 
        student, 
        avg: semCount > 0 ? parseFloat((totalAvg / semCount).toFixed(2)) : 0 
      };
    }).filter(s => s.avg > 0);
    
    return studentAvgs.sort((a, b) => b.avg - a.avg).slice(0, 10);
  }, [students]);

  // SNBP Eligible Averages
  const snbpData = useMemo(() => {
    const semesters = ['1', '2', '3', '4', '5', '6'];
    const semData: any[] = [];
    let overallTotal = 0;
    let overallCount = 0;
    
    semesters.forEach(sem => {
      let semTotal = 0, semCount = 0;
      
      students.forEach(student => {
        if (!student.semesterGrades || !student.semesterGrades[sem]) return;
        
        const rombel = getRombelForStudent(student, rombels);
        const major = rombel?.major || 'Umum';
        
        // Find class subject record
        let record = classSubjects?.find(r => r.id === `${major}_${sem}`);
        if (!record && sem === '1') {
          record = classSubjects?.find(r => r.id === `Umum_${sem}`);
        }
        
        const eligibleSubjects = record?.eligibleSubjects || [];
        
        const grades = student.semesterGrades[sem];
        let studentSnbpTotal = 0;
        let studentSnbpCount = 0;
        
        Object.entries(grades).forEach(([subj, score]) => {
          if (eligibleSubjects.includes(subj)) {
            studentSnbpTotal += score;
            studentSnbpCount++;
          }
        });
        
        if (studentSnbpCount > 0) {
          const studentAvg = studentSnbpTotal / studentSnbpCount;
          semTotal += studentAvg;
          semCount++;
          overallTotal += studentAvg;
          overallCount++;
        }
      });
      
      semData.push({
        name: `Sem ${sem}`,
        AvgSNBP: semCount > 0 ? parseFloat((semTotal / semCount).toFixed(2)) : 0
      });
    });
    
    const overallAvg = overallCount > 0 ? parseFloat((overallTotal / overallCount).toFixed(2)) : 0;
    
    return { semData, overallAvg };
  }, [students, rombels, classSubjects]);

  // Subject Stats (Max, Min, Avg) & Trend Data
  const subjectStats = useMemo(() => {
    const stats: Record<string, { total: number, count: number, max: number, min: number }> = {};
    const trend: Record<string, Record<string, { total: number, count: number }>> = {};
    
    students.forEach(student => {
      if (!student.semesterGrades) return;
      
      Object.entries(student.semesterGrades).forEach(([sem, grades]) => {
        Object.entries(grades).forEach(([subj, score]) => {
          // Global stats
          if (!stats[subj]) {
            stats[subj] = { total: 0, count: 0, max: -Infinity, min: Infinity };
          }
          stats[subj].total += score;
          stats[subj].count++;
          if (score > stats[subj].max) stats[subj].max = score;
          if (score < stats[subj].min) stats[subj].min = score;
          
          // Trend stats
          if (!trend[subj]) trend[subj] = {};
          if (!trend[subj][sem]) trend[subj][sem] = { total: 0, count: 0 };
          
          trend[subj][sem].total += score;
          trend[subj][sem].count++;
        });
      });
    });
    
    const statsArray = Object.keys(stats).map(subj => ({
      subject: subj,
      max: stats[subj].max,
      min: stats[subj].min,
      avg: parseFloat((stats[subj].total / stats[subj].count).toFixed(2))
    })).sort((a, b) => a.subject.localeCompare(b.subject));
    
    return { statsArray, trend };
  }, [students]);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  useEffect(() => {
    if (subjectStats.statsArray.length > 0 && !selectedSubject) {
      setSelectedSubject(subjectStats.statsArray[0].subject);
    }
  }, [subjectStats, selectedSubject]);

  const subjectTrendData = useMemo(() => {
    if (!selectedSubject || !subjectStats.trend[selectedSubject]) return [];
    
    const semesters = ['1', '2', '3', '4', '5', '6'];
    const data: any[] = [];
    
    semesters.forEach(sem => {
      const semData = subjectStats.trend[selectedSubject][sem];
      data.push({
        name: `Sem ${sem}`,
        [selectedSubject]: semData && semData.count > 0 ? parseFloat((semData.total / semData.count).toFixed(2)) : null
      });
    });
    return data;
  }, [selectedSubject, subjectStats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
            <ICONS.Star />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Analisis Nilai Akademik Keseluruhan</h3>
            <p className="text-sm font-bold text-slate-400">Pemantauan Tren Rata-rata Nilai Raport Siswa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-50 p-4 rounded-2xl border border-slate-100">Tren Rata-rata per Peminatan</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['dataMin - 5', 100]} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Line type="monotone" dataKey="MIPA" stroke="#14b8a6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="IPS" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Umum" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <span>Top 10 Siswa (Rata-rata Keseluruhan)</span>
              <span className="text-[10px] text-slate-400">Rata-rata Terakumulasi</span>
            </h4>
            <div className="space-y-2">
              {topStudents.length > 0 ? topStudents.map((item, index) => (
                <div key={item.student.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-teal-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{item.student.name}</p>
                      <p className="text-[10px] font-black text-slate-400">{item.student.grade} {item.student.class}</p>
                    </div>
                  </div>
                  <div className="text-sm font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg">
                    {item.avg.toFixed(2)}
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400">Belum ada data nilai raport.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Analisis Rata-rata SNBP (Eligible)</h3>
            <p className="text-sm font-bold text-slate-400">Pemantauan Rata-rata Khusus Mata Pelajaran Penentu SNBP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-indigo-600 p-8 rounded-[2rem] text-white flex flex-col justify-center h-full relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-purple-500 rounded-full opacity-50 blur-2xl"></div>
              
              <div className="relative z-10">
                <p className="text-indigo-100 font-bold mb-2 uppercase tracking-widest text-sm">Rata-rata SNBP Total</p>
                <div className="text-6xl font-black">{snbpData.overallAvg.toFixed(2)}</div>
                <p className="text-indigo-200 text-xs mt-4 font-semibold">Dihitung dari seluruh siswa berdasarkan mata pelajaran eligible jurusan masing-masing</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">Grafik Rata-rata SNBP per Semester</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snbpData.semData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                  <Bar dataKey="AvgSNBP" name="Rata-rata SNBP" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* TABEL STATISTIK */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Statistik per Mata Pelajaran</h3>
              <p className="text-xs font-bold text-slate-400">Nilai Tertinggi, Terendah, dan Rata-rata</p>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-white py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100">Mata Pelajaran</th>
                  <th className="sticky top-0 bg-white py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100 text-center">Tinggi</th>
                  <th className="sticky top-0 bg-white py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100 text-center">Rendah</th>
                  <th className="sticky top-0 bg-white py-3 px-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100 text-center">Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.statsArray.map((stat, i) => (
                  <tr key={stat.subject} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-bold text-slate-700">{stat.subject}</td>
                    <td className="py-3 px-4 text-sm font-black text-emerald-600 text-center bg-emerald-50/50">{stat.max === -Infinity ? '-' : stat.max}</td>
                    <td className="py-3 px-4 text-sm font-black text-rose-600 text-center bg-rose-50/50">{stat.min === Infinity ? '-' : stat.min}</td>
                    <td className="py-3 px-4 text-sm font-black text-blue-600 text-center bg-blue-50/50">{stat.avg.toFixed(2)}</td>
                  </tr>
                ))}
                {subjectStats.statsArray.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-bold text-sm">Belum ada data mata pelajaran</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GRAFIK PER MATA PELAJARAN */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Grafik Mata Pelajaran</h3>
                <p className="text-xs font-bold text-slate-400">Tren Rata-rata Spesifik per Semester</p>
              </div>
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border-none text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="" disabled>Pilih Mapel...</option>
              {subjectStats.statsArray.map(stat => (
                <option key={stat.subject} value={stat.subject}>{stat.subject}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            {selectedSubject ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subjectTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['dataMin - 5', 100]} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Line type="monotone" dataKey={selectedSubject} stroke="#0ea5e9" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">
                Pilih mata pelajaran untuk melihat grafik
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CurriculumDashboardView;
