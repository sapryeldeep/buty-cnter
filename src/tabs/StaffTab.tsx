import React, { useState } from 'react';
import { Users, Shield, Building2, Plus, Trash, Edit, X, Save, EyeOff, Trophy, UserCheck, KeyRound, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ExportButtons } from '../components/ExportButtons';
import { StaffPerformance } from '../components/StaffPerformance';
import { Role, User } from '../types';
import { validatePasswordAndUsername } from '../utils/passwordValidator';
import { StaffPermissionsModal } from '../components/StaffPermissionsModal';

export default function StaffTab() {
  const { data, updateData, currentUser } = useStore();
  
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

  const [subTab, setSubTab] = useState<'performance' | 'directory'>('performance');

  const [newUserName, setNewUserName] = useState('');
  const [newUserAcc, setNewUserAcc] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('reception');
  const [newUserClinicId, setNewUserClinicId] = useState<string>(currentUser?.clinicId || '');
  
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const accessibleClinics = currentUser?.role === 'developer'
    ? data.clinics
    : currentUser?.role === 'master_admin'
      ? data.clinics.filter(c => c.masterAdminId === currentUser.user)
      : data.clinics.filter(c => c.id === currentUser?.clinicId);

  // Filter users based on current user's role
  const staffMembers = data.users.filter(u => {
    if (currentUser?.role === 'developer') {
      return u.role !== 'developer'; // Hide developers from the list
    }
    if (currentUser?.role === 'master_admin') {
      return (accessibleClinics.some(c => c.id === u.clinicId) || (u.clinicId === "master" && u.tenantId === currentUser.user)) && u.role !== "developer" && u.role !== "master_admin";
    }
    return u.clinicId === currentUser?.clinicId && u.role !== 'developer' && u.role !== 'master_admin';
  });

  const getRoleName = (role: string) => {
    switch(role) {
      case 'master_admin': return 'إدارة مركزية';
      case 'doctor': return 'مدير فرع / خبير رئيسي';
      case 'reception': return 'موظف استقبال';
      case 'accountant': return 'محاسب مالي';
      case 'secretary': return 'سكرتارية';
      case 'expert': return 'خبير تجميل';
      default: return role;
    }
  };

  const getClinicName = (clinicId: string) => {
    if (clinicId === 'master') return 'الفرع الرئيسي الموحد';
    const clinic = data.clinics.find(c => c.id === clinicId);
    return clinic ? clinic.name : 'فرع غير معروف';
  };

  const handleCreateUser = () => {
    if (!newUserName || !newUserAcc || !newUserPass || !newUserClinicId) {
      alert('يرجى تعبئة كافة الحقول.');
      return;
    }
    
    // Validate Password & Username
    const validation = validatePasswordAndUsername(
      newUserAcc,
      newUserPass,
      null,
      data.users
    );

    if (!validation.isValid) {
      alert(`⚠️ خطأ في التحقق من البيانات:\n\n${validation.errors.join('\n')}`);
      return;
    }
    
    const newUser: User = {
      name: newUserName,
      user: newUserAcc,
      pass: newUserPass,
      role: newUserRole,
      clinicId: newUserClinicId,
      tenantId: currentUser?.role === "master_admin" ? currentUser.user : currentUser?.tenantId,
      isActive: true,
      permissions: {
        canViewDashboard: true,
        canViewPatients: true,
        canViewAppointments: true,
        canViewFinance: newUserRole === 'accountant' || newUserRole === 'doctor',
        canManageExpenses: newUserRole === 'accountant' || newUserRole === 'doctor',
        canViewServices: true,
        canViewInventory: newUserRole === 'accountant' || newUserRole === 'doctor',
        canViewPayroll: newUserRole === 'accountant' || newUserRole === 'doctor',
        canViewClinics: newUserRole === 'doctor',
        canViewStaff: newUserRole === 'doctor',
        canViewArchive: true,
        canAccessSettings: newUserRole === 'doctor',
        canDeleteRecords: false,
        canExportData: newUserRole === 'accountant' || newUserRole === 'doctor',
        canEditInvoices: newUserRole === 'accountant' || newUserRole === 'doctor'
      }
    };

    updateData({ users: [...data.users, newUser] });
    setNewUserName('');
    setNewUserAcc('');
    setNewUserPass('');
    alert('تم إضافة الموظف وتعيين صلاحياته بنجاح');
  };

  const openEditPermissions = (user: User) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsModalOpen(true);
  };

  const openNewUserModal = () => {
    setSelectedUserForPermissions(null);
    setIsPermissionsModalOpen(true);
  };

  const deleteUser = (userAcc: string) => {
    setUserToDelete(userAcc);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      updateData({ users: data.users.filter(u => u.user !== userToDelete) });
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top View Selector Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full sm:w-max gap-1">
        <button
          onClick={() => setSubTab('performance')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            subTab === 'performance'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Trophy size={18} />
          تقييم أداء وإنتاجية الموظفين
        </button>
        <button
          onClick={() => setSubTab('directory')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            subTab === 'directory'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Users size={18} />
          دليل الموظفين وتعيين الصلاحيات
        </button>
      </div>

      {subTab === 'performance' ? (
        <StaffPerformance />
      ) : (
        <>
          {(currentUser?.role === 'doctor' || currentUser?.role === 'master_admin' || currentUser?.role === 'developer') && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h6 className="font-bold text-slate-800 flex items-center gap-2 m-0">
                  <Users size={18} className="text-indigo-600"/>
                  إضافة موظف جديد وتحديد صلاحياته
                </h6>

                <button
                  onClick={openNewUserModal}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-colors"
                >
                  <Shield size={15} />
                  إضافة موظف مع مصفوفة الصلاحيات المتقدمة
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم الموظف</label>
                  <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" placeholder="مثال: ريم أحمد" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم الدخول (Username)</label>
                  <input type="text" value={newUserAcc} onChange={e => setNewUserAcc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-mono text-left" placeholder="reem_user" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور (Password)</label>
                  <input type="text" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-mono text-left" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الدور الوظيفي / الصلاحية</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold">
                    {currentUser?.role === 'master_admin' || currentUser?.role === 'developer' ? (
                      <option value="doctor">مدير فرع</option>
                    ) : null}
                    <option value="reception">استقبال</option>
                    <option value="accountant">محاسب مالي</option>
                    <option value="secretary">سكرتارية</option>
                    <option value="expert">خبير تجميل</option>
                  </select>
                </div>
                {(currentUser?.role === 'master_admin' || currentUser?.role === 'developer') ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الفرع</label>
                    <select value={newUserClinicId} onChange={e => setNewUserClinicId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold text-indigo-700">
                      <option value="master">المركز الرئيسي الموحد</option>
                      {accessibleClinics.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className={(currentUser?.role === 'doctor') ? "md:col-span-1" : "md:col-span-5"}>
                  <button onClick={handleCreateUser} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition-colors flex justify-center items-center gap-2 h-[38px] shadow-sm">
                    <Plus size={16} />
                    حفظ وإضافة الموظف
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-staff">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0">
                <Users size={18} />
                حركة الموظفين والتحكم في الصلاحيات التفصيلية
              </h6>
              {isPrintAllowed && isDownloadAllowed && (
                <ExportButtons 
                  data={staffMembers}
                  pdfHeaders={['اسم الموظف', 'اسم المستخدم للدخول', 'المسمى الوظيفي', 'الفرع']}
                  pdfData={staffMembers.map(s => [s.name, s.user, getRoleName(s.role), getClinicName(s.clinicId)])}
                  filename="staff_report"
                  title="حركة الموظفين والصلاحيات"
                  printElementId="print-staff"
                />
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">اسم المستخدم (للدخول)</th>
                    <th className="p-3">الصلاحية / المسمى الوظيفي</th>
                    <th className="p-3">الفرع التابع له</th>
                    <th className="p-3">الصلاحيات الممنوحة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">لا يوجد موظفين مسجلين لعرضهم</td>
                    </tr>
                  ) : staffMembers.map((s, i) => {
                    const permCount = s.permissions 
                      ? Object.values(s.permissions).filter(Boolean).length 
                      : (s.role === 'doctor' ? 15 : s.role === 'accountant' ? 8 : 5);

                    return (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3 font-mono text-slate-500 text-xs">{s.user}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                            s.role === 'master_admin' || s.role === 'doctor' 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : s.role === 'accountant'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {s.role === 'master_admin' || s.role === 'doctor' ? <Shield size={13} /> : null}
                            {getRoleName(s.role)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                            <Building2 size={13} className="text-slate-400"/>
                            {getClinicName(s.clinicId)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle size={12} />
                            {permCount} صلاحية مفعلة
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openEditPermissions(s)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors border border-indigo-100 shadow-xs"
                              title="تعديل الحساب والاسم وكلمة المرور وصلاحيات الموظف"
                            >
                              <Edit size={13} className="text-indigo-600" />
                              تعديل البيانات والصلاحيات
                            </button>

                            <button 
                              onClick={() => deleteUser(s.user)} 
                              className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100 shadow-xs flex items-center gap-1 text-xs font-extrabold"
                              title="حذف الموظف نهائياً"
                            >
                              <Trash size={13} className="text-rose-500" />
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
        </>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="bg-rose-50 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Trash size={32} />
              </div>
              <h3 className="text-xl font-black text-rose-700 mb-2">تأكيد حذف الموظف</h3>
              <p className="text-rose-600/80 text-sm font-semibold">
                هل أنت متأكد من رغبتك في حذف هذا الموظف نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="p-6 bg-white flex gap-3">
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                نعم، احذف الموظف
              </button>
              <button 
                onClick={cancelDeleteUser}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Permissions Modal */}
      <StaffPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        targetUser={selectedUserForPermissions}
      />
    </div>
  );
}
