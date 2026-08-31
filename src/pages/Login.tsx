import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles } from 'lucide-react';

export default function Login() {
  const { data, setCurrentUser, setActiveTab, updateData } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const found = data.users.find(x => x.user === username && x.pass === password);

    if (found) {
      const cId = found.clinicId;
      if (cId && cId !== 'master' && cId !== 'main_branch' && cId !== 'developer_system') {
        const clinic = data.clinics.find(x => x.id === cId);
        if (clinic) {
          const today = new Date().setHours(0,0,0,0);
          const expiryDate = new Date(clinic.expiryDate).setHours(0,0,0,0);
          if (today > expiryDate) {
            setError("عذراً، لقد انتهت صلاحية اشتراك هذا الفرع. يرجى التواصل مع الإدارة للتجديد.");
            return;
          }
        }
      }
      
      setCurrentUser(found);
      
      // Add Login Activity Log
      if (found.role !== 'developer') {
        let tenantId = found.tenantId || (found.role === 'master_admin' ? found.user : '');
        let centerName = '';
        if (found.role === 'master_admin') {
          centerName = found.name;
        } else if (found.clinicId && found.clinicId !== 'master') {
          const c = data.clinics.find(cl => cl.id === found.clinicId);
          if (c) {
            tenantId = tenantId || c.masterAdminId || c.tenantId || '';
            const masterAdminUser = data.users.find(u => u.user === tenantId);
            centerName = masterAdminUser?.name || '';
          }
        }

        const newLog = {
          id: Date.now().toString(),
          clinicId: found.clinicId,
          tenantId: tenantId || undefined,
          centerName: centerName || undefined,
          userName: found.name,
          action: 'تسجيل دخول',
          details: 'تم تسجيل الدخول للنظام [auth]',
          timestamp: new Date().toISOString()
        };
        const currentLogs = data.activityLogs || [];
        updateData({ activityLogs: [newLog, ...currentLogs].slice(0, 500) });
      }

      if (found.role === 'developer') {
        setActiveTab('dev-panel');
      } else if (found.role === 'master_admin') {
        setActiveTab('clinics');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setError("بيانات الدخول غير صحيحة!");
    }
  };

  const language = data.settings?.language || 'ar';
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] p-4 font-[Cairo]" dir={dir}>
      <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md shadow-sm text-center font-[Cairo]">
        <div className="mb-4 text-indigo-600 flex justify-center">
          <Sparkles size={48} />
        </div>
        <h3 className="font-bold text-2xl text-slate-900 mb-1">إدارة مراكز التجميل والفروع</h3>
        <p className="text-slate-500 text-sm mb-6">المنصة السحابية المتقدمة (ERP)</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="text-right space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1.5">اسم المستخدم</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              placeholder="أدخل اسم المستخدم"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1.5">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold text-lg rounded-xl py-3 mt-4 shadow-sm hover:bg-indigo-700 transition-all"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-200 border-dashed text-xs text-slate-500">
          نظام إدارة مراكز التجميل الاحترافي
        </div>
      </div>
    </div>
  );
}
