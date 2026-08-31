export type Role = 'developer' | 'master_admin' | 'branch_admin' | 'doctor' | 'reception' | 'secretary' | 'accountant' | 'expert' | 'staff' | 'manager' | 'receptionist';

export interface UserPermissions {
  // --- Standard Staff / Role-based Navigation & Feature Flags ---
  canViewDashboard?: boolean;
  canViewPatients?: boolean;
  canViewAppointments?: boolean;
  canViewFinance?: boolean;
  canManageExpenses?: boolean;
  canViewServices?: boolean;
  canViewInventory?: boolean;
  canViewPayroll?: boolean;
  canViewClinics?: boolean;
  canViewStaff?: boolean;
  canViewArchive?: boolean;
  canAccessSettings?: boolean;
  canDeleteRecords?: boolean;
  canExportData?: boolean;
  canEditInvoices?: boolean;
  canViewInvoiceSettings?: boolean; // إظهار زر إعدادات الفاتورة والـ QR
  canViewVoiceSettings?: boolean; // إظهار زر إعدادات النداء الصوتي
  canCallVoice?: boolean; // تفعيل النداء الصوتي

  // --- Granular Printing Permissions for Staff ---
  canPrintQueue?: boolean; // طباعة طابور الانتظار وفواتير العملاء
  canPrintFinance?: boolean; // طباعة التقارير المالية والخزينة
  canPrintPatients?: boolean; // طباعة دليل وسجلات العملاء
  canPrintInventory?: boolean; // طباعة كشوفات المستودع والمخزون
  canPrintStaff?: boolean; // طباعة كشوفات الموظفين والرواتب
  canPrintServices?: boolean; // طباعة قائمة الخدمات والأسعار
  canPrintAppointments?: boolean; // طباعة جدول المواعيد
  canPrintExpenses?: boolean; // طباعة سندات الصرف والمصروفات
  canPrintPayroll?: boolean; // طباعة مسير الرواتب
  canPrintArchive?: boolean; // طباعة الأرشيف والعمليات السابقة
  canPrintLoyalty?: boolean; // طباعة بطاقات ونقاط الولاء

  // --- Granular Export & Download Permissions for Staff ---
  canExportExcel?: boolean; // تصدير ملفات الإكسيل
  canExportPDF?: boolean; // تصدير مستندات PDF
  canExportBackup?: boolean; // تحميل وتصدير النسخ الاحتياطي
  canExportPatientsCRM?: boolean; // تصدير أرقام وبيانات العملاء

  // --- Granular Action & Editing Permissions for Staff ---
  canAddPatient?: boolean;
  canEditPatient?: boolean;
  canAddAppointment?: boolean;
  canEditAppointment?: boolean;
  canAddInvoice?: boolean;
  canAddService?: boolean;
  canAddInventory?: boolean;
  canAddStaff?: boolean;
  canAddBranch?: boolean;
  canAddExpense?: boolean;
  canEditInvoiceTotals?: boolean; // تعديل إجمالي الفاتورة والمبلغ المطلوب
  canEditInvoicePayments?: boolean; // تعديل المبلغ المدفوع والمستلم والمتبقي
  canEditInvoiceMethods?: boolean; // تعديل طريقة الدفع (كاش/فيزا/بنكي)

  // --- Center-Level Scope Settings ---
  printFull?: boolean; // طباعة كاملة أو منفردة للمركز
  financeFull?: boolean; // حسابات كاملة أو منفردة للمركز
  downloadFull?: boolean; // تحميل وتصدير كامل أو منفرد للمركز
  branchManagementFull?: boolean; // إدارة الفروع كاملة أو منفردة للمركز
  
  // =========================================================================
  // 🛡️ Granular Master Developer Overrides & Restrictions for Centers
  // =========================================================================
  
  // 1. Granular Print Button Overrides
  devDisablePrintInvoices?: boolean; // طباعة الفواتير A4 والحراري
  devDisablePrintReports?: boolean; // طباعة التقارير المالية والإحصائيات
  devDisablePrintFinance?: boolean; // طباعة كشوفات وتقارير الخزينة والمالية
  devDisablePrintPatients?: boolean; // طباعة كشوفات وملفات العملاء
  devDisablePrintServices?: boolean; // طباعة قائمة الخدمات والأسعار
  devDisablePrintInventory?: boolean; // طباعة جرد المستودع والمخازن
  devDisablePrintPayroll?: boolean; // طباعة مسير الرواتب وقسائم الصرف
  devDisablePrintQueue?: boolean; // طباعة تذاكر طابور الانتظار
  devDisablePrintStaff?: boolean; // طباعة دليل الموظفين والإنتاجية
  devDisablePrintAppointments?: boolean; // طباعة جدول المواعيد والحجوزات
  devDisablePrintExpenses?: boolean; // طباعة سندات الصرف والمصروفات
  devDisablePrintArchive?: boolean; // طباعة سجلات الأرشيف
  devDisablePrintLoyalty?: boolean; // طباعة بطاقات وكوبونات الولاء

