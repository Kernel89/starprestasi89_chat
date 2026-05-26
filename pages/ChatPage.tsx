import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppUser, Student, ChatMessage, UserSession, UserRole } from '../types';

interface ChatPageProps {
  currentUser: UserSession;
  appUsers: AppUser[];
  students: Student[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'ANGKATAN' | 'KONSELING';
  grade?: string;
  counselorId?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, appUsers, students, messages, setMessages }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isStudent = currentUser.role === 'student' || currentUser.role === 'ketua_murid';
  const myProfile = students.find(s => s.id === currentUser.id);

  // Definisi Ruang Diskusi
  const availableRooms = useMemo(() => {
    const rooms: ChatRoom[] = [];
    const counselorUsers = appUsers.filter(u => u.role === 'counselor');

    // 1. Forum Angkatan (X, XI, XII)
    const grades = ['X', 'XI', 'XII'];
    grades.forEach(g => {
      // Jika siswa, hanya tampilkan angkatannya sendiri
      if (isStudent && myProfile?.grade !== g) return;
      
      rooms.push({
        id: `room-grade-${g}`,
        name: `Forum Angkatan ${g}`,
        description: `Ruang diskusi terbuka untuk seluruh siswa kelas ${g} dan Guru Konselor.`,
        type: 'ANGKATAN',
        grade: g
      });
    });

    // 2. Ruang Konsultasi Bersama (Per Konselor)
    counselorUsers.forEach(c => {
      rooms.push({
        id: `room-counselor-${c.id}`,
        name: `Konsultasi: ${c.name}`,
        description: `Ruang tanya jawab dan bimbingan bersama ${c.name}.`,
        type: 'KONSELING',
        counselorId: c.id
      });
    });

    return rooms;
  }, [appUsers, isStudent, myProfile]);

