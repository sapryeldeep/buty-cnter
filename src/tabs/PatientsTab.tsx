import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { RecordItem } from '../types';
import { 
  Users, Phone, Star, FileText, Plus, Trash2, ShieldAlert, Download, 
  Award, Gift, Gem, QrCode, CheckCircle, Clock 
} from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';

const STANDARD_PACKAGES = [
  { name: 'باقة النضارة الشاملة (3 جلسات)', service: 'تنظيف بشرة عميق', sessions: 3, price: 500 },
  { name: 'الباقة الملكية للعرائس (5 خدمات)', service: 'مكياج سهرة + حمام مغربي + تسريحة شعر', sessions: 5, price: 1500 },
  { name: 'باقة حماية وعناية الشعر (4 جلسات)', service: 'جلسة ترطيب ومعالجة الشعر', sessions: 4, price: 600 }
];

const LOYALTY_REWARDS = [
  { id: 1, name: 'قسيمة خصم نقدي بقيمة 50 ريال', points: 30, discount: 50 },
  { id: 2, name: 'خدمة غسيل وسشوار مجانية', points: 50, discount: 0, freeService: 'خدمة غسيل وسشوار مجانية' },
  { id: 3, name: 'جلسة مساج وجه نضارة واسترخاء', points: 80, discount: 0, freeService: 'مساج وجه مهدئ' },
];

