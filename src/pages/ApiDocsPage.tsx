import { type Dispatch, type SetStateAction } from 'react';
import { Code, Terminal } from 'lucide-react';

interface ApiDocsPageProps {
  isLightMode: boolean;
  lang: 'ar' | 'en';
  currentT: Record<string, string>;
  copiedCurl: boolean;
  copyCurlToClipboard: () => void;
  streamLoading: boolean;
  streamConsoleLogs: Array<{
    timestamp: string;
    eventType: string;
    eventId: string;
    success: boolean;
    resp?: any;
  }>;
  setStreamConsoleLogs: Dispatch<SetStateAction<Array<{
    timestamp: string;
    eventType: string;
    eventId: string;
    success: boolean;
    resp?: any;
  }>>>;
  streamStudentId: number;
  setStreamStudentId: Dispatch<SetStateAction<number>>;
  streamStudentName: string;
  setStreamStudentName: Dispatch<SetStateAction<string>>;
  streamEventType: string;
  setStreamEventType: Dispatch<SetStateAction<string>>;
  streamQuizId: number;
  setStreamQuizId: Dispatch<SetStateAction<number>>;
  streamQuizName: string;
  setStreamQuizName: Dispatch<SetStateAction<string>>;
  sendMoodleLiveEvent: () => Promise<void>;
}

