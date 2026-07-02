/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Sliders,
  Cpu,
  Save,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Code,
  Terminal,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  HelpCircle as QuestionIcon,
  Edit2,
  Trash2,
  PlusCircle,
  XCircle,
  Clock,
  Settings2
} from "lucide-react";

interface ProctorRule {
  id: string;
  nameAr: string;
  nameEn: string;
  enabled: boolean;
  baseWeight: number;
  metricKey: string;
  conditionFormula: string;
  descriptionAr: string;
  descriptionEn: string;
}

interface AIPlagiarismConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'custom_url';
  apiKey: string;
  customEndpointUrl: string;
  dataStrategy: 'all_at_once_batch' | 'question_by_question' | 'pairwise_students' | 'single_student_baseline';
  selectedModel: string;
  promptTemplateAr: string;
  promptTemplateEn: string;
}

interface EngineControlPanelProps {
  lang: 'ar' | 'en';
  isLightMode: boolean;
  exams: any[];
  showToast: (title: string, desc: string, type?: 'success' | 'warn' | 'error') => void;
  handleReload: () => void;
  userRole?: string;
  setUserRole?: (role: 'admin' | 'proctor') => void;
}

export default function EngineControlPanel({ lang, isLightMode, exams, showToast, handleReload, userRole, setUserRole }: EngineControlPanelProps) {
  const isAdmin = userRole ? userRole === 'admin' : true;
  
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'aiPlatform' | 'timing_and_plagiarism' | 'anomaly_weights'>('rules');
  const [rules, setRules] = useState<ProctorRule[]>([]);

  // Access control simulated state
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [escalating, setEscalating] = useState(false);

  // Form states for adding/editing a custom rule
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formNameAr, setFormNameAr] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formMetricKey, setFormMetricKey] = useState("");
  const [formFormula, setFormFormula] = useState("");
  const [formWeight, setFormWeight] = useState(15);
  const [formDescAr, setFormDescAr] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [aiConfig, setAiConfig] = useState<AIPlagiarismConfig>({
    provider: 'gemini',
    apiKey: '',
    customEndpointUrl: '',
    dataStrategy: 'pairwise_students',
    selectedModel: 'gemini-2.5-flash',
    promptTemplateAr: '',
    promptTemplateEn: ''
  });

  const [timingConfig, setTimingConfig] = useState({
    easyBaseMinutesPerQuestion: 2,
    mediumBaseMinutesPerQuestion: 5,
    hardBaseMinutesPerQuestion: 8,
    teacherTimeAdjustment: 1.0,
  });

  const [copyPasteConfig, setCopyPasteConfig] = useState({
    maxRiskPoints: 20,
    chatGPTPatternThreshold: 1,
    abusedMultiplier: 0.20,
  });

  const [anomalyWeights, setAnomalyWeights] = useState({
    tabSwitch: 4,
    paste: 2,
    copy: 1,
    ipConflict: 30,
    aiGenerated: 20,
    rapidCompletion: 25,
    focusOut: 15,
    rapidQuestions: 15,
    macroUsage: 20
  });

  const [savingTiming, setSavingTiming] = useState(false);
  const [savingCopyPaste, setSavingCopyPaste] = useState(false);
  const [savingAnomalyWeights, setSavingAnomalyWeights] = useState(false);

  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Analysis trial sandbox state
  const [selectedSandboxExamId, setSelectedSandboxExamId] = useState<string>(exams?.[0]?.id || "");
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisOutput, setAnalysisOutput] = useState<{
    packingLog: string[];
    packedPayloadPreview: string;
    invokedWithRealApi: boolean;
    rawAiOutput: string;
    results: any[];
  } | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoadingRules(true);
      setLoadingConfig(true);
      
      const resRules = await fetch("/api/rules");
      const dataRules = await resRules.json();
      if (dataRules.success && dataRules.rules) {
        setRules(dataRules.rules);
      }

      const resConfig = await fetch("/api/ai-config");
      const dataConfig = await resConfig.json();
      if (dataConfig.success && dataConfig.config) {
        setAiConfig(dataConfig.config);
      }

      const resTiming = await fetch("/api/timing-config");
      const dataTiming = await resTiming.json();
      if (dataTiming.success && dataTiming.config) {
        setTimingConfig(dataTiming.config);
      }

      const resCopyPaste = await fetch("/api/copy-paste-config");
      const dataCopyPaste = await resCopyPaste.json();
      if (dataCopyPaste.success && dataCopyPaste.config) {
        setCopyPasteConfig(dataCopyPaste.config);
      }

      const resAnomaly = await fetch("/api/anomaly-weights");
      const dataAnomaly = await resAnomaly.json();
      if (dataAnomaly.success && dataAnomaly.weights) {
        setAnomalyWeights(dataAnomaly.weights);
      }
    } catch (err) {
      console.error("Error fetching engine config data:", err);
      showToast(
        lang === 'ar' ? "فشل تحميل الإعدادات" : "Failed to load configs",
        lang === 'ar' ? "تحقق من اتصال الخادم" : "Could not connect to backend server"
      );
    } finally {
      setLoadingRules(false);
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, [exams]);

  // Handle saving rules of cheating thresholds
  const handleSaveRules = async () => {
    try {
      setSavingRules(true);
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'ar' ? "تم حفظ محددات الحركة" : "Dynamic weight rules saved!",
          lang === 'ar' ? "نجح تغيير أوزان خوارزمية احتساب درجة الخطر وحظر الغش." : "Cheat evaluation metrics weights updated in server memory.",
          "success"
        );
        handleReload(); // Reload main student telemetry table automatically with new rules
      } else {
        throw new Error(data.error || "Server responded with failure");
      }
    } catch (err: any) {
      showToast(
        lang === 'ar' ? "عطل في حفظ القيم" : "Failed to save weights",
        err.message || "Network write error",
        "error"
      );
    } finally {
      setSavingRules(false);
    }
  };

  // Handle saving AI provider config
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const res = await fetch("/api/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'ar' ? "تم تحديث ربط الموديل" : "AI Connector Saved!",
          lang === 'ar' ? "تَمّ التسجيل وتحديث استراتيجية التعبئة والصياغات البرمجية للذكاء الاصطناعي." : "Prompts, strategy, and endpoint rules successfully written.",
          "success"
        );
      } else {
        throw new Error(data.error || "Configuration error");
      }
    } catch (err: any) {
      showToast(
        lang === 'ar' ? "خطأ أثناء ربط المعايير" : "Error writing config",
        err.message || "Network write error",
        "error"
      );
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle saving timing parameters
  const handleSaveTiming = async () => {
    try {
      setSavingTiming(true);
      const res = await fetch("/api/timing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timingConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'ar' ? "تم حفظ إعدادات زمن الامتحان" : "Timing configs saved!",
          lang === 'ar' ? "تَمّ تحديث معادلات تقدير المعلم وحفظ المعاملات الحسابية." : "Dynamic time calculator parameters committed.",
          "success"
        );
        handleReload();
      } else {
        throw new Error(data.error || "Save error");
      }
    } catch (err: any) {
      showToast(
        lang === 'ar' ? "فشل حفظ إعدادات الوقت" : "Failed to save timing",
        err.message || "Network error",
        "error"
      );
    } finally {
      setSavingTiming(false);
    }
  };

  // Handle saving copy-paste plagiarism parameters
  const handleSaveCopyPaste = async () => {
    try {
      setSavingCopyPaste(true);
      const res = await fetch("/api/copy-paste-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyPasteConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'ar' ? "تم حفظ معايير النسخ واللصق" : "Copy-paste formulas saved!",
          lang === 'ar' ? "تَمّ تحديث معادلة احتساب خطورة النسخ في الصفحة والأسئلة بنجاح." : "Plagiarism detection thresholds have been updated.",
          "success"
        );
        handleReload();
      } else {
        throw new Error(data.error || "Save error");
      }
    } catch (err: any) {
      showToast(
        lang === 'ar' ? "فشل حفظ معادل الغش" : "Failed to save plagiarism metrics",
        err.message || "Network error",
        "error"
      );
    } finally {
      setSavingCopyPaste(false);
    }
  };

  const handleSaveAnomalyWeights = async () => {
    try {
      setSavingAnomalyWeights(true);
      const res = await fetch("/api/anomaly-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: anomalyWeights })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'ar' ? "تم حفظ أوزان مؤشرات الغش" : "Anomaly weights saved!",
          lang === 'ar' ? "تَمّ تحديث مصفوفة الأوزان الرياضية واحتساب درجة المخاطر." : "Custom mathematical weight configurations committed to database.",
          "success"
        );
        handleReload();
        fetchData();
      } else {
        throw new Error(data.error || "Save failure");
      }
    } catch (err: any) {
      showToast(
        lang === 'ar' ? "خطأ في حفظ الأوزان" : "Error saving weights",
        err ? err.toString() : "Network write error"
      );
    } finally {
      setSavingAnomalyWeights(false);
    }
  };

  // Run dynamic structural similarity analysis trial
  const handleRunSimilarityAnalysis = async () => {
    if (!selectedSandboxExamId) {
      showToast(
        lang === 'ar' ? "يرجى اختيار اختبار" : "Select an exam",
        lang === 'ar' ? "اختر امتحاناً للبدء في تعبئة وقراءة بيانات الطلاب" : "We need an active exam to pull candidate solution histories",
        "warn"
      );
      return;
    }

    try {
      setRunningAnalysis(true);
      setAnalysisOutput(null);
      
      const res = await fetch("/api/ai-config/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedSandboxExamId })
      });
      
      const data = await res.json();
      if (data.success) {
        setAnalysisOutput({
          packingLog: data.packingLog,
          packedPayloadPreview: data.packedPayloadPreview,
          invokedWithRealApi: data.invokedWithRealApi,
          rawAiOutput: data.rawAiOutput,
          results: data.results
        });

        showToast(
          lang === 'ar' ? "اكتمل مسح التشابه الذكي" : "AI Plagiarism Scan Done",
          lang === 'ar' ? `تم تنظيم البيانات ومراجعتها وفق استراتيجية: ${aiConfig.dataStrategy}` : `Processed using strategy: ${aiConfig.dataStrategy}`,
          "success"
        );
      } else {
        throw new Error(data.error || "Packing failed");
      }
    } catch (err: any) {
      showToast(
        lang === 'ar' ? "فشل المسح الذكي" : "AI Scan Failed",
        err.message || "Examine student count context",
        "error"
      );
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleDeleteRule = (id: string) => {
    const originalIds = ['rule_ip', 'rule_tabs', 'rule_copy_paste', 'rule_ai_gen', 'rule_rapid', 'rule_focus_out', 'rule_rapid_questions', 'rule_macro_usage'];
    if (originalIds.includes(id)) {
      showToast(
        lang === 'ar' ? "حظر حذف البيانات الأساسية" : "Protected Core Rule",
        lang === 'ar' ? "لا يمكن حذف القواعد السيادية الأساسية، لكن يمكنك تعطيلها." : "You cannot delete core baseline metrics rules, but you may easily toggle them off.",
        "warn"
      );
      return;
    }
    setRules(prev => prev.filter(r => r.id !== id));
    showToast(
      lang === 'ar' ? "تم حذف القاعدة" : "Rule Removed",
      lang === 'ar' ? "تم حذف القاعدة من الأوزان الفورية." : "Discarded rule successfully.",
      "success"
    );
  };

  const handleSaveRuleForm = (e: FormEvent) => {
    e.preventDefault();
    if (!formNameEn || !formFormula || !formMetricKey) {
      showToast(
        lang === 'ar' ? "بيانات غير مكتملة" : "Incomplete Rule Data",
        lang === 'ar' ? "يرجى تعبئة الاسم والمعادلة والرمز البرمجي للقاعدة." : "Please fill in rule name, condition formula, and metric code keyword.",
        "warn"
      );
      return;
    }

    // Simple validation on formula (letters, numbers, spaces, operators, brackets)
    const safeRegex = /^[a-zA-Z0-9\s><=!&|()+-/*]+$/;
    if (!safeRegex.test(formFormula)) {
      showToast(
        lang === 'ar' ? "صيغة غير آمنة" : "Invalid/Unsafe Formula",
        lang === 'ar' ? "يرجى استخدام متغيرات صحيحة ومعاملات رياضية ومقارنة منطقية فقط." : "Formula contains characters that are not allowed. Use standard variables and comparison operators.",
        "error"
      );
      return;
    }

    const updatedRules = [...rules];
    if (editingRuleId) {
      // Update existing
      const idx = updatedRules.findIndex(r => r.id === editingRuleId);
      if (idx !== -1) {
        updatedRules[idx] = {
          ...updatedRules[idx],
          nameAr: formNameAr || formNameEn,
          nameEn: formNameEn,
          metricKey: formMetricKey,
          conditionFormula: formFormula,
          baseWeight: formWeight,
          descriptionAr: formDescAr || formDescEn,
          descriptionEn: formDescEn
        };
        showToast(
          lang === 'ar' ? "تم تحديث القاعدة" : "Rule Updated",
          lang === 'ar' ? "تم تعديل المدلولات في الذاكرة الجارية بنجاح." : "Modified rule attributes in workspace memory model.",
          "success"
        );
      }
    } else {
      // Add new
      const newRule: ProctorRule = {
        id: `rule_custom_${Date.now()}`,
        nameAr: formNameAr || formNameEn,
        nameEn: formNameEn,
        enabled: true,
        baseWeight: formWeight,
        metricKey: formMetricKey,
        conditionFormula: formFormula,
        descriptionAr: formDescAr || formDescEn,
        descriptionEn: formDescEn
      };
      
      // Make sure metricKey is unique
      if (rules.some(r => r.metricKey === formMetricKey && r.id !== editingRuleId)) {
        showToast(
          lang === 'ar' ? "رمز تليمتري مكرر" : "Duplicate Metric Key",
          lang === 'ar' ? "الرمز مستخدم بالفعل لقاعدة أخرى." : "This metric key code is already assigned to another active rule.",
          "warn"
        );
        return;
      }

      updatedRules.push(newRule);
      showToast(
        lang === 'ar' ? "تمت إضافة قاعدة مخصصة" : "Custom Rule Added",
        lang === 'ar' ? "تم إنشاء ميسور تليمتري جديد بنجاح." : "New custom telemetry behavioral rule initialized.",
        "success"
      );
    }

    setRules(updatedRules);
    // Clear form
    setEditingRuleId(null);
    setFormNameAr("");
    setFormNameEn("");
    setFormMetricKey("");
    setFormFormula("");
    setFormWeight(15);
    setFormDescAr("");
    setFormDescEn("");
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, baseWeight: Math.max(0, Math.min(100, newWeight)) } : r));
  };

  const totalPossibleScore = rules.reduce((acc, curr) => curr.enabled ? acc + curr.baseWeight : acc, 0);

  return (
    <div className={`space-y-6 ${isLightMode ? 'text-slate-800' : 'text-slate-100'} ${lang === 'ar' ? 'font-sans' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Request Access Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative`}>
            <button 
              onClick={() => setShowAccessModal(false)}
              className={`absolute top-4 right-4 ${isLightMode ? 'text-slate-400 hover:text-slate-800' : 'text-slate-500 hover:text-white'} transition cursor-pointer`}
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className={`text-md font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                {lang === 'ar' ? 'نموذج طلب ترقية الصلاحيات للمراقب' : 'Proctor Privilege Elevation Request'}
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'} leading-relaxed`}>
                {lang === 'ar' 
                  ? 'بصفتك مراقباً، تليمتري الرصد يعمل بوضع المشاهدة فقط لمنع العبث بالتكوينات الرياضية أثناء الامتحانات الجارية. يمكنك محاكاة إرسال طلب للمدير والحصول على موافقة فورية للترقية.' 
                  : 'As a proctor, telemetry calibrations are locked to maintain assessment integrity. Send an emergency bypass request key to elevate credentials right now.'}
              </p>
            </div>

            <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'} p-3 rounded-lg border space-y-2 text-[11px] font-mono`}>
              <div className="flex justify-between">
                <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'المستخدم الحالي:' : 'Requested User:'}</span>
                <span className={`${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>Proctor_Account_337</span>
              </div>
              <div className="flex justify-between">
                <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'الصلاحية المرغوبة:' : 'Target Clearance:'}</span>
                <span className="text-indigo-400 font-bold">System Administrator</span>
              </div>
              <div className="flex justify-between">
                <span className={`${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'مستوى الحماية:' : 'Security Guard Mode:'}</span>
                <span className="text-emerald-400">RESTRICTED_BYPASS_A_99</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAccessModal(false)}
                className={`flex-1 ${isLightMode ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-slate-800 hover:bg-slate-750 text-slate-300'} text-xs font-bold py-2.5 rounded-lg transition`}
              >
                {lang === 'ar' ? 'إلغاء الأمر' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  setEscalating(true);
                  await new Promise(r => setTimeout(r, 1000));
                  setEscalating(false);
                  setShowAccessModal(false);
                  if (setUserRole) {
                    setUserRole('admin');
                    showToast(
                      "🔑 تمت الموافقة وترقية الحساب تلقائياً كمسؤول للنظام!",
                      "🔑 Elevation request approved. Access to control engine widgets unlocked!"
                    );
                  }
                }}
                className={`flex-1 bg-blue-600 hover:bg-blue-500 ${isLightMode ? 'text-white' : 'text-white'} text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2`}
                disabled={escalating}
              >
                {escalating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{lang === 'ar' ? '🔐 محاكاة موافقة فورية والترقية' : '🔐 Request & Escalate'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission warning banner */}
      {!isAdmin && (
        <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase">
                {lang === 'ar' ? 'وضع المشاهدة فقط للمراقبين (Proctor Read-Only)' : 'Proctor Read-Only Override Enabled'}
              </h4>
              <p className={`text-[10px] ${isLightMode ? 'text-slate-600' : 'text-slate-300'} mt-0.5`}>
                {lang === 'ar' 
                  ? 'أنت تستعرض لوحة تحكم محرك رصد الصلاحيات برتبة مراقب. لا تملك صلاحيات لتعديل هذه الإعدادات مباشرة.'
                  : 'You have read-only access to custom dynamic weights and AI pipeline templates. Modify privileges disabled.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAccessModal(true)}
            className={`shrink-0 bg-rose-600 hover:bg-rose-500 ${isLightMode ? 'text-white' : 'text-white'} font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg transition duration-150 cursor-pointer shadow-md`}
          >
            {lang === 'ar' ? '🔐 طلب وصول وتوسيع الصلاحيات' : '🔐 Request Access / Escalate'}
          </button>
        </div>
      )}

      {/* Alert Banner explaining online exams constraints */}
      <div className="bg-amber-500/10 border border-amber-505/15 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-400">
            {lang === 'ar' ? 'مذكرة السياسة الأكاديمية: قاعات الحل المنزلية' : 'Academic Policy Note: Remote Home Examinations'}
          </h4>
          <p className={`text-[11px] ${isLightMode ? 'text-slate-600' : 'text-slate-350'} leading-relaxed`}>
            {lang === 'ar' 
              ? 'نظراً لإجراء الاختبارات بالكامل عن بُعد من منازل الطلاب حيث تغيب الرقابة العينية المباشرة، يعتمد هذا النظام كلياً على تكامل المحددات وقيم الخطر التراكمية. يمكنك استخدام لوحة القواعد لتكييف أشرطة كشف الانحرافات والنسخ واللصق، بالإضافة للتحقق الدلالي بواسطة نماذج الذكاء الاصطناعي لحظر محاولات الغش بكفاءة.'
              : 'As examinations are taken remotely from student residences without proctor physical oversight, the platforms relies entirely on telemetry criteria. Use this dashboard to fine-tune active rule sensitivities, sliding points, and link external LLMs to filter concurrent similarity clusters.'
            }
          </p>
        </div>
      </div>

      {/* Main Title Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-5`}>
        <div>
          <h2 className={`text-xl font-black ${isLightMode ? 'text-slate-800' : 'text-white'} flex items-center gap-2`}>
            <Cpu className="text-blue-500 w-6 h-6" />
            <span>
              {lang === 'ar' ? 'لوحة التحكم بمحرك الرصد وتعديل المعادلات' : 'Proctor Engine Rules & AI Alignment'}
            </span>
          </h2>
          <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-1.5`}>
            {lang === 'ar' 
              ? 'حدد سلوك وعتبات استنباط درجة الغش، واربط قنوات الفحص بنماذج الذكاء الاصطناعي لتتبع تشابه الحلول.'
              : 'Audit telemetry weight coefficients, configure active triggers and feed exams to custom AI integration agents.'
            }
          </p>
        </div>

        {/* Outer Tabs selector */}
        <div className={`flex ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-1 rounded-lg border self-start md:self-auto shrink-0 flex-wrap gap-1`}>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition duration-150 cursor-pointer ${activeSubTab === 'rules' ? 'bg-blue-600 text-white shadow' : isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
          >
            <Sliders className="w-4 h-4" />
            <span>{lang === 'ar' ? 'معادلات الرصد السلوكي' : 'Telemetry Rules & Weights'}</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('aiPlatform')}
            className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition duration-150 cursor-pointer ${activeSubTab === 'aiPlatform' ? 'bg-blue-600 text-white shadow' : isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
          >
            <Cpu className="w-4 h-4" />
            <span>{lang === 'ar' ? 'بوابة الذكاء الاصطناعي (AI Check)' : 'AI Copier Alignment'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timing_and_plagiarism')}
            className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition duration-150 cursor-pointer ${activeSubTab === 'timing_and_plagiarism' ? 'bg-blue-600 text-white shadow' : isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'ar' ? 'نموذج الوقت ومعادلة النسخ' : 'Timing & Plagiarism Settings'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('anomaly_weights')}
            className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition duration-150 cursor-pointer ${activeSubTab === 'anomaly_weights' ? 'bg-blue-600 text-white shadow' : isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
          >
            <Settings2 className="w-4 h-4 animate-spin-slow" />
            <span>{lang === 'ar' ? 'أوزان مؤشرات المخاطر المخصصة' : 'Mathematical Anomaly Weights'}</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'rules' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rules tuning fields */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-4 shadow-lg`}>
              <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
                <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                  {lang === 'ar' ? 'مؤشرات الغش والتأثير النسبي' : 'Active Cheating Telemetry Triggers & Scales'}
                </h3>
                <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'ar' ? 'تعديل المعاملات وقت العمل' : 'Dynamic Runtime Interlocking'}
                </span>
              </div>

              {loadingRules ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ar' ? 'جاري جلب القواعد من الذاكرة السيادية...' : 'Fetching active rules schemas...'}</p>
                </div>
              ) : (
                <div className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                  {rules.map((rule) => (
                    <div key={rule.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-lg">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                          <span className={`text-xs font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                            {lang === 'ar' ? rule.nameAr : rule.nameEn}
                          </span>
                          <span className={`text-[10px] font-mono ${isLightMode ? 'bg-slate-50 text-slate-500 border-slate-300' : 'bg-slate-950 text-slate-400 border-slate-805'} px-2 py-0.5 rounded border`}>
                            {rule.metricKey}
                          </span>
                        </div>
                        <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} leading-relaxed`}>
                          {lang === 'ar' ? rule.descriptionAr : rule.descriptionEn}
                        </p>
                        <div className="text-[10px] text-blue-400 font-mono flex items-center gap-1 mt-1 font-sans">
                          <Code className="w-3" />
                          <span>{lang === 'ar' ? 'شرط المعادلة تفعيل:' : 'Trigger Statement:'}</span>
                          <code className={`${isLightMode ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-slate-300 bg-slate-950 border-slate-800'} px-1.5 py-0.5 rounded font-mono text-[9.5px] border`}>{rule.conditionFormula}</code>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                        {/* Edit & Delete Action Buttons */}
                        <div className={`flex items-center gap-1 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-1 rounded-md border`}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRuleId(rule.id);
                              setFormNameAr(rule.nameAr);
                              setFormNameEn(rule.nameEn);
                              setFormMetricKey(rule.metricKey);
                              setFormFormula(rule.conditionFormula);
                              setFormWeight(rule.baseWeight);
                              setFormDescAr(rule.descriptionAr);
                              setFormDescEn(rule.descriptionEn);
                            }}
                            className={`p-1 ${isLightMode ? 'hover:text-slate-800 text-slate-500 hover:bg-slate-100' : 'hover:text-white text-slate-400 hover:bg-slate-900'} rounded transition cursor-pointer`}
                            title={lang === 'ar' ? 'تعديل المعاملات' : 'Edit Rule'}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          
                          {!['rule_ip', 'rule_tabs', 'rule_copy_paste', 'rule_ai_gen', 'rule_rapid', 'rule_focus_out', 'rule_rapid_questions', 'rule_macro_usage'].includes(rule.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              className={`p-1 ${isLightMode ? 'hover:text-rose-450 text-slate-500 hover:bg-slate-100' : 'hover:text-rose-450 text-slate-400 hover:bg-slate-900'} rounded transition cursor-pointer`}
                              title={lang === 'ar' ? 'حذف هذه القاعدة المخصصة' : 'Delete Custom Rule'}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          )}
                        </div>

                        {/* Enabled Switch */}
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`${isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'} transition cursor-pointer`}
                          title={rule.enabled ? (lang === 'ar' ? 'تعطيل القاعدة' : 'Disable Trigger') : (lang === 'ar' ? 'tفعيل القاعدة' : 'Enable Trigger')}
                        >
                          {rule.enabled ? (
                            <ToggleRight className="w-8 h-8 text-emerald-500" />
                          ) : (
                            <ToggleLeft className={`w-8 h-8 ${isLightMode ? 'text-slate-300' : 'text-slate-600'}`} />
                          )}
                        </button>

                        {/* Weight Slider input */}
                        <div className={`flex items-center gap-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-1.5 rounded-lg border`}>
                          <div className="flex flex-col">
                            <span className={`text-[8px] font-mono ${isLightMode ? 'text-slate-400' : 'text-slate-500'} text-center uppercase`}>{lang === 'ar' ? 'الوزن %' : 'WEIGHT %'}</span>
                            <input
                              type="number"
                              disabled={!rule.enabled}
                              value={rule.baseWeight}
                              onChange={(e) => handleWeightChange(rule.id, parseInt(e.target.value) || 0)}
                              className={`w-12 text-center text-xs font-mono font-black bg-transparent border-0 outline-none ${isLightMode ? 'text-slate-800 focus:text-blue-600' : 'text-white focus:text-blue-400'} disabled:opacity-30`}
                            />
                          </div>
                          
                          <input
                            type="range"
                            disabled={!rule.enabled}
                            min="0"
                            max="50"
                            value={rule.baseWeight}
                            onChange={(e) => handleWeightChange(rule.id, parseInt(e.target.value) || 0)}
                            className="w-20 accent-blue-500 disabled:opacity-35 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk Engine Rule Editor form card */}
            <form onSubmit={handleSaveRuleForm} className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-4 shadow-lg`}>
              <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                  {editingRuleId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <PlusCircle className="w-4 h-4 text-emerald-500" />}
                  <span>
                    {editingRuleId 
                      ? (lang === 'ar' ? 'تعديل قاعدة رصد حركة الطالب' : 'Edit Custom Behavioral Rule') 
                      : (lang === 'ar' ? 'إضافة قاعدة قياس سلوك مخصصة' : 'Add Custom Behavioral Marker Rule')
                    }
                  </span>
                </h3>
                {editingRuleId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingRuleId(null);
                      setFormNameAr("");
                      setFormNameEn("");
                      setFormMetricKey("");
                      setFormFormula("");
                      setFormWeight(15);
                      setFormDescAr("");
                      setFormDescEn("");
                    }}
                    className={`text-[10px] ${isLightMode ? 'text-slate-500 hover:text-slate-800 bg-slate-50 border-slate-200' : 'text-slate-400 hover:text-white bg-slate-950 border-slate-800'} flex items-center gap-1 px-2 py-1 rounded border cursor-pointer`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الاسم بالإنجليزية (Name EN)' : 'Rule Name (English)'}</label>
                  <input
                    type="text"
                    placeholder="e.g., Excessive Idle Period Detected"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-550 h-10`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الاسم بالعربية (Name AR)' : 'Rule Name (Arabic)'}</label>
                  <input
                    type="text"
                    placeholder="مثال: رصد فترة خمول مفرطة"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-550 h-10`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>
                    {lang === 'ar' ? 'الرمز التعريفي الفريد (Metric Key Code)' : 'Unique Metric Key (Alphanumeric Code)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., focus_absent_heavy"
                    disabled={!!editingRuleId}
                    value={formMetricKey}
                    onChange={(e) => setFormMetricKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-550 h-10 disabled:opacity-40`}
                  />
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block`}>{lang === 'ar' ? 'رمز تليمتري مخصص للمحدد السلوكي' : 'Unique metric name used by the dynamic engine.'}</span>
                </div>

                <div className="space-y-1">
                  <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>
                    {lang === 'ar' ? 'الوزن الافتراضي (Default Weight Points %)' : 'Rule Base Weight (Points 0-100)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formWeight}
                      onChange={(e) => setFormWeight(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
                      className={`w-20 ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-205'} rounded-lg py-2 px-3 text-center outline-none focus:border-blue-500 h-10 font-mono font-bold`}
                    />
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={formWeight}
                      onChange={(e) => setFormWeight(parseInt(e.target.value) || 1)}
                      className="flex-1 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold flex items-center gap-1 text-[11px]`}>
                      <Code className="w-3.5 h-3.5 text-blue-450" />
                      <span>{lang === 'ar' ? 'شرط المعادلة المنطقية لدرجة الخطر (Condition Formula)' : 'Dynamic Evaluation Formula'}</span>
                    </label>
                    
                    {/* Helper Variables Quick Injectors */}
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-[9.5px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-bold self-center mr-1`}>Inject:</span>
                      {[
                        { word: 'tabSwitchesCount', label: 'Tab Switches' },
                        { word: 'copyCount', label: 'Copies' },
                        { word: 'pasteCount', label: 'Pastes' },
                        { word: 'outOfBoundsCount', label: 'Out of Bounds' },
                        { word: 'mouseOutSeconds', label: 'Mouse Out (Sec)' },
                        { word: 'scorePercent', label: 'Score %' }
                      ].map(v => (
                        <button
                          key={v.word}
                          type="button"
                          onClick={() => setFormFormula((prev) => prev ? prev + ' ' + v.word : v.word)}
                          className={`px-2 py-0.5 rounded ${isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-slate-950 hover:bg-slate-800 border-slate-850'} text-[10px] text-blue-400 font-mono border cursor-pointer`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="e.g., tabSwitchesCount > 5 || outOfBoundsCount > 8"
                    value={formFormula}
                    onChange={(e) => setFormFormula(e.target.value)}
                    className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-201'} rounded-lg py-2.5 px-3 outline-none focus:border-blue-500 font-mono font-bold tracking-wide text-xs`}
                  />
                  <div className={`p-2 ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-850 text-slate-450'} rounded border text-[10px] leading-relaxed font-mono`}>
                    <span className="text-rose-455 font-bold">{lang === 'ar' ? 'المعاملات المقبولة:' : 'Supported syntax:'}</span> {` >, <, >=, <=, ===, !==, ||, &&, +, -, *, /`}
                    <br />
                    <span className="text-amber-500 font-bold">{lang === 'ar' ? 'مثال:' : 'Example:'}</span> <code className={`${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>{`tabSwitchesCount > 5 && mouseOutSeconds > 60`}</code>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الوصف بالإنجليزية (Description EN)' : 'Description (English)'}</label>
                  <textarea
                    rows={2}
                    placeholder="Describe what triggers this rule..."
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-250'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 leading-normal text-xs`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الوصف بالعربية (Description AR)' : 'Description (Arabic)'}</label>
                  <textarea
                    rows={2}
                    placeholder="حالة حدوث تفعيل هذا السلوك للطلبة..."
                    value={formDescAr}
                    onChange={(e) => setFormDescAr(e.target.value)}
                    className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-250'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 leading-normal text-xs`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white cursor-pointer transition flex items-center gap-2 select-none"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingRuleId 
                      ? (lang === 'ar' ? 'حفظ وتحديث قاعدة الفحص المخصصة' : 'Update Custom Rule') 
                      : (lang === 'ar' ? 'إضافة القاعدة لخيارات رصد السلوك' : 'Incorporate Telemetry Rule')
                    }
                  </span>
                </button>
              </div>
            </form>

            <div className="flex justify-end gap-3">
              <button
                onClick={fetchData}
                className={`px-4 py-2.5 rounded-lg ${isLightMode ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'} text-xs font-bold cursor-pointer transition flex items-center gap-2 select-none`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تجاهل وإرجاع الافتراضي' : 'Revert Defaults'}</span>
              </button>
              
              <button
                onClick={handleSaveRules}
                disabled={savingRules}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer transition flex items-center gap-2 select-none font-sans disabled:opacity-50"
              >
                {savingRules ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{lang === 'ar' ? 'اعتماد وحفظ معادلات الأوزان' : 'Apply & Save Weight Coefficients'}</span>
              </button>
            </div>
          </div>

          {/* Right Metrics summary container */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-4 shadow-lg`}>
              <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                {lang === 'ar' ? 'نبض النزاهة والتحليل التراكمي' : 'Cumulative Index Bounds'}
              </h3>
              
              <div className={`p-4 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} rounded-lg border text-center space-y-1`}>
                <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-bold block`}>{lang === 'ar' ? 'الحد الأقصى للنقاط المتراكمة بقواعدك النشطة' : 'Active Maximum Potential Risk Points'}</span>
                <span className="text-3xl font-black font-mono text-blue-400 block tracking-tight">
                  {totalPossibleScore} <span className={`text-xs font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>/ 100</span>
                </span>
                <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} leading-normal block pt-1`}>
                  {lang === 'ar' 
                    ? 'يتم دمج ومعايرة النقاط بما لا يتجاوز 100% لتحديد مستويات الخطورة (منخفض، متوسط، عالي) وعتبة الاسترداد الأمنية.'
                    : 'Values are dynamically unified capped at 100% maximum to assign threat groups (low, medium, high) upon Moodle exam returns.'
                  }
                </p>
              </div>

              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-4 rounded-xl space-y-3 text-xs leading-relaxed font-sans`}>
                <h4 className={`text-[11px] font-black ${isLightMode ? 'text-slate-600' : 'text-slate-300'} uppercase block`}>{lang === 'ar' ? 'كيف تحتسب درجة الخطر؟' : 'Threat Score Calculus Formula'}</h4>
                <div className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} space-y-2 leading-relaxed`}>
                  <p>
                    {lang === 'ar' 
                      ? '١. عند استلام بيانات التليمتري من متصفح الطالب، يقوم السيرفر بمسح الأخطاء والقيم.'
                      : '1. On receiving browser telemetry packets from candidates, parameters are analyzed.'
                    }
                  </p>
                  <p>
                    {lang === 'ar' 
                      ? '٢. يتم التحقق من القواعد المفعلة؛ فإذا تحققت شروط القاعدة (مثلاً: studentId تصف تشابهاً مع IP آخر)، يضاف وزن القاعدة المسند كاملاً لدرجة الطالب.'
                      : '2. Enabled rule triggers compile and add their assigned weight dynamically (e.g. if candidate shares and clashes identical local network IP).'
                    }
                  </p>
                  <p>
                    {lang === 'ar' 
                      ? '٣. المجموع يمثل معامل النزاهة، ويعبر عنه بلون مميز في السجلات الأكاديمية للمراقب.'
                      : '3. Collective scores establish a candidate integrity band visible in proctor telemetry rooms.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'aiPlatform' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* AI Providers configurations fields */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-4 shadow-lg`}>
              <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
                <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                  {lang === 'ar' ? 'بوابة ربط قنوات النماذج التوليدية للامتياز الأكاديمي' : 'External LLM Integration & Endpoint Specifications'}
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <Lock className="w-3" />
                  <span>{lang === 'ar' ? 'آمن وفيدرالي' : 'Secure & Federated'}</span>
                </span>
              </div>

              {loadingConfig ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ar' ? 'جاري قراءة معايير قنوات السيرفر...' : 'Reading server federated keys...'}</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-sans">
                  {/* Provider Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'جهة خدمة الذكاء الاصطناعي (Provider)' : 'AI Provider Service'}</label>
                      <select
                        value={aiConfig.provider}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                        className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 cursor-pointer h-10`}
                      >
                        <option value="gemini">Google Gemini API (Default)</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                        <option value="claude">Anthropic Claude</option>
                        <option value="custom_url">Custom Plagiarism API Sandbox (Moodle Integration)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الموديل اللغوي المختار (LLM Model)' : 'Selected Model'}</label>
                      <select
                        value={aiConfig.selectedModel}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, selectedModel: e.target.value }))}
                        className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 cursor-pointer h-10`}
                      >
                        {aiConfig.provider === 'gemini' ? (
                          <>
                            <option value="gemini-2.5-flash">gemini-2.5-flash (Fastest & recommended)</option>
                            <option value="gemini-2.5-pro">gemini-2.5-pro (Deep reasoning comparison)</option>
                            <option value="gemini-1.5-flash">gemini-1.5-flash (Classic legacy)</option>
                          </>
                        ) : aiConfig.provider === 'openai' ? (
                          <>
                            <option value="gpt-4o">gpt-4o</option>
                            <option value="gpt-4o-mini">gpt-4o-mini</option>
                          </>
                        ) : aiConfig.provider === 'claude' ? (
                          <>
                            <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                            <option value="claude-3-haiku">claude-3-haiku</option>
                          </>
                        ) : (
                          <>
                            <option value="custom-plagiarism-v1">Custom Plagiarism Classifier v1</option>
                            <option value="moodle-copier-check">Moodle Direct Similarity Filter</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* API Key Connection */}
                  <div className="space-y-1.5">
                    <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>
                      {lang === 'ar' ? 'رمز المصادقة البرمجي (API Key / Auth Secret)' : 'API Secret Access Key'}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••••••••••"
                        value={aiConfig.apiKey}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 pl-10 pr-3 outline-none focus:border-blue-500 font-mono tracking-widest h-10`}
                      />
                      <Lock className={`w-4 h-4 ${isLightMode ? 'text-slate-400' : 'text-slate-500'} absolute left-3 top-3.5`} />
                    </div>
                    <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} block font-normal leading-normal`}>
                      {lang === 'ar' 
                        ? 'إذا كان الحظر والتحميل مدار بواسطة الأمان الفيدرالي في .env، فستتم قراءة GEMINI_API_KEY تلقائياً. يمكنك تجاوزه بحفظ مفتاح مخصص هنا.'
                        : 'If managed inside the workspace settings or .env file, the model defaults to GEMINI_API_KEY. Leaving this bank will fallback cleanly onto your platform settings.'
                      }
                    </p>
                  </div>

                  {/* Data strategy Selector */}
                  <div className="space-y-1.5">
                    <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>
                      {lang === 'ar' ? 'استراتيجية هيكلة وتعبئة مدخلات البيانات (Data Transmission Packaging Strategy)' : 'Data Transmission & Packing Strategy'}
                    </label>
                    <select
                      value={aiConfig.dataStrategy}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, dataStrategy: e.target.value as any }))}
                      className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 cursor-pointer h-10`}
                    >
                      <option value="all_at_once_batch">
                        {lang === 'ar' ? 'إرسال كافة حضور وأوراق الحل دفعة واحدة ومقارنة كاملة (All-at-once Bundle Matrix)' : 'All-at-once Class Bundle (Analyze all students in a single prompt)'}
                      </option>
                      <option value="question_by_question">
                        {lang === 'ar' ? 'تقسيم الحلول: إرسال الحلول سؤالاً تلو الآخر لكافة الحضور ومطابقتها (Question-by-Question Sequence)' : 'Question-by-Question (Compare answers to the same Q ID consecutively)'}
                      </option>
                      <option value="pairwise_students">
                        {lang === 'ar' ? 'التفريع الثنائي الجنائي: مقارنة طالبين ضد طالبين بشكل متعاقب (Pairwise Student-vs-Student Evaluation)' : 'Pairwise candidate comparison (Compare Student A to Student B pairwise)'}
                      </option>
                      <option value="single_student_baseline">
                        {lang === 'ar' ? 'المقارنة الفردية المتجهة: فحص الطالب ضد معيار الحل وحل المودل (Single Student against baseline answers)' : 'Single candidate audit (Compare student answer onto baseline textbook keys)'}
                      </option>
                    </select>
                    <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-450'} block font-normal leading-normal`}>
                      {lang === 'ar' 
                        ? 'تتحكم هذه الاستراتيجية في شكل حزم البيانات المصدرة للمحرك الخارجي لتوفير التكلفة وتقليل استهلاك الرموز (Tokens Accuracy).'
                        : 'This governs how JSON schemas are packed and submitted to the API, controlling token efficiency and plagiarism diagnostic granularity.'
                      }
                    </p>
                  </div>

                  {/* Prompt Textareas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الطلب النموذجي باللغة العربية (Prompt Template)' : 'Arabic Prompt Template'}</label>
                      <textarea
                        rows={5}
                        value={aiConfig.promptTemplateAr}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, promptTemplateAr: e.target.value }))}
                        className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-305'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 font-mono text-[10.5px] leading-relaxed`}
                        placeholder="صيغة الطلب..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'الطلب النموذجي باللغة الإنجليزية (Prompt Template)' : 'English Prompt Template'}</label>
                      <textarea
                        rows={5}
                        value={aiConfig.promptTemplateEn}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, promptTemplateEn: e.target.value }))}
                        className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-305'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 font-mono text-[10.5px] leading-relaxed`}
                        placeholder="Prompt specifications..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer transition flex items-center gap-2 select-none font-sans disabled:opacity-50"
              >
                {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{lang === 'ar' ? 'حفظ إعدادات وتكامل نموذج الفحص السحابي' : 'Save Connection & Plagiarism Settings'}</span>
              </button>
            </div>
          </div>

          {/* Prompt Variables Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-4 shadow-lg`}>
              <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                {lang === 'ar' ? 'المتغيرات الصالحة للتبديل' : 'Dynamic Injection Variables'}
              </h3>
              
              <div className="space-y-2 text-xs font-mono select-all">
                <div className={`p-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} rounded border flex justify-between items-center`}>
                  <span className="text-blue-400 font-bold">{"{{student_a_answers}}"}</span>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ar' ? 'إجابات الطالب الأول' : 'Student A Answer set'}</span>
                </div>
                
                <div className={`p-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} rounded border flex justify-between items-center`}>
                  <span className="text-blue-400 font-bold">{"{{student_b_answers}}"}</span>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ar' ? 'إجابات الطالب الثاني' : 'Student B Answer set'}</span>
                </div>

                <div className={`p-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} rounded border flex justify-between items-center`}>
                  <span className="text-blue-400 font-bold">{"{{exam_metadata}}"}</span>
                  <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{lang === 'ar' ? 'تفاصيل ومعلومات الاختبار' : 'Exam metadata specs'}</span>
                </div>
              </div>

              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-820 text-slate-400'} p-4 border rounded-xl text-xs space-y-2 font-sans leading-normal`}>
                <h4 className={`font-extrabold ${isLightMode ? 'text-slate-700' : 'text-slate-300'} block`}>{lang === 'ar' ? 'دقة الرصد ومخرجات التواطؤ' : 'Structural Similarity Indexing'}</h4>
                <p>
                  {lang === 'ar'
                    ? 'يقوم محرك الذكاء الاصطناعي بتحليل الأوراق بشكل عميق متجاوزاً تشابه النصوص الحرفي (Lexical Similarity) إلى التشابه الدلالي (Semantic Plagiarism)، مما يضمن تحديد الحلول المنتجة بواسطة برمجيات مساعدة أو الغش الصامت بدقة متناهية.'
                    : 'External models dissect candidates scripts parsing past literal patterns to address semantic mutations, addressing zero-input copy tasks seamlessly.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-entry">
          {/* Column 1: Time Calculation Dashboard */}
          <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-5 shadow-lg`}>
            <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-3`}>
              <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{lang === 'ar' ? 'معايير حساب وتقدير زمن الامتحان' : 'Exam Baseline Duration Parameters'}</span>
              </h3>
            </div>
            
            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'} leading-relaxed`}>
              {lang === 'ar' 
                ? 'تحتوي هذه اللوحة على الخوارزمية الخاصة بحساب زمن الامتحان المتوقع/المقدر للطلاب بناءً على أوزان صعوبة الأسئلة وضبط تقدير المدرس المباشر.'
                : 'Configure the global timing expectance variables. The engine estimates perfect exam runtimes for each student based on the baseline complexity coefficients.'
              }
            </p>

            <div className="space-y-4">
              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'زمن السؤال للاختبار السهل (دقيقة لكل سؤال):' : 'Easy Exam Questions Base (Minutes/Question):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={timingConfig.easyBaseMinutesPerQuestion}
                    onChange={(e) => setTimingConfig(prev => ({ ...prev, easyBaseMinutesPerQuestion: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {timingConfig.easyBaseMinutesPerQuestion}د
                  </span>
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'زمن السؤال للاختبار المتوسط (دقيقة لكل سؤال):' : 'Medium Exam Questions Base (Minutes/Question):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="2" max="25" step="1"
                    value={timingConfig.mediumBaseMinutesPerQuestion}
                    onChange={(e) => setTimingConfig(prev => ({ ...prev, mediumBaseMinutesPerQuestion: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {timingConfig.mediumBaseMinutesPerQuestion}د
                  </span>
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'زمن السؤال للاختبار الصعب (دقيقة لكل سؤال):' : 'Hard Exam Questions Base (Minutes/Question):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="3" max="40" step="1"
                    value={timingConfig.hardBaseMinutesPerQuestion}
                    onChange={(e) => setTimingConfig(prev => ({ ...prev, hardBaseMinutesPerQuestion: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {timingConfig.hardBaseMinutesPerQuestion}د
                  </span>
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'معامل تقدير المعلم المباشر (مضاعف الوقت المقدر):' : 'Teacher Adjustment Multiplier (Speed Coefficient):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="0.5" max="3.0" step="0.1"
                    value={timingConfig.teacherTimeAdjustment}
                    onChange={(e) => setTimingConfig(prev => ({ ...prev, teacherTimeAdjustment: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {timingConfig.teacherTimeAdjustment.toFixed(1)}x
                  </span>
                </div>
                <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} block mt-1`}>
                  {lang === 'ar' ? '* يستعمل لرفع أو خفض أزمنة الحل التقديرية بناءً على مستوى دفعة الطلاب الحالي.' : '* Alters estimated runtimes to adapt to student levels dynamic coefficients.'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveTiming}
                disabled={savingTiming}
                className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingTiming ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ إعدادات الوقت' : 'Commit Timing Config')}</span>
              </button>
            </div>

            {/* Dynamics Live Exams Expectancy Simulation View */}
            <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'} p-4 rounded-xl border space-y-3`}>
              <h4 className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                {lang === 'ar' ? 'بروفة حية لتقديرات زمن الامتحانات الحالية:' : 'Live Estimate Simulation Table:'}
              </h4>
              <div className="overflow-x-auto">
                <table className={`w-full text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} text-left border-collapse`}>
                  <thead>
                    <tr className={`border-b ${isLightMode ? 'border-slate-200 text-slate-400' : 'border-slate-850 text-slate-500'} text-[10.5px]`}>
                      <th className={`pb-2 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الامتحان' : 'Exam'}</th>
                      <th className="pb-2 text-center">{lang === 'ar' ? 'الصعوبة' : 'Diff'}</th>
                      <th className="pb-2 text-center">{lang === 'ar' ? 'الأسئلة' : 'Qcount'}</th>
                      <th className="pb-2 text-center">{lang === 'ar' ? 'المقدار المتوقع' : 'Estimated'}</th>
                      <th className="pb-2 text-center">{lang === 'ar' ? 'الحد الأقصى' : 'Limit'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.slice(0, 5).map((ex) => {
                      const qCount = 5;
                      const baseMin = ex.difficulty === "easy" 
                        ? timingConfig.easyBaseMinutesPerQuestion 
                        : ex.difficulty === "medium" 
                        ? timingConfig.mediumBaseMinutesPerQuestion 
                        : timingConfig.hardBaseMinutesPerQuestion;
                      const expectedDuration = Math.round(qCount * baseMin * timingConfig.teacherTimeAdjustment);
                      
                      return (
                        <tr key={ex.id} className={`border-b ${isLightMode ? 'border-slate-200 hover:bg-slate-100' : 'border-slate-900/50 hover:bg-slate-900/20'} text-[10px]`}>
                          <td className={`py-2 truncate max-w-[130px] font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                            {lang === 'ar' ? ex.nameAr : ex.nameEn}
                          </td>
                          <td className="py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ex.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' : ex.difficulty === 'medium' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-100'}`}>
                              {ex.difficulty}
                            </span>
                          </td>
                          <td className={`py-2 text-center font-mono font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-405'}`}>{qCount}</td>
                          <td className="py-2 text-center font-mono font-black text-amber-400 text-xs">
                            {expectedDuration} دقيقة
                          </td>
                          <td className={`py-2 text-center font-mono ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>{ex.timeLimit} دقيقة</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Column 2: Plagiarism and Copy-Paste Formula Controls */}
          <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-5 shadow-lg`}>
            <div className={`flex justify-between items-center border-b ${isLightMode ? 'border-slate-200' : 'border-slate-850'} pb-3`}>
              <h3 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-red-500" />
                <span>{lang === 'ar' ? 'معادلة فحص النسخ واللصق الثنائية' : 'Bidirectional Plagiarism Math Formula'}</span>
              </h3>
            </div>

            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'} leading-relaxed`}>
              {lang === 'ar' 
                ? 'وفق طلبك، قمنا بدعم تتبع النسخ واللصق على مستوى كل سؤال ومستوى الطالب. إذا قام الطالب بنسخ السؤال ولصق الجواب فورا بنمط ChatGPT، يتعرف النظام تلقائيا على هذا المسار لحساب مؤشر الغش الحقيقي بناءً على عتبة النسبة المحددة.'
                : 'Bidirectional telemetry monitors copy/paste both globally and per-question level. If students copy questions to an AI model and paste outcomes immediately, the formula exposes maximum risk based on adjustable percentage anchors.'
              }
            </p>

            <div className="space-y-4">
              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'سقف نقاط خطورة النسخ واللصق الكلي (الوزن الأقصى):' : 'Plagiarism Max Risk Coefficient (Weight Peak):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="5" max="50" step="1"
                    value={copyPasteConfig.maxRiskPoints}
                    onChange={(e) => setCopyPasteConfig(prev => ({ ...prev, maxRiskPoints: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {copyPasteConfig.maxRiskPoints}ن
                  </span>
                </div>
                <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} mt-1 block`}>
                  {lang === 'ar' ? '* تمثل القيمة القصوى من 100 والتي يكسبها الطالب عند تجاوز مؤشرات الغش المعرفة أدناه.' : '* Maximum risk value points applied out of 100 on rule threshold triggers.'}
                </span>
              </div>

              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'الحد الأدنى لعملية النسخ واللصق بالسؤال الواحد للتصنيف كغش:' : 'Simultaneous Copy-Paste ChatGPT Loop (Min Count/Single Question):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={copyPasteConfig.chatGPTPatternThreshold}
                    onChange={(e) => setCopyPasteConfig(prev => ({ ...prev, chatGPTPatternThreshold: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {copyPasteConfig.chatGPTPatternThreshold}س
                  </span>
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'} block mb-1`}>
                  {lang === 'ar' ? 'عتبة نسبة الأسئلة المخترقة لتطبيق العقوبة الكلية (100% من النقاط):' : 'Abuse Ratio Trigger Coefficient (100% Risk Ceiling Level):'}
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={copyPasteConfig.abusedMultiplier * 100}
                    onChange={(e) => setCopyPasteConfig(prev => ({ ...prev, abusedMultiplier: Number(e.target.value) / 100 }))}
                    className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded min-w-[35px] text-center">
                    {(copyPasteConfig.abusedMultiplier * 100).toFixed(0)}%
                  </span>
                </div>
                <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} mt-1 block`}>
                  {lang === 'ar' ? '* مثال: إذا أسيء استخدام 20% فأكثر من الأسئلة، تضاف نقاط خطر كبرى 20/20 للطالب.' : '* Example: If 20% or more questions of the exam present abuse, full risk points allocated instantly.'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveCopyPaste}
                disabled={savingCopyPaste}
                className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingCopyPaste ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ معادلة النسخ وحظر ChatGPT' : 'Commit Plagiarism Equation')}</span>
              </button>
            </div>

            {/* Simulated Live Mathematical Output Previewer */}
            <div className={`${isLightMode ? 'bg-slate-50 border-red-500/10' : 'bg-slate-950 border-red-500/10'} p-4 rounded-xl border space-y-3`}>
              <h4 className={`text-xs font-bold text-red-400 flex items-center justify-between border-b ${isLightMode ? 'border-slate-200' : 'border-slate-900'} pb-1.5`}>
                <span>{lang === 'ar' ? 'محاكي الخوارزمية الفوري (Interactive Calculator):' : 'Interactive Plagiarism Equation simulator:'}</span>
                <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} underline font-mono`}>100% Dynamic</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-[10.5px]">
                <div className={`space-y-1 ${isLightMode ? 'bg-white/40 border-slate-200' : 'bg-slate-900/40 border-slate-850'} p-2.5 rounded border`}>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} uppercase font-bold block`}>{lang === 'ar' ? 'طالب افتراضي أ وب:' : 'Simulation Metrics'}</span>
                  <p className={`text-[10.5px] font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                    {lang === 'ar' ? 'اختبار مكون من ٥ أسئلة' : '5-Question Exam Pattern'}
                  </p>
                  <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-0.5 leading-relaxed`}>
                    {lang === 'ar' ? 'رُصدت ثنائية النسخ-اللصق في سؤال واحد.' : 'Plagiarism detected on exactly 1 out of 5 questions.'}
                  </p>
                </div>

                <div className={`space-y-1 ${isLightMode ? 'bg-white/40 border-slate-200' : 'bg-slate-900/40 border-slate-850'} p-2.5 rounded border flex flex-col justify-center`}>
                  <span className={`text-[9px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} uppercase font-bold block`}>{lang === 'ar' ? 'درجة الخطر التلقائية المحتسب:' : 'Calculated Cheat Risk Output'}</span>
                  <p className={`text-xs font-black ${isLightMode ? 'text-slate-800' : 'text-white'} flex items-baseline gap-1 mt-0.5`}>
                    <span className="text-base text-red-400">
                      { 0.20 >= copyPasteConfig.abusedMultiplier 
                        ? copyPasteConfig.maxRiskPoints 
                        : Math.round(copyPasteConfig.maxRiskPoints * (0.20 / copyPasteConfig.abusedMultiplier))
                      }
                    </span>
                    <span className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-500'} font-mono`}>/ {copyPasteConfig.maxRiskPoints} {lang === 'ar' ? 'نقطة' : 'points'}</span>
                  </p>
                  <span className={`text-[9px] font-mono font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                    { 0.20 >= copyPasteConfig.abusedMultiplier 
                      ? (lang === 'ar' ? 'خطورة قصوى لتخطي العتبة' : 'Max risk: ceiling triggered!')
                      : (lang === 'ar' ? `خطورة نسبية (${Math.round((0.20 / copyPasteConfig.abusedMultiplier) * 100)}%)` : 'Relative risk ratio Applied.')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'anomaly_weights' && (
        <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-6 space-y-6 shadow-xl`}>
          <div className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-4`}>
            <h3 className="text-sm font-black uppercase text-[#6366f1] tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-5 h-5 text-[#6366f1]" />
              <span>
                {lang === 'ar' ? 'تخصيص الأوزان الرياضية لمؤشرات الغش (Risk Score Mathematics)' : 'Mathematical Anomaly Category Weightings'}
              </span>
            </h3>
            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-1.5 leading-normal`}>
              {lang === 'ar' 
                ? 'خصص القيمة الرياضية (بالنقاط) لكل مخالفة سلوكية مرصودة لحساب درجة خطورة الطالب الكلية. يتم تطبيق الأوزان في الوقت الفعلي على جميع جلسات الامتحان النشطة.'
                : 'Define custom mathematical penalty weightings for each automated telemetry infraction. These metrics compose the final student Risk Score (0-100%).'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Sliders for weights */}
            <div className="space-y-5">
              <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-wider">
                {lang === 'ar' ? 'معايير السلوك السريع والحافظة (Interactive Weights):' : 'Clipboard & Navigation Telemetry Weights:'}
              </h4>

              {/* Slider for Tab Switch */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'تبديل نافذة غريبة (Tab Switch):' : 'Tab Switch Event Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.tabSwitch} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="1" max="15" step="1"
                  value={anomalyWeights.tabSwitch}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, tabSwitch: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-550'} block leading-tight`}>
                  {lang === 'ar' ? '* تُسند غرامة لكل تكرار في مغادرة الطالب لنافذة الحل.' : '* Multiplied per each browser tab switch or window blur caught.'}
                </span>
              </div>

              {/* Slider for Paste */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'عملية اللصق (Paste Event):' : 'Paste Event Action Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.paste} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="1" max="15" step="1"
                  value={anomalyWeights.paste}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, paste: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* تُضاف لكل تكرار لعمليات اللصق في حقول الإجابة.' : '* Incremented per raw clipboard paste action recorded.'}
                </span>
              </div>

              {/* Slider for Copy */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'عملية النسخ (Copy Event):' : 'Copy Event Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.copy} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="1" max="15" step="1"
                  value={anomalyWeights.copy}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, copy: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* تسند لنسخ الطالب لنصوص الأسئلة لتلقين chatgpt.' : '* Incremented when candidate copies exam question text to clipboard.'}
                </span>
              </div>

              {/* Slider for Focus-Out duration */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'خروج الفوكس الطويل (Focus Out Prolonged):' : 'Prolonged Window Defocus Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.focusOut} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="5" max="40" step="5"
                  value={anomalyWeights.focusOut}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, focusOut: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* تُطبق إذا مكث الطالب خارج النافذة وقتاً ممتداً.' : '* Applies when candidate dwells away from the exam focus zone for > 30s.'}
                </span>
              </div>
            </div>

            {/* Right Column: Serious Systemic Violations weight sliders */}
            <div className="space-y-5">
              <h4 className="text-xs font-black uppercase text-rose-400 font-mono tracking-wider">
                {lang === 'ar' ? 'مخالفات النظام الحاسمة وتلقين الذكاء (Systemic Metrics):' : 'Systemic Critical & AI Anomalies:'}
              </h4>

              {/* Slider for IP conflict */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'تطابق عنوان IP لمرشحين (IP Address Collision):' : 'IP Address Conflict Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.ipConflict} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="10" max="60" step="5"
                  value={anomalyWeights.ipConflict}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, ipConflict: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* تطابق عنوان شبكة الطالب مع طالب آخر في نفس القاعة.' : '* Triggered if 2 candidates submit under identical network nodes.'}
                </span>
              </div>

              {/* Slider for AI Detection matches */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'مخرجات الكشف الدلالي للذكاء الاصطناعي (AI Similarity Detect):' : 'AI Plagiarism Semantic Match Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.aiGenerated} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="10" max="60" step="5"
                  value={anomalyWeights.aiGenerated}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, aiGenerated: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* تُسند تلقائياً إذا أثبت فحص تشابه الذكاء نسبة عالية لسرقات النصوص.' : '* Assorated when the similarity engine flags verified duplicate solutions.'}
                </span>
              </div>

              {/* Slider for Rapid Completion */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'الحل فائق السرعة العشوائي (Rapid Solve completion):' : 'Speedy Completion Anomaly Penalty:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.rapidCompletion} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="10" max="60" step="5"
                  value={anomalyWeights.rapidCompletion}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, rapidCompletion: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* تُطبق إذا أنهى الطالب الإجابات في ثوانٍ معدودة مقارنة بتقدير المدرس.' : '* Triggers immediately if actual solve duration is < 20% of expectation.'}
                </span>
              </div>

              {/* Slider for Macro usage */}
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850/50'} p-4 rounded-xl border space-y-3`}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-350'}`}>
                    {lang === 'ar' ? 'نمط نقرات الماكرو الخارجية (Macro usage):' : 'Simulated Keyboard Macro Injection:'}
                  </label>
                  <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded">
                    {anomalyWeights.macroUsage} {lang === 'ar' ? 'نقاط' : 'points'}
                  </span>
                </div>
                <input 
                  type="range" min="5" max="45" step="5"
                  value={anomalyWeights.macroUsage}
                  disabled={!isAdmin}
                  onChange={(e) => setAnomalyWeights(prev => ({ ...prev, macroUsage: Number(e.target.value) }))}
                  className={`w-full h-1.5 ${isLightMode ? 'bg-slate-200' : 'bg-slate-900'} rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-50`}
                />
                <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-555'} block leading-tight`}>
                  {lang === 'ar' ? '* رصد استخدام قنوات الكتابة الصورية التلقائية بالامتحان.' : '* Flagged if answer delta keystroke speed suggests artificial injections.'}
                </span>
              </div>
            </div>
          </div>

          <div className={`pt-4 flex justify-between items-center border-t ${isLightMode ? 'border-slate-200' : 'border-slate-850'}`}>
            <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} max-w-md`}>
              {lang === 'ar' 
                ? 'مجموع الأوزان الكلية الحالية يمثل عتبة استدعاء المراقبة الفورية. لحساب النقاط، يتكامل النظام ديناميكياً مع الأوزان لتوزيع نسب كشف الحالات.'
                : 'Current penalty weights are dynamically consumed by the telemetry resolver server on each candidate event delta.'
              }
            </span>

            {isAdmin ? (
              <button
                onClick={handleSaveAnomalyWeights}
                disabled={savingAnomalyWeights}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition shadow"
              >
                {savingAnomalyWeights ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savingAnomalyWeights ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving rules...') : (lang === 'ar' ? 'حفظ الأوزان والنسب الرياضية' : 'Save Custom Equation weights')}</span>
              </button>
            ) : (
              <div className="bg-red-500/10 text-red-400 border border-red-500/15 rounded-lg px-4 py-2 text-[11px] font-bold">
                {lang === 'ar' ? '⚙️ معطل: اطلب رتبة مسؤول لحفظ التعديلات' : '⚙️ Locked: Request admin clearance to save weights'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Sandbox Trial Simulation Area - Available in both views */}
      <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 space-y-4 shadow-xl`}>
        <div className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
          <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'منصة مراجعة حزم البيانات ومحاكاة المقارنة (Dynamic Proctoring Sandbox)' : 'Active packing & comparison testbed'}
            </span>
          </h3>
          <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-1 leading-normal`}>
            {lang === 'ar'
              ? 'اختر اختباراً نشطاً لمحاكاة فرز وتعبئة بيانات الطلاب استناداً إلى استراتيجية التغليف المعتمدة بالأعلى، ومشاهدة سجل البيانات المصدرة الفوري.'
              : 'Choose any active lecture examination session to compile packing matrices and view the raw payload buffers exported to the intelligence engines.'
            }
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-1 text-xs font-sans w-full md:w-80">
            <label className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-bold block`}>{lang === 'ar' ? 'اختر جلسة الاختبار المراد فحصها' : 'Select Exam Session for Audit'}</label>
            <select
              value={selectedSandboxExamId}
              onChange={(e) => setSelectedSandboxExamId(e.target.value)}
              className={`w-full ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'} rounded-lg py-2 px-3 outline-none focus:border-blue-500 cursor-pointer h-10`}
            >
              <option value="">-- {lang === 'ar' ? 'اختر اختباراً نشطاً' : 'Select Exam Session'} --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {lang === 'ar' ? ex.nameAr : ex.nameEn} ({ex.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunSimilarityAnalysis}
            disabled={runningAnalysis}
            className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-extrabold text-white cursor-pointer transition flex items-center gap-2 select-none font-sans disabled:opacity-50 h-10 shrink-0"
          >
            {runningAnalysis ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{lang === 'ar' ? 'برمجة الحزمة والمسح الدلالي الذكي' : 'Pack Data & Execute AI Similarity Match'}</span>
          </button>
        </div>

        {analysisOutput && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-4">
            {/* Terminal Packing log */}
            <div className="xl:col-span-4 space-y-2">
              <span className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 font-bold`}>
                <Terminal className="w-3.5" />
                <span>{lang === 'ar' ? 'سجل فرز وحزم البيانات للموديل:' : 'Forensic Data Packing Logs:'}</span>
              </span>
              
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'} p-4 rounded-xl border h-72 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 leading-normal select-text`}>
                {analysisOutput.packingLog.map((log, idx) => (
                  <div key={idx} className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-900/40'} pb-1 last:border-0`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Exported Raw Buffer Preview */}
            <div className="xl:col-span-4 space-y-2">
              <span className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 font-bold`}>
                <Code className="w-3.5" />
                <span>{lang === 'ar' ? 'معاينة ترويسة البيانات المصدرة (JSON Payload):' : 'Output Payload JSON Buffer Preview:'}</span>
              </span>
              
              <pre className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'} p-4 rounded-xl border h-72 overflow-auto font-mono text-[9px] text-blue-300 leading-normal select-text`}>
                {analysisOutput.packedPayloadPreview}
              </pre>
            </div>

            {/* AI Response Output */}
            <div className="xl:col-span-4 space-y-2">
              <span className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 font-bold`}>
                <Cpu className="w-3.5" />
                <span>{lang === 'ar' ? 'إفادة الموديل ومخرجات القرار:' : 'Intelligence Response & Insights:'}</span>
              </span>
              
              <div className={`${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-850 text-slate-300'} p-4 rounded-xl border h-72 overflow-y-auto font-sans text-xs whitespace-pre-wrap leading-relaxed select-text`}>
                <div className={`mb-2.5 pb-2 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-900'} flex justify-between items-center text-[10px] font-mono`}>
                  <span className={`text-[10.5px] uppercase font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-450'}`}>{lang === 'ar' ? 'نموذج الكشف النشط:' : 'Active detector:'}</span>
                  <span className={`px-2 py-0.5 rounded border ${analysisOutput.invokedWithRealApi ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' : 'bg-amber-500/10 text-amber-400 border-amber-500/15'}`}>
                    {analysisOutput.invokedWithRealApi ? (lang === 'ar' ? 'سحابي حي' : 'LIVE API') : (lang === 'ar' ? 'محاكاة موضعية' : 'LOCAL SIMULATOR')}
                  </span>
                </div>
                {analysisOutput.rawAiOutput}
              </div>
            </div>

            {/* Collusion Results summary card list */}
            <div className="xl:col-span-12 space-y-2 pt-2">
              <span className={`text-[10px] uppercase font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 font-bold`}>
                <CheckCircle2 className="w-3.5" />
                <span>{lang === 'ar' ? 'تشخيصات التطابق المشتبه بها المرصودة المسببة للغش:' : 'Detected Structural Collusion and Similarity Indicators:'}</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {analysisOutput.results.map((resItem, idx) => (
                  <div key={idx} className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} rounded-xl p-4 space-y-2.5`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-black ${isLightMode ? 'text-slate-700' : 'text-slate-200'} block`}>{resItem.itemLabel}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${resItem.similarityScore >= 75 ? 'bg-red-500/10 text-red-400 border border-red-500/15 animate-pulse' : resItem.similarityScore >= 35 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'}`}>
                        {lang === 'ar' ? 'التطابق:' : 'Similarity:'} {resItem.similarityScore}%
                      </span>
                    </div>

                    <div className={`text-[10.5px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} space-y-1`}>
                      <div className="flex gap-1.5 items-center">
                        <span className={`font-bold ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'الكيانات المشتبه بها:' : 'Entities under review:'}</span>
                        <span className="text-blue-300 font-bold">{resItem.suspectedEntities.join(lang === 'ar' ? ' و ' : ', ')}</span>
                      </div>
                      <p className={`leading-relaxed ${isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-850 text-slate-350'} p-2 rounded border mt-1`}>
                        {lang === 'ar' ? resItem.reasonAr : resItem.reasonEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
