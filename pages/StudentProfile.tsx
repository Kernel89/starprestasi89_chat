
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { Student, Mood, QuestionnaireSubmission, AttendanceLog, GuidanceSession, HomeVisit, Advocacy, CaseConference, Referral } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface StudentProfileProps {
  students: Student[];
  submissions?: QuestionnaireSubmission[];
  attendanceLogs?: AttendanceLog[];
  sessions?: GuidanceSession[];
  homeVisits?: HomeVisit[];
  advocacies?: Advocacy[];
  conferences?: CaseConference[];
  referrals?: Referral[];
}

const MBTI_DESCRIPTIONS: Record<string, string> = {
  'INTJ': 'Arsitek - Pemikir strategis dengan rencana untuk segala hal.',
  'INTP': 'Ahli Logika - Penemu kreatif dengan haus akan pengetahuan.',
  'ENTJ': 'Komandan - Pemimpin yang berani and penuh imajinasi.',
  'ENTP': 'Pendebat - Pemikir cerdas yang tidak bisa menolak tantangan intelektual.',
  'INFJ': 'Advokat - Pendiam and mistis, namun inspirator yang tak kenal lelah.',
  'INFP': 'Mediator - Orang yang puitis, baik hati, and altruistik.',
  'ENFJ': 'Protagonis - Pemimpin karismatik yang mampu memukau pendengar.',
  'ENFP': 'Juru Kampanye - Semangat bebas yang antusias and kreatif.',
  'ISTJ': 'Logistik - Praktis and mengutamakan fakta.',
  'ISFJ': 'Pembela - Pelindung yang sangat berdedikasi and hangat.',
  'ESTJ': 'Eksekutif - Administrator cakap, tak tertandingi dalam mengelola sesuatu.',
  'ESFJ': 'Konsul - Orang yang sangat peduli, sosial, and populer.',
  'ISTP': 'Virtuoso - Eksperimen yang berani and praktis.',
  'ISFP': 'Petualang - Seniman fleksibel yang selalu siap mencoba hal baru.',
  'ESTP': 'Pengusaha - Orang yang cerdas, energik, and perseptif.',
  'ESFP': 'Penghibur - Orang yang spontan, energik, and antusias.'
};

