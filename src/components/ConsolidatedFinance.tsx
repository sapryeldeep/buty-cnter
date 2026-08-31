import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { Building2, Globe, Calculator, PieChart, TrendingUp, Printer } from 'lucide-react';
import { CurrencyConverter } from './CurrencyConverter';
import { ExportButtons } from './ExportButtons';

const CURRENCIES = ['USD', 'EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'EUR', 'GBP'];

export function ConsolidatedFinance() {
  const { data, currentUser } = useStore();
  const { convert, loading } = useExchangeRates();
  const [baseCurrency, setBaseCurrency] = useState('USD');

  // Compute branch financials
  const accessibleClinics = currentUser?.role === "developer" ? data.clinics : currentUser?.role === "master_admin" ? data.clinics.filter(c => c.masterAdminId === currentUser.user) : data.clinics.filter(c => c.id === currentUser?.clinicId);
  const branchesStats = accessibleClinics.map(clinic => {
    const queue = data.queue[clinic.id] || [];
    const archive = data.archive[clinic.id] || [];
    const expenses = data.expensesStore[clinic.id] || [];

    const allRecords = [...queue.filter(q => q.status === 'done'), ...archive];
    
    const totalRev = allRecords.reduce((sum, r) => sum + (r.paid || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRev - totalExp;

    const revConverted = convert(totalRev, clinic.currency, baseCurrency);
    const expConverted = convert(totalExp, clinic.currency, baseCurrency);
    const netConverted = convert(netProfit, clinic.currency, baseCurrency);

    return {
      id: clinic.id,
      name: clinic.name,
      currency: clinic.currency,
      localRev: totalRev,
      localExp: totalExp,
      localNet: netProfit,
      baseRev: revConverted,
      baseExp: expConverted,
      baseNet: netConverted
    };
  });

  const grandTotalRev = branchesStats.reduce((sum, b) => sum + b.baseRev, 0);
  const grandTotalExp = branchesStats.reduce((sum, b) => sum + b.baseExp, 0);
  const grandNetProfit = branchesStats.reduce((sum, b) => sum + b.baseNet, 0);

  return (
    <div className="space-y-6">
      {/* Top Grand Totals */}
      <div className="flex justify-end mb-4 no-print">
        <button 
           onClick={() => window.print()}
           className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-sm font-bold transition-colors"
         >
           <Printer size={16} /> طباعة المركز المالي المجمع
         </button>
      </div>
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-md text-white relative overflow-hidden">
        <div className="absolute opacity-10 top-0 left-0 w-full h-full pointer-events-none">
           <Globe size={120} className="absolute -left-10 -top-10" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
          <div>
            <h5 className="font-bold text-xl mb-1 flex items-center gap-2">
              <Building2 size={24} />
              المالية المجمعة للفروع
            </h5>
            <p className="text-indigo-100 text-sm">تجميع آلي للإيرادات والمصروفات لكافة الفروع</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/20 no-print">
            <span className="text-sm font-bold">عملة التقرير:</span>
            <select 
              value={baseCurrency}
              onChange={e => setBaseCurrency(e.target.value)}
              className="bg-transparent border-none outline-none text-white font-bold cursor-pointer"
            >
              {CURRENCIES.map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <div className="text-indigo-100 text-sm mb-1">إجمالي الإيرادات</div>
            <div className="text-3xl font-bold">{grandTotalRev.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base font-normal">{baseCurrency}</span></div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <div className="text-indigo-100 text-sm mb-1">إجمالي المصروفات</div>
            <div className="text-3xl font-bold">{grandTotalExp.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base font-normal">{baseCurrency}</span></div>
          </div>
          <div className="bg-white/20 rounded-xl p-4 border border-white/20 shadow-inner">
            <div className="text-indigo-100 text-sm mb-1">صافي الأرباح العام</div>
            <div className="text-3xl font-bold">{grandNetProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base font-normal">{baseCurrency}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          {/* Detailed Branches Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200" id="print-consolidated-finance">
            <div className="flex justify-between items-center mb-4">
              <h6 className="font-bold text-indigo-600 flex items-center gap-2 m-0">
                <PieChart size={18} />
                تفصيل الفروع
              </h6>
              <ExportButtons 
                data={branchesStats}
                pdfHeaders={['الفرع', 'الإيراد (محلي)', 'المصروف (محلي)', 'الصافي (محلي)', `الصافي المجمع (${baseCurrency})`]}
                pdfData={branchesStats.map(b => [b.name, `${b.localRev} ${b.currency}`, `${b.localExp} ${b.currency}`, `${b.localNet} ${b.currency}`, b.baseNet.toFixed(2)])}
                filename="consolidated_finance_report"
                title="تقرير المالية المجمعة"
                printElementId="print-consolidated-finance"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="p-3">الفرع</th>
                    <th className="p-3">الإيراد (محلي)</th>
                    <th className="p-3">المصروف (محلي)</th>
                    <th className="p-3">الصافي (محلي)</th>
                    <th className="p-3 bg-indigo-50/50">الصافي المجمع ({baseCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchesStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">لا يوجد فروع مسجلة</td>
                    </tr>
                  ) : branchesStats.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{b.name}</td>
                      <td className="p-3">
                        <span className="text-green-600 font-bold">{b.localRev.toLocaleString()}</span> <span className="text-xs text-slate-400">{b.currency}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-red-500 font-bold">{b.localExp.toLocaleString()}</span> <span className="text-xs text-slate-400">{b.currency}</span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${b.localNet >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{b.localNet.toLocaleString()}</span> <span className="text-xs text-slate-400">{b.currency}</span>
                      </td>
                      <td className="p-3 bg-indigo-50/30 font-bold text-indigo-700">
                        {b.baseNet.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {loading && (
              <div className="text-xs text-indigo-500 mt-4 flex items-center justify-center no-print">
                جاري تحديث أسعار الصرف الحية...
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 no-print">
          <CurrencyConverter />
        </div>
      </div>
    </div>
  );
}
