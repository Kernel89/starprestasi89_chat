
import React, { useState, useMemo, useEffect } from 'react';
import { UserSession, Student, SatisfactionFeedback, Assignment, Rombel } from '../types';

interface StudentSatisfactionProps {
  currentUser: UserSession;
  students: Student[];
  rombels: Rombel[];
  feedbacks: SatisfactionFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<SatisfactionFeedback[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  assignments?: Assignment[];
}

const SCHOOL_CATEGORIES = [
  "Kurikulum",
  "Kesiswaan",
  "Humas",
  "Sarana dan Pra Sarana",
  "Tata Usaha",
  "Keamanan Sekolah"
];

const BK_CATEGORIES = [
  "Layanan Umum",
  "Konseling Pribadi",
  "Bimbingan / Konseling Kelompok",
  "Bimbingan Karir",
  "Sikap Konselor"
];

const StudentSatisfaction: React.FC<StudentSatisfactionProps> = ({
  currentUser, students, rombels, feedbacks, setFeedbacks, notify, assignments = []
}) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const [serviceSource, setServiceSource] = useState<'BK' | 'Sekolah' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myProfile = useMemo(() => students.find(s => s.id === currentUser.id), [students, currentUser]);

  const myRombel = useMemo(() => {
    if (!myProfile || !rombels) return null;
    
    const sGrade = myProfile.grade.trim().toUpperCase();
    const normalize = (str: string) => {
      if (!str) return '';
      return str.toUpperCase()
        .replace(new RegExp(`^${sGrade}\\s*`, 'i'), '')
        .replace(/\s+/g, ' ')
        .replace(/\b0+(\d)/g, '$1')
        .trim();
    };

    return rombels.find(r =>
      r.grade.trim().toUpperCase() === sGrade &&
      normalize(myProfile.class) === normalize(r.name)
    );
  }, [myProfile, rombels]);

  // Logika: Cek apakah ada penugasan kepuasan aktif untuk siswa ini atau kelasnya
  const activeAssignments = useMemo(() => {
    return assignments.filter(a => {
      const isSatisfaction = a.type === 'Satisfaction' && a.status === 'Aktif';
      if (!isSatisfaction) return false;

      const isTargetIndividu = a.targetType === 'Individu' && a.targetId === currentUser.id;
      const isTargetRombel = a.targetType === 'Rombel' && myRombel && a.targetId === myRombel.id;

      return isTargetIndividu || isTargetRombel;
    });
  }, [assignments, currentUser.id, myRombel]);

  const hasBkAssignment = useMemo(() => activeAssignments.some(a => a.satisfactionType === 'BK'), [activeAssignments]);
  const hasSchoolAssignment = useMemo(() => activeAssignments.some(a => a.satisfactionType === 'Sekolah'), [activeAssignments]);

  // Default tab selection
  useEffect(() => {
    if (serviceSource === null) {
      if (hasBkAssignment) setServiceSource('BK');
      else if (hasSchoolAssignment) setServiceSource('Sekolah');
    }
  }, [hasBkAssignment, hasSchoolAssignment, serviceSource]);

  const [bkRatings, setBkRatings] = useState<Record<string, number>>({});
  const [bkComment, setBkComment] = useState('');
  const [schoolRatings, setSchoolRatings] = useState<Record<string, number>>({});
  const [schoolComment, setSchoolComment] = useState('');

  const myFeedbacks = useMemo(() => feedbacks.filter(f => f.studentId === currentUser.id), [feedbacks, currentUser]);

  const hasSubmittedCurrent = useMemo(() => {
    if (!serviceSource) return false;
    return myFeedbacks.some(f => f.serviceSource === serviceSource);
  }, [myFeedbacks, serviceSource]);

  const hasSubmittedBK = useMemo(() => myFeedbacks.some(f => f.serviceSource === 'BK'), [myFeedbacks]);
  const hasSubmittedSekolah = useMemo(() => myFeedbacks.some(f => f.serviceSource === 'Sekolah'), [myFeedbacks]);

  const isBkFormValid = useMemo(() => BK_CATEGORIES.every(cat => (bkRatings[cat] || 0) > 0), [bkRatings]);
  const isSchoolFormValid = useMemo(() => SCHOOL_CATEGORIES.every(cat => (schoolRatings[cat] || 0) > 0), [schoolRatings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceSource || hasSubmittedCurrent) return;

    setIsSubmitting(true);
    const commonData = {
      studentId: currentUser.id!,
      studentName: getInitials(currentUser.name),
      studentClass: '-',
      date: new Date().toISOString()
    };

    setTimeout(() => {
      if (serviceSource === 'BK') {
        const bkFeedbacks: SatisfactionFeedback[] = BK_CATEGORIES.map((cat, idx) => ({
          ...commonData,
          id: `fb-bk-${Date.now()}-${idx}`,
          rating: bkRatings[cat],
          comment: idx === 0 ? bkComment.trim() : '',
          category: cat,
          serviceSource: 'BK'
        }));
        setFeedbacks(prev => [...bkFeedbacks, ...prev]);
        setBkRatings({});
        setBkComment('');
      } else {
        const schoolFeedbacks: SatisfactionFeedback[] = SCHOOL_CATEGORIES.map((cat, idx) => ({
          ...commonData,
          id: `fb-sch-${Date.now()}-${idx}`,
          rating: schoolRatings[cat],
          comment: idx === 0 ? schoolComment.trim() : '',
          category: cat,
          serviceSource: 'Sekolah'
        }));
        setFeedbacks(prev => [...schoolFeedbacks, ...prev]);
        setSchoolRatings({});
        setSchoolComment('');
      }

      setIsSubmitting(false);
      notify(`Terima kasih! Penilaian ${serviceSource} Anda telah berhasil terkirim.`, "success");
    }, 800);
  };

