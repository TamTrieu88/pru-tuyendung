import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FormField } from '../types';
import { Save, Plus, Trash2, GripVertical, CheckCircle, AlertCircle } from 'lucide-react';

const DEFAULT_FIELDS: FormField[] = [
  // Form 1
  { id: 'fullName', label: 'Họ và tên', type: 'text', required: true, step: 1, order: 1, width: 'half' },
  { id: 'birthYear', label: 'Năm sinh', type: 'number', required: true, step: 1, order: 2, width: 'half' },
  { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, step: 1, order: 3, width: 'half' },
  { id: 'location', label: 'Khu vực sinh sống', type: 'select', required: true, options: ['Tân Châu', 'Tân Biên', 'Gò Dầu', 'Bến Cầu', 'Châu Thành', 'Khác'], step: 1, order: 4, width: 'half' },
  { id: 'position', label: 'Vị trí ứng tuyển', type: 'radio', required: true, options: ['Cộng tác viên tư vấn bảo hiểm (Part-time)', 'Nhân viên kinh doanh (Full-time)', 'Chuyên viên tuyển dụng', 'Quản lý tập sự'], step: 1, order: 5, width: 'full' },
  { id: 'currentStatus', label: 'Tình trạng hiện tại', type: 'radio', required: true, options: ['Đang đi làm', 'Kinh doanh tự do', 'Chưa có việc', 'Khác'], step: 1, order: 6, width: 'full' },
  { id: 'desiredIncome', label: 'Thu nhập mong muốn', type: 'radio', required: true, options: ['Dưới 5 triệu', '5 – 10 triệu', '10 – 20 triệu', 'Trên 20 triệu'], step: 1, order: 7, width: 'full' },
  { id: 'startDate', label: 'Thời gian có thể bắt đầu làm việc', type: 'radio', required: true, options: ['Ngay', '1–2 tuần', 'Chưa xác định'], step: 1, order: 8, width: 'full' },
  
  // Form 2
  { id: 'birthDate', label: 'Ngày sinh', type: 'date', required: true, step: 2, order: 9, width: 'half' },
  { id: 'email', label: 'Email', type: 'email', required: true, step: 2, order: 10, width: 'half' },
  { id: 'address', label: 'Địa chỉ hiện tại', type: 'text', required: true, step: 2, order: 11, width: 'full' },
  { id: 'education', label: 'Trình độ học vấn', type: 'select', required: true, options: ['THPT', 'Trung cấp', 'Cao đẳng', 'Đại học'], step: 2, order: 12, width: 'half' },
  { id: 'currentJob', label: 'Công việc hiện tại', type: 'text', required: false, step: 2, order: 13, width: 'full' },
  { id: 'relatedExperience', label: 'Kinh nghiệm liên quan', type: 'checkbox', required: true, options: ['Bán hàng', 'Tư vấn', 'Bảo hiểm / Tài chính', 'Chưa có kinh nghiệm'], step: 2, order: 14, width: 'full' },
  { id: 'communicationSkill', label: 'Đánh giá kỹ năng giao tiếp', type: 'radio', required: true, options: ['Tốt', 'Khá', 'Trung bình'], step: 2, order: 15, width: 'full' },
  { id: 'readyForTraining', label: 'Sẵn sàng tham gia đào tạo không?', type: 'radio', required: true, options: ['Có', 'Không'], step: 2, order: 16, width: 'full' },
  { id: 'desiredWorkTime', label: 'Thời gian làm việc mong muốn', type: 'radio', required: true, options: ['Part-time', 'Full-time', 'Linh hoạt'], step: 2, order: 17, width: 'full' },
  { id: 'canAttendInterview', label: 'Có thể tham gia phỏng vấn trực tiếp không?', type: 'radio', required: true, options: ['Có', 'Không'], step: 2, order: 18, width: 'full' },
  { id: 'reasonToApply', label: 'Vì sao bạn muốn ứng tuyển công việc này?', type: 'textarea', required: true, step: 2, order: 19, width: 'full' },
  { id: 'goals3to6Months', label: 'Mục tiêu của bạn trong 3–6 tháng tới là gì?', type: 'textarea', required: true, step: 2, order: 20, width: 'full' },
];

