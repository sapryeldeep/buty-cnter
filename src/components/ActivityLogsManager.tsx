import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Activity, Shield, Filter, Search, Calendar, User, Building2, 
  Trash2, Download, Printer, FileSpreadsheet, RefreshCw, CheckCircle, 
  LogIn, DollarSign, Wallet, Users, Database, Clock, Sparkles, Building, ChevronDown, AlertCircle
} from 'lucide-react';
import { printReport, exportToExcel } from '../utils/exportUtils';

interface ActivityLogsManagerProps {
  isReadOnly?: boolean;
}

export function ActivityLogsManager({ isReadOnly = false }: ActivityLogsManagerProps) {
  const { data, updateData, currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer';
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isBranchUser = !isDeveloper && !isMasterAdmin;

  // Master Admin Users (Tenants)
  const masterAdmins = useMemo(() => {
    return data.users.filter(u => u.role === 'master_admin');
  }, [data.users]);

  // Selected Tenant (Center)
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    if (isMasterAdmin) return currentUser?.user || 'all';
    if (isBranchUser) {
      const userClinic = data.clinics.find(c => c.id === currentUser?.clinicId);
      return userClinic?.masterAdminId || userClinic?.tenantId || currentUser?.tenantId || 'all';
    }
    return 'all';
  });

  // Selected Branch (Clinic)
  const [selectedClinicId, setSelectedClinicId] = useState<string>(() => {
    if (isBranchUser) return currentUser?.clinicId || 'all';
    return 'all';
  });

  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Check if developer disabled activity logs for non-developers
  const isLogsDisabled = !isDeveloper && (
    currentUser?.permissions?.devDisableActivityLogs === true || 
    data.settings?.devDisableActivityLogs === true
  );

  // Available clinics based on tenant selection and user permissions
  const accessibleClinics = useMemo(() => {
    if (isBranchUser) {
      return data.clinics.filter(c => c.id === currentUser?.clinicId);
    }
    if (isMasterAdmin) {
      return data.clinics.filter(c => c.masterAdminId === currentUser?.user || c.tenantId === currentUser?.user);
    }
    // Developer
    if (selectedTenantId !== 'all') {
      return data.clinics.filter(c => c.masterAdminId === selectedTenantId || c.tenantId === selectedTenantId);
    }
    return data.clinics || [];
  }, [data.clinics, currentUser, isDeveloper, isMasterAdmin, isBranchUser, selectedTenantId]);

  // Helper to get Clinic Name
  const getClinicName = (cId: string) => {
    if (cId === 'master' || !cId) return 'المركز الرئيسي / الإدارة';
    const c = data.clinics.find(x => x.id === cId);
    return c ? c.name : 'فرع غير معروف';
  };

  // Helper to get Center Name for a log
  const getCenterNameForLog = (log: any) => {
    if (log.centerName) return log.centerName;
    if (log.tenantId) {
      const admin = masterAdmins.find(m => m.user === log.tenantId);
      if (admin) return admin.name;
    }
    if (log.clinicId && log.clinicId !== 'master') {
      const c = data.clinics.find(cl => cl.id === log.clinicId);
      if (c && (c.masterAdminId || c.tenantId)) {
        const admin = masterAdmins.find(m => m.user === (c.masterAdminId || c.tenantId));
        if (admin) return admin.name;
      }
    }
    const u = data.users.find(usr => usr.name === log.userName || usr.user === log.userName);
    if (u) {
      if (u.role === 'master_admin') return u.name;
      if (u.tenantId) {
        const admin = masterAdmins.find(m => m.user === u.tenantId);
        if (admin) return admin.name;
      }
    }
    return 'المركز العام';
  };

  // Filter Raw Logs according to RBAC Multi-Tenant Boundaries
  const tenantScopedLogs = useMemo(() => {
    const allLogs = data.activityLogs || [];

    if (isDeveloper) {
      if (selectedTenantId === 'all') return allLogs;
      return allLogs.filter(log => {
        if (log.tenantId && log.tenantId === selectedTenantId) return true;
        const c = data.clinics.find(x => x.id === log.clinicId);
        if (c && (c.masterAdminId === selectedTenantId || c.tenantId === selectedTenantId)) return true;
        const u = data.users.find(x => x.name === log.userName || x.user === log.userName);
        if (u && (u.tenantId === selectedTenantId || (u.role === 'master_admin' && u.user === selectedTenantId))) return true;
        return false;
      });
    }

    if (isMasterAdmin) {
      const myTenant = currentUser?.user;
      return allLogs.filter(log => {
        if (log.tenantId && log.tenantId === myTenant) return true;
        const c = data.clinics.find(x => x.id === log.clinicId);
        if (c && (c.masterAdminId === myTenant || c.tenantId === myTenant)) return true;
        const u = data.users.find(x => x.name === log.userName || x.user === log.userName);
        if (u && (u.tenantId === myTenant || (u.role === 'master_admin' && u.user === myTenant))) return true;
        return false;
      });
    }

    // Branch staff: only logs for their specific clinicId
    const myClinicId = currentUser?.clinicId;
    return allLogs.filter(log => log.clinicId === myClinicId);
  }, [data.activityLogs, data.clinics, data.users, currentUser, isDeveloper, isMasterAdmin, selectedTenantId]);

  // Apply Granular UI Filters
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return tenantScopedLogs.filter(log => {
      // Branch filter
      if (selectedClinicId !== 'all' && log.clinicId !== selectedClinicId) {
        return false;
      }

      // User filter
      if (selectedUser !== 'all' && log.userName !== selectedUser) {
        return false;
      }

      // Action type filter
      if (actionFilter !== 'all') {
        if (actionFilter === 'login' && !log.action.includes('دخول') && !log.action.includes('خروج') && !log.details.includes('[auth]')) return false;
        if (actionFilter === 'finance' && !log.action.includes('مالي') && !log.action.includes('فاتورة') && !log.action.includes('إيراد') && !log.action.includes('مصروف') && !log.details.includes('[finance]') && !log.details.includes('[expense]')) return false;
        if (actionFilter === 'staff' && !log.action.includes('موظف') && !log.action.includes('راتب') && !log.details.includes('[staff]') && !log.details.includes('[payroll]')) return false;
        if (actionFilter === 'backup' && !log.action.includes('نسخ') && !log.action.includes('استعادة') && !log.details.includes('[backup]')) return false;
        if (actionFilter === 'queue' && !log.action.includes('حجز') && !log.action.includes('طابور') && !log.action.includes('عميل') && !log.details.includes('[client]')) return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
        if (dateFilter === 'today' && logDate !== todayStr) return false;
        if (dateFilter === 'week') {
          const d = new Date(log.timestamp);
          const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          if (diff > 7) return false;
        }
        if (dateFilter === 'month') {
          const d = new Date(log.timestamp);
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const centerName = getCenterNameForLog(log).toLowerCase();
        const clinicName = getClinicName(log.clinicId).toLowerCase();
        const user = (log.userName || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const details = (log.details || '').toLowerCase();

        return centerName.includes(query) || clinicName.includes(query) || user.includes(query) || action.includes(query) || details.includes(query);
      }

      return true;
    });
  }, [tenantScopedLogs, selectedClinicId, selectedUser, actionFilter, dateFilter, searchTerm]);

  // Unique users for dropdown in the current scope
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    tenantScopedLogs.forEach(l => {
      if (l.userName) set.add(l.userName);
    });
    return Array.from(set);
  }, [tenantScopedLogs]);

  // Summary counts
  const totalLogsCount = tenantScopedLogs.length;
  const loginCount = tenantScopedLogs.filter(l => l.action.includes('دخول') || l.details?.includes('[auth]')).length;
  const financialCount = tenantScopedLogs.filter(l => l.action.includes('فاتورة') || l.action.includes('إيراد') || l.action.includes('مصروف') || l.details?.includes('[finance]') || l.details?.includes('[expense]')).length;
  const staffCount = tenantScopedLogs.filter(l => l.action.includes('موظف') || l.action.includes('راتب') || l.details?.includes('[staff]') || l.details?.includes('[payroll]')).length;

  const handleClearLogs = () => {
    if (!isDeveloper) return;
    
    let confirmMsg = 'هل أنت متأكد من رغبتك في تفريغ سجل النشاطات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.';
    if (selectedTenantId !== 'all') {
      const tenantObj = masterAdmins.find(m => m.user === selectedTenantId);
      confirmMsg = `هل أنت متأكد من تفريغ سجل نشاطات المركز (${tenantObj?.name || selectedTenantId}) فقط؟`;
    }

    if (!confirm(confirmMsg)) return;

    if (selectedTenantId === 'all') {
      updateData({ activityLogs: [] });
    } else {
      // Clear logs only for this tenant
      const remainingLogs = (data.activityLogs || []).filter(log => {
        if (log.tenantId && log.tenantId === selectedTenantId) return false;
        const c = data.clinics.find(x => x.id === log.clinicId);
        if (c && (c.masterAdminId === selectedTenantId || c.tenantId === selectedTenantId)) return false;
        const u = data.users.find(x => x.name === log.userName || x.user === log.userName);
        if (u && (u.tenantId === selectedTenantId || (u.role === 'master_admin' && u.user === selectedTenantId))) return false;
        return true;
      });
      updateData({ activityLogs: remainingLogs });
    }
  };

  // Format timestamp
  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  // Get Badge style for action
  const getActionBadge = (action: string, details: string) => {
    if (action.includes('دخول') || details.includes('[auth]')) {
      return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold"><LogIn size={12} /> {action}</span>;
    }
    if (action.includes('فاتورة') || action.includes('إيراد') || details.includes('[finance]')) {
      return <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-lg font-bold"><DollarSign size={12} /> {action}</span>;
    }
    if (action.includes('مصروف') || details.includes('[expense]')) {
      return <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Wallet size={12} /> {action}</span>;
    }
    if (action.includes('نسخ') || action.includes('استعادة') || details.includes('[backup]')) {
      return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Database size={12} /> {action}</span>;
    }
    if (action.includes('موظف') || action.includes('راتب') || details.includes('[staff]') || details.includes('[payroll]')) {
      return <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Users size={12} /> {action}</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Activity size={12} /> {action}</span>;
  };

  const handlePrint = () => {
    const targetClinic = data.clinics.find(c => c.id === selectedClinicId) || data.clinics[0];
    const currentCenterTitle = isDeveloper 
      ? (selectedTenantId === 'all' ? 'كافة المراكز الرئيسية' : (masterAdmins.find(m => m.user === selectedTenantId)?.name || selectedTenantId))
      : (isMasterAdmin ? (currentUser?.name || 'المركز الرئيسي') : getClinicName(currentUser?.clinicId || ''));

    const summaryHtml = `
      <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; font-family: 'Cairo', sans-serif;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">المركز / الجهة</div>
          <div style="font-size: 15px; font-weight: bold; color: #1e293b;">${currentCenterTitle}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">الفرع المحدد</div>
          <div style="font-size: 14px; font-weight: bold; color: #4f46e5;">${selectedClinicId === 'all' ? 'كافة فروع المركز' : getClinicName(selectedClinicId)}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">إجمالي السجلات المطابقة</div>
          <div style="font-size: 16px; font-weight: bold; color: #059669;">${filteredLogs.length} عملية</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">تاريخ التقرير</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${new Date().toLocaleDateString('ar-EG')}</div>
        </div>
      </div>
    `;

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Cairo', sans-serif;">
        <thead>
          <tr style="background: #f1f5f9; color: #1e293b;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">التاريخ والوقت</th>
            ${isDeveloper && selectedTenantId === 'all' ? '<th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">المركز</th>' : ''}
            <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">الفرع</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">المستخدم</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">نوع الإجراء</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">التفاصيل والبيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredLogs.length === 0 ? `
            <tr><td colspan="${isDeveloper && selectedTenantId === 'all' ? '6' : '5'}" style="text-align: center; color: #94a3b8; padding: 20px;">لا توجد سجلات نشاط مطابقة</td></tr>
          ` : filteredLogs.map(l => `
            <tr>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${formatTimestamp(l.timestamp)}</td>
              ${isDeveloper && selectedTenantId === 'all' ? `<td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 11px; color: #4338ca;">${getCenterNameForLog(l)}</td>` : ''}
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 11px;">${getClinicName(l.clinicId)}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 11px;">${l.userName || 'غير محدد'}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0;"><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${l.action}</span></td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px;">${l.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    printReport(
      `سجل نشاطات وعمليات (${currentCenterTitle})`,
      tableHtml,
      targetClinic,
      summaryHtml
    );
  };

  const handleExcelExport = () => {
    const excelRows = filteredLogs.map(l => ({
      'المعرف': l.id,
      'التاريخ والوقت': formatTimestamp(l.timestamp),
      'المركز الرئيسي': getCenterNameForLog(l),
      'الفرع': getClinicName(l.clinicId),
      'اسم المستخدم': l.userName,
      'نوع الإجراء': l.action,
      'التفاصيل والبيان': l.details
    }));

    const filename = `activity_logs_${selectedTenantId !== 'all' ? selectedTenantId : 'all'}_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(excelRows, filename);
  };

  if (isLogsDisabled) {
    return (
      <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 text-center font-[Cairo] max-w-lg mx-auto my-8">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Shield size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">سجل النشاطات مقيد</h3>
        <p className="text-sm text-slate-500 font-semibold leading-relaxed">
          تم تعطيل الوصول إلى سجل النشاطات لهذا الحساب أو الفرع من قِبل إدارة النظام. يرجى مراجعة المسؤول الرئيسي في حال الرغبة في التفعيل.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6 font-[Cairo]" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80 shadow-2xs">
              <Activity size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-xl m-0">سجل أنشطة وعمليات النظام الميدانية</h4>
                {isDeveloper && (
                  <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    لوحة المطور الشاملة
                  </span>
                )}
                {isMasterAdmin && (
                  <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    إدارة المركز وفروعه
                  </span>
                )}
                {isBranchUser && (
                  <span className="bg-purple-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    فرع: {getClinicName(currentUser?.clinicId || '')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                تتبع حي وفوري لتسجيل الدخول، المعاملات المالية، إجراءات الموظفين، والنسخ الاحتياطي مفصولة بدقة لكل مركز وفرع
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/70 shadow-2xs cursor-pointer"
          >
            <Printer size={16} /> طباعة تقرير منسق
          </button>
          <button 
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200/70 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={16} /> تصدير Excel
          </button>
          {isDeveloper && tenantScopedLogs.length > 0 && (
            <button 
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 shadow-2xs cursor-pointer"
              title="تفريغ سجل النشاطات للمركز المحدد"
            >
              <Trash2 size={16} /> {selectedTenantId === 'all' ? 'تفريغ السجل العام' : 'تفريغ سجل هذا المركز'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl text-center">
          <div className="text-xs text-slate-500 mb-1 font-bold">إجمالي العمليات المسجلة</div>
          <div className="text-2xl font-black text-slate-800">{totalLogsCount}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">عملية في النطاق الحالي</div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200/70 p-4 rounded-2xl text-center">
          <div className="text-xs text-emerald-700 mb-1 font-bold">تسجيلات الدخول للنظام</div>
          <div className="text-2xl font-black text-emerald-800">{loginCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">جلسة عمل موظف</div>
        </div>
        <div className="bg-indigo-50/70 border border-indigo-200/70 p-4 rounded-2xl text-center">
          <div className="text-xs text-indigo-700 mb-1 font-bold">العمليات المالية والفواتير</div>
          <div className="text-2xl font-black text-indigo-800">{financialCount}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">فواتير ومصروفات</div>
        </div>
        <div className="bg-purple-50/70 border border-purple-200/70 p-4 rounded-2xl text-center">
          <div className="text-xs text-purple-700 mb-1 font-bold">المستخدمين والموظفين</div>
          <div className="text-2xl font-black text-purple-800">{uniqueUsers.length}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">أفراد نفذوا عمليات</div>
        </div>
      </div>

      {/* Granular Filters Bar */}
      <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 space-y-4">
        
        {/* Row 1: Centers & Branches Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          
          {/* Tenant / Center Filter (For Developer) */}
          {isDeveloper && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Building size={13} className="text-indigo-600" />
                تصفية حسب المركز الرئيسي:
              </label>
              <select
                value={selectedTenantId}
                onChange={e => {
                  setSelectedTenantId(e.target.value);
                  setSelectedClinicId('all'); // Reset branch when tenant changes
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-600 font-bold text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">🏢 كافة المراكز والمنصات الرئيسية</option>
                {masterAdmins.map(admin => (
                  <option key={admin.user} value={admin.user}>
                    {admin.name} ({admin.user})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clinic / Branch filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Building2 size={13} className="text-indigo-600" />
              تصفية حسب الفرع:
            </label>
            <select
              value={selectedClinicId}
              onChange={e => setSelectedClinicId(e.target.value)}
              disabled={isBranchUser}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-600 font-bold text-slate-800 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 shadow-2xs"
            >
              {!isBranchUser && <option value="all">🏥 كافة الفروع التابعة</option>}
              {!isBranchUser && <option value="master">الإدارة / المركز الرئيسي (Master)</option>}
              {accessibleClinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <User size={13} className="text-slate-600" />
              تصفية حسب الموظف:
            </label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-600 font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="all">👥 كافة الموظفين والمستخدمين</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Action category filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Filter size={13} className="text-slate-600" />
              نوع الإجراء والعملية:
            </label>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-600 font-bold text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="all">⚡ كافة أنواع العمليات</option>
              <option value="login">🔐 تسجيل الدخول والخروج</option>
              <option value="finance">💰 العمليات المالية والفواتير</option>
              <option value="staff">👔 الموظفين ومسير الرواتب</option>
              <option value="queue">🗓️ الحجوزات وطابور الانتظار</option>
              <option value="backup">💾 النسخ الاحتياطي والسلامة</option>
            </select>
          </div>

        </div>

        {/* Row 2: Search & Time Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/80">
          
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث بالنص، بالبيان، برقم الفاتورة، أو بالاسم..."
              className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-xs outline-none focus:border-indigo-600 font-bold placeholder:text-slate-400"
            />
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button 
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${dateFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                الكل
              </button>
              <button 
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${dateFilter === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                اليوم
              </button>
              <button 
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${dateFilter === 'week' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                آخر 7 أيام
              </button>
              <button 
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${dateFilter === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                هذا الشهر
              </button>
            </div>
            
            <div className="text-slate-500 text-xs font-bold pr-2">
              عرض <span className="text-indigo-600 font-black">{filteredLogs.length}</span> من أصل <span className="text-slate-800 font-black">{tenantScopedLogs.length}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[520px] overflow-y-auto shadow-2xs">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="p-3.5 text-xs">التاريخ والوقت</th>
              {isDeveloper && selectedTenantId === 'all' && (
                <th className="p-3.5 text-xs">المركز الرئيسي</th>
              )}
              <th className="p-3.5 text-xs">الفرع</th>
              <th className="p-3.5 text-xs">المستخدم</th>
              <th className="p-3.5 text-xs">نوع الإجراء</th>
              <th className="p-3.5 text-xs">تفاصيل وبيان العملية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={isDeveloper && selectedTenantId === 'all' ? 6 : 5} className="p-12 text-center text-slate-400">
                  <Activity size={40} className="mx-auto mb-3 opacity-25" />
                  <div className="font-bold text-sm text-slate-600">لا توجد سجلات نشاط مطابقة للخيارات المحددة</div>
                  <div className="text-xs text-slate-400 mt-1">قم بتعديل خيارات التصفية أو البحث لعرض السجلات</div>
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  {isDeveloper && selectedTenantId === 'all' && (
                    <td className="p-3 font-bold text-xs whitespace-nowrap text-indigo-700">
                      <span className="inline-flex items-center gap-1 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                        <Building size={12} className="text-indigo-600" />
                        {getCenterNameForLog(log)}
                      </span>
                    </td>
                  )}
                  <td className="p-3 font-bold text-xs text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={13} className="text-indigo-500" />
                      {getClinicName(log.clinicId)}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-xs text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      {log.userName || 'غير محدد'}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {getActionBadge(log.action, log.details)}
                  </td>
                  <td className="p-3 text-xs text-slate-700 font-medium">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