  // Set default room jika belum ada yang terpilih
  useEffect(() => {
    if (!selectedRoomId && availableRooms.length > 0) {
      setSelectedRoomId(availableRooms[0].id);
    }
  }, [availableRooms, selectedRoomId]);

  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);

  // Filter pesan berdasarkan ID Ruang (receiverId bertindak sebagai roomId)
  const activeMessages = useMemo(() => {
    if (!selectedRoomId) return [];
    return messages.filter(m => m.receiverId === selectedRoomId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedRoomId]);

  const getSenderDisplay = (senderId: string) => {
    const staff = appUsers.find(u => u.id === senderId);
    if (staff) return { name: staff.name, role: staff.role === 'counselor' ? 'Guru BK' : staff.role === 'super_admin' ? 'Admin' : staff.role, isStaff: true };
    
    const student = students.find(s => s.id === senderId);
    if (student) {
      // Aturan Anonimitas: Jika viewer adalah SISWA dan berada di Forum ANGKATAN, 
      // maka identitas siswa lain DAN diri sendiri diubah menjadi 'Anonim' agar privasi terjaga di ruang publik.
      const isForumAngkatan = selectedRoom?.type === 'ANGKATAN';
      const showAsAnonymous = isStudent && isForumAngkatan;
      
      return { 
        name: showAsAnonymous ? 'Anonim' : student.name, 
        role: 'Siswa', 
        isStaff: false 
      };
    }
    return { name: 'Siswa Non-Aktif', role: 'User', isStaff: false };
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id!,
      receiverId: selectedRoomId, // Room ID
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar Ruang Diskusi */}
      <div className="w-full md:w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Ruang Diskusi</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Grup & Forum BK</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          {/* Section Angkatan */}
          <div className="space-y-3">
            <div className="px-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Forum Angkatan</p>
            </div>
            {availableRooms.filter(r => r.type === 'ANGKATAN').map(room => (
              <button 
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group ${
                  selectedRoomId === room.id ? 'bg-teal-600 text-white shadow-xl shadow-teal-100' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                  selectedRoomId === room.id ? 'bg-white/20' : 'bg-teal-50 text-teal-600'
                }`}>
                  {room.grade}
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-sm truncate">{room.name}</p>
                  <p className={`text-[10px] truncate ${selectedRoomId === room.id ? 'text-teal-100' : 'text-slate-400'}`}>Grup Publik</p>
                </div>
              </button>
            ))}
          </div>

          {/* Section Konsultasi */}
          <div className="space-y-2">
            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Ruang Konsultasi</p>
            {availableRooms.filter(r => r.type === 'KONSELING').map(room => (
              <button 
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group ${
                  selectedRoomId === room.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-100' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                  selectedRoomId === room.id ? 'bg-white/20' : 'bg-violet-50 text-violet-600'
                }`}>
                  BK
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-sm truncate">{room.name.replace('Konsultasi: ', '')}</p>
                  <p className={`text-[10px] truncate ${selectedRoomId === room.id ? 'text-violet-100' : 'text-slate-400'}`}>Tanya Jawab</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chat Grup */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden relative">
        {selectedRoom ? (
          <>
            <header className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
               <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg text-white shrink-0 ${selectedRoom.type === 'ANGKATAN' ? 'bg-teal-600' : 'bg-violet-600'}`}>
                    {selectedRoom.type === 'ANGKATAN' ? selectedRoom.grade : 'BK'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 text-lg leading-tight italic truncate">{selectedRoom.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{selectedRoom.description}</p>
                    {/* Pesan Etika Ruang Publik */}
                    <p className="text-[9px] font-bold text-rose-500 italic mt-1 leading-tight hidden md:block">
                      "Gunakan kalimat yang sopan, santun dan beretika. Dilarang menggunakan kata 'B*b*, *nj*ng', dsb. Karena kita adalah seorang terpelajar bukan yang kurang ajar"
                    </p>
                  </div>
               </div>
               <div className="hidden lg:flex flex-col items-end shrink-0">
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Ruang Publik
                  </span>
               </div>
            </header>

            {/* Banner Mobile Warning */}
            <div className="md:hidden bg-rose-50 border-b border-rose-100 px-4 py-2">
                <p className="text-[8px] font-bold text-rose-600 italic text-center">
                  Dilarang menggunakan kata kasar (B*b*, *nj*ng, dsb). Jaga sopan santun sebagai kaum terpelajar.
                </p>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/20">
              {activeMessages.map((msg, i) => {
                const isMine = msg.senderId === currentUser.id;
                const sender = getSenderDisplay(msg.senderId);
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    {/* Header Pesan (Nama Pengirim) */}
                    <div className={`flex items-center gap-2 mb-1 px-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                       <span className="text-[10px] font-black text-slate-700 uppercase italic">{sender.name}</span>
                       <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${sender.isStaff ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                          {sender.role}
                       </span>
                    </div>

                    <div className="max-w-[80%] group">
                      <div className={`p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                        isMine 
                        ? 'bg-teal-600 text-white rounded-tr-none' 
                        : sender.isStaff 
                          ? 'bg-slate-800 text-white rounded-tl-none border-none'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <p className={`text-[8px] font-bold mt-2 uppercase tracking-widest text-slate-300 ${isMine ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {activeMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                   </div>
                   <p className="text-sm font-black uppercase tracking-widest text-slate-400">Mulai diskusi di forum ini</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-50 flex gap-3 shrink-0">
              <input 
                autoFocus
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                placeholder={`Tulis pesan di ${selectedRoom.name}...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all disabled:opacity-50 ${selectedRoom.type === 'ANGKATAN' ? 'bg-teal-600 shadow-teal-100' : 'bg-violet-600 shadow-violet-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-32 h-32 bg-teal-50 rounded-[3rem] flex items-center justify-center text-teal-600 shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 18c.527 0 1.037-.038 1.531-.112"/><path d="M2 18c.527 0 1.037-.038 1.531-.112"/><circle cx="12" cy="7" r="4"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/></svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Forum Diskusi & Konsultasi</h3>
              <p className="text-slate-400 max-w-sm mt-2 font-medium">
                Pilih salah satu ruang diskusi di sidebar untuk bergabung dalam percakapan angkatan atau ruang konsultasi Guru BK.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;