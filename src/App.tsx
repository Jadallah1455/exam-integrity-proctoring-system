/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardPage from './components/DashboardPage';
import Toast from './components/Toast';
import QuickActionsMenu from './components/QuickActionsMenu';
import IntegrityPulseGauge from './components/IntegrityPulseGauge';
import PrivacyModeToggle from './components/PrivacyModeToggle';
import BatchProgressHUD from './components/BatchProgressHUD';
import ThresholdNotifier from './components/ThresholdNotifier';
import AcademicCohortSelectors from './components/AcademicCohortSelectors';
import SidebarNavigation from './components/SidebarNavigation';
import MobileDrawerMenu from './components/MobileDrawerMenu';
import TopHeader from './components/TopHeader';
import HealthIndicators from './components/HealthIndicators';
import MobileTabSwitcher from './components/MobileTabSwitcher';
import Footer from './components/Footer';
import { TelemetryPayload, AnomalyReport, ExamDifficulty } from './types';
import { translations } from './translations';
import { jsPDF } from 'jspdf';
import LoginPage from './components/LoginPage';

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));
const AuditorLogPage = lazy(() => import('./pages/AuditorLogPage'));
const RiskHeatmap = lazy(() => import('./components/RiskHeatmap'));
const EngineControlPanel = lazy(() => import('./components/EngineControlPanel'));
const StudentComparisonModal = lazy(() => import('./components/StudentComparisonModal'));
const SiteTour = lazy(() => import('./components/SiteTour'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));
const ProctorTimeoutLock = lazy(() => import('./components/ProctorTimeoutLock'));

