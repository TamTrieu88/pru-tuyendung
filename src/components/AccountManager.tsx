import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Account } from '../types';
import { UserPlus, Trash2, Edit2, Shield, User, Key, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccountManagerProps {
  currentAdminUsername: string;
}

export default function AccountManager({ currentAdminUsername }: AccountManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user' });
  const [editPassword, setEditPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setAccounts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (accounts.some(acc => acc.username === formData.username)) {
      setError('Tên tài khoản đã tồn tại');
      return;
    }

    try {
      await setDoc(doc(db, 'users', formData.username), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setFormData({ username: '', password: '', role: 'user' });
    } catch (err) {
      console.error('Add account failed:', err);
      setError('Có lỗi xảy ra khi thêm tài khoản');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      await updateDoc(doc(db, 'users', selectedAccount.username), {
        password: editPassword
      });
      setShowEditModal(false);
      setEditPassword('');
      setSelectedAccount(null);
      alert('Đã cập nhật mật khẩu thành công!');
    } catch (err) {
      console.error('Update password failed:', err);
      alert('Cập nhật mật khẩu thất bại');
    }
  };

  const handleDeleteAccount = async (username: string) => {
    if (username === 'admin') {
      alert('Không thể xóa tài khoản admin hệ thống');
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${username}?`)) {
      try {
        await deleteDoc(doc(db, 'users', username));
      } catch (err) {
        console.error('Delete account failed:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <UserCog className="text-red-600" /> Quản lý tài khoản
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
        >
          <UserPlus size={18} /> Thêm tài khoản
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Tài khoản</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Mật khẩu</th>
              <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">Đang tải...</td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.username} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${acc.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {acc.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                    </div>
                    <span className="font-medium text-neutral-900">{acc.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${acc.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {acc.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400 font-mono">••••••••</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Admin can only edit their own password or other non-admin accounts */}
                      {(acc.username === currentAdminUsername || acc.username !== 'admin') && (
                        <button
                          onClick={() => {
                            setSelectedAccount(acc);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Đổi mật khẩu"
                        >
                          <Key size={18} />
                        </button>
                      )}
                      
                      {/* Cannot delete 'admin' account */}
                      {acc.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteAccount(acc.username)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Thêm tài khoản mới</h3>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tên tài khoản</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="user">Nhân viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 font-bold">Hủy</button>
                  <button type="submit" className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Thêm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Password Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-2">Đổi mật khẩu</h3>
              <p className="text-sm text-neutral-500 mb-6">Đang đổi mật khẩu cho tài khoản: <span className="font-bold text-red-600">{selectedAccount?.username}</span></p>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-red-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 font-bold">Hủy</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Cập nhật</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { UserCog } from 'lucide-react';
