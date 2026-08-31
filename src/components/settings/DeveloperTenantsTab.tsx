import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Shield, Plus, Save, X, Edit, Trash, DollarSign, 
  Receipt, Settings, ChevronDown, ChevronUp, Users, Building2,
  Printer, Download, FileSpreadsheet, FileText, Lock, Unlock,
  Sparkles, CheckCircle2, Sliders, Database, Bot, MessageSquare,
  Volume2, RotateCcw, Check, Eye, EyeOff, Cloud, HardDrive
} from 'lucide-react';
import { User, Clinic, UserPermissions } from '../../types';
import { validatePasswordAndUsername } from '../../utils/passwordValidator';

interface DeveloperTenantsTabProps {
  onDeleteUserPrompt: (user: string) => void;
  onOpenInvoiceModal: (inv: any, type: 'subscription' | 'contract', centerUser: string) => void;
  onPrintInvoice: (inv: any) => void;
}

export const DeveloperTenantsTab: React.FC<DeveloperTenantsTabProps> = ({
  onDeleteUserPrompt,
  onOpenInvoiceModal,
  onPrintInvoice
}) => {
  const { data, updateData, currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer';
  const masterAdmins = isDeveloper ? data.users.filter(u => u.role === 'master_admin') : [];
  const branchUsers = isDeveloper ? data.users.filter(u => u.role !== 'developer' && u.role !== 'master_admin') : [];

  // Master Admin Center Creation & Editing State
  const [newCenterName, setNewCenterName] = useState('');
  const [newCenterUser, setNewCenterUser] = useState('');
  const [newCenterPass, setNewCenterPass] = useState('');
  const [newCenterBranches, setNewCenterBranches] = useState<number>(3);
  const [newCenterDesignSalePrice, setNewCenterDesignSalePrice] = useState<number>(5000);
  const [newCenterBranchSalePrice, setNewCenterBranchSalePrice] = useState<number>(1500);
  const [newCenterPaidAmountToDev, setNewCenterPaidAmountToDev] = useState<number>(0);
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);

  // Selected Center for Advanced Configuration
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(masterAdmins[0]?.user || null);

  // Subscription invoice generation state
  const [subMonths, setSubMonths] = useState<number>(1);
  const [subAmount, setSubAmount] = useState<number>(1000);
  const [subStatus, setSubStatus] = useState<string>('paid');

  // Deletion confirmation states to bypass blocked window.confirm in iframe
  const [contractToDelete, setContractToDelete] = useState<{ centerUser: string; invId: string } | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ centerUser: string; invId: string } | null>(null);

  // Branch User Creation & Editing State
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager' | 'receptionist' | 'accountant' | 'secretary' | 'expert'>('receptionist');
  const [newUserClinicId, setNewUserClinicId] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Accordion state for Granular Permissions inside selected center
  const [activeAccordions, setActiveAccordions] = useState<{ [key: string]: boolean }>({
    printing: true,
    export: true,
    finance: true,
    services: false,
    staff: false,
    advanced: false
  });

  const toggleAccordion = (key: string) => {
    setActiveAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Center Handlers
  const handleCreateCenter = () => {
    if (!newCenterName.trim() || !newCenterUser.trim() || !newCenterPass.trim()) {
      alert('يرجى ملء جميع حقول المركز الرئيسي');
      return;
    }

    // Validate Password & Username to prevent overlaps & duplicates
    const validation = validatePasswordAndUsername(
      newCenterUser,
      newCenterPass,
      editingCenterId,
      data.users
    );

    if (!validation.isValid) {
      alert(`⚠️ خطأ في التحقق من البيانات:\n\n${validation.errors.join('\n')}`);
      return;
    }

    if (editingCenterId) {
      updateData({
        users: data.users.map(u => u.user === editingCenterId ? {
          ...u,
          name: newCenterName,
          user: newCenterUser,
          pass: newCenterPass,
          maxBranches: newCenterBranches,
          designSalePrice: newCenterDesignSalePrice,
          branchSalePrice: newCenterBranchSalePrice,
          paidAmountToDev: newCenterPaidAmountToDev
        } : u)
      });
      setEditingCenterId(null);
      alert('تم تحديث بيانات المركز بنجاح');
    } else {
      const defaultExp = new Date();
      defaultExp.setMonth(defaultExp.getMonth() + 1);

      const newAdmin: User = {
        name: newCenterName,
        user: newCenterUser,
        pass: newCenterPass,
        role: 'master_admin',
        clinicId: 'master',
        tenantId: newCenterUser,
        maxBranches: newCenterBranches,
        isActive: true,
        expiryDate: defaultExp.toISOString(),
        designSalePrice: newCenterDesignSalePrice,
        branchSalePrice: newCenterBranchSalePrice,
        paidAmountToDev: newCenterPaidAmountToDev,
        permissions: {
          printFull: true,
          devShowInvoiceSettings: true,
          devShowWhatsappSettings: true
        }
      };

      updateData({
        users: [...data.users, newAdmin]
      });
      alert('تمت إضافة المركز الرئيسي بنجاح');
    }

    setNewCenterName('');
    setNewCenterUser('');
    setNewCenterPass('');
    setNewCenterBranches(3);
    setNewCenterDesignSalePrice(5000);
    setNewCenterBranchSalePrice(1500);
    setNewCenterPaidAmountToDev(0);
  };

  const handleEditCenterClick = (admin: User) => {
    setEditingCenterId(admin.user);
    setNewCenterName(admin.name);
    setNewCenterUser(admin.user);
    setNewCenterPass(admin.pass);
    setNewCenterBranches(admin.maxBranches || 3);
    setNewCenterDesignSalePrice(admin.designSalePrice || 5000);
    setNewCenterBranchSalePrice(admin.branchSalePrice || 1500);
    setNewCenterPaidAmountToDev(admin.paidAmountToDev || 0);
  };

  const handleCancelCenterEdit = () => {
    setEditingCenterId(null);
    setNewCenterName('');
    setNewCenterUser('');
    setNewCenterPass('');
    setNewCenterBranches(3);
    setNewCenterDesignSalePrice(5000);
    setNewCenterBranchSalePrice(1500);
    setNewCenterPaidAmountToDev(0);
  };

  // Branch User Handlers
  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPass.trim() || !newUserClinicId) {
      alert('يرجى ملء جميع حقول الموظف واختيار الفرع');
      return;
    }

    // Validate Password & Username to prevent overlaps & duplicates
    const validation = validatePasswordAndUsername(
      newUserUsername,
      newUserPass,
      editingUserId,
      data.users
    );

    if (!validation.isValid) {
      alert(`⚠️ خطأ في التحقق من البيانات:\n\n${validation.errors.join('\n')}`);
      return;
    }

    if (editingUserId) {
      updateData({
        users: data.users.map(u => u.user === editingUserId ? {
          ...u,
          name: newUserName,
          user: newUserUsername,
          pass: newUserPass,
          role: newUserRole,
          clinicId: newUserClinicId
        } : u)
      });
      setEditingUserId(null);
      alert('تم تحديث بيانات الموظف بنجاح');
    } else {
      const assignedClinic = data.clinics.find(c => c.id === newUserClinicId);
      const newUser: User = {
        name: newUserName,
        user: newUserUsername,
        pass: newUserPass,
        role: newUserRole,
        clinicId: newUserClinicId,
        tenantId: assignedClinic?.tenantId || assignedClinic?.masterAdminId
      };

      updateData({
        users: [...data.users, newUser]
      });
      alert('تمت إضافة الموظف بنجاح');
    }

    setNewUserName('');
    setNewUserUsername('');
    setNewUserPass('');
    setNewUserClinicId('');
  };

  const handleEditUserClick = (user: User) => {
    setEditingUserId(user.user);
    setNewUserName(user.name);
    setNewUserUsername(user.user);
    setNewUserPass(user.pass);
    setNewUserRole(user.role as any);
    setNewUserClinicId(user.clinicId);
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPass('');
    setNewUserClinicId('');
  };

  const devCurrency = data.settings?.developerCurrency || 'EGP';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Center Manager Form & List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield size={18} className="text-indigo-600"/>
            المراكز الرئيسية (Master Admins)
          </h6>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المركز الرئيسي</label>
              <input 
                type="text" 
                value={newCenterName} 
                onChange={e => setNewCenterName(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                placeholder="مثال: بيوتي كلينيك" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم</label>
              <input 
                type="text" 
                value={newCenterUser} 
                onChange={e => setNewCenterUser(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور</label>
              <input 
                type="text" 
                value={newCenterPass} 
                onChange={e => setNewCenterPass(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الحد الأقصى للفروع</label>
              <input 
                type="number" 
                value={newCenterBranches} 
                onChange={e => setNewCenterBranches(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                min="1" 
              />
            </div>
            <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/40">
              <div>
                <label className="block text-[10px] font-black text-indigo-900 mb-1">سعر بيع التصميم</label>
                <input 
                  type="number" 
                  value={newCenterDesignSalePrice} 
                  onChange={e => setNewCenterDesignSalePrice(Number(e.target.value))} 
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-600 font-bold" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-900 mb-1">سعر ترخيص الفرع الواحد</label>
                <input 
                  type="number" 
                  value={newCenterBranchSalePrice} 
                  onChange={e => setNewCenterBranchSalePrice(Number(e.target.value))} 
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-600 font-bold" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ المحصل كاش للمطور</label>
              <input 
                type="number" 
                value={newCenterPaidAmountToDev} 
                onChange={e => setNewCenterPaidAmountToDev(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold text-emerald-600" 
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCreateCenter} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition-colors flex justify-center items-center gap-2"
              >
                {editingCenterId ? <Save size={16} /> : <Plus size={16} />}
                {editingCenterId ? 'حفظ التعديلات' : 'إضافة المركز'}
              </button>
              {editingCenterId && (
                <button 
                  onClick={handleCancelCenterEdit} 
                  className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <h6 className="font-bold text-slate-800 mb-4 text-sm">قائمة المراكز والتعاقدات المالية ({masterAdmins.length})</h6>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {masterAdmins.map(admin => {
              const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
              const designPrice = admin.designSalePrice || 5000;
              const bPrice = admin.branchSalePrice || 1500;
              const totalDue = designPrice + (bPrice * actualBranches);
              const paid = admin.paidAmountToDev || 0;
              const remaining = totalDue - paid;
              
              return (
                <div key={admin.user} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-xs text-slate-800">{admin.name}</div>
                      <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">{admin.user} / {admin.pass}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditCenterClick(admin)} className="text-indigo-600 hover:text-indigo-800 p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => onDeleteUserPrompt(admin.user)} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/80 text-[10.5px]">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">عقد المركز</span>
                      <span className="font-extrabold text-slate-800">{totalDue.toLocaleString('ar-EG')} {devCurrency}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-emerald-500 block text-[9px]">المحصل كاش</span>
                      <span className="font-extrabold text-emerald-600">{paid.toLocaleString('ar-EG')} {devCurrency}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-rose-400 block text-[9px]">المتبقي للمطور</span>
                      <span className="font-extrabold text-rose-600">{remaining.toLocaleString('ar-EG')} {devCurrency}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                    <span>الفروع المنشأة: <span className="text-indigo-600 font-extrabold">{actualBranches}</span> من أصل <span className="text-slate-700 font-extrabold">{admin.maxBranches || 3}</span></span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${admin.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {admin.isActive !== false ? 'نشط ومفعل' : 'موقوف'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Management Form & List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users size={18} className="text-indigo-600"/>
            إضافة مستخدمي وموظفي الفروع
          </h6>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الاسم الكامل للموظف</label>
              <input 
                type="text" 
                value={newUserName} 
                onChange={e => setNewUserName(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                placeholder="مثال: رنا أحمد" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم للدخول</label>
              <input 
                type="text" 
                value={newUserUsername} 
                onChange={e => setNewUserUsername(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور</label>
              <input 
                type="text" 
                value={newUserPass} 
                onChange={e => setNewUserPass(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الدور الوظيفي</label>
              <select 
                value={newUserRole} 
                onChange={e => setNewUserRole(e.target.value as any)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
              >
                <option value="manager">مدير الفرع</option>
                <option value="receptionist">موظف استقبال</option>
                <option value="accountant">محاسب</option>
                <option value="secretary">سكرتارية</option>
                <option value="expert">خبير تجميل</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">تعيين في فرع</label>
              <select 
                value={newUserClinicId} 
                onChange={e => setNewUserClinicId(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
              >
                <option value="">-- اختر الفرع --</option>
                {data.clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCreateUser} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition-colors flex justify-center items-center gap-2"
              >
                {editingUserId ? <Save size={16} /> : <Plus size={16} />}
                {editingUserId ? 'حفظ التعديلات' : 'إضافة الموظف وربطه'}
              </button>
              {editingUserId && (
                <button 
                  onClick={handleCancelUserEdit} 
                  className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <h6 className="font-bold text-slate-800 mb-4 text-sm">مستخدمي الفروع ({branchUsers.length})</h6>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {branchUsers.map(user => {
              const clinicName = data.clinics.find(c => c.id === user.clinicId)?.name || 'غير معروف';
              return (
                <div key={user.user} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{user.user} | الدور: {user.role}</div>
                    <div className="text-xs text-indigo-600 font-bold mt-1">الفرع: {clinicName}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditUserClick(user)} className="text-indigo-400 hover:text-indigo-600 p-2 bg-indigo-50 rounded-lg">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDeleteUserPrompt(user.user)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dev: Center Advanced Granular & Subscription Control */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings size={18} className="text-indigo-600"/>
          التحكم الشامل بكل مركز (صلاحيات، اشتراك، تفعيل)
        </h6>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 border-l border-slate-100 pl-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">اختر المركز (Master Admin):</label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {masterAdmins.length === 0 && <p className="text-slate-400 text-sm">لا يوجد مراكز</p>}
              {masterAdmins.map(admin => (
                <button 
                  key={admin.user}
                  onClick={() => setSelectedCenterId(admin.user)}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${selectedCenterId === admin.user ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="font-bold">{admin.name}</div>
                  <div className="text-xs opacity-70 mt-1">{admin.user}</div>
                  <div className="mt-2 text-xs flex gap-2">
                     <span className={`px-2 py-0.5 rounded ${admin.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                       {admin.isActive !== false ? 'مفعل' : 'موقوف'}
                     </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="md:w-2/3">
            {!selectedCenterId ? (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-10">
                يرجى اختيار مركز من القائمة الجانبية لاستعراض وتعديل صلاحياته
              </div>
            ) : (() => {
              const center = masterAdmins.find(u => u.user === selectedCenterId);
              if (!center) return null;
              
              const centerModules = center.modules || data.settings?.modules || {
                patients: true, appointments: true, finance: true, services: true,
                inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
              };

              return (
                <div className="space-y-6 animate-in fade-in">
                  {/* Status & Subscription */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">حالة الاشتراك والتفعيل</h6>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">حالة المركز</label>
                        <select 
                          value={center.isActive !== false ? 'active' : 'suspended'}
                          onChange={(e) => {
                            const isActive = e.target.value === 'active';
                            updateData({ users: data.users.map(u => u.user === center.user ? { ...u, isActive } : u) });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold"
                        >
                          <option value="active" className="text-green-600">نشط (يعمل)</option>
                          <option value="suspended" className="text-red-600">موقوف (محظور)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ انتهاء الاشتراك</label>
                        <input 
                          type="date" 
                          value={center.expiryDate ? center.expiryDate.split('T')[0] : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newDate = val ? new Date(val).toISOString() : undefined;
                            updateData({ users: data.users.map(u => u.user === center.user ? { ...u, expiryDate: newDate } : u) });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                       <button 
                         onClick={() => {
                           const d = new Date(); d.setMonth(d.getMonth() + 1);
                           updateData({ users: data.users.map(u => u.user === center.user ? { ...u, expiryDate: d.toISOString() } : u) });
                         }}
                         className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-bold transition-colors"
                       >
                         + شهر واحد
                       </button>
                       <button 
                         onClick={() => {
                           const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                           updateData({ users: data.users.map(u => u.user === center.user ? { ...u, expiryDate: d.toISOString() } : u) });
                         }}
                         className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-bold transition-colors"
                       >
                         + سنة كاملة
                       </button>
                    </div>
                  </div>

                  {/* Modules Control */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">صلاحيات الأقسام المتاحة للمركز</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(centerModules).map(([key, isEnabled]) => (
                        key !== 'settings' && (
                          <div key={key} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-white">
                            <span className="font-bold text-slate-700 text-sm capitalize">{key}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isEnabled}
                                onChange={() => {
                                  const newModules = { ...centerModules, [key]: !isEnabled };
                                  updateData({ users: data.users.map(u => u.user === center.user ? { ...u, modules: newModules } : u) });
                                }}
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Advanced Center Controls (Subscription, User/Pass, Max Branches, and Full/Granular Permissions) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">التحكم المطور المتقدم (الفروع والمستخدم والخصائص)</h6>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم مستخدم المدير (الدخول)</label>
                          <input 
                            type="text" 
                            value={center.user} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const isDup = data.users.some(u => u.user === val && u.user !== center.user);
                              if (isDup) return;
                              updateData({
                                users: data.users.map(u => u.user === center.user ? { ...u, user: val } : u)
                              });
                              setSelectedCenterId(val);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">كلمة مرور المدير</label>
                          <input 
                            type="text" 
                            value={center.pass} 
                            onChange={(e) => {
                              updateData({
                                users: data.users.map(u => u.user === center.user ? { ...u, pass: e.target.value } : u)
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">الحد الأقصى للفروع النشطة</label>
                          <input 
                            type="number" 
                            value={center.maxBranches || 3} 
                            min="1"
                            onChange={(e) => {
                              updateData({
                                users: data.users.map(u => u.user === center.user ? { ...u, maxBranches: Number(e.target.value) || 3 } : u)
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                          />
                        </div>
                      </div>

                      {/* Financial/Contract Settings */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h6 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <DollarSign size={14} className="text-emerald-600" />
                          عقود وتراخيص المركز المالية (خاص بالمطور)
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-600 mb-1">سعر بيع السيستم والتصميم</label>
                            <input 
                              type="number" 
                              value={center.designSalePrice || 5000} 
                              onChange={(e) => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? { ...u, designSalePrice: Number(e.target.value) || 0 } : u)
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold text-indigo-700" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-600 mb-1">سعر ترخيص الفرع الواحد</label>
                            <input 
                              type="number" 
                              value={center.branchSalePrice || 1500} 
                              onChange={(e) => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? { ...u, branchSalePrice: Number(e.target.value) || 0 } : u)
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold text-blue-700" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-600 mb-1">المبلغ المحصل كاش للمطور</label>
                            <input 
                              type="number" 
                              value={center.paidAmountToDev || 0} 
                              onChange={(e) => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? { ...u, paidAmountToDev: Number(e.target.value) || 0 } : u)
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold text-emerald-600" 
                            />
                          </div>
                        </div>

                        {/* Developer Contract Invoices Generator */}
                        <div className="border-t border-slate-200 pt-3 space-y-2.5">
                          <span className="text-[11px] font-extrabold text-slate-800 block">
                            📑 سندات ودفعات التعاقد والتصميم المالي:
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newContractInv = {
                                  id: `DEV-CNT-${Date.now().toString().slice(-4)}`,
                                  date: new Date().toLocaleDateString('ar-EG'),
                                  type: 'design_and_branches',
                                  designAmount: center.designSalePrice || 5000,
                                  branchPrice: center.branchSalePrice || 1500,
                                  branchesCount: data.clinics.filter(c => c.masterAdminId === center.user).length,
                                  totalAmount: (center.designSalePrice || 5000) + ((center.branchSalePrice || 1500) * data.clinics.filter(c => c.masterAdminId === center.user).length),
                                  paidAmount: center.paidAmountToDev || 0,
                                  remainingAmount: ((center.designSalePrice || 5000) + ((center.branchSalePrice || 1500) * data.clinics.filter(c => c.masterAdminId === center.user).length)) - (center.paidAmountToDev || 0),
                                  notes: 'سند تعاقد شراء وترخيص برمجيات شامل'
                                };
                                const updatedContractInvoices = [...(center.contractInvoices || []), newContractInv];
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? {
                                    ...u,
                                    contractInvoices: updatedContractInvoices
                                  } : u)
                                });
                                alert('🎉 تم توليد وحفظ سند التعاقد المالي للمركز بنجاح!');
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <Plus size={13} />
                              توليد سند تعاقد وترخيص رسمي 📜
                            </button>
                          </div>

                          {/* List of generated Contract Invoices */}
                          {center.contractInvoices && center.contractInvoices.length > 0 && (
                            <div className="space-y-1.5 mt-2">
                              {center.contractInvoices.map((cInv, idx) => (
                                <div key={cInv.id || idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-800 ml-2">{cInv.id}</span>
                                    <span className="text-slate-400 font-mono text-[10px]">{cInv.date}</span>
                                    <span className="text-indigo-600 font-bold mr-2">{cInv.totalAmount} {devCurrency}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => onOpenInvoiceModal(cInv, 'contract', center.user)}
                                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold border border-amber-200/60"
                                    >
                                      تعديل ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onPrintInvoice({ ...cInv, centerName: center.name, centerUser: center.user, isContract: true })}
                                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold border border-indigo-200/60"
                                    >
                                      طباعة 🖨️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setContractToDelete({ centerUser: center.user, invId: cInv.id });
                                      }}
                                      className="p-1 text-red-500 hover:text-red-700 bg-red-50 rounded"
                                    >
                                      <Trash size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ☁️ إدارة السحابة والتخزين للمركز (Center Cloud & Storage Manager) */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 mt-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Cloud className="text-indigo-600" size={20} />
                            <h6 className="font-extrabold text-slate-800 text-xs">إدارة السحابة والتخزين للمركز الرئيسي وفروعه (Center Cloud & Storage Manager)</h6>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={center.customCloudEnabled || false}
                              onChange={e => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? {
                                    ...u,
                                    customCloudEnabled: e.target.checked
                                  } : u)
                                });
                              }}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="mr-2 text-xs font-bold text-slate-700">
                              {center.customCloudEnabled ? 'سحابة مخصصة مفعلة ✅' : 'استخدام سحابة النظام العامة'}
                            </span>
                          </label>
                        </div>

                        {center.customCloudEnabled && (() => {
                          const firebaseDefaultConfig = {
                            apiKey: 'AIzaSyDYAt4D7h8EGJlP9aL8r11mTtOcFXBKVx8',
                            projectId: 'beauty-center-40ee0',
                            databaseURL: 'https://beauty-center-40ee0-default-rtdb.firebaseio.com'
                          };

                          const cloudConfig = {
                            databaseProvider: center.cloudConfig?.databaseProvider || 'firebase',
                            storageProvider: center.cloudConfig?.storageProvider || 'local',
                            firebaseConfig: {
                              apiKey: center.cloudConfig?.firebaseConfig?.apiKey || firebaseDefaultConfig.apiKey,
                              projectId: center.cloudConfig?.firebaseConfig?.projectId || firebaseDefaultConfig.projectId,
                              databaseURL: center.cloudConfig?.firebaseConfig?.databaseURL || firebaseDefaultConfig.databaseURL,
                            },
                            localServerConfig: center.cloudConfig?.localServerConfig || { apiUrl: '' },
                            cloudinaryConfig: center.cloudConfig?.cloudinaryConfig || { cloudName: '', uploadPreset: '' }
                          };

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in duration-200 text-right" dir="rtl">
                              {/* Live Connection Status Pulsing Banner */}
                              <div className="col-span-full bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 text-emerald-800 shadow-sm animate-pulse duration-[4000ms]">
                                <div className="bg-emerald-500 text-white p-1 rounded-full text-xs shrink-0 flex items-center justify-center animate-bounce mt-0.5">
                                  <Check size={14} />
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="font-extrabold text-xs">✅ النظام متصل سحابياً بقاعدة Firebase النشطة بنجاح...</p>
                                  <p className="text-[10.5px] leading-relaxed text-emerald-700">
                                    تم تحميل بيانات المزامنة تلقائياً من النظام الأساسي لربط وتكامل الفروع والمراكز بشكل حي ولحظي للمشروع النشط (<span className="font-mono font-bold">{cloudConfig.firebaseConfig.projectId}</span>).
                                  </p>
                                </div>
                              </div>

                              {/* Database Settings */}
                              <div className="space-y-4">
                                <h5 className="font-bold text-slate-700 text-xs flex items-center gap-2 border-b border-slate-50 pb-2">
                                  <Database size={16} className="text-blue-500" />
                                  قاعدة البيانات (Database)
                                </h5>
                                
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`db_provider_${center.user}`}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                      checked={cloudConfig.databaseProvider === 'firebase' || !cloudConfig.databaseProvider}
                                      onChange={() => {
                                        updateData({
                                          users: data.users.map(u => u.user === center.user ? {
                                            ...u,
                                            cloudConfig: {
                                              ...cloudConfig,
                                              databaseProvider: 'firebase'
                                            }
                                          } : u)
                                        });
                                      }}
                                    />
                                    <span className="text-xs font-bold text-slate-700">Firebase Firestore</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`db_provider_${center.user}`}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                      checked={cloudConfig.databaseProvider === 'local_sql'}
                                      onChange={() => {
                                        updateData({
                                          users: data.users.map(u => u.user === center.user ? {
                                            ...u,
                                            cloudConfig: {
                                              ...cloudConfig,
                                              databaseProvider: 'local_sql'
                                            }
                                          } : u)
                                        });
                                      }}
                                    />
                                    <span className="text-xs font-bold text-slate-700">Local SQL Server</span>
                                  </label>
                                </div>

                                {cloudConfig.databaseProvider === 'local_sql' && (
                                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Local Server API URL</label>
                                      <input 
                                        type="text" 
                                        value={cloudConfig.localServerConfig?.apiUrl || ''}
                                        onChange={e => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              cloudConfig: {
                                                ...cloudConfig,
                                                localServerConfig: {
                                                  ...cloudConfig.localServerConfig,
                                                  apiUrl: e.target.value
                                                }
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-600" 
                                        placeholder="http://localhost:8080/api"
                                      />
                                    </div>
                                  </div>
                                )}

                                {(cloudConfig.databaseProvider === 'firebase' || !cloudConfig.databaseProvider) && (
                                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Firebase API Key</label>
                                      <input 
                                        type="text" 
                                        value={cloudConfig.firebaseConfig?.apiKey || ''}
                                        onChange={e => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              cloudConfig: {
                                                ...cloudConfig,
                                                firebaseConfig: {
                                                  ...cloudConfig.firebaseConfig,
                                                  apiKey: e.target.value
                                                }
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-600 font-mono" 
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Firebase Project ID</label>
                                      <input 
                                        type="text" 
                                        value={cloudConfig.firebaseConfig?.projectId || ''}
                                        onChange={e => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              cloudConfig: {
                                                ...cloudConfig,
                                                firebaseConfig: {
                                                  ...cloudConfig.firebaseConfig,
                                                  projectId: e.target.value
                                                }
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-600 font-mono" 
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Firebase Database URL</label>
                                      <input 
                                        type="text" 
                                        value={cloudConfig.firebaseConfig?.databaseURL || ''}
                                        onChange={e => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              cloudConfig: {
                                                ...cloudConfig,
                                                firebaseConfig: {
                                                  ...cloudConfig.firebaseConfig,
                                                  databaseURL: e.target.value
                                                }
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-600 font-mono text-[10px]" 
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Storage Settings */}
                              <div className="space-y-4">
                                <h5 className="font-bold text-slate-700 text-xs flex items-center gap-2 border-b border-slate-50 pb-2">
                                  <HardDrive size={16} className="text-purple-500" />
                                  مستودع التخزين والصور (Storage)
                                </h5>
                                
                                <div className="flex flex-wrap gap-4 font-[Cairo]">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`storage_provider_${center.user}`}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                      checked={cloudConfig.storageProvider === 'local' || !cloudConfig.storageProvider}
                                      onChange={() => {
                                        updateData({
                                          users: data.users.map(u => u.user === center.user ? {
                                            ...u,
                                            cloudConfig: {
                                              ...cloudConfig,
                                              storageProvider: 'local'
                                            }
                                          } : u)
                                        });
                                      }}
                                    />
                                    <span className="text-xs font-bold text-slate-700">Local (Base64)</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`storage_provider_${center.user}`}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                      checked={cloudConfig.storageProvider === 'firebase'}
                                      onChange={() => {
                                        updateData({
                                          users: data.users.map(u => u.user === center.user ? {
                                            ...u,
                                            cloudConfig: {
                                              ...cloudConfig,
                                              storageProvider: 'firebase'
                                            }
                                          } : u)
                                        });
                                      }}
                                    />
                                    <span className="text-xs font-bold text-slate-700">Firebase Storage</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`storage_provider_${center.user}`}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                      checked={cloudConfig.storageProvider === 'cloudinary'}
                                      onChange={() => {
                                        updateData({
                                          users: data.users.map(u => u.user === center.user ? {
                                            ...u,
                                            cloudConfig: {
                                              ...cloudConfig,
                                              storageProvider: 'cloudinary'
                                            }
                                          } : u)
                                        });
                                      }}
                                    />
                                    <span className="text-xs font-bold text-slate-700">Cloudinary</span>
                                  </label>
                                </div>

                                {cloudConfig.storageProvider === 'cloudinary' && (
                                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Cloudinary Cloud Name</label>
                                      <input 
                                        type="text" 
                                        value={cloudConfig.cloudinaryConfig?.cloudName || ''}
                                        onChange={e => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              cloudConfig: {
                                                ...cloudConfig,
                                                cloudinaryConfig: {
                                                  ...cloudConfig.cloudinaryConfig,
                                                  cloudName: e.target.value
                                                }
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-600" 
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Upload Preset</label>
                                      <input 
                                        type="text" 
                                        value={cloudConfig.cloudinaryConfig?.uploadPreset || ''}
                                        onChange={e => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              cloudConfig: {
                                                ...cloudConfig,
                                                cloudinaryConfig: {
                                                  ...cloudConfig.cloudinaryConfig,
                                                  uploadPreset: e.target.value
                                                }
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-600" 
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 🛡️ المنظومة المتطورة والشاملة لضبط الصلاحيات التفصيلية للمركز */}
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h6 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                                <Shield size={16} />
                              </span>
                              المنظومة المتكاملة للتحكم في صلاحيات المركز التفصيلية
                            </h6>
                            <p className="text-xs text-slate-500 mt-1">
                              تحكم مطور شامل ودقيق في كل زر طباعة، تصدير، تحميل، تعديل، خدمة، أو إعداد يخص هذا المركز وفروعه.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                            <Sparkles size={14} className="text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-900">
                              صلاحيات غير محدودة للمطور
                            </span>
                          </div>
                        </div>

                        {/* Quick Bulk Actions */}
                        <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700">إجراءات التحكم السريعة للمركز:</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? {
                                    ...u,
                                    permissions: {
                                      ...u.permissions,
                                      printFull: true,
                                      financeFull: true,
                                      downloadFull: true,
                                      branchManagementFull: true,
                                      devDisablePrintInvoices: false,
                                      devDisablePrintReports: false,
                                      devDisablePrintPatients: false,
                                      devDisablePrintServices: false,
                                      devDisablePrintInventory: false,
                                      devDisablePrintPayroll: false,
                                      devDisablePrintQueue: false,
                                      devDisablePrintStaff: false,
                                      devDisablePrintAppointments: false,
                                      devDisablePrintExpenses: false,
                                      devDisablePrintArchive: false,
                                      devDisablePrintLoyalty: false,
                                      devDisableExportExcel: false,
                                      devDisableExportPDF: false,
                                      devDisableExportBackup: false,
                                      devDisableExportPatientsCRM: false,
                                      devDisableExportFinancials: false,
                                      devDisableExportBarcodes: false,
                                      devDisableFinanceTab: false,
                                      devDisableServicesTab: false,
                                      devDisableInventoryTab: false,
                                      devDisablePayrollTab: false,
                                      devDisableStaffTab: false,
                                      devDisableClinicsTab: false,
                                      devDisableArchiveTab: false,
                                      devDisableSettingsTab: false,
                                      devDisableAddPatient: false,
                                      devDisableEditPatient: false,
                                      devDisableDeletePatient: false,
                                      devDisableAddAppointment: false,
                                      devDisableEditAppointment: false,
                                      devDisableDeleteAppointment: false,
                                      devDisableAddInvoice: false,
                                      devDisableEditInvoice: false,
                                      devDisableDeleteInvoice: false,
                                      devDisableEditInvoiceTotals: false,
                                      devDisableEditInvoicePayments: false,
                                      devDisableEditInvoiceMethods: false,
                                      devDisableAddService: false,
                                      devDisableEditService: false,
                                      devDisableDeleteService: false,
                                      devDisableAddExpense: false,
                                      devDisableDeleteExpense: false,
                                      devDisableAddInventory: false,
                                      devDisableEditInventory: false,
                                      devDisableDeleteInventory: false,
                                      devDisableAddStaff: false,
                                      devDisableEditStaff: false,
                                      devDisableDeleteStaff: false,
                                      devDisablePayrollCalculations: false,
                                      devDisableAddBranch: false,
                                      devDisableEditBranch: false,
                                      devDisableDeleteBranch: false,
                                      devDisableVoiceCall: false,
                                      devDisableCustomDiscounts: false,
                                      devDisableLoyaltySystem: false,
                                      devDisableBackupRestore: false,
                                      devDisableActivityLogs: false,
                                      devShowInvoiceSettings: true,
                                      devShowVoiceSettings: true,
                                      devShowWhatsappSettings: true,
                                      devShowTaxSettings: true,
                                      devEnableChatbot: true,
                                      devEnableWhatsappReminders: true
                                    }
                                  } : u)
                                });
                                alert('🎉 تم تفعيل كافة الصلاحيات والأزرار والخدمات بنسبة 100% لهذا المركز!');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                            >
                              <Unlock size={13} />
                              فتح شامل وتفعيل كافة الصلاحيات (100%)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? {
                                    ...u,
                                    permissions: {
                                      ...u.permissions,
                                      devDisableExportExcel: true,
                                      devDisableExportPDF: true,
                                      devDisableExportBackup: true,
                                      devDisableDeleteInvoice: true,
                                      devDisableDeletePatient: true,
                                      devDisableDeleteStaff: true,
                                      devDisableDeleteService: true,
                                      devDisableDeleteInventory: true,
                                      devDisableDeleteBranch: true,
                                      devDisableActivityLogs: true,
                                      devShowInvoiceSettings: false,
                                      devShowVoiceSettings: false,
                                      devShowWhatsappSettings: false
                                    }
                                  } : u)
                                });
                                alert('🔒 تم تطبيق قيود الأمان وتعطيل الصلاحيات الحساسة لهذا المركز');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                            >
                              <Lock size={13} />
                              تطبيق الوضع المقيد
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? {
                                    ...u,
                                    permissions: {
                                      printFull: true,
                                      financeFull: true,
                                      downloadFull: true,
                                      branchManagementFull: true,
                                      devShowInvoiceSettings: true,
                                      devShowVoiceSettings: true,
                                      devShowWhatsappSettings: true
                                    }
                                  } : u)
                                });
                                alert('⚖️ تم استعادة الضبط الافتراضي المتوازن');
                              }}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                            >
                              <RotateCcw size={13} />
                              الضبط المتوازن
                            </button>
                          </div>
                        </div>

                        {/* Helper switch component */}
                        {(() => {
                          const renderToggle = (
                            label: string,
                            desc: string,
                            isAllowed: boolean,
                            onToggle: () => void,
                            icon?: string
                          ) => (
                            <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                              <div className="flex items-start gap-2.5">
                                {icon && <span className="text-base mt-0.5">{icon}</span>}
                                <div>
                                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    {label}
                                    {isAllowed ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mr-2">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={isAllowed}
                                  onChange={onToggle}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                              </label>
                            </div>
                          );

                          const togglePerm = (permKey: keyof UserPermissions, defaultValue: boolean = true) => {
                            const currentVal = center.permissions?.[permKey];
                            const newVal = currentVal === undefined ? !defaultValue : !currentVal;
                            updateData({
                              users: data.users.map(u => u.user === center.user ? {
                                ...u,
                                permissions: {
                                  ...u.permissions,
                                  [permKey]: newVal
                                }
                              } : u)
                            });
                          };

                          return (
                            <div className="space-y-3">
                              {/* 1. Printing Permissions Accordion */}
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion('printing')}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                                      <Printer size={16} />
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-sm block">
                                        أولاً: صلاحيات أزرار الطباعة والتقارير الورقية التفصيلية
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        التحكم في ظهور أو إخفاء أي زر طباعة بالفواتير، الطابور، التقارير، والعملاء
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {[
                                        !center.permissions?.devDisablePrintInvoices,
                                        !center.permissions?.devDisablePrintReports,
                                        !center.permissions?.devDisablePrintPatients,
                                        !center.permissions?.devDisablePrintServices,
                                        !center.permissions?.devDisablePrintInventory,
                                        !center.permissions?.devDisablePrintPayroll,
                                        !center.permissions?.devDisablePrintQueue,
                                        !center.permissions?.devDisablePrintStaff,
                                        !center.permissions?.devDisablePrintAppointments,
                                        !center.permissions?.devDisablePrintExpenses,
                                        !center.permissions?.devDisablePrintArchive,
                                        !center.permissions?.devDisablePrintLoyalty
                                      ].filter(Boolean).length} / 12 مفعل
                                    </span>
                                    {activeAccordions.printing ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                  </div>
                                </button>
                                
                                {activeAccordions.printing && (
                                  <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {renderToggle(
                                        'طباعة فواتير المبيعات الحرارية (POS 80mm)',
                                        'تمكين أزرار طباعة الإيصالات والفواتير السريعة من الكاشير',
                                        !center.permissions?.devDisablePrintInvoices,
                                        () => togglePerm('devDisablePrintInvoices', false),
                                        '🧾'
                                      )}
                                      {renderToggle(
                                        'طباعة الفواتير الرسمية والضريبية (A4 & Modern)',
                                        'تمكين طباعة فواتير الحسابات الضريبية بحجم A4 المعتمد',
                                        !center.permissions?.devDisablePrintReports,
                                        () => togglePerm('devDisablePrintReports', false),
                                        '📄'
                                      )}
                                      {renderToggle(
                                        'طباعة تذاكر وكوبونات طابور الانتظار',
                                        'تمكين زر طباعة رقم العميل وتذكرة حجز الطابور اليومي',
                                        !center.permissions?.devDisablePrintQueue,
                                        () => togglePerm('devDisablePrintQueue', false),
                                        '🎫'
                                      )}
                                      {renderToggle(
                                        'طباعة التقارير المالية وكشوف الخزينة والأرباح',
                                        'تمكين طباعة تقارير المبيعات التفصيلية والمصروفات والأرباح',
                                        !center.permissions?.devDisablePrintReports,
                                        () => togglePerm('devDisablePrintReports', false),
                                        '📊'
                                      )}
                                      {renderToggle(
                                        'طباعة سجلات وملفات العملاء والولاء',
                                        'تمكين طباعة كشوفات العملاء، تاريخ الجلسات وبطاقات العضوية',
                                        !center.permissions?.devDisablePrintPatients,
                                        () => togglePerm('devDisablePrintPatients', false),
                                        '👥'
                                      )}
                                      {renderToggle(
                                        'طباعة كشوفات جرد المستودع وأرصدة المنتجات',
                                        'تمكين طباعة قوائم المستحضرات، الأرصدة الحالية وتقييم المخزون',
                                        !center.permissions?.devDisablePrintInventory,
                                        () => togglePerm('devDisablePrintInventory', false),
                                        '📦'
                                      )}
                                      {renderToggle(
                                        'طباعة مسير الرواتب وقسائم صرف المستحقات',
                                        'تمكين طباعة مسير رواتب الكادر والعمولات وسندات الصرف',
                                        !center.permissions?.devDisablePrintPayroll,
                                        () => togglePerm('devDisablePrintPayroll', false),
                                        '💵'
                                      )}
                                      {renderToggle(
                                        'طباعة قائمة وباقات الخدمات والأسعار المعتمدة',
                                        'تمكين طباعة بروشور الخدمات والأسعار للعملاء وللاستقبال',
                                        !center.permissions?.devDisablePrintServices,
                                        () => togglePerm('devDisablePrintServices', false),
                                        '💄'
                                      )}
                                      {renderToggle(
                                        'طباعة جدول المواعيد والتقويم اليومي',
                                        'تمكين طباعة جدول حجوزات اليوم والغرف والخبراء',
                                        !center.permissions?.devDisablePrintAppointments,
                                        () => togglePerm('devDisablePrintAppointments', false),
                                        '📅'
                                      )}
                                      {renderToggle(
                                        'طباعة سندات الصرف ومصروفات الخزينة',
                                        'تمكين طباعة إيصالات المصاريف النثرية وعمليات السحب',
                                        !center.permissions?.devDisablePrintExpenses,
                                        () => togglePerm('devDisablePrintExpenses', false),
                                        '💸'
                                      )}
                                      {renderToggle(
                                        'طباعة سجلات الأرشيف والعمليات السابقة',
                                        'تمكين طباعة الفواتير المؤرشفة وسجلات الفترات المنتهية',
                                        !center.permissions?.devDisablePrintArchive,
                                        () => togglePerm('devDisablePrintArchive', false),
                                        '🗄️'
                                      )}
                                      {renderToggle(
                                        'طباعة كوبونات ونقاط الولاء وبطاقات الخصم',
                                        'تمكين طباعة كروت المكافآت وكوبونات الخصم الترويجية',
                                        !center.permissions?.devDisablePrintLoyalty,
                                        () => togglePerm('devDisablePrintLoyalty', false),
                                        '🎁'
                                      )}
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                                      <div className="font-bold text-slate-700">مستوى تعميم صلاحيات الطباعة على مستوى الموظفين:</div>
                                      <select 
                                        value={center.permissions?.printFull !== false ? 'full' : 'granular'}
                                        onChange={(e) => {
                                          const isFull = e.target.value === 'full';
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: { ...u.permissions, printFull: isFull }
                                            } : u)
                                          });
                                        }}
                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer text-indigo-700"
                                      >
                                        <option value="full">فتح كامل (متاحة لكافة موظفي المركز تلقائياً)</option>
                                        <option value="granular">مقيدة (تخضع لجدول صلاحيات كل موظف على حدة)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 2. Export and Download Permissions Accordion */}
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion('export')}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                      <Download size={16} />
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-sm block">
                                        ثانياً: صلاحيات أزرار التصدير، التحميل والنسخ الاحتياطي
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        التحكم في تصدير ملفات Excel، تقارير PDF، وتنزيل واستعادة النسخ الاحتياطية
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      {[
                                        !center.permissions?.devDisableExportExcel,
                                        !center.permissions?.devDisableExportPDF,
                                        !center.permissions?.devDisableExportBackup,
                                        !center.permissions?.devDisableExportPatientsCRM,
                                        !center.permissions?.devDisableExportFinancials,
                                        !center.permissions?.devDisableExportBarcodes
                                      ].filter(Boolean).length} / 6 مفعل
                                    </span>
                                    {activeAccordions.export ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                  </div>
                                </button>
                                
                                {activeAccordions.export && (
                                  <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {renderToggle(
                                        'تصدير الجداول والكشوفات إلى ملفات Excel (.xlsx)',
                                        'تمكين أزرار التصدير المباشر لملفات الإكسيل في كافة التبويبات',
                                        !center.permissions?.devDisableExportExcel,
                                        () => togglePerm('devDisableExportExcel', false),
                                        '📗'
                                      )}
                                      {renderToggle(
                                        'تصدير التقارير والمستندات بصيغة PDF الرسمية',
                                        'تمكين أزرار حفظ وتنزيل التقارير كملفات بي دي إف بتصميم أنيق',
                                        !center.permissions?.devDisableExportPDF,
                                        () => togglePerm('devDisableExportPDF', false),
                                        '📕'
                                      )}
                                      {renderToggle(
                                        'تنزيل وتحميل النسخ الاحتياطي للنظام (.json)',
                                        'السماح لمدير المركز بتنزيل نسخة احتياطية مشفرة لكافة بيانات المركز',
                                        !center.permissions?.devDisableExportBackup,
                                        () => togglePerm('devDisableExportBackup', false),
                                        '💾'
                                      )}
                                      {renderToggle(
                                        'تصدير دليل أرقام وهواتف العملاء (CRM Export)',
                                        'تمكين تحميل ملفات أرقام هواتف العملاء للتسويق والرسائل',
                                        !center.permissions?.devDisableExportPatientsCRM,
                                        () => togglePerm('devDisableExportPatientsCRM', false),
                                        '📱'
                                      )}
                                      {renderToggle(
                                        'تصدير القوائم المالية وحسابات الخزينة المجمعة',
                                        'تمكين استخراج القوائم الختامية، الإيرادات والضرائب في ملفات مستقلة',
                                        !center.permissions?.devDisableExportFinancials,
                                        () => togglePerm('devDisableExportFinancials', false),
                                        '💼'
                                      )}
                                      {renderToggle(
                                        'تصدير وتحميل باركود المنتجات والـ QR للمستودع',
                                        'تمكين تنزيل ملصقات الباركود والـ QR للطباعة وتتبع المستحضرات',
                                        !center.permissions?.devDisableExportBarcodes,
                                        () => togglePerm('devDisableExportBarcodes', false),
                                        '🏷️'
                                      )}
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                                      <div className="font-bold text-slate-700">مستوى تعميم صلاحية التصدير والتحميل:</div>
                                      <select 
                                        value={center.permissions?.downloadFull !== false ? 'full' : 'granular'}
                                        onChange={(e) => {
                                          const isFull = e.target.value === 'full';
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: { ...u.permissions, downloadFull: isFull }
                                            } : u)
                                          });
                                        }}
                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer text-emerald-700"
                                      >
                                        <option value="full">مفتوحة (متاحة لكافة موظفي المركز)</option>
                                        <option value="granular">مقيدة (تخضع لصلاحية تصدير البيانات لكل موظف)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 3. Financial and Invoice Permissions Accordion */}
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion('finance')}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                                      <DollarSign size={16} />
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-sm block">
                                        ثالثاً: صلاحيات إدارة الفواتير، الخزينة والعمليات المالية الحساسة
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        التحكم الدقيق في تعديل وحذف الفواتير، تغيير الإجمالي، المدفوع، والمصروفات
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                      {[
                                        !center.permissions?.devDisableFinanceTab,
                                        !center.permissions?.devDisableAddInvoice,
                                        !center.permissions?.devDisableEditInvoice,
                                        !center.permissions?.devDisableDeleteInvoice,
                                        !center.permissions?.devDisableEditInvoiceTotals,
                                        !center.permissions?.devDisableEditInvoicePayments,
                                        !center.permissions?.devDisableEditInvoiceMethods,
                                        !center.permissions?.devDisableAddExpense
                                      ].filter(Boolean).length} / 8 مفعل
                                    </span>
                                    {activeAccordions.finance ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                  </div>
                                </button>
                                
                                {activeAccordions.finance && (
                                  <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {renderToggle(
                                        'ظهور قسم الحسابات والمالية العام',
                                        'تمكين أو إخفاء تبويب الخزينة والمالية بالكامل لجميع المستخدمين',
                                        !center.permissions?.devDisableFinanceTab,
                                        () => togglePerm('devDisableFinanceTab', false),
                                        '💰'
                                      )}
                                      {renderToggle(
                                        'إنشاء وإصدار فواتير بيع وجلسات جديدة',
                                        'السماح بتسجيل جلسات وفواتير جديدة للعملاء',
                                        !center.permissions?.devDisableAddInvoice,
                                        () => togglePerm('devDisableAddInvoice', false),
                                        '➕'
                                      )}
                                      {renderToggle(
                                        'تعديل الفواتير المعتمدة وإعادة فتحها',
                                        'السماح بتعديل بيانات الفواتير المحفوظة وتحديث بنودها',
                                        !center.permissions?.devDisableEditInvoice,
                                        () => togglePerm('devDisableEditInvoice', false),
                                        '✏️'
                                      )}
                                      {renderToggle(
                                        'حذف الفواتير وسجلات المبيعات (حساس)',
                                        'السماح بحذف الفواتير نهائياً من سجلات الخزينة والمبيعات',
                                        !center.permissions?.devDisableDeleteInvoice,
                                        () => togglePerm('devDisableDeleteInvoice', false),
                                        '🗑️'
                                      )}
                                      {renderToggle(
                                        'تعديل إجمالي الفاتورة وقيم الخصم الممنوح',
                                        'السماح بتعديل سعر الخدمات والخصومات يدوياً داخل الفاتورة',
                                        !center.permissions?.devDisableEditInvoiceTotals,
                                        () => togglePerm('devDisableEditInvoiceTotals', false),
                                        '🏷️'
                                      )}
                                      {renderToggle(
                                        'تعديل المبلغ المدفوع والمستلم والمتبقي والآجل',
                                        'السماح بتسجيل مبالغ جزئية وتعديل المتبقي كحساب آجل على العميل',
                                        !center.permissions?.devDisableEditInvoicePayments,
                                        () => togglePerm('devDisableEditInvoicePayments', false),
                                        '💳'
                                      )}
                                      {renderToggle(
                                        'تعديل طريقة الدفع وخزينة التحصيل',
                                        'السماح باختيار وتغيير الخزينة (كاش، فيزا، شبكة، إنستاباي)',
                                        !center.permissions?.devDisableEditInvoiceMethods,
                                        () => togglePerm('devDisableEditInvoiceMethods', false),
                                        '🏦'
                                      )}
                                      {renderToggle(
                                        'تسجيل المصروفات وسندات صرف الخزينة',
                                        'تمكين إضافة مصاريف تشغيلية ونثرية وخصمها من الخزينة اليومية',
                                        !center.permissions?.devDisableAddExpense,
                                        () => togglePerm('devDisableAddExpense', false),
                                        '💸'
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 4. Services and Inventory Permissions Accordion */}
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion('services')}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                                      <Sparkles size={16} />
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-sm block">
                                        رابعاً: صلاحيات الخدمات وباقات التجميل والمستودع والمخازن
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        التحكم في إضافة وتعديل وحذف الخدمات، الأسعار، والمستحضرات بالمستودع
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                      {[
                                        !center.permissions?.devDisableServicesTab,
                                        !center.permissions?.devDisableInventoryTab,
                                        !center.permissions?.devDisableAddService,
                                        !center.permissions?.devDisableEditService,
                                        !center.permissions?.devDisableDeleteService,
                                        !center.permissions?.devDisableAddInventory,
                                        !center.permissions?.devDisableEditInventory,
                                        !center.permissions?.devDisableCustomDiscounts
                                      ].filter(Boolean).length} / 8 مفعل
                                    </span>
                                    {activeAccordions.services ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                  </div>
                                </button>
                                
                                {activeAccordions.services && (
                                  <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {renderToggle(
                                        'ظهور قسم الخدمات والأسعار',
                                        'تمكين أو إخفاء تبويب قائمة الخدمات للفرع والمركز',
                                        !center.permissions?.devDisableServicesTab,
                                        () => togglePerm('devDisableServicesTab', false),
                                        '💄'
                                      )}
                                      {renderToggle(
                                        'ظهور قسم المستودع والمخزون',
                                        'تمكين أو إخفاء تبويب مستودع المستحضرات والمنتجات',
                                        !center.permissions?.devDisableInventoryTab,
                                        () => togglePerm('devDisableInventoryTab', false),
                                        '📦'
                                      )}
                                      {renderToggle(
                                        'إضافة خدمات وباقات تجميل جديدة',
                                        'السماح لمدير المركز بإنشاء خدمات وباقات وتسعيرها',
                                        !center.permissions?.devDisableAddService,
                                        () => togglePerm('devDisableAddService', false),
                                        '➕'
                                      )}
                                      {renderToggle(
                                        'تعديل أسعار وتفاصيل باقات الخدمات',
                                        'السماح بتعديل قوائم الأسعار والمدة الزمنية للخدمات',
                                        !center.permissions?.devDisableEditService,
                                        () => togglePerm('devDisableEditService', false),
                                        '✏️'
                                      )}
                                      {renderToggle(
                                        'حذف الخدمات وباقات التجميل',
                                        'السماح بحذف الخدمات غير المتاحة من قائمة المركز',
                                        !center.permissions?.devDisableDeleteService,
                                        () => togglePerm('devDisableDeleteService', false),
                                        '🗑️'
                                      )}
                                      {renderToggle(
                                        'إضافة منتجات ومستحضرات للمستودع',
                                        'السماح بتسجيل منتجات جديدة وتحديد الباركود وسعر الشراء والبيع',
                                        !center.permissions?.devDisableAddInventory,
                                        () => togglePerm('devDisableAddInventory', false),
                                        '🛍️'
                                      )}
                                      {renderToggle(
                                        'تعديل أرصدة وتكاليف وتواريخ صلاحية المخزون',
                                        'السماح بتسوية الأرصدة وجرد المنتجات وتعديل التكاليف',
                                        !center.permissions?.devDisableEditInventory,
                                        () => togglePerm('devDisableEditInventory', false),
                                        '📊'
                                      )}
                                      {renderToggle(
                                        'منح خصومات يدوية مخصصة للعملاء',
                                        'تمكين تطبيق خصومات مئوية أو ثابتة إضافية للعملاء',
                                        !center.permissions?.devDisableCustomDiscounts,
                                        () => togglePerm('devDisableCustomDiscounts', false),
                                        '🎁'
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 5. Staff, Payroll, and Branches Permissions Accordion */}
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion('staff')}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                      <Users size={16} />
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-sm block">
                                        خامساً: صلاحيات الموظفين، الرواتب، العمولات وإدارة الفروع
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        التحكم في إضافة وتعديل الكادر، صرف الرواتب، وحسابات الفروع وساعات العمل
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                      {[
                                        !center.permissions?.devDisableStaffTab,
                                        !center.permissions?.devDisablePayrollTab,
                                        !center.permissions?.devDisableAddStaff,
                                        !center.permissions?.devDisableEditStaff,
                                        !center.permissions?.devDisableDeleteStaff,
                                        !center.permissions?.devDisablePayrollCalculations,
                                        !center.permissions?.devDisableAddBranch,
                                        !center.permissions?.devDisableEditBranch,
                                        !center.permissions?.devDisableAddAppointment,
                                        !center.permissions?.devDisableEditAppointment
                                      ].filter(Boolean).length} / 10 مفعل
                                    </span>
                                    {activeAccordions.staff ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                  </div>
                                </button>
                                
                                {activeAccordions.staff && (
                                  <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {renderToggle(
                                        'ظهور قسم دليل الموظفين والخبراء',
                                        'تمكين أو إخفاء تبويب الموظفين وتقييم الأداء',
                                        !center.permissions?.devDisableStaffTab,
                                        () => togglePerm('devDisableStaffTab', false),
                                        '👥'
                                      )}
                                      {renderToggle(
                                        'ظهور قسم مسير الرواتب والعمولات',
                                        'تمكين أو إخفاء تبويب حسابات الرواتب والسلف والعمولات',
                                        !center.permissions?.devDisablePayrollTab,
                                        () => togglePerm('devDisablePayrollTab', false),
                                        '💵'
                                      )}
                                      {renderToggle(
                                        'تمكين إضافة موظفين وكوادر جديدة',
                                        'السماح بإنشاء مستخدمين وموظفين جدد وتعيين أدوارهم',
                                        !center.permissions?.devDisableAddStaff,
                                        () => togglePerm('devDisableAddStaff', false),
                                        '➕'
                                      )}
                                      {renderToggle(
                                        'تمكين تعديل بيانات وحسابات الموظفين',
                                        'السماح بتعديل كلمات المرور والصلاحيات والنسب',
                                        !center.permissions?.devDisableEditStaff,
                                        () => togglePerm('devDisableEditStaff', false),
                                        '✏️'
                                      )}
                                      {renderToggle(
                                        'تمكين حذف الموظفين من النظام',
                                        'السماح بحذف أو تعطيل حسابات الموظفين نهائياً',
                                        !center.permissions?.devDisableDeleteStaff,
                                        () => togglePerm('devDisableDeleteStaff', false),
                                        '🗑️'
                                      )}
                                      {renderToggle(
                                        'احتساب وصرف الرواتب والعمولات والسلف',
                                        'السماح بتسجيل عمليات الصرف والخصومات والمكافآت',
                                        !center.permissions?.devDisablePayrollCalculations,
                                        () => togglePerm('devDisablePayrollCalculations', false),
                                        '📊'
                                      )}
                                      {renderToggle(
                                        'تمكين إضافة فروع جديدة للمركز',
                                        'السماح بإنشاء فروع جديدة حتى الحد الأقصى المرخص للمركز',
                                        !center.permissions?.devDisableAddBranch,
                                        () => togglePerm('devDisableAddBranch', false),
                                        '🏢'
                                      )}
                                      {renderToggle(
                                        'تمكين تعديل بيانات وساعات عمل الفروع',
                                        'السماح لمدراء الفروع بتعديل معلومات الفرع والهواتف وساعات العمل',
                                        !center.permissions?.devDisableEditBranch,
                                        () => togglePerm('devDisableEditBranch', false),
                                        '🕒'
                                      )}
                                      {renderToggle(
                                        'حجز مواعيد وجلسات جديدة في التقويم',
                                        'تمكين تسجيل حجوزات مستقبلية للعملاء وربطها بالخبراء',
                                        !center.permissions?.devDisableAddAppointment,
                                        () => togglePerm('devDisableAddAppointment', false),
                                        '📅'
                                      )}
                                      {renderToggle(
                                        'تعديل وتأكيد وإلغاء المواعيد',
                                        'السماح بتغيير توقيت المواعيد ونقلها بين الغرف والخبراء',
                                        !center.permissions?.devDisableEditAppointment,
                                        () => togglePerm('devDisableEditAppointment', false),
                                        '⏰'
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 6. Advanced Settings, AI, WhatsApp & Integrations Accordion */}
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion('advanced')}
                                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                                      <Settings size={16} />
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-sm block">
                                        سادساً: إعدادات الظهور، الواتساب، النداء الصوتي والذكاء الاصطناعي
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        التحكم في ظهور أزرار التخصيص، نظام النداء، الشات بوت، وسجلات التدقيق
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                                      {[
                                        !center.permissions?.devDisableVoiceCall,
                                        center.permissions?.devEnableChatbot === true,
                                        center.permissions?.devEnableWhatsappReminders === true,
                                        center.permissions?.devShowInvoiceSettings !== false,
                                        center.permissions?.devShowVoiceSettings !== false,
                                        center.permissions?.devShowWhatsappSettings !== false,
                                        center.permissions?.devShowTaxSettings !== false,
                                        !center.permissions?.devDisableActivityLogs,
                                        !center.permissions?.devDisableLoyaltySystem
                                      ].filter(Boolean).length} / 9 مفعل
                                    </span>
                                    {activeAccordions.advanced ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                  </div>
                                </button>
                                
                                {activeAccordions.advanced && (
                                  <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {renderToggle(
                                        'نظام النداء الصوتي الآلي لغرف التجميل والانتظار',
                                        'تمكين ميزة النداء الصوتي الآلي المباشر باسم العميل والخدمة',
                                        !center.permissions?.devDisableVoiceCall,
                                        () => togglePerm('devDisableVoiceCall', false),
                                        '📢'
                                      )}
                                      {renderToggle(
                                        'المساعد الذكي والشات بوت بالذكاء الاصطناعي (AI)',
                                        'تفعيل شات بوت التجميل والمساعد الذكي لخدمة العملاء والإدارة',
                                        center.permissions?.devEnableChatbot === true,
                                        () => togglePerm('devEnableChatbot', true),
                                        '🤖'
                                      )}
                                      {renderToggle(
                                        'نظام التذكيرات والرسائل عبر الواتساب',
                                        'تفعيل قنوات إرسال تذكيرات المواعيد والفواتير عبر واتساب',
                                        center.permissions?.devEnableWhatsappReminders === true,
                                        () => togglePerm('devEnableWhatsappReminders', true),
                                        '💬'
                                      )}
                                      {renderToggle(
                                        'تخصيص قالب الفواتير وكود الـ QR للمركز',
                                        'إظهار زر تخصيص ترويسة وشعار وشروط الفاتورة والـ QR لمدير المركز',
                                        center.permissions?.devShowInvoiceSettings !== false,
                                        () => togglePerm('devShowInvoiceSettings', true),
                                        '🔲'
                                      )}
                                      {renderToggle(
                                        'إظهار زر إعدادات النداء الصوتي للمركز',
                                        'السماح لمدير المركز بضبط لغة، سرعة، نبرة ونصوص النداء الصوتي',
                                        center.permissions?.devShowVoiceSettings !== false,
                                        () => togglePerm('devShowVoiceSettings', true),
                                        '🔊'
                                      )}
                                      {renderToggle(
                                        'إظهار زر إعدادات بوابة ورسائل الواتساب',
                                        'السماح لمدير المركز بربط رقم الواتساب وتخصيص قوالب الرسائل',
                                        center.permissions?.devShowWhatsappSettings !== false,
                                        () => togglePerm('devShowWhatsappSettings', true),
                                        '📲'
                                      )}
                                      {renderToggle(
                                        'ظهور إعدادات الضرائب والرقم الضريبي والـ ZATCA',
                                        'تمكين ضبط نسبة ضريبة القيمة المضافة والسجل التجاري',
                                        center.permissions?.devShowTaxSettings !== false,
                                        () => togglePerm('devShowTaxSettings', true),
                                        '🏛️'
                                      )}
                                      {renderToggle(
                                        'سجل تدقيق وحركات النظام (Audit Activity Logs)',
                                        'تسجيل واستعراض جميع الحركات والتعديلات التي يقوم بها الموظفون',
                                        !center.permissions?.devDisableActivityLogs,
                                        () => togglePerm('devDisableActivityLogs', false),
                                        '📋'
                                      )}
                                      {renderToggle(
                                        'نظام نقاط الولاء والمكافآت التلقائي',
                                        'احتساب نقاط المكافآت التلقائية لكل جلسة وتطبيق خصومات الولاء',
                                        !center.permissions?.devDisableLoyaltySystem,
                                        () => togglePerm('devDisableLoyaltySystem', false),
                                        '⭐'
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 📜 مركز إصدار ومتابعة فواتير الاشتراكات والتراخيص */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mt-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h6 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Receipt size={14} className="text-indigo-600" />
                            سجل فواتير الاشتراكات وتجديد التراخيص السحابية للمركز
                          </h6>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            اشتراكات وترخيص
                          </span>
                        </div>

                        {/* Subscription Invoice Generation Form */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                          <span className="text-[11px] font-bold text-slate-700 block">إصدار فاتورة اشتراك / تمديد ترخيص جديد:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">مدة الاشتراك</label>
                              <select 
                                value={subMonths}
                                onChange={e => setSubMonths(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-indigo-600"
                              >
                                <option value="1">شهر واحد (1 Month)</option>
                                <option value="3">3 أشهر (Quarterly)</option>
                                <option value="6">6 أشهر (Semi-Annual)</option>
                                <option value="12">سنة كاملة (1 Year)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">قيمة الفاتورة المطلوبة</label>
                              <input 
                                type="number" 
                                placeholder="المبلغ" 
                                value={subAmount}
                                onChange={e => setSubAmount(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">حالة الدفع والتحصيل</label>
                              <select 
                                value={subStatus}
                                onChange={e => setSubStatus(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-indigo-600"
                              >
                                <option value="paid">مدفوع كاش ومستلم ✅</option>
                                <option value="pending">آجل / معلق ⏳</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newInv = {
                                id: `SUB-${Date.now().toString().slice(-6)}`,
                                date: new Date().toLocaleDateString('ar-EG'),
                                months: subMonths,
                                amount: subAmount,
                                paymentStatus: subStatus,
                                notes: `تجديد ترخيص سحابي لمدة ${subMonths} أشهر`
                              };

                              const currentExpiry = center.expiryDate && new Date(center.expiryDate).getTime() > Date.now() 
                                ? new Date(center.expiryDate) 
                                : new Date();
                              
                              const targetExpiry = new Date(currentExpiry);
                              targetExpiry.setMonth(targetExpiry.getMonth() + subMonths);

                              const updatedInvoices = [...(center.subscriptionInvoices || []), newInv];
                              updateData({
                                users: data.users.map(u => u.user === center.user ? {
                                  ...u,
                                  expiryDate: targetExpiry.toISOString(),
                                  subscriptionInvoices: updatedInvoices
                                } : u)
                              });

                              alert(`🎉 تم إصدار فاتورة الاشتراك بنجاح وتلقائياً تم تمديد صلاحية المركز لغاية: ${targetExpiry.toLocaleDateString('ar-EG')}`);
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} />
                            إصدار الفاتورة وترخيص الاشتراك الآن
                          </button>
                        </div>

                        {/* Invoices List Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                          <table className="w-full text-xs text-right text-slate-800">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold">
                              <tr>
                                <th className="p-2.5">رقم الفاتورة</th>
                                <th className="p-2.5">التاريخ</th>
                                <th className="p-2.5">المدة</th>
                                <th className="p-2.5">المبلغ</th>
                                <th className="p-2.5">الحالة</th>
                                <th className="p-2.5 text-center">خيارات التفعيل والتحكم</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              {(!center.subscriptionInvoices || center.subscriptionInvoices.length === 0) ? (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-slate-400 font-bold font-[Cairo]">
                                    لا توجد فواتير اشتراكات مسجلة لهذا المركز بعد.
                                  </td>
                                </tr>
                              ) : (
                                center.subscriptionInvoices.map((inv, idx) => (
                                  <tr key={inv.id || idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2.5 font-bold text-slate-700">{inv.id}</td>
                                    <td className="p-2.5 text-slate-600">{inv.date}</td>
                                    <td className="p-2.5 text-slate-800 font-[Cairo]">{inv.months} أشهر</td>
                                    <td className="p-2.5 font-extrabold text-slate-900">{inv.amount} {data.clinics[0]?.currency || 'EGP'}</td>
                                    <td className="p-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {inv.paymentStatus === 'paid' ? 'مدفوع' : 'آجل'}
                                      </span>
                                    </td>
                                    <td className="p-2.5 flex items-center justify-center gap-1.5 no-print">
                                      <button
                                        type="button"
                                        onClick={() => onOpenInvoiceModal(inv, 'subscription', center.user)}
                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md font-bold text-[10px] flex items-center gap-1 border border-amber-200/50 transition-colors"
                                      >
                                        <Edit size={11} />
                                        تعديل ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onPrintInvoice({ ...inv, centerName: center.name, centerUser: center.user, expiryDate: center.expiryDate, maxBranches: center.maxBranches })}
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200/50"
                                      >
                                        <Receipt size={11} />
                                        طباعة تفعيل 🖨️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const text = `مرحباً ${center.name}،\nلقد تم تفعيل اشتراككم بنجاح في "نظام إدارة مراكز التجميل والعناية".\n\nتفاصيل الترخيص والتفعيل:\n- المركز الرئيسي: ${center.name}\n- اسم المستخدم: ${center.user}\n- تاريخ انتهاء الصلاحية: ${center.expiryDate ? new Date(center.expiryDate).toLocaleDateString('ar-EG') : 'غير محدد'}\n- الحد الأقصى للفروع: ${center.maxBranches || 3} فروع\n- قيمة الفاتورة: ${inv.amount} ${data.clinics[0]?.currency || 'EGP'}\n- مدة التفعيل: ${inv.months} أشهر\n- تاريخ الحركة: ${inv.date}\n- حالة الدفع: ${inv.paymentStatus === 'paid' ? 'مستلم ومسدد' : 'آجل'}\n\nشكراً لاختياركم خدماتنا!`;
                                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] flex items-center gap-1 border border-emerald-200/50"
                                      >
                                        إرسال واتساب 💬
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInvoiceToDelete({ centerUser: center.user, invId: inv.id });
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700 bg-red-50 rounded-md transition-colors"
                                      >
                                        <Trash size={12} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ⚠️ Custom Contract Deletion Modal */}
      {contractToDelete && (
        <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-[Cairo]" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white text-right">
              <h4 className="font-extrabold text-base flex items-center gap-2 m-0">
                <span>⚠️ تأكيد حذف سند التعاقد</span>
              </h4>
            </div>
            <div className="p-6 text-right space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                هل أنت متأكد من حذف سند التعاقد ذي الرقم <strong className="text-rose-600 font-mono">"{contractToDelete.invId}"</strong>؟
              </p>
              <p className="text-xs text-slate-500">
                ملاحظة: هذا الإجراء سيقوم بإزالة سند التعاقد من السجلات والتقارير المالية للمطور بشكل نهائي.
              </p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setContractToDelete(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const { centerUser, invId } = contractToDelete;
                  updateData({
                    users: data.users.map(u => u.user === centerUser ? {
                      ...u,
                      contractInvoices: (u.contractInvoices || []).filter(i => i.id !== invId)
                    } : u)
                  });
                  setContractToDelete(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                تأكيد الحذف 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Custom Subscription Invoice Deletion Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-[Cairo]" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white text-right">
              <h4 className="font-extrabold text-base flex items-center gap-2 m-0">
                <span>⚠️ تأكيد حذف فاتورة تفعيل الاشتراك</span>
              </h4>
            </div>
            <div className="p-6 text-right space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                هل أنت متأكد من حذف فاتورة الاشتراك ذات الرقم <strong className="text-rose-600 font-mono">"{invoiceToDelete.invId}"</strong>؟
              </p>
              <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                تنبيه: لن يتأثر تاريخ انتهاء الصلاحية الحالي للمركز نتيجة حذف الفاتورة. ولكن سيتم مسحها من تقارير الإيرادات.
              </p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const { centerUser, invId } = invoiceToDelete;
                  updateData({
                    users: data.users.map(u => u.user === centerUser ? {
                      ...u,
                      subscriptionInvoices: (u.subscriptionInvoices || []).filter(i => i.id !== invId)
                    } : u)
                  });
                  setInvoiceToDelete(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                تأكيد الحذف 🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
