import { ReactNode, useState } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { 
  ChartLine, Archive, Users, CalendarCheck, FileText, 
  Scissors, Package, Wallet, Network, UsersRound, Terminal, LogOut, Database, Menu, X, Printer, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AIChatbotWidget } from './AIChatbotWidget';

export default function Layout({ children }: { children: ReactNode }) {
  const { currentUser, activeTab, setActiveTab, setCurrentUser, data, viewingBranchId, setViewingBranchId } = useStore();
  const { currentClinicId, currentCurrency, changeCurrency } = useClinicContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const currentClinic = data.clinics.find(x => x.id === currentClinicId);
  const isMasterOrDev = currentUser.role === 'master_admin' || currentUser.role === 'developer';
  const clinicName = isMasterOrDev ? 'إدارة المراكز والفروع' : (currentClinic?.name || 'مركز التجميل');
  const specialtyName = isMasterOrDev ? 'الإدارة المركزية' : (currentClinic?.name || 'فرع تجميل');

  let roleName = 'Master Admin';
  if (currentUser.role === 'developer') roleName = 'المطور النظام';
  else if(currentUser.role === 'doctor') roleName = 'مدير المركز/الفرع';
  else if(currentUser.role === 'reception') roleName = 'موظف استقبال';
  else if(currentUser.role === 'secretary') roleName = 'سكرتارية';
  else if(currentUser.role === 'accountant') roleName = 'محاسب';
  else if(currentUser.role === 'staff' || currentUser.role === 'expert') roleName = 'خبير تجميل';

  const isMasterAdmin = currentUser.role === 'master_admin';
  const isDeveloper = currentUser.role === 'developer';
  const isCenterAdminOrDev = isMasterAdmin || isDeveloper;

  const navItems = [
    { id: 'dashboard', label: 'طابور الانتظار وحفظ الجلسات', icon: ChartLine, hideFor: ['accountant', 'developer'] },
    { id: 'archive', label: 'أرشيف الجلسات والفواتير', icon: Archive, hideFor: ['developer'] },
    { id: 'patients', label: 'ملفات العملاء ونقاط الولاء', icon: Users, hideFor: ['developer'] },
    { id: 'appointments', label: 'الحجوزات ونظام الحجز الأونلاين', icon: CalendarCheck, hideFor: ['accountant', 'developer'] },
    { id: 'finance', label: 'الحسابات التفصيلية والخزينة', icon: FileText, hideFor: ['reception', 'secretary', 'developer'] },
    { id: 'beauty-services', label: 'باقات وعروض التجميل', icon: Scissors, hideFor: ['reception', 'developer'], color: 'text-yellow-500' },
    { id: 'beauty-inventory', label: 'مخزون المستحضرات', icon: Package, hideFor: ['reception', 'secretary', 'developer'], color: 'text-blue-500' },
    { id: 'payroll', label: 'رواتب وعمولات الخبراء والسلف', icon: Wallet, hideFor: ['reception', 'secretary', 'developer'], color: 'text-green-500' },
    { id: 'clinics', label: 'إدارة الفروع والعملات', icon: Network, hideFor: ['reception', 'secretary', 'accountant', 'staff', 'expert', 'doctor', 'developer'], color: 'text-yellow-500' },
    { id: 'doc-staff', label: 'الموظفين وتقييم الأداء', icon: UsersRound, hideFor: ['reception', 'secretary', 'accountant', 'staff', 'expert'] },
    { id: 'activity-logs', label: 'سجل النشاطات', icon: Activity, hideFor: ['developer'], color: 'text-rose-500' },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database, hideFor: ['developer'], color: 'text-indigo-500' },
    { id: 'settings', label: 'إعدادات وهوية المركز', icon: FileText, hideFor: ['developer'], color: 'text-indigo-600' },
    { id: 'dev-panel', label: 'لوحة تحكم المطور', icon: Terminal, hideFor: ['reception', 'secretary', 'accountant', 'staff', 'expert', 'doctor', 'master_admin'], color: 'text-yellow-500' },
  ];



  const language = data.settings?.language || 'ar';
  const dir = language === 'ar' ? 'rtl' : 'ltr';