const StudentProfile: React.FC<StudentProfileProps> = ({ 
  students, 
  submissions = [], 
  attendanceLogs = [],
  sessions = [],
  homeVisits = [],
  advocacies = [],
  conferences = [],
  referrals = []
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  useEffect(() => {
    const found = students.find(s => s.id === id);
    if (found) {
      setStudent(found);
    } else {
      const timeout = setTimeout(() => navigate('/students'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [id, students, navigate]);

  const latestMbti = useMemo(() => {
    return [...submissions]
      .filter(s => s.studentId === id && s.mbtiResult)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [submissions, id]);

  const latestSq = useMemo(() => {
    return [...submissions]
      .filter(s => s.studentId === id && s.sqScore !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [submissions, id]);

  const latestEq = useMemo(() => {
    return [...submissions]
      .filter(s => s.studentId === id && s.eqScore !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [submissions, id]);

  const latestAq = useMemo(() => {
    return [...submissions]
      .filter(s => s.studentId === id && s.aqScore !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [submissions, id]);

  const absenceData = useMemo(() => {
    const studentLogs = (attendanceLogs || []).filter(l => l.studentId === id);
    const counts = {
      Sakit: studentLogs.filter(l => l.status === 'Sakit').length,
      Izin: studentLogs.filter(l => l.status === 'Izin').length,
      Alfa: studentLogs.filter(l => l.status === 'Alfa').length,
    };

    return [
      { name: 'Sakit', value: counts.Sakit, color: '#f59e0b' },
      { name: 'Izin', value: counts.Izin, color: '#06b6d4' },
      { name: 'Alfa', value: counts.Alfa, color: '#f43f5e' },
    ];
  }, [attendanceLogs, id]);

  const hasAbsenceData = useMemo(() => absenceData.some(d => d.value > 0), [absenceData]);

  // --- RIWAYAT LAYANAN BK ---
  const serviceHistory = useMemo(() => {
    if (!id) return [];
    
    const history: any[] = [];

    // 1. Sessions (Individual, Group, Classical)
    sessions.forEach(s => {
      // Check if student is in this session (Individual/Group use studentIds)
      if (s.studentIds && s.studentIds.includes(id)) {
        history.push({ 
          date: s.date, 
          type: s.type || 'Layanan BK', 
          topic: s.topic, 
          nature: 'Guidance',
          counselor: s.counselorName,
          grade: s.gradeAtTime
        });
      }
    });

    // 2. Home Visits
    homeVisits.forEach(hv => {
      if (hv.studentId === id) {
        history.push({ 
          date: hv.date, 
          type: 'Home Visit', 
          topic: hv.reason, 
          nature: 'Visit',
          counselor: hv.counselorName,
          grade: hv.gradeAtTime
        });
      }
    });

    // 3. Advocacy
    advocacies.forEach(a => {
      if (a.studentId === id) {
        history.push({ 
          date: a.date, 
          type: 'Advokasi', 
          topic: a.incidentDescription, 
          nature: 'Advocacy',
          counselor: a.counselorName,
          grade: a.gradeAtTime
        });
      }
    });

    // 4. Conferences
    conferences.forEach(c => {
      if (c.studentId === id) {
        history.push({ 
          date: c.date, 
          type: 'Konferensi Kasus', 
          topic: c.agenda, 
          nature: 'Conference',
          counselor: c.counselorName,
          grade: c.gradeAtTime
        });
      }
    });

    // 5. Referrals
    referrals.forEach(r => {
      if (r.studentId === id) {
        history.push({ 
          date: r.date, 
          type: 'Alih Tangan Kasus', 
          topic: `Rujukan ke: ${r.targetAgency}`, 
          nature: 'Referral',
          counselor: r.counselorName,
          grade: r.gradeAtTime
        });
      }
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [id, sessions, homeVisits, advocacies, conferences, referrals]);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mb-4" />
        <p className="font-bold">Memuat data profil siswa...</p>
      </div>
    );
  }

  const moodEmojis: Record<string, string> = {
    [Mood.SangatSenang]: '😁',
    [Mood.Senang]: '🙂',
    [Mood.Netral]: '😐',
    [Mood.Sedih]: '🙁',
    [Mood.SangatSedih]: '😭',
    [Mood.Cemas]: '😰',
    [Mood.Marah]: '😠'
  };

  const getPsychLevel = (score: number) => {
    if (score >= 148) return { label: 'Tinggi', color: 'emerald' };
    if (score >= 94) return { label: 'Moderat', color: 'teal' };
    return { label: 'Rendah', color: 'rose' };
  };

  const getAqLabel = (score: number) => {
    if (score >= 148) return { label: 'Climber', color: 'cyan' };
    if (score >= 94) return { label: 'Camper', color: 'teal' };
    return { label: 'Quitter', color: 'slate' };
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <button 
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors group"
      >
        <div className="p-1.5 bg-white rounded-lg border border-slate-200 group-hover:border-slate-400 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        Kembali ke Daftar
      </button>

      {/* Profile Header */}
      <header className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2">
           <span className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-sm ${
             student.riskLevel === 'Tinggi' ? 'bg-red-500 text-white' : 
             student.riskLevel === 'Sedang' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
           }`}>
             {student.riskLevel} Risk
           </span>
           <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest">
             {student.status}
           </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-teal-50 to-cyan-600 flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-xl shadow-cyan-100 border-4 border-white shrink-0 overflow-hidden">
            {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : getInitials(student.name).charAt(0)}
          </div>
          <div className="text-center md:text-left min-w-0">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 truncate max-w-full">{getInitials(student.name)}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold font-mono">NIS: {student.nis}</span>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">-</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">Mood: {moodEmojis[student.lastMood] || '😶'} {student.lastMood}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Informasi Pribadi
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Username Login</p>
                <p className="text-sm font-mono font-bold text-slate-700">{student.username}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Sekolah</p>
                <p className="text-sm font-bold text-slate-700 truncate">{student.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{student.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Kontak Keluarga
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Orang Tua/Wali</p>
                <p className="text-sm font-bold text-slate-700">{student.parentName}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Telepon Wali</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{student.parentPhone}</p>
                </div>
                <button className="bg-green-600 text-white p-2 rounded-xl shadow-lg shadow-green-100 active:scale-90 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Psychological Results Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-violet-50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <h4 className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                   MBTI
                </h4>
                {latestMbti ? (
                  <>
                    <p className="text-2xl font-black text-slate-800 italic">{latestMbti.mbtiResult}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-1 italic leading-tight">"{MBTI_DESCRIPTIONS[latestMbti.mbtiResult!]?.split(' - ')[0] || 'Karakter Unik'}"</p>
                    <p className="text-[8px] text-slate-300 uppercase mt-4">Tgl: {new Date(latestMbti.date).toLocaleDateString('id-ID')}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-300 italic py-4">Kosong</p>
                )}
             </div>

             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 3v18M8 6l8 12M16 6l-8 12"/></svg>
                   SQ
                </h4>
                {latestSq ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-slate-800">{latestSq.sqScore}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-600`}>
                        {getPsychLevel(latestSq.sqScore!).label}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 mt-1">Spiritual Quotient</p>
                    <p className="text-[8px] text-slate-300 uppercase mt-4">Tgl: {new Date(latestSq.date).toLocaleDateString('id-ID')}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-300 italic py-4">Kosong</p>
                )}
             </div>

             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM8 9h.01M16 9h.01M12 13c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5-1.5-3.5-3.5-3.5Z"/></svg>
                   EQ
                </h4>
                {latestEq ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-slate-800">{latestEq.eqScore}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-pink-50 text-pink-600`}>
                        {getPsychLevel(latestEq.eqScore!).label}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 mt-1">Emotional Quotient</p>
                    <p className="text-[8px] text-slate-300 uppercase mt-4">Tgl: {new Date(latestEq.date).toLocaleDateString('id-ID')}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-300 italic py-4">Kosong</p>
                )}
             </div>

             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ICONS.Adversity />
                   AQ
                </h4>
                {latestAq ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-slate-800">{latestAq.aqScore}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-cyan-50 text-cyan-600`}>
                        {getAqLabel(latestAq.aqScore!).label}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 mt-1">Adversity Quotient</p>
                    <p className="text-[8px] text-slate-300 uppercase mt-4">Tgl: {new Date(latestAq.date).toLocaleDateString('id-ID')}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-300 italic py-4">Kosong</p>
                )}
             </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6">Grafik Ketidakhadiran</h3>
            <div className="h-[250px] w-full">
              {hasAbsenceData ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={absenceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {absenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 italic border-2 border-dashed border-slate-50 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-20"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <p className="text-sm">Belum ada data ketidakhadiran</p>
                </div>
              )}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {absenceData.map((item) => (
                <div key={item.name} className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{item.name}</p>
                  <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[300px]">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M12 16h.01"/><path d="M12 12h.01"/><path d="M12 8h.01"/><path d="M12 4h.01"/><path d="M16 20h.01"/><path d="M16 16h.01"/><path d="M16 12h.01"/><path d="M16 8h.01"/><path d="M16 4h.01"/><path d="M8 20h.01"/><path d="M8 16h.01"/><path d="M8 12h.01"/><path d="M8 8h.01"/><path d="M8 4h.01"/></svg>
               Riwayat Layanan BK
            </h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
               {serviceHistory.length > 0 ? (
                 serviceHistory.map((item, idx) => (
                   <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-200 transition-all">
                      <div className="flex justify-between items-start mb-2">
                         <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                            item.nature === 'Guidance' ? 'bg-blue-50 text-blue-600' :
                            item.nature === 'Visit' ? 'bg-orange-50 text-orange-600' :
                            item.nature === 'Advocacy' ? 'bg-rose-50 text-rose-600' :
                            item.nature === 'Conference' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-600'
                         }`}>
                           {item.type}
                         </span>
                         <span className="text-[9px] font-black text-slate-400">{new Date(item.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mb-1 leading-relaxed">
                         {item.topic.length > 80 ? item.topic.substring(0, 80) + '...' : item.topic}
                      </h4>
                      <div className="flex items-center gap-3 mt-3">
                         <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black text-slate-500">K</div>
                            <span className="text-[9px] font-semibold text-slate-500">{item.counselor || 'Konselor'}</span>
                         </div>
                         {item.grade && (
                            <div className="flex items-center gap-1.5">
                               <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Kelas {item.grade}</span>
                            </div>
                         )}
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-12 text-center text-slate-300 italic">
                    <p className="text-sm font-medium">Belum ada riwayat layanan BK yang tercatat.</p>
                 </div>
               )}
            </div>
            
            <div className="mt-8 p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
               <h4 className="text-xs font-black text-slate-800 uppercase mb-3 tracking-widest">Pesan Privasi</h4>
               <p className="text-sm text-slate-500 italic">Riwayat ini bersifat rahasia dan hanya dapat diakses oleh konselor yang bertugas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
