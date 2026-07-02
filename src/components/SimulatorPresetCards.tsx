import { Send } from 'lucide-react';
import { translations } from '../translations';

interface SimulatorPresetCardsProps {
  lang: 'ar' | 'en';
  isLightMode: boolean;
  loading: boolean;
  onInject: (type: string) => void;
}

const PRESETS = [
  { type: 'collusion_1', titleKey: 'moodlePresetATitle' as const, descKey: 'moodlePresetADesc' as const, borderLight: 'border-red-200 bg-red-50 hover:bg-red-50', borderDark: 'border-red-900/30 bg-red-950/10 hover:bg-red-950/20', titleColor: 'text-red-400', btnLight: 'bg-red-100 hover:bg-red-200 text-red-700', btnDark: 'bg-red-900/40 hover:bg-red-800/60 text-red-200' },
  { type: 'leak', titleKey: 'moodlePresetBTitle' as const, descKey: 'moodlePresetBDesc' as const, borderLight: 'border-orange-200 bg-orange-50 hover:bg-orange-50', borderDark: 'border-orange-950/55 bg-orange-950/10 hover:bg-orange-950/20', titleColor: 'text-orange-400', btnLight: 'bg-orange-100 hover:bg-orange-200 text-orange-700', btnDark: 'bg-orange-900/40 hover:bg-orange-800/60 text-orange-200' },
  { type: 'tampered_signature', titleKey: 'moodlePresetCTitle' as const, descKey: 'moodlePresetCDesc' as const, borderLight: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-50', borderDark: 'border-yellow-900/30 bg-yellow-950/10 hover:bg-yellow-950/20', titleColor: 'text-yellow-400', btnLight: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700', btnDark: 'bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-200' },
  { type: 'normal', titleKey: 'moodlePresetDTitle' as const, descKey: 'moodlePresetDDesc' as const, borderLight: 'border-green-200 bg-green-50 hover:bg-green-50', borderDark: 'border-green-900/30 bg-green-950/10 hover:bg-green-950/20', titleColor: 'text-green-400', btnLight: 'bg-green-100 hover:bg-green-200 text-green-700', btnDark: 'bg-green-900/40 hover:bg-green-800/60 text-green-200' },
];

export default function SimulatorPresetCards({ lang, isLightMode, loading, onInject }: SimulatorPresetCardsProps) {
  return (
    <div className="space-y-3">
      {PRESETS.map(p => (
        <div key={p.type} className={`${isLightMode ? p.borderLight : p.borderDark} rounded-lg p-3 transition group`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-xs font-bold ${p.titleColor}`}>{translations[lang][p.titleKey]}</h3>
              <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mt-1 leading-relaxed`}>
                {translations[lang][p.descKey]}
              </p>
            </div>
            <button
              disabled={loading}
              onClick={() => onInject(p.type)}
              className={`${isLightMode ? p.btnLight : p.btnDark} p-1.5 rounded-md text-[11px] flex items-center gap-1 transition-all self-center shrink-0 cursor-pointer`}
            >
              <Send className="w-3 h-3" />
              {translations[lang].moodlePresetInjectBtn}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
