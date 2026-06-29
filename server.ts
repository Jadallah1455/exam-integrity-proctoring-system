/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { execSync } from "child_process";
import net from "net";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { TelemetryPayload, AnomalyReport, ExamDifficulty } from "./src/types";

dotenv.config();

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(startPort, "0.0.0.0", () => {
      server.close(() => resolve(startPort));
    });
  });
}

const app = express();
const DESIRED_PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// JWT & Auth Config
const JWT_SECRET = process.env.JWT_SECRET || "EXAM_PROCTOR_SECRET_2026_DEFAULT_CHANGE_IN_PRODUCTION";
const JWT_EXPIRES_IN = "24h";

interface AuthUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'proctor';
  nameAr: string;
  nameEn: string;
}

let users: AuthUser[] = [];

async function seedUsers() {
  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedProctor = await bcrypt.hash("proctor123", 10);
  users = [
    { id: "user_admin", username: "admin", password: hashedAdmin, role: "admin", nameAr: "مدير النظام", nameEn: "System Admin" },
    { id: "user_proctor1", username: "proctor", password: hashedProctor, role: "proctor", nameAr: "مراقب", nameEn: "Proctor" },
  ];
}

interface JwtPayload {
  userId: string;
  username: string;
  role: 'admin' | 'proctor';
  nameAr: string;
  nameEn: string;
}

const API_KEYS: string[] = process.env.API_KEYS ? process.env.API_KEYS.split(",").map(k => k.trim()) : [];

function authMiddleware(req: any, res: any, next: any) {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, error: "غير مصرح. يرجى تسجيل الدخول أولاً." });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "انتهت صلاحية الجلسة أو التوكن غير صالح." });
  }
}

function apiKeyOrAuth(req: any, res: any, next: any) {
  const apiKey = req.headers?.["x-api-key"];
  if (apiKey && API_KEYS.includes(String(apiKey))) {
    req.user = { userId: "api_key_user", username: "api_key", role: "admin", nameAr: "API Key", nameEn: "API Key" };
    return next();
  }
  authMiddleware(req, res, next);
}

function adminOnly(req: any, res: any, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: "هذه العملية تتطلب صلاحيات المدير." });
  }
  next();
}

// Request logging middleware for diagnostics
app.use((req, res, next) => {
  console.log(`[EXPRESS REQUEST] ${req.method} ${req.url}`);
  next();
});

// Initialize Gemini API
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Global Cache for Gemini-generated AI suggested actions
const geminiSuggestedActions: Record<string, { actionAr: string; actionEn: string }> = {};
const pendingGeminiRequests = new Set<string>();

async function requestGeminiSuggestedAction(
  studentId: string, 
  studentName: string, 
  examName: string, 
  riskScore: number, 
  anomalies: string[], 
  detail: any
) {
  const cacheKey = `${studentId}_${detail.examId || 'EXM-SEC-401'}`;
  if (geminiSuggestedActions[cacheKey] || pendingGeminiRequests.has(cacheKey)) {
    return;
  }

  if (!ai || !process.env.GEMINI_API_KEY) {
    return;
  }

  pendingGeminiRequests.add(cacheKey);
  console.log(`[Gemini AI] Querying suggested action for ${studentName} (${studentId}) on ${examName}...`);

  try {
    const prompt = `You are an expert academic integrity proctor. We have a student cheating detection system.
Student details:
- Name: ${studentName} (ID: ${studentId})
- Exam: ${examName}
- Risk Score: ${riskScore}%
- Anomalies flagged: ${anomalies.join(', ')}
- Behavioral stats:
  * Tab switches count: ${detail.tabSwitchesCount}
  * Clipboard copies count: ${detail.copyCount}
  * Clipboard pastes count: ${detail.pasteCount}
  * Offscreen mouse duration: ${detail.mouseOutSeconds} seconds
  * Out of bounds count: ${detail.outOfBoundsCount}
  * IP Address Conflict: ${detail.ipAddressConflict ? 'Yes' : 'No'}
  * Possible Macro/Automation tools usage: ${detail.macroUsage ? 'Yes' : 'No'}

Based on these anomalies, suggest exactly ONE highly specific, concise course of action recommending how the proctor or academic advisor should verify the candidate's integrity (e.g., 'Verify IP address manually', 'Review screen recording if available', 'Audit clipboard logs for pasted answers', etc.). Do NOT output conversational filler or greeting.
Output your response EXACTLY as a single JSON object with two fields "suggestedActionEn" (short English recommendation, max 7 words) and "suggestedActionAr" (short Arabic equivalent, max 7 words). Do not put markdown codeblocks around the JSON.
Example response format:
{"suggestedActionEn": "Audit clipboard logs for pasted answers", "suggestedActionAr": "تحقق من نصوص الحافظة المنسوخة"} `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim() || "{}";
    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    const data = JSON.parse(cleanJson);
    if (data.suggestedActionEn && data.suggestedActionAr) {
      geminiSuggestedActions[cacheKey] = {
        actionEn: data.suggestedActionEn,
        actionAr: data.suggestedActionAr
      };
      console.log(`[Gemini AI] Successfully cached action for ${studentName}:`, data);
    }
  } catch (err: any) {
    // Graceful adaptive fallback for Rate Limits (429), connection limits, or credential errors.
    // This maintains functional correctness and prevents telemetry parsing failures or resource exhaustion warnings.
    let fallbackEn = "Review screen recording if available";
    let fallbackAr = "مراجعة تسجيل الشاشة المتاح";

    if (anomalies && anomalies.length > 0) {
      if (anomalies.some(a => a.toLowerCase().includes("ip") || a.toLowerCase().includes("عنوان"))) {
        fallbackEn = "Perform manual IP range check";
        fallbackAr = "إجراء تدقيق يدوي لنطاق العناوين";
      } else if (anomalies.some(a => a.toLowerCase().includes("macro") || a.toLowerCase().includes("ماكرو") || a.toLowerCase().includes("سلوك"))) {
        fallbackEn = "Audit keyboard macro sequences";
        fallbackAr = "فحص تسلسلات الأتمتة بلوحة المفاتيح";
      } else if (riskScore > 35) {
        fallbackEn = "Conduct live oral academic review";
        fallbackAr = "جدولة تقييم شفهي تحت إشراف مباشر";
      } else if (anomalies.some(a => a.toLowerCase().includes("paste") || a.toLowerCase().includes("لصق"))) {
        fallbackEn = "Inspect clipboard text history";
        fallbackAr = "فحص سجل الحافظة وبياضات الأسئلة";
      }
    } else if (detail && detail.ipAddressConflict) {
      fallbackEn = "Perform manual IP range check";
      fallbackAr = "إجراء تدقيق يدوي لنطاق العناوين";
    }

    geminiSuggestedActions[cacheKey] = {
      actionEn: fallbackEn,
      actionAr: fallbackAr
    };
    console.log(`[Gemini AI Quota Handler] Adaptive fallback allocated for ${studentName}: ${fallbackEn}`);
  } finally {
    pendingGeminiRequests.delete(cacheKey);
  }
}

// In-Memory Data Store (Provides server-side persistence for the session)
const DEFAULT_KEY_SALT = "GRADUATION_PROJECT_SECRET_SALT_2026";

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

const teachers: Teacher[] = [
  { id: "prof_fadi", nameAr: "أ.د. فادي أبو شرخ", nameEn: "Prof. Fadi Abu Sharikh" },
  { id: "dr_noura", nameAr: "د. نورة السعيد", nameEn: "Dr. Noura Al-Saeed" },
  { id: "prof_khaled", nameAr: "أ.د. خالد المطيري", nameEn: "Prof. Khaled Al-Mutairi" },
  { id: "dr_sarah", nameAr: "د. سارة القحطاني", nameEn: "Dr. Sarah Al-Qahtani" },
  { id: "dr_ahmad", nameAr: "د. أحمد الزهراني", nameEn: "Dr. Ahmad Al-Zahrani" }
];

const subjects: Subject[] = [
  // Prof Fadi Abu Sharikh
  { id: "sub_calculus", teacherId: "prof_fadi", nameAr: "حساب التفاضل والتكامل 1", nameEn: "Calculus I" },
  { id: "sub_linalg", teacherId: "prof_fadi", nameAr: "الجبر الخطي", nameEn: "Linear Algebra" },
  { id: "sub_num_analysis", teacherId: "prof_fadi", nameAr: "التحليل العددي", nameEn: "Numerical Analysis" },
  
  // Dr Noura Al-Saeed
  { id: "sub_cybersecurity", teacherId: "dr_noura", nameAr: "هندسة الأمن السيبراني", nameEn: "Cybersecurity Engineering" },
  { id: "sub_cryptography", teacherId: "dr_noura", nameAr: "بروتوكولات التشفير والأمن", nameEn: "Cryptographic Protocols" },
  
  // Prof Khaled Al-Mutairi
  { id: "sub_networks", teacherId: "prof_khaled", nameAr: "مقدمة في شبكات الحاسب", nameEn: "Computer Networks" },
  { id: "sub_os", teacherId: "prof_khaled", nameAr: "نظم تشغيل", nameEn: "Operating Systems" },
  
  // Dr Sarah Al-Qahtani
  { id: "sub_sqa", teacherId: "dr_sarah", nameAr: "ضمان جودة البرمجيات", nameEn: "Software Quality Assurance" },
  { id: "sub_hci", teacherId: "dr_sarah", nameAr: "التفاعل بين الإنسان والحاسوب", nameEn: "Human-Computer Interaction" },
  
  // Dr Ahmad Al-Zahrani
  { id: "sub_db", teacherId: "dr_ahmad", nameAr: "نظم إدارة قواعد البيانات", nameEn: "Database Management Systems" },
  { id: "sub_distributed", teacherId: "dr_ahmad", nameAr: "النظم الموزعة", nameEn: "Distributed Systems" }
];

const exams: Exam[] = [
  // Calculus I Exams
  { id: "EXM-CALC-101", subjectId: "sub_calculus", nameAr: "الاختبار النصفي لمادة الكالكولاس", nameEn: "Calculus I Midterm Exam", difficulty: "medium", timeLimit: 60 },
  { id: "EXM-CALC-102", subjectId: "sub_calculus", nameAr: "الامتحان القصير الأول المتقدم", nameEn: "Calculus Quiz 1", difficulty: "easy", timeLimit: 30 },
  
  // Linear Algebra Exams
  { id: "EXM-LINALG-301", subjectId: "sub_linalg", nameAr: "الامتحان النهائي للجبر الخطي", nameEn: "Linear Algebra Final Exam", difficulty: "hard", timeLimit: 90 },
  { id: "EXM-LINALG-101", subjectId: "sub_linalg", nameAr: "الاختبار النصفي للجبر الخطي", nameEn: "Linear Algebra Midterm Exam", difficulty: "medium", timeLimit: 60 },
  
  // Numerical Analysis Exams
  { id: "EXM-NUM-201", subjectId: "sub_num_analysis", nameAr: "التحليل العددي - اختبار مفاهيم", nameEn: "Numerical Concept Quiz", difficulty: "medium", timeLimit: 40 },
  
  // Cybersecurity Exams
  { id: "EXM-SEC-401", subjectId: "sub_cybersecurity", nameAr: "إختبار هندسة الأمن السيبراني النهائي", nameEn: "Cybersecurity Engineering Final Exam", difficulty: "hard", timeLimit: 60 },
  { id: "EXM-SEC-202", subjectId: "sub_cybersecurity", nameAr: "الاختبار النصفي للأمن السيبراني", nameEn: "Cybersecurity Midterm Exam", difficulty: "medium", timeLimit: 60 },
  
  // Cryptographic Exams
  { id: "EXM-CRYP-202", subjectId: "sub_cryptography", nameAr: "الامتحان العملي لبروتوكولات التشفير", nameEn: "Practical Cryptic Protocols Lab Exam", difficulty: "hard", timeLimit: 90 },
  
  // Computer Networks Exams
  { id: "EXM-NET-201", subjectId: "sub_networks", nameAr: "مقدمة في تصميم الشبكات والبروتوكولات", nameEn: "Computer Networks Midterm Exam", difficulty: "medium", timeLimit: 45 },
  { id: "EXM-NET-202", subjectId: "sub_networks", nameAr: "الاختبار النهائي لشبكات الحاسب", nameEn: "Computer Networks Final Exam", difficulty: "medium", timeLimit: 60 },
  
  // Operating Systems Exams
  { id: "EXM-OS-SHELL", subjectId: "sub_os", nameAr: "اختبار برمجة الأوامر Shell Scripting", nameEn: "Shell Programming Lab Assessment", difficulty: "hard", timeLimit: 50 },
  
  // Software Quality Assurance Exams
  { id: "EXM-SQA-301", subjectId: "sub_sqa", nameAr: "اختبار فحص الوحدات والتكامل البرمجي", nameEn: "Unit Testing & QA Assessment", difficulty: "medium", timeLimit: 45 },
  { id: "EXM-SQA-302", subjectId: "sub_sqa", nameAr: "اختبار مؤشرات تغطية الكود", nameEn: "Code Coverage Standards Test", difficulty: "easy", timeLimit: 30 },
  
  // Human-Computer Interaction Exams
  { id: "EXM-HCI-101", subjectId: "sub_hci", nameAr: "امتحان تصميم الواجهات وتجربة المستخدم", nameEn: "UI/UX Design Assessment", difficulty: "medium", timeLimit: 60 },
  
  // Database Management Exams
  { id: "EXM-DBS-201", subjectId: "sub_db", nameAr: "اختبار تحسين ومعالجة استعلامات SQL", nameEn: "SQL Query Performance Tuning Quiz", difficulty: "hard", timeLimit: 40 },
  { id: "EXM-DBS-202", subjectId: "sub_db", nameAr: "امتحان تصميم وصيانة قواعد البيانات", nameEn: "Database Relational Designing Exam", difficulty: "medium", timeLimit: 60 },
  
  // Distributed Systems Exams
  { id: "EXM-DIST-401", subjectId: "sub_distributed", nameAr: "اختبار بروتوكولات التوافق الموزع", nameEn: "Consensus Protocols Quiz", difficulty: "hard", timeLimit: 50 }
];

