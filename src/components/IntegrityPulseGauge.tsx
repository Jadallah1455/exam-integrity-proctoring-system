interface IntegrityPulseGaugeProps {
  analyses: { riskScore: number }[];
  lang: string;
  isLightMode: boolean;
}

export default function IntegrityPulseGauge({ analyses, lang, isLightMode }: IntegrityPulseGaugeProps) {
  const avgRiskOfClass = analyses.length > 0 ? (analyses.reduce((sum, an) => sum + an.riskScore, 0) / analyses.length) : 0;
  const classIntegrityIndex = Math.round(100 - avgRiskOfClass);
  const isHealthy = classIntegrityIndex >= 82;
  const isWarning = classIntegrityIndex >= 65 && classIntegrityIndex < 82;

  const statusColor = isHealthy
    ? (isLightMode ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10')
    : isWarning
      ? (isLightMode ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-amber-400 border-amber-500/20 bg-amber-500/10')
      : (isLightMode ? 'text-red-600 border-red-200 bg-red-50 animate-pulse' : 'text-red-400 border-red-500/20 bg-red-400/10 animate-pulse');

  const dotColor = isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500 animate-ping';
  const statusSlug = isHealthy
    ? (lang === 'ar' ? 'آمن' : 'SECURE')
    : isWarning
      ? (lang === 'ar' ? 'تنبيه' : 'WARNING')
      : (lang === 'ar' ? 'مهدد' : 'RISK');

  return (
    <div className={`flex items-center gap-1.5 border px-2 py-1 rounded-lg select-none shrink-0 text-[10px] font-mono shadow-sm ${statusColor}`} title={lang === 'ar' ? 'متوسط مؤشر النزاهة للفصل بناءً على درجات المخاطر' : 'Class-wide Integrity Index'}>
      <span className={`w-1.5 h-1.5 rounded-full block shrink-0 shadow-lg ${dotColor}`}></span>
      <span className={`font-bold text-[9px] leading-none ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {lang === 'ar' ? 'النزاهة:' : 'Integrity:'}
      </span>
      <span className={`text-[11px] font-black tracking-wider ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
        {classIntegrityIndex}%
      </span>
      <span className={`text-[7px] font-black uppercase tracking-wider px-1 rounded border ${isLightMode ? 'bg-white text-slate-600 border-slate-300' : 'bg-slate-950/80 text-slate-300 border-slate-800'}`}>
        {statusSlug}
      </span>
    </div>
  );
}