export default function ApiDocsPage({
  isLightMode, lang, currentT, copiedCurl, copyCurlToClipboard,
  streamLoading, streamConsoleLogs, setStreamConsoleLogs,
  streamStudentId, setStreamStudentId,
  streamStudentName, setStreamStudentName,
  streamEventType, setStreamEventType,
  streamQuizId, setStreamQuizId,
  streamQuizName, setStreamQuizName,
  sendMoodleLiveEvent
}: ApiDocsPageProps) {
  return (
    <div className={`rounded-xl p-6 space-y-6 shadow-xl ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
      <div className={`pb-4 ${isLightMode ? 'border-b border-slate-200' : 'border-b border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Code className={`w-6 h-6 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
          <h2 className={`text-lg font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{currentT.apiSchemaHeading}</h2>
        </div>
        <p className={`text-xs mt-2 leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {currentT.apiSchemaDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* API Endpoints & Description */}
        <div className="md:col-span-12 lg:col-span-7 space-y-4">
          <div className="space-y-2">
            <h3 className={`text-sm font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}>{currentT.ingressEndpoint}</h3>
            <div className={`p-3 rounded-lg border flex items-center justify-between font-mono text-xs ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'}`} dir="ltr">
              <span className="text-emerald-400 font-extrabold uppercase text-left">POST</span>
              <span className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>/api/telemetry</span>
              <span className={`font-sans ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentT.sizeLabel} JSON Array / Object</span>
            </div>
          </div>

          <div className={`rounded-lg p-4 space-y-3 text-xs leading-relaxed border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'}`}>
            <h4 className={`font-bold ${isLightMode ? 'text-blue-700' : 'text-blue-400'}`}>{currentT.jsonDefHeading}</h4>
            <ul className={`space-y-2 list-none p-0 m-0 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
              <li>• <strong className={`font-mono ${isLightMode ? 'text-slate-800' : 'text-white'}`}>studentId</strong>: {currentT.jsonDefStudentId}</li>
              <li>• <strong className={`font-mono ${isLightMode ? 'text-slate-800' : 'text-white'}`}>studentName</strong>: {currentT.jsonDefStudentName}</li>
              <li>• <strong className={`font-mono ${isLightMode ? 'text-slate-800' : 'text-white'}`}>durationMinutes</strong>: {currentT.jsonDefDuration}</li>
              <li>• <strong className={`font-mono ${isLightMode ? 'text-slate-800' : 'text-white'}`}>ipAddresses</strong>: {currentT.jsonDefIp}</li>
              <li>• <strong className={`font-mono ${isLightMode ? 'text-slate-800' : 'text-white'}`}>tabSwitchesCount</strong>: {currentT.jsonDefTab}</li>
              <li>• <strong className={`font-mono ${isLightMode ? 'text-slate-800' : 'text-white'}`}>signature</strong>: {currentT.jsonDefSig}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className={`text-xs font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{currentT.jsonDefResponse}</h4>
            <pre className={`p-4 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto text-left border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'}`} dir="ltr">
{`{
  "success": true,
  "message": "تم استقبال وفهرسة مصفوفة القياسات بنجاح.",
  "signatureVerified": true,
  "evaluation": {
    "studentId": "STD-2023-1120",
    "riskScore": 75,
    "riskLevel": "high",
    "anomalies": [
      "تطابق عنوان الـ IP مع طالب آخر..."
    ]
  }
}`}
            </pre>
          </div>
        </div>

        {/* cURL Client Test block */}
        <div className="md:col-span-12 lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                <Terminal className="w-4 h-4" />
                {currentT.curlHeading}
              </span>
              <button
                onClick={copyCurlToClipboard}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded-md transition duration-150 flex items-center gap-1 font-mono cursor-pointer shadow-sm"
              >
                {copiedCurl ? currentT.curlCopyBtnCopied : currentT.curlCopyBtnReady}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              {currentT.curlDesc}
            </p>
            <pre className="p-3 bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] rounded-lg overflow-x-auto text-left leading-relaxed max-h-56 select-all" dir="ltr">
{`curl -X POST "${window.location.origin}/api/telemetry" \\
-H "Content-Type: application/json" \\
-d '{
  "studentId": "STD-2023-1120",
  "studentName": "${lang === 'ar' ? 'نورة السبيعي' : 'Noura Al-Subaie'}",
  "examId": "EXM-SEC-401",
  "examName": "${lang === 'ar' ? 'إختبار هندسة الأمن السيبراني النهائي' : 'Cybersecurity Engineering Final Exam'}",
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
}'`}
            </pre>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-blue-400">{currentT.sigAdvantageTitle}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {currentT.sigAdvantageDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Moodle Live Event Interceptor Gateway Section */}
      <div id="moodle-event-gateway" className={`mt-8 pt-8 space-y-6 ${isLightMode ? 'border-t border-slate-200' : 'border-t border-slate-800/80'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-2">
          <div>
            <h3 className={`text-base font-extrabold flex items-center gap-2 ${isLightMode ? 'text-blue-700' : 'text-blue-400'}`}>
              <span className="animate-pulse flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {lang === 'ar' ? 'بوابة وموجه أحداث مودل الفورية (Micro-Event Stream Interceptor Gateway)' : 'Moodle Micro-Event Stream Interceptor Gateway'}
              </span>
            </h3>
            <p className={`text-[11px] mt-1 leading-normal max-w-3xl ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {lang === 'ar' 
                ? 'تُحاكي هذه اللوحة تدفق الأحداث الحية التي ترسلها إضافة المتصفح الخاصة بمودل (Moodle Plugin) في رزمة منفصلة لكل حركة يقوم بها الطالب داخل الاختبار، وتوضيح كيفية تجميع البيانات وحساب المخاطر في الخادم لحظياً بالاعتماد على مفتاح (student.id + quiz.attempt_id)'
                : 'This gateway simulates real-time fine-grained tracking events dispatched by the Moodle quiz browser extension on every candidate interaction, demonstrating instant server-side state aggregation and risk updates based on (student.id + quiz.attempt_id).'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Event Configuration Form */}
          <div className={`xl:col-span-7 p-5 rounded-2xl border space-y-4 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/80'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] uppercase font-bold mb-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {lang === 'ar' ? 'رقم تعريف الطالب في مودل:' : 'Moodle Student ID (Numeric):'}
                </label>
                <input
                  type="number"
                  value={streamStudentId}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStreamStudentId(val);
                    if (val === 2) setStreamStudentName(lang === 'ar' ? 'أحمد الشريف' : 'Ahmed Al-Sharif');
                    else if (val === 3) setStreamStudentName(lang === 'ar' ? 'خالد الغامدي' : 'Khaled Al-Ghamdi');
                    else if (val === 4) setStreamStudentName(lang === 'ar' ? 'هند الدوسري' : 'Hind Al-Dawsari');
                    else setStreamStudentName(lang === 'ar' ? `طالب مودل رقم ${val}` : `Moodle Candidate ${val}`);
                  }}
                  className={`w-full rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500 ${isLightMode ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-900 border border-slate-800 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-[10px] uppercase font-bold mb-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {lang === 'ar' ? 'اسم الطالب الكامل:' : 'Student Full Name:'}
                </label>
                <input
                  type="text"
                  value={streamStudentName}
                  onChange={(e) => setStreamStudentName(e.target.value)}
                  className={`w-full rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 ${isLightMode ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-900 border border-slate-800 text-white'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] uppercase font-bold mb-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {lang === 'ar' ? 'نوع الحدث الميكروي (Event Type):' : 'Micro Event Type (event_type):'}
                </label>
                <select
                  value={streamEventType}
                  onChange={(e) => setStreamEventType(e.target.value)}
                  className={`w-full rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 ${isLightMode ? 'bg-white border border-slate-300 text-slate-700' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}
                >
                  <option value="window_blur">window_blur ({lang === 'ar' ? 'الطالب خرج من نافذة الاختبار - مهم جداً' : 'Student blurred window'})</option>
                  <option value="window_focus">window_focus ({lang === 'ar' ? 'الطالب عاد لنافذة الاختبار' : 'Student gained focus'})</option>
                  <option value="tab_hidden">tab_hidden ({lang === 'ar' ? 'تبويب الاختبار مخفي - مهم جداً' : 'Exam tab went hidden'})</option>
                  <option value="tab_visible">tab_visible ({lang === 'ar' ? 'تبويب الاختبار نشط من جديد' : 'Exam tab became visible'})</option>
                  <option value="copy">copy ({lang === 'ar' ? 'نسخ محتويات الأسئلة' : 'Copy action caught'})</option>
                  <option value="paste">paste ({lang === 'ar' ? 'لصق إجابة خارجية - مهم جداً' : 'Paste action caught'})</option>
                  <option value="right_click">right_click ({lang === 'ar' ? 'ضغط زر الفأرة الأيمن - متوسط' : 'Right-click context menu'})</option>
                  <option value="page_leave">page_leave ({lang === 'ar' ? 'مغادرة/إعادة تحميل صفحة الامتحان' : 'Student left page completely'})</option>
                  <option value="network_offline">network_offline ({lang === 'ar' ? 'انقطاع الاتصال بالشبكة' : 'Network offline event'})</option>
                  <option value="network_online">network_online ({lang === 'ar' ? 'عودة الاتصال بالشبكة' : 'Network restored online'})</option>
                  <option value="answer_changed">answer_changed ({lang === 'ar' ? 'تعديل أو كتابة الإجابة - أساسي' : 'Candidate adjusted answer'})</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] uppercase font-bold mb-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {lang === 'ar' ? 'رمز الكويز في مودل:' : 'Moodle Quiz Identifier:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={streamQuizId}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStreamQuizId(val);
                      setStreamQuizName(val === 1 ? 'quiz_test_1' : `quiz_session_${val}`);
                    }}
                    className={`rounded-lg p-2 text-xs font-mono text-center focus:outline-none focus:border-blue-500 ${isLightMode ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-900 border border-slate-800 text-white'}`}
                  />
                  <input
                    type="text"
                    value={streamQuizName}
                    onChange={(e) => setStreamQuizName(e.target.value)}
                    className={`col-span-2 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 ${isLightMode ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-900 border border-slate-800 text-white'}`}
                  />
                </div>
              </div>
            </div>

            <div className={`pt-3 ${isLightMode ? 'border-t border-slate-200' : 'border-t border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-black font-mono tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'ar' ? 'محتوى حزمة البيانات فوري المعاينة (Real-time Payload):' : 'Pre-transmitted Real-time Payload Spec:'}
                </span>
                <span className="text-[10px] text-blue-400 font-mono">schema_version: 1.0</span>
              </div>
              <pre className={`mt-2 p-3 rounded-lg text-[10px] leading-relaxed font-mono border overflow-x-auto text-left max-h-48 ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`} dir="ltr">
{`{
  "received_at": "${new Date().toISOString()}",
  "client_ip": "127.0.0.1",
  "event": {
    "schema_version": "1.0",
    "event_id": "evt_1780759082927_xxxx",
    "event_type": "${streamEventType}",
    "timestamp": "${new Date().toISOString()}",
    "moodle": {
      "student": { "id": ${streamStudentId}, "fullname": "${streamStudentName}" },
      "quiz": { "id": ${streamQuizId}, "name": "${streamQuizName}" }
    },
    "metadata": ${
      streamEventType === 'answer_changed' 
        ? '{\n      "question": { "question_number": "1" },\n      "answer": { "answer_value": "0" }\n    }'
        : streamEventType === 'window_blur' 
        ? '{ "reason": "browser_window_lost_focus" }'
        : streamEventType === 'tab_hidden'
        ? '{ "reason": "document_visibility_changed_to_hidden" }'
        : streamEventType === 'copy'
        ? '{ "action": "copy_detected" }'
        : streamEventType === 'paste'
        ? '{ "action": "paste_detected" }'
        : streamEventType === 'right_click'
        ? '{ "action": "context_menu_opened" }'
        : streamEventType === 'page_leave'
        ? '{ "reason": "page_beforeunload" }'
        : streamEventType === 'network_offline'
        ? '{ "reason": "browser_connection_lost" }'
        : streamEventType === 'network_online'
        ? '{ "reason": "browser_connection_restored" }'
        : '{ "action": "plugin_event_triggered" }'
    }
  }
}`}
              </pre>
            </div>

            <div className="flex gap-2">
              <button
                onClick={sendMoodleLiveEvent}
                disabled={streamLoading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[12px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150 cursor-pointer shadow-md shadow-emerald-950/20 disabled:opacity-50"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>
                  {streamLoading 
                    ? (lang === 'ar' ? 'جاري بث الحدث...' : 'Transmitting packet...')
                    : (lang === 'ar' ? 'بث واختبار حزمة الحدث في المراقبة الفورية 📡' : 'Stream Live event packet to Proctoring Server 📡')}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Console Log Viewer */}
          <div className={`xl:col-span-5 rounded-2xl border p-5 space-y-4 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'}`}>
            <div className={`flex items-center justify-between pb-2 ${isLightMode ? 'border-b border-slate-200' : 'border-b border-slate-800'}`}>
              <h4 className={`text-xs font-black flex items-center gap-1.5 font-mono uppercase tracking-wider ${isLightMode ? 'text-slate-700' : 'text-slate-100'}`}>
                <span className="w-1.5 h-3 bg-indigo-500 rounded-full inline-block"></span>
                <span>{lang === 'ar' ? 'شاشة سجل البث والمخرجات (Live Console Output)' : 'Live Console Output'}</span>
              </h4>
              {streamConsoleLogs.length > 0 && (
                <button
                  onClick={() => setStreamConsoleLogs([])}
                  className={`text-[9px] px-2 py-1 rounded transition font-sans cursor-pointer ${isLightMode ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  {lang === 'ar' ? 'تفريغ' : 'Clear'}
                </button>
              )}
            </div>

            {streamConsoleLogs.length === 0 ? (
              <div className={`h-68 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl space-y-2 ${isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900/50 border-slate-800'}`}>
                <span className="text-xl">📡</span>
                <div className={`text-[10px] font-sans font-medium ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'ar' 
                    ? 'في انتظار البث الفوري لحزم الأحداث المباشرة. حدد المعلمات يساراً واضغط "بث حزمة الحدث".' 
                    : 'Waiting to intercept incoming live Moodle plugin events. Choose options and press broadcast key.'}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-85 overflow-y-auto pr-1 scrollbar-thin">
                {streamConsoleLogs.map((log, index) => (
                  <div key={index} className={`border rounded-xl p-3.5 space-y-2 font-mono text-[10.5px] ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className={`flex items-center justify-between pb-1.5 text-[9.5px] ${isLightMode ? 'border-b border-slate-200' : 'border-b border-slate-800/60'}`}>
                      <span className="text-blue-400 font-bold">[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${isLightMode ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-950 text-indigo-300'}`}>
                        {log.eventType}
                      </span>
                    </div>

                    <p className={`leading-normal font-sans ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                      {lang === 'ar' 
                        ? `تم دمج الحدث بنجاح تحت المعرف الخادم التراكمي: `
                        : `Event registered under cumulative identifier: `}
                      <strong className={`font-mono text-xs block mt-0.5 border px-2 py-0.5 rounded ${isLightMode ? 'text-slate-800 border-slate-200 bg-slate-50' : 'text-white border-slate-800 bg-slate-950'}`}>
                        {log.resp?.accumulation?.studentId} ({lang === 'ar' ? 'كويز ' : 'Quiz '} {log.resp?.accumulation?.examId})
                      </strong>
                    </p>

                    <div className={`grid grid-cols-2 gap-2 p-2 rounded-lg border text-[10px] ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-850'}`}>
                      <div>
                        <span className="block text-[8px] uppercase font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{lang === 'ar' ? 'التبديلات التراكمية:' : 'Total Tab Switches:'}</span>
                        <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{log.resp?.accumulation?.tabSwitchesCount}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{lang === 'ar' ? 'النسخ/اللصق التراكمي:' : 'Total Copy/Paste:'}</span>
                        <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{log.resp?.accumulation?.copyCount + log.resp?.accumulation?.pasteCount}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{lang === 'ar' ? 'خارج الحدود الكلي:' : 'Total Offscreen Events:'}</span>
                        <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{log.resp?.accumulation?.outOfBoundsCount}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{lang === 'ar' ? 'درجة الخطورة الفورية:' : 'Instant Cyber Risk Score:'}</span>
                        <span className={`font-black uppercase text-[10px] ${log.resp?.cyber_evaluation?.riskScore >= 60 ? 'text-red-400' : log.resp?.cyber_evaluation?.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {log.resp?.cyber_evaluation?.riskScore}% ({log.resp?.cyber_evaluation?.riskLevel})
                        </span>
                      </div>
                    </div>

                    <div className={`pt-1 select-all p-1.5 rounded transition ${isLightMode ? 'hover:bg-slate-50' : 'hover:bg-slate-900'}`}>
                      <span className="text-[8px] font-sans font-bold uppercase block mb-1 ${isLightMode ? 'text-slate-500' : 'text-slate-500'}">{lang === 'ar' ? 'استجابة الخادم الصافية المحسوبة (Server Json Engine Response):' : 'Engine Server Raw Echo:'}</span>
                      <pre className="text-[8.5px] leading-relaxed text-emerald-400 overflow-x-auto" dir="ltr">
                        {JSON.stringify(log.resp?.cyber_evaluation?.anomalies, null, 1)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
