import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { RecordItem } from '../types';
import { 
  FileText, Clock, Trash2, Printer, Check, UserCog, Send, Volume2, Archive, Receipt, SlidersHorizontal, Edit, Bell
} from 'lucide-react';
import { printInvoice } from '../utils/exportUtils';
import { recordActivityLog } from '../utils/activityLogger';
import { SmartAlerts } from '../components/SmartAlerts';
import { speakPatientCall } from '../utils/voiceCall';
import { InvoiceSettingsModal } from '../components/InvoiceSettingsModal';
import { VoiceCallSettingsModal } from '../components/VoiceCallSettingsModal';
import EditInvoiceModal from '../components/EditInvoiceModal';
import POSPaymentSimulator from '../components/POSPaymentSimulator';


export default function DashboardTab() {
  const { data, currentUser, updateData, setActiveTab } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();
  
  const clinicAppointments = data.appointments?.[currentClinicId] || [];
  const [newAppointmentAlert, setNewAppointmentAlert] = React.useState<any>(null);
  const prevAppointmentsCount = React.useRef(clinicAppointments.length);

  React.useEffect(() => {
    if (clinicAppointments.length > prevAppointmentsCount.current) {
      const newAppt = clinicAppointments[clinicAppointments.length - 1];
      setNewAppointmentAlert(newAppt);
      const timer = setTimeout(() => {
        setNewAppointmentAlert(null);
      }, 8000);
      
      try {
        const audio = new Audio('/notification.mp3'); // Fallback if exists
        audio.play().catch(e => {});
      } catch (e) {}
      
      return () => clearTimeout(timer);
    }
    prevAppointmentsCount.current = clinicAppointments.length;
  }, [clinicAppointments.length]);


  
  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isPrintAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisablePrintQueue !== true && (center?.permissions?.printFull !== false || currentUser?.permissions?.canPrintQueue !== false));

  const queue = data.queue[currentClinicId] || [];
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expert, setExpert] = useState(currentUser?.name || '');
  const [total, setTotal] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('نقدي (خزينة الكاش)');
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [tempRecord, setTempRecord] = useState<any>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // Invoice Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const staffList = data.staffDirectory?.[currentClinicId] || [];
  const clinicServices = (data.services || []).filter(s => !s.clinicId || s.clinicId === currentClinicId);

  const handleServiceToggle = (serviceName: string, price: number) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceName);
      const newSelected = isSelected ? prev.filter(s => s !== serviceName) : [...prev, serviceName];
      
      // Calculate new total
      let newTotal = 0;
      clinicServices.forEach(s => {
        if (newSelected.includes(s.name)) {
          newTotal += s.price;
        }
      });
      setTotal(newTotal);
      setPaid(newTotal);
      
      return newSelected;
    });
  };

  const handlePosSuccess = (authCode: string, brand: string) => {
    if (!tempRecord) return;
    const finalRecord: RecordItem = {
      ...tempRecord,
      payMethod: `شبكة / فيزا POS (${brand} - ${authCode})`
    };

    const newQueue = [...queue, finalRecord];
    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'تسجيل عميل جديد (POS)',
      `تم سداد ${tempRecord.paid} عبر الشبكة وبث الإيصال #${authCode}`
    );

    // Reset form
    setName('');
    setAge('');
    setPhone('');
    setSelectedServices([]);
    setTotal(0);
    setPaid(0);
    setIsPosOpen(false);
    setTempRecord(null);
    alert("تم حفظ الجلسة وتسكين العميل في الطابور بنجاح بعد تفويض الدفع!");
  };

  const handleSave = () => {
    if (!name || !phone) {
      alert("أدخل اسم العميل والهاتف!");
      return;
    }

    const serviceStr = selectedServices.join(' + ') || 'جلسة تجميل';
    
    const now = new Date();
    const newRecord: RecordItem = {
      id: Date.now(),
      name,
      age,
      phone,
      service: serviceStr,
      total: total,
      paid: paid,
      payMethod,
      handler: expert,
      due: total - paid,
      status: 'waiting',
      isoDate: now.toISOString().split('T')[0],
      date: now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    if (payMethod === 'شبكة / فيزا POS' && paid > 0) {
      setTempRecord(newRecord);
      setIsPosOpen(true);
      return;
    }

    const newQueue = [...queue, newRecord];
    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'تسجيل عميل جديد',
      `تم إضافة العميل (${name}) وحجز (${serviceStr}) بقيمة ${total} ${currentCurrency}`
    );

    // Reset form
    setName('');
    setAge('');
    setPhone('');
    setSelectedServices([]);
    setTotal(0);
    setPaid(0);
    alert("تم حفظ الجلسة وتسكين العميل في الطابور بنجاح!");
  };

  const removeFromQueue = (id: number) => {
    const newQueue = queue.filter(x => x.id !== id);
    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue }
    });
  };

  const finishExam = (id: number) => {
    const item = queue.find(x => x.id === id);
    if (!item) return;

    const updatedItem: RecordItem = { ...item, status: 'done' };
    const newQueue = queue.filter(x => x.id !== id);
    const currentArchive = data.archive[currentClinicId] || [];
    const newArchive = [updatedItem, ...currentArchive];

    // Backbar Inventory Deduction Automation
    const currentInventory = data.pharmacyStore?.[currentClinicId] || [];
    let updatedInventory = [...currentInventory];
    let deductionMsg = '';

    const s = item.service.toLowerCase();
    if (s.includes('فيلر') || s.includes('تعبئة')) {
      updatedInventory = updatedInventory.map(inv => {
        if (inv.name.toLowerCase().includes('فيلر') || inv.name.includes('فيلر')) {
          deductionMsg = `تم خصم 1 وحدة من (${inv.name})`;
          return { ...inv, qty: Math.max(0, inv.qty - 1) };
        }
        return inv;
      });
    } else if (s.includes('بوتوكس') || s.includes('تجاعيد')) {
      updatedInventory = updatedInventory.map(inv => {
        if (inv.name.toLowerCase().includes('بوتوكس') || inv.name.includes('بوتوكس')) {
          deductionMsg = `تم خصم 1 وحدة من (${inv.name})`;
          return { ...inv, qty: Math.max(0, inv.qty - 1) };
        }
        return inv;
      });
    } else if (s.includes('تنظيف') || s.includes('بشرة')) {
      updatedInventory = updatedInventory.map(inv => {
        if (inv.name.includes('سيروم') || inv.name.includes('شفرات') || inv.name.toLowerCase().includes('serum')) {
          deductionMsg = `تم خصم 1 وحدة من مستلزمات البشرة (${inv.name})`;
          return { ...inv, qty: Math.max(0, inv.qty - 1) };
        }
        return inv;
      });
    } else if (s.includes('شفرات') || s.includes('ديرما') || s.includes('ليزر')) {
      updatedInventory = updatedInventory.map(inv => {
        if (inv.name.includes('شفرات') || inv.name.includes('نظارة')) {
          deductionMsg = `تم خصم 1 مستلزم معقم من المخزن`;
          return { ...inv, qty: Math.max(0, inv.qty - 1) };
        }
        return inv;
      });
    }

    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue },
      archive: { ...data.archive, [currentClinicId]: newArchive },
      pharmacyStore: {
        ...(data.pharmacyStore || {}),
        [currentClinicId]: updatedInventory
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'إنهاء جلسة وأرشفة',
      `تم إنهاء جلسة العميل (${item.name}) ونقلها للأرشيف بنجاح`
    );

    if (deductionMsg) {
      recordActivityLog(
        currentClinicId,
        'نظام الجرد التلقائي',
        'استهلاك مواد الجلسة (Backbar)',
        `العميل: ${item.name} | الجلسة: ${item.service} | التفاصيل: ${deductionMsg}`
      );
    }
  };

  const callNextPatient = () => {
    const next = queue.find(p => p.status === 'waiting');
    if (!next) {
      alert("لا توجد عميلات في انتظار الدور حالياً!");
      return;
    }
    
    const newQueue = queue.map(p => {
      if (p.id === next.id) return { ...p, status: 'in' as const };
      if (p.status === 'in') return { ...p, status: 'done' as const };
      return p;
    });
    
    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue }
    });

    speakPatientCall(next.name, data.settings?.voiceSettings);
  };

  const callSpecificPatient = (patientName: string) => {
    speakPatientCall(patientName, data.settings?.voiceSettings);
  };

  const sendWhatsAppReminder = () => {
    const waiting = queue.find(p => p.status === 'waiting');
    if (!waiting) { alert("لا توجد عميلات في انتظار الدور حالياً!"); return; }
    if (!waiting.phone) { alert("هذه العميل ليس لديها رقم هاتف مسجل!"); return; }
    
    const msg = `مرحباً بك يا ${waiting.name}، نذكرك بموعد جلستك اليوم في المركز. في انتظارك!`;
    const cleanPhone = waiting.phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrintTaxInvoice = (record: RecordItem) => {
    const clinic = data.clinics.find(c => c.id === currentClinicId);
    printInvoice(record, clinic);
  };

  const voiceLang = data.settings?.voiceSettings?.language || 'ar';
  const voiceLangLabel = voiceLang === 'ar' ? 'عربي' : voiceLang === 'en' ? 'English' : 'عربي + English';


  return (
    <div className="space-y-6">
      <SmartAlerts />
      
      {/* New Appointment Live Alert */}
      {newAppointmentAlert && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg border-2 border-indigo-300 animate-in slide-in-from-top-4 fade-in duration-500 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full animate-pulse">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">إشعار فوري: حجز جديد!</h4>
              <p className="text-indigo-100 text-sm">
                تم إضافة حجز جديد للعميل <strong className="text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{newAppointmentAlert.name}</strong> 
                بتاريخ <strong>{newAppointmentAlert.date}</strong> الساعة <strong>{newAppointmentAlert.time}</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setNewAppointmentAlert(null);
              setActiveTab('appointments');
            }}
            className="px-4 py-2 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
          >
            عرض المواعيد
          </button>
        </div>
      )}


      {/* Top Quick Actions Bar for Invoice & Voice Settings */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">إدارة الإعدادات السريعة:</span>
          
          {(currentUser?.role === 'developer' || currentUser?.permissions?.canViewInvoiceSettings !== false) && (
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold transition-colors border border-indigo-200/60"
              title="تخصيص الفواتير، الضريبة، والشعار، والـ QR كود"
            >
              <Receipt size={14} />
              إعدادات الفواتير والبيانات والـ QR
            </button>
          )}
          
          {(currentUser?.role === 'developer' || currentUser?.permissions?.canViewInvoiceSettings !== false) && (
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-extrabold transition-colors border border-emerald-200/60"
              title="تغيير لغة النداء، النغمة، وسرعة النطق"
            >
              <Volume2 size={14} />
              النداء الصوتي ({voiceLangLabel})
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          الفرع الحالي: <span className="text-indigo-600">{currentUser?.role === 'developer' ? 'نظام المطور (الإدارة الشاملة)' : (data.clinics.find(c => c.id === currentClinicId)?.name || 'لم يتم تحديد فرع')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold mb-4 text-indigo-600 flex items-center gap-2">
            <FileText size={18} />
            تسجيل عميل وخدمات متعددة
          </h6>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل(ة)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" placeholder="اسم العميل..." />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">العمر</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" min="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الهاتف</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" placeholder="01xxxxxxxxx" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اختر الخدمات (متعددة):</label>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 max-h-[140px] overflow-y-auto space-y-2">
                {clinicServices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">لا توجد خدمات مسجلة في هذا الفرع. أضف خدمات من تبويب الخدمات.</p>
                ) : (
                  clinicServices.map((s, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-60"
                        checked={selectedServices.includes(s.name)}
                        onChange={() => handleServiceToggle(s.name, s.price)}
                        disabled={currentUser?.role !== 'developer' && currentUser?.permissions?.canEditInvoiceTotals === false}
                      />
                      <span className="text-sm text-slate-700">{s.name} ({s.price} {currentCurrency})</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الخبير / الموظف المنفذ</label>
              <select value={expert} onChange={e => setExpert(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors">
                <option value="">اختر الخبير المنفذ...</option>
                {staffList.map((st, i) => (
                  <option key={i} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">المطلوب ({currentCurrency})</label>
                <input 
                  type="number" 
                  value={total} 
                  onChange={e => setTotal(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" 
                  min="0" 
                  disabled={currentUser?.role !== 'developer' && currentUser?.permissions?.canEditInvoiceTotals === false}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">المدفوع ({currentCurrency})</label>
                <input 
                  type="number" 
                  value={paid} 
                  onChange={e => setPaid(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" 
                  min="0" 
                  disabled={currentUser?.role !== 'developer' && currentUser?.permissions?.canEditInvoicePayments === false}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">طريقة الدفع (الخزينة المستلمة)</label>
              <select 
                value={payMethod} 
                onChange={e => setPayMethod(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={currentUser?.role !== 'developer' && currentUser?.permissions?.canEditInvoiceMethods === false}
              >
                <option value="نقدي (خزينة الكاش)">نقدي (خزينة الكاش)</option>
                <option value="تحويل بنكي / InstaPay">تحويل بنكي / InstaPay</option>
                <option value="شبكة / فيزا POS">شبكة / فيزا (POS)</option>
              </select>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2.5 mt-2 shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              حفظ وتسكين في الطابور
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
          <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
            <h6 className="font-bold text-green-600 flex items-center gap-2 m-0">
              <Clock size={18} />
              طابور الانتظار والجلسات اليومية
            </h6>
            <div className="flex items-center gap-2">
              <button 
                onClick={sendWhatsAppReminder}
                className="flex items-center gap-2 px-3 py-1.5 border border-green-500 text-green-600 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors"
                title="إرسال تذكير واتساب"
              >
                <Send size={14} />
                تذكير
              </button>
              
              <div className="flex items-center">
                <button 
                  onClick={callNextPatient}
                  className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-r-lg text-sm font-bold shadow-sm hover:bg-green-700 transition-colors"
                >
                  <Volume2 size={16} />
                  نداء التالي
                </button>
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="px-2 py-1.5 bg-green-700 text-green-100 rounded-l-lg hover:bg-green-800 transition-colors border-r border-green-500 text-xs font-bold"
                  title="تغيير لغة وإعدادات النداء"
                >
                  <SlidersHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 rounded-tr-lg font-bold">#</th>
                  <th className="p-3 font-bold">الاسم</th>
                  <th className="p-3 font-bold">الخدمات</th>
                  <th className="p-3 font-bold">الخبير</th>
                  <th className="p-3 font-bold">الدفع</th>
                  <th className="p-3 font-bold">المطلوب</th>
                  <th className="p-3 font-bold">المدفوع</th>
                  <th className="p-3 rounded-tl-lg font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">الطابور فارغ حالياً</td>
                  </tr>
                ) : queue.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-slate-500">{i+1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.status === 'in' && <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping"></span>}
                        {p.status === 'done' && <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 max-w-[120px] truncate" title={p.service}>{p.service}</td>
                    <td className="p-3 font-bold text-blue-500">{p.handler || '--'}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">{p.payMethod || 'نقدي'}</span>
                    </td>
                    <td className="p-3 text-slate-700">{p.total}</td>
                    <td className="p-3 font-bold text-green-600">{p.paid}</td>
                    <td className="p-3">
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => setEditingInvoice(p)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                          title="تعديل الفاتورة"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => callSpecificPatient(p.name)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="نداء صوتي لهذا العميل"
                        >
                          <Volume2 size={15} />
                        </button>
                        {isPrintAllowed && (
                          <button onClick={() => handlePrintTaxInvoice(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="طباعة الفاتورة">
                            <Printer size={15} />
                          </button>
                        )}
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="ملف العميل" onClick={() => setActiveTab('patients')}>
                          <UserCog size={15} />
                        </button>
                        <button onClick={() => removeFromQueue(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="حذف">
                          <Trash2 size={15} />
                        </button>
                        {p.status !== 'done' && (
                          <button onClick={() => finishExam(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="إنهاء">
                            <Check size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* Settings Modals */}
    <EditInvoiceModal
      isOpen={editingInvoice !== null}
      onClose={() => setEditingInvoice(null)}
      type="clinic"
      invoice={editingInvoice}
      clinicId={currentClinicId}
    />

    <InvoiceSettingsModal 
      isOpen={isInvoiceModalOpen} 
      onClose={() => setIsInvoiceModalOpen(false)} 
      targetClinicId={currentClinicId}
    />

    <VoiceCallSettingsModal 
      isOpen={isVoiceModalOpen} 
      onClose={() => setIsVoiceModalOpen(false)} 
    />

    <POSPaymentSimulator
      isOpen={isPosOpen}
      onClose={() => {
        setIsPosOpen(false);
        setTempRecord(null);
      }}
      amount={tempRecord ? tempRecord.paid : total}
      currency={currentCurrency}
      onPaymentSuccess={handlePosSuccess}
    />
  </div>
  );
}
