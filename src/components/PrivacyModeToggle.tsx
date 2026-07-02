import { Eye, EyeOff } from 'lucide-react';

interface PrivacyModeToggleProps {
  privacyMode: boolean;
  lang: string;
  isLightMode: boolean;
  showToast: (ar: string, en: string) => void;
  onToggle: (newVal: boolean) => void;
}

export default function PrivacyModeToggle({ privacyMode, lang, isLightMode, showToast, onToggle }: PrivacyModeToggleProps) {
  return (
    <button
      onClick={() => {
        const newVal = !privacyMode;
        onToggle(newVal);
        showToast(
          newVal ? "تم تفعيل وضع الخصوصية بنجاح" : "تم إلغاء قفل الخصوصية",
          newVal ? "Privacy Mode enabled" : "Privacy Mode disabled"
        );
      }}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold font-sans transition shadow-sm border cursor-pointer select-none no-print ${
        privacyMode
          ? (isLightMode ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-rose-950/40 border-rose-800/40 text-rose-400 hover:bg-rose-900/20')
          : (isLightMode ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700')
      }`}
      title={lang === 'ar' ? 'حماية الخصوصية لمشاركة الشاشة' : 'Toggle Privacy Protection'}
    >
      {privacyMode ? <EyeOff className="w-3 h-3 text-rose-400" /> : <Eye className={`w-3 h-3 ${isLightMode ? 'text-slate-400' : 'text-slate-400'}`} />}
      <span className="leading-none">{privacyMode ? (lang === 'ar' ? 'خصوصية' : 'Privacy') : (lang === 'ar' ? 'إظهار' : 'Show')}</span>
    </button>
  );
}
