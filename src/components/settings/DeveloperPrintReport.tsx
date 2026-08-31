import React from 'react';
import { QrCode } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const DeveloperPrintReport: React.FC = () => {
  const { data, currentUser } = useStore();

  const isDeveloper = currentUser?.role === 'developer';
  if (!isDeveloper) return null;

  const masterAdmins = data.users.filter(u => u.role === 'master_admin');
  const devCurrency = data.settings?.developerCurrency || 'EGP';

  // Calculations
  const totalSalesValue = masterAdmins.reduce((sum, admin) => {
    const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
    const designPrice = admin.designSalePrice || 5000;
    const bPrice = admin.branchSalePrice || 1500;
    return sum + designPrice + (bPrice * actualBranches);
  }, 0);

  const totalCollectedFromCenters = masterAdmins.reduce((sum, admin) => {
    return sum + (admin.paidAmountToDev || 0);
  }, 0);

  const totalPendingFromCenters = totalSalesValue - totalCollectedFromCenters;

  const totalDesignSales = masterAdmins.reduce((sum, admin) => sum + (admin.designSalePrice || 5000), 0);

  return (
    <div className="hidden print:block font-[Cairo] p-8 max-w-4xl mx-auto bg-white text-slate-900 space-y-6" dir="rtl">
      {/* Printable Report Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900">سند كشف الحسابات والتعاقدات السحابية</h1>
          <p className="text-xs text-slate-500 font-bold">المطور الرئيسي: صبري الديب</p>
          <p className="text-[10px] text-slate-400">sapry.eldeep@gmail.com</p>
        </div>
        <div className="text-left">
          <span className="text-lg font-black text-indigo-700 font-sans">SAPRY EL-DEEP</span>
          <p className="text-[10px] text-slate-500 font-mono font-bold mt-1">
            تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}
          </p>
        </div>
      </div>

      {/* Printable Summary cards */}
      <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="text-center">
          <span className="text-[10px] font-bold text-slate-500">إجمالي التعاقدات والمبيعات</span>
          <div className="text-lg font-black text-slate-900 mt-1">{totalSalesValue.toLocaleString('ar-EG')} {devCurrency}</div>
        </div>
        <div className="text-center border-x border-slate-200">
          <span className="text-[10px] font-bold text-emerald-600">إجمالي المبالغ المحصلة</span>
          <div className="text-lg font-black text-emerald-700 mt-1">{totalCollectedFromCenters.toLocaleString('ar-EG')} {devCurrency}</div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-rose-600">إجمالي المستحقات المعلقة (الآجل)</span>
          <div className="text-lg font-black text-rose-700 mt-1">{totalPendingFromCenters.toLocaleString('ar-EG')} {devCurrency}</div>
        </div>
      </div>

      {/* Printable Centers Ledger Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900">سجل تعاقدات المراكز والديون بالتفصيل</h2>
        <table className="w-full text-xs border-collapse border border-slate-300 text-slate-900">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-extrabold">
              <th className="border border-slate-300 p-2 text-right">اسم المركز</th>
              <th className="border border-slate-300 p-2 text-center">المستخدم / المرور</th>
              <th className="border border-slate-300 p-2 text-center">عقد التصميم</th>
              <th className="border border-slate-300 p-2 text-center">عقد الفرع</th>
              <th className="border border-slate-300 p-2 text-center">الفروع</th>
              <th className="border border-slate-300 p-2 text-center">الإجمالي</th>
              <th className="border border-slate-300 p-2 text-center">المدفوع كاش</th>
              <th className="border border-slate-300 p-2 text-center">المتبقي للمطور</th>
            </tr>
          </thead>
          <tbody>
            {masterAdmins.map(admin => {
              const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
              const designPrice = admin.designSalePrice || 5000;
              const bPrice = admin.branchSalePrice || 1500;
              const totalDue = designPrice + (bPrice * actualBranches);
              const paid = admin.paidAmountToDev || 0;
              const remaining = totalDue - paid;

              return (
                <tr key={admin.user} className="hover:bg-slate-50 font-medium">
                  <td className="border border-slate-300 p-2 font-extrabold">{admin.name}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono text-[10px]">{admin.user} / {admin.pass}</td>
                  <td className="border border-slate-300 p-2 text-center">{designPrice.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center">{bPrice.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-indigo-700">{actualBranches} فرع</td>
                  <td className="border border-slate-300 p-2 text-center font-bold">{totalDue.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">{paid.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center font-black text-rose-700">{remaining.toLocaleString('ar-EG')} {devCurrency}</td>
                </tr>
              );
            })}
            {/* Summary Bottom Row */}
            <tr className="bg-slate-100 font-bold text-slate-900 text-xs">
              <td colSpan={2} className="border border-slate-300 p-2 font-black text-right">الإجماليات العامة للمبيعات</td>
              <td className="border border-slate-300 p-2 text-center font-black">{totalDesignSales.toLocaleString('ar-EG')} {devCurrency}</td>
              <td className="border border-slate-300 p-2 text-center">-</td>
              <td className="border border-slate-300 p-2 text-center font-black text-indigo-700">{data.clinics.length} فروع</td>
              <td className="border border-slate-300 p-2 text-center font-black">{totalSalesValue.toLocaleString('ar-EG')} {devCurrency}</td>
              <td className="border border-slate-300 p-2 text-center font-black text-emerald-700">{totalCollectedFromCenters.toLocaleString('ar-EG')} {devCurrency}</td>
              <td className="border border-slate-300 p-2 text-center font-black text-rose-700">{totalPendingFromCenters.toLocaleString('ar-EG')} {devCurrency}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Printable Verification/Watermark & Signature Footer */}
      <div className="pt-12 flex justify-between items-end">
        <div className="space-y-2">
          <div className="inline-block bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <QrCode size={75} className="text-slate-800" />
          </div>
          <p className="text-[9px] text-slate-400 font-mono font-semibold">شامـل للجمـال v2.6 - كود تفعيل المطور: {currentUser?.user}</p>
        </div>

        <div className="text-center w-48 border-t border-slate-900 pt-2">
          <span className="text-xs font-black text-slate-900 block">توقيع واعتماد المطور</span>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">صبري الديب</span>
        </div>
      </div>
    </div>
  );
};
