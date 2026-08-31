import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { RecordItem } from '../types';
import { 
  FileText, Printer, FileSpreadsheet, Building2, Wallet, Plus, Trash2, 
  TrendingUp, Globe, Users, Award, DollarSign, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, Sparkles, Filter, Download, Edit
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ConsolidatedFinance } from '../components/ConsolidatedFinance';
import { CurrencyConverter } from '../components/CurrencyConverter';
import { ExportButtons } from '../components/ExportButtons';
import { printInvoice, printReport, exportToExcel } from '../utils/exportUtils';
import { FinanceDrilldownModal, DrilldownMode } from '../components/FinanceDrilldownModal';
import { recordActivityLog } from '../utils/activityLogger';
import EditInvoiceModal from '../components/EditInvoiceModal';

export default function FinanceTab() {
  const { data, updateData, currentUser, viewingBranchId, setViewingBranchId } = useStore();
  const { currentClinicId, currentCurrency, getCombinedAllRecords } = useClinicContext();
  
  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isPrintAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisablePrintFinance !== true && (center?.permissions?.printFull !== false || currentUser?.permissions?.canPrintFinance !== false));
  const isDownloadAllowed = currentUser?.role === 'developer' || ((center?.permissions?.devDisableExportExcel !== true || center?.permissions?.devDisableExportPDF !== true) && (center?.permissions?.downloadFull !== false || currentUser?.permissions?.canExportData !== false));

  const [viewMode, setViewMode] = useState<'local' | 'consolidated'>('local');

  // Drilldown modal state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownMode, setDrilldownMode] = useState<DrilldownMode>('revenues');
  
  // Invoice Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const openDrilldown = (mode: DrilldownMode) => {
    setDrilldownMode(mode);
    setDrilldownOpen(true);
  };

  const records = getCombinedAllRecords();
  const expenses = data.expensesStore[currentClinicId] || [];
  const staffList = data.staffDirectory?.[currentClinicId] || [];
  const payrollTrans = data.payrollStore?.[currentClinicId] || [];
  const currentClinic = data.clinics.find(c => c.id === currentClinicId);
  
  const [expCategory, setExpCategory] = useState('مستحضرات وخامات تجميل');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);

  // Calcs
  const totalRev = records.reduce((sum, r) => sum + (r.paid || 0), 0);
  const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRev - totalExp;
  const totalDue = records.reduce((sum, r) => sum + Math.max(0, (r.total || 0) - (r.paid || 0)), 0);

  // Staff summary
  const totalStaffSalaries = staffList.reduce((sum, s) => sum + (s.salary || 0), 0);

  let cashTotal = 0;
  let bankTotal = 0;
  let posTotal = 0;

  records.forEach(r => {
    if (r.payMethod?.includes('تحويل') || r.payMethod?.includes('InstaPay')) bankTotal += r.paid;
    else if (r.payMethod?.includes('شبكة') || r.payMethod?.includes('فيزا')) posTotal += r.paid;
    else cashTotal += r.paid;
  });

  const monthlyDataMap: Record<string, { name: string, revenue: number, expenses: number }> = {};
  
  const getMonthKey = (dateString: string, isoDate?: string) => {
    if (isoDate) {
      const d = new Date(isoDate);
      return d.toLocaleString('ar-EG', { month: 'short', year: 'numeric' });
    }
    if (!dateString) return 'مجهول';
    
    const datePart = dateString.split(' ')[0];
    const d = new Date(datePart);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('ar-EG', { month: 'short', year: 'numeric' });
    }
    
    const parts = datePart.split('/');
    if (parts.length === 3) {
      const fallbackDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(fallbackDate.getTime())) {
         return fallbackDate.toLocaleString('ar-EG', { month: 'short', year: 'numeric' });
      }
      return `${parts[1]}/${parts[2]}`;
    }
    return datePart;
  };

  records.forEach(r => {
    const key = getMonthKey(r.date, r.isoDate);
    if (!monthlyDataMap[key]) monthlyDataMap[key] = { name: key, revenue: 0, expenses: 0 };
    monthlyDataMap[key].revenue += (r.paid || 0);
  });

  expenses.forEach(e => {
    const key = getMonthKey(e.date);
    if (!monthlyDataMap[key]) monthlyDataMap[key] = { name: key, revenue: 0, expenses: 0 };
    monthlyDataMap[key].expenses += (e.amount || 0);
  });

  const chartData = Object.values(monthlyDataMap);

  const handleAddExpense = () => {
    if (!expDesc || expAmount <= 0) {
      alert("الرجاء إدخال بيان ومبلغ صحيح للمصروف!");
      return;
    }
    const newEx = {
      id: Date.now(),
      category: expCategory,
      desc: expDesc,
      amount: expAmount,
      handler: currentUser?.name || 'الإدارة',
      date: new Date().toLocaleDateString('ar-EG')
    };
    const updated = [...expenses, newEx];
    updateData({
      expensesStore: { ...data.expensesStore, [currentClinicId]: updated }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'الإدارة',
      'إضافة سند صرف',
      `تم تسجيل مصروف جديد: (${expDesc}) بقيمة ${expAmount} ${currentCurrency} ضمن بند (${expCategory})`
    );

    setExpDesc('');
    setExpAmount(0);
  };

  const removeExpense = (id: number) => {
    const target = expenses.find(e => e.id === id);
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    const updated = expenses.filter(e => e.id !== id);
    updateData({
      expensesStore: { ...data.expensesStore, [currentClinicId]: updated }
    });

    if (target) {
      recordActivityLog(
        currentClinicId,
        currentUser?.name || 'الإدارة',
        'حذف سند صرف',
        `تم حذف المصروف: (${target.desc}) بقيمة ${target.amount} ${currentCurrency}`
      );
    }
  };

  if (viewMode === 'consolidated') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <h5 className="font-black text-slate-800 m-0">التقرير المالي المجمع للفروع</h5>
          <button 
            onClick={() => setViewMode('local')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors"
          >
            العودة للفرع الحالي
          </button>
        </div>
        <ConsolidatedFinance />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={24} />
            لوحة الإدارة المالية والمحاسبة التفصيلية
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            الفرع النشط: <span className="text-indigo-600 font-bold">{currentUser?.role === 'developer' ? 'نظام المطور' : (currentClinic?.name || 'غير محدد')}</span> | اضغط على أي بطاقة مالية لعرض تفاصيلها وطباعتها وتصديرها
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          {currentUser?.role === 'master_admin' && (
            <button 
              onClick={() => setViewMode('consolidated')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all border border-indigo-200"
            >
              <Globe size={16} /> التقرير المالي المجمع (فروعي)
            </button>
          )}

          {/* Quick Direct Open Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => openDrilldown('revenues')}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              كشف الإيرادات
            </button>
            <button 
              onClick={() => openDrilldown('expenses')}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              كشف المصروفات
            </button>
            <button 
              onClick={() => openDrilldown('profit')}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              قائمة الدخل P&L
            </button>
            <button 
              onClick={() => openDrilldown('payroll')}
              className="px-3 py-1.5 bg-white hover:bg-purple-50 hover:text-purple-600 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              مسير الرواتب
            </button>
            <button 
              onClick={() => openDrilldown('customers')}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              حسابات العملاء
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 Interactive Clickable Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Revenue Card */}
        <div 
          onClick={() => openDrilldown('revenues')}
          className="group bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
          title="انقر لعرض كشف الإيرادات والمقبوضات التفصيلي"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs opacity-90 font-medium">إجمالي الإيرادات</span>
            <ArrowUpRight size={16} className="text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black">{totalRev.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-200 mt-1 flex items-center justify-between">
            <span>{currentCurrency}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">عرض وتصدير</span>
          </div>
        </div>

        {/* 2. Collected Card */}
        <div 
          onClick={() => openDrilldown('revenues')}
          className="group bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
          title="انقر لعرض المقبوضات وتفاصيل الدفع"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs opacity-90 font-medium">إجمالي المحصل</span>
            <DollarSign size={16} className="text-emerald-200 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black">{totalRev.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-200 mt-1 flex items-center justify-between">
            <span>{currentCurrency}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{records.length} عملية</span>
          </div>
        </div>

        {/* 3. Expenses Card */}
        <div 
          onClick={() => openDrilldown('expenses')}
          className="group bg-gradient-to-br from-rose-600 to-rose-700 text-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
          title="انقر لعرض كشف المصروفات والنثريات وإدارتها"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs opacity-90 font-medium">المصروفات</span>
            <ArrowDownRight size={16} className="text-rose-200 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black">{totalExp.toLocaleString()}</div>
          <div className="text-[11px] text-rose-200 mt-1 flex items-center justify-between">
            <span>{currentCurrency}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{expenses.length} بند</span>
          </div>
        </div>

        {/* 4. Net Profit Card */}
        <div 
          onClick={() => openDrilldown('profit')}
          className="group bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden border border-slate-700"
          title="انقر لعرض قائمة الدخل وصافي الأرباح التفصيلية P&L"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-300 font-medium">صافي الأرباح</span>
            <TrendingUp size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{currentCurrency}</span>
            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-bold">قائمة الدخل</span>
          </div>
        </div>

        {/* 5. Staff Salaries & Accounts Card */}
        <div 
          onClick={() => openDrilldown('payroll')}
          className="group bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
          title="انقر لعرض رواتب وحسابات وعمولات الموظفين"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs opacity-90 font-medium">رواتب الموظفين</span>
            <Award size={16} className="text-purple-200 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black">{totalStaffSalaries.toLocaleString()}</div>
          <div className="text-[11px] text-purple-200 mt-1 flex items-center justify-between">
            <span>{currentCurrency}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{staffList.length} موظف</span>
          </div>
        </div>

        {/* 6. Customers & Debts Card */}
        <div 
          onClick={() => openDrilldown('customers')}
          className="group bg-gradient-to-br from-blue-600 to-sky-700 text-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 relative overflow-hidden"
          title="انقر لعرض حسابات ومديونيات العملاء ونقاط الولاء"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs opacity-90 font-medium">حسابات العملاء</span>
            <Users size={16} className="text-blue-200 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black">{totalDue > 0 ? totalDue.toLocaleString() : '0'}</div>
          <div className="text-[11px] text-blue-200 mt-1 flex items-center justify-between">
            <span>آجل: {currentCurrency}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">كشف الحسابات</span>
          </div>
        </div>

      </div>

      {/* Interactive Helper Prompt */}
      <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600 shrink-0" />
          <span>
            <strong>ميزة جديدة:</strong> يمكنك النقر مباشرة على أي من البطاقات أعلاه لفتح كشف حساب تفصيلي يتيح الطباعة المنسقة، والتصدير إلى Excel أو PDF، وتطبيق الفلاتر الزمنية.
          </span>
        </div>
        <button 
          onClick={() => openDrilldown('profit')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition-colors shrink-0 shadow-2xs"
        >
          عرض التحليل المالي الكامل
        </button>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0">
            <TrendingUp size={18} />
            ملخص الإيرادات والمصروفات الشهري
          </h6>
          <button 
            onClick={() => openDrilldown('profit')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            تقرير الأرباح التفصيلي <ChevronLeft size={14} />
          </button>
        </div>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '1rem', fontSize: '14px' }} />
              <Bar dataKey="revenue" name="الإيرادات" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="expenses" name="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Treasury & Payment Methods */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-treasury">
        <div className="flex justify-between items-center mb-4">
          <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0">
            <Building2 size={18} />
            أرصدة وحركة الخزينة وحسابات البنوك
          </h6>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => openDrilldown('revenues')}
              className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              كشف تفصيلي
            </button>
            {isPrintAllowed && isDownloadAllowed && (
              <ExportButtons 
                data={[{'خزينة الكاش': cashTotal, 'حساب InstaPay والتحويلات': bankTotal, 'الشبكة وفيزا': posTotal}]} 
                pdfHeaders={['كاش مباشر', 'حساب InstaPay/تحويل', 'شبكة/فيزا']} 
                pdfData={[[cashTotal, bankTotal, posTotal]]} 
                filename="treasury_report" 
                title="تقرير الخزينة والبنوك" 
                printElementId="print-treasury" 
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => openDrilldown('revenues')}
            className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 p-4 rounded-xl text-center cursor-pointer transition-all"
          >
            <div className="text-sm text-slate-500 mb-1">خزينة الكاش المباشر (نقدي)</div>
            <div className="text-2xl font-bold text-emerald-600">{cashTotal.toLocaleString()} {currentCurrency}</div>
          </div>
          <div 
            onClick={() => openDrilldown('revenues')}
            className="bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 p-4 rounded-xl text-center cursor-pointer transition-all"
          >
            <div className="text-sm text-slate-500 mb-1">حساب InstaPay / تحويلات بنكية</div>
            <div className="text-2xl font-bold text-blue-600">{bankTotal.toLocaleString()} {currentCurrency}</div>
          </div>
          <div 
            onClick={() => openDrilldown('revenues')}
            className="bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 hover:border-cyan-200 p-4 rounded-xl text-center cursor-pointer transition-all"
          >
            <div className="text-sm text-slate-500 mb-1">أجهزة الشبكة / بطاقات فيزا (POS)</div>
            <div className="text-2xl font-bold text-cyan-600">{posTotal.toLocaleString()} {currentCurrency}</div>
          </div>
        </div>
      </div>

      {/* Expenses & Quick Entry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-expenses">
          <div className="flex justify-between items-center mb-4">
            <h6 className="font-bold text-red-500 flex items-center gap-2 m-0">
              <Wallet size={18} />
              تسجيل المصروفات والنثريات
            </h6>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openDrilldown('expenses')}
                className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-xl transition-colors"
              >
                كشف مفصل
              </button>
              {isPrintAllowed && isDownloadAllowed && (
                <ExportButtons 
                  data={expenses} 
                  pdfHeaders={['البند', 'البيان', 'المبلغ']} 
                  pdfData={expenses.map(e => [e.category, e.desc, e.amount])} 
                  filename="expenses_report" 
                  title="تقرير المصروفات" 
                  printElementId="print-expenses" 
                />
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mb-3 no-print">
            <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-red-500 font-bold text-slate-700">
              <option value="مستحضرات وخامات تجميل">مستحضرات وخامات</option>
              <option value="أجور ومرتبات">أجور ومرتبات</option>
              <option value="فواتير تشغيلية (كهرباء/إيجار)">فواتير تشغيلية</option>
              <option value="صيانة ونثريات عامة">صيانة ونثريات</option>
            </select>
            <input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" placeholder="البيان..." />
            <input type="number" value={expAmount || ''} onChange={e => setExpAmount(parseFloat(e.target.value)||0)} className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 font-bold text-rose-600" placeholder="المبلغ" min="0" />
          </div>
          <button onClick={handleAddExpense} className="no-print w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold rounded-lg py-2 transition-colors">
            تسجيل المصروف
          </button>

          <div className="mt-4 max-h-[220px] overflow-y-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2">البند</th>
                  <th className="p-2">البيان</th>
                  <th className="p-2">المبلغ</th>
                  <th className="p-2 no-print text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-400">لا يوجد مصروفات مسجلة</td></tr>
                ) : expenses.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="p-2"><span className="bg-slate-100 text-xs px-2 py-1 rounded font-bold">{ex.category}</span></td>
                    <td className="p-2">{ex.desc}</td>
                    <td className="p-2 font-bold text-red-500">{ex.amount.toLocaleString()} {currentCurrency}</td>
                    <td className="p-2 no-print text-center">
                      <button onClick={() => removeExpense(ex.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Currency Converter */}
        <div className="space-y-6">
          <CurrencyConverter />
        </div>
      </div>
      
      {/* Revenue List Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-revenues">
        <div className="flex justify-between items-center mb-4">
          <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0">
            <FileText size={18} />
            حركة الإيرادات والجلسات الأخيرة
          </h6>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => openDrilldown('revenues')}
              className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              عرض الكشف الكامل مع الفلاتر
            </button>
            {(currentUser?.role === 'developer' || currentUser?.permissions?.canPrintFinance !== false) && (
              <ExportButtons 
                data={records} 
                pdfHeaders={['العميل', 'التاريخ', 'الخدمة', 'طريقة الدفع', 'المدفوع', 'المتبقي']} 
                pdfData={records.map(r => [r.name, r.isoDate || r.date, r.service, r.payMethod || 'نقدي', r.paid, (r.total || 0) - (r.paid || 0)])} 
                filename="revenues_report" 
                title="تقرير الإيرادات والجلسات" 
                printElementId="print-revenues" 
              />
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">العميل</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الخدمة</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">المطلوب</th>
                <th className="p-3">المدفوع</th>
                <th className="p-3">المتبقي</th>
                <th className="p-3 no-print text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-slate-400">لا يوجد إيرادات مسجلة</td></tr>
              ) : records.slice(0, 15).map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{r.name}</td>
                  <td className="p-3 text-slate-500">{r.isoDate || r.date}</td>
                  <td className="p-3">{r.service}</td>
                  <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{r.payMethod || 'نقدي'}</span></td>
                  <td className="p-3">{r.total}</td>
                  <td className="p-3 font-bold text-emerald-600">{r.paid}</td>
                  <td className="p-3 font-bold text-rose-500">{(r.total || 0) - (r.paid || 0)}</td>
                  <td className="p-3 no-print text-center">
                    <div className="flex gap-1.5 items-center justify-center">
                      {(currentUser?.role === 'developer' || currentUser?.permissions?.canPrintFinance !== false) && (
                        <button 
                          onClick={() => printInvoice(r, currentClinic)}
                          className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 text-xs font-bold transition-colors border border-indigo-200/50"
                        >
                          <Printer size={13} /> فاتورة 🖨️
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingInvoice(r)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 text-xs font-bold transition-colors border border-amber-200/50"
                      >
                        <Edit size={13} /> تعديل ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        isOpen={editingInvoice !== null}
        onClose={() => setEditingInvoice(null)}
        type="clinic"
        invoice={editingInvoice}
        clinicId={currentClinicId}
      />

      {/* Drilldown Modal */}
      <FinanceDrilldownModal 
        isOpen={drilldownOpen} 
        onClose={() => setDrilldownOpen(false)} 
        initialMode={drilldownMode} 
      />
    </div>
  );
}
