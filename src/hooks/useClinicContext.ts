import { useStore } from '../store/useStore';

export function useClinicContext() {
  const { data, currentUser, viewingBranchId, updateData } = useStore();

  const getCurrentClinicId = () => {
    if (currentUser?.role === 'developer') {
      if (viewingBranchId) return viewingBranchId;
      return (data.clinics && data.clinics.length > 0) ? data.clinics[0].id : 'developer_system';
    }
    if (currentUser?.role === 'master_admin') {
      const myClinics = data.clinics.filter(c => c.masterAdminId === currentUser.user);
      if (viewingBranchId && myClinics.some(c => c.id === viewingBranchId)) {
        return viewingBranchId;
      }
      return myClinics.length > 0 ? myClinics[0].id : 'master';
    }
    if (currentUser) {
      return currentUser.clinicId || 'master';
    }
    return 'master';
  };

  const currentClinicId = getCurrentClinicId();

  const getCurrentCurrency = () => {
    const cl = data.clinics.find(x => x.id === currentClinicId);
    return cl ? (cl.currency || 'EGP') : 'EGP';
  };
  
  const currentCurrency = getCurrentCurrency();

  const getCombinedAllRecords = () => {
    const queue = data.queue[currentClinicId] || [];
    const archive = data.archive[currentClinicId] || [];
    return [...queue, ...archive];
  };

  const changeCurrency = (newCurrency: string) => {
    const newClinics = [...data.clinics];
    const clIndex = newClinics.findIndex(x => x.id === currentClinicId);
    
    if (clIndex !== -1) {
      newClinics[clIndex] = { ...newClinics[clIndex], currency: newCurrency };
    } else if (currentClinicId === 'main_branch' || currentClinicId === 'master') {
      if (newClinics.length === 0) {
        newClinics.push({ 
          id: 'main_branch', 
          name: 'المركز الرئيسي', 
          currency: newCurrency, 
          expiryDate: new Date(Date.now() + 365*86400000).toISOString(),
          docName: 'Admin',
          daysCount: 365
        });
      } else {
        newClinics[0] = { ...newClinics[0], currency: newCurrency };
      }
    }
    
    updateData({ clinics: newClinics });
    alert(`تم تغيير عملة المركز إلى (${newCurrency}) بنجاح!`);
  };

  return {
    currentClinicId,
    currentCurrency,
    changeCurrency,
    getCombinedAllRecords
  };
}
