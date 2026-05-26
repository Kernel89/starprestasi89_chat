import React, { useState } from 'react';
import { UserSession, AppUser } from '../types';

interface ChangePasswordPageProps {
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  currentUser: UserSession;
  appUsers: AppUser[];
  setAppUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ notify, currentUser, appUsers, setAppUsers }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      notify('Kata sandi baru dan konfirmasi tidak cocok.', 'error');
      setLoading(false);
      return;
    }

    // Verify current password locally first (since we are using local storage for auth)
    const user = appUsers.find(u => u.username === currentUser.username);
    if (!user || user.password !== currentPassword) {
        notify('Kata sandi saat ini salah.', 'error');
        setLoading(false);
        return;
    }

    try {
      // Update local state
      setAppUsers(prev => prev.map(u => 
        u.username === currentUser.username ? { ...u, password: newPassword } : u
      ));

      notify('Kata sandi berhasil diubah.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
    } catch (error) {
      console.error('Error changing password:', error);
      notify('Terjadi kesalahan saat mengubah kata sandi.', 'error');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ganti Kata Sandi</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Kata Sandi Saat Ini</label>
            <input
              type="password"
              id="currentPassword"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
            <input
              type="password"
              id="newPassword"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              id="confirmNewPassword"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Mengubah...' : 'Ubah Kata Sandi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
