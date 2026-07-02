interface MobileTabSwitcherProps {
  activeTab: string;
  lang: string;
  isLightMode: boolean;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', labelAr: 'غرفة المراقبة', labelEn: 'Control Room' },
  { id: 'analytics', labelAr: 'تحليلات', labelEn: 'Analytics' },
  { id: 'simulator', labelAr: 'محاكي', labelEn: 'Simulator' },
  { id: 'engineControl', labelAr: 'إعدادات المحرك', labelEn: 'Engine Panel' },
  { id: 'apiDocs', labelAr: 'توابع API', labelEn: 'API Docs' },
  { id: 'auditorLog', labelAr: 'سجل العمليات', labelEn: 'Auditor Log' },
];

export default function MobileTabSwitcher({ activeTab, lang, isLightMode, onTabChange }: MobileTabSwitcherProps) {
  return (
    <div className="lg:hidden px-6 pt-3 flex justify-end">
      <div className={`flex gap-1 p-1 rounded-lg ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition cursor-pointer ${activeTab === tab.id ? 'bg-blue-600 text-white' : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
          >
            {lang === 'ar' ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