  // 2. Granular Export & Download Button Overrides
  devDisableExportExcel?: boolean; // تصدير الجداول إلى ملفات Excel
  devDisableExportPDF?: boolean; // تصدير التقارير إلى مستندات PDF
  devDisableExportBackup?: boolean; // تنزيل وتصدير النسخ الاحتياطي
  devDisableExportPatientsCRM?: boolean; // تصدير جهات اتصال وأرقام العملاء
  devDisableExportFinancials?: boolean; // تصدير القوائم وسجلات الخزينة
  devDisableExportBarcodes?: boolean; // تصدير وتحميل باركود المنتجات والـ QR

  // 3. Granular Tab & Section Visibility Overrides
  devDisableDashboardTab?: boolean;
  devDisablePatientsTab?: boolean;
  devDisableAppointmentsTab?: boolean;
  devDisableFinanceTab?: boolean;
  devDisableServicesTab?: boolean;
  devDisableInventoryTab?: boolean;
  devDisablePayrollTab?: boolean;
  devDisableStaffTab?: boolean;
  devDisableClinicsTab?: boolean;
  devDisableArchiveTab?: boolean;
  devDisableSettingsTab?: boolean;

  // 4. Granular Operations & Action Overrides
  devDisableAddPatient?: boolean;
  devDisableEditPatient?: boolean;
  devDisableDeletePatient?: boolean;
  devDisableAddAppointment?: boolean;
  devDisableEditAppointment?: boolean;
  devDisableDeleteAppointment?: boolean;
  devDisableAddInvoice?: boolean;
  devDisableEditInvoice?: boolean;
  devDisableDeleteInvoice?: boolean;
  devDisableEditInvoiceTotals?: boolean;
  devDisableEditInvoicePayments?: boolean;
  devDisableEditInvoiceMethods?: boolean;
  devDisableAddService?: boolean;
  devDisableEditService?: boolean;
  devDisableDeleteService?: boolean;
  devDisableAddExpense?: boolean;
  devDisableDeleteExpense?: boolean;
  devDisableAddInventory?: boolean;
  devDisableEditInventory?: boolean;
  devDisableDeleteInventory?: boolean;
  devDisableAddStaff?: boolean;
  devDisableEditStaff?: boolean;
  devDisableDeleteStaff?: boolean;
  devDisablePayrollCalculations?: boolean;
  devDisableAddBranch?: boolean;
  devDisableEditBranch?: boolean;
  devDisableDeleteBranch?: boolean;
  devDisableVoiceCall?: boolean;
  devDisableCustomDiscounts?: boolean;
  devDisableLoyaltySystem?: boolean;
  devDisableBackupRestore?: boolean;
  devDisableActivityLogs?: boolean;
  
  // 5. WhatsApp and AI Chatbot integrations
  devEnableWhatsappReminders?: boolean;
  devWhatsappSenderNumber?: string;
  devEnableChatbot?: boolean;
  
  // 6. Modal and Feature Settings Triggers
  devShowInvoiceSettings?: boolean; // إظهار زر إعدادات الفاتورة والـ QR
  devShowVoiceSettings?: boolean; // إظهار زر إعدادات النداء الصوتي
  devShowWhatsappSettings?: boolean; // إظهار زر إعدادات الواتساب
  devShowTaxSettings?: boolean; // إظهار إعدادات الضرائب والرقم الضريبي
}

export interface SubscriptionInvoice {
  id: string;
  date: string;
  amount: number;
  months: number;
  paymentStatus: 'paid' | 'unpaid' | 'pending' | string;
  notes?: string;
}

export interface User {
  name: string;
  user: string;
  pass: string;
  role: Role;
  clinicId: string;
  tenantId?: string;
  maxBranches?: number;
  expiryDate?: string;
  isActive?: boolean;
  modules?: PlatformSettings['modules'];
  hiddenModules?: string[];
  permissions?: UserPermissions;
  subscriptionInvoices?: SubscriptionInvoice[];
  contractInvoices?: any[];
  designSalePrice?: number;
  branchSalePrice?: number;
  paidAmountToDev?: number;
  cloudConfig?: CloudConfig;
  customCloudEnabled?: boolean;
}

export interface VoiceCallSettings {
  language: 'ar' | 'en' | 'both';
  arabicPhrase?: string;
  englishPhrase?: string;
  enableChime?: boolean;
  rate?: number;
  pitch?: number;
}

