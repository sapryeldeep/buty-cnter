import React from 'react';
import { QrCode, Receipt } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface DeveloperInvoicePrintViewProps {
  invoice: any;
}

export const DeveloperInvoicePrintView: React.FC<DeveloperInvoicePrintViewProps> = ({ invoice }) => {
  const { data } = useStore();
  if (!invoice) return null;

  const isContract = !!invoice.isContract;
  const currency = data.settings?.developerCurrency || 'EGP';

  return (
    <div className="hidden print:block font-[Cairo] p-8 max-w-3xl mx-auto bg-white text-slate-900" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            {isContract ? 'سند تعاقد وترخيص برمجيات رسمي' : 'فاتورة وسند تفعيل اشتراك سحابي'}
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            نظام إدارة وتطوير مراكز التجميل والعناية (الشامل للجمال)
          </p>
          <p className="text-[10px] text-slate-400">تطوير: صبري الديب - sapry.eldeep@gmail.com</p>
        </div>
        <div className="text-left">
          <span className="text-base font-black text-indigo-700 font-sans">SAPRY EL-DEEP</span>
          <div className="text-[11px] font-bold text-slate-700 font-mono mt-1">رقم السند: {invoice.id}</div>
          <div className="text-[10px] text-slate-500 font-mono">تاريخ الإصدار: {invoice.date}</div>
        </div>
      </div>

      {/* Target Center Information */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-slate-500 font-bold">الجهة المستفيدة (المركز): </span>
            <span className="font-black text-slate-900 text-sm">{invoice.centerName || 'مركز رئيسي'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold">اسم المستخدم: </span>
            <span className="font-mono font-bold text-slate-800">{invoice.centerUser || 'master'}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-600 border-t border-slate-200/80 pt-2">
          {isContract ? (
            <>
              <div>عدد الفروع المرخصة: <span className="font-bold text-indigo-700">{invoice.branchesCount || 0}</span></div>
              <div>سعر ترخيص الفرع: <span className="font-bold">{invoice.branchPrice || 0} {currency}</span></div>
            </>
          ) : (
            <>
              <div>مدة التفعيل: <span className="font-bold text-indigo-700">{invoice.months} أشهر</span></div>
              <div>تاريخ انتهاء الترخيص الجديد: <span className="font-bold text-slate-800">{invoice.expiryDate ? new Date(invoice.expiryDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Financial Details Table */}
      <table className="w-full text-xs border-collapse border border-slate-300 mb-6 text-right">
        <thead>
          <tr className="bg-slate-100 font-extrabold text-slate-800">
            <th className="border border-slate-300 p-2.5">البيان / الوصف</th>
            <th className="border border-slate-300 p-2.5 text-center">المبلغ المستحق</th>
            <th className="border border-slate-300 p-2.5 text-center">المسدد كاش</th>
            <th className="border border-slate-300 p-2.5 text-center">المتبقي (الآجل)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-3 font-bold">
              {isContract ? 'عقد شراء وترخيص البرمجيات وقاعدة البيانات السحابية' : `تجديد ترخيص سحابي لمدة (${invoice.months}) أشهر`}
              {invoice.notes && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{invoice.notes}</div>}
            </td>
            <td className="border border-slate-300 p-3 text-center font-black">
              {(invoice.totalAmount || invoice.amount || 0).toLocaleString('ar-EG')} {currency}
            </td>
            <td className="border border-slate-300 p-3 text-center font-bold text-emerald-700">
              {(isContract ? invoice.paidAmount : invoice.paymentStatus === 'paid' ? invoice.amount : 0).toLocaleString('ar-EG')} {currency}
            </td>
            <td className="border border-slate-300 p-3 text-center font-black text-rose-700">
              {(isContract ? invoice.remainingAmount : invoice.paymentStatus === 'paid' ? 0 : invoice.amount).toLocaleString('ar-EG')} {currency}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Notes & Signatures */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end">
        <div className="space-y-2">
          <div className="inline-block bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <QrCode size={65} className="text-slate-800" />
          </div>
          <p className="text-[9px] text-slate-400 font-mono">سند معتمد إلكترونياً - صبري الديب للبرمجيات</p>
        </div>

        <div className="text-center w-48 border-t border-slate-900 pt-2">
          <span className="text-xs font-black text-slate-900 block">توقيع واعتماد الإدارة البرمجية</span>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">صبري الديب</span>
        </div>
      </div>
    </div>
  );
};
