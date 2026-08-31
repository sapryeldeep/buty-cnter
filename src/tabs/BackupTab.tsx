import React from 'react';
import { BackupManager } from '../components/BackupManager';
import { useStore } from '../store/useStore';
import { ReadOnlyNotice } from '../components/common/ReadOnlyNotice';

export default function BackupTab() {
  const { currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer';
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isBranchAdmin = currentUser?.role === 'branch_admin' || currentUser?.role === 'doctor';
  const hasFullAdminAccess = isDeveloper || isMasterAdmin || isBranchAdmin;

  return (
    <div className="p-2 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-[Cairo]">
      {!hasFullAdminAccess ? (
        <ReadOnlyNotice
          tabName="النسخ الاحتياطي واستعادة البيانات"
          description="يمكنك الاطلاع على حالة النسخ الاحتياطي ومواعيد آخر تصدير للبيانات. عمليات استعادة النسخ (Restore) وتفريغ البيانات محجوبة ومقتصرة على الإدارة العليا."
          allowedRolesText="أصحاب المراكز (Master Admins) / المطور"
        >
          <BackupManager isReadOnly={true} />
        </ReadOnlyNotice>
      ) : (
        <BackupManager isReadOnly={false} />
      )}
    </div>
  );
}
