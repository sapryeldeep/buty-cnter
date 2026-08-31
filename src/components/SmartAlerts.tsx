import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { Bell, AlertTriangle, Clock, Wallet, X, Package } from 'lucide-react';

export function SmartAlerts() {
  const { data } = useStore();
  const { currentClinicId } = useClinicContext();
  const [alerts, setAlerts] = useState<{ id: string, type: 'warning' | 'info' | 'error', message: string, icon: React.ReactNode }[]>([]);
  
  useEffect(() => {
    const newAlerts = [];
    
    // 1. Appointments (Queue waiting)
    const queue = data.queue[currentClinicId] || [];
    const waitingCount = queue.filter(q => q.status === 'waiting').length;
    if (waitingCount > 0) {
      newAlerts.push({
        id: 'waiting',
        type: 'info',
        message: `يوجد ${waitingCount} عميل(ة) في قائمة الانتظار الحالية لجلسات اليوم.`,
        icon: <Clock size={16} />
      });
    }

    // 2. Financial (Unpaid invoices)
    const unpaidCount = queue.filter(q => (q.total || 0) > (q.paid || 0)).length;
    if (unpaidCount > 0) {
      newAlerts.push({
        id: 'unpaid',
        type: 'warning',
        message: `يوجد ${unpaidCount} فاتورة غير مسددة بالكامل في سجلات اليوم. يرجى المراجعة.`,
        icon: <Wallet size={16} />
      });
    }

    // 3. High Expenses
    const expenses = data.expensesStore[currentClinicId] || [];
    const todayStr = new Date().toLocaleDateString('ar-EG');
    const todayExpenses = expenses.filter(e => e.date === todayStr);
    const highExpense = todayExpenses.find(e => (e.amount || 0) > 5000);
    if (highExpense) {
      newAlerts.push({
        id: 'expense',
        type: 'error',
        message: `نشاط مالي عاجل: تم تسجيل مصروف مالي عالي القيمة (${highExpense.amount}) اليوم لـ "${highExpense.desc}".`,
        icon: <AlertTriangle size={16} />
      });
    }

    // 4. Real Low Inventory Check
    const inventory = data.pharmacyStore?.[currentClinicId] || [];
    const lowStockItems = inventory.filter(item => item.qty <= 5);
    lowStockItems.forEach(item => {
      newAlerts.push({
        id: `inv-${item.id}`,
        type: 'warning',
        message: `تنبيه نقص مخزون: (${item.name}) أوشك على النفاذ (الرصيد المتبقي: ${item.qty} فقط).`,
        icon: <Package size={16} />
      });
    });

    setAlerts(newAlerts);
  }, [data, currentClinicId]);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold">
        <Bell size={18} className="text-amber-500" />
        نظام التنبيهات الذكي
      </div>
      {alerts.map(alert => (
        <div key={alert.id} className={`flex items-center justify-between p-3 rounded-xl border shadow-sm ${
          alert.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
          alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
          'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {alert.icon}
            {alert.message}
          </div>
          <button onClick={() => dismissAlert(alert.id)} className="p-1 hover:bg-black/5 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
