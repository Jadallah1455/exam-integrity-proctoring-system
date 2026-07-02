import { Shield, ShieldAlert, Activity, Wifi, Code, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

interface Teacher {
  id: string; nameAr: string; nameEn: string;
}

interface SidebarNavigationProps {
  sidebarCollapsed: boolean;
  activeTab: string;
  lang: string;
  isLightMode: boolean;
  selectedTeacherId: string;
  teachers: Teacher[];
  currentT: Record<string, string>;
  onToggleCollapse: () => void;
  onTabChange: (tab: string) => void;
  onTeacherChange: (teacherId: string) => void;
  showToast: (title: string, desc: string) => void;
}

export default function SidebarNavigation({
  sidebarCollapsed,
  activeTab,
  lang,
  isLightMode,
  selectedTeacherId,
  teachers,
  currentT,
  onToggleCollapse,
  onTabChange,
  onTeacherChange,
  showToast,
}: SidebarNavigationProps) {
  const tabClass = (tab: string) =>
    `w-full flex items-center ${sidebarCollapsed ? 'justify-center gap-0' : 'gap-3'} px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${lang === 'ar' ? 'text-right' : 'text-left'} ${
      activeTab === tab
        ? (isLightMode ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'bg-slate-850 text-white border border-slate-700/60 shadow-md')
        : (isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white')
    }`;

  return (
    <aside className={`${sidebarCollapsed ? 'w-16' : 'w-68'} transition-all duration-300 bg-slate-900 border-slate-800 flex flex-col shrink-0 hidden lg:flex relative ${lang === 'ar' ? 'border-l' : 'border-r'}`}>
      <button
        onClick={onToggleCollapse}
        className={`absolute ${lang === 'ar' ? 'left-0 rounded-r-lg' : 'right-0 rounded-l-lg'} top-20 translate-x-1/2 z-10 w-5 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center cursor-pointer transition shadow-md`}
      >
        {sidebarCollapsed
          ? (lang === 'ar' ? <ChevronLeft className="w-3 h-3 text-slate-300" /> : <ChevronRight className="w-3 h-3 text-slate-300" />)
          : (lang === 'ar' ? <ChevronRight className="w-3 h-3 text-slate-300" /> : <ChevronLeft className="w-3 h-3 text-slate-300" />)
        }
      </button>

      <div className={`${sidebarCollapsed ? 'p-3' : 'p-5'} flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden`}>
        <div>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-6`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-black text-white tracking-tight leading-tight">{lang === 'ar' ? 'نظام النزاهة' : 'Integrity System'}</h1>
                <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Proctor v2.0</p>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-4 px-1 font-bold">
              {currentT.sidebarSubtitle}
            </div>
          )}

          <nav className="space-y-1">
            {[
              { id: 'dashboard', icon: Activity, label: currentT.sidebarTab1, lightActive: 'text-blue-600', darkActive: 'text-blue-400' },
              { id: 'analytics', icon: Activity, label: lang === 'ar' ? 'تحليلات وكثافة' : 'Analytics & Density', lightActive: 'text-blue-600', darkActive: 'text-blue-400', title: lang === 'ar' ? 'تحليلات' : 'Analytics' },
              { id: 'simulator', icon: Wifi, label: lang === 'ar' ? 'محاكي التدفق المباشر' : 'Live Stream Simulator', lightActive: 'text-blue-600', darkActive: 'text-blue-400', title: lang === 'ar' ? 'محاكي' : 'Simulator' },
              { id: 'apiDocs', icon: Code, label: currentT.sidebarTab2, lightActive: 'text-emerald-600', darkActive: 'text-emerald-400', title: undefined },
              { id: 'engineControl', icon: ShieldAlert, label: lang === 'ar' ? 'إعدادات المحرك' : 'Engine Panel', lightActive: 'text-amber-600', darkActive: 'text-amber-400', title: lang === 'ar' ? 'إعدادات المحرك' : 'Engine' },
              { id: 'auditorLog', icon: ClipboardList, label: lang === 'ar' ? 'سجل عمليات التدقيق' : 'Auditor Activity Log', lightActive: 'text-purple-600', darkActive: 'text-purple-400', title: lang === 'ar' ? 'سجل التدقيق' : 'Auditor Log' },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={tabClass(tab.id)}
                  title={sidebarCollapsed ? (tab.title || tab.label) : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? (isLightMode ? tab.lightActive : tab.darkActive) : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {!sidebarCollapsed && (
          <div className="mt-4">
            <div className={`p-3 rounded-lg border mb-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800/80'}`}>
              <span className={`text-[9px] uppercase font-mono tracking-widest font-bold block mb-1 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>{currentT.projectInfoTitle}</span>
              <p className={`text-[9px] leading-relaxed block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentT.projectInfoDesc}
              </p>
            </div>
          </div>
        )}
      </div>

      {!sidebarCollapsed && (
        <div className={`px-4 py-4 border-t ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'}`}>
          <div className={`text-[8px] uppercase font-mono tracking-widest font-bold block mb-2 ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`}>
            {lang === 'ar' ? 'المصادقة الأمنية' : 'Secure Auth'}
          </div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs font-mono shrink-0 select-none ${isLightMode ? 'bg-white border-blue-300 text-blue-600' : 'bg-slate-800 border-blue-500 text-blue-300'}`}>
              {teachers.find(t => t.id === selectedTeacherId)?.nameEn?.match(/[a-zA-Z]/g)?.slice(0,2).join('').toUpperCase() || 'PF'}
            </div>
            <div className={`min-w-0 flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className={`text-xs font-black truncate ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                {lang === 'ar'
                  ? teachers.find(t => t.id === selectedTeacherId)?.nameAr
                  : teachers.find(t => t.id === selectedTeacherId)?.nameEn}
              </p>
              <p className={`text-[8px] font-mono flex items-center gap-1 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                <span className="bg-emerald-500 w-1.5 h-1.5 rounded-full inline-block animate-pulse"></span>
                <span>{lang === 'ar' ? 'مراقب معتمد' : 'Authorised Proctor'}</span>
              </p>
            </div>
          </div>

          <div className="relative text-[10px]">
            <label className={`text-[8px] font-bold block mb-1 ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {lang === 'ar' ? 'تبديل الهوية:' : 'Switch Identity:'}
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                const tId = e.target.value;
                onTeacherChange(tId);
                showToast(
                  lang === 'ar' ? "تم تغيير هوية المراقب بنجاح" : "Identity changed successfully!",
                  lang === 'ar' ? `أنت تسجل الدخول الآن كـ ${teachers.find(t => t.id === tId)?.nameAr}` : `You are now logged in as ${teachers.find(t => t.id === tId)?.nameEn}`
                );
              }}
              className={`w-full text-[10px] rounded-lg py-1.5 px-2 focus:border-blue-500 outline-none cursor-pointer ${isLightMode ? 'bg-white border border-slate-300 text-slate-700' : 'bg-slate-950 border border-slate-800 text-slate-200'}`}
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {lang === 'ar' ? t.nameAr : t.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </aside>
  );
}
