import { useStore } from '../store/useStore';
import { ActivityLog } from '../types';

export type ActivityCategory = 'auth' | 'finance' | 'staff' | 'backup' | 'client' | 'system' | 'expense' | 'payroll';

export function recordActivityLog(
  clinicId: string,
  userName: string,
  action: string,
  details: string,
  category?: ActivityCategory
) {
  try {
    const store = useStore.getState();
    const currentLogs = store.data.activityLogs || [];
    
    // Resolve tenantId and Center Name
    let tenantId = '';
    let centerName = '';
    
    if (clinicId && clinicId !== 'master' && clinicId !== 'main_branch') {
      const clinic = store.data.clinics.find(c => c.id === clinicId);
      if (clinic) {
        tenantId = clinic.masterAdminId || clinic.tenantId || '';
        const masterAdminUser = store.data.users.find(u => u.user === tenantId);
        centerName = masterAdminUser?.name || '';
      }
    } else {
      const userObj = store.data.users.find(u => u.name === userName || u.user === userName);
      if (userObj) {
        tenantId = userObj.tenantId || (userObj.role === 'master_admin' ? userObj.user : '');
        centerName = userObj.role === 'master_admin' ? userObj.name : '';
      }
    }
    
    const newLog: ActivityLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      clinicId: clinicId || 'master',
      tenantId: tenantId || undefined,
      centerName: centerName || undefined,
      userName: userName || 'مستخدم النظام',
      action,
      details: category ? `[${category}] ${details}` : details,
      timestamp: new Date().toISOString()
    };

    // Keep the latest 1000 logs
    const updatedLogs = [newLog, ...currentLogs].slice(0, 1000);
    store.updateData({ activityLogs: updatedLogs });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}
