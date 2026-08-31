import React, { useState } from 'react';
import { MessageCircle, Send, CheckCheck, Users, Sparkles, Megaphone, Smartphone, HelpCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { WhatsappSettingsModal } from './WhatsappSettingsModal';

export default function WhatsAppCampaignManager() {
  const { data, updateData, currentUser } = useStore();
  const { currentClinicId } = useClinicContext();

  const [campaignTitle, setCampaignTitle] = useState('عروض الربيع الذهبية 🌟');
  const [campaignText, setCampaignText] = useState('مرحباً يا {الاسم}! يسعد مركزنا تقديم عرض مذهل لك خصم 25% على جميع خدمات الصبغة والترطيب هذا الأسبوع! احجز الآن لتستمتع بالدلال المستحق ✨');
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);
  const [campaignFinished, setCampaignFinished] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const currentClinic = data.clinics.find(c => c.id === currentClinicId);

  // Group by unique patients
  const records = Object.values(data.queue || {}).flat().concat(Object.values(data.archive || {}).flat());
  const uniquePatients: Record<string, { name: string, phone: string }> = {};
  records.forEach(r => {
    if (!uniquePatients[r.name] && r.phone) {
      uniquePatients[r.name] = { name: r.name, phone: r.phone };
    }
  });

  const patientList = Object.values(uniquePatients);

  // Launch simulated campaign
  const handleLaunchCampaign = () => {
    if (patientList.length === 0) {
      alert('لا يوجد عملاء مسجلين لإطلاق الحملة الترويجية عليهم!');
      return;
    }

    setCampaignLaunched(true);
    setCampaignFinished(false);
    setCurrentProgress(0);
    setSendingLogs([]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < patientList.length) {
        const patient = patientList[step];
        const customizedText = campaignText.replace(/{الاسم}/g, patient.name);
        
        setSendingLogs(prev => [
          `🟢 [إرسال ناجح] -> جاري الإرسال لرقم ${patient.phone} (${patient.name})... تم التوصيل بنجاح!`,
          ...prev
        ]);
        
        step++;
        setCurrentProgress(Math.floor((step / patientList.length) * 100));
      } else {
        clearInterval(interval);
        setCampaignFinished(true);
        
        // Success sound
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          osc.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5 Note
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch(e){}
      }
    }, 700);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn font-[Cairo]" dir="rtl">
      
      {/* Right side: Campaign Builder (8 Cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Templates configurator */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                <MessageCircle size={20} />
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 text-sm">إدارة قنوات وتنبيهات WhatsApp CRM الذكية</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">ضبط وتفعيل رسائل التأكيد والمتابعة الفورية للعملاء بعد الزيارة</p>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Smartphone size={14} />
              <span>تعديل رقم ارسال التذكيرات</span>
              {currentClinic?.whatsappNumber && (
                <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-mono dir-ltr">
                  {currentClinic.whatsappNumber}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">1. رسالة تذكير الحجوزات</span>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                تُرسل تلقائياً قبل الموعد بـ 24 ساعة للعملاء وتتضمن رابط تأكيد الحجز وإحداثيات موقع الفرع.
              </p>
              <div className="text-[10px] font-mono text-slate-400 bg-white p-2 rounded border leading-relaxed">
                "مرحباً {"{الاسم}"}، نذكرك بموعد جلستك المميزة غداً الساعة {"{الوقت}"} في {"{المركز}"}..."
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">2. رسالة شكر واستبيان الرضا</span>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                تُرسل تلقائياً بعد إنهاء موظفي الخدمة للجلسة بـ 30 دقيقة لتحصيل تقييم العميل ورصيد نقاط الولاء المكتسبة.
              </p>
              <div className="text-[10px] font-mono text-slate-400 bg-white p-2 rounded border leading-relaxed">
                "يسعدنا دلالكِ يا {"{الاسم}"}! تم إضافة {"{النقاط}"} نقطة لحسابكِ، كيف كانت تجربتكِ معنا؟..."
              </div>
            </div>
          </div>
        </div>

        {/* Group Broadcast Campaign Builder */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Megaphone size={18} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-800 text-sm">إطلاق حملة تسويقية جماعية (Bulk WhatsApp Broadcast)</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">أرسل العروض الترويجية والخصومات لجميع عملائك المسجلين بالنظام بضغطة زر واحدة</p>
            </div>
            <div className="mr-auto bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
              <Users size={12} />
              <span>{patientList.length} عميل مستهدف</span>
            </div>
          </div>

          {!campaignLaunched ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الحملة التسويقية:</label>
                  <input 
                    type="text" 
                    value={campaignTitle} 
                    onChange={e => setCampaignTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-600"
                    placeholder="عنوان الحملة للتتبع..."
                  />
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-[10px] flex items-center gap-2 font-bold leading-relaxed">
                  <span>💡</span>
                  <span>الذكاء الاصطناعي مدمج لمخاطبة كل عميل باسمه الأول تلقائياً لزيادة تفاعل العملاء وتحسين المبيعات.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">نص الرسالة التسويقية (يدعم علامة التضمين الاسم):</label>
                <textarea 
                  value={campaignText} 
                  onChange={e => setCampaignText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-indigo-600 leading-relaxed font-sans"
                  placeholder="اكتب نص الرسالة..."
                />
                <p className="text-[9px] text-slate-400 mt-1">استخدم علامة <span className="font-mono text-indigo-600 font-black">{"{الاسم}"}</span> ليقوم النظام باستبدالها آلياً باسم كل عميل مستقل.</p>
              </div>

              <button 
                onClick={handleLaunchCampaign}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Send size={14} />
                إطلاق حملة الواتس آب الموجهة الآن 🚀
              </button>
            </div>
          ) : (
            // Active Sending Progress Interface
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                    {campaignFinished ? (
                      <span className="text-emerald-500">✅ تم اكتمال الحملة!</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="animate-spin text-indigo-600" size={14} />
                        جاري البث والإرسال التلقائي...
                      </span>
                    )}
                  </h6>
                  <p className="text-[10px] text-slate-500 mt-0.5">حملة: {campaignTitle}</p>
                </div>
                <span className="text-xs font-black text-indigo-700">{currentProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>

              {/* Live Status Indicators */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 mb-0.5">تم تسليمها</p>
                  <p className="font-black text-slate-800">{Math.round(patientList.length * (currentProgress / 100))}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 mb-0.5 font-bold">معدل الفتح المقدر</p>
                  <p className="font-black text-emerald-600">96.4%</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 mb-0.5">تفاعلات الحجز</p>
                  <p className="font-black text-indigo-600">{Math.round(patientList.length * (currentProgress / 100) * 0.22)} حجز</p>
                </div>
              </div>

              {/* Logs box */}
              <div className="space-y-1.5 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono h-40 overflow-y-auto max-h-40 shadow-inner flex flex-col-reverse">
                {sendingLogs.length === 0 ? (
                  <span className="text-slate-500">تجميع جهات الاتصال وبث المحركات...</span>
                ) : (
                  sendingLogs.map((log, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span>{log}</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <CheckCheck size={10} />
                        DELIVERED
                      </span>
                    </div>
                  ))
                )}
              </div>

              {campaignFinished && (
                <button 
                  onClick={() => setCampaignLaunched(false)}
                  className="w-full bg-slate-800 hover:bg-slate-950 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                >
                  تصميم وإطلاق حملة جديدة أخرى
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Left side: Phone simulator of client inbox (4 cols) */}
      <div className="lg:col-span-4 flex justify-center">
        <div className="relative">
          {/* Mockup phone frame */}
          <div className="w-[260px] h-[520px] bg-slate-900 rounded-[38px] p-2.5 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
            
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 mx-auto w-24 h-4 bg-slate-900 rounded-b-xl z-[99] flex items-center justify-center">
              <div className="w-10 h-0.5 bg-slate-800 rounded-full"></div>
            </div>

            {/* Phone Screen: Mock WhatsApp Inbox */}
            <div className="bg-[#efeae2] flex-1 rounded-[28px] overflow-hidden flex flex-col relative pt-4">
              
              {/* WhatsApp chat header */}
              <div className="bg-[#075e54] text-white p-2.5 px-3 flex items-center gap-2 shadow-md">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full font-black text-[9px] flex items-center justify-center shadow">
                  ✨
                </div>
                <div>
                  <h6 className="font-extrabold text-[10px] leading-tight">قناة الصالون الموثقة</h6>
                  <p className="text-[7px] text-emerald-200 mt-0.5">متصل الآن • Verified Business</p>
                </div>
              </div>

              {/* Chat bubble body */}
              <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto flex flex-col justify-end pb-8">
                
                {/* Simulated message bubbles popping in */}
                {campaignLaunched && (
                  <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] self-start text-right space-y-1 relative animate-in slide-in-from-left duration-200 border border-slate-200/50">
                    <p className="text-[10px] font-bold text-emerald-800">قناة صالون التجميل</p>
                    <p className="text-[9px] text-slate-700 leading-relaxed font-semibold">
                      {campaignText.replace(/{الاسم}/g, 'أمل أحمد')}
                    </p>
                    <div className="flex justify-end gap-1 items-center text-[7px] text-slate-400 font-bold pt-1">
                      <span>12:45 م</span>
                      <CheckCheck size={10} className="text-sky-500" />
                    </div>
                  </div>
                )}

                <div className="bg-slate-200/60 backdrop-blur-sm py-1.5 px-3 rounded-full text-center max-w-[90%] mx-auto text-[8px] text-slate-500 font-bold">
                  ⚠️ هذه محاكاة حية لطريقة ظهور الرسالة على جوال العميل
                </div>

              </div>
            </div>

            {/* Bottom indicator strip */}
            <div className="absolute bottom-1 inset-x-0 mx-auto w-20 h-0.5 bg-slate-700 rounded-full"></div>
          </div>
          <p className="text-center text-[10px] font-bold text-slate-500 mt-2 flex items-center justify-center gap-1">
            <Smartphone size={12} />
            معاينة استلام العميل للرسالة
          </p>
        </div>
      </div>

      <WhatsappSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        targetClinicId={currentClinicId}
      />
    </div>
  );
}