  const getEmoji = (r: number) => {
    if (r >= 5) return '😍';
    if (r === 4) return '😊';
    if (r === 3) return '😐';
    if (r === 2) return '🙁';
    return '😡';
  };

  const renderStars = (currentRating: number, onRate: (r: number) => void, size: number = 32) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={hasSubmittedCurrent}
          onClick={() => onRate(star)}
          className={`transition-all ${currentRating >= star ? 'text-amber-400 scale-110 drop-shadow-sm' : 'text-white/20 hover:text-white/40'} ${hasSubmittedCurrent ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">E-Kepuasan Layanan</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Sampaikan masukan Anda demi peningkatan kualitas pelayanan sekolah.</p>
        </div>

        {(hasBkAssignment || hasSchoolAssignment || hasSubmittedBK || hasSubmittedSekolah) && (
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            {(hasBkAssignment || hasSubmittedBK) && (
              <button onClick={() => setServiceSource('BK')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${serviceSource === 'BK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                Layanan BK
                {hasSubmittedBK && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            )}
            {(hasSchoolAssignment || hasSubmittedSekolah) && (
              <button onClick={() => setServiceSource('Sekolah')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${serviceSource === 'Sekolah' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                Layanan Sekolah
                {hasSubmittedSekolah && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            )}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className={`lg:col-span-7 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 ${serviceSource === 'BK' ? 'bg-indigo-900' : serviceSource === 'Sekolah' ? 'bg-emerald-900' : 'bg-slate-800'}`}>
          <div className="absolute top-0 right-0 p-12 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg></div>

          <div className="relative z-10 space-y-8 flex-1">
            {serviceSource ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black italic tracking-tighter mb-1">Rating {serviceSource === 'BK' ? 'Layanan BK' : 'Layanan Sekolah'}</h3>
                    <p className="opacity-70 text-xs font-bold uppercase tracking-widest">
                      Masukan Anda sepenuhnya bersifat rahasia dan profesional.
                    </p>
                  </div>
                </div>

                {hasSubmittedCurrent ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-xl backdrop-blur-md border border-white/10 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">Penilaian Selesai</h4>
                    <p className="text-white/60 text-sm max-w-xs font-medium leading-relaxed">
                      Terima kasih atas partisipasi Anda dalam meningkatkan mutu layanan sekolah melalui sistem STARS PRESTASI.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {(serviceSource === 'BK' ? BK_CATEGORIES : SCHOOL_CATEGORIES).map((cat) => (
                          <div key={cat} className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all ${(serviceSource === 'BK' ? bkRatings[cat] : schoolRatings[cat])
                              ? 'bg-white/10 border-white/20'
                              : 'bg-white/5 border-white/5 opacity-60'
                            }`}>
                            <span className="text-xs font-black uppercase tracking-widest mb-3 md:mb-0">{cat}</span>
                            {renderStars(
                              (serviceSource === 'BK' ? bkRatings[cat] : schoolRatings[cat]) || 0,
                              (r) => serviceSource === 'BK'
                                ? setBkRatings({ ...bkRatings, [cat]: r })
                                : setSchoolRatings({ ...schoolRatings, [cat]: r }),
                              24
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60">Saran & Masukan Konstruktif</label>
                        <textarea
                          className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-medium placeholder-white/30 outline-none focus:bg-white/20 h-24 resize-none transition-all"
                          placeholder="Apa hal yang perlu kami tingkatkan?..."
                          value={serviceSource === 'BK' ? bkComment : schoolComment}
                          onChange={e => serviceSource === 'BK' ? setBkComment(e.target.value) : setSchoolComment(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || (serviceSource === 'BK' ? !isBkFormValid : !isSchoolFormValid)}
                      className={`w-full py-5 bg-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${serviceSource === 'BK' ? 'text-indigo-900 hover:bg-indigo-50' : 'text-emerald-900 hover:bg-emerald-50'}`}
                    >
                      {isSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-30"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Akses Terkunci</h3>
                <p className="text-white/40 text-sm max-w-sm font-medium leading-relaxed px-6">
                  Halaman penilaian kepuasan saat ini tidak aktif. Konselor akan membuka akses ini pada periode evaluasi layanan.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Riwayat Masukan Saya</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">{myFeedbacks.length} Entri</span>
          </div>

          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
            {myFeedbacks.length > 0 ? (
              myFeedbacks.map(f => (
                <div key={f.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all space-y-4 ${f.serviceSource === 'Sekolah' ? 'border-emerald-100' : 'border-indigo-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getEmoji(f.rating)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${f.serviceSource === 'BK' ? 'text-indigo-600' : 'text-emerald-600'}`}>{f.serviceSource}</p>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px]">{f.category}</p>
                        </div>
                        <div className="flex gap-0.5 text-amber-400 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} width="10" height="10" fill={f.rating > i ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(f.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {f.comment && (
                    <p className="text-xs text-slate-600 italic font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      "{f.comment}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-4">Belum ada riwayat masukan yang tersimpan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSatisfaction;
