import React from 'react';
import { X, Save, Edit } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface DeveloperInvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  invoiceType: 'subscription' | 'contract';
  targetCenterUser: string;
}

export const DeveloperInvoiceEditModal: React.FC<DeveloperInvoiceEditModalProps> = ({
  isOpen,
  onClose,
  invoice,
  invoiceType,
  targetCenterUser
}) => {
  const { data, updateData } = useStore();

  if (!isOpen || !invoice) return null;

  const [date, setDate] = React.useState(invoice.date || '');
  const [months, setMonths] = React.useState(invoice.months || 1);
  const [amount, setAmount] = React.useState(invoice.amount || invoice.totalAmount || 0);
  const [paidAmount, setPaidAmount] = React.useState(invoice.paidAmount || 0);
  const [status, setStatus] = React.useState(invoice.paymentStatus || 'paid');
  const [notes, setNotes] = React.useState(invoice.notes || '');

  const handleSave = () => {
    if (invoiceType === 'subscription') {
      updateData({
        users: data.users.map(u => {
          if (u.user === targetCenterUser) {
            const updated = (u.subscriptionInvoices || []).map((inv: any) => {
              if (inv.id === invoice.id) {
                return {
                  ...inv,
                  date,
                  months: Number(months),
                  amount: Number(amount),
                  paymentStatus: status,
                  notes
                };
              }
              return inv;
            });
            return { ...u, subscriptionInvoices: updated };
          }
          return u;
        })
      });
      alert('تم تحديث بيانات فاتورة الاشتراك بنجاح!');
    } else {
      updateData({
        users: data.users.map(u => {
          if (u.user === targetCenterUser) {
            const updated = (u.contractInvoices || []).map((inv: any) => {
              if (inv.id === invoice.id) {
                const total = Number(amount);
                const paid = Number(paidAmount);
                return {
                  ...inv,
                  date,
                  totalAmount: total,
                  paidAmount: paid,
                  remainingAmount: total - paid,
                  notes
                };
              }
              return inv;
            });
            return { ...u, contractInvoices: updated };
          }
          return u;
        })
      });
      alert('تم تحديث سند التعاقد بنجاح!');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150" dir="rtl">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit size={18} className="text-indigo-400" />
            <h3 className="font-extrabold text-sm">
              تعديل {invoiceType === 'subscription' ? 'فاتورة اشتراك' : 'سند تعاقد وترخيص'} ({invoice.id})
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-[Cairo]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">تاريخ الفاتورة</label>
              <input 
                type="text" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-600"
              />
            </div>
            {invoiceType === 'subscription' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المدة بالأشهر</label>
                <input 
                  type="number" 
                  value={months} 
                  onChange={e => setMonths(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-600"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المبلغ المحصل كاش</label>
                <input 
                  type="number" 
                  value={paidAmount} 
                  onChange={e => setPaidAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-600 text-emerald-600"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {invoiceType === 'subscription' ? 'قيمة الاشتراك' : 'إجمالي قيمة العقد'}
              </label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-600 text-indigo-700"
              />
            </div>
            {invoiceType === 'subscription' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">حالة السداد</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-600"
                >
                  <option value="paid">مدفوع ومسدد ✅</option>
                  <option value="pending">آجل / غير مسدد ⏳</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظات الفاتورة</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold outline-none focus:border-indigo-600 resize-none"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save size={14} />
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};
