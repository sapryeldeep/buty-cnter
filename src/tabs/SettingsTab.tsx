import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trash } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { InvoiceSettingsModal } from '../components/InvoiceSettingsModal';
import { VoiceCallSettingsModal } from '../components/VoiceCallSettingsModal';
import { StaffPermissionsModal } from '../components/StaffPermissionsModal';

import { DeveloperHeader } from '../components/settings/DeveloperHeader';
import { DeveloperDashboardTab } from '../components/settings/DeveloperDashboardTab';
import { DeveloperTenantsTab } from '../components/settings/DeveloperTenantsTab';
import { DeveloperSystemSettingsTab } from '../components/settings/DeveloperSystemSettingsTab';
import { DeveloperMaintenanceTab } from '../components/settings/DeveloperMaintenanceTab';
import { DeveloperInvoiceEditModal } from '../components/settings/DeveloperInvoiceEditModal';
import { DeveloperInvoicePrintView } from '../components/settings/DeveloperInvoicePrintView';
import { DeveloperPrintReport } from '../components/settings/DeveloperPrintReport';
import { CenterAdminSettingsView } from '../components/settings/CenterAdminSettingsView';
import { ReadOnlyNotice } from '../components/common/ReadOnlyNotice';

export default function SettingsTab() {
  const { data, updateData, currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer' && currentUser?.user === 'sapry eldeep';
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isBranchAdmin = currentUser?.role === 'branch_admin' || currentUser?.role === 'doctor';
  const hasAdminRights = isDeveloper || isMasterAdmin || isBranchAdmin;

  // If user is not developer, render Center Admin / Branch Settings or ReadOnly View
  if (!isDeveloper) {
    if (!hasAdminRights) {
      return (
        <div className="p-2 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-[Cairo]">
          <ReadOnlyNotice
            tabName="إعدادات النظام والفرع"
            description="يمكنك الاطلاع على إعدادات الفرع والفاتورة. التعديل وضبط الهوية والنداء الصوتي مقيد لمدراء المراكز والفروع فقط."
            allowedRolesText="أصحاب المراكز (Master Admins) / مدراء الفروع"
          >
            <CenterAdminSettingsView isReadOnly={true} />
          </ReadOnlyNotice>
        </div>
      );
    }

    return (
      <div className="p-2 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-[Cairo]">
        <CenterAdminSettingsView isReadOnly={false} />
      </div>
    );
  }

  // Developer Full Control Center Flow
  // Active sub-tab state
  const [activeDevTab, setActiveDevTab] = useState<'dashboard' | 'tenants' | 'settings' | 'maintenance'>('dashboard');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Invoice editing & printing modal state
  const [editingInvoice, setEditingInvoice] = useState<{ invoice: any; type: 'subscription' | 'contract'; centerUser: string } | null>(null);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<any | null>(null);

  // User Deletion Prompt Modal State
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const masterAdmins = data.users.filter(u => u.role === 'master_admin');
  const devCurrency = data.settings?.developerCurrency || 'EGP';

  // Calculations for Excel Export
  const totalSalesValue = masterAdmins.reduce((sum, admin) => {
    const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
    const designPrice = admin.designSalePrice || 5000;
    const bPrice = admin.branchSalePrice || 1500;
    return sum + designPrice + (bPrice * actualBranches);
  }, 0);

  const totalCollectedFromCenters = masterAdmins.reduce((sum, admin) => {
    return sum + (admin.paidAmountToDev || 0);
  }, 0);

  const totalPendingFromCenters = totalSalesValue - totalCollectedFromCenters;
  const totalDesignSales = masterAdmins.reduce((sum, admin) => sum + (admin.designSalePrice || 5000), 0);

  const handleExportDevExcel = () => {
    const excelRows = masterAdmins.map(admin => {
      const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
      const designPrice = admin.designSalePrice || 5000;
      const bPrice = admin.branchSalePrice || 1500;
      const totalDue = designPrice + (bPrice * actualBranches);
      const paid = admin.paidAmountToDev || 0;
      const remaining = totalDue - paid;
      return {
        "اسم المركز الرئيسي": admin.name,
        "اسم مستخدم المسؤول": admin.user,
        "سعر تصميم السيستم": designPrice,
        "سعر ترخيص الفرع": bPrice,
        "عدد الفروع النشطة المنشأة": actualBranches,
        "إجمالي قيمة التعاقد": totalDue,
        "المبلغ المحصل كاش للمطور": paid,
        "المبلغ المتبقي المعلق": remaining,
      };
    });

    excelRows.push({
      "اسم المركز الرئيسي": "إجمالي الحسابات والمبيعات",
      "اسم مستخدم المسؤول": "",
      "سعر تصميم السيستم": totalDesignSales,
      "سعر ترخيص الفرع": 0,
      "عدد الفروع النشطة المنشأة": data.clinics.length,
      "إجمالي قيمة التعاقد": totalSalesValue,
      "المبلغ المحصل كاش للمطور": totalCollectedFromCenters,
      "المبلغ المتبقي المعلق": totalPendingFromCenters,
    });

    exportToExcel(excelRows, `حسابات_المطور_صبري_الديب_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  const handleDeleteUserPrompt = (username: string) => {
    setUserToDelete(username);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    updateData({
      users: data.users.filter(u => u.user !== userToDelete)
    });
    setUserToDelete(null);
  };

  const cancelDeleteUser = () => {
    setUserToDelete(null);
  };

  const handleOpenInvoiceModal = (inv: any, type: 'subscription' | 'contract', centerUser: string) => {
    setEditingInvoice({ invoice: inv, type, centerUser });
  };

  const handlePrintSingleInvoice = (inv: any) => {
    setActiveInvoiceForPrint(inv);
    setTimeout(() => {
      window.print();
      setTimeout(() => setActiveInvoiceForPrint(null), 1000);
    }, 150);
  };

  return (
    <>
      <div className="print:hidden space-y-6 font-[Cairo]">
        {/* Navigation Header */}
        <DeveloperHeader 
          activeDevTab={activeDevTab}
          setActiveDevTab={setActiveDevTab}
          onExportExcel={handleExportDevExcel}
          onPrint={handlePrintLedger}
        />

        {/* Tab 1: Developer Dashboard */}
        {activeDevTab === 'dashboard' && (
          <DeveloperDashboardTab onNavigate={setActiveDevTab} />
        )}

        {/* Tab 2: Master Admins, Tenants & Branches */}
        {activeDevTab === 'tenants' && (
          <DeveloperTenantsTab 
            onDeleteUserPrompt={handleDeleteUserPrompt}
            onOpenInvoiceModal={handleOpenInvoiceModal}
            onPrintInvoice={handlePrintSingleInvoice}
          />
        )}

        {/* Tab 3: System, Modules & Cloud Settings */}
        {activeDevTab === 'settings' && (
          <DeveloperSystemSettingsTab 
            onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenStaffModal={() => setIsStaffModalOpen(true)}
          />
        )}

        {/* Tab 4: Maintenance, Diagnostics & Backups */}
        {activeDevTab === 'maintenance' && (
          <DeveloperMaintenanceTab />
        )}
      </div>

      {/* Printable Single Voucher / Invoice */}
      {activeInvoiceForPrint && (
        <DeveloperInvoicePrintView invoice={activeInvoiceForPrint} />
      )}

      {/* Printable Full Ledger Sheet */}
      {!activeInvoiceForPrint && (
        <DeveloperPrintReport />
      )}

      {/* General Settings Modals */}
      <InvoiceSettingsModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      <VoiceCallSettingsModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      <StaffPermissionsModal 
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

      {/* Invoice Edit Modal */}
      {editingInvoice && (
        <DeveloperInvoiceEditModal
          isOpen={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          invoice={editingInvoice.invoice}
          invoiceType={editingInvoice.type}
          targetCenterUser={editingInvoice.centerUser}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="bg-rose-50 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Trash size={32} />
              </div>
              <h3 className="text-xl font-black text-rose-700 mb-2">تأكيد الحذف</h3>
              <p className="text-rose-600/80 text-sm font-semibold">
                هل أنت متأكد من رغبتك في حذف المستخدم ({userToDelete}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="p-6 bg-white flex gap-3">
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                نعم، احذف
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
    </>
  );
}
