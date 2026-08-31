import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Scissors, Trash2 } from 'lucide-react';
import { useClinicContext } from '../hooks/useClinicContext';

export default function ServicesTab() {
  const { data, updateData } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);

  // Filter services belonging to the current clinic or global fallback
  const clinicServices = (data.services || []).filter(s => !s.clinicId || s.clinicId === currentClinicId);

  const handleAdd = () => {
    if (!name) return;
    const newService = { name, price, clinicId: currentClinicId };
    const newServices = [...(data.services || []), newService];
    updateData({ services: newServices });
    setName('');
    setPrice(0);
  };

  const handleRemove = (serviceItem: { name: string, price: number, clinicId?: string }) => {
    const newServices = (data.services || []).filter(s => !(s.name === serviceItem.name && (s.clinicId === serviceItem.clinicId || (!s.clinicId && !serviceItem.clinicId))));
    updateData({ services: newServices });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold text-indigo-600 mb-4 flex items-center gap-2">
            <Scissors size={18} />
            إضافة خدمة أو باقة تجميل جديدة
          </h6>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم الخدمة / الباقة</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                placeholder="مثال: تنظيف بشرة عميق، صبغة شعر..." 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">السعر ({currentCurrency})</label>
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(parseFloat(e.target.value) || 0)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
                min="0" 
              />
            </div>
            <button 
              onClick={handleAdd}
              className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2 mt-2 shadow-sm hover:bg-indigo-700 transition-colors"
            >
              إضافة الخدمة
            </button>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
          <h6 className="font-bold text-slate-900 mb-4">دليل الخدمات والباقات المتاحة ({clinicServices.length})</h6>
          
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">الخدمة</th>
                  <th className="p-3">السعر ({currentCurrency})</th>
                  <th className="p-3">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clinicServices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">لا توجد خدمات مسجلة بعد في هذا الفرع</td>
                  </tr>
                ) : (
                  clinicServices.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-indigo-600 font-bold">{s.price}</td>
                      <td className="p-3">
                        <button onClick={() => handleRemove(s)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
