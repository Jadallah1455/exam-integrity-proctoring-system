import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { translations } from '../translations';

interface FeedbackBannerProps {
  feedback: { success: boolean; message: string; subId?: string } | null;
  lang: 'ar' | 'en';
  isLightMode: boolean;
}

export default function FeedbackBanner({ feedback, lang, isLightMode }: FeedbackBannerProps) {
  if (!feedback) return null;

  return (
    <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 border ${feedback.success ? `${isLightMode ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/20 text-emerald-300 border-emerald-900/40'}` : `${isLightMode ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/20 text-rose-300 border-rose-900/40'}`}`}>
      {feedback.success ? (
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      )}
      <div>
        <h4 className="font-bold mb-1">{feedback.success ? translations[lang].moodleFeedbackSuccessTitle : translations[lang].moodleFeedbackErrorTitle}</h4>
        <p className={`text-[11px] ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>{feedback.message}</p>
      </div>
    </div>
  );
}
