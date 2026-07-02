import { UserCog, LogOut } from 'lucide-react';
import IntegrityPulseGauge from './IntegrityPulseGauge';
import PrivacyModeToggle from './PrivacyModeToggle';

interface HealthIndicatorsProps {
  currentT: Record<string, string>;
  lang: string;
  isLightMode: boolean;
  analyses: { riskScore: number; studentId: string; studentName: string }[];
  user: { nameAr?: string; nameEn?: string; role?: string } | null;
  sessionTimeLeft: number;
  privacyMode: boolean;
  formatSessionTime: (sec: number) => string;
  onLogout: () => void;
  onPrivacyToggle: (val: boolean) => void;
  showToast: (ar: string, en: string) => void;
}

export default function HealthIndicators({
  currentT, lang, isLightMode, analyses, user, sessionTimeLeft,
  privacyMode, formatSessionTime, onLogout, onPrivacyToggle, showToast,
}: HealthIndicatorsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <div className={`hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono select-none ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-slate-850'}`}>
        <span className={`font-bold text-[8px] ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>{currentT.keyboardShortcutTitle}:</span>
        <span className={`flex items-center gap-0.5 border px-1 py-0.5 rounded text-[8px] ${isLightMode ? 'bg-slate-100 border-slate-200 text-emerald-600' : 'bg-slate-900 border-slate-800 text-emerald-400'}`}>
          <kbd className={`px-1 rounded text-[7px] font-sans ${isLightMode ? 'bg-white text-slate-600' : 'bg-slate-950 text-slate-300'}`}>A</kbd>
          <span>{lang === 'ar' ? 'اعتماد' : 'Approve'}</span>
        </span>
        <span className={`flex items-center gap-0.5 border px-1 py-0.5 rounded text-[8px] ${isLightMode ? 'bg-slate-100 border-slate-200 text-rose-600' : 'bg-slate-900 border-slate-800 text-rose-400'}`}>
          <kbd className={`px-1 rounded text-[7px] font-sans ${isLightMode ? 'bg-white text-slate-600' : 'bg-slate-950 text-slate-300'}`}>I</kbd>
          <span>{lang === 'ar' ? 'تحقيق' : 'Investigate'}</span>
        </span>
      </div>

      <IntegrityPulseGauge analyses={analyses} lang={lang} isLightMode={isLightMode} />

      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg select-none shrink-0 text-[11px] ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-800/60 border border-slate-700/50'}`}>
        <UserCog className={`w-3 h-3 ${isLightMode ? 'text-blue-500' : 'text-blue-400'}`} />
        <span className={`font-bold text-[10px] leading-none ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
          {lang === 'ar' ? user?.nameAr : user?.nameEn}
        </span>
        <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase leading-none ${user?.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {user?.role === 'admin' ? 'مسؤول' : 'مراقب'}
        </span>
        <button
          onClick={onLogout}
          className={`flex items-center gap-0.5 transition ml-0.5 cursor-pointer ${isLightMode ? 'text-slate-400 hover:text-red-500' : 'text-slate-500 hover:text-red-400'}`}
          title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>

      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg select-none shrink-0 text-[10px] font-mono animate-pulse ${isLightMode ? 'bg-rose-50 border border-rose-200' : 'bg-rose-500/10 border border-rose-500/15'}`}>
        <span className="w-1 h-1 rounded-full bg-red-400 block animate-ping shrink-0"></span>
        <span className={`text-[9px] font-bold leading-none ${isLightMode ? 'text-rose-600' : 'text-rose-300'}`}>
          {lang === 'ar' ? 'الوقت:' : 'Time:'}
        </span>
        <span className={`text-[10px] font-extrabold font-mono tracking-wider leading-none ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
          {formatSessionTime(sessionTimeLeft)}
        </span>
      </div>

      <PrivacyModeToggle
        privacyMode={privacyMode}
        lang={lang}
        isLightMode={isLightMode}
        showToast={showToast}
        onToggle={onPrivacyToggle}
      />
    </div>
  );
}
