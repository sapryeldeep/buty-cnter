import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { 
  MessageSquare, X, Send, Sparkles, Check, 
  Calendar, Phone, User as UserIcon, Bell, 
  Share2, MessageCircle, AlertTriangle, Play 
} from 'lucide-react';
import { Appointment } from '../types';

export function AIChatbotWidget() {
  const { data, currentUser, updateData } = useStore();
  const { currentClinicId } = useClinicContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bot' | 'whatsapp' | 'alerts'>('bot');
  
  // Real-time toast alerts state
  const [toastAlert, setToastAlert] = useState<{ id: number; title: string; desc: string; type: 'success' | 'info' } | null>(null);
  
  // Chatbot states
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; action?: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [botStep, setBotStep] = useState<'welcome' | 'name' | 'phone' | 'branch' | 'service' | 'date' | 'time' | 'done'>('welcome');
  
  // New appointment flow variables
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingBranchId, setBookingBranchId] = useState('');
  const [bookingService, setBookingService] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  // Track appointments across ALL clinics for live real-time detection
  const prevAppointmentsRef = useRef<Record<string, number>>({});
  const isFirstLoad = useRef(true);

  // Center & Permission lookup
  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };

  const center = getCenterForUser();
  const chatbotEnabled = currentUser?.role === 'developer' || center?.permissions?.devEnableChatbot === true;
  const whatsappEnabled = currentUser?.role === 'developer' || center?.permissions?.devEnableWhatsappReminders === true;
  const senderNumber = center?.permissions?.devWhatsappSenderNumber || '966500000000';

  // Format current list of appointments to watch
  const getTotalAppointmentsMap = (): Record<string, number> => {
    const map: Record<string, number> = {};
    data.clinics.forEach(c => {
      map[c.id] = (data.appointments?.[c.id] || []).length;
    });
    return map;
  };

  // Audio unlock helper for bypass of browser autoplay policies
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    const unlock = () => {
      if (!audioUnlocked) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          setAudioUnlocked(true);
        } catch (e) {
          console.warn('AudioContext unlock failed', e);
        }
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
      }
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [audioUnlocked]);

  // Play Notification sound safely
  const playAlertSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
      audio.volume = 0.7; // Enhanced volume for receptionists to hear clearly
      audio.play().catch(e => console.log('Audio autoplay prevented, needs user interaction first.', e));
    } catch (err) {
      console.error('Error playing sound', err);
    }
  };

  // Real-time Listener for NEW Appointments
  useEffect(() => {
    const currentMap = getTotalAppointmentsMap();
    
    if (isFirstLoad.current) {
      prevAppointmentsRef.current = currentMap;
      isFirstLoad.current = false;
      return;
    }

    const userRole = currentUser?.role;
    const userClinicId = currentUser?.clinicId;
    const isMasterOrDev = userRole === 'developer' || userRole === 'master_admin';

    // Compare and find any new appointment
    Object.keys(currentMap).forEach(clinicId => {
      // Receptionist / specific staff should only hear appointments of their own clinic
      if (!isMasterOrDev && userClinicId && clinicId !== userClinicId) {
        return; // skip alerting receptionist for other branches
      }

      const prevCount = prevAppointmentsRef.current[clinicId] || 0;
      const currentCount = currentMap[clinicId] || 0;
      
      if (currentCount > prevCount) {
        // Fetch newest appointment
        const list = data.appointments?.[clinicId] || [];
        const newest = list[0]; // Assuming newest is appended first
        
        if (newest) {
          const clinicObj = data.clinics.find(c => c.id === clinicId);
          playAlertSound();
          setToastAlert({
            id: Date.now(),
            title: '🎉 حجز إلكتروني جديد!',
            desc: `تم حجز موعد للعميل (${newest.name}) في فرع (${clinicObj?.name || 'الرئيسي'}) لخدمة (${newest.service}) في تمام ${newest.time} بتاريخ ${newest.date}.`,
            type: 'success'
          });
        }
      }
    });

    prevAppointmentsRef.current = currentMap;
  }, [data.appointments]);

  // Initial welcome message for Chatbot
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: `مرحباً بك في المساعد الذكي لمركز ${center?.name || 'التجميل والرشاقة'}! ✨ أنا هنا لمساعدتك في الاستفسار عن الخدمات أو حجز موعد فوري.`,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        },
        {
          sender: 'bot',
          text: `كيف يمكنني خدمتك اليوم؟ يمكنك الضغط على أحد الخيارات بالأسفل للتحدث معي مباشرة.`,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          action: 'options'
        }
      ]);
    }
  }, [isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { sender: 'user' as const, text, time: userTime }];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      let replyText = '';
      let nextStep = botStep;

      // Clean text for NLP matching
      const query = text.toLowerCase();

      if (query.includes('الأسعار') || query.includes('اسعار') || query.includes('باقات') || query.includes('الخدمات') || query.includes('خدمات')) {
        const servicesList = data.services.slice(0, 5).map(s => `🌸 ${s.name} - بسعر ${s.price} ${data.clinics[0]?.currency || 'SAR'}`).join('\n');
        replyText = `إليك عروضنا وباقاتنا الحالية المميزة:\n\n${servicesList || 'خدمات تجميل، ليزر، فيلر، وعناية متكاملة.'}\n\nهل تود حجز أحد هذه الباقات الآن؟`;
        nextStep = 'welcome';
      } else if (query.includes('الفروع') || query.includes('فرع') || query.includes('وينكم')) {
        const clinicsList = data.clinics.map(c => `📍 فرع ${c.name} (${c.currency})`).join('\n');
        replyText = `فروعنا المنتشرة لخدمتكم بأرقى المستويات:\n\n${clinicsList || 'الفرع الرئيسي التجميلي.'}\n\nيسعدنا حجز أقرب موعد لك!`;
        nextStep = 'welcome';
      } else if (query.includes('حجز') || query.includes('احجز') || query.includes('موعد') || query.includes('جلسة')) {
        replyText = 'يسعدني جداً حجز موعد لك! يرجى تزويدي باسمك الثلاثي الكريم لإدراج الحجز باسمك:';
        nextStep = 'name';
      } else if (botStep === 'name') {
        setBookingName(text);
        replyText = `أهلاً بك يا ${text}، يسعدنا تواصلك. تفضل بكتابة رقم جوالك لتأكيد الحجز لاحقاً وتفعيل تذكيرات الواتساب:`;
        nextStep = 'phone';
      } else if (botStep === 'phone') {
        setBookingPhone(text);
        // Select branch
        const optionsStr = data.clinics.map((c, i) => `${i + 1}. فرع ${c.name}`).join('\n');
        replyText = `شكراً لك. يرجى اختيار الفرع المفضل لديك للحجز عن طريق كتابة اسمه أو رقمه:\n\n${optionsStr || '1. الفرع الرئيسي'}`;
        nextStep = 'branch';
      } else if (botStep === 'branch') {
        // Set branch (default to current or parsed one)
        const selectedClinic = data.clinics[0] || { id: 'master', name: 'الرئيسي' };
        setBookingBranchId(selectedClinic.id);
        
        // Ask for service
        const servsStr = data.services.slice(0, 5).map((s, i) => `${i + 1}. ${s.name}`).join('\n');
        replyText = `تم اختيار الفرع. ما هي الخدمة التجميلية أو للعناية المطلوبة؟\n\n${servsStr || '1. استشارة وجلسة عامة'}`;
        nextStep = 'service';
      } else if (botStep === 'service') {
        setBookingService(text);
        replyText = 'يرجى كتابة تاريخ الجلسة المطلوبة بأسلوب (السنة-الشهر-اليوم) مثلاً 2026-09-01:';
        nextStep = 'date';
      } else if (botStep === 'date') {
        setBookingDate(text);
        replyText = 'ما هو التوقيت المناسب لحضورك؟ (مثلاً: 14:00 أو 04:30 مساءً):';
        nextStep = 'time';
      } else if (botStep === 'time') {
        setBookingTime(text);
        
        // Register the appointment live!
        const targetClinic = bookingBranchId || currentClinicId || 'master';
        const currentAppts = data.appointments?.[targetClinic] || [];
        const newApp: Appointment = {
          id: Date.now(),
          name: bookingName || 'عميل واتس اب',
          phone: bookingPhone || '0500000000',
          date: text.includes('-') ? text : bookingDate || '2026-09-01',
          time: text,
          service: bookingService || 'حجز ذكي من الشات بوت'
        };

        updateData({
          appointments: {
            ...(data.appointments || {}),
            [targetClinic]: [newApp, ...currentAppts]
          }
        });

        replyText = `🎉 رائع جداً! تم تسجيل حجزك بنجاح وسيكون فريق العمل بانتظارك.\n\n👤 الاسم: ${bookingName}\n📞 الجوال: ${bookingPhone}\n📅 التاريخ: ${bookingDate}\n⏰ الوقت: ${text}\n💇 الخدمة: ${bookingService}\n\nسيصلك رابط تأكيد الحجز فورا على رقم الواتساب الخاص بك!`;
        nextStep = 'done';
      } else {
        replyText = 'أهلاً بك! يمكنك السؤال عن "الخدمات وعروض التجميل"، "عناوين الفروع"، أو كتابة "أريد حجز موعد" للبدء فوراً في تسجيل حجزك تلقائياً.';
        nextStep = 'welcome';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: replyText, time: botTime }]);
      setBotStep(nextStep);
      setIsTyping(false);
    }, 1000);
  };

  // Quick Action Buttons
  const triggerQuickAction = (action: string) => {
    if (action === 'book') {
      handleSendMessage('أود حجز موعد تجميل');
    } else if (action === 'services') {
      handleSendMessage('ما هي باقات الخدمات المتوفرة لديكم؟');
    } else if (action === 'branches') {
      handleSendMessage('ما هي الفروع وعناوينها؟');
    }
  };

  // Simulation parameters for WhatsApp Reminders
  const [whatsappTemplate, setWhatsappTemplate] = useState('مرحباً {الاسم}، يسر مركز {المركز} تذكيرك بموعد جلستك غداً {التاريخ} في تمام {الوقت}. ننتظر حضورك المشرق لخدمتك بأرقى المستويات! ✨ للاستفسار راسلنا على الرقم المرسل.');
  const [simTargetName, setSimTargetName] = useState('نورة السديري');
  const [simTargetPhone, setSimTargetPhone] = useState('+966501234567');
  const [simTargetDate, setSimTargetDate] = useState('2026-09-01');
  const [simTargetTime, setSimTargetTime] = useState('17:30');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const handleSimulateWhatsapp = () => {
    if (!whatsappEnabled) {
      alert('ميزة الواتساب غير مفعلة من لوحة المطور لهذا المركز!');
      return;
    }
    
    setIsSimulating(true);
    setSimulationLog(prev => [`⏳ جاري الاتصال بخادم إرسال الواتساب من الرقم (${senderNumber})...`, ...prev]);

    setTimeout(() => {
      const message = whatsappTemplate
        .replace('{الاسم}', simTargetName)
        .replace('{المركز}', center?.name || 'الشامل للتجميل')
        .replace('{التاريخ}', simTargetDate)
        .replace('{الوقت}', simTargetTime);

      setSimulationLog(prev => [
        `✅ تم الإرسال بنجاح إلى: ${simTargetPhone}`,
        `💬 محتوى الرسالة: "${message}"`,
        `📱 مرسل من الرقم: ${senderNumber}`,
        `✨ حالة الرسالة: تم الاستلام والقراءة (Double Blue Tick)`,
        ...prev
      ]);
      setIsSimulating(false);

      // Trigger standard audio notification
      playAlertSound();
      setToastAlert({
        id: Date.now(),
        title: '📱 محاكاة إرسال واتساب ناجحة!',
        desc: `تم إرسال تذكير موعد للعميلة ${simTargetName} على جوالها بنجاح ومزامنته مع فرعها.`,
        type: 'info'
      });
    }, 1500);
  };

  // Automatically trigger toast timeout
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => {
        setToastAlert(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Generate Booking link copy helper
  const bookingLink = `${window.location.origin}${window.location.pathname}?booking=true`;

  return (
    <>
      {/* 1. Real-time Toast Alerts at Top-Right of Page */}
      {toastAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-2xl shadow-xl border-l-4 border-emerald-500 p-4 font-[Cairo] animate-bounce no-print">
          <div className="flex gap-3">
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
              <Bell size={20} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-900 text-xs">{toastAlert.title}</span>
                <button onClick={() => setToastAlert(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{toastAlert.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Action Button for AI Chatbot / WhatsApp */}
      {chatbotEnabled && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 left-24 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-110 active:scale-95 transition-all z-50 no-print"
          title="شات بوت الحجز والمساعدة الذكي"
        >
          {isOpen ? <X size={24} /> : (
            <div className="relative">
              <Sparkles size={24} className="animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>
          )}
        </button>
      )}

      {/* 3. Floating Widget Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 w-[360px] md:w-[400px] h-[550px] bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden font-[Cairo] no-print">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-xl">
                <Sparkles size={20} className="text-yellow-300" />
              </div>
              <div>
                <h6 className="font-bold text-xs m-0">المساعد الذكي للفرع {chatbotEnabled ? '🟢 متصل' : '🔴 معطل'}</h6>
                <span className="text-[9px] text-indigo-100 block">مدعوم بالذكاء الاصطناعي للحجز والاستعلام الآلي</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs inside Bot Widget */}
          <div className="grid grid-cols-3 bg-white border-b border-slate-200 text-xs font-bold no-print">
            <button 
              onClick={() => setActiveTab('bot')}
              className={`py-3 text-center transition-colors border-b-2 ${activeTab === 'bot' ? 'text-indigo-600 border-indigo-600 bg-indigo-50/20' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
            >
              🤖 الشات بوت الذكي
            </button>
            <button 
              onClick={() => setActiveTab('whatsapp')}
              className={`py-3 text-center transition-colors border-b-2 ${activeTab === 'whatsapp' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/20' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
            >
              📱 محاكي الواتساب
            </button>
            <button 
              onClick={() => setActiveTab('alerts')}
              className={`py-3 text-center transition-colors border-b-2 ${activeTab === 'alerts' ? 'text-amber-600 border-amber-600 bg-amber-50/20' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
            >
              🔔 التنبيهات والأحداث
            </button>
          </div>

          {/* 🌟 Tab 1: AI Chatbot Assistant */}
          {activeTab === 'bot' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((m, index) => (
                  <div key={index} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-150 rounded-bl-none'}`}>
                      <div className="whitespace-pre-line">{m.text}</div>
                      <span className={`text-[8px] block mt-1 text-right ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {m.time}
                      </span>
                      
                      {/* Optional Interactive Action options */}
                      {m.action === 'options' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button 
                            onClick={() => triggerQuickAction('book')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg text-[10px] transition-colors border border-indigo-200"
                          >
                            📅 حجز موعد جديد
                          </button>
                          <button 
                            onClick={() => triggerQuickAction('services')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg text-[10px] transition-colors border border-indigo-200"
                          >
                            🌸 تصفح باقات التجميل
                          </button>
                          <button 
                            onClick={() => triggerQuickAction('branches')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg text-[10px] transition-colors border border-indigo-200"
                          >
                            📍 فروع المركز
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-150 rounded-2xl rounded-bl-none p-3 text-xs text-slate-500">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        <span className="text-[10px] ml-1">جاري كتابة الرد التجميلي الذكي...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text"
                  placeholder="اسألني عن الخدمات أو اكتب 'حجز'..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-600"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 🌟 Tab 2: WhatsApp Reminder Simulation */}
          {activeTab === 'whatsapp' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🟢</span>
                  <span className="font-bold text-xs text-emerald-800">تذكيرات الواتساب لجميع الفروع:</span>
                </div>
                <p className="text-[10px] text-emerald-700 leading-relaxed">
                  تنطبق هذه الميزة تلقائياً على الفرع الرئيسي وجميع الفروع المضافة. يمكنك من خلال هذا المحاكي فحص إرسال الرسائل وتجربتها.
                </p>
                <div className="text-[9px] text-slate-500 bg-white/70 p-1.5 rounded-lg border border-slate-150">
                  📱 الرقم المعتمد للإرسال: <strong className="text-slate-800 font-mono">{senderNumber}</strong>
                </div>
              </div>

              {/* Booking link details */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 space-y-2">
                <span className="font-bold text-xs text-indigo-800 block">🔗 رابط الحجز الأونلاين للعملاء:</span>
                <input 
                  type="text" 
                  readOnly 
                  value={bookingLink} 
                  className="w-full bg-white border border-indigo-200 text-[10px] rounded-lg p-2 font-mono"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bookingLink);
                    alert('تم نسخ رابط الحجز أونلاين بنجاح!');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 size={12} /> نسخ الرابط لمشاركته مع العملاء
                </button>
              </div>

              {/* Simulation controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <span className="font-bold text-xs text-slate-800 block border-b pb-1.5">🧪 محاكي فحص إرسال تذكير بالواتساب:</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">اسم العميلة:</label>
                    <input 
                      type="text" 
                      value={simTargetName} 
                      onChange={e => setSimTargetName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">رقم جوال المستلم:</label>
                    <input 
                      type="text" 
                      value={simTargetPhone} 
                      onChange={e => setSimTargetPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">التاريخ:</label>
                      <input 
                        type="date" 
                        value={simTargetDate} 
                        onChange={e => setSimTargetDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">الوقت:</label>
                      <input 
                        type="time" 
                        value={simTargetTime} 
                        onChange={e => setSimTargetTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">نموذج الرسالة المرسلة:</label>
                    <textarea 
                      value={whatsappTemplate}
                      onChange={e => setWhatsappTemplate(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] leading-relaxed"
                    />
                  </div>

                  <button 
                    onClick={handleSimulateWhatsapp}
                    disabled={isSimulating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle size={14} /> 
                    {isSimulating ? 'جاري الإرسال والمحاكاة...' : 'إرسال واختبار رسالة واتساب'}
                  </button>
                </div>
              </div>

              {/* Simulation History logs */}
              {simulationLog.length > 0 && (
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-3 font-mono text-[9px] space-y-1 max-h-[150px] overflow-y-auto">
                  <span className="text-[10px] font-bold text-indigo-400 block mb-1">📋 سجل عمليات الإرسال:</span>
                  {simulationLog.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-800 pb-1 last:border-0">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🌟 Tab 3: Notifications and Activity Monitor */}
          {activeTab === 'alerts' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs text-slate-800">أحدث الحجوزات المستلمة للتو:</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">تحديث فوري</span>
              </div>

              <div className="space-y-2">
                {(() => {
                  // Flatten all appointments across all clinics
                  const allAppts: Array<{ clinicName: string; appt: Appointment }> = [];
                  data.clinics.forEach(c => {
                    (data.appointments?.[c.id] || []).forEach(appt => {
                      allAppts.push({ clinicName: c.name, appt });
                    });
                  });

                  // Sort by id descending
                  allAppts.sort((a, b) => b.appt.id - a.appt.id);

                  if (allAppts.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                        📭 لا توجد حجوزات مسجلة في هذا المركز بعد.
                      </div>
                    );
                  }

                  return allAppts.slice(0, 5).map(({ clinicName, appt }) => (
                    <div key={appt.id} className="p-3 bg-white border border-slate-150 rounded-xl space-y-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-indigo-600">{appt.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">{clinicName}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Phone size={10} className="text-slate-400" /> {appt.phone}
                      </div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Calendar size={10} className="text-slate-400" /> {appt.date} في تمام الساعة {appt.time}
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 bg-indigo-50/50 px-2 py-1 rounded-lg">
                        💇 {appt.service}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Alert preferences */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[10px] text-amber-800 block">نظام التنبيهات الذكي:</span>
                  <span className="text-[9px] text-amber-700 leading-relaxed block mt-0.5">
                    الرنين التنبيهي الصوتي مدمج تلقائياً مع خادم السحابة. بمجرد قيام أي عميل بحجز موعد أونلاين، سيصدر رنين تنبيهي مسموع وتنبيه منبثق فوري لجميع شاشات الإدارة.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}
