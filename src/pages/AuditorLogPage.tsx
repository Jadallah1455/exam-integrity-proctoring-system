import { type Dispatch, type SetStateAction } from 'react';
import { ClipboardList } from 'lucide-react';

interface AuditorLogEntry {
  id: string;
  timestamp: string;
  actionType: 'verdict_change' | 'clear_cache' | 'add_note' | 'batch_verdict';
  studentId?: string;
  studentName?: string;
  description: string;
  userRole: 'proctor' | 'admin';
}

interface AuditorLogPageProps {
  isLightMode: boolean;
  lang: 'ar' | 'en';
  auditorLogs: AuditorLogEntry[];
  setAuditorLogs: Dispatch<SetStateAction<AuditorLogEntry[]>>;
  showToast: (ar: string, en: string) => void;
  privacyMode: boolean;
  getDeterministicMaskedId: (id: string) => string;
  getDeterministicAlias: (id: string) => string;
}

export default function AuditorLogPage({
  isLightMode, lang, auditorLogs, setAuditorLogs, showToast,
  privacyMode, getDeterministicMaskedId, getDeterministicAlias
}: AuditorLogPageProps) {
  return (
    <div className={`rounded-xl p-6 space-y-6 shadow-xl animate-fade-in relative overflow-hidden ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600"></div>
      
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 ${isLightMode ? 'border-b border-slate-200' : 'border-b border-slate-800'}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className={`w-5 h-5 animate-pulse ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
            <h2 className={`text-md font-bold uppercase font-sans tracking-wide ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
              {lang === 'ar' ? 'سجل العمليات والتدقيق الأمني البشري' : 'Human Audit & Intervention Trail'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'ar' 
              ? 'سجلات فورية غير قابلة للتعديل ترصد كافة التدخلات البشرية وقرارات مراقبي الاختبار لضمان الشفافية والامتثال للأنظمة.' 
              : 'Immutable chronological trace of proctor actions, verdict corrections, notes, and metrics overrides for compliance and verification purposes.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في تصفير سجل العمليات والتدقيق بالكامل؟' : 'Are you sure you want to completely clear the entire audit trail history?')) {
                setAuditorLogs([]);
                showToast('✓ تَمّ تصفير سجل التدقيق الأمني بنجاح', '✓ Successfully scrubbed auditor log records history');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-rose-950/20 hover:bg-rose-900/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 cursor-pointer transition shadow-sm font-mono select-none"
          >
            <span>🗑️</span>
            <span>{lang === 'ar' ? 'تصفير السجل' : 'Scrub Logs'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border flex items-center justify-between ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/60'}`}>
          <div className="space-y-2">
            <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {lang === 'ar' ? 'إجمالي التدخلات' : 'Total Interventions'}
            </span>
            <span className={`text-xl font-mono font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{auditorLogs.length}</span>
          </div>
          <span className={`text-2xl select-none ${isLightMode ? 'text-slate-300' : 'text-slate-700'}`}>📜</span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/60'}`}>
          <div className="space-y-2">
            <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {lang === 'ar' ? 'تعديل الأحكام' : 'Verdict Changes'}
            </span>
            <span className="text-xl font-mono font-bold text-blue-400">
              {auditorLogs.filter(l => l.actionType === 'verdict_change' || l.actionType === 'batch_verdict').length}
            </span>
          </div>
          <span className={`text-2xl select-none ${isLightMode ? 'text-slate-300' : 'text-slate-700'}`}>⚖️</span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/60'}`}>
          <div className="space-y-2">
            <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {lang === 'ar' ? 'ملاحظات مسجلة' : 'Notes Attached'}
            </span>
            <span className="text-xl font-mono font-bold text-amber-400">
              {auditorLogs.filter(l => l.actionType === 'add_note').length}
            </span>
          </div>
          <span className={`text-2xl select-none ${isLightMode ? 'text-slate-300' : 'text-slate-700'}`}>✍️</span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/60'}`}>
          <div className="space-y-2">
            <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {lang === 'ar' ? 'تنظيف الذاكرة' : 'Cache Scrubs'}
            </span>
            <span className="text-xl font-mono font-bold text-rose-400">
              {auditorLogs.filter(l => l.actionType === 'clear_cache').length}
            </span>
          </div>
          <span className={`text-2xl select-none ${isLightMode ? 'text-slate-300' : 'text-slate-700'}`}>🧼</span>
        </div>
      </div>

      <div className={`p-3 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-3 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-850'}`}>
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${isLightMode ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
            📅 Chronological Desc ✓
          </span>
        </div>
        <div className={`text-[10px] font-mono select-none text-right w-full md:w-auto ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
          ⚡ {lang === 'ar' ? 'سجل تتبع امتيازات المراقب البشري نشط وآمن' : 'Compliance proctor credentials securely synchronized'}
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden divide-y ${isLightMode ? 'bg-slate-50 border border-slate-200 divide-slate-200' : 'bg-slate-950 border border-slate-850 divide-slate-900'}`}>
        {auditorLogs.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-12 space-y-2 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="text-3xl">📭</span>
            <p className="text-xs font-sans italic">
              {lang === 'ar' ? 'لا توجد سجلات حالياً، لم يتم اتخاذ أي إجراءات تدقيق من قبل الفريق.' : 'Clean state audit trail. No user interventions logged.'}
            </p>
          </div>
        ) : (
          auditorLogs.map((entry) => {
            const studentIdLabel = entry.studentId 
              ? (privacyMode ? getDeterministicMaskedId(entry.studentId) : entry.studentId) 
              : null;
            const studentNameLabel = entry.studentName 
              ? (privacyMode ? getDeterministicAlias(entry.studentId || '') : entry.studentName) 
              : null;

            return (
              <div key={entry.id} className={`p-4 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-slate-900/40'}`}>
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[8.5px] uppercase font-mono px-2 py-0.5 rounded font-extrabold border ${
                      entry.actionType === 'verdict_change' 
                        ? (isLightMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-600/10 text-blue-400 border-blue-500/20') 
                        : entry.actionType === 'clear_cache' 
                        ? (isLightMode ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-600/10 text-rose-400 border-rose-500/20') 
                        : entry.actionType === 'add_note' 
                        ? (isLightMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-600/10 text-amber-400 border-amber-500/20') 
                        : (isLightMode ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-600/10 text-purple-400 border-purple-500/20')
                    }`}>
                      {entry.actionType.replace('_', ' ')}
                    </span>

                    <span className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded border ${
                      entry.userRole === 'admin' 
                        ? (isLightMode ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-600/15 text-indigo-400 border-indigo-500/20') 
                        : (isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-350')
                    }`}>
                      Proctor Role: {entry.userRole}
                    </span>

                    {studentIdLabel && (
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold flex items-center gap-1 shadow-inner ${isLightMode ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800/80 text-slate-300'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <span>{studentIdLabel}</span>
                        {studentNameLabel && <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>({studentNameLabel})</span>}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs font-sans tracking-tight leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-100'}`}>
                    {entry.description}
                  </p>
                </div>

                <div className="text-right shrink-0 select-none font-mono">
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg border block font-bold ${isLightMode ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-slate-500 bg-slate-900 border-slate-850'}`}>
                    ⏱ {entry.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
