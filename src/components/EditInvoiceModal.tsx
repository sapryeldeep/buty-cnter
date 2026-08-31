import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, DollarSign, Calendar, User, Phone, CheckCircle, HelpCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { recordActivityLog } from '../utils/activityLogger';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'subscription' | 'clinic';
  invoice: any; // Can be SubscriptionInvoice or RecordItem
  centerUser?: string; // Required for subscription invoices to find the center
  clinicId?: string; // Required for clinic/branch invoices
  onSave?: () => void;
}

export default function EditInvoiceModal({
  isOpen,
  onClose,
  type,
  invoice,
  centerUser,
  clinicId,
  onSave
}: EditInvoiceModalProps) {
  const { data, updateData, currentUser } = useStore();

  // Common/Branch invoice states
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [handler, setHandler] = useState('');
  const [payMethod, setPayMethod] = useState('نقدي');
  const [total, setTotal] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [date, setDate] = useState('');

  // Developer subscription invoice states
  const [amount, setAmount] = useState<number>(0);
  const [months, setMonths] = useState<number>(1);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');

  // Load invoice data when open
  useEffect(() => {
    if (!invoice) return;

    if (type === 'clinic') {
      setPatientName(invoice.name || '');
      setPhone(invoice.phone || '');
      setService(invoice.service || '');
      setHandler(invoice.handler || '');
      setPayMethod(invoice.payMethod || 'نقدي');
      setTotal(Number(invoice.total) || 0);
      setPaid(Number(invoice.paid) || 0);
      setDate(invoice.date || '');
    } else if (type === 'subscription') {
      setAmount(Number(invoice.amount) || 0);
      setMonths(Number(invoice.months) || 1);
      setPaymentStatus(invoice.paymentStatus || 'paid');
      setDate(invoice.date || '');
    }
  }, [invoice, type, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSave = () => {
    if (type === 'subscription') {
      if (!centerUser) {
        alert('خطأ: لم يتم تحديد مستخدم المركز');
        return;
      }

      const updatedUsers = data.users.map(u => {
        if (u.user === centerUser) {
          const updatedInvoices = (u.subscriptionInvoices || []).map(inv => {
            if (inv.id === invoice.id) {
              return {
                ...inv,
                amount: Number(amount),
                months: Number(months),
                date: date,
                paymentStatus: paymentStatus
              };
            }
            return inv;
          });
          return { ...u, subscriptionInvoices: updatedInvoices };
        }
        return u;
      });

      updateData({ users: updatedUsers });

      recordActivityLog(
        clinicId || 'master',
        currentUser?.name || 'مطور النظام',
        'تعديل فاتورة اشتراك سحابي',
        `تم تعديل فاتورة الاشتراك رقم ${invoice.id} للمركز ${centerUser} - بقيمة ${amount} لعدد ${months} أشهر`
      );

      alert('✅ تم تعديل فاتورة المطور بنجاح!');
    } else {
      if (!clinicId) {
        alert('خطأ: لم يتم تحديد فرع/مركز الفاتورة');
        return;
      }

      const queueInvoices = data.queue[clinicId] || [];
      const archiveInvoices = data.archive[clinicId] || [];

      const inQueue = queueInvoices.some(inv => inv.id === invoice.id);
      
      if (inQueue) {
        const updatedQueue = queueInvoices.map(inv => {
          if (inv.id === invoice.id) {
            return {
              ...inv,
              name: patientName,
              phone: phone,
              service: service,
              total: Number(total),
              paid: Number(paid),
              due: Math.max(0, Number(total) - Number(paid)),
              payMethod: payMethod,
              handler: handler,
              date: date
            };
          }
          return inv;
        });
        updateData({
          queue: { ...data.queue, [clinicId]: updatedQueue }
        });
      } else {
        const updatedArchive = archiveInvoices.map(inv => {
          if (inv.id === invoice.id) {
            return {
              ...inv,
              name: patientName,
              phone: phone,
              service: service,
              total: Number(total),
              paid: Number(paid),
              due: Math.max(0, Number(total) - Number(paid)),
              payMethod: payMethod,
              handler: handler,
              date: date
            };
          }
          return inv;
        });
        updateData({
          archive: { ...data.archive, [clinicId]: updatedArchive }
        });
      }

      recordActivityLog(
        clinicId,
        currentUser?.name || 'مدير النظام',
        'تعديل فاتورة فرع',
        `تم تعديل بيانات فاتورة العميل (${patientName}) - إجمالي: ${total}، مدفوع: ${paid}`
      );

      alert('✅ تم تعديل فاتورة الفرع بنجاح!');
    }

    if (onSave) onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-[Cairo]" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-indigo-300" />
            <h3 className="font-extrabold text-sm m-0">
              {type === 'subscription' 
                ? `تعديل فاتورة اشتراك المركز (${centerUser})` 
                : `تعديل فاتورة وسند العميل (${invoice.name || 'غير معروف'})`}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {type === 'subscription' ? (
            /* SUBSCRIPTION INVOICE EDIT FORM */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الفاتورة (لا يمكن تعديله)</label>
                <input 
                  type="text" 
                  value={invoice.id} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">قيمة الفاتورة</label>
                  <div className="relative">
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs"><DollarSign size={14} /></span>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(Number(e.target.value) || 0)} 
                      className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأشهر</label>
                  <input 
                    type="number" 
                    value={months} 
                    onChange={e => setMonths(Number(e.target.value) || 1)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الفاتورة</label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs"><Calendar size={14} /></span>
                  <input 
                    type="text" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    placeholder="مثال: 2026/08/30"
                    className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">حالة الدفع والتحصيل</label>
                <select 
                  value={paymentStatus} 
                  onChange={e => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                >
                  <option value="paid">✅ مدفوعة ومسددة بالكامل</option>
                  <option value="unpaid">❌ غير مدفوعة (آجل ذمة)</option>
                </select>
              </div>
            </div>
          ) : (
            /* CLINIC/BRANCH INVOICE EDIT FORM */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل</label>
                  <div className="relative">
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs"><User size={14} /></span>
                    <input 
                      type="text" 
                      value={patientName} 
                      onChange={e => setPatientName(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs"><Phone size={14} /></span>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الخدمات والجلسات المطلوبة</label>
                <input 
                  type="text" 
                  value={service} 
                  onChange={e => setService(e.target.value)} 
                  placeholder="مثال: فيلر شفايف + تنظيف بشرة"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الموظف / الأخصائي المسؤول</label>
                  <input 
                    type="text" 
                    value={handler} 
                    onChange={e => setHandler(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">طريقة الدفع</label>
                  <select 
                    value={payMethod} 
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  >
                    <option value="نقدي">💵 نقدي (كاش)</option>
                    <option value="شبكة">💳 مدى / شبكة</option>
                    <option value="فيزا">💳 فيزا / ماستر كارد</option>
                    <option value="تحويل بنكي">🏛️ تحويل بنكي</option>
                    <option value="InstaPay">📱 InstaPay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">إجمالي الفاتورة</label>
                  <input 
                    type="number" 
                    value={total} 
                    onChange={e => setTotal(Number(e.target.value) || 0)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ المدفوع</label>
                  <input 
                    type="number" 
                    value={paid} 
                    onChange={e => setPaid(Number(e.target.value) || 0)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">المتبقي (آجل)</label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-rose-600">
                    {Math.max(0, total - paid)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ ووقت الفاتورة</label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs"><Calendar size={14} /></span>
                  <input 
                    type="text" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            إلغاء
          </button>
          <button 
            onClick={handleSave} 
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save size={14} />
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}
