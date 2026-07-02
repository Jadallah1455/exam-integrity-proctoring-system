import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  lang?: 'ar' | 'en';
  isLightMode?: boolean;
  badge?: string;
  badgeColor?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
  lang = 'en',
  isLightMode = false,
  badge,
  badgeColor,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-2xl shadow-lg overflow-hidden transition-all duration-200 ${
      isLightMode ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800/60 hover:border-slate-700'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 md:p-6 text-left transition cursor-pointer ${
          isLightMode
            ? 'hover:bg-slate-50 border-b border-slate-200'
            : 'hover:bg-slate-800/30 border-b border-slate-800'
        } ${isOpen ? '' : 'border-b-transparent'}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {icon && (
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isLightMode ? 'bg-slate-100 ring-1 ring-slate-200' : 'bg-slate-800/60 ring-1 ring-slate-700/50'
            }`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`text-base font-extrabold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {title}
              </h3>
              {badge && (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor || ''}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className={`text-xs mt-1 leading-relaxed truncate ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className={`shrink-0 p-1.5 rounded-lg transition-colors ${
          isLightMode ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-600' : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
        }`}>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`p-5 md:p-6 ${isLightMode ? 'bg-white' : 'bg-slate-900/50'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
