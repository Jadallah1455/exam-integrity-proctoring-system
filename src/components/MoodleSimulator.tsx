/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from 'react';
import { Send, Sliders, ShieldCheck, ShieldAlert, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { TelemetryPayload, ExamDifficulty } from '../types';
import { translations } from '../translations';

interface MoodleSimulatorProps {
  onTelemetrySubmitted: () => void;
  lang?: 'ar' | 'en';
  activeExamId?: string;
  activeExamName?: string;
  activeExamDifficulty?: ExamDifficulty;
}

export default function MoodleSimulator({ 
  onTelemetrySubmitted, 
  lang = 'ar',
  activeExamId,
  activeExamName,
  activeExamDifficulty
}: MoodleSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string; subId?: string } | null>(null);

  // Custom Form states
  const [studentId, setStudentId] = useState('STD-2023-9912');
  const [studentName, setStudentName] = useState('أحمد المالكي');
  const [examId, setExamId] = useState(activeExamId || 'EXM-SEC-401');
  const [examName, setExamName] = useState(activeExamName || 'إختبار هندسة الأمن السيبراني النهائي');
  const [difficulty, setDifficulty] = useState<ExamDifficulty>(activeExamDifficulty || 'hard');
  const [timeLimit, setTimeLimit] = useState(60);
  const [duration, setDuration] = useState(15);
  const [score, setScore] = useState(98);
  const [copyCount, setCopyCount] = useState(8);
  const [pasteCount, setPasteCount] = useState(7);
  const [tabSwitches, setTabSwitches] = useState(12);
  const [mouseOut, setMouseOut] = useState(120);
  const [outOfBounds, setOutOfBounds] = useState(14);
  const [ipAddress, setIpAddress] = useState('192.168.1.150'); // Default to clashing IP for testing
  const [signPayload, setSignPayload] = useState(true);

  // Synchronize dynamic default values when selected language shifts
  useEffect(() => {
    if (!activeExamName) {
      if (lang === 'en') {
        setStudentName('Ahmed Al-Malki');
        setExamName('Cybersecurity Engineering Final Exam');
      } else {
        setStudentName('أحمد المالكي');
        setExamName('إختبار هندسة الأمن السيبراني النهائي');
      }
    } else {
      if (lang === 'en') {
        setStudentName('Ahmed Al-Malki');
      } else {
        setStudentName('أحمد المالكي');
      }
    }
  }, [lang, activeExamName]);

  // Synchronize dynamic exam context changes
  useEffect(() => {
    if (activeExamId) setExamId(activeExamId);
  }, [activeExamId]);

  useEffect(() => {
    if (activeExamName) setExamName(activeExamName);
  }, [activeExamName]);

  useEffect(() => {
    if (activeExamDifficulty) setDifficulty(activeExamDifficulty);
  }, [activeExamDifficulty]);

  // Send payload handler
  const sendTelemetryPayload = async (payload: Partial<TelemetryPayload>) => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({
          success: true,
          message: `${translations[lang].moodleFeedbackInjectSuccess || 'Successfully processed '} "${payload.studentName}"!`,
          subId: payload.studentId,
        });
        onTelemetrySubmitted();
      } else {
        setFeedback({ success: false, message: (lang === 'ar' ? 'خطأ: ' : 'Error: ') + data.error });
      }
    } catch {
      setFeedback({ success: false, message: translations[lang].moodleFeedbackInjectFail });
    } finally {
      setLoading(false);
    }
  };

  // Preset Scenarios
  const triggerPreset = (type: string) => {
    let payload: Partial<TelemetryPayload> = {};
    if (type === 'collusion_1') {
      payload = {
        studentId: 'STD-2023-7741',
        studentName: lang === 'ar' ? 'فيصل السديري' : 'Faisal Al-Sudairi',
        examId: 'EXM-SEC-401',
        examName: lang === 'ar' ? 'إختبار هندسة الأمن السيبراني النهائي' : 'Cybersecurity Engineering Final Exam',
        examDifficulty: 'hard',
        examTimeLimitMinutes: 60,
        startTime: new Date(Date.now() - 600000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: 10,
        scorePercent: 100,
        copyCount: 15,
        pasteCount: 12,
        tabSwitchesCount: 0,
        tabSwitchesTimeline: [],
        ipAddresses: ['192.168.1.150'], // Identical IP
        mouseOutSeconds: 0,
        outOfBoundsCount: 0,
        questionTelemetry: [
          { questionId: 'Q1', questionNumber: 1, timeSpentSeconds: 12, changesCount: 0 },
          { questionId: 'Q2', questionNumber: 2, timeSpentSeconds: 15, changesCount: 0 },
          { questionId: 'Q3', questionNumber: 3, timeSpentSeconds: 14, changesCount: 0 },
          { questionId: 'Q4', questionNumber: 4, timeSpentSeconds: 10, changesCount: 0 },
          { questionId: 'Q5', questionNumber: 5, timeSpentSeconds: 18, changesCount: 0 },
        ],
      };
    } else if (type === 'leak') {
      payload = {
        studentId: 'STD-2023-2281',
        studentName: lang === 'ar' ? 'عمر القحطاني' : 'Omar Al-Qahtani',
        examId: 'EXM-SEC-401',
        examName: lang === 'ar' ? 'إختبار هندسة الأمن السيبراني النهائي' : 'Cybersecurity Engineering Final Exam',
        examDifficulty: 'hard',
        examTimeLimitMinutes: 60,
        startTime: new Date(Date.now() - 480000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: 8,
        scorePercent: 96,
        copyCount: 18,
        pasteCount: 16,
        tabSwitchesCount: 22,
        tabSwitchesTimeline: [
          { timestamp: new Date().toISOString(), durationSeconds: 10 },
          { timestamp: new Date().toISOString(), durationSeconds: 24 },
        ],
        ipAddresses: ['172.16.51.81'],
        mouseOutSeconds: 240,
        outOfBoundsCount: 19,
        questionTelemetry: [
          { questionId: 'Q1', questionNumber: 1, timeSpentSeconds: 5, changesCount: 0 },
          { questionId: 'Q2', questionNumber: 2, timeSpentSeconds: 4, changesCount: 0 },
          { questionId: 'Q3', questionNumber: 3, timeSpentSeconds: 6, changesCount: 0 },
          { questionId: 'Q4', questionNumber: 4, timeSpentSeconds: 5, changesCount: 0 },
          { questionId: 'Q5', questionNumber: 5, timeSpentSeconds: 8, changesCount: 0 },
        ],
      };
    } else if (type === 'normal') {
      payload = {
        studentId: 'STD-2023-1120',
        studentName: lang === 'ar' ? 'نورة السبيعي' : 'Noura Al-Subaie',
        examId: 'EXM-SEC-401',
        examName: lang === 'ar' ? 'إختبار هندسة الأمن السيبراني النهائي' : 'Cybersecurity Engineering Final Exam',
        examDifficulty: 'hard',
        examTimeLimitMinutes: 60,
        startTime: new Date(Date.now() - 3000000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: 50,
        scorePercent: 82,
        copyCount: 0,
        pasteCount: 0,
        tabSwitchesCount: 1,
        tabSwitchesTimeline: [{ timestamp: new Date().toISOString(), durationSeconds: 3 }],
        ipAddresses: ['109.82.114.50'],
        mouseOutSeconds: 12,
        outOfBoundsCount: 2,
        questionTelemetry: [
          { questionId: 'Q1', questionNumber: 1, timeSpentSeconds: 420, changesCount: 2 },
          { questionId: 'Q2', questionNumber: 2, timeSpentSeconds: 590, changesCount: 1 },
          { questionId: 'Q3', questionNumber: 3, timeSpentSeconds: 610, changesCount: 0 },
          { questionId: 'Q4', questionNumber: 4, timeSpentSeconds: 820, changesCount: 3 },
          { questionId: 'Q5', questionNumber: 5, timeSpentSeconds: 560, changesCount: 1 },
        ],
      };
    } else if (type === 'tampered_signature') {
      payload = {
        studentId: 'STD-2023-5592',
        studentName: lang === 'ar' ? 'بدر الدوسري' : 'Badr Al-Dawsari',
        examId: 'EXM-SEC-401',
        examName: lang === 'ar' ? 'إختبار هندسة الأمن السيبراني النهائي' : 'Cybersecurity Engineering Final Exam',
        examDifficulty: 'hard',
        examTimeLimitMinutes: 60,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: 60,
        scorePercent: 100,
        copyCount: 0,
        pasteCount: 0,
        tabSwitchesCount: 0,
        tabSwitchesTimeline: [],
        ipAddresses: ['192.168.1.189'],
        mouseOutSeconds: 0,
        outOfBoundsCount: 0,
        questionTelemetry: [],
        signature: 'INVALID_FRAUDULENT_SIGNATURE_HEX_HASH' // Simulated tampered signature attempt
      };
    }

    sendTelemetryPayload(payload);
  };

  const submitCustomForm = (e: FormEvent) => {
    e.preventDefault();
    const payload: Partial<TelemetryPayload> = {
      studentId,
      studentName,
      examId,
      examName,
      examDifficulty: difficulty,
      examTimeLimitMinutes: Number(timeLimit),
      startTime: new Date(Date.now() - duration * 60000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: Number(duration),
      scorePercent: Number(score),
      copyCount: Number(copyCount),
      pasteCount: Number(pasteCount),
      tabSwitchesCount: Number(tabSwitches),
      tabSwitchesTimeline: Array.from({ length: Math.min(Number(tabSwitches), 4) }).map(() => ({
        timestamp: new Date().toISOString(),
        durationSeconds: Math.floor(Math.random() * 20) + 2
      })),
      ipAddresses: [ipAddress],
      mouseOutSeconds: Number(mouseOut),
      outOfBoundsCount: Number(outOfBounds),
      questionTelemetry: [
        { questionId: 'Q1', questionNumber: 1, timeSpentSeconds: Math.floor(duration * 12), changesCount: 1 },
        { questionId: 'Q2', questionNumber: 2, timeSpentSeconds: Math.floor(duration * 15), changesCount: 0 },
        { questionId: 'Q3', questionNumber: 3, timeSpentSeconds: Math.floor(duration * 18), changesCount: 2 },
      ],
    };

    if (!signPayload) {
      // Intentionally attach custom corrupted key signature
      payload.signature = "UNSIGNED_UNAUTHENTICATED";
    }

    sendTelemetryPayload(payload);
  };

  const handleResetData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/telemetry/reset', { method: 'POST' });
      await response.json();
      setFeedback({ success: true, message: translations[lang].moodleFeedbackResetSuccess });
      onTelemetrySubmitted();
    } catch {
      setFeedback({ success: false, message: translations[lang].moodleFeedbackResetFail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-sans">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-extrabold text-slate-100">{translations[lang].moodleSimTitle}</h2>
        </div>
        <button
          onClick={handleResetData}
          disabled={loading}
          className="text-[10px] flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition font-sans cursor-pointer"
          title={translations[lang].moodleSimResetTooltip}
        >
          <RefreshCw className="w-3" />
          {translations[lang].moodleSimResetBtn}
        </button>
      </div>

      <div className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
        {translations[lang].moodleSimDesc}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4 p-0.5 bg-slate-950 rounded-lg">
        <button
          onClick={() => { setActiveTab('presets'); setFeedback(null); }}
          className={`flex-1 py-1.5 text-xs text-center rounded-md font-medium transition cursor-pointer font-sans ${activeTab === 'presets' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {translations[lang].moodleSimPresetTab}
        </button>
        <button
          onClick={() => { setActiveTab('custom'); setFeedback(null); }}
          className={`flex-1 py-1.5 text-xs text-center rounded-md font-medium transition cursor-pointer font-sans ${activeTab === 'custom' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {translations[lang].moodleSimCustomTab}
        </button>
      </div>

      {/* Preset View */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          {/* Scenario 1: Interlocking IP */}
          <div className="border border-red-900/30 bg-red-950/10 rounded-lg p-3 hover:bg-red-950/20 transition group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-red-400">{translations[lang].moodlePresetATitle}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {translations[lang].moodlePresetADesc}
                </p>
              </div>
              <button
                disabled={loading}
                onClick={() => triggerPreset('collusion_1')}
                className="bg-red-900/40 hover:bg-red-800/60 p-1.5 rounded-md text-[11px] text-red-200 flex items-center gap-1 transition-all self-center shrink-0"
              >
                <Send className="w-3 h-3" />
                {translations[lang].moodlePresetInjectBtn}
              </button>
            </div>
          </div>

          {/* Scenario 2: Leakage & Copy paste */}
          <div className="border border-orange-950/55 bg-orange-950/10 rounded-lg p-3 hover:bg-orange-950/20 transition group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-orange-400">{translations[lang].moodlePresetBTitle}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {translations[lang].moodlePresetBDesc}
                </p>
              </div>
              <button
                disabled={loading}
                onClick={() => triggerPreset('leak')}
                className="bg-orange-900/40 hover:bg-orange-800/60 p-1.5 rounded-md text-[11px] text-orange-200 flex items-center gap-1 transition-all self-center shrink-0"
              >
                <Send className="w-3 h-3" />
                {translations[lang].moodlePresetInjectBtn}
              </button>
            </div>
          </div>

          {/* Scenario 3: Corrupt signature */}
          <div className="border border-yellow-900/30 bg-yellow-950/10 rounded-lg p-3 hover:bg-yellow-950/20 transition group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-yellow-400">{translations[lang].moodlePresetCTitle}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {translations[lang].moodlePresetCDesc}
                </p>
              </div>
              <button
                disabled={loading}
                onClick={() => triggerPreset('tampered_signature')}
                className="bg-yellow-900/40 hover:bg-yellow-800/60 p-1.5 rounded-md text-[11px] text-yellow-200 flex items-center gap-1 transition-all self-center shrink-0"
              >
                <Send className="w-3 h-3" />
                {translations[lang].moodlePresetInjectBtn}
              </button>
            </div>
          </div>

          {/* Scenario 4: Normal honest student */}
          <div className="border border-green-900/30 bg-green-950/10 rounded-lg p-3 hover:bg-green-950/20 transition group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-green-400">{translations[lang].moodlePresetDTitle}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {translations[lang].moodlePresetDDesc}
                </p>
              </div>
              <button
                disabled={loading}
                onClick={() => triggerPreset('normal')}
                className="bg-green-900/40 hover:bg-green-800/60 p-1.5 rounded-md text-[11px] text-green-200 flex items-center gap-1 transition-all self-center shrink-0"
              >
                <Send className="w-3 h-3" />
                {translations[lang].moodlePresetInjectBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Form View */}
      {activeTab === 'custom' && (
        <form onSubmit={submitCustomForm} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormStudentName}</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormStudentId}</label>
              <input
                type="text"
                required
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full bg-[#0d101d] text-xs font-mono text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormDifficulty}</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as ExamDifficulty)}
                className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="easy">{translations[lang].difficultyEasy} (Easy)</option>
                <option value="medium">{translations[lang].difficultyMedium} (Medium)</option>
                <option value="hard">{translations[lang].difficultyHard} (Hard)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormIp}</label>
              <input
                type="text"
                required
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                className="w-full bg-[#0d101d] text-xs font-mono text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormTimeLimit}</label>
              <input
                type="number"
                min="1"
                required
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormDuration}</label>
              <input
                type="number"
                min="1"
                required
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium">{translations[lang].moodleFormScore}</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="border-t border-gray-800/60 my-2 pt-2">
            <h4 className="text-[10px] font-bold text-gray-400 mb-2">{translations[lang].moodleFormTelemetryHeader}</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">{translations[lang].moodleFormCopy}</label>
                <input
                  type="number"
                  value={copyCount}
                  onChange={e => setCopyCount(Number(e.target.value))}
                  className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">{translations[lang].moodleFormPaste}</label>
                <input
                  type="number"
                  value={pasteCount}
                  onChange={e => setPasteCount(Number(e.target.value))}
                  className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">{translations[lang].moodleFormTabSwitch}</label>
                <input
                  type="number"
                  value={tabSwitches}
                  onChange={e => setTabSwitches(Number(e.target.value))}
                  className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">{translations[lang].moodleFormMouseOut}</label>
                <input
                  type="number"
                  value={mouseOut}
                  onChange={e => setMouseOut(Number(e.target.value))}
                  className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">{translations[lang].moodleFormOutOfBounds}</label>
                <input
                  type="number"
                  value={outOfBounds}
                  onChange={e => setOutOfBounds(Number(e.target.value))}
                  className="w-full bg-[#0d101d] text-xs text-white border border-gray-800 p-2 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-900/60 p-2 rounded-lg mt-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-300 font-bold">{translations[lang].moodleFormCheckTitle}</span>
              <span className="text-[9px] text-gray-400 leading-normal">{translations[lang].moodleFormCheckDesc}</span>
            </div>
            <input
              type="checkbox"
              checked={signPayload}
              onChange={e => setSignPayload(e.target.checked)}
              className="accent-indigo-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer disabled:bg-indigo-850"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? translations[lang].moodleFormSubmitLoading : translations[lang].moodleFormSubmitBtn}
          </button>
        </form>
      )}

      {/* Verification Feedback Banner */}
      {feedback && (
        <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 border ${feedback.success ? 'bg-emerald-950/20 text-emerald-300 border-emerald-900/40' : 'bg-rose-950/20 text-rose-300 border-rose-900/40'}`}>
          {feedback.success ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-bold mb-1">{feedback.success ? translations[lang].moodleFeedbackSuccessTitle : translations[lang].moodleFeedbackErrorTitle}</h4>
            <p className="text-[11px] text-gray-300">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
