/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExamDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionTelemetry {
  questionId: string;
  questionNumber: number;
  timeSpentSeconds: number;
  changesCount: number;
  copyCount?: number;
  pasteCount?: number;
}

export interface TabSwitchEvent {
  timestamp: string; // ISO string
  durationSeconds: number;
}

export interface TelemetryPayload {
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  examDifficulty: ExamDifficulty;
  examTimeLimitMinutes: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  scorePercent: number;
  copyCount: number;
  pasteCount: number;
  tabSwitchesCount: number;
  tabSwitchesTimeline: TabSwitchEvent[];
  ipAddresses: string[];
  mouseOutSeconds: number;
  outOfBoundsCount: number;
  questionTelemetry: QuestionTelemetry[];
  signature?: string; // High-integrity secure payload signature to protect against student tampering
  isEncrypted?: boolean;
  sessionId?: string;
  session_id?: string;
}

export interface AnomalyReport {
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  riskScore: number; // 0 to 100
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
  anomalies: string[];
  ipAddressConflict: boolean;
  conflictingStudentIds: string[];
  timeAnomaly: boolean; // Flag if completed unreasonably fast
  extremeTabSwitching: boolean;
  copyPasteSpike: boolean;
  outOfBoundsSpike: boolean;
  aiInsightsText?: string;
  analyzedAt: string;
  verdict?: 'approved' | 'retake_requested' | 'investigation' | null;
  suggestedAction?: string;
  suggestedActionEn?: string;
  suggestedActionAr?: string;
  suggestedActionSource?: 'rules' | 'gemini';
  patternAnomaly?: boolean;
  aggressivePattern?: boolean;
  macroUsage?: boolean;
}

export interface ExamStats {
  examId: string;
  examName: string;
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  averageTimeSpentMinutes: number;
  difficulty: ExamDifficulty;
}

export interface TimingConfig {
  easyBaseMinutesPerQuestion: number;
  mediumBaseMinutesPerQuestion: number;
  hardBaseMinutesPerQuestion: number;
  teacherTimeAdjustment: number;
}

export interface CopyPasteConfig {
  maxRiskPoints: number;
  chatGPTPatternThreshold: number;
  abusedMultiplier: number;
}

export interface Teacher {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface Subject {
  id: string;
  teacherId: string;
  nameAr: string;
  nameEn: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  nameAr: string;
  nameEn: string;
  difficulty: ExamDifficulty;
  timeLimit: number;
}

