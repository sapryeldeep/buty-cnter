import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Cloud, Database, HardDrive, SlidersHorizontal, 
  Receipt, Volume2, ShieldCheck, Printer, Calendar, 
  Layers, ChevronDown, ChevronUp, Edit, Trash2, Save, 
  Plus, Check, X, RefreshCw, Building2, Phone, MessageSquare, AlertTriangle, Sparkles
} from 'lucide-react';
import { Clinic } from '../../types';

interface DeveloperSystemSettingsTabProps {
  onOpenInvoiceModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenStaffModal: () => void;
}

export const DeveloperSystemSettingsTab: React.FC<DeveloperSystemSettingsTabProps> = ({
  onOpenInvoiceModal,
  onOpenVoiceModal,
  onOpenStaffModal
}) => {
  const { data, updateData, currentUser } = useStore();

  const [globalPrintAccordionOpen, setGlobalPrintAccordionOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [isNewClinicModalOpen, setIsNewClinicModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states for branch editing/creation
  const [branchName, setBranchName] = useState('');
  const [branchDocName, setBranchDocName] = useState('');
  const [branchCurrency, setBranchCurrency] = useState('SAR');
  const [branchTaxId, setBranchTaxId] = useState('');
  const [branchTaxRate, setBranchTaxRate] = useState<number>(15);
  const [branchWhatsapp, setBranchWhatsapp] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchMessage, setBranchMessage] = useState('');
  const [branchExpiry, setBranchExpiry] = useState('');
  const [branchMasterAdmin, setBranchMasterAdmin] = useState('');

  // Custom Cloud settings for clinic (branch)
  const [branchCustomCloudEnabled, setBranchCustomCloudEnabled] = useState(false);
  const [branchDatabaseProvider, setBranchDatabaseProvider] = useState<'firebase' | 'local_sql'>('firebase');
  const [branchStorageProvider, setBranchStorageProvider] = useState<'firebase' | 'local_folder' | 'local' | 'cloudinary'>('local');
  const [branchFirebaseApiKey, setBranchFirebaseApiKey] = useState('');
  const [branchFirebaseProjectId, setBranchFirebaseProjectId] = useState('');
  const [branchFirebaseDatabaseURL, setBranchFirebaseDatabaseURL] = useState('');
  const [branchFirebaseStorageBucket, setBranchFirebaseStorageBucket] = useState('');
  const [branchLocalApiUrl, setBranchLocalApiUrl] = useState('');
  const [branchLocalStoragePath, setBranchLocalStoragePath] = useState('');
  const [branchCloudinaryName, setBranchCloudinaryName] = useState('');
  const [branchCloudinaryPreset, setBranchCloudinaryPreset] = useState('');

  const masterAdmins = data.users.filter(u => u.role === 'master_admin');

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  const handleOpenEditModal = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setBranchName(clinic.name || '');
    setBranchDocName(clinic.docName || '');
    setBranchCurrency(clinic.currency || 'SAR');
    setBranchTaxId(clinic.taxId || '');
    setBranchTaxRate(clinic.taxRate !== undefined ? clinic.taxRate : (clinic.vatRate || 15));
    setBranchWhatsapp(clinic.whatsappNumber || '');
    setBranchAddress(clinic.invoiceAddress || '');
    setBranchMessage(clinic.invoiceMessage || '');
    setBranchExpiry(clinic.expiryDate ? clinic.expiryDate.split('T')[0] : '');
    setBranchMasterAdmin(clinic.masterAdminId || '');

    // Load cloud states
    setBranchCustomCloudEnabled(clinic.customCloudEnabled || false);
    const cc = clinic.cloudConfig || { databaseProvider: 'firebase', storageProvider: 'local' };
    setBranchDatabaseProvider(cc.databaseProvider || 'firebase');
    setBranchStorageProvider(cc.storageProvider || 'local');
    setBranchFirebaseApiKey(cc.firebaseConfig?.apiKey || 'AIzaSyDYAt4D7h8EGJlP9aL8r11mTtOcFXBKVx8');
    setBranchFirebaseProjectId(cc.firebaseConfig?.projectId || 'beauty-center-40ee0');
    setBranchFirebaseDatabaseURL(cc.firebaseConfig?.databaseURL || 'https://beauty-center-40ee0-default-rtdb.firebaseio.com');
    setBranchFirebaseStorageBucket(cc.firebaseConfig?.storageBucket || '');
    setBranchLocalApiUrl(cc.localServerConfig?.apiUrl || '');
    setBranchLocalStoragePath(cc.localServerConfig?.storagePath || '');
    setBranchCloudinaryName(cc.cloudinaryConfig?.cloudName || '');
    setBranchCloudinaryPreset(cc.cloudinaryConfig?.uploadPreset || '');
  };

  const handleOpenNewModal = () => {
    setEditingClinic(null);
    setBranchName('فرع جديد');
    setBranchDocName('');
    setBranchCurrency('SAR');
    setBranchTaxId('');
    setBranchTaxRate(15);
    setBranchWhatsapp('');
    setBranchAddress('');
    setBranchMessage('شكراً لزيارتكم - نتطلع لرؤيتكم مجدداً');
    setBranchExpiry(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
    setBranchMasterAdmin(masterAdmins[0]?.user || '');

    // Default cloud states
    setBranchCustomCloudEnabled(false);
    setBranchDatabaseProvider('firebase');
    setBranchStorageProvider('local');
    setBranchFirebaseApiKey('AIzaSyDYAt4D7h8EGJlP9aL8r11mTtOcFXBKVx8');
    setBranchFirebaseProjectId('beauty-center-40ee0');
    setBranchFirebaseDatabaseURL('https://beauty-center-40ee0-default-rtdb.firebaseio.com');
    setBranchFirebaseStorageBucket('');
    setBranchLocalApiUrl('');
    setBranchLocalStoragePath('');
    setBranchCloudinaryName('');
    setBranchCloudinaryPreset('');

    setIsNewClinicModalOpen(true);
  };

  const handleSaveClinicModal = () => {
    if (!branchName.trim()) {
      alert('يرجى كتابة اسم الفرع');
      return;
    }

    const cloudConfigObj = {
      databaseProvider: branchDatabaseProvider,
      storageProvider: branchStorageProvider,
      firebaseConfig: {
        apiKey: branchFirebaseApiKey.trim(),
        projectId: branchFirebaseProjectId.trim(),
        databaseURL: branchFirebaseDatabaseURL.trim(),
        storageBucket: branchFirebaseStorageBucket.trim()
      },
      localServerConfig: {
        apiUrl: branchLocalApiUrl.trim(),
        storagePath: branchLocalStoragePath.trim()
      },
      cloudinaryConfig: {
        cloudName: branchCloudinaryName.trim(),
        uploadPreset: branchCloudinaryPreset.trim()
      }
    };

    if (editingClinic) {
      // Update existing clinic
      const updatedClinics = data.clinics.map(c => {
        if (c.id === editingClinic.id) {
          return {
            ...c,
            name: branchName.trim(),
            docName: branchDocName.trim(),
            currency: branchCurrency,
            taxId: branchTaxId.trim(),
            taxRate: Number(branchTaxRate),
            vatRate: Number(branchTaxRate),
            whatsappNumber: branchWhatsapp.trim(),
            invoiceAddress: branchAddress.trim(),
            invoiceMessage: branchMessage.trim(),
            expiryDate: branchExpiry ? new Date(branchExpiry).toISOString() : '',
            masterAdminId: branchMasterAdmin || undefined,
            customCloudEnabled: branchCustomCloudEnabled,
            cloudConfig: cloudConfigObj
          };
        }
        return c;
      });

      updateData({ clinics: updatedClinics });
      setEditingClinic(null);
      showNotification(`✅ تم تحديث بيانات الفرع "${branchName}" بنجاح!`);
    } else {
      // Create new clinic
      const newClinicId = `clinic_${Date.now()}`;
      const newClinicItem: Clinic = {
        id: newClinicId,
        name: branchName.trim(),
        docName: branchDocName.trim(),
        currency: branchCurrency,
        daysCount: 30,
        taxId: branchTaxId.trim(),
        taxRate: Number(branchTaxRate),
        vatRate: Number(branchTaxRate),
        whatsappNumber: branchWhatsapp.trim(),
        invoiceAddress: branchAddress.trim(),
        invoiceMessage: branchMessage.trim(),
        expiryDate: branchExpiry ? new Date(branchExpiry).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
        masterAdminId: branchMasterAdmin || undefined,
        customCloudEnabled: branchCustomCloudEnabled,
        cloudConfig: cloudConfigObj
      };

      updateData({ clinics: [...data.clinics, newClinicItem] });
      setIsNewClinicModalOpen(false);
      showNotification(`🎉 تم إضافة الفرع الجديد "${branchName}" بنجاح!`);
    }
  };

  const handleDeleteClinic = (clinicId: string, clinicName: string) => {
    setClinicToDelete({ id: clinicId, name: clinicName });
  };

  const confirmDeleteClinic = () => {
    if (!clinicToDelete) return;
    const { id: clinicId, name: clinicName } = clinicToDelete;

    const updatedClinics = data.clinics.filter(c => c.id !== clinicId);

    // Clean up clinic-specific stores
    const updatedQueue = { ...data.queue };
    delete updatedQueue[clinicId];

    const updatedAppointments = { ...data.appointments };
    delete updatedAppointments[clinicId];

    const updatedPharmacyStore = { ...data.pharmacyStore };
    delete updatedPharmacyStore[clinicId];

    const updatedStaffDirectory = { ...data.staffDirectory };
    delete updatedStaffDirectory[clinicId];

    const updatedPayrollStore = { ...data.payrollStore };
    delete updatedPayrollStore[clinicId];

    const updatedServices = (data.services || []).filter(s => s.clinicId !== clinicId);
    const updatedUsers = data.users.map(u => u.clinicId === clinicId ? { ...u, clinicId: updatedClinics[0]?.id || 'master' } : u);

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

    setClinicToDelete(null);
    showNotification(`🗑️ تم حذف الفرع "${clinicName}" وكافة متعلقاته بنجاح!`);
  };

  const handleQuickExtend = (clinicId: string, monthsToAdd: number) => {
    const clinic = data.clinics.find(c => c.id === clinicId);
    if (!clinic) return;

    const baseDate = clinic.expiryDate && new Date(clinic.expiryDate).getTime() > Date.now()
      ? new Date(clinic.expiryDate)
      : new Date();

    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);

    const updatedClinics = data.clinics.map(c => 
      c.id === clinicId ? { ...c, expiryDate: baseDate.toISOString() } : c
    );

    updateData({ clinics: updatedClinics });
    showNotification(`⚡ تم تمديد اشتراك الفرع "${clinic.name}" لغاية: ${baseDate.toLocaleDateString('ar-EG')}`);
  };

  const modules = data.settings?.modules || {
    patients: true, appointments: true, finance: true, services: true,
    inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
  };

  const handleModuleToggle = (key: string) => {
    updateData({
      settings: {
        ...data.settings!,
        modules: {
          ...modules,
          [key]: !(modules as any)[key]
        }
      }
    });
  };

  const handleCustomLabelChange = (key: 'patients' | 'clinics', val: string) => {
    updateData({
      settings: {
        ...data.settings!,
        customLabels: {
          ...(data.settings?.customLabels || { patients: 'العملاء', clinics: 'الفروع' }),
          [key]: val
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Global Announcements & Maintenance Mode */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Global Announcement */}
          <div className="space-y-3 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
            <label className="block text-sm font-bold text-indigo-900">رسالة إعلان عامة (تظهر لجميع المراكز)</label>
            <textarea 
              value={data.settings?.globalAnnouncement || ''}
              onChange={e => updateData({ settings: { ...data.settings!, globalAnnouncement: e.target.value } })}
              className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-none h-24"
              placeholder="مثال: سيتم تحديث النظام الليلة في تمام الساعة ١٢ منتصف الليل..."
            />
            <p className="text-xs text-indigo-600/70 font-bold">اترك الحقل فارغاً لإلغاء رسالة الإعلان.</p>
          </div>

          {/* Maintenance Mode */}
          <div className="space-y-4 bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex flex-col justify-center">
            <div>
              <label className="block text-sm font-bold text-rose-900 mb-1">وضع الصيانة الشامل</label>
              <p className="text-xs text-rose-700/80 leading-relaxed mb-4 font-bold">
                تفعيل هذا الخيار سيقوم بطرد جميع المستخدمين والمراكز من النظام فوراً، وإظهار شاشة "النظام تحت الصيانة". أنت الوحيد (المطور) الذي سيمكنه الدخول ورؤية النظام.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={data.settings?.maintenanceMode || false}
                onChange={e => updateData({ settings: { ...data.settings!, maintenanceMode: e.target.checked } })}
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
              <span className="mr-3 text-sm font-bold text-slate-700 peer-checked:text-rose-700">
                {data.settings?.maintenanceMode ? 'وضع الصيانة مُفعل 🔴' : 'وضع الصيانة معطل'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Developer Cloud & Storage Manager */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="text-indigo-600" size={24} />
          <h4 className="font-black text-lg text-slate-800">إدارة السحابة والتخزين (Developer Cloud & Storage Manager)</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Database Settings */}
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Database size={18} className="text-blue-500" />
              قاعدة البيانات (Database)
            </h5>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="db_provider"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  checked={data.settings?.cloudConfig?.databaseProvider === 'firebase' || !data.settings?.cloudConfig?.databaseProvider}
                  onChange={() => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, databaseProvider: 'firebase' } as any } })}
                />
                <span className="text-sm font-bold text-slate-700">Firebase Firestore</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="db_provider"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  checked={data.settings?.cloudConfig?.databaseProvider === 'local_sql'}
                  onChange={() => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, databaseProvider: 'local_sql' } as any } })}
                />
                <span className="text-sm font-bold text-slate-700">Local SQL Server</span>
              </label>
            </div>

            {data.settings?.cloudConfig?.databaseProvider === 'local_sql' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Local Server API URL</label>
                  <input 
                    type="text" 
                    value={data.settings?.cloudConfig?.localServerConfig?.apiUrl || ''}
                    onChange={e => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, localServerConfig: { ...data.settings?.cloudConfig?.localServerConfig, apiUrl: e.target.value } } as any } })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                    placeholder="http://localhost:8080/api"
                  />
                </div>
              </div>
            )}

            {(data.settings?.cloudConfig?.databaseProvider === 'firebase' || !data.settings?.cloudConfig?.databaseProvider) && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Firebase API Key</label>
                  <input 
                    type="text" 
                    value={data.settings?.cloudConfig?.firebaseConfig?.apiKey || ''}
                    onChange={e => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, firebaseConfig: { ...data.settings?.cloudConfig?.firebaseConfig, apiKey: e.target.value } } as any } })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Firebase Project ID</label>
                  <input 
                    type="text" 
                    value={data.settings?.cloudConfig?.firebaseConfig?.projectId || ''}
                    onChange={e => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, firebaseConfig: { ...data.settings?.cloudConfig?.firebaseConfig, projectId: e.target.value } } as any } })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Storage Settings */}
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <HardDrive size={18} className="text-purple-500" />
              مستودع التخزين والصور (Storage)
            </h5>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="storage_provider"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  checked={data.settings?.cloudConfig?.storageProvider === 'local' || !data.settings?.cloudConfig?.storageProvider}
                  onChange={() => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, storageProvider: 'local' } as any } })}
                />
                <span className="text-sm font-bold text-slate-700">Local (Base64)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="storage_provider"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  checked={data.settings?.cloudConfig?.storageProvider === 'firebase'}
                  onChange={() => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, storageProvider: 'firebase' } as any } })}
                />
                <span className="text-sm font-bold text-slate-700">Firebase Storage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="storage_provider"
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  checked={data.settings?.cloudConfig?.storageProvider === 'cloudinary'}
                  onChange={() => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, storageProvider: 'cloudinary' } as any } })}
                />
                <span className="text-sm font-bold text-slate-700">Cloudinary</span>
              </label>
            </div>

            {data.settings?.cloudConfig?.storageProvider === 'cloudinary' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cloudinary Cloud Name</label>
                  <input 
                    type="text" 
                    value={data.settings?.cloudConfig?.cloudinaryConfig?.cloudName || ''}
                    onChange={e => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, cloudinaryConfig: { ...data.settings?.cloudConfig?.cloudinaryConfig, cloudName: e.target.value } } as any } })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Upload Preset</label>
                  <input 
                    type="text" 
                    value={data.settings?.cloudConfig?.cloudinaryConfig?.uploadPreset || ''}
                    onChange={e => updateData({ settings: { ...data.settings!, cloudConfig: { ...data.settings?.cloudConfig, cloudinaryConfig: { ...data.settings?.cloudConfig?.cloudinaryConfig, uploadPreset: e.target.value } } as any } })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Modals Triggers Grid */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
        <h6 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-indigo-600"/>
          تخصيص الفواتير والنداء والصلاحيات
        </h6>
        <p className="text-xs text-slate-500 mb-4">أدوات تحكم مركزية للفواتير والضريبة والنداء الصوتي والموظفين</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={onOpenInvoiceModal}
            className="flex items-center justify-between p-3.5 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 rounded-xl transition-all font-bold text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Receipt size={16} className="text-indigo-600" />
              <div className="text-right">
                <div className="font-extrabold">إعدادات الفواتير والـ QR والضريبة</div>
                <div className="text-[10.5px] text-slate-500 font-normal">تخصيص بيانات الفروع، VAT، والشعار</div>
              </div>
            </div>
            <span className="text-indigo-600 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">←</span>
          </button>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-xl transition-all font-bold text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Volume2 size={16} className="text-emerald-600" />
              <div className="text-right">
                <div className="font-extrabold">التحكم في النداء الصوتي للعملاء</div>
                <div className="text-[10.5px] text-slate-500 font-normal">لغة النداء والنغمة وتفعيل الميكروفون</div>
              </div>
            </div>
            <span className="text-emerald-600 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">←</span>
          </button>

          <button
            onClick={onOpenStaffModal}
            className="flex items-center justify-between p-3.5 bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl transition-all font-bold text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-amber-600" />
              <div className="text-right">
                <div className="font-extrabold">صلاحيات الموظفين والمستخدمين</div>
                <div className="text-[10.5px] text-slate-500 font-normal">تحديد الصلاحيات لكل دور ومستخدم</div>
              </div>
            </div>
            <span className="text-amber-600 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">←</span>
          </button>
        </div>
      </div>

      {/* Global Print Permissions Accordion */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setGlobalPrintAccordionOpen(!globalPrintAccordionOpen)}
          className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Printer size={20} />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-base font-[Cairo]">
                المنظومة المركزية لصلاحيات الطباعة والتصدير والعمليات (مستوى النظام)
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                تفعيل وتعطيل مفاتيح التصدير والطباعة لكافة المستخدمين والفروع بضغطة زر واحدة
              </p>
            </div>
          </div>
          {globalPrintAccordionOpen ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-slate-500" />}
        </button>

        {globalPrintAccordionOpen && (
          <div className="p-6 border-t border-slate-200 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">تعطيل طباعة الفواتير لجميع الفروع</div>
                  <div className="text-[10.5px] text-slate-500">حجب أزرار طباعة الفواتير A4 والحراري</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={data.settings?.devDisablePrintInvoices || false}
                    onChange={e => updateData({ settings: { ...data.settings!, devDisablePrintInvoices: e.target.checked } })}
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">تعطيل تصدير إكسيل Excel الشامل</div>
                  <div className="text-[10.5px] text-slate-500">منع تنزيل وتصدير ملفات الإكسيل من كافة الأقسام</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={data.settings?.devDisableExportExcel || false}
                    onChange={e => updateData({ settings: { ...data.settings!, devDisableExportExcel: e.target.checked } })}
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">تعطيل تصدير وطباعة الـ PDF</div>
                  <div className="text-[10.5px] text-slate-500">حجب أزرار إصدار وحفظ التقارير بصيغة PDF</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={data.settings?.devDisableExportPDF || false}
                    onChange={e => updateData({ settings: { ...data.settings!, devDisableExportPDF: e.target.checked } })}
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">تعطيل شاشة سجل النشاط والعمليات</div>
                  <div className="text-[10.5px] text-slate-500">حجب نافذة مراقبة تحركات الموظفين</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={data.settings?.devDisableActivityLogs || false}
                    onChange={e => updateData({ settings: { ...data.settings!, devDisableActivityLogs: e.target.checked } })}
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Modules & Custom Labels */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        <h6 className="font-bold text-slate-800 flex items-center gap-2">
          <Layers size={18} className="text-indigo-600" />
          أقسام النظام والتسميات المخصصة
        </h6>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(modules).map(([key, isEnabled]) => (
            key !== 'settings' && (
              <div key={key} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                <span className="font-bold text-slate-700 text-xs capitalize">{key}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isEnabled}
                    onChange={() => handleModuleToggle(key)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            )
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">مسمى قسم العملاء</label>
            <input 
              type="text" 
              value={data.settings?.customLabels?.patients || 'العملاء'}
              onChange={e => handleCustomLabelChange('patients', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">مسمى قسم الفروع</label>
            <input 
              type="text" 
              value={data.settings?.customLabels?.clinics || 'الفروع'}
              onChange={e => handleCustomLabelChange('clinics', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Save Success Alert Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Branch Invoices, Taxes & Logo Customization */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h6 className="font-bold text-slate-800 text-base flex items-center gap-2 m-0">
              <Receipt size={20} className="text-indigo-600"/>
              إعدادات الفواتير والضريبة والشعار حسب الفرع
            </h6>
            <p className="text-xs text-slate-500 mt-1">تخصيص كامل للضريبة، الشعار، أرقام الفواتير، مع إمكانية التعديل والحذف لكل فرع</p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} />
            إضافة فرع جديد ➕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-extrabold">
              <tr>
                <th className="p-3">اسم الفرع</th>
                <th className="p-3">نسبة الضريبة %</th>
                <th className="p-3">الرقم الضريبي (Tax ID)</th>
                <th className="p-3">شعار الفرع (Logo)</th>
                <th className="p-3">رقم الواتساب للفواتير</th>
                <th className="p-3">تذييل الفاتورة</th>
                <th className="p-3 text-center min-w-[140px]">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.clinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                    لا يوجد أي فروع مسجلة حالياً. اضغط على زر "إضافة فرع جديد" للبدء.
                  </td>
                </tr>
              ) : data.clinics.map(clinic => {
                return (
                  <tr key={clinic.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-extrabold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        <div>
                          <div>{clinic.name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">العملة: {clinic.currency || 'SAR'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-24 font-bold text-slate-800"
                        value={clinic.taxRate !== undefined ? clinic.taxRate : (clinic.vatRate || 15)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, taxRate: val, vatRate: val } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-44 font-mono text-xs"
                        value={clinic.taxId || ''}
                        placeholder="300000000000003"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, taxId: e.target.value } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {clinic.logoUrl ? (
                          <div className="relative w-9 h-9 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center group flex-shrink-0 shadow-sm">
                            <img src={clinic.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, logoUrl: '' } : c);
                                updateData({ clinics: updatedClinics });
                                showNotification(`تمت إزالة شعار فرع "${clinic.name}"`);
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold"
                              title="إزالة الشعار"
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                            🖼️
                          </div>
                        )}
                        <div className="flex-1 min-w-[120px]">
                          <input 
                            type="file" 
                            accept="image/*"
                            id={`logo-file-${clinic.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('عذراً، حجم الصورة يجب ألا يتجاوز 2 ميجابايت لسرعة التحميل.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, logoUrl: reader.result as string } : c);
                                  updateData({ clinics: updatedClinics });
                                  showNotification(`🖼️ تم رفع الشعار للفرع "${clinic.name}" بنجاح!`);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`logo-file-${clinic.id}`}
                            className="inline-block bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-[10.5px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap"
                          >
                            رفع الشعار 🖼️
                          </label>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-full font-mono text-xs"
                        value={clinic.whatsappNumber || ''}
                        placeholder="966500000000"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, whatsappNumber: e.target.value } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <textarea 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 w-full resize-y min-h-[38px]"
                        value={clinic.invoiceMessage || ''}
                        placeholder="رسالة الترحيب أسفل الفاتورة"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, invoiceMessage: e.target.value } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(clinic)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-amber-200 transition-colors shadow-sm"
                          title="تعديل بيانات الفرع بالكامل"
                        >
                          <Edit size={13} />
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showNotification(`💾 تم حفظ إعدادات الفرع "${clinic.name}" بنجاح!`);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors shadow-sm"
                          title="حفظ التعديلات"
                        >
                          <Check size={13} />
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-xs transition-colors border border-rose-200"
                          title="حذف الفرع نهائياً"
                        >
                          <Trash2 size={15} />
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

      {/* Branch Subscription Expiry Dates */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h6 className="font-bold text-slate-800 text-base flex items-center gap-2 m-0">
              <Calendar size={20} className="text-indigo-600"/>
              إدارة اشتراكات الفروع (تاريخ الانتهاء والتمديد)
            </h6>
            <p className="text-xs text-slate-500 mt-1">تمديد الصلاحيات، تجديد التراخيص الشهرية والسنوية، والتحكم في إيقاف أو تفعيل الفروع</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-extrabold">
              <tr>
                <th className="p-3">اسم الفرع</th>
                <th className="p-3">المركز الرئيسي التابع له</th>
                <th className="p-3">تاريخ انتهاء الاشتراك</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center min-w-[200px]">التحكم في التفعيل والتمديد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.clinics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">لا يوجد أي فروع</td>
                </tr>
              ) : data.clinics.map(clinic => {
                const masterAdmin = data.users.find(u => u.user === clinic.masterAdminId)?.name || 'غير محدد';
                const isExpired = clinic.expiryDate && new Date(clinic.expiryDate).getTime() < Date.now();
                const isNearExpiry = clinic.expiryDate && !isExpired && new Date(clinic.expiryDate).getTime() < Date.now() + 7 * 86400000;

                return (
                  <tr key={clinic.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-extrabold text-slate-800">{clinic.name}</td>
                    <td className="p-3 text-slate-600 font-medium">{masterAdmin}</td>
                    <td className="p-3">
                      <input 
                        type="date" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 font-mono text-xs"
                        value={clinic.expiryDate ? clinic.expiryDate.split('T')[0] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newDate = val ? new Date(val).toISOString() : '';
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, expiryDate: newDate } : c);
                          updateData({ clinics: updatedClinics });
                          showNotification(`تم تعديل تاريخ انتهاء "${clinic.name}"`);
                        }}
                      />
                    </td>
                    <td className="p-3">
                       <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                         !clinic.expiryDate ? 'bg-slate-100 text-slate-600' :
                         isExpired ? 'bg-rose-100 text-rose-700' :
                         isNearExpiry ? 'bg-amber-100 text-amber-800' :
                         'bg-emerald-100 text-emerald-800'
                       }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${
                           !clinic.expiryDate ? 'bg-slate-400' :
                           isExpired ? 'bg-rose-600' :
                           isNearExpiry ? 'bg-amber-600' :
                           'bg-emerald-600'
                         }`}></span>
                         {
                           !clinic.expiryDate ? 'غير محدد' :
                           isExpired ? 'منتهي الصلاحية 🔴' :
                           isNearExpiry ? 'ينتهي قريباً ⚠️' :
                           'نشط وفعال 🟢'
                         }
                       </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickExtend(clinic.id, 1)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs border border-indigo-200 transition-colors shadow-sm"
                          title="تمديد الاشتراك شهراً إضافياً"
                        >
                          +30 يوم ⚡
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickExtend(clinic.id, 12)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-xs border border-purple-200 transition-colors shadow-sm"
                          title="تمديد الاشتراك لسنة كاملة"
                        >
                          +سنة 🚀
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(clinic)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-xs border border-amber-200 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-xs border border-rose-200 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={14} />
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

      {/* Comprehensive Branch Edit / Add Modal */}
      {(editingClinic !== null || isNewClinicModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-[Cairo] overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-lg">
                    {editingClinic ? `تعديل بيانات الفرع: ${editingClinic.name}` : 'إضافة فرع / مركز جديد'}
                  </h4>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    التحكم في كافة إعدادات الفرع، الضرائب، العملة، والاشتراك
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingClinic(null);
                  setIsNewClinicModalOpen(false);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الفرع / المركز *</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={e => setBranchName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 font-bold"
                    placeholder="مثال: فرع الرياض الرئيسي"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الخبيرة / المديرة المسؤولة</label>
                  <input
                    type="text"
                    value={branchDocName}
                    onChange={e => setBranchDocName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600"
                    placeholder="مثال: أخصائية التجميل سارة أحمد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">العملة الافتراضية</label>
                  <select
                    value={branchCurrency}
                    onChange={e => setBranchCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-600 font-bold"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="KWD">دينار كويتي (KWD)</option>
                    <option value="QAR">ريال قطري (QAR)</option>
                    <option value="OMR">ريال عماني (OMR)</option>
                    <option value="BHD">دينار بحريني (BHD)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة الضريبة المضافة (%)</label>
                  <input
                    type="number"
                    value={branchTaxRate}
                    onChange={e => setBranchTaxRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 font-bold"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم الضريبي (Tax ID)</label>
                  <input
                    type="text"
                    value={branchTaxId}
                    onChange={e => setBranchTaxId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 font-mono text-xs"
                    placeholder="300000000000003"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الواتساب للفواتير والرسائل</label>
                  <input
                    type="text"
                    value={branchWhatsapp}
                    onChange={e => setBranchWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 font-mono text-xs"
                    placeholder="مثال: 966500000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المركز الرئيسي التابع له</label>
                  <select
                    value={branchMasterAdmin}
                    onChange={e => setBranchMasterAdmin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                  >
                    <option value="">غير محدد (فرع مستقل)</option>
                    {masterAdmins.map(admin => (
                      <option key={admin.user} value={admin.user}>
                        {admin.name} ({admin.user})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفرع (المطبوع على الفاتورة)</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={e => setBranchAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600"
                  placeholder="مثال: الرياض - طريق الملك فهد - برج الماسة"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رسالة وتذييل أسفل الفاتورة</label>
                <textarea
                  value={branchMessage}
                  onChange={e => setBranchMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 resize-none"
                  placeholder="مثال: شكراً لزيارتكم ونتطلع لخدمتكم دائماً"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ انتهاء صلاحية اشتراك الفرع</label>
                <input
                  type="date"
                  value={branchExpiry}
                  onChange={e => setBranchExpiry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              {/* 🌐 Branch Custom Cloud Sync Module */}
              <div className="border-t border-slate-200 border-dashed pt-5 mt-5">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                      <Cloud size={18} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-800">تخصيص السحابة وقاعدة البيانات لهذا الفرع</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">فصل سحابة هذا الفرع بشكل منفصل تماماً لمنع أي تداخل في البيانات</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={branchCustomCloudEnabled} 
                      onChange={e => setBranchCustomCloudEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {branchCustomCloudEnabled && (
                  <div className="mt-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">مزود قاعدة البيانات</label>
                        <select
                          value={branchDatabaseProvider}
                          onChange={e => setBranchDatabaseProvider(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                        >
                          <option value="firebase">Firebase Firestore (سحابي)</option>
                          <option value="local_sql">Local SQLite / MySQL (خادم داخلي)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">مزود رفع الصور والملفات</label>
                        <select
                          value={branchStorageProvider}
                          onChange={e => setBranchStorageProvider(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                        >
                          <option value="local">تخزين محلي (Local Directory)</option>
                          <option value="firebase">Firebase Storage (سحابي مدمج)</option>
                          <option value="cloudinary">Cloudinary Server (مستودع خارجي)</option>
                        </select>
                      </div>
                    </div>

                    {/* Firebase Options Panel */}
                    {branchDatabaseProvider === 'firebase' && (
                      <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs pb-1 border-b border-slate-100 mb-2">
                          <Database size={14} />
                          <span>إعدادات الاتصال المباشر بقاعدة بيانات Firebase</span>
                        </div>

                        {/* Automatic Firebase Populated Banner */}
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-start gap-2.5 leading-relaxed shadow-sm">
                          <span className="text-emerald-500 animate-pulse text-lg mt-0.5">🟢</span>
                          <div>
                            <span className="block font-extrabold text-emerald-900">✅ النظام متصل سحابياً بقاعدة Firebase بنجاح</span>
                            تم تحميل وتأكيد بيانات المزامنة تلقائياً من المشروع النشط <span className="font-mono text-[11px] bg-emerald-100 px-1 py-0.5 rounded text-indigo-700 font-bold">beauty-center-40ee0</span> لربط وتكامل بيانات هذا الفرع بشكل مستقل تماماً.
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Firebase API Key</label>
                            <input
                              type="text"
                              value={branchFirebaseApiKey}
                              onChange={e => setBranchFirebaseApiKey(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="AIzaSy..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Project ID</label>
                            <input
                              type="text"
                              value={branchFirebaseProjectId}
                              onChange={e => setBranchFirebaseProjectId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="my-project-id"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Database Realtime URL</label>
                            <input
                              type="text"
                              value={branchFirebaseDatabaseURL}
                              onChange={e => setBranchFirebaseDatabaseURL(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Storage Bucket (اختياري)</label>
                            <input
                              type="text"
                              value={branchFirebaseStorageBucket}
                              onChange={e => setBranchFirebaseStorageBucket(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="bucket.appspot.com"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Local SQL API Option Panel */}
                    {branchDatabaseProvider === 'local_sql' && (
                      <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs pb-1 border-b border-slate-100 mb-2">
                          <HardDrive size={14} />
                          <span>إعدادات خادم قاعدة البيانات والشبكة المحلية (Local Server)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">عنوان الـ API للمستقبل المحلي (Local IP / URL)</label>
                            <input
                              type="text"
                              value={branchLocalApiUrl}
                              onChange={e => setBranchLocalApiUrl(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="http://192.168.1.100:3000/api"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">مسار التخزين على الخادم المحلي (Storage Path)</label>
                            <input
                              type="text"
                              value={branchLocalStoragePath}
                              onChange={e => setBranchLocalStoragePath(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="C:/beauty_center/uploads"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cloudinary Option Panel */}
                    {branchStorageProvider === 'cloudinary' && (
                      <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs pb-1 border-b border-slate-100 mb-2">
                          <Cloud size={14} />
                          <span>إعدادات Cloudinary المستقلة للفرع</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Cloud Name</label>
                            <input
                              type="text"
                              value={branchCloudinaryName}
                              onChange={e => setBranchCloudinaryName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="cloudinary-cloud-name"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Upload Preset</label>
                            <input
                              type="text"
                              value={branchCloudinaryPreset}
                              onChange={e => setBranchCloudinaryPreset(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                              placeholder="cloudinary-preset"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingClinic(null);
                  setIsNewClinicModalOpen(false);
                }}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveClinicModal}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
              >
                <Save size={16} />
                {editingClinic ? 'حفظ وتحديث بيانات الفرع' : 'تأكيد إنشاء الفرع الجديد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Custom Security Deletion Confirmation Dialog */}
      {clinicToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-[Cairo]" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white text-right">
              <h4 className="font-extrabold text-base flex items-center gap-2 m-0">
                <span>⚠️ تأكيد الحذف الأمني للمركز / الفرع</span>
              </h4>
              <p className="text-xs text-rose-100 mt-1">يرجى تأكيد رغبتك في حذف الفرع نهائياً من قاعدة البيانات</p>
            </div>
            
            <div className="p-6 text-right space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                هل أنت متأكد من حذف الفرع <strong className="text-rose-600 font-extrabold">"{clinicToDelete.name}"</strong> نهائياً من المنظومة؟
              </p>
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-100 text-xs text-rose-800 space-y-1">
                <p className="font-bold">🚨 تنبيه أمني هام:</p>
                <p>• سيتم إزالة الفرع بالكامل.</p>
                <p>• سيتم إيقاف صلاحية أي مستخدمين مسجلين تحت هذا الفرع.</p>
                <p>• سيتم تنظيف وتفريغ كافة السجلات المالية والعمليات المرتبطة به.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClinicToDelete(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                إلغاء التراجع ↩️
              </button>
              <button
                type="button"
                onClick={confirmDeleteClinic}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
              >
                تأكيد حذف الفرع نهائياً 🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
