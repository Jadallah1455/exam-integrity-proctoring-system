import { useState, useMemo } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, Users, AlertTriangle, Clock, Network,
  Fingerprint, CheckCircle2, XCircle, Copy, Terminal, Activity, FileText,
  Lock, Database, Search, BookOpen, Filter, AlertCircle, Code, HelpCircle,
  Layers, Bell, TrendingUp, Menu, X, Printer, ArrowUpRight, ClipboardList,
  Eye, EyeOff, LogOut, UserCog, Sparkles, RotateCcw, GraduationCap, Target,
  Timer, Flame, Zap, Save, ChevronRight, ChevronLeft, LayoutDashboard, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MoodleSimulator from './MoodleSimulator';
import SecurityReport from './SecurityReport';
import TemporalCheatHeatmap from './TemporalCheatHeatmap';
import CollapsibleSection from './CollapsibleSection';
import StudentBehavioralDensity from './StudentBehavioralDensity';
import IntegrityProfile from './IntegrityProfile';
import { StudentOverviewDashboard } from './StudentOverviewDashboard';
import { SystemHealthCenter } from './SystemHealthCenter';
import { TelemetryPayload, AnomalyReport } from '../types';
import {
  LineChart, ComposedChart, Line, BarChart, Bar, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface DashboardPageProps {
  [key: string]: any;
}

export default function DashboardPage(props: DashboardPageProps) {
  const {
    lang, isLightMode, currentT, submissions, analyses,
    selectedStudentId, selectedSubDashboardId, dashboardSubTab,
    searchQuery, anomalyFilter, riskFilter, showHighRiskOnly,
    comparisonModeActive, batchSelectedIds, compareStudentIdA, compareStudentIdB,
    liveFeedActive, difficultyChartView, smartPresets, newPresetName, showPresetMenu,
    pdfGenerating, replayState, scrubMinute, noteDrafts, studentNotes,
    riskThreshold, selectedExamId, contextMenu,
    setSelectedSubDashboardId, setSearchQuery, setAnomalyFilter, setRiskFilter,
    setShowHighRiskOnly, setComparisonModeActive, setBatchSelectedIds,
    setCompareStudentIdA, setCompareStudentIdB, setLiveFeedActive,
    setDifficultyChartView, setSmartPresets, setNewPresetName, setShowPresetMenu,
    setPdfGenerating, setReplayState, setScrubMinute,
    setNoteDrafts, setStudentNotes, setContextMenu,
    setDashboardSubTab, setIsComparisonModalOpen, setSelectedStudentId,
    filteredAnalysis, selectedStudent, selectedAnalysis,
    totalSubmissions, highRiskCount, mediumRiskCount, safeCount, totalIPConflicts,
    studentAvgAcademicScore, studentExamAttendanceRate, studentAllSubmissions,
    studentTotalRiskSeconds, exams, subjects, originalIdMap, timeIntervals, metricRows,
    aggressivePatternStudentIds, patternAnomalyStudentIds,
    addAuditorLogEntry, showToast, compileReplayTimeline,
    getStudentAvatarParams, getHistoricalRunData, getCompareChartData,
    downloadBulkForensicPDF, handleReload, handleVerdictChange,
    handleBatchVerdictChange, handleBatchExportJSON, exportToCSV,
    downloadSISAuditJSON, downloadSISAuditJSONForSelection,
    getHeatmapData, getChronologicalEvents, getClassRiskCurveData,
    getAverageViolationsData, getVerdictDistributionData,
    getDifficultyBreakdownData, getIncidentNarrative,
    downloadForensicReport, timelineContainerRef,
  } = props;
  const [currentPage, setCurrentPage] = useState(0);
  const currentNoteInput = useMemo(() => {
    if (!selectedStudent) return '';
    const origId = originalIdMap[selectedStudent.studentId] || selectedStudent.studentId;
    return noteDrafts[origId] || '';
  }, [selectedStudent, noteDrafts, originalIdMap]);
  const pageSize = 25;
  const totalPages = Math.ceil(filteredAnalysis.length / pageSize);
  const clampedPage = currentPage >= totalPages ? Math.max(0, totalPages - 1) : currentPage;
  const paginatedAnalysis = filteredAnalysis.slice(clampedPage * pageSize, (clampedPage + 1) * pageSize);
  return (
            <>
              {selectedSubDashboardId && (
                <div className="mb-6 animate-fade-in">
                  <StudentOverviewDashboard
                    studentId={selectedSubDashboardId}
                    submissions={submissions}
                    analyses={analyses}
                    lang={lang}
                    isLightMode={isLightMode}
                    onClose={() => setSelectedSubDashboardId(null)}
                  />
                </div>
              )}

              {/* Cybersecurity Awareness Stats Header */}
              <div className={`rounded-2xl p-6 md:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl ${isLightMode ? 'bg-gradient-to-r from-white via-slate-50 to-white border border-slate-200' : 'bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border border-slate-800'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h2 className={`text-sm font-bold uppercase font-mono ${isLightMode ? 'text-blue-600' : 'text-blue-300'}`}>{currentT.intelClashOverview}</h2>
                  </div>
                  <p className={`text-sm max-w-2xl leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {currentT.intelClashDesc}
                  </p>
                </div>
                <div className={`flex gap-3 p-2 rounded-lg border shrink-0 self-stretch md:self-auto items-center justify-around ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'}`}>
                  <div className="text-center px-4">
                    <div className="text-[11px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{currentT.sigStatus}</div>
                    <div className={`text-sm font-bold mt-0.5 flex items-center gap-1 justify-center ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      <Lock className="w-3.5" />
                      {currentT.sigStatusVal}
                    </div>
                  </div>
                  <div className={`h-6 w-px ${isLightMode ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                  <div className="text-center px-4">
                    <div className="text-[11px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{currentT.camMicStatus}</div>
                    <div className={`text-sm font-bold mt-0.5 flex items-center gap-1 justify-center ${isLightMode ? 'text-blue-600' : 'text-blue-300'}`}>
                      <XCircle className="w-3.5" />
                      {currentT.camMicStatusVal}
                    </div>
                  </div>
                </div>
              </div>

              {/* System health center dashboard widget */}
              <SystemHealthCenter
                submissions={submissions}
                analyses={analyses}
                lang={lang}
              />

              {/* Stats Metrics Cards Grid */}
              <div id="stats-cards-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <div className={`rounded-2xl p-6 md:p-7 flex items-center gap-4 shadow-xl group transition-all duration-300 ${isLightMode ? 'bg-white border border-slate-200 hover:border-blue-300' : 'bg-slate-900 border border-slate-800 hover:border-blue-500/30'}`}>
                  <div className={`p-4 rounded-xl shrink-0 ${isLightMode ? 'bg-slate-100' : 'bg-slate-800/60'}`}>
                    <Users className={`w-6 h-6 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>{currentT.totalCandidates}</div>
                    <div className={`text-2xl font-mono font-extrabold mt-0.5 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{totalSubmissions} {currentT.candidatesUnit}</div>
                  </div>
                </div>

                <div className={`rounded-2xl p-6 md:p-7 flex items-center gap-4 shadow-xl transition-all duration-300 ${isLightMode ? 'bg-white border border-slate-200 hover:border-red-300' : 'bg-slate-900 border border-slate-800 hover:border-red-500/30'}`}>
                  <div className={`p-4 rounded-xl shrink-0 border ${isLightMode ? 'bg-red-50 border-red-200' : 'bg-red-950/25 border-red-900/20'}`}>
                    <ShieldAlert className={`w-6 h-6 ${isLightMode ? 'text-red-600' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold ${isLightMode ? 'text-red-600' : 'text-red-300/80'}`}>{currentT.highRisk.split(' ')[0]}</div>
                    <div className={`text-2xl font-mono font-extrabold mt-0.5 ${isLightMode ? 'text-red-700' : 'text-red-400'}`}>{highRiskCount} {currentT.papersUnit}</div>
                  </div>
                </div>

                <div className={`rounded-2xl p-6 md:p-7 flex items-center gap-4 shadow-xl transition-all duration-300 ${isLightMode ? 'bg-white border border-slate-200 hover:border-orange-300' : 'bg-slate-900 border border-slate-800 hover:border-orange-500/30'}`}>
                  <div className={`p-4 rounded-xl shrink-0 border ${isLightMode ? 'bg-orange-50 border-orange-200' : 'bg-orange-950/25 border-orange-900/20'}`}>
                    <AlertTriangle className={`w-6 h-6 ${isLightMode ? 'text-orange-600' : 'text-orange-400'}`} />
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold ${isLightMode ? 'text-orange-600' : 'text-orange-300/80'}`}>{currentT.medRisk.split(' ')[0]}</div>
                    <div className={`text-2xl font-mono font-extrabold mt-0.5 ${isLightMode ? 'text-orange-700' : 'text-orange-400'}`}>{mediumRiskCount} {currentT.candidatesUnit}</div>
                  </div>
                </div>

                <div className={`rounded-2xl p-6 md:p-7 flex items-center gap-4 shadow-xl transition-all duration-300 ${isLightMode ? 'bg-white border border-slate-200 hover:border-emerald-300' : 'bg-slate-900 border border-slate-800 hover:border-emerald-500/30'}`}>
                  <div className={`p-4 rounded-xl shrink-0 border ${isLightMode ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/25 border-emerald-900/20'}`}>
                    <ShieldCheck className={`w-6 h-6 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold ${isLightMode ? 'text-emerald-600' : 'text-emerald-300/80'}`}>{currentT.safeAndHonest.split(' ')[0]}</div>
                    <div className={`text-2xl font-mono font-extrabold mt-0.5 ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>{safeCount} {currentT.candidatesUnit}</div>
                  </div>
                </div>

                <div className={`rounded-2xl p-6 md:p-7 flex items-center gap-4 shadow-xl transition-all duration-300 col-span-2 lg:col-span-1 ${isLightMode ? 'bg-white border border-slate-200 hover:border-purple-300' : 'bg-slate-900 border border-slate-800 hover:border-purple-500/30'}`}>
                  <div className={`p-4 rounded-xl shrink-0 ${isLightMode ? 'bg-slate-100' : 'bg-slate-800/60'}`}>
                    <Network className={`w-6 h-6 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>{currentT.ipCollusionTitle}</div>
                    <div className={`text-2xl font-mono font-extrabold mt-0.5 ${isLightMode ? 'text-purple-700' : 'text-purple-400'}`}>{totalIPConflicts} {currentT.clashesUnit}</div>
                  </div>
                </div>
              </div>
              
              {/* Dashboard Split Sub-Tab Bar */}
              <div className={`flex gap-1 p-1 rounded-xl shadow-md ${isLightMode ? 'bg-slate-100 border border-slate-200' : 'bg-slate-900/80 border border-slate-800'}`}>
                <button
                  onClick={() => setDashboardSubTab('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dashboardSubTab === 'overview'
                      ? (isLightMode ? 'bg-white text-blue-700 border border-blue-200 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-md')
                      : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'ظ†ط¸ط±ط© ط¹ط§ظ…ط©' : 'Overview'}</span>
                </button>
                <button
                  onClick={() => setDashboardSubTab('roster')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dashboardSubTab === 'roster'
                      ? (isLightMode ? 'bg-white text-blue-700 border border-blue-200 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-md')
                      : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'قائمة الطلاب' : 'Roster'}</span>
                </button>
                <button
                  onClick={() => setDashboardSubTab('alerts')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dashboardSubTab === 'alerts'
                      ? (isLightMode ? 'bg-white text-blue-700 border border-blue-200 shadow-sm' : 'bg-slate-800 text-white border border-slate-700 shadow-md')
                      : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ' : 'Alerts'}</span>
                </button>
              </div>

              <div className={dashboardSubTab !== 'overview' && dashboardSubTab !== 'alerts' ? 'hidden' : ''}>
              {/* Exam Performance Overview & Difficulty Correlation Widget */}
              <CollapsibleSection
                title={lang === 'ar' ? 'ظ†ط¸ط±ط© ط¹ط§ظ…ط© ط¹ظ„ظ‰ ط§ظ„ط£ط¯ط§ط، ظˆط¹ظ„ط§ظ‚ط© ط§ظ„ظ‡ظٹظƒظ„ ط¨ط§ظ„ط®ط·ظˆط±ط©' : 'Exam Performance & Difficulty Correlation'}
                subtitle={lang === 'ar' ? 'ظٹظ‚ط¯ظ… طھط­ظ„ظٹظ„ط§ظ‹ ظ„ظ…طھظˆط³ط· ظ…ط¹ط¯ظ„ط§طھ ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط³ظ„ظˆظƒظٹط© ط¨ط­ط³ط¨ طµط¹ظˆط¨ط© ط§ظ„ظ†ظ…ط§ط°ط¬ ط§ظ„ط§ظ…طھط­ط§ظ†ظٹط©' : 'Correlates cumulative anomaly risk metrics across different exam structures'}
                icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                lang={lang}
                isLightMode={isLightMode}
                defaultOpen={true}
              >
                <div id="exam-performance-section" className="space-y-4">
                    <span className="hidden lg:inline text-[10px] font-mono px-2 py-1 bg-slate-950 border border-slate-800/80 text-slate-500 rounded-lg">
                      {lang === 'ar' ? 'طھط­ط¯ظٹط« طھظ„ظ‚ط§ط¦ظٹ ظ…ط³طھظ…ط±' : 'Continuous Live Feed'}
                    </span>
                    <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-lg shrink-0 select-none items-center gap-1">
                      <span className="text-[9px] text-slate-500 font-bold px-1.5 font-mono">
                        {lang === 'ar' ? 'ط§ظ„ط±ط³ظ…:' : 'Chart:'}
                      </span>
                      <button
                        onClick={() => setDifficultyChartView('bar')}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          difficultyChartView === 'bar'
                            ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ًں“ٹ {lang === 'ar' ? 'ط£ط¹ظ…ط¯ط©' : 'Bar'}
                      </button>
                      <button
                        onClick={() => setDifficultyChartView('radar')}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          difficultyChartView === 'radar'
                            ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ًں•¸ï¸ڈ {lang === 'ar' ? 'ط±ط§ط¯ط§ط±' : 'Radar'}
                      </button>
                    </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Column 1: Difficulty Bento Cards (5 out of 12 grid units) */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    {getDifficultyBreakdownData().map(card => {
                      return (
                        <div key={card.rawDifficulty} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: card.color }}></span>
                              {lang === 'ar' ? `ظ…ط³طھظˆظ‰ ${card.difficulty}` : `${card.difficulty} Structure`}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold font-mono">
                              {card.count} {lang === 'ar' ? 'ط¬ظ„ط³ط©' : 'sessions'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'ظ…طھظˆط³ط· ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط³ظ„ظˆظƒظٹط©:' : 'Avg Risk Index Score:'}</span>
                              <span className="text-sm font-mono font-extrabold" style={{ color: card.color }}>
                                {card.avgRisk}%
                              </span>
                            </div>
                            
                            {/* Visual Progress Bar Meter */}
                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${card.avgRisk}%`,
                                  backgroundColor: card.color
                                }}
                              />
                            </div>
                          </div>

                          {/* Analysis prose */}
                          <div className="text-[10.5px] leading-relaxed text-slate-400 pt-1.5 border-t border-slate-900">
                            {lang === 'ar' ? (
                              card.count === 0 
                                ? 'ظ„ظ… ظٹطھظ… طھظ‚ط¯ظٹظ… ط£ظٹ ط§ط®طھط¨ط§ط±ط§طھ ظ…ظ† ظ‡ط°ط§ ط§ظ„ظ†ظ…ط· ظ„ظ„طھظ‚ظٹظٹظ… ط­ط§ظ„ظٹط§ظ‹.'
                                : card.avgRisk >= 50 
                                  ? `âڑ ï¸ڈ ط§ظ„ظ†ظ…ط§ط°ط¬ ط°ط§طھ ط§ظ„طµط¹ظˆط¨ط© ط§ظ„ظ€${card.difficulty} طھط¸ظ‡ط± ظ…ط³طھظˆظٹط§طھ ط®ط·ظˆط±ط© ظ…ط±طھظپط¹ط© (${card.avgRisk}%) ظ…ظ…ط§ ظٹط¯ظ„ ط¹ظ„ظ‰ ط²ظٹط§ط¯ط© ظ†ط³ط¨ط© ط§ظ„ط´ط¨ظ‡ط§طھ ظپظٹ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط¹ظ‚ط¯ط©.`
                                  : `âœ“ ظ†ط³ط¨ط© ط§ظ„ظ…ط®ط§ظ„ظپط§طھ ظ…ظ†ط®ظپط¶ط© ظˆظ…ط³طھظ‚ط±ط© (${card.avgRisk}%) ظپظٹ ط§ظ„ظ†ظ…ط§ط°ط¬ ط§ظ„ظ€${card.difficulty}.`
                            ) : (
                              card.count === 0
                                ? 'No completed student attempts for this structural level.'
                                : card.avgRisk >= 55
                                  ? `âڑ ï¸ڈ Elevated risk metrics (${card.avgRisk}%) suggest a correlation between tougher structures and candidate deviation (e.g. search queries).`
                                  : `âœ“ Safe operational metrics (${card.avgRisk}%) indicate secure behavioral performance for this difficulty tier.`
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 2: Selected Interactive Chart representation (7 out of 12 grid units) */}
                  <div className={`lg:col-span-7 flex flex-col justify-center min-h-[300px] p-4 rounded-xl animate-in fade-in zoom-in-95 duration-200 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
                    <div className="w-full h-full min-h-[280px]">
                      {difficultyChartView === 'bar' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getDifficultyBreakdownData()} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                            <XAxis dataKey="difficulty" stroke={isLightMode ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="medium" />
                            <YAxis stroke={isLightMode ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="medium" domain={[0, 100]} unit="%" />
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#0f172a', borderColor: isLightMode ? '#cbd5e1' : '#1e293b', borderRadius: '8px' }}
                              labelStyle={{ color: isLightMode ? '#0f172a' : '#ffffff', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="avgRisk" radius={[6, 6, 0, 0]} maxBarSize={60}>
                              {getDifficultyBreakdownData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getDifficultyBreakdownData()}>
                            <PolarGrid stroke={isLightMode ? '#cbd5e1' : '#334155'} />
                            <PolarAngleAxis dataKey="difficulty" stroke={isLightMode ? '#64748b' : '#94a3b8'} fontSize={11} fontWeight="medium" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={isLightMode ? '#94a3b8' : '#475569'} fontSize={9} />
                            <Radar name={lang === 'ar' ? 'ظ…طھظˆط³ط· ط§ظ„ط®ط·ظˆط±ط©' : 'Avg Risk'} dataKey="avgRisk" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#0f172a', borderColor: isLightMode ? '#cbd5e1' : '#1e293b', borderRadius: '8px' }}
                              labelStyle={{ color: isLightMode ? '#0f172a' : '#ffffff' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </CollapsibleSection>

              {/* Integrity Alerts History List - Tracks student threshold breaches */}
              <CollapsibleSection
                title={lang === 'ar' ? 'ط³ط¬ظ„ ط¥ظ†ط°ط§ط±ط§طھ ط®ط·ظˆط±ط© ط§ظ„ظ†ط²ط§ظ‡ط© ظˆط§ظ„ط£ظ…ط§ظ† ط§ظ„ظ…ط¨ط§ط´ط±' : 'Live Integrity Alerts History Log'}
                subtitle={lang === 'ar' ? 'طھط؛ط°ظٹط© ط¨ط£ظ‡ظ… ط§ظ„ط­ط§ظ„ط§طھ ط§ظ„ظ†ط´ط·ط© ط§ظ„طھظٹ ظٹطھط¬ط§ظˆط² ظپظٹظ‡ط§ ظ…ط¤ط´ط± ط§ظ„ط·ط§ظ„ط¨ ط­ط¯ ط§ظ„ط£ظ…ط§ظ†' : 'Granular tracing of candidates bridging the system-configured alert threshold'}
                icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
                lang={lang}
                isLightMode={isLightMode}
                defaultOpen={true}
                badge={lang === 'ar' ? `ط­ط¯ ط§ظ„ط¥ظ†ط°ط§ط±: ${riskThreshold}%` : `Threshold: ${riskThreshold}%`}
                badgeColor="bg-red-500/10 text-red-400"
              >
                <div id="alerts-section" className="space-y-4">

                <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
                  {(() => {
                    const breached = analyses.filter(an => an.riskScore >= riskThreshold);
                    if (breached.length === 0) {
                      return (
                        <div className="bg-slate-950/40 border border-dashed border-slate-850 p-8 text-center rounded-xl text-xs text-slate-500 flex flex-col items-center gap-2">
                          <span className="text-xl">â­گï¸ڈ</span>
                          <span>
                            {lang === 'ar' 
                              ? `ظ‚ط§ط¹ط© ط§ظ„ط§ظ…طھط­ط§ظ† ط¢ظ…ظ†ط© ط¨ط§ظ„ظƒط§ظ…ظ„ - ظ„ط§ ظٹظˆط¬ط¯ ط·ظ„ط§ط¨ ظٹطھط¬ط§ظˆط²ظˆظ† ط¹طھط¨ط© ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط­ط§ظ„ظٹط© (${riskThreshold}%).` 
                              : `Excellent operational security - no candidates exceed the configured alert criteria (${riskThreshold}%).`}
                          </span>
                        </div>
                      );
                    }

                    return breached.map(an => {
                      const sub = submissions.find(s => s.studentId === an.studentId);
                      const timestampStr = sub ? new Date(sub.endTime).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      }) : new Date().toLocaleString();

                      // Formulate cause vectors
                      const causes: { labelAr: string; labelEn: string; value: string | number; color: string }[] = [];
                      if (sub) {
                        if (sub.tabSwitchesCount > 0) {
                          causes.push({
                            labelAr: `طھط¨ط¯ظٹظ„ ظ…طھظƒط±ط± ظ„ظ„طھط¨ظˆظٹط¨ط§طھ (${sub.tabSwitchesCount})`,
                            labelEn: `Tab defocus switches (${sub.tabSwitchesCount}x)`,
                            value: sub.tabSwitchesCount,
                            color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          });
                        }
                        if (sub.copyCount > 0) {
                          causes.push({
                            labelAr: `ط¹ظ…ظ„ظٹط§طھ ظ†ط³ط® ظ…ظ† ط§ظ„ط­ط§ظپط¸ط© (${sub.copyCount})`,
                            labelEn: `Sparsely copied exam body text (${sub.copyCount}x)`,
                            value: sub.copyCount,
                            color: "bg-amber-500/10 text-amber-200 border-amber-500/20"
                          });
                        }
                        if (sub.pasteCount > 0) {
                          causes.push({
                            labelAr: `ط¹ظ…ظ„ظٹط§طھ ظ„طµظ‚ ظ…ط­ط°ط±ط© (${sub.pasteCount})`,
                            labelEn: `Suspect code/text paste injections (${sub.pasteCount}x)`,
                            value: sub.pasteCount,
                            color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          });
                        }
                        if (sub.mouseOutSeconds > 15) {
                          causes.push({
                            labelAr: `طھط±ظƒ ظ…ظ†ط·ظ‚ط© ط§ظ„ط­ظ„ (${sub.mouseOutSeconds}ط«)`,
                            labelEn: `Out-of-focus dwell lag (${sub.mouseOutSeconds}s)`,
                            value: sub.mouseOutSeconds,
                            color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          });
                        }
                        if (sub.outOfBoundsCount > 0) {
                          causes.push({
                            labelAr: `طھط¬ط§ظˆط² ط­ط¯ظˆط¯ ط§ظ„ظ…طھطµظپط­ (${sub.outOfBoundsCount})`,
                            labelEn: `Window out of bounds (${sub.outOfBoundsCount}x)`,
                            value: sub.outOfBoundsCount,
                            color: "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          });
                        }
                      }
                      if (an.ipAddressConflict) {
                        causes.push({
                          labelAr: "طھط·ط§ط¨ظ‚ ط¹ظ†ظˆط§ظ† IP ط§ظ„ط´ط¨ظƒظٹ",
                          labelEn: "IP address space duplication",
                          value: "IP Conflict",
                          color: "bg-red-500/10 text-red-400 border-red-500/20"
                        });
                      }
                      if (an.timeAnomaly) {
                        causes.push({
                          labelAr: "ط²ظ…ظ† ط­ظ„ ظ…ط´ط¨ظˆظ‡ ظˆظ‚طµظٹط± ط¬ط¯ط§ظ‹",
                          labelEn: "Suspiciously rapid solve speed",
                          value: "Time Variance",
                          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        });
                      }
                      if (an.macroUsage) {
                        causes.push({
                          labelAr: "ظ†ظ…ط· ط¶ط±ط¨ط§طھ ظ…ظپط§طھظٹط­ ط§طµط·ظ†ط§ط¹ظٹ",
                          labelEn: "Autonomic keypress dynamics (Macro)",
                          value: "Macro Detected",
                          color: "bg-pink-500/10 text-pink-400 border-pink-500/20"
                        });
                      }

                      return (
                        <div 
                          key={an.studentId}
                          className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-500/20 hover:bg-slate-950 transition-all duration-305"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Student name */}
                              <span 
                                onClick={() => setSelectedSubDashboardId(an.studentId)}
                                className="font-extrabold text-white text-xs hover:text-blue-400 cursor-pointer transition select-none flex items-center gap-1.5"
                              >
                                ًں‘¤ {an.studentName}
                              </span>
                              
                              {/* Student ID */}
                              <span className="text-[10px] text-slate-500 font-mono">({an.studentId})</span>

                              {/* Timestamp */}
                              <span className="text-[9.5px] text-slate-450 font-mono flex items-center gap-1 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                                ًں“… {timestampStr}
                              </span>
                            </div>

                            {/* Anomaly trigger vectors */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {causes.map((c, cidx) => (
                                <span 
                                  key={cidx} 
                                  className={`text-[9.5px] px-2 py-0.5 rounded-md border font-mono font-bold ${c.color}`}
                                >
                                  {lang === 'ar' ? c.labelAr : c.labelEn}
                                </span>
                              ))}
                              {causes.length === 0 && (
                                <span className="text-[9.5px] text-slate-500 italic font-mono">
                                  {lang === 'ar' ? 'ظ†ظ…ط· ط§ظ†ط­ط±ط§ظپ ط¹ط§ظ…' : 'Accumulated standard infractions'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Risk display badge and drill button */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right font-mono">
                              <span className="text-[9px] text-slate-500 block uppercase font-bold">{lang === 'ar' ? 'ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط­ط§ظ„ظٹ' : 'Risk Index Score'}</span>
                              <strong className="text-red-400 text-sm font-extrabold">{an.riskScore}% </strong>
                              <span className="text-slate-500 text-[10px]">/ {riskThreshold}% {lang === 'ar' ? 'ط§ظ„ط­ط¯' : 'Cap'}</span>
                            </div>

                            <button
                              onClick={() => setSelectedSubDashboardId(an.studentId)}
                              className="px-3 py-1.5 rounded-lg bg-red-950/20 text-red-400 border border-red-900/40 text-[10.5px] font-bold hover:bg-red-950/45 hover:border-red-500/30 transition cursor-pointer flex items-center gap-1"
                            >
                              <span>{lang === 'ar' ? 'ظپط­طµ ط§ظ„ط³ط¬ظ„' : 'Audit Profile'}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              </CollapsibleSection>
              </div>

              <div className={dashboardSubTab !== 'overview' ? 'hidden' : ''}>
              <TemporalCheatHeatmap
                submissions={submissions}
                analyses={analyses}
                lang={lang}
                isLightMode={isLightMode}
              />

              {/* Comprehensive Classroom Analytics & Diagram Center */}
              <CollapsibleSection
                title={currentT.chartsSectionTitle}
                subtitle={currentT.chartsSectionDesc}
                icon={<Database className="w-5 h-5 text-blue-400" />}
                lang={lang}
                isLightMode={isLightMode}
                defaultOpen={true}
              >
                <div id="charts-section" className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Chart 1: Classroom overall risk distribution curve (Area Chart 5 cols on lg) */}
                  <div className={`lg:col-span-5 p-5 rounded-xl space-y-4 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
                    <div>
                      <h4 className={`text-xs font-extrabold flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {currentT.chartClassRiskCurve}
                      </h4>
                    </div>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={getClassRiskCurveData()}
                          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                          <XAxis 
                            dataKey="name" 
                            stroke={isLightMode ? '#64748b' : '#64748b'} 
                            fontSize={8} 
                            tickFormatter={(v) => (String(v).length > 8 ? String(v).slice(0, 8) + '..' : v)}
                            tickLine={false}
                          />
                          <YAxis stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={9} domain={[0, 100]} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: isLightMode ? '#ffffff' : '#0f172a',
                              borderColor: isLightMode ? '#cbd5e1' : '#334155',
                              color: isLightMode ? '#0f172a' : '#f8fafc',
                              fontSize: '10px',
                              borderRadius: '6px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="riskScore" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#riskGradient)" 
                            name={currentT.chartYAxisRisk}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Violations Average (Bar Chart 4 cols on lg) */}
                  <div className={`lg:col-span-4 p-4 rounded-xl space-y-4 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
                    <div>
                      <h4 className={`text-xs font-extrabold flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        {currentT.chartAverageViolations}
                      </h4>
                    </div>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getAverageViolationsData()}
                          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                          <XAxis dataKey="category" stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={8} tickLine={false} />
                          <YAxis stroke={isLightMode ? '#64748b' : '#64748b'} fontSize={9} tickLine={false} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: isLightMode ? '#ffffff' : '#0f172a',
                              borderColor: isLightMode ? '#cbd5e1' : '#334155',
                              color: isLightMode ? '#0f172a' : '#f8fafc',
                              fontSize: '10px',
                              borderRadius: '6px'
                            }}
                          />
                          <Bar 
                            dataKey="average" 
                            fill="#8b5cf6" 
                            radius={[4, 4, 0, 0]}
                            name={currentT.chartYAxisCount}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Proctors Decision Ratio (Donut pie chart 3 cols on lg with custom keys) */}
                  <div className={`lg:col-span-3 p-4 rounded-xl flex flex-col justify-between space-y-4 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
                    <div>
                      <h4 className={`text-xs font-extrabold flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {currentT.chartVerdictDistribution}
                      </h4>
                    </div>
                    
                    <div className="flex flex-row items-center justify-around h-32">
                      <div className="w-24 h-24 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getVerdictDistributionData()}
                              innerRadius={28}
                              outerRadius={40}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {getVerdictDistributionData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: isLightMode ? '#ffffff' : '#0f172a',
                                borderColor: isLightMode ? '#cbd5e1' : '#334155',
                                color: isLightMode ? '#0f172a' : '#f8fafc',
                                fontSize: '10px',
                                borderRadius: '6px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Donut Chart Manual Legend list */}
                      <div className="space-y-1.5">
                        {getVerdictDistributionData().map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[9px] font-mono">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: val.color }}
                            />
                            <span className={`font-bold truncate max-w-[80px] ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`} title={val.name}>{val.name}:</span>
                            <span className={`font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{val.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simple summary label */}
                    <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/60 pt-2 font-mono uppercase">
                      {lang === 'ar' ? `ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ‚ط±ط§ط±ط§طھ: ${analyses.length} ط­ط§ظ„ط©` : `Total decisions: ${analyses.length} cases`}
                    </div>
                  </div>
                </div>
              </div>
              </CollapsibleSection>
              </div>

              {/* Visual Heatmap Component: Highlights peak hours/minutes activity of students */}
              <CollapsibleSection
                title={currentT.heatmapTitle}
                subtitle={currentT.heatmapDesc}
                icon={<Activity className="w-5 h-5 text-indigo-400" />}
                lang={lang}
                isLightMode={isLightMode}
                defaultOpen={true}
              >
                <div className={dashboardSubTab !== 'overview' ? 'hidden' : ''}>
                <div id="ip-comparison-section" className="space-y-4">

                <div className="overflow-x-auto">
                  <div className="min-w-[640px] grid grid-cols-7 gap-2">
                    {/* Header empty spacing cell */}
                    <div className="col-span-1"></div>
                    {/* Time intervals title headers */}
                    {timeIntervals.map(interval => (
                      <div key={interval.id} className={`text-center font-mono font-bold text-[10px] py-1 border rounded-md ${isLightMode ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-slate-400 bg-slate-950 border-slate-900'}`}>
                        {interval.label}
                      </div>
                    ))}

                    {/* Metric Rows */}
                    {(() => {
                      const heatmapGrid = getHeatmapData();
                      return metricRows.map(row => (
                        <div key={row.key} className="contents">
                          {/* Row label */}
                          <div className={`col-span-1 flex items-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-lg border ${isLightMode ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-slate-300 bg-slate-950/50 border-slate-800/40'}`}>
                            <span className="text-xs shrink-0">{row.icon}</span>
                            <span className="truncate">{row.label}</span>
                          </div>

                          {/* Interval matrix cells */}
                          {timeIntervals.map(interval => {
                            const val = heatmapGrid[row.key]?.[interval.id] || 0;
                            let style = isLightMode ? "bg-slate-50 text-slate-400 border border-slate-200" : "bg-slate-950 text-slate-600 border border-slate-900/80";
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
                              <div
                                key={interval.id}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs font-mono transition duration-150 relative group ${style}`}
                              >
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
              </div>

              <div className={dashboardSubTab !== 'overview' && dashboardSubTab !== 'roster' ? 'hidden' : ''}>
              {/* Middle Section: Live Proctoring and Active Inspection */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (9 cols on lg): Dashboard List & Inspector */}
                <div className="lg:col-span-9 space-y-8">
                  {/* Search & Filter Bar */}
                  <div className={`rounded-2xl p-6 md:p-7 flex flex-col gap-4 shadow-md ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                      <div className={`flex items-center gap-2 text-sm font-bold w-full sm:w-auto ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        <Filter className={`w-5 h-5 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
                        <span>{currentT.filterAttendance}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center flex-wrap">
                        {/* Search field */}
                        <div className="relative w-full sm:w-60">
                          <Search className={`w-5 h-5 text-slate-500 absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                          <input
                            type="text"
                            placeholder={currentT.searchPlaceholder}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={`w-full text-sm py-2.5 rounded-lg focus:outline-none focus:border-blue-500 ${lang === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'} ${isLightMode ? 'bg-white text-slate-800 border border-slate-300' : 'bg-slate-950 text-white border border-slate-800'}`}
                          />
                        </div>

                        {/* Anomaly Type selective dropdown */}
                        <select
                          value={anomalyFilter}
                          onChange={e => setAnomalyFilter(e.target.value)}
                          className={`text-xs sm:text-sm font-bold py-2.5 px-3 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer ${isLightMode ? 'bg-white text-slate-700 border border-slate-300' : 'bg-slate-950 text-slate-350 border border-slate-800'}`}
                        >
                          <option value="all">{lang === 'ar' ? 'ط¬ظ…ظٹط¹ ط£ظ†ظ…ط§ط· ط§ظ„ظ…ط®ط§ظ„ظپط§طھ' : 'All Anomaly Types'}</option>
                          <option value="ip_conflict">{lang === 'ar' ? 'طھط·ط§ط¨ظ‚ ط¹ظ†ظˆط§ظ† IP ظˆطھظˆط§ط·ط¤' : 'Network IP Conflict'}</option>
                          <option value="high_tabs">{lang === 'ar' ? 'ظ…ط¹ط¯ظ„ طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط° ظ…ط±طھظپط¹' : 'High Tab Switches'}</option>
                          <option value="copy_paste">{lang === 'ar' ? 'ط§ط±طھظپط§ط¹ ظ…ط¤ط´ط± ط§ظ„ظ†ط³ط® ظˆط§ظ„ظ„طµظ‚' : 'Copy/Paste Spike'}</option>
                          <option value="mouse_offscreen">{lang === 'ar' ? 'ط®ط±ظˆط¬ ط§ظ„ظ…ط¤ط´ط± ط§ظ„ظ…طھظƒط±ط±' : 'Mouse Offscreen Spike'}</option>
                          <option value="time_anomaly">{lang === 'ar' ? 'ط¥ظ†ظ‡ط§ط، ط³ط±ظٹط¹ ط؛ظٹط± ط·ط¨ظٹط¹ظٹ' : 'Abnormal Quick Solve'}</option>
                          <option value="macro_usage">{lang === 'ar' ? 'ط§ط³طھط®ط¯ط§ظ… ظ…ط§ظƒط±ظˆ ظ…ط­ط§ظƒظٹ âڑ،' : 'Macro / Automated Click Usage âڑ،'}</option>
                        </select>
                        {/* Filter preset select */}
                        <div className={`flex p-0.5 rounded-lg ${isLightMode ? 'bg-slate-100 border border-slate-200' : 'bg-slate-950 border border-slate-800'}`}>
                          <button
                            onClick={() => setRiskFilter('all')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${riskFilter === 'all' ? 'bg-blue-600 text-white' : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
                          >
                            {currentT.filterAll}
                          </button>
                          <button
                            onClick={() => setRiskFilter('high')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${riskFilter === 'high' ? (isLightMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-red-500/20 text-red-300 border border-red-500/20') : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
                          >
                            {currentT.filterCritical}
                          </button>
                          <button
                            onClick={() => setRiskFilter('medium')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${riskFilter === 'medium' ? (isLightMode ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-orange-500/20 text-orange-300 border border-orange-500/20') : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
                          >
                            {currentT.filterMedium}
                          </button>
                          <button
                            onClick={() => setRiskFilter('safe')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${riskFilter === 'safe' ? (isLightMode ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20') : (isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')}`}
                          >
                            {currentT.filterSafe}
                          </button>
                        </div>

                        {/* Show High-Risk Only Toggle Button */}
                        <button
                          onClick={() => {
                            const newValue = !showHighRiskOnly;
                            setShowHighRiskOnly(newValue);
                            showToast(
                              newValue ? "طھظ… طھظپط¹ظٹظ„ ظپظ„طھط± ط§ظ„ط­ط§ظ„ط§طھ ط¹ط§ظ„ظٹط© ط§ظ„ط®ط·ظˆط±ط© ظپظ‚ط·" : "طھظ… ط¥ظ„ط؛ط§ط، ظپظ„طھط± ط§ظ„ط­ط§ظ„ط§طھ ط¹ط§ظ„ظٹط© ط§ظ„ط®ط·ظˆط±ط©",
                              newValue ? "High-Risk Only filter enabled" : "High-Risk Only filter disabled"
                            );
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2.5 h-[40px] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border ${
                            showHighRiskOnly
                              ? 'bg-rose-500/25 border-rose-500/40 text-red-200 animate-pulse'
                              : (isLightMode ? 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700')
                          }`}
                          title={lang === 'ar' ? 'تصفية سريعة لجميع الطلاب الذين لديهم خطورة عالية ومخالفات حرجة' : 'Quickly focus on candidates with high risk or active violations'}
                        >
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{lang === 'ar' ? 'ط¹ط§ظ„ظٹ ط§ظ„ط®ط·ظˆط±ط© ظپظ‚ط·' : 'High-Risk Only'}</span>
                        </button>

                        {/* Export to CSV Button */}
                        <button
                          onClick={exportToCSV}
                          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none shrink-0 ${isLightMode ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50' : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800'}`}
                        >
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>{currentT.exportCsvBtn}</span>
                        </button>

                        {/* Export to SIS JSON Button */}
                        <button
                          onClick={downloadSISAuditJSON}
                          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none shrink-0 ${isLightMode ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50' : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800'}`}
                          title={lang === 'ar' ? 'طھط­ظ…ظٹظ„ ظƒط§ظ…ظ„ ظ†طھط§ط¦ط¬ ط§ظ„ط¨ط­ط« ظ„ظ„طھظƒط§ظ…ظ„ ظ…ط¹ ظ†ط¸ط§ظ… SIS ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹ ظ„ظ„ط¬ط§ظ…ط¹ط©' : 'Export and download current filtered candidates to SIS-compliant JSON formatting'}
                        >
                          <Database className="w-4 h-4 text-purple-400" />
                          <span>{lang === 'ar' ? 'طھطµط¯ظٹط± ظ„ظ€ SIS JSON' : 'SIS JSON Audit'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Integrated custom smart filter presets configurator */}
                    <div className={`pt-3 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center ${isLightMode ? 'border-t border-slate-200' : 'border-t border-slate-800/60'}`}>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${isLightMode ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' : 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'}`}>
                          <Sparkles className={`w-3 h-3 ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`} />{lang === 'ar' ? 'ط§ظ„ظ…ط±ط´ط­ط§طھ ط§ظ„ط°ظƒظٹط©:' : 'Smart Filter Presets:'}
                        </span>
                        
                        {(smartPresets as Array<{ id: string; nameEn: string; nameAr: string; searchQuery: string; anomalyFilter: string; riskFilter: string; showHighRiskOnly: boolean }>).map((preset) => {
                          const isActive = searchQuery === preset.searchQuery && 
                                           anomalyFilter === preset.anomalyFilter && 
                                           riskFilter === preset.riskFilter && 
                                           showHighRiskOnly === preset.showHighRiskOnly;
                          return (
                            <div key={preset.id} className="flex items-center">
                              <button
                                onClick={() => {
                                  setSearchQuery(preset.searchQuery);
                                  setAnomalyFilter(preset.anomalyFilter);
                                  setRiskFilter(preset.riskFilter);
                                  setShowHighRiskOnly(preset.showHighRiskOnly);
                                  showToast(
                                    `طھظ… طھظپط¹ظٹظ„ ط§ظ„ظ…ط±ط´ط­ ط§ظ„ط°ظƒظٹ: ${lang === 'ar' ? preset.nameAr : preset.nameEn}`,
                                    `Activated filter combination preset: ${preset.nameEn}`
                                  );
                                }}
                                className={`px-2 py-1 text-[10px] font-extrabold rounded-l border cursor-pointer select-none transition ${
                                  isActive
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : (isLightMode ? 'bg-white border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white')
                                }`}
                              >
                                {lang === 'ar' ? preset.nameAr : preset.nameEn}
                              </button>
                              
                              {/* Option to delete user-created configurations */}
                              {!['preset-collusion', 'preset-copy-paste', 'preset-safe-vibe'].includes(preset.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSmartPresets((prev: any[]) => prev.filter(p => p.id !== preset.id));
                                    showToast(
                                      'طھظ… ط¥ط²ط§ظ„ط© ظ‡ط°ط§ ط§ظ„ظپظ„طھط± ط§ظ„ط³ط±ظٹط¹ ط§ظ„ظ…ط®طµطµ',
                                      'Custom filter preset removed successfully'
                                    );
                                  }}
                                  className={`px-1.5 py-1 text-[10px] rounded-r transition cursor-pointer ${isLightMode ? 'bg-white hover:bg-red-50 hover:text-red-600 text-slate-400 border-y border-r border-slate-300' : 'bg-slate-950 hover:bg-red-950 hover:text-red-400 text-slate-500 border-y border-r border-slate-800'}`}
                                  title={lang === 'ar' ? 'ط¥ط²ط§ظ„ط© ط§ظ„ظپظ„طھط±' : 'Remove preset'}
                                >
                                  أ—
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Config menu action */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {showPresetMenu ? (
                          <div className={`flex items-center p-1 rounded-md gap-1.5 text-xs animate-in fade-in duration-200 ${isLightMode ? 'bg-white border border-slate-300' : 'bg-slate-950 border border-slate-800'}`}>
                            <input
                              type="text"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder={lang === 'ar' ? 'ط§ط³ظ… ط§ظ„ظپظ„طھط±...' : 'Preset name...'}
                              className={`rounded px-1.5 py-0.8 text-[9.5px] focus:outline-none focus:border-indigo-500 w-28 ${isLightMode ? 'bg-slate-50 border border-slate-300 text-slate-800' : 'bg-slate-900 border border-slate-800 text-white'}`}
                              maxLength={26}
                            />
                            <button
                              onClick={() => {
                                if (!newPresetName.trim()) {
                                  showToast('ظٹط±ط¬ظ‰ ظƒطھط§ط¨ط© ط§ط³ظ… ظ„ظ„ظ…ط±ط´ط­ ط£ظˆظ„ط§ظ‹', 'Provide a valid preset name');
                                  return;
                                }
                                const id = 'preset-user-' + Date.now();
                                const newP = {
                                  id,
                                  nameEn: newPresetName,
                                  nameAr: newPresetName,
                                  searchQuery,
                                  anomalyFilter,
                                  riskFilter,
                                  showHighRiskOnly
                                };
                                setSmartPresets((prev: any[]) => [...prev, newP]);
                                setNewPresetName('');
                                setShowPresetMenu(false);
                                showToast(
                                  `طھظ… طھط®ط²ظٹظ† ط§ظ„ظپظ„طھط± ط§ظ„طھط±ط§ظƒظ…ظٹ: ${newPresetName}`,
                                  `Saved smart filter configurations as: ${newPresetName}`
                                );
                              }}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9.5px] font-bold rounded cursor-pointer"
                            >
                              {lang === 'ar' ? 'ط­ظپط¸' : 'Save'}
                            </button>
                            <button
                              onClick={() => setShowPresetMenu(false)}
                              className={`px-1 text-[10px] font-bold cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                            >
                              أ—
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowPresetMenu(true)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold text-indigo-400 cursor-pointer transition select-none flex items-center gap-1 ${isLightMode ? 'bg-white border border-slate-300 hover:border-indigo-500/25' : 'bg-slate-950 border border-slate-800 hover:border-indigo-500/25'}`}
                          >
                            <Save className="w-3 h-3" /> {lang === 'ar' ? 'ط­ظپط¸ ط§ظ„ظپظ„طھط± ط§ظ„ط­ط§ظ„ظٹ ظƒظ†ظ…ظˆط°ط¬ ظ…ط³ط¨ظ‚' : 'Save current as smart preset'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main telemetry list of students */}
                  <div className={`rounded-xl overflow-hidden shadow-xl ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className={`p-4 border-b flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                      <div className="flex items-center gap-2">
                        <Database className={`w-4 h-4 ${isLightMode ? 'text-blue-500' : 'text-blue-400'}`} />
                        <h3 className={`text-sm font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{currentT.instantMetricsHeading}</h3>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Live Feed Toggle Hook */}
                        <button
                          onClick={() => {
                            const nextState = !liveFeedActive;
                            setLiveFeedActive(nextState);
                            showToast(
                              nextState ? "طھظژظ…ظ‘ طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„طھط؛ط°ظٹط© ط§ظ„ط­ظٹط© ظ„ظ„ط§ظ…طھط­ط§ظ†" : "طھظژظ…ظ‘ ط¥ظٹظ‚ط§ظپ ظˆط¶ط¹ ط§ظ„طھط؛ط°ظٹط© ط§ظ„ط­ظٹط© ظ„ظ„ط§ظ…طھط­ط§ظ†",
                              nextState ? "Live Feed Telemetry stream mode activated!" : "Live Feed Telemetry stream mode deactivated."
                            );
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-bold cursor-pointer transition select-none ${
                            liveFeedActive 
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow' 
                              : isLightMode ? 'bg-white text-slate-600 border-slate-300 hover:text-slate-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          title={lang === 'ar' ? 'طھط­ط¯ظٹط« طھظ„ظ‚ط§ط¦ظٹ ظ…ط³طھظ…ط± ط¹ط¨ط± ط§ظ„طھط؛ط°ظٹط© ط§ظ„ط­ظٹط©' : 'Real-time telemetry continuous database long-polling'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${liveFeedActive ? 'bg-emerald-400 animate-pulse' : (isLightMode ? 'bg-slate-300' : 'bg-slate-600')}`}></span>
                          <span>{lang === 'ar' ? 'طھط؛ط°ظٹط© ط­ظٹظ‘ط©' : 'Live Feed'}</span>
                        </button>

                        {/* Select Comparison Mode Toggle */}
                        <button
                          onClick={() => {
                            const nextState = !comparisonModeActive;
                            setComparisonModeActive(nextState);
                            if (nextState) {
                              setBatchSelectedIds([]);
                              showToast(
                                "طھظژظ…ظ‘ طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„ظ…ظ‚ط§ط±ظ†ط© - ط§ظ†ظ‚ط± ط¹ظ„ظ‰ ط·ط§ظ„ط¨ظٹظ† ظ„ظ…ظ‚ط§ط±ظ†طھظ‡ظ…ط§ ظ…ط¨ط§ط´ط±ط©",
                                "Comparison Mode enabled: Click two candidates in row to compare directly!"
                              );
                            } else {
                              setBatchSelectedIds([]);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-bold cursor-pointer transition select-none ${
                            comparisonModeActive 
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 ring-1 ring-purple-500/20 shadow' 
                              : isLightMode ? 'bg-white text-slate-600 border-slate-300 hover:text-slate-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          title={lang === 'ar' ? 'ط§ظ†ظ‚ط± ظ„طھط­ط¯ظٹط¯ ط·ط§ظ„ط¨ظٹظ† ط¯ظˆظ† ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط®ط§ظ†ط§طھ ظˆط§ظ„ط¨ط¯ط، ظپظˆط±ط§ظ‹' : 'Enables row click multi-select to focus comparisons instantly'}
                        >
                          <Layers className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'ظˆط¶ط¹ ط§ظ„ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط«ظ†ط§ط¦ظٹ' : 'Comparison Mode'}</span>
                        </button>

                        <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>{currentT.totalResultsCount} {filteredAnalysis.length} {lang === 'ar' ? 'ط·ظ„ط§ط¨' : 'students'}</span>
                      </div>

                      {/* Quick Selection Shortcuts */}
                      <div className={`flex items-center gap-2 flex-wrap pt-2.5 border-t mt-1 select-none ${isLightMode ? 'border-slate-200' : 'border-slate-800/60'}`}>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>{lang === 'ar' ? 'طھط­ط¯ظٹط¯ ط§ظ„ط¯ظپط¹ط§طھ:' : 'Batch Groups:'}</span>
                        <button
                          onClick={() => {
                            const targets = filteredAnalysis.filter(a => a.riskLevel === 'high').map(a => a.studentId);
                            setBatchSelectedIds(targets);
                            showToast(
                              `تم تحديد جميع الطلاب المعرضين لمخاطر مرتفعة (${targets.length})`,
                              `Selected all high risk candidates (${targets.length})`
                            );
                          }}
                          className={`text-[9.5px] px-2.5 py-1 rounded-lg cursor-pointer transition font-bold flex items-center gap-1 ${isLightMode ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-red-950/40 hover:bg-red-950/70 border border-red-500/20 hover:border-red-500/40 text-red-300'}`}
                        >
                          <AlertTriangle className="w-3 h-3" /> {lang === 'ar' ? 'مخاطر مرتفعة' : 'All High-Risk'}
                        </button>
                        <button
                          onClick={() => {
                            const targets = filteredAnalysis.filter(a => a.riskLevel === 'medium').map(a => a.studentId);
                            setBatchSelectedIds(targets);
                            showToast(
                              `تم تحديد كافة الطلاب ذوي مستوى المخاطرة المتوسط (${targets.length})`,
                              `Selected all medium risk candidates (${targets.length})`
                            );
                          }}
                          className={`text-[9.5px] px-2.5 py-1 rounded-lg cursor-pointer transition font-bold flex items-center gap-1 ${isLightMode ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' : 'bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/20 hover:border-amber-500/40 text-amber-300'}`}
                        >
                          <AlertCircle className="w-3 h-3" /> {lang === 'ar' ? 'مخاطر متوسطة' : 'All Med-Risk'}
                        </button>
                        <button
                          onClick={() => {
                            const targets = filteredAnalysis.filter(a => a.riskLevel === 'safe' || a.riskLevel === 'low').map(a => a.studentId);
                            setBatchSelectedIds(targets);
                            showToast(
                              `تم تحديد كافة الطلاب الآمنين والمتميزين بالنزاهة (${targets.length})`,
                              `Selected all secure candidates (${targets.length})`
                            );
                          }}
                          className={`text-[9.5px] px-2.5 py-1 rounded-lg cursor-pointer transition font-bold flex items-center gap-1 ${isLightMode ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300'}`}
                        >
                          <CheckCircle2 className="w-3 h-3" /> {lang === 'ar' ? 'آمن ونقي' : 'All Secure'}
                        </button>
                      </div>
                    </div>

                    {/* Batch Actions Panel */}
                    {batchSelectedIds.length > 0 && (
                      <div className={`px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-center gap-3 ${isLightMode ? 'bg-blue-50 border-slate-200' : 'bg-blue-950/20 border-slate-800'}`}>
                        <div className={`flex items-center gap-2 text-xs font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          <span>
                            {batchSelectedIds.length} {currentT.batchSelectedCount}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBatchVerdictChange('approved')}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1 border ${isLightMode ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {currentT.batchActionApprove}
                          </button>
                          <button
                            onClick={() => handleBatchVerdictChange('retake_requested')}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1 border ${isLightMode ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            {currentT.batchActionRetake}
                          </button>
                          <button
                            onClick={() => handleBatchVerdictChange('investigation')}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1 border animate-pulse ${isLightMode ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'}`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            {currentT.batchActionInvestigate}
                          </button>
                          <button
                            onClick={downloadSISAuditJSONForSelection}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1 border shrink-0 ${isLightMode ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/30'}`}
                            title={lang === 'ar' ? 'تصدير بيانات الطلاب المحددين مباشرة لملف نظام SIS الأكاديمي' : 'Export selected student files to SIS JSON format'}
                          >
                            <Database className="w-3.5 h-3.5 text-purple-400" />
                            <span>{lang === 'ar' ? 'تصدير لـ SIS' : 'SIS Export'}</span>
                          </button>
                          <button
                            onClick={handleBatchExportJSON}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1 border shrink-0 ${isLightMode ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30'}`}
                            title={lang === 'ar' ? 'تجميع وتصدير ملف دفعات الموحد للطلاب المحددين مباشرة بصيغة JSON' : 'Export unified telemetry cohort report directly in JSON format'}
                          >
                            <Code className="w-3.5 h-3.5 text-blue-400" />
                            <span>{lang === 'ar' ? 'تصدير دفعة JSON' : 'Batch Export JSON'}</span>
                          </button>
                          <button
                            onClick={downloadBulkForensicPDF}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer flex items-center gap-1 border shrink-0 ${isLightMode ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30'}`}
                            title={lang === 'ar' ? 'توليد وتصدير تقرير جنائي موحد متعدد الصفحات للطلاب المحددين' : 'Generate and export a unified paginated PDF forensic report for selected candidates'}
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{lang === 'ar' ? 'تقرير جنائي موحد' : 'Bulk Forensic Export'}</span>
                          </button>
                          {batchSelectedIds.length >= 2 && (
                            <button
                              onClick={() => setIsComparisonModalOpen(true)}
                              className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/30 text-[10px] font-extrabold px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 shrink-0 animate-pulse"
                              title={lang === 'ar' ? 'مقارنة الطلاب المحددين جنباً إلى جنب' : 'Compare selected candidates side-by-side'}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 text-purple-100" />
                              <span>{lang === 'ar' ? 'مقارنة الطلاب' : 'Compare Students'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setBatchSelectedIds([])}
                            className={`text-[10px] px-2 py-1.5 transition cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-500 hover:text-slate-350'}`}
                          >
                            {lang === 'ar' ? 'ط¥ظ„ط؛ط§ط،' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`hidden md:block overflow-x-auto relative w-full border rounded-xl ${isLightMode ? 'border-slate-200' : 'border-slate-800/80'}`}>
                      <table className={`w-full text-xs min-w-[900px] ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                        <thead>
                          <tr className={`border-b font-bold ${isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                            <th className={`p-3 w-10 text-center sticky ${lang === 'ar' ? 'right-0' : 'left-0'} ${isLightMode ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-slate-400'} z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]`}>
                              <input
                                type="checkbox"
                                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer rounded"
                                checked={filteredAnalysis.length > 0 && batchSelectedIds.length === filteredAnalysis.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBatchSelectedIds(filteredAnalysis.map(a => a.studentId));
                                  } else {
                                    setBatchSelectedIds([]);
                                  }
                                }}
                              />
                            </th>
                            <th className={`p-3 sticky ${lang === 'ar' ? 'right-10 border-l' : 'left-10 border-r'} ${isLightMode ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-800 bg-slate-950 text-slate-400'} z-20 min-w-[200px] shadow-[3px_0_6px_-3px_rgba(0,0,0,0.15)]`}>
                              {currentT.tableColCandidate}
                            </th>
                            <th className="p-3">{currentT.tableColExam}</th>
                            <th className="p-3 text-center">{currentT.tableColOutcome}</th>
                            <th className="p-3 text-center">{currentT.tableColBehavior}</th>
                            <th className="p-3 text-center">{currentT.tableColRisk}</th>
                            <th className="p-3 text-center">{lang === 'ar' ? 'ط£ظپط¹ط§ظ„' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-gray-800/60'}`}>
                          {filteredAnalysis.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-gray-500">
                                {currentT.noResultsMessage}
                              </td>
                            </tr>
                          ) : (
                            paginatedAnalysis.map(an => {
                              const detail = submissions.find(s => s.studentId === an.studentId);
                              const isSelected = selectedStudentId === an.studentId;
                              const isAboveThreshold = an.riskScore >= riskThreshold;
                              const rippleClass = isAboveThreshold ? (lang === 'ar' ? 'animate-row-ripple-rtl' : 'animate-row-ripple') : '';
                              const avatarParams = getStudentAvatarParams(an.studentName);
 
                              return (
                                <tr
                                  key={an.studentId}
                                  onClick={() => {
                                    if (comparisonModeActive) {
                                      if (batchSelectedIds.includes(an.studentId)) {
                                        setBatchSelectedIds(prev => prev.filter(id => id !== an.studentId));
                                      } else {
                                        if (batchSelectedIds.length < 2) {
                                          const next = [...batchSelectedIds, an.studentId];
                                          setBatchSelectedIds(next);
                                          if (next.length === 2) {
                                            showToast(
                                              "طھظ… طھط­ظ…ظٹظ„ ط§ظ„ظ…ط±ط´ط­ظٹظ† ظ„ظ„ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط³ظ„ظˆظƒظٹط© ط§ظ„ظپظˆط±ظٹط©",
                                              "Loaded both candidates for live forensic collusion audit!"
                                            );
                                          }
                                        } else {
                                          setBatchSelectedIds([batchSelectedIds[1], an.studentId]);
                                        }
                                      }
                                    } else {
                                      setSelectedStudentId(an.studentId);
                                    }
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      studentId: an.studentId
                                    });
                                  }}
                                  className={`cursor-pointer transition-all duration-250 ${rippleClass} ${
                                    isSelected 
                                      ? (isLightMode ? 'bg-blue-50 border-indigo-300' : 'bg-blue-600/10 border-indigo-500') + ' ' + (lang === 'ar' ? 'border-r-4' : 'border-l-4')
                                      : comparisonModeActive && batchSelectedIds.includes(an.studentId)
                                        ? (isLightMode ? 'bg-purple-50 border-purple-300' : 'bg-purple-600/15 border-purple-500') + ' ' + (lang === 'ar' ? 'border-r-4' : 'border-l-4')
                                        : (isLightMode ? 'hover:bg-slate-50' : 'hover:bg-slate-850/40')
                                  }`}
                                >
                                  <td className={`p-3 w-10 text-center sticky ${lang === 'ar' ? 'right-0' : 'left-0'} ${
                                    isSelected 
                                      ? (isLightMode ? 'bg-blue-50/80' : 'bg-slate-850') 
                                      : comparisonModeActive && batchSelectedIds.includes(an.studentId)
                                        ? (isLightMode ? 'bg-purple-50/80' : 'bg-purple-900/60')
                                        : (isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-slate-900 hover:bg-slate-850/40')
                                  } z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]`} onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      className="accent-blue-500 w-3.5 h-3.5 cursor-pointer rounded"
                                      checked={batchSelectedIds.includes(an.studentId)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setBatchSelectedIds(prev => [...prev, an.studentId]);
                                        } else {
                                          setBatchSelectedIds(prev => prev.filter(id => id !== an.studentId));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className={`p-3 sticky ${lang === 'ar' ? 'right-10 border-l' : 'left-10 border-r'} ${isLightMode ? 'border-slate-200' : 'border-slate-800'} ${
                                    isSelected 
                                      ? (isLightMode ? 'bg-blue-50/80 text-slate-800' : 'bg-slate-850') 
                                      : comparisonModeActive && batchSelectedIds.includes(an.studentId)
                                        ? (isLightMode ? 'bg-purple-50/80' : 'bg-purple-900/60')
                                        : (isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-slate-900 hover:bg-slate-850/40')
                                  } z-10 shadow-[3px_0_6px_-3px_rgba(0,0,0,0.15)]`}>
                                    <div className="flex items-start gap-3">
                                      {/* Integrity Profile Photo fetcher from Moodle API */}
                                      <IntegrityProfile studentId={an.studentId} studentName={an.studentName} sizeClass="w-8 h-8" lang={lang} isLightMode={isLightMode} />
                                      
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`font-extrabold text-[12.5px] ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{an.studentName}</span>
                          {an.verdict === 'approved' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${isLightMode ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                              {currentT.approvedBadge}
                            </span>
                          )}
                          {an.verdict === 'retake_requested' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${isLightMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                              {currentT.retakeBadge}
                            </span>
                          )}
                          {an.verdict === 'investigation' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold animate-pulse ${isLightMode ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              {currentT.investigationBadge}
                            </span>
                          )}
                            {(aggressivePatternStudentIds.includes(an.studentId) || an.aggressivePattern) ? (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-extrabold shrink-0 flex items-center gap-1 animate-pulse ${isLightMode ? 'bg-red-100 text-red-700 border-red-300' : 'bg-red-500/20 text-red-400 border-red-500/30'}`} title={lang === 'ar' ? 'ظ†ظ…ط· ظ‡ط¬ظˆظ…ظٹ ط´ط±ط³ ظ…طھظƒط±ط± (طھط¨ط¯ظٹظ„ط§طھ ظ…طھط³ط§ط±ط¹ط© ظˆظ„طµظ‚ ظ…ظƒط«ظپ)' : 'Repetitive tab-switch-clipboard-paste sequence detected (Aggressive)'}>
                                <Flame className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'ظ†ظ…ط· ط³ظ„ظˆظƒظٹ ط¹ط¯ط§ط¦ظٹ' : 'Aggressive Pattern'}</span>
                              </span>
                                            ) : (patternAnomalyStudentIds.includes(an.studentId) || an.patternAnomaly) && (
                                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 flex items-center gap-1 animate-pulse ${isLightMode ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-purple-500/15 text-purple-300 border-purple-500/25'}`} title={lang === 'ar' ? 'ظ†ظ…ط· ط³ظ„ظˆظƒظٹ ظ…طھظƒط±ط± (طھط¨ط¯ظٹظ„ ظˆظ„طµظ‚)' : 'Repeating tab-switch-paste pattern anomaly detected'}>
                                                <Layers className="w-3 h-3" />
                                                <span>{lang === 'ar' ? 'ظ†ظ…ط· ظ…ط´ط¨ظˆظ‡ ظ…طھظƒط±ط±' : 'Pattern Anomaly'}</span>
                                              </span>
                                            )}
                                            {an.macroUsage && (
                                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 flex items-center gap-1 animate-pulse ${isLightMode ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-500/15 text-amber-500 border-amber-500/25'}`} title={lang === 'ar' ? 'ظ†ظ‚ط±ط§طھ ظ…طھط³ط§ط±ط¹ط© ظ„ظ„ط؛ط§ظٹط© ظˆط§ط³طھط¹ظ…ط§ظ„ ظ…ط±ظٹط¨ ظ„ظ„ظ…ط­ط§ظƒط§ط© ظˆط§ظ„ظ€ Macro (ط§ظ„ظ…ط§ظƒط±ظˆ)' : 'Extremely rapid click sequences indicating automated/macro usage'}>
                                                <Zap className="w-3 h-3" />
                                                <span>{lang === 'ar' ? 'ط§ط³طھط®ط¯ط§ظ… ظ…ط§ظƒط±ظˆ' : 'Macro Usage'}</span>
                                              </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 flex-wrap" dir="ltr">
                                          <span className={`px-1 rounded ${isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-950 text-slate-300'}`}>{an.studentId}</span>
                                          <span>â€¢</span>
                                          <span className="text-gray-400" title="IP Address">{detail?.ipAddresses.join(', ')}</span>
                                        </div>
                                        {an.riskLevel !== 'safe' && (
                                          <div className="mt-1 flex items-center gap-1 flex-wrap">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                                              an.suggestedActionSource === 'gemini' ? (isLightMode ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm') :
                                              an.ipAddressConflict ? (isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/10 text-red-400 border border-red-500/15') :
                                              detail && detail.tabSwitchesCount > 8 ? (isLightMode ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15') :
                                              detail && detail.copyCount + detail.pasteCount > 5 ? (isLightMode ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-pink-500/10 text-pink-400 border border-pink-500/15') :
                                              detail && detail.outOfBoundsCount > 6 ? (isLightMode ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-orange-500/10 text-orange-400 border border-orange-500/15') :
                                              an.timeAnomaly ? (isLightMode ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-purple-500/10 text-purple-400 border border-purple-500/15') :
                                              (isLightMode ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-500/10 text-blue-400 border border-blue-500/15')
                                            }`}>
                                              <span className="text-[9px] text-slate-450 font-semibold flex items-center gap-1">
                                                {an.suggestedActionSource === 'gemini' ? (
                                                  <>
                                                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                                                    <span className={`font-extrabold tracking-wider ${isLightMode ? 'text-purple-600' : 'text-purple-300'}`}>{lang === 'ar' ? 'طھظˆطµظٹط© ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ:' : 'AI SUGGESTION:'}</span>
                                                  </>
                                                ) : (
                                                  <span>{lang === 'ar' ? 'ط§ظ„ط¥ط¬ط±ط§ط، ط§ظ„ظ…ظ‚طھط±ط­:' : 'Suggested Action:'}</span>
                                                )}
                                              </span>
                                              <span className="font-bold">
                                                {lang === 'ar' ? (
                                                  an.suggestedActionAr || an.suggestedAction || (
                                                    an.ipAddressConflict ? 'طھط­ظ‚ظ‚ ظ…ظ† ط¹ظ†ظˆط§ظ† IP ظٹط¯ظˆظٹط§ظ‹' :
                                                    detail && detail.tabSwitchesCount > 8 ? 'ظ…ط±ط§ط¬ط¹ط© طھط³ط¬ظٹظ„ ط§ظ„ط´ط§ط´ط© ط¥ظ† ظˆط¬ط¯' :
                                                    detail && detail.copyCount + detail.pasteCount > 5 ? 'ظپط­طµ ظ…ط­طھظˆظٹط§طھ ط­ط§ظپط¸ط© ط§ظ„ظ†ط³ط®' :
                                                    detail && detail.outOfBoundsCount > 6 ? 'ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒط§ظ…ظٹط±ط§ ظˆط§ظ„ط´ط§ط´ط© ط§ظ„ط«ط§ظ†ظˆظٹط©' :
                                                    an.timeAnomaly ? 'ط¥ط¬ط±ط§ط، ظ…ظ‚ط§ط¨ظ„ط© ط´ظپظ‡ظٹط© ظ„ظ„طھط­ظ‚ظ‚' :
                                                    'طھط¯ظ‚ظٹظ‚ ظˆظ…ط·ط§ط¨ظ‚ط© ط³ط¬ظ„ط§طھ ط§ظ„ط´ط¨ظƒط©'
                                                  )
                                                ) : (
                                                  an.suggestedActionEn || an.suggestedAction || (
                                                    an.ipAddressConflict ? 'Verify IP address manually' :
                                                    detail && detail.tabSwitchesCount > 8 ? 'Review screen recording if available' :
                                                    detail && detail.copyCount + detail.pasteCount > 5 ? 'Inspect clipboard payload history' :
                                                    detail && detail.outOfBoundsCount > 6 ? 'Verify secondary monitor or webcam' :
                                                    an.timeAnomaly ? 'Conduct live oral exam review' :
                                                    'Cross-check session network logs'
                                                  )
                                                )}
                                              </span>
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className={`font-medium max-w-[200px] truncate ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>{an.examName}</div>
                                    <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                      <span>{currentT.difficultyLabel}</span>
                                      <span className={`font-bold px-1.5 rounded-full ${detail?.examDifficulty === 'hard' ? (isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-900/30 text-red-200') : detail?.examDifficulty === 'medium' ? (isLightMode ? 'bg-orange-100 text-orange-700' : 'bg-orange-900/30 text-orange-200') : (isLightMode ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/30 text-emerald-200')}`}>
                                        {detail?.examDifficulty === 'hard' ? currentT.difficultyHard : detail?.examDifficulty === 'medium' ? currentT.difficultyMedium : currentT.difficultyEasy}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className={`font-mono font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{detail?.durationMinutes} {currentT.durationSuffix}</div>
                                    <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>{currentT.scoreLabel} {detail?.scorePercent}%</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className={`font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                                      {detail?.copyCount} {currentT.behaviorCopys} {detail?.tabSwitchesCount} {currentT.behaviorSwitches}
                                    </div>
                                    <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-500'}`}>{currentT.behaviorOutOfBounds} ({detail?.outOfBoundsCount})</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm ${an.riskLevel === 'high' ? (isLightMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-red-500/15 text-red-400 border border-red-500/20') : an.riskLevel === 'medium' ? (isLightMode ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-orange-500/15 text-orange-400 border border-orange-500/20') : an.riskLevel === 'low' ? (isLightMode ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20') : (isLightMode ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20')}`}>
                                        {an.riskLevel === 'high' ? currentT.riskLevelHigh : an.riskLevel === 'medium' ? currentT.riskLevelMedium : an.riskLevel === 'low' ? currentT.riskLevelLow : currentT.riskLevelSafe}
                                      </span>
                                      <span className={`text-[10px] font-mono mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>{an.riskScore}% {currentT.studentPoints}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setSelectedSubDashboardId(an.studentId);
                                        showToast(
                                          `ًں“ٹ طھظژظ…ظ‘ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظ‚ظٹط§ط¯ط© ط§ظ„طھظپطµظٹظ„ظٹط© ظ„ظ„ط·ط§ظ„ط¨: ${an.studentName}`,
                                          `ًں“ٹ Loaded dynamic behavior dashboard for student: ${an.studentName}`
                                        );
                                      }}
                                      className={`${isLightMode ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-400' : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-600 hover:text-white border-[#818cf8]/25 hover:border-indigo-500'} text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-1.5 mx-auto border`}
                                    >
                                      <span>ًں“ٹ</span>
                                      <span>{lang === 'ar' ? 'ط§ظ„ظ„ظˆط­ط© ط§ظ„طھظپطµظٹظ„ظٹط©' : 'Dashboard'}</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Responsive Stack Layout (Visible on small screens) */}
                    <div className="block md:hidden space-y-4">
                      {filteredAnalysis.length === 0 ? (
                        <div className={`rounded-xl p-8 text-center ${isLightMode ? 'bg-white border border-slate-200 text-slate-400' : 'bg-slate-900 border border-slate-800 text-gray-500'}`}>
                          {currentT.noResultsMessage}
                        </div>
                      ) : (
                        paginatedAnalysis.map(an => {
                          const detail = submissions.find(s => s.studentId === an.studentId);
                          const isSelected = selectedStudentId === an.studentId;
                          const isAboveThreshold = an.riskScore >= riskThreshold;
                          const avatarParams = getStudentAvatarParams(an.studentName);
 
                          return (
                            <div 
                              key={`mobile-stack-${an.studentId}`}
                              className={`rounded-xl p-4 space-y-3 shadow-md relative overflow-hidden transition-all duration-250 ${
                                isLightMode
                                  ? (isSelected ? 'bg-white ring-2 ring-blue-300 border border-blue-200' : 'bg-white border border-slate-200')
                                  : (isSelected ? 'bg-slate-850/60 ring-2 ring-blue-500 border border-slate-800' : 'bg-slate-900 border border-slate-800')
                              }`}
                              onClick={() => setSelectedStudentId(an.studentId)}
                            >
                              {/* Header part with avatar and indicator */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarParams.colorClass} flex items-center justify-center font-bold text-xs shrink-0`}>
                                    {avatarParams.initials}
                                  </div>
                                  <div>
                                    <h4 className={`text-xs font-black ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{an.studentName}</h4>
                                    <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-500 bg-slate-100' : 'text-slate-500 bg-slate-950'} px-1 py-0.5 rounded`}>{an.studentId}</span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  an.riskLevel === 'high' ? (isLightMode ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-red-500/20 text-red-400 border border-red-500/20') : 
                                  an.riskLevel === 'medium' ? (isLightMode ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-orange-500/20 text-orange-400 border border-orange-500/20') : 
                                  (isLightMode ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20')
                                }`}>
                                  {an.riskScore}% {lang === 'ar' ? 'ظ…ط®ط§ط·ط±ط©' : 'Risk'}
                                </span>
                              </div>

                              {/* Technical Details Grid */}
                                <div className={`grid grid-cols-2 gap-2 text-[10.5px] border-y ${isLightMode ? 'border-slate-200' : 'border-slate-800/80'} py-2.5`}>
                                  <div>
                                    <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-500'} block uppercase font-mono text-[9px]`}>{lang === 'ar' ? 'ط§ظ„ط§ط®طھط¨ط§ط±:' : 'Exam:'}</span>
                                    <span className={`font-medium truncate max-w-[120px] block ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>{an.examName}</span>
                                  </div>
                                  <div>
                                    <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-500'} block uppercase font-mono text-[9px]`}>{lang === 'ar' ? 'ط§ظ„ط¯ط±ط¬ط© ظˆط§ظ„ط²ظ…ظ†:' : 'Score & Time:'}</span>
                                    <span className={`font-mono font-bold block ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>{detail?.scorePercent}% â€¢ {detail?.durationMinutes}m</span>
                                  </div>
                                  <div>
                                    <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-500'} block uppercase font-mono text-[9px]`}>{lang === 'ar' ? 'ط³ظ„ظˆظƒظٹط§طھ ط­ط±ط¬ط©:' : 'Critical Behaviors:'}</span>
                                    <span className={`font-mono flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                                      <Copy className="w-3 h-3 text-cyan-400" />{detail?.copyCount}
                                      <Layers className="w-3 h-3 text-amber-400" />{detail?.tabSwitchesCount}
                                      <AlertTriangle className="w-3 h-3 text-rose-400" />{detail?.outOfBoundsCount}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-500'} block uppercase font-mono text-[9px]`}>{lang === 'ar' ? 'ط§ظ„ط¹ظ†ظˆط§ظ† ظˆط§ظ„ط¨ظٹط§ظ†ط§طھ:' : 'IP Address:'}</span>
                                    <span className={`font-mono block truncate max-w-[120px] ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{detail?.ipAddresses.join(', ')}</span>
                                  </div>
                                </div>

                              {/* Suggested Actions Badge */}
                              {an.riskLevel !== 'safe' && (
                                <div className={`p-2 rounded-lg border text-[10.5px] space-y-1 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-850'}`}>
                                  <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-500'} block uppercase font-mono text-[8.5px] font-black`}>
                                    {an.suggestedActionSource === 'gemini' ? 'AI Suggestion' : 'Suggested Action'}
                                  </span>
                                  <span className={`font-bold ${isLightMode ? 'text-indigo-600' : 'text-indigo-300'}`}>
                                    {lang === 'ar' ? (an.suggestedActionAr || 'ظ…ط±ط§ط¬ط¹ط© ظٹط¯ظˆظٹط© ظ„ظ„ط­ط¯ط«') : (an.suggestedActionEn || 'Verify manually')}
                                  </span>
                                </div>
                              )}

                              {/* Interactive Actions Tray */}
                              <div className="flex gap-2 pt-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedSubDashboardId(an.studentId)}
                                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 border ${isLightMode ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-300' : 'bg-[#4f46e5]/10 hover:bg-[#4f46e5] text-indigo-300 hover:text-white border-indigo-500/25'}`}
                                >
                                  <Activity className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'ط§ظ„ظ„ظˆط­ط© ط§ظ„طھظپطµظٹظ„ظٹط©' : 'Dashboard'}</span>
                                </button>
                                <button
                                  onClick={() => setSelectedStudentId(isSelected ? null : an.studentId)}
                                  className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg text-center transition cursor-pointer border flex items-center justify-center gap-1.5 ${isLightMode ? 'bg-slate-100 text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-200' : 'bg-slate-850 text-slate-300 hover:text-white border-slate-800'}`}
                                >
                                  {isSelected ? (lang === 'ar' ? 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„طھظپط§طµظٹظ„' : 'Close Profile') : (lang === 'ar' ? 'ط¹ط±ط¶ ط§ظ„ط³ط¬ظ„ط§طھ' : 'View Records')}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Roster Pagination Controls */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between flex-wrap gap-3 px-1 py-3 text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span className="font-medium">
                        {lang === 'ar'
                          ? `عرض ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, filteredAnalysis.length)} من ${filteredAnalysis.length}`
                          : `Showing ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, filteredAnalysis.length)} of ${filteredAnalysis.length}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${isLightMode ? 'hover:bg-slate-200' : 'hover:bg-slate-800'}`}
                        >
                          {lang === 'ar' ? 'السابق' : 'Prev'}
                        </button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pageIndex: number;
                          if (totalPages <= 7) {
                            pageIndex = i;
                          } else if (currentPage < 3) {
                            pageIndex = i;
                          } else if (currentPage > totalPages - 4) {
                            pageIndex = totalPages - 7 + i;
                          } else {
                            pageIndex = currentPage - 3 + i;
                          }
                          return (
                            <button
                              key={pageIndex}
                              onClick={() => setCurrentPage(pageIndex)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer min-w-[28px] text-center ${
                                currentPage === pageIndex
                                  ? (isLightMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm')
                                  : (isLightMode ? 'hover:bg-slate-200' : 'hover:bg-slate-800')
                              }`}
                            >
                              {pageIndex + 1}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage >= totalPages - 1}
                          className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${isLightMode ? 'hover:bg-slate-200' : 'hover:bg-slate-800'}`}
                        >
                          {lang === 'ar' ? 'التالي' : 'Next'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dual-Candidate Behavior Comparison Tool (Collusion Detection) */}
                  <div className={`rounded-xl p-5 shadow-xl space-y-4 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className={`flex items-center gap-2 border-b pb-3 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                      <Layers className="w-5 h-5 text-purple-400 animate-pulse" />
                      <div>
                        <h3 className={`text-sm font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{currentT.compareTitle}</h3>
                        <p className={`text-[11px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{currentT.compareSelectHint}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Selection A */}
                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold block ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{lang === 'ar' ? 'ط§ظ„ط·ط§ظ„ط¨ ط§ظ„ظ…ظ‚ط§ط±ظ† (ط£)' : 'Candidate (A)'}</label>
                        <select
                          value={compareStudentIdA || ''}
                          onChange={(e) => setCompareStudentIdA(e.target.value || null)}
                          className={`w-full text-xs p-2 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer ${isLightMode ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-950 border border-slate-800 text-white'}`}
                        >
                          <option value="">{lang === 'ar' ? '-- ط§ط®طھط± ط·ط§ظ„ط¨ --' : '-- Choose Candidate --'}</option>
                          {submissions.map(sub => (
                            <option key={sub.studentId} value={sub.studentId} disabled={sub.studentId === compareStudentIdB}>
                              {sub.studentName} ({sub.studentId})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selection B */}
                      <div className="space-y-2">
                        <label className={`text-[10px] font-bold block ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{lang === 'ar' ? 'ط§ظ„ط·ط§ظ„ط¨ ط§ظ„ظ…ظ‚ط§ط±ظ† (ط¨)' : 'Candidate (B)'}</label>
                        <select
                          value={compareStudentIdB || ''}
                          onChange={(e) => setCompareStudentIdB(e.target.value || null)}
                          className={`w-full text-xs p-2 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer ${isLightMode ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-950 border border-slate-800 text-white'}`}
                        >
                          <option value="">{lang === 'ar' ? '-- ط§ط®طھط± ط·ط§ظ„ط¨ --' : '-- Choose Candidate --'}</option>
                          {submissions.map(sub => (
                            <option key={sub.studentId} value={sub.studentId} disabled={sub.studentId === compareStudentIdA}>
                              {sub.studentName} ({sub.studentId})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Compare Display */}
                    {(() => {
                      const subA = submissions.find(s => s.studentId === compareStudentIdA);
                      const subB = submissions.find(s => s.studentId === compareStudentIdB);
                      const anA = analyses.find(a => a.studentId === compareStudentIdA);
                      const anB = analyses.find(b => b.studentId === compareStudentIdB);

                      if (!subA || !subB || !anA || !anB) {
                        return (
                          <div className={`border border-dashed p-4 text-center rounded-lg text-xs ${isLightMode ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                            {lang === 'ar' 
                              ? 'ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ط·ط§ظ„ط¨ظٹظ† ط£ط¹ظ„ط§ظ‡ ظ„ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ‚ظٹط§ط³ط§طھ ظˆطھط­ظ„ظٹظ„ ط§ط­طھظ…ط§ظ„ظٹط© طھظˆط§ط·ط¤ ط§ظ„ط¬ظ„ط³ط©.' 
                              : 'Select two candidates above to overlay behavioral telemetry and evaluate collusion risks.'}
                          </div>
                        );
                      }

                      const sharingIP = subA.ipAddresses.some(ip => subB.ipAddresses.includes(ip));
                      const chartData = getCompareChartData(subA, subB, anA, anB);

                      return (
                        <div className="space-y-4 pt-2">
                          {/* IP Collusion Alert */}
                          {sharingIP && (
                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-2 text-xs text-red-400 animate-pulse">
                              <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
                              <span>
                                {lang === 'ar' 
                                  ? 'طھظ†ط¨ظٹظ‡ طھظˆط§ط·ط¤ ط­ط±ط¬: ظٹطھط´ط§ط±ظƒ ط§ظ„ط·ط§ظ„ط¨ط§ظ† ظپظٹ ظ†ظپط³ ط¹ظ†ظˆط§ظ† ط§ظ„ظ€ IP ط§ظ„ظپط¹ظ„ظٹ ظ„ظ„ط¬ظ„ط³ط©! ظ…ط¤ط´ط± ظ‚ط·ط¹ظٹ ط¹ظ„ظ‰ ط§ظ„ط®ظˆط§ط·ط± ط§ظ„ظ…ط´طھط±ظƒط©.' 
                                  : 'CRITICAL COLLUSION ADVISORY: Candidates share identical network credentials (same active IP)! Potential unauthorized localized assistance.'}
                              </span>
                            </div>
                          )}

                          {/* Dual Recharts Bar Chart */}
                          <div className={`rounded-lg p-3 space-y-2 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950 border border-slate-800'}`}>
                            <span className={`text-[10px] uppercase font-mono tracking-widest block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {lang === 'ar' ? 'ظ…ظ‚ط§ط±ظ†ط© ط¨ظٹط§ظ†ظٹط© ظ…طھط²ط§ظ…ظ†ط© ظ„ظ„ط³ظ„ظˆظƒظٹط§طھ ظˆط§ظ„ط£ط¯ط§ط،' : 'Dual Candidate Behavioral Comparison'}
                            </span>
                            <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                                  <YAxis stroke="#64748b" fontSize={9} />
                                  <RechartsTooltip contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#0f172a', borderColor: isLightMode ? '#cbd5e1' : '#334155', color: isLightMode ? '#0f172a' : '#f8fafc', fontSize: '11px' }} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Bar name={subA.studentName} dataKey={subA.studentName} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                  <Bar name={subB.studentName} dataKey={subB.studentName} fill="#a855f7" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Side-by-side comparative metadata table */}
                          <div className={`rounded-lg overflow-hidden text-[11px] font-mono divide-y ${isLightMode ? 'border border-slate-200 divide-slate-200' : 'border border-slate-800 divide-slate-800'}`}>
                            <div className={`grid grid-cols-3 font-bold divide-x ${isLightMode ? 'bg-slate-50 divide-slate-200' : 'bg-slate-950 divide-slate-800'}`}>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{currentT.compareMetricLabel}</div>
                              <div className="px-3 py-2 text-blue-500 truncate">{subA.studentName}</div>
                              <div className="px-3 py-2 text-purple-500 truncate">{subB.studentName}</div>
                            </div>

                            {/* Risk score */}
                            <div className={`grid grid-cols-3 divide-x ${isLightMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-600 bg-slate-50/50' : 'text-slate-300 bg-slate-950/20'}`}>{lang === 'ar' ? 'ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ' : 'Overall Risk Score'}</div>
                              <div className={`px-3 py-2 font-bold ${isLightMode ? (anA.riskScore >= 60 ? 'text-red-600' : 'text-emerald-600') : (anA.riskScore >= 60 ? 'text-red-400' : 'text-emerald-400')}`}>{anA.riskScore}%</div>
                              <div className={`px-3 py-2 font-bold ${isLightMode ? (anB.riskScore >= 60 ? 'text-red-600' : 'text-emerald-600') : (anB.riskScore >= 60 ? 'text-red-400' : 'text-emerald-400')}`}>{anB.riskScore}%</div>
                            </div>

                            {/* Verdict */}
                            <div className={`grid grid-cols-3 divide-x ${isLightMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-600 bg-slate-50/50' : 'text-slate-300 bg-slate-950/20'}`}>{lang === 'ar' ? 'ط§ظ„ظ‚ط±ط§ط± ط§ظ„ط¯ط±ط§ط³ظٹ' : 'Academic Verdict'}</div>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-700' : ''}`}>{anA.verdict}</div>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-700' : ''}`}>{anB.verdict}</div>
                            </div>

                            {/* Tab Switches */}
                            <div className={`grid grid-cols-3 divide-x ${isLightMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-600 bg-slate-50/50' : 'text-slate-300 bg-slate-950/20'}`}>{lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Tab Switches Count'}</div>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-700' : ''}`}>{subA.tabSwitchesCount}</div>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-700' : ''}`}>{subB.tabSwitchesCount}</div>
                            </div>

                            {/* Clipboard activity */}
                            <div className={`grid grid-cols-3 divide-x ${isLightMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-600 bg-slate-50/50' : 'text-slate-300 bg-slate-950/20'}`}>{lang === 'ar' ? 'ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط­ط§ظپط¸ط© (ظ†ط³ط®/ظ„طµظ‚)' : 'Clipboard Action Count'}</div>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-700' : ''}`}>{subA.copyCount} ({lang === 'ar' ? 'ظ†ط³ط®' : 'copy'}) / {subA.pasteCount} ({lang === 'ar' ? 'ظ„طµظ‚' : 'paste'})</div>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-700' : ''}`}>{subB.copyCount} ({lang === 'ar' ? 'copy' : 'ظ†ط³ط®'}) / {subB.pasteCount} ({lang === 'ar' ? 'paste' : 'ظ„طµظ‚'})</div>
                            </div>

                            {/* IP addresses */}
                            <div className={`grid grid-cols-3 divide-x ${isLightMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                              <div className={`px-3 py-2 ${isLightMode ? 'text-slate-600 bg-slate-50/50' : 'text-slate-300 bg-slate-950/20'}`}>{lang === 'ar' ? 'ط¹ظ†ط§ظˆظٹظ† ط§ظ„ظ€ IP ط§ظ„ظ…ط±طµظˆط¯ط©' : 'Active IP Addresses'}</div>
                              <div className={`px-3 py-2 text-[10px] break-all ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>{subA.ipAddresses.join(', ')}</div>
                              <div className={`px-3 py-2 text-[10px] break-all ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>{subB.ipAddresses.join(', ')}</div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setCompareStudentIdA(null);
                                setCompareStudentIdB(null);
                              }}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition border ${isLightMode ? 'text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border-slate-300' : 'text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border-slate-800'}`}
                            >
                              {currentT.compareClearBtn}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Sub-Interactive Screen: Forensic Incident Inspector (Single Student Audit) */}
                  {selectedStudent && selectedAnalysis && (
                    <div id="forensic-inspector" className={`rounded-xl p-5 shadow-xl print-section ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
                      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-4 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <Fingerprint className="w-5 h-5 text-blue-400 animate-pulse shrink-0" />
                            <IntegrityProfile studentId={selectedStudent.studentId} studentName={selectedStudent.studentName} sizeClass="w-9 h-9 border border-blue-500/30" lang={lang} isLightMode={isLightMode} />
                            <h3 className={`text-sm md:text-md font-extrabold font-sans ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{currentT.detailedDiagnosticsTitle} {selectedStudent.studentName}</h3>
                          </div>
                          <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{currentT.detailedDiagnosticsDesc}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={downloadForensicReport}
                            disabled={pdfGenerating}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 transition duration-150 cursor-pointer shadow-md select-none ${pdfGenerating ? 'animate-pulse' : ''}`}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>{pdfGenerating ? (lang === 'ar' ? 'ط¬ط§ط±ظٹ ط§ظ„طھط­ط¶ظٹط±...' : 'Compiling PDF...') : currentT.downloadReportBtn}</span>
                          </button>

                          <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition shadow-md select-none no-print"
                          >
                            <Printer className="w-3.5 h-3.5 shrink-0" />
                            <span>{lang === 'ar' ? 'ط·ط¨ط§ط¹ط© ط§ظ„طھظ‚ط±ظٹط±' : 'Print Dossier'}</span>
                          </button>

                          {/* Decryption & Cryptographic Integrity Badge */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                            {selectedStudent.signature && selectedStudent.signature !== "UNSIGNED_UNAUTHENTICATED" ? (
                              <>
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                  <span className={`block text-[9px] font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{currentT.verifiedHmacBadge}</span>
                                  <span className="block text-[8px] text-emerald-300 font-mono truncate max-w-[125px]" title={selectedStudent.signature}>
                                    {selectedStudent.signature}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
                                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                  <span className="block text-[9px] text-rose-400 font-bold">{currentT.tamperedHmacBadge}</span>
                                  <span className="block text-[8px] text-slate-500 leading-none">{currentT.tamperedHmacDesc}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Student Performance Summary Widget */}
                      <div className={`rounded-xl p-4.5 mb-5 space-y-4 shadow-xl ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/90 border border-slate-800'}`}>
                        <div className={`flex items-center gap-2.5 border-b pb-3 ${isLightMode ? 'border-slate-200' : 'border-slate-900'}`}>
                          <div className="bg-blue-600/10 p-2 rounded-lg border border-blue-500/20 text-blue-400">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-[12.5px] font-extrabold text-white font-sans tracking-wide">
                              {lang === 'ar' ? 'ظ…ظ„ط®طµ ظ…ط®ط±ط¬ط§طھ ط§ظ„ظ…ط³ط§ط± ط§ظ„ط¯ط±ط§ط³ظٹ ظ„ظ„ظ…ط±ط´ط­ (طھط±ط§ظƒظ…ظٹ ظƒظ„ظٹ)' : 'Candidate Academic & Performance Summary (Cumulative Metrics)'}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">
                              {lang === 'ar' 
                                ? 'ظ„ظˆط­ط© طھط­ظƒظ… طھط±ط¨ط· ط³ظ„ظˆظƒ ط§ظ„طھطµظپط­ ط¨ط§ظ„طھط­طµظٹظ„ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹ ظˆظ†ط³ط¨ ط§ظ„ط­ط¶ظˆط± ط§ظ„ط§ظ…طھط­ط§ظ†ظٹ ط§ظ„ظپط¹ظ„ظٹ.' 
                                : 'Aggregate overview correlating proctoring integrity with academic grades and actual test attendance.'}
                            </p>
                          </div>
                        </div>

                        {/* Top Summary Metrics Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          {/* Metric 1: Average Score */}
                          <div className={`p-3.5 rounded-xl flex items-center gap-3 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/60 border border-slate-800'}`}>
                            <div className={`p-2.5 rounded-lg border shrink-0 ${isLightMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-950/50 border-blue-900/20 text-blue-400'}`}>
                              <Target className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={`block text-[9.5px] font-extrabold uppercase font-sans tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {lang === 'ar' ? 'ظ…طھظˆط³ط· ط§ظ„ط¯ط±ط¬ط§طھ ط§ظ„طھط¹ظ„ظٹظ…ظٹط©' : 'Average Academic Grade'}
                              </span>
                              <span className={`text-lg font-mono font-extrabold block mt-0.5 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                {studentAvgAcademicScore}%
                              </span>
                              <div className={`w-full h-1 rounded-full overflow-hidden mt-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-950 border border-slate-800'}`}>
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${studentAvgAcademicScore}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Metric 2: Attendance */}
                          <div className={`p-3.5 rounded-xl flex items-center gap-3 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/60 border border-slate-800'}`}>
                            <div className={`p-2.5 rounded-lg border shrink-0 ${isLightMode ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-purple-950/50 border-purple-900/20 text-purple-400'}`}>
                              <ClipboardList className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={`block text-[9.5px] font-extrabold uppercase font-sans tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {lang === 'ar' ? 'ظ†ط³ط¨ط© ط­ط¶ظˆط± ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ' : 'Exam Attendance Rate'}
                              </span>
                              <span className={`text-lg font-mono font-extrabold block mt-0.5 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                {studentExamAttendanceRate}%
                              </span>
                              <span className={`text-[9.5px] block truncate leading-tight mt-1 ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                {lang === 'ar' 
                                  ? `طھظ… طھظ‚ط¯ظٹظ… ${studentAllSubmissions.length} ظ…ظ† ط£طµظ„ ${exams.length} ظ…ط§ط¯ط©` 
                                  : `Completed ${studentAllSubmissions.length} of ${exams.length} tests`}
                              </span>
                            </div>
                          </div>

                          {/* Metric 3: Total Risk Duration */}
                          <div className={`p-3.5 rounded-xl flex items-center gap-3 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/60 border border-slate-800'}`}>
                            <div className={`p-2.5 rounded-lg border shrink-0 ${isLightMode ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-950/50 border-rose-900/20 text-rose-400'}`}>
                              <Timer className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9.5px] text-slate-400 font-extrabold uppercase font-sans tracking-wider">
                                {lang === 'ar' ? 'ظ…ط¯ط© ط§ظ„ط§ظ†ط­ط±ط§ظپ/طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Total Deviancy Duration'}
                              </span>
                              <span className={`text-lg font-mono font-extrabold block mt-0.5 ${studentTotalRiskSeconds > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {studentTotalRiskSeconds <= 0 
                                  ? (lang === 'ar' ? 'ظ  ط«ط§ظ†ظٹط©' : '0 secs') 
                                  : studentTotalRiskSeconds >= 60 
                                    ? (lang === 'ar' 
                                      ? `${Math.floor(studentTotalRiskSeconds / 60)} ط¯ ظˆ ${studentTotalRiskSeconds % 60} ط«` 
                                      : `${Math.floor(studentTotalRiskSeconds / 60)}m ${studentTotalRiskSeconds % 60}s`)
                                    : (lang === 'ar' ? `${studentTotalRiskSeconds} ط«ط§ظ†ظٹط©` : `${studentTotalRiskSeconds}s`)}
                              </span>
                              <span className="text-[9.5px] text-slate-500 block truncate leading-tight mt-1">
                                {lang === 'ar' ? 'ط¥ط¬ظ…ط§ظ„ظٹ ط²ظ…ظ† ط¹ط¯ظ… ط§ظ„طھط±ظƒظٹط²' : 'Sum of active visual defocus'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Subject Breakdown Subsection */}
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                          <span className="block text-[10px] uppercase font-mono tracking-wider font-extrabold text-blue-400 mb-2.5">
                            {lang === 'ar' ? 'ًں“Œ ط­ط§ظ„ط© ظˆظ‚ظٹظ… ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط¯ط±ط§ط³ظٹط© ط§ظ„ظ…ط³ط¬ظ„ط© ظ„ظ„ظ…ط±ط´ط­:' : 'ًں“Œ Registered Subject Status & Grades:'}
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subjects.map(subject => {
                              const subjectExams = exams.filter(ex => ex.subjectId === subject.id);
                              const subjectSubmissions = studentAllSubmissions.filter(sub => 
                                subjectExams.some(ex => ex.id === sub.examId)
                              );
                              
                              const countSubmitted = subjectSubmissions.length;
                              const countTotal = subjectExams.length;
                              const currentSubAvg = countSubmitted > 0
                                ? Math.round(subjectSubmissions.reduce((sum, s) => sum + s.scorePercent, 0) / countSubmitted)
                                : null;

                              const subLabel = lang === 'ar' ? subject.nameAr : subject.nameEn;

                              return (
                                <div key={subject.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between gap-3">
                                  <div>
                                    <span className="block text-xs font-bold text-slate-200">
                                      {subLabel}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">
                                      Subject Code: {subject.id}
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      countSubmitted === countTotal && countTotal > 0
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/20'
                                        : countSubmitted > 0
                                        ? 'bg-amber-950/60 text-amber-400 border border-amber-900/20'
                                        : 'bg-slate-905 bg-slate-900 text-slate-500 border border-slate-800'
                                    }`}>
                                      {lang === 'ar' 
                                        ? `ط­ط¶ظˆط±: ${countSubmitted}/${countTotal}` 
                                        : `Attended: ${countSubmitted}/${countTotal}`}
                                    </span>
                                    
                                    <div className="text-[10px] mt-1 text-slate-400 font-semibold">
                                      {lang === 'ar' ? 'ط§ظ„ط¯ط±ط¬ط©: ' : 'Grade: '}
                                      {currentSubAvg !== null ? (
                                        <span className="font-mono text-white font-extrabold">{currentSubAvg}%</span>
                                      ) : (
                                        <span className="text-slate-600 italic text-[9px] font-normal">{lang === 'ar' ? 'ط؛ط§ط¦ط¨' : 'Absent'}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Left Block (Risk summary with anomaly list) */}
                        <div className="md:col-span-5 space-y-4">
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <h4 className="text-xs font-extrabold text-gray-300 mb-2">{currentT.consolidatedTamperingIndicators}</h4>
                            <div className="flex items-end gap-3 justify-center py-4 relative">
                              <div className="text-center">
                                <span className={`text-4xl font-extrabold font-mono ${selectedAnalysis.riskScore >= 60 ? 'text-red-500' : selectedAnalysis.riskScore >= 35 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                  {selectedAnalysis.riskScore}
                                </span>
                                <span className="text-xs text-gray-400 font-bold block mt-1">{currentT.outOf100Risk}</span>
                              </div>
                            </div>

                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${selectedAnalysis.riskScore}%` }}
                                className={`h-full rounded-full ${selectedAnalysis.riskScore >= 60 ? 'bg-red-500' : selectedAnalysis.riskScore >= 35 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                              ></div>
                            </div>
                          </div>

                          {/* Breakdown of Threat Profile */}
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                            <h4 className="text-xs font-extrabold text-blue-300 font-sans">{currentT.threatProfileHeading}</h4>
                            <div className="space-y-2">
                              {/* Dimension 1: Tab Switches */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{currentT.dimTabSwitches} ({selectedStudent.tabSwitchesCount} {lang === 'ar' ? 'ظ…ط±ط§طھ' : 'times'})</span>
                                  <span className="font-mono">{Math.min(selectedStudent.tabSwitchesCount * 10, 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                  <div style={{ width: `${Math.min(selectedStudent.tabSwitchesCount * 10, 100)}%` }} className="h-full bg-blue-500 rounded-full"></div>
                                </div>
                              </div>

                              {/* Dimension 2: Copy Paste */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{currentT.dimCopyPaste} ({selectedStudent.copyCount + selectedStudent.pasteCount} {lang === 'ar' ? 'ط¹ظ…ظ„ظٹط§طھ' : 'events'})</span>
                                  <span className="font-mono">{Math.min((selectedStudent.copyCount + selectedStudent.pasteCount) * 12, 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                  <div style={{ width: `${Math.min((selectedStudent.copyCount + selectedStudent.pasteCount) * 12, 100)}%` }} className="h-full bg-orange-500 rounded-full"></div>
                                </div>
                              </div>

                              {/* Dimension 3: IP Conflict */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{currentT.dimIpClash}</span>
                                  <span className="font-mono">{selectedAnalysis.ipAddressConflict ? '100%' : '0%'}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                  <div style={{ width: selectedAnalysis.ipAddressConflict ? '100%' : '0%' }} className="h-full bg-purple-500 rounded-full"></div>
                                </div>
                              </div>

                              {/* Dimension 4: Out of bounds mouse */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{currentT.dimMouseOut} ({selectedStudent.mouseOutSeconds} {currentT.secUnit})</span>
                                  <span className="font-mono">{Math.min((selectedStudent.mouseOutSeconds / 100) * 100, 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                  <div style={{ width: `${Math.min((selectedStudent.mouseOutSeconds / 100) * 100, 100)}%` }} className="h-full bg-rose-500 rounded-full"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Network Collusion Graph */}
                          {selectedAnalysis.ipAddressConflict && (
                            <div className="bg-purple-950/20 border border-purple-500/20 p-3.5 rounded-xl space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                                <Network className="w-4 h-4 animate-pulse" />
                                <span>{currentT.clashIntelGraph}</span>
                              </div>
                              <p className="text-[10px] text-purple-300 leading-relaxed font-sans">
                                {currentT.clashIntelDesc}
                              </p>
                              <div className="grid grid-cols-1 gap-1.5 mt-1">
                                {analyses
                                  .filter(an => an.studentId !== selectedStudent.studentId && selectedStudent.ipAddresses.some(ip => submissions.find(s => s.studentId === an.studentId)?.ipAddresses.includes(ip)))
                                  .map(peer => (
                                    <div
                                      key={peer.studentId}
                                      onClick={() => setSelectedStudentId(peer.studentId)}
                                      className={`flex items-center justify-between p-2 bg-slate-950 hover:bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-all duration-150`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping shrink-0"></span>
                                        <span className="text-xs text-slate-100 font-bold">{peer.studentName}</span>
                                        <span className="text-[9px] font-mono p-0.5 bg-slate-900 rounded text-slate-400">{peer.studentId}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${peer.riskLevel === 'high' ? 'bg-red-950 text-red-400 border border-red-500/20' : peer.riskLevel === 'medium' ? 'bg-orange-950 text-orange-400 border border-orange-500/20' : 'bg-slate-850 text-slate-300 border border-slate-800'}`}>
                                          {lang === 'ar' ? `ط®ط·ظˆط±ط© ${peer.riskScore}%` : `Risk ${peer.riskScore}%`}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}

                          {/* List of rule violations */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 font-sans">{currentT.violationsLog}</h4>
                            {selectedAnalysis.anomalies.length === 0 ? (
                              <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{lang === 'ar' ? 'ظ„ظ… ظٹطھظ… ط±طµط¯ ط£ظٹ ط£ظ†ط´ط·ط© ط³ظ„ظˆظƒظٹط© طھط®ظ„ ط¨ط³ظ„ط§ظ…ط© ط§ظ„ط§ظ…طھط­ط§ظ†.' : 'No behavioral risk elements detected.'}</span>
                              </div>
                            ) : (
                              selectedAnalysis.anomalies.map((anom, idx) => {
                                // Simple mapping translated alerts to English manually if isEnglish is true
                                let displayAnom = anom;
                                if (lang === 'en') {
                                  if (anom.includes('طھط·ط§ط¨ظ‚ ط¹ظ†ظˆط§ظ†')) displayAnom = 'Co-location network IP Collusion detected with other student submissions.';
                                  else if (anom.includes('ط¥ظ†ظ‡ط§ط، ظ…ط¨ظƒط±')) displayAnom = 'Premature solving time and extreme grading score points mismatch (Exam Leak suspected).';
                                  else if (anom.includes('ط§ظ„ط­ظ…ظˆظ„ط© طھظپطھظ‚ط¯ طھظˆظ‚ظٹط¹')) displayAnom = 'Security warning: Missing or Tampered digital HMAC Signature.';
                                  else if (anom.includes('طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°')) displayAnom = `Excessive tab focus switching behavior (${selectedStudent.tabSwitchesCount} times).`;
                                  else if (anom.includes('ظ†ط³ط® ظˆظ„طµظ‚')) displayAnom = 'Suspiciously high percentage copy and paste clipboard count occurrences.';
                                  else if (anom.includes('ط®ط±ظˆط¬ ظ…ط¤ط´ط±')) displayAnom = 'Student mouse cursor kept inactive or offscreen for massive durations.';
                                }
                                return (
                                  <div key={idx} className="p-2.5 bg-red-950/15 border border-red-900/30 text-rose-300 text-[11px] rounded-lg flex items-start gap-1.5 leading-relaxed">
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <span>{displayAnom}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Incident Activity Stream Section */}
                          <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 w-full">
                            <div className="flex items-center gap-2 text-xs font-black text-blue-400 border-b border-slate-800 pb-3">
                              <span className="text-sm leading-none">ًں“‌</span>
                              <span>{lang === 'ar' ? 'ط³ط±ط¯ ظˆط¨ط« ط§ظ„ظ†ط´ط§ط· ظ„ظ„ط­ط§ط¯ط«ط© (ظ…ظ„ط®طµ ظˆطھط­ظ„ظٹظ„ طھظپطµظٹظ„ظٹ)' : 'Incident Activity Stream (Narrative & Telemetry Analysis)'}</span>
                            </div>
                            
                            <div className="space-y-6">
                              {/* Top Section: Live Narrative Description */}
                              <div className="space-y-3">
                                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono flex items-center gap-1.5">
                                  <span className="w-1 h-3 bg-blue-500 rounded-full inline-block"></span>
                                  <span>{lang === 'ar' ? 'ط§ظ„ط³ط±ط¯ ط§ظ„ظˆظ‚ط§ط¦ط¹ظٹ ظ„ظ„ط­ط§ط¯ط«ط©:' : 'Incident Chronological Narrative:'}</span>
                                </span>
                                <div className="text-[12.5px] leading-relaxed text-slate-200 bg-slate-900 border border-slate-850 p-5 rounded-xl font-medium whitespace-pre-line relative overflow-hidden shadow-inner flex flex-col justify-between">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/2 rounded-full blur-2xl pointer-events-none"></div>
                                  
                                  <span className="relative z-10 block pr-1 pl-1">{getIncidentNarrative(selectedStudent, selectedAnalysis)}</span>
                                  
                                  <div className="relative z-10 border-t border-slate-850/60 mt-3 pt-2.5 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                                    <span>ًں›،ï¸ڈ {lang === 'ar' ? 'ظ…ط­ظ„ظ„ ط§ظ„ط³ظ„ظˆظƒ ط§ظ„ط¬ظ†ط§ط¦ظٹ ظ„ظ€ CyberShield' : 'CyberShield Forensic AI Engine'}</span>
                                    <span>
                                      Generated at {new Date(selectedAnalysis.analyzedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Section: Dynamic Threat Signals Widget */}
                              <div className="space-y-3">
                                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono flex items-center gap-1.5">
                                  <span className="w-1 h-3 bg-amber-500 rounded-full inline-block"></span>
                                  <span>{lang === 'ar' ? 'ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¬ظ„ط³ط©:' : 'Session Telemetry:'}</span>
                                </span>
                                
                                <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4 shadow-md">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                                     {/* Risk Rating Card */}
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3.5 hover:border-slate-700/60 transition-colors">
                                      <div className={`p-2.5 rounded-lg shrink-0 select-none ${selectedAnalysis.riskScore >= 60 ? 'bg-red-500/10 text-red-400' : selectedAnalysis.riskScore >= 35 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        <AlertTriangle className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider truncate">
                                          {lang === 'ar' ? 'ط¯ط±ط¬ط© ط§ظ„ط®ط·ظˆط±ط©' : 'Risk Rating'}
                                        </span>
                                        <span className={`text-[15px] font-mono font-black ${selectedAnalysis.riskScore >= 60 ? 'text-red-400' : selectedAnalysis.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                          {selectedAnalysis.riskScore}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Tab Focus Loss Card */}
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3.5 hover:border-slate-700/60 transition-colors">
                                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm shrink-0 leading-none select-none">
                                        ًں”„
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider truncate">
                                          {lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Tab Focus Loss'}
                                        </span>
                                        <span className="text-[15px] font-mono text-white font-black">
                                          {selectedStudent.tabSwitchesCount} <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'ظ…ط±ط§طھ' : 'events'}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Clipboard Action Card */}
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3.5 hover:border-slate-700/60 transition-colors">
                                      <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 text-sm shrink-0 leading-none select-none">
                                        ًں“‹
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider truncate">
                                          {lang === 'ar' ? 'ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط­ط§ظپط¸ط©' : 'Clipboard'}
                                        </span>
                                        <span className="text-[15px] font-mono text-white font-black">
                                          {selectedStudent.copyCount + selectedStudent.pasteCount} <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'ظ†ط³ط®/ظ„طµظ‚' : 'actions'}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Mouse Offscreen Card */}
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3.5 hover:border-slate-700/60 transition-colors">
                                      <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 text-sm shrink-0 leading-none select-none">
                                        ًں–±ï¸ڈ
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider truncate">
                                          {lang === 'ar' ? 'ط®ط§ط±ط¬ ط§ظ„ط­ط¯ظˆط¯' : 'Mouse Offscreen'}
                                        </span>
                                        <span className="text-[15px] font-mono text-white font-black">
                                          {selectedStudent.mouseOutSeconds} <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'ط«ط§ظ†ظٹط©' : 'secs'}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Network IP Conflict Alert Bar */}
                                  <div className={`p-4 sm:p-5 rounded-xl border flex items-center justify-between transition-all ${selectedAnalysis.ipAddressConflict ? 'bg-red-500/5 border-red-500/20 text-red-300' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm shrink-0 select-none">{selectedAnalysis.ipAddressConflict ? 'ًں“،' : 'ًںں¢'}</span>
                                      <span className="text-[11px] font-bold">
                                        {lang === 'ar' 
                                          ? 'طھط­ظ„ظٹظ„ طھط¶ط§ط±ط¨ ط¹ظ†ط§ظˆظٹظ† ط§ظ„ط´ط¨ظƒط© (IP Conflict):' 
                                          : 'IP Conflict Detection:'}
                                      </span>
                                    </div>
                                    <span className={`font-mono font-black px-2.5 py-0.5 rounded text-[10px] border shadow-sm ${selectedAnalysis.ipAddressConflict ? 'bg-red-950/80 text-red-400 border-red-500/25 animate-pulse' : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/25'}`}>
                                      {selectedAnalysis.ipAddressConflict 
                                        ? (lang === 'ar' ? 'طھط¹ط§ط±ط¶ ط´ط¨ظƒط© ط§ظ„ظ€ IP ظ…ظƒطھط´ظپ' : 'IP CONFLICT DETECTED') 
                                        : (lang === 'ar' ? 'ط¢ظ…ظ† ظˆظ…ط³طھظ‚ظ„ (ظ„ط§ طھظˆط¬ط¯ طھط¹ط§ط±ط¶ط§طھ)' : 'SECURE & INDEPENDENT')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Student Behavioral Density heat timeline */}
                          <StudentBehavioralDensity
                            student={selectedStudent}
                            analysis={selectedAnalysis}
                            lang={lang}
                          />

                          {/* Quick Audit Notes Section */}
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400">
                                <FileText className="w-4 h-4 text-amber-400 animate-pulse" />
                                <span>{lang === 'ar' ? 'ظ…ظ„ط§ط­ط¸ط§طھ ظˆطھط¯ظ‚ظٹظ‚ ط§ظ„ظ…ط±ط§ظ‚ط¨ ط§ظ„ظ…طھط±ط§ظƒظ…ط©' : 'Persistent Auditor Notes & Logs'}</span>
                              </div>
                              <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-slate-400 font-mono font-bold">
                                {(studentNotes[originalIdMap[selectedStudent.studentId] || selectedStudent.studentId] || []).length} {lang === 'ar' ? 'ط³ط¬ظ„' : 'notes'}
                              </span>
                            </div>

                            {/* Notes List Scrollbox */}
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                              {(studentNotes[originalIdMap[selectedStudent.studentId] || selectedStudent.studentId] || []).length === 0 ? (
                                <p className="text-[10px] text-slate-500 italic text-center py-2">
                                  {lang === 'ar' ? 'ظ„ط§ ظٹظˆط¬ط¯ ط£ظٹ ظ…ظ„ط§ط­ط¸ط§طھ طھط¯ظ‚ظٹظ‚ ظ„ظ‡ط°ظ‡ ط§ظ„ط­ط§ظ„ط© ط­طھظ‰ ط§ظ„ط¢ظ†.' : 'No notes attached to this candidate yet.'}
                                </p>
                              ) : (
                                (studentNotes[originalIdMap[selectedStudent.studentId] || selectedStudent.studentId] || []).map((n, i) => (
                                  <div key={i} className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1 relative group font-sans">
                                    <button
                                      onClick={() => {
                                        const origId = originalIdMap[selectedStudent.studentId] || selectedStudent.studentId;
                                        const updated = { ...studentNotes };
                                        updated[origId] = updated[origId].filter((_, idx) => idx !== i);
                                        setStudentNotes(updated);
                                        addAuditorLogEntry(
                                          'clear_cache',
                                          origId,
                                          submissions.find(s => s.studentId === origId)?.studentName || origId,
                                          `Removed internal assessment note index ${i}`
                                        );
                                      }}
                                      className="absolute top-1.5 right-2 text-rose-500 hover:text-rose-450 text-[11px] font-bold cursor-pointer"
                                      title={lang === 'ar' ? 'ط­ط°ظپ' : 'Delete'}
                                    >
                                      âœ•
                                    </button>
                                    <p className="text-[10px] text-slate-200 pr-5 leading-normal">{n.note}</p>
                                    <span className="text-[7.5px] text-slate-500 font-mono block select-none">
                                      âڈ± {n.timestamp}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Text Input area */}
                            <div className="space-y-2 pt-1 border-t border-slate-800/60 bg-slate-950">
                              <textarea
                                value={currentNoteInput}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (selectedStudent) {
                                    const origId = originalIdMap[selectedStudent.studentId] || selectedStudent.studentId;
                                    const updated = { ...noteDrafts, [origId]: val };
                                    setNoteDrafts(updated);
                                    localStorage.setItem('cyber_proctor_note_drafts', JSON.stringify(updated));
                                  }
                                }}
                                placeholder={lang === 'ar' ? 'ط£ط¶ظپ ظ…ظ„ط§ط­ط¸ط© طھط¯ظ‚ظٹظ‚ (ظ…ط«ط§ظ„: ظ…ط­ط§ظˆظ„ط© طھظˆط§طµظ„ ط¬ط§ظ†ط¨ظٹ ظ…ط±ظٹط¨ط©طŒ ط§ظ„ط®...)' : 'Write an internal audit note (e.g., suspicious activity verified)...'}
                                className="w-full bg-slate-950 border border-slate-850 text-[10.5px] text-slate-100 p-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder-slate-600 resize-none h-14"
                              />
                              <div className="flex justify-between items-center">
                                <div className="text-[10px] text-emerald-450 text-emerald-400 font-bold flex items-center gap-1.5 select-none">
                                  {currentNoteInput.trim() && (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                                      <span>{lang === 'ar' ? 'ظ…ط³ظˆط¯ط© ظ…ط­ظپظˆط¸ط© طھظ„ظ‚ط§ط¦ظٹط§ظ‹ âœ“' : 'Draft auto-saved âœ“'}</span>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={!currentNoteInput.trim()}
                                  onClick={() => {
                                    if (!currentNoteInput.trim()) return;
                                    const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      day: 'numeric',
                                      month: 'short'
                                    });
                                    const origId = originalIdMap[selectedStudent.studentId] || selectedStudent.studentId;
                                    const newNote = { timestamp: timeStr, note: currentNoteInput.trim() };
                                    const updated = { ...studentNotes };
                                    updated[origId] = [newNote, ...(updated[origId] || [])];
                                    setStudentNotes(updated);
                                    
                                    // Clear uncommitted draft from state and localStorage
                                    const updatedDrafts = { ...noteDrafts };
                                    delete updatedDrafts[origId];
                                    setNoteDrafts(updatedDrafts);
                                    localStorage.setItem('cyber_proctor_note_drafts', JSON.stringify(updatedDrafts));
                                    
                                    // Log note attachment to our proctor audit trails
                                    addAuditorLogEntry(
                                      'add_note',
                                      origId,
                                      submissions.find(s => s.studentId === origId)?.studentName || origId,
                                      `Attached assessment note: "${currentNoteInput.trim()}"`
                                    );
                                  }}
                                  className="text-[9.5px] font-extrabold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                  {lang === 'ar' ? 'ط­ظپط¸ ط§ظ„ظ…ظ„ط§ط­ط¸ط©' : 'Attach Note'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Action Decision center */}
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                              <ShieldCheck className="w-4 h-4 text-blue-400 animate-pulse" />
                              <h4 className="text-xs font-extrabold text-white font-sans">{currentT.actionCenterHeading}</h4>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                              {currentT.actionCenterDesc}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                              <button
                                onClick={() => handleVerdictChange(selectedStudent.studentId, 'approved')}
                                className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                  selectedAnalysis.verdict === 'approved'
                                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{currentT.actionApprove}</span>
                              </button>
                              
                              <button
                                onClick={() => handleVerdictChange(selectedStudent.studentId, 'retake_requested')}
                                className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                  selectedAnalysis.verdict === 'retake_requested'
                                    ? 'bg-amber-600/20 text-amber-400 border-amber-500'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{currentT.actionRetake}</span>
                              </button>
                              
                              <button
                                onClick={() => handleVerdictChange(selectedStudent.studentId, 'investigation')}
                                className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                                  selectedAnalysis.verdict === 'investigation'
                                    ? 'bg-rose-600/20 text-rose-400 border-rose-500 animate-pulse'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
                                }`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{currentT.actionInvestigate}</span>
                              </button>
                            </div>

                            {selectedAnalysis.verdict && (
                              <div className={`p-2 rounded-lg text-[10px] flex items-start gap-1.5 border leading-relaxed ${
                                selectedAnalysis.verdict === 'approved'
                                  ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/20'
                                  : selectedAnalysis.verdict === 'retake_requested'
                                  ? 'bg-amber-950/20 text-amber-300 border-amber-500/20'
                                  : 'bg-rose-950/20 text-rose-300 border-rose-500/20'
                              }`}>
                                <span className="font-bold underline shrink-0">{currentT.verdictLabel}</span>
                                <span>
                                  {selectedAnalysis.verdict === 'approved' && currentT.verdictApprovedDesc}
                                  {selectedAnalysis.verdict === 'retake_requested' && currentT.verdictRetakeDesc}
                                  {selectedAnalysis.verdict === 'investigation' && currentT.verdictInvestigateDesc}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Block (Timeline and per-question graphs) */}
                        <div className="md:col-span-7 space-y-4">
                          {/* Chronological Session Scrubber & Timeline Slider */}
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                              <div>
                                <h4 className="text-xs font-extrabold text-blue-400 font-sans flex items-center gap-1.5">
                                  <span>âڈ±ï¸ڈ</span>
                                  <span>{lang === 'ar' ? 'ط´ط±ظٹط· طھطھط¨ط¹ ط§ظ„ظ…ط³ط§ط± ط§ظ„ط²ظ…ظ†ظٹ ظ„ظ„ظ‚ظٹط§ط³ط§طھ ظˆط§ظ„ظ†ط³ط®' : 'Chronological Session Scrubber'}</span>
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {lang === 'ar' ? 'ط§ط³ط­ط¨ ط§ظ„ط´ط±ظٹط· ظ„ظ…ط´ط§ظ‡ط¯ط© طھط±ط§ظƒظ… ط§ظ„ظ…ط®ط§ظ„ظپط§طھ ظˆطھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°:' : 'Scrub back and forth to inspect event accumulation over time:'}
                                </p>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-bold text-slate-300">
                                {lang === 'ar' ? 'ط§ظ„ط¯ظ‚ظٹظ‚ط©' : 'Min'} {scrubMinute} / {selectedStudent.durationMinutes || 45}
                              </span>
                            </div>

                            {/* Range Slider Container */}
                            <div className="space-y-2">
                              <input
                                type="range"
                                min="0"
                                max={selectedStudent.durationMinutes || 45}
                                value={scrubMinute}
                                onChange={(e) => setScrubMinute(parseInt(e.target.value, 10))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                              <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold select-none">
                                <span>{lang === 'ar' ? 'ط§ظ„ط¯ظ‚ظٹظ‚ط© ظ  (ط§ظ„ط¨ط¯ط§ظٹط©)' : 'Min 0 (Start)'}</span>
                                <span>{lang === 'ar' ? `ط§ظ„ط¯ظ‚ظٹظ‚ط© ${selectedStudent.durationMinutes || 45} (ط§ظ„ظ†ظ‡ط§ظٹط©)` : `Min ${selectedStudent.durationMinutes || 45} (End)`}</span>
                              </div>
                            </div>

                            {/* Dynamic Accumulated Stats Up to scrubMinute */}
                            {(() => {
                              const allEvents = getChronologicalEvents(selectedStudent);
                              const pastEvents = allEvents.filter(ev => ev.minute <= scrubMinute);
                              const tabsCount = pastEvents.filter(ev => ev.type === 'tab_switch').length;
                              const copiesCount = pastEvents.filter(ev => ev.type === 'clipboard_copy').length;
                              const pastesCount = pastEvents.filter(ev => ev.type === 'clipboard_paste').length;
                              const cursorsCount = pastEvents.filter(ev => ev.type === 'boundary_crossing').length;

                              return (
                                <>
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850 text-center">
                                      <span className="block text-[8px] text-slate-400 uppercase font-bold">{lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ظ†ط§ظپط°ط©' : 'Tab Switch'}</span>
                                      <span className="text-xs font-mono font-extrabold text-red-500">{tabsCount}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850 text-center">
                                      <span className="block text-[8px] text-slate-400 uppercase font-bold">{lang === 'ar' ? 'ظ†ط³ط® ط§ظ„ط­ط§ظپط¸ط©' : 'Clipboard Copy'}</span>
                                      <span className="text-xs font-mono font-extrabold text-amber-400">{copiesCount}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850 text-center">
                                      <span className="block text-[8px] text-slate-400 uppercase font-bold">{lang === 'ar' ? 'ظ„طµظ‚ ظ†طµ' : 'Content Paste'}</span>
                                      <span className="text-xs font-mono font-extrabold text-pink-400">{pastesCount}</span>
                                    </div>
                                    <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850 text-center">
                                      <span className="block text-[8px] text-slate-400 uppercase font-bold">{lang === 'ar' ? 'ط®ط±ظˆط¬ ط§ظ„ظ…ط¤ط´ط±' : 'Border Cross'}</span>
                                      <span className="text-xs font-mono font-extrabold text-orange-400">{cursorsCount}</span>
                                    </div>
                                  </div>

                                  {/* List of events happened up to scrubMinute */}
                                  <div ref={timelineContainerRef} className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                                      {lang === 'ar' ? 'ط³ط¬ظ„ ط§ظ„ظ…ط®ط§ظ„ظپط§طھ ط§ظ„ط²ظ…ظ†ظٹ (ظ…طµظپظ‰):' : 'Auditing Timeline Feed (Filtered):'}
                                    </span>
                                    {pastEvents.length === 0 ? (
                                      <div className="text-center py-4 bg-slate-900/30 rounded-lg text-slate-500 italic text-[10px]">
                                        {lang === 'ar' ? 'ظ„ط§ ظٹظˆط¬ط¯ ط£ط­ط¯ط§ط« ظ…ط³ط¬ظ„ط© ط­طھظ‰ ظ‡ط°ظ‡ ط§ظ„ط¯ظ‚ظٹظ‚ط©.' : 'No behavioral events logged up to this minute.'}
                                      </div>
                                    ) : (
                                      pastEvents.map((ev, idx) => (
                                        <div key={idx} className={`p-2 border rounded-lg text-xs flex items-start gap-2 ${ev.bgClass}`}>
                                          <span className="text-sm shrink-0 mt-0.5">{ev.icon}</span>
                                          <div className="flex-1">
                                            <p className="font-bold text-[10px] leading-tight text-white mb-0.5">
                                              {lang === 'ar' ? ev.titleAr : ev.titleEn}
                                            </p>
                                            <span className="text-[8px] font-mono text-slate-400">
                                              {lang === 'ar' ? `ط­ط¯ط« ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط©: ${ev.minute}` : `Logged at Minute ${ev.minute}`}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                           {/* Time Spent per Question Graph & Anonymized Telemetry Replay */}
                           <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 transition-all duration-300">
                             <div className="flex justify-between items-center mb-3 gap-2 flex-wrap border-b border-slate-800/50 pb-2">
                               <h4 className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block animate-pulse"></span>
                                 {currentT.performanceOverTime}
                               </h4>
                               <button
                                 onClick={() => {
                                   if (!replayState.active) {
                                     const timelineData = compileReplayTimeline(selectedStudent);
                                     setReplayState(prev => ({
                                       ...prev,
                                       active: true,
                                       playing: true, // Auto-play on tap!
                                       currentSecond: 0,
                                       totalDuration: timelineData.totalDuration,
                                       eventLog: timelineData.log,
                                       currentMsg: timelineData.log[0]?.text || 'Session started',
                                       currentMsgAr: timelineData.log[0]?.textAr || 'ط¨ط¯ط، ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط¬ظ„ط³ط©'
                                     }));
                                     showToast("طھظ… طھظ‡ظٹط¦ط© ظˆطھط´ط؛ظٹظ„ ظ…ط­ط§ظƒظٹ ط§ظ„ط­ط±ظƒط© ط§ظ„ط³ظ„ظˆظƒظٹط© ظ„ظ„ط·ط§ظ„ط¨", "Initialized candidate behavioral telemetry replay");
                                   } else {
                                     setReplayState(prev => ({ ...prev, active: false, playing: false }));
                                   }
                                 }}
                                 className={`px-2.5 py-1 text-[9.5px] font-black rounded flex items-center gap-1 cursor-pointer transition select-none tracking-normal border font-sans ${
                                   replayState.active
                                     ? 'bg-rose-500/10 hover:bg-rose-500/20 text-red-400 border-red-500/20'
                                     : 'bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border-indigo-400/20'
                                 }`}
                               >
                                 ًںژ¥ {replayState.active 
                                   ? (lang === 'ar' ? 'ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ…ط­ط§ظƒظٹ' : 'Close Player') 
                                   : (lang === 'ar' ? 'طھط´ط؛ظٹظ„ ظ…ط­ط§ظƒظٹ ط§ظ„ط­ط±ظƒط©' : 'Telemetry Replay')}
                               </button>
                             </div>

                             {replayState.active ? (
                               <div className="space-y-3 pt-1">
                                 {/* Interactive Virtual Sandboxed Browser */}
                                 <div className="relative border border-slate-800 bg-slate-950 rounded-lg overflow-hidden h-44 shadow-2xl flex flex-col">
                                   {/* simulated browser chrome headers */}
                                   <div className="bg-slate-900 border-b border-slate-800/85 px-3 py-1 flex items-center justify-between text-[8px] font-mono select-none shrink-0">
                                     <div className="flex items-center gap-1">
                                       <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                       <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                       <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                       <span className="text-slate-500 text-[7.5px] ml-1 uppercase">Sandbox_Active_Monitor</span>
                                     </div>
                                     <div className="bg-slate-950 text-slate-400 px-2.5 py-0.5 rounded border border-slate-800 text-[8px] w-6/12 text-center truncate">
                                       https://exam.university.edu.sa/test/q_{replayState.activeQ}
                                     </div>
                                     <span className="text-indigo-400 text-[8px] font-bold">
                                       ANONYMIZED
                                     </span>
                                   </div>

                                   {/* browser workplace active layout */}
                                   <div className="flex-1 p-3 relative overflow-hidden select-none bg-slate-950 flex flex-col justify-between">
                                     {/* Blurred overlay during tab exit events */}
                                     {(() => {
                                       let isOut = false;
                                       for (let i = 0; i <= replayState.currentSecond; i++) {
                                         const ev = replayState.eventLog.find(e => e.second === i);
                                         if (ev) {
                                           if (ev.type === 'blur') isOut = true;
                                           if (ev.type === 'focus') isOut = false;
                                         }
                                       }

                                       if (isOut) {
                                         return (
                                           <div className="absolute inset-x-0 top-[26px] bottom-0 bg-red-950/90 border-t border-red-500/30 backdrop-blur z-30 flex flex-col items-center justify-center text-center p-3">
                                             <span className="text-xl animate-bounce">âڑ ï¸ڈ</span>
                                             <p className="text-red-400 font-black text-[11px] uppercase tracking-wider">
                                               {lang === 'ar' ? 'ظپظ‚ط¯ط§ظ† طھط±ظƒظٹط² ط§ظ„ط´ط§ط´ط© (ط´ط¨ظ‡ط© ط؛ط´)' : 'SCREEN FOCUS LOST (Tab Switch Out)'}
                                             </p>
                                             <p className="text-[9px] text-red-300 opacity-80 mt-0.5 max-w-[280px]">
                                               {lang === 'ar' 
                                                 ? 'ظ…ط¤ط´ط± ط§ظ„ط­ط±ظƒط© ظˆط§ظ„طھط±ظ…ظٹط² ظٹط´ظٹط± ظ„ظ…ط؛ط§ط¯ط±ط© ط§ظ„طµظپط­ط© ظپظٹ ظ‡ط°ط§ ط§ظ„طھظˆظ‚ظٹطھ.'
                                                 : 'Candidate has switched viewport to a secondary window / search tool.'}
                                             </p>
                                           </div>
                                         );
                                       }
                                       return null;
                                     })()}

                                     {/* Current Q metadata */}
                                     <div>
                                       <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                         <span className="font-extrabold text-blue-400 uppercase">
                                           {lang === 'ar' ? `السؤال ${replayState.activeQ} / 5` : `QUESTION ${replayState.activeQ} OF 5`}
                                         </span>
                                         <span className="text-slate-500">
                                           {lang === 'ar' ? `ط§ظ„ظ…ط¤ظ‚طھ: ${replayState.currentSecond}ط«` : `Timeline: ${replayState.currentSecond}s`}
                                         </span>
                                       </div>

                                       <div className="mt-1 h-8 bg-slate-900 border border-slate-850 rounded p-1.5 text-[8.5px] text-slate-300 leading-normal line-clamp-2">
                                         {lang === 'ar' 
                                           ? `ظ…ظ‚ط±ط± ط§ظ„ظ†ط¸ظ… ط§ظ„ط±ظ‚ظ…ظٹط©: ظٹط±ط¬ظ‰ ظƒطھط§ط¨ط© ط®ظˆط§ط±ط²ظ…ظٹط© ط§ظ„ط¨ط­ط« ط§ظ„ظ…ط·ظˆط± ظ…ط¹ ظ…ط±ط§ط¹ط§ط© ط§ظ„ط­ط³ط§ط¨ ط§ظ„ط±ظٹط§ط¶ظٹ ط§ظ„ط¯ظ‚ظٹظ‚...`
                                           : `Digital Systems: Write an optimized search mechanism. Clearly demonstrate loop invariance theorem...`}
                                       </div>

                                       {/* Typing editor sim */}
                                       <div className="mt-1.5 h-12 bg-slate-900 border border-slate-850 rounded p-1.5 font-mono text-[8px] text-slate-400 flex flex-col justify-between">
                                         <span className="text-emerald-400 font-extrabold">
                                           {"> "}
                                           {(() => {
                                             const str = "const solveRecursion = (n) => n <= 1 ? 1 : n * solveRecursion(n-1);";
                                             const count = Math.min(str.length, (replayState.currentSecond * 1.6) % (str.length + 15));
                                             return str.substring(0, Math.floor(count)) + (replayState.playing && replayState.currentSecond % 2 === 0 ? "â–ˆ" : "");
                                           })()}
                                         </span>
                                         <div className="text-[7.5px] text-slate-500 font-sans text-end font-bold">
                                           {lang === 'ar' ? 'ط³ط¬ظ„ طھط¯ظˆظٹظ† ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„ظ…ط¨ط§ط´ط±' : 'Live Answer Drafting simulator.'}
                                         </div>
                                       </div>
                                     </div>

                                     {/* Smoothly moving yellow / custom golden pointer */}
                                     <div 
                                       style={{ left: `${replayState.cursor.x}%`, top: `${replayState.cursor.y}%` }}
                                       className="absolute w-3.5 h-3.5 text-yellow-405 z-40 pointer-events-none transition-all duration-300"
                                     >
                                       <svg className="w-full h-full stroke-yellow-400 fill-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 8 20 20" xmlns="http://www.w3.org/2000/svg">
                                         <polygon points="0,0 12,12 8,13 14,21 11,22 5,14 2,16" className="stroke-slate-955 stroke-[1.5]" />
                                       </svg>
                                       {replayState.cursor.clicked && (
                                         <span className="absolute -top-1 -left-1 w-5 h-5 border border-yellow-400 rounded-full animate-ping block opacity-85"></span>
                                       )}
                                     </div>
                                   </div>

                                   {/* Live event descriptor bar */}
                                   <div className="bg-slate-900 border-t border-slate-800/80 px-3 py-1 flex items-center justify-between text-[10px] shrink-0 font-sans select-none">
                                     <div className="flex items-center gap-1.5 text-slate-200 font-extrabold overflow-hidden">
                                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0"></span>
                                       <span className="truncate max-w-[210px] text-[9.5px]">
                                         {lang === 'ar' ? replayState.currentMsgAr : replayState.currentMsg}
                                       </span>
                                     </div>
                                     <span className="text-[7.5px] font-mono text-slate-550 shrink-0 select-none uppercase">
                                       telemetry_play
                                     </span>
                                   </div>
                                 </div>

                                 {/* Simulation Interface Control Panel */}
                                 <div className="bg-slate-950 border border-slate-800 rounded p-1.5 flex items-center justify-between gap-3 text-[11px] flex-wrap">
                                   <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-0.8 rounded shrink-0">
                                     <button 
                                       onClick={() => setReplayState(p => ({ ...p, playing: !p.playing }))}
                                       className="hover:text-white font-extrabold text-slate-350 cursor-pointer p-0.5"
                                       title={replayState.playing ? "Pause" : "Play"}
                                     >
                                       {replayState.playing ? "âڈ¸" : "â–¶"}
                                     </button>
                                     <button 
                                       onClick={() => setReplayState(p => ({ ...p, currentSecond: 0, playing: true }))}
                                       className="hover:text-white font-extrabold text-slate-350 cursor-pointer p-0.5"
                                       title="Reset"
                                     >
                                       ًں”„
                                     </button>
                                   </div>

                                   {/* Progress bar stream slider */}
                                   <div className="flex-1 min-w-[100px] px-1 select-none">
                                     <input 
                                       type="range"
                                       min={0}
                                       max={replayState.totalDuration}
                                       value={replayState.currentSecond}
                                       onChange={(e) => {
                                         const sec = parseInt(e.target.value, 10);
                                         setReplayState(p => {
                                           const match = p.eventLog.filter(x => x.second <= sec).pop();
                                           return {
                                             ...p,
                                             currentSecond: sec,
                                             currentMsg: match ? match.text : p.currentMsg,
                                             currentMsgAr: match ? match.textAr : p.currentMsgAr
                                           };
                                         });
                                       }}
                                       className="w-full bg-slate-800 h-1 rounded appearance-none cursor-pointer accent-indigo-500"
                                     />
                                   </div>

                                   {/* Playback speed switcher */}
                                   <div className="flex items-center gap-1 text-[8.5px] text-slate-400 shrink-0 font-bold select-none font-sans">
                                     <span>{lang === 'ar' ? 'ط³ط±ط¹ط©:' : 'SPEED:'}</span>
                                     {[1, 2, 5, 10].map(sp => (
                                       <button
                                         key={sp}
                                         onClick={() => setReplayState(p => ({ ...p, speed: sp }))}
                                         className={`px-1 rounded text-[8px] font-black cursor-pointer transition ${
                                           replayState.speed === sp 
                                             ? 'bg-indigo-600 text-white font-extrabold shadow' 
                                             : 'bg-slate-900 hover:text-white text-slate-400'
                                         }`}
                                       >
                                         {sp}x
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             ) : (
                               selectedStudent.questionTelemetry.length === 0 ? (
                                 <p className="text-[11px] text-gray-500 text-center py-4">
                                   {currentT.noTimelineDetails}
                                 </p>
                               ) : (
                                 <div className="space-y-3">
                                   {selectedStudent.questionTelemetry.map(q => {
                                     // Find suspicious solve (less than 15s in hard exam is abnormal)
                                     const isUnderTime = q.timeSpentSeconds < 15;
                                     const isCritical = isUnderTime && selectedStudent.examDifficulty === 'hard';
                                     return (
                                       <div key={q.questionId} className="space-y-1">
                                         <div className="flex justify-between text-[11px]">
                                           <span className="text-gray-300 font-medium">{currentT.qLabel} {q.questionNumber}</span>
                                           <div className="flex items-center gap-2">
                                             <span className="text-gray-400">{currentT.changesUnit} {q.changesCount} {lang === 'ar' ? 'ظ…ط±ط§طھ' : 'times'}</span>
                                             <span className={`font-mono font-bold ${isCritical ? 'text-red-400' : 'text-gray-300'}`}>
                                               {q.timeSpentSeconds} {currentT.secUnit}
                                             </span>
                                           </div>
                                         </div>
                                         <div className="w-full bg-gray-900 h-2.5 rounded overflow-hidden relative">
                                           <div
                                             style={{ width: `${Math.min(q.timeSpentSeconds / 5, 100)}%` }}
                                             className={`h-full rounded ${isCritical ? 'bg-red-500' : isUnderTime ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                                           ></div>
                                         </div>
                                         {isCritical && (
                                           <span className="text-[9px] text-red-400 block font-bold leading-none mt-0.5">
                                             {currentT.qCriticalWarning}
                                           </span>
                                         )}
                                       </div>
                                     );
                                   })}
                                 </div>
                               )
                             )}
                           </div>

                          {/* General telemetry timeline (Time parameters) */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold block">{currentT.statOffscreenMouse}</span>
                              <span className="text-md font-mono text-white font-extrabold block mt-1">{selectedStudent.mouseOutSeconds} {currentT.secUnit}</span>
                              <span className="text-[9px] text-slate-500 leading-tight block mt-1">{currentT.statOffscreenDesc}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold block border-b border-transparent">{currentT.statClientIp}</span>
                              <span className="text-xs font-mono text-slate-300 font-bold block mt-1 truncate" title={selectedStudent.ipAddresses.join(', ')}>
                                {selectedStudent.ipAddresses[0]}
                              </span>
                              <span className="text-[9px] text-slate-500 leading-tight block mt-1">
                                {selectedAnalysis.ipAddressConflict ? currentT.statIPConflictTrue : currentT.statIPConflictFalse}
                              </span>
                            </div>
                          </div>

                          {/* Risk Score Trend Chart */}
                          <div className={`rounded-lg p-4 space-y-2 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/80 border border-slate-800'}`}>
                            <div>
                              <h4 className={`text-xs font-extrabold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                                {lang === 'ar' ? 'طھط§ط±ظٹط® طھط·ظˆط± ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط³ظ„ظˆظƒظٹ ظ„ظ„ط·ط§ظ„ط¨ ط¹ط¨ط± ط§ظ„ط¬ظ„ط³ط§طھ' : 'Historical Behavioral Risk Score Trend'}
                              </h4>
                              <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                {lang === 'ar' 
                                  ? 'ظٹطھطھط¨ط¹ ظ‡ط°ط§ ط§ظ„ظ…ط®ط·ط· طھط·ظˆط± ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© ط§ظ„ط³ظ„ظˆظƒظٹ ط§ظ„ظ…ط³ط¬ظ„ ظ„ظ„ط·ط§ظ„ط¨ ط®ظ„ط§ظ„ ظپطھط±ط§طھ ط§ظ„ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ط­ط§ظ„ظٹط© ظˆط§ظ„ط³ط§ط¨ظ‚ط©.' 
                                  : 'This telemetry trend charts the trajectory of behavioral integrity risk indices for this candidate.'}
                              </p>
                            </div>
                            
                            <div className="h-44 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                  data={getHistoricalRunData(selectedStudent.studentId, selectedAnalysis.riskScore)}
                                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                                >
                                  <defs>
                                    <linearGradient id="forecastPattern" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                                  <XAxis 
                                    dataKey="session" 
                                    stroke={isLightMode ? '#64748b' : '#64748b'} 
                                    fontSize={9}
                                    tickLine={false}
                                  />
                                  <YAxis 
                                    stroke={isLightMode ? '#64748b' : '#64748b'} 
                                    fontSize={9}
                                    domain={[0, 100]}
                                    tickLine={false}
                                  />
                                  <RechartsTooltip
                                    contentStyle={{
                                      backgroundColor: isLightMode ? '#ffffff' : '#0f172a',
                                      borderColor: isLightMode ? '#cbd5e1' : '#334155',
                                      color: isLightMode ? '#0f172a' : '#f8fafc',
                                      fontSize: '11px',
                                      borderRadius: '6px'
                                    }}
                                  />
                                  <ReferenceLine
                                    y={riskThreshold}
                                    stroke="#ef4444"
                                    strokeDasharray="4 4"
                                    strokeWidth={2}
                                    label={{
                                      value: lang === 'ar' ? `ط­ط¯ ط§ظ„طھظ†ط¨ظٹظ‡ ${riskThreshold}%` : `Alert Limit ${riskThreshold}%`,
                                      fill: '#f87171',
                                      fontSize: 9,
                                      position: 'insideBottomRight',
                                      fontWeight: 'medium'
                                    }}
                                  />
                                  
                                  {/* Shaded Forecast Interval Boundary Region */}
                                  <Area
                                    type="monotone"
                                    dataKey="forecastMax"
                                    stroke="#818cf8"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                    fill="url(#forecastPattern)"
                                    name={lang === 'ar' ? 'ط£ظ‚طµظ‰ طھظ†ط¨ط¤ ظ…ط§ظ„ظٹ %' : 'Max Proj Risk %'}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="forecastMin"
                                    stroke="#312e81"
                                    strokeWidth={1.2}
                                    strokeDasharray="3 3"
                                    fill="transparent"
                                    name={lang === 'ar' ? 'ط£ط¯ظ†ظ‰ طھظ†ط¨ط¤ ظ…ط§ظ„ظٹ %' : 'Min Proj Risk %'}
                                  />

                                  {/* Historic and Actual current session line */}
                                  <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke={selectedAnalysis.riskScore >= 60 ? '#e11d48' : selectedAnalysis.riskScore >= 35 ? '#d97706' : '#059669'}
                                    strokeWidth={3.5}
                                    activeDot={{ r: 6 }}
                                    name={lang === 'ar' ? 'ط¯ط±ط¬ط© ط§ظ„ط®ط·ظˆط±ط© %' : 'Risk Score %'}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Integrating the security reports system with Gemini */}
                      <SecurityReport
                        studentId={selectedStudent.studentId}
                        studentName={selectedStudent.studentName}
                        reportData={selectedAnalysis}
                        onClose={() => {}}
                        lang={lang}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column (3 cols on lg): Sandbox Simulator Sidebar */}
                <div className="lg:col-span-3">
                  <MoodleSimulator 
                    onTelemetrySubmitted={handleReload} 
                    lang={lang} 
                    activeExamId={selectedExamId}
                    activeExamName={exams.find(ex => ex.id === selectedExamId) ? (lang === 'ar' ? exams.find(ex => ex.id === selectedExamId)!.nameAr : exams.find(ex => ex.id === selectedExamId)!.nameEn) : undefined}
                    activeExamDifficulty={exams.find(ex => ex.id === selectedExamId)?.difficulty}
                  />

                  {/* Cyber project quick academic helper info */}
                  <div className={`mt-4 rounded-xl p-4 shadow-xl ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                      <HelpCircle className="w-4 h-4" />
                      <span>{currentT.academicAdvisorBrief}</span>
                    </div>
                    <div className={`text-xs space-y-3 leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      <p>
                        <strong>{currentT.academicAdvisorConcept}</strong> {currentT.academicAdvisorConceptVal}
                      </p>
                      <p>
                        <strong>{currentT.academicAdvisorTech}</strong> {currentT.academicAdvisorTechVal}
                      </p>
                      <p>
                        <strong>{currentT.academicAdvisorIp}</strong> {currentT.academicAdvisorIpVal}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              </CollapsibleSection>
            </>

  );
}