export default function PatientsTab() {
  const { data, currentUser, updateData } = useStore();
  const { currentClinicId, currentCurrency, getCombinedAllRecords } = useClinicContext();
  
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [printedTicket, setPrintedTicket] = useState<any>(null);

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isExportAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisableExportExcel !== true && (center?.permissions?.printFull !== false || currentUser?.permissions?.canExportData !== false));

  const handleExportPatients = () => {
    const exportData = filteredPatients.map(p => ({
      'اسم العميل': p.name,
      'رقم الهاتف': p.phone || 'غير مسجل',
      'إجمالي المبالغ': p.total,
      'المدفوع': p.paid,
      'المتبقي (الآجل)': p.due,
      'نقاط الولاء': p.points
    }));
    exportToExcel(exportData, `سجل_العملاء_${new Date().toISOString().split('T')[0]}`);
  };

  const records = getCombinedAllRecords();
  const beautyNotes = data.beautyNotesStore || {};

  // Group by patient
  const uniquePatients: Record<string, { name: string, phone: string, total: number, paid: number, due: number, points: number }> = {};
  records.forEach(r => {
    if (!uniquePatients[r.name]) {
      uniquePatients[r.name] = { name: r.name, phone: r.phone, total: 0, paid: 0, due: 0, points: 0 };
    }
    uniquePatients[r.name].total += r.total || 0;
    uniquePatients[r.name].paid += r.paid || 0;
    uniquePatients[r.name].due += (r.total || 0) - (r.paid || 0);
  });

  Object.values(uniquePatients).forEach(p => {
    const deductions = data.loyaltyDeductions?.[p.name] || 0;
    p.points = Math.max(0, Math.floor(p.paid / 100) - deductions); // 1 point for every 100 minus deductions
  });

  const filteredPatients = Object.values(uniquePatients).filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  );

  const pVisits = selectedPatient ? records.filter(x => x.name === selectedPatient) : [];
  const selectedPatientData = selectedPatient ? uniquePatients[selectedPatient] : null;

  const handleNotesChange = (val: string) => {
    if (!selectedPatient) return;
    updateData({
      beautyNotesStore: { ...beautyNotes, [selectedPatient]: val }
    });
  };

  const handlePayExtra = () => {
    if (!selectedPatient) return;
    const amtStr = prompt(`أدخل المبلغ المحصل من العميل (${selectedPatient}):`);
    if (!amtStr || isNaN(Number(amtStr))) return;
    
    let rem = Math.max(0, parseFloat(amtStr));
    
    const newQueue = [...(data.queue[currentClinicId] || [])];
    const newArchive = [...(data.archive[currentClinicId] || [])];
    
    const payLogic = (arr: any[]) => {
      arr.forEach(p => {
        let due = (p.total || 0) - (p.paid || 0);
        if(p.name === selectedPatient && due > 0 && rem > 0) {
          let pay = Math.min(due, rem);
          p.paid += pay;
          p.due = (p.total || 0) - p.paid;
          rem -= pay;
        }
      });
    };
    
    payLogic(newQueue);
    payLogic(newArchive);
    
    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue },
      archive: { ...data.archive, [currentClinicId]: newArchive }
    });
  };

  // Buy Package handler
  const handleBuyPackage = (pkg: typeof STANDARD_PACKAGES[0]) => {
    if (!selectedPatient || !selectedPatientData) return;
    
    const confirmBuy = confirm(`هل تود شراء (${pkg.name}) بقيمة ${pkg.price} ${currentCurrency} للعميل؟`);
    if (!confirmBuy) return;

    const patientPkgs = data.patientPackages?.[selectedPatient] || [];
    const newPkg = {
      id: Date.now(),
      name: pkg.name,
      service: pkg.service,
      totalSessions: pkg.sessions,
      remainingSessions: pkg.sessions,
      purchaseDate: new Date().toISOString().split('T')[0]
    };

    updateData({
      patientPackages: {
        ...(data.patientPackages || {}),
        [selectedPatient]: [...patientPkgs, newPkg]
      }
    });

    // Record as $0 or actual billing in Archive for audit trailing
    const now = new Date();
    const billingRecord: RecordItem = {
      id: Date.now() + 1,
      name: selectedPatient,
      age: '',
      phone: selectedPatientData.phone,
      service: `شراء باقة: ${pkg.name}`,
      total: pkg.price,
      paid: pkg.price,
      due: 0,
      payMethod: 'مدى / كاشير',
      handler: '',
      status: 'done',
      isoDate: now.toISOString().split('T')[0],
      date: now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const currentArchive = data.archive?.[currentClinicId] || [];
    updateData({
      archive: {
        ...(data.archive || {}),
        [currentClinicId]: [billingRecord, ...currentArchive]
      }
    });

    alert(`تم تفعيل الباقة بنجاح للعميل واقتطاع ${pkg.price} ${currentCurrency}!`);
  };

  // Redeem Session handler
  const handleRedeemSession = (pkgId: number, pkgName: string, serviceName: string) => {
    if (!selectedPatient || !selectedPatientData) return;

    const confirmRedeem = confirm(`هل تود استخدام جلسة من باقة (${pkgName}) وتسجيل العميل بالطابور؟`);
    if (!confirmRedeem) return;

    const patientPkgs = data.patientPackages?.[selectedPatient] || [];
    const updatedPkgs = patientPkgs.map((p: any) => {
      if (p.id === pkgId) {
        return { ...p, remainingSessions: Math.max(0, p.remainingSessions - 1) };
      }
      return p;
    }).filter((p: any) => p.remainingSessions > 0); // Keep if still has sessions

    // Push into active waitlist Queue
    const now = new Date();
    const newRecord: RecordItem = {
      id: Date.now(),
      name: selectedPatient,
      age: '',
      phone: selectedPatientData.phone,
      service: `${serviceName} (خصم من الباقة)`,
      total: 0,
      paid: 0,
      due: 0,
      payMethod: 'خصم من باقة الخدمات (Prepaid)',
      handler: '',
      status: 'waiting',
      isoDate: now.toISOString().split('T')[0],
      date: now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const currentQueue = data.queue?.[currentClinicId] || [];

    updateData({
      patientPackages: {
        ...(data.patientPackages || {}),
        [selectedPatient]: updatedPkgs
      },
      queue: {
        ...(data.queue || {}),
        [currentClinicId]: [...currentQueue, newRecord]
      }
    });

    // Sound chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch(err){}

    alert('تم خصم الجلسة بنجاح وتسكين العميل فوراً في طابور الخدمات اليومي!');
  };

  // Redeem Reward handler
  const handleRedeemReward = (reward: typeof LOYALTY_REWARDS[0]) => {
    if (!selectedPatient || !selectedPatientData) return;

    if (selectedPatientData.points < reward.points) {
      alert(`رصيد العميل الحالي (${selectedPatientData.points} نقطة) لا يكفي لاستبدال هذا العرض! يحتاج العميل لـ ${reward.points} نقطة.`);
      return;
    }

    const confirmRedeem = confirm(`هل أنت متأكد من خصم ${reward.points} نقطة لتقديم عرض (${reward.name})؟`);
    if (!confirmRedeem) return;

    // Deduct
    const currentDeductions = data.loyaltyDeductions?.[selectedPatient] || 0;
    updateData({
      loyaltyDeductions: {
        ...(data.loyaltyDeductions || {}),
        [selectedPatient]: currentDeductions + reward.points
      }
    });

    // Generate thermal ticket
    const ticket = {
      code: 'REWARD-' + Math.floor(100000 + Math.random() * 900000),
      patientName: selectedPatient,
      rewardName: reward.name,
      pointsSpent: reward.points,
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setPrintedTicket(ticket);

    // Beep sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch(e){}
  };

  const activePackages = data.patientPackages?.[selectedPatient || ''] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Directory list */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
          <div className="flex justify-between items-center mb-4">
            <h6 className="font-bold text-indigo-600 m-0">دليل العملاء ونقاط الولاء</h6>
            {isExportAllowed && (
              <button 
                onClick={handleExportPatients}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-emerald-200"
              >
                <Download size={14} />
                تصدير Excel
              </button>
            )}
          </div>
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الهاتف..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 mb-4"
          />
          
          <div className="overflow-y-auto max-h-[500px] space-y-2">
            {filteredPatients.length === 0 ? (
              <div className="text-center text-slate-400 py-4 text-sm">لا يوجد عملاء</div>
            ) : filteredPatients.map((p, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedPatient(p.name)}
                className={`p-3 border rounded-xl cursor-pointer transition-colors flex justify-between items-center ${selectedPatient === p.name ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-300'}`}
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.phone || '--'}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-1">{p.points} نقطة</div>
                  {p.due > 0 && <div className="text-xs text-red-500 font-bold">آجل: {p.due}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Profile */}
      <div className="lg:col-span-8">
        {!selectedPatientData ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="mb-4 opacity-50" />
            <h6>اختر عميلاً من القائمة لعرض سجله ونقاط الولاء.</h6>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 mb-4 gap-4">
              <div>
                <h4 className="font-bold text-indigo-600 text-xl m-0">{selectedPatientData.name}</h4>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Phone size={14} /> {selectedPatientData.phone}</span>
                  <span className="flex items-center gap-1 text-green-600 font-bold"><Star size={14} /> رصيد: {selectedPatientData.points} نقطة</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedPatientData.due > 0 && (
                  <button onClick={handlePayExtra} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                    تحصيل متبقي
                  </button>
                )}
              </div>
            </div>

            {/* Loyalty Digital Card & Active Packages Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-right">
              
              {/* Golden/Indigo Digital Membership Card */}
              <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden border border-slate-800 flex flex-col justify-between min-h-[190px]">
                {/* Background decorative chips */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      باقة عضوية VIP الموحدة
                    </span>
                    <h5 className="font-extrabold text-sm mt-1.5 text-slate-100">{selectedPatientData.name}</h5>
                  </div>
                  <Gem size={20} className="text-yellow-400 animate-pulse" />
                </div>

                <div className="my-2 space-y-1">
                  <p className="text-[10px] text-slate-400">رصيد النقاط الحالي:</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-yellow-400">{selectedPatientData.points}</span>
                    <span className="text-xs text-slate-300">نقطة تجميلية</span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-slate-800/80 pt-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <QrCode size={14} className="text-slate-400" />
                    <span className="text-[8px] font-mono text-slate-400 tracking-wider">MEMBER-{selectedPatientData.phone ? Math.abs(selectedPatientData.phone.split('').reduce((a:number,b:string)=>a+b.charCodeAt(0),0)) : 89324}</span>
                  </div>
                  
                  {/* Action buttons on digital card */}
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => {
                        const choice = prompt(`اختر مكافأة لاستبدالها:\n\n1. ${LOYALTY_REWARDS[0].name} - ${LOYALTY_REWARDS[0].points} نقطة\n2. ${LOYALTY_REWARDS[1].name} - ${LOYALTY_REWARDS[1].points} نقطة\n3. ${LOYALTY_REWARDS[2].name} - ${LOYALTY_REWARDS[2].points} نقطة\n\nاكتب رقم المكافأة (1 أو 2 أو 3):`);
                        if (choice === '1') handleRedeemReward(LOYALTY_REWARDS[0]);
                        else if (choice === '2') handleRedeemReward(LOYALTY_REWARDS[1]);
                        else if (choice === '3') handleRedeemReward(LOYALTY_REWARDS[2]);
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Gift size={10} />
                      استبدال المكافآت
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Service Packages and buying options */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-extrabold text-xs text-slate-800 flex items-center gap-1 m-0">
                      <Award size={14} className="text-indigo-600" />
                      باقات وحزم الخدمات النشطة
                    </h6>
                    <button 
                      onClick={() => {
                        const choice = prompt(`اختر باقة لتفعيلها للعميل:\n\n1. ${STANDARD_PACKAGES[0].name} - بسعر ${STANDARD_PACKAGES[0].price} ${currentCurrency}\n2. ${STANDARD_PACKAGES[1].name} - بسعر ${STANDARD_PACKAGES[1].price} ${currentCurrency}\n3. ${STANDARD_PACKAGES[2].name} - بسعر ${STANDARD_PACKAGES[2].price} ${currentCurrency}\n\nاكتب رقم الباقة (1 أو 2 أو 3):`);
                        if (choice === '1') handleBuyPackage(STANDARD_PACKAGES[0]);
                        else if (choice === '2') handleBuyPackage(STANDARD_PACKAGES[1]);
                        else if (choice === '3') handleBuyPackage(STANDARD_PACKAGES[2]);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <Plus size={10} />
                      شراء باقة
                    </button>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[110px] pr-1">
                    {activePackages.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 font-medium">لا توجد باقات مفعلة حالياً للعميل.</p>
                    ) : (
                      activePackages.map((p: any) => (
                        <div key={p.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-[10px] shadow-sm">
                          <div>
                            <p className="font-extrabold text-slate-800">{p.name}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">تاريخ الشراء: {p.purchaseDate}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[9px]">
                              {p.remainingSessions} / {p.totalSessions} جلسة
                            </span>
                            <button 
                              onClick={() => handleRedeemSession(p.id, p.name, p.service)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors"
                            >
                              استخدام جلسة
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <p className="text-[8px] text-slate-400 leading-relaxed mt-2 border-t pt-2 border-slate-100">
                  💡 تتيح ميزة الباقات تسجيل الدفع المسبق لعدة جلسات تجميلية وحسم الزيارات تلقائياً من الملف.
                </p>
              </div>

            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-6 text-right">
              <h6 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <ShieldAlert size={16} className="text-indigo-600" />
                تفضيلات العميل / نوع بشرة / ملاحظات
              </h6>
              <textarea 
                value={beautyNotes[selectedPatient] || ''}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="ملاحظات حساسية، نوع البشرة، أو طلبات خاصة..."
                className="w-full bg-white border border-indigo-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-600"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">المطلوب</div>
                <div className="font-bold text-slate-800">{selectedPatientData.total}</div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">المدفوع</div>
                <div className="font-bold text-green-600">{selectedPatientData.paid}</div>
              </div>
              <div className="p-3 border border-red-100 rounded-xl bg-red-50">
                <div className="text-xs text-red-500 mb-1">المتبقي (آجل)</div>
                <div className="font-bold text-red-600">{selectedPatientData.due}</div>
              </div>
            </div>

            <h6 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText size={16} />
              سجل الجلسات والفواتير
            </h6>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">الخدمات</th>
                    <th className="p-2">الدفع</th>
                    <th className="p-2">المسؤول</th>
                    <th className="p-2">المطلوب</th>
                    <th className="p-2">المدفوع</th>
                    <th className="p-2">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pVisits.map((v, i) => {
                    const d = (v.total || 0) - (v.paid || 0);
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-500">{v.isoDate || v.date}</td>
                        <td className="p-2 font-medium">{v.service}</td>
                        <td className="p-2"><span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{v.payMethod}</span></td>
                        <td className="p-2 text-slate-500">{v.handler}</td>
                        <td className="p-2">{v.total}</td>
                        <td className="p-2 text-green-600 font-bold">{v.paid}</td>
                        <td className={`p-2 font-bold ${d > 0 ? 'text-red-500' : 'text-slate-400'}`}>{d}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Loyalty Reward Thermal Ticket Modal Overlay */}
      {printedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 text-right">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 border border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="text-center font-mono space-y-1.5 text-slate-800">
              <p className="text-sm font-bold border-b pb-2">شامل لخدمات التجميل والـ ERP</p>
              <p className="text-xs font-black text-indigo-600 pt-1">إيصال استبدال نقاط الولاء</p>
              <div className="py-4 border-y border-dashed my-3 space-y-1 text-right text-[11px]">
                <p><strong>كود الكوبون:</strong> <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">{printedTicket.code}</span></p>
                <p><strong>العميل:</strong> {printedTicket.patientName}</p>
                <p><strong>المكافأة:</strong> {printedTicket.rewardName}</p>
                <p><strong>النقاط المستبدلة:</strong> {printedTicket.pointsSpent} نقطة</p>
                <p className="text-[9px] text-slate-400 mt-2">التاريخ: {printedTicket.date} - {printedTicket.time}</p>
              </div>
              <div className="bg-slate-100 py-2.5 rounded-lg border flex flex-col items-center justify-center space-y-1 shadow-inner">
                {/* Barcode representation */}
                <div className="flex gap-0.5 h-6">
                  {[1, 3, 1, 1, 2, 1, 3, 2, 1, 2, 4, 1, 2].map((w, idx) => (
                    <div key={idx} className="bg-slate-800 h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest">{printedTicket.code}</span>
              </div>
            </div>
            <button 
              onClick={() => setPrintedTicket(null)}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs py-2.5 mt-4 rounded-xl transition-colors shadow-sm"
            >
              حفظ الكوبون وإغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
