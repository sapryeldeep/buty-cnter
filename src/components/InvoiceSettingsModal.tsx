import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { 
  X, Save, Receipt, QrCode, Percent, Building2, Eye, Printer, 
  CheckCircle, Shield, FileText, Phone, MapPin, Smartphone, 
  HelpCircle, Lock, Upload, Image, Link, RefreshCw, Trash2, Sliders, Palette,
  Volume2, Bell, Play, Sparkles
} from 'lucide-react';
import { Clinic, ClinicInvoiceSettings, VoiceCallSettings } from '../types';
import { printInvoice } from '../utils/exportUtils';
import { speakPatientCall } from '../utils/voiceCall';
import { WhatsappSettingsModal } from './WhatsappSettingsModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetClinicId?: string;
}

export function InvoiceSettingsModal({ isOpen, onClose, targetClinicId }: Props) {
  const { data, updateData, currentUser } = useStore();

  // Filter accessible clinics - Show all clinics and branches
  const accessibleClinics = data.clinics;

  const defaultClinicId = targetClinicId || accessibleClinics[0]?.id || data.clinics[0]?.id;
  const [selectedClinicId, setSelectedClinicId] = useState<string>(defaultClinicId);

  const activeClinic = data.clinics.find(c => c.id === selectedClinicId) || data.clinics[0];

  // Active Tab inside modal
  const [activeTab, setActiveTab] = useState<'info' | 'tax_qr' | 'template' | 'voice'>('info');

  // Form State initialized from activeClinic
  const [name, setName] = useState(activeClinic?.name || '');
  const [docName, setDocName] = useState(activeClinic?.docName || '');
  const [currency, setCurrency] = useState(activeClinic?.currency || 'SAR');
  const [taxId, setTaxId] = useState(activeClinic?.taxId || '');
  const [commercialRegister, setCommercialRegister] = useState(activeClinic?.commercialRegister || activeClinic?.invoiceSettings?.commercialRegister || '');
  const [whatsappNumber, setWhatsappNumber] = useState(activeClinic?.whatsappNumber || '');
  const [invoiceAddress, setInvoiceAddress] = useState(activeClinic?.invoiceAddress || '');
  const [logoUrl, setLogoUrl] = useState(activeClinic?.logoUrl || '');

  // Invoice & Tax specific settings
  const existingInv = activeClinic?.invoiceSettings || {};
  const [showVat, setShowVat] = useState<boolean>(existingInv.showVat ?? (activeClinic?.vatRate ? activeClinic.vatRate > 0 : true));
  const [vatRate, setVatRate] = useState<number>(existingInv.vatRate ?? (activeClinic?.vatRate || 15));
  const [pricesIncludeVat, setPricesIncludeVat] = useState<boolean>(existingInv.pricesIncludeVat ?? true);
  
  // QR Code Settings
  const [showQrCode, setShowQrCode] = useState<boolean>(existingInv.showQrCode ?? true);
  const [qrType, setQrType] = useState<'zatca' | 'standard' | 'url' | 'custom_image'>(existingInv.qrType || 'zatca');
  const [customQrValue, setCustomQrValue] = useState<string>(existingInv.customQrValue || '');
  const [customQrImageUrl, setCustomQrImageUrl] = useState<string>(existingInv.customQrImageUrl || '');
  const [qrLabel, setQrLabel] = useState<string>(existingInv.qrLabel || 'فاتورة إلكترونية معتمدة');
  const [qrPosition, setQrPosition] = useState<'bottom' | 'top' | 'both'>(existingInv.qrPosition || 'bottom');

  const [invoiceType, setInvoiceType] = useState<'a4' | 'pos80' | 'modern'>(existingInv.invoiceType || 'pos80');
  const [invoiceTitle, setInvoiceTitle] = useState<string>(existingInv.invoiceTitle || 'فاتورة ضريبية مبسطة');
  const [invoiceSubtitle, setInvoiceSubtitle] = useState<string>(existingInv.invoiceSubtitle || activeClinic?.docName || '');
  const [invoiceTerms, setInvoiceTerms] = useState<string>(existingInv.invoiceTerms || 'المستحضرات التجميلية لا ترد ولا تستبدل بعد فتحها حرصاً على سلامتكم.');
  const [invoiceFooter, setInvoiceFooter] = useState<string>(existingInv.invoiceFooter || activeClinic?.invoiceMessage || 'شكراً لزيارتكم ونتمنى لكم دوام التألق والجمال.');
  
  const [showDoctorName, setShowDoctorName] = useState<boolean>(existingInv.showDoctorName ?? true);
  const [showHandler, setShowHandler] = useState<boolean>(existingInv.showHandler ?? true);
  const [showPaymentMethod, setShowPaymentMethod] = useState<boolean>(existingInv.showPaymentMethod ?? true);
  const [showCustomerPhone, setShowCustomerPhone] = useState<boolean>(existingInv.showCustomerPhone ?? true);
  const [showDueBalance, setShowDueBalance] = useState<boolean>(existingInv.showDueBalance ?? true);
  const [showSignatureStamp, setShowSignatureStamp] = useState<boolean>(existingInv.showSignatureStamp ?? true);
  const [showClinicLogo, setShowClinicLogo] = useState<boolean>(existingInv.showClinicLogo ?? true);
  const [showClinicTaxNumber, setShowClinicTaxNumber] = useState<boolean>(existingInv.showClinicTaxNumber ?? true);
  const [showClinicAddress, setShowClinicAddress] = useState<boolean>(existingInv.showClinicAddress ?? true);

  // Voice Settings State
  const currentVoiceSettings: VoiceCallSettings = data.settings?.voiceSettings || {
    language: 'ar',
    arabicPhrase: 'العميلة {name}، تفضلي بالدخول لغرفة الجلسة',
    englishPhrase: 'Client {name}, please proceed to the treatment room',
    enableChime: true,
    rate: 0.95,
    pitch: 1.0
  };

  const [voiceLanguage, setVoiceLanguage] = useState<'ar' | 'en' | 'both'>(currentVoiceSettings.language || 'ar');
  const [voiceArabicPhrase, setVoiceArabicPhrase] = useState(currentVoiceSettings.arabicPhrase || 'العميلة {name}، تفضلي بالدخول لغرفة الجلسة');
  const [voiceEnglishPhrase, setVoiceEnglishPhrase] = useState(currentVoiceSettings.englishPhrase || 'Client {name}, please proceed to the treatment room');
  const [voiceEnableChime, setVoiceEnableChime] = useState(currentVoiceSettings.enableChime !== false);
  const [voiceRate, setVoiceRate] = useState(currentVoiceSettings.rate || 0.95);
  const [voicePitch, setVoicePitch] = useState(currentVoiceSettings.pitch || 1.0);
  const [isPlayingVoiceTest, setIsPlayingVoiceTest] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when clinic selection changes
  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    const cl = data.clinics.find(c => c.id === clinicId);
    if (!cl) return;

    setName(cl.name);
    setDocName(cl.docName);
    setCurrency(cl.currency);
    setTaxId(cl.taxId || '');
    setCommercialRegister(cl.commercialRegister || cl.invoiceSettings?.commercialRegister || '');
    setWhatsappNumber(cl.whatsappNumber || '');
    setInvoiceAddress(cl.invoiceAddress || '');
    setLogoUrl(cl.logoUrl || '');

    const inv = cl.invoiceSettings || {};
    setShowVat(inv.showVat ?? (cl.vatRate ? cl.vatRate > 0 : true));
    setVatRate(inv.vatRate ?? (cl.vatRate || 15));
    setPricesIncludeVat(inv.pricesIncludeVat ?? true);
    
    setShowQrCode(inv.showQrCode ?? true);
    setQrType(inv.qrType || 'zatca');
    setCustomQrValue(inv.customQrValue || '');
    setCustomQrImageUrl(inv.customQrImageUrl || '');
    setQrLabel(inv.qrLabel || 'فاتورة إلكترونية معتمدة');
    setQrPosition(inv.qrPosition || 'bottom');

    setInvoiceType(inv.invoiceType || 'pos80');
    setInvoiceTitle(inv.invoiceTitle || 'فاتورة ضريبية مبسطة');
    setInvoiceSubtitle(inv.invoiceSubtitle || cl.docName || '');
    setInvoiceTerms(inv.invoiceTerms || 'المستحضرات التجميلية لا ترد ولا تستبدل بعد فتحها حرصاً على سلامتكم.');
    setInvoiceFooter(inv.invoiceFooter || cl.invoiceMessage || 'شكراً لزيارتكم ونتمنى لكم دوام التألق والجمال.');
    setShowDoctorName(inv.showDoctorName ?? true);
    setShowHandler(inv.showHandler ?? true);
    setShowPaymentMethod(inv.showPaymentMethod ?? true);
    setShowCustomerPhone(inv.showCustomerPhone ?? true);
    setShowDueBalance(inv.showDueBalance ?? true);
    setShowSignatureStamp(inv.showSignatureStamp ?? true);
    setShowClinicLogo(inv.showClinicLogo ?? true);
    setShowClinicTaxNumber(inv.showClinicTaxNumber ?? true);
    setShowClinicAddress(inv.showClinicAddress ?? true);
  };

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === selectedClinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isEditingAllowed = currentUser?.role === 'developer' || center?.permissions?.devShowInvoiceSettings !== false;

  if (!isOpen) return null;

  const handleSave = () => {
    if (!isEditingAllowed) {
      alert('🔒 عفواً، ميزة تعديل وتخصيص الفواتير مقفلة لهذا المركز من قبل المطور. يرجى مراجعة اشتراك النظام الخاص بك لتفعيلها.');
      return;
    }
    if (!activeClinic) return;

    const newInvoiceSettings: ClinicInvoiceSettings = {
      showQrCode,
      qrType,
      customQrValue,
      customQrImageUrl,
      qrLabel,
      qrPosition,
      showVat,
      vatRate: Number(vatRate),
      pricesIncludeVat,
      commercialRegister,
      invoiceTitle,
      invoiceSubtitle,
      invoiceTerms,
      invoiceFooter,
      invoiceType,
      showDoctorName,
      showHandler,
      showPaymentMethod,
      showCustomerPhone,
      showDueBalance,
      showClinicLogo,
      showSignatureStamp,
      showClinicTaxNumber,
      showClinicAddress
    };

    const updatedClinics = data.clinics.map(c => {
      if (c.id === selectedClinicId) {
        return {
          ...c,
          name,
          docName,
          currency,
          taxId,
          commercialRegister,
          vatRate: Number(vatRate),
          taxRate: Number(vatRate),
          whatsappNumber,
          invoiceAddress,
          logoUrl,
          invoiceMessage: invoiceFooter,
          invoiceSettings: newInvoiceSettings
        };
      }
      return c;
    });

    const updatedVoiceSettings: VoiceCallSettings = {
      language: voiceLanguage,
      arabicPhrase: voiceArabicPhrase,
      englishPhrase: voiceEnglishPhrase,
      enableChime: voiceEnableChime,
      rate: voiceRate,
      pitch: voicePitch
    };

    updateData({ 
      clinics: updatedClinics,
      settings: {
        ...(data.settings || {
          modules: {
            patients: true, appointments: true, finance: true, services: true,
            inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
          },
          customLabels: {}
        }),
        voiceSettings: updatedVoiceSettings
      }
    });

    onClose();
  };

  const handleVoiceTest = async () => {
    setIsPlayingVoiceTest(true);
    await speakPatientCall('سارة أحمد / Sarah', {
      language: voiceLanguage,
      arabicPhrase: voiceArabicPhrase,
      englishPhrase: voiceEnglishPhrase,
      enableChime: voiceEnableChime,
      rate: voiceRate,
      pitch: voicePitch
    });
    setIsPlayingVoiceTest(false);
  };

  // Sample data calculations for live preview
  const sampleAmount = 500;
  let sampleSubtotal = sampleAmount;
  let sampleVatAmount = 0;
  let sampleGrandTotal = sampleAmount;

  if (showVat && vatRate > 0) {
    if (pricesIncludeVat) {
      sampleSubtotal = sampleAmount / (1 + (vatRate / 100));
      sampleVatAmount = sampleAmount - sampleSubtotal;
      sampleGrandTotal = sampleAmount;
    } else {
      sampleSubtotal = sampleAmount;
      sampleVatAmount = sampleAmount * (vatRate / 100);
      sampleGrandTotal = sampleSubtotal + sampleVatAmount;
    }
  }

  // Determine preview QR Code URL
  let previewQrUrl = '';
  if (showQrCode) {
    if (qrType === 'custom_image' && customQrImageUrl) {
      previewQrUrl = customQrImageUrl;
    } else if (qrType === 'url' && customQrValue) {
      previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(customQrValue)}`;
    } else if (qrType === 'standard' && whatsappNumber) {
      const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً ${name}، بخصوص الفاتورة #20260829`)}`;
      previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(waLink)}`;
    } else {
      const sampleQrData = `${invoiceTitle}
المورد: ${name || 'مركز التجميل'}
${taxId ? `الرقم الضريبي: ${taxId}` : ''}
${commercialRegister ? `السجل التجاري: ${commercialRegister}` : ''}
رقم الفاتورة: #20260829
التاريخ: ${new Date().toLocaleDateString('ar-EG')}
الإجمالي: ${sampleGrandTotal.toFixed(2)} ${currency}
${showVat ? `الضريبة: ${sampleVatAmount.toFixed(2)}` : ''}`.trim();
      previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(sampleQrData)}`;
    }
  }

  const handleTestPrint = () => {
    const sampleRecord = {
      id: 20260829,
      name: 'سارة عبدالله (تجربة)',
      phone: '0501234567',
      service: 'جلسة تنظيف بشرة هايدرافاشيل متكاملة',
      paid: sampleAmount,
      total: sampleAmount,
      due: 0,
      payMethod: 'مدى / كاشير',
      handler: 'أخصائية التجميل',
      date: new Date().toLocaleDateString('ar-EG')
    };

    const tempClinic: Clinic = {
      ...activeClinic,
      name,
      docName,
      currency,
      taxId,
      commercialRegister,
      whatsappNumber,
      invoiceAddress,
      logoUrl,
      invoiceMessage: invoiceFooter,
      invoiceSettings: {
        showQrCode,
        qrType,
        customQrValue,
        customQrImageUrl,
        qrLabel,
        qrPosition,
        showVat,
        vatRate: Number(vatRate),
        pricesIncludeVat,
        commercialRegister,
        invoiceTitle,
        invoiceSubtitle,
        invoiceTerms,
        invoiceFooter,
        invoiceType,
        showDoctorName,
        showHandler,
        showPaymentMethod,
        showCustomerPhone,
        showDueBalance,
        showClinicLogo,
        showSignatureStamp,
        showClinicTaxNumber,
        showClinicAddress
      }
    };

    printInvoice(sampleRecord, tempClinic);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] font-[Cairo]" 
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 m-0">تخصيص الفواتير، الـ QR، والنداء الصوتي</h3>
              <p className="text-xs text-slate-500 mt-0.5">تعديل بيانات الفروع، الضرائب، كود QR المخصص، والقوالب</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <Building2 size={16} className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-600 hidden sm:inline">الفرع:</span>
              <select 
                value={selectedClinicId}
                onChange={(e) => handleClinicChange(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-extrabold text-indigo-700 outline-none cursor-pointer"
              >
                {accessibleClinics.map(c => (
                  <option key={c.id} value={c.id}>📍 {c.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body: Split Layout (Editor Left + Live Preview Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200">
          
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {!isEditingAllowed && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-bold leading-relaxed font-[Cairo] animate-pulse">
                <Lock size={16} className="text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-extrabold text-rose-900 mb-0.5">🔒 ميزة تعديل بيانات وتفاصيل الفاتورة معطلة</div>
                  <div className="text-[10px] text-rose-700 font-medium">الرجاء مراجعة اشتراك النظام الخاص بك مع المطور لتفعيل ميزة التعديل والتخصيص الشامل لجميع فروعك ومراكزك.</div>
                </div>
              </div>
            )}

            {/* Navigation Sub-Tabs inside Modal */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={15} />
                <span>بيانات وهوية الفرع</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tax_qr')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'tax_qr'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode size={15} />
                <span>الـ QR والضريبة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'template'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders size={15} />
                <span>القالب والشروط</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'voice'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Volume2 size={15} />
                <span>النداء الصوتي</span>
              </button>
            </div>

            {/* TAB 1: Branch Info & Logo */}
            {activeTab === 'info' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الفرع / المركز المطبوع</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60"
                      placeholder="اسم المركز أو الفرع..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الخبيرة أو مديرة المركز</label>
                    <input 
                      type="text" 
                      value={docName} 
                      onChange={e => setDocName(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60"
                      placeholder="أخصائية التجميل / مديرة الفرع..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عملة الفاتورة المطبوعة</label>
                    <input 
                      type="text" 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-indigo-700 outline-none focus:border-indigo-600 disabled:opacity-60 font-bold"
                      placeholder="SAR أو EGP أو USD..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">رقم واتساب والتواصل</label>
                      <button 
                        type="button" 
                        onClick={() => setIsWhatsappModalOpen(true)}
                        className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Smartphone size={11} />
                        تعديل رقم التذكيرات
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={whatsappNumber} 
                      onChange={e => setWhatsappNumber(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60 font-mono"
                      placeholder="966500000000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفرع والمقر الميداني</label>
                    <input 
                      type="text" 
                      value={invoiceAddress} 
                      onChange={e => setInvoiceAddress(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60"
                      placeholder="المدينة، الحي، الشارع، المعلم المميز..."
                    />
                  </div>
                </div>

                {/* Logo Upload Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">شعار المركز المطبوع (Logo):</label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        إزالة الشعار
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center p-1 shadow-xs shrink-0">
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs shrink-0">
                        <Image size={20} className="mb-1 text-slate-300" />
                        <span>بلا شعار</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        ref={logoFileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={!isEditingAllowed}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload size={14} />
                        رفع صورة الشعار من الجهاز
                      </button>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        disabled={!isEditingAllowed}
                        placeholder="أو ضع رابط صورة الشعار هنا..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-600 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QR & Tax VAT */}
            {activeTab === 'tax_qr' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* QR Code Section */}
                <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-50 p-4.5 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode size={18} className="text-indigo-600" />
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">تخصيص رمز الاستجابة السريع (QR Code / Barcode)</h5>
                        <p className="text-[11px] text-slate-500">توليد QR ضريبي أو واتساب أو رابط مخصص أو رفع صورة QR جاهزة</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                        disabled={!isEditingAllowed}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {showQrCode && (
                    <div className="pt-3 border-t border-indigo-100/60 space-y-4">
                      
                      {/* QR Type Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        {/* 1. ZATCA */}
                        <button
                          type="button"
                          onClick={() => setQrType('zatca')}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${qrType === 'zatca' ? 'border-indigo-600 bg-indigo-100/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold">فاتورة إلكترونية ZATCA</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">يولد بيانات المنشأة والضريبة والسجل آلياً</p>
                        </button>

                        {/* 2. WhatsApp */}
                        <button
                          type="button"
                          onClick={() => setQrType('standard')}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${qrType === 'standard' ? 'border-indigo-600 bg-indigo-100/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-emerald-600" />
                            <span className="text-xs font-bold">رابط محادثة واتساب</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">يفتح محادثة واتساب مع المركز للعميل</p>
                        </button>

                        {/* 3. Custom Link */}
                        <button
                          type="button"
                          onClick={() => setQrType('url')}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${qrType === 'url' ? 'border-indigo-600 bg-indigo-100/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Link size={16} className="text-blue-600" />
                            <span className="text-xs font-bold">رابط موقع / خرائط Google</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">توليد QR يوجه العميل لتقييم جوجل أو موقعك</p>
                        </button>

                        {/* 4. Upload Custom QR Image */}
                        <button
                          type="button"
                          onClick={() => setQrType('custom_image')}
                          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${qrType === 'custom_image' ? 'border-indigo-600 bg-indigo-100/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Upload size={16} className="text-purple-600" />
                            <span className="text-xs font-bold">رفع صورة QR جاهزة من جهازك</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">تحميل صورة كود أو باركود مصمم مسبقاً</p>
                        </button>

                      </div>

                      {/* Custom URL Input if selected */}
                      {qrType === 'url' && (
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                          <label className="block text-xs font-bold text-slate-800">أدخل الرابط المخصص أو النص للـ QR:</label>
                          <input
                            type="text"
                            value={customQrValue}
                            onChange={e => setCustomQrValue(e.target.value)}
                            disabled={!isEditingAllowed}
                            placeholder="مثال: https://g.page/r/... أو https://instagram.com/mycenter"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}

                      {/* Custom Image Upload if selected */}
                      {qrType === 'custom_image' && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">تحميل صورة كود الـ QR من جهازك:</label>
                            {customQrImageUrl && (
                              <button
                                type="button"
                                onClick={() => setCustomQrImageUrl('')}
                                className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                إزالة الصورة
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            {customQrImageUrl ? (
                              <div className="w-20 h-20 bg-white border border-slate-300 rounded-xl p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                                <img src={customQrImageUrl} alt="Custom QR" className="max-w-full max-h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs shrink-0">
                                <QrCode size={24} className="mb-1 text-slate-300" />
                                <span>لا توجد صورة</span>
                              </div>
                            )}

                            <div className="flex-1 space-y-2">
                              <input 
                                type="file" 
                                ref={qrFileInputRef}
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCustomQrImageUrl(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => qrFileInputRef.current?.click()}
                                disabled={!isEditingAllowed}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Upload size={14} />
                                اختيار ملف صورة الـ QR من جهازك 📁
                              </button>
                              <input
                                type="text"
                                value={customQrImageUrl}
                                onChange={e => setCustomQrImageUrl(e.target.value)}
                                disabled={!isEditingAllowed}
                                placeholder="أو ضع رابط صورة الـ QR المباشر هنا..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-600 disabled:opacity-60"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* QR Label Text & Position */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">النص التوضيحي أسفل رمز الـ QR:</label>
                          <input
                            type="text"
                            value={qrLabel}
                            onChange={e => setQrLabel(e.target.value)}
                            disabled={!isEditingAllowed}
                            placeholder="مثال: فاتورة ضريبية إلكترونية معتمدة"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">موضع الـ QR في الفاتورة:</label>
                          <select
                            value={qrPosition}
                            onChange={(e) => setQrPosition(e.target.value as any)}
                            disabled={!isEditingAllowed}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 disabled:opacity-60 cursor-pointer"
                          >
                            <option value="bottom">أسفل الفاتورة بجانب الإجماليات (الافتراضي)</option>
                            <option value="top">أعلى الفاتورة بجانب الشعار</option>
                            <option value="both">أعلى وأسفل الفاتورة معاً</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Tax (VAT) Section */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={18} className="text-indigo-600" />
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">ضريبة القيمة المضافة (VAT)</h5>
                        <p className="text-[11px] text-slate-500">احتساب وإظهار تفصيل الضريبة في الفواتير الصادرة</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showVat}
                        onChange={(e) => setShowVat(e.target.checked)}
                        disabled={!isEditingAllowed}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {showVat && (
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الضريبة المضافة (%)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={vatRate} 
                            onChange={e => setVatRate(Number(e.target.value))}
                            disabled={!isEditingAllowed}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-indigo-600 disabled:opacity-60"
                          />
                          <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الاحتساب</label>
                        <select
                          value={pricesIncludeVat ? 'include' : 'add'}
                          onChange={(e) => setPricesIncludeVat(e.target.value === 'include')}
                          disabled={!isEditingAllowed}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-indigo-600 disabled:opacity-60 cursor-pointer"
                        >
                          <option value="include">الأسعار شاملة الضريبة تلقائياً</option>
                          <option value="add">إضافة الضريبة فوق سعر الخدمة</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax ID & CR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم الضريبي للمنشأة (Tax ID)</label>
                    <input 
                      type="text" 
                      value={taxId} 
                      onChange={e => setTaxId(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60 font-mono"
                      placeholder="300000000000003"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السجل التجاري (Commercial Register)</label>
                    <input 
                      type="text" 
                      value={commercialRegister} 
                      onChange={e => setCommercialRegister(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60 font-mono"
                      placeholder="1010000000"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: Template, Terms & Toggles */}
            {activeTab === 'template' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Print Template Style */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع قالب وتنسيق الطباعة:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('pos80')}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${invoiceType === 'pos80' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                        <Receipt size={16} className="text-indigo-600" />
                        إيصال كاشير حراري (80mm POS)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">مناسب لطابعات الفواتير الصغيرة السريعة عند الكاونتر</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvoiceType('a4')}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${invoiceType === 'a4' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                        <FileText size={16} className="text-indigo-600" />
                        فاتورة رسمية كاملة (A4 Standard)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">تصميم مكتبي رسمي واسع للطباعة على ورق A4</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفاتورة المطبوع</label>
                    <input 
                      type="text" 
                      value={invoiceTitle} 
                      onChange={e => setInvoiceTitle(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان الفرعي (Subtitle)</label>
                    <input 
                      type="text" 
                      value={invoiceSubtitle} 
                      onChange={e => setInvoiceSubtitle(e.target.value)}
                      disabled={!isEditingAllowed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الشروط وسياسة الاسترجاع والضمان (Terms)</label>
                  <textarea 
                    value={invoiceTerms} 
                    onChange={e => setInvoiceTerms(e.target.value)}
                    disabled={!isEditingAllowed}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-600 resize-none font-medium disabled:opacity-60"
                    placeholder="شروط الضمان أو الاسترجاع..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رسالة التذييل والترحيب (Footer Message)</label>
                  <textarea 
                    value={invoiceFooter} 
                    onChange={e => setInvoiceFooter(e.target.value)}
                    disabled={!isEditingAllowed}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-600 resize-none font-medium disabled:opacity-60"
                    placeholder="شكراً لزيارتكم ونتمنى لكم دوام التألق والجمال..."
                  />
                </div>

                {/* Display Toggles */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <h6 className="font-bold text-slate-800 text-xs mb-2">إظهار / إخفاء عناصر الفاتورة:</h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showClinicLogo} onChange={e => setShowClinicLogo(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>شعار المركز</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showClinicTaxNumber} onChange={e => setShowClinicTaxNumber(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>الرقم الضريبي</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showClinicAddress} onChange={e => setShowClinicAddress(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>عنوان الفرع</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showHandler} onChange={e => setShowHandler(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>اسم الخبير / المنفذ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showPaymentMethod} onChange={e => setShowPaymentMethod(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>طريقة الدفع</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showCustomerPhone} onChange={e => setShowCustomerPhone(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>هاتف العميل</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showDueBalance} onChange={e => setShowDueBalance(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>المبلغ المتبقي</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showSignatureStamp} onChange={e => setShowSignatureStamp(e.target.checked)} disabled={!isEditingAllowed} className="rounded text-indigo-600" />
                      <span>خانة التوقيع والختم</span>
                    </label>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: Voice Call & Sound Settings */}
            {activeTab === 'voice' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-purple-600 text-white rounded-xl">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">إعدادات النداء الصوتي والمناداة</h5>
                    <p className="text-xs text-slate-500">ضبط لغة المناداة التلقائية والصيغ المعتمدة</p>
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">لغة النداء الصوتي:</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setVoiceLanguage('ar')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        voiceLanguage === 'ar'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">🇸🇦</span>
                      <span className="text-xs font-bold">عربي فقط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoiceLanguage('en')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        voiceLanguage === 'en'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">🇬🇧</span>
                      <span className="text-xs font-bold">English Only</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoiceLanguage('both')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        voiceLanguage === 'both'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">🌐</span>
                      <span className="text-xs font-bold">عربي + إنجليزي</span>
                    </button>
                  </div>
                </div>

                {/* Chime Bell Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                      <Bell size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">نغمة التنبيه الرنانة (Chime Bell)</div>
                      <div className="text-[10.5px] text-slate-500">تشغيل نغمة صوتية تسبق المناداة للفت الانتباه</div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={voiceEnableChime}
                      onChange={(e) => setVoiceEnableChime(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Phrasing templates */}
                {(voiceLanguage === 'ar' || voiceLanguage === 'both') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      صيغة النداء بالعربية (استخدم <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-mono">{'{name}'}</code> لاسم العميل):
                    </label>
                    <input 
                      type="text" 
                      value={voiceArabicPhrase} 
                      onChange={e => setVoiceArabicPhrase(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-purple-600"
                      placeholder="العميلة {name}، تفضلي بالدخول لغرفة الجلسة"
                    />
                  </div>
                )}

                {(voiceLanguage === 'en' || voiceLanguage === 'both') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      صيغة النداء بالإنجليزية (English with <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-mono">{'{name}'}</code>):
                    </label>
                    <input 
                      type="text" 
                      value={voiceEnglishPhrase} 
                      onChange={e => setVoiceEnglishPhrase(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-purple-600 text-left font-sans font-bold"
                      placeholder="Client {name}, please proceed to the treatment room"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Voice Speed & Pitch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>سرعة النطق:</span>
                      <span className="text-purple-700 font-mono">{voiceRate}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.7" 
                      max="1.3" 
                      step="0.05"
                      value={voiceRate}
                      onChange={e => setVoiceRate(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>طبقة الصوت:</span>
                      <span className="text-purple-700 font-mono">{voicePitch}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="1.2" 
                      step="0.05"
                      value={voicePitch}
                      onChange={e => setVoicePitch(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Test Voice Button */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-purple-900">
                    <span className="font-bold block">فحص الصوت التجريبي:</span>
                    <span className="text-slate-500 text-[10px]">استماع لحظي لصوت المناداة بالخيارات المحددة</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleVoiceTest}
                    disabled={isPlayingVoiceTest}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={13} className={isPlayingVoiceTest ? 'animate-spin' : ''} />
                    {isPlayingVoiceTest ? 'جاري التشغيل...' : 'تجربة الصوت'}
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-100/70 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full flex items-center justify-between mb-3 text-slate-600">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800">
                <Eye size={16} className="text-indigo-600" />
                معاينة حية ومباشرة للفاتورة:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono font-bold">
                  {invoiceType === 'pos80' ? 'POS 80mm' : 'A4 Size'}
                </span>
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  title="طباعة تجريبية"
                >
                  <Printer size={12} />
                  <span>طباعة تجربة</span>
                </button>
              </div>
            </div>

            {/* The Rendered Preview Paper */}
            <div 
              className={`bg-white rounded-2xl shadow-md border border-slate-200 text-slate-800 transition-all font-[Cairo] ${
                invoiceType === 'pos80' ? 'w-[320px] p-4 text-[11px]' : 'w-full max-w-[420px] p-6 text-[12.5px]'
              }`}
            >
              {/* Header */}
              <div className={`text-center border-b pb-3 mb-3 ${invoiceType === 'pos80' ? 'border-dashed border-slate-300' : 'border-slate-800'}`}>
                {showClinicLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-12 mx-auto mb-1.5 object-contain" />
                ) : null}
                <h4 className="font-extrabold text-slate-900 text-sm m-0">{name || 'اسم مركز التجميل أو الصالون'}</h4>
                {invoiceSubtitle && <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{invoiceSubtitle}</div>}
                <div className="inline-block bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-bold text-slate-800 mt-1.5">
                  {invoiceTitle}
                </div>
              </div>

              {/* Branch & Invoice Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 text-[10.5px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الفاتورة:</span>
                  <span className="font-mono font-bold">#20260829</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ:</span>
                  <span>{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
                {showClinicTaxNumber && taxId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الرقم الضريبي:</span>
                    <span className="font-mono font-bold">{taxId}</span>
                  </div>
                )}
                {commercialRegister && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">السجل التجاري:</span>
                    <span className="font-mono">{commercialRegister}</span>
                  </div>
                )}
                {showClinicAddress && invoiceAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">العنوان:</span>
                    <span className="truncate max-w-[150px]">{invoiceAddress}</span>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 text-[10.5px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم العميل:</span>
                  <span className="font-bold text-slate-900">سارة عبدالله (مثال)</span>
                </div>
                {showCustomerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الهاتف:</span>
                    <span>0501234567</span>
                  </div>
                )}
                {showHandler && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الخبير المنفذ:</span>
                    <span className="text-indigo-600 font-bold">أخصائية البشرة</span>
                  </div>
                )}
                {showPaymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">طريقة الدفع:</span>
                    <span>مدى / شبكة</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse mb-3 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-1.5 text-right font-bold">الخدمة</th>
                    <th className="p-1.5 text-center font-bold">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-1.5">جلسة تنظيف بشرة هايدرافاشيل</td>
                    <td className="p-1.5 text-center font-bold">{(pricesIncludeVat ? sampleAmount : sampleSubtotal).toFixed(2)} {currency}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-2.5 space-y-1 text-[11px]">
                {showVat && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>المبلغ قبل الضريبة:</span>
                      <span>{sampleSubtotal.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة ({vatRate}%):</span>
                      <span>{sampleVatAmount.toFixed(2)} {currency}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between font-extrabold text-slate-900 text-xs pt-1 border-t border-slate-300">
                  <span>الإجمالي المستحق:</span>
                  <span>{sampleGrandTotal.toFixed(2)} {currency}</span>
                </div>
              </div>

              {/* QR Code Preview */}
              {showQrCode && previewQrUrl && (
                <div className="text-center mt-3 pt-2 border-t border-dashed border-slate-200">
                  <img src={previewQrUrl} alt="QR Code" className="w-20 h-20 mx-auto border border-slate-200 p-1 rounded-lg bg-white object-contain" />
                  <span className="text-[9px] text-slate-500 font-bold block mt-1">{qrLabel}</span>
                </div>
              )}

              {/* Terms */}
              {invoiceTerms && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-100 text-amber-800 rounded text-[9.5px] text-center">
                  {invoiceTerms}
                </div>
              )}

              {/* Signatures */}
              {showSignatureStamp && invoiceType === 'a4' && (
                <div className="flex justify-between text-[9px] text-slate-400 mt-4 pt-2 border-t border-dashed border-slate-200">
                  <span>توقيع العميل: ...................</span>
                  <span>ختم المركز: ...................</span>
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-3 text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                <div>{invoiceFooter}</div>
                {whatsappNumber && <div className="font-bold text-slate-700 mt-0.5">واتساب: {whatsappNumber}</div>}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4.5 px-6 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isEditingAllowed}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              isEditingAllowed 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-95' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
            }`}
          >
            {isEditingAllowed ? <Save size={16} /> : <Lock size={16} />}
            {isEditingAllowed ? 'حفظ واعتماد التعديلات للفرع' : 'التعديل معطل ومقفل من المطور 🔒'}
          </button>
        </div>

      </div>

      <WhatsappSettingsModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        targetClinicId={selectedClinicId}
      />
    </div>
  );
}