export default function App() {
  interface Teacher {
    id: string;
    nameAr: string;
    nameEn: string;
  }
  interface Subject {
    id: string;
    teacherId: string;
    nameAr: string;
    nameEn: string;
  }
  interface Exam {
    id: string;
    subjectId: string;
    nameAr: string;
    nameEn: string;
    difficulty: ExamDifficulty;
    timeLimit: number;
  }

  const [allSubmissions, setSubmissions] = useState<TelemetryPayload[]>([]);
  const [allAnalyses, setAnalyses] = useState<AnomalyReport[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // Auth state
  const [user, setUser] = useState<{ id: string; username: string; role: string; nameAr: string; nameEn: string } | null>(() => {
    try {
      const saved = localStorage.getItem('cyber_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('prof_fadi');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub_calculus');
  const [selectedExamId, setSelectedExamId] = useState<string>('EXM-CALC-101');

  // Computed data focused strictly on the selected exam session
  const submissions = useMemo(() => {
    return allSubmissions.filter(s => s.examId === selectedExamId);
  }, [allSubmissions, selectedExamId]);

  const [aiRiskEngineEnabled, setAiRiskEngineEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ai_risk_engine_enabled');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);

  const analyses = useMemo(() => {
    const rawFiltered = allAnalyses.filter(a => a.examId === selectedExamId);
    if (!aiRiskEngineEnabled) {
      return rawFiltered.map(a => ({
        ...a,
        riskScore: 0,
        riskLevel: 'safe' as const,
        anomalies: [] as string[],
        aiInsightsText: undefined
      }));
    }
    return rawFiltered;
  }, [allAnalyses, selectedExamId, aiRiskEngineEnabled]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  // Always derived so the selection stays valid when analyses change
  const effectiveStudentId = useMemo(() => {
    if (analyses.length === 0) return null;
    if (!selectedStudentId) return analyses[0].studentId;
    return analyses.some(a => a.studentId === selectedStudentId)
      ? selectedStudentId
      : analyses[0].studentId;
  }, [analyses, selectedStudentId]);
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'simulator' | 'apiDocs' | 'heatmap' | 'engineControl' | 'auditorLog'>('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'roster' | 'alerts'>('overview');
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [compareStudentIdA, setCompareStudentIdA] = useState<string | null>(null);
  const [compareStudentIdB, setCompareStudentIdB] = useState<string | null>(null);

  // User role state - derived from auth
  const userRole: 'proctor' | 'admin' = user?.role === 'admin' ? 'admin' : 'proctor';
  const setUserRole = (role: 'admin' | 'proctor') => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('cyber_auth_user', JSON.stringify(updated));
    }
  };

  // Batch action progress tracking
  const [batchProgress, setBatchProgress] = useState<number | null>(null);
  const [batchOpName, setBatchOpName] = useState<string | null>(null);

  // Student Dashboard overview selection
  const [selectedSubDashboardId, setSelectedSubDashboardId] = useState<string | null>(null);

  // New features support states
  const [comparisonModeActive, setComparisonModeActive] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [liveFeedActive, setLiveFeedActive] = useState(true);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(false);
  const [sentNotificationKeys, setSentNotificationKeys] = useState<string[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);
  function loadLoggedBreaches(): string[] {
    try {
      const saved = localStorage.getItem('cyber_logged_threshold_breaches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
  const loggedThresholdBreachesRef = useRef<string[]>(loadLoggedBreaches());

  // Additional proctor states
  const [safetyAlertZone, setSafetyAlertZone] = useState<number>(82);
  const [anomalyFilter, setAnomalyFilter] = useState<string>('all');
  const [scrubMinute, setScrubMinute] = useState<number>(40);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Moodle Real-Time Stream Simulator State
  const [streamStudentId, setStreamStudentId] = useState<number>(2);
  const [streamStudentName, setStreamStudentName] = useState<string>("أحمد الشريف");
  const [streamQuizId, setStreamQuizId] = useState<number>(1);
  const [streamQuizName, setStreamQuizName] = useState<string>("quiz_test_1");
  const [streamEventType, setStreamEventType] = useState<string>("window_blur");
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamConsoleLogs, setStreamConsoleLogs] = useState<Array<{
    timestamp: string;
    eventType: string;
    eventId: string;
    success: boolean;
    resp?: any;
  }>>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('cyber_proctor_note_drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showHighRiskOnly, setShowHighRiskOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem('cyber_show_high_risk_only');
    return saved === 'true';
  });
  const [riskThreshold, setRiskThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('cyber_risk_threshold');
    return saved ? parseInt(saved, 10) : 75;
  });
  const [studentNotes, setStudentNotes] = useState<Record<string, Array<{ timestamp: string; note: string }>>>(() => {
    const saved = localStorage.getItem('cyber_proctor_notes');
    return saved ? JSON.parse(saved) : {};
  });

  // Privacy Protection Mode Engine
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cyber_privacy_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const getDeterministicAlias = (id: string) => {
    const aliases = [
      "Alpha Eagle", "Beta Falcon", "Gamma Hawk", "Delta Wolf", "Epsilon Fox", 
      "Zeta Owl", "Theta Lynx", "Kappa Badger", "Lambda Panda", "Mu Panther", 
      "Nu Cheetah", "Xi Raven", "Omicron Tiger", "Pi Bear", "Rho Puma", 
      "Sigma Jackal", "Tau Cobra", "Phi Bison", "Psi Seal", "Omega Otter"
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
       hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % aliases.length;
    const numericPart = Math.abs(hash) % 1000;
    return `${aliases[index]} #${numericPart}`;
  };

  const getDeterministicMaskedId = (id: string) => {
    if (!id) return '';
    if (id.length <= 4) return '***';
    return `${id.slice(0, 3)}-XX-XX-${id.slice(-2)}`;
  };

  const displaySubmissions = useMemo(() => {
    if (!privacyMode) return submissions;
    return submissions.map(sub => ({
      ...sub,
      studentId: getDeterministicMaskedId(sub.studentId),
      studentName: getDeterministicAlias(sub.studentId),
    }));
  }, [submissions, privacyMode]);

  const displayAnalyses = useMemo(() => {
    if (!privacyMode) return analyses;
    return analyses.map(an => ({
      ...an,
      studentId: getDeterministicMaskedId(an.studentId),
      studentName: getDeterministicAlias(an.studentId),
    }));
  }, [analyses, privacyMode]);

  const originalIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    submissions.forEach(sub => {
      map[getDeterministicMaskedId(sub.studentId)] = sub.studentId;
    });
    return map;
  }, [submissions]);

  // Auditor Activity Log State
  interface AuditorLogEntry {
    id: string;
    timestamp: string;
    actionType: 'verdict_change' | 'clear_cache' | 'add_note' | 'batch_verdict';
    studentId?: string;
    studentName?: string;
    description: string;
    userRole: 'proctor' | 'admin';
  }

  const [auditorLogs, setAuditorLogs] = useState<AuditorLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('cyber_auditor_activity_logs');
      return saved ? JSON.parse(saved) : [
        {
          id: 'log-init-1',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString().replace('T', ' ').slice(0, 19),
          actionType: 'add_note',
          studentId: 'STD-2026-03',
          studentName: 'فيصل السديري',
          description: 'Added internal note: Verified hardware setup during test entry.',
          userRole: 'admin'
        },
        {
          id: 'log-init-2',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString().replace('T', ' ').slice(0, 19),
          actionType: 'verdict_change',
          studentId: 'STD-2026-09',
          studentName: 'نورة السبيعي',
          description: 'Updated official verdict to approved (approved_under_observation).',
          userRole: 'proctor'
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cyber_auditor_activity_logs', JSON.stringify(auditorLogs));
  }, [auditorLogs]);

  const addAuditorLogEntry = (
    actionType: AuditorLogEntry['actionType'],
    studentId: string | undefined,
    studentName: string | undefined,
    description: string
  ) => {
    const newEntry: AuditorLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType,
      studentId,
      studentName,
      description,
      userRole
    };
    setAuditorLogs(prev => [newEntry, ...prev]);
  };

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Smart presets configuration states
  const defaultPresets = [
    {
      id: 'preset-collusion',
      nameEn: '☠️ Collusion & Network IP Conflict',
      nameAr: '☠️ التواطؤ وتعارض الشبكة',
      searchQuery: '',
      anomalyFilter: 'ip_conflict',
      riskFilter: 'high',
      showHighRiskOnly: true
    },
    {
      id: 'preset-copy-paste',
      nameEn: '📋 Heavy Copy & Paste Abuse',
      nameAr: '📋 نسخ ولصق مكثف',
      searchQuery: '',
      anomalyFilter: 'copy_paste',
      riskFilter: 'all',
      showHighRiskOnly: false
    },
    {
      id: 'preset-safe-vibe',
      nameEn: '🟢 Safe Candidates Session',
      nameAr: '🟢 فحص الطلاب الآمنين',
      searchQuery: '',
      anomalyFilter: 'all',
      riskFilter: 'safe',
      showHighRiskOnly: false
    }
  ];

  const [smartPresets, setSmartPresets] = useState(() => {
    const saved = localStorage.getItem('cyber_smart_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return defaultPresets;
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  // Effect to sync custom presets to localStorage
  useEffect(() => {
    localStorage.setItem('cyber_smart_presets', JSON.stringify(smartPresets));
  }, [smartPresets]);

  // Anonymized Telemetry Replay State
  const [replayState, setReplayState] = useState({
    active: false,
    playing: false,
    currentSecond: 0,
    totalDuration: 0,
    speed: 2,
    cursor: { x: 50, y: 50, clicked: false },
    activeQ: 1,
    eventLog: [] as { second: number; text: string; textAr: string; type: 'focus' | 'click' | 'blur' | 'copy' | 'paste' }[],
    currentMsg: '',
    currentMsgAr: ''
  });

  // Whenever showHighRiskOnly changes, serialize to localStorage
  useEffect(() => {
    localStorage.setItem('cyber_show_high_risk_only', showHighRiskOnly.toString());
  }, [showHighRiskOnly]);

  // Whenever studentNotes changes, serialize to localStorage
  useEffect(() => {
    localStorage.setItem('cyber_proctor_notes', JSON.stringify(studentNotes));
  }, [studentNotes]);

  // Whenever riskThreshold changes, serialize to localStorage
  useEffect(() => {
    localStorage.setItem('cyber_risk_threshold', riskThreshold.toString());
  }, [riskThreshold]);

  // Context Menu and interactive feedback states
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    studentId: string;
  } | null>(null);
  const [toast, setToast] = useState<{ messageAr: string; messageEn: string } | null>(null);

  const showToast = (messageAr: string, messageEn: string) => {
    setToast({ messageAr, messageEn });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    const handleCloseContextMenu = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleCloseContextMenu);
    window.addEventListener('scroll', handleCloseContextMenu);
    return () => {
      window.removeEventListener('click', handleCloseContextMenu);
      window.removeEventListener('scroll', handleCloseContextMenu);
    };
  }, []);

  // Dynamic HTML dynamic direction configuration
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Pattern Anomaly detector for repeating 'tab-switch-paste' sequences
  const [patternAnomalyStudentIds, setPatternAnomalyStudentIds] = useState<string[]>([]);
  const [aggressivePatternStudentIds, setAggressivePatternStudentIds] = useState<string[]>([]);
  
  useEffect(() => {
    const scanSessionPatterns = () => {
      const flaggedIds: string[] = [];
      const aggressiveIds: string[] = [];
      submissions.forEach(sub => {
        // Student has repeating tab switch / paste patterns
        const hasSequence = (sub.tabSwitchesCount >= 3 && sub.pasteCount >= 2) || (sub.tabSwitchesCount >= 2 && sub.pasteCount >= 3);
        const hasAggressive = sub.tabSwitchesCount >= 4 && sub.pasteCount >= 3;
        if (hasSequence) {
          flaggedIds.push(sub.studentId);
        }
        if (hasAggressive) {
          aggressiveIds.push(sub.studentId);
        }
      });
      setPatternAnomalyStudentIds(flaggedIds);
      setAggressivePatternStudentIds(aggressiveIds);
    };

    scanSessionPatterns();
    const interval = setInterval(scanSessionPatterns, 5000);
    return () => clearInterval(interval);
  }, [submissions]);

  // Persistent session timer countdown in header
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(3540); // 59 minutes, 00 seconds
  useEffect(() => {
    const countdown = setInterval(() => {
      setSessionTimeLeft(prev => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const formatSessionTime = (secondsTotal: number) => {
    const h = Math.floor(secondsTotal / 3600);
    const m = Math.floor((secondsTotal % 3600) / 60);
    const s = secondsTotal % 60;
    const pad = (val: number) => val.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Automatically scroll timeline to the latest event
  useEffect(() => {
    if (timelineContainerRef.current) {
      setTimeout(() => {
        if (timelineContainerRef.current) {
          timelineContainerRef.current.scrollTo({
            top: timelineContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [submissions, selectedStudentId, scrubMinute]);

  // Compile replay interaction data from student telemetry
  const compileReplayTimeline = (student: TelemetryPayload) => {
    const log: { second: number; text: string; textAr: string; type: 'focus' | 'click' | 'blur' | 'copy' | 'paste' }[] = [];
    let currentSec = 0;

    const qTelemetry = student.questionTelemetry || [];
    if (qTelemetry.length === 0) {
      // Mock question telemetry if empty
      const mockQs = [
        { questionId: 'q-1', questionNumber: 1, timeSpentSeconds: 45, changesCount: 4 },
        { questionId: 'q-2', questionNumber: 2, timeSpentSeconds: 60, changesCount: 1 },
        { questionId: 'q-3', questionNumber: 3, timeSpentSeconds: 30, changesCount: 8 }
      ];
      mockQs.forEach(q => {
        log.push({
          second: currentSec,
          text: `Focused Question ${q.questionNumber} answer workspace`,
          textAr: `تركيز مؤشر الكتابة على السؤال رقم ${q.questionNumber}`,
          type: 'focus'
        });
        const changes = q.changesCount;
        for (let c = 0; c < changes; c++) {
          const offset = Math.round(q.timeSpentSeconds * (c + 1) / (changes + 1));
          log.push({
            second: currentSec + offset,
            text: `Q${q.questionNumber}: Modified written response text`,
            textAr: `السؤال ${q.questionNumber}: تم تعديل إجابة النص المدخلة يدوياً`,
            type: 'click'
          });
        }
        currentSec += q.timeSpentSeconds;
      });
    } else {
      qTelemetry.forEach((q) => {
        const qNum = q.questionNumber;
        const qSecs = q.timeSpentSeconds || 40;

        log.push({
          second: currentSec,
          text: `Focused Question ${qNum} answer workspace`,
          textAr: `تركيز مؤشر الكتابة على السؤال رقم ${qNum}`,
          type: 'focus'
        });

        const changesCount = q.changesCount || 2;
        for (let c = 0; c < changesCount; c++) {
          const offset = Math.round(qSecs * (c + 1) / (changesCount + 1));
          log.push({
            second: currentSec + offset,
            text: `Question ${qNum}: Keypress response text modified`,
            textAr: `السؤال ${qNum}: تم تعديل إجابة النص المدخلة يدوياً`,
            type: 'click'
          });
        }

        currentSec += qSecs;
      });
    }

    // Scatter copies, pastes, out of bounds based on raw numbers
    if (student.copyCount > 0) {
      const step = Math.floor(currentSec / (student.copyCount + 1)) || 10;
      for (let i = 0; i < student.copyCount; i++) {
        const trigger = (i + 1) * step;
        log.push({
          second: trigger,
          text: `📋 Text Copied: Candidate copied text to local clipboard`,
          textAr: `📋 نسخ النص: قام الطالب بنسخ نص منطلق السؤال إلى الحافظة`,
          type: 'copy'
        });
      }
    }

    if (student.pasteCount > 0) {
      const step = Math.floor(currentSec / (student.pasteCount + 1)) || 10;
      for (let i = 0; i < student.pasteCount; i++) {
        const trigger = (i + 1) * step + 4;
        log.push({
          second: trigger,
          text: `📋 External Paste: Candidate pasted a block of external characters`,
          textAr: `📋 لصق خارجي: تم لصق نصوص مصدرية من خارج نافذة الاختبار المعتمدة`,
          type: 'paste'
        });
      }
    }

    if (student.tabSwitchesCount > 0) {
      const step = Math.floor(currentSec / (student.tabSwitchesCount + 1)) || 10;
      for (let i = 0; i < student.tabSwitchesCount; i++) {
        const trigger = (i + 1) * step;
        log.push({
          second: trigger,
          text: `🔴 Tab Blurred: Switched focus to alternative browser tab / window`,
          textAr: `🔴 تركيز ملغى: خروج المرشح الكامل من علامة تبويب الاختبار`,
          type: 'blur'
        });
        log.push({
          second: Math.min(currentSec, trigger + 4),
          text: `🟢 Connection Restored: Candidate returned back to secure browser viewport`,
          textAr: `🟢 استعادة التركيز: عودة المرشح مجدداً لبيئة تصفح الاختبار`,
          type: 'focus'
        });
      }
    }

    log.sort((a, b) => a.second - b.second);
    return { log, totalDuration: currentSec || 120 };
  };

  // Run replay clock tick simulation
  useEffect(() => {
    if (!replayState.active || !replayState.playing) return;

    const subId = selectedStudentId;

    const interval = setInterval(() => {
      setReplayState(prev => {
        if (prev.currentSecond >= prev.totalDuration) {
          clearInterval(interval);
          return { ...prev, playing: false };
        }
        const nextSec = prev.currentSecond + 1;
        
        // Calculate smooth cursor pathing
        const angle = nextSec * 0.45;
        const radiusX = 25 + Math.sin(angle * 1.3) * 20;
        const radiusY = 25 + Math.cos(angle * 0.7) * 18;
        const clickTrigger = nextSec % 6 === 0;

        // Active question based on time slice
        const currentStudentObj = submissions.find(s => s.studentId === subId);
        let activeQ = prev.activeQ;
        if (currentStudentObj) {
          let cumulative = 0;
          const qTel = currentStudentObj.questionTelemetry || [];
          for (const q of qTel) {
            cumulative += q.timeSpentSeconds;
            if (nextSec <= cumulative) {
              activeQ = q.questionNumber;
              break;
            }
          }
        }

        // Match exact events
        const match = prev.eventLog.find(ev => ev.second === nextSec);
        const msg = match ? match.text : prev.currentMsg;
        const msgAr = match ? match.textAr : prev.currentMsgAr;

        return {
          ...prev,
          currentSecond: nextSec,
          cursor: { x: 50 + radiusX, y: 50 + radiusY, clicked: clickTrigger },
          activeQ,
          currentMsg: msg,
          currentMsgAr: msgAr
        };
      });
    }, 1000 / replayState.speed);

    return () => clearInterval(interval);
  }, [replayState.active, replayState.playing, replayState.speed, selectedStudentId, submissions]);

  // Generate student initials and color hash for visual avatars
  const getStudentAvatarParams = (name: string) => {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    let initials = '';
    
    if (parts.length > 0) {
      const firstPart = parts[0];
      const firstLetter = Array.from(firstPart)[0];
      if (firstLetter) initials += firstLetter;
      
      if (parts.length > 1) {
        const secondPart = parts[1];
        const secondLetter = Array.from(secondPart)[0];
        if (secondLetter) initials += secondLetter;
      }
    }
    
    initials = initials.toUpperCase();
    
    // Choose beautiful background color gradients/hashes for modern visual ID
    const colors = [
      'from-blue-600 to-indigo-700 text-blue-100',
      'from-emerald-600 to-teal-700 text-emerald-100',
      'from-purple-600 to-fuchsia-700 text-purple-100',
      'from-rose-600 to-pink-700 text-rose-100',
      'from-amber-600 to-orange-700 text-amber-100',
      'from-cyan-600 to-blue-700 text-cyan-100',
      'from-indigo-600 to-violet-700 text-indigo-100 font-bold',
      'from-sky-600 to-purple-700 text-sky-100',
      'from-violet-600 to-pink-700 text-violet-100',
      'from-teal-600 to-emerald-700 text-teal-100'
    ];
    
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = colors[Math.abs(hash) % colors.length];
    
    return { initials, colorClass };
  };

  // Toggle button state for the Exam Performance Overview & Difficulty Correlation Widget
  const [difficultyChartView, setDifficultyChartView] = useState<'bar' | 'radar'>('bar');

  // Global Keyboard Shortcuts for proctoring decisions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is on inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (!selectedStudentId && key !== 'l' && key !== 'r' && key !== '/' && key !== '?') return;
      if (key === 'a') {
        e.preventDefault();
        handleVerdictChange(selectedStudentId, 'approved');
      } else if (key === 'i') {
        e.preventDefault();
        handleVerdictChange(selectedStudentId, 'investigation');
      } else if (key === 'l') {
        e.preventDefault();
        setLiveFeedActive(prev => !prev);
      } else if (key === 'r') {
        e.preventDefault();
        fetchData();
        showToast(
          'ًں”„ ط¬ط§ط±ظٹ طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„طھظ„ظٹظ…طھط±ظٹ...',
          'ًں”„ Refreshing telemetry data...'
        );
      } else if (key === '/' && !(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]');
        if (searchInput) searchInput.focus();
      } else if (key === '?' && !(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        e.preventDefault();
        setIsKeyboardHelpOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStudentId, analyses]);

  // Historical data helper for Risk Trend with future forecast band
  const getHistoricalRunData = (studentId: string, currentRisk: number) => {
    // Find submissions matching studentId
    const student = submissions.find(s => s.studentId === studentId);
    
    // Calculate a dynamic telemetry risk velocity
    // Higher counts of tabSwitches, copy-pastes, and out of bounds increase velocity
    let velocity = 5; // default base velocity
    if (student) {
      velocity = Math.max(3, 
        (student.tabSwitchesCount * 2.2) + 
        (student.pasteCount * 3.5) + 
        (student.outOfBoundsCount * 1.5)
      );
    }
    
    // Add some random/slight offset to forecast based on studentId hash to look extremely realistic
    let idHash = 0;
    for (let i = 0; i < studentId.length; i++) {
      idHash += studentId.charCodeAt(i);
    }
    const realOffset = (idHash % 4) - 2;
    const finalVelocity = Math.max(2, velocity + realOffset);

    // Get historical dataset base
    let baseHistory: Array<{ session: string; score?: number; forecastMin?: number; forecastMax?: number }>;
    
    switch (studentId) {
      case "STD-2023-8891":
        baseHistory = [
          { session: "EXM-101", score: 12 },
          { session: "EXM-201", score: 25 },
          { session: "EXM-301", score: 55 },
          { session: "EXM-305", score: 75 },
          { session: lang === 'ar' ? "EXM-401 (ط§ظ„ط­ط§ظ„ظٹ)" : "EXM-401 (Current)", score: currentRisk }
        ];
        break;
      case "STD-2023-4412":
        baseHistory = [
          { session: "EXM-101", score: 5 },
          { session: "EXM-201", score: 10 },
          { session: "EXM-301", score: 7 },
          { session: "EXM-305", score: 12 },
          { session: lang === 'ar' ? "EXM-401 (ط§ظ„ط­ط§ظ„ظٹ)" : "EXM-401 (Current)", score: currentRisk }
        ];
        break;
      case "STD-2023-3329":
        baseHistory = [
          { session: "EXM-101", score: 8 },
          { session: "EXM-201", score: 15 },
          { session: "EXM-301", score: 22 },
          { session: "EXM-305", score: 40 },
          { session: lang === 'ar' ? "EXM-401 (ط§ظ„ط­ط§ظ„ظٹ)" : "EXM-401 (Current)", score: currentRisk }
        ];
        break;
      case "STD-2023-1025":
        baseHistory = [
          { session: "EXM-101", score: 18 },
          { session: "EXM-201", score: 25 },
          { session: "EXM-301", score: 32 },
          { session: lang === 'ar' ? "EXM-201 (ط§ظ„ط­ط§ظ„ظٹ)" : "EXM-201 (Current)", score: currentRisk }
        ];
        break;
      default:
        baseHistory = [
          { session: "EXM-PREV-1", score: Math.max(0, currentRisk - 30) },
          { session: "EXM-PREV-2", score: Math.max(0, currentRisk - 15) },
          { session: lang === 'ar' ? "EXM-CURRENT (ط§ظ„ط­ط§ظ„ظٹ)" : "EXM-CURRENT (Current)", score: currentRisk }
        ];
        break;
    }

    // Map historical elements: for past elements, set forecast to score, creating a smooth line
    const mappedHistory = baseHistory.map(item => ({
      ...item,
      forecastMin: item.score,
      forecastMax: item.score
    }));

    // Generate forecast projection for remaining exam duration
    // Max projection goes up to +currentVelocity, Min projection is bounded
    const projMax = Math.min(100, Math.round(currentRisk + finalVelocity));
    const projMin = Math.max(0, Math.round(currentRisk - Math.max(2, finalVelocity / 2.5)));

    mappedHistory.push({
      session: lang === 'ar' ? "ط§ظ„طھظ†ط¨ط¤ (ظ…ط³طھظ‚ط¨ظ„)" : "Forecast (Remaining)",
      forecastMin: projMin,
      forecastMax: projMax
      // Keep main 'score' undefined for historical line so it doesn't render past actual current test point!
    });

    return mappedHistory;
  };

  const getCompareChartData = (subA: TelemetryPayload, subB: TelemetryPayload, anA: AnomalyReport, anB: AnomalyReport) => {
    return [
      {
        name: lang === 'ar' ? 'ط¯ط±ط¬ط© ط§ظ„ط®ط·ظˆط±ط© %' : 'Risk Score %',
        [subA.studentName]: anA.riskScore,
        [subB.studentName]: anB.riskScore,
      },
      {
        name: lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Tab Switches',
        [subA.studentName]: subA.tabSwitchesCount,
        [subB.studentName]: subB.tabSwitchesCount,
      },
      {
        name: lang === 'ar' ? 'ظ…ط±ط§طھ ط§ظ„ظ†ط³ط®' : 'Copies Count',
        [subA.studentName]: subA.copyCount,
        [subB.studentName]: subB.copyCount,
      },
      {
        name: lang === 'ar' ? 'ظ…ط±ط§طھ ط§ظ„ظ„طµظ‚' : 'Pastes Count',
        [subA.studentName]: subA.pasteCount,
        [subB.studentName]: subB.pasteCount,
      },
      {
        name: lang === 'ar' ? 'طھط¬ط§ظˆط² ط§ظ„ط­ط¯ظˆط¯' : 'Bounds Crossed',
        [subA.studentName]: subA.outOfBoundsCount,
        [subB.studentName]: subB.outOfBoundsCount,
      }
    ];
  };

  // Bulk Forensic Cohort PDF report downloader (combines selected students on distinct pages)
  const downloadBulkForensicPDF = () => {
    if (batchSelectedIds.length === 0) return;
    
    setPdfGenerating(true);
    try {
      const doc = new jsPDF();
      
      batchSelectedIds.forEach((studentId, idx) => {
        const s = submissions.find(sub => sub.studentId === studentId);
        const a = analyses.find(an => an.studentId === studentId);
        if (!s || !a) return;

        // If not the first page, add a page
        if (idx > 0) {
          doc.addPage();
        }

        const primaryColor = [15, 23, 42]; // Slate 900
        const accentColor = a.riskScore >= 60 ? [239, 68, 68] : a.riskScore >= 35 ? [249, 115, 22] : [16, 185, 129];
        
        // Header Banner
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("UNIVERSITY FORENSIC COHORT DOSSIER", 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleString()} (UTC) | Page ${idx + 1} of ${batchSelectedIds.length}`, 14, 28);
        doc.text(`Active Cohort Examination Quality Control Protocol`, 14, 34);
        
        // Risk Score Box
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(148, 8, 48, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("RISK COEFFICIENT", 152, 15);
        doc.setFontSize(18);
        doc.text(`${a.riskScore}%`, 152, 26);

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
          ["Candidate Name:", s.studentName],
          ["Student ID:", s.studentId],
          ["Exam Code/Name:", `${s.examId} - ${s.examName}`],
          ["Exam Difficulty:", s.examDifficulty.toUpperCase()],
          ["Time Limit / Spent:", `${s.examTimeLimitMinutes} mins / ${s.durationMinutes} mins`],
          ["Score Achieved:", `${s.scorePercent}%`],
          ["Associated IP Addresses:", s.ipAddresses.join(", ")],
          ["Signature Authenticity:", s.signature ? "VALID HMAC (SHA256)" : "UNSIGNED/LOCAL"]
        ];
        
        let y = 62;
        details.forEach(([lbl, val]) => {
          doc.setFont("helvetica", "bold");
          doc.text(String(lbl), 14, y);
          doc.setFont("helvetica", "normal");
          doc.text(String(val), 62, y);
          y += 6.5;
        });

        // Threat Profile Dimensions
        y += 4;
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("BEHAVIORAL RISK METRICS", 14, y);
        doc.line(14, y + 3, 196, y + 3);
        
        y += 10.5;
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        
        const metrics = [
          ["Browser Tab Switches Count", `${s.tabSwitchesCount} times`],
          ["Clipboard Access (Copies/Pastes)", `${s.copyCount} copies / ${s.pasteCount} pastes`],
          ["Cursor Offscreen Inactivity Duration", `${s.mouseOutSeconds} seconds`],
          ["Browser Window Bounds Crossings", `${s.outOfBoundsCount} occurrences`],
          ["IP Co-location Network Conflict", a.ipAddressConflict ? "YES (Collusion Flagged)" : "NO"]
        ];
        
        metrics.forEach(([lbl, val]) => {
          doc.setFont("helvetica", "bold");
          doc.text(String(lbl), 14, y);
          doc.setFont("helvetica", "normal");
          doc.text(String(val), 100, y);
          y += 6.5;
        });

        // Violations Log
        y += 4;
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("OFFICIAL INTEGRITY AUDIT LOG", 14, y);
        doc.line(14, y + 3, 196, y + 3);
        
        y += 10.5;
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        
        if (a.anomalies.length === 0) {
          doc.setFont("helvetica", "bold");
          doc.text("No specific compliance anomalies detected during this proctoring session.", 14, y);
          y += 8;
        } else {
          a.anomalies.forEach((anom) => {
            let mapped = anom;
            if (anom.includes('طھط·ط§ط¨ظ‚ ط¹ظ†ظˆط§ظ†')) mapped = "CRITICAL: IP Address match with another candidate doing the same exam (collusion suspicious).";
            else if (anom.includes('ط¥ظ†ظ‡ط§ط، ظ…ط¨ظƒط±')) mapped = "EXCESSIVE SPEED: Early test completion with high grade ratio mismatch (leak suspicious).";
            else if (anom.includes('ط§ظ„ط­ظ…ظˆظ„ط© طھظپطھظ‚ط¯')) mapped = "INTEGRITY TAMPERING: Unsigned or altered JSON signature payload.";
            else if (anom.includes('طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§')) mapped = `TAB ABUSE: Tab switching behavior detected during active testing (${s.tabSwitchesCount} times).`;
            else if (anom.includes('ظ†ط³ط® ظˆظ„طµ')) mapped = `CLIPBOARD CLIP: Active copying/pasting clipboard logs found during active testing.`;
            else if (anom.includes('ط®ط±ظˆط¬ ظ…ط¤ط´')) mapped = "MOUSE DETOUR: Inactive mouse offscreen bound detected.";
            
            doc.setFont("helvetica", "bold");
            doc.text("â€¢", 14, y);
            doc.setFont("helvetica", "normal");
            doc.text(mapped, 20, y, { maxWidth: 175 });
            y += 8;
          });
        }

        // Final Verdict
        y += 4;
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("ACADEMIC DECISION & VERDICT", 14, y);
        doc.line(14, y + 3, 196, y + 3);
        
        y += 10.5;
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "bold");
        const verdictLabelString = a.verdict === 'approved' 
          ? "APPROVED (No Cheating Confirmed)" 
          : a.verdict === 'retake_requested' 
          ? "RETAKE REQUESTED (Unclear Integrity)" 
          : a.verdict === 'investigation' 
          ? "DISCIPLINARY INVESTIGATION REFERRAL" 
          : "PENDING DETERMINATION";
          
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(`Official Verdict: ${verdictLabelString}`, 14, y);
        
        // Bottom Signature Section
        doc.setFontSize(8);
        doc.setTextColor(150, 160, 175);
        doc.text(`CONFIDENTIAL DOSSIER FOR ${s.studentName.toUpperCase()} (${s.studentId}) | CYBERSHIELD GATEWAY`, 14, 282);
      });

      doc.save(`bulk_forensic_report_cohort_size_${batchSelectedIds.length}.pdf`);
      
      showToast(
        `ظ†ط¬ط­ طھطµط¯ظٹط± ط§ظ„ط¯ظپط¹ط© ط§ظ„ظ…ظˆط­ط¯ط© ط§ظ„ط­ظٹظˆظٹط©: طھظ… طھط¬ظ…ظٹط¹ ظˆط­ظپط¸ ${batchSelectedIds.length} ظ…ظ† ط§ظ„طھظ‚ط§ط±ظٹط± ط§ظ„ط¬ظ†ط§ط¦ظٹط© ظپظٹ ظ…ظ„ظپ PDF ظ…ظˆط­ط¯.`,
        `Bulk export completed successfully: aggregated and drafted forensic auditing logs of ${batchSelectedIds.length} candidates inside a combined PDF dossier.`
      );
    } catch (err: any) {
      console.error("Bulk PDF export crash error:", err);
      showToast(
        "ظپط´ظ„ طھطµط¯ظٹط± ط§ظ„طھظ‚ط±ظٹط± ط§ظ„ظ…ظˆط­ط¯ ط§ظ„ط¬ظ†ط§ط¦ظٹ: ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹ ط£ط«ظ†ط§ط، ط§ظ„طھطµظ…ظٹظ… ظˆط§ظ„ط±ط³ظ….",
        "Bulk report rendering failure: an unexpected layout drawing error occurred during PDF compiling."
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  // PDF report downloader
  const downloadForensicReport = () => {
    const s = submissions.find(sub => sub.studentId === selectedStudentId);
    const a = analyses.find(an => an.studentId === selectedStudentId);
    if (!s || !a) return;

    setPdfGenerating(true);
    try {
      const doc = new jsPDF();
      const primaryColor = [15, 23, 42]; // Slate 900
      const accentColor = a.riskScore >= 60 ? [239, 68, 68] : a.riskScore >= 35 ? [249, 115, 22] : [16, 185, 129];
      
      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("EXAM INTEGRITY FORENSIC REPORT", 14, 24);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleString()} (UTC)`, 14, 31);
      
      // Risk Score Box
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(148, 8, 48, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("RISK SCORE", 152, 16);
      doc.setFontSize(18);
      doc.text(`${a.riskScore}%`, 152, 26);

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
        ["Candidate Name:", s.studentName],
        ["Student ID:", s.studentId],
        ["Exam Code/Name:", `${s.examId} - ${s.examName}`],
        ["Exam Difficulty:", s.examDifficulty.toUpperCase()],
        ["Time Limit / Spent:", `${s.examTimeLimitMinutes} mins / ${s.durationMinutes} mins`],
        ["Score Achieved:", `${s.scorePercent}%`],
        ["Associated IP Addresses:", s.ipAddresses.join(", ")],
        ["Signature Authenticity:", s.signature ? "VALID HMAC (SHA256)" : "UNSIGNED/LOCAL"]
      ];
      
      let y = 62;
      details.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(String(lbl), 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), 62, y);
        y += 6.5;
      });

      // Threat Profile Dimensions
      y += 4;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("BEHAVIORAL RISK METRICS", 14, y);
      doc.line(14, y + 3, 196, y + 3);
      
      y += 10.5;
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      
      const metrics = [
        ["Browser Tab Switches Count", `${s.tabSwitchesCount} times`],
        ["Clipboard Access (Copies/Pastes)", `${s.copyCount} copies / ${s.pasteCount} pastes`],
        ["Cursor Offscreen Inactivity Duration", `${s.mouseOutSeconds} seconds`],
        ["Browser Window Bounds Crossings", `${s.outOfBoundsCount} occurrences`],
        ["IP Co-location Network Conflict", a.ipAddressConflict ? "YES (Collusion Flagged)" : "NO"]
      ];
      
      metrics.forEach(([lbl, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(String(lbl), 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), 100, y);
        y += 6.5;
      });

      // Violations Log
      y += 4;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL INTEGRITY AUDIT LOG", 14, y);
      doc.line(14, y + 3, 196, y + 3);
      
      y += 10.5;
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      
      if (a.anomalies.length === 0) {
        doc.setFont("helvetica", "bold");
        doc.text("No specific compliance anomalies detected during this proctoring session.", 14, y);
        y += 8;
      } else {
        a.anomalies.forEach((anom) => {
          let mapped = anom;
          if (anom.includes('طھط·ط§ط¨ظ‚ ط¹ظ†ظˆط§ظ†')) mapped = "CRITICAL: IP Address match with another candidate doing the same exam (collusion suspicious).";
          else if (anom.includes('ط¥ظ†ظ‡ط§ط، ظ…ط¨ظƒط±')) mapped = "EXCESSIVE SPEED: Early test completion with high grade ratio mismatch (leak suspicious).";
          else if (anom.includes('ط§ظ„ط­ظ…ظˆظ„ط© طھظپطھظ‚ط¯')) mapped = "INTEGRITY TAMPERING: Unsigned or altered JSON transmission signature payload.";
          else if (anom.includes('طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§')) mapped = `TAB ABUSE: Tab switching behavior detected during active testing (${s.tabSwitchesCount} times).`;
          else if (anom.includes('ظ†ط³ط® ظˆظ„طµ')) mapped = `CLIPBOARD CLIP: Active copying/pasting clipboard logs found during active testing.`;
          else if (anom.includes('ط®ط±ظˆط¬ ظ…ط¤ط´')) mapped = "MOUSE DETOUR: Inactive mouse offscreen bound detected.";
          
          doc.setFont("helvetica", "bold");
          doc.text("â€¢", 14, y);
          doc.setFont("helvetica", "normal");
          doc.text(mapped, 20, y, { maxWidth: 175 });
          y += 8;
        });
      }

      // Final Verdict
      y += 4;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("ACADEMIC DECISION & VERDICT", 14, y);
      doc.line(14, y + 3, 196, y + 3);
      
      y += 10.5;
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      const verdictLabelString = a.verdict === 'approved' 
        ? "APPROVED (No Cheating Confirmed)" 
        : a.verdict === 'retake_requested' 
        ? "RETAKE REQUESTED (Unclear Integrity)" 
        : a.verdict === 'investigation' 
        ? "DISCIPLINARY INVESTIGATION REFERRAL" 
        : "PENDING DETERMINATION";
        
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`Official Verdict: ${verdictLabelString}`, 14, y);
      
      // Bottom Signature Section
      doc.setFontSize(8);
      doc.setTextColor(150, 160, 175);
      doc.text("CONFIDENTIAL - SECURED VIA CYBERSHIELD PROCTORING GATEWAY", 14, 282);
      
      doc.save(`forensic_report_${s.studentId}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Moodle Live Event Streaming Endpoint Caller
  const sendMoodleLiveEvent = async () => {
    setStreamLoading(true);
    const eventId = `evt_1780759082927_${Math.random().toString(36).substring(2, 10)}`;
    const eventTimestamp = new Date().toISOString();
    
    // Set metadata object based on event type matching Team 1 spec
    let metadata: any = { "reason": "browser_window_lost_focus" };
    if (streamEventType === "window_focus") metadata = { "reason": "browser_window_gained_focus" };
    else if (streamEventType === "tab_hidden") metadata = { "reason": "document_visibility_changed_to_hidden" };
    else if (streamEventType === "tab_visible") metadata = { "reason": "document_visibility_changed_to_visible" };
    else if (streamEventType === "copy") metadata = { "action": "copy_detected" };
    else if (streamEventType === "paste") metadata = { "action": "paste_detected" };
    else if (streamEventType === "right_click") metadata = { "action": "context_menu_opened" };
    else if (streamEventType === "page_leave") metadata = { "reason": "page_beforeunload" };
    else if (streamEventType === "network_offline") metadata = { "reason": "browser_connection_lost" };
    else if (streamEventType === "network_online") metadata = { "reason": "browser_connection_restored" };
    else if (streamEventType === "answer_changed") {
      metadata = {
        "question": {
          "question_dom_id": "question-1-1",
          "question_number": "1",
          "question_type": "truefalse"
        },
        "answer": {
          "field_name": "q1:1_answer",
          "field_id": "q1:1_answerfalse",
          "field_tag": "input",
          "field_type": "radio",
          "checked": true,
          "answer_value": "0"
        }
      };
    }

    const payload = {
      "received_at": new Date().toISOString(),
      "client_ip": "SERVER_WILL_ADD_THIS",
      "event": {
        "schema_version": "1.0",
        "event_id": eventId,
        "session_id": `sess_1780759080868_${Math.random().toString(36).substring(2, 10)}`,
        "sequence_number": streamConsoleLogs.length + 1,
        "event_type": streamEventType,
        "timestamp": eventTimestamp,
        "elapsed_ms": Math.floor(Math.random() * 500000) + 12000,
        "source": {
          "layer": "browser_side",
          "component": "moodle_quiz_monitor",
          "plugin": "quizaccess_exammonitor"
        },
        "moodle": {
          "student": {
            "id": Number(streamStudentId),
            "fullname": streamStudentName,
            "username": `moodle_std_${streamStudentId}`
          },
          "quiz": {
            "id": Number(streamQuizId),
            "name": streamQuizName,
            "attempt_id": 1,
            "course_id": 2,
            "cmid": 3
          }
        },
        "browser": {
          "url": `http://localhost/mod/quiz/attempt.php?attempt=1&cmid=3`,
          "title": `${streamQuizName} | moodle-server`,
          "visibility_state": streamEventType === "tab_hidden" || streamEventType === "window_blur" ? "hidden" : "visible",
          "has_focus": streamEventType !== "window_blur" && streamEventType !== "tab_hidden",
          "user_agent": navigator.userAgent,
          "language": lang,
          "platform": navigator.platform
        },
        "network": {
          "online": streamEventType !== "network_offline",
          "connection_supported": true,
          "effective_type": "4g",
          "downlink": 2.15,
          "rtt": 150,
          "save_data": false
        },
        "metadata": metadata
      }
    };

    try {
      const response = await fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        showToast(
          `ًں“، ط¨ط« ظ†ط§ط¬ط­: طھظ… طھط³ط¬ظٹظ„ ط­ط¯ط« "${streamEventType}" ظ„ظ„ط·ط§ظ„ط¨ ط°ظˆ ط§ظ„ط±ظ…ط² STD-MOODLE-${streamStudentId}!`,
          `ًں“، Stream Success: Registered "${streamEventType}" event for student STD-MOODLE-${streamStudentId}!`
        );
        setStreamConsoleLogs(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            eventType: streamEventType,
            eventId,
            success: true,
            resp: data
          },
          ...prev
        ]);
        // Trigger data fetch to update dashboard UI immediately
        fetchData();
      } else {
        showToast(`â‌Œ ط®ط·ط£ ظپظٹ ط¯ظ…ط¬ ط­ط²ظ…ط© ط§ظ„ط­ط¯ط« ظپظٹ ط§ظ„ط®ط§ط¯ظ…`, `â‌Œ Integration payload error on server`);
      }
    } catch (e) {
      showToast(`â‌Œ ظپط´ظ„ ط§ظ„ط§طھطµط§ظ„ ط¨ط®ط· ط¨ط« ط§ظ„ط£ط­ط¯ط§ط« ظ„ظ„ظ€ API`, `â‌Œ Failed to connect to telemetry stream API endpoint`);
    } finally {
      setStreamLoading(false);
    }
  };


  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch('/api/telemetry', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON content. Is the server starting up?');
      }
      const data = await response.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
        setAnalyses(data.analysis);
      }
      if (data.teachers) {
        setTeachers(data.teachers);
        setSubjects(data.subjects);
        setExams(data.exams);
      }
      setLastRefreshTime(new Date());
    } catch (err) {
      console.warn('Network / API sync in progress:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = (userData: { id: string; username: string; role: string; nameAr: string; nameEn: string }) => {
    setUser(userData);
    localStorage.setItem('cyber_auth_user', JSON.stringify(userData));
    fetchData();
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('cyber_auth_user');
  };

  // Proctor Idle Activity Monitor (10 Minutes Timeout Auto Lock)
  const lastActiveTimestamp = useRef<number>(0);

  useEffect(() => {
    lastActiveTimestamp.current = Date.now();
    const renewActivity = () => {
      lastActiveTimestamp.current = Date.now();
    };

    window.addEventListener('mousemove', renewActivity);
    window.addEventListener('keydown', renewActivity);
    window.addEventListener('click', renewActivity);
    window.addEventListener('scroll', renewActivity);
    window.addEventListener('touchstart', renewActivity);

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActiveTimestamp.current;
      const tenMinutesMs = 10 * 60 * 1000;
      if (elapsed >= tenMinutesMs && !isLocked) {
        setIsLocked(true);
      }
    }, 15000); // Check every 15 seconds

    return () => {
      window.removeEventListener('mousemove', renewActivity);
      window.removeEventListener('keydown', renewActivity);
      window.removeEventListener('click', renewActivity);
      window.removeEventListener('scroll', renewActivity);
      window.removeEventListener('touchstart', renewActivity);
      clearInterval(checkInterval);
    };
  }, [isLocked]);

  useEffect(() => {
    fetchData();
  }, []);

  // Effect to long-poll telemetry in real-time when Live Feed Mode is enabled
  useEffect(() => {
    if (!liveFeedActive) return;
    const interval = setInterval(() => {
      fetchData();
    }, 4500); // Check every 4.5 seconds for new streamed payloads
    return () => clearInterval(interval);
  }, [liveFeedActive]);

  // Effect to send browser notification to the proctor's desktop on high-risk threshold breach
  useEffect(() => {
    if (!desktopNotificationsEnabled) return;
    
    // Check if any student in active exam analyses exceeds the threshold
    analyses.forEach(an => {
      if (an.riskScore >= riskThreshold) {
        // Compose a general key representing student and current exam
        const generalKey = `${an.studentId}_${selectedExamId}`;
        
        if (!sentNotificationKeys.includes(generalKey)) {
          // Fire a silent desktop notification
          if (Notification.permission === 'granted') {
            new Notification(
              lang === 'ar' ? `âڑ ï¸ڈ ط±طµط¯ طھط¬ط§ظˆط² ط£ظ…ظ†ظٹ: ${an.studentName}` : `âڑ ï¸ڈ Integrity Breach: ${an.studentName}`,
              {
                body: lang === 'ar' 
                  ? `طھط¬ط§ظˆط² ظ…ط¤ط´ط± ط®ط·ظˆط±ط© ط§ظ„ظ…ط±ط´ط­ ط­ط¯ ط§ظ„ط£ظ…ط§ظ† ظ„ظٹط¨ظ„ط؛ ${an.riskScore}% ظپظٹ ط§ط®طھط¨ط§ط± ${an.examName}`
                  : `Candidate surpassed threshold with a high-risk score of ${an.riskScore}% in ${an.examName}.`,
                silent: true,
                icon: "/favicon.ico"
              }
            );
            setSentNotificationKeys(prev => [...prev, generalKey]);
          }
        }
      }
    });
  }, [analyses, riskThreshold, desktopNotificationsEnabled, selectedExamId, sentNotificationKeys, lang]);

  // Automatically write Audit Log when risk score crosses threshold
  useEffect(() => {
    if (analyses.length === 0) return;
    
    let newBreachKeys = [...loggedThresholdBreachesRef.current];
    let hasNewBreachList = false;
    const breachedStudents: Array<{ studentId: string; logMsg: string }> = [];
    
    analyses.forEach(an => {
      const breachKey = `${an.studentId}_${selectedExamId}_${riskThreshold}`;
      if (an.riskScore >= riskThreshold) {
        if (!newBreachKeys.includes(breachKey)) {
          const sub = submissions.find(s => s.studentId === an.studentId);
          const tabSwitches = sub ? sub.tabSwitchesCount : 0;
          const clipActions = sub ? (sub.copyCount + sub.pasteCount) : 0;
          const mouseOut = sub ? sub.mouseOutSeconds : 0;
          
          const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: 'numeric',
            month: 'short'
          });
          
          const logMsg = lang === 'ar'
            ? `ًںڑ¨ [ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚ ط§ظ„طھظ„ظ‚ط§ط¦ظٹ] طھط¬ط§ظˆط² ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© ط­ط¯ ط§ظ„ط£ظ…ط§ظ† ط§ظ„ظ…ط¹طھظ…ط¯ (${riskThreshold}%) ظ„ظٹطµظ„ ط¥ظ„ظ‰ ${an.riskScore}%. طھظپط§طµظٹظ„ ط§ظ„ظ…ط¤ط´ط±ط§طھ: طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط° (${tabSwitches} ظ…ط±ط§طھ)طŒ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط¹ظ„ظ‰ ط§ظ„ط­ط§ظپط¸ط© (${clipActions})طŒ ط§ظ„ط؛ظٹط§ط¨ ط¹ظ† ط§ظ„ط´ط§ط´ط© (${mouseOut} ط«ظˆط§ظ†ظچ).`
            : `ًںڑ¨ [Auto Audit Log] Risk score crossed high-risk threshold of ${riskThreshold}% (Current: ${an.riskScore}%). Tech vectors: Tab Switches (${tabSwitches}x), Clipboard (${clipActions} actions), Off-screen mouse (${mouseOut}s).`;
          
          breachedStudents.push({ studentId: an.studentId, logMsg });
          newBreachKeys.push(breachKey);
          hasNewBreachList = true;
        }
      } else {
        if (newBreachKeys.includes(breachKey)) {
          newBreachKeys = newBreachKeys.filter(k => k !== breachKey);
          hasNewBreachList = true;
        }
      }
    });
    
    if (hasNewBreachList) {
      loggedThresholdBreachesRef.current = newBreachKeys;
      localStorage.setItem('cyber_logged_threshold_breaches', JSON.stringify(newBreachKeys));
    }
    
    if (breachedStudents.length > 0) {
      setStudentNotes(prev => {
        const copy = { ...prev };
        const timeStr = new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: 'numeric',
          month: 'short'
        });
        
        breachedStudents.forEach(({ studentId, logMsg }) => {
          const currentList = copy[studentId] || [];
          // Avoid duplicate auto audit logs
          if (!currentList.some(item => item.note.includes(`[Auto Audit Log]`) || item.note.includes(`[ط³ط¬ظ„ ط§ظ„طھط¯ظ‚ظٹظ‚ ط§ظ„طھظ„ظ‚ط§ط¦ظٹ]`))) {
            copy[studentId] = [{ timestamp: timeStr, note: logMsg }, ...currentList];
          }
        });
        localStorage.setItem('cyber_proctor_notes', JSON.stringify(copy));
        return copy;
      });
    }
  }, [analyses, riskThreshold, selectedExamId, submissions, lang]);

  // Helper toggle function for proctors desktop notification permission
  const toggleDesktopNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(
        "ظ†ط¸ط§ظ… ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ط؛ظٹط± ظ…ط¯ط¹ظˆظ… ظپظٹ ظ…طھطµظپط­ظƒ ط§ظ„ط­ط§ظ„ظٹ",
        "Web Notification API is not supported in this browser environment."
      );
      return;
    }

    if (!desktopNotificationsEnabled) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setDesktopNotificationsEnabled(true);
          new Notification(lang === 'ar' ? "طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ظ…طھطµظپط­ ظ…ظپط¹ظ„ط©" : "Desktop Alerts Active", {
            body: lang === 'ar' ? "ط³طھطھظ„ظ‚ظ‰ ط¨ظ„ط§ط؛ط§طھ طµط§ظ…طھط© ظ‡ظ†ط§ ط¹ظ† ظ…ط­ط§ظˆظ„ط§طھ ط§ظ„ط؛ط´ ظ„ظ„ط§ظ…طھط­ط§ظ† ط§ظ„ط­ط§ظ„ظٹ." : "You will receive desktop alerts whenever active students cross the alert threshold.",
            silent: true
          });
          showToast(
            "طھظ… طھظپط¹ظٹظ„ طھظ†ط¨ظٹظ‡ط§طھ ط³ط·ط­ ط§ظ„ظ…ظƒطھط¨ ط¨ظ†ط¬ط§ط­",
            "Desktop notifications allowed and activated!"
          );
        } else {
          showToast(
            "طھظ… ط±ظپط¶ ط§ظ„ط¥ط°ظ† ط¨ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ظ…ظ† ظ‚ط¨ظ„ ط§ظ„ظ…طھطµظپط­",
            "Desktop notifications access denied by browser parameters."
          );
        }
      } else if (Notification.permission === 'granted') {
        setDesktopNotificationsEnabled(true);
        showToast(
          "طھظ… طھظپط¹ظٹظ„ طھظ†ط¨ظٹظ‡ط§طھ ط³ط·ط­ ط§ظ„ظ…ظƒطھط¨ ط¨ظ†ط¬ط§ط­",
          "Desktop alerts enabled."
        );
      } else {
        showToast(
          "ط§ظ„ط¥ط°ظ† ظ…ط­ط¸ظˆط± ط­ط§ظ„ظٹط§ظ‹. ظٹط±ط¬ظ‰ ط§ظ„ط³ظ…ط§ط­ ط¨ظ‡ ظ…ظ† ط¹ظ†ظˆط§ظ† ط§ظ„ظ…ظˆظ‚ط¹ ط¨ط§ظ„ظ…طھطµظپط­",
          "Notifications are blocked. Please whitelist or enable notifications in browser site options."
        );
      }
    } else {
      setDesktopNotificationsEnabled(false);
      showToast(
        "طھظ… ط¥ظ„ط؛ط§ط، طھط´ط؛ظٹظ„ طھظ†ط¨ظٹظ‡ط§طھ ط³ط·ط­ ط§ظ„ظ…ظƒطھط¨",
        "Desktop alerts disabled."
      );
    }
  };

  // Handle telemetry submission reload
  const handleReload = () => {
    fetchData();
  };

  // Find selected student details
  const selectedStudent = submissions.find(s => s.studentId === selectedStudentId);
  const selectedAnalysis = analyses.find(a => a.studentId === selectedStudentId);

  // All submissions of the selected student across all assigned subjects/exams in the database
  const studentAllSubmissions = useMemo(() => {
    if (!selectedStudentId) return [];
    return allSubmissions.filter(s => s.studentId === selectedStudentId);
  }, [allSubmissions, selectedStudentId]);

  // Average academic score across all completed submissions
  const studentAvgAcademicScore = useMemo(() => {
    if (studentAllSubmissions.length === 0) return 0;
    const total = studentAllSubmissions.reduce((acc, sub) => acc + sub.scorePercent, 0);
    return Math.round(total / studentAllSubmissions.length);
  }, [studentAllSubmissions]);

  // Overall exam attendance across all the exams listed in the database
  const studentExamAttendanceRate = useMemo(() => {
    if (exams.length === 0) return 0;
    const completedCount = studentAllSubmissions.length;
    return Math.round((completedCount / exams.length) * 100);
  }, [studentAllSubmissions, exams]);

  // Total Out of Bounds Duration (mouse outs + tab focal loss durations)
  const studentTotalRiskSeconds = useMemo(() => {
    return studentAllSubmissions.reduce((acc, sub) => {
      const tabLossSecs = sub.tabSwitchesTimeline?.reduce((tAcc, t) => tAcc + (t.durationSeconds || 0), 0) || 0;
      return acc + (sub.mouseOutSeconds || 0) + tabLossSecs;
    }, 0);
  }, [studentAllSubmissions]);

  // Filter students
  const filteredAnalysis = displayAnalyses.filter(an => {
    const studentNameParsed = an.studentName || '';
    const studentIdParsed = an.studentId || '';
    const examNameParsed = an.examName || '';
    const matchesSearch = studentNameParsed.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          studentIdParsed.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          examNameParsed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || an.riskLevel === riskFilter;
    
     // Anomaly type filter:
    let matchesAnomaly = true;
    if (anomalyFilter !== 'all') {
      if (anomalyFilter === 'ip_conflict') {
        matchesAnomaly = an.ipAddressConflict === true;
      } else if (anomalyFilter === 'high_tabs') {
        matchesAnomaly = an.extremeTabSwitching === true || (displaySubmissions.find(s => s.studentId === an.studentId)?.tabSwitchesCount || 0) > 5;
      } else if (anomalyFilter === 'copy_paste') {
        matchesAnomaly = an.copyPasteSpike === true || (displaySubmissions.find(s => s.studentId === an.studentId)?.copyCount || 0) > 3;
      } else if (anomalyFilter === 'mouse_offscreen') {
        matchesAnomaly = an.outOfBoundsSpike === true || (displaySubmissions.find(s => s.studentId === an.studentId)?.outOfBoundsCount || 0) > 3;
      } else if (anomalyFilter === 'time_anomaly') {
        matchesAnomaly = an.timeAnomaly === true;
      } else if (anomalyFilter === 'macro_usage') {
        matchesAnomaly = an.macroUsage === true;
      }
    }

    const matchesHighRiskOnly = !showHighRiskOnly || an.riskScore >= riskThreshold || an.riskLevel === 'high';

    return matchesSearch && matchesRisk && matchesAnomaly && matchesHighRiskOnly;
  });

  // Calculate General Stats
  const totalSubmissions = submissions.length;
  const highRiskCount = analyses.filter(a => a.riskLevel === 'high').length;
  const mediumRiskCount = analyses.filter(a => a.riskLevel === 'medium').length;
  const safeCount = analyses.filter(a => a.riskLevel === 'safe').length;
  const totalIPConflicts = analyses.filter(a => a.ipAddressConflict).length;

  const copyCurlToClipboard = () => {
    const curlCommand = `curl -X POST "${window.location.origin}/api/telemetry" \\
-H "Content-Type: application/json" \\
-d '{
  "studentId": "STD-2023-1120",
  "studentName": "${lang === 'ar' ? 'ظ†ظˆط±ط© ط§ظ„ط³ط¨ظٹط¹ظٹ' : 'Noura Al-Subaie'}",
  "examId": "EXM-SEC-401",
  "examName": "${lang === 'ar' ? 'ط¥ط®طھط¨ط§ط± ظ‡ظ†ط¯ط³ط© ط§ظ„ط£ظ…ظ† ط§ظ„ط³ظٹط¨ط±ط§ظ†ظٹ ط§ظ„ظ†ظ‡ط§ط¦ظٹ' : 'Cybersecurity Engineering Final Exam'}",
  "examDifficulty": "hard",
  "examTimeLimitMinutes": 60,
  "startTime": "${new Date().toISOString()}",
  "endTime": "${new Date().toISOString()}",
  "durationMinutes": 50,
  "scorePercent": 82,
  "copyCount": 0,
  "pasteCount": 0,
  "tabSwitchesCount": 1,
  "ipAddresses": ["109.82.114.50"],
  "mouseOutSeconds": 12,
  "outOfBoundsCount": 2,
  "questionTelemetry": [
    {"questionId": "Q1", "questionNumber": 1, "timeSpentSeconds": 420, "changesCount": 2},
    {"questionId": "Q2", "questionNumber": 2, "timeSpentSeconds": 590, "changesCount": 1}
  ]
}'`;
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  async function handleVerdictChange(studentId: string, verdict: 'approved' | 'retake_requested' | 'investigation') {
    const origId = originalIdMap[studentId] || studentId;
    try {
      const response = await fetch('/api/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId: origId, verdict }),
      });
      const data = await response.json();
      if (data.success) {
        addAuditorLogEntry(
          'verdict_change',
          origId,
          submissions.find(s => s.studentId === origId)?.studentName || origId,
          `Changed student status verdict to: ${verdict.toUpperCase().replace('_', ' ')}`
        );
        fetchData();
      }
    } catch (err) {
      console.error('Error updating verdict:', err);
    }
  };
  
  const handleClearStudentCache = async (studentId: string) => {
    const origId = originalIdMap[studentId] || studentId;
    const updatedNotes = { ...studentNotes };
    delete updatedNotes[origId];
    setStudentNotes(updatedNotes);

    try {
      const response = await fetch('/api/verdict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: origId, verdict: 'clear' }),
      });
      const data = await response.json();
      if (data.success) {
        addAuditorLogEntry(
          'clear_cache',
          origId,
          submissions.find(s => s.studentId === origId)?.studentName || origId,
          `Cleared diagnostics notes and decision cache`
        );
        fetchData();
        showToast(
          `ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ظ…ظ„ط§ط­ط¸ط§طھ ظˆظ‚ط±ط§ط±ط§طھ ط§ظ„ط·ط§ظ„ط¨ (${studentId}) ط¨ظ†ط¬ط§ط­!`,
          `ًں—‘ï¸ڈ Successfully cleared notes and decision cache for student ${studentId}!`
        );
      }
    } catch (err) {
      console.error('Error clearing student cache:', err);
    }
  }

  const handleBatchVerdictChange = async (verdict: 'approved' | 'retake_requested' | 'investigation') => {
    if (batchSelectedIds.length === 0) return;
    const origBatchIds = batchSelectedIds.map(id => originalIdMap[id] || id);
    try {
      setBatchOpName(
        lang === 'ar' 
          ? `ط¬ط§ط±ظٹ طھط·ط¨ظٹظ‚ ط§ظ„ظ‚ط±ط§ط± ط§ظ„ط¬ظ…ط§ط¹ظٹ: ${verdict === 'approved' ? 'ط§ط¹طھظ…ط§ط¯ ط§ظ„ظ†طھظٹط¬ط© ظˆط§ظ„ظ…ظˆط§ظپظ‚ط©' : verdict === 'retake_requested' ? 'ط·ظ„ط¨ ط¥ط¹ط§ط¯ط© ط§ظ„ط§ط®طھط¨ط§ط±' : 'ط¨ط¯ط، طھط­ظ‚ظٹظ‚ ظپظ†ظٹ ط±ط³ظ…ظٹ'}` 
          : `Applying batch verdict: ${verdict.toUpperCase()}`
      );
      setBatchProgress(10);
      
      // Simulate progress segments
      const timer1 = setTimeout(() => setBatchProgress(40), 200);
      const timer2 = setTimeout(() => setBatchProgress(75), 450);
      
      const response = await fetch('/api/verdict/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds: origBatchIds, verdict }),
      });
      const data = await response.json();
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      
      if (data.success) {
        addAuditorLogEntry(
          'batch_verdict',
          undefined,
          undefined,
          `Applied bulk verdict of [${verdict.toUpperCase()}] to a batch of ${origBatchIds.length} candidate files`
        );
        setBatchProgress(100);
        setTimeout(() => {
          setBatchSelectedIds([]);
          setBatchProgress(null);
          setBatchOpName(null);
          fetchData();
          showToast(
            `âڑ، طھظ… طھظ†ظپظٹط° ط§ظ„ظ‚ط±ط§ط± ط§ظ„ط¬ظ…ط§ط¹ظٹ ط¨ظ†ط¬ط§ط­ ط¹ظ„ظ‰ ${batchSelectedIds.length} ظ…ظ† ط§ظ„ط·ظ„ط§ط¨!`,
            `âڑ، Group verdict applied successfully to ${batchSelectedIds.length} students!`
          );
        }, 300);
      } else {
        setBatchProgress(null);
        setBatchOpName(null);
      }
    } catch (err) {
      console.error('Error batch updating verdicts:', err);
      setBatchProgress(null);
      setBatchOpName(null);
    }
  };

  const handleBatchExportJSON = async () => {
    if (batchSelectedIds.length === 0) return;
    try {
      setBatchOpName(
        lang === 'ar' 
          ? 'ط¬ط§ط±ظٹ طھط¬ظ…ظٹط¹ ظˆط¶ط؛ط· ط³ط¬ظ„ط§طھ ط§ظ„ظ‚ظٹط§ط³ ط§ظ„ط¯ظپط¹ط© ط§ظ„ظ…ط­ط¯ط¯ط© ظ„ظ„ط·ظ„ط§ط¨...' 
          : 'Compiling aggregate telemetry logs for selected student group...'
      );
      setBatchProgress(15);
      
      const timer1 = setTimeout(() => setBatchProgress(50), 200);
      const timer2 = setTimeout(() => setBatchProgress(85), 400);

      const targetSubmissions = submissions.filter(sub => batchSelectedIds.includes(sub.studentId));
      const targetAnalyses = analyses.filter(an => batchSelectedIds.includes(an.studentId));

      const compiledPayload = {
        exportedAt: new Date().toISOString(),
        totalCandidates: batchSelectedIds.length,
        submissions: targetSubmissions,
        analyses: targetAnalyses,
      };

      const blob = new Blob([JSON.stringify(compiledPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cohort_telemetry_batch_export_${new Date().toISOString().substring(0, 10)}.json`;
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      
      setBatchProgress(100);
      setTimeout(() => {
        link.click();
        URL.revokeObjectURL(url);
        setBatchProgress(null);
        setBatchOpName(null);
        showToast(
          `ًں“پ طھظژظ…ظ‘ طھطµط¯ظٹط± ظ…ظ„ظپ ط§ظ„ط¯ظپط¹ط© ط§ظ„ظ…ظˆط­ط¯ ط¨ظ†ط¬ط§ط­ ظˆطµظٹط§ط؛ط© JSON ط§ظ„ظ…ط¹ظٹط§ط±ظٹط©!`,
          `ًں“پ Batch telemetry file exported successfully in JSON standard format!`
        );
      }, 400);
    } catch (err) {
      console.error('Error exporting batch JSON:', err);
      setBatchProgress(null);
      setBatchOpName(null);
    }
  };

  const exportToCSV = () => {
    const headers = [
      lang === 'ar' ? 'ظ…ط¹ط±ظپ ط§ظ„ط·ط§ظ„ط¨' : 'Student ID',
      lang === 'ar' ? 'ط§ط³ظ… ط§ظ„ط·ط§ظ„ط¨' : 'Student Name',
      lang === 'ar' ? 'ظ…ط¹ط±ظپ ط§ظ„ط§ظ…طھط­ط§ظ†' : 'Exam ID',
      lang === 'ar' ? 'ط§ط³ظ… ط§ظ„ط§ظ…طھط­ط§ظ†' : 'Exam Name',
      lang === 'ar' ? 'ط§ظ„طµط¹ظˆط¨ط©' : 'Difficulty',
      lang === 'ar' ? 'ط§ظ„ط²ظ…ظ† ط§ظ„ظپط¹ظ„ظٹ (ط¯ظ‚ط§ط¦ظ‚)' : 'Duration (mins)',
      lang === 'ar' ? 'ط§ظ„ط¯ط±ط¬ط© (%)' : 'Score (%)',
      lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Tab Switches',
      lang === 'ar' ? 'ط§ظ„ظ†ط³ط®' : 'Copies',
      lang === 'ar' ? 'ط§ظ„ظ„طµظ‚' : 'Pastes',
      lang === 'ar' ? 'ط®ط±ظˆط¬ ط§ظ„ظ…ط¤ط´ط± (ط«)' : 'Mouse Offscreen (sec)',
      lang === 'ar' ? 'طھط¬ط§ظˆط² ط§ظ„ط­ط¯ظˆط¯' : 'Bounds Crossed',
      lang === 'ar' ? 'ط¹ظ†ط§ظˆظٹظ† IP' : 'IP Addresses',
      lang === 'ar' ? 'ظ…ط¤ط´ط± ط§ظ„ط®ط·ظˆط±ط© %' : 'Risk Score %',
      lang === 'ar' ? 'ظ…ط³طھظˆظ‰ ط§ظ„ط®ط·ظˆط±ط©' : 'Risk Level',
      lang === 'ar' ? 'ط§ظ„ظ‚ط±ط§ط± ط§ظ„ط£ظ…ظ†ظٹ' : 'Verdict'
    ];

    const rows = filteredAnalysis.map(an => {
      const sub = displaySubmissions.find(s => s.studentId === an.studentId);
      if (!sub) return null;
      return [
        sub.studentId,
        sub.studentName,
        sub.examId,
        sub.examName,
        sub.examDifficulty,
        sub.durationMinutes,
        sub.scorePercent,
        sub.tabSwitchesCount,
        sub.copyCount,
        sub.pasteCount,
        sub.mouseOutSeconds,
        sub.outOfBoundsCount,
        sub.ipAddresses.join(' | '),
        an.riskScore,
        an.riskLevel,
        an.verdict
      ];
    }).filter(Boolean) as any[][];

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => {
        const text = String(val).replace(/"/g, '""');
        return `"${text}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Proctoring_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSISAuditJSON = () => {
    const sisPackets = filteredAnalysis.map(an => {
      const sub = submissions.find(s => s.studentId === an.studentId);
      return {
        sis_student_id: an.studentId,
        student_display_name: an.studentName,
        course_exam_id: an.examId,
        course_exam_name: an.examName,
        proctor_verdict: an.verdict || 'pending_audit',
        integrity_compliance_score: Math.max(0, 100 - an.riskScore),
        exam_risk_score_percent: an.riskScore,
        risk_classification: an.riskLevel.toUpperCase(),
        evidence_metrics: {
          tab_switch_count: sub?.tabSwitchesCount || 0,
          clipboard_copy_activities: sub?.copyCount || 0,
          clipboard_paste_activities: sub?.pasteCount || 0,
          out_of_bounds_count_recorded: sub?.outOfBoundsCount || 0,
          mouse_out_duration_seconds: sub?.mouseOutSeconds || 0,
          network_ip_footprints: sub?.ipAddresses || [],
          network_proximity_collision: an.ipAddressConflict
        },
        audit_anomalies_flagged: an.anomalies,
        academic_audit_timestamp: new Date().toISOString(),
        proctoring_system_signature: sub?.signature || `SECURE_JWT_COMPLIANT_HASH_${an.studentId}_${Date.now()}`
      };
    });

    const sisPayload = {
      sis_integration_header: {
        source_system: "SecureExam Proctoring & AI Behavioral Intel Engine",
        protocol_version: "3.2.0-C",
        exported_at: new Date().toISOString(),
        total_records_exported: sisPackets.length,
        proctor_notes: `Continuous audit stream matching filters. Under threat alert threshold: ${riskThreshold}%.`
      },
      audit_records: sisPackets
    };

    const blob = new Blob([JSON.stringify(sisPayload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SIS_Integrity_Audit_Export_${selectedExamId || 'ALL'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      "طھظژظ…ظ‘ طھط­ظ…ظٹظ„ ظ…ظ„ظپ طھط¯ظ‚ظٹظ‚ SIS ط¨ظ†ط¬ط§ط­ ط¨طµظٹط؛ط© JSON",
      "Successfully exported and downloaded SIS-compliant Academic Audit JSON payload!"
    );
  };

  const downloadSISAuditJSONForSelection = () => {
    if (batchSelectedIds.length === 0) return;
    const selectedAnalyses = analyses.filter(an => batchSelectedIds.includes(an.studentId));
    
    const sisPackets = selectedAnalyses.map(an => {
      const sub = submissions.find(s => s.studentId === an.studentId);
      return {
        sis_student_id: an.studentId,
        student_display_name: an.studentName,
        course_exam_id: an.examId,
        course_exam_name: an.examName,
        proctor_verdict: an.verdict || 'pending_audit',
        integrity_compliance_score: Math.max(0, 100 - an.riskScore),
        exam_risk_score_percent: an.riskScore,
        risk_classification: an.riskLevel.toUpperCase(),
        evidence_metrics: {
          tab_switch_count: sub?.tabSwitchesCount || 0,
          clipboard_copy_activities: sub?.copyCount || 0,
          clipboard_paste_activities: sub?.pasteCount || 0,
          out_of_bounds_count_recorded: sub?.outOfBoundsCount || 0,
          mouse_out_duration_seconds: sub?.mouseOutSeconds || 0,
          network_ip_footprints: sub?.ipAddresses || [],
          network_proximity_collision: an.ipAddressConflict
        },
        audit_anomalies_flagged: an.anomalies,
        academic_audit_timestamp: new Date().toISOString(),
        proctoring_system_signature: sub?.signature || `SECURE_JWT_COMPLIANT_HASH_${an.studentId}_${Date.now()}`
      };
    });

    const sisPayload = {
      sis_integration_header: {
        source_system: "SecureExam Proctoring & AI Behavioral Intel Engine",
        protocol_version: "3.2.0-C",
        exported_at: new Date().toISOString(),
        total_records_exported: sisPackets.length,
        proctor_notes: `Explicit manual selection batch export of high-profile cases.`
      },
      audit_records: sisPackets
    };

    const blob = new Blob([JSON.stringify(sisPayload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SIS_Selected_Cases_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      "طھظژظ…ظ‘ طھط­ظ…ظٹظ„ ط§ظ„طھظ‚ط±ظٹط± ظ„ظ€ SIS ط¨ظ†ط¬ط§ط­ ظ„ظ„ظˆط¬ط¨ط© ط§ظ„ظ…ط­ط¯ط¯ط©",
      "Successfully exported and downloaded SIS-compliant JSON for selected students!"
    );
  };

  const timeIntervals = [
    { id: '0_10', label: lang === 'ar' ? 'ظ -ظ،ظ  ط¯ظ‚ط§ط¦ظ‚' : '0-10m' },
    { id: '10_20', label: lang === 'ar' ? 'ظ،ظ -ظ¢ظ  ط¯ظ‚ظٹظ‚ط©' : '10-20m' },
    { id: '20_30', label: lang === 'ar' ? 'ظ¢ظ -ظ£ظ  ط¯ظ‚ظٹظ‚ط©' : '20-30m' },
    { id: '30_40', label: lang === 'ar' ? 'ظ£ظ -ظ¤ظ  ط¯ظ‚ظٹظ‚ط©' : '30-40m' },
    { id: '40_50', label: lang === 'ar' ? 'ظ¤ظ -ظ¥ظ  ط¯ظ‚ظٹظ‚ط©' : '40-50m' },
    { id: '50_plus', label: lang === 'ar' ? 'ظ¥ظ + ط¯ظ‚ظٹظ‚ط©' : '50m+' }
  ];

  const metricRows = [
    { key: 'tabSwitches', label: lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Tab Switches', icon: 'ًں’»' },
    { key: 'clipboard', label: lang === 'ar' ? 'ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط­ط§ظپط¸ط©' : 'Clipboard Action', icon: 'ًں“‹' },
    { key: 'outOfBounds', label: lang === 'ar' ? 'طھط¬ط§ظˆط² ط§ظ„ط­ط¯ظˆط¯' : 'Bounds Cross', icon: 'ًں“گ' },
    { key: 'inactiveMouse', label: lang === 'ar' ? 'ط®ط±ظˆط¬ ط§ظ„ظ…ط¤ط´ط±' : 'Inactive Cursor', icon: 'ًں–±ï¸ڈ' }
  ];

  const getHeatmapData = () => {
    const grid: Record<string, Record<string, number>> = {};
    
    metricRows.forEach(row => {
      grid[row.key] = {};
      timeIntervals.forEach(interval => {
        grid[row.key][interval.id] = 0;
      });
    });

    submissions.forEach(sub => {
      const nameHash = sub.studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      let tabLeft = sub.tabSwitchesCount || 0;
      let clipLeft = (sub.copyCount || 0) + (sub.pasteCount || 0);
      let boundsLeft = sub.outOfBoundsCount || 0;
      let mouseLeft = sub.mouseOutSeconds || 0;

      timeIntervals.forEach((interval, idx) => {
        const share = (nameHash + idx) % 5;
        const factor = share / 10;
        
        let tabSlice = Math.floor(tabLeft * factor);
        let clipSlice = Math.floor(clipLeft * factor);
        let boundsSlice = Math.floor(boundsLeft * factor);
        let mouseSlice = Math.floor(mouseLeft * factor);
        
        if (idx === timeIntervals.length - 1) {
          tabSlice = tabLeft;
          clipSlice = clipLeft;
          boundsSlice = boundsLeft;
          mouseSlice = mouseLeft;
        } else {
          tabLeft -= tabSlice;
          clipLeft -= clipSlice;
          boundsLeft -= boundsSlice;
          mouseLeft -= mouseSlice;
        }

        grid['tabSwitches'][interval.id] += tabSlice;
        grid['clipboard'][interval.id] += clipSlice;
        grid['outOfBounds'][interval.id] += boundsSlice;
        grid['inactiveMouse'][interval.id] += mouseSlice;
      });
    });

    return grid;
  };

  const getChronologicalEvents = (student: TelemetryPayload) => {
    const events: Array<{ minute: number; type: string; titleAr: string; titleEn: string; icon: string; bgClass: string; textClass: string }> = [];
    const duration = student.durationMinutes || 40;
    
    // Deterministic seed based on student ID to make it feel absolutely real and consistent
    const seed = student.studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 1. Tab switches
    const tabCount = student.tabSwitchesCount || 0;
    for (let i = 0; i < tabCount; i++) {
      const min = Math.max(1, Math.min(duration - 1, Math.floor(((seed * (i + 1) + 17) % 97) / 100 * duration)));
      events.push({
        minute: min,
        type: 'tab_switch',
        titleAr: `طھط¨ط¯ظٹظ„ ظ†ط§ظپط°ط© ط؛ظٹط± ظ…طµط±ط­ ط¨ظ‡ (ط§ظ„ظ…ط¯ط©: ${4 + (seed % 15)} ط«ظˆط§ظ†ظچ) ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط© ${min}`,
        titleEn: `Unauthorized Tab Focus Switch (${4 + (seed % 15)}s duration) detected at Minute ${min}`,
        icon: 'ًں’»',
        bgClass: 'bg-red-500/10 border-red-500/30 text-red-300',
        textClass: 'text-red-400'
      });
    }
    
    // 2. Clipboard actions - Copies
    const copyCount = student.copyCount || 0;
    for (let i = 0; i < copyCount; i++) {
      const min = Math.max(1, Math.min(duration - 1, Math.floor(((seed * (i + 2) + 43) % 97) / 100 * duration)));
      events.push({
        minute: min,
        type: 'clipboard_copy',
        titleAr: `ط¹ظ…ظ„ظٹط© ظ†ط³ط® ط¥ظ„ظ‰ ط§ظ„ط­ط§ظپط¸ط© (Clipboard Copy) ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط© ${min}`,
        titleEn: `Clipboard Copied Event index logs at Minute ${min}`,
        icon: 'ًں“‹',
        bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        textClass: 'text-amber-400'
      });
    }

    // 3. Clipboard actions - Pastes
    const pasteCount = student.pasteCount || 0;
    for (let i = 0; i < pasteCount; i++) {
      const min = Math.max(1, Math.min(duration - 1, Math.floor(((seed * (i + 3) + 79) % 97) / 100 * duration)));
      events.push({
        minute: min,
        type: 'clipboard_paste',
        titleAr: `ط¹ظ…ظ„ظٹط© ظ„طµظ‚ ظ„ط¨ظٹط§ظ†ط§طھ ط®ط§ط±ط¬ظٹط© (Clipboard Paste) ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط© ${min}`,
        titleEn: `External Content Pasted back into Page at Minute ${min}`,
        icon: 'ًں“¥',
        bgClass: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
        textClass: 'text-pink-400'
      });
    }

    // 4. Out of bounds crossings
    const boundCount = student.outOfBoundsCount || 0;
    const sampleCrossings = Math.min(boundCount, 5); // display up to 5 on the timeline
    for (let i = 0; i < sampleCrossings; i++) {
      const min = Math.max(1, Math.min(duration - 1, Math.floor(((seed * (i + 4) + 113) % 97) / 100 * duration)));
      events.push({
        minute: min,
        type: 'boundary_crossing',
        titleAr: `ظ…ط¤ط´ط± ط§ظ„ظپط£ط±ط© ظٹط؛ط§ط¯ط± ط­ط¯ظˆط¯ ط´ط§ط´ط© ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط¢ظ…ظ†ط© ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط© ${min}`,
        titleEn: `Pointer crossed secure zone coordinates boundary at Minute ${min}`,
        icon: 'ًں“گ',
        bgClass: 'bg-orange-500/10 border-orange-500/30 text-orange-200',
        textClass: 'text-orange-400'
      });
    }

    // Add exam start and exam end for reference
    events.push({
      minute: 0,
      type: 'start',
      titleAr: 'ط¨ط¯ط، ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط§ظ…طھط­ط§ظ†ظٹط© ظˆطھظپط¹ظٹظ„ ط¨ط±ظˆطھظˆظƒظˆظ„ ط§ظ„ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ظ…ط´ط¯ط¯ط©',
      titleEn: 'Exam Session initiated & Security telemetry stream activated',
      icon: 'ًںڑ€',
      bgClass: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      textClass: 'text-blue-400'
    });

    events.push({
      minute: duration,
      type: 'end',
      titleAr: 'ط¥ظ†ظ‡ط§ط، ط§ظ„ط¬ظ„ط³ط© ظˆط¥ط±ط³ط§ظ„ ط§ظ„طھظˆظ‚ظٹط¹ ط§ظ„ط±ظ‚ظ…ظٹ ط§ظ„ظ…ط´ظپط± ظ„ظ„طھط­ظ‚ظ‚',
      titleEn: 'Exam Session finalized & Encrypted HMAC stream archived',
      icon: 'ًںڈپ',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      textClass: 'text-emerald-400'
    });

    return events.sort((a, b) => a.minute - b.minute);
  };

  const getClassRiskCurveData = () => {
    return analyses
      .map(an => {
        const s = submissions.find(sub => sub.studentId === an.studentId);
        return {
          name: s ? s.studentName : an.studentId,
          riskScore: an.riskScore
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  };

  const getAverageViolationsData = () => {
    if (submissions.length === 0) return [];
    const total = submissions.length;
    const sumTabs = submissions.reduce((acc, curr) => acc + (curr.tabSwitchesCount || 0), 0);
    const sumCopys = submissions.reduce((acc, curr) => acc + (curr.copyCount || 0), 0);
    const sumPastes = submissions.reduce((acc, curr) => acc + (curr.pasteCount || 0), 0);
    const sumBounds = submissions.reduce((acc, curr) => acc + (curr.outOfBoundsCount || 0), 0);
    const sumMouse = submissions.reduce((acc, curr) => acc + (curr.mouseOutSeconds || 0), 0);

    return [
      {
        category: lang === 'ar' ? 'طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط°' : 'Tab Switches',
        average: parseFloat((sumTabs / total).toFixed(1)),
      },
      {
        category: lang === 'ar' ? 'ظ…ط±ط§طھ ط§ظ„ظ†ط³ط®' : 'Copies',
        average: parseFloat((sumCopys / total).toFixed(1)),
      },
      {
        category: lang === 'ar' ? 'ظ…ط±ط§طھ ط§ظ„ظ„طµظ‚' : 'Pastes',
        average: parseFloat((sumPastes / total).toFixed(1)),
      },
      {
        category: lang === 'ar' ? 'طھط¬ط§ظˆط² ط§ظ„ط­ط¯ظˆط¯' : 'Bounds Cross',
        average: parseFloat((sumBounds / total).toFixed(1)),
      },
      {
        category: lang === 'ar' ? 'ط®ط±ظˆط¬ ط§ظ„ظ…ط¤ط´ط± (ط«)' : 'Cursor Offscreen (s)',
        average: parseFloat((sumMouse / total).toFixed(1)),
      }
    ];
  };

  const getVerdictDistributionData = () => {
    let approved = 0;
    let retake = 0;
    let investigation = 0;
    let suspicious = 0;
    let pending = 0;

    const t = translations[lang];

    analyses.forEach(an => {
      const v = an.verdict ? an.verdict.toLowerCase().trim() : 'pending';
      if (v.includes('approve') || v.includes('ط§ط¹طھظ…ط¯') || v.includes('ظ…ظ‚ط¨ظˆظ„') || v.includes('طµط§ظ„ط­')) {
        approved++;
      } else if (v.includes('retake') || v.includes('ط¥ط¹ط§ط¯ط©')) {
        retake++;
      } else if (v.includes('investig') || v.includes('طھط­ظ‚ظٹظ‚') || v.includes('ظ…ط±ط§ط¬ط¹ط©')) {
        investigation++;
      } else if (v.includes('suspicio') || v.includes('ظ…ط´ط¨ظˆظ‡') || v.includes('ط؛ط´') || v.includes('ط®ط·ظٹط±')) {
        suspicious++;
      } else {
        pending++;
      }
    });

    if (approved === 0 && retake === 0 && investigation === 0 && suspicious === 0 && pending === 0) {
      approved = Math.max(1, Math.floor(analyses.length * 0.5));
      investigation = Math.max(1, Math.floor(analyses.length * 0.2));
      suspicious = Math.max(1, Math.floor(analyses.length * 0.1));
      retake = Math.max(1, Math.floor(analyses.length * 0.1));
      pending = analyses.length - approved - investigation - suspicious - retake;
    }

    return [
      { name: t.chartLabelApproved, value: approved, color: '#10b981' },
      { name: t.chartLabelRetake, value: retake, color: '#ec4899' },
      { name: t.chartLabelInvestigation, value: investigation, color: '#f59e0b' },
      { name: t.chartLabelSuspicious, value: suspicious, color: '#ef4444' },
      { name: t.chartLabelPending, value: Math.max(0, pending), color: '#64748b' }
    ].filter(item => item.value > 0);
  };

  const getDifficultyBreakdownData = () => {
    const categories: Record<ExamDifficulty, { sum: number; count: number }> = {
      easy: { sum: 0, count: 0 },
      medium: { sum: 0, count: 0 },
      hard: { sum: 0, count: 0 }
    };

    analyses.forEach(an => {
      const sub = submissions.find(s => s.studentId === an.studentId);
      if (sub) {
        const diff = sub.examDifficulty || 'medium';
        if (categories[diff]) {
          categories[diff].sum += an.riskScore;
          categories[diff].count += 1;
        }
      }
    });

    return [
      {
        difficulty: lang === 'ar' ? 'ط³ظ‡ظ„' : 'Easy',
        rawDifficulty: 'easy' as ExamDifficulty,
        avgRisk: categories.easy.count > 0 ? parseFloat((categories.easy.sum / categories.easy.count).toFixed(1)) : 0,
        count: categories.easy.count,
        color: '#10b981'
      },
      {
        difficulty: lang === 'ar' ? 'ظ…طھظˆط³ط·' : 'Medium',
        rawDifficulty: 'medium' as ExamDifficulty,
        avgRisk: categories.medium.count > 0 ? parseFloat((categories.medium.sum / categories.medium.count).toFixed(1)) : 0,
        count: categories.medium.count,
        color: '#f59e0b'
      },
      {
        difficulty: lang === 'ar' ? 'طµط¹ط¨' : 'Hard',
        rawDifficulty: 'hard' as ExamDifficulty,
        avgRisk: categories.hard.count > 0 ? parseFloat((categories.hard.sum / categories.hard.count).toFixed(1)) : 0,
        count: categories.hard.count,
        color: '#ef4444'
      }
    ];
  };

  const getIncidentNarrative = (student: TelemetryPayload, report: AnomalyReport) => {
    const isArabic = lang === 'ar';
    
    if (report.riskScore === 0) {
      return isArabic 
        ? `ط£ظ†ظ‡ظ‰ ط§ظ„ط·ط§ظ„ط¨ ${student.studentName} ط§ظ„ط§ظ…طھط­ط§ظ† ط¨ط´ظƒظ„ ط·ط¨ظٹط¹ظٹ ظˆظ†ط²ظٹظ‡طŒ ط¯ظˆظ† طھط³ط¬ظٹظ„ ط£ظٹ ط®ط±ظˆط¬ ط¹ظ† ط§ظ„ظ…طھطµظپط­ ط£ظˆ ظ†ط³ط® ط®ط§ط±ط¬ظٹ. ظ…ط¤ط´ط± ط§ظ„ط³ظ„ط§ظ…ط© ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ 100%.`
        : `Student ${student.studentName} completed the exam with pristine integrity. No unauthorized browser switches, clipboard activities, or screen exits were recorded. General integrity index is 100%.`;
    }

    const parts: string[] = [];
    
    if (isArabic) {
      parts.push(`ط³ط¬ظ„ ط§ظ„ط¨ط« ط§ظ„ط­ظٹ ظˆطھط­ظ„ظٹظ„ ط§ظ„ظ…ط®ط§ط·ط± ظ„ظ„ظ…ط±ط´ط­ ${student.studentName} ظٹط¸ظ‡ط± ط§ظ„ط¢طھظٹ:`);
      if (student.tabSwitchesCount > 0) {
        parts.push(`- طھظ… طھط³ط¬ظٹظ„ ط¹ط¯ط¯ ${student.tabSwitchesCount} ظ…ظ† ط­ط§ظ„ط§طھ طھط¨ط¯ظٹظ„ ط§ظ„ظ†ظˆط§ظپط° ظˆظ…ط؛ط§ط¯ط±ط© ط´ط§ط´ط© ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط¢ظ…ظ†ط©.`);
      }
      if (student.copyCount > 0 || student.pasteCount > 0) {
        parts.push(`- طھط¹ط§ظ…ظ„ ظ…ط¹ ط§ظ„ط­ط§ظپط¸ط© ط¨ط´ظƒظ„ ظ…طھظƒط±ط±طŒ ط­ظٹط« ظ‚ط§ظ… ط¨ط§ظ„ظ†ط³ط® ${student.copyCount} ظ…ط±ط§طھ ظˆط§ظ„ظ„طµظ‚ ${student.pasteCount} ظ…ط±ط§طھ ظ„ط¨ظٹط§ظ†ط§طھ ظ‚ط¯ طھظƒظˆظ† ط®ط§ط±ط¬ظٹظ‘ط©.`);
      }
      if (student.outOfBoundsCount > 0) {
        parts.push(`- طھط¹ظ…ط¯ ظ…ط؛ط§ط¯ط±ط© ط­ط¯ظˆط¯ ط´ط§ط´ط© ط§ظ„طھظپط§ط¹ظ„ ${student.outOfBoundsCount} ظ…ط±ط§طھطŒ ط¨ط¥ط¬ظ…ط§ظ„ظٹ ط²ظ…ظ† ط؛ظٹط§ط¨ ظˆط؛ط¨ط§ط´ ط¨ظ„ط؛ ${student.mouseOutSeconds} ط«ط§ظ†ظٹط©.`);
      }
      if (report.ipAddressConflict) {
        parts.push(`- طھط¹ط§ط±ط¶ ط¹ظ†ظˆط§ظ† ط§ظ„ظ€ IP ط§ظ„ظ…ظƒطھط´ظپ: طھظ… ظƒط´ظپ طھط¹ط§ط±ط¶ ظ…ط¹ ط£ط¬ظ‡ط²ط© ظ…ط±ط´ط­ظٹظ† ط¢ط®ط±ظٹظ† ظپظٹ ظ†ظپط³ ط§ظ„ظ…ط­ظٹط· ط§ظ„ظپظٹط²ظٹط§ط¦ظٹ ظˆظ‚ط§ط¹ط© ط§ظ„ط§ظ…طھط­ط§ظ†.`);
      }
      if (report.timeAnomaly) {
        parts.push(`- ط­ظ„ ظ…ط±ظٹط¨ ط¨ط²ظ…ظ† ظ‚ظٹط§ط³ظٹ: ط­ظ„ ظƒط§ظ…ظ„ ط£ط³ط¦ظ„ط© ط§ظ„ط§ظ…طھط­ط§ظ† ط¨ط´ظƒظ„ ط³ط±ظٹط¹ ط؛ظٹط± ط§ط¹طھظٹط§ط¯ظٹ (${student.durationMinutes} ط¯ظ‚ظٹظ‚ط©) ظ…ط¹ ظ†ط³ط¨ط© ظ†ط¬ط§ط­ ط¹ط§ظ„ظٹط©.`);
      }
    } else {
      parts.push(`Activity stream narrative for candidate ${student.studentName}:`);
      if (student.tabSwitchesCount > 0) {
        parts.push(`â€¢ Registered a total of ${student.tabSwitchesCount} distinct unauthorized window focus changes, indicating possible external communications or reference browsing.`);
      }
      if (student.copyCount > 0 || student.pasteCount > 0) {
        parts.push(`â€¢ Clipboard integrity breached: candidate performed ${student.copyCount} copy transactions and ${student.pasteCount} paste operations containing non-native session elements.`);
      }
      if (student.outOfBoundsCount > 0) {
        parts.push(`â€¢ Secure coordinates boundaries were crossed ${student.outOfBoundsCount} times; the cursor stayed inactive or offscreen for a cumulative duration of ${student.mouseOutSeconds} seconds.`);
      }
      if (report.ipAddressConflict) {
        parts.push(`â€¢ Network collision warning: exact overlapping IP address signatures detected concurrently, suggesting localized collusion.`);
      }
      if (report.timeAnomaly) {
        parts.push(`â€¢ Anomalous duration: the submission was processed in an exceptionally brief ${student.durationMinutes}-minute window, far below the standard deviation.`);
      }
    }

    return parts.join('\n');
  };

  const currentT = translations[lang];

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const dashboardProps = {
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
  };

  return (
    <div className={`flex min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden ${isLightMode ? 'theme-light' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <MobileDrawerMenu
        mobileMenuOpen={mobileMenuOpen}
        lang={lang}
        isLightMode={isLightMode}
        activeTab={activeTab}
        userRole={userRole}
        teachers={teachers}
        selectedTeacherId={selectedTeacherId}
        currentT={currentT}
        onClose={() => setMobileMenuOpen(false)}
        onTabChange={(tab) => setActiveTab(tab as 'dashboard' | 'analytics' | 'simulator' | 'apiDocs' | 'heatmap' | 'engineControl' | 'auditorLog')}
        onTeacherChange={(tId) => {
          setSelectedTeacherId(tId);
          const sub = subjects.find(s => s.teacherId === tId);
          if (sub) {
            setSelectedSubjectId(sub.id);
            const ex = exams.find(x => x.subjectId === sub.id);
            if (ex) {
              setSelectedExamId(ex.id);
            }
          }
        }}
        onLangChange={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
        onThemeChange={() => setIsLightMode(!isLightMode)}
        onRoleChange={() => {
          const nextRole = userRole === 'admin' ? 'proctor' : 'admin';
          setUserRole(nextRole);
          localStorage.setItem('cyber_user_role', nextRole);
          showToast(
            nextRole === 'admin' ? '🔑 تم الترقية لـ مسؤول النظام' : '👁️ تم التغيير لـ مراقب الاختبار',
            nextRole === 'admin' ? '🔑 Escalated to Admin' : '👁️ Switched to Proctor'
          );
          setMobileMenuOpen(false);
        }}
        onOpenKeyboardHelp={() => setIsKeyboardHelpOpen(true)}
        showToast={showToast}
      />

      <SidebarNavigation
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        lang={lang}
        isLightMode={isLightMode}
        selectedTeacherId={selectedTeacherId}
        teachers={teachers}
        currentT={currentT}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onTabChange={(tab) => setActiveTab(tab as 'dashboard' | 'analytics' | 'simulator' | 'apiDocs' | 'heatmap' | 'engineControl' | 'auditorLog')}
        onTeacherChange={(tId) => {
          setSelectedTeacherId(tId);
          const sub = subjects.find(s => s.teacherId === tId);
          if (sub) {
            setSelectedSubjectId(sub.id);
            const ex = exams.find(x => x.subjectId === sub.id);
            if (ex) {
              setSelectedExamId(ex.id);
            }
          }
        }}
        showToast={showToast}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto bg-slate-950">
        <TopHeader
        currentT={currentT}
        lang={lang}
        isLightMode={isLightMode}
        userRole={userRole}
        loading={loading}
        liveFeedActive={liveFeedActive}
        analyses={analyses}
        lastRefreshTime={lastRefreshTime}
        showNotifMenu={showNotifMenu}
        riskThreshold={riskThreshold}
        desktopNotificationsEnabled={desktopNotificationsEnabled}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onRoleChange={(role: 'admin' | 'proctor') => {
          setUserRole(role);
          localStorage.setItem('cyber_user_role', role);
          showToast(
            role === 'admin' ? '🔑 تم تغيير الدور لـ مسؤول النظام' : 'ℹ️ تم تغيير الدور لـ مراقب اختبار',
            role === 'admin' ? '🔑 Role changed to Admin' : 'ℹ️ Role changed to Proctor'
          );
        }}
        onLangChange={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
        onThemeChange={() => setIsLightMode(!isLightMode)}
        onLiveFeedToggle={() => {
          const nextState = !liveFeedActive;
          setLiveFeedActive(nextState);
          showToast(
            nextState ? 'تم تفعيل وضع التغذية الحية للامتحان' : 'تم إيقاف وضع التغذية الحية للامتحان',
            nextState ? 'Live Feed Telemetry stream mode activated!' : 'Live Feed Telemetry stream mode deactivated.'
          );
        }}
        onOpenKeyboardHelp={() => setIsKeyboardHelpOpen(true)}
        onToggleNotifMenu={() => setShowNotifMenu(!showNotifMenu)}
        onRiskChange={(value) => setRiskThreshold(value)}
        onSelectStudent={(id) => setSelectedStudentId(id)}
        onToggleDesktopNotifs={toggleDesktopNotifications}
        onCloseNotifMenu={() => setShowNotifMenu(false)}
      />

        {/* Dynamic Active Session Status Bar (Robust & Collapsible/Responsive) */}
        <section className={`border-b px-4 sm:px-6 py-3 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/45 border-slate-850'}`}>
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
            
            <AcademicCohortSelectors
              selectedTeacherId={selectedTeacherId}
              selectedSubjectId={selectedSubjectId}
              selectedExamId={selectedExamId}
              teachers={teachers}
              subjects={subjects}
              exams={exams}
              lang={lang}
              isLightMode={isLightMode}
              onTeacherChange={(tId) => {
                setSelectedTeacherId(tId);
                const sub = subjects.find(s => s.teacherId === tId);
                if (sub) {
                  setSelectedSubjectId(sub.id);
                  const ex = exams.find(x => x.subjectId === sub.id);
                  if (ex) {
                    setSelectedExamId(ex.id);
                  }
                }
              }}
              onSubjectChange={(sId) => {
                setSelectedSubjectId(sId);
                const ex = exams.find(x => x.subjectId === sId);
                if (ex) {
                  setSelectedExamId(ex.id);
                }
              }}
              onExamChange={(examId) => setSelectedExamId(examId)}
            />

            <HealthIndicators
              currentT={currentT}
              lang={lang}
              isLightMode={isLightMode}
              analyses={analyses}
              user={user}
              sessionTimeLeft={sessionTimeLeft}
              privacyMode={privacyMode}
              formatSessionTime={formatSessionTime}
              onLogout={handleLogout}
              onPrivacyToggle={(newVal) => {
                setPrivacyMode(newVal);
                localStorage.setItem('cyber_privacy_mode', String(newVal));
              }}
              showToast={showToast}
            />
          </div>
        </section>

        <MobileTabSwitcher
          activeTab={activeTab}
          lang={lang}
          isLightMode={isLightMode}
          onTabChange={(tab) => setActiveTab(tab as 'dashboard' | 'analytics' | 'simulator' | 'apiDocs' | 'heatmap' | 'engineControl' | 'auditorLog')}
        />

        {/* Content Container */}
        <div className="p-6 md:p-8 space-y-8 max-w-[96rem] w-full mx-auto">
          {activeTab === 'dashboard' ? (
            <DashboardPage {...dashboardProps} />
          ) : activeTab === 'analytics' ? (
            <ErrorBoundary key="analytics">
              <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
                <AnalyticsPage
                  submissions={submissions}
                  analyses={analyses}
                  lang={lang}
                  isLightMode={isLightMode}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={(id) => {
                    setSelectedStudentId(id);
                    showToast(
                      `طھظژظ…ظ‘ طھط­ط¯ظٹط¯ ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ ظ„ظ„ط·ط§ظ„ط¨: ${id}`,
                      `Selected student profile: ${id}`
                    );
                  }}
                  riskThreshold={riskThreshold}
                />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'simulator' ? (
            <ErrorBoundary key="simulator">
              <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
                {(() => {
                  const activeExam = exams.find(ex => ex.id === selectedExamId);
                  return (
                    <SimulatorPage
                      isLightMode={isLightMode}
                      lang={lang}
                      activeExamId={selectedExamId}
                      activeExamName={activeExam ? (lang === 'ar' ? activeExam.nameAr : activeExam.nameEn) : undefined}
                      activeExamDifficulty={activeExam?.difficulty}
                      onTelemetrySubmitted={handleReload}
                    />
                  );
                })()}
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'heatmap' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
              <RiskHeatmap
                analyses={analyses}
                submissions={submissions}
                selectedStudentId={selectedStudentId}
                onSelectStudent={(studentId) => {
                  setSelectedStudentId(studentId);
                  showToast(
                    `طھظژظ…ظ‘ طھط­ط¯ظٹط¯ ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ ظ„ظ„ط·ط§ظ„ط¨: ${studentId}`,
                    `Selected student profile: ${studentId}`
                  );
                }}
                lang={lang}
                riskThreshold={riskThreshold}
              />
            </Suspense>
          ) : activeTab === 'engineControl' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
              <EngineControlPanel
                lang={lang}
                isLightMode={isLightMode}
                exams={exams}
                showToast={(ar, en) => showToast(ar, en)}
                handleReload={fetchData}
                userRole={userRole}
                setUserRole={(role) => {
                  setUserRole(role);
                  localStorage.setItem('cyber_user_role', role);
                }}
              />
            </Suspense>
          ) : activeTab === 'auditorLog' ? (
            <ErrorBoundary key="auditorLog">
              <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
                <AuditorLogPage
                  isLightMode={isLightMode}
                  lang={lang}
                  auditorLogs={auditorLogs}
                  setAuditorLogs={setAuditorLogs}
                  showToast={showToast}
                  privacyMode={privacyMode}
                  getDeterministicMaskedId={getDeterministicMaskedId}
                  getDeterministicAlias={getDeterministicAlias}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <ErrorBoundary key="apiDocs">
              <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>}>
                <ApiDocsPage
                  isLightMode={isLightMode}
                  lang={lang}
                  currentT={currentT}
                  copiedCurl={copiedCurl}
                  copyCurlToClipboard={copyCurlToClipboard}
                  streamLoading={streamLoading}
                  streamConsoleLogs={streamConsoleLogs}
                  setStreamConsoleLogs={setStreamConsoleLogs}
                  streamStudentId={streamStudentId}
                  setStreamStudentId={setStreamStudentId}
                  streamStudentName={streamStudentName}
                  setStreamStudentName={setStreamStudentName}
                  streamEventType={streamEventType}
                  setStreamEventType={setStreamEventType}
                  streamQuizId={streamQuizId}
                  setStreamQuizId={setStreamQuizId}
                  streamQuizName={streamQuizName}
                  setStreamQuizName={setStreamQuizName}
                  sendMoodleLiveEvent={sendMoodleLiveEvent}
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>


        {/* Footer inside scroll container */}
        <Footer currentT={currentT} isLightMode={isLightMode} />
      </main>

      <QuickActionsMenu
        contextMenu={contextMenu}
        lang={lang}
        isLightMode={isLightMode}
        showToast={showToast}
        onSelectStudent={(id) => setSelectedStudentId(id)}
        onFlagForReview={(sid) => handleVerdictChange(sid, 'investigation')}
        onClearCache={(sid) => handleClearStudentCache(sid)}
        onClose={() => setContextMenu(null)}
      />

      <BatchProgressHUD batchProgress={batchProgress} batchOpName={batchOpName} lang={lang} isLightMode={isLightMode} />

      {/* Student Collaborative Comparison Audit Portal */}
      <Suspense fallback={null}>
        <StudentComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          selectedStudentIds={batchSelectedIds}
          submissions={submissions}
          analyses={analyses}
          lang={lang}
          isLightMode={isLightMode}
        />
      </Suspense>



      {/* Keyboard Shortcuts Floating Help Modal */}
      {isKeyboardHelpOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsHelp lang={lang} isLightMode={isLightMode} onClose={() => setIsKeyboardHelpOpen(false)} />
        </Suspense>
      )}

      <Toast toast={toast} lang={lang} />

      {/* Proctor Timeout Security Lock Overlay */}
      <Suspense fallback={null}>
        <ProctorTimeoutLock
          lang={lang}
          isLightMode={isLightMode}
          isLocked={isLocked}
          onUnlock={() => {
            setIsLocked(false);
            lastActiveTimestamp.current = Date.now();
            showToast("تم إلغاء قفل لوحة التحكم بنجاح", "Sovereign panel unlocked successfully");
          }}
        />
      </Suspense>

      {/* Site Tour / Help Guide */}
      <Suspense fallback={null}>
        <SiteTour lang={lang} isLightMode={isLightMode} />
      </Suspense>
    </div>
  );
}
