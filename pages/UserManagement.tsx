import React, { useState, useEffect, useMemo } from 'react';
import { AppUser, UserRole, Teacher } from '../types';
import { deleteFromCloud } from '../syncService';

interface UserManagementProps {
  appUsers: AppUser[];
  setAppUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  teachers: Teacher[];
}

const UserManagement: React.FC<UserManagementProps> = ({ appUsers, setAppUsers, notify, teachers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'counselor' as UserRole
  });

  // Auto-generate password: 7 chars, lowercase + numbers
  const generateAutoPassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    let result = '';

    // Ensure mix
    result += lower.charAt(Math.floor(Math.random() * lower.length));
    result += nums.charAt(Math.floor(Math.random() * nums.length));

    const all = lower + nums;
    for (let i = 0; i < 5; i++) {
      result += all.charAt(Math.floor(Math.random() * all.length));
    }

    // Shuffle
    return result.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: generateAutoPassword(),
      role: 'counselor'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || '',
      password: user.password,
      role: user.role
    });
    setIsModalOpen(true);
  };

  // Filter Guru berdasarkan Role yang dipilih di form
  const filteredTeachers = useMemo(() => {
    // Mapping UserRole (App) ke TeacherRole (DB Guru)
    switch (formData.role) {
      case 'counselor':
        return teachers.filter(t => t.role === 'Konselor');
      case 'homeroom':
        return teachers.filter(t => t.role === 'Wali Kelas');
      case 'teacher':
        return teachers.filter(t => t.role === 'Guru Mapel');
      case 'humas':
        return teachers.filter(t => t.role === 'Humas');
      case 'principal':
      case 'supervisor':
      case 'super_admin':
        // Untuk admin/kepsek/pengawas, tampilkan semua guru (karena biasanya diambil dari salah satu guru senior/staf)
        return teachers;
      default:
        return teachers;
    }
  }, [formData.role, teachers]);

  const filteredUsers = useMemo(() => {
    // Sembunyikan akun siswa dari manajemen user (khusus guru/staf)
    const baseList = appUsers.filter(u => u.role !== 'student' && u.role !== 'ketua_murid');
    const list = activeTab === 'all' ? baseList : baseList.filter(u => u.role === activeTab);
    return list;
  }, [appUsers, activeTab]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Reset nama jika role berubah, agar user memilih ulang dari list yang sesuai
  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      name: '' // Reset nama saat ganti role agar user memilih ulang yang sesuai
    }));
  };

  // Auto-generate username based on name input (HANYA SAAT TAMBAH BARU)
  useEffect(() => {
    if (isModalOpen && !editingUserId) {
      // Logic: lowercase, remove special chars, replace spaces with dots
      const autoUsername = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '.');

      setFormData(prev => ({ ...prev, username: autoUsername }));
    }
  }, [formData.name, isModalOpen, editingUserId]);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      notify("Mohon lengkapi semua data.", "error");
      return;
    }

    // Cek duplikasi username (kecuali diri sendiri saat edit)
    const isDuplicate = appUsers.some(u => u.username === formData.username && u.id !== editingUserId);
    if (isDuplicate) {
      notify("Username sudah digunakan.", "error");
      return;
    }

    if (editingUserId) {
      // MODE EDIT
      setAppUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...formData } : u));
      notify(`Data pengguna ${formData.name} berhasil diperbarui.`, "success");
    } else {
      // MODE TAMBAH
      const newUser: AppUser = {
        id: `user-${Date.now()}`,
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      setAppUsers(prev => [...prev, newUser]);
      notify(`Pengguna ${newUser.name} berhasil ditambahkan.`, "success");
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = async (id: string, username: string, role: string) => {
    if (role === 'super_admin') {
      notify("Akun Super Admin (Super Konselor) tidak dapat dihapus.", "error");
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${username}"?`)) {
      setAppUsers(appUsers.filter(u => u.id !== id));
      await deleteFromCloud('star_users', id);
      notify(`Pengguna ${username} telah dihapus.`, "info");
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'principal': return 'Kepala Sekolah';
      case 'counselor': return 'Konselor';
      case 'homeroom': return 'Wali Kelas';
      case 'teacher': return 'Guru Mapel';
      case 'supervisor': return 'Pengawas Sekolah';
      case 'humas': return 'Humas';
      default: return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-indigo-100 text-indigo-700';
      case 'principal': return 'bg-amber-100 text-amber-700';
      case 'counselor': return 'bg-emerald-100 text-emerald-700';
      case 'homeroom': return 'bg-cyan-100 text-cyan-700';
      case 'teacher': return 'bg-slate-100 text-slate-700';
      case 'supervisor': return 'bg-purple-100 text-purple-700';
      case 'humas': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h2>
          <p className="text-slate-500 text-sm">Kelola akses akun Konselor, Kepala Sekolah, Guru, dan Pengawas.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          Tambah Pengguna
        </button>
      </header>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit mb-6">
        <button onClick={() => setActiveTab('all')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Semua</button>
        <button onClick={() => setActiveTab('super_admin')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'super_admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Super Admin</button>
        <button onClick={() => setActiveTab('counselor')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'counselor' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Konselor</button>
        <button onClick={() => setActiveTab('humas')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'humas' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Humas</button>
        <button onClick={() => setActiveTab('homeroom')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'homeroom' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}>Wali Kelas</button>
        <button onClick={() => setActiveTab('teacher')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'teacher' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500'}`}>Guru Mapel</button>
        <button onClick={() => setActiveTab('principal')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'principal' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}>Kepsek</button>
        <button onClick={() => setActiveTab('supervisor')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${activeTab === 'supervisor' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Pengawas</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Pengguna</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedUsers.map((user) => {
                // Cari data guru untuk mendapatkan NIP
                const teacherInfo = teachers.find(t => t.name === user.name);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        {teacherInfo && (
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                            NIP. {teacherInfo.nip}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-mono text-slate-600">{user.username}</td>
                    <td className="px-8 py-5 font-mono text-slate-600">{user.email || '-'}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-slate-400">{user.password}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2.5 text-slate-300 hover:text-indigo-600 transition-all bg-slate-50 rounded-xl hover:bg-indigo-50"
                          title="Edit Pengguna"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </button>
                        {user.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                            className="p-2.5 text-slate-300 hover:text-rose-500 transition-all bg-slate-50 rounded-xl hover:bg-rose-50"
                            title="Hapus Pengguna"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-bold text-slate-800">{filteredUsers.length}</span> akun
            </p>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="flex gap-1 mx-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20">
            <div className="bg-indigo-600 p-8 text-white">
              <h3 className="text-xl font-black">{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <p className="text-indigo-100 text-xs mt-1">Kelola akun akses untuk Staf Sekolah.</p>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-5">

              {/* Role Selection First */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role (Peran)</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.role}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="counselor">Konselor (Guru BK)</option>
                  <option value="principal">Kepala Sekolah</option>
                  <option value="supervisor">Pengawas Sekolah</option>
                  <option value="homeroom">Wali Kelas</option>
                  <option value="teacher">Guru Mata Pelajaran</option>
                  <option value="humas">Humas</option>
                </select>
              </div>

              {/* Name Selection Filtered by Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nama Lengkap (Sesuai Role: {getRoleLabel(formData.role)})
                </label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                >
                  <option value="">-- Pilih Guru / Staf --</option>
                  {/* Pastikan nama user yang sedang diedit tetap muncul walaupun rolenya tidak cocok di database guru saat ini (edge case) */}
                  {editingUserId && !filteredTeachers.some(t => t.name === formData.name) && (
                    <option value={formData.name}>{formData.name} (Saat Ini)</option>
                  )}
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.name}>
                      {teacher.name} ({teacher.role})
                    </option>
                  ))}
                </select>
                {filteredTeachers.length === 0 && !editingUserId && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">Tidak ada data guru dengan role ini.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-indigo-600 focus:outline-none"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })} // Allow manual edit if needed
                    readOnly={!editingUserId} // Auto-generated on add, maybe editable on edit
                    placeholder="nama.pengguna"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <input
                    required
                    type="text"
                    className={`w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-indigo-600 focus:outline-none ${editingUserId ? 'bg-white focus:ring-4 focus:ring-indigo-500/10' : 'bg-slate-100'}`}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    readOnly={!editingUserId} // Auto on add, editable on edit
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Opsional)</label>
                  <input
                    type="email"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                  />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;