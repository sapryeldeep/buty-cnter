/**
 * Voice Call System (نظام النداء الصوتي الذكي باللغتين العربية والإنجليزية)
 */
import { VoiceCallSettings } from '../types';

// Play a pleasant dual-tone airport/clinic chime before speaking
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        resolve();
        return;
      }
      const ctx = new AudioContextClass();

      // First Tone (F5 - 698Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Second Tone (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.65);

      setTimeout(() => {
        resolve();
      }, 550);
    } catch (e) {
      resolve();
    }
  });
}

export async function speakPatientCall(patientName: string, settings?: VoiceCallSettings) {
  if (!('speechSynthesis' in window)) {
    alert('متصفحك لا يدعم خاصية تحويل النص إلى صوت.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  const langMode = settings?.language || 'ar';
  const shouldChime = settings?.enableChime !== false;
  const rate = settings?.rate || 0.95;
  const pitch = settings?.pitch || 1.0;

  if (shouldChime) {
    await playChime();
  }

  const arTemplate = settings?.arabicPhrase || 'العميلة {name}، تفضلي بالدخول لغرفة الجلسة';
  const enTemplate = settings?.englishPhrase || 'Client {name}, please proceed to the treatment room';

  const arText = arTemplate.replace('{name}', patientName);
  const enText = enTemplate.replace('{name}', patientName);

  // Get available voices
  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang.includes('ar') || v.name.toLowerCase().includes('arabic') || v.name.toLowerCase().includes('maged') || v.name.toLowerCase().includes('tarik') || v.name.toLowerCase().includes('laila'));
  const enVoice = voices.find(v => (v.lang.includes('en') || v.name.toLowerCase().includes('english') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('david')) && !v.name.includes('Compact'));

  if (langMode === 'ar') {
    const utter = new SpeechSynthesisUtterance(arText);
    utter.lang = 'ar-SA';
    if (arVoice) utter.voice = arVoice;
    utter.rate = rate;
    utter.pitch = pitch;
    window.speechSynthesis.speak(utter);
  } else if (langMode === 'en') {
    const utter = new SpeechSynthesisUtterance(enText);
    utter.lang = 'en-US';
    if (enVoice) utter.voice = enVoice;
    utter.rate = rate;
    utter.pitch = pitch;
    window.speechSynthesis.speak(utter);
  } else if (langMode === 'both') {
    // Speak Arabic first
    const utterAr = new SpeechSynthesisUtterance(arText);
    utterAr.lang = 'ar-SA';
    if (arVoice) utterAr.voice = arVoice;
    utterAr.rate = rate;
    utterAr.pitch = pitch;

    // Speak English after
    const utterEn = new SpeechSynthesisUtterance(enText);
    utterEn.lang = 'en-US';
    if (enVoice) utterEn.voice = enVoice;
    utterEn.rate = rate;
    utterEn.pitch = pitch;

    window.speechSynthesis.speak(utterAr);
    window.speechSynthesis.speak(utterEn);
  }
}