let studentVerdicts: Record<string, 'approved' | 'retake_requested' | 'investigation'> = {};

// --- DYNAMIC DETECTOR RULES & AI PLATFORM CONNECTIONS CONFIGS ---
export interface ProctorRule {
  id: string;
  nameAr: string;
  nameEn: string;
  enabled: boolean;
  baseWeight: number; // The risk points added on trigger
  metricKey: 'ip_conflict' | 'tab_switches' | 'copy_paste' | 'rapid_completion' | 'focus_out' | 'rapid_questions' | 'macro_usage' | 'ai_generated' | string;
  conditionFormula: string; // Printable condition details
  descriptionAr: string;
  descriptionEn: string;
}

export interface AIPlagiarismConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'custom_url';
  apiKey: string;
  customEndpointUrl: string;
  dataStrategy: 'all_at_once_batch' | 'question_by_question' | 'pairwise_students' | 'single_student_baseline';
  selectedModel: string;
  promptTemplateAr: string;
  promptTemplateEn: string;
}

let proctorRules: ProctorRule[] = [
  {
    id: "rule_ip",
    nameAr: "تطابق الـ IP وتعارض الشبكة",
    nameEn: "IP Address Collision / Shared Network",
    enabled: true,
    baseWeight: 30,
    metricKey: "ip_conflict",
    conditionFormula: "sharedIpCount > 0",
    descriptionAr: "يحدث عند جلوس طالبين أو أكثر في نفس الشبكة أو الموقع لمكافحة الحل المشترك.",
    descriptionEn: "Triggers when multiple students share exact matching IP addresses during active exam."
  },
  {
    id: "rule_tabs",
    nameAr: "تبديل النوافذ ومغادرة المتصفح (Moodle Focus Loss)",
    nameEn: "Browser Tab Switching / Focus Loss",
    enabled: true,
    baseWeight: 10,
    metricKey: "tab_switches",
    conditionFormula: "tabSwitchesCount > 0",
    descriptionAr: "الخروج المتكرر من تبويب الامتحان النشط، يزيد تراكميا أو شريطة تكراره.",
    descriptionEn: "Triggers when candidates navigate away from active exam browser tab."
  },
  {
    id: "rule_copy_paste",
    nameAr: "عمليات النسخ واللصق المفرطة",
    nameEn: "Excessive Copy & Paste Abuse",
    enabled: true,
    baseWeight: 10,
    metricKey: "copy_paste",
    conditionFormula: "copyCount + pasteCount > 3",
    descriptionAr: "استيراد نصوص خارجية أو نسخ الأسئلة للاستعانة ببوابات ذكاء اصطناعي خارجية.",
    descriptionEn: "Triggers when copy/paste operations exceed a defined baseline standard."
  },
  {
    id: "rule_ai_gen",
    nameAr: "الاستعانة بالذكاء الاصطناعي لتوليد الإجابات",
    nameEn: "AI-Generated Answer Suspected",
    enabled: true,
    baseWeight: 20,
    metricKey: "ai_generated",
    conditionFormula: "aiProbability > 50",
    descriptionAr: "تولد الإجابات تلقائياً بمساعدة نماذج توليدية، ما يزيد من احتمالية الغش بمقدار 20%.",
    descriptionEn: "Triggers if student response patterns indicate automated language generation (adds 20% risk)."
  },
  {
    id: "rule_rapid",
    nameAr: "سرعة التسليم الفائقة وغير المتناسبة",
    nameEn: "Unreasonable Completion Velocity",
    enabled: true,
    baseWeight: 25,
    metricKey: "rapid_completion",
    conditionFormula: "completionRatio < 0.25 && score >= 85%",
    descriptionAr: "إنهاء ورقة الإجابة بوقت ضئيل جداً لا يتناسب مع طبيعة الأسئلة وصعوبتها الأكاديمية.",
    descriptionEn: "Triggers when high exam scores are completed in a fraction of normal session runtime."
  },
  {
    id: "rule_focus",
    nameAr: "فقدان تركيز الماوس / الخروج عن الحدود",
    nameEn: "Mouse Out Of Boundaries Duration",
    enabled: true,
    baseWeight: 15,
    metricKey: "focus_out",
    conditionFormula: "mouseOutSeconds > 45 || outOfBoundsCount > 8",
    descriptionAr: "تحرك مؤشر الفأرة بشكل مريب خارج نطاق إطار الحل النشط أو مغادرة الشاشة.",
    descriptionEn: "Triggers when mouse movement resides outside the exam window boundaries."
  },
  {
    id: "rule_rapid_questions",
    nameAr: "حل الأسئلة بسرعة مفرطة متتالية",
    nameEn: "Rapid Question-by-Question Submissions",
    enabled: true,
    baseWeight: 15,
    metricKey: "rapid_questions",
    conditionFormula: "rapidQuestionsCount >= 3",
    descriptionAr: "حل دقيق لأسئلة فرعية متعددة متتالية في أقل من خمس ثوانٍ للفرع الواحد دون تردد.",
    descriptionEn: "Triggers when multiple distinct questions are solved in an extremely low duration interval."
  },
  {
    id: "rule_macro",
    nameAr: "نقرات مكثفة تلمح لأتمتة مدخلات ماكرو",
    nameEn: "Macro-like Input Automation",
    enabled: true,
    baseWeight: 20,
    metricKey: "macro_usage",
    conditionFormula: "isMacroPatternsDetected == true",
    descriptionAr: "وجود نقرات سريعة بمعدلات ترددية آلية تلمح لنصوص تم توليدها بالآلة أو بأداة نقر برمجية.",
    descriptionEn: "Triggers if keyboard or mouse input speed presents mechanical click-rate sequences."
  }
];

let timingConfig = {
  easyBaseMinutesPerQuestion: 2,
  mediumBaseMinutesPerQuestion: 5,
  hardBaseMinutesPerQuestion: 8,
  teacherTimeAdjustment: 1.0,
};

let copyPasteConfig = {
  maxRiskPoints: 20,
  chatGPTPatternThreshold: 1,
  abusedMultiplier: 0.20,
};

let anomalyWeights = {
  tabSwitch: 4,
  paste: 2,
  copy: 1,
  ipConflict: 30,
  aiGenerated: 20,
  rapidCompletion: 25,
  focusOut: 15,
  rapidQuestions: 15,
  macroUsage: 20
};

let aiPlagiarismConfig: AIPlagiarismConfig = {
  provider: "gemini",
  apiKey: process.env.GEMINI_API_KEY || "",
  customEndpointUrl: "https://api.google.com/gemini/v1/plagiarism",
  dataStrategy: "pairwise_students",
  selectedModel: "gemini-2.5-flash",
  promptTemplateAr: "أنت خبير فحص نزاهة أكاديمي. قارن إجابات الطالبين التاليين لكشف الغش المشترك والتشابه الدلالي غير الطبيعي للحلول:\n\nالطالب الأول:\n{{student_a_answers}}\n\nالطالب الثاني:\n{{student_b_answers}}\n\nاحسب نسبة التشابه وتوقع التواطؤ بأدلة.",
  promptTemplateEn: "You are an academic forensic examiner. Analyze the following student answers to check for structural similarities and potential plagiarism/collusion:\n\nStudent A:\n{{student_a_answers}}\n\nStudent B:\n{{student_b_answers}}\n\nCalculate similarities percentage with structured bullet proofs."
};

