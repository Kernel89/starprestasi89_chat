import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, ForumPost, ForumComment } from '../types';
import { deleteFromCloud, pullTableFromCloud } from '../syncService';

interface GradeForumProps {
  userRole: UserRole;
  userGrade?: string; // For students
  userName: string;
  userId: string;
  posts: ForumPost[];
  setPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
}

const GradeForum: React.FC<GradeForumProps> = ({ userRole, userGrade, userName, userId, posts = [], setPosts }) => {
  const [activeTab, setActiveTab] = useState<'forum' | 'konseling'>('forum');
  const [selectedGrade, setSelectedGrade] = useState<string>(userGrade || 'XII');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string, userName: string }>>({});
  const lastActionTime = React.useRef<number>(0);

  const fetchLatestForumData = async (force: boolean = false) => {
    // Jeda penarikan data 6 detik jika user baru melakukan aksi (komen/hapus) agar sinkronisasi cloud selesai
    // KECUALI jika dipaksa (force = true) setelah berhasil mengirim data.
    if (!force && Date.now() - parseInt(sessionStorage.getItem('last_action_star_forumPosts') || '0') < 6000) {
      return;
    }
    try {
      const response = await fetch(`/api/sync?table=star_forumPosts&userId=${userId}&role=${userRole}&_t=${Date.now()}`);
      if (response.ok) {
        const cloudData = await response.json();
        const parsedData = cloudData.map((item: any) => {
          const newItem = { ...item };
          for (const key in newItem) {
            if (typeof newItem[key] === 'string' && (newItem[key].startsWith('[') || newItem[key].startsWith('{'))) {
              try { newItem[key] = JSON.parse(newItem[key]); } catch (e) {}
            }
          }
          return newItem;
        });

        setPosts(prevPosts => {
          // Hanya jika typeof prevPosts adalah fungsi. Jika setPosts langsung diberikan array, gunakan posts.
          const safePrev = Array.isArray(prevPosts) ? [...prevPosts] : (Array.isArray(posts) ? [...posts] : []);
          let changed = false;

          for (const serverPost of parsedData) {
            const localIndex = safePrev.findIndex(p => p.id === serverPost.id);
            if (localIndex >= 0) {
              const localPost = safePrev[localIndex];
              
              const localComments = Array.isArray(localPost.comments) ? localPost.comments : [];
              const serverComments = Array.isArray(serverPost.comments) ? serverPost.comments : [];
              
              const commentMap = new Map();
              for (const c of localComments) commentMap.set(c.id, c);
              for (const c of serverComments) commentMap.set(c.id, c);
              
              const mergedComments = Array.from(commentMap.values()).sort((a: any, b: any) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              const mergedLikes = Math.max(localPost.likes || 0, serverPost.likes || 0);
              const mergedPost = { ...serverPost, comments: mergedComments, likes: mergedLikes };
              
              if (JSON.stringify(localPost) !== JSON.stringify(mergedPost)) {
                safePrev[localIndex] = mergedPost;
                changed = true;
              }
            } else {
              safePrev.push(serverPost);
              changed = true;
            }
          }
          
          return changed ? safePrev : prevPosts;
        });
      }
    } catch (err) {}
  };

  useEffect(() => {
    const interval = setInterval(() => fetchLatestForumData(false), 5000);
    return () => clearInterval(interval);
  }, [userId, userRole, setPosts, posts]);

  const syncPostData = async (postToSync: ForumPost) => {
    try {
      // Hapus updated_at agar SQLite tidak memblokir update (karena value yang dikirim sama dengan di DB)
      const payload = { ...postToSync };
      delete (payload as any).updated_at;

      const res = await fetch('/api/sync?table=star_forumPosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload])
      });
      if (!res.ok) throw new Error('Sync failed');
      fetchLatestForumData(true);
    } catch (err) {
      console.warn('Sync failed, queuing offline:', err);
      try {
        const queue = JSON.parse(localStorage.getItem('star_forum_offline_queue') || '[]');
        const existingIndex = queue.findIndex((p: any) => p.id === postToSync.id);
        if (existingIndex >= 0) queue[existingIndex] = postToSync;
        else queue.push(postToSync);
        localStorage.setItem('star_forum_offline_queue', JSON.stringify(queue));
      } catch (e) {
        console.error('Failed to write offline queue', e);
      }
    }
  };

  useEffect(() => {
    const retryOfflineQueue = async () => {
      if (!navigator.onLine) return;
      const queueStr = localStorage.getItem('star_forum_offline_queue');
      if (!queueStr) return;
      
      let queue: any[] = [];
      try { queue = JSON.parse(queueStr); } catch (e) { return; }
      if (queue.length === 0) return;

      try {
        const res = await fetch('/api/sync?table=star_forumPosts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queue)
        });
        if (res.ok) {
          localStorage.removeItem('star_forum_offline_queue');
          fetchLatestForumData(true);
        }
      } catch (err) {
        // Still failing, ignore
      }
    };

    const retryInterval = setInterval(retryOfflineQueue, 10000);
    window.addEventListener('online', retryOfflineQueue);
    retryOfflineQueue();

    return () => {
      clearInterval(retryInterval);
      window.removeEventListener('online', retryOfflineQueue);
    };
  }, []);

  const isPrivileged = userRole !== 'student' && userRole !== 'ketua_murid';
  const activeGrade = (userRole === 'student' || userRole === 'ketua_murid') ? (userGrade || 'XII') : selectedGrade;

  const filteredPosts = useMemo(() => {
    let result = (posts || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (activeTab === 'forum') {
      // Tampilkan postingan publik untuk angkatan aktif
      return result.filter(p => {
        const isPublic = p.isPrivate === false || (p.isPrivate as any) === 0 || (p.isPrivate as any) === 'false' || !p.isPrivate;
        return isPublic && p.grade === activeGrade;
      });
    } else {
      // Mode Konseling
      const isPostPrivate = (p: ForumPost) => p.isPrivate === true || (p.isPrivate as any) === 1 || (p.isPrivate as any) === 'true';
      if (userRole === 'student' || userRole === 'ketua_murid') {
        // Siswa hanya melihat chat privat milik mereka sendiri
        return result.filter(p => isPostPrivate(p) && p.userId === userId);
      } else {
        // Konselor/Admin melihat semua chat privat (bisa difilter per kelas jika mau)
        return result.filter(p => isPostPrivate(p) && (isPrivileged ? p.grade === activeGrade : true));
      }
    }
  }, [posts, activeGrade, activeTab, userId, userRole, isPrivileged]);

  const getDisplayName = (originalName: string, role: UserRole, isPostPrivateRaw?: any) => {
    const isPostPrivate = isPostPrivateRaw === true || isPostPrivateRaw === 1 || isPostPrivateRaw === 'true';
    
    // Jika postingan bersifat privat (Konseling), selalu tampilkan nama asli untuk Konselor
    if (isPostPrivate && isPrivileged) return `${originalName} (Siswa)`;
    
    // Jika penulis bukan siswa (Staff/Guru), selalu tampilkan nama
    if (role !== 'student' && role !== 'ketua_murid') {
      let roleLabel = role as string;
      if (role === 'super_admin') roleLabel = 'Super Konselor';
      if (role === 'counselor') roleLabel = 'Konselor';
      if (role === 'principal') roleLabel = 'Kepala Sekolah';
      if (role === 'homeroom') roleLabel = 'Wali Kelas';
      if (role === 'teacher') roleLabel = 'Guru';
      if (role === 'supervisor') roleLabel = 'Pengawas';
      return `${originalName} (${roleLabel})`;
    }

    // Jika penulis adalah siswa:
    // Jika penonton berhak istimewa (Staff), tampilkan nama
    if (isPrivileged) return `${originalName} (Siswa)`;

    // Sebaliknya (siswa melihat siswa), itu anonim
    return 'Anonim';
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    sessionStorage.setItem('last_action_star_forumPosts', Date.now().toString());

    const newPost: ForumPost = {
      id: `p-${Date.now()}`,
      grade: activeGrade,
      userId: userId,
      userName: userName,
      userRole: userRole,
      content: newPostContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
      isPrivate: activeTab === 'konseling'
    };

    const newPosts = [newPost, ...posts];
    setPosts(newPosts);
    setNewPostContent('');

    syncPostData(newPost);
  };

  const handleCommentSubmit = (postId: string) => {
    // Ambil value secara sinkron dan langsung hapus untuk mencegah double-click
    setCommentInputs(prev => {
      const content = prev[postId];
      if (!content?.trim()) return prev;

      sessionStorage.setItem('last_action_star_forumPosts', Date.now().toString());

      const newComment: ForumComment = {
        id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        postId,
        userId: userId,
        userName: userName,
        userRole: userRole,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      
      const replyTarget = replyingTo[postId];
      if (replyTarget) {
        newComment.parentId = replyTarget.commentId;
        setReplyingTo(r => {
          const next = { ...r };
          delete next[postId];
          return next;
        });
      }

      setPosts(prevPosts => {
        const safePrev = Array.isArray(prevPosts) ? prevPosts : [];
        const newPosts = safePrev.map(p => {
          if (p.id === postId) {
            return { ...p, comments: [...(p.comments || []), newComment] };
          }
          return p;
        });

        // Targeted sync
        const updatedPost = newPosts.find(p => p.id === postId);
        if (updatedPost) syncPostData(updatedPost);
        
        return newPosts;
      });

      return { ...prev, [postId]: '' };
    });
  };

  const handleLike = (postId: string) => {
    sessionStorage.setItem('last_action_star_forumPosts', Date.now().toString());
    setPosts(prevPosts => {
      const safePrev = Array.isArray(prevPosts) ? prevPosts : [];
      const newPosts = safePrev.map(p => {
        if (p.id === postId) {
          return { ...p, likes: (p.likes || 0) + 1 };
        }
        return p;
      });

      const updatedPost = newPosts.find(p => p.id === postId);
      if (updatedPost) syncPostData(updatedPost);
      
      return newPosts;
    });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (confirm('Yakin ingin menghapus komentar ini?')) {
      sessionStorage.setItem('last_action_star_forumPosts', Date.now().toString());
      setPosts(prevPosts => {
        const safePrev = Array.isArray(prevPosts) ? prevPosts : [];
        const newPosts = safePrev.map(p => {
          if (p.id === postId) {
            // Gunakan tombstone (isDeleted) agar worker tahu ini dihapus dan tidak hidup lagi karena race condition
            return {
              ...p,
              comments: (p.comments || []).map(c => c.id === commentId ? { ...c, isDeleted: true } : c)
            };
          }
          return p;
        });

        const updatedPost = newPosts.find(p => p.id === postId);
        if (updatedPost) syncPostData(updatedPost);
        
        return newPosts;
      });
    }
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Yakin ingin menghapus postingan ini?')) {
      sessionStorage.setItem('last_action_star_forumPosts', Date.now().toString());
      setPosts(prevPosts => {
        const safePrev = Array.isArray(prevPosts) ? prevPosts : [];
        const newPosts = safePrev.filter(p => p.id !== postId);
        
        // Hapus dari cloudflare D1 secara fisik
        deleteFromCloud('star_forumPosts', postId).catch(console.error);
        
        return newPosts;
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Forum Angkatan</h2>
          <p className="text-slate-500 text-sm">
            {activeTab === 'forum' 
              ? 'Ruang diskusi siswa per angkatan. Identitas disamarkan.' 
              : 'Ruang konseling pribadi dengan Konselor/Admin. Hanya Anda yang bisa melihat.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('forum')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'forum' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Diskusi Umum
            </button>
          </div>

          {isPrivileged && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
              {['X', 'XI', 'XII'].map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeGrade === grade ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {grade}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className={`${activeTab === 'konseling' ? 'bg-teal-50 border-teal-100' : 'bg-white border-slate-100'} p-6 rounded-[2rem] border shadow-sm transition-all`}>
        <form onSubmit={handlePostSubmit}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={activeTab === 'forum' 
              ? `Tulis sesuatu untuk angkatan ${activeGrade}... (Identitasmu akan disamarkan)`
              : `Ceritakan masalahmu di sini secara privat kepada Konselor... (Hanya Konselor yang bisa melihat)`}
            className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all resize-none h-24"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className={`px-6 py-2.5 ${activeTab === 'konseling' ? 'bg-teal-600 shadow-teal-200' : 'bg-teal-600 shadow-teal-200'} text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {activeTab === 'forum' ? 'Kirim ke Forum' : 'Kirim ke Konselor'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {filteredPosts.map(post => (
          <div key={post.id} className={`${(post.isPrivate === true || (post.isPrivate as any) === 1 || (post.isPrivate as any) === 'true') ? 'bg-teal-50/30 border-teal-100' : 'bg-white border-slate-100'} p-6 md:p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${post.userRole === 'counselor' ? 'bg-emerald-500' : 'bg-teal-500'}`}>
                  {getDisplayName(post.userName, post.userRole, post.isPrivate).charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    {getDisplayName(post.userName, post.userRole, post.isPrivate)}
                    {(post.isPrivate === true || (post.isPrivate as any) === 1 || (post.isPrivate as any) === 'true') && <span className="ml-2 text-[10px] bg-teal-200 text-teal-700 px-2 py-0.5 rounded-full uppercase">Pribadi</span>}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(post.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPrivileged && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase">
                    {post.userRole}
                  </span>
                )}
                {(userRole === 'super_admin' || userId === post.userId) && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Hapus"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </button>
                )}
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>

            {!(post.isPrivate === true || (post.isPrivate as any) === 1 || (post.isPrivate as any) === 'true') && (
              <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:fill-rose-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <div className="flex items-center gap-2 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <span className="text-xs font-bold">{(post.comments || []).filter((c: any) => !c.isDeleted).length} Komentar</span>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-4 pt-4 border-t border-slate-50 mt-4 bg-slate-50/30 -mx-6 px-6 pb-2 rounded-b-[2rem]">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Ruang Diskusi ({(post.comments || []).filter((c: any) => !c.isDeleted).length})
              </div>
              
              <div className="space-y-4">
                {(() => {
                  const validComments = (post.comments || []).filter((c: any) => !c.isDeleted);
                  const topLevelComments = validComments.filter((c: any) => !c.parentId);
                  const repliesByParent: Record<string, any[]> = {};
                  validComments.filter((c: any) => c.parentId).forEach((c: any) => {
                    if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
                    repliesByParent[c.parentId].push(c);
                  });

                  const renderCommentNode = (comment: any, isReply: boolean = false) => {
                    const isMine = comment.userId === userId;
                    const isStaff = comment.userRole === 'super_admin' || comment.userRole === 'counselor' || comment.userRole === 'teacher' || comment.userRole === 'principal';
                    const displayName = getDisplayName(comment.userName, comment.userRole, post.isPrivate);

                    return (
                      <div key={comment.id} className="flex gap-2 group relative animate-in fade-in pr-4">
                        {/* Avatar */}
                        <div className={`${isReply ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'} rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-500 font-bold select-none mt-1`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                          {/* Facebook-style Bubble */}
                          <div className="bg-slate-100 px-3.5 py-2.5 rounded-[18px] text-[13px] text-slate-800 w-fit max-w-full">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="font-bold leading-none">{displayName}</span>
                              {isStaff && (
                                <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap break-words leading-snug">{comment.content}</p>
                          </div>
                          
                          {/* Action Row */}
                          <div className="flex items-center gap-3 mt-1.5 ml-3 text-[11px] font-bold text-slate-500">
                            <span>{new Date(comment.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            
                            {!isReply && (
                              <button
                                onClick={() => {
                                  setReplyingTo(prev => ({ ...prev, [post.id]: { commentId: comment.id, userName: displayName } }));
                                  setTimeout(() => document.getElementById(`reply-input-${post.id}`)?.focus(), 100);
                                }}
                                className="hover:underline cursor-pointer text-slate-500 hover:text-slate-700"
                              >
                                Balas
                              </button>
                            )}

                            {(userRole === 'super_admin' || isMine) && (
                              <button
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                className="hover:underline text-slate-400 hover:text-slate-600"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return topLevelComments.map(comment => (
                    <div key={comment.id} className="flex flex-col gap-3">
                      {renderCommentNode(comment, false)}
                      
                      {/* Render Replies */}
                      {repliesByParent[comment.id] && repliesByParent[comment.id].length > 0 && (
                        <div className="flex flex-col gap-3 pl-10 border-l-2 border-slate-100 ml-4">
                          {repliesByParent[comment.id].map(reply => renderCommentNode(reply, true))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>

              <div className="flex flex-col gap-2 mt-6 relative">
                {replyingTo[post.id] && (
                  <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-xl text-xs font-medium text-slate-600">
                    <span>Membalas komentar <b>{replyingTo[post.id].userName}</b></span>
                    <button onClick={() => {
                      setReplyingTo(prev => {
                        const next = { ...prev };
                        delete next[post.id];
                        return next;
                      });
                    }} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    id={`reply-input-${post.id}`}
                    type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  placeholder="Ketik balasan untuk berdiskusi..."
                  className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                />
                <button
                  onClick={() => handleCommentSubmit(post.id)}
                  className="p-3.5 px-5 bg-teal-600 text-white rounded-[1.5rem] hover:bg-teal-700 transition-all active:scale-95 shadow-md shadow-teal-600/20 flex items-center gap-2"
                >
                  <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Kirim</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold italic">
              {activeTab === 'forum' 
                ? 'Belum ada diskusi di angkatan ini. Mulai percakapan!' 
                : 'Belum ada pesan konseling pribadi.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeForum;
