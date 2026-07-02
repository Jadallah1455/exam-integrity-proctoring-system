import { Bell } from 'lucide-react';

interface ThresholdNotifierProps {
  showNotifMenu: boolean;
  riskThreshold: number;
  desktopNotificationsEnabled: boolean;
  analyses: { riskScore: number; studentId: string; studentName: string }[];
  lang: string;
  onToggle: () => void;
  onRiskChange: (value: number) => void;
  onSelectStudent: (studentId: string) => void;
  onToggleNotifications: () => void;
  onClose: () => void;
}

export default function ThresholdNotifier({
  showNotifMenu,
  riskThreshold,
  desktopNotificationsEnabled,
  analyses,
  lang,
  onToggle,
  onRiskChange,
  onSelectStudent,
  onToggleNotifications,
  onClose,
}: ThresholdNotifierProps) {
  const breachedAnalyses = analyses.filter(an => an.riskScore >= riskThreshold);

  return (
    <div className="relative z-50">
      <button
        onClick={onToggle}
        className="relative p-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700/60 cursor-pointer transition flex items-center justify-center text-slate-300"
        title={lang === 'ar' ? 'تخصيص قيم تنبيهات الخطورة' : 'Behavioral Risk Settings & Alerts'}
      >
        <Bell className={`w-4 h-4 ${breachedAnalyses.length > 0 ? 'text-rose-400 animate-bounce' : ''}`} />
        {breachedAnalyses.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none shrink-0 min-w-[15px] text-center shadow">
            {breachedAnalyses.length}
          </span>
        )}
      </button>

      {showNotifMenu && (
        <div className={`absolute top-11 ${lang === 'ar' ? 'left-0' : 'right-0'} w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 text-xs space-y-3 font-sans`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold text-white text-[11px] flex items-center gap-1">
              🔔 {lang === 'ar' ? 'تنبيهات تجاوز الخطورة التدقيقية' : 'Threshold Breach Alerts'}
            </span>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xs font-bold">
              ✕
            </button>
          </div>

          <div className="bg-slate-950 p-2.5 border border-slate-855 rounded-lg space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>{lang === 'ar' ? 'حد التنبيه المخصص:' : 'Alert Notify Boundary:'}</span>
              <span className="font-mono text-rose-400 font-extrabold">{riskThreshold}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              step="5"
              value={riskThreshold}
              onChange={(e) => onRiskChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="text-[8px] text-slate-500 block">
              {lang === 'ar' ? 'سيتم إصدار تنبيه مرئي ونبضات للجرس عند تجاوز أي طالب حد الخطورة هذا.' : 'Triggers visual bell pulsing animation when any candidate exceeds this risk.'}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 border border-slate-855 rounded-lg space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>{lang === 'ar' ? 'تنبيهات سطح المكتب (صامتة):' : 'Silent Desktop Notifications:'}</span>
              <span className={`px-1 rounded text-[8px] font-bold ${desktopNotificationsEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {desktopNotificationsEnabled ? (lang === 'ar' ? 'مفعّلة' : 'ENABLED') : (lang === 'ar' ? 'معطّلة' : 'DISABLED')}
              </span>
            </div>
            <button
              onClick={onToggleNotifications}
              className={`w-full py-1.5 px-2.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                desktopNotificationsEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
              }`}
            >
              <span>🔔</span>
              <span>
                {desktopNotificationsEnabled
                  ? (lang === 'ar' ? 'إلغاء تفعيل تنبيهات المكتب' : 'Disable Desktop Alerts')
                  : (lang === 'ar' ? 'تفعيل تنبيهات سطح المكتب' : 'Enable Desktop Alerts')}
              </span>
            </button>
            <span className="text-[7.5px] text-slate-500 block leading-tight">
              {lang === 'ar' ? 'تسمح لك بمراقبة التجاوزات في الخلفية حتى عند تصفح تبويبات أخرى.' : 'Allows monitoring student activity in silence even when this tab is out of focus.'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {breachedAnalyses.length === 0 ? (
              <div className="text-center py-4 text-slate-500 italic text-[10px]">
                👌 {lang === 'ar' ? 'لا يوجد حالات تتجاوز الحد المخصص حالياً.' : 'Secure: No cases exceed the notification limit.'}
              </div>
            ) : (
              breachedAnalyses.map(an => (
                <div
                  key={an.studentId}
                  onClick={() => {
                    onSelectStudent(an.studentId);
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-red-950/10 border border-red-900/40 hover:bg-slate-950 hover:border-red-500/40 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="truncate max-w-[175px]">
                    <span className="block font-bold text-slate-100 truncate text-right">{an.studentName}</span>
                    <span className="block text-[8.5px] text-slate-500 font-mono text-right">{an.studentId}</span>
                  </div>
                  <span className="font-mono font-extrabold text-red-400 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                    {an.riskScore}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