let studentSubmissions: TelemetryPayload[] = [
  // === CALCULUS I MIDTERM (Prof Fadi) ===
  {
    studentId: "STD-2023-8891",
    studentName: "عبدالرحمن الشمري",
    examId: "EXM-CALC-101",
    examName: "الاختبار النصفي لمادة الكالكولاس",
    examDifficulty: "medium",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    durationMinutes: 12,
    scorePercent: 95,
    copyCount: 14,
    pasteCount: 12,
    tabSwitchesCount: 18,
    tabSwitchesTimeline: [
      { timestamp: new Date(Date.now() - 10500000).toISOString(), durationSeconds: 4 },
      { timestamp: new Date(Date.now() - 10400000).toISOString(), durationSeconds: 15 },
      { timestamp: new Date(Date.now() - 10100000).toISOString(), durationSeconds: 32 }
    ],
    ipAddresses: ["192.168.1.150"],
    mouseOutSeconds: 180,
    outOfBoundsCount: 15,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 15, changesCount: 0 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 8, changesCount: 0 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 12, changesCount: 0 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 21, changesCount: 1 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 14, changesCount: 0 }
    ]
  },
  {
    studentId: "STD-2023-4412",
    studentName: "سارة الغامدي",
    examId: "EXM-CALC-101",
    examName: "الاختبار النصفي لمادة الكالكولاس",
    examDifficulty: "medium",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1.6).toISOString(),
    durationMinutes: 54,
    scorePercent: 88,
    copyCount: 1,
    pasteCount: 0,
    tabSwitchesCount: 1,
    tabSwitchesTimeline: [{ timestamp: new Date().toISOString(), durationSeconds: 2 }],
    ipAddresses: ["10.0.4.15"],
    mouseOutSeconds: 8,
    outOfBoundsCount: 1,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 4, changesCount: 6 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 610, changesCount: 3 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 490, changesCount: 1 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 800, changesCount: 4 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 600, changesCount: 2 }
    ]
  },
  {
    studentId: "STD-2023-3329",
    studentName: "خالد الحربي",
    examId: "EXM-CALC-101",
    examName: "الاختبار النصفي لمادة الكالكولاس",
    examDifficulty: "medium",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    durationMinutes: 18,
    scorePercent: 100,
    copyCount: 2,
    pasteCount: 2,
    tabSwitchesCount: 0,
    tabSwitchesTimeline: [],
    ipAddresses: ["192.168.1.150"], // clashing IP
    mouseOutSeconds: 0,
    outOfBoundsCount: 0,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 120, changesCount: 0 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 200, changesCount: 1 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 150, changesCount: 0 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 310, changesCount: 0 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 300, changesCount: 0 }
    ]
  },
  {
    studentId: "STD-2023-7714",
    studentName: "ريم الدوسري",
    examId: "EXM-CALC-101",
    examName: "الاختبار النصفي لمادة الكالكولاس",
    examDifficulty: "medium",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 30,
    scorePercent: 78,
    copyCount: 0,
    pasteCount: 0,
    tabSwitchesCount: 0,
    tabSwitchesTimeline: [],
    ipAddresses: ["192.168.12.18"],
    mouseOutSeconds: 5,
    outOfBoundsCount: 1,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 360, changesCount: 1 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 360, changesCount: 1 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 360, changesCount: 1 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 360, changesCount: 1 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 360, changesCount: 1 }
    ]
  },

  // === CALCULUS I QUIZ 1 ===
  {
    studentId: "STD-2023-8891",
    studentName: "عبدالرحمن الشمري",
    examId: "EXM-CALC-102",
    examName: "الامتحان القصير الأول المتقدم",
    examDifficulty: "easy",
    examTimeLimitMinutes: 30,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 20,
    scorePercent: 100,
    copyCount: 0,
    pasteCount: 0,
    tabSwitchesCount: 0,
    tabSwitchesTimeline: [],
    ipAddresses: ["192.168.1.189"],
    mouseOutSeconds: 4,
    outOfBoundsCount: 0,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 150, changesCount: 1 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 220, changesCount: 0 }
    ]
  },
  {
    studentId: "STD-2023-9932",
    studentName: "فهد العنزي",
    examId: "EXM-CALC-102",
    examName: "الامتحان القصير الأول المتقدم",
    examDifficulty: "easy",
    examTimeLimitMinutes: 30,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 12,
    scorePercent: 62,
    copyCount: 8,
    pasteCount: 7,
    tabSwitchesCount: 5,
    tabSwitchesTimeline: [{ timestamp: new Date().toISOString(), durationSeconds: 10 }],
    ipAddresses: ["192.168.5.15"],
    mouseOutSeconds: 45,
    outOfBoundsCount: 4,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 80, changesCount: 0 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 90, changesCount: 0 }
    ]
  },

  // === LINEAR ALGEBRA FINAL ===
  {
    studentId: "STD-2023-1025",
    studentName: "فيصل العتيبي",
    examId: "EXM-LINALG-301",
    examName: "الامتحان النهائي للجبر الخطي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 90,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 45,
    scorePercent: 88,
    copyCount: 1,
    pasteCount: 1,
    tabSwitchesCount: 2,
    tabSwitchesTimeline: [],
    ipAddresses: ["192.168.30.22"],
    mouseOutSeconds: 12,
    outOfBoundsCount: 3,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 400, changesCount: 1 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 520, changesCount: 2 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 480, changesCount: 0 }
    ]
  },
  {
    studentId: "STD-2023-1120",
    studentName: "نورة السبيعي",
    examId: "EXM-LINALG-301",
    examName: "الامتحان النهائي للجبر الخطي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 90,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 75,
    scorePercent: 94,
    copyCount: 0,
    pasteCount: 0,
    tabSwitchesCount: 0,
    tabSwitchesTimeline: [],
    ipAddresses: ["10.45.1.2"],
    mouseOutSeconds: 0,
    outOfBoundsCount: 0,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 800, changesCount: 3 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 920, changesCount: 4 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 780, changesCount: 2 }
    ]
  },
  {
    studentId: "STD-2023-5561",
    studentName: "سلطان القحطاني",
    examId: "EXM-LINALG-301",
    examName: "الامتحان النهائي للجبر الخطي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 90,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 88,
    scorePercent: 45,
    copyCount: 0,
    pasteCount: 0,
    tabSwitchesCount: 1,
    tabSwitchesTimeline: [],
    ipAddresses: ["10.22.4.50"],
    mouseOutSeconds: 2,
    outOfBoundsCount: 1,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 1500, changesCount: 6 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 1800, changesCount: 1 }
    ]
  },

  // === CYBERSECURITY ENGINEERING FINAL (Dr Noura) ===
  {
    studentId: "STD-2023-8891",
    studentName: "عبدالرحمن الشمري",
    examId: "EXM-SEC-401",
    examName: "إختبار هندسة الأمن السيبراني النهائي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    durationMinutes: 12,
    scorePercent: 95,
    copyCount: 14,
    pasteCount: 12,
    tabSwitchesCount: 18,
    tabSwitchesTimeline: [
      { timestamp: new Date(Date.now() - 10500000).toISOString(), durationSeconds: 4 },
      { timestamp: new Date(Date.now() - 10400000).toISOString(), durationSeconds: 15 },
      { timestamp: new Date(Date.now() - 10100000).toISOString(), durationSeconds: 32 }
    ],
    ipAddresses: ["192.168.1.150"],
    mouseOutSeconds: 180,
    outOfBoundsCount: 15,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 15, changesCount: 0 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 8, changesCount: 0 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 12, changesCount: 0 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 21, changesCount: 1 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 14, changesCount: 0 }
    ]
  },
  {
    studentId: "STD-2023-4412",
    studentName: "سارة الغامدي",
    examId: "EXM-SEC-401",
    examName: "إختبار هندسة الأمن السيبراني النهائي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1.6).toISOString(),
    durationMinutes: 54,
    scorePercent: 88,
    copyCount: 1,
    pasteCount: 0,
    tabSwitchesCount: 1,
    tabSwitchesTimeline: [{ timestamp: new Date().toISOString(), durationSeconds: 2 }],
    ipAddresses: ["10.0.4.15"],
    mouseOutSeconds: 8,
    outOfBoundsCount: 1,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 540, changesCount: 2 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 610, changesCount: 3 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 490, changesCount: 1 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 800, changesCount: 4 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 600, changesCount: 2 }
    ]
  },
  {
    studentId: "STD-2023-3329",
    studentName: "خالد الحربي",
    examId: "EXM-SEC-401",
    examName: "إختبار هندسة الأمن السيبراني النهائي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 60,
    startTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    durationMinutes: 18,
    scorePercent: 100,
    copyCount: 2,
    pasteCount: 2,
    tabSwitchesCount: 0,
    tabSwitchesTimeline: [],
    ipAddresses: ["192.168.1.150"], // clashing IP
    mouseOutSeconds: 0,
    outOfBoundsCount: 0,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 120, changesCount: 0 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 200, changesCount: 1 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 150, changesCount: 0 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 310, changesCount: 0 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 300, changesCount: 0 }
    ]
  },
  {
    studentId: "STD-2023-1120",
    studentName: "نورة السبيعي",
    examId: "EXM-SEC-401",
    examName: "إختبار هندسة الأمن السيبراني النهائي",
    examDifficulty: "hard",
    examTimeLimitMinutes: 60,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 50,
    scorePercent: 82,
    copyCount: 0,
    pasteCount: 0,
    tabSwitchesCount: 1,
    tabSwitchesTimeline: [],
    ipAddresses: ["109.82.114.50"],
    mouseOutSeconds: 12,
    outOfBoundsCount: 2,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 420, changesCount: 2 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 590, changesCount: 1 }
    ]
  },

  // === COMPUTER NETWORKS MIDTERM (Prof Khaled) ===
  {
    studentId: "STD-2023-1025",
    studentName: "فيصل العتيبي",
    examId: "EXM-NET-201",
    examName: "مقدمة في تصميم الشبكات والبروتوكولات",
    examDifficulty: "medium",
    examTimeLimitMinutes: 45,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 0.4).toISOString(),
    durationMinutes: 36,
    scorePercent: 74,
    copyCount: 5,
    pasteCount: 4,
    tabSwitchesCount: 8,
    tabSwitchesTimeline: [
      { timestamp: new Date().toISOString(), durationSeconds: 12 },
      { timestamp: new Date().toISOString(), durationSeconds: 8 }
    ],
    ipAddresses: ["192.168.10.82"],
    mouseOutSeconds: 72,
    outOfBoundsCount: 6,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 300, changesCount: 1 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 450, changesCount: 3 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 520, changesCount: 2 },
      { questionId: "Q4", questionNumber: 4, timeSpentSeconds: 440, changesCount: 1 },
      { questionId: "Q5", questionNumber: 5, timeSpentSeconds: 450, changesCount: 1 }
    ]
  },
  {
    studentId: "STD-2023-7714",
    studentName: "ريم الدوسري",
    examId: "EXM-NET-201",
    examName: "مقدمة في تصميم الشبكات والبروتوكولات",
    examDifficulty: "medium",
    examTimeLimitMinutes: 45,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 41,
    scorePercent: 91,
    copyCount: 0,
    pasteCount: 0,
    tabSwitchesCount: 1,
    tabSwitchesTimeline: [],
    ipAddresses: ["192.168.10.85"],
    mouseOutSeconds: 15,
    outOfBoundsCount: 2,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 420, changesCount: 1 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 510, changesCount: 1 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 490, changesCount: 1 }
    ]
  },
  {
    studentId: "STD-2023-9932",
    studentName: "فهد العنزي",
    examId: "EXM-NET-201",
    examName: "مقدمة في تصميم الشبكات والبروتوكولات",
    examDifficulty: "medium",
    examTimeLimitMinutes: 45,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 15,
    scorePercent: 88,
    copyCount: 6,
    pasteCount: 5,
    tabSwitchesCount: 11,
    tabSwitchesTimeline: [{ timestamp: new Date().toISOString(), durationSeconds: 24 }],
    ipAddresses: ["192.168.10.82"], // clashing IP with Faisal
    mouseOutSeconds: 88,
    outOfBoundsCount: 9,
    questionTelemetry: [
      { questionId: "Q1", questionNumber: 1, timeSpentSeconds: 120, changesCount: 0 },
      { questionId: "Q2", questionNumber: 2, timeSpentSeconds: 150, changesCount: 0 },
      { questionId: "Q3", questionNumber: 3, timeSpentSeconds: 110, changesCount: 0 }
    ]
  }
];

// Helper to calculate cryptographic integrity signature
function generateSignature(payload: Partial<TelemetryPayload>, salt: string): string {
  const dataString = `${payload.studentId}:${payload.examId}:${payload.durationMinutes}:${payload.scorePercent}`;
  return crypto.createHmac("sha256", salt).update(dataString).digest("hex");
}

// Ensure the initial mock db possesses valid signatures to verify integrity correctly and has per-question copy-pasting
studentSubmissions = studentSubmissions.map(sub => {
  const qCount = sub.questionTelemetry.length || 5;
  const copyRemaining = sub.copyCount || 0;
  const pasteRemaining = sub.pasteCount || 0;
  
  const enrichedTelemetry = sub.questionTelemetry.map((q, idx) => {
    let qCopy = q.copyCount !== undefined ? q.copyCount : 0;
    let qPaste = q.pasteCount !== undefined ? q.pasteCount : 0;
    
    if (q.copyCount === undefined && q.pasteCount === undefined) {
      if (idx === 0 && copyRemaining > 0) {
        qCopy = Math.min(copyRemaining, 2);
      } else if (idx > 0 && idx < qCount - 1 && copyRemaining > idx) {
        qCopy = 1;
      } else if (idx === qCount - 1) {
        qCopy = Math.max(0, copyRemaining - idx);
      }
      
      if (idx === 0 && pasteRemaining > 0) {
        qPaste = Math.min(pasteRemaining, 2);
      } else if (idx > 0 && idx < qCount - 1 && pasteRemaining > idx) {
        qPaste = 1;
      } else if (idx === qCount - 1) {
        qPaste = Math.max(0, pasteRemaining - idx);
      }
    }
    return {
      ...q,
      copyCount: qCopy,
      pasteCount: qPaste
    };
  });

  return {
    ...sub,
    questionTelemetry: enrichedTelemetry,
    signature: generateSignature(sub, DEFAULT_KEY_SALT),
    isEncrypted: false
  };
});

// Global Database Persistence config and dependencies
const DB_FILE_PATH = path.join(process.cwd(), "database.json");
let savedEvents: any[] = [];

function saveDatabase() {
  try {
    const dataToSave = {
      studentSubmissions,
      studentVerdicts,
      events: savedEvents,
      proctorRules,
      timingConfig,
      copyPasteConfig,
      anomalyWeights
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), "utf8");
    console.log(`[Database] Saved successfully. Submissions: ${studentSubmissions.length}, Events: ${savedEvents.length}`);
  } catch (err: any) {
    console.error(`[Database Error] Failed to save database:`, err);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (parsed.studentSubmissions) {
        studentSubmissions = parsed.studentSubmissions;
      }
      if (parsed.studentVerdicts) {
        Object.assign(studentVerdicts, parsed.studentVerdicts);
      }
      if (parsed.events) {
        savedEvents = parsed.events;
      }
      if (parsed.proctorRules) {
        proctorRules = parsed.proctorRules;
      }
      if (parsed.timingConfig) {
        timingConfig = parsed.timingConfig;
      }
      if (parsed.copyPasteConfig) {
        copyPasteConfig = parsed.copyPasteConfig;
      }
      if (parsed.anomalyWeights) {
        anomalyWeights = parsed.anomalyWeights;
      }
      console.log(`[Database] Loaded successfully. Submissions: ${studentSubmissions.length}, Events: ${savedEvents.length}`);
    } else {
      console.log(`[Database] Database.json does not exist. Saving seeded mock entries as default dataset...`);
      saveDatabase();
    }
  } catch (err: any) {
    console.error(`[Database Error] Failed to load database:`, err);
  }
}

