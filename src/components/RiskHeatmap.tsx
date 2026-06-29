import { useState } from 'react';
import { 
  Users, 
  Map, 
  Monitor, 
  HelpCircle,
  TrendingUp, 
  Network, 
  Activity, 
  ShieldAlert,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { TelemetryPayload, AnomalyReport } from '../types';

interface RiskHeatmapProps {
  analyses: AnomalyReport[];
  submissions: TelemetryPayload[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  lang: 'ar' | 'en';
  riskThreshold: number;
}

export default function RiskHeatmap({
  analyses,
  submissions,
  selectedStudentId,
  onSelectStudent,
  lang,
  riskThreshold
}: RiskHeatmapProps) {
  const [layoutMode, setLayoutMode] = useState<'seating' | 'density'>('seating');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  // Seating grid dimensions
  const rows = ['A', 'B', 'C', 'D'];
  const columns = [1, 2, 3, 4, 5, 6];

  // Helper to place students deterministically based on ID hash
  const getSeatForStudent = (studentId: string) => {
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rowIdx = Math.abs(hash) % rows.length;
    const colIdx = Math.abs(hash + 2) % columns.length;
    const rowLetter = rows[rowIdx];
    const colNumber = columns[colIdx];
    return {
      rowLetter,
      colNumber,
      seatLabel: `${rowLetter}${colNumber}`,
      rowIdx,
      colIdx
    };
  };

  // Build seating map
  const seatingMap: Record<string, { student: AnomalyReport; detail?: TelemetryPayload; seatLabel: string }> = {};
  
  analyses.forEach(an => {
    const seat = getSeatForStudent(an.studentId);
    const detail = submissions.find(s => s.studentId === an.studentId);
    // If seat collision occurs in simulation, find the next available seat
    let finalSeatLabel = seat.seatLabel;
    let rIdx = seat.rowIdx;
    let cIdx = seat.colIdx;
    
    while (seatingMap[finalSeatLabel]) {
      cIdx = (cIdx + 1) % columns.length;
      if (cIdx === 0) {
        rIdx = (rIdx + 1) % rows.length;
      }
      finalSeatLabel = `${rows[rIdx]}${columns[cIdx]}`;
    }
    
    seatingMap[finalSeatLabel] = {
      student: an,
      detail,
      seatLabel: finalSeatLabel
    };
  });

  // Check for collective cheating patterns (e.g. adjacent IP conflicts)
  const adjacentIPClusters: Array<{ seatA: string; seatB: string; ip: string }> = [];
  
  // Scans grid for students sitting physically adjacent who share identical IPs
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const currentLabel = `${rows[r]}${columns[c]}`;
      const currentCell = seatingMap[currentLabel];
      if (!currentCell?.detail) continue;

      // Check right neighbor
      if (c < columns.length - 1) {
        const rightLabel = `${rows[r]}${columns[c + 1]}`;
        const rightCell = seatingMap[rightLabel];
        if (rightCell?.detail) {
          const sharedIP = currentCell.detail.ipAddresses.find(ip => 
            rightCell.detail?.ipAddresses.includes(ip)
          );
          if (sharedIP) {
            adjacentIPClusters.push({ seatA: currentLabel, seatB: rightLabel, ip: sharedIP });
          }
        }
      }

      // Check bottom neighbor
      if (r < rows.length - 1) {
        const bottomLabel = `${rows[r + 1]}${columns[c]}`;
        const bottomCell = seatingMap[bottomLabel];
        if (bottomCell?.detail) {
          const sharedIP = currentCell.detail.ipAddresses.find(ip => 
            bottomCell.detail?.ipAddresses.includes(ip)
          );
          if (sharedIP) {
            adjacentIPClusters.push({ seatA: currentLabel, seatB: bottomLabel, ip: sharedIP });
          }
        }
      }
    }
  }

  // Statistics calculations
  const totalSeats = rows.length * columns.length;
  const occupiedSeats = analyses.length;
  const utilizationRate = Math.round((occupiedSeats / totalSeats) * 100);
  const criticalCount = analyses.filter(an => an.riskScore >= riskThreshold).length;
  const averageRisk = occupiedSeats > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + a.riskScore, 0) / occupiedSeats) 
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6" id="classroom-risk-heatmap">
      {/* Heatmap Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1 px-2.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20 animate-pulse">
            {lang === 'ar' ? 'فحص البصمة المكانية' : 'Spatial Proctor Map'}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              {lang === 'ar' ? 'خارطة الكثافة وتوزيع المقاعد الفعلي' : 'Proctored Laboratory Density & Seating Heatmap'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'ar' 
                ? 'مخطط هجين تفاعلي يطابق أماكن جلوس الطلاب لكشف تواطؤ الشبكة والترتيب الجغرافي المشبوه' 
                : 'Interactive grid overlay correlating candidate safety by local workstation location'}
            </p>
          </div>
        </div>

        {/* Option toggles */}
        <div className="flex bg-slate-950 p-0.5 border border-slate-800 rounded-lg self-start sm:self-center">
          <button
            onClick={() => setLayoutMode('seating')}
            className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layoutMode === 'seating' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مخطط المقاعد المعملية' : 'Lab Seat Grid'}</span>
          </button>
          <button
            onClick={() => setLayoutMode('density')}
            className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layoutMode === 'density' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
            <span>{lang === 'ar' ? 'بؤر الخطورة المكانية' : 'Collective Cheating Trends'}</span>
          </button>
        </div>
      </div>

      {/* Heatmap Summary Stats Widget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
            {lang === 'ar' ? 'إشغال المقاعد:' : 'Seat Occupancy:'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-white">{occupiedSeats}/{totalSeats}</span>
            <span className="text-[11px] text-slate-500">({utilizationRate}%)</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${utilizationRate}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
            {lang === 'ar' ? 'متوسط مؤشر الخطورة:' : 'Overall Risk Mean:'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black ${averageRisk >= 65 ? 'text-red-400' : 'text-emerald-400'}`}>{averageRisk}%</span>
            <span className="text-[10px] uppercase font-mono px-1 bg-slate-900 border border-slate-800 rounded text-slate-400">
              {averageRisk >= riskThreshold ? (lang === 'ar' ? 'خطير' : 'CRITICAL') : (lang === 'ar' ? 'آمن' : 'SECURE')}
            </span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden">
            <div className={`h-full ${averageRisk >= riskThreshold ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${averageRisk}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
            {lang === 'ar' ? 'حالات الخطر الحرج:' : 'Breach Threshold Cases:'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black ${criticalCount > 0 ? 'text-rose-450 text-rose-400 animate-pulse' : 'text-slate-300'}`}>{criticalCount}</span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'طلاب' : 'candidates'}</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full" style={{ width: `${occupiedSeats > 0 ? (criticalCount / occupiedSeats) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
            {lang === 'ar' ? 'تواطؤ IP متجاور:' : 'Adjacent IP Matches:'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black ${adjacentIPClusters.length > 0 ? 'text-purple-400 animate-bounce' : 'text-slate-400'}`}>
              {adjacentIPClusters.length}
            </span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'بقع تواطؤ' : 'spatial clusters'}</span>
          </div>
          <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full animate-pulse" style={{ width: `${adjacentIPClusters.length > 0 ? 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Room Layout Grid rendering */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/60 relative">
        {/* Front Blackboard representation */}
        <div className="w-1/2 mx-auto mb-8 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center select-none shadow">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">
            🖥️ {lang === 'ar' ? 'منصة المشرف / مقدمة القاعة' : "PROCTOR'S STAND / FRONT OF CLASS"}
          </span>
        </div>

        {/* Room Plan Mapping */}
        <div className="grid grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {rows.map(row => (
            columns.map(col => {
              const label = `${row}${col}`;
              const cell = seatingMap[label];
              const isSelected = selectedStudentId && cell?.student.studentId === selectedStudentId;

              // Compute color themes according to risk scores and layout types
              let colorClasses = "bg-slate-900/60 border-slate-850 text-slate-600 hover:border-slate-700";
              let glowPulse = "";
              let statusIndicatorText = "";

              if (cell) {
                const isAbove = cell.student.riskScore >= riskThreshold;
                const riskLevel = cell.student.riskLevel;

                if (layoutMode === 'seating') {
                  if (isSelected) {
                    colorClasses = "bg-blue-600/10 border-blue-500 text-blue-300 ring-2 ring-blue-500/20";
                  } else if (riskLevel === 'high') {
                    colorClasses = "bg-red-500/10 border-red-500/40 text-red-200 hover:border-red-500 hover:bg-red-500/20";
                  } else if (riskLevel === 'medium') {
                    colorClasses = "bg-orange-500/10 border-orange-500/40 text-orange-200 hover:border-orange-500 hover:bg-orange-500/20";
                  } else if (riskLevel === 'low') {
                    colorClasses = "bg-yellow-500/10 border-yellow-500/40 text-yellow-250 text-yellow-100 hover:border-yellow-500 hover:bg-yellow-500/20";
                  } else {
                    colorClasses = "bg-emerald-500/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/50";
                  }
                  
                  if (isAbove) {
                    glowPulse = "animate-pulse ring-2 ring-red-500/30 border-red-500";
                  }
                } else {
                  // Density overlay (Heatmap visualization)
                  const score = cell.student.riskScore;
                  if (score >= 80) {
                    colorClasses = "bg-red-600/30 border-red-500 text-white animate-pulse shadow-md shadow-red-900/30";
                    glowPulse = "ring-2 ring-red-500";
                  } else if (score >= 60) {
                    colorClasses = "bg-orange-600/25 border-orange-500 text-orange-200";
                  } else if (score >= 40) {
                    colorClasses = "bg-yellow-600/20 border-yellow-400 text-yellow-100";
                  } else {
                    colorClasses = "bg-slate-900/80 border-slate-800 text-slate-500 opacity-60";
                  }
                }
                
                statusIndicatorText = `${cell.student.riskScore}%`;
              }

              const belongsToCluster = adjacentIPClusters.some(cl => cl.seatA === label || cl.seatB === label);

              return (
                <div
                  key={label}
                  onClick={() => {
                    if (cell) {
                      onSelectStudent(cell.student.studentId);
                      setSelectedSeat(label);
                    }
                  }}
                  className={`relative p-2.5 sm:p-3.5 rounded-xl border flex flex-col justify-between items-center h-20 sm:h-24 transition duration-200 pointer select-none cursor-pointer group shadow-inner ${colorClasses} ${glowPulse}`}
                  title={cell ? `${cell.student.studentName} (${cell.student.studentId})` : (lang === 'ar' ? 'مكتب شاغر' : 'Empty workstation')}
                >
                  {/* Seat ID Index */}
                  <span className="absolute top-1 left-1.5 text-[8.5px] font-bold font-mono text-slate-500 uppercase">
                    {label}
                  </span>

                  {/* Desktop / Network Visual Indicator */}
                  <div className="flex-1 flex flex-col items-center justify-center mt-2">
                    {cell ? (
                      <>
                        <Monitor className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          cell.student.riskLevel === 'high' ? 'text-red-450 text-red-400 animate-pulse' :
                          cell.student.riskLevel === 'medium' ? 'text-orange-400' :
                          cell.student.riskLevel === 'low' ? 'text-yellow-400' : 'text-emerald-400'
                        }`} />
                        <span className="text-[8.5px] sm:text-[10px] font-extrabold tracking-tight mt-1 truncate max-w-[55px] text-center text-slate-250 block">
                          {cell.student.studentName.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <span className="text-[15px] text-slate-700 font-mono italic select-none">Ø</span>
                    )}
                  </div>

                  {/* Bottom metrics or info status overlay */}
                  {cell && (
                    <div className="w-full flex items-center justify-between text-[8px] sm:text-[9.5px] font-mono mt-1 font-bold">
                      <span className="text-slate-400 bg-slate-950/60 px-1 rounded">
                        {statusIndicatorText}
                      </span>
                      {belongsToCluster && (
                        <span className="text-purple-400 p-0.5" title={lang === 'ar' ? 'مجموعة عناوين IP مشتركة متجاورة ثناياً' : 'Spatial IP coordination proximity warning'}>
                          ⚡
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spatial Hover Details Card */}
                  {cell && (
                    <div className={`absolute bottom-full mb-2 hidden group-hover:block w-56 p-3.5 bg-slate-950 border border-slate-800 text-xs rounded-xl shadow-2xl z-50 text-start space-y-2 leading-relaxed font-sans ${lang === 'ar' ? 'right-0' : 'left-0'}`} onClick={(e) => e.stopPropagation()}>
                      <div className="border-b border-slate-800 pb-1 flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-white text-[12.5px]">{cell.student.studentName}</h4>
                          <span className="text-[9px] text-slate-500 font-mono">{cell.student.studentId}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black ${
                          cell.student.riskLevel === 'high' ? 'bg-red-500/10 text-red-400' :
                          cell.student.riskLevel === 'medium' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {cell.student.riskScore}% {lang === 'ar' ? 'خطورة' : 'Risk'}
                        </span>
                      </div>

                      <div className="space-y-1 text-[10px] text-slate-350">
                        <div className="flex justify-between">
                          <span>{lang === 'ar' ? 'المقعد الفعلي:' : 'Seating Location:'}</span>
                          <span className="font-mono font-bold text-slate-200">{label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{lang === 'ar' ? 'مغادرة الإطار المحدود:' : 'Window/Tab Switches:'}</span>
                          <span className="font-mono font-bold text-red-300">{cell.detail?.tabSwitchesCount || 0} {lang === 'ar' ? 'فعاليات' : 'events'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{lang === 'ar' ? 'النسخ واللصق المشترك:' : 'Clipboard Ops:'}</span>
                          <span className="font-mono text-pink-300 font-bold">{cell.detail?.copyCount || 0}C / {cell.detail?.pasteCount || 0}P</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{lang === 'ar' ? 'عنوان الـ IP البصمة:' : 'Fingerprint IP:'}</span>
                          <span className="font-mono text-blue-300 font-semibold">{cell.detail?.ipAddresses.join(', ') || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-1.5 flex gap-1 justify-end">
                        <span className="text-[8px] font-bold text-slate-500">
                          {lang === 'ar' ? 'انقر للمطابقة في لوحة التفاصيل' : 'Click to focus profile'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {/* Spatial Risk Intensity Legend Keys */}
        <div className="mt-6 pt-4 border-t border-slate-900 flex flex-wrap justify-between items-center gap-4 text-[11px] font-mono select-none">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-extrabold pr-1">
              {lang === 'ar' ? 'مؤشرات كثافة المخاطر:' : 'Risk Heatmap Legend:'}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 rounded-lg">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block block shrink-0"></span>
              <span className="text-emerald-400 text-[10px]">{lang === 'ar' ? 'طبيعي / آمن (المؤشر: 0)' : 'Green: Safe / Secure (0)'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 rounded-lg">
              <span className="w-2.5 h-2.5 rounded bg-yellow-500/15 border border-yellow-500/40 inline-block block shrink-0"></span>
              <span className="text-yellow-400 text-[10px]">{lang === 'ar' ? 'آمن منخفض (١-٤)' : 'Yellow: Low (1-4)'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 rounded-lg">
              <span className="w-2.5 h-2.5 rounded bg-orange-500/15 border border-orange-500/40 inline-block block shrink-0"></span>
              <span className="text-orange-400 text-[10px]">{lang === 'ar' ? 'انحراف متوسط (٥-١٩)' : 'Amber: Medium (5-19)'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 rounded-lg">
              <span className="w-2.5 h-2.5 rounded bg-red-650 bg-red-500/30 border border-red-500/45 inline-block block shrink-0 animate-pulse"></span>
              <span className="text-red-400 font-bold text-[10px]">{lang === 'ar' ? 'حرج مرتفع (٢٠+)' : 'Red: Critical / High (20+)'}</span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 italic max-w-sm text-end hidden lg:block leading-tight">
            {lang === 'ar' 
              ? '* تعتمد الفئات على مستويات خطورة السلوك التراكمية، خروج المؤشر وبطاقات الشبكة المشبوهة.'
              : '* Risk brackets evaluate composite offline times, window switching rates, and IP overlaps.'}
          </div>
        </div>
      </div>

      {/* Collective Cheating Trends Inspector panel in 'density' mode */}
      {layoutMode === 'density' && (
        <div className="bg-slate-950/60 p-4 border border-violet-900/30 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-violet-300">
                {lang === 'ar' ? 'مخطط رصد التنسيق والمؤامرات الجماعية' : 'Collective Collusion & Coordination Inspector'}
              </h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                {lang === 'ar'
                  ? 'يتم فحص توزيع المقاعد لملاحظة بؤر الخطورة. تؤدي عناوين IP المشتركة بين طلاب يجلسون بجوار بعضهم البعض، أو الارتفاعات المتزامنة في عمليات تبديل النوافذ في قطاع واحد من القاعة، إلى إطلاق مرشحات التواطؤ المكانية تلقائياً.'
                  : 'Analyzes spatial density of suspicious behaviors. Adjacent desks sharing matching IP footprints or exhibiting coordinated window switches are flagged dynamically to counter physical cheating circles.'}
              </p>
            </div>
          </div>

          {adjacentIPClusters.length > 0 ? (
            <div className="space-y-1.5 pt-2">
              <span className="text-[9.5px] text-purple-400 font-extrabold uppercase tracking-wide block">
                🚨 {lang === 'ar' ? 'الأهداف المكانية المشبوهة النشطة:' : 'Active Proximity Collusion Alarms: '}({adjacentIPClusters.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {adjacentIPClusters.map((cl, idx) => {
                  const studentAName = seatingMap[cl.seatA]?.student.studentName || 'N/A';
                  const studentBName = seatingMap[cl.seatB]?.student.studentName || 'N/A';
                  
                  return (
                    <div key={idx} className="bg-purple-950/10 border border-purple-900/40 rounded-lg p-2.5 text-[10px] space-y-1">
                      <div className="flex justify-between items-center font-bold text-purple-300">
                        <span>{lang === 'ar' ? `بؤرة تواطؤ رقم ${idx + 1}` : `IP Collusion Spot #${idx + 1}`}</span>
                        <span>IP: {cl.ip}</span>
                      </div>
                      <div className="text-[9.5px] text-slate-350 leading-tight">
                        <span className="text-white font-bold">{studentAName}</span> (<span className="text-slate-450">{cl.seatA}</span>)
                        <span className="mx-1 text-slate-500 font-bold">&</span>
                        <span className="text-white font-bold">{studentBName}</span> (<span className="text-slate-450">{cl.seatB}</span>)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-[10.5px] text-emerald-400 font-medium pt-2">
              ✓ {lang === 'ar' ? 'لا يوجد مجموعات جلوس متطابقة الـ IP في القاعة حالياً.' : 'No geographical IP-clash groupings detected sitting adjacent.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
