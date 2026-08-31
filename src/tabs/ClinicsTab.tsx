import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Building2, Save, MapPin, Receipt, Phone, Calculator, Plus, X, Database, Download, ShieldCheck, MessageSquare, Trash2 } from 'lucide-react';
import { Clinic } from '../types';
import { BackupManager } from '../components/BackupManager';
import { InvoiceSettingsModal } from '../components/InvoiceSettingsModal';
import { WhatsappSettingsModal } from '../components/WhatsappSettingsModal';

export default function ClinicsTab() {
  const { data, updateData, currentUser } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'backup'>('branches');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  
  // Only show the user's clinic if they are a branch admin, otherwise show all (or limited by master_admin scope, but assuming master_admin sees their own branches. Wait, clinics right now aren't tied to a specific master_admin in the schema, but let's assume they can see all or we just filter for doctor)
  const accessibleClinics = currentUser?.role === 'developer'
    ? data.clinics
    : currentUser?.role === 'master_admin'
      ? data.clinics.filter(c => c.masterAdminId === currentUser.user)
      : data.clinics.filter(c => c.id === currentUser?.clinicId);

  const [clinics, setClinics] = useState<Clinic[]>(accessibleClinics);
  const initialSelected = currentUser?.role === 'doctor' ? accessibleClinics[0] : null;
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(initialSelected);

  // Sync accessibleClinics when data.clinics changes
  React.useEffect(() => {
    const updated = currentUser?.role === 'developer'
      ? data.clinics
      : currentUser?.role === 'master_admin'
        ? data.clinics.filter(c => c.masterAdminId === currentUser.user)
        : data.clinics.filter(c => c.id === currentUser?.clinicId);
    setClinics(updated);
  }, [data.clinics, currentUser]);

  // Form states
  const [name, setName] = useState(initialSelected?.name || '');
  const [docName, setDocName] = useState(initialSelected?.docName || '');
  const [currency, setCurrency] = useState(initialSelected?.currency || '');
  const [taxId, setTaxId] = useState(initialSelected?.taxId || '');
  const [vatRate, setVatRate] = useState<number>(initialSelected?.vatRate || 0);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSelected?.whatsappNumber || '');
  const [invoiceAddress, setInvoiceAddress] = useState(initialSelected?.invoiceAddress || '');
  const [masterAdminId, setMasterAdminId] = useState(initialSelected?.masterAdminId || '');

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };

  const center = getCenterForUser();
  const maxBranches = currentUser?.role === 'developer' ? Infinity : (center?.maxBranches || 1);
  const canAddBranch = currentUser?.role === 'developer' || (center?.permissions?.devDisableAddBranch !== true && clinics.length < maxBranches);
  const isBranchManagementAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisableEditBranch !== true && (currentUser?.role === 'master_admin' || center?.permissions?.branchManagementFull !== false));
  
  const showInvoiceSettings = currentUser?.role === 'developer' || center?.permissions?.devShowInvoiceSettings !== false;
  const showWhatsappSettings = currentUser?.role === 'developer' || center?.permissions?.devShowWhatsappSettings !== false;

  const handleSelectClinic = (c: Clinic) => {
    setSelectedClinic(c);
    setName(c.name);
    setDocName(c.docName);
    setCurrency(c.currency);
    setTaxId(c.taxId || '');
    setVatRate(c.vatRate || 0);
    setWhatsappNumber(c.whatsappNumber || '');
    setInvoiceAddress(c.invoiceAddress || '');
    setMasterAdminId(c.masterAdminId || '');
  };

  const handleDeleteSelectedClinic = (clinicToDelete: Clinic) => {
    if (!window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف الفرع "${clinicToDelete.name}" نهائياً من النظام؟\nسيتم حذف جميع السجلات والإعدادات المرتبطة به.`)) {
      return;
    }

    const updatedClinics = data.clinics.filter(c => c.id !== clinicToDelete.id);

    // Clean up clinic-specific stores
    const updatedQueue = { ...data.queue };
    delete updatedQueue[clinicToDelete.id];

    const updatedAppointments = { ...data.appointments };
    delete updatedAppointments[clinicToDelete.id];

    const updatedPharmacyStore = { ...data.pharmacyStore };
    delete updatedPharmacyStore[clinicToDelete.id];

    const updatedStaffDirectory = { ...data.staffDirectory };
    delete updatedStaffDirectory[clinicToDelete.id];

    const updatedPayrollStore = { ...data.payrollStore };
    delete updatedPayrollStore[clinicToDelete.id];

    const updatedServices = (data.services || []).filter(s => s.clinicId !== clinicToDelete.id);
    const updatedUsers = data.users.map(u => u.clinicId === clinicToDelete.id ? { ...u, clinicId: updatedClinics[0]?.id || 'master' } : u);

    updateData({
      clinics: updatedClinics,
      queue: updatedQueue,
      appointments: updatedAppointments,
      pharmacyStore: updatedPharmacyStore,
      staffDirectory: updatedStaffDirectory,
      payrollStore: updatedPayrollStore,
      services: updatedServices,
      users: updatedUsers
    });

    if (selectedClinic?.id === clinicToDelete.id) {
      setSelectedClinic(null);
    }
    alert(`✅ تم حذف الفرع "${clinicToDelete.name}" بنجاح!`);
  };

  const handleSave = () => {
    if (!selectedClinic) return;
    
    const updatedClinics = clinics.map(c => {
      if (c.id === selectedClinic.id) {
        return {
          ...c,
          name,
          docName,
          currency,
          taxId,
          vatRate,
          whatsappNumber,
          invoiceAddress,
          masterAdminId: currentUser?.role === 'developer' ? masterAdminId : (c.masterAdminId || undefined)
        };
      }
      return c;
    });

    setClinics(updatedClinics);
    
    const globalClinics = data.clinics.map(c => {
      if (c.id === selectedClinic.id) {
        return {
          ...c,
          name,
          docName,
          currency,
          taxId,
          vatRate,
          whatsappNumber,
          invoiceAddress,
          masterAdminId: currentUser?.role === 'developer' ? masterAdminId : (c.masterAdminId || undefined)
        };
      }
      return c;
    });
    updateData({ clinics: globalClinics });
    alert("تم حفظ إعدادات الفرع بنجاح!");
    setSelectedClinic(null);
  };

  return (
    <div className="space-y-6">
      {/* Top View Selector Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full sm:w-max gap-1">
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            activeSubTab === 'branches'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Building2 size={18} />
          إدارة الفروع والعملات
        </button>
        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            activeSubTab === 'backup'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ShieldCheck size={18} className="text-emerald-600" />
          النسخ الاحتياطي والأمان السحابي
        </button>
      </div>

      {activeSubTab === 'backup' ? (
        <BackupManager />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex justify-between items-center mb-4">
                <h6 className="font-bold text-indigo-600 m-0">قائمة الفروع والمراكز</h6>
                {currentUser?.role !== 'doctor' && isBranchManagementAllowed && (
                  <button 
                    onClick={() => {
                      if (!canAddBranch) {
                        alert(`عذراً، لقد وصلت للحد الأقصى للفروع (${maxBranches})`);
                        return;
                      }
                      const newId = `clinic_${Date.now()}`;
                      const newClinic = { 
                        id: newId, 
                        name: 'فرع جديد', 
                        docName: '', 
                        currency: 'SAR', 
                        daysCount: 30, 
                        expiryDate: '',
                        masterAdminId: currentUser?.role === 'master_admin' ? currentUser.user : undefined
                      };
                      const updated = [...clinics, newClinic];
                      setClinics(updated);
                      updateData({ clinics: [...data.clinics, newClinic] });
                      handleSelectClinic(newClinic);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${canAddBranch ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    title={!canAddBranch ? 'تم الوصول للحد الأقصى' : ''}
                  >
                    <Plus size={14} /> إضافة
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {clinics.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectClinic(c)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${selectedClinic?.id === c.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 hover:border-indigo-300'}`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-3">
                        <span>العملة: {c.currency}</span>
                        <span>الضريبة: {c.vatRate || 0}%</span>
                      </div>
                    </div>
                    {isBranchManagementAllowed && currentUser?.role !== 'doctor' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelectedClinic(c);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف هذا الفرع"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-8">
            {!selectedClinic ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center text-slate-400">
                <Building2 size={48} className="mb-4 opacity-50" />
                <h6>اختر فرعاً من القائمة لضبط إعداداته</h6>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                  <h5 className="font-bold text-indigo-600 text-lg flex items-center gap-2 m-0">
                    <Building2 size={20} />
                    إعدادات الفرع: {selectedClinic.name}
                  </h5>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {showInvoiceSettings && (
                      <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-200"
                      >
                        <Receipt size={14} />
                        تخصيص الفاتورة و QR المتقدم
                      </button>
                    )}
                    {showWhatsappSettings && (
                      <button
                        onClick={() => setIsWhatsappModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-55 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors border border-emerald-200"
                      >
                        <MessageSquare size={14} className="text-emerald-600 animate-pulse" />
                        تخصيص قوالب وتذكير الواتساب
                      </button>
                    )}
                    <button onClick={() => setSelectedClinic(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">اسم الفرع / المركز</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">اسم المدير / المالك</label>
                    <input 
                      type="text" 
                      value={docName} 
                      onChange={e => setDocName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">العملة الافتراضية</label>
                    <input 
                      type="text" 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-2"><Phone size={14} /> رقم واتساب الفرع</label>
                    <input 
                      type="text" 
                      value={whatsappNumber} 
                      onChange={e => setWhatsappNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors text-left"
                      dir="ltr"
                      placeholder="+201012345678"
                    />
                  </div>
                  {currentUser?.role === 'developer' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-600 mb-1.5">المالك / المدير العام لهذا الفرع (Master Admin ID)</label>
                      <select 
                        value={masterAdminId} 
                        onChange={e => setMasterAdminId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors font-bold text-indigo-700"
                      >
                        <option value="">-- بدون مالك (غير مرتبط بأي مركز) --</option>
                        {data.users.filter(u => u.role === 'master_admin').map(u => (
                          <option key={u.user} value={u.user}>{u.name} ({u.user})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <h6 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Receipt size={18} className="text-indigo-600" />
                  إعدادات الفاتورة الضريبية والقيمة المضافة
                </h6>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-2"><MapPin size={14} /> العنوان في الفاتورة</label>
                    <input 
                      type="text" 
                      value={invoiceAddress} 
                      onChange={e => setInvoiceAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors"
                      placeholder="مثال: الرياض، حي العليا، شارع التحلية..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-2"><Receipt size={14} /> الرقم الضريبي (Tax ID)</label>
                    <input 
                      type="text" 
                      value={taxId} 
                      onChange={e => setTaxId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors"
                      placeholder="3000xxxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-2"><Calculator size={14} /> نسبة ضريبة القيمة المضافة (%)</label>
                    <input 
                      type="number" 
                      value={vatRate} 
                      onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                  <button 
                    onClick={handleSave}
                    disabled={!isBranchManagementAllowed}
                    className={`flex-1 font-bold rounded-xl py-3 shadow-sm transition-all flex items-center justify-center gap-2 w-full ${isBranchManagementAllowed ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <Save size={18} />
                    {isBranchManagementAllowed ? 'حفظ وتحديث إعدادات الفرع' : 'مغلق بطلب من مطور النظام'}
                  </button>

                  {isBranchManagementAllowed && currentUser?.role !== 'doctor' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSelectedClinic(selectedClinic)}
                      className="px-5 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Trash2 size={18} />
                      حذف الفرع 🗑️
                    </button>
                  )}
                </div>
                {!isBranchManagementAllowed && (
                  <p className="text-xs text-red-500 font-bold text-center mt-2">
                    ⚠️ لقد تم قفل تعديل وإدارة الفروع لهذا المركز من قبل المطور الرئيسي للنظام.
                  </p>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {selectedClinic && (
        <>
          <InvoiceSettingsModal
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            targetClinicId={selectedClinic.id}
          />
          <WhatsappSettingsModal
            isOpen={isWhatsappModalOpen}
            onClose={() => setIsWhatsappModalOpen(false)}
            targetClinicId={selectedClinic.id}
          />
        </>
      )}
    </div>
  );
}
