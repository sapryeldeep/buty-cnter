import React, { useState, useEffect } from 'react';
import { CreditCard, Wifi, ShieldCheck, CheckCircle2, RefreshCw, X } from 'lucide-react';

interface POSPaymentSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  onPaymentSuccess: (authCode: string, cardType: string) => void;
}

type POSStep = 'idle' | 'insert_card' | 'processing' | 'authorizing' | 'success';

export default function POSPaymentSimulator({ isOpen, onClose, amount, currency, onPaymentSuccess }: POSPaymentSimulatorProps) {
  const [step, setStep] = useState<POSStep>('idle');
  const [statusText, setStatusText] = useState('جاهز لإتمام المعاملة...');
  const [cardHolder, setCardHolder] = useState('SAMIR AL-SAYED');
  const [cardBrand, setCardBrand] = useState<'mada' | 'visa' | 'mastercard'>('mada');

  useEffect(() => {
    if (isOpen) {
      setStep('insert_card');
      setStatusText('مرر أو أدخل البطاقة...');
    } else {
      setStep('idle');
    }
  }, [isOpen]);

  const handleTapCard = (brand: 'mada' | 'visa' | 'mastercard') => {
    setCardBrand(brand);
    setStep('processing');
    setStatusText('جاري قراءة بيانات البطاقة...');

    // Progress step 1
    setTimeout(() => {
      setStep('authorizing');
      setStatusText('جاري الاتصال بالبنك المركزي المالي...');
    }, 1200);

    // Progress step 2 (Success)
    setTimeout(() => {
      setStep('success');
      setStatusText('تم قبول الدفع بنجاح! طُبع الإيصال.');
      
      // Play a realistic POS success sound using browser Audio Context
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.log('Audio Context beep failed');
      }

      // Return auth code
      const authCode = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      const brandLabel = brand === 'mada' ? 'مدى (Mada)' : brand === 'visa' ? 'فيزا (Visa)' : 'ماستركارد (Mastercard)';
      
      setTimeout(() => {
        onPaymentSuccess(authCode, brandLabel);
      }, 1500);

    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-[Cairo]" dir="rtl">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200/80 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <CreditCard size={16} />
            </div>
            <div>
              <h5 className="font-extrabold text-xs">جهاز الدفع والشبكة (Mada POS)</h5>
              <p className="text-[9px] text-slate-400 mt-0.5">محاكاة تكامل الشبكة السعودية للمدفوعات</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Device Body */}
        <div className="p-6 bg-slate-100 flex flex-col items-center">
          
          {/* POS screen */}
          <div className="w-full bg-[#1e293b] text-[#10b981] p-4 rounded-2xl border-4 border-slate-800 shadow-inner font-mono text-center space-y-2 relative overflow-hidden min-h-[140px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Wifi size={10} className="animate-pulse" />
                ONLINE
              </span>
              <span>SAMEL-POS-v2</span>
            </div>

            <div className="py-2">
              {step === 'insert_card' && (
                <div className="space-y-1">
                  <p className="text-slate-300 text-xs font-bold font-sans">مطلوب سداد مبلغ</p>
                  <p className="text-xl font-extrabold text-white">{amount} {currency}</p>
                </div>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <RefreshCw size={20} className="animate-spin text-indigo-400" />
                  <p className="text-xs text-indigo-300">جاري القراءة...</p>
                </div>
              )}

              {step === 'authorizing' && (
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <RefreshCw size={20} className="animate-spin text-yellow-400" />
                  <p className="text-xs text-yellow-300">جاري التفويض المالي...</p>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                  <p className="text-sm font-extrabold text-white">مقبول - APPROVED</p>
                </div>
              )}
            </div>

            <div className="text-[10px] font-sans text-slate-300 bg-slate-800/80 py-1 rounded border border-slate-700">
              {statusText}
            </div>
          </div>

          {/* Interactive Cards Box */}
          {step === 'insert_card' && (
            <div className="mt-6 w-full space-y-3">
              <p className="text-center text-[11px] font-bold text-slate-500">اختر نوع البطاقة لتمريرها والتشبيك التلقائي:</p>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleTapCard('mada')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl text-[11px] flex flex-col items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <span className="font-extrabold">مدى</span>
                  <span className="text-[9px] opacity-80">Mada</span>
                </button>
                <button 
                  onClick={() => handleTapCard('visa')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-[11px] flex flex-col items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <span className="font-extrabold">فيزا</span>
                  <span className="text-[9px] opacity-80">Visa</span>
                </button>
                <button 
                  onClick={() => handleTapCard('mastercard')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded-xl text-[11px] flex flex-col items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <span className="font-extrabold">ماستر</span>
                  <span className="text-[9px] opacity-80">Master</span>
                </button>
              </div>

              {/* Tap Simulation Wave card */}
              <div 
                onClick={() => handleTapCard('mada')}
                className="bg-gradient-to-tr from-slate-800 to-indigo-950 p-4 rounded-2xl border border-slate-700 shadow-lg text-white relative overflow-hidden cursor-pointer hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all group flex flex-col justify-between h-[100px]"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="text-[8px] tracking-wider text-slate-400">CREDIT CARD</p>
                    <p className="text-[9px] font-bold text-slate-200">الشبكة السعودية الموحدة</p>
                  </div>
                  <Wifi size={14} className="text-slate-300 animate-pulse" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-slate-400">اسم صاحب البطاقة</p>
                    <p className="text-[10px] font-bold font-mono">{cardHolder}</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md">
                    انقر لتمرير (Tap Card)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Banner */}
          {step !== 'insert_card' && step !== 'success' && (
            <div className="mt-8 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-bold animate-pulse">تشفير وحماية ثلاثية الأبعاد (3D Secure)...</p>
            </div>
          )}

          {/* Success receipt printing effect */}
          {step === 'success' && (
            <div className="mt-6 w-full p-4 bg-white rounded-xl border border-dashed border-slate-300 text-slate-700 text-xs space-y-1.5 font-mono shadow-inner animate-in slide-in-from-top duration-300">
              <div className="text-center font-bold border-b border-dashed pb-1.5 mb-1.5">
                <p className="text-[11px]">شامل لخدمات التجميل</p>
                <p className="text-[9px] text-slate-400">إيصال دفع العميل</p>
              </div>
              <div className="flex justify-between">
                <span>المعاملة:</span>
                <span className="font-bold">دفع بوساطة مدى</span>
              </div>
              <div className="flex justify-between">
                <span>رقم التفويض:</span>
                <span className="font-bold">AUTH-983472</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ الكلي:</span>
                <span className="font-bold text-emerald-600">{amount} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span>الحالة:</span>
                <span className="text-emerald-600 font-bold">تم القبول (SUCCESS)</span>
              </div>
              <div className="text-[9px] text-center pt-2 text-slate-400 border-t border-dashed mt-2">
                مرتبط بنظام المطور صبري الديب بنجاح
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
