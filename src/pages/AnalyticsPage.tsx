import { useState } from 'react';
import {
  Database, Activity, BarChart2, Users,
  Copy, MousePointer, Clock,
  Scale
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart,
  Area, PieChart, Pie, Cell
} from 'recharts';
import { TelemetryPayload, AnomalyReport } from '../types';
import { translations } from '../translations';
import CollapsibleSection from '../components/CollapsibleSection';
import TemporalCheatHeatmap from '../components/TemporalCheatHeatmap';
import RiskHeatmap from '../components/RiskHeatmap';
import SessionIntegrityDashboard from '../components/SessionIntegrityDashboard';
import StudentComparisonModal from '../components/StudentComparisonModal';
import StudentBehavioralDensity from '../components/StudentBehavioralDensity';

interface Props {
  submissions: TelemetryPayload[];
  analyses: AnomalyReport[];
  lang: 'ar' | 'en';
  isLightMode: boolean;
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  riskThreshold: number;
}

export default function AnalyticsPage({ submissions, analyses, lang, isLightMode, selectedStudentId, onSelectStudent, riskThreshold }: Props) {
  const currentT = translations[lang];
  const isAr = lang === 'ar';

  const getClassRiskCurveData = () => {
    const sorted = [...analyses].sort((a, b) => b.riskScore - a.riskScore);
    const top30 = sorted.slice(0, 30);
    const map: Record<string, number> = {};
    top30.forEach(a => {
      const key = a.studentName?.slice(0, 12) || a.studentId;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).slice(0, 20).map(([name]) => {
      const match = top30.find(a => a.studentName?.slice(0, 12) === name || a.studentId === name);
      return { name, riskScore: match?.riskScore || 0 };
    });
  };

  const getAverageViolationsData = () => {
    const total = submissions.length || 1;
    const avgTab = Math.round((submissions.reduce((s, sub) => s + (sub.tabSwitchesCount || 0), 0) / total) * 10) / 10;
    const avgCopy = Math.round((submissions.reduce((s, sub) => s + (sub.copyCount || 0), 0) / total) * 10) / 10;
    const avgPaste = Math.round((submissions.reduce((s, sub) => s + (sub.pasteCount || 0), 0) / total) * 10) / 10;
    const avgBounds = Math.round((submissions.reduce((s, sub) => s + (sub.outOfBoundsCount || 0), 0) / total) * 10) / 10;
    const avgMouse = Math.round((submissions.reduce((s, sub) => s + (sub.mouseOutSeconds || 0), 0) / total) * 10) / 10;
    return [
      { category: isAr ? 'نوافذ' : 'Tabs', average: avgTab },
      { category: isAr ? 'نسخ' : 'Copy', average: avgCopy },
      { category: isAr ? 'لصق' : 'Paste', average: avgPaste },
      { category: isAr ? 'حدود' : 'Bounds', average: avgBounds },
      { category: isAr ? 'فأرة' : 'Mouse', average: avgMouse },
    ];
  };

  const getVerdictDistributionData = () => {
    const counts = { approved: 0, retake: 0, investigation: 0, suspicious: 0, pending: 0 };
    analyses.forEach(a => {
      const v = a.verdict;
      if (v === 'approved') counts.approved++;
      else if (v === 'retake_requested') counts.retake++;
      else if (v === 'investigation') counts.investigation++;
      else if (a.riskLevel === 'high') counts.suspicious++;
      else counts.pending++;
    });
    return [
      { name: currentT.chartLabelApproved, value: counts.approved, color: '#10b981' },
      { name: currentT.chartLabelRetake, value: counts.retake, color: '#f59e0b' },
      { name: currentT.chartLabelInvestigation, value: counts.investigation, color: '#ef4444' },
      { name: currentT.chartLabelSuspicious, value: counts.suspicious, color: '#8b5cf6' },
      { name: currentT.chartLabelPending, value: counts.pending, color: '#64748b' },
    ].filter(d => d.value > 0);
  };

  const timeIntervals = [
    { id: 'first', label: isAr ? 'الربع الأول' : '0-15m' },
    { id: 'second', label: isAr ? 'الربع الثاني' : '15-30m' },
    { id: 'third', label: isAr ? 'الربع الثالث' : '30-45m' },
    { id: 'fourth', label: isAr ? 'الربع الرابع' : '45-60m' },
    { id: 'overtime', label: isAr ? 'الإضافي' : '60m+' },
  ];

  const metricRows = [
    { key: 'tabSwitches', label: isAr ? 'تبديل النوافذ' : 'Tab Switches', icon: <Activity className="w-3 h-3" /> },
    { key: 'clipboard', label: isAr ? 'النسخ واللصق' : 'Clipboard', icon: <Copy className="w-3 h-3" /> },
    { key: 'bounds', label: isAr ? 'تجاوز الحدود' : 'Out of Bounds', icon: <MousePointer className="w-3 h-3" /> },
    { key: 'mouseOut', label: isAr ? 'خمول الفأرة' : 'Mouse Idle', icon: <Clock className="w-3 h-3" /> },
  ];

  const getHeatmapData = () => {
    const grid: Record<string, Record<string, number>> = {};
    metricRows.forEach(row => { grid[row.key] = {}; timeIntervals.forEach(t => { grid[row.key][t.id] = 0; }); });
    submissions.forEach(sub => {
      const totalDuration = sub.durationMinutes || 60;
      timeIntervals.forEach((interval, idx) => {
        const intervalMin = idx * 15;
        const factor = Math.min(1, 15 / Math.max(1, totalDuration));
        if (grid['tabSwitches']) grid['tabSwitches'][interval.id] += Math.round((sub.tabSwitchesCount || 0) * factor * (idx + 1) / timeIntervals.length);
        if (grid['clipboard']) grid['clipboard'][interval.id] += Math.round(((sub.copyCount || 0) + (sub.pasteCount || 0)) * factor * (idx + 1) / timeIntervals.length);
        if (grid['bounds']) grid['bounds'][interval.id] += Math.round((sub.outOfBoundsCount || 0) * factor * (idx + 1) / timeIntervals.length);
        if (grid['mouseOut']) grid['mouseOut'][interval.id] += Math.round((sub.mouseOutSeconds || 0) * factor * (idx + 1) / timeIntervals.length);
      });
    });
    return grid;
  };

  const [compareStudentIdA, setCompareStudentIdA] = useState<string | null>(null);
  const [compareStudentIdB, setCompareStudentIdB] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Charts Section */}
      <CollapsibleSection
        title={currentT.chartsSectionTitle}
        subtitle={currentT.chartsSectionDesc}
        icon={<Database className="w-4 h-4 text-blue-400" />}
        lang={lang}
        isLightMode={isLightMode}
        defaultOpen={true}
      >
        <div id="charts-section" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Class Risk Curve */}
            <div className={`lg:col-span-5 p-5 rounded-xl space-y-4 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
              <h4 className={`text-xs font-extrabold flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {currentT.chartClassRiskCurve}
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getClassRiskCurveData()} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGradientA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                    <XAxis dataKey="name" stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={8} tickFormatter={(v) => String(v).length > 8 ? String(v).slice(0, 8) + '..' : v} tickLine={false} />
                    <YAxis stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={9} domain={[0, 100]} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#0f172a', borderColor: isLightMode ? '#cbd5e1' : '#334155', color: isLightMode ? '#0f172a' : '#f8fafc', fontSize: '10px', borderRadius: '6px' }} />
                    <Area type="monotone" dataKey="riskScore" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#riskGradientA)" name={currentT.chartYAxisRisk} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Average Violations */}
            <div className={`lg:col-span-4 p-4 rounded-xl space-y-4 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
              <h4 className={`text-xs font-extrabold flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                {currentT.chartAverageViolations}
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAverageViolationsData()} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                    <XAxis dataKey="category" stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={8} tickLine={false} />
                    <YAxis stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={9} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#0f172a', borderColor: isLightMode ? '#cbd5e1' : '#334155', color: isLightMode ? '#0f172a' : '#f8fafc', fontSize: '10px', borderRadius: '6px' }} />
                    <Bar dataKey="average" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={currentT.chartYAxisCount} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Verdict Distribution */}
            <div className={`lg:col-span-3 p-4 rounded-xl flex flex-col justify-between space-y-4 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
              <h4 className={`text-xs font-extrabold flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {currentT.chartVerdictDistribution}
              </h4>
              <div className="flex flex-row items-center justify-around h-32">
                <div className="w-24 h-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={getVerdictDistributionData()} innerRadius={28} outerRadius={40} paddingAngle={3} dataKey="value">
                        {getVerdictDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#0f172a', borderColor: isLightMode ? '#cbd5e1' : '#334155', color: isLightMode ? '#0f172a' : '#f8fafc', fontSize: '10px', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {getVerdictDistributionData().map((val, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[9px] font-mono">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: val.color }} />
                      <span className={`font-bold truncate max-w-[80px] ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`} title={val.name}>{val.name}:</span>
                      <span className={`font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{val.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`text-[10px] text-slate-500 text-center border-t pt-2 font-mono uppercase ${isLightMode ? 'border-slate-200' : 'border-slate-800/60'}`}>
                {isAr ? `إجمالي القرارات: ${analyses.length} حالة` : `Total decisions: ${analyses.length} cases`}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Session Integrity Timeline */}
      <CollapsibleSection
        title={isAr ? 'الجدول الزمني للفعاليات' : 'Session Integrity Timeline'}
        subtitle={isAr ? 'مخطط زمني لتفاعلات الطلاب' : 'Temporal visualization of student interactions'}
        icon={<BarChart2 className="w-4 h-4 text-emerald-400" />}
        lang={lang}
        isLightMode={isLightMode}
        defaultOpen={false}
      >
        <SessionIntegrityDashboard
          submissions={submissions}
          analyses={analyses}
          lang={lang}
        />
      </CollapsibleSection>

      {/* Temporal Cheat Heatmap */}
      <CollapsibleSection
        title={isAr ? 'خريطة الكثافة الزمنية' : 'Temporal Cheat Heatmap'}
        subtitle={isAr ? 'تحليل زمني للنشاطات المشبوهة' : 'Time-based analysis of suspicious activities'}
        icon={<Activity className="w-4 h-4 text-rose-400" />}
        lang={lang}
        isLightMode={isLightMode}
        defaultOpen={false}
      >
        <TemporalCheatHeatmap
          submissions={submissions}
          analyses={analyses}
          lang={lang}
          isLightMode={isLightMode}
        />
      </CollapsibleSection>

      {/* IP Comparison Heatmap */}
      <CollapsibleSection
        title={currentT.heatmapTitle}
        subtitle={currentT.heatmapDesc}
        icon={<Activity className="w-4 h-4 text-indigo-400" />}
        lang={lang}
        isLightMode={isLightMode}
        defaultOpen={false}
      >
        <div id="ip-comparison-section" className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[640px] grid grid-cols-7 gap-2">
              <div className="col-span-1"></div>
              {timeIntervals.map(interval => (
                <div key={interval.id} className={`text-center font-mono font-bold text-[10px] py-1 border rounded-md ${isLightMode ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-slate-400 bg-slate-950 border-slate-900'}`}>
                  {interval.label}
                </div>
              ))}
              {(() => {
                const heatmapGrid = getHeatmapData();
                return metricRows.map(row => (
                  <div key={row.key} className="contents">
                    <div className={`col-span-1 flex items-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-lg border ${isLightMode ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-slate-300 bg-slate-950/50 border-slate-800/40'}`}>
                      <span className="text-xs shrink-0">{row.icon}</span>
                      <span className="truncate">{row.label}</span>
                    </div>
                    {timeIntervals.map(interval => {
                      const val = heatmapGrid[row.key]?.[interval.id] || 0;
                      let style = isLightMode ? "bg-slate-100 text-slate-400 border border-slate-200" : "bg-slate-950 text-slate-600 border border-slate-900/80";
                      if (val >= 20) {
                        style = isLightMode
                          ? "bg-rose-100 text-rose-700 border border-rose-300 font-extrabold shadow-md shadow-rose-200/50"
                          : "bg-rose-950/40 text-rose-400 border border-rose-500/30 font-extrabold shadow-md shadow-rose-950/20";
                      } else if (val >= 5) {
                        style = isLightMode
                          ? "bg-amber-100 text-amber-700 border border-amber-300 font-bold"
                          : "bg-amber-950/30 text-amber-400 border border-amber-500/20 font-bold";
                      } else if (val > 0) {
                        style = isLightMode
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-emerald-950/20 text-emerald-400 border border-emerald-500/15";
                      }
                      return (
                        <div key={interval.id} className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs font-mono transition duration-150 relative group ${style}`}>
                          <span>{val}</span>
                          {val >= 20 && (
                            <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Risk Heatmap (Classroom Seating) */}
      <CollapsibleSection
        title={isAr ? 'خريطة الفصل الحرارية' : 'Classroom Risk Heatmap'}
        subtitle={isAr ? 'توزيع الطلاب حسب مستوى الخطورة' : 'Student distribution by risk level'}
        icon={<Users className="w-4 h-4 text-amber-400" />}
        lang={lang}
        isLightMode={isLightMode}
        defaultOpen={false}
      >
        <RiskHeatmap
          analyses={analyses}
          submissions={submissions}
          selectedStudentId={selectedStudentId}
          onSelectStudent={onSelectStudent}
          lang={lang}
          riskThreshold={riskThreshold}
        />
      </CollapsibleSection>

      {/* Comparison Tool */}
      <CollapsibleSection
        title={currentT.compareTitle}
        subtitle={currentT.compareSelectHint}
        icon={<Scale className="w-4 h-4 text-purple-400" />}
        lang={lang}
        isLightMode={isLightMode}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={compareStudentIdA || ''}
              onChange={(e) => setCompareStudentIdA(e.target.value || null)}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold border cursor-pointer appearance-none ${isLightMode ? 'bg-white text-slate-800 border-slate-300' : 'bg-slate-800 text-white border-slate-700'}`}
            >
              <option value="">{isAr ? '-- اختر الطالب أ --' : '-- Select Student A --'}</option>
              {submissions.map(sub => (
                <option key={sub.studentId} value={sub.studentId}>{sub.studentName}</option>
              ))}
            </select>
            <select
              value={compareStudentIdB || ''}
              onChange={(e) => setCompareStudentIdB(e.target.value || null)}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold border cursor-pointer appearance-none ${isLightMode ? 'bg-white text-slate-800 border-slate-300' : 'bg-slate-800 text-white border-slate-700'}`}
            >
              <option value="">{isAr ? '-- اختر الطالب ب --' : '-- Select Student B --'}</option>
              {submissions.map(sub => (
                <option key={sub.studentId} value={sub.studentId}>{sub.studentName}</option>
              ))}
            </select>
          </div>
          {compareStudentIdA && compareStudentIdB && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${isLightMode ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
            >
              {isAr ? 'فتح المقارنة التفصيلية' : 'Open Detailed Comparison'}
            </button>
          )}
        </div>
      </CollapsibleSection>

      {/* Comparison Modal */}
      {isComparisonModalOpen && compareStudentIdA && compareStudentIdB && (
        <StudentComparisonModal
          isOpen={true}
          selectedStudentIds={[compareStudentIdA, compareStudentIdB].filter(Boolean) as string[]}
          submissions={submissions}
          analyses={analyses}
          isLightMode={isLightMode}
          lang={lang}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}

      {/* Student Behavioral Density (when a student is selected) */}
      {selectedStudentId && (
        <CollapsibleSection
          title={isAr ? 'الكثافة السلوكية للطالب' : 'Student Behavioral Density'}
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
          lang={lang}
          isLightMode={isLightMode}
          defaultOpen={false}
        >
          {(() => {
            const matchedStudent = submissions.find(s => s.studentId === selectedStudentId);
            const matchedAnalysis = analyses.find(a => a.studentId === selectedStudentId);
            if (!matchedStudent || !matchedAnalysis) return null;
            return (
              <StudentBehavioralDensity
                student={matchedStudent}
                analysis={matchedAnalysis}
                lang={lang}
              />
            );
          })()}
        </CollapsibleSection>
      )}
    </div>
  );
}