export default function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'formConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().fields) {
          setFields(docSnap.data().fields);
        } else {
          setFields(DEFAULT_FIELDS);
        }
      } catch (error) {
        console.error('Error fetching form config:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      await setDoc(doc(db, 'settings', 'formConfig'), {
        fields,
        updatedAt: serverTimestamp()
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving form config:', error);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const addField = (step: 1 | 2) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'Trường mới',
      type: 'text',
      required: false,
      step,
      order: fields.length + 1,
      width: 'full'
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa trường này?')) {
      setFields(fields.filter(f => f.id !== id));
    }
  };

  const renderFieldEditor = (field: FormField) => {
    return (
      <div key={field.id} className="bg-white border text-sm border-neutral-200 p-4 rounded-xl mb-3 shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">ID Trường (phải là tiếng Anh viết liền)</label>
              <input 
                type="text" 
                value={field.id} 
                onChange={e => updateField(field.id, { id: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">Tên hiển thị (Label)</label>
              <input 
                type="text" 
                value={field.label} 
                onChange={e => updateField(field.id, { label: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">Loại (Type)</label>
              <select 
                value={field.type} 
                onChange={e => updateField(field.id, { type: e.target.value as any })}
                className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-red-500 outline-none bg-white"
              >
                <option value="text">Văn bản ngắn (Text)</option>
                <option value="textarea">Văn bản dài (Textarea)</option>
                <option value="number">Số (Number)</option>
                <option value="date">Ngày tháng (Date)</option>
                <option value="email">Email</option>
                <option value="select">Dropdown (Select)</option>
                <option value="radio">Chọn 1 (Radio)</option>
                <option value="checkbox">Chọn nhiều (Checkbox)</option>
              </select>
            </div>
            
            <div className="flex gap-4 items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={field.required}
                  onChange={e => updateField(field.id, { required: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-neutral-700">Bắt buộc nhập</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={field.width === 'half'}
                  onChange={e => updateField(field.id, { width: e.target.checked ? 'half' : 'full' })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-neutral-700">Hiển thị chia cột (1/2)</span>
              </label>
            </div>
          </div>
          <button onClick={() => removeField(field.id)} className="text-neutral-400 hover:text-red-600 p-2">
            <Trash2 size={18} />
          </button>
        </div>

        {['select', 'radio', 'checkbox'].includes(field.type) && (
          <div className="border-t border-neutral-100 pt-3 mt-1">
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Các tùy chọn (cách nhau bởi dấu phẩy)</label>
            <input 
              type="text" 
              value={(field.options || []).join(', ')} 
              onChange={e => {
                const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateField(field.id, { options: arr });
              }}
              placeholder="Ví dụ: Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
              className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-red-500 outline-none"
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center py-20 text-neutral-500">Đang tải cấu hình...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Quản lý Form (Form Builder)</h2>
          <p className="text-neutral-500 text-sm mt-1">Tuỳ chỉnh trực tiếp các trường ứng tuyển của Form 1 & Form 2</p>
        </div>
        <div className="flex items-center gap-3">
          {status === 'success' && <span className="text-green-600 text-sm font-semibold flex items-center gap-1"><CheckCircle size={16}/> Đã lưu</span>}
          {status === 'error' && <span className="text-red-600 text-sm font-semibold flex items-center gap-1"><AlertCircle size={16}/> Lỗi lưu</span>}
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình Form'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form 1 */}
        <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-neutral-900">Bước 1: Thông tin cơ bản</h3>
            <button 
              onClick={() => addField(1)}
              className="flex items-center gap-1 text-sm bg-white border border-neutral-200 hover:border-red-600 hover:text-red-600 text-neutral-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Thêm trường
            </button>
          </div>
          <div className="space-y-2">
            {fields.filter(f => f.step === 1).map(f => renderFieldEditor(f))}
            {fields.filter(f => f.step === 1).length === 0 && <p className="text-sm text-neutral-400 text-center py-8">Chưa có trường nào</p>}
          </div>
        </div>

        {/* Form 2 */}
        <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-neutral-900">Bước 2: Thông tin chi tiết</h3>
            <button 
              onClick={() => addField(2)}
              className="flex items-center gap-1 text-sm bg-white border border-neutral-200 hover:border-red-600 hover:text-red-600 text-neutral-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Thêm trường
            </button>
          </div>
          <div className="space-y-2">
            {fields.filter(f => f.step === 2).map(f => renderFieldEditor(f))}
            {fields.filter(f => f.step === 2).length === 0 && <p className="text-sm text-neutral-400 text-center py-8">Chưa có trường nào</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
