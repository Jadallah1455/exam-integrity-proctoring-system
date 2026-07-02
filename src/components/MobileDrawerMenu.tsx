import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Wifi, Code, ShieldAlert, ClipboardList } from 'lucide-react';

interface Teacher {
  id: string; nameAr: string; nameEn: string;
}

interface MobileDrawerMenuProps {
  mobileMenuOpen: boolean;
  lang: string;
  isLightMode: boolean;
  activeTab: string;
  userRole: string;
  teachers: Teacher[];
  selectedTeacherId: string;
  currentT: Record<string, string>;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onTeacherChange: (teacherId: string) => void;
  onLangChange: () => void;
  onThemeChange: () => void;
  onRoleChange: () => void;
  onOpenKeyboardHelp: () => void;
  showToast: (title: string, desc: string) => void;
}

export default function MobileDrawerMenu({
  mobileMenuOpen,
  lang,
  isLightMode,
  activeTab,
  userRole,
  teachers,
  selectedTeacherId,
  currentT,
  onClose,
  onTabChange,
  onTeacherChange,
  onLangChange,
  onThemeChange,
  onRoleChange,
  onOpenKeyboardHelp,
  showToast,
}: MobileDrawerMenuProps) {
  const tabClass = (tab: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${lang === 'ar' ? 'text-right' : 'text-left'} ${activeTab === tab ? (isLightMode ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'bg-slate-850 text-white border border-slate-700/60 shadow-md') : (isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white')}`;

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[500] lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: lang === 'ar' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: lang === 'ar' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 w-72 max-w-[85vw] bg-slate-900 border-slate-800 shadow-2xl flex flex-col p-6 h-full overflow-y-auto ${
              lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'
            }`}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white font-mono">خ£</div>
                <h2 className="text-md font-bold tracking-tight text-white">{currentT.appName.split('(')[0]}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-755 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#6366f1] font-bold block mb-1">
                🔑 {lang === 'ar' ? 'المصادقة الأمنية لغرفة الصف' : 'Secure Authenticated Class'}
              </span>
              <div className="flex items-center gap-2.5 mt-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold text-xs">
                  {teachers.find(t => t.id === selectedTeacherId)?.nameEn?.charAt(0) || 'T'}
                </div>
                <div className={`min-w-0 flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  <h4 className="text-xs font-black text-white truncate">
                    {lang === 'ar'
                      ? teachers.find(t => t.id === selectedTeacherId)?.nameAr
                      : teachers.find(t => t.id === selectedTeacherId)?.nameEn}
                  </h4>
                  <span className="text-[9px] text-[#22c55e] font-bold block mt-0.5 leading-none">
                    {lang === 'ar' ? 'حساب الأستاذ النشط' : 'Active Instructor'}
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <label className="text-[9px] text-slate-500 font-bold block mb-1">
                  {lang === 'ar' ? 'تبديل الأستاذ:' : 'Switch Instructor:'}
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    onTeacherChange(tId);
                    showToast(
                      lang === 'ar' ? "تم تغيير الأستاذ بنجاح" : "Instructor switched successfully!",
                      lang === 'ar' ? `الأستاذ النشط: ${teachers.find(t => t.id === tId)?.nameAr}` : `Active instructor: ${teachers.find(t => t.id === tId)?.nameEn}`
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg py-1.5 px-2 outline-none cursor-pointer focus:border-blue-500 h-9"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {lang === 'ar' ? t.nameAr : t.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 mb-8">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block mb-2 px-1">
                {currentT.sidebarSubtitle}
              </span>
              {[
                { id: 'dashboard', icon: Activity, label: currentT.sidebarTab1, lightActive: 'text-blue-600', darkActive: 'text-blue-400' },
                { id: 'analytics', icon: Activity, label: lang === 'ar' ? 'تحليلات وكثافة' : 'Analytics & Density', lightActive: 'text-blue-600', darkActive: 'text-blue-400' },
                { id: 'simulator', icon: Wifi, label: lang === 'ar' ? 'محاكي التدفق المباشر' : 'Live Stream Simulator', lightActive: 'text-blue-600', darkActive: 'text-blue-400' },
                { id: 'apiDocs', icon: Code, label: currentT.sidebarTab2, lightActive: 'text-emerald-600', darkActive: 'text-emerald-400' },
                { id: 'engineControl', icon: ShieldAlert, label: lang === 'ar' ? 'إعدادات المحرك وتطابق الذكاء' : 'Engine Panel & AI Plagiarism', lightActive: 'text-amber-600', darkActive: 'text-amber-400' },
                { id: 'auditorLog', icon: ClipboardList, label: lang === 'ar' ? 'سجل عمليات التدقيق' : 'Auditor Activity Log', lightActive: 'text-purple-600', darkActive: 'text-purple-400' },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      onClose();
                    }}
                    className={tabClass(tab.id)}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? (isLightMode ? tab.lightActive : tab.darkActive) : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-3 md:hidden">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block mb-1">
                {lang === 'ar' ? 'تفضيلات النظام والتحكم' : 'Preferences & Quick Controls'}
              </span>

              <button onClick={onRoleChange} className="w-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-2.5 rounded-lg border border-slate-700/60 font-bold flex items-center justify-between cursor-pointer transition select-none font-sans">
                <span className="flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{lang === 'ar' ? 'صلاحيات الحساب' : 'Account Role'}</span>
                </span>
                <span className="text-purple-400 font-extrabold">{userRole === 'admin' ? (lang === 'ar' ? 'مدير النظام 🔑' : 'Admin 🔑') : (lang === 'ar' ? 'مراقب 👁️' : 'Proctor 👁️')}</span>
              </button>

              <button onClick={onLangChange} className="w-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-2.5 rounded-lg border border-slate-700/60 font-bold flex items-center justify-between cursor-pointer transition select-none font-sans">
                <span className="flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>{lang === 'ar' ? 'لغة الواجهة' : 'Interface Language'}</span>
                </span>
                <span className="text-blue-400 font-extrabold">{lang === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              <button onClick={onThemeChange} className="w-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-2.5 rounded-lg border border-slate-700/60 font-bold flex items-center justify-between cursor-pointer transition select-none font-sans">
                <span className="flex items-center gap-1.5">
                  <span>{isLightMode ? '🌙' : '☀️'}</span>
                  <span>{lang === 'ar' ? 'المظهر العام' : 'Global Theme'}</span>
                </span>
                <span className="text-amber-400 font-extrabold">
                  {isLightMode ? '🌙 Dark' : '☀️ Light'}
                </span>
              </button>

              <button
                onClick={() => {
                  onOpenKeyboardHelp();
                  onClose();
                }}
                className="w-full bg-slate-850 hover:bg-slate-800 text-xs text-slate-300 px-3 py-2.5 rounded-lg border border-slate-800 cursor-pointer transition flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span>⌨</span>
                  <span>{lang === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
                </span>
                <span className="text-slate-500 font-bold">A / I</span>
              </button>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-800 text-[10px] text-slate-400">
              <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-bold block mb-1">
                {currentT.projectInfoTitle}
              </span>
              <p className="leading-relaxed">
                {currentT.projectInfoDesc}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
