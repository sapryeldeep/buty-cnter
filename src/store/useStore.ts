import { create } from 'zustand';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { PlatformData, User, Clinic, PlatformSettings } from '../types';

interface AppState {
  data: PlatformData;
  currentUser: User | null;
  activeTab: string;
  viewingBranchId: string | null;
  isPublicBooking: boolean;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setActiveTab: (tab: string) => void;
  setViewingBranchId: (id: string | null) => void;
  setIsPublicBooking: (isPublic: boolean) => void;
  updateData: (newData: Partial<PlatformData>) => void;
  saveDataToFirebase: () => void;
  resetData: () => void;
}

const defaultSettings: PlatformSettings = {
  modules: {
    patients: true,
    appointments: true,
    finance: true,
    services: true,
    inventory: true,
    payroll: true,
    clinics: true,
    staff: true,
    archive: true,
    settings: true
  },
  customLabels: {
    patients: "العملاء",
    clinics: "الفروع"
  },
  language: 'ar',
  loyaltyPointsValue: 10
};

const defaultData: PlatformData = {
  users: [{ name: "صبري الديب", user: "sapry eldeep", pass: "159632", role: "developer", clinicId: "developer_system" }],
  clinics: [],
  services: [],
  queue: {},
  archive: {},
  appointments: {},
  beautyNotesStore: {},
  expensesStore: {},
  pharmacyStore: {},
  staffDirectory: {},
  payrollStore: {},
  lastDate: "",
  settings: defaultSettings
};

export const useStore = create<AppState>((setStore, get) => {
  // Listen to Firebase
  const dataRef = ref(rtdb, 'shamelBeautyCenterPlatformV26');
  onValue(dataRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      // Ensure developer exists and has correct role
      let users = val.users || [];
      const adminIndex = users.findIndex((x: User) => x.role === 'developer');
      if (adminIndex === -1) {
        users = [{ name: "صبري الديب", user: "sapry eldeep", pass: "159632", role: "developer", clinicId: "developer_system" }, ...users];
      } else {
        users[adminIndex].role = 'developer';
        users[adminIndex].clinicId = 'developer_system';
      }
      val.users = users;
      
      // Ensure settings exist
      if (!val.settings) {
        val.settings = defaultSettings;
      }
      setStore({ 
        data: { 
          ...defaultData, 
          ...val,
          users: users,
          clinics: val.clinics || [],
          services: val.services || [],
          queue: val.queue || {},
          archive: val.archive || {},
          appointments: val.appointments || {},
          beautyNotesStore: val.beautyNotesStore || {},
          expensesStore: val.expensesStore || {},
          pharmacyStore: val.pharmacyStore || {},
          staffDirectory: val.staffDirectory || {},
          payrollStore: val.payrollStore || {}
        } 
      });
    } else {
      // Initialize with default if empty
      set(dataRef, defaultData);
    }
  });

  return {
    data: defaultData,
    currentUser: null,
    activeTab: 'dashboard',
    viewingBranchId: null,
    isPublicBooking: window.location.search.includes('booking=true'),

    setCurrentUser: (user) => setStore({ currentUser: user }),
    setActiveTab: (tab) => setStore({ activeTab: tab }),
    setViewingBranchId: (id) => setStore({ viewingBranchId: id }),
    setIsPublicBooking: (isPublic) => setStore({ isPublicBooking: isPublic }),
    
    updateData: (newData) => {
      const currentData = get().data;
      const updated = { ...currentData, ...newData };
      setStore({ data: updated });
      // Async save
      set(ref(rtdb, 'shamelBeautyCenterPlatformV26'), updated).catch(console.error);
    },
    
    saveDataToFirebase: () => {
      set(ref(rtdb, 'shamelBeautyCenterPlatformV26'), get().data).catch(console.error);
    },
    
    resetData: () => {
      // Keep only the developer user and clear all other data
      const developerUser = get().data.users?.find(u => u.role === 'developer') || {
        name: "صبري الديب",
        user: "sapry eldeep",
        pass: "159632",
        role: "developer",
        clinicId: "developer_system"
      };
      
      const cleanData: PlatformData = {
        users: [developerUser],
        clinics: [],
        services: [],
        queue: {},
        archive: {},
        appointments: {},
        beautyNotesStore: {},
        expensesStore: {},
        pharmacyStore: {},
        staffDirectory: {},
        payrollStore: {},
        activityLogs: [],
        lastDate: "",
        settings: defaultSettings
      };
      
      setStore({ data: cleanData });
      set(ref(rtdb, 'shamelBeautyCenterPlatformV26'), cleanData).catch(console.error);
    }
  };
});
