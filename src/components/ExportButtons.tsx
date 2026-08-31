import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import React from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { exportToExcel, exportHTMLToPDF, printElement } from '../utils/exportUtils';

interface ExportButtonsProps {
  data: any[];
  pdfHeaders: string[];
  pdfData: any[][];
  filename: string;
  title: string;
  printElementId: string;
}

export function ExportButtons({ data, pdfHeaders, pdfData, filename, title, printElementId }: ExportButtonsProps) {

  const { data: storeData, currentUser } = useStore();
  const { currentClinicId } = useClinicContext();
  const currentClinic = storeData.clinics.find(c => c.id === currentClinicId);

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = storeData.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return storeData.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };

  const center = getCenterForUser();
  const isDev = currentUser?.role === 'developer';

  // Granular check for Excel export
  const isExcelDisabled = !isDev && (
    center?.permissions?.devDisableExportExcel === true ||
    (currentUser?.permissions?.downloadFull === false && currentUser?.permissions?.canExportExcel === false && currentUser?.permissions?.canExportData === false)
  );

  // Granular check for PDF export
  const isPdfDisabled = !isDev && (
    center?.permissions?.devDisableExportPDF === true ||
    (currentUser?.permissions?.downloadFull === false && currentUser?.permissions?.canExportPDF === false && currentUser?.permissions?.canExportData === false)
  );

  // Granular check for Report/Table Printing
  const isPrintDisabled = !isDev && (
    center?.permissions?.devDisablePrintReports === true ||
    (center?.permissions?.printFull === false && currentUser?.permissions?.canExportData === false && currentUser?.permissions?.canPrintFinance === false && currentUser?.permissions?.canPrintPatients === false)
  );

  return (
    <div className="flex items-center gap-2 no-print">
      {!isPrintDisabled && (
        <button 
          onClick={() => printElement(printElementId, title)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors shadow-sm"
          title="طباعة / معاينة ورقية"
        >
          <Printer size={16} /> طباعة
        </button>
      )}
      {!isExcelDisabled && (
        <button 
          onClick={() => exportToExcel(data, filename)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors border border-green-200/50 shadow-sm"
          title="تصدير كملف إكسيل (.xlsx)"
        >
          <Download size={16} /> إكسيل
        </button>
      )}
      {!isPdfDisabled && (
        <button 
          onClick={() => exportHTMLToPDF(printElementId, filename, currentClinic, title)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors border border-red-200/50 shadow-sm"
          title="تصدير مستند PDF"
        >
          <FileText size={16} /> PDF
        </button>
      )}
    </div>
  );
}
