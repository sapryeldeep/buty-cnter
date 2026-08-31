import React, { useState } from 'react';
import { Package, AlertCircle, TrendingDown, Plus, Trash2, Edit, Save, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { ExportButtons } from '../components/ExportButtons';
import { PharmacyItem } from '../types';
import { recordActivityLog } from '../utils/activityLogger';

export default function InventoryTab() {
  const { data, updateData, currentUser } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isPrintAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisablePrintInventory !== true && (center?.permissions?.printFull !== false || currentUser?.permissions?.canPrintInventory !== false));
  const isDownloadAllowed = currentUser?.role === 'developer' || ((center?.permissions?.devDisableExportExcel !== true || center?.permissions?.devDisableExportPDF !== true) && (center?.permissions?.downloadFull !== false || currentUser?.permissions?.canExportData !== false));

  const inventoryItems: PharmacyItem[] = data.pharmacyStore?.[currentClinicId] || [
    { id: 1, name: 'فيلر جوفيديرم Ultra', qty: 15, price: 1200, expiry: '2027-12-31' },
    { id: 2, name: 'بوتوكس أليرجان 100 وحدة', qty: 3, price: 950, expiry: '2026-11-30' },
    { id: 3, name: 'سيروم فيتامين سي كولاجين', qty: 24, price: 350, expiry: '2028-06-30' },
    { id: 4, name: 'شفرات ديرمابلانينج معقمة', qty: 150, price: 25, expiry: '2029-01-01' },
    { id: 5, name: 'ميزوثيرابي نضارة وتفتيح', qty: 8, price: 600, expiry: '2027-08-15' },
  ];

  const [name, setName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [expiry, setExpiry] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || qty <= 0) {
      alert('يرجى كتابة اسم الصنف والكمية بشكل صحيح');
      return;
    }

    const newItem: PharmacyItem = {
      id: Date.now(),
      name,
      qty,
      price,
      expiry
    };

    const updated = [newItem, ...inventoryItems];
    updateData({
      pharmacyStore: {
        ...(data.pharmacyStore || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'إضافة صنف مخزون',
      `تم إضافة الصنف (${name}) برصيد ${qty} للفرع`
    );

    setName('');
    setQty(1);
    setPrice(0);
    alert('تم إضافة الصنف إلى المخزون بنجاح!');
  };

  const handleRemoveItem = (id: number, itemName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصنف (${itemName}) من المخزون؟`)) return;

    const updated = inventoryItems.filter(i => i.id !== id);
    updateData({
      pharmacyStore: {
        ...(data.pharmacyStore || {}),
        [currentClinicId]: updated
      }
    });

    recordActivityLog(
      currentClinicId,
      currentUser?.name || 'مستخدم',
      'حذف صنف مخزون',
      `تم حذف الصنف (${itemName}) من المخزون`
    );
  };

  const handleUpdateQty = (id: number, delta: number) => {
    const updated = inventoryItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    });

    updateData({
      pharmacyStore: {
        ...(data.pharmacyStore || {}),
        [currentClinicId]: updated
      }
    });
  };

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalInventoryValue = inventoryItems.reduce((acc, curr) => acc + (curr.qty * (curr.price || 0)), 0);
  const lowStockCount = inventoryItems.filter(i => i.qty <= 5).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <Package className="text-indigo-600" size={24} />
            إدارة المخزون والمستحضرات التجميلية
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            متابعة دقيقة للأرصدة، تنبيهات النواقص، القيمة الإجمالية للمخزون، وتواريخ الصلاحية.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-indigo-700 font-bold">قيمة المخزون الإجمالية</div>
            <div className="text-base font-black text-indigo-900">{totalInventoryValue.toLocaleString()} {currentCurrency}</div>
          </div>
          {lowStockCount > 0 && (
            <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-rose-700 font-bold">أصناف قاربت النفاد</div>
              <div className="text-base font-black text-rose-900">{lowStockCount} أصناف</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add item form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h6 className="font-bold mb-4 text-indigo-600 flex items-center gap-2">
              <Plus size={18} />
              إضافة صنف / مستحضر جديد
            </h6>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصنف أو المستحضر</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                  placeholder="مثال: فيلر، بوتوكس، خيوط شد..." 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الكمية الأولية</label>
                  <input 
                    type="number" 
                    value={qty} 
                    onChange={e => setQty(parseInt(e.target.value) || 0)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                    min="1" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">سعر التكلفة / الوحدة</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ انتهاء الصلاحية</label>
                <input 
                  type="date" 
                  value={expiry} 
                  onChange={e => setExpiry(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 transition-colors" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2.5 mt-2 shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Package size={16} />
                حفظ الصنف بالمخزون
              </button>
            </form>
          </div>
        </div>

        {/* Inventory list */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full" id="print-inventory">
            <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
              <h6 className="font-bold text-slate-900 m-0 flex items-center gap-2">
                <Package size={18} className="text-indigo-600" />
                سجل أصناف المخزون المتاحة ({filteredItems.length})
              </h6>

              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="بحث في المخزون..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 w-44"
                />
                {isPrintAllowed && isDownloadAllowed && (
                  <ExportButtons 
                    data={filteredItems}
                    pdfHeaders={['الصنف', 'الرصيد', 'سعر الوحدة', 'القيمة الإجمالية', 'تاريخ الصلاحية']}
                    pdfData={filteredItems.map(item => [item.name, item.qty, item.price, item.qty * (item.price || 0), item.expiry || 'ساري'])}
                    filename="inventory_report"
                    title="تقرير جرد المخزون التجميلي"
                    printElementId="print-inventory"
                  />
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 font-bold">الصنف</th>
                    <th className="p-3 font-bold">الرصيد</th>
                    <th className="p-3 font-bold">سعر الوحدة ({currentCurrency})</th>
                    <th className="p-3 font-bold">إجمالي القيمة</th>
                    <th className="p-3 font-bold">الصلاحية</th>
                    <th className="p-3 font-bold">الحالة</th>
                    <th className="p-3 font-bold no-print">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد أصناف في المخزون تطابق البحث
                      </td>
                    </tr>
                  ) : filteredItems.map(item => {
                    const isLow = item.qty <= 5;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{item.name}</td>
                        <td className="p-3 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-black ${isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'}`}>
                              {item.qty}
                            </span>
                            <div className="flex flex-col gap-0.5 no-print">
                              <button 
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1 rounded font-bold"
                                title="زيادة رصيد +1"
                              >
                                +
                              </button>
                              <button 
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1 rounded font-bold"
                                title="صرف رصيد -1"
                              >
                                -
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{item.price || 0}</td>
                        <td className="p-3 font-bold text-indigo-700 font-mono">{((item.price || 0) * item.qty).toLocaleString()}</td>
                        <td className="p-3 text-slate-500 font-mono text-xs">{item.expiry || '--'}</td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="flex items-center gap-1 text-rose-600 text-xs font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <TrendingDown size={13} /> منخفض
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              متوفر
                            </span>
                          )}
                        </td>
                        <td className="p-3 no-print">
                          <button 
                            onClick={() => handleRemoveItem(item.id, item.name)} 
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف من المخزون"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
