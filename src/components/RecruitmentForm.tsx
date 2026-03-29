import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../firebase';
import { collection, addDoc, getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Send, CheckCircle2, ChevronRight, ChevronLeft, Settings, X, Plus, Trash2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FormField } from '../types';

// Fallback constant if no remote config
const DEFAULT_FIELDS: FormField[] = [
  { id: 'fullName', label: 'Họ và tên', type: 'text', required: true, step: 1, order: 1, width: 'half' },
  { id: 'birthYear', label: 'Năm sinh', type: 'number', required: true, step: 1, order: 2, width: 'half' },
  { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, step: 1, order: 3, width: 'half' },
  { id: 'location', label: 'Khu vực sinh sống', type: 'select', required: true, options: ['Tân Châu', 'Tân Biên', 'Gò Dầu', 'Bến Cầu', 'Châu Thành', 'Khác'], step: 1, order: 4, width: 'half' },
  { id: 'position', label: 'Vị trí ứng tuyển', type: 'radio', required: true, options: ['Cộng tác viên tư vấn bảo hiểm (Part-time)', 'Nhân viên kinh doanh (Full-time)', 'Chuyên viên tuyển dụng', 'Quản lý tập sự'], step: 1, order: 5, width: 'full' },
  { id: 'currentStatus', label: 'Tình trạng hiện tại', type: 'radio', required: true, options: ['Đang đi làm', 'Kinh doanh tự do', 'Chưa có việc', 'Khác'], step: 1, order: 6, width: 'full' },
  { id: 'desiredIncome', label: 'Thu nhập mong muốn', type: 'radio', required: true, options: ['Dưới 5 triệu', '5 – 10 triệu', '10 – 20 triệu', 'Trên 20 triệu'], step: 1, order: 7, width: 'full' },
  { id: 'startDate', label: 'Thời gian có thể bắt đầu làm việc', type: 'radio', required: true, options: ['Ngay', '1–2 tuần', 'Chưa xác định'], step: 1, order: 8, width: 'full' },
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

const buildZodSchema = (fields: FormField[]) => {
  const shape: any = {};
  fields.forEach(f => {
    let fieldSchema: any;
    if (f.type === 'email') fieldSchema = z.string().email('Email không hợp lệ');
    else if (f.type === 'checkbox') fieldSchema = z.array(z.string());
    else fieldSchema = z.string();

    if (f.required) {
      if (f.type === 'checkbox') fieldSchema = fieldSchema.min(1, 'Vui lòng chọn ít nhất 1 mục');
      else fieldSchema = fieldSchema.min(1, 'Trường này bắt buộc nhập');
    } else {
      if (f.type === 'checkbox') fieldSchema = fieldSchema.optional();
      else fieldSchema = fieldSchema.optional().or(z.literal(''));
    }
    shape[f.id] = fieldSchema;
  });
  return z.object(shape);
};

// ==================== FORM BUILDER MODAL ====================
function FormEditorModal({ 
  initialFields, 
  onClose, 
  onSaved 
}: { 
  initialFields: FormField[], 
  onClose: () => void, 
  onSaved: (fields: FormField[]) => void 
}) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      await setDoc(doc(db, 'users', 'formConfig'), {
        fields,
        updatedAt: serverTimestamp()
      });
      setStatus('success');
      onSaved(fields);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error saving form config:', error);
      setStatus('error');
      setErrorMsg(error?.message || 'Có lỗi xảy ra khi lưu trên máy chủ.');
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

  const renderFieldEditor = (field: FormField, index: number) => {
    return (
      <div key={field.id} className="group bg-white border border-neutral-200 hover:border-red-300 transition-colors p-5 rounded-2xl shadow-sm flex flex-col relative h-full">
        
        <div className="flex gap-4">
          {/* Main Info - Left */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-bold text-neutral-800">
                ID Trường <br/><span className="text-xs font-normal text-neutral-500">(tiếng Anh viết liền)</span>
              </label>
              <input 
                type="text" 
                value={field.id} 
                onChange={e => updateField(field.id, { id: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-neutral-50 hover:bg-white transition-all"
                placeholder="vd: fieldName"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-bold text-neutral-800">
                Tên hiển thị <br/><span className="text-xs font-normal text-neutral-500">(ví dụ: Ngày sinh)</span>
              </label>
              <input 
                type="text" 
                value={field.label} 
                onChange={e => updateField(field.id, { label: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm transition-all"
                placeholder="vd: Họ và tên"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-bold text-neutral-800">
                Loại dữ liệu <br/><span className="text-xs font-normal text-neutral-500">(Định dạng nhập)</span>
              </label>
              <select 
                value={field.type} 
                onChange={e => updateField(field.id, { type: e.target.value as any })}
                className="mt-1.5 w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-white transition-all"
              >
                <option value="text">Văn bản ngắn</option>
                <option value="textarea">Văn bản dài</option>
                <option value="number">Số</option>
                <option value="date">Ngày tháng</option>
                <option value="email">Email</option>
                <option value="select">Dropdown</option>
                <option value="radio">Radio</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>
          </div>

          {/* Right Side - Actions & Checkboxes */}
          <div className="w-auto flex flex-col items-end justify-start gap-4">
            <button onClick={() => removeField(field.id)} className="bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Xóa trường này">
              <Trash2 size={16} />
            </button>
            
            {/* Checkboxes aligned right, same row if enough space, or stacked right */}
            <div className="flex flex-col gap-3 mt-4">
               <label className="flex items-center gap-2.5 cursor-pointer group/chk whitespace-nowrap justify-end">
                 <span className="text-sm font-semibold text-neutral-700 select-none">Bắt buộc</span>
                 <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${field.required ? 'bg-red-600 border-red-600 text-white' : 'border-neutral-300 bg-white group-hover/chk:border-red-400'}`}>
                    {field.required && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                 </div>
                 <input type="checkbox" className="hidden" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} />
               </label>

               <label className="flex items-center gap-2.5 cursor-pointer group/chk whitespace-nowrap justify-end">
                 <span className="text-sm font-semibold text-neutral-700 select-none">Chia nửa cột</span>
                 <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${field.width === 'half' ? 'bg-blue-600 border-blue-600 text-white' : 'border-neutral-300 bg-white group-hover/chk:border-blue-400'}`}>
                    {field.width === 'half' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                 </div>
                 <input type="checkbox" className="hidden" checked={field.width === 'half'} onChange={e => updateField(field.id, { width: e.target.checked ? 'half' : 'full' })} />
               </label>
            </div>
          </div>
        </div>

        {/* Cấu hình Options (nếu có) */}
        {['select', 'radio', 'checkbox'].includes(field.type) && (
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <label className="text-sm font-bold text-neutral-800 block mb-1">Các tùy chọn</label>
            <span className="text-xs text-neutral-500 font-normal mb-2 block">(Ngăn cách nhau bởi dấu phẩy)</span>
            <input 
              type="text" 
              value={(field.options || []).join(', ')} 
              onChange={e => {
                const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateField(field.id, { options: arr });
              }}
              placeholder="VD: Lựa chọn A, Lựa chọn B"
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm transition-all"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-white z-10">
          <div>
             <h2 className="text-xl font-bold text-neutral-900">Quản lý Cấu trúc Form</h2>
             <p className="text-sm text-neutral-500 mt-1">Thay đổi cấu trúc Form Ứng tuyển dành riêng cho Admin</p>
          </div>
          <div className="flex items-center gap-4">
             {status === 'success' && <span className="text-green-600 text-sm font-semibold flex items-center gap-1"><CheckCircle size={16}/> Đã lưu</span>}
             <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Đang lưu...' : 'Lưu lại'}
             </button>
             <button onClick={onClose} className="text-neutral-400 hover:text-red-600 bg-neutral-100 hover:bg-red-50 rounded-full p-2 transition-colors">
               <X size={24} />
             </button>
          </div>
        </div>

        {status === 'error' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={18} />
              <p className="text-red-700 text-sm font-bold">Không thể lưu cấu hình!</p>
            </div>
            <p className="text-red-600 text-xs mt-1 ml-6">{errorMsg}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50">
           {/* Tab Navigation */}
           <div className="flex items-center gap-6 border-b border-neutral-200 mb-6">
             <button 
               onClick={() => setActiveTab(1)}
               className={`pb-3 px-2 font-bold text-sm transition-colors relative ${activeTab === 1 ? 'text-red-600' : 'text-neutral-500 hover:text-neutral-800'}`}
             >
               Bước 1: Thông tin cơ bản
               {activeTab === 1 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>}
             </button>
             <button 
               onClick={() => setActiveTab(2)}
               className={`pb-3 px-2 font-bold text-sm transition-colors relative ${activeTab === 2 ? 'text-red-600' : 'text-neutral-500 hover:text-neutral-800'}`}
             >
               Bước 2: Thông tin chi tiết
               {activeTab === 2 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>}
             </button>
           </div>

           {/* Tab Content -> Grid 2 Cột */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {fields.filter(f => f.step === activeTab).map((f, i) => renderFieldEditor(f, i))}

              <button 
                onClick={() => addField(activeTab)}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-neutral-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 rounded-2xl min-h-[200px] text-neutral-400 transition-all font-bold"
              >
                <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center border border-neutral-100">
                  <Plus size={24} />
                </div>
                <span>Thêm trường mới biểu mẫu</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// ==================== INNER FORM COMPONENT ====================
interface RecruitmentFormInnerProps {
  fields: FormField[];
  isAdmin?: boolean;
  onSuccess: () => void;
  onConfigUpdate: (fields: FormField[]) => void;
}

function RecruitmentFormInner({ fields, isAdmin, onSuccess, onConfigUpdate }: RecruitmentFormInnerProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const schema = useMemo(() => buildZodSchema(fields), [fields]);
  const defaultValues = useMemo(() => {
    const vals: any = {};
    fields.forEach(f => {
      vals[f.id] = f.type === 'checkbox' ? [] : '';
    });
    return vals;
  }, [fields]);

  const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues
  });

  const step1Fields = useMemo(() => fields.filter(f => f.step === 1).sort((a,b)=>a.order-b.order), [fields]);
  const step2Fields = useMemo(() => fields.filter(f => f.step === 2).sort((a,b)=>a.order-b.order), [fields]);

  const nextStep = async () => {
    const fieldIdsToValidate = step1Fields.map(f => f.id);
    const isStep1Valid = await trigger(fieldIdsToValidate);
    if (isStep1Valid) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'applicants'), {
        ...data,
        status: 'New',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto py-20 text-center relative">
        {/* Confetti dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full pointer-events-none"
            style={{
              background: i % 2 === 0 ? '#ED1B2E' : '#1B365D',
              top: `${20 + (i * 10)}%`,
              left: `${5 + (i * 15)}%`,
            }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], y: -60, scale: [0, 1, 0.5] }}
            transition={{ duration: 1.5, delay: 0.3 + i * 0.1 }}
          />
        ))}
        <motion.div
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: 'spring', stiffness: 200, damping: 14 }}
           className="bg-white p-10 rounded-3xl shadow-xl border border-green-100 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <CheckCircle2 size={72} className="text-green-500 mx-auto mb-5" />
          </motion.div>
          <h2 className="text-2xl font-black text-neutral-900 mb-3">Gửi hồ sơ thành công!</h2>
          <p className="text-neutral-600 leading-relaxed">Cảm ơn bạn đã quan tâm đến Prudential. Đội ngũ tuyển dụng sẽ liên hệ với bạn sớm nhất có thể.</p>
        </motion.div>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const colSpan = field.width === 'half' ? 'col-span-1' : 'col-span-1 md:col-span-2';
    const err = errors[field.id] as any;

    if (field.type === 'text' || field.type === 'number' || field.type === 'email' || field.type === 'date') {
      return (
        <div key={field.id} className={colSpan}>
          <label className="block text-sm font-bold text-neutral-800 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type}
            placeholder={field.placeholder || 'Nhập thông tin tại đây...'}
            {...register(field.id)}
            className={`w-full px-4 py-3.5 bg-neutral-50 rounded-xl border ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-neutral-200 focus:border-red-500 focus:ring-red-500/20'} focus:ring-4 outline-none transition-all text-neutral-900 font-medium placeholder-neutral-400`}
          />
          {err && <p className="text-red-500 text-sm font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={14}/> {err.message}</p>}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className={colSpan}>
          <label className="block text-sm font-bold text-neutral-800 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            rows={4}
            placeholder={field.placeholder || 'Chia sẻ thêm...'}
            {...register(field.id)}
            className={`w-full px-4 py-3.5 bg-neutral-50 rounded-xl border ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-neutral-200 focus:border-red-500 focus:ring-red-500/20'} focus:ring-4 outline-none transition-all text-neutral-900 font-medium resize-none placeholder-neutral-400`}
          />
          {err && <p className="text-red-500 text-sm font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={14}/> {err.message}</p>}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.id} className={colSpan}>
          <label className="block text-sm font-bold text-neutral-800 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            {...register(field.id)}
            className={`w-full px-4 py-3.5 bg-neutral-50 rounded-xl border ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-neutral-200 focus:border-red-500 focus:ring-red-500/20'} focus:ring-4 outline-none transition-all text-neutral-900 font-medium cursor-pointer appearance-none`}
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">{field.placeholder || '-- Vui lòng chọn --'}</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {err && <p className="text-red-500 text-sm font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={14}/> {err.message}</p>}
        </div>
      );
    }

    if (field.type === 'radio') {
      const watchedVal = watch(field.id);
      return (
        <div key={field.id} className={colSpan}>
          <label className="block text-sm font-bold text-neutral-800 mb-3">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(field.options || []).map(opt => {
              const isSelected = watchedVal === opt;
              return (
                <label key={opt} className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-red-500 bg-red-50/50 shadow-sm' : 'border-neutral-100 bg-white hover:border-red-200 hover:bg-red-50/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-red-600 bg-red-600' : 'border-neutral-300 bg-white'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-red-900' : 'text-neutral-700'}`}>{opt}</span>
                  </div>
                  <input type="radio" value={opt} {...register(field.id)} className="hidden" />
                </label>
              );
            })}
          </div>
          {err && <p className="text-red-500 text-sm font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={14}/> {err.message}</p>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      const watchedArray = watch(field.id) || [];
      return (
        <div key={field.id} className={colSpan}>
          <label className="block text-sm font-bold text-neutral-800 mb-3">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(field.options || []).map(opt => {
              const isSelected = watchedArray.includes(opt);
              return (
                <label key={opt} className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-red-500 bg-red-50/50 shadow-sm' : 'border-neutral-100 bg-white hover:border-red-200 hover:bg-red-50/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-red-600 bg-red-600' : 'border-neutral-300 bg-white'}`}>
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-red-900' : 'text-neutral-700'}`}>{opt}</span>
                  </div>
                  <input type="checkbox" value={opt} {...register(field.id)} className="hidden" />
                </label>
              );
            })}
          </div>
          {err && <p className="text-red-500 text-sm font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={14}/> {err.message}</p>}
        </div>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto pb-16 relative"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Soft glow behind form */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(237,27,46,0.5) 0%, transparent 70%)' }}
      />
      <div className="bg-white p-8 md:p-14 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-neutral-100 relative">
        
        {/* Editor Modal */}
        {showEditor && (
          <FormEditorModal 
             initialFields={fields} 
             onClose={() => setShowEditor(false)} 
             onSaved={(newFields) => {
               onConfigUpdate(newFields);
             }} 
          />
        )}

        {/* Progress Bar & Admin Button header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-10">
            <div className="w-16 h-1 bg-red-600 rounded-full"></div> 
            {isAdmin && (
              <button 
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:-translate-y-0.5"
              >
                <Settings size={18} />
                Cấu hình Form
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 text-left">
               <h2 className="text-4xl font-black text-neutral-900 mb-3 tracking-tight">Hồ sơ <span className="text-red-600">Ứng tuyển</span></h2>
               <p className="text-neutral-500 text-lg">Thông tin của bạn được bảo mật hoàn toàn bởi hệ thống Prudential.</p>
            </div>
            <div className="md:w-2/3 flex items-center justify-end">
               <div className="flex items-center justify-end w-full max-w-sm relative">
                  <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-neutral-100 rounded-full z-0"></div>
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-red-600 to-red-500 rounded-full z-0 transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
                  
                  <div className="w-full relative z-10 flex justify-between items-center px-1">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg transition-colors shadow-sm ${step >= 1 ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-white text-neutral-400 border-2 border-neutral-200'}`}>
                        1
                      </div>
                      <span className={`text-sm font-bold ${step >= 1 ? 'text-red-600' : 'text-neutral-400'}`}>Cơ bản</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg transition-colors shadow-sm ${step >= 2 ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-white text-neutral-400 border-2 border-neutral-200'}`}>
                        2
                      </div>
                      <span className={`text-sm font-bold ${step >= 2 ? 'text-red-600' : 'text-neutral-400'}`}>Chi tiết</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8"
              >
                {step1Fields.map(renderField)}
                
                <div className="md:col-span-2 pt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.2)] text-lg"
                  >
                    Tiếp tục
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8"
              >
                {step2Fields.map(renderField)}

                <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-between items-center sm:items-stretch gap-4 border-t border-neutral-100 mt-10 pt-10">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                    <ChevronLeft size={20} />
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-2xl flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 shadow-[0_10px_20px_-10px_rgba(237,27,46,0.3)] disabled:opacity-50 text-lg"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất gửi hồ sơ'}
                    {!isSubmitting && <Send size={20} />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

      </div>
    </motion.div>
  );
}
export default function RecruitmentFormLoader({ onSuccess, isAdmin }: { onSuccess: () => void, isAdmin?: boolean }) {
  const [fields, setFields] = useState<FormField[] | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'users', 'formConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().fields) {
          setFields(docSnap.data().fields);
        } else {
          setFields(DEFAULT_FIELDS);
        }
      } catch (error) {
        console.error('Error fetching form config:', error);
        setFields(DEFAULT_FIELDS); // fallback on error
      }
    };
    fetchConfig();
  }, []);

  if (!fields) {
    return <div className="text-center py-32 text-neutral-500 font-medium animate-pulse">Đang tải form ứng tuyển...</div>;
  }

  return (
    <RecruitmentFormInner 
      fields={fields} 
      isAdmin={isAdmin} 
      onSuccess={onSuccess} 
      onConfigUpdate={(newFields) => setFields(newFields)} 
    />
  );
}
