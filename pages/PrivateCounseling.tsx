import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, Teacher, UserSession, PrivateCounselingSession, PrivateCounselingMessage } from '../types';
import { deleteFromCloud } from '../syncService';

interface PrivateCounselingProps {
  currentUser: UserSession;
  students: Student[];
  teachers: Teacher[];
  sessions: PrivateCounselingSession[];
  setSessions: React.Dispatch<React.SetStateAction<PrivateCounselingSession[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PrivateCounseling: React.FC<PrivateCounselingProps> = ({
  currentUser,
  students,
  teachers,
  sessions = [],
  setSessions,
  notify
}) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isNewSessionMode, setIsNewSessionMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isChronologyExpanded, setIsChronologyExpanded] = useState(true);
  
  // Counselor completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    outcome: '',
    followUp: ''
  });

  // Student new session form state
  const [newSessionForm, setNewSessionForm] = useState({
    counselorId: '',
    category: 'Pribadi' as PrivateCounselingSession['category'],
    chronology: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const isStudent = currentUser.role === 'student' || currentUser.role === 'ketua_murid';
  const isCounselor = currentUser.role === 'counselor';

  // Get current student profile if user is student
  const myStudentProfile = useMemo(() => {
    return students.find(s => s.id === currentUser.id);
  }, [students, currentUser]);

  // List of counselors for students to choose from
  const availableCounselors = useMemo(() => {
    return teachers.filter(t => t.role === 'Konselor');
  }, [teachers]);

  // Filter sessions based on user role
  const mySessions = useMemo(() => {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    if (isStudent) {
      // Students only see their own sessions
      return safeSessions.filter(s => s.studentId === currentUser.id);
    } else if (isCounselor) {
      // Counselors see sessions assigned to them, or all if no specific counselor
      return safeSessions.filter(s => s.counselorId === currentUser.id || !s.counselorId);
    }
    // Admin / other roles see all
    return safeSessions;
  }, [sessions, currentUser, isStudent, isCounselor]);

  const activeSession = useMemo(() => {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    return safeSessions.find(s => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  // Auto scroll to chat bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  // Set first session as active by default if available and in list view
  useEffect(() => {
    if (!activeSessionId && mySessions.length > 0 && !isNewSessionMode) {
      setActiveSessionId(mySessions[0].id);
    }
  }, [mySessions, activeSessionId, isNewSessionMode]);

  // Real-time polling for active chat
  useEffect(() => {
    if (!activeSessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        let userQuery = '';
        if (currentUser && currentUser.role && currentUser.id) {
          userQuery = `&userId=${currentUser.id}&role=${currentUser.role}`;
        }
        
        const response = await fetch(`/api/sync?table=star_privateCounseling${userQuery}`);
        if (response.ok) {
          const cloudData = await response.json();
          // Parse JSON strings back to objects (for messages array)
          const parsedData = cloudData.map((item: any) => {
            const newItem = { ...item };
            for (const key in newItem) {
              if (typeof newItem[key] === 'string' && (newItem[key].startsWith('[') || newItem[key].startsWith('{'))) {
                try {
                  newItem[key] = JSON.parse(newItem[key]);
                } catch (e) {}
              }
            }
            return newItem;
          });
          
          setSessions(prevSessions => {
            const safePrev = Array.isArray(prevSessions) ? [...prevSessions] : [];
            let changed = false;

            for (const serverSession of parsedData) {
              const localIndex = safePrev.findIndex(s => s.id === serverSession.id);
              if (localIndex >= 0) {
                const localSession = safePrev[localIndex];
                
                // MERGE MESSAGES to prevent overwriting other user's messages!
                const localMessages = Array.isArray(localSession.messages) ? localSession.messages : [];
                const serverMessages = Array.isArray(serverSession.messages) ? serverSession.messages : [];
                
                const msgMap = new Map();
                for (const msg of localMessages) msgMap.set(msg.id, msg);
                for (const msg of serverMessages) msgMap.set(msg.id, msg);
                
                const mergedMessages = Array.from(msgMap.values()).sort((a: any, b: any) => 
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                
                const mergedSession = { ...serverSession, messages: mergedMessages };
                
                if (JSON.stringify(localSession) !== JSON.stringify(mergedSession)) {
                  safePrev[localIndex] = mergedSession;
                  changed = true;
                }
              } else {
                safePrev.push(serverSession);
                changed = true;
              }
            }

            return changed ? safePrev : prevSessions;
          });
        }
      } catch (err) {
        // Ignore polling errors to prevent console spam
      }
    }, 5000); // 5 seconds interval

    return () => clearInterval(pollInterval);
  }, [activeSessionId, currentUser, setSessions]);

  const handleStartNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionForm.counselorId || !newSessionForm.chronology.trim()) {
      notify('Mohon lengkapi pilihan konselor dan kronologi masalah Anda.', 'error');
      return;
    }

    const selectedCounselor = teachers.find(t => t.id === newSessionForm.counselorId);
    if (!selectedCounselor) return;

    const newSession: PrivateCounselingSession = {
      id: `cs-${Date.now()}`,
      studentId: currentUser.id || 'anonymous-student',
      studentName: currentUser.name || 'Siswa',
      studentGrade: myStudentProfile?.grade || 'X',
      studentClass: myStudentProfile?.class || 'MIPA-1',
      counselorId: selectedCounselor.id,
      counselorName: selectedCounselor.name || 'Guru Konselor',
      category: newSessionForm.category,
      chronology: newSessionForm.chronology.trim(),
      status: 'Aktif',
      dateCreated: new Date().toISOString(),
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsNewSessionMode(false);
    setNewSessionForm({ counselorId: '', category: 'Pribadi', chronology: '' });
    notify('Sesi Konseling Private berhasil dibuat! Silakan mulai berdiskusi.', 'success');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId || !inputText.trim()) return;

    const newMessage: PrivateCounselingMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id || 'unknown',
      senderName: currentUser.name || 'Siswa/Konselor',
      senderRole: currentUser.role,
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setSessions(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...(Array.isArray(s.messages) ? s.messages : []), newMessage]
          };
        }
        return s;
      });
    });

    setInputText('');
  };

  const handleCompleteSession = () => {
    if (!completionForm.outcome.trim() || !completionForm.followUp.trim()) {
      notify('Mohon isi hasil layanan dan rencana tindak lanjut bimbingan.', 'error');
      return;
    }

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          status: 'Selesai',
          outcome: completionForm.outcome.trim(),
          followUp: completionForm.followUp.trim()
        };
      }
      return s;
    }));

    setShowCompleteModal(false);
    setCompletionForm({ outcome: '', followUp: '' });
    notify('Sesi Konseling Private telah selesai diarsipkan.', 'success');
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat sesi konseling private ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    setSessions(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter(s => s.id !== sessionId);
    });

    // Explicitly delete from cloud because Auto-Delete is disabled for this table
    deleteFromCloud('star_privateCounseling', sessionId).catch(console.error);

    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    notify('Sesi konseling private berhasil dihapus secara permanen.', 'success');
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  };

  return (
    <div className="h-[calc(100dvh-110px)] md:h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
      
      {/* SIDEBAR: Daftar Sesi */}
      <div className={`w-full md:w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex-col overflow-hidden shrink-0 ${activeSession || isNewSessionMode ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-50 shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Konseling Private</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sesi Chat Individu</p>
          </div>
          {isStudent && !isNewSessionMode && (
            <button
              onClick={() => {
                setIsNewSessionMode(true);
                setActiveSessionId(null);
              }}
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
              title="Buat Sesi Konseling Baru"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {mySessions.map(session => {
            const isSelected = session.id === activeSessionId;
            const displayName = isStudent ? (session.counselorName || 'Guru Konselor') : (session.studentName || 'Siswa');
            const displaySub = isStudent ? 'Guru Konselor' : `${session.studentGrade || 'X'} - ${session.studentClass || 'MIPA'}`;
            const isCompleted = session.status === 'Selesai';

            return (
              <button
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setIsNewSessionMode(false);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left relative ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {getInitials(displayName)}
                </div>
                <div className={`min-w-0 flex-1 ${(currentUser.role === 'super_admin' || currentUser.role === 'counselor') ? 'pr-6' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate pr-1">{displayName}</p>
                    {isCompleted ? (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        Selesai
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isSelected ? 'bg-indigo-400 text-white animate-pulse' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {displaySub} • {session.category}
                  </p>
                </div>
                {(currentUser.role === 'super_admin' || currentUser.role === 'counselor') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className={`absolute right-4 bottom-3 p-1.5 rounded-lg transition-colors z-10 ${
                      isSelected ? 'hover:bg-white/20 text-indigo-200 hover:text-white' : 'hover:bg-rose-50 text-slate-300 hover:text-rose-600'
                    }`}
                    title="Hapus Sesi"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                )}
              </button>
            );
          })}

          {mySessions.length === 0 && !isNewSessionMode && (
            <div className="p-8 text-center text-slate-300 italic flex flex-col items-center justify-center h-48">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada sesi</p>
            </div>
          )}
        </div>
      </div>

      {/* CORE WORK AREA */}
      <div className={`flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex-col overflow-hidden relative ${(activeSession || isNewSessionMode) ? 'flex' : 'hidden md:flex'}`}>
        
        {/* VIEW 1: Form Pembuatan Sesi Baru (Hanya Siswa) */}
        {isNewSessionMode && isStudent ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-12 custom-scrollbar flex flex-col justify-center max-w-2xl mx-auto w-full relative">
            <button onClick={() => setIsNewSessionMode(false)} className="absolute top-4 left-4 md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div className="space-y-6 mt-8 md:mt-0">
              <div className="text-center">
                <span className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Konsultasi Privat Aman
                </span>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-3">Mulai Sesi Konseling</h3>
                <p className="text-slate-400 text-xs mt-1 font-medium">Data keluhan Anda tersimpan aman dan dirahasiakan bersama konselor pilihan.</p>
              </div>

              <form onSubmit={handleStartNewSession} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Konselor Anda</label>
                    <select
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={newSessionForm.counselorId}
                      onChange={e => setNewSessionForm({ ...newSessionForm, counselorId: e.target.value })}
                    >
                      <option value="">-- Pilih Guru BK --</option>
                      {availableCounselors.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bidang Layanan</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                      value={newSessionForm.category}
                      onChange={e => setNewSessionForm({ ...newSessionForm, category: e.target.value as PrivateCounselingSession['category'] })}
                    >
                      <option value="Pribadi">Pribadi</option>
                      <option value="Sosial">Sosial</option>
                      <option value="Belajar">Belajar</option>
                      <option value="Karir">Karir</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1">
                    Kronologi Masalah Yang Dihadapi <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-6 text-sm font-bold h-44 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    placeholder="Ceritakan kejadiannya secara lengkap. Apa yang Anda rasakan? Sejak kapan hal ini terjadi? Kronologi awal ini sangat membantu konselor memahami kondisi Anda."
                    value={newSessionForm.chronology}
                    onChange={e => setNewSessionForm({ ...newSessionForm, chronology: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSessionMode(false);
                      if (mySessions.length > 0) setActiveSessionId(mySessions[0].id);
                    }}
                    className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 hover:bg-indigo-700 transition-all"
                  >
                    Kirim & Hubungi Konselor
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeSession ? (
          <>
            {/* VIEW 2: Chat Room Sesi Aktif / Selesai */}
            <header className="p-4 sm:p-6 border-b border-slate-50 flex flex-wrap gap-4 items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <button onClick={() => { setActiveSessionId(null); setIsNewSessionMode(false); }} className="md:hidden p-1.5 -ml-1 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-lg shrink-0">
                  {getInitials(isStudent ? (activeSession.counselorName || 'Guru Konselor') : (activeSession.studentName || 'Siswa'))}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 text-lg leading-tight italic truncate">
                      {isStudent ? (activeSession.counselorName || 'Guru Konselor') : (activeSession.studentName || 'Siswa')}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${activeSession.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 animate-pulse'}`}>
                      {activeSession.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                    {isStudent ? 'Guru Konselor Bimbingan' : `${activeSession.studentGrade || 'X'} - ${activeSession.studentClass || 'MIPA'} | Layanan ${activeSession.category || 'Pribadi'}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsChronologyExpanded(!isChronologyExpanded)}
                  className="px-3 sm:px-4 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span className="hidden sm:inline">{isChronologyExpanded ? 'Sembunyikan Kronologi' : 'Lihat Kronologi'}</span>
                </button>

                {isCounselor && activeSession.status === 'Aktif' && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="px-3 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-50"
                  >
                    Selesaikan <span className="hidden sm:inline">Sesi</span>
                  </button>
                )}

                {(currentUser.role === 'super_admin' || currentUser.role === 'counselor') && (
                  <button
                    onClick={() => handleDeleteSession(activeSession.id)}
                    className="p-2 sm:px-4 sm:py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    title="Hapus Sesi Konseling Ini"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                )}
              </div>
            </header>

            {/* Banner Kronologi Masalah (Bisa Collapsed / Expanded) */}
            {isChronologyExpanded && (
              <div className="bg-indigo-50 border-b border-indigo-100/60 p-6 shrink-0 transition-all duration-300 relative">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Kronologi Masalah Yang Dilaporkan Siswa:</p>
                <p className="text-xs text-slate-700 font-bold leading-relaxed whitespace-pre-wrap italic">
                  "{activeSession.chronology}"
                </p>
                <div className="absolute bottom-2 right-4">
                  <span className="text-[8px] font-bold text-indigo-400 uppercase">
                    Dilaporkan pada {new Date(activeSession.dateCreated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {/* Chat Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar bg-slate-50/20">
              
              {/* Pesan Sistem Awal */}
              <div className="flex flex-col items-center justify-center py-4 opacity-50">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Sesi Dimulai
                </span>
                <p className="text-[10px] text-slate-400 mt-2 text-center max-w-sm">
                  Komunikasi chat privat terenkripsi. Sesi diinisiasi berdasarkan kronologi masalah di atas.
                </p>
              </div>

              {(Array.isArray(activeSession.messages) ? activeSession.messages : []).map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                const isStaff = msg.senderRole === 'counselor';

                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`flex items-center gap-1.5 mb-1 px-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[9px] font-black text-slate-700 uppercase italic">{msg.senderName || 'Siswa'}</span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${isStaff ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                        {isStaff ? 'Guru BK' : 'Siswa'}
                      </span>
                    </div>
                    
                    <div className="max-w-[75%] group">
                      <div className={`p-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm ${
                        isMine 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : isStaff
                            ? 'bg-slate-800 text-white rounded-tl-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <p className={`text-[8px] font-bold mt-1 text-slate-300 uppercase tracking-widest ${isMine ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Tampilan Ringkasan Hasil (Jika Sesi Selesai) */}
              {activeSession.status === 'Selesai' && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl mt-6 space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span className="text-xs font-black uppercase tracking-widest">Sesi Konseling Telah Diarsipkan Secara Resmi</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-black text-[9px] text-emerald-600 uppercase tracking-wider">Hasil / Kesimpulan Layanan:</p>
                      <p className="text-slate-700 font-medium leading-relaxed">{activeSession.outcome || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-[9px] text-emerald-600 uppercase tracking-wider">Rencana Tindak Lanjut:</p>
                      <p className="text-slate-700 font-medium leading-relaxed">{activeSession.followUp || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form Kirim Pesan (Hanya Aktif jika Status belum Selesai) */}
            {activeSession.status === 'Aktif' ? (
              <form onSubmit={handleSendMessage} className="p-4 md:p-6 pb-6 md:pb-6 bg-white border-t border-slate-50 flex gap-3 shrink-0">
                <input
                  autoFocus
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Tulis pesan Anda..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-14 h-14 text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            ) : (
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-center shrink-0">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  Sesi ini telah diarsipkan dan dalam mode baca-saja.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-600 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Layanan Konseling Private</h3>
              <p className="text-slate-400 max-w-sm mt-2 font-medium">
                {isStudent 
                  ? 'Gunakan fitur ini untuk berkonsultasi secara privat dengan Guru BK terpilih. Mulai dengan membuat sesi baru.' 
                  : 'Silakan pilih sesi konsultasi siswa aktif dari sidebar untuk mulai berinteraksi.'}
              </p>
              {isStudent && (
                <button
                  onClick={() => setIsNewSessionMode(true)}
                  className="mt-6 px-8 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  Buat Sesi Konseling Baru
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Selesaikan Sesi (Hanya Konselor) */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 border border-slate-100 flex flex-col">
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Selesaikan Layanan Konseling</h4>
                <p className="text-slate-400 text-xs font-medium">Lengkapi berita acara dan tindak lanjut penanganan siswa.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Hasil Layanan (Outcome)</label>
                  <textarea
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold h-24 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="E.g. Siswa berjanji memperbaiki perilakunya..."
                    value={completionForm.outcome}
                    onChange={e => setCompletionForm({ ...completionForm, outcome: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Rencana Tindak Lanjut (Follow Up)</label>
                  <textarea
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold h-24 resize-none outline-none leading-relaxed focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="E.g. Pemantauan kehadiran mingguan..."
                    value={completionForm.followUp}
                    onChange={e => setCompletionForm({ ...completionForm, followUp: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCompleteSession}
                  className="flex-[2] py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-50 active:scale-95 transition-all"
                >
                  Simpan & Selesaikan Sesi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrivateCounseling;