// Subscription and Center check
  let centerAdmin = null;
  if (currentUser.role === 'master_admin') {
    centerAdmin = currentUser;
  } else if (currentClinic?.masterAdminId) {
    centerAdmin = data.users.find(u => u.user === currentClinic.masterAdminId) || null;
  }

  // Fallback to clinic expiry if center admin doesn't have one (for backwards compatibility)
  const expiryDateString = centerAdmin?.expiryDate || currentClinic?.expiryDate;
  const expiryDate = expiryDateString ? new Date(expiryDateString) : null;
  
  let daysRemaining = null;
  let isExpired = false;
  let isExpiringSoon = false;

  if (expiryDate && currentUser.role !== 'developer') {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysRemaining = diffDays;
    isExpired = diffDays < 0;
    isExpiringSoon = diffDays >= 0 && diffDays <= 7;
  }

  const isCenterSuspended = centerAdmin?.isActive === false;

  if ((isExpired || isCenterSuspended) && currentUser.role !== 'developer') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] font-[Cairo] flex items-center justify-center p-4" dir={dir}>
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {isCenterSuspended ? 'عفواً، تم إيقاف حساب المركز' : 'عفواً، انتهى اشتراك المركز'}
          </h2>
          <p className="text-slate-600 mb-6">يرجى التواصل مع الإدارة أو الدعم الفني لتجديد الاشتراك واستعادة صلاحية الوصول للنظام.</p>
          <button 
            onClick={() => { setCurrentUser(null); window.location.reload(); }}
            className="w-full bg-slate-800 text-white font-bold rounded-xl py-3 hover:bg-slate-900 transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F1F5F9] font-[Cairo]" dir={dir}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-[270px] bg-white border-l border-slate-200 text-slate-800 z-40 transition-transform duration-300 overflow-y-auto shadow-sm no-print",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 text-center relative border-b border-slate-100 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-2 shadow-lg shadow-indigo-100">
            <span className="text-2xl text-white">✨</span>
          </div>
          <h6 className="font-bold text-slate-900 m-0">{clinicName}</h6>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 inline-block">{roleName}</span>
        </div>
        
        <nav className="px-3 pb-6">
          {navItems.filter(item => {
            if (item.hideFor.includes(currentUser.role)) return false;
            
            // Check specific developer toggle for Activity Logs
            if (item.id === 'activity-logs' && currentUser.role !== 'developer' && centerAdmin?.permissions?.devDisableActivityLogs) {
              return false;
            }

            

            // Check specific user hidden modules
            if (currentUser.hiddenModules?.includes(item.id)) return false;

            // Check custom user permissions
            if (currentUser.role !== 'developer') {
              // Developer level tab disables
              if (item.id === 'finance' && centerAdmin?.permissions?.devDisableFinanceTab === true) return false;
              if (item.id === 'beauty-inventory' && centerAdmin?.permissions?.devDisableInventoryTab === true) return false;
              if (item.id === 'payroll' && centerAdmin?.permissions?.devDisablePayrollTab === true) return false;

              const perms = currentUser.permissions;
              if (perms) {
                if (item.id === 'dashboard' && perms.canViewDashboard === false) return false;
                if (item.id === 'archive' && perms.canViewArchive === false) return false;
                if (item.id === 'patients' && perms.canViewPatients === false) return false;
                if (item.id === 'appointments' && perms.canViewAppointments === false) return false;
                if (item.id === 'finance' && centerAdmin?.permissions?.financeFull === false && perms.canViewFinance === false) return false;
                if (item.id === 'beauty-services' && perms.canViewServices === false) return false;
                if (item.id === 'beauty-inventory' && centerAdmin?.permissions?.financeFull === false && perms.canViewInventory === false) return false;
                if (item.id === 'payroll' && centerAdmin?.permissions?.financeFull === false && perms.canViewPayroll === false) return false;
                if (item.id === 'clinics' && centerAdmin?.permissions?.branchManagementFull === false && perms.canViewClinics === false) return false;
                if (item.id === 'doc-staff' && perms.canViewStaff === false) return false;
              }
            }

            // Check settings module toggle
            const modules = centerAdmin?.modules || data.settings?.modules;
            if (modules) {
              if (item.id === 'patients' && !modules.patients) return false;
              if (item.id === 'appointments' && !modules.appointments) return false;
              if (item.id === 'finance' && !modules.finance) return false;
              if (item.id === 'beauty-services' && !modules.services) return false;
              if (item.id === 'beauty-inventory' && !modules.inventory) return false;
              if (item.id === 'payroll' && !modules.payroll) return false;
              if (item.id === 'clinics' && !modules.clinics) return false;
              if (item.id === 'doc-staff' && !modules.staff) return false;
              if (item.id === 'archive' && !modules.archive) return false;
            }
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1.5 text-sm font-semibold transition-all text-right",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-x-[-4px]" 
                    : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                )}
              >
                <Icon size={18} className={cn(isActive ? "text-white" : item.color || "text-slate-400")} />
                {item.label}
              </button>
            );
          })}
          
          <button
            onClick={() => { setCurrentUser(null); window.location.reload(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl mt-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all text-right border border-slate-200"
          >
            <LogOut size={18} />
            خروج
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-[270px] print:mr-0 p-4 lg:p-6 transition-all duration-300 print:p-0">

        {isExpiringSoon && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 no-print shadow-sm">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block font-bold">تنبيه: اقترب موعد انتهاء الاشتراك!</strong>
              <span className="text-sm">سينتهي اشتراك هذا الفرع بعد ({daysRemaining}) يوم. يرجى تجديد الاشتراك لتجنب توقف الخدمة.</span>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h5 className="m-0 font-bold text-slate-900">
                مرحباً، <span className="text-indigo-600">{currentUser.name}</span>
                {currentUser.role === 'master_admin' && viewingBranchId && (
                  <span className="ml-2 text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1 rounded-md">
                    معاينة: {currentClinic?.name} ({currentCurrency})
                  </span>
                )}
              </h5>
              <div className="text-sm font-medium text-slate-500 mt-1">الفرع الحالي: <strong className="text-slate-800">{specialtyName}</strong></div>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {isMasterOrDev && (
              <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg p-1">
                <span className="text-sm font-bold text-indigo-700 px-2 font-[Cairo]">الفرع النشط:</span>
                <select 
                  className="bg-transparent text-sm font-bold text-indigo-900 outline-none border-none pr-1 cursor-pointer font-[Cairo] focus:ring-0"
                  value={currentClinicId}
                  onChange={(e) => setViewingBranchId(e.target.value)}
                >
                  {currentUser.role === 'developer' && (
                     <option value="developer_system" className="text-slate-800 font-semibold">نظام المطور (الإدارة الشاملة)</option>
                  )}
                  {(currentUser.role === 'developer' ? data.clinics : data.clinics.filter(c => c.masterAdminId === currentUser.user)).map(c => (
                    <option key={c.id} value={c.id} className="text-slate-800 font-semibold">{c.name}</option>
                  ))}
                  {currentUser.role === 'master_admin' && data.clinics.filter(c => c.masterAdminId === currentUser.user).length === 0 && (
                    <option value="master" className="text-slate-800 font-semibold">لا يوجد فروع مضافة</option>
                  )}
                </select>
              </div>
            )}

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <span className="text-sm font-bold text-slate-600 px-2">عملة المركز:</span>
              <select 
                className="bg-transparent text-sm font-bold text-slate-800 outline-none border-none pr-2 cursor-pointer"
                value={currentCurrency}
                onChange={(e) => changeCurrency(e.target.value)}
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="QAR">ريال قطري (QAR)</option>
                <option value="BHD">دينار بحريني (BHD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            {/* نظام جرس التنبيه اللحظي للحجوزات */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-800 text-xs font-bold font-[Cairo]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>جرس الحجوزات نشط 🔔</span>
              <button 
                type="button"
                onClick={() => {
                  try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
                    audio.volume = 0.6;
                    audio.play().catch(() => {
                      alert('الرجاء التفاعل مع الصفحة أو النقر في أي مكان أولاً لتفعيل تشغيل الصوت تلقائياً في المتصفح!');
                    });
                  } catch (err) {
                    console.error('Error playing sound', err);
                  }
                }}
                className="mr-1 bg-white hover:bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-300 transition-colors shadow-sm text-[10px]"
                title="تجربة رنين جرس المواعيد للتأكد من عمل السماعة"
              >
                تجربة الصوت 🔊
              </button>
            </div>

            <button 
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Printer size={16} />
              طباعة
            </button>
          </div>
        </header>

        {data.settings?.globalAnnouncement && (
          <div className="bg-indigo-600 text-white px-6 py-3 font-bold font-[Cairo] text-sm flex items-center justify-between shadow-md relative z-10 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>{data.settings.globalAnnouncement}</span>
            </div>
            {currentUser?.role === 'developer' && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded-md">مرئي للجميع</span>
            )}
          </div>
        )}

        {/* Tab Content Area */}
        <div className="tab-content">
          {children}
        </div>
      </main>

      <AIChatbotWidget />

      <a 
        href="https://wa.me/201065826742?text=مرحباً، أود الاستفسار عن حجز المواعيد والخدمات" 
        className="fixed bottom-6 left-6 bg-[#25d366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform z-50 no-print"
        target="_blank" 
        rel="noreferrer"
        title="تواصل معنا"
      >
        <span className="text-2xl">📱</span>
      </a>
    </div>
  );
}
