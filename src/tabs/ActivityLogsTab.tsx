import React from 'react';
import { ActivityLogsManager } from '../components/ActivityLogsManager';
import { useStore } from '../store/useStore';
import { ReadOnlyNotice } from '../components/common/ReadOnlyNotice';

export default function ActivityLogsTab() {
  const { currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer';
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isBranchAdmin = currentUser?.role === 'branch_admin' || currentUser?.role === 'doctor';
  const hasFullAdminAccess = isDeveloper || isMasterAdmin || isBranchAdmin;

  return (
    <div className="p-2 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-[Cairo]">
      {!hasFullAdminAccess ? (
        <ReadOnlyNotice 
          tabName="سجل النشاطات والعمليات"
          description="يمكنك الاطلاع على سجل العمليات ومتابعة الحركات الخاصة بفرعك فقط. لا تملك صلاحية تعديل أو تفريغ أو مسح السجلات."
          allowedRolesText="مدراء المراكز (Center Admins) / المطور"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <ActivityLogsManager isReadOnly={true} />
          </div>
        </ReadOnlyNotice>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <ActivityLogsManager isReadOnly={false} />
        </div>
      )}
    </div>
  );
}
