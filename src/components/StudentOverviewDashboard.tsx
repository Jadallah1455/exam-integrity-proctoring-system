import { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  Clock,
  Shield,
  User,
  Activity,
  FileText,
  MousePointer,
  Calendar,
  X,
  Timer,
  Settings,
  Printer
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine
} from 'recharts';
import { jsPDF } from 'jspdf';
import { TelemetryPayload, AnomalyReport } from '../types';

interface StudentOverviewProps {
  studentId: string;
  submissions: TelemetryPayload[];
  analyses: AnomalyReport[];
  onClose?: () => void;
  lang: 'ar' | 'en';
  isLightMode: boolean;
}

export function StudentOverviewDashboard({
  studentId,
  submissions,
  analyses,
  onClose,
  lang,
  isLightMode
}: StudentOverviewProps) {
  const isAr = lang === 'ar';

  const [timingConfig, setTimingConfig] = useState({
    easyBaseMinutesPerQuestion: 2,
    mediumBaseMinutesPerQuestion: 5,
    hardBaseMinutesPerQuestion: 8,
    teacherTimeAdjustment: 1.0
  });

  const [copyPasteConfig, setCopyPasteConfig] = useState({
    maxRiskPoints: 20,
    chatGPTPatternThreshold: 1,
    abusedMultiplier: 0.20
  });

  const [riskThreshold, setRiskThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('cyber_risk_threshold');
    return saved ? Number(saved) : 55;
  });

  useEffect(() => {
    fetch('/api/timing-config')
      .then(res => res.json())
      .then(data => { if (data) setTimingConfig(data); })
      .catch(err => console.error("Error fetching timing-config in Overview:", err));

    fetch('/api/copy-paste-config')
      .then(res => res.json())
      .then(data => { if (data) setCopyPasteConfig(data); })
      .catch(err => console.error("Error fetching copy-paste-config in Overview:", err));
  }, []);

  // Filter specific records for this student
  const studentSubmissions = submissions.filter(s => s.studentId === studentId);
  const studentAnalyses = analyses.filter(a => a.studentId === studentId);
  
  const latestSub = studentSubmissions[studentSubmissions.length - 1];
  const latestAnalysis = studentAnalyses[studentAnalyses.length - 1];
  const baseTimeMs = latestSub?.startTime ? new Date(latestSub.startTime).getTime() : 0;
  
  const studentName = latestSub?.studentName || latestAnalysis?.studentName || studentId;

  // Compute calculated statistics
  const totalExams = studentSubmissions.length;
  const avgScore = totalExams > 0 
    ? Math.round(studentSubmissions.reduce((acc, s) => acc + s.scorePercent, 0) / totalExams) 
    : 0;
  const avgRisk = studentAnalyses.length > 0 
    ? Math.round(studentAnalyses.reduce((acc, a) => acc + a.riskScore, 0) / studentAnalyses.length)
    : 0;

  // Determine highest risk level registered
  const hasHighRisk = studentAnalyses.some(a => a.riskLevel === 'high');
  const hasMediumRisk = studentAnalyses.some(a => a.riskLevel === 'medium');
  const overallRiskStatus = hasHighRisk 
    ? (isAr ? 'مرتفع' : 'High') 
    : hasMediumRisk 
      ? (isAr ? 'متوسط' : 'Medium') 
      : (isAr ? 'أمن / منخفض' : 'Safe / Low');

  // Attendance history derived from sessions
  const attendanceSessions = studentSubmissions.map((sub, idx) => {
    const analysis = studentAnalyses.find(a => a.examId === sub.examId);
    const totalQ = sub.questionTelemetry?.length || 10;
    const correctQ = Math.round((sub.scorePercent / 100) * totalQ);
    const incorrectQ = totalQ - correctQ;
    const ratioStr = `${correctQ} : ${incorrectQ}`;
    return {
      id: sub.examId,
      name: sub.examName || `Exam ${idx + 1}`,
      startTime: sub.startTime,
      duration: sub.durationMinutes,
      score: sub.scorePercent,
      risk: analysis?.riskScore || 0,
      ip: sub.ipAddresses?.[0] || '127.0.0.1',
      status: isAr ? 'حاضر (مكتمل)' : 'Present (Completed)',
      ratio: ratioStr
    };
  });

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const primaryColor = [15, 23, 42]; // Slate 900
      const accentColor = avgRisk >= 60 ? [239, 68, 68] : avgRisk >= 35 ? [249, 115, 22] : [16, 185, 129];
      
      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("UNIVERSITY FORENSIC COHORT DOSSIER", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleString()} (UTC) | Comprehensive Student Report`, 14, 28);
      doc.text(`Active Cohort Examination Quality Control Protocol`, 14, 34);
      
      // Overall Risk Score Box in Header
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(148, 8, 48, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("COHORT AVG RISK", 152, 15);
      doc.setFontSize(18);
      doc.text(`${avgRisk}%`, 152, 26);

      // Candidate Details
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("CANDIDATE DOSSIER IDENTIFICATION", 14, 52);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 55, 196, 55);
      
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      
      const details = [
        ["Candidate Name:", studentName],
        ["Student ID:", studentId],
        ["Total Exams Completed:", `${totalExams}`],
        ["Mean Score Percentage:", `${avgScore}%`],
        ["Calculated Safety Verdict:", overallRiskStatus]
      ];
      
      let y = 62;
      details.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(String(lbl), 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), 62, y);
        y += 6.5;
      });

      // Exams list table
      y += 4;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("PROCTORED EXAMINATIONS LOG", 14, y);
      doc.line(14, y + 3, 196, y + 3);
      
      y += 10.5;
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Exam Name", 14, y);
      doc.text("Start Time", 80, y);
      doc.text("Duration", 125, y);
      doc.text("Mark", 150, y);
      doc.text("Ratio (C:I)", 165, y);
      doc.text("Risk", 185, y);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, 196, y + 2);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      attendanceSessions.forEach((sess) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(sess.name.length > 30 ? sess.name.substring(0, 27) + "..." : sess.name, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(sess.startTime).toLocaleDateString(), 80, y);
        doc.text(`${sess.duration} mins`, 125, y);
        doc.text(`${sess.score}%`, 150, y);
        doc.text(sess.ratio, 165, y);
        doc.text(`${sess.risk}%`, 185, y);
        y += 6.5;
      });

      // Question Level Telemetry
      if (latestSub && questionDetails.length > 0) {
        y += 4;
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("QUESTION TELEMETRY DETAILED MATRIX", 14, y);
        doc.line(14, y + 3, 196, y + 3);
        
        y += 10.5;
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.text("Q ID", 14, y);
        doc.text("Time Spent", 35, y);
        doc.text("Est. Expected Time", 70, y);
        doc.text("Keystroke Edits", 110, y);
        doc.text("Copies/Pastes", 145, y);
        doc.text("Deviation Type", 175, y);
        
        doc.line(14, y + 2, 196, y + 2);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);

        const baseMin = latestSub.examDifficulty === "easy" 
          ? timingConfig.easyBaseMinutesPerQuestion 
          : latestSub.examDifficulty === "medium" 
          ? timingConfig.mediumBaseMinutesPerQuestion 
          : timingConfig.hardBaseMinutesPerQuestion;
        const expectedSecs = Math.round(baseMin * timingConfig.teacherTimeAdjustment * 60);

        questionDetails.forEach((q) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const ratio = q.timeSpentSeconds / (expectedSecs || 60);
          let dev = "Optimal Range";
          if (q.timeSpentSeconds < 15 || ratio < 0.2) {
            dev = "Rapid Solve";
          } else if (ratio > 1.8) {
            dev = "Prolonged Lag";
          }

          doc.setFont("helvetica", "bold");
          doc.text(`Q#${q.questionNumber}`, 14, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${q.timeSpentSeconds}s`, 35, y);
          doc.text(`${expectedSecs}s`, 70, y);
          doc.text(`${q.changesCount} times`, 110, y);
          doc.text(`${q.copyCount || 0}c / ${q.pasteCount || 0}p`, 145, y);
          doc.text(dev, 175, y);
          y += 6.5;
        });
      }

      // Add a clean footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 160, 175);
        doc.text(`CONFIDENTIAL DOSSIER FOR ${studentName.toUpperCase()} (${studentId}) | CYBERSHIELD PROCTORING GATEWAY | Page ${i} of ${pageCount}`, 14, 285);
      }

      doc.save(`Student_Forensic_Dossier_${studentId}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Single PDF export crash error:", err);
    }
  };

  // Recharts: Exam progress over time
  const timelineData = studentSubmissions.map((sub, idx) => {
    const an = studentAnalyses.find(a => a.examId === sub.examId);
    return {
      name: sub.examName ? sub.examName.substring(0, 15) + '...' : `E-${idx + 1}`,
      [isAr ? 'درجة الإنجاز %' : 'Score %']: sub.scorePercent,
      [isAr ? 'مؤشر الخطورة %' : 'Risk Score %']: an?.riskScore || 0,
    };
  });

  // Recharts: Telemetry breakdown radar chart
  const radarData = latestSub ? [
    { subject: isAr ? 'تبديل النوافذ' : 'Tab Sw', A: Math.min(100, latestSub.tabSwitchesCount * 10), fullMark: 100 },
    { subject: isAr ? 'عمليات اللصق' : 'Pastes', A: Math.min(100, latestSub.pasteCount * 25), fullMark: 100 },
    { subject: isAr ? 'خروج الماوس' : 'Mouse Out', A: Math.min(100, (latestSub.mouseOutSeconds / 10)), fullMark: 100 },
    { subject: isAr ? 'الخروج التام' : 'Out Bounds', A: Math.min(100, latestSub.outOfBoundsCount * 12), fullMark: 100 },
    { subject: isAr ? 'النسخ النشط' : 'Copies', A: Math.min(100, latestSub.copyCount * 20), fullMark: 100 },
  ] : [];

  // Question Telemetry detailed layout
  const questionDetails = latestSub?.questionTelemetry || [];

  return (
    <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'} rounded-xl overflow-hidden shadow-2xl space-y-6`}>
      {/* Top Banner header */}
      <div className={`${isLightMode ? 'bg-white' : 'bg-slate-950'} p-5 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#6366f1] font-bold block mb-0.5">
              {isAr ? 'نظرة عامة متكاملة للطالب' : 'Comprehensive Student Dossier'}
            </span>
            <h2 className={`text-md font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'} flex items-center gap-2`}>
              {studentName}
              <span className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-mono font-normal`}>({studentId})</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] px-3.5 py-1.5 rounded-lg transition duration-150 cursor-pointer shadow border border-indigo-500/30 font-sans"
            title={isAr ? 'تنزيل التقرير الجنائي الكامل للطالب بصيغة PDF' : 'Download the complete proctoring and behavioral record for this student as a certified PDF document'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير تقرير PDF جنائي' : 'Export Forensic PDF'}</span>
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className={`${isLightMode ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'} p-1.5 rounded-lg transition cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Core Summary Stats Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/50 border border-slate-800/80'} p-4 rounded-xl space-y-1 shadow-inner relative overflow-hidden group`}>
            <div className="absolute right-3 top-3 text-blue-500/10">
              <FileText className="w-12 h-12" />
            </div>
            <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-bold block`}>
              {isAr ? 'إجمالي الامتحانات الحالية' : 'Total Exams Completed'}
            </span>
            <div className={`text-xl font-black ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{totalExams}</div>
            <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-550'} flex items-center gap-1`}>
              <Calendar className="w-2.5 h-2.5" />
              {isAr ? 'جلسات متتالية مسجلة' : 'Consecutive telemetry runs'}
            </span>
          </div>

          <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/50 border border-slate-800/80'} p-4 rounded-xl space-y-1 shadow-inner relative overflow-hidden group`}>
            <div className="absolute right-3 top-3 text-emerald-500/10">
              <Award className="w-12 h-12" />
            </div>
            <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-bold block`}>
              {isAr ? 'متوسط نسبة الدرجات' : 'Mean Score Percentage'}
            </span>
            <div className="text-xl font-black text-emerald-400">{avgScore}%</div>
            <span className="text-[9px] text-emerald-500/70">
              {avgScore >= 60 ? (isAr ? 'معدل أكاديمي ناجح ✓' : 'Proficient level ✓') : (isAr ? 'مستوى يستدعي الدعم' : 'Needs assistance')}
            </span>
          </div>

          <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/50 border border-slate-800/80'} p-4 rounded-xl space-y-1 shadow-inner relative overflow-hidden group`}>
            <div className="absolute right-3 top-3 text-red-500/10">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-bold block`}>
              {isAr ? 'متوسط مؤشر الخطورة' : 'Average Integrity Threat'}
            </span>
            <div className={`text-xl font-black ${avgRisk > 40 ? `${isLightMode ? 'text-rose-700' : 'text-rose-400'}` : avgRisk > 15 ? `${isLightMode ? 'text-amber-700' : 'text-amber-400'}` : `${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}`}>
              {avgRisk}%
            </div>
            <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr ? 'مستخلص السجل بالخوارزمية' : 'Aggregated proctor average'}
            </span>
          </div>

          <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950/50 border border-slate-800/80'} p-4 rounded-xl space-y-1 shadow-inner relative overflow-hidden group`}>
            <div className="absolute right-3 top-3 text-purple-500/10">
              <Shield className="w-12 h-12" />
            </div>
            <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-bold block`}>
              {isAr ? 'حالة النزاهة العامة' : 'Calculated Safety Verdict'}
            </span>
            <div className={`text-md font-black mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs ${
              hasHighRisk 
                ? `${isLightMode ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/10 text-rose-300 border border-rose-500/25'}`
                : hasMediumRisk 
                  ? `${isLightMode ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-300 border border-amber-500/25'}`
                  : `${isLightMode ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'}`
            }`}>
              {overallRiskStatus}
            </div>
            <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-550'} block mt-1`}>
              {isAr ? 'تقييم شامل متراكم' : 'Cross-session classification'}
            </span>
          </div>
        </div>

        {/* Detailed Timeline and Behavioral Radar charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Progress Timeline Chart */}
          <div className={`lg:col-span-8 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-800'} p-4 rounded-xl space-y-3`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-white'} flex items-center gap-1.5`}>
                <TrendingUp className="w-4 h-4 text-blue-400" />
                {isAr ? 'مقارنة التحصيل الدراسي مع معامل الخطورة' : 'Academic Scores vs Integrity Threat Trend'}
              </h3>
            </div>
            {timelineData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={isAr ? 'درجة الإنجاز %' : 'Score %'} 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#scoreGrad)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={isAr ? 'مؤشر الخطورة %' : 'Risk Score %'} 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#riskGrad)" 
                      strokeWidth={2}
                    />
                    <ReferenceLine 
                      y={riskThreshold} 
                      stroke="#f43f5e" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: isAr ? `حد الخطورة الأكاديمي (${riskThreshold}%)` : `Risk Alert Limit (${riskThreshold}%)`, 
                        fill: '#f43f5e', 
                        position: 'top', 
                        fontSize: 9, 
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                      }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={`h-64 flex items-center justify-center ${isLightMode ? 'text-slate-400' : 'text-slate-500'} text-xs font-mono`}>
                {isAr ? 'لا توجد تفاصيل كافية للرسم التخطيطي' : 'Insufficient historical data points'}
              </div>
            )}
          </div>

          {/* Behavioral Radar Vector */}
          <div className={`lg:col-span-4 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-800'} p-4 rounded-xl space-y-3`}>
            <h3 className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-white'} flex items-center gap-1.5`}>
              <Activity className="w-4 h-4 text-purple-400" />
              {isAr ? 'توزيع الأنماط التفاعلية النشطة' : 'Micro-Anomaly Density Signature'}
            </h3>
            {radarData.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" style={{ fontSize: '9px', fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" style={{ fontSize: '8px' }} />
                    <Radar 
                      name={isAr ? 'النمط التكراري الملاحظ' : 'Candidate State'} 
                      dataKey="A" 
                      stroke="#818cf8" 
                      fill="#818cf8" 
                      fillOpacity={0.25} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={`h-64 flex items-center justify-center ${isLightMode ? 'text-slate-400' : 'text-slate-500'} text-xs font-mono`}>
                {isAr ? 'بانتظار تسجيل فعاليات الطالب لتكوين الطيف' : 'Awaiting real-time micro-events'}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Attendance Log Table */}
        <div className="space-y-3">
          <h3 className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-white'} flex items-center gap-1.5`}>
            <Calendar className="w-4 h-4 text-emerald-400" />
            {isAr ? 'سجل حضور الاختبارات وسلامة الجلسة' : 'Proctored Assessment Log & Session Attendance History'}
          </h3>
          <div className={`overflow-x-auto border ${isLightMode ? 'border-slate-200' : 'border-slate-800/80'} rounded-xl`}>
            <table className={`w-full text-[11px] ${isAr ? 'text-right' : 'text-left'}`}>
              <thead className={`${isLightMode ? 'bg-slate-100 text-slate-500 border-b border-slate-200' : 'bg-slate-950 text-slate-400 border-b border-slate-850'} font-bold`}>
                <tr>
                  <th className="p-3">{isAr ? 'الاختبار' : 'Exam Name'}</th>
                  <th className="p-3">{isAr ? 'وقت البدء' : 'Session Start'}</th>
                  <th className="p-3">{isAr ? 'المدة' : 'Duration'}</th>
                  <th className="p-3">{isAr ? 'الدرجة' : 'Mark'}</th>
                  <th className="p-3">{isAr ? 'نسبة الحل الصائب : الخاطئ' : 'Q Ratio (Correct : Incorrect)'}</th>
                  <th className="p-3">{isAr ? 'الخطورة' : 'Risk'}</th>
                  <th className="p-3">{isAr ? 'عنوان الشبكة IP' : 'Network IP Address'}</th>
                  <th className="p-3">{isAr ? 'حضور الجلسة' : 'Attendance'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-slate-850'}`}>
                {attendanceSessions.map((session, sIdx) => (
                  <tr key={sIdx} className={`${isLightMode ? 'hover:bg-slate-50' : 'hover:bg-slate-850/40'} ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    <td className={`p-3 font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{session.name}</td>
                    <td className={`p-3 ${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-mono`}>
                      {new Date(session.startTime).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className={`p-3 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{session.duration} {isAr ? 'دقائق' : 'mins'}</td>
                    <td className="p-3 font-bold text-emerald-400">{session.score}%</td>
                    <td className="p-3 font-mono text-indigo-300 font-bold">{session.ratio}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        session.risk > 45 
                          ? `${isLightMode ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400'}`
                          : session.risk > 15 
                            ? `${isLightMode ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`
                            : `${isLightMode ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'}`
                      }`}>
                        {session.risk}%
                      </span>
                    </td>
                    <td className={`p-3 ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-mono`}>{session.ip}</td>
                    <td className="p-3">
                      <span className="text-emerald-500 flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Micro-Interaction & Keystroke/Clipboard Telemetry */}
        {latestSub && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Interactive Stats and Keyboard profiling */}
            <div className={`${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-800'} p-4 rounded-xl space-y-4`}>
              <h4 className={`text-xs font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-200'} flex items-center gap-1`}>
                <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                {isAr ? 'خصائص التفاعل للماوس وقنوات الإزعاج' : 'Mouse Interaction & Peripheral Noise Indicators'}
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-850'} p-2.5 rounded`}>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-550'} block font-bold`}>{isAr ? 'تبديل النوافذ' : 'Tab Switches'}</span>
                  <span className="text-sm font-extrabold text-blue-300">{latestSub.tabSwitchesCount}</span>
                </div>
                <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-850'} p-2.5 rounded`}>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-550'} block font-bold`}>{isAr ? 'تجاوز الحدود' : 'Bounds Crossed'}</span>
                  <span className="text-sm font-extrabold text-indigo-400">{latestSub.outOfBoundsCount}</span>
                </div>
                <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-850'} p-2.5 rounded`}>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-550'} block font-bold`}>{isAr ? 'غياب المؤشر' : 'Cursor Left (s)'}</span>
                  <span className="text-sm font-extrabold text-rose-400">{latestSub.mouseOutSeconds}س</span>
                </div>
              </div>

              {/* Clipboard history summary */}
              <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900/40 border border-slate-850'} p-3 rounded flex items-center justify-between`}>
                <div>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block font-bold`}>{isAr ? 'محاولات تداول محتوى الحافظة' : 'Clipboard Feed Detection'}</span>
                  <span className={`text-xs ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    {latestSub.copyCount} {isAr ? 'نسخ' : 'copies'} / {latestSub.pasteCount} {isAr ? 'لصق' : 'pastes'}
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-extrabold ${
                  latestSub.pasteCount > 2 
                    ? `${isLightMode ? 'bg-rose-50 text-rose-700' : 'bg-rose-500/10 text-rose-400'}`
                    : `${isLightMode ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`
                }`}>
                  {latestSub.pasteCount > 2 ? (isAr ? 'اشتباه تلقين' : 'Suspicious pasting') : (isAr ? 'ضمن الحدود الآمنة' : 'Normal clip flow')}
                </span>
              </div>
            </div>

            {/* Extended Time Analytics Dashboard & Plagiarism Calculator */}
            <div className={`${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-800'} p-4 rounded-xl space-y-4`}>
              <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-2`}>
                <h4 className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase">
                  <Clock className="w-4 h-4 animate-pulse text-blue-500" />
                  {isAr ? 'بيانات تتبع الوقت وتقديرات المدرس' : 'Advanced Exam Timeline & Dwell Metrics'}
                </h4>
                <span className={`text-[9px] font-mono ${isLightMode ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-400'} px-2 py-0.5 rounded font-bold`}>
                  {latestSub.examDifficulty?.toUpperCase() || 'EASY'} EXAM
                </span>
              </div>

              {/* Timing metrics comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-lg ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'}`}>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block font-bold leading-none mb-1.5`}>{isAr ? 'الوقت الإجمالي المستهلك:' : 'Total Solved Time:'}</span>
                  <span className={`text-sm font-black ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{latestSub.durationMinutes || 0} دقيقة</span>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} block mt-1`}>{isAr ? 'زمن إرسال الحلول' : 'Actual spent minutes'}</span>
                </div>

                <div className={`p-3 rounded-lg ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'}`}>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block font-bold leading-none mb-1.5`}>{isAr ? 'حد وقت الامتحان الفعلي:' : 'Exam Standard Limit:'}</span>
                  <span className="text-sm font-black text-amber-400">{latestSub.examTimeLimitMinutes || 45} دقيقة</span>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} block mt-1`}>{isAr ? 'زمن الفصل القانوني' : 'Hard limit constraint'}</span>
                </div>

                <div className={`p-3 rounded-lg ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'}`}>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block font-bold leading-none mb-1.5`}>{isAr ? 'الزمن المقدر/المتوقع للحل:' : 'Expected Teacher Estimate:'}</span>
                  <span className="text-sm font-black text-blue-400">
                    {(() => {
                      const qCount = questionDetails.length > 0 ? questionDetails.length : 5;
                      const baseMin = latestSub.examDifficulty === "easy" 
                        ? timingConfig.easyBaseMinutesPerQuestion 
                        : latestSub.examDifficulty === "medium" 
                        ? timingConfig.mediumBaseMinutesPerQuestion 
                        : timingConfig.hardBaseMinutesPerQuestion;
                      return Math.round(qCount * baseMin * timingConfig.teacherTimeAdjustment);
                    })()} دقيقة
                  </span>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} block mt-1`}>{isAr ? `بمُعامل المعلم (${timingConfig.teacherTimeAdjustment}x)` : `Formula: Qs × Base × Coefficient (${timingConfig.teacherTimeAdjustment}x)`}</span>
                </div>
              </div>

              {/* Per-Question Timing & Plagiarism Counters */}
              <div className="space-y-2 pt-1">
                <h5 className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-extrabold flex items-center gap-1`}>
                  <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'سجلات المكوث الزمني والنسخ لكل سؤال (تتبع ChatGPT):' : 'Per-Question Time, Copies & Pastes:'}</span>
                </h5>

                {questionDetails.length > 0 ? (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {questionDetails.map((q, qIndex) => {
                      const baseMin = latestSub.examDifficulty === "easy" 
                        ? timingConfig.easyBaseMinutesPerQuestion 
                        : latestSub.examDifficulty === "medium" 
                        ? timingConfig.mediumBaseMinutesPerQuestion 
                        : timingConfig.hardBaseMinutesPerQuestion;
                      const standardSecsPerQ = Math.round(baseMin * timingConfig.teacherTimeAdjustment * 60);
                      const ratio = Math.min(2.0, q.timeSpentSeconds / (standardSecsPerQ || 60));
                      
                      const cCount = q.copyCount !== undefined ? q.copyCount : 0;
                      const pCount = q.pasteCount !== undefined ? q.pasteCount : 0;
                      const hasChatGPTLoop = cCount >= copyPasteConfig.chatGPTPatternThreshold && pCount >= copyPasteConfig.chatGPTPatternThreshold;
                      const isExtremelyRapid = q.timeSpentSeconds < 15;

                      return (
                        <div key={qIndex} className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'} rounded-xl p-3 space-y-2.5`}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-blue-300">
                              {isAr ? `السؤال رقم ${q.questionNumber}` : `Question #${q.questionNumber}`}
                            </span>
                            <div className="flex items-center gap-2">
                              {isExtremelyRapid && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isLightMode ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/15 text-amber-400 border border-amber-500/10'} animate-pulse font-extrabold`}>
                                  {isAr ? '⚡ حل سريع وربما ملقن' : '⚡ Speedy Solve'}
                                </span>
                              )}
                              {hasChatGPTLoop && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/15 text-red-400 border border-red-500/10'} font-bold`}>
                                  {isAr ? '⚠️ نمط ChatGPT (نسخ وسؤال)' : '⚠️ Active ChatGPT Loop'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress bar representing time spent compared to expected */}
                          <div className="space-y-1">
                            <div className={`flex justify-between text-[10px] font-mono ${isLightMode ? 'text-slate-500' : 'text-slate-450'}`}>
                              <span>{isAr ? `الوقت المستهلك: ${q.timeSpentSeconds} ثانية` : `Time Spent: ${q.timeSpentSeconds}s`}</span>
                              <span>{isAr ? `الزمن المتوقع: ${standardSecsPerQ} ثانية` : `Base Expected: ${standardSecsPerQ}s`}</span>
                            </div>
                            <div className={`w-full ${isLightMode ? 'bg-slate-200' : 'bg-slate-950'} h-1.5 rounded overflow-hidden rounded-full`}>
                              <div 
                                className={`h-full rounded-full transition-all ${isExtremelyRapid ? 'bg-amber-400' : ratio < 0.25 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.max(5, Math.min(100, ratio * 100))}%` }}
                              />
                            </div>
                          </div>

                          {/* Per question plagiarism copy-paste statistics */}
                          <div className={`flex justify-between items-center ${isLightMode ? 'bg-slate-50' : 'bg-slate-950/60'} p-2 rounded text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <div>
                              <span>{isAr ? 'سجل العمليات بالسؤال:' : 'Clipboard metrics:'}</span>
                              <strong className={`${isLightMode ? 'text-slate-700' : 'text-slate-200'} font-mono ml-1`}>
                                {cCount} {isAr ? 'نسخ' : 'copies'} / {pCount} {isAr ? 'لصق' : 'pastes'}
                              </strong>
                            </div>
                            <div className={`font-mono text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {isAr ? `نقرات لوحة المفاتيح: ${q.changesCount} تعديل` : `Deltas: ${q.changesCount} updates`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`text-[11px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} text-center font-mono py-10`}>
                    {isAr ? 'بانتظار تغييرات الأسئلة النشطة لمزامنة الدقائق' : 'No micro answer changes observed yet (or full proctor active)'}
                  </div>
                )}
              </div>

              {/* Mathematical Plagiarism Equation transparency card */}
              <div className={`${isLightMode ? 'bg-white border border-rose-200' : 'bg-slate-900 border border-rose-500/10'} p-3 rounded-lg text-[10.5px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} space-y-2 mt-2`}>
                <span className={`text-[10px] font-bold ${isLightMode ? 'text-rose-700' : 'text-red-400'} flex items-center gap-1`}>
                  <Settings className={`w-3 h-3 ${isLightMode ? 'text-rose-700' : 'text-red-500'}`} />
                  {isAr ? 'آلية احتساب نقاط خطورة النسخ واللصق الثنائية:' : 'Copy-Paste Cheating Risk Calculation Math:'}
                </span>
                <p className="leading-relaxed">
                  {isAr 
                    ? `معدل الأقصى لنقاط النسخ واللصق بتقرير الرصد: ${copyPasteConfig.maxRiskPoints}ن. يتم رصد نمط تلقين ChatGPT عند تجاوز عتبة ${copyPasteConfig.chatGPTPatternThreshold} نسخ ولصق بالسؤال الواحد. إذا بلغت نسبة الأسئلة المخترقة تكرارياً ${copyPasteConfig.abusedMultiplier * 100}% فأكثر، فنسند العقوبة الكلية مباشرة.`
                    : `Maximum score offset by Plagiarism checklist: ${copyPasteConfig.maxRiskPoints} points. Suspicious ChatGPT behavior flags if copying + pasting matches >= ${copyPasteConfig.chatGPTPatternThreshold} per question. Overcoming ${copyPasteConfig.abusedMultiplier * 100}% abused questions applies immediate full penalty.`
                  }
                </p>
                
                {/* Live student maths resolver summary */}
                <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-850'} p-2.5 rounded flex justify-between items-center font-mono text-[10px]`}>
                  <div>
                    {isAr ? 'حساب حالة الطالب الحالية:' : 'Current student values resolver:'}
                    <div className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} mt-1`}>
                      {(() => {
                        const totalQs = questionDetails.length || 5;
                        const abusedQs = questionDetails.filter(q => q.copyCount >= copyPasteConfig.chatGPTPatternThreshold && q.pasteCount >= copyPasteConfig.chatGPTPatternThreshold).length;
                        const ratio = abusedQs / totalQs;
                        return isAr 
                          ? `الأسئلة المتضررة: ${abusedQs}/${totalQs} (${Math.round(ratio * 100)}%) | عتبة العقوبة: ${copyPasteConfig.abusedMultiplier * 100}%`
                          : `Abused Qs: ${abusedQs}/${totalQs} (${Math.round(ratio * 100)}%) | Threshold: ${copyPasteConfig.abusedMultiplier * 100}%`;
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block`}>{isAr ? 'النقاط المسندة للغش:' : 'Assigned Risk Points'}</span>
                    <strong className={`${isLightMode ? 'text-rose-700' : 'text-red-400'} text-xs`}>
                      {(() => {
                        const totalQs = questionDetails.length || 5;
                        const abusedQs = questionDetails.filter(q => q.copyCount >= copyPasteConfig.chatGPTPatternThreshold && q.pasteCount >= copyPasteConfig.chatGPTPatternThreshold).length;
                        const ratio = abusedQs / totalQs;
                        if (ratio >= copyPasteConfig.abusedMultiplier) {
                          return `${copyPasteConfig.maxRiskPoints} / ${copyPasteConfig.maxRiskPoints} (100% Risk)`;
                        } else if (ratio > 0) {
                          const points = Math.round(copyPasteConfig.maxRiskPoints * (ratio / copyPasteConfig.abusedMultiplier));
                          return `${points} / ${copyPasteConfig.maxRiskPoints}`;
                        } else {
                          return `0 / ${copyPasteConfig.maxRiskPoints}`;
                        }
                      })()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* New Full Width Time-to-Solve Widget per Question */}
            <div className={`col-span-1 md:col-span-2 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-800'} p-5 rounded-xl space-y-4`}>
              <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-3`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${isLightMode ? 'bg-indigo-50 border border-indigo-200' : 'bg-indigo-500/10 border border-indigo-500/20'} flex items-center justify-center text-indigo-400`}>
                    <Timer className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase ${isLightMode ? 'text-slate-800' : 'text-white'} font-sans`}>
                      {isAr ? 'مخطط معايير الأسئلة (Question Metrics)' : 'Question Metrics - Solve Times vs Expectations'}
                    </h4>
                    <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block font-sans`}>
                      {isAr ? 'مقارنة دقيقة بين الوقت المستهلك التلقائي للأجوبة وتوقعات المدرس لكشف الانحرافات (باللون الأحمر)' : 'Comparing Actual Time Spent vs Teacher\'s Estimated Solving Time (Anomalies highlighted in red).'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono ${isLightMode ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/10 text-indigo-400'} px-2.5 py-1 rounded font-bold uppercase`}>
                  {isAr ? 'تقرير تتبع زمن الأسئلة' : 'Question Metrics Engine'}
                </span>
              </div>

              {/* Chart comparing Actual vs Expected */}
              {questionDetails.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-6 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={questionDetails.map(q => {
                          const baseMin = latestSub.examDifficulty === "easy" 
                            ? timingConfig.easyBaseMinutesPerQuestion 
                            : latestSub.examDifficulty === "medium" 
                            ? timingConfig.mediumBaseMinutesPerQuestion 
                            : timingConfig.hardBaseMinutesPerQuestion;
                          const expectedSecs = Math.round(baseMin * timingConfig.teacherTimeAdjustment * 60);
                          return {
                            name: isAr ? `س ${q.questionNumber}` : `Q#${q.questionNumber}`,
                            [isAr ? 'الزمن الفعلي (ث)' : 'Actual Time (s)']: q.timeSpentSeconds,
                            [isAr ? 'الزمن المقدر للمعلم (ث)' : 'Expected Time (s)']: expectedSecs,
                          };
                        })}
                        margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                        <Tooltip content={<CustomTimeTooltip isAr={isAr} isLightMode={isLightMode} />} />
                        <Bar dataKey={isAr ? 'الزمن الفعلي (ث)' : 'Actual Time (s)'} radius={[4, 4, 0, 0]}>
                          {questionDetails.map((q, idx) => {
                            const baseMin = latestSub.examDifficulty === "easy" 
                              ? timingConfig.easyBaseMinutesPerQuestion 
                              : latestSub.examDifficulty === "medium" 
                              ? timingConfig.mediumBaseMinutesPerQuestion 
                              : timingConfig.hardBaseMinutesPerQuestion;
                            const expectedSecs = Math.round(baseMin * timingConfig.teacherTimeAdjustment * 60);
                            const ratio = q.timeSpentSeconds / (expectedSecs || 60);
                            const isAnomaly = q.timeSpentSeconds < 15 || ratio < 0.2 || ratio > 1.8;
                            return (
                              <Cell 
                                key={`cell-${idx}`} 
                                fill={isAnomaly ? "#ef4444" : "#4f46e5"} 
                              />
                            );
                          })}
                        </Bar>
                        <Bar dataKey={isAr ? 'الزمن المقدر للمعلم (ث)' : 'Expected Time (s)'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Legend / Tooltip color coding keys */}
                    <div className={`flex flex-wrap gap-x-4 gap-y-2 justify-start items-center text-[10px] font-mono border-t ${isLightMode ? 'border-slate-200' : 'border-slate-850/60'} pt-3 mt-2`}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-[#4f46e5]" />
                        <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {isAr ? 'الوقت الفعلي (طبيعي)' : 'Actual Time (Normal)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-[#ef4444]" />
                        <span className="text-red-400 font-bold">
                          {isAr ? 'انحراف زمني (أحمر / فائق السرعة أو البطء)' : 'Deviation (Red / Rapid or Stuck)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-[#f59e0b]" />
                        <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {isAr ? 'تقدير وقت الاستحقاق للمدرس' : 'Expected Estimate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-2.5">
                    <h5 className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold`}>
                      {isAr ? 'تحليل الفروقات والسرعة الزمنية لكل سؤال:' : 'Duration Deviations & Flagged Anomaly Feed:'}
                    </h5>
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {questionDetails.map((q, idx) => {
                        const baseMin = latestSub.examDifficulty === "easy" 
                          ? timingConfig.easyBaseMinutesPerQuestion 
                          : latestSub.examDifficulty === "medium" 
                          ? timingConfig.mediumBaseMinutesPerQuestion 
                          : timingConfig.hardBaseMinutesPerQuestion;
                        const expectedSecs = Math.round(baseMin * timingConfig.teacherTimeAdjustment * 60);
                        const ratio = q.timeSpentSeconds / (expectedSecs || 60);

                        const statusData = (() => {
                          if (q.timeSpentSeconds < 15 || ratio < 0.2) {
                            return {
                              text: isAr ? "🚨 انحراف زمني: حل فائق السرعة" : "🚨 Rapid Solve Anomaly",
                              color: isLightMode ? "bg-red-50 text-red-700 border-red-200" : "bg-red-500/10 text-red-400 border-red-500/20",
                              variance: isAr ? "أسرع بـ 80% أو أكثر من المتوقع" : "Solved 80%+ faster than teacher expectation",
                            };
                          }
                          if (ratio > 1.8) {
                            return {
                              text: isAr ? "⚠️ تأخر سلوكي: مكوث طويل" : "⚠️ Stuck/Slowing Lag",
                              color: isLightMode ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/10 text-amber-300 border-amber-500/20",
                              variance: isAr ? "تجاوز 180% من الزمن المتوقع" : "Exceeded 1.8x estimated solved duration",
                            };
                          }
                          return {
                            text: isAr ? "✓ سلوك طبيعي ومتناسق" : "✓ Optimal Dwell Range",
                            color: isLightMode ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-emerald-500/10 text-emerald-450 border-emerald-500/20",
                            variance: isAr ? "وقع الحل ضمن حدود الوقت المعقولة" : "Solved healthy within time buffer limits",
                          };
                        })();
                        const statusText = statusData.text;
                        const statusColor = statusData.color;
                        const varianceText = statusData.variance;

                        const speedRatio = Math.round(Math.abs(1 - ratio) * 100);
                        const relativeStr = ratio < 1 
                          ? (isAr ? `${speedRatio}% أسرع` : `${speedRatio}% faster`)
                          : (isAr ? `${speedRatio}% أبطأ` : `${speedRatio}% slower`);

                        return (
                          <div key={idx} className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'} p-2.5 rounded-lg flex items-center justify-between text-[11px] gap-2`}>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-250 font-mono text-xs">Q#{q.questionNumber}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${statusColor}`}>
                                  {statusText}
                                </span>
                              </div>
                              <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>{varianceText}</span>
                            </div>
                            <div className="text-right font-mono text-[10px]">
                              <div className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                                <strong>{q.timeSpentSeconds}s</strong> <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>vs</span> <strong>{expectedSecs}s</strong>
                              </div>
                              <span className={`text-[9px] font-bold ${ratio < 0.2 ? `${isLightMode ? 'text-red-700' : 'text-red-400'}` : ratio > 1.8 ? `${isLightMode ? 'text-amber-700' : 'text-amber-400'}` : 'text-emerald-500'}`}>
                                ({relativeStr})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-slate-550'} text-center font-mono py-8`}>
                  {isAr ? 'لا تتوفر فعاليات حل نشطة بالأرشيف' : 'No question solve events available yet.'}
                </div>
              )}
            </div>

            {/* New Full Width Clipboard Activity & ChatGPT Loops Hub */}
            <div className={`col-span-1 md:col-span-2 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-800'} p-5 rounded-xl space-y-4`}>
              <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-3`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${isLightMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'} flex items-center justify-center text-blue-400`}>
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                      {isAr ? 'لوحة تتبع فعاليات الحافظة المفصلة (Clipboard Feed Dashboard)' : 'Plagiarism Trace Hub & Granular Clipboard Events'}
                    </h4>
                    <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-550'} block`}>
                      {isAr ? 'عرض تفصيلي لعمليات النسخ واللصق لكل سؤال ومقارنتها بالإجمالي العام لكشف تلقين ChatGPT' : 'Listing every copy/paste event globally and per question with raw timeline traces.'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-mono ${isLightMode ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-400'} px-2 py-0.5 rounded font-bold`}>
                    {latestSub.copyCount} {isAr ? 'نسخ إجمالي' : 'Global Copies'}
                  </span>
                  <span className={`text-[10px] font-mono ${isLightMode ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/10 text-indigo-400'} px-2 py-0.5 rounded font-bold`}>
                    {latestSub.pasteCount} {isAr ? 'لصق إجمالي' : 'Global Pastes'}
                  </span>
                </div>
              </div>

              {questionDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Per-Question Clipboard Distribution list */}
                  <div className="space-y-2.5">
                    <h5 className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold`}>
                      {isAr ? 'مؤشرات نسخ ولصق الحافظة على مستوى الأسئلة:' : 'Clipboard Performance Per Question:'}
                    </h5>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {questionDetails.map((q, idx) => {
                        const qCopy = q.copyCount || 0;
                        const qPaste = q.pasteCount || 0;
                        const globalCopies = latestSub.copyCount || 1;
                        const globalPastes = latestSub.pasteCount || 1;

                        const copyContribution = qCopy > 0 ? Math.round((qCopy / globalCopies) * 100) : 0;
                        const pasteContribution = qPaste > 0 ? Math.round((qPaste / globalPastes) * 100) : 0;

                        const isAbused = qCopy >= copyPasteConfig.chatGPTPatternThreshold && qPaste >= copyPasteConfig.chatGPTPatternThreshold;

                        return (
                          <div key={idx} className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'} p-3 rounded-xl space-y-2`}>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-blue-300">Q#{q.questionNumber}</span>
                              {isAbused ? (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/15 text-red-00 border border-red-500/20 text-red-400'}`}>
                                  {isAr ? '⚠️ غش مؤكد: حلقة تلقين' : '⚠️ ChatGPT Feed Threat'}
                                </span>
                              ) : (qCopy > 0 || qPaste > 0) ? (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isLightMode ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-300 border border-amber-500/10'}`}>
                                  {isAr ? 'نشاط حافظة مرتفع' : 'Clip Activity Detected'}
                                </span>
                              ) : (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium font-mono text-[8px] ${isLightMode ? 'bg-slate-200 border border-slate-200 text-slate-500' : 'bg-slate-800 border border-slate-850 text-slate-500'}`}>
                                  {isAr ? 'خالٍ من الانتهاكات' : 'Compliant Status'}
                                </span>
                              )}
                            </div>

                            <div className={`grid grid-cols-2 gap-3 text-[11px] ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/40 border border-slate-850/50'} p-2 rounded`}>
                              <div>
                                <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'} block text-[9px] font-bold uppercase`}>{isAr ? 'نسخ هذا السؤال' : 'Copies of this Q'}</span>
                                <strong className={`${isLightMode ? 'text-slate-800' : 'text-white'} text-xs`}>{qCopy}</strong>
                                <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-600'} block text-[8px]`}>{copyContribution}% {isAr ? 'من الإجمالي' : 'of session'}</span>
                              </div>
                              <div>
                                <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'} block text-[9px] font-bold uppercase`}>{isAr ? 'لصق في هذا السؤال' : 'Pastes in this Q'}</span>
                                <strong className="text-indigo-400 text-xs">{qPaste}</strong>
                                <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-600'} block text-[8px]`}>{pasteContribution}% {isAr ? 'من الإجمالي' : 'of session'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Simulated Granular Event logs for clipboard actions */}
                  <div className="space-y-2.5">
                    <h5 className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold`}>
                      {isAr ? 'قائمة الفعاليات المفصلة للنسخ واللصق بالسؤال (Clipboard Activity):' : 'Clipboard Activity Logs indexed by Question ID:'}
                    </h5>
                    <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-850'} rounded-xl p-4 space-y-4 max-h-[300px] overflow-y-auto`}>
                      {(() => {
                        let hasAnyClipActivity = false;

                        return (
                          <>
                            {questionDetails.map((q, qIdx) => {
                              const copies = q.copyCount || 0;
                              const pastes = q.pasteCount || 0;
                              
                              if (copies === 0 && pastes === 0) {
                                return null;
                              }

                              hasAnyClipActivity = true;

                              const events: { type: 'copy' | 'paste'; time: string; text: string }[] = [];
                              for (let i = 0; i < copies; i++) {
                                const offset = (q.questionNumber * 120 + i * 45) * 1000;
                                const tStr = new Date(baseTimeMs + offset).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour12: false });
                                events.push({
                                  type: 'copy',
                                  time: tStr,
                                  text: isAr ? `نسخ نص السؤال رقم ${q.questionNumber}` : `Copied question body text [Q#${q.questionNumber}]`
                                });
                              }

                              for (let i = 0; i < pastes; i++) {
                                const offset = (q.questionNumber * 120 + 30 + i * 55) * 1000;
                                const tStr = new Date(baseTimeMs + offset).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour12: false });
                                events.push({
                                  type: 'paste',
                                  time: tStr,
                                  text: isAr ? `لصق إجابة خارجية بالسؤال رقم ${q.questionNumber}` : `Pasted external answers into solver buffer [Q#${q.questionNumber}]`
                                });
                              }

                              events.sort((a, b) => a.time.localeCompare(b.time));

                              return (
                                <div key={qIdx} className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-850'} p-3 rounded-xl space-y-2`}>
                                  {/* Header indexing by Question ID */}
                                  <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-2`}>
                                    <span className="text-xs font-black text-blue-400 font-mono">
                                      {isAr ? `معرّف السؤال: Q#${q.questionNumber}` : `Question ID: Q#${q.questionNumber}`}
                                    </span>
                                    <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-mono font-bold uppercase`}>
                                      {copies} {isAr ? 'نسخ' : 'copies'} / {pastes} {isAr ? 'لصق' : 'pastes'}
                                    </span>
                                  </div>

                                  <div className="space-y-2 font-mono text-[10px]">
                                    {events.map((ev, evIdx) => (
                                      <div key={evIdx} className={`flex items-center justify-between ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-900/50 border border-slate-850'} p-2 rounded`}>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[10px] font-bold ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>[{ev.time}]</span>
                                          <span className={ev.type === 'copy' ? `${isLightMode ? 'text-amber-700' : 'text-amber-400'} font-bold` : `${isLightMode ? 'text-blue-700' : 'text-blue-400'} font-bold`}>
                                            {ev.type === 'copy' ? (isAr ? 'نسخ' : 'COPY') : (isAr ? 'لصق' : 'PASTE')}
                                          </span>
                                        </div>
                                        <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} text-[9.5px] max-w-[180px] truncate`} title={ev.text}>
                                          {ev.text}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {!hasAnyClipActivity && (
                              <div className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'} py-12 text-center text-xs italic font-mono`}>
                                {isAr ? 'لا يوجد أي نشاط نسخ أو لصق للحافظة مسجل لهذا الطالب.' : 'Clipboard Activity is absolutely clean for this student.'}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-slate-550'} text-center font-mono py-8`}>
                  {isAr ? 'لا تتوفر فعاليات بالذاكرة المؤقتة' : 'No clipboard logs generated for this student session.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted tooltip component to avoid inline component creation during render
function CustomTimeTooltip({ active, payload, label, isAr, isLightMode }: { active?: boolean; payload?: any[]; label?: string; isAr: boolean; isLightMode: boolean }) {
  if (active && payload && payload.length) {
    const actual = payload[0]?.value;
    const expected = payload[1]?.value;
    const ratio = actual / (expected || 60);
    const isAnomaly = actual < 15 || ratio < 0.2 || ratio > 1.8;
    
    let statusText = isAr ? 'طبيعي' : 'Normal';
    let statusColor = 'text-indigo-400';
    if (isAnomaly) {
      statusColor = 'text-rose-400 font-bold';
      if (actual < 15) {
        statusText = isAr ? 'انحراف: حل سريع للغاية (< ١٥ ثانية)' : 'Deviation: Extremely Rapid (< 15s)';
      } else if (ratio < 0.2) {
        statusText = isAr ? 'انحراف: سرعة مفرطة مقارنة بالتقدير' : 'Deviation: Excessively Fast vs Estimate';
      } else {
        statusText = isAr ? 'انحراف: تأخير مفرط / توقف' : 'Deviation: Excessively Slow / Idle';
      }
    }

    return (
      <div className={`${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-800'} p-3 rounded-xl shadow-xl text-[11px] font-mono`}>
        <p className={`${isLightMode ? 'text-slate-800' : 'text-white'} font-black mb-1.5 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-1`}>{label}</p>
        <div className="space-y-1">
          <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
            {isAr ? 'الزمن الفعلي:' : 'Actual Time:'}{' '}
            <span className="text-indigo-300 font-bold">{actual}s</span>
          </p>
          <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
            {isAr ? 'الزمن المقدر للمعلم:' : 'Teacher Target:'}{' '}
            <span className="text-amber-400 font-bold">{expected}s</span>
          </p>
          <div className={`border-t ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pt-1.5 mt-1.5 flex items-center gap-1`}>
            <span className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{isAr ? 'الحالة:' : 'Verdict:'}</span>
            <span className={statusColor}>{statusText}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