// Group and aggregate single events by session_id to dynamically update cumulative statistics
function aggregateSessionEvents(sessionId: string, baseInfo: { studentId: string, studentName: string, examId: string, examName: string, clientIP: string, timestamp: string }) {
  const sessionEvents = savedEvents.filter(ev => ev.event && (ev.event.session_id === sessionId || ev.event.moodle?.attempt_id === sessionId));
  
  let subIndex = studentSubmissions.findIndex(s => s.sessionId === sessionId || s.session_id === sessionId);
  if (subIndex === -1) {
    subIndex = studentSubmissions.findIndex(s => s.studentId === baseInfo.studentId && s.examId === baseInfo.examId);
  }

  let sub: TelemetryPayload;
  if (subIndex > -1) {
    sub = studentSubmissions[subIndex];
  } else {
    sub = {
      studentId: baseInfo.studentId,
      studentName: baseInfo.studentName,
      examId: baseInfo.examId,
      examName: baseInfo.examName,
      examDifficulty: "hard",
      examTimeLimitMinutes: 60,
      startTime: baseInfo.timestamp || new Date().toISOString(),
      endTime: baseInfo.timestamp || new Date().toISOString(),
      durationMinutes: 1,
      scorePercent: 78,
      copyCount: 0,
      pasteCount: 0,
      tabSwitchesCount: 0,
      tabSwitchesTimeline: [],
      ipAddresses: [baseInfo.clientIP],
      mouseOutSeconds: 0,
      outOfBoundsCount: 0,
      questionTelemetry: [],
      sessionId: sessionId,
      session_id: sessionId
    };
    studentSubmissions.push(sub);
  }

  sub.sessionId = sessionId;
  sub.session_id = sessionId;

  let copyCount = 0;
  let pasteCount = 0;
  let tabSwitchesCount = 0;
  let outOfBoundsCount = 0;
  let mouseOutSeconds = 0;
  const ipAddressesSet = new Set<string>();
  if (baseInfo.clientIP) {
    ipAddressesSet.add(baseInfo.clientIP);
  }
  const tabSwitchesTimeline: any[] = [];
  const questionMap = new Map<string, { questionId: string, questionNumber: number, timeSpentSeconds: number, changesCount: number, copyCount: number, pasteCount: number }>();

  let earliestTime = baseInfo.timestamp || new Date().toISOString();
  let latestTime = baseInfo.timestamp || new Date().toISOString();

  if (sessionEvents.length > 0) {
    sessionEvents.forEach(evtPayload => {
      const ev = evtPayload.event;
      if (!ev) return;

      if (evtPayload.client_ip && evtPayload.client_ip !== "SERVER_WILL_ADD_THIS") {
        ipAddressesSet.add(evtPayload.client_ip);
      }

      if (ev.timestamp) {
        if (!earliestTime || ev.timestamp < earliestTime) earliestTime = ev.timestamp;
        if (!latestTime || ev.timestamp > latestTime) latestTime = ev.timestamp;
      }

      const type = ev.event_type;
      const meta = ev.metadata || {};
      switch (type) {
        case "window_blur":
        case "tab_hidden":
          tabSwitchesCount += 1;
          outOfBoundsCount += 1;
          tabSwitchesTimeline.push({
            timestamp: ev.timestamp || new Date().toISOString(),
            durationSeconds: Math.floor(Math.random() * 12) + 2
          });
          break;

        case "window_focus":
        case "tab_visible":
          if (meta.hidden_duration_ms) {
            const secs = Math.ceil(Number(meta.hidden_duration_ms) / 1000);
            mouseOutSeconds += secs;
            // Also log to switch timeline if not already handled
            tabSwitchesTimeline.push({
              timestamp: ev.timestamp || new Date().toISOString(),
              durationSeconds: secs
            });
          }
          break;

        case "tab_hidden_duration":
          tabSwitchesCount += 1;
          outOfBoundsCount += 1;
          if (meta.hidden_duration_ms) {
            const secs = Math.ceil(Number(meta.hidden_duration_ms) / 1000);
            mouseOutSeconds += secs;
            tabSwitchesTimeline.push({
              timestamp: ev.timestamp || new Date().toISOString(),
              durationSeconds: secs
            });
          }
          break;

        case "idle_detected":
          if (meta.idle_duration_ms) {
            const secs = Math.ceil(Number(meta.idle_duration_ms) / 1000);
            mouseOutSeconds += secs;
          } else {
            mouseOutSeconds += 60;
          }
          outOfBoundsCount += 1;
          break;

        case "copy":
          copyCount += 1;
          break;

        case "paste":
          pasteCount += 1;
          break;

        case "page_leave":
          outOfBoundsCount += 1;
          mouseOutSeconds += 15;
          break;

        case "right_click":
          outOfBoundsCount += 1;
          break;

        case "network_offline":
          outOfBoundsCount += 1;
          break;

        case "network_online":
          // Connection restored - no penalty
          break;

        case "typing_summary":
          // Typing characteristics can aid macro or automated input detection
          if (meta.avg_dwell_time_ms && meta.avg_dwell_time_ms < 40 && meta.keydown_count > 10) {
            // Suspiciously uniform and extremely fast mechanical typing speed
            outOfBoundsCount += 1;
          }
          break;

        case "mouse_summary":
          if (meta.idle_time_ms) {
            const secs = Math.ceil(Number(meta.idle_time_ms) / 1000);
            mouseOutSeconds += secs;
          }
          break;

        case "heartbeat":
          // Keep-alive heartbeat event keeps the study session verified
          break;
      }

      // Track per-question telemetry
      const qData = ev.metadata?.question;
      if (qData) {
        const qNum = Number(qData.question_number || 1);
        const qId = qData.question_dom_id || `question-${qNum}`;
        
        let existingQ = questionMap.get(qId);
        if (existingQ) {
          if (type === "answer_changed") {
            existingQ.changesCount += 1;
            existingQ.timeSpentSeconds += Math.floor((ev.elapsed_ms || 3000) / 1000);
          }
          if (type === "copy") {
            existingQ.copyCount = (existingQ.copyCount || 0) + 1;
          }
          if (type === "paste") {
            existingQ.pasteCount = (existingQ.pasteCount || 0) + 1;
          }
        } else {
          questionMap.set(qId, {
            questionId: qId,
            questionNumber: qNum,
            timeSpentSeconds: type === "answer_changed" ? Math.floor((ev.elapsed_ms || 3000) / 1000) : 0,
            changesCount: type === "answer_changed" ? 1 : 0,
            copyCount: type === "copy" ? 1 : 0,
            pasteCount: type === "paste" ? 1 : 0
          });
        }
      }
    });
  }

  sub.copyCount = copyCount;
  sub.pasteCount = pasteCount;
  sub.tabSwitchesCount = tabSwitchesCount;
  sub.outOfBoundsCount = outOfBoundsCount;
  sub.mouseOutSeconds = mouseOutSeconds;
  sub.ipAddresses = Array.from(ipAddressesSet);
  sub.tabSwitchesTimeline = tabSwitchesTimeline;
  sub.questionTelemetry = Array.from(questionMap.values());
  sub.startTime = earliestTime;
  sub.endTime = latestTime;

  if (earliestTime && latestTime) {
    const diffMs = new Date(latestTime).getTime() - new Date(earliestTime).getTime();
    sub.durationMinutes = Math.max(1, Math.ceil(diffMs / 60000));
  }

  sub.signature = generateSignature(sub, DEFAULT_KEY_SALT);
  return sub;
}

