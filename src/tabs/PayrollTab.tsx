import React, { useState } from 'react';
import { Banknote, Users, Calculator, Plus, Printer, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Edit, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { ExportButtons } from '../components/ExportButtons';
import { Staff, PayrollTransaction } from '../types';
import { printPaySlip } from '../utils/exportUtils';
import { recordActivityLog } from '../utils/activityLogger';

export default function PayrollTab() {
  const { data, updateData, currentUser } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isPrintAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisablePrintStaff !== true && (center?.permissions?.printFull !== false || currentUser?.permissions?.canPrintStaff !== false));
  const isDownloadAllowed = currentUser?.role === 'developer' || ((center?.permissions?.devDisableExportExcel !== true || center?.permissions?.devDisableExportPDF !== true) && (center?.permissions?.downloadFull !== false || currentUser?.permissions?.canExportData !== false));

  const currentClinic = data.clinics.find(c => c.id === currentClinicId);
  const staffList: Staff[] = data.staffDirectory?.[currentClinicId] || [];

  const payrollTrans: PayrollTransaction[] = data.payrollStore?.[currentClinicId] || [];

  // Modal / form states for transaction
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [transType, setTransType] = useState<'bonus' | 'deduction' | 'advance'>('bonus');
  const [transAmount, setTransAmount] = useState<number>(0);
  const [transNote, setTransNote] = useState('');
  const [search, setSearch] = useState('');

  // Add staff state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{id: number, name: string} | null>(null);
  const [transToDelete, setTransToDelete] = useState<number | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('خبيرة تجميل');
  const [newStaffSalary, setNewStaffSalary] = useState<number>(6000);
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // Edit staff state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSalary, setEditSalary] = useState<number>(0);
  const [editPhone, setEditPhone] = useState('');

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName || editSalary <= 0) {
      alert('يرجى كتابة اسم الموظف والراتب الأساسي');
      return;
    }

    const updated = staffList.map(s => {
      if (s.id === editingStaff.id) {
        return {
          ...s,
          name: editName,
          role: editRole,
          salary: editSalary,
          phone: editPhone
        };
      }
      return s;
    });

    updateData({
      staffDirectory: {
        ...(data.staffDirectory || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'تعديل موظف في مسير الرواتب',
      `تم تعديل بيانات الموظف (${editName}) براتب أساسي ${editSalary} ${currentCurrency}`
    );

    setEditingStaff(null);
    alert('تم تعديل بيانات الموظف بنجاح!');
  };

  const handleDeleteStaff = (id: number, name: string) => {
    setStaffToDelete({id, name});
  };

  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      const updated = staffList.filter(s => String(s.id) !== String(staffToDelete.id) && s.name.trim() !== staffToDelete.name.trim());
      updateData({
        staffDirectory: {
          ...(data.staffDirectory || {}),
          [currentClinicId]: updated
        }
      });
      setStaffToDelete(null);
    }
  };

  const cancelDeleteStaff = () => setStaffToDelete(null);

  const _dummy_deleteStaff = (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف (${name}) من مسير الرواتب نهائياً؟`)) return;

    const updated = staffList.filter(s => String(s.id) !== String(id) && s.name.trim() !== name.trim());
    updateData({
       staffDirectory: {
         ...(data.staffDirectory || {}),
         [currentClinicId]: updated
       }
     });
 
     recordActivityLog(
       currentClinicId,
       currentUser?.name || 'مستخدم',
       'حذف موظف من مسير الرواتب',
       `تم حذف الموظف (${name})`
     );

    alert('تم حذف الموظف بنجاح!');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || newStaffSalary <= 0) {
      alert('يرجى كتابة اسم الموظف والراتب الأساسي');
      return;
    }

    const newStaff: Staff = {
      id: Date.now(),
      name: newStaffName,
      role: newStaffRole,
      salary: newStaffSalary,
      phone: newStaffPhone
    };

    const updated = [...staffList, newStaff];
    updateData({
      staffDirectory: {
        ...(data.staffDirectory || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'إضافة موظف في مسير الرواتب',
      `تم إدراج الموظف (${newStaffName}) براتب أساسي ${newStaffSalary} ${currentCurrency}`
    );

    setNewStaffName('');
    setNewStaffPhone('');
    setShowAddStaff(false);
    alert('تم إضافة الموظف بنجاح!');
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffName || transAmount <= 0) {
      alert('يرجى اختيار الموظف وتحديد المبلغ المطلوب');
      return;
    }

    const newTrans: PayrollTransaction = {
      id: Date.now(),
      staffName: selectedStaffName,
      transType,
      amount: transAmount,
      note: transNote || (transType === 'bonus' ? 'مكافأة / عمولة جلسات' : transType === 'advance' ? 'سلفة شهرية' : 'استقطاع / جزاء'),
      date: new Date().toLocaleDateString('ar-EG')
    };

    const updated = [newTrans, ...payrollTrans];
    updateData({
      payrollStore: {
        ...(data.payrollStore || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'إضافة حركة مسير رواتب',
      `تم تسجيل (${transType === 'bonus' ? 'مكافأة' : transType === 'advance' ? 'سلفة' : 'خصم'}) بمبلغ ${transAmount} للموظف (${selectedStaffName})`
    );

    setTransAmount(0);
    setTransNote('');
    alert('تم تسجيل العملية المالية في مسير الرواتب بنجاح!');
  };

  const handleDeleteTrans = (id: number) => {
    setTransToDelete(id);
  };

  const confirmDeleteTrans = () => {
    if (transToDelete) {
      const updated = payrollTrans.filter(t => t.id !== transToDelete);
      updateData({
        payrollStore: {
          ...(data.payrollStore || {}),
          [currentClinicId]: updated
        }
      });
      setTransToDelete(null);
    }
  };

  const cancelDeleteTrans = () => setTransToDelete(null);

  const _dummy_deleteTrans = (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
    const updated = payrollTrans.filter(t => t.id !== id);
    updateData({
      payrollStore: {
        ...(data.payrollStore || {}),
        [currentClinicId]: updated
      }
    });
  };

  // Compile calculations per staff
  const payrollSummary = staffList.map(st => {
    const stTrans = payrollTrans.filter(t => t.staffName === st.name);
    const bonuses = stTrans.filter(t => t.transType === 'bonus').reduce((acc, c) => acc + (c.amount || 0), 0);
    const deductions = stTrans.filter(t => t.transType === 'deduction').reduce((acc, c) => acc + (c.amount || 0), 0);
    const advances = stTrans.filter(t => t.transType === 'advance').reduce((acc, c) => acc + (c.amount || 0), 0);
    const netSalary = (st.salary || 0) + bonuses - deductions - advances;

    return {
      id: st.id,
      name: st.name,
      role: st.role,
      basic: st.salary || 0,
      bonuses,
      deductions,
      advances,
      netSalary
    };
  });

  const filteredSummary = payrollSummary.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalBasic = payrollSummary.reduce((acc, s) => acc + s.basic, 0);
  const totalNet = payrollSummary.reduce((acc, s) => acc + s.netSalary, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <Banknote className="text-indigo-600" size={24} />
            إدارة مسير الرواتب والعمولات والسلف
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            الفرع النشط: <span className="text-indigo-600 font-bold">{currentUser?.role === 'developer' ? 'نظام المطور' : (currentClinic?.name || 'غير محدد')}</span> | احتساب الرواتب الصافية، السلف الشهرية، الحوافز، والطباعة المباشرة لكشوف المرتبات.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-indigo-700 font-bold">إجمالي المستحق للصرف</div>
            <div className="text-base font-black text-indigo-900">{totalNet.toLocaleString()} {currentCurrency}</div>
          </div>
          <button 
            onClick={() => setShowAddStaff(!showAddStaff)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={16} />
            {showAddStaff ? 'إخفاء نموذج الموظف' : 'إضافة موظف للمسير'}
          </button>
        </div>
      </div>

      {/* Optional Add Staff Box */}
      {showAddStaff && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-sm animate-fadeIn">
          <h6 className="font-bold text-indigo-900 mb-3 text-sm flex items-center gap-2">
            <Users size={16} />
            بيانات الموظف الجديد
          </h6>
          <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف</label>
              <input 
                type="text" 
                value={newStaffName} 
                onChange={e => setNewStaffName(e.target.value)} 
                placeholder="اسم الموظف..." 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
              <input 
                type="text" 
                value={newStaffRole} 
                onChange={e => setNewStaffRole(e.target.value)} 
                placeholder="مثال: خبير تجميل، استقبال..." 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الأساسي ({currentCurrency})</label>
              <input 
                type="number" 
                value={newStaffSalary} 
                onChange={e => setNewStaffSalary(parseFloat(e.target.value) || 0)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                min="0" 
                required
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
              >
                تأكيد الإضافة
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Add Transaction Form (Bonus, Deduction, Advance) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h6 className="font-bold mb-4 text-indigo-600 flex items-center gap-2">
              <Calculator size={18} />
              تسجيل (سلفة / حافز / استقطاع)
            </h6>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اختر الموظف</label>
                <select 
                  value={selectedStaffName} 
                  onChange={e => setSelectedStaffName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                  required
                >
                  <option value="">-- اختر الموظف --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">نوع الحركة</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setTransType('bonus')} 
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${transType === 'bonus' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                  >
                    حافز/عمولة (+)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTransType('advance')} 
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${transType === 'advance' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                  >
                    سلفة (-)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTransType('deduction')} 
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${transType === 'deduction' ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                  >
                    استقطاع (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ ({currentCurrency})</label>
                <input 
                  type="number" 
                  value={transAmount} 
                  onChange={e => setTransAmount(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                  min="1" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">البيان / الملاحظات</label>
                <input 
                  type="text" 
                  value={transNote} 
                  onChange={e => setTransNote(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                  placeholder="سبب الحركة المالية..." 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2.5 mt-2 shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                تسجيل الحركة في المسير
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Payroll Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full" id="print-payroll">
            <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
              <h6 className="font-bold text-slate-900 m-0 flex items-center gap-2">
                <Banknote size={18} className="text-indigo-600" />
                كشف مسير رواتب الموظفين ({filteredSummary.length})
              </h6>

              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="بحث عن موظف..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 w-44"
                />
                {isPrintAllowed && isDownloadAllowed && (
                  <ExportButtons 
                    data={filteredSummary}
                    pdfHeaders={['الموظف', 'الوظيفة', 'الأساسي', 'حوافز', 'سلف', 'استقطاعات', 'الصافي']}
                    pdfData={filteredSummary.map(s => [s.name, s.role, s.basic, s.bonuses, s.advances, s.deductions, s.netSalary])}
                    filename="payroll_sheet"
                    title="مسير رواتب موظفي المركز"
                    printElementId="print-payroll"
                  />
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 font-bold">اسم الموظف</th>
                    <th className="p-3 font-bold">الوظيفة</th>
                    <th className="p-3 font-bold">الأساسي</th>
                    <th className="p-3 font-bold text-emerald-600">حوافز (+)</th>
                    <th className="p-3 font-bold text-amber-600">سلف (-)</th>
                    <th className="p-3 font-bold text-rose-600">استقطاع (-)</th>
                    <th className="p-3 font-bold bg-indigo-50/50">الصافي المستحق</th>
                    <th className="p-3 font-bold no-print text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummary.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد سجلات للموظفين تطابق البحث
                      </td>
                    </tr>
                  ) : filteredSummary.map(s => {
                    const originalStaff = staffList.find(st => st.id === s.id) || staffList.find(st => st.name === s.name);
                    const staffTrans = payrollTrans.filter(t => t.staffName === s.name);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                            {s.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{s.basic.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600 font-bold font-mono">
                          {s.bonuses > 0 ? `+${s.bonuses.toLocaleString()}` : '0'}
                        </td>
                        <td className="p-3 text-amber-600 font-bold font-mono">
                          {s.advances > 0 ? `-${s.advances.toLocaleString()}` : '0'}
                        </td>
                        <td className="p-3 text-rose-600 font-bold font-mono">
                          {s.deductions > 0 ? `-${s.deductions.toLocaleString()}` : '0'}
                        </td>
                        <td className="p-3 font-black text-indigo-700 bg-indigo-50/30 font-mono">
                          {s.netSalary.toLocaleString()} {currentCurrency}
                        </td>
                        <td className="p-3 no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            {(currentUser?.role === 'developer' || currentUser?.permissions?.canPrintStaff !== false) && (
                              <button 
                                onClick={() => printPaySlip(originalStaff || { id: s.id, name: s.name, role: s.role, salary: s.basic, phone: '' }, staffTrans, currentClinic)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                title="طباعة قسيمة الراتب الرسمية"
                              >
                                <Printer size={12} />
                                قسيمة الراتب
                              </button>
                            )}

                            <button 
                              onClick={() => {
                                const staffObj = originalStaff || { id: s.id, name: s.name, role: s.role, salary: s.basic, phone: '' };
                                setEditingStaff(staffObj);
                                setEditName(staffObj.name);
                                setEditRole(staffObj.role);
                                setEditSalary(staffObj.salary);
                                setEditPhone(staffObj.phone || '');
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="تعديل بيانات الموظف وراتبه"
                            >
                              <Edit size={12} />
                              تعديل
                            </button>

                            <button 
                              onClick={() => handleDeleteStaff(s.id, s.name)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              title="حذف الموظف من المسير"
                            >
                              <Trash2 size={12} />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-[Cairo] backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn text-right">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-bold text-slate-800 text-base flex items-center gap-2 m-0">
                <Edit className="text-amber-600" size={18} />
                تعديل بيانات موظف المسير
              </h5>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الموظف</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المسمى الوظيفي</label>
                <input 
                  type="text"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الراتب الأساسي ({currentCurrency})</label>
                <input 
                  type="number"
                  value={editSalary}
                  onChange={e => setEditSalary(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف (اختياري)</label>
                <input 
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl shadow-sm transition-colors"
                >
                  حفظ التعديلات
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
