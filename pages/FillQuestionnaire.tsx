
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Assignment, GuidanceMaterial, QuestionnaireType, QuestionnaireSubmission, Student, Rombel } from '../types';

interface FillQuestionnaireProps {
  assignments: Assignment[];
  materials: GuidanceMaterial[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  currentUserId?: string;
  submissions: QuestionnaireSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  eqSubmissions?: QuestionnaireSubmission[];
  setEqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  aqSubmissions?: QuestionnaireSubmission[];
  setAqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  sqSubmissions?: QuestionnaireSubmission[];
  setSqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  students?: Student[];
  rombels?: Rombel[];
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

const FillQuestionnaire: React.FC<FillQuestionnaireProps> = ({ 
  assignments, materials, notify, currentUserId, 
  submissions, setSubmissions, 
  eqSubmissions, setEqSubmissions,
  aqSubmissions, setAqSubmissions,
  sqSubmissions, setSqSubmissions,
  students, rombels 
}) => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  
  const assignment = useMemo(() => assignments.find(a => a.id === assignmentId), [assignments, assignmentId]);
  
  // SMART RECOVERY LOGIC:
  // Jika materi tidak ditemukan berdasarkan ID, cari berdasarkan Tipe Soal (MBTI, SQ, EQ, dll)
  // Ini mencegah error "Materi belum diatur" jika link ID terputus.
  const material = useMemo(() => {
    if (!assignment) return undefined;
    
    // 1. Coba cari berdasarkan ID yang ditautkan langsung di Tugas
    let found = materials.find(m => m.id === assignment.materialId);

    // 2. Jika tidak ada ID tertaut, atau materi tertaut TIDAK memiliki instrumen aktif,
    //    Cari materi di repository yang memiliki tipe yang sama DAN instrumennya AKTIF.
    if (!found || !found.isInstrumentActive) {
       const activeInstrument = materials.find(m => 
          m.qType === assignment.type && 
          m.isInstrumentActive === true
       );
       if (activeInstrument) found = activeInstrument;
    }

    // 3. Fallback terakhir: Cari materi pertama dengan tipe yang sama walau tidak aktif
    if (!found && ['MBTI', 'SQ', 'EQ', 'AQ'].includes(assignment.type)) {
       found = materials.find(m => m.qType === assignment.type);
    }

    return found;
  }, [materials, assignment]);

  const [responses, setResponses] = useState<Record<number, number | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [mbtiCode, setMbtiCode] = useState('');
  const [mbtiBreakdown, setMbtiBreakdown] = useState<any>(null);

  // --- ANTISIPASI INSTRUMEN HILANG / TIDAK AKTIF ---
  if (!assignment) {
      return (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 className="text-xl font-black text-slate-700">Tugas Tidak Ditemukan</h3>
          <p className="text-slate-400 text-sm mt-2 text-center max-w-md">
            Penugasan ini mungkin telah dihapus, kadaluwarsa, atau Anda tidak memiliki akses ke halaman ini.
          </p>
          <div className="flex gap-4 mt-6">
              <button onClick={() => navigate('/assignments')} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Kembali</button>
          </div>
        </div>
      );
  }

  if (!material || !material.isQuestionnaire) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200">
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3 className="text-xl font-black text-slate-700">Instrumen Soal Belum Ditautkan</h3>
        <p className="text-slate-400 text-sm mt-2 text-center max-w-md">
            Tugas "{assignment.title}" belum memiliki materi soal yang valid di database.
        </p>
        <div className="flex gap-4 mt-6">
            <button onClick={() => navigate('/assignments')} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Kembali</button>
            <button onClick={() => navigate('/chat')} className="px-6 py-3 bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg active:scale-95">Lapor Guru BK</button>
        </div>
      </div>
    );
  }

  const qType = material.qType || 'Likert';
  const itemCount = material.qItemCount || 0;
  const optionCount = material.qOptionCount || 5;
  const adjectives = material.qAdjectives || [];
  const reverseItems = material.qReverseItems || [];
  const mbtiOptions = material.qMbtiOptions || [];

  // FIX: Logika Items agar MBTI tetap muncul walau qItems kosong
  const items = useMemo(() => {
    // Jika tipe MBTI, paksa gunakan panjang dari mbtiOptions
    if (qType === 'MBTI') {
        const len = mbtiOptions.length > 0 ? mbtiOptions.length : itemCount;
        return new Array(len).fill(""); 
    }
    // Jika tipe lain, cek qItems atau fallback ke itemCount
    if (material.qItems && material.qItems.length > 0) {
        return material.qItems;
    }
    return new Array(itemCount).fill("");
  }, [qType, mbtiOptions, material.qItems, itemCount]);

  const progressPercent = Math.round((Object.keys(responses).length / items.length) * 100);

  const calculateMbti = () => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    
    Object.keys(responses).forEach(key => {
        const idx = parseInt(key) - 1;
        const choice = responses[parseInt(key)]; 
        
        if (mbtiOptions[idx]) {
            const dimension = mbtiOptions[idx].dimension; 
            
            if (choice === 1) {
                scores[dimension[0] as keyof typeof scores]++;
            } else {
                scores[dimension[1] as keyof typeof scores]++;
            }
        }
    });

    const totalEI = scores.E + scores.I || 1;
    const totalSN = scores.S + scores.N || 1;
    const totalTF = scores.T + scores.F || 1;
    const totalJP = scores.J + scores.P || 1;

    const breakdown = {
        EI: { type: scores.E >= scores.I ? 'Extraversion' : 'Introversion', pct: Math.round(Math.max(scores.E, scores.I) / totalEI * 100) },
        SN: { type: scores.S >= scores.N ? 'Sensing' : 'Intuition', pct: Math.round(Math.max(scores.S, scores.N) / totalSN * 100) },
        TF: { type: scores.T >= scores.F ? 'Thinking' : 'Feeling', pct: Math.round(Math.max(scores.T, scores.F) / totalTF * 100) },
        JP: { type: scores.J >= scores.P ? 'Judging' : 'Perceiving', pct: Math.round(Math.max(scores.J, scores.P) / totalJP * 100) }
    };

    setMbtiBreakdown(breakdown);

    const res = [
        scores.E >= scores.I ? 'E' : 'I',
        scores.S >= scores.N ? 'S' : 'N',
        scores.T >= scores.F ? 'T' : 'F',
        scores.J >= scores.P ? 'J' : 'P'
    ].join('');
    
    return res;
  };

  const calculateFinalScore = () => {
    if (qType === 'Essay' || qType === 'MBTI') return 0;

    let total = 0;
    Object.keys(responses).forEach(key => {
        const qIdx = parseInt(key) - 1;
        const rawValue = responses[parseInt(key)];
        
        if (typeof rawValue === 'number') {
            if (reverseItems.includes(qIdx)) {
                const reversedValue = (1 + optionCount) - rawValue;
                total += reversedValue;
            } else {
                total += rawValue;
            }
        }
    });
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    const answeredCount = Object.keys(responses).filter(k => {
        const val = responses[parseInt(k)];
        return val !== undefined && val !== null && (typeof val === 'string' ? val.trim() !== '' : true);
    }).length;

    if (answeredCount < items.length) {
      notify("Mohon lengkapi seluruh jawaban sebelum mengirim.", "error");
      return;
    }
    
    setIsSubmitting(true);
    
    let resultMbti = '';
    let resultScore = 0;

    if (qType === 'MBTI') {
        resultMbti = calculateMbti();
        setMbtiCode(resultMbti);
    } else {
        resultScore = calculateFinalScore();
        setCalculatedScore(resultScore);
    }

    const submission: QuestionnaireSubmission = {
        id: `sub-${qType || assignment.type || 'GEN'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        assignmentId: assignment.id,
        studentId: currentUserId,
        date: new Date().toISOString(),
        responses: responses,
        totalScore: resultScore,
        mbtiResult: resultMbti,
        // Map scores based on Assignment Type OR Material Type
        // Allows Likert-based SQ/EQ/AQ materials to be stored correctly
        sqScore: (qType === 'SQ' || assignment.type === 'SQ') ? resultScore : undefined,
        eqScore: (qType === 'EQ' || assignment.type === 'EQ') ? resultScore : undefined,
        aqScore: (qType === 'AQ' || assignment.type === 'AQ') ? resultScore : undefined
    };

    if (qType === 'EQ' || assignment.type === 'EQ') {
        if (setEqSubmissions) setEqSubmissions(prev => [submission, ...prev]);
    } else if (qType === 'AQ' || assignment.type === 'AQ') {
        if (setAqSubmissions) setAqSubmissions(prev => [submission, ...prev]);
    } else if (qType === 'SQ' || assignment.type === 'SQ') {
        if (setSqSubmissions) setSqSubmissions(prev => [submission, ...prev]);
    } else {
        setSubmissions(prev => [submission, ...prev]);
    }

    setTimeout(() => {
        setIsSubmitting(false);
        setShowResult(true);
        notify(`Angket "${material.qTitle}" berhasil diproses!`, "success");
    }, 1200);
  };

  const renderMbti = (qNum: number, idx: number) => {
    const opt = mbtiOptions[idx];
    if (!opt) return <div className="text-rose-500 font-bold text-xs">Error: Opsi soal tidak ditemukan.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
            <button 
                type="button"
                onClick={() => setResponses({...responses, [qNum]: 1})}
                className={`p-6 md:p-8 rounded-[2rem] border-4 text-left transition-all relative overflow-hidden group flex flex-col justify-center min-h-[140px] ${responses[qNum] === 1 ? 'bg-teal-600 border-teal-400 shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-teal-200'}`}
            >
                <div className={`text-xs md:text-sm font-bold leading-relaxed mb-4 ${responses[qNum] === 1 ? 'text-white' : 'text-slate-700'}`}>"{opt.a}"</div>
                <div className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-auto ${responses[qNum] === 1 ? 'text-teal-200' : 'text-slate-400'}`}>Pilihan A</div>
                {responses[qNum] === 1 && <div className="absolute top-0 right-0 p-4"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-white opacity-50"><path d="M20 6L9 17l-5-5"/></svg></div>}
            </button>
            <button 
                type="button"
                onClick={() => setResponses({...responses, [qNum]: 2})}
                className={`p-6 md:p-8 rounded-[2rem] border-4 text-left transition-all relative overflow-hidden group flex flex-col justify-center min-h-[140px] ${responses[qNum] === 2 ? 'bg-violet-600 border-violet-400 shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-violet-200'}`}
            >
                <div className={`text-xs md:text-sm font-bold leading-relaxed mb-4 ${responses[qNum] === 2 ? 'text-white' : 'text-slate-700'}`}>"{opt.b}"</div>
                <div className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-auto ${responses[qNum] === 2 ? 'text-violet-200' : 'text-slate-400'}`}>Pilihan B</div>
                {responses[qNum] === 2 && <div className="absolute top-0 right-0 p-4"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-white opacity-50"><path d="M20 6L9 17l-5-5"/></svg></div>}
            </button>
        </div>
    );
  };

  const renderLikert = (qNum: number) => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {[ { l: 'Sangat Sering', v: 5, c: 'emerald' }, { l: 'Sering', v: 4, c: 'blue' }, { l: 'Kadang-kadang', v: 3, c: 'slate' }, { l: 'Jarang', v: 2, c: 'orange' }, { l: 'Sangat Jarang', v: 1, c: 'rose' } ].slice(0, optionCount).map(opt => (
            <label key={opt.v} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${responses[qNum] === opt.v ? `bg-${opt.c}-50 border-${opt.c}-500 shadow-md ring-2 ring-${opt.c}-100` : 'bg-white border-slate-100 hover:border-teal-100'}`}>
                <input type="radio" className="hidden" name={`q-${qNum}`} checked={responses[qNum] === opt.v} onChange={() => setResponses({...responses, [qNum]: opt.v})} />
                <span className={`text-[9px] font-black uppercase mb-1 ${responses[qNum] === opt.v ? `text-${opt.c}-700` : 'text-slate-400'}`}>{opt.l}</span>
                <span className={`text-xl font-black ${responses[qNum] === opt.v ? `text-${opt.c}-600` : 'text-slate-200'}`}>{opt.v}</span>
            </label>
        ))}
    </div>
  );

  const renderGuttman = (qNum: number) => (
    <div className="flex flex-wrap gap-4 mt-4">
        {[ { label: 'YA / BENAR', val: 1, color: 'emerald' }, { label: 'TIDAK / SALAH', val: 0, color: 'rose' } ].map(opt => (
            <label key={opt.val} className={`px-10 py-4 rounded-2xl border-2 cursor-pointer transition-all flex-1 text-center font-black uppercase text-xs tracking-widest ${responses[qNum] === opt.val ? `bg-${opt.color}-600 border-${opt.color}-600 text-white shadow-xl shadow-${opt.color}-100` : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" name={`q-${qNum}`} checked={responses[qNum] === opt.val} onChange={() => setResponses({...responses, [qNum]: opt.val})} />
                {opt.label}
            </label>
        ))}
    </div>
  );

  const renderRating = (qNum: number) => (
    <div className="flex flex-wrap gap-2 mt-4">
        {Array.from({ length: optionCount }, (_, i) => i + 1).map(val => (
            <button key={val} type="button" onClick={() => setResponses({...responses, [qNum]: val})} className={`w-12 h-12 rounded-xl border-2 font-black transition-all ${responses[qNum] === val ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-100' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600'}`}>{val}</button>
        ))}
    </div>
  );

  const renderSemantic = (qNum: number, index: number) => (
    <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center px-2">
            <span className="text-xs font-black uppercase text-teal-600 italic">{adjectives[index]?.left || 'Pasif'}</span>
            <span className="text-xs font-black uppercase text-rose-600 italic">{adjectives[index]?.right || 'Aktif'}</span>
        </div>
        <div className="flex items-center justify-between gap-1 md:gap-4 bg-slate-50 p-4 rounded-2xl border">
            {Array.from({ length: optionCount }, (_, i) => i + 1).map(val => (
                <label key={val} className="flex-1 flex flex-col items-center gap-2 cursor-pointer group">
                    <input type="radio" className="hidden" name={`q-${qNum}`} checked={responses[qNum] === val} onChange={() => setResponses({...responses, [qNum]: val})} />
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${responses[qNum] === val ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-md' : 'bg-white border-slate-200 text-slate-300 group-hover:border-slate-400'}`}>
                        {val}
                    </div>
                </label>
            ))}
        </div>
    </div>
  );

  const renderEssay = (qNum: number) => (
    <div className="mt-4">
        <textarea 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-100 focus:bg-white focus:border-teal-200 transition-all min-h-[120px] resize-y"
            placeholder="Tuliskan jawaban Anda di sini secara lengkap..."
            value={responses[qNum] || ''}
            onChange={e => setResponses({...responses, [qNum]: e.target.value})}
        />
    </div>
  );

  // Results screen after submission
  if (showResult) {
    const isSQ = qType === 'SQ' || assignment.type === 'SQ';
    const isEQ = qType === 'EQ' || assignment.type === 'EQ';
    const isAQ = qType === 'AQ' || assignment.type === 'AQ';
    const level = calculatedScore >= 148 ? 'Tinggi' : calculatedScore >= 94 ? 'Moderat' : 'Rendah';

    return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-100 p-6 animate-in zoom-in-95 duration-500 overflow-y-auto">
            <div className="bg-white rounded-[3rem] border border-white shadow-2xl p-10 md:p-16 max-w-3xl w-full text-center space-y-8 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl ${isSQ ? 'bg-emerald-50 text-emerald-600' : isEQ ? 'bg-pink-50 text-pink-600' : isAQ ? 'bg-teal-50 text-teal-600' : 'bg-teal-50 text-teal-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Asesmen Selesai</h3>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Data jawaban Anda telah berhasil diarsipkan di sistem BK.</p>
                </div>
                
                {qType === 'MBTI' ? (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-teal-600 to-violet-700 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Tipe Kepribadian Anda</p>
                            <h4 className="text-7xl font-black tracking-tighter italic mb-4">{mbtiCode}</h4>
                            <div className="w-12 h-1.5 bg-white/20 mx-auto rounded-full mb-6"></div>
                            <p className="text-base font-bold italic leading-relaxed px-4">{MBTI_DESCRIPTIONS[mbtiCode] || 'Kepribadian unik yang kompleks.'}</p>
                        </div>
                        
                        {/* MBTI Breakdown */}
                        {mbtiBreakdown && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(mbtiBreakdown).map(([key, val]: any) => (
                                    <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{key}</div>
                                        <div className="text-xl font-black text-slate-800">{val.type.charAt(0)}</div>
                                        <div className="text-[10px] font-bold text-teal-600">{val.pct}% {val.type}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : isSQ ? (
                    <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v18M8 6l8 12M16 6l-8 12"/></svg></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Indeks Kecerdasan Spiritual</p>
                        <h4 className="text-6xl font-black tracking-tighter italic mb-4">{calculatedScore}</h4>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block ${level === 'Tinggi' ? 'bg-white text-emerald-600' : level === 'Moderat' ? 'bg-emerald-400 text-white' : 'bg-emerald-800 text-white'}`}>
                            Kategori: {level}
                        </div>
                    </div>
                ) : isEQ ? (
                  <div className="bg-pink-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM8 9h.01M16 9h.01M12 13c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5-1.5-3.5-3.5-1.5-3.5-3.5-1.5-3.5-3.5-1.5-3.5-3.5-1.5-3.5-3.5-1.5-3.5-3.5-3.5Z"/></svg></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Indeks Kecerdasan Emosional</p>
                      <h4 className="text-6xl font-black tracking-tighter italic mb-4">{calculatedScore}</h4>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block ${level === 'Tinggi' ? 'bg-white text-pink-600' : level === 'Moderat' ? 'bg-pink-400 text-white' : 'bg-pink-800 text-white'}`}>
                          Kategori: {level}
                      </div>
                  </div>
                ) : isAQ ? (
                    <div className="bg-teal-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Adversity Quotient (Daya Juang)</p>
                        <h4 className="text-6xl font-black tracking-tighter italic mb-4">{calculatedScore}</h4>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block ${level === 'Tinggi' ? 'bg-white text-teal-600' : level === 'Moderat' ? 'bg-teal-400 text-white' : 'bg-teal-800 text-white'}`}>
                            Kategori: {calculatedScore >= 148 ? 'Climber' : calculatedScore >= 94 ? 'Camper' : 'Quitter'}
                        </div>
                    </div>
                  ) : qType !== 'Essay' ? (
                    <div className="bg-teal-600 rounded-[2rem] p-8 text-white shadow-xl shadow-teal-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Total Skor Anda</p>
                        <h4 className="text-6xl font-black tracking-tighter italic">{calculatedScore}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-4 bg-white/20 py-1 px-4 rounded-full inline-block">Manual Calculation</p>
                    </div>
                ) : (
                    <div className="bg-teal-50 p-8 rounded-[2rem] border border-teal-100 text-teal-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <p className="text-xs font-black uppercase tracking-widest">Respon Kualitatif (Esai)</p>
                        <p className="text-[10px] font-medium mt-2 leading-relaxed italic opacity-80">Jawaban esai Anda tidak dikonversi menjadi skor angka otomatis. Konselor akan meninjau jawaban Anda secara mendalam.</p>
                    </div>
                )}

                <div className="space-y-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{['Essay', 'MBTI', 'SQ', 'EQ', 'AQ'].includes(qType) || ['SQ', 'EQ', 'AQ'].includes(assignment.type) ? 'Catatan Konselor:' : 'Interpretasi Skor:'}</h5>
                    <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{material.qCalculation || 'Respon Anda akan membantu pengembangan layanan bimbingan selanjutnya.'}"</p>
                </div>

                <button onClick={() => navigate('/assignments')} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl">Selesai & Kembali</button>
            </div>
        </div>
    );
  }

  // Questionnaire form rendering
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm gap-4">
        <div>
          <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 inline-block">{material.category}</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">{material.qTitle}</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Tugas: {assignment.title}</p>
        </div>
        <div className="flex flex-col items-center md:items-end">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progres Pengisian</p>
          <div className="flex items-center gap-3">
             <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div className="h-full bg-teal-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
             </div>
             <span className="text-xl font-black text-teal-600">{progressPercent}%</span>
          </div>
        </div>
      </header>

      <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 text-amber-800 text-xs font-bold italic leading-relaxed">
         "Instruksi: {material.task || 'Isilah angket ini sesuai dengan kondisi yang Anda alami secara jujur.'}"
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {items.map((itemText, idx) => {
          const qNum = idx + 1;
          return (
            <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 transition-all hover:shadow-md animate-in slide-in-from-bottom-2">
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm shrink-0 border border-teal-100 shadow-inner">{qNum}</div>
                 <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed pt-1">{itemText || (qType === 'MBTI' ? 'Pilihlah salah satu yang paling menggambarkan diri Anda:' : '')}</p>
              </div>
              
              <div className="ml-0 md:ml-14">
                  {qType === 'MBTI' && renderMbti(qNum, idx)}
                  {(qType === 'Likert' || qType === 'SQ' || qType === 'EQ' || qType === 'AQ') && renderLikert(qNum)}
                  {qType === 'Guttman' && renderGuttman(qNum)}
                  {qType === 'Rating' && renderRating(qNum)}
                  {qType === 'Semantic' && renderSemantic(qNum, idx)}
                  {qType === 'Essay' && renderEssay(qNum)}
              </div>
            </div>
          );
        })}

        <div className="pt-10 flex flex-col md:flex-row gap-4 items-center justify-center border-t border-slate-100">
           <button type="button" onClick={() => navigate('/assignments')} className="w-full md:w-auto px-12 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
           <button 
             type="submit" 
             disabled={isSubmitting}
             className="w-full md:w-80 py-5 bg-teal-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-teal-100 hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSubmitting ? 'Sedang Mengarsipkan...' : 'Kirim Jawaban Anda'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default FillQuestionnaire;
