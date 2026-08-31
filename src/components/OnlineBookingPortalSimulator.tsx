import React, { useState } from 'react';
import { Smartphone, Sparkles, QrCode, Copy, Check, CheckCircle, Clock, Calendar, ShieldCheck, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { Appointment } from '../types';

export default function OnlineBookingPortalSimulator() {
  const { data, updateData, currentUser } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();

  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  // Client simulated states
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cTime, setCTime] = useState('16:30');
  const [cService, setCService] = useState('');
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');

  // Customizer states
  const [welcomeMsg, setWelcomeMsg] = useState('مرحباً بكم في مركزنا - احجز جلستك الآن بثوانٍ!');
  const [themeColor, setThemeColor] = useState('#4f46e5'); // Indigo 600

  const currentClinic = data.clinics.find(c => c.id === currentClinicId);
  const clinicName = currentClinic ? currentClinic.name : 'مركز العناية والتجميل';
  const clinicServices = (data.services || []).filter(s => !s.clinicId || s.clinicId === currentClinicId);

  const publicBookingUrl = `${window.location.origin}${window.location.pathname}?booking=true&clinicId=${currentClinicId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatedBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cPhone || !cDate || !cTime) {
      alert('الرجاء تعبئة الاسم والجوال والتاريخ والوقت!');
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      name: cName,
      phone: cPhone,
      date: cDate,
      time: cTime,
      service: cService ? `${cService} (حجز أونلاين ذاتي)` : 'جلسة تجميل مخصصة'
    };

    const currentAppointments = data.appointments?.[currentClinicId] || [];
    updateData({
      appointments: {
        ...(data.appointments || {}),
        [currentClinicId]: [newAppointment, ...currentAppointments]
      }
    });

    // Play chime sound using synthesis or AudioContext
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pleasant A5 note
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.12); // High E6 note
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch(err){}

    setSuccess(true);
  };

  const handleResetSim = () => {
    setSuccess(false);
    setCName('');
    setCPhone('');
    setCService('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn font-[Cairo]" dir="rtl">
      
      {/* Right Column: Customize and Share Settings (8 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Share card & QR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <QrCode size={20} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-800 text-sm">مشاركة بوابة الحجز الأونلاين للعملاء</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">انسخ الرابط أو شارك الباركود على انستغرام وسناب شات وواتساب لاستقبال المواعيد تلقائياً</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 space-y-3">
              <label className="block text-xs font-bold text-slate-600">رابط الحجز المباشر لفرعك:</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-2.5">
                <input 
                  type="text" 
                  value={publicBookingUrl} 
                  readOnly 
                  className="bg-transparent text-slate-500 font-mono text-[10px] outline-none flex-1 pr-2 text-left" 
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
              </div>
              <p className="text-[9px] text-slate-400">💡 عندما ينقر العميل على الرابط، تظهر له واجهة حجز ذكية مخصصة للجوال.</p>
            </div>

            <div className="md:col-span-4 flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1.5">
              <div className="w-24 h-24 bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center relative">
                {/* Simulated Beautiful QR Code */}
                <div className="grid grid-cols-8 gap-0.5 w-full h-full opacity-90">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const active = (i % 2 === 0 && i % 3 !== 0) || (i < 16 && i % 4 === 0) || (i > 48 && i % 5 === 0);
                    return (
                      <div 
                        key={i} 
                        className={`rounded-[1px] ${active ? 'bg-slate-800' : 'bg-transparent'} ${
                          (i === 0 || i === 1 || i === 8 || i === 9 || i === 6 || i === 7 || i === 14 || i === 15 || i === 48 || i === 49 || i === 56 || i === 57) ? 'bg-indigo-600' : ''
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="absolute inset-0 m-auto w-7 h-7 bg-white rounded-md border border-slate-200 shadow flex items-center justify-center">
                  <span className="text-[9px]">✨</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-700">QR Code المباشر للصالون</span>
            </div>
          </div>
        </div>

        {/* Customizer Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-800 text-sm">تخصيص الهوية والرسائل للعملاء</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">صمم مظهر وعبارات الترحيب بصفحة الحجز الخاصة بك</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">عنوان الترحيب الرئيسي بصفحة الحجز:</label>
              <input 
                type="text" 
                value={welcomeMsg} 
                onChange={e => setWelcomeMsg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-600"
                placeholder="اكتب رسالة ترحيبية..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اللون الرئيسي لزر الحجز والهوية (Brand Color):</label>
              <div className="flex items-center gap-2">
                {['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'].map(col => (
                  <button 
                    key={col} 
                    onClick={() => setThemeColor(col)}
                    className="w-8 h-8 rounded-full border-2 transition-all relative"
                    style={{ backgroundColor: col, borderColor: themeColor === col ? '#1e293b' : 'transparent' }}
                  >
                    {themeColor === col && <span className="absolute inset-0 m-auto text-white text-[10px] font-black">✓</span>}
                  </button>
                ))}
                <input 
                  type="color" 
                  value={themeColor} 
                  onChange={e => setThemeColor(e.target.value)}
                  className="w-10 h-8 rounded-lg cursor-pointer bg-slate-100 p-1 border" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature info highlights */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3">
          <span className="text-xl">🌟</span>
          <div className="space-y-1">
            <h6 className="font-extrabold text-indigo-900 text-xs">ميزة تنافسية: تجميع وتدفق المواعيد بدون أخطاء</h6>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              عند قيام عميل بتسجيل موعد، يقوم نظام **Shamel Beauty ERP** بفحص مواعيد الأخصائيين والتحقق من عدم وجود تضارب في الأوقات، مع إرسال إشعار تذكير تلقائي عبر الواتساب لتأكيد الحجز قبل الموعد بـ 24 ساعة لضمان أعلى التزام.
            </p>
          </div>
        </div>
      </div>

      {/* Left Column: Phone Simulator Frame (5 Cols) */}
      <div className="lg:col-span-5 flex justify-center">
        <div className="relative">
          {/* Smartphone mockup frame container */}
          <div className="w-[290px] h-[580px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
            
            {/* Phone Notch/Speaker */}
            <div className="absolute top-0 inset-x-0 mx-auto w-32 h-6 bg-slate-900 rounded-b-2xl z-[99] flex items-center justify-center gap-1.5 pb-1">
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
            </div>

            {/* Simulated App / Browser inside screen */}
            <div className="bg-slate-100 flex-1 rounded-[32px] overflow-hidden flex flex-col relative pt-5">
              
              {/* Browser Address Bar */}
              <div className="bg-white/90 backdrop-blur-md p-1 px-3 border-b border-slate-200/80 text-[8px] font-mono text-slate-400 flex items-center gap-1.5 justify-center">
                <span className="text-[6px] text-emerald-500 animate-pulse">🔒</span>
                <span>beauty-booking.com/{currentClinicId}</span>
              </div>

              {/* Dynamic Theme Color Top Strip */}
              <div className="h-1.5 w-full" style={{ backgroundColor: themeColor }}></div>

              {/* Inner Booking Client Form Simulator */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-10 text-right">
                
                {success ? (
                  <div className="py-12 text-center space-y-3 animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle size={24} />
                    </div>
                    <h6 className="font-extrabold text-slate-800 text-sm">تم حجز موعدك بنجاح!</h6>
                    <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                      شكراً لكِ يا <span className="font-bold text-indigo-600">{cName}</span>. تم تسجيل موعدكِ بنجاح في نظام الصالون وسيقوم فريق العمل بتأكيد الخدمة.
                    </p>
                    <button 
                      onClick={handleResetSim}
                      className="text-[10px] font-bold text-white px-5 py-2 rounded-xl transition-all hover:opacity-90 mt-2 shadow-sm"
                      style={{ backgroundColor: themeColor }}
                    >
                      حجز موعد جديد
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSimulatedBookingSubmit} className="space-y-3">
                    
                    {/* Salon Card Info inside simulator */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-1.5 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 w-10 h-10 bg-slate-100 rounded-bl-3xl flex items-center justify-center text-xs">
                        💅
                      </div>
                      <h5 className="font-black text-xs text-slate-800 pt-1">{clinicName}</h5>
                      <p className="text-[9px] text-slate-500 leading-relaxed leading-normal px-2">{welcomeMsg}</p>
                    </div>

                    {/* Gender select inside simulator */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button 
                        type="button"
                        onClick={() => setSelectedGender('female')}
                        className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                          selectedGender === 'female' ? 'bg-pink-50 border-pink-400 text-pink-700 font-extrabold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        👩 سيدات (Ladies)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedGender('male')}
                        className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                          selectedGender === 'male' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-extrabold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        🧔 رجال (Gents)
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-0.5">اسم العميل(ة):</label>
                        <input 
                          type="text" 
                          value={cName}
                          onChange={e => setCName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] outline-none"
                          placeholder="الاسم الثلاثي..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-0.5">رقم الجوال:</label>
                        <input 
                          type="text" 
                          value={cPhone}
                          onChange={e => setCPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] text-left outline-none"
                          placeholder="05xxxxxxx"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 mb-0.5">التاريخ:</label>
                          <input 
                            type="date" 
                            value={cDate}
                            onChange={e => setCDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-1 py-1.5 text-[9px] outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 mb-0.5">الوقت:</label>
                          <input 
                            type="time" 
                            value={cTime}
                            onChange={e => setCTime(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 text-[9px] outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 mb-0.5">اختر الخدمة المطلوبة:</label>
                        <select 
                          value={cService}
                          onChange={e => setCService(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 text-[9px] font-bold outline-none"
                          required
                        >
                          <option value="">اختر الخدمة...</option>
                          {clinicServices.map((s, i) => (
                            <option key={i} value={s.name}>{s.name} ({s.price} {currentCurrency})</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full text-white font-extrabold text-[10px] py-2 rounded-xl shadow-sm transition-all hover:brightness-105 active:scale-95"
                        style={{ backgroundColor: themeColor }}
                      >
                        إرسال وتأكيد الحجز الذاتي 📲
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-200 text-center">
                      <span className="text-[8px] text-slate-400 font-bold flex items-center justify-center gap-1">
                        <ShieldCheck size={9} className="text-emerald-500" />
                        نظام حجز آمن ومحمي ومصدق
                      </span>
                    </div>

                  </form>
                )}

              </div>
            </div>

            {/* Home indicator strip */}
            <div className="absolute bottom-1 inset-x-0 mx-auto w-24 h-1 bg-slate-700 rounded-full"></div>
          </div>
          
          {/* Label below phone */}
          <p className="text-center text-[11px] font-bold text-slate-500 mt-2 flex items-center justify-center gap-1">
            <Smartphone size={12} />
            محاكي الجوال التفاعلي للعميل
          </p>
        </div>
      </div>

    </div>
  );
}
