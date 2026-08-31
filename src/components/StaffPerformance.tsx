import React, { useState, useMemo } from 'react';
import { 
  Trophy, TrendingUp, Calendar, Users, Award, 
  BarChart3, PieChart as PieChartIcon, CheckCircle2, 
  DollarSign, Sparkles, Filter, Building2, UserCheck, 
  ChevronRight, Eye, Layers, Clock, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { ExportButtons } from './ExportButtons';
import { RecordItem } from '../types';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

export function StaffPerformance() {
  const { data, currentUser } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();

  const accessibleClinics = useMemo(() => {
    if (currentUser?.role === 'developer') return data.clinics;
    if (currentUser?.role === 'master_admin') {
      return data.clinics.filter(c => c.masterAdminId === currentUser.user);
    }
    return data.clinics.filter(c => c.id === currentUser?.clinicId);
  }, [data.clinics, currentUser]);

  const [selectedClinicId, setSelectedClinicId] = useState<string>(
    currentUser?.role === 'developer' || currentUser?.role === 'master_admin' ? 'all' : (currentUser?.clinicId || 'all')
  );

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<string | null>(null);

  // Determine current active clinic object for currency and header
  const activeClinic = data.clinics.find(c => c.id === (selectedClinicId === 'all' ? currentClinicId : selectedClinicId));
  const currency = activeClinic?.currency || currentCurrency || 'EGP';

  // Gather records based on clinic selection
  const relevantRecords: { clinicId: string; clinicName: string; record: RecordItem }[] = useMemo(() => {
    const list: { clinicId: string; clinicName: string; record: RecordItem }[] = [];
    
    const targetClinics = selectedClinicId === 'all' 
      ? accessibleClinics 
      : accessibleClinics.filter(c => c.id === selectedClinicId);

    targetClinics.forEach(clinic => {
      const q = data.queue[clinic.id] || [];
      const a = data.archive[clinic.id] || [];
      const allBranchRecords = [...q, ...a];

      allBranchRecords.forEach(rec => {
        list.push({
          clinicId: clinic.id,
          clinicName: clinic.name,
          record: rec
        });
      });
    });

    return list;
  }, [data.queue, data.archive, accessibleClinics, selectedClinicId]);

  // Filter records by date
  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    return relevantRecords.filter(item => {
      const recDate = item.record.isoDate || item.record.date?.split(' ')[0] || '';
      
      if (dateFilter === 'today') {
        return recDate === todayStr || item.record.date?.includes(new Date().toLocaleDateString('ar-EG'));
      }
      if (dateFilter === 'week') {
        const itemDate = new Date(recDate || Date.now());
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateFilter === 'month') {
        const itemDate = new Date(recDate || Date.now());
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'custom') {
        if (startDate && recDate < startDate) return false;
        if (endDate && recDate > endDate) return false;
        return true;
      }
      return true;
    });
  }, [relevantRecords, dateFilter, startDate, endDate]);

  // Aggregate stats per employee
  const staffStats = useMemo(() => {
    const map: Record<string, {
      name: string;
      role: string;
      clinicName: string;
      clinicId: string;
      sessionsCount: number;
      completedSessionsCount: number;
      totalSales: number;
      collectedPaid: number;
      dueAmount: number;
      servicesBreakdown: Record<string, number>;
      records: RecordItem[];
    }> = {};

    // First populate from registered staff / users in accessible clinics
    const targetClinics = selectedClinicId === 'all' 
      ? accessibleClinics 
      : accessibleClinics.filter(c => c.id === selectedClinicId);

    data.users.forEach(user => {
      if (user.role === 'developer') return;
      if (targetClinics.some(c => c.id === user.clinicId) || (user.clinicId === "master" && user.tenantId === currentUser?.user)) {
        const clinicObj = data.clinics.find(c => c.id === user.clinicId);
        map[user.name] = {
          name: user.name,
          role: user.role === 'expert' ? 'خبيرة تجميل' :
                user.role === 'doctor' ? 'خبيرة / مديرة فرع' :
                user.role === 'reception' ? 'استقبال' :
                user.role === 'accountant' ? 'محاسب' :
                user.role === 'secretary' ? 'سكرتارية' : user.role,
          clinicName: clinicObj?.name || 'غير محدد',
          clinicId: user.clinicId,
          sessionsCount: 0,
          completedSessionsCount: 0,
          totalSales: 0,
          collectedPaid: 0,
          dueAmount: 0,
          servicesBreakdown: {},
          records: []
        };
      }
    });

    // Also check staff directory
    targetClinics.forEach(clinic => {
      const dirStaff = data.staffDirectory?.[clinic.id] || [];
      dirStaff.forEach(st => {
        if (!map[st.name]) {
          map[st.name] = {
            name: st.name,
            role: st.role || 'خبير تجميل',
            clinicName: clinic.name,
            clinicId: clinic.id,
            sessionsCount: 0,
            completedSessionsCount: 0,
            totalSales: 0,
            collectedPaid: 0,
            dueAmount: 0,
            servicesBreakdown: {},
            records: []
          };
        }
      });
    });

    // Populate data from records
    filteredRecords.forEach(({ clinicName, clinicId, record }) => {
      const handlerName = (record.handler || '').trim();
      if (!handlerName) return;

      if (!map[handlerName]) {
        map[handlerName] = {
          name: handlerName,
          role: 'خبير / موظف',
          clinicName: clinicName,
          clinicId: clinicId,
          sessionsCount: 0,
          completedSessionsCount: 0,
          totalSales: 0,
          collectedPaid: 0,
          dueAmount: 0,
          servicesBreakdown: {},
          records: []
        };
      }

      const st = map[handlerName];
      st.sessionsCount += 1;
      if (record.status === 'done') {
        st.completedSessionsCount += 1;
      }
      st.totalSales += (record.total || 0);
      st.collectedPaid += (record.paid || 0);
      st.dueAmount += ((record.total || 0) - (record.paid || 0));
      st.records.push(record);

      // Services tally
      if (record.service) {
        const servicesList = record.service.split(' + ');
        servicesList.forEach(s => {
          const sTrim = s.trim();
          st.servicesBreakdown[sTrim] = (st.servicesBreakdown[sTrim] || 0) + 1;
        });
      }
    });

    // Convert map to sorted array (highest sales first)
    const list = Object.values(map);
    list.sort((a, b) => b.totalSales - a.totalSales);
    return list;
  }, [filteredRecords, data.users, data.staffDirectory, data.clinics, accessibleClinics, selectedClinicId]);

  // High-level aggregates
  const totalSalesAllStaff = staffStats.reduce((sum, s) => sum + s.totalSales, 0);
  const totalSessionsAllStaff = staffStats.reduce((sum, s) => sum + s.sessionsCount, 0);
  const totalCollectedAllStaff = staffStats.reduce((sum, s) => sum + s.collectedPaid, 0);
  const activeStaffCount = staffStats.filter(s => s.sessionsCount > 0 || s.totalSales > 0).length;

  const topSalesEmployee = staffStats.length > 0 && staffStats[0].totalSales > 0 ? staffStats[0] : null;
  const topSessionsEmployee = [...staffStats].sort((a, b) => b.sessionsCount - a.sessionsCount)[0]?.sessionsCount > 0 
    ? [...staffStats].sort((a, b) => b.sessionsCount - a.sessionsCount)[0] 
    : null;

  // Chart data preparation
  const salesBarData = staffStats
    .filter(s => s.totalSales > 0 || s.sessionsCount > 0)
    .slice(0, 10)
    .map(s => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + '...' : s.name,
      fullName: s.name,
      'المبيعات': s.totalSales,
      'المحصل': s.collectedPaid,
      'الجلسات': s.sessionsCount
    }));

  const pieData = staffStats
    .filter(s => s.totalSales > 0)
    .slice(0, 6)
    .map(s => ({
      name: s.name,
      value: s.totalSales
    }));

  // Selected staff drill down
  const selectedStaffObj = selectedStaffDetail ? staffStats.find(s => s.name === selectedStaffDetail) : null;

  // Rating badge helper
  const getRatingBadge = (sales: number, sessions: number, avgTicket: number) => {
    if (sales > 15000 || sessions >= 25) {
      return { label: 'أداء استثنائي ⭐⭐⭐⭐⭐', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (sales > 8000 || sessions >= 15) {
      return { label: 'أداء متميز ⭐⭐⭐⭐', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (sales > 3000 || sessions >= 5) {
      return { label: 'أداء جيد جداً ⭐⭐⭐', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    if (sessions > 0) {
      return { label: 'نشط ⭐⭐', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
    return { label: 'لا توجد عمليات ⭐', color: 'bg-gray-50 text-gray-400 border-gray-200' };
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h5 className="text-xl font-bold text-slate-800 flex items-center gap-2.5 m-0">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Trophy size={22} />
              </span>
              لوحة تقييم أداء وإنتاجية الموظفين
            </h5>
            <p className="text-slate-500 text-xs mt-1">
              متابعة مبيعات وعدد جلسات كادر التجميل والعناية لكل فرع بدقة مع الرسوم البيانية
            </p>
          </div>

          {/* Export Buttons */}
          <ExportButtons 
            data={staffStats.map(s => ({
              'اسم الموظف': s.name,
              'المسمى الوظيفي': s.role,
              'الفرع': s.clinicName,
              'عدد الجلسات': s.sessionsCount,
              'إجمالي المبيعات': `${s.totalSales} ${currency}`,
              'المبالغ المحصلة': `${s.collectedPaid} ${currency}`,
              'المتبقي (ديون)': `${s.dueAmount} ${currency}`,
              'متوسط الجلسة': `${s.sessionsCount > 0 ? (s.totalSales / s.sessionsCount).toFixed(1) : 0} ${currency}`
            }))}
            pdfHeaders={['الموظف', 'الوظيفة', 'الفرع', 'الجلسات', 'المبيعات', 'المحصل', 'الديون']}
            pdfData={staffStats.map(s => [
              s.name, 
              s.role, 
              s.clinicName, 
              s.sessionsCount.toString(), 
              `${s.totalSales} ${currency}`, 
              `${s.collectedPaid} ${currency}`,
              `${s.dueAmount} ${currency}`
            ])}
            filename={`staff_performance_${selectedClinicId}_report`}
            title="تقرير تقييم أداء وإنتاجية الموظفين"
            printElementId="print-staff-performance"
          />
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Branch Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-600" />
              الفرع المطلوب تقييمه:
            </label>
            <select
              value={selectedClinicId}
              onChange={e => setSelectedClinicId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-medium"
            >
              {(currentUser?.role === 'developer' || currentUser?.role === 'master_admin') && (
                <option value="all">🏢 جميع الفروع التابعة ({accessibleClinics.length})</option>
              )}
              {accessibleClinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  📍 {clinic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-600" />
              النطاق الزمني:
            </label>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-medium"
            >
              <option value="all">كل الفترات (سجل تراكمي شامل)</option>
              <option value="today">اليوم الحالي</option>
              <option value="week">آخر 7 أيام (هذا الأسبوع)</option>
              <option value="month">الشهر الحالي</option>
              <option value="custom">📅 نطاق تاريخ مخصص</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">من تاريخ:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">إلى تاريخ:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">إجمالي المبيعات المحققة</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {totalSalesAllStaff.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">{currency}</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              محصل: {totalCollectedAllStaff.toLocaleString('ar-EG')} {currency}
            </div>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">إجمالي الجلسات المنجزة</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {totalSessionsAllStaff} <span className="text-xs font-normal text-slate-500">جلسة</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              كادر نشط: {activeStaffCount} موظف/خبير
            </div>
          </div>
        </div>

        {/* Top Sales Star */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl p-5 shadow-sm border border-amber-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
            <Award size={24} />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <span>نجم المبيعات الأعلى</span>
              <Sparkles size={12} className="text-amber-500" />
            </div>
            <div className="text-lg font-black text-slate-900 truncate mt-0.5">
              {topSalesEmployee ? topSalesEmployee.name : 'لا يوجد بعد'}
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-0.5">
              {topSalesEmployee ? `${topSalesEmployee.totalSales.toLocaleString('ar-EG')} ${currency}` : '0'}
            </div>
          </div>
        </div>

        {/* Top Sessions Performer */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/40 rounded-2xl p-5 shadow-sm border border-indigo-200/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-indigo-800 flex items-center gap-1">
              <span>الأكثر تقديماً للجلسات</span>
              <Sparkles size={12} className="text-indigo-500" />
            </div>
            <div className="text-lg font-black text-slate-900 truncate mt-0.5">
              {topSessionsEmployee ? topSessionsEmployee.name : 'لا يوجد بعد'}
            </div>
            <div className="text-[11px] text-indigo-700 font-bold mt-0.5">
              {topSessionsEmployee ? `${topSessionsEmployee.sessionsCount} جلسة منفذة` : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Sales Comparison */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h6 className="font-bold text-slate-800 flex items-center gap-2 m-0 text-base">
                <BarChart3 size={18} className="text-indigo-600" />
                مقارنة مبيعات ومتحصلات الموظفين
              </h6>
              <p className="text-xs text-slate-500 mt-0.5">مقارنة الإيرادات المحققة والمبالغ المحصلة لكل خبير وموظف</p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {salesBarData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <BarChart3 size={36} className="text-slate-300" />
                لا توجد بيانات مبيعات مسجلة للفترة المحددة
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesBarData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString('ar-EG')} ${currency}`, '']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px' }} />
                  <Bar dataKey="المبيعات" fill="#4f46e5" radius={[6, 6, 0, 0]} name="إجمالي المبيعات" />
                  <Bar dataKey="المحصل" fill="#10b981" radius={[6, 6, 0, 0]} name="المبلغ المحصل" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Revenue Share */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-4">
            <h6 className="font-bold text-slate-800 flex items-center gap-2 m-0 text-base">
              <PieChartIcon size={18} className="text-indigo-600" />
              نسبة المساهمة في المبيعات
            </h6>
            <p className="text-xs text-slate-500 mt-0.5">الحصة الإيرادية لكل موظف من الإجمالي</p>
          </div>

          <div className="flex-1 min-h-[260px] flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-slate-400 text-sm text-center">
                لا توجد حصص مبيعات متاحة
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString('ar-EG')} ${currency}`, 'المبيعات']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Mini Legend */}
          <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto pr-1">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-slate-700 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {totalSalesAllStaff > 0 ? ((item.value / totalSalesAllStaff) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Leaderboard & Detailed Performance Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-staff-performance">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <div>
            <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0 text-base">
              <Users size={18} />
              جدول تصنيف وإنتاجية موظفي الفرع (Leaderboard)
            </h6>
            <p className="text-xs text-slate-500 mt-1">
              تفاصيل الإيرادات، عدد الجلسات، التقييم، ومتوسط قيمة الخدمة لكل موظف
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
            عدد الموظفين المعروضين: <strong className="text-slate-800">{staffStats.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="p-3">الترتيب</th>
                <th className="p-3">اسم الموظف / الخبير</th>
                <th className="p-3">الوظيفة والفرع</th>
                <th className="p-3 text-center">عدد الجلسات</th>
                <th className="p-3">إجمالي المبيعات</th>
                <th className="p-3">المبالغ المحصلة</th>
                <th className="p-3">متوسط الجلسة</th>
                <th className="p-3">نسبة المساهمة</th>
                <th className="p-3">مستوى التقييم</th>
                <th className="p-3 no-print text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffStats.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا يوجد موظفون مسجلون في هذا الفرع
                  </td>
                </tr>
              ) : (
                staffStats.map((st, idx) => {
                  const avgTicket = st.sessionsCount > 0 ? (st.totalSales / st.sessionsCount) : 0;
                  const contributionPct = totalSalesAllStaff > 0 ? (st.totalSales / totalSalesAllStaff) * 100 : 0;
                  const rating = getRatingBadge(st.totalSales, st.sessionsCount, avgTicket);

                  return (
                    <tr key={st.name + idx} className="hover:bg-slate-50 transition-colors">
                      {/* Rank */}
                      <td className="p-3 font-bold">
                        {idx === 0 && st.totalSales > 0 ? (
                          <span className="w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">🥇 1</span>
                        ) : idx === 1 && st.totalSales > 0 ? (
                          <span className="w-7 h-7 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">🥈 2</span>
                        ) : idx === 2 && st.totalSales > 0 ? (
                          <span className="w-7 h-7 bg-amber-800/10 text-amber-900 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">🥉 3</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold px-2">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="p-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {st.name.slice(0, 1)}
                          </div>
                          <span>{st.name}</span>
                        </div>
                      </td>

                      {/* Role & Clinic */}
                      <td className="p-3">
                        <div className="text-xs font-semibold text-slate-700">{st.role}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 size={10} />
                          {st.clinicName}
                        </div>
                      </td>

                      {/* Sessions Count */}
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 font-bold rounded-lg text-xs">
                          {st.sessionsCount} جلسة
                        </span>
                      </td>

                      {/* Total Sales */}
                      <td className="p-3 font-black text-slate-900">
                        {st.totalSales.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">{currency}</span>
                      </td>

                      {/* Collected Paid */}
                      <td className="p-3 font-bold text-emerald-600">
                        {st.collectedPaid.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">{currency}</span>
                      </td>

                      {/* Avg Ticket */}
                      <td className="p-3 text-slate-600 font-medium">
                        {avgTicket.toFixed(1)} <span className="text-xs text-slate-400">{currency}</span>
                      </td>

                      {/* Contribution Bar */}
                      <td className="p-3">
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                            <span>{contributionPct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.max(2, contributionPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Performance Rating */}
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${rating.color}`}>
                          {rating.label}
                        </span>
                      </td>

                      {/* Detail Button */}
                      <td className="p-3 no-print text-center">
                        <button
                          onClick={() => setSelectedStaffDetail(st.name)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                          title="عرض جلسات وخدمات الموظف"
                        >
                          <Eye size={13} />
                          سجل الجلسات
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Detail Modal */}
      {selectedStaffObj && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-[Cairo] no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-indigo-200">
                  {selectedStaffObj.name.slice(0, 1)}
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-lg m-0">{selectedStaffObj.name}</h5>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{selectedStaffObj.role}</span>
                    <span>•</span>
                    <span>{selectedStaffObj.clinicName}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics in Modal */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <div className="text-xs text-slate-500 font-bold">عدد الجلسات</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{selectedStaffObj.sessionsCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <div className="text-xs text-slate-500 font-bold">إجمالي المبيعات</div>
                <div className="text-lg font-black text-indigo-600 mt-0.5">
                  {selectedStaffObj.totalSales.toLocaleString('ar-EG')} <span className="text-xs font-normal">{currency}</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <div className="text-xs text-slate-500 font-bold">المحصل الفعلي</div>
                <div className="text-lg font-black text-emerald-600 mt-0.5">
                  {selectedStaffObj.collectedPaid.toLocaleString('ar-EG')} <span className="text-xs font-normal">{currency}</span>
                </div>
              </div>
            </div>

            {/* Top Services Breakdown */}
            {Object.keys(selectedStaffObj.servicesBreakdown).length > 0 && (
              <div className="mb-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3.5">
                <div className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  أبرز الخدمات المنفذة بواسطة هذا الخبير:
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedStaffObj.servicesBreakdown).map(([srv, cnt], i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5">
                      <span>{srv}</span>
                      <span className="bg-indigo-600 text-white rounded-full px-1.5 text-[10px]">{cnt}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions Table */}
            <div className="flex-1 overflow-y-auto pr-1">
              <h6 className="text-xs font-bold text-slate-700 mb-2">سجل الجلسات المنفذة ({selectedStaffObj.records.length}):</h6>
              {selectedStaffObj.records.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  لا توجد جلسات مسجلة باسم هذا الموظف في الفترة المختارة
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedStaffObj.records.map((rec, i) => (
                    <div key={rec.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{rec.name}</div>
                        <div className="text-slate-500 mt-0.5">{rec.service || 'خدمة / جلسة'}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{rec.date || rec.isoDate}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-black text-indigo-600 text-sm">
                          {rec.paid || rec.total} {currency}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {rec.status === 'done' ? 'مكتملة' : 'في الانتظار'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 mt-4 text-left">
              <button
                onClick={() => setSelectedStaffDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
