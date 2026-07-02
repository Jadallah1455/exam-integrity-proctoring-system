import React from 'react';

interface KeyboardShortcutsHelpProps {
  lang: 'ar' | 'en';
  isLightMode: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ lang, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <h3 className="text-sm font-extrabold text-white">
              {lang === 'ar' ? 'أدلة واختصارات لوحة المفاتيح' : 'Keyboard Shortcut Guide'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold font-sans cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {lang === 'ar'
              ? 'بصفتك أستاذاً مراقباً، يمكنك إدارة قرارات النزاهة بسرعة فائقة باستخدام الاختصارات المخصصة عندما تقوم بتحديد وتدقيق طالب معيّن من القائمة.'
              : 'As an active proctor, optimize audit times with zero-click execution when inspecting specific candidates.'}
          </p>

          <div className="space-y-3 pt-2">
            <ShortcutRow
              icon="✓"
              iconBg="bg-emerald-500/10"
              iconText="text-emerald-400"
              iconBorder="border-emerald-500/20"
              title={lang === 'ar' ? 'اعتماد المرشح سليم' : 'Approve Candidate'}
              desc={lang === 'ar' ? 'الوسم المباشر للحالة كـ معتمد ومستقل' : 'Instantly mark active verdict as Approved.'}
              keyLabel="A"
              keyTextColor="text-emerald-400"
              keyBorder="border-emerald-500/40"
            />

            <ShortcutRow
              icon="⚠️"
              iconBg="bg-red-500/10"
              iconText="text-red-400"
              iconBorder="border-red-500/20"
              title={lang === 'ar' ? 'تحقيق وبحث الشبهة' : 'Flag for Investigation'}
              desc={lang === 'ar' ? 'الوسم الفوري للحالة كـ قيد الاستقصاء والتحقيق' : 'Instantly flag active candidate for investigation.'}
              keyLabel="I"
              keyTextColor="text-red-400"
              keyBorder="border-red-500/40"
            />

            <ShortcutRow
              icon="📡"
              iconBg="bg-emerald-500/10"
              iconText="text-emerald-400"
              iconBorder="border-emerald-500/20"
              title={lang === 'ar' ? 'تبديل التغذية الحية' : 'Toggle Live Feed'}
              desc={lang === 'ar' ? 'تفعيل أو إيقاف التحديث التلقائي المستمر للبيانات' : 'Enable or disable real-time auto-refresh of telemetry data.'}
              keyLabel="L"
              keyTextColor="text-emerald-400"
              keyBorder="border-emerald-500/40"
            />

            <ShortcutRow
              icon="🔄"
              iconBg="bg-blue-500/10"
              iconText="text-blue-400"
              iconBorder="border-blue-500/20"
              title={lang === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
              desc={lang === 'ar' ? 'سحب يدوي فوري لأحدث بيانات التليمتري' : 'Manually pull latest telemetry data from server.'}
              keyLabel="R"
              keyTextColor="text-blue-400"
              keyBorder="border-blue-500/40"
            />

            <ShortcutRow
              icon="🔍"
              iconBg="bg-violet-500/10"
              iconText="text-violet-400"
              iconBorder="border-violet-500/20"
              title={lang === 'ar' ? 'بحث في القائمة' : 'Focus Search Bar'}
              desc={lang === 'ar' ? 'الانتقال السريع إلى حقل البحث لتصفية الطلاب' : 'Jump cursor to search field to filter candidates.'}
              keyLabel="/"
              keyTextColor="text-violet-400"
              keyBorder="border-violet-500/40"
            />

            <ShortcutRow
              icon="❓"
              iconBg="bg-amber-500/10"
              iconText="text-amber-400"
              iconBorder="border-amber-500/20"
              title={lang === 'ar' ? 'فتح نافذة المساعدة' : 'Toggle Help Modal'}
              desc={lang === 'ar' ? 'فتح أو إغلاق نافذة اختصارات لوحة المفاتيح' : 'Open or close this keyboard shortcuts reference.'}
              keyLabel="?"
              keyTextColor="text-amber-400"
              keyBorder="border-amber-500/40"
            />
          </div>

          <div className="bg-blue-950/15 border border-blue-900/30 p-3 rounded-lg text-[10px] leading-relaxed text-slate-400 flex items-start gap-2">
            <span>💡</span>
            <p dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {lang === 'ar'
                ? 'تنبيه: لن يتم تفعيل الاختصارات عند الكتابة داخل الحقول النصية أو مربع كتابة الملاحظات لتجنب التشويش.'
                : 'Shortcuts are intelligently disabled while writing in notes or text input fields.'}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 text-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            {lang === 'ar' ? 'فهمت ذلك' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({
  icon, iconBg, iconText, iconBorder,
  title, desc,
  keyLabel, keyTextColor, keyBorder
}: {
  icon: string;
  iconBg: string;
  iconText: string;
  iconBorder: string;
  title: string;
  desc: string;
  keyLabel: string;
  keyTextColor: string;
  keyBorder: string;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center ${iconBg} ${iconText} rounded-lg p-1.5 border ${iconBorder} text-xs font-bold`}>
          {icon}
        </span>
        <div>
          <p className="font-extrabold text-white">{title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <kbd className={`bg-slate-950 ${keyTextColor} border ${keyBorder} px-2.5 py-1 rounded-md text-xs font-mono font-black shadow-md shrink-0`}>
        {keyLabel}
      </kbd>
    </div>
  );
}
