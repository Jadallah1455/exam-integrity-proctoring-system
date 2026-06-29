import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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
    <div className={`border rounded-xl shadow-xl overflow-hidden transition-all duration-200 ${
      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 md:p-5 text-left transition cursor-pointer ${
          isLightMode
            ? 'hover:bg-slate-50 border-b border-slate-200'
            : 'hover:bg-slate-800/40 border-b border-slate-800'
        } ${isOpen ? '' : 'border-b-transparent'}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              isLightMode ? 'bg-slate-100' : 'bg-slate-800/60'
            }`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-extrabold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {title}
              </h3>
              {badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor || ''}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className={`text-[11px] mt-0.5 leading-relaxed truncate ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className={`shrink-0 p-1 rounded-md transition-colors ${
          isLightMode ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:bg-slate-700'
        }`}>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`p-4 md:p-5 ${isLightMode ? 'bg-white' : 'bg-slate-900/50'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
