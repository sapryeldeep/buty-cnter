import React from 'react';
import { Terminal, Activity, Building2, Settings, Database } from 'lucide-react';

export type DevTabType = 'dashboard' | 'tenants' | 'settings' | 'maintenance';

interface DeveloperHeaderProps {
  activeDevTab: DevTabType;
  setActiveDevTab: (tab: DevTabType) => void;
}

export const DeveloperHeader: React.FC<DeveloperHeaderProps> = ({
  activeDevTab,
  setActiveDevTab
}) => {
  return (
    <div className="bg-indigo-900 rounded-2xl p-6 shadow-sm text-white">
      <h5 className="font-bold text-xl mb-1 flex items-center gap-2">
        <Terminal size={24} />
        لوحة تحكم المطور صبري الديب
      </h5>
      <p className="text-indigo-200 text-sm mb-6">
        نظام إدارة المراكز، الحسابات المالية، التراخيص، وإدارة الفروع والسحابة
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-indigo-800 pt-4">
        <button
          onClick={() => setActiveDevTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeDevTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <Activity size={18} />
          إحصائيات المنصة والمبيعات
        </button>
        <button
          onClick={() => setActiveDevTab('tenants')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeDevTab === 'tenants'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <Building2 size={18} />
          إدارة المراكز والمشتركين
        </button>
        <button
          onClick={() => setActiveDevTab('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeDevTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <Settings size={18} />
          إعدادات النظام العامة
        </button>
        <button
          onClick={() => setActiveDevTab('maintenance')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            activeDevTab === 'maintenance'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <Database size={18} />
          الصيانة والنسخ الاحتياطي
        </button>
      </div>
    </div>
  );
};
