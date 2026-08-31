import React, { useState } from 'react';
import { 
  Calendar, Clock, User, CheckCircle, Plus, Phone, Sparkles, 
  Trash2, ArrowRightCircle, ExternalLink, Filter, Check, Scissors,
  MessageCircle, Smartphone, Megaphone
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { ExportButtons } from '../components/ExportButtons';
import { Appointment, RecordItem } from '../types';
import { recordActivityLog } from '../utils/activityLogger';
import OnlineBookingPortalSimulator from '../components/OnlineBookingPortalSimulator';
import WhatsAppCampaignManager from '../components/WhatsAppCampaignManager';
import { WhatsappSettingsModal } from '../components/WhatsappSettingsModal';

export default function AppointmentsTab() {
  const { data, updateData, currentUser, setActiveTab } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();

  const [subTab, setSubTab] = useState<'schedule' | 'online' | 'crm'>('schedule');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [selectedService, setSelectedService] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [search, setSearch] = useState('');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

  // Center & Permission lookup
  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  // Fetch appointments for this clinic
  const currentClinic = data.clinics.find(c => c.id === currentClinicId);
  const clinicAppointments = data.appointments?.[currentClinicId] || [];

  const center = getCenterForUser();
  const whatsappEnabled = currentUser?.role === 'developer' || center?.permissions?.devEnableWhatsappReminders !== false;
  const senderNumber = currentClinic?.whatsappNumber || center?.permissions?.devWhatsappSenderNumber || '966500000000';

  // Link for public booking
  const publicBookingUrl = `${window.location.origin}${window.location.pathname}?booking=true&clinicId=${currentClinicId}`;

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !date || !time) {
      alert('يرجى إدخال اسم العميل، رقم الهاتف، التاريخ والوقت!');
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      name,
      phone,
      date,
      time,
      service: selectedService || 'جلسة استشارة وتجميل'
    };

    const updated = [newAppointment, ...clinicAppointments];
    updateData({
      appointments: {
        ...(data.appointments || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'إضافة حجز موعد',
      `تم حجز موعد جديد للعميل (${name}) بتاريخ ${date} في تمام الساعة ${time}`
    );

    setName('');
    setPhone('');
    setSelectedService('');
    alert('تم تسجيل الموعد بنجاح!');
  };

  const handleDeleteAppointment = (id: number, patientName: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء وحذف موعد (${patientName})؟`)) return;

    const updated = clinicAppointments.filter(a => a.id !== id);
    updateData({
      appointments: {
        ...(data.appointments || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'إلغاء حجز موعد',
      `تم إلغاء موعد العميل (${patientName})`
    );
  };

  const handleTransferToQueue = (appointment: Appointment) => {
    const queue = data.queue[currentClinicId] || [];
    
    // Check if already in queue
    const alreadyInQueue = queue.some(q => q.name === appointment.name && q.status === 'waiting');
    if (alreadyInQueue) {
      alert('هذا العميل مسجل بالفعل في طابور الانتظار النشط حالياً!');
      return;
    }

    const matchedService = data.services.find(s => s.name === appointment.service);
    const servicePrice = matchedService ? matchedService.price : 0;
    const now = new Date();

    const newRecord: RecordItem = {
      id: Date.now(),
      name: appointment.name,
      age: '',
      phone: appointment.phone,
      service: appointment.service || 'جلسة تجميل',
      total: servicePrice,
      paid: servicePrice,
      payMethod: 'نقدي (خزينة الكاش)',
      handler: currentUser?.name || '',
      due: 0,
      status: 'waiting',
      isoDate: now.toISOString().split('T')[0],
      date: `${appointment.date} - ${appointment.time}`
    };

    // Add to queue and remove from appointments
    const updatedAppointments = clinicAppointments.filter(a => a.id !== appointment.id);
    updateData({
      queue: { ...data.queue, [currentClinicId]: [...queue, newRecord] },
      appointments: { ...(data.appointments || {}), [currentClinicId]: updatedAppointments }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'تسكين حجز في الطابور',
      `تم نقل حجز العميل (${appointment.name}) مباشرة إلى طابور الانتظار`
    );

    alert(`تم نقل العميل (${appointment.name}) إلى طابور الانتظار بنجاح!`);
    setActiveTab('dashboard');
  };

  const handleSendWhatsappReminder = (appt: Appointment) => {
    if (!whatsappEnabled) {
      alert('⚠️ ميزة تذكيرات الواتساب غير مفعلة لهذا المركز حالياً من قبل المطور. يمكنك تفعيلها من لوحة تحكم المطور في تبويب الإعدادات.');
      return;
    }
    
    const clinicName = currentClinic?.name || 'مركز التجميل';
    const defaultTemplate = 'مرحباً {الاسم}، يسر مركز {المركز} تذكيرك بموعد جلستك المميزة يوم {التاريخ} في تمام الساعة {الوقت} لخدمة ({الخدمة}). ننتظر حضورك المشرق! ✨';
    
    const rawTemplate = currentClinic?.whatsappTemplate || defaultTemplate;
    
    // Replace custom tags with actual appointment values
    const messageText = rawTemplate
      .replace(/{الاسم}/g, appt.name)
      .replace(/{المركز}/g, clinicName)
      .replace(/{التاريخ}/g, appt.date)
      .replace(/{الوقت}/g, appt.time)
      .replace(/{الخدمة}/g, appt.service || 'تجميل')
      .replace(/{السعر}/g, 'المحدد بالباقة')
      .replace(/{الرابط}/g, `${window.location.origin}?booking=true&clinicId=${currentClinicId}`);
    
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
      audio.play().catch(() => {});
    } catch(e){}

    const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    
    // Open WhatsApp directly
    window.open(waUrl, '_blank');

    alert(`📱 [تم تجهيز وفتح محادثة الواتس آب للعميل بنجاح]
مرسل من الرقم المعتمد للمركز: ${senderNumber}
إلى جوال العميل: ${appt.phone}

نص رسالة التذكير المخصصة:
"${messageText}"`);
  };

  // Filter appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredAppointments = clinicAppointments.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.phone.includes(search);
    if (!matchSearch) return false;

    if (filterDate === 'today') return a.date === todayStr;
    if (filterDate === 'upcoming') return a.date >= todayStr;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24} />
            إدارة الحجوزات والمواعيد المسبقة
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            الفرع النشط: <span className="text-indigo-600 font-bold">{currentUser?.role === 'developer' ? 'نظام المطور' : (currentClinic?.name || 'غير محدد')}</span> | يمكنك إضافة مواعيد، ربطها بالطابور المباشر، ومشاركة رابط الحجز الأونلاين للعملاء.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Public Booking Link Badge */}
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs">
            <Sparkles className="text-indigo-600" size={15} />
            <span className="font-bold text-indigo-900 hidden sm:inline">رابط الحجز الأونلاين:</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(publicBookingUrl);
                alert('تم نسخ رابط الحجز الأونلاين بنجاح! يمكنك مشاركته مع العملاء على منصات التواصل.');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="نسخ الرابط"
            >
              نسخ الرابط
            </button>
          </div>

          {/* Edit WhatsApp Sender Number Button */}
          <button 
            onClick={() => setIsWhatsappModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow-emerald-200"
            title="تعديل الرقم الذي يُرسل منه التنبيهات والتذكيرات للعملاء"
          >
            <MessageCircle size={15} />
            <span>تعديل رقم الواتساب المُنبه</span>
            <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-mono dir-ltr">
              {currentClinic?.whatsappNumber || senderNumber}
            </span>
          </button>
        </div>
      </div>

      {/* Sub tabs Selector */}
      <div className="flex gap-2 border-b border-slate-200 pb-px no-print">
        <button 
          onClick={() => setSubTab('schedule')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${subTab === 'schedule' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Calendar size={14} />
          جدول المواعيد والحجوزات المباشرة
        </button>
        <button 
          onClick={() => setSubTab('online')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${subTab === 'online' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Smartphone size={14} />
          بوابة الحجز الذاتي والعملاء أونلاين
        </button>
        <button 
          onClick={() => setSubTab('crm')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${subTab === 'crm' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Megaphone size={14} />
          تنبيهات وحملات الواتساب CRM
        </button>
      </div>

      {subTab === 'online' && <OnlineBookingPortalSimulator />}
      {subTab === 'crm' && <WhatsAppCampaignManager />}

      {subTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Booking Form */}
          <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h6 className="font-bold mb-4 text-indigo-600 flex items-center gap-2 text-base">
              <Plus size={18} />
              تسجيل حجز موعد جديد
            </h6>

            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل(ة)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                  placeholder="اسم العميل..." 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف (للتواصل)</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                  placeholder="01xxxxxxxxx" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الموعد</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الوقت</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الخدمة المطلوبة</label>
                <select 
                  value={selectedService} 
                  onChange={e => setSelectedService(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors"
                >
                  <option value="">اختر الخدمة أو الباقة...</option>
                  {(data.services || []).filter(s => !s.clinicId || s.clinicId === currentClinicId).map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name} ({s.price} {currentCurrency})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2.5 mt-2 shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                تأكيد وحفظ الموعد
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Appointments List Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full" id="print-appointments">
            <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
              <div className="flex items-center gap-3">
                <h6 className="font-bold text-slate-900 m-0 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  قائمة المواعيد المحجوزة ({filteredAppointments.length})
                </h6>
                
                {/* Date quick filter */}
                <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold">
                  <button 
                    onClick={() => setFilterDate('all')} 
                    className={`px-2.5 py-1 rounded-md transition-all ${filterDate === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}`}
                  >
                    الكل
                  </button>
                  <button 
                    onClick={() => setFilterDate('today')} 
                    className={`px-2.5 py-1 rounded-md transition-all ${filterDate === 'today' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}`}
                  >
                    مواعيد اليوم
                  </button>
                  <button 
                    onClick={() => setFilterDate('upcoming')} 
                    className={`px-2.5 py-1 rounded-md transition-all ${filterDate === 'upcoming' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'}`}
                  >
                    القادمة
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="بحث باسم العميل أو الهاتف..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 w-44"
                />
                <ExportButtons 
                  data={filteredAppointments}
                  pdfHeaders={['العميل', 'رقم الهاتف', 'التاريخ', 'الوقت', 'الخدمة']}
                  pdfData={filteredAppointments.map(a => [a.name, a.phone, a.date, a.time, a.service || 'تجميل'])}
                  filename="appointments_schedule"
                  title="جدول مواعيد وحجوزات المركز"
                  printElementId="print-appointments"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 font-bold">#</th>
                    <th className="p-3 font-bold">اسم العميل</th>
                    <th className="p-3 font-bold">رقم الهاتف</th>
                    <th className="p-3 font-bold">التاريخ</th>
                    <th className="p-3 font-bold">الوقت</th>
                    <th className="p-3 font-bold">الخدمة</th>
                    <th className="p-3 font-bold no-print">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد مواعيد مسجلة تطابق البحث
                      </td>
                    </tr>
                  ) : filteredAppointments.map((a, i) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-slate-500">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {a.name}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-xs" dir="ltr">{a.phone}</td>
                      <td className="p-3 font-medium text-slate-700">
                        <span className={`px-2 py-0.5 rounded text-xs ${a.date === todayStr ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : ''}`}>
                          {a.date}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-xs flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {a.time}
                      </td>
                      <td className="p-3 text-slate-700 max-w-[120px] truncate" title={a.service}>
                        {a.service || 'جلسة تجميل'}
                      </td>
                      <td className="p-3 no-print">
                        <div className="flex items-center gap-1.5">
                          {/* Transfer to live Queue button */}
                          <button 
                            onClick={() => handleTransferToQueue(a)} 
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="تسكين الموعد في طابور الانتظار الآن"
                          >
                            <ArrowRightCircle size={13} />
                            تسكين بالطابور
                          </button>

                          {/* WhatsApp Reminder Button */}
                          <button 
                            onClick={() => handleSendWhatsappReminder(a)} 
                            className="bg-indigo-55 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="إرسال رسالة تذكير بالموعد عبر الواتساب للعميل"
                          >
                            <MessageCircle size={13} className="text-indigo-600 animate-pulse" />
                            تذكير واتساب
                          </button>
                          
                          {/* Cancel / Delete Appointment */}
                          <button 
                            onClick={() => handleDeleteAppointment(a.id, a.name)} 
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                            title="إلغاء وحذف الموعد"
                          >
                            <Trash2 size={14} />
                          </button>
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
      )}

      <WhatsappSettingsModal 
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        targetClinicId={currentClinicId}
      />
    </div>
  );
}
