import { useState } from 'react';
import {
  Download,
  Heart,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { TelemetryPayload, AnomalyReport } from '../types';

interface HealthCenterProps {
  submissions: TelemetryPayload[];
  analyses: AnomalyReport[];
  lang: 'ar' | 'en';
}

export function SystemHealthCenter({
  submissions: _submissions,
  analyses,
  lang
}: HealthCenterProps) {
  const isAr = lang === 'ar';
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('weekly');
  const [successDownloadToast, setSuccessDownloadToast] = useState(false);

  // Compute stats
  const totalInCohort = analyses.length;
  const highRiskCohort = analyses.filter(a => a.riskLevel === 'high');
  const medRiskCohort = analyses.filter(a => a.riskLevel === 'medium');
  const safeCohort = analyses.filter(a => a.riskLevel === 'safe' || a.riskLevel === 'low');
  
  const classIntegrityPercent = totalInCohort > 0 
    ? Math.round(((safeCohort.length + (medRiskCohort.length * 0.4)) / totalInCohort) * 100) 
    : 100;

  // Track specific major malicious clusters
  const copyPasteSpikeCount = analyses.filter(a => a.copyPasteSpike).length;
  const tabSwitchesSpikeCount = analyses.filter(a => a.extremeTabSwitching).length;
  const ipConflictCount = analyses.filter(a => a.ipAddressConflict).length;
  const outBoundsSpikeCount = analyses.filter(a => a.outOfBoundsSpike).length;

  const downloadReport = () => {
    // Compile and organize report metadata
    const healthReport = {
      systemHealthReportId: `RPT-SYS-${reportType.toUpperCase()}-${new Date().toISOString().substring(0, 10)}`,
      scope: reportType,
      generatedAt: new Date().toISOString(),
      cohortAnalytics: {
        totalEvaluated: totalInCohort,
        highRiskSecurityExceptions: highRiskCohort.length,
        mediumRiskWarnings: medRiskCohort.length,
        safeAssessments: safeCohort.length,
        overallClassIntegrityScore: classIntegrityPercent,
      },
      suspiciousTrends: {
        extremeTabSwitchingCases: tabSwitchesSpikeCount,
        copyPasteVulnerabilities: copyPasteSpikeCount,
        ipClashesAndProxyViolations: ipConflictCount,
        studentOutOfBoundsEscapes: outBoundsSpikeCount,
      },
      riskCategoriesDistribution: {
        high: highRiskCohort.map(h => ({ studentId: h.studentId, name: h.studentName, score: h.riskScore })),
        medium: medRiskCohort.map(m => ({ studentId: m.studentId, name: m.studentName, score: m.riskScore })),
      },
      suggestedActionItems: [
        highRiskCohort.length > 0 
          ? `Verify geolocation indices and direct recordings of these high-risk candidates: ${highRiskCohort.slice(0, 3).map(h => h.studentName).join(', ')}`
          : "Maintain current proctor baseline configurations",
        ipConflictCount > 0 
          ? "Enable strict subnet filtering to curb in-room local student collusion."
          : "IP integrity maintains optimal distribution standards."
      ]
    };

    const blob = new Blob([JSON.stringify(healthReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system_health_report_${reportType}_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setSuccessDownloadToast(true);
    setTimeout(() => {
      setSuccessDownloadToast(false);
    }, 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7 space-y-6 shadow-xl relative overflow-hidden">
      {/* Visual neon grid accent */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header of Health Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400">
            <Heart className="w-5 h-5 fill-blue-500/20" />
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider">
              {isAr ? 'مركز سلامة الامتحانات' : 'Exam Integrity Center'}
            </h3>
          </div>
          <p className="text-sm text-slate-450 leading-relaxed">
            {isAr 
              ? 'تقارير دورية لمستوى النزاهة وتحليل مؤشرات السلامة للفصل الدراسي.' 
              : 'Automated integrity reports with cohort-level safety analysis and trend monitoring.'}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl self-start sm:self-auto select-none">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              reportType === 'daily' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'يومي' : 'Daily'}
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              reportType === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'أسبوعي' : 'Weekly'}
          </button>
        </div>
      </div>

      {/* Integrity Score Circle Widget and Trends */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Giant Circle Graph of Integrity */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 md:p-6 bg-slate-950/40 rounded-2xl border border-slate-850 text-center space-y-3">
          <span className="text-xs text-slate-500 uppercase font-mono font-bold tracking-wider">
            {isAr ? 'مؤشر النزاهة الكلية للفصل' : 'Overall Cohort Integrity Indicator'}
          </span>
          
          <div className="relative flex items-center justify-center h-36 w-36 mt-1">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                className="stroke-blue-550 transition-all duration-1000 ease-in-out"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - classIntegrityPercent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-white">{classIntegrityPercent}%</span>
              <span className="text-xs text-slate-450 block font-bold leading-none">{isAr ? 'معيار النقاء' : 'Pass Rate'}</span>
            </div>
          </div>

          <span className="text-xs text-slate-400 block">
            {classIntegrityPercent > 80 
              ? (isAr ? 'الفصل في نطاق آمن ومثالي' : 'Highly secure baseline') 
              : (isAr ? 'تزايد كبير في منسوب الغش' : 'Requires intervention')}
          </span>
        </div>

        {/* Core Trend Indicators Bar */}
        <div className="md:col-span-8 bg-slate-950/20 p-5 md:p-6 rounded-2xl border border-slate-850/80 space-y-4">
          <h4 className="text-sm font-bold text-slate-300">
            {isAr ? 'تطور الأنماط المشبوهة المكتشفة' : 'Anomaly Type Distribution Graph'}
          </h4>

          <div className="space-y-3 text-sm">
            {/* Tab Switches Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold">{isAr ? 'تبديل تبويبات ونوافذ المتصفح' : 'Extreme Browser Tab Switches'}</span>
                <span className="text-indigo-400 font-mono font-bold">{tabSwitchesSpikeCount} {isAr ? 'حالات' : 'cases'}</span>
              </div>
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalInCohort > 0 ? (tabSwitchesSpikeCount / totalInCohort) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Copy-Paste Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold">{isAr ? 'لصق نصوص تذكرية ضخمة (تلقين)' : 'Copy-Paste Spikes (Cheat feed)'}</span>
                <span className="text-amber-400 font-mono font-bold">{copyPasteSpikeCount} {isAr ? 'حالات' : 'cases'}</span>
              </div>
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalInCohort > 0 ? (copyPasteSpikeCount / totalInCohort) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* IP Collusion Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold">{isAr ? 'تطابق الشبكة المتزامن (تواطؤ IP)' : 'Simultaneous geolocated IP clashing'}</span>
                <span className="text-red-400 font-mono font-bold">{ipConflictCount} {isAr ? 'طلاب متقاطعين' : 'collusions'}</span>
              </div>
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalInCohort > 0 ? (ipConflictCount / totalInCohort) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Actions list & Scheduled Cycle Indicator */}
      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-400">
          <Clock className="w-5 h-5 text-[#818cf8]" />
          <span className="text-xs">
            {isAr 
              ? `دورة الماكر المجدولة: التقرير القادم سيعاد بناؤه تلقائياً في نهاية الـ 24 ساعة القادمة.`
              : `Proctor cron-schedule: Next incremental run starts automatically on midnight daily cycle.`}
          </span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={downloadReport}
            className="w-full sm:w-auto bg-[#312e81]/40 hover:bg-[#4338ca]/50 text-indigo-200 border border-indigo-700/50 hover:border-indigo-650 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow"
          >
            <Download className="w-4 h-4 text-indigo-300" />
            <span>
              {isAr ? `تنزيل ملف التقرير الطبيعي (${reportType.toUpperCase()})` : `Download Health File (${reportType.toUpperCase()})`}
            </span>
          </button>
        </div>
      </div>

      {/* Successful alert notification popup */}
      {successDownloadToast && (
        <div className="absolute bottom-5 inset-x-5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-xl animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold leading-normal">
            {isAr 
              ? 'تَمّ تجميع البيانات وتنزيل ملف صحة النظام بنجاح بصيغة JSON المعيارية.' 
              : 'Class diagnostic telemetry exported successfully. Check system_health_report.json downloads.'}
          </span>
        </div>
      )}
    </div>
  );
};
