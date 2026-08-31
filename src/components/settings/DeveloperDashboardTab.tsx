import React from 'react';
import { useStore } from '../../store/useStore';
import { 
  Building2, LayoutGrid, CheckCircle, AlertCircle, 
  Activity, Globe, Download, Printer 
} from 'lucide-react';
import { exportToExcel } from '../../utils/exportUtils';
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

export const DeveloperDashboardTab: React.FC = () => {
  const { data, updateData, currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer';
  const masterAdmins = isDeveloper ? data.users.filter(u => u.role === 'master_admin') : [];

  // Developer Accounting Calculations
  const devCurrency = data.settings?.developerCurrency || 'EGP';

  const totalDesignSales = masterAdmins.reduce((sum, admin) => sum + (admin.designSalePrice || 5000), 0);
  const totalBranchSales = masterAdmins.reduce((sum, admin) => {
    const branchesCount = data.clinics.filter(c => c.masterAdminId === admin.user).length;
    return sum + ((admin.branchSalePrice || 1500) * branchesCount);
  }, 0);
  const totalSalesValue = totalDesignSales + totalBranchSales;
  const totalCollectedFromCenters = masterAdmins.reduce((sum, admin) => sum + (admin.paidAmountToDev || 0), 0);
  const totalPendingFromCenters = totalSalesValue - totalCollectedFromCenters;

  const handleExportDevExcel = () => {
    const excelRows: any[] = masterAdmins.map(admin => {
      const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
      const designPrice = admin.designSalePrice || 5000;
      const bPrice = admin.branchSalePrice || 1500;
      const totalDue = designPrice + (bPrice * actualBranches);
      const paid = admin.paidAmountToDev || 0;
      const remaining = totalDue - paid;
      return {
        "اسم المركز الرئيسي": admin.name,
        "اسم مستخدم المسؤول": admin.user,
        "سعر تصميم السيستم": designPrice,
        "سعر ترخيص الفرع": bPrice,
        "عدد الفروع النشطة المنشأة": actualBranches,
        "إجمالي قيمة التعاقد": totalDue,
        "المبلغ المحصل كاش للمطور": paid,
        "المبلغ المتبقي المعلق": remaining,
      };
    });

    // Add a summary row
    excelRows.push({
      "اسم المركز الرئيسي": "إجمالي الحسابات والمبيعات",
      "اسم مستخدم المسؤول": "",
      "سعر تصميم السيستم": totalDesignSales,
      "سعر ترخيص الفرع": 0,
      "عدد الفروع النشطة المنشأة": data.clinics.length,
      "إجمالي قيمة التعاقد": totalSalesValue,
      "المبلغ المحصل كاش للمطور": totalCollectedFromCenters,
      "المبلغ المتبقي المعلق": totalPendingFromCenters,
    });

    exportToExcel(excelRows, `حسابات_المطور_صبري_الديب_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`);
  };

  // 📈 Cloud Dashboard Calculations
  const branchAnalytics = (currentUser?.role === "developer" 
    ? data.clinics 
    : currentUser?.role === "master_admin" 
    ? data.clinics.filter(c => c.masterAdminId === currentUser.user) 
    : data.clinics.filter(c => c.id === currentUser?.clinicId)
  ).map(clinic => {
    const queueInvoices = data.queue?.[clinic.id] || [];
    const archiveInvoices = data.archive?.[clinic.id] || [];
    const allInvoices = [...queueInvoices, ...archiveInvoices];
    
    const revenue = allInvoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0);
    const invoiceSum = allInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const dueAmount = allInvoices.reduce((sum, inv) => sum + (Number(inv.due) || 0), 0);
    const visits = allInvoices.length;
    const appointments = (data.appointments?.[clinic.id] || []).length;
    const staff = (data.staffDirectory?.[clinic.id] || []).length;
    const owner = data.users.find(u => u.user === clinic.masterAdminId)?.name || 'غير محدد';
    
    return {
      id: clinic.id,
      name: clinic.name,
      owner,
      revenue,
      invoiceSum,
      dueAmount,
      visits,
      appointments,
      staff,
      currency: clinic.currency || 'SAR'
    };
  });

  const totalInvoicesSumAll = branchAnalytics.reduce((sum, b) => sum + b.invoiceSum, 0);
  const totalRevenueAll = branchAnalytics.reduce((sum, b) => sum + b.revenue, 0);
  const totalDueAll = branchAnalytics.reduce((sum, b) => sum + b.dueAmount, 0);
  const totalVisitsAll = branchAnalytics.reduce((sum, b) => sum + b.visits, 0);
  const totalAppointmentsAll = branchAnalytics.reduce((sum, b) => sum + b.appointments, 0);

  const activeCentersCount = masterAdmins.filter(u => u.isActive !== false && (!u.expiryDate || new Date(u.expiryDate).getTime() > Date.now())).length;
  const inactiveCentersCount = masterAdmins.length - activeCentersCount;

  const centerStatusData = [
    { name: 'مراكز نشطة', value: activeCentersCount },
    { name: 'مراكز موقوفة/منتهية', value: inactiveCentersCount }
  ];

  return (
    <div className="space-y-6">
      {/* Developer Accounting Dashboard */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-xl font-black text-white flex items-center gap-2">
              <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">💰</span>
              لوحة الحسابات والتعاقدات المالية للمطور
            </h4>
            <p className="text-xs text-slate-400 mt-1">متابعة إجمالي مبيعات التصميم، رسوم تراخيص الفروع، والتحصيل الكاش والآجل</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة المبيعات:</span>
            <span className="text-2xl font-black text-white mt-1">{totalSalesValue.toLocaleString('ar-EG')} {devCurrency}</span>
          </div>
        </div>

        {/* Currency & Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 no-print">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="text-indigo-400" size={16} />
              <span className="text-xs text-slate-300 font-bold">عملة الحسابات:</span>
              <select
                value={['EGP', 'USD', 'SAR', 'AED', 'KWD', 'IQD', 'QAR', 'BHD', 'OMR'].includes(data.settings?.developerCurrency || 'EGP') ? (data.settings?.developerCurrency || 'EGP') : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'custom') {
                    updateData({
                      settings: {
                        modules: data.settings?.modules || {
                          patients: true, appointments: true, finance: true, services: true,
                          inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
                        },
                        customLabels: data.settings?.customLabels || { patients: "العملاء", clinics: "الفروع" },
                        language: data.settings?.language || 'ar',
                        loyaltyPointsValue: data.settings?.loyaltyPointsValue || 10,
                        voiceSettings: data.settings?.voiceSettings,
                        developerCurrency: val
                      }
                    });
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="IQD">دينار عراقي (IQD)</option>
                <option value="QAR">ريال قطري (QAR)</option>
                <option value="BHD">دينار بحريني (BHD)</option>
                <option value="OMR">ريال عماني (OMR)</option>
                <option value="custom">✍️ رمز مخصص...</option>
              </select>
            </div>

            {/* Custom/Fallback Text input */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">الرمز:</span>
              <input
                type="text"
                placeholder="مثال: EGP"
                value={data.settings?.developerCurrency || 'EGP'}
                onChange={(e) => {
                  updateData({
                    settings: {
                      modules: data.settings?.modules || {
                        patients: true, appointments: true, finance: true, services: true,
                        inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
                      },
                      customLabels: data.settings?.customLabels || { patients: "العملاء", clinics: "الفروع" },
                      language: data.settings?.language || 'ar',
                      loyaltyPointsValue: data.settings?.loyaltyPointsValue || 10,
                      voiceSettings: data.settings?.voiceSettings,
                      developerCurrency: e.target.value
                    }
                  });
                }}
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold outline-none text-center focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDevExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-500/20"
              title="تصدير الحسابات كاملة بصيغة إكسيل"
            >
              <Download size={14} />
              تنزيل إكسيل (Excel) 📊
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-indigo-500/20"
              title="طباعة كشف الحساب وعقود المطور الرسمية"
            >
              <Printer size={14} />
              طباعة الكشف / PDF 🖨️
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between transition-all hover:border-slate-700">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">مبيعات تصميم السيستم</p>
              <h3 className="text-lg font-black text-white">{totalDesignSales.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-indigo-400 mt-1 font-bold">عقود بيع التصميم للرئيسي</p>
            </div>
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl border border-indigo-500/25">
              <Building2 size={20} />
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between transition-all hover:border-slate-700">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">مبيعات تراخيص الفروع</p>
              <h3 className="text-lg font-black text-white">{totalBranchSales.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-blue-400 mt-1 font-bold">سعر الترخيص × الفروع المفتوحة</p>
            </div>
            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/25">
              <LayoutGrid size={20} />
            </div>
          </div>

          <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-900/40 flex items-center justify-between transition-all hover:border-emerald-800/80">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 mb-0.5">إجمالي التحصيل الكاش</p>
              <h3 className="text-lg font-black text-emerald-400">{totalCollectedFromCenters.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-emerald-400/80 mt-1 font-bold">مبالغ محصلة ومستلمة فعلياً</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/25">
              <CheckCircle size={20} />
            </div>
          </div>

          <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-900/40 flex items-center justify-between transition-all hover:border-rose-800/80">
            <div>
              <p className="text-[10px] font-bold text-rose-400 mb-0.5">إجمالي الديون المعلقة</p>
              <h3 className="text-lg font-black text-rose-400">{totalPendingFromCenters.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-rose-400/80 mt-1 font-bold">متبقي آجل بطرف المراكز</p>
            </div>
            <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl border border-rose-500/25">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">المراكز الرئيسية المسجلة</p>
            <h3 className="text-2xl font-bold text-slate-800">{masterAdmins.length}</h3>
          </div>
          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">إجمالي الفروع المنشأة</p>
            <h3 className="text-2xl font-bold text-slate-800">{data.clinics.length}</h3>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
            <LayoutGrid size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">المراكز النشطة (مفعلة)</p>
            <h3 className="text-2xl font-bold text-green-600">
              {activeCentersCount}
            </h3>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-xl">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">المراكز المنتهية / موقوفة</p>
            <h3 className="text-2xl font-bold text-red-600">
              {inactiveCentersCount}
            </h3>
          </div>
          <div className="bg-red-100 text-red-600 p-3 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* 📊 لوحة تحكم إحصائية متطورة للمطور صبري الديب */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-slate-800 font-[Cairo]">لوحة التحليل الإحصائي السحابي الفوري</h4>
              <p className="text-xs text-slate-500">متابعة دقيقة لنشاط الفروع وإيرادات التجميل الفورية وحالة اشتراكات المراكز</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            تحديث لحظي سحابي ⚡
          </div>
        </div>

        {/* 4 Financial & Operational Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50/50 p-4.5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-indigo-600 mb-1">إجمالي الفواتير الصادرة</span>
            <h3 className="text-xl font-black text-indigo-950">{totalInvoicesSumAll.toLocaleString('ar-EG')} <span className="text-xs font-bold">SAR</span></h3>
            <span className="text-[10px] text-indigo-500 mt-1">تراكمي للمبيعات بكافة الفروع</span>
          </div>

          <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-emerald-600 mb-1">إجمالي الإيرادات المحصلة</span>
            <h3 className="text-xl font-black text-emerald-950">{totalRevenueAll.toLocaleString('ar-EG')} <span className="text-xs font-bold">SAR</span></h3>
            <span className="text-[10px] text-emerald-500 mt-1">مبالغ مستلمة كاش وشبكة</span>
          </div>

          <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-600 mb-1">المستحقات المعلقة للعملاء</span>
            <h3 className="text-xl font-black text-amber-950">{totalDueAll.toLocaleString('ar-EG')} <span className="text-xs font-bold">SAR</span></h3>
            <span className="text-[10px] text-amber-500 mt-1">ديون آجلة بطرف الزوار</span>
          </div>

          <div className="bg-blue-50/50 p-4.5 rounded-2xl border border-blue-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-600 mb-1">عمليات الحجز والزيارات</span>
            <h3 className="text-xl font-black text-blue-950">{(totalVisitsAll + totalAppointmentsAll).toLocaleString('ar-EG')} <span className="text-xs font-bold">عملية</span></h3>
            <span className="text-[10px] text-blue-500 mt-1">{totalVisitsAll.toLocaleString('ar-EG')} زيارات | {totalAppointmentsAll.toLocaleString('ar-EG')} حجوزات</span>
          </div>
        </div>

        {/* Recharts Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Revenue vs Due (8 Columns on desktop) */}
          <div className="lg:col-span-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block"></span>
                مقارنة الإيرادات المحصلة والمستحقات المعلقة حسب فروع التجميل
              </h5>
            </div>
            {branchAnalytics.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs font-bold">
                لا توجد فروع مسجلة حالياً لعرض إحصاءات الإيرادات
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={branchAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Cairo', direction: 'rtl' }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} SAR`, '']}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 11, paddingTop: 10 }} />
                    <Area type="monotone" dataKey="revenue" name="إيرادات محصلة" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="dueAmount" name="مستحقات آجلة" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Active vs Inactive Subscription Ratio (4 Columns) */}
          <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                معدل تفعيل وحيوية الاشتراكات
              </h5>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                توزيع مراكز التجميل والعملاء النشطين مقارنة بالاشتراكات المنتهية أو المعطلة مؤقتاً
              </p>
            </div>

            <div className="h-[180px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={centerStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Cairo', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{masterAdmins.length}</span>
                <span className="text-[9px] font-bold text-slate-400">إجمالي المراكز</span>
              </div>
            </div>

            <div className="flex items-center justify-around pt-3 border-t border-slate-200/60 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">نشطة</span>
                <span className="text-xs font-black text-emerald-600">{activeCentersCount} مراكز</span>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">منتهية</span>
                <span className="text-xs font-black text-red-500">{inactiveCentersCount} مراكز</span>
              </div>
            </div>
          </div>

          {/* Chart 3: Branch Traffic (Visits vs Appointments) (12 Columns) */}
          <div className="lg:col-span-12 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 block"></span>
              مستوى الإقبال والنشاط التشغيلي بالفروع (الزيارات المنجزة والحجوزات المعلقة)
            </h5>
            {branchAnalytics.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs font-bold">
                لا توجد فروع مسجلة لعرض مخطط النشاط والزيارات
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Cairo', direction: 'rtl' }} />
                    <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="visits" name="زيارات عملاء منفذة" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="appointments" name="حجوزات مسجلة ومستقبلية" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Live Branch Activity Audit List */}
        <div className="border border-slate-150 rounded-2xl overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-150 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700">سجل النشاط التشغيلي والتفصيلي للفروع</span>
            <span className="text-[10px] font-bold text-indigo-600">إجمالي الفروع النشطة: {branchAnalytics.length}</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100/40 text-slate-500 font-bold">
                  <th className="p-3">اسم فرع التجميل</th>
                  <th className="p-3">المالك المسؤول</th>
                  <th className="p-3">المبيعات الإجمالية</th>
                  <th className="p-3">الإيراد المحصل</th>
                  <th className="p-3">معلق ذمم مالية</th>
                  <th className="p-3 text-center">فريق العمل</th>
                  <th className="p-3 text-center">الزيارات / الحجوزات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 font-bold">لا توجد أي بيانات تفصيلية للفروع حالياً</td>
                  </tr>
                ) : (
                  branchAnalytics.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{b.name}</td>
                      <td className="p-3 text-slate-500 font-semibold">{b.owner}</td>
                      <td className="p-3 font-bold text-indigo-700">{b.invoiceSum.toFixed(2)} {b.currency}</td>
                      <td className="p-3 font-bold text-emerald-600">{b.revenue.toFixed(2)} {b.currency}</td>
                      <td className="p-3 font-bold text-amber-600">{b.dueAmount.toFixed(2)} {b.currency}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{b.staff} خبراء تجميل</td>
                      <td className="p-3 text-center font-semibold text-slate-600">{b.visits} زيارة / {b.appointments} حجز</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tenant Usage Monitor */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mt-6">
        <h4 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
          <Activity className="text-indigo-600" size={24} />
          مراقب استهلاك المراكز (Tenant Usage Monitor)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 rounded-r-xl">المركز (Master Admin)</th>
                <th className="py-3 px-4">الفروع (Clinics)</th>
                <th className="py-3 px-4">الموظفين (Staff)</th>
                <th className="py-3 px-4">العملاء (Clients)</th>
                <th className="py-3 px-4">الفواتير (Invoices)</th>
                <th className="py-3 px-4 rounded-l-xl">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {masterAdmins.map(admin => {
                const adminBranches = data.clinics.filter(c => c.tenantId === admin.user || (admin.user === 'master' && !c.tenantId));
                const branchIds = adminBranches.map(b => b.id);
                
                const adminStaff = data.users.filter(u => u.tenantId === admin.user || (admin.user === 'master' && !u.tenantId));
                const adminClients = ((data as any).patients || []).filter((p: any) => p.tenantId === admin.user || (admin.user === 'master' && !p.tenantId) || branchIds.includes(p.clinicId));
                const adminInvoices = ((data as any).invoices || []).filter((i: any) => branchIds.includes(i.clinicId));

                return (
                  <tr key={admin.user} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{admin.name}</div>
                      <div className="text-xs text-slate-500">{admin.user}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{adminBranches.length}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{adminStaff.length}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{adminClients.length}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{adminInvoices.length}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${admin.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.isActive !== false ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {masterAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">لا يوجد مراكز حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
