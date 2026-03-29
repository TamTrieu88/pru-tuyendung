import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Applicant, ApplicantStatus } from '../types';
import { Search, Filter, MoreVertical, Trash2, CheckCircle, Clock, AlertCircle, UserCheck, XCircle, GraduationCap, Eye, X } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusConfig: Record<ApplicantStatus, { label: string; color: string; icon: any }> = {
  'New': { label: 'Mới', color: 'bg-blue-100 text-blue-700', icon: Clock },
  'Contacted': { label: 'Đã liên hệ', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  'Interviewing': { label: 'Đang phỏng vấn', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  'Trained': { label: 'Đã học', color: 'bg-green-100 text-green-700', icon: GraduationCap },
  'Failed': { label: 'Không đạt', color: 'bg-red-100 text-red-700', icon: XCircle },
  'Hired': { label: 'Đã tuyển', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'applicants'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Applicant));
      setApplicants(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching applicants:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ApplicantStatus) => {
    try {
      await updateDoc(doc(db, 'applicants', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ứng viên này?')) {
      try {
        await deleteDoc(doc(db, 'applicants', id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100">
        <div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Quản lý <span className="text-red-600">Ứng viên</span></h2>
          <p className="text-neutral-500 mt-1 font-medium">Hệ thống theo dõi và tuyển dụng nhân sự Prudential</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm ứng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none w-full md:w-72 transition-all font-medium text-neutral-900 placeholder-neutral-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-neutral-900 cursor-pointer appearance-none"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '2.5rem' }}
          >
            <option value="All">Tất cả trạng thái</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50/80 border-b border-neutral-100">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-neutral-500 uppercase tracking-wider">Ứng viên</th>
                <th className="px-8 py-5 text-xs font-black text-neutral-500 uppercase tracking-wider">Vị trí</th>
                <th className="px-8 py-5 text-xs font-black text-neutral-500 uppercase tracking-wider">Ngày ứng tuyển</th>
                <th className="px-8 py-5 text-xs font-black text-neutral-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-8 py-5 text-xs font-black text-neutral-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-neutral-500 font-medium font-sans animate-pulse">Đang tải dữ liệu hồ sơ...</td>
                </tr>
              ) : filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-neutral-500 font-medium font-sans">Không tìm thấy hồ sơ nào đáp ứng tiêu chí.</td>
                </tr>
              ) : (
                filteredApplicants.map((app) => {
                  const status = statusConfig[app.status];
                  return (
                    <tr key={app.id} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-black text-neutral-900 group-hover:text-red-600 transition-colors">{app.fullName}</div>
                        <div className="text-sm font-medium text-neutral-500 mt-1">{app.email} • {app.phone}</div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-neutral-700">{app.position}</td>
                      <td className="px-8 py-5 text-sm font-medium text-neutral-500">
                        {app.createdAt?.toDate ? format(app.createdAt.toDate(), 'dd/MM/yyyy', { locale: vi }) : '---'}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/20 shadow-sm ${status.color}`}>
                          <status.icon size={14} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end gap-3 items-center">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id!, e.target.value as ApplicantStatus)}
                            className="text-xs font-bold border border-neutral-200 bg-neutral-50 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer transition-colors"
                          >
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                          <div className="w-px h-6 bg-neutral-200 mx-1"></div>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-2 text-neutral-400 bg-white border border-neutral-200 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id!)}
                            className="p-2 text-neutral-400 bg-white border border-neutral-200 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-100"
          >
            <div className="flex items-center justify-between p-8 border-b border-neutral-100">
              <div>
                 <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Chi tiết hồ sơ</h3>
                 <p className="text-sm font-medium text-neutral-500 mt-1">{selectedApp.fullName} • {selectedApp.position}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-neutral-400 hover:text-red-600 bg-neutral-50 hover:bg-red-50 p-2.5 rounded-full transition-colors border border-transparent hover:border-red-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-5 bg-neutral-50/50">
              {Object.entries(selectedApp)
                .filter(([k]) => !['id', 'status', 'createdAt', 'updatedAt', 'fullName', 'position', 'email', 'phone'].includes(k))
                .map(([key, val]) => (
                  <div key={key} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-red-100 transition-colors">
                    <div className="text-xs text-neutral-500 font-bold mb-1.5 uppercase tracking-wider">{key}</div>
                    <div className="text-base font-medium text-neutral-900">
                      {Array.isArray(val) ? val.join(', ') : (val?.toString() || '---')}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
