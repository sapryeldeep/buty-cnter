import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Volume2, Save, Play, Sparkles, Bell, Globe, CheckCircle2 } from 'lucide-react';
import { VoiceCallSettings } from '../types';
import { speakPatientCall, playChime } from '../utils/voiceCall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceCallSettingsModal({ isOpen, onClose }: Props) {
  const { data, updateData } = useStore();

  const currentVoiceSettings: VoiceCallSettings = data.settings?.voiceSettings || {
    language: 'ar',
    arabicPhrase: 'العميلة {name}، تفضلي بالدخول لغرفة الجلسة',
    englishPhrase: 'Client {name}, please proceed to the treatment room',
    enableChime: true,
    rate: 0.95,
    pitch: 1.0
  };

  const [language, setLanguage] = useState<'ar' | 'en' | 'both'>(currentVoiceSettings.language || 'ar');
  const [arabicPhrase, setArabicPhrase] = useState(currentVoiceSettings.arabicPhrase || 'العميلة {name}، تفضلي بالدخول لغرفة الجلسة');
  const [englishPhrase, setEnglishPhrase] = useState(currentVoiceSettings.englishPhrase || 'Client {name}, please proceed to the treatment room');
  const [enableChime, setEnableChime] = useState(currentVoiceSettings.enableChime !== false);
  const [rate, setRate] = useState(currentVoiceSettings.rate || 0.95);
  const [pitch, setPitch] = useState(currentVoiceSettings.pitch || 1.0);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  if (!isOpen) return null;

  const handleTestVoice = async () => {
    setIsPlayingTest(true);
    await speakPatientCall('سارة أحمد / Sarah', {
      language,
      arabicPhrase,
      englishPhrase,
      enableChime,
      rate,
      pitch
    });
    setIsPlayingTest(false);
  };

  const handleSave = () => {
    const updatedSettings: VoiceCallSettings = {
      language,
      arabicPhrase,
      englishPhrase,
      enableChime,
      rate,
      pitch
    };

    updateData({
      settings: {
        ...(data.settings || {
          modules: {
            patients: true, appointments: true, finance: true, services: true,
            inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
          },
          customLabels: {}
        }),
        voiceSettings: updatedSettings
      }
    });

    alert('تم حفظ إعدادات النداء الصوتي بنجاح!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <Volume2 size={22} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-900 text-lg">التحكم في النداء الصوتي للعميلات</h5>
              <p className="text-xs text-slate-500 mt-0.5">ضبط لغة المناداة (عربي / إنجليزي / كلاهما معاً) والنغمة التنبيهية</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">لغة النداء الصوتي التلقائي:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  language === 'ar'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xl">🇸🇦</span>
                <span className="text-xs font-bold">عربي فقط</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  language === 'en'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xl">🇬🇧</span>
                <span className="text-xs font-bold">English Only</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('both')}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  language === 'both'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xl">🌐</span>
                <span className="text-xs font-bold">عربي + إنجليزي</span>
              </button>
            </div>
          </div>

          {/* Chime Bell Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <Bell size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">نغمة التنبيه الرنانة (Chime Bell)</div>
                <div className="text-xs text-slate-500">تشغيل نغمة صوتية تسبق المناداة للفت انتباه العميلات</div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={enableChime}
                onChange={(e) => setEnableChime(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Phrasing templates */}
          {(language === 'ar' || language === 'both') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                صيغة النداء باللغة العربية (استخدم <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{'{name}'}</code> لاسم العميل):
              </label>
              <input 
                type="text" 
                value={arabicPhrase} 
                onChange={e => setArabicPhrase(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 font-bold"
                placeholder="العميلة {name}، تفضلي بالدخول لغرفة الجلسة"
              />
            </div>
          )}

          {(language === 'en' || language === 'both') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                صيغة النداء باللغة الإنجليزية (English Phrase with <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{'{name}'}</code>):
              </label>
              <input 
                type="text" 
                value={englishPhrase} 
                onChange={e => setEnglishPhrase(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 text-left font-sans"
                placeholder="Client {name}, please proceed to the treatment room"
                dir="ltr"
              />
            </div>
          )}

          {/* Voice Speed & Pitch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>سرعة النطق:</span>
                <span>{rate}x</span>
              </div>
              <input 
                type="range" 
                min="0.7" 
                max="1.3" 
                step="0.05"
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>طبقة الصوت:</span>
                <span>{pitch}</span>
              </div>
              <input 
                type="range" 
                min="0.8" 
                max="1.2" 
                step="0.05"
                value={pitch}
                onChange={e => setPitch(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          {/* Test Voice Button */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <div className="text-xs text-emerald-800">
              <span className="font-bold block">تجربة فحص الصوت المباشر:</span>
              <span>سماع نغمة الرنين وصوت المناداة بالخيارات الحالية</span>
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              disabled={isPlayingTest}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Play size={14} className={isPlayingTest ? 'animate-spin' : ''} />
              {isPlayingTest ? 'جاري التشغيل...' : 'تجربة الصوت الآن'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4.5 px-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95"
          >
            <Save size={16} />
            حفظ إعدادات النداء الصوتي
          </button>
        </div>

      </div>
    </div>
  );
}