export interface ClinicInvoiceSettings {
  showQrCode?: boolean;
  qrType?: 'zatca' | 'standard' | 'url' | 'custom_image';
  customQrValue?: string;
  customQrImageUrl?: string;
  qrLabel?: string;
  qrPosition?: 'bottom' | 'top' | 'both';
  showVat?: boolean;
  vatRate?: number;
  pricesIncludeVat?: boolean;
  commercialRegister?: string;
  invoiceTitle?: string;
  invoiceSubtitle?: string;
  invoiceTerms?: string;
  invoiceFooter?: string;
  invoiceType?: 'a4' | 'pos80' | 'modern';
  showDoctorName?: boolean;
  showHandler?: boolean;
  showPaymentMethod?: boolean;
  showCustomerPhone?: boolean;
  showDueBalance?: boolean;
  showClinicLogo?: boolean;
  showSignatureStamp?: boolean;
  showClinicTaxNumber?: boolean;
  showClinicAddress?: boolean;
  showClinicPhone?: boolean;
  headerColor?: string;
}

export interface CloudConfig {
  databaseProvider: 'firebase' | 'local_sql';
  storageProvider: 'firebase' | 'local_folder' | 'local' | 'cloudinary';
  firebaseConfig?: {
    apiKey: string;
    projectId: string;
    storageBucket?: string;
    databaseURL?: string;
  };
  localServerConfig?: {
    apiUrl: string;
    storagePath?: string;
  };
  cloudinaryConfig?: {
    cloudName: string;
    uploadPreset: string;
  };
}

export interface PlatformSettings {
  maintenanceMode?: boolean;
  globalAnnouncement?: string;
  cloudConfig?: CloudConfig;
  modules: {
    patients: boolean;
    appointments: boolean;
    finance: boolean;
    services: boolean;
    inventory: boolean;
    payroll: boolean;
    clinics: boolean;
    staff: boolean;
    archive: boolean;
    settings: boolean;
  };
  customLabels: Record<string, string>;
  language?: 'ar' | 'en';
  loyaltyPointsValue?: number;
  voiceSettings?: VoiceCallSettings;
  developerCurrency?: string;
  devDisablePrintInvoices?: boolean;
  devDisableExportExcel?: boolean;
  devDisableExportPDF?: boolean;
  devDisableActivityLogs?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  docName: string;
  currency: string;
  daysCount?: number;
  expiryDate: string;
  taxId?: string;
  vatRate?: number;
  taxRate?: number;
  commercialRegister?: string;
  whatsappNumber?: string;
  invoiceAddress?: string;
  invoiceMessage?: string;
  logoUrl?: string;
  masterAdminId?: string;
  tenantId?: string;
  invoiceSettings?: ClinicInvoiceSettings;
  voiceSettings?: VoiceCallSettings;
  whatsappTemplate?: string;
  subscriptionInvoices?: SubscriptionInvoice[];
  cloudConfig?: CloudConfig;
  customCloudEnabled?: boolean;
}

export interface Service {
  name: string;
  price: number;
  clinicId?: string;
  tenantId?: string;
  category?: string;
}

export interface RecordItem {
  id: number;
  name: string;
  age: string;
  phone: string;
  service: string;
  total: number;
  paid: number;
  payMethod: string;
  handler: string;
  due: number;
  status: 'waiting' | 'in' | 'done';
  isoDate: string;
  date: string;
}

export interface Appointment {
  id: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  service?: string;
}

export interface Expense {
  id: number;
  category: string;
  desc: string;
  amount: number;
  handler: string;
  date: string;
}

export interface PharmacyItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  expiry: string;
}

export interface Staff {
  id: number;
  name: string;
  salary: number;
  role: string;
  phone: string;
}

export interface PayrollTransaction {
  id: number;
  staffName: string;
  transType: 'advance' | 'bonus' | 'deduction';
  amount: number;
  note: string;
  date: string;
}

export interface PlatformData {
  users: User[];
  clinics: Clinic[];
  services: Service[];
  queue: Record<string, RecordItem[]>;
  archive: Record<string, RecordItem[]>;
  appointments: Record<string, Appointment[]>;
  beautyNotesStore: Record<string, string>;
  expensesStore: Record<string, Expense[]>;
  pharmacyStore: Record<string, PharmacyItem[]>;
  staffDirectory: Record<string, Staff[]>;
  payrollStore: Record<string, PayrollTransaction[]>;
  lastDate: string;
  settings?: PlatformSettings;
  activityLogs?: ActivityLog[];
  patientPackages?: Record<string, any[]>;
  loyaltyDeductions?: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  clinicId: string;
  tenantId?: string;
  centerName?: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
