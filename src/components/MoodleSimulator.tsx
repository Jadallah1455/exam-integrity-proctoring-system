/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Send, Sliders, RefreshCw } from 'lucide-react';
import { TelemetryPayload, ExamDifficulty } from '../types';
import { translations } from '../translations';
import SimulatorPresetCards from './SimulatorPresetCards';
import FeedbackBanner from './FeedbackBanner';

interface MoodleSimulatorProps {
  onTelemetrySubmitted: () => void;
  lang?: 'ar' | 'en';
  isLightMode?: boolean;
  activeExamId?: string;
  activeExamName?: string;
  activeExamDifficulty?: ExamDifficulty;
}

export default function MoodleSimulator({ 
  onTelemetrySubmitted, 
  lang = 'ar',
  isLightMode = false,
  activeExamId,
  activeExamName,
  activeExamDifficulty
}: MoodleSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string; subId?: string } | null>(null);

  // Custom Form states
  const [studentId, setStudentId] = useState('STD-2023-9912');
  const [studentName, setStudentName] = useState(
    lang === 'en' ? 'Ahmed Al-Malki' : 'أحمد المالكي'
  );
  const [examId, setExamId] = useState(activeExamId || 'EXM-SEC-401');
  const [examName, setExamName] = useState(
    activeExamName || (lang === 'en' ? 'Cybersecurity Engineering Final Exam' : 'إختبار هندسة الأمن السيبراني النهائي')
  );
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
    <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-xl p-5 shadow-inner`}>
      <div className={`flex items-center justify-between mb-4 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-3`}>
        <div className="flex items-center gap-2 font-sans">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className={`text-sm font-extrabold ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>{translations[lang].moodleSimTitle}</h2>
        </div>
        <button
          onClick={handleResetData}
          disabled={loading}
          className={`${isLightMode ? 'text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700' : 'text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300'} flex items-center gap-1 px-2 py-1 rounded transition font-sans cursor-pointer`}
          title={translations[lang].moodleSimResetTooltip}
        >
          <RefreshCw className="w-3" />
          {translations[lang].moodleSimResetBtn}
        </button>
      </div>

      <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mb-4 leading-relaxed font-sans`}>
        {translations[lang].moodleSimDesc}
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} mb-4 p-0.5 ${isLightMode ? 'bg-slate-100' : 'bg-slate-950'} rounded-lg`}>
        <button
          onClick={() => { setActiveTab('presets'); setFeedback(null); }}
          className={`flex-1 py-1.5 text-xs text-center rounded-md font-medium transition cursor-pointer font-sans ${activeTab === 'presets' ? `${isLightMode ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'}` : `${isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}`}
        >
          {translations[lang].moodleSimPresetTab}
        </button>
        <button
          onClick={() => { setActiveTab('custom'); setFeedback(null); }}
          className={`flex-1 py-1.5 text-xs text-center rounded-md font-medium transition cursor-pointer font-sans ${activeTab === 'custom' ? `${isLightMode ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'}` : `${isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}`}
        >
          {translations[lang].moodleSimCustomTab}
        </button>
      </div>

      {/* Preset View */}
      {activeTab === 'presets' && (
        <SimulatorPresetCards lang={lang} isLightMode={isLightMode} loading={loading} onInject={triggerPreset} />
      )}

      {/* Custom Form View */}
      {activeTab === 'custom' && (
        <form onSubmit={submitCustomForm} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormStudentName}</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg focus:outline-none focus:border-indigo-500`}
              />
            </div>
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormStudentId}</label>
              <input
                type="text"
                required
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs font-mono p-2 rounded-lg focus:outline-none focus:border-indigo-500`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormDifficulty}</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as ExamDifficulty)}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg focus:outline-none focus:border-indigo-500`}
              >
                <option value="easy">{translations[lang].difficultyEasy} (Easy)</option>
                <option value="medium">{translations[lang].difficultyMedium} (Medium)</option>
                <option value="hard">{translations[lang].difficultyHard} (Hard)</option>
              </select>
            </div>
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormIp}</label>
              <input
                type="text"
                required
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs font-mono p-2 rounded-lg focus:outline-none focus:border-indigo-500`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormTimeLimit}</label>
              <input
                type="number"
                min="1"
                required
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono`}
              />
            </div>
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormDuration}</label>
              <input
                type="number"
                min="1"
                required
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono`}
              />
            </div>
            <div>
              <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1 font-medium`}>{translations[lang].moodleFormScore}</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono`}
              />
            </div>
          </div>

          <div className={`border-t ${isLightMode ? 'border-slate-200' : 'border-gray-800/60'} my-2 pt-2`}>
            <h4 className={`text-[10px] font-bold ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-2`}>{translations[lang].moodleFormTelemetryHeader}</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1`}>{translations[lang].moodleFormCopy}</label>
                <input
                  type="number"
                  value={copyCount}
                  onChange={e => setCopyCount(Number(e.target.value))}
                  className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg font-mono`}
                />
              </div>
              <div>
                <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1`}>{translations[lang].moodleFormPaste}</label>
                <input
                  type="number"
                  value={pasteCount}
                  onChange={e => setPasteCount(Number(e.target.value))}
                  className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg font-mono`}
                />
              </div>
              <div>
                <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1`}>{translations[lang].moodleFormTabSwitch}</label>
                <input
                  type="number"
                  value={tabSwitches}
                  onChange={e => setTabSwitches(Number(e.target.value))}
                  className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1`}>{translations[lang].moodleFormMouseOut}</label>
                <input
                  type="number"
                  value={mouseOut}
                  onChange={e => setMouseOut(Number(e.target.value))}
                  className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg font-mono`}
                />
              </div>
              <div>
                <label className={`block text-[10px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} mb-1`}>{translations[lang].moodleFormOutOfBounds}</label>
                <input
                  type="number"
                  value={outOfBounds}
                  onChange={e => setOutOfBounds(Number(e.target.value))}
                  className={`w-full ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0d101d] border-gray-800 text-white'} text-xs p-2 rounded-lg font-mono`}
                />
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between ${isLightMode ? 'bg-slate-50' : 'bg-gray-900/60'} p-2 rounded-lg mt-3`}>
            <div className="flex flex-col">
              <span className={`text-[10px] ${isLightMode ? 'text-slate-700' : 'text-gray-300'} font-bold`}>{translations[lang].moodleFormCheckTitle}</span>
              <span className={`text-[9px] ${isLightMode ? 'text-slate-500' : 'text-gray-400'} leading-normal`}>{translations[lang].moodleFormCheckDesc}</span>
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
            className={`w-full mt-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs ${isLightMode ? 'text-slate-800' : 'text-white'} py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer disabled:bg-indigo-850`}
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? translations[lang].moodleFormSubmitLoading : translations[lang].moodleFormSubmitBtn}
          </button>
        </form>
      )}

      <FeedbackBanner feedback={feedback} lang={lang} isLightMode={isLightMode} />
    </div>
  );
}
