import { Shield, Menu } from 'lucide-react';
import ThresholdNotifier from './ThresholdNotifier';

interface TopHeaderProps {
  currentT: Record<string, string>;
  lang: string;
  isLightMode: boolean;
  userRole: string;
  loading: boolean;
  liveFeedActive: boolean;
  analyses: { riskScore: number; studentId: string; studentName: string }[];
  lastRefreshTime: Date | null;
  showNotifMenu: boolean;
  riskThreshold: number;
  desktopNotificationsEnabled: boolean;
  onOpenMobileMenu: () => void;
  onRoleChange: (role: string) => void;
  onLangChange: () => void;
  onThemeChange: () => void;
  onLiveFeedToggle: () => void;
  onOpenKeyboardHelp: () => void;
  onToggleNotifMenu: () => void;
  onRiskChange: (value: number) => void;
  onSelectStudent: (id: string) => void;
  onToggleDesktopNotifs: () => void;
  onCloseNotifMenu: () => void;
}

export default function TopHeader({
  currentT, lang, isLightMode, userRole, loading, liveFeedActive,
  analyses, lastRefreshTime, showNotifMenu, riskThreshold,
  desktopNotificationsEnabled, onOpenMobileMenu, onRoleChange,
  onLangChange, onThemeChange, onLiveFeedToggle, onOpenKeyboardHelp,
  onToggleNotifMenu, onRiskChange, onSelectStudent,
  onToggleDesktopNotifs, onCloseNotifMenu,
}: TopHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur sticky top-0 z-40 px-6 py-4 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest bg-blue-500/10 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/20">
                {currentT.projectTag}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-medium px-2 py-0.5 rounded border border-emerald-500/20">
                {currentT.rtlCompliant}
              </span>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 font-medium px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span>REC</span>
              </span>
            </div>
            <h1 className="text-sm md:text-md lg:text-lg font-extrabold text-white mt-0.5">
              {currentT.appName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 cursor-pointer transition flex items-center justify-center lg:hidden"
            title={lang === 'ar' ? 'القائمة الجانبية' : 'Navigation Menu'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-3">
            <div className="bg-slate-950 p-0.5 border border-slate-800 rounded-lg flex items-center text-xs font-sans">
              <button
                onClick={() => onRoleChange('proctor')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer select-none ${userRole === 'proctor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'ar' ? '👁️ مراقب' : '👁️ Proctor'}
              </button>
              <button
                onClick={() => onRoleChange('admin')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition cursor-pointer select-none ${userRole === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'ar' ? '🔑 مدير' : '🔑 Admin'}
              </button>
            </div>

            <button
              onClick={onLangChange}
              className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/60 font-bold flex items-center gap-1.5 cursor-pointer transition select-none font-sans"
            >
              🌐 {lang === 'ar' ? 'English' : 'العربية'}
            </button>

            <button
              onClick={onThemeChange}
              className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/60 font-bold flex items-center gap-1.5 cursor-pointer transition select-none font-sans"
              title={lang === 'ar' ? 'تبديل المظهر العام' : 'Toggle Global Theme'}
            >
              <span>{isLightMode ? '🌙' : '☀️'}</span>
              <span>{isLightMode ? '🌙 Dark' : '☀️ Light'}</span>
            </button>

            {loading && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400" title={lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-bold">{lang === 'ar' ? 'تحميل...' : 'Loading...'}</span>
              </div>
            )}

            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${isLightMode ? 'bg-white text-slate-600 border-slate-300' : 'bg-slate-950 text-slate-400 border-slate-800'}`} title={lang === 'ar' ? 'عدد الجلسات النشطة تحت المراقبة' : 'Active monitored sessions'}>
              <span className="text-blue-400">🖥️</span>
              <span>{analyses.length}</span>
              <span className="text-slate-500 font-normal">{lang === 'ar' ? 'جلسة' : 'sessions'}</span>
            </div>

            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono ${isLightMode ? 'bg-white text-slate-500 border-slate-300' : 'bg-slate-950 text-slate-500 border-slate-800'}`} title={lang === 'ar' ? 'آخر تحديث للبيانات' : 'Last data refresh'}>
              <span>🕒</span>
              <span>{lastRefreshTime ? lastRefreshTime.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</span>
            </div>

            <button
              onClick={onLiveFeedToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-bold cursor-pointer transition select-none ${
                liveFeedActive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow'
                  : isLightMode ? 'bg-white text-slate-600 border-slate-300 hover:text-slate-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title={lang === 'ar' ? 'تحديث تلقائي مستمر عبر التغذية الحية' : 'Real-time telemetry continuous database long-polling'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveFeedActive ? 'bg-emerald-400 animate-pulse' : (isLightMode ? 'bg-slate-300' : 'bg-slate-600')}`}></span>
              <span>{lang === 'ar' ? 'تغذية حيّة' : 'Live Feed'}</span>
            </button>

            <button
              onClick={onOpenKeyboardHelp}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-700/60 cursor-pointer transition flex items-center justify-center text-xs font-bold"
              title={lang === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
            >
              <span className="text-sm font-black mx-1" id="keyboard-shortcut-header-help-icon">⌨</span>
            </button>
          </div>

          <ThresholdNotifier
            showNotifMenu={showNotifMenu}
            riskThreshold={riskThreshold}
            desktopNotificationsEnabled={desktopNotificationsEnabled}
            analyses={analyses}
            lang={lang}
            onToggle={onToggleNotifMenu}
            onRiskChange={onRiskChange}
            onSelectStudent={onSelectStudent}
            onToggleNotifications={onToggleDesktopNotifs}
            onClose={onCloseNotifMenu}
          />
        </div>
      </div>
    </header>
  );
}
