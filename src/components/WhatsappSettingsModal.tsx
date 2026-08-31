import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Save, MessageSquare, AlertCircle, Info, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { Clinic } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetClinicId: string;
}

export function WhatsappSettingsModal({ isOpen, onClose, targetClinicId }: Props) {
  const { data, updateData } = useStore();

  const defaultTemplate = 'مرحباً {الاسم}، يسر مركز {المركز} تذكيرك بموعد جلستك غداً {التاريخ} في تمام {الوقت} لخدمة ({الخدمة}). ننتظر حضورك المشرق! ✨';

  const foundClinic = data.clinics.find(c => c.id === targetClinicId) || data.clinics[0];
  const activeClinic: Clinic = foundClinic || {
    id: targetClinicId || 'main_branch',
    name: 'المركز الرئيسي',
    docName: 'مديرة المركز',
    currency: 'SAR',
    whatsappNumber: '966500000000',
    whatsappTemplate: defaultTemplate,
    daysCount: 365,
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString()
  };

  const [whatsappNumber, setWhatsappNumber] = useState(activeClinic.whatsappNumber || '966500000000');
  const [whatsappTemplate, setWhatsappTemplate] = useState(activeClinic.whatsappTemplate || defaultTemplate);

  useEffect(() => {
    if (isOpen) {
      setWhatsappNumber(activeClinic.whatsappNumber || '966500000000');
      setWhatsappTemplate(activeClinic.whatsappTemplate || defaultTemplate);
    }
  }, [isOpen, targetClinicId, activeClinic.id, activeClinic.whatsappNumber, activeClinic.whatsappTemplate]);

  if (!isOpen) return null;

  const handleSave = () => {
    let updatedClinics = [...data.clinics];
    const existsIndex = updatedClinics.findIndex(c => c.id === activeClinic.id);

    if (existsIndex !== -1) {
      updatedClinics[existsIndex] = {
        ...updatedClinics[existsIndex],
        whatsappNumber,
        whatsappTemplate
      };
    } else {
      updatedClinics.push({
        ...activeClinic,
        whatsappNumber,
        whatsappTemplate
      });
    }

    updateData({ clinics: updatedClinics });
    alert('✅ تم حفظ وتحديث رقم الواتساب وقوالب التذكيرات الآلية بنجاح!');
    onClose();
  };

  // Generate mock preview data
  const mockPreviewMessage = whatsappTemplate
    .replace('{الاسم}', 'أمل العتيبي')
    .replace('{المركز}', activeClinic.name || 'مركز التجميل')
    .replace('{التاريخ}', '2026-09-01')
    .replace('{الوقت}', '05:30 مساءً')
    .replace('{الخدمة}', 'جلسة فيلر الشفاه المميزة')
    .replace('{السعر}', `1200 ${activeClinic.currency || 'SAR'}`)
    .replace('{الرابط}', `${window.location.origin}?booking=true`);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-[Cairo] backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row">
        
        {/* Left Side: Form Controls */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="font-bold text-slate-800 text-lg flex items-center gap-2 m-0">
                <MessageSquare className="text-indigo-600 animate-pulse" size={22} />
                إعدادات تذكير الواتس آب لفرع: {activeClinic.name}
              </h5>
              <span className="text-xs text-slate-500 block mt-1">تخصيص نماذج رسائل تأكيد الحجوزات والتذكير الآلي للعملاء</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 md:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex gap-2">
            <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-700 leading-relaxed m-0">
              💡 يمكنك صياغة القالب بأسلوبك الخاص واستخدام الكلمات الدلالية بين الأقواس ليقوم النظام باستبدالها تلقائياً عند الإرسال لكل عميلة.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم واتس آب خدمة العملاء بالفرع</label>
              <input 
                type="text"
                placeholder="+9665XXXXXXXX"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-600 text-left font-mono"
                dir="ltr"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">رقم الفرع للتواصل أو عند استلام استفسارات من العملاء.</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">قالب رسالة التذكير بالموعد</label>
                <button 
                  onClick={() => setWhatsappTemplate(defaultTemplate)}
                  className="text-[9px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={10} /> استعادة الافتراضي
                </button>
              </div>
              <textarea 
                rows={5}
                value={whatsappTemplate}
                onChange={e => setWhatsappTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed outline-none focus:border-indigo-600"
                placeholder="اكتب قالب رسالة الواتس اب هنا..."
              />
            </div>

            {/* Variable list tag chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-2">🏷️ الكلمات الدلالية المدعومة:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{الاسم}', label: 'اسم العميلة' },
                  { tag: '{المركز}', label: 'اسم المركز/الفرع' },
                  { tag: '{التاريخ}', label: 'تاريخ الحجز' },
                  { tag: '{الوقت}', label: 'توقيت الموعد' },
                  { tag: '{الخدمة}', label: 'الخدمة المطلوبة' },
                  { tag: '{السعر}', label: 'سعر الخدمة' },
                  { tag: '{الرابط}', label: 'رابط الحجز الإلكتروني' },
                ].map(item => (
                  <button 
                    key={item.tag}
                    onClick={() => setWhatsappTemplate(prev => prev + ' ' + item.tag)}
                    className="text-[9px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold transition-all"
                    title="اضغط لإدراج الكلمة الدلالية"
                  >
                    {item.tag} ({item.label})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-2">
            <button 
              onClick={handleSave}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} /> حفظ التعديلات
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>

        {/* Right Side: Beautiful iPhone Style WhatsApp Mockup Preview */}
        <div className="w-full md:w-[340px] bg-slate-100 border-r border-slate-100 p-6 flex flex-col justify-center items-center relative">
          <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 hidden md:block">
            <X size={20} />
          </button>
          
          <span className="text-[11px] font-bold text-slate-500 mb-3 block text-center">📱 معاينة حية لشاشة واتس اب العميل:</span>
          
          {/* Mobile phone card */}
          <div className="w-[280px] h-[440px] bg-[#0E161E] rounded-[36px] border-[6px] border-slate-800 shadow-xl overflow-hidden relative flex flex-col font-sans">
            {/* Phone speaker top */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-10"></div>
            
            {/* Mock Chat Header */}
            <div className="bg-[#1F2C34] pt-7 pb-2 px-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white font-[Cairo]">
                {activeClinic.name?.charAt(0) || '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-[11px] text-white block truncate text-right font-[Cairo]">{activeClinic.name}</span>
                <span className="text-[8px] text-[#8596A0] block text-right">متصل الآن</span>
              </div>
            </div>

            {/* Mock Chat Body (WhatsApp Green Background) */}
            <div className="flex-1 p-3 bg-[#0B141A] overflow-y-auto flex flex-col justify-end">
              <div className="bg-[#202C33] text-slate-200 p-2.5 rounded-xl rounded-tr-none text-[10px] leading-relaxed max-w-[90%] shadow self-start text-right font-[Cairo] relative border-r-4 border-emerald-500">
                <p className="whitespace-pre-wrap">{mockPreviewMessage}</p>
                <span className="text-[7px] text-[#8596A0] block text-left mt-1">11:02 م ✔️✔️</span>
              </div>
            </div>
            
            {/* Mock Chat Input Footer */}
            <div className="bg-[#1F2C34] p-2 flex gap-1 items-center">
              <div className="flex-1 bg-[#2A3942] rounded-full h-7 px-3 flex items-center justify-end">
                <span className="text-[8px] text-[#8596A0]">مراسلة...</span>
              </div>
              <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                🎤
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
