import React, { useState } from 'react';
import { Archive, Folder, Clock, Printer, Edit } from 'lucide-react';
import { printInvoice } from '../utils/exportUtils';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { ExportButtons } from '../components/ExportButtons';
import EditInvoiceModal from '../components/EditInvoiceModal';

export default function ArchiveTab() {
  const { data } = useStore();
  const { currentClinicId } = useClinicContext();
  const archive = data.archive[currentClinicId] || [];

  // Edit Invoice Modal State
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  return (
    <div className="space-y-6 font-[Cairo]" dir="rtl">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-archive">
        <div className="flex justify-between items-center mb-6">
          <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0 font-[Cairo]">
            <Archive size={18} />
            أرشيف الجلسات والسجلات السابقة
          </h6>
          <ExportButtons 
            data={archive}
            pdfHeaders={['العميل', 'رقم الهاتف', 'الخدمة', 'التاريخ']}
            pdfData={archive.map(a => [a.name, a.phone, a.service, a.isoDate || a.date])}
            filename="archive_report"
            title="أرشيف الجلسات"
            printElementId="print-archive"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">اسم العميل</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">الخدمة / الجلسة</th>
                <th className="p-3">تاريخ الإضافة للأرشيف</th>
                <th className="p-3 no-print text-center">الإجراءات والخيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {archive.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">الأرشيف فارغ حالياً</td></tr>
              ) : archive.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold flex items-center gap-2 text-slate-900">
                    <Folder size={14} className="text-slate-400"/> 
                    {a.name}
                  </td>
                  <td className="p-3 text-slate-500 font-mono text-xs">{a.phone}</td>
                  <td className="p-3 text-slate-700">{a.service}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock size={12}/> {a.isoDate || a.date}
                    </span>
                  </td>
                  <td className="p-3 no-print">
                    <div className="flex gap-1.5 items-center justify-center">
                      <button 
                        onClick={() => printInvoice(a, data.clinics.find(c => c.id === currentClinicId))}
                        className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors border border-indigo-200/50"
                        title="طباعة الفاتورة الضريبية"
                      >
                        <Printer size={13} /> طباعة 🖨️
                      </button>
                      <button 
                        onClick={() => setEditingInvoice(a)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors border border-amber-200/50"
                        title="تعديل الفاتورة"
                      >
                        <Edit size={13} /> تعديل ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        isOpen={editingInvoice !== null}
        onClose={() => setEditingInvoice(null)}
        type="clinic"
        invoice={editingInvoice}
        clinicId={currentClinicId}
      />
    </div>
  );
}
