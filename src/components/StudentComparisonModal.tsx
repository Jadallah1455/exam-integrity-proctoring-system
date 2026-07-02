import { X, Scale, ShieldAlert, Network, Copy, MousePointer, Printer } from 'lucide-react';
import { TelemetryPayload, AnomalyReport } from '../types';
import IntegrityProfile from './IntegrityProfile';

interface StudentComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: string[];
  submissions: TelemetryPayload[];
  analyses: AnomalyReport[];
  lang: 'ar' | 'en';
  isLightMode?: boolean;
}

export default function StudentComparisonModal({
  isOpen,
  onClose,
  selectedStudentIds,
  submissions,
  analyses,
  lang,
  isLightMode = false,
}: StudentComparisonModalProps) {
  if (!isOpen) return null;

  // Fetch full details of the chosen candidates
  const comparisonData = selectedStudentIds.map(studentId => {
    const analysis = analyses.find(an => an.studentId === studentId);
    const detail = submissions.find(s => s.studentId === studentId);
    return {
      studentId,
      analysis,
      detail,
    };
  }).filter(item => item.analysis !== undefined);

  // Check shared network collusion between the compared students
  const sharesSameIP = () => {
    if (comparisonData.length < 2) return false;
    const ips = comparisonData.map(item => item.detail?.ipAddresses || []);
    if (ips.some(ipList => ipList.length === 0)) return false;
    
    // Check if any IP appears in multiple students
    const flattenedIps = ips.flat();
    const uniqueIps = Array.from(new Set(flattenedIps));
    return flattenedIps.length !== uniqueIps.length;
  };

  // Determine common exam status
  const sharesSameExam = () => {
    if (comparisonData.length < 2) return false;
    const exams = comparisonData.map(item => item.analysis?.examId);
    return exams.every(exId => exId === exams[0]);
  };

  const hasHighRiskCooccurrence = () => {
    return comparisonData.filter(item => (item.analysis?.riskScore || 0) >= 60).length >= 2;
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200"
      id="student-comparison-modal-backdrop"
      onClick={onClose}
    >
      <div 
        id="printable-comparison"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print-section"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Window Header */}
        <div className="flex justify-between items-center bg-slate-950 border-b border-slate-800/80 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-white">
                {lang === 'ar' ? 'منصة التدقيق والاستجواب المقارن للمرشحين' : 'Forensic Candidate Side-by-Side Comparison Portal'}
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                {lang === 'ar'
                  ? 'لوحة تحليل تفاعلي تتيح مطابقة التفاعل السلوكي والشبكي لطلاب متعددين لكشف التواطؤ.'
                  : 'Interlock comparative proctoring coordinates of selected candidates to identify collaborative networks.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-lg cursor-pointer transition shadow-md no-print"
              title={lang === 'ar' ? 'طباعة التقرير ثنائي الأطراف' : 'Print side-by-side comparison dossier'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'طباعة المقارنة' : 'Print Comparison'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Window Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Quick Warning/Insights Banner */}
          {(sharesSameIP() || hasHighRiskCooccurrence()) && (
            <div className="bg-purple-950/20 border border-purple-900/40 p-4 rounded-xl flex items-start gap-3 text-purple-200">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider font-sans text-purple-300">
                  {lang === 'ar' ? 'تفوق إنذار الترابط الشبكي / التنسيق الجغرافي' : 'Autonomous Proximity Collusion Correlation Warning'}
                </h4>
                <p className="text-[10.5px] leading-relaxed text-slate-305 text-slate-300">
                  {sharesSameIP() && (
                    <span className="block">
                      • {lang === 'ar' 
                        ? 'تنبيه تواطؤ: يشترك هؤلاء الطلاب في نفس خادم الاتصال الشبكي (IP Address) أثناء تقديم الامتحانات!' 
                        : 'COLLUSION DETECTED: Candidates share matching IP networks, demonstrating co-location during proctor bounds.'}
                    </span>
                  )}
                  {hasHighRiskCooccurrence() && (
                    <span className="block">
                      • {lang === 'ar' 
                        ? 'تنبيه تزامن: يتشارك المرشحون نقاط تفوق الشبهات وتعدي مستوى المعالجة الحرج للنزاهة.' 
                        : 'CONCURRENCY WARNING: Multiple compared candidates exceed critical risk boundaries simultaneously.'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Grid of Student Cards */}
          {comparisonData.length === 0 ? (
            <div className="text-center p-12 bg-slate-950/40 border border-dashed border-slate-850 rounded-xl space-y-3">
              <p className="text-xs text-slate-500 italic">
                {lang === 'ar' ? 'لم يتم العثور على بيانات مقارنة' : 'No candidates processed in this window.'}
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(3, comparisonData.length)} gap-6 items-stretch`}>
              {comparisonData.map(({ studentId, analysis, detail }) => {
                if (!analysis) return null;
                const score = analysis.riskScore;
                const riskLevel = analysis.riskLevel;

                let riskBadgeClass = 'bg-slate-955 bg-slate-900 text-slate-400 border-slate-800';
                if (riskLevel === 'high') {
                  riskBadgeClass = 'bg-red-950/80 text-red-400 border-red-500/20';
                } else if (riskLevel === 'medium') {
                  riskBadgeClass = 'bg-orange-950/80 text-orange-400 border-orange-500/20';
                } else if (riskLevel === 'low') {
                  riskBadgeClass = 'bg-yellow-950/80 text-yellow-400 border-yellow-500/20';
                } else if (riskLevel === 'safe') {
                  riskBadgeClass = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/20';
                }

                return (
                  <div key={studentId} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                    
                    {/* Top Accent Line according to risk */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${
                      riskLevel === 'high' ? 'bg-red-500' :
                      riskLevel === 'medium' ? 'bg-orange-500' :
                      riskLevel === 'low' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`} />

                    <div className="space-y-3.5">
                      {/* Name Card */}
                      <div className="border-b border-slate-900 pb-3 flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <IntegrityProfile studentId={studentId} studentName={analysis.studentName} sizeClass="w-10 h-10 border border-slate-700 shadow-md" lang={lang} isLightMode={isLightMode} />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-white text-sm tracking-wide truncate">{analysis.studentName}</h4>
                            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">ID: {studentId}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black border uppercase tracking-wider shrink-0 ${riskBadgeClass}`}>
                          {lang === 'ar' ? analysis.riskLevel : analysis.riskLevel}
                        </span>
                      </div>

                      {/* General Subject Meta */}
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg">
                        <span className="block text-[8.5px] text-slate-500 uppercase tracking-widest font-mono">
                          {lang === 'ar' ? 'الامتحان المحدد:' : 'Proctored Exam Study:'}
                        </span>
                        <span className="text-[11.5px] text-slate-200 mt-1 block font-bold leading-none">
                          {analysis.examName}
                        </span>
                        <div className="flex justify-between text-[10px] mt-2.5 text-slate-400">
                          <span>{lang === 'ar' ? 'الدرجة:' : 'Score:'} <strong className="text-white font-mono">{detail?.scorePercent || 0}%</strong></span>
                          <span>{lang === 'ar' ? 'المدة:' : 'Time:'} <strong className="text-white font-mono">{detail?.durationMinutes || 0}m</strong></span>
                        </div>
                      </div>

                      {/* Cumulative Core Metrics Breakdown */}
                      <div className="space-y-3 text-[11px] text-slate-300">
                        
                        {/* Metric 1: Risk score bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-400 font-bold block">
                              {lang === 'ar' ? 'نقاط الخطورة السلوكية:' : 'Behavioral Risk Rating:'}
                            </span>
                            <span className={`font-mono text-xs font-black ${score >= 60 ? 'text-red-400' : score >= 35 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div className={`h-full ${
                              score >= 60 ? 'bg-red-500' :
                              score >= 35 ? 'bg-orange-500' : 'bg-emerald-500'
                            }`} style={{ width: `${score}%` }} />
                          </div>
                        </div>

                        {/* Metric 2: Tab switches */}
                        <div className="flex items-center justify-between p-2 bg-slate-900/45 rounded-lg border border-slate-900">
                          <span className="text-slate-450 font-bold flex items-center gap-1.5 text-slate-400">
                            🚪 {lang === 'ar' ? 'تبديل وإغلاق الإطارات:' : 'Window Tab Switches:'}
                          </span>
                          <span className="font-mono text-white text-[11.5px] font-black">
                            {detail?.tabSwitchesCount || 0} {lang === 'ar' ? 'أفعال' : 'events'}
                          </span>
                        </div>

                        {/* Metric 3: IP Address Connection and Conflict */}
                        <div className="p-2.5 bg-slate-900/45 border border-slate-900 rounded-lg space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-450 font-bold flex items-center gap-1.5 text-slate-400">
                              <Network className="w-3.5 h-3.5 text-blue-400" />
                              <span>{lang === 'ar' ? 'شبكة الـ IP والبصمة:' : 'Fingerprint IP Interface:'}</span>
                            </span>
                            <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded ${
                              analysis.ipAddressConflict 
                                ? 'bg-red-950 text-red-400 border border-red-900/20' 
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-900/20'
                            }`}>
                              {analysis.ipAddressConflict 
                                ? (lang === 'ar' ? 'تعارض مكثّف ⚠️' : 'CONFLICT CLASH ⚠️') 
                                : (lang === 'ar' ? 'مستقل ✓' : 'SECURE LINE ✓')}
                            </span>
                          </div>
                          <div className="font-mono text-slate-300 text-[9.5px] truncate px-1" title={detail?.ipAddresses.join(', ')}>
                            {detail?.ipAddresses.join(', ') || 'N/A'}
                          </div>
                        </div>

                        {/* Metric 4: Clipboard interactions */}
                        <div className="flex items-center justify-between p-2 bg-slate-900/45 rounded-lg border border-slate-900">
                          <span className="text-slate-450 font-bold flex items-center gap-1.5 text-slate-400">
                            <Copy className="w-3.5 h-3.5 text-pink-400" />
                            {lang === 'ar' ? 'عمليات الحافظة (نسخ/لصق):' : 'Clipboard (Copy/Pastes):'}
                          </span>
                          <span className="font-mono text-white text-[11px] font-semibold">
                            {detail?.copyCount || 0}C / {detail?.pasteCount || 0}P
                          </span>
                        </div>

                        {/* Metric 5: Mouse out coordinate seconds */}
                        <div className="flex items-center justify-between p-2 bg-slate-900/45 rounded-lg border border-slate-900">
                          <span className="text-slate-450 font-bold flex items-center gap-1.5 text-slate-400">
                            <MousePointer className="w-3.5 h-3.5 text-yellow-400" />
                            {lang === 'ar' ? 'شرود الماوس والتقاط الشبهات:' : 'Active Visual Defocus Bounds:'}
                          </span>
                          <span className="font-mono text-white text-[11px] font-semibold">
                            {detail?.mouseOutSeconds || 0}s
                          </span>
                        </div>

                        {/* Metric 6: Data signature status */}
                        <div className="flex items-center justify-between p-2 bg-slate-900/45 rounded-lg border border-slate-900 text-[10px]">
                          <span className="text-slate-400 font-bold">
                            🔒 {lang === 'ar' ? 'تشفير وحماية البيانات:' : 'Secure HMAC Seal ID:'}
                          </span>
                          <span className={`${detail?.signature ? 'text-emerald-400' : 'text-red-400'} font-bold font-mono text-[9px]`}>
                            {detail?.signature ? (lang === 'ar' ? 'مشفّر وسليم ✓' : 'VALIDATED SHA256 ✓') : (lang === 'ar' ? 'بلا ختم رقمي' : 'NO SEAL')}
                          </span>
                        </div>

                        {/* Verdict Resolution status */}
                        <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                          <span className="text-slate-500 font-bold">{lang === 'ar' ? 'القرار المسجل:' : 'Current Verdict Case:'}</span>
                          <span className={`px-2 py-0.5 rounded font-black text-[9.5px] ${
                            analysis.verdict === 'approved' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-900/20' :
                            analysis.verdict === 'retake_requested' ? 'bg-amber-900/50 text-amber-400 border border-amber-900/20' :
                            analysis.verdict === 'investigation' ? 'bg-red-900/50 text-red-400 border border-red-500/20' :
                            'bg-slate-900 text-slate-500'
                          }`}>
                            {analysis.verdict === 'approved' ? (lang === 'ar' ? 'معتمد ✓' : 'APPROVED ✓') :
                             analysis.verdict === 'retake_requested' ? (lang === 'ar' ? 'إعادة جارية' : 'RETAKE') :
                             analysis.verdict === 'investigation' ? (lang === 'ar' ? 'تحقيق ⚠️' : 'INVESTIGATE ⚠️') :
                             (lang === 'ar' ? 'مفتوح قيد الدراسة' : 'OPEN')}
                          </span>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Collusion Analyzer Summary Panel */}
          {comparisonData.length > 1 && (
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans border-b border-slate-900 pb-2 flex items-center gap-1.5">
                <span>⚡</span>
                <span>{lang === 'ar' ? 'الاستنتاج والتحليل المجهري الرقمي التلقائي (Anti-Collusion AI Assessment)' : 'Autonomous Co-location Multi-Agent Collusion Assessment'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Physical/Workstation coordination */}
                <div className="space-y-1.5 text-[10.5px]">
                  <span className="block font-bold text-slate-400">{lang === 'ar' ? '📌 تكامل الترابط والمواءمة المكانية (Physical Seating Space Match):' : '📌 Geostationary Clashing Alignment:'}</span>
                  <p className="text-slate-300 leading-relaxed text-[10.5px]">
                    {sharesSameIP() ? (
                      <span className="text-red-400 font-extrabold block">
                        🚨 {lang === 'ar'
                          ? 'يقدم كلاهما الاختبار من نفس البيئة المنزلية أو المعمل ذي عنوان IP متطابق. هناك احتمال بنسبة أكثر من 90٪ لتبادل الإجابات يدوياً أو التواطؤ العضوي.'
                          : 'Candidates are routed through the identical physical network gateway. Risk of hand-to-hand screen sharing is exceptionally elevated (>90%).'}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold block">
                        ✓ {lang === 'ar'
                          ? 'لا يتقاطع المرشحون في نفس الشبكة الفرعية المحلية. يقلل هذا من احتمالية التواجد العضوي المشترك.'
                          : 'Candidates reside on distinct, segregated subnetworks. Suggests physically isolated environment setups.'}
                      </span>
                    )}
                  </p>
                </div>

                {/* Behavioral chronology coordination */}
                <div className="space-y-1.5 text-[10.5px]">
                  <span className="block font-bold text-slate-400">{lang === 'ar' ? '📌 توافق توقيت وفعاليات تبديل النوافذ (Temporal Chrono Alignment):' : '📌 Behavioral Chrono Convergence:'}</span>
                  <p className="text-slate-300 leading-relaxed text-[10.5px]">
                    {sharesSameExam() ? (
                      <span className="text-amber-400 font-bold block">
                        ⚠️ {lang === 'ar'
                          ? 'كلا الطالبين لهما نفس المادة الدراسية. تتم مقارنة توقيت تبديل النوافذ للكشف عن التزامن والتسريب.'
                          : 'Both candidates have the same subject. Timeline comparison detects synchronized tab-switching patterns suggesting collusion.'}
                      </span>
                    ) : (
                      <span className="text-slate-450 text-slate-400 block">
                        • {lang === 'ar' 
                          ? 'يحضر الطلاب للامتحانات بمواد دراسية وصعوبات مختلفة. التزامن الإدراكي المباشر غير مرجّح.' 
                          : 'Candidates are active across different courses and item difficulties. Synchronization drift unlikely.'}
                      </span>
                    )}
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Window Footer */}
        <div className="bg-slate-950 px-6 py-4.5 border-t border-slate-800/80 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold rounded-lg hover:text-white hover:bg-slate-850 cursor-pointer transition select-none"
          >
            {lang === 'ar' ? 'إغلاق نافذة المقارنة' : 'Close Audit'}
          </button>
        </div>

      </div>
    </div>
  );
}
