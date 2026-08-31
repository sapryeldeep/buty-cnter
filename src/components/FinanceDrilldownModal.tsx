import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { RecordItem, Expense, Staff, PayrollTransaction } from '../types';
import { 
  X, Printer, Download, FileText, Search, Filter, Calendar, 
  TrendingUp, TrendingDown, DollarSign, Users, Wallet, CreditCard, 
  Building2, Plus, Trash2, CheckCircle2, ChevronRight, ArrowUpRight, 
  ArrowDownRight, Eye, Phone, Star, ShieldAlert, Award
} from 'lucide-react';
import { exportToExcel, exportHTMLToPDF, printReport, printInvoice, printPaySlip, printCustomerStatement } from '../utils/exportUtils';
import { recordActivityLog } from '../utils/activityLogger';

export type DrilldownMode = 'revenues' | 'expenses' | 'profit' | 'payroll' | 'customers';

interface FinanceDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: DrilldownMode;
}

export function FinanceDrilldownModal({ isOpen, onClose, initialMode = 'revenues' }: FinanceDrilldownModalProps) {
  const { data, updateData, currentUser } = useStore();
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
  const isExcelAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisableExportExcel !== true && (center?.permissions?.downloadFull !== false || currentUser?.permissions?.canExportData !== false));
  const isPdfAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisableExportPDF !== true && (center?.permissions?.downloadFull !== false || currentUser?.permissions?.canExportData !== false));

  const [activeMode, setActiveMode] = useState<DrilldownMode>(initialMode);
  
  // Update mode when initialMode prop changes on open
  React.useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const currentClinic = data.clinics.find(c => c.id === currentClinicId);
  const allRecords = getCombinedAllRecords();
  const allExpenses = data.expensesStore[currentClinicId] || [];
  const staffList = data.staffDirectory?.[currentClinicId] || [];
  const payrollTrans = data.payrollStore?.[currentClinicId] || [];

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payMethodFilter, setPayMethodFilter] = useState('all');
  const [expenseCatFilter, setExpenseCatFilter] = useState('all');
  const [debtOnlyFilter, setDebtOnlyFilter] = useState(false);

  // New item states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpCat, setNewExpCat] = useState('مستحضرات وخامات تجميل');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<number>(0);

  // Payroll add transaction modal state
  const [selectedStaffForTrans, setSelectedStaffForTrans] = useState<Staff | null>(null);
  const [transType, setTransType] = useState<'bonus' | 'deduction' | 'advance'>('bonus');
  const [transAmount, setTransAmount] = useState<number>(0);
  const [transNote, setTransNote] = useState('');

  // Selected customer for detailed statement
  const [selectedPatientForStatement, setSelectedPatientForStatement] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper date checker
  const isDateInRange = (dateStr: string, isoDate?: string) => {
    if (dateFilter === 'all') return true;
    
    let itemDate = new Date();
    if (isoDate) {
      itemDate = new Date(isoDate);
    } else if (dateStr) {
      const parts = dateStr.split(' ')[0].split(/[\/\-]/);
      if (parts.length === 3) {
        // Assume either YYYY-MM-DD or DD/MM/YYYY
        if (parts[0].length === 4) itemDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        else itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    if (isNaN(itemDate.getTime())) return true;

    const today = new Date();
    today.setHours(0,0,0,0);

    if (dateFilter === 'today') {
      const check = new Date(itemDate);
      check.setHours(0,0,0,0);
      return check.getTime() === today.getTime();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return itemDate >= monthAgo;
    }
    if (dateFilter === 'custom') {
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (itemDate > end) return false;
      }
      return true;
    }
    return true;
  };

  // 1. Filtered Revenues
  const filteredRecords = allRecords.filter(r => {
    const matchesSearch = !searchTerm || 
      (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.phone && r.phone.includes(searchTerm)) ||
      (r.service && r.service.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.handler && r.handler.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPayMethod = payMethodFilter === 'all' || 
      (payMethodFilter === 'cash' && (!r.payMethod || r.payMethod.includes('نقدي') || r.payMethod.includes('كاش'))) ||
      (payMethodFilter === 'bank' && (r.payMethod && (r.payMethod.includes('تحويل') || r.payMethod.includes('InstaPay')))) ||
      (payMethodFilter === 'pos' && (r.payMethod && (r.payMethod.includes('شبكة') || r.payMethod.includes('فيزا'))));

    const matchesDate = isDateInRange(r.date, r.isoDate);

    return matchesSearch && matchesPayMethod && matchesDate;
  });

  const totalFilteredRevenue = filteredRecords.reduce((sum, r) => sum + (r.paid || 0), 0);
  const totalFilteredDue = filteredRecords.reduce((sum, r) => sum + Math.max(0, (r.total || 0) - (r.paid || 0)), 0);
  const totalFilteredTarget = filteredRecords.reduce((sum, r) => sum + (r.total || 0), 0);

  // 2. Filtered Expenses
  const filteredExpenses = allExpenses.filter(e => {
    const matchesSearch = !searchTerm ||
      (e.desc && e.desc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.handler && e.handler.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = expenseCatFilter === 'all' || e.category === expenseCatFilter;
    const matchesDate = isDateInRange(e.date);

    return matchesSearch && matchesCat && matchesDate;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3. Profit & Loss calculations
  const netProfitAmount = totalFilteredRevenue - totalFilteredExpenses;
  const profitMarginPercent = totalFilteredRevenue > 0 ? ((netProfitAmount / totalFilteredRevenue) * 100).toFixed(1) : '0';

  // 4. Staff & Payroll Calculations
  const staffPayrollData = staffList.map(st => {
    const basic = st.salary || 0;
    // Sessions done by this staff member in the records
    const staffRecords = allRecords.filter(r => r.handler && r.handler === st.name && isDateInRange(r.date, r.isoDate));
    const completedSessions = staffRecords.length;
    const salesVolume = staffRecords.reduce((sum, r) => sum + (r.paid || 0), 0);
    
    // Commission rule: 5% default or based on role
    const commission = Math.round(salesVolume * 0.05);

    // Adjustments from payroll transactions
    const staffTrans = payrollTrans.filter(t => t.staffName === st.name);
    const bonuses = staffTrans.filter(t => t.transType === 'bonus').reduce((sum, t) => sum + t.amount, 0);
    const deductions = staffTrans.filter(t => t.transType === 'deduction').reduce((sum, t) => sum + t.amount, 0);
    const advances = staffTrans.filter(t => t.transType === 'advance').reduce((sum, t) => sum + t.amount, 0);

    const net = basic + commission + bonuses - deductions - advances;

    return {
      staff: st,
      basic,
      completedSessions,
      salesVolume,
      commission,
      bonuses,
      deductions,
      advances,
      net
    };
  });

  const totalBasicSalaries = staffPayrollData.reduce((sum, p) => sum + p.basic, 0);
  const totalCommissions = staffPayrollData.reduce((sum, p) => sum + p.commission, 0);
  const totalBonuses = staffPayrollData.reduce((sum, p) => sum + p.bonuses, 0);
  const totalDeductionsAndAdvances = staffPayrollData.reduce((sum, p) => sum + p.deductions + p.advances, 0);
  const totalNetPayroll = staffPayrollData.reduce((sum, p) => sum + p.net, 0);

  // 5. Customer Accounts
  const customerMap: Record<string, { name: string, phone: string, total: number, paid: number, due: number, points: number, lastVisit: string, visitCount: number }> = {};
  allRecords.forEach(r => {
    if (!r.name) return;
    if (!customerMap[r.name]) {
      customerMap[r.name] = { 
        name: r.name, 
        phone: r.phone || '--', 
        total: 0, 
        paid: 0, 
        due: 0, 
        points: 0, 
        lastVisit: r.isoDate || r.date, 
        visitCount: 0 
      };
    }
    customerMap[r.name].total += r.total || 0;
    customerMap[r.name].paid += r.paid || 0;
    customerMap[r.name].due += Math.max(0, (r.total || 0) - (r.paid || 0));
    customerMap[r.name].visitCount += 1;
    customerMap[r.name].lastVisit = r.isoDate || r.date;
  });

  Object.values(customerMap).forEach(c => {
    c.points = Math.floor(c.paid / 100);
  });

  const filteredCustomers = Object.values(customerMap).filter(c => {
    const matchesSearch = !searchTerm || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm);
    const matchesDebt = !debtOnlyFilter || c.due > 0;
    return matchesSearch && matchesDebt;
  });

  const totalCustomersDebt = filteredCustomers.reduce((sum, c) => sum + c.due, 0);
  const totalCustomersPaid = filteredCustomers.reduce((sum, c) => sum + c.paid, 0);

  // Handlers for Add Expense
  const handleAddExpense = () => {
    if (!newExpDesc || newExpAmount <= 0) {
      alert("الرجاء إدخال بيان ومبلغ صحيح للمصروف!");
      return;
    }
    const newEx: Expense = {
      id: Date.now(),
      category: newExpCat,
      desc: newExpDesc,
      amount: newExpAmount,
      handler: currentUser?.name || 'الإدارة',
      date: new Date().toLocaleDateString('ar-EG')
    };
    const updated = [...allExpenses, newEx];
    updateData({
      expensesStore: { ...data.expensesStore, [currentClinicId]: updated }
    });
    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'الإدارة',
      'تسجيل مصروف مالي',
      `تم تسجيل مصروف (${newExpDesc}) بمبلغ ${newExpAmount} ${currentCurrency} ضمن بند ${newExpCat}`,
      'expense'
    );
    setNewExpDesc('');
    setNewExpAmount(0);
    setShowAddExpense(false);
  };

  const handleRemoveExpense = (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    const target = allExpenses.find(e => e.id === id);
    const updated = allExpenses.filter(e => e.id !== id);
    updateData({
      expensesStore: { ...data.expensesStore, [currentClinicId]: updated }
    });
    if (target) {
      recordActivityLog(
        currentClinicId,
        currentUser?.name || 'الإدارة',
        'حذف مصروف مالي',
        `تم حذف مصروف (${target.desc}) بقيمة ${target.amount} ${currentCurrency}`,
        'expense'
      );
    }
  };

  // Handlers for Add Payroll Transaction
  const handleAddPayrollTrans = () => {
    if (!selectedStaffForTrans || transAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح!');
      return;
    }
    const newTrans: PayrollTransaction = {
      id: Date.now(),
      staffName: selectedStaffForTrans.name,
      transType,
      amount: transAmount,
      note: transNote || (transType === 'bonus' ? 'مكافأة تشجيعية' : transType === 'advance' ? 'سلفة على الراتب' : 'خصم جزاءات'),
      date: new Date().toLocaleDateString('ar-EG')
    };
    const currentList = data.payrollStore?.[currentClinicId] || [];
    updateData({
      payrollStore: { ...data.payrollStore, [currentClinicId]: [...currentList, newTrans] }
    });
    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'الإدارة',
      'حركة رواتب ومستحقات',
      `تم تسجيل (${transType === 'bonus' ? 'مكافأة' : transType === 'advance' ? 'سلفة' : 'خصم'}) للموظف ${selectedStaffForTrans.name} بمبلغ ${transAmount} ${currentCurrency}`,
      'payroll'
    );
    setSelectedStaffForTrans(null);
    setTransAmount(0);
    setTransNote('');
    alert('تم تسجيل العملية بنجاح!');
  };

  // Export handlers
  const handleExportExcel = () => {
    if (activeMode === 'revenues') {
      const excelData = filteredRecords.map(r => ({
        'اسم العميل': r.name,
        'رقم الهاتف': r.phone,
        'الخدمة': r.service,
        'الخبير المنفذ': r.handler || '--',
        'طريقة الدفع': r.payMethod,
        'المطلوب': r.total,
        'المدفوع': r.paid,
        'المتبقي': (r.total || 0) - (r.paid || 0),
        'التاريخ': r.isoDate || r.date
      }));
      exportToExcel(excelData, `تقرير_الإيرادات_${currentClinic?.name || 'المركز'}`);
    } else if (activeMode === 'expenses') {
      const excelData = filteredExpenses.map(e => ({
        'البند': e.category,
        'البيان': e.desc,
        'المبلغ': e.amount,
        'المسؤول': e.handler,
        'التاريخ': e.date
      }));
      exportToExcel(excelData, `تقرير_المصروفات_${currentClinic?.name || 'المركز'}`);
    } else if (activeMode === 'profit') {
      const excelData = [
        { 'البند المالي': 'إجمالي الإيرادات المحصلة', 'القيمة': totalFilteredRevenue },
        { 'البند المالي': 'إجمالي المصروفات والنثريات', 'القيمة': totalFilteredExpenses },
        { 'البند المالي': 'صافي الأرباح التشغيلية', 'القيمة': netProfitAmount },
        { 'البند المالي': 'هامش الربح الصافي %', 'القيمة': `${profitMarginPercent}%` },
        { 'البند المالي': 'إجمالي المديونيات الآجلة للعملاء', 'القيمة': totalFilteredDue }
      ];
      exportToExcel(excelData, `تقرير_الأرباح_وقائمة_الدخل_${currentClinic?.name || 'المركز'}`);
    } else if (activeMode === 'payroll') {
      const excelData = staffPayrollData.map(p => ({
        'اسم الموظف': p.staff.name,
        'المسمى الوظيفي': p.staff.role || 'خبير / موظف',
        'الراتب الأساسي': p.basic,
        'عدد الجلسات المنفذة': p.completedSessions,
        'حجم المبيعات المنفذة': p.salesVolume,
        'العمولات والحوافز': p.commission + p.bonuses,
        'الخصومات والسلف': p.deductions + p.advances,
        'الصافي المستحق للصرف': p.net
      }));
      exportToExcel(excelData, `مسير_الرواتب_الشامل_${currentClinic?.name || 'المركز'}`);
    } else if (activeMode === 'customers') {
      const excelData = filteredCustomers.map(c => ({
        'اسم العميل': c.name,
        'الهاتف': c.phone,
        'عدد الزيارات': c.visitCount,
        'إجمالي الخدمات': c.total,
        'إجمالي المسدد': c.paid,
        'المتبقي والآجل': c.due,
        'نقاط الولاء': c.points,
        'آخر زيارة': c.lastVisit
      }));
      exportToExcel(excelData, `كشف_حسابات_العملاء_${currentClinic?.name || 'المركز'}`);
    }
  };

  const handlePrintCurrentView = () => {
    if (activeMode === 'revenues') {
      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>العميل</th>
              <th>الهاتف</th>
              <th>الخدمة</th>
              <th>الخبير</th>
              <th>طريقة الدفع</th>
              <th>المطلوب</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: bold;">${r.name}</td>
                <td>${r.phone || '--'}</td>
                <td>${r.service}</td>
                <td>${r.handler || '--'}</td>
                <td>${r.payMethod || 'نقدي'}</td>
                <td>${r.total}</td>
                <td style="color: #16a34a; font-weight: bold;">${r.paid}</td>
                <td style="color: ${(r.total || 0) - (r.paid || 0) > 0 ? '#dc2626' : '#64748b'}; font-weight: bold;">${(r.total || 0) - (r.paid || 0)}</td>
                <td>${r.isoDate || r.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      const summaryHtml = `
        <div class="summary-item"><div class="label">إجمالي المحصل</div><div class="value">${totalFilteredRevenue.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">إجمالي المطلوب</div><div class="value">${totalFilteredTarget.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">المتبقي الآجل</div><div class="value" style="color: #dc2626;">${totalFilteredDue.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">عدد العمليات</div><div class="value">${filteredRecords.length}</div></div>
      `;
      printReport(`كشف حركة الإيرادات والمقبوضات التفصيلي`, tableHtml, currentClinic, summaryHtml);
    } else if (activeMode === 'expenses') {
      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>البند والنوع</th>
              <th>البيان والتفاصيل</th>
              <th>المسؤول</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredExpenses.map((e, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><span style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-size: 11px;">${e.category}</span></td>
                <td style="font-weight: bold;">${e.desc}</td>
                <td>${e.handler || '--'}</td>
                <td>${e.date}</td>
                <td style="color: #dc2626; font-weight: bold; font-size: 14px;">${e.amount.toLocaleString()} ${currentCurrency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      const summaryHtml = `
        <div class="summary-item"><div class="label">إجمالي المصروفات</div><div class="value" style="color: #dc2626;">${totalFilteredExpenses.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">عدد بنود الصرف</div><div class="value">${filteredExpenses.length}</div></div>
      `;
      printReport(`كشف المصروفات والنثريات التشغيلية`, tableHtml, currentClinic, summaryHtml);
    } else if (activeMode === 'profit') {
      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>البند المالي والمحاسبي</th>
              <th>المبلغ (${currentCurrency})</th>
              <th>النسبة والتأثير</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: bold;">(+) إجمالي الإيرادات والمبيعات المحصلة</td>
              <td style="color: #16a34a; font-weight: bold; font-size: 15px;">${totalFilteredRevenue.toLocaleString()}</td>
              <td>100% (أساس الدخل)</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">(-) إجمالي المصروفات والنثريات التشغيلية</td>
              <td style="color: #dc2626; font-weight: bold; font-size: 15px;">${totalFilteredExpenses.toLocaleString()}</td>
              <td>${totalFilteredRevenue > 0 ? ((totalFilteredExpenses / totalFilteredRevenue) * 100).toFixed(1) : 0}% من الإيراد</td>
            </tr>
            <tr style="background: #eef2ff; border-top: 2px solid #4f46e5;">
              <td style="font-weight: 800; font-size: 16px; color: #3730a3;">(=) صافي الأرباح التشغيلية (Net Profit)</td>
              <td style="color: ${netProfitAmount >= 0 ? '#16a34a' : '#dc2626'}; font-weight: 800; font-size: 18px;">${netProfitAmount.toLocaleString()}</td>
              <td style="font-weight: bold; color: #4f46e5;">هامش الربح: ${profitMarginPercent}%</td>
            </tr>
            <tr>
              <td>ديون ومستحقات آجلة لدى العملاء (تحت التحصيل)</td>
              <td style="color: #f59e0b; font-weight: bold;">${totalFilteredDue.toLocaleString()}</td>
              <td>سيولة مؤجلة</td>
            </tr>
          </tbody>
        </table>
      `;
      const summaryHtml = `
        <div class="summary-item"><div class="label">الإيرادات</div><div class="value" style="color: #16a34a;">${totalFilteredRevenue.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">المصروفات</div><div class="value" style="color: #dc2626;">${totalFilteredExpenses.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">صافي الربح</div><div class="value" style="color: ${netProfitAmount >= 0 ? '#16a34a' : '#dc2626'};">${netProfitAmount.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">هامش الربحية</div><div class="value" style="color: #4f46e5;">${profitMarginPercent}%</div></div>
      `;
      printReport(`قائمة الدخل وصافي الأرباح والتحليل المالي`, tableHtml, currentClinic, summaryHtml);
    } else if (activeMode === 'payroll') {
      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الموظف</th>
              <th>المسمى</th>
              <th>الأساسي</th>
              <th>الجلسات</th>
              <th>العمولات والحوافز</th>
              <th>الخصومات والسلف</th>
              <th>الصافي المستحق</th>
            </tr>
          </thead>
          <tbody>
            ${staffPayrollData.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: bold;">${p.staff.name}</td>
                <td>${p.staff.role || '--'}</td>
                <td>${p.basic.toLocaleString()}</td>
                <td>${p.completedSessions}</td>
                <td style="color: #16a34a; font-weight: bold;">+${(p.commission + p.bonuses).toLocaleString()}</td>
                <td style="color: #dc2626; font-weight: bold;">-${(p.deductions + p.advances).toLocaleString()}</td>
                <td style="font-weight: 800; color: #4338ca; background: #eef2ff;">${p.net.toLocaleString()} ${currentCurrency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      const summaryHtml = `
        <div class="summary-item"><div class="label">إجمالي الرواتب الأساسية</div><div class="value">${totalBasicSalaries.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">إجمالي العمولات والمكافآت</div><div class="value" style="color: #16a34a;">${(totalCommissions + totalBonuses).toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">إجمالي الاستقطاعات</div><div class="value" style="color: #dc2626;">${totalDeductionsAndAdvances.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">إجمالي المسير المستحق</div><div class="value" style="color: #4338ca;">${totalNetPayroll.toLocaleString()} ${currentCurrency}</div></div>
      `;
      printReport(`مسير رواتب وحسابات الموظفين المعتمد`, tableHtml, currentClinic, summaryHtml);
    } else if (activeMode === 'customers') {
      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم العميل</th>
              <th>رقم الهاتف</th>
              <th>عدد الزيارات</th>
              <th>إجمالي الفواتير</th>
              <th>المسدد</th>
              <th>المتبقي (الآجل)</th>
              <th>نقاط الولاء</th>
              <th>آخر زيارة</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCustomers.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: bold;">${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.visitCount}</td>
                <td>${c.total.toLocaleString()}</td>
                <td style="color: #16a34a; font-weight: bold;">${c.paid.toLocaleString()}</td>
                <td style="color: ${c.due > 0 ? '#dc2626' : '#64748b'}; font-weight: bold;">${c.due.toLocaleString()}</td>
                <td><span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${c.points}</span></td>
                <td>${c.lastVisit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      const summaryHtml = `
        <div class="summary-item"><div class="label">عدد العملاء</div><div class="value">${filteredCustomers.length}</div></div>
        <div class="summary-item"><div class="label">إجمالي المقبوضات</div><div class="value" style="color: #16a34a;">${totalCustomersPaid.toLocaleString()} ${currentCurrency}</div></div>
        <div class="summary-item"><div class="label">إجمالي الديون الآجلة</div><div class="value" style="color: #dc2626;">${totalCustomersDebt.toLocaleString()} ${currentCurrency}</div></div>
      `;
      printReport(`كشف حسابات ومديونيات العملاء الشامل`, tableHtml, currentClinic, summaryHtml);
    }
  };

  const handleExportPDF = () => {
    exportHTMLToPDF('drilldown-content-container', `تقرير_${activeMode}_${currentClinic?.name || 'المركز'}`, currentClinic, getModeTitle(activeMode));
  };

  function getModeTitle(mode: DrilldownMode) {
    switch (mode) {
      case 'revenues': return 'كشف حركة الإيرادات والمقبوضات';
      case 'expenses': return 'كشف المصروفات والنثريات التشغيلية';
      case 'profit': return 'قائمة الدخل وصافي الأرباح التحليلي';
      case 'payroll': return 'مسير رواتب وحسابات الموظفين والعمولات';
      case 'customers': return 'كشف حسابات ومديونيات العملاء ونقاط الولاء';
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-400">
              {activeMode === 'revenues' && <DollarSign size={24} />}
              {activeMode === 'expenses' && <Wallet size={24} />}
              {activeMode === 'profit' && <TrendingUp size={24} />}
              {activeMode === 'payroll' && <Award size={24} />}
              {activeMode === 'customers' && <Users size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-white m-0 flex items-center gap-2">
                {getModeTitle(activeMode)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                الفرع الحالي: <span className="text-indigo-300 font-bold">{currentUser?.role === 'developer' ? 'نظام المطور' : (currentClinic?.name || 'غير محدد')}</span> | العملة: <span className="text-emerald-400 font-bold">{currentCurrency}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPrintAllowed && (
              <button 
                onClick={handlePrintCurrentView}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                title="طباعة تقرير منسق وشامل مع الترويسة"
              >
                <Printer size={15} />
                طباعة منسقة
              </button>
            )}
            {isExcelAllowed && (
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                title="تصدير ملف Excel"
              >
                <Download size={15} />
                Excel
              </button>
            )}
            {isPdfAllowed && (
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                title="تصدير مستند PDF عالي الجودة"
              >
                <FileText size={15} />
                PDF
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all mr-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="bg-slate-100/90 p-2 border-b border-slate-200 flex flex-wrap gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveMode('revenues')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeMode === 'revenues' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <DollarSign size={16} />
            الإيرادات والمقبوضات ({totalFilteredRevenue.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveMode('expenses')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeMode === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Wallet size={16} />
            المصروفات والنثريات ({totalFilteredExpenses.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveMode('profit')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeMode === 'profit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <TrendingUp size={16} />
            صافي الربح وقائمة الدخل ({netProfitAmount.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveMode('payroll')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeMode === 'payroll' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Award size={16} />
            حسابات ورواتب الموظفين ({totalNetPayroll.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveMode('customers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeMode === 'customers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users size={16} />
            العملاء والمديونيات ({filteredCustomers.length})
          </button>
        </div>

        {/* Filters and Controls Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، الخدمة، الهاتف، أو البيان..."
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm outline-none focus:border-indigo-600 transition-colors shadow-2xs"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button 
                onClick={() => setDateFilter('all')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                الكل
              </button>
              <button 
                onClick={() => setDateFilter('today')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                اليوم
              </button>
              <button 
                onClick={() => setDateFilter('week')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                هذا الأسبوع
              </button>
              <button 
                onClick={() => setDateFilter('month')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                هذا الشهر
              </button>
              <button 
                onClick={() => setDateFilter('custom')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                فترة مخصصة
              </button>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="text-xs text-slate-700 outline-none" 
                />
                <span className="text-slate-400">إلى</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="text-xs text-slate-700 outline-none" 
                />
              </div>
            )}
          </div>

          {/* Mode-specific filters & actions */}
          {activeMode === 'revenues' && (
            <select 
              value={payMethodFilter} 
              onChange={e => setPayMethodFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 shadow-2xs"
            >
              <option value="all">كافة طرق الدفع</option>
              <option value="cash">نقدي (كاش)</option>
              <option value="bank">تحويل بنكي / InstaPay</option>
              <option value="pos">شبكة / فيزا (POS)</option>
            </select>
          )}

          {activeMode === 'expenses' && (
            <div className="flex items-center gap-2">
              <select 
                value={expenseCatFilter} 
                onChange={e => setExpenseCatFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-rose-600 shadow-2xs"
              >
                <option value="all">كافة بنود المصروفات</option>
                <option value="مستحضرات وخامات تجميل">مستحضرات وخامات</option>
                <option value="أجور ومرتبات">أجور ومرتبات</option>
                <option value="فواتير تشغيلية (كهرباء/إيجار)">فواتير تشغيلية</option>
                <option value="صيانة ونثريات عامة">صيانة ونثريات</option>
              </select>
              <button 
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                <Plus size={15} />
                إضافة مصروف
              </button>
            </div>
          )}

          {activeMode === 'customers' && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <input 
                type="checkbox" 
                checked={debtOnlyFilter} 
                onChange={e => setDebtOnlyFilter(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>إظهار العملاء المدينين فقط ({customerMap ? Object.values(customerMap).filter(c => c.due > 0).length : 0})</span>
            </label>
          )}
        </div>

        {/* Add Expense Form Tray */}
        {activeMode === 'expenses' && showAddExpense && (
          <div className="bg-rose-50/70 p-4 border-b border-rose-100 flex flex-wrap gap-3 items-center animate-fadeIn">
            <select 
              value={newExpCat} 
              onChange={e => setNewExpCat(e.target.value)}
              className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="مستحضرات وخامات تجميل">مستحضرات وخامات تجميل</option>
              <option value="أجور ومرتبات">أجور ومرتبات</option>
              <option value="فواتير تشغيلية (كهرباء/إيجار)">فواتير تشغيلية (كهرباء/إيجار)</option>
              <option value="صيانة ونثريات عامة">صيانة ونثريات عامة</option>
            </select>
            <input 
              type="text" 
              placeholder="بيان ووصف المصروف..." 
              value={newExpDesc} 
              onChange={e => setNewExpDesc(e.target.value)}
              className="flex-1 min-w-[200px] bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs outline-none"
            />
            <input 
              type="number" 
              placeholder="المبلغ" 
              value={newExpAmount || ''} 
              onChange={e => setNewExpAmount(parseFloat(e.target.value) || 0)}
              className="w-28 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 outline-none"
              min="0"
            />
            <button 
              onClick={handleAddExpense}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all"
            >
              <CheckCircle2 size={15} />
              حفظ المصروف
            </button>
            <button 
              onClick={() => setShowAddExpense(false)}
              className="text-slate-400 hover:text-slate-600 p-2"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" id="drilldown-content-container">
          
          {/* VIEW 1: REVENUES */}
          {activeMode === 'revenues' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-indigo-600 mb-1">إجمالي المحصل</div>
                  <div className="text-xl font-black text-indigo-900">{totalFilteredRevenue.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-500 mb-1">إجمالي المطلوب</div>
                  <div className="text-xl font-black text-slate-800">{totalFilteredTarget.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-rose-600 mb-1">المتبقي الآجل للتحصيل</div>
                  <div className="text-xl font-black text-rose-700">{totalFilteredDue.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-emerald-600 mb-1">عدد العمليات والجلسات</div>
                  <div className="text-xl font-black text-emerald-800">{filteredRecords.length} عملية</div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs sm:text-sm text-right">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">الخدمة المنفذة</th>
                      <th className="p-3">الخبير المنفذ</th>
                      <th className="p-3">طريقة الدفع</th>
                      <th className="p-3">المطلوب</th>
                      <th className="p-3">المدفوع</th>
                      <th className="p-3">المتبقي</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3 no-print text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-10 text-center text-slate-400">
                          لا توجد إيرادات مطابقة للبحث أو التصفية الحالية
                        </td>
                      </tr>
                    ) : filteredRecords.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{r.name}</td>
                        <td className="p-3 text-slate-500 font-mono">{r.phone || '--'}</td>
                        <td className="p-3 text-slate-700">{r.service}</td>
                        <td className="p-3 font-bold text-indigo-600">{r.handler || '--'}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-600">
                            {r.payMethod || 'نقدي'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{r.total}</td>
                        <td className="p-3 font-bold text-emerald-600">{r.paid}</td>
                        <td className="p-3 font-bold">
                          {(r.total || 0) - (r.paid || 0) > 0 ? (
                            <span className="text-rose-600">{(r.total || 0) - (r.paid || 0)}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{r.isoDate || r.date}</td>
                        <td className="p-3 no-print text-center">
                          <button 
                            onClick={() => printInvoice(r, currentClinic)}
                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-colors"
                            title="طباعة الفاتورة الضريبية المنفصلة"
                          >
                            <Printer size={13} />
                            فاتورة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: EXPENSES */}
          {activeMode === 'expenses' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-rose-600 mb-1">إجمالي المصروفات</div>
                  <div className="text-2xl font-black text-rose-700">{totalFilteredExpenses.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-500 mb-1">عدد البنود المسجلة</div>
                  <div className="text-2xl font-black text-slate-800">{filteredExpenses.length} بند</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-indigo-600 mb-1">متوسط الصرف للبند</div>
                  <div className="text-2xl font-black text-indigo-900">
                    {filteredExpenses.length > 0 ? Math.round(totalFilteredExpenses / filteredExpenses.length).toLocaleString() : 0} {currentCurrency}
                  </div>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs sm:text-sm text-right">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">البند والنوع</th>
                      <th className="p-3">البيان والتفاصيل</th>
                      <th className="p-3">المسؤول / المستلم</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">المبلغ ({currentCurrency})</th>
                      <th className="p-3 no-print text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-400">
                          لا توجد مصروفات مسجلة مطابقة لخيارات البحث
                        </td>
                      </tr>
                    ) : filteredExpenses.map((ex, i) => (
                      <tr key={ex.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                            {ex.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{ex.desc}</td>
                        <td className="p-3 text-slate-600">{ex.handler || '--'}</td>
                        <td className="p-3 text-slate-500">{ex.date}</td>
                        <td className="p-3 font-bold text-rose-600 text-sm">{ex.amount.toLocaleString()}</td>
                        <td className="p-3 no-print text-center">
                          <button 
                            onClick={() => handleRemoveExpense(ex.id)}
                            className="text-rose-400 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف هذا المصروف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: PROFIT & LOSS */}
          {activeMode === 'profit' && (
            <div className="space-y-6">
              {/* Grand KPI */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700">إجمالي الإيرادات المحصلة</span>
                    <ArrowUpRight size={18} className="text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-900">{totalFilteredRevenue.toLocaleString()} {currentCurrency}</div>
                  <div className="text-[11px] text-emerald-600 mt-1">100% من إجمالي حركة المبيعات</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-700">إجمالي المصروفات والنثريات</span>
                    <ArrowDownRight size={18} className="text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-900">{totalFilteredExpenses.toLocaleString()} {currentCurrency}</div>
                  <div className="text-[11px] text-rose-600 mt-1">
                    {totalFilteredRevenue > 0 ? ((totalFilteredExpenses / totalFilteredRevenue) * 100).toFixed(1) : 0}% من حجم الإيراد
                  </div>
                </div>

                <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-md">
                  <div className="flex items-center justify-between mb-2 opacity-90">
                    <span className="text-xs font-bold">صافي الأرباح التشغيلية</span>
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-2xl font-black">{netProfitAmount.toLocaleString()} {currentCurrency}</div>
                  <div className="text-[11px] opacity-80 mt-1">هامش ربح صافي: {profitMarginPercent}%</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700">مستحقات آجلة لدى العملاء</span>
                    <DollarSign size={18} className="text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-900">{totalFilteredDue.toLocaleString()} {currentCurrency}</div>
                  <div className="text-[11px] text-amber-600 mt-1">أموال مستحقة تحت التحصيل</div>
                </div>
              </div>

              {/* Detailed Financial Statement Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
                <h5 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  قائمة الدخل وصافي الأرباح التفصيلية
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">(+) إجمالي الإيرادات النقدية والمصرفية</span>
                    <span className="font-black text-emerald-600 text-base">{totalFilteredRevenue.toLocaleString()} {currentCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">(-) إجمالي مستلزمات التشغيل والخامات والمصروفات</span>
                    <span className="font-black text-rose-600 text-base">-{totalFilteredExpenses.toLocaleString()} {currentCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div>
                      <div className="font-black text-indigo-950 text-base">(=) صافي الربح التشغيلي المتاح للتحويل والتوزيع</div>
                      <div className="text-xs text-indigo-600 mt-0.5">نسبة العائد الصافي: {profitMarginPercent}%</div>
                    </div>
                    <span className="font-black text-indigo-700 text-xl">{netProfitAmount.toLocaleString()} {currentCurrency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: PAYROLL & STAFF */}
          {activeMode === 'payroll' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-500 mb-1">إجمالي الرواتب الأساسية</div>
                  <div className="text-xl font-black text-slate-800">{totalBasicSalaries.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-emerald-600 mb-1">العمولات والمكافآت</div>
                  <div className="text-xl font-black text-emerald-700">+{(totalCommissions + totalBonuses).toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-rose-600 mb-1">الخصومات والسلف المستردة</div>
                  <div className="text-xl font-black text-rose-700">-{totalDeductionsAndAdvances.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold opacity-90 mb-1">صافي مسير الرواتب المستحق</div>
                  <div className="text-xl font-black">{totalNetPayroll.toLocaleString()} {currentCurrency}</div>
                </div>
              </div>

              {/* Staff Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs sm:text-sm text-right">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">اسم الموظف / الخبير</th>
                      <th className="p-3">المسمى الوظيفي</th>
                      <th className="p-3">الراتب الأساسي</th>
                      <th className="p-3">الجلسات المنجزة</th>
                      <th className="p-3">العمولات والحوافز</th>
                      <th className="p-3">الخصومات والسلف</th>
                      <th className="p-3 bg-indigo-50">الصافي المستحق</th>
                      <th className="p-3 no-print text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffPayrollData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-10 text-center text-slate-400">
                          لم يتم تسجيل موظفين في دليل الموظفين لهذا الفرع بعد
                        </td>
                      </tr>
                    ) : staffPayrollData.map((p, i) => (
                      <tr key={p.staff.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{p.staff.name}</td>
                        <td className="p-3 text-slate-600">{p.staff.role || 'خبير / موظف'}</td>
                        <td className="p-3 text-slate-700">{p.basic.toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-800">{p.completedSessions}</td>
                        <td className="p-3 text-emerald-600 font-bold">+{(p.commission + p.bonuses).toLocaleString()}</td>
                        <td className="p-3 text-rose-600 font-bold">-{(p.deductions + p.advances).toLocaleString()}</td>
                        <td className="p-3 font-black text-indigo-700 bg-indigo-50/50 text-sm">
                          {p.net.toLocaleString()} {currentCurrency}
                        </td>
                        <td className="p-3 no-print text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => printPaySlip(p.staff, p, currentClinic)}
                              className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="طباعة قسيمة استلام راتب ومستحقات منفصلة"
                            >
                              <Printer size={13} />
                              قسيمة
                            </button>
                            <button 
                              onClick={() => setSelectedStaffForTrans(p.staff)}
                              className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg text-xs font-bold transition-colors"
                              title="إضافة مكافأة، خصم، أو سلفة"
                            >
                              + عملية
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Transaction Modal */}
              {selectedStaffForTrans && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl animate-fadeIn">
                  <h6 className="font-bold text-slate-800 text-sm mb-3">
                    تسجيل معاملة مالية للموظف: <span className="text-indigo-600">{selectedStaffForTrans.name}</span>
                  </h6>
                  <div className="flex flex-wrap gap-3 items-center">
                    <select 
                      value={transType} 
                      onChange={e => setTransType(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="bonus">مكافأة / حافز إضافي (+)</option>
                      <option value="deduction">خصم / جزاء (-)</option>
                      <option value="advance">سلفة على الراتب (-)</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="المبلغ" 
                      value={transAmount || ''} 
                      onChange={e => setTransAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      min="0"
                    />
                    <input 
                      type="text" 
                      placeholder="سبب العملية / ملاحظات..." 
                      value={transNote} 
                      onChange={e => setTransNote(e.target.value)}
                      className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                    <button 
                      onClick={handleAddPayrollTrans}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                    >
                      حفظ وتطبيق
                    </button>
                    <button 
                      onClick={() => setSelectedStaffForTrans(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-2"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: CUSTOMERS & ACCOUNTS */}
          {activeMode === 'customers' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-500 mb-1">إجمالي العملاء</div>
                  <div className="text-2xl font-black text-slate-800">{filteredCustomers.length} عميل</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-emerald-600 mb-1">إجمالي المقبوضات من العملاء</div>
                  <div className="text-2xl font-black text-emerald-700">{totalCustomersPaid.toLocaleString()} {currentCurrency}</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-rose-600 mb-1">إجمالي الديون والآجل المستحق</div>
                  <div className="text-2xl font-black text-rose-700">{totalCustomersDebt.toLocaleString()} {currentCurrency}</div>
                </div>
              </div>

              {/* Customers Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs sm:text-sm text-right">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">عدد الزيارات</th>
                      <th className="p-3">إجمالي الخدمات</th>
                      <th className="p-3">إجمالي المسدد</th>
                      <th className="p-3">المتبقي (الآجل)</th>
                      <th className="p-3">نقاط الولاء</th>
                      <th className="p-3">آخر زيارة</th>
                      <th className="p-3 no-print text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-slate-400">
                          لا يوجد عملاء مطابقين لخيارات البحث
                        </td>
                      </tr>
                    ) : filteredCustomers.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{c.name}</td>
                        <td className="p-3 text-slate-500 font-mono">{c.phone}</td>
                        <td className="p-3 font-bold text-slate-700">{c.visitCount}</td>
                        <td className="p-3 text-slate-700">{c.total.toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-600">{c.paid.toLocaleString()}</td>
                        <td className="p-3 font-bold">
                          {c.due > 0 ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg">
                              {c.due.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            {c.points} نقطة
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{c.lastVisit}</td>
                        <td className="p-3 no-print text-center">
                          <button 
                            onClick={() => {
                              const visits = allRecords.filter(r => r.name === c.name);
                              printCustomerStatement(c, visits, currentClinic);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                            title="طباعة كشف حساب عميل مفصل"
                          >
                            <Printer size={13} />
                            كشف حساب
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>
            النظام المالي والمحاسبي المتكامل - شركة ومراكز التجميل
          </div>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
