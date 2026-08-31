import React, { useState } from 'react';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { ArrowLeftRight, Calculator } from 'lucide-react';

const CURRENCIES = ['USD', 'EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'EUR', 'GBP'];

export function CurrencyConverter() {
  const { convert, loading } = useExchangeRates();
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EGP');

  const result = convert(amount, fromCurrency, toCurrency);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <h6 className="font-bold text-indigo-600 mb-4 flex items-center gap-2">
        <Calculator size={18} />
        حاسبة تحويل العملات
      </h6>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
            min="0"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 mb-1">من عملة</label>
            <select 
              value={fromCurrency} 
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="mt-5 text-slate-400">
            <ArrowLeftRight size={18} />
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 mb-1">إلى عملة</label>
            <select 
              value={toCurrency} 
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center mt-2">
          <div className="text-xs text-indigo-600 mb-1 font-bold">النتيجة {loading ? '(جاري التحديث...)' : ''}</div>
          <div className="text-2xl font-bold text-indigo-700">
            {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            بناءً على أسعار الصرف العالمية الحالية
          </div>
        </div>
      </div>
    </div>
  );
}
