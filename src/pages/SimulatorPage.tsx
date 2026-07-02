import MoodleSimulator from '../components/MoodleSimulator';
import type { ExamDifficulty } from '../types';

interface Props {
  isLightMode: boolean;
  lang: 'ar' | 'en';
  activeExamId: string;
  activeExamName: string | undefined;
  activeExamDifficulty: ExamDifficulty | undefined;
  onTelemetrySubmitted: () => void;
}

export default function SimulatorPage({ isLightMode, lang, activeExamId, activeExamName, activeExamDifficulty, onTelemetrySubmitted }: Props) {
  const isAr = lang === 'ar';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`rounded-xl p-6 shadow-xl relative overflow-hidden ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"></div>

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLightMode ? 'bg-cyan-100' : 'bg-cyan-900/30'}`}>
            <svg className={`w-5 h-5 ${isLightMode ? 'text-cyan-600' : 'text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-md font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
              {isAr ? 'بيئة محاكاة المودل' : 'Moodle Simulation Environment'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAr ? 'اختبر إرسال بيانات التليمتري إلى الخادم' : 'Test telemetry data submission to the server'}
            </p>
          </div>
        </div>

        <MoodleSimulator
          key={activeExamId}
          isLightMode={isLightMode}
          lang={lang}
          onTelemetrySubmitted={onTelemetrySubmitted}
          activeExamId={activeExamId}
          activeExamName={activeExamName}
          activeExamDifficulty={activeExamDifficulty}
        />
      </div>
    </div>
  );
}
