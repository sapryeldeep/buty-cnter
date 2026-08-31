import React, { useState } from 'react';
import { Smartphone, UsersRound, CalendarCheck, Wallet, Scissors, Award, Compass, Search, ChevronRight, HardDrive } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';

export default function StaffMobileSimulator() {
  const { data, currentUser } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();

  const staffList = data.staffDirectory?.[currentClinicId] || [
    { id: 1, name: 'رنا أحمد', role: 'خبير تجميل وشعر', salary: 3500, phone: '055112233' },
    { id: 2, name: 'سارة عادل', role: 'أخصائية عناية ونضارة البشرة', salary: 8000, phone: '055223344' },
    { id: 3, name: 'إيمان الحربي', role: 'خبيرة ميك أب ونضارة', salary: 4000, phone: '055334455' }
  ];

  const [selectedStaff, setSelectedStaff] = useState<string>(staffList[0]?.name || 'رنا أحمد');
  const [activeMobileTab, setActiveMobileTab] = useState<'schedule' | 'commissions' | 'backbar'>('schedule');

  // Filter queue & archive records handled by this staff
  const queueRecords = data.queue[currentClinicId] || [];
  const archiveRecords = data.archive[currentClinicId] || [];
  
  const staffQueue = queueRecords.filter(r => r.handler === selectedStaff);
  const staffArchive = archiveRecords.filter(r => r.handler === selectedStaff);

  const completedServicesCount = staffArchive.length;
  const activeServicesCount = staffQueue.length;

  // Calculate commissions (15% of service total)
  const totalEarnedCommissions = staffArchive.reduce((acc, curr) => acc + (curr.paid * 0.15), 0);

  // Simulated material requirements for services (Backbar)
  const getMaterialRequirement = (serviceName: string) => {
    const s = serviceName.toLowerCase();
    if (s.includes('فيلر') || s.includes('تعبئة')) return '1 عبوة سيروم نضارة وبشرة + كيت مسحات معقمة + شفرة ديرمابلانينج';
    if (s.includes('بوتوكس') || s.includes('تجاعيد')) return '1 كيت شد ونضارة معقم + سيروم ترطيب البشرة ومسحات تنظيف';
    if (s.includes('تنظيف') || s.includes('بشرة')) return '50 مل غسول رغوي مهدئ + 15 مل سيروم فيتامين سي كولاجين + كريم ترطيب عميق';
    if (s.includes('شعر') || s.includes('صبغة')) return '150 مل صبغة لوريال + 1 كيت قفازات معقمة + 20 مل سيروم ترطيب وحماية الخصلات';
    return '1 كيت معقم لتنظيف وتحضير البشرة واليدين';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn font-[Cairo]" dir="rtl">
      
      {/* Right Column: Portal Settings & Dashboard Controller (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <UsersRound size={20} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-800 text-sm">بوابة الموظفين والخبراء (Staff Portal Console)</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">محاكاة لوحة تحكم وتطبيق جوال الموظفين لعرض الحالات والعمولات والمستلزمات المستهلكة في غرف التجهيز</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اختر الموظف أو الأخصائي لعرض جواله:</label>
              <select 
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-600"
              >
                {staffList.map((st, i) => (
                  <option key={i} value={st.name}>{st.name} ({st.role || 'خبير تجميل'})</option>
                ))}
              </select>
            </div>

            {/* Simulated Live stats for backend tracking */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] text-emerald-800 font-bold mb-1">العمولات المحققة اليوم</p>
                <h4 className="text-lg font-black text-emerald-950">{totalEarnedCommissions} {currentCurrency}</h4>
                <p className="text-[8px] text-emerald-600 mt-1">بنسبة عمولة 15% معتمدة</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                <p className="text-[10px] text-indigo-800 font-bold mb-1">العملاء النشطين بالطابور</p>
                <h4 className="text-lg font-black text-indigo-950">{activeServicesCount} عميل(ة)</h4>
                <p className="text-[8px] text-indigo-600 mt-1">ينتظرون الجلسات بالغرف</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-center">
                <p className="text-[10px] text-rose-800 font-bold mb-1">تقييم الأداء العام</p>
                <h4 className="text-lg font-black text-rose-950">4.9 / 5.0 ⭐</h4>
                <p className="text-[8px] text-rose-600 mt-1">بناءً على 48 تقييم رضا عملاء</p>
              </div>
            </div>

            {/* Competitive value card */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3">
              <span className="text-xl">🛠️</span>
              <div className="space-y-1">
                <h6 className="font-extrabold text-indigo-900 text-xs">تكامل المستهلكات والمخازن (Backbar Automation)</h6>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  يستطيع الأخصائي عبر الجوال معرفة الأدوات والمواد بدقة قبل بدء الخدمة. عندما تنتهي الجلسة، يقوم النظام بخصم المواد أوتوماتيكياً من قسم "مخزون المستحضرات" لمنع التلاعب والتسريب، وتحقيق جرد دقيق بنسبة 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Column: Mobile App View Simulator (5 cols) */}
      <div className="lg:col-span-5 flex justify-center">
        <div className="relative">
          {/* Smartphone Frame Container */}
          <div className="w-[280px] h-[560px] bg-slate-900 rounded-[40px] p-2.5 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
            
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 mx-auto w-28 h-5 bg-slate-900 rounded-b-2xl z-[99] flex items-center justify-center gap-1">
              <div className="w-10 h-0.5 bg-slate-800 rounded-full"></div>
            </div>

            {/* Smartphone Inner OS Screen */}
            <div className="bg-slate-950 flex-1 rounded-[30px] overflow-hidden flex flex-col relative pt-4 text-white">
              
              {/* Custom Status bar */}
              <div className="px-4 py-1 flex justify-between items-center text-[8px] font-bold text-slate-400">
                <span>12:48 م</span>
                <span className="flex items-center gap-1">
                  <span>5G</span>
                  <span className="w-4 h-2 bg-slate-400 rounded-sm"></span>
                </span>
              </div>

              {/* Staff App Header */}
              <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h6 className="font-extrabold text-[10px] text-indigo-400">تطبيق خبراء شامل</h6>
                  <h5 className="font-black text-xs text-slate-100">{selectedStaff}</h5>
                </div>
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs shadow">
                  👤
                </div>
              </div>

              {/* Staff Mobile Navigation tabs */}
              <div className="grid grid-cols-3 bg-slate-900 border-b border-slate-800 text-center">
                <button 
                  onClick={() => setActiveMobileTab('schedule')}
                  className={`py-2 text-[9px] font-bold border-b-2 transition-all ${
                    activeMobileTab === 'schedule' ? 'border-indigo-500 text-indigo-400 bg-slate-850' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  حالاتي بالطابور ({staffQueue.length})
                </button>
                <button 
                  onClick={() => setActiveMobileTab('backbar')}
                  className={`py-2 text-[9px] font-bold border-b-2 transition-all ${
                    activeMobileTab === 'backbar' ? 'border-indigo-500 text-indigo-400 bg-slate-850' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  المستلزمات (Backbar)
                </button>
                <button 
                  onClick={() => setActiveMobileTab('commissions')}
                  className={`py-2 text-[9px] font-bold border-b-2 transition-all ${
                    activeMobileTab === 'commissions' ? 'border-indigo-500 text-indigo-400 bg-slate-850' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  عمولاتي وجوائزي
                </button>
              </div>

              {/* Mobile Content Canvas */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-12 text-right">
                
                {/* 1. Schedule Tab */}
                {activeMobileTab === 'schedule' && (
                  <div className="space-y-2.5">
                    <p className="text-[9px] text-slate-400 font-bold">جلساتي الجارية وقائمة الطابور النشطة:</p>
                    {staffQueue.length === 0 ? (
                      <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-[10px] space-y-1">
                        <p>لا يوجد عملاء بالطابور لك حالياً</p>
                        <p className="text-[8px] text-slate-600">سيظهر العملاء فور تسكينهم من الاستقبال</p>
                      </div>
                    ) : (
                      staffQueue.map((item, idx) => (
                        <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow space-y-1.5 relative overflow-hidden animate-in fade-in duration-150">
                          <div className="absolute top-0 left-0 bg-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-br-lg rounded-tl-sm text-white">
                            جلسة نشطة
                          </div>
                          <p className="text-[10px] font-bold text-slate-100">{item.name}</p>
                          <p className="text-[9px] text-indigo-300 font-bold flex items-center gap-1">
                            <Scissors size={10} />
                            <span>{item.service}</span>
                          </p>
                          <p className="text-[8px] text-slate-400">⏳ مسجل في: {item.date}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. Backbar Tab */}
                {activeMobileTab === 'backbar' && (
                  <div className="space-y-2.5">
                    <p className="text-[9px] text-slate-400 font-bold">دليل المواد المستهلكة الواجب تحضيرها لغرفة العمليات:</p>
                    {staffQueue.length === 0 && staffArchive.length === 0 ? (
                      <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-[10px]">
                        لا توجد خدمات نشطة لتحضير المواد
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...staffQueue, ...staffArchive].slice(0, 3).map((item, idx) => (
                          <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 space-y-1">
                            <span className="text-[8px] bg-slate-850 px-1.5 py-0.5 rounded text-indigo-300 font-bold">{item.service}</span>
                            <p className="text-[9px] text-slate-200 leading-normal leading-relaxed mt-1 font-semibold">{getMaterialRequirement(item.service)}</p>
                            <p className="text-[8px] text-emerald-400 flex items-center gap-0.5 pt-1 font-bold">
                              <span>✓ سيخصم تلقائياً عند إنهاء الجلسة</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Commissions Tab */}
                {activeMobileTab === 'commissions' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-tr from-indigo-950 to-slate-900 border border-indigo-900 rounded-xl text-center space-y-1">
                      <p className="text-[9px] text-slate-400 font-bold">رصيد عمولاتي التراكمي المعتمد:</p>
                      <h4 className="text-xl font-black text-indigo-400">{totalEarnedCommissions} {currentCurrency}</h4>
                      <p className="text-[8px] text-slate-500 font-bold">سيتم صرفها مع الراتب الأساسي (مسير الرواتب)</p>
                    </div>

                    <p className="text-[9px] text-slate-400 font-bold">سجل الجلسات الأخيرة العمولات المعتمدة:</p>
                    {staffArchive.length === 0 ? (
                      <div className="text-center py-10 text-slate-600 text-[10px]">
                        لا توجد جلسات مؤرشفة اليوم للحساب
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {staffArchive.map((item, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2 rounded-lg border border-slate-850 flex justify-between items-center text-[9px]">
                            <div>
                              <p className="font-bold text-slate-200">{item.name}</p>
                              <p className="text-[8px] text-slate-400">{item.service}</p>
                            </div>
                            <span className="font-bold text-emerald-400">+{item.paid * 0.15} {currentCurrency}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Indicator */}
            <div className="absolute bottom-1 inset-x-0 mx-auto w-24 h-1 bg-slate-700 rounded-full"></div>
          </div>
          <p className="text-center text-[10px] font-bold text-slate-500 mt-2 flex items-center justify-center gap-1">
            <Smartphone size={12} />
            تطبيق هاتف الأخصائي (Therapist iOS)
          </p>
        </div>
      </div>

    </div>
  );
}
