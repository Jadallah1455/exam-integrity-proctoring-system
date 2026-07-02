interface QuickActionsMenuProps {
  contextMenu: { x: number; y: number; studentId: string } | null;
  lang: string;
  isLightMode: boolean;
  showToast: (ar: string, en: string) => void;
  onSelectStudent: (studentId: string) => void;
  onFlagForReview: (studentId: string) => void;
  onClearCache: (studentId: string) => void;
  onClose: () => void;
}

export default function QuickActionsMenu({
  contextMenu,
  lang,
  isLightMode,
  showToast,
  onSelectStudent,
  onFlagForReview,
  onClearCache,
  onClose,
}: QuickActionsMenuProps) {
  if (!contextMenu) return null;

  return (
    <div
      id="quick-actions-context-menu"
      className={`fixed rounded-xl shadow-2xl p-2.5 w-56 z-[9999] text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}
      style={{
        top: contextMenu.y,
        left: lang === 'ar' ? Math.max(10, contextMenu.x - 224) : Math.min(window.innerWidth - 240, contextMenu.x),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`px-2 py-1.5 border-b text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center justify-between ${isLightMode ? 'text-slate-500 border-slate-200' : 'text-slate-500 border-slate-800'}`}>
        <span>{lang === 'ar' ? 'إجراءات فحص سريعة' : 'Quick Actions'}</span>
        <span className={`font-mono text-[9px] px-1 rounded ${isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-slate-950 text-slate-400'}`}>
          {contextMenu.studentId}
        </span>
      </div>

      <div className="space-y-0.5">
        <button
          onClick={() => {
            onSelectStudent(contextMenu.studentId);
            onClose();
            showToast(
              `🔬 تم فتح لوحة التحقيق الجنائي للطالب ${contextMenu.studentId}`,
              `🔬 Opened Forensic Investigator for student ${contextMenu.studentId}`
            );
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${isLightMode ? 'text-slate-600 hover:bg-blue-50 hover:text-blue-600' : 'text-slate-300 hover:bg-blue-600/10 hover:text-blue-400'}`}
        >
          <span>🔬</span>
          <span>{lang === 'ar' ? 'فتح المحقق الجنائي' : 'Open Forensic Inspector'}</span>
        </button>

        <button
          onClick={() => {
            const sid = contextMenu.studentId;
            onClose();
            navigator.clipboard.writeText(sid).then(() => {
              showToast(
                `✅ تم نسخ معرف الطالب (${sid}) إلى حافظة جهازك!`,
                `✅ Candidate ID (${sid}) copied to keyboard clipboard successfully!`
              );
            }).catch(() => {
              showToast(
                `📋 معرف الطالب هو: ${sid}`,
                `📋 Candidate ID is: ${sid}`
              );
            });
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${isLightMode ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-350 hover:bg-slate-800 hover:text-white'}`}
        >
          <span>📋</span>
          <span>{lang === 'ar' ? 'نسخ معرف الطالب' : 'Copy Student ID'}</span>
        </button>

        <button
          onClick={() => {
            const sid = contextMenu.studentId;
            onClose();
            onFlagForReview(sid);
            showToast(
              `⚠️ تم وضع علامة مراجعة وتدقيق مستمر على الطالب #${sid}!`,
              `⚠️ Flagged candidate #${sid} for active pending investigation!`
            );
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${isLightMode ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-300 hover:bg-rose-500/10 hover:text-rose-400'}`}
        >
          <span>⚠️</span>
          <span>{lang === 'ar' ? 'تعليم لمراجعة التحقيق' : 'Flag for Review'}</span>
        </button>

        <button
          onClick={() => {
            const sid = contextMenu.studentId;
            onClose();
            onClearCache(sid);
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${isLightMode ? 'text-slate-600 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-300 hover:bg-amber-500/10 hover:text-amber-400'}`}
        >
          <span>🗑️</span>
          <span>{lang === 'ar' ? 'تطهير وإعادة ضبط الجلسة' : 'Clear Cache'}</span>
        </button>
      </div>
    </div>
  );
}