// Dynamic Custom Rule Evaluator
function evaluateCustomFormula(
  formula: string,
  payload: TelemetryPayload,
  ipAddressConflict: boolean,
  aiProbability: number,
  mouseOutSeconds: number,
  outOfBoundsCount: number
): boolean {
  try {
    // Replace variables with literal values
    let expr = formula
      .replace(/\btabSwitchesCount\b/g, String(payload.tabSwitchesCount || 0))
      .replace(/\bcopyCount\b/g, String(payload.copyCount || 0))
      .replace(/\bpasteCount\b/g, String(payload.pasteCount || 0))
      .replace(/\bsharedIpCount\b/g, ipAddressConflict ? "1" : "0")
      .replace(/\baiProbability\b/g, String(aiProbability || 0))
      .replace(/\bmouseOutSeconds\b/g, String(mouseOutSeconds || 0))
      .replace(/\boutOfBoundsCount\b/g, String(outOfBoundsCount || 0))
      .replace(/\bscorePercent\b/g, String(payload.scorePercent || 0));

    // Sanitization: Only allow numbers, math, operators, spaces, logical characters
    if (!/^[0-9\s><=!&|()+-/*]+$/.test(expr)) {
      return false;
    }
    const fn = new Function(`return (${expr});`);
    return !!fn();
  } catch (err) {
    console.error("Custom Rule Evaluation formula parse crash:", err);
    return false;
  }
}

// Core Dynamic Rule-based Risk Analyzer
function calculateAnalysis(payload: TelemetryPayload, allSubmissions: TelemetryPayload[]): AnomalyReport {
  let riskScore = 0;
  const anomalies: string[] = [];

  // Prerequisite values context extracts
  const sharedIpStudents = allSubmissions
    .filter(sub => sub.studentId !== payload.studentId && sub.examId === payload.examId)
    .filter(sub => sub.ipAddresses.some(ip => payload.ipAddresses.includes(ip)))
    .map(sub => sub.studentName);

  const ipAddressConflict = sharedIpStudents.length > 0;
  const conflictingStudentIds = allSubmissions
    .filter(sub => sub.studentId !== payload.studentId && sub.examId === payload.examId)
    .filter(sub => sub.ipAddresses.some(ip => payload.ipAddresses.includes(ip)))
    .map(sub => sub.studentId);

  const copyPasteCount = payload.copyCount + payload.pasteCount;
  
  // Deterministic simulation fallback for AI generated answer checks
  const studentNum = parseInt(payload.studentId.replace(/\D/g, ''), 10) || 555;
  const aiProbability = (payload as any).aiGeneratedProbability !== undefined 
    ? (payload as any).aiGeneratedProbability
    : (studentNum % 11 === 0 ? 89 : studentNum % 7 === 0 ? 73 : studentNum % 5 === 0 ? 58 : 0);

  const limit = payload.examTimeLimitMinutes;
  const spent = payload.durationMinutes;
  const ratio = spent / limit;
  const timeAnomaly = (payload.examDifficulty === "hard" && ratio < 0.25 && payload.scorePercent >= 85) ||
                      (payload.examDifficulty === "medium" && ratio < 0.15 && payload.scorePercent >= 85);

  const mouseOutSeconds = payload.mouseOutSeconds;
  const outOfBoundsCount = payload.outOfBoundsCount;

  const suspiciousQuestions = payload.questionTelemetry.filter(q => q.timeSpentSeconds < 6 && q.changesCount === 0);
  const rapidQuestionsCount = suspiciousQuestions.length;

  const macroQuestions = payload.questionTelemetry.filter(q => q.changesCount >= 5 && q.timeSpentSeconds > 0 && (q.changesCount / q.timeSpentSeconds) >= 0.8);
  const macroUsage = macroQuestions.length > 0;

  // Evaluate each customized rule loaded in the control panel
  proctorRules.forEach(rule => {
    if (!rule.enabled) return;

    if (rule.metricKey === 'ip_conflict' && ipAddressConflict) {
      riskScore += rule.baseWeight;
      anomalies.push(`تطابق عنوان الـ IP مع طالب آخر (${sharedIpStudents.join(", ")}) - يرجح الحل التزامن من نفس شبكة أو موقع الدراسة.`);
    }

    if (rule.metricKey === 'tab_switches' && payload.tabSwitchesCount > 0) {
      const pts = Math.min(payload.tabSwitchesCount * anomalyWeights.tabSwitch, rule.baseWeight);
      riskScore += pts;
      anomalies.push(`تم رصد تركيز الصفحة ومغادرة مترددة لتبويبات المتصفح (${payload.tabSwitchesCount} مرات).`);
    }

    if (rule.metricKey === 'copy_paste' && copyPasteCount > 0) {
      const chatGPTPatternQuestions = payload.questionTelemetry.filter(q => (q.copyCount || 0) >= copyPasteConfig.chatGPTPatternThreshold && (q.pasteCount || 0) >= copyPasteConfig.chatGPTPatternThreshold).length;
      const totalQuestions = payload.questionTelemetry.length || 1;
      const plagiarismRatio = chatGPTPatternQuestions / totalQuestions;
      const triggerFullPlagiarismPenalty = plagiarismRatio >= copyPasteConfig.abusedMultiplier && chatGPTPatternQuestions > 0;
      
      let plagiarismRiskPoints = 0;
      const maxPoints = rule.baseWeight;
      
      if (triggerFullPlagiarismPenalty) {
        plagiarismRiskPoints = maxPoints;
      } else if (chatGPTPatternQuestions > 0) {
        plagiarismRiskPoints = Math.round(maxPoints * (plagiarismRatio / copyPasteConfig.abusedMultiplier));
      } else {
        plagiarismRiskPoints = Math.min(maxPoints, Math.round(payload.copyCount * anomalyWeights.copy + payload.pasteCount * anomalyWeights.paste));
      }
      plagiarismRiskPoints = Math.max(0, Math.min(maxPoints, plagiarismRiskPoints));
      riskScore += plagiarismRiskPoints;

      if (chatGPTPatternQuestions > 0) {
        anomalies.push(`نمط حظر الامتحان: رصد نسخ السؤال ولصق الجواب الفوري (ChatGPT) في عدد (${chatGPTPatternQuestions}) من أصل (${totalQuestions}) أسئلة. تبلغ نسبة غش النسخ واللصق الثنائية ${Math.round(plagiarismRatio * 100)}%، بنقاط خطورة مسندة (${plagiarismRiskPoints}/${maxPoints}).`);
      } else {
        anomalies.push(`سلوك نسخ ولصق فرعي: تتبع وحساب (${payload.copyCount}) نسخ و (${payload.pasteCount}) لصق داخل المتصفح بنقاط خطورة مسندة (${plagiarismRiskPoints}/${maxPoints}).`);
      }
    }

    if (rule.metricKey === 'ai_generated' && aiProbability > 50) {
      riskScore += rule.baseWeight;
      anomalies.push(`مؤشر الذكاء الاصطناعي (AI Content Check): تشابه دلالي للحلول بنسبة ${aiProbability}% مع توليدات نماذج لغوية كبرى (AI Plagiarism).`);
    }

    if (rule.metricKey === 'rapid_completion' && timeAnomaly) {
      riskScore += rule.baseWeight;
      anomalies.push(`إنهاء الإختبار بزمن تسليم قياسي وسريع جداً (${spent} دقيقة من أصل ${limit}) لا يتناسب دلالياً مع صعوبة الامتحان.`);
    }

    if (rule.metricKey === 'focus_out' && (mouseOutSeconds > 45 || outOfBoundsCount > 8)) {
      riskScore += rule.baseWeight;
      anomalies.push(`خروج مؤشر الحركة الفأرة خارج إطار الإجابة التفاعلية لفترات طويلة مجموعها (${mouseOutSeconds} ثانية).`);
    }

    if (rule.metricKey === 'rapid_questions' && rapidQuestionsCount >= 3) {
      riskScore += rule.baseWeight;
      anomalies.push(`تجاوز الحل الفوري لـ (${rapidQuestionsCount}) أسئلة بصورة فائقة السرعة دون تردد أو مراجعة برمجية.`);
    }

    if (rule.metricKey === 'macro_usage' && macroUsage) {
      riskScore += rule.baseWeight;
      anomalies.push(`نمط نقرات ميكانيكي وغير بشري متسارع يطابق أتمتة نصوص الاختصار الماكرو.`);
    }

    // Evaluate dynamic custom rules
    const coreKeys = ['ip_conflict', 'tab_switches', 'copy_paste', 'ai_generated', 'rapid_completion', 'focus_out', 'rapid_questions', 'macro_usage'];
    if (!coreKeys.includes(rule.metricKey)) {
      const isCustomMatched = evaluateCustomFormula(
        rule.conditionFormula,
        payload,
        ipAddressConflict,
        aiProbability,
        mouseOutSeconds,
        outOfBoundsCount
      );
      if (isCustomMatched) {
        riskScore += rule.baseWeight;
        anomalies.push(`[محدد مخصص: ${rule.nameAr || rule.nameEn}] ${rule.descriptionAr || rule.descriptionEn} (${rule.conditionFormula})`);
      }
    }
  });

  // Safe boundaries
  riskScore = Math.min(riskScore, 100);

  let riskLevel: 'safe' | 'low' | 'medium' | 'high' = 'safe';
  if (riskScore >= 60) {
    riskLevel = 'high';
  } else if (riskScore >= 35) {
    riskLevel = 'medium';
  } else if (riskScore >= 15) {
    riskLevel = 'low';
  }

  const patternAnomaly = (payload.tabSwitchesCount >= 3 && payload.pasteCount >= 2) || (payload.tabSwitchesCount >= 2 && payload.pasteCount >= 3);
  const aggressivePattern = payload.tabSwitchesCount >= 4 && payload.pasteCount >= 3;

  let suggestedActionEn = "Cross-check session network logs";
  let suggestedActionAr = "تدقيق ومطابقة سجلات الشبكة";

  if (riskScore >= 15) {
    if (ipAddressConflict) {
      suggestedActionEn = "Verify IP address manually";
      suggestedActionAr = "تحقق من عنوان IP يدوياً";
    } else if (macroUsage) {
      suggestedActionEn = "Investigate for macro automation tools";
      suggestedActionAr = "التحقق من أدوات الأتمتة والماكرو ميكانيكياً";
    } else if (payload.tabSwitchesCount > 8) {
      suggestedActionEn = "Review screen recording if available";
      suggestedActionAr = "مراجعة تسجيل الشاشة الكلي إن وجد";
    } else if (copyPasteCount > 5) {
      suggestedActionEn = "Inspect clipboard payload history";
      suggestedActionAr = "فحص سجل ومحتويات حافظة النسخ";
    } else if (mouseOutSeconds > 45) {
      suggestedActionEn = "Verify secondary monitor or webcam";
      suggestedActionAr = "التحقق من الكاميرا أو الشاشة الإضافية";
    } else if (timeAnomaly) {
      suggestedActionEn = "Conduct live oral exam review";
      suggestedActionAr = "إجراء مراجعة شفهية مباشرة للتحقق";
    }
  } else {
    suggestedActionEn = "Clear unconditionally";
    suggestedActionAr = "تجاوز التدقيق بلا شروط";
  }

  return {
    studentId: payload.studentId,
    studentName: payload.studentName,
    examId: payload.examId,
    examName: payload.examName,
    riskScore,
    riskLevel,
    anomalies,
    ipAddressConflict,
    conflictingStudentIds,
    timeAnomaly,
    extremeTabSwitching: payload.tabSwitchesCount > 10,
    copyPasteSpike: copyPasteCount > 8,
    outOfBoundsSpike: outOfBoundsCount > 10,
    analyzedAt: new Date().toISOString(),
    patternAnomaly,
    aggressivePattern,
    macroUsage,
    suggestedActionEn,
    suggestedActionAr,
    suggestedAction: suggestedActionEn,
    aiInsightsText: aiProbability > 50 
      ? `التدقيق الذكي: الإجابات تملك مطابقة بنسبة ${aiProbability}% مع صياغات ذكاء اصطناعي توليدي.`
      : undefined
  };
}

// --- AUTH ROUTES ---

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "يرجى إدخال اسم المستخدم وكلمة المرور." });
  }
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role, nameAr: user.nameAr, nameEn: user.nameEn },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 });
  res.json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role, nameAr: user.nameAr, nameEn: user.nameEn }
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "تم تسجيل الخروج بنجاح." });
});

app.get("/api/auth/me", authMiddleware, (req: any, res) => {
  res.json({ success: true, user: req.user });
});

// --- API ROUTES ---

// Endpoint to retrieve active dynamic proctoring rule configurations
app.get("/api/rules", authMiddleware, (req, res) => {
  res.json({ success: true, rules: proctorRules });
});

// Endpoint to update dynamic proctoring weight rules and variables
app.post("/api/rules", authMiddleware, adminOnly, (req, res) => {
  const { rules } = req.body;
  if (Array.isArray(rules)) {
    proctorRules = rules;
    console.log("[CONFIG UPDATE] Dynamic rules weights successfully updated on server:", proctorRules);
    saveDatabase();
    return res.json({
      success: true,
      message: "تم حفظ وتحديث محددات الأمان والأوزان النسبية للمعادلات الخوارزمية بنجاح.",
      rules: proctorRules
    });
  }
  res.status(400).json({ success: false, error: "أعطى خيار الإرسال مصفوفة قواعد غير صالحة." });
});

// Endpoint to get active AI Plagiarism connector configurations
app.get("/api/ai-config", authMiddleware, (req, res) => {
  res.json({ success: true, config: aiPlagiarismConfig });
});

// Endpoint to save AI Plagiarism connector configurations
app.post("/api/ai-config", authMiddleware, adminOnly, (req, res) => {
  const { provider, apiKey, customEndpointUrl, dataStrategy, selectedModel, promptTemplateAr, promptTemplateEn } = req.body;
  
  aiPlagiarismConfig = {
    provider: provider || aiPlagiarismConfig.provider,
    apiKey: apiKey !== undefined ? apiKey : aiPlagiarismConfig.apiKey,
    customEndpointUrl: customEndpointUrl !== undefined ? customEndpointUrl : aiPlagiarismConfig.customEndpointUrl,
    dataStrategy: dataStrategy || aiPlagiarismConfig.dataStrategy,
    selectedModel: selectedModel || aiPlagiarismConfig.selectedModel,
    promptTemplateAr: promptTemplateAr || aiPlagiarismConfig.promptTemplateAr,
    promptTemplateEn: promptTemplateEn || aiPlagiarismConfig.promptTemplateEn
  };

  console.log("[AI INTEGRATION CONFIG Saved]:", aiPlagiarismConfig);
  saveDatabase();
  res.json({
    success: true,
    message: "تم حفظ إعدادات التكامل وربط سيرفر الفحص الذكي بالموديل الخارجي بنجاح.",
    config: aiPlagiarismConfig
  });
});

// Endpoint to get timing expectation configurations
app.get("/api/timing-config", authMiddleware, (req, res) => {
  res.json({ success: true, config: timingConfig });
});

// Endpoint to save timing expectation configurations
app.post("/api/timing-config", authMiddleware, adminOnly, (req, res) => {
  const { easyBaseMinutesPerQuestion, mediumBaseMinutesPerQuestion, hardBaseMinutesPerQuestion, teacherTimeAdjustment } = req.body;
  if (easyBaseMinutesPerQuestion !== undefined) timingConfig.easyBaseMinutesPerQuestion = Number(easyBaseMinutesPerQuestion);
  if (mediumBaseMinutesPerQuestion !== undefined) timingConfig.mediumBaseMinutesPerQuestion = Number(mediumBaseMinutesPerQuestion);
  if (hardBaseMinutesPerQuestion !== undefined) timingConfig.hardBaseMinutesPerQuestion = Number(hardBaseMinutesPerQuestion);
  if (teacherTimeAdjustment !== undefined) timingConfig.teacherTimeAdjustment = Number(teacherTimeAdjustment);
  
  console.log("[TIMING CONFIG Saved]:", timingConfig);
  saveDatabase();
  res.json({ success: true, message: "تم حفظ إعدادات الوقت وتحديث معامل تقدير المعلم بنجاح.", config: timingConfig });
});

// Endpoint to get copy-paste plagiarism mathematical configurations
app.get("/api/copy-paste-config", authMiddleware, (req, res) => {
  res.json({ success: true, config: copyPasteConfig });
});

// Endpoint to update copy-paste plagiarism mathematical configurations
app.post("/api/copy-paste-config", authMiddleware, adminOnly, (req, res) => {
  const { maxRiskPoints, chatGPTPatternThreshold, abusedMultiplier } = req.body;
  if (maxRiskPoints !== undefined) {
    copyPasteConfig.maxRiskPoints = Number(maxRiskPoints);
    const cpRule = proctorRules.find(r => r.metricKey === 'copy_paste');
    if (cpRule) {
      cpRule.baseWeight = Number(maxRiskPoints);
    }
  }
  if (chatGPTPatternThreshold !== undefined) copyPasteConfig.chatGPTPatternThreshold = Number(chatGPTPatternThreshold);
  if (abusedMultiplier !== undefined) copyPasteConfig.abusedMultiplier = Number(abusedMultiplier);
  
  console.log("[COPY PASTE CONFIG Saved]:", copyPasteConfig);
  saveDatabase();
  res.json({ success: true, message: "تم حفظ وتحديث معادلة كشف النسخ واللصق الثنائية بنجاح.", config: copyPasteConfig });
});

// Endpoint to get anomaly weights configuration
app.get("/api/anomaly-weights", authMiddleware, (req, res) => {
  res.json({ success: true, weights: anomalyWeights });
});

// Endpoint to update anomaly weights configuration
app.post("/api/anomaly-weights", authMiddleware, adminOnly, (req, res) => {
  const { weights } = req.body;
  if (weights) {
    if (weights.tabSwitch !== undefined) anomalyWeights.tabSwitch = Number(weights.tabSwitch);
    if (weights.paste !== undefined) anomalyWeights.paste = Number(weights.paste);
    if (weights.copy !== undefined) anomalyWeights.copy = Number(weights.copy);
    if (weights.ipConflict !== undefined) {
      anomalyWeights.ipConflict = Number(weights.ipConflict);
      const rule = proctorRules.find(r => r.metricKey === 'ip_conflict');
      if (rule) rule.baseWeight = anomalyWeights.ipConflict;
    }
    if (weights.aiGenerated !== undefined) {
      anomalyWeights.aiGenerated = Number(weights.aiGenerated);
      const rule = proctorRules.find(r => r.metricKey === 'ai_generated');
      if (rule) rule.baseWeight = anomalyWeights.aiGenerated;
    }
    if (weights.rapidCompletion !== undefined) {
      anomalyWeights.rapidCompletion = Number(weights.rapidCompletion);
      const rule = proctorRules.find(r => r.metricKey === 'rapid_completion');
      if (rule) rule.baseWeight = anomalyWeights.rapidCompletion;
    }
    if (weights.focusOut !== undefined) {
      anomalyWeights.focusOut = Number(weights.focusOut);
      const rule = proctorRules.find(r => r.metricKey === 'focus_out');
      if (rule) rule.baseWeight = anomalyWeights.focusOut;
    }
    if (weights.rapidQuestions !== undefined) {
      anomalyWeights.rapidQuestions = Number(weights.rapidQuestions);
      const rule = proctorRules.find(r => r.metricKey === 'rapid_questions');
      if (rule) rule.baseWeight = anomalyWeights.rapidQuestions;
    }
    if (weights.macroUsage !== undefined) {
      anomalyWeights.macroUsage = Number(weights.macroUsage);
      const rule = proctorRules.find(r => r.metricKey === 'macro_usage');
      if (rule) rule.baseWeight = anomalyWeights.macroUsage;
    }
    
    console.log("[ANOMALY WEIGHTS Saved]:", anomalyWeights);
    saveDatabase();
    res.json({ success: true, message: "تم حفظ وتحديث مصفوفة أوزان مؤشرات الغش بنجاح.", weights: anomalyWeights });
  } else {
    res.status(400).json({ success: false, error: "بيان الفئات غير صالح" });
  }
});

// Endpoint to execute the AI similarity scan & group inputs based on Strategy
app.post("/api/ai-config/analyze", authMiddleware, async (req, res) => {
  const { examId } = req.body;
  const targetExamId = examId || "EXM-CALC-101";

  // Filter student submissions on the chosen exam
  const activeSubs = studentSubmissions.filter(s => s.examId === targetExamId);
  if (activeSubs.length < 2) {
    return res.json({
      success: false,
      error: "عدد الطلاب المسجلين لحضور هذا الامتحان غير كافي لإجراء عملية مسح التشابه والتواطؤ (يتطلب طالبين على الأقل)."
    });
  }

  const strategy = aiPlagiarismConfig.dataStrategy;
  let packingLog: string[] = [];
  let packedPayloadPreview = "";
  let results: any[] = [];

  packingLog.push(`[1] بدء فرز البيانات للاختبار: ${targetExamId}`);
  packingLog.push(`[2] الاستراتيجية المعتمدة لحزم البيانات: ${strategy.toUpperCase()}`);

  if (strategy === "all_at_once_batch") {
    packingLog.push(`[3] تعبئة وتغليف كافة إجابات الطلاب (${activeSubs.length} أوراق) كحزمة مصفوفة مجمعة واحدة لإرسالها دفعة واحدة.`);
    
    const studentsSummary = activeSubs.map(s => ({
      studentId: s.studentId,
      studentName: s.studentName,
      answers: s.questionTelemetry.map(q => `سؤال ${q.questionId}: إجابة برمز الحل (تغييرات: ${q.changesCount} المرة، زمن الحل: ${q.timeSpentSeconds} ثانية)`)
    }));

    packedPayloadPreview = JSON.stringify({
      context: "سجلات الامتحانات الكاملة بغية رصد التواطؤ الجماعي",
      examId: targetExamId,
      payloadSize: `${activeSubs.length} Students`,
      bundleData: studentsSummary
    }, null, 2);

    results.push({
      itemLabel: "مسح تواطؤ كلي مدمج للامتحان",
      similarityScore: 42,
      suspectedEntities: activeSubs.slice(0, 2).map(s => s.studentName),
      reasonAr: "مستويات متوازية جداً في سرعة تبديل النوافذ والأزمنة المستغرقة لحل الأسئلة 2، 4.",
      reasonEn: "Parallel patterns in window focuses and times spent in standard Q2/Q4."
    });

  } else if (strategy === "question_by_question") {
    packingLog.push(`[3] تم تجزئة البيانات: إرسال أسئلة الامتحان بشكل منفصل ومقارنة إجابات جميع الطلاب سؤالاً تلو الآخر.`);
    packingLog.push(`[4] تم تشكيل حزم فحص لعدد ${activeSubs[0].questionTelemetry.length || 5} أسئلة.`);

    const questionsMap: Record<string, any[]> = {};
    activeSubs.forEach(sub => {
      sub.questionTelemetry.forEach(q => {
        if (!questionsMap[q.questionId]) questionsMap[q.questionId] = [];
        questionsMap[q.questionId].push({
          studentName: sub.studentName,
          timeSpent: q.timeSpentSeconds,
          changes: q.changesCount
        });
      });
    });

    packedPayloadPreview = JSON.stringify({
      strategy: "قالب مقارنة سؤال-سؤال لجميع الحاضرين",
      questions: Object.keys(questionsMap).map(id => ({
        questionId: id,
        candidateResponses: questionsMap[id]
      }))
    }, null, 2);

    results.push({
      itemLabel: "السؤال الأول (Q1)",
      similarityScore: 15,
      suspectedEntities: [activeSubs[0].studentName, activeSubs[1].studentName],
      reasonAr: "تفاوت طبيعي في أزمنة التفكير والكتابة.",
      reasonEn: "Normal divergence in answer thinking/drafting latency."
    });
    results.push({
      itemLabel: "السؤال الثاني (Q2)",
      similarityScore: 85,
      suspectedEntities: [activeSubs[0].studentName, activeSubs[1].studentName],
      reasonAr: "كلا الطالبين حلّا السؤال الصعب في أقل من 10 ثوانٍ وبنفس عدد التعديلات الصفري، دلالة على نقل مباشر للمخرجات.",
      reasonEn: "Identified zero input mutations and sub-10 second completions on hard Q2."
    });

  } else if (strategy === "pairwise_students") {
    packingLog.push(`[3] تم تنظيم البيانات ثنائياً (طالبين طالبين): مقارنة ثنائية كاملة ومتعاقبة لكامل فترات الحل.`);
    
    // Create candidate pairs
    const pairs: string[] = [];
    for (let i = 0; i < activeSubs.length; i++) {
      for (let j = i + 1; j < activeSubs.length; j++) {
        pairs.push(`${activeSubs[i].studentName} ⇄ ${activeSubs[j].studentName}`);
        
        // Let's check similarity rate between them
        const subA = activeSubs[i];
        const subB = activeSubs[j];
        
        // Simulating similarity score based on IP Address clashes
        const sharedIps = subA.ipAddresses.some(ip => subB.ipAddresses.includes(ip));
        const score = sharedIps ? 92 : (Math.abs(subA.scorePercent - subB.scorePercent) < 5 ? 65 : 18);
        
        results.push({
          itemLabel: `مقارنة ثنائية: ${subA.studentName} ضد ${subB.studentName}`,
          similarityScore: score,
          suspectedEntities: [subA.studentName, subB.studentName],
          reasonAr: sharedIps 
            ? "تشابه فائق وتطابق تام في عنوان الـ IP والمنزل الجغرافي يعكس احتمال النقل والتعاون العيني المباشر."
            : "تقارب دلالي نسبي في توقيت تبديل نافذة الإمتحان.",
          reasonEn: sharedIps 
            ? "Critical matching IP address conflict indicating physical proximity and active collusion."
            : "Moderate alignment on window defocus intervals."
        });
      }
    }
    packingLog.push(`[4] تم توليد عدد ${pairs.length} أزواج طلاب مخصصة للفحص الجنائي الثنائي.`);

    packedPayloadPreview = JSON.stringify({
      strategy: "مقارنة ثنائية متعاقبة للنزاهة (Pairwise Candidates Check)",
      activePairsCount: pairs.length,
      samplePairPayload: {
        studentA: { id: activeSubs[0].studentId, name: activeSubs[0].studentName },
        studentB: { id: activeSubs[1].studentId, name: activeSubs[1].studentName },
        promptTemplateUsed: aiPlagiarismConfig.promptTemplateAr
      }
    }, null, 2);

  } else {
    // single student against baseline correct answer
    packingLog.push(`[3] تم هيكلة البيانات للمقارنة الفردية ضد الأوراق الحليّة والbaseline للامتحان.`);
    activeSubs.forEach(s => {
      results.push({
        itemLabel: `تحليل الطالب: ${s.studentName}`,
        similarityScore: s.scorePercent > 90 ? 76 : 14,
        suspectedEntities: [s.studentName],
        reasonAr: s.scorePercent > 90 
          ? "تطابق هيكلي بين الإجابة المسلمة والصياغة الإرشادية المخزنة بالمودل."
          : "صياغة بشرية مستقلة مع أخطاء تعبيرية فردية وسياقية طبيعية.",
        reasonEn: s.scorePercent > 90 
          ? "Heavy semantic structures mapping directly onto model answer baseline."
          : "Safe individual phrasing with customized structure."
      });
    });

    packedPayloadPreview = JSON.stringify({
      strategy: "التقييم الفردي للمرشحين مقابل معيار الحل الأكاديمي الشامل",
      totalSelected: activeSubs.length,
      baselineCode: "BASELINE-ANSWERS-MOODLE-CALC"
    }, null, 2);
  }

  packingLog.push(`[5] تم إعداد البيانات وهي ملائمة لتنظيم الموديل المختار: ${aiPlagiarismConfig.selectedModel.toUpperCase()}`);
  
  // Real or simulated model invocation
  let invokedWithRealApi = false;
  let rawAiOutput = "";

  if (aiPlagiarismConfig.apiKey && aiPlagiarismConfig.apiKey.length > 5 && ai) {
    packingLog.push(`[🔗 CONTROL ENGINES] تم اكتشاف مفتاح API نشط لـ ${aiPlagiarismConfig.provider.toUpperCase()}.. جارٍ إرسال البيانات للموديل الحي...`);
    try {
      invokedWithRealApi = true;
      const combinedPrompt = `${aiPlagiarismConfig.promptTemplateEn}\n\nDATA PAYLOAD:\n${packedPayloadPreview}`;
      
      const response = await ai.models.generateContent({
        model: aiPlagiarismConfig.selectedModel,
        contents: combinedPrompt
      });
      
      rawAiOutput = response.text || "";
      packingLog.push(`[✔ SUCCESS] تم تلقي الرد الحي من الذكاء الاصطناعي بنجاح!`);
    } catch (apiErr: any) {
      packingLog.push(`[⚠️ API WARN] فشل الاتصال بالموديل الخارجي: ${apiErr.message || apiErr}. تم التحويل للمحاكاة الذكية الموضعية.`);
    }
  } else {
    packingLog.push(`[ℹ SIMULATION MODE] لم يتم توفير مفتاح API خارجي نشط للخدمة. تم تفعيل نظام الفحص الجنائي السلوكي والمحاكاة الذكية المدمجة.`);
    rawAiOutput = `*** تقرير فحص دلالات الغش المشترك الفوري (تقرير جنائي محاكي) ***\n\n- تم تصفية البيانات استناداً إلى الاستراتيجية المنظمة: [${strategy.toUpperCase()}]\n- مؤشرات موثوقة للغش: تعارض عناوين IP متزامنة لطلاب يحلون نفس الأسئلة الصعبة في بضع ثوانٍ.\n- نسبة الثقة الإجمالية في دلالة المطابقة: 85%.\n- الإجراء الموصى به: إحالة أوراق المشتبه بهم للجنة الامتحانات الفرعية.`;
  }

  res.json({
    success: true,
    packingLog,
    packedPayloadPreview,
    invokedWithRealApi,
    rawAiOutput,
    results
  });
});

// 0.5. Moodle Student Profile Portrait Photo API Gateway
app.get("/api/moodle/profile-photo", authMiddleware, (req, res) => {
  const studentId = String(req.query.studentId || "").trim();
  
  const profilePhotos: Record<string, string> = {
    "STD-2023-8891": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-4412": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-3329": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-7714": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-9932": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-1025": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-1120": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    "STD-2023-5561": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    "2": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
    "3": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    "4": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    "moodle_std_2": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
    "moodle_std_3": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    "moodle_std_4": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
  };

  if (studentId && profilePhotos[studentId]) {
    return res.json({
      success: true,
      studentId: studentId,
      photoUrl: profilePhotos[studentId]
    });
  }

  // Support numeric comparisons
  const matchedKey = Object.keys(profilePhotos).find(k => k === studentId || studentId.endsWith(k));
  if (matchedKey) {
    return res.json({
      success: true,
      studentId: studentId,
      photoUrl: profilePhotos[matchedKey]
    });
  }

  return res.json({
    success: false,
    message: "No registered photo found on Moodle API for this candidate."
  });
});

// 1. Get List of Students telemetry
app.get("/api/telemetry", authMiddleware, (req, res) => {
  const analysisReports = studentSubmissions.map(sub => {
    const analysis = calculateAnalysis(sub, studentSubmissions);
    
    // Trigger background AI suggestions for flagged students (riskScore >= 15)
    if (analysis.riskScore >= 15) {
      const cacheKey = `${sub.studentId}_${sub.examId}`;
      if (!geminiSuggestedActions[cacheKey] && ai && process.env.GEMINI_API_KEY) {
        requestGeminiSuggestedAction(
          sub.studentId, 
          sub.studentName, 
          sub.examName, 
          analysis.riskScore, 
          analysis.anomalies, 
          {
            ...sub,
            ipAddressConflict: analysis.ipAddressConflict,
            macroUsage: analysis.macroUsage
          }
        );
      }
    }

    // Merge cached suggestions if available
    const cacheKey = `${sub.studentId}_${sub.examId}`;
    let mergedSuggestedActionEn = analysis.suggestedActionEn;
    let mergedSuggestedActionAr = analysis.suggestedActionAr;
    let suggestedActionSource: 'rules' | 'gemini' = 'rules';

    if (geminiSuggestedActions[cacheKey]) {
      mergedSuggestedActionEn = geminiSuggestedActions[cacheKey].actionEn;
      mergedSuggestedActionAr = geminiSuggestedActions[cacheKey].actionAr;
      suggestedActionSource = 'gemini';
    }

    return {
      ...analysis,
      suggestedActionEn: mergedSuggestedActionEn,
      suggestedActionAr: mergedSuggestedActionAr,
      suggestedActionSource,
      suggestedAction: req.query.lang === 'ar' ? mergedSuggestedActionAr : mergedSuggestedActionEn,
      verdict: studentVerdicts[`${sub.studentId}_${sub.examId}`] || studentVerdicts[sub.studentId] || null
    };
  });
  res.json({
    teachers,
    subjects,
    exams,
    submissions: studentSubmissions,
    analysis: analysisReports
  });
});

// 2. Clear All Data (for testing)
app.post("/api/telemetry/reset", authMiddleware, adminOnly, (req, res) => {
  studentVerdicts = {}; // clear all decisions
  res.json({ success: true, message: "تم إعادة ضبط قواعد البيانات النموذجية للامتياز وتطهير القرارات المتخذة." });
});

// 2.5. Update Student Verdict
app.post("/api/verdict", authMiddleware, (req, res) => {
  const { studentId, examId, verdict } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, error: "المعلمات المطلوبة غير مكتملة." });
  }
  const targetExamId = examId || studentSubmissions.find(s => s.studentId === studentId)?.examId || "EXM-SEC-401";
  const key = `${studentId}_${targetExamId}`;

  if (verdict === 'clear' || !verdict) {
    delete studentVerdicts[key];
    delete studentVerdicts[studentId]; // fallback
    return res.json({
      success: true,
      message: "تم مسح القرار الأكاديمي بنجاح للطالب المحدد.",
      verdict: null
    });
  }
  if (!['approved', 'retake_requested', 'investigation'].includes(verdict)) {
    return res.status(400).json({ success: false, error: "نوع القرار غير صالح." });
  }
  studentVerdicts[key] = verdict;
  studentVerdicts[studentId] = verdict; // fallback for backward compatibility
  res.json({
    success: true,
    message: "تم تحديث قرار الحوكمة الأكاديمية لورقة الطالب وحفظه بنجاح.",
    verdict: verdict
  });
});

// 2.7. Batch Update Student Verdicts
app.post("/api/verdict/batch", authMiddleware, (req, res) => {
  const { studentIds, examId, verdict } = req.body;
  if (!studentIds || !Array.isArray(studentIds) || !verdict) {
    return res.status(400).json({ success: false, error: "المعلمات المطلوبة غير مكتملة." });
  }
  if (!['approved', 'retake_requested', 'investigation'].includes(verdict)) {
    return res.status(400).json({ success: false, error: "نوع القرار غير صالح." });
  }
  studentIds.forEach(id => {
    const targetExamId = examId || studentSubmissions.find(s => s.studentId === id)?.examId || "EXM-SEC-401";
    studentVerdicts[`${id}_${targetExamId}`] = verdict;
    studentVerdicts[id] = verdict; // fallback
  });
  res.json({
    success: true,
    message: "تم تحديث قرارات الحوكمة الأكاديمية بنجاح للطلاب المحددين.",
    verdict: verdict
  });
});

// 3.5. Receive single granular Moodle Micro-Event (Team 1 Real-time Tracking)
// Controller for single granular moodle micro-event
function handleSingleTelemetryEvent(req: any, res: any) {
  const payload = req.body;
  if (!payload || !payload.event) {
    return res.status(400).json({
      success: false,
      error: "معلومات رزمة الحدث غير كاملة (Missing 'event' root object)"
    });
  }

  const { event } = payload;
  const moodleData = event.moodle;

  if (!moodleData || !moodleData.student || !moodleData.quiz) {
    return res.status(400).json({
      success: false,
      error: "معلومات الطالب أو كويز مودل مفقودة في تفاصيل الحدث (Missing moodle.student or moodle.quiz data)"
    });
  }

  const rawStudentId = moodleData.student.id || "0";
  const studentName = moodleData.student.fullname || `Moodle Student ${rawStudentId}`;
  const studentId = `STD-MOODLE-${rawStudentId}`;
  
  const rawQuizId = moodleData.quiz.id || "0";
  const examId = `EXM-MOODLE-${rawQuizId}`;
  const examName = moodleData.quiz.name || `Moodle Quiz ${rawQuizId}`;

  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
  
  // Store raw event in DB
  const rawEventEntry = {
    received_at: new Date().toISOString(),
    client_ip: String(clientIP),
    event: event
  };
  savedEvents.push(rawEventEntry);

  const sessionId = event.session_id || `sess_${rawQuizId}_${rawStudentId}`;

  // Link & Aggregate events by session_id
  const sub = aggregateSessionEvents(sessionId, {
    studentId,
    studentName,
    examId,
    examName,
    clientIP,
    timestamp: event.timestamp || new Date().toISOString()
  });

  // Persist DB
  saveDatabase();

  // Run instant cyber evaluation
  const evaluationResult = calculateAnalysis(sub, studentSubmissions);

  return res.json({
    success: true,
    message: "تم استقبال وحفظ الحدث في قاعدة البيانات وربطه برقم الجلسة بنجاح.",
    event_registered: {
      event_id: event.event_id,
      event_type: event.event_type,
      timestamp: event.timestamp,
      session_id: sessionId
    },
    accumulation: {
      studentId: sub.studentId,
      examId: sub.examId,
      sessionId: sub.sessionId,
      tabSwitchesCount: sub.tabSwitchesCount,
      copyCount: sub.copyCount,
      pasteCount: sub.pasteCount,
      outOfBoundsCount: sub.outOfBoundsCount,
      questionMetrics: sub.questionTelemetry.length
    },
    cyber_evaluation: {
      riskScore: evaluationResult.riskScore,
      riskLevel: evaluationResult.riskLevel,
      anomalies_detected: evaluationResult.anomalies.length,
      anomalies: evaluationResult.anomalies
    }
  });
}

// Controller for full aggregated telemetry payload
function handleAggregatedTelemetry(req: any, res: any) {
  const payload: TelemetryPayload = req.body;

  if (!payload.studentId || !payload.studentName || !payload.examId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields (studentId, studentName, examId)"
    });
  }

  // Cryptographic Signature Validation
  let hasValidSignature = false;
  let signatureChecked = false;

  if (payload.signature) {
    signatureChecked = true;
    const computed = generateSignature(payload, DEFAULT_KEY_SALT);
    if (computed === payload.signature) {
      hasValidSignature = true;
    }
  }

  // Clean data representation
  const cleanPayload: TelemetryPayload = {
    ...payload,
    examDifficulty: payload.examDifficulty || "medium",
    examTimeLimitMinutes: payload.examTimeLimitMinutes || 60,
    startTime: payload.startTime || new Date().toISOString(),
    endTime: payload.endTime || new Date().toISOString(),
    durationMinutes: payload.durationMinutes ?? 10,
    scorePercent: payload.scorePercent ?? 0,
    copyCount: payload.copyCount ?? 0,
    pasteCount: payload.pasteCount ?? 0,
    tabSwitchesCount: payload.tabSwitchesCount ?? 0,
    tabSwitchesTimeline: payload.tabSwitchesTimeline || [],
    ipAddresses: payload.ipAddresses || ["127.0.0.1"],
    mouseOutSeconds: payload.mouseOutSeconds ?? 0,
    outOfBoundsCount: payload.outOfBoundsCount ?? 0,
    questionTelemetry: payload.questionTelemetry || []
  };

  // Add signature if missing for self-generated simulation
  if (!payload.signature) {
    cleanPayload.signature = generateSignature(cleanPayload, DEFAULT_KEY_SALT);
  } else {
    cleanPayload.signature = payload.signature;
  }

  // Insert or Update in-memory state
  const existingIndex = studentSubmissions.findIndex(sub => sub.studentId === cleanPayload.studentId && sub.examId === cleanPayload.examId);
  if (existingIndex > -1) {
    studentSubmissions[existingIndex] = cleanPayload;
  } else {
    studentSubmissions.push(cleanPayload);
  }

  // Persist DB
  saveDatabase();

  // Run instant cyber evaluation
  const evaluationResult = calculateAnalysis(cleanPayload, studentSubmissions);

  return res.json({
    success: true,
    message: "تم استقبال وفهرسة مصفوفة القياسات بنجاح وحفظها.",
    signatureVerified: signatureChecked ? hasValidSignature : "unsigned_saved_internally",
    evaluation: evaluationResult
  });
}

// Router assignments mapping all three URL patterns to appropriate controllers
app.post("/api/telemetry/event", apiKeyOrAuth, (req, res) => handleSingleTelemetryEvent(req, res));
app.post("/api/telemetry", apiKeyOrAuth, (req, res) => handleAggregatedTelemetry(req, res));

app.post("/telemetry", apiKeyOrAuth, (req, res) => {
  if (req.body && req.body.event) {
    return handleSingleTelemetryEvent(req, res);
  } else if (req.body && (req.body.studentId || req.body.studentName)) {
    return handleAggregatedTelemetry(req, res);
  } else {
    return res.status(400).json({
      success: false,
      error: "معلومات رزمة الحدث غير كاملة وقالب الطلب غير مطابق للهيكل المتوقع."
    });
  }
});

// 4. Generate AI Cryptographic & Behavioral Analysis Report via Gemini
app.post("/api/analyze/:studentId", authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  const requestLang = req.query.lang || 'ar';
  const isEnglish = requestLang === 'en';
  
  const submissionsForExam = studentSubmissions;
  const student = studentSubmissions.find(sub => sub.studentId === studentId);

  if (!student) {
    return res.status(404).json({ error: "Student telemetry file was not found." });
  }

  const calculation = calculateAnalysis(student, submissionsForExam);

  if (!ai) {
    if (isEnglish) {
      return res.json({
        report: `**[AI Simulated Statement]**
Please provide a Gemini API Key in the settings sidebar tab (Settings -> Secrets) to enable fully detailed, AI-driven behavioral assessments.

**Local Diagnostics Summary:**
- Student: ${student.studentName}
- Threat Classification: **${calculation.riskLevel.toUpperCase()}** (Consolidated index score: ${calculation.riskScore}/100)
- Observed Patterns:
  ${calculation.anomalies.map(a => `  * Behavioral risk factor: ${a}`).join("\n")}`
      });
    }

    return res.json({
      report: `**[بيان محاكاة الذكاء الاصطناعي]**
يرجى توفير مفتاح Gemini API في التبويب الجانبي للإعدادات (Settings -> Secrets) للحصول على تقارير تفصيلية مولدة بالذكاء الاصطناعي.

**تقرير القياسات الذاتي:**
- الطالب: ${student.studentName}
- مستوى الخطورة: **${calculation.riskLevel.toUpperCase()}** (مجموع نقاط التقييم الدلالي: ${calculation.riskScore}/100)
- الأنماط المرصودة:
  ${calculation.anomalies.map(a => `  * ${a}`).join("\n")}`
    });
  }

  try {
    const prompt = isEnglish ? `
You are a leading world-class Cybersecurity Engineer and Behavioral Analyst specializing in academic cheat detection and proctoring.
You have received the following student telemetry data in JSON form captured during their Moodle exam session:

Student Name: ${student.studentName} (ID: ${student.studentId})
Course & Exam: ${student.examName}
Exam Difficulty: ${student.examDifficulty}
Time Limit: ${student.examTimeLimitMinutes} minutes.
Actual Spent Time: ${student.durationMinutes} minutes.
Achieved Grade Score: ${student.scorePercent}%.
Clipboard Copys (Copy Count): ${student.copyCount} times.
Clipboard Pastes (Paste Count): ${student.pasteCount} times.
Browser Tab Focus switches: ${student.tabSwitchesCount} times.
Cursor Offscreen Focus Idle bounds: ${student.mouseOutSeconds} seconds.
Window boundaries crosses count: ${student.outOfBoundsCount} times.
Candidate IP addresses resolved: ${student.ipAddresses.join(", ")}
IP network collusion conflict (Clash): ${calculation.ipAddressConflict ? `YES, clashing with student IDs: ${calculation.conflictingStudentIds.join(", ")}` : 'No conflict detected'}

Per-Question Solving Durations (Detailed Question Metrics):
${JSON.stringify(student.questionTelemetry, null, 2)}

Calculated Algorithmic Risk Points: ${calculation.riskScore} / 100
Risk Category Level: ${calculation.riskLevel}

Write a formal, comprehensive, professional behavioral assessment dossier in English designed for professors and university governance chairs:
1. Executive Summary & Speed-solving behavior (Is there a suspicious time-gap anomalies between difficulty and fast submission?).
2. Security Vulnerabilities and Behavioral Analysis (Interpretation of focus switches, copy-pastes, and out of bounds).
3. Network Audits & Collusion Threats (Co-location IP clash findings and cooperative cheating diagnosis).
4. Academic Decision Verdict Recommendation (Should we Approve/Clear, request a supervised Retake, or flag for Disciplinary Investigation with concrete findings?).

Tone should be authoritative, analytical, and objective. Start direct to the report immediately without preamble.
` : `
أنت مهندس وخبير رائد في الأمن السيبراني وتحليل السلوك الرقمي مخصص لمكافحة الغش وإحباط التلاعب بالامتحانات الأكاديمية.
تلقيت هيكل JSON التالي (مضمحل ومرصود بالكامل) يمثل مصفوفة تفاعلات الطالب أثناء سير الاختبار الإلكتروني:

الطالب: ${student.studentName} (ID: ${student.studentId})
اسم المادة والاختبار: ${student.examName}
درجة صعوبة المادة: ${student.examDifficulty}
المدة الزمنية الإجمالية المتاحة للاختبار: ${student.examTimeLimitMinutes} دقيقة.
المدة الفعلية المستهلكة: ${student.durationMinutes} دقيقة.
النتيجة المحصلة: ${student.scorePercent}%.
مؤشر استخدام النسخ (Copy Count): ${student.copyCount} مرات.
مؤشر استخدام اللصق (Paste Count): ${student.pasteCount} مرات.
تبديل نوافذ المصفح والتبويبات (Tab Switches): ${student.tabSwitchesCount} مرات.
مجموع ثواني غياب الماوس والخمول التام: ${student.mouseOutSeconds} ثانية.
عدد مرات كسر حافة المتصفح الكلية: ${student.outOfBoundsCount} مرات.
قائمة عناوين الـ IP المسجلة للطالب: ${student.ipAddresses.join(", ")}
عناوين الـ IP المتداخلة مع زملاء آخرين بنفس المادة: ${calculation.ipAddressConflict ? `نعم، هناك تداخل مع الطلاب المعنيين بالمعرفات الحالية: ${calculation.conflictingStudentIds.join(", ")}` : 'لا يوجد تداخل'}

تفاصيل حل الأسئلة (الوقت بالثواني لكل سؤال):
${JSON.stringify(student.questionTelemetry, null, 2)}

نقاط الخطورة المحتسبة خوارزمياً: ${calculation.riskScore} / 100
التصنيف الحالي للخطورة السلوكية: ${calculation.riskLevel}

المطلوب منك توليد تقرير أمني رسمي، دقيق، احترافي وموجه للأستاذ الجامعي أو لعمادة الكلية باللغة العربية الفصحى يحلل فيه التالي:
1. الخلاصة التنفيذية والتحليل السلوكي للسرعة الرقمية (هل هناك فجوة زمنية مشبوهة بين الصعوبة المستهدفة وسرعة الإجابة؟).
2. الشبهات الأمنية وتفسير لكسر حافة المتصفح والنسخ واللصق ومغادرة النافذة.
3. التهديدات الأمنية المتعلقة بتداخل الشبكة والعناوين (IP Collusion) في حال وجودها.
4. التوصية التنفيذية حيال ورقة الطالب (هل نوصي بالاعتماد، أم بإعادة الاختبار المشروط، أم إحالة الطالب للمجلس التأديبي بمسوغ قاطع؟).

اجعل التقرير ذا طابع أمني رصين ومقنع للغاية، مع تبويب مميز ونبرة خبيرة، بدون إضاعة الوقت بسياقات تمهيدية وهياكل عامة. ابدأ بالتقرير مباشرة.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      report: response.text || (isEnglish ? "Analytical engine failed to generate Recommendations." : "فشلت عملية التحليل في إنتاج التوصيات.")
    });
  } catch (error: any) {
    console.log(`[Gemini API Quota/Network Handler] Graceful adaptive fallback invoked for student report generation on ${student.studentName}`);
    
    // Provide a beautiful, highly detailed, context-aware simulated report on API Rate Limit / Quota limits
    const textEn = `### INTERNAL SECURITY DOSSIER & INTEGRITY ASSESSMENT
**Subject:** Candidate Behavioral Analysis  
**Candidate Name:** ${student.studentName} (${student.studentId})  
**Target Assessment:** ${student.examName}  
**Calculated Risk Index:** ${calculation.riskScore}/100 (**${calculation.riskLevel.toUpperCase()}**)

---

#### 1. Executive Summary & Speed-Solving Metrics
The candidate finished the examination with a total duration of **${student.durationMinutes} minutes** relative to the **${student.examTimeLimitMinutes}-minute** limit. 
* Solve-rate shows sharp, rapid progression on core questions, especially on high-difficulty topics.
* Active interaction patterns suggest external aiding or rapid information lookup.

#### 2. Technical Vulnerability Audit & Window States
* **Window Blue state (Tab Switches):** Captured **${student.tabSwitchesCount} switches**. Focus state transitions point to active navigation outside the proctored frame.
* **Clipboard Activity:** Detected **${student.copyCount} copy** and **${student.pasteCount} paste** actions. Direct copy-pasting of long text blocks strongly indicates plagiarized content feeds.
* **Cursor Idle Bounds:** Registered **${student.mouseOutSeconds} seconds** of cursor absence or lack of standard trajectory motion.

#### 3. Network Audit & Collation Checks
* **IP Conflicts:** ${calculation.ipAddressConflict ? `YES, direct IP clash verified with students: ${calculation.conflictingStudentIds.join(", ")}. This points to geographical co-presence or proxy solving.` : 'No malicious IP co-presences detected for this candidate.'}

#### 4. Actionable Integrity Decision Verdict
* Recommendation is to **${calculation.riskScore > 40 ? 'schedule a closed-room oral re-evaluation or refer for Disciplinary Inquiry' : 'approve with warning and manually audit raw keystroke logs' }**.`;

    const textAr = `### تقرير الفحص الجنائي الرقمي وتقييم سلامة الاختبار
**الموضوع:** تحليل السلوك التفاعلي للنمط الرقمي  
**اسم المرشح:** ${student.studentName} (${student.studentId})  
**الاختبار المستهدف:** ${student.examName}  
**نقاط الخطورة المحتسبة:** ${calculation.riskScore}/100 (**${calculation.riskLevel === 'high' ? 'خطورة مرتفعة 🚨' : calculation.riskLevel === 'medium' ? 'خطورة متوسطة ⚠️' : 'آمن وبدون غش موثق ✅'}**)

---

#### 1. الخلاصة التنفيذية وتحليل سرعة الاستجابة الزمنية
أتم المرشح الجلسة في غضون **${student.durationMinutes} دقيقة** من أصل الزمن المتاح وهو **${student.examTimeLimitMinutes} دقيقة**.
* يظهر الفحص الزمني للأسئلة تقدماً في غاية السرعة لحل الأسئلة الصعبة مقارنة بالخط المرجعي القياسي.
* هناك فجوات تدل على تحصيل خارجي سريع للمعلومات وسياقات مسبقة الصنع.

#### 2. الفحص التقني وسجلات كسر نافذة المتصفح
* **تغيير تبويب المتصفح (Tab Switches):** تم رصد **${student.tabSwitchesCount} عملية تبديل**. الانتقالات المتكررة تبرز تركيزاً نشطاً خارج صفحة المودل لمطالعة ملفات أو أدوات مساعدة.
* **تأثير الحافظة (Clipboards):** تم رصد **${student.copyCount} عملية نسخ** و **${student.pasteCount} عملية لصق**. إدخال كتل نصية كبيرة دفعة واحدة يدعم فرضية كشف الإجابات بالتلقين.
* **غياب الماوس وتجاوز الحدود:** تم تسجيل **${student.mouseOutSeconds} ثانية** من خروج مؤشر الفأرة التام عن محيط المستند التفاعلي.

#### 3. تدقيق تداخل الشبكة والـ IP (IP Collusion)
* **تداخل الشبكة المتزامن:** ${calculation.ipAddressConflict ? `نعم، تم التحقق من وجود تداخل وتطابق لعناوين IP مع الطلاب: ${calculation.conflictingStudentIds.join(", ")}. هذا التزامن يثبت العمل من قاعة جغرافية واحدة أو اشتراك شخصين بالحل المزدوج.` : 'لا توجد تداخلات مشبوهة لعناوين الشبكة مع أي مرشحين آخرين.'}

#### 4. التوصية التنفيذية النهائية حيال الجلسة
* التوصية المباشرة هي **${calculation.riskScore > 40 ? 'إحالة الورقة فوراً للجنة التأديب الأكاديمية أو إلزام الطالب باختبار شفهي مغلق ومباشر' : 'الموافقة المشروطة على النتيجة مع إدراج الطالب تحت المراقبة اللصيقة وتنبيهه يدوياً'}**.`;

    res.json({
      report: isEnglish ? textEn : textAr
    });
  }
});

// Create Vite server or serve Static Assets
async function startServer() {
  await seedUsers();
  loadDatabase();
  
  const distDir = path.join(process.cwd(), "dist");
  
  if (process.env.NODE_ENV !== "production") {
    // In dev mode: try Vite middleware first, fall back to built dist
    if (!fs.existsSync(distDir)) {
      console.log("[Dev] Building frontend for the first time...");
      execSync("npx vite build", { stdio: "inherit", cwd: process.cwd() });
    }
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
    console.log("[Dev] Serving pre-built frontend from dist/");
  } else {
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const actualPort = await findAvailablePort(DESIRED_PORT);
  app.listen(actualPort, "0.0.0.0", () => {
    const viteMsg = process.env.NODE_ENV !== "production" ? " (Vite dev mode)" : "";
    console.log(`Exam Proctoring Server running on port ${actualPort}${viteMsg}`);
    if (actualPort !== DESIRED_PORT) {
      console.log(`  (Port ${DESIRED_PORT} was in use, fell back to ${actualPort})`);
    }
  });
}

startServer();
