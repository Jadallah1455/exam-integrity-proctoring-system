/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Terminal, Bot, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { AnomalyReport } from '../types';
import { translations } from '../translations';

interface SecurityReportProps {
  studentId: string;
  studentName: string;
  reportData: AnomalyReport;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export default function SecurityReport({ studentId, studentName: _studentName, reportData: _reportData, onClose: _onClose, lang = 'ar' }: SecurityReportProps) {
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    setReportText('');
    try {
      const response = await fetch(`/api/analyze/${studentId}?lang=${lang}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setReportText(data.report || (lang === 'ar' ? 'فشل توليد التقرير.' : 'Failed to generate report.'));
      } else {
        setError(data.error || (lang === 'ar' ? 'فشلت معالجة الطلب في خادم المراقبة.' : 'Request processing failed on proctoring server.'));
      }
    } catch {
      setError(lang === 'ar' ? 'خطأ في شبكة الاتصال، يرجى التحقق من الخادم.' : 'Network error, please check connection to server.');
    } finally {
      setLoading(false);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mt-3 p-4 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-100 font-sans">
            {translations[lang].copilotTitle}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
            Gemini Active
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
        {translations[lang].copilotDesc}
      </p>

      {/* Trigger Button */}
      {!reportText && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900">
          <Bot className="w-10 h-10 text-blue-500 mb-2 animate-pulse" />
          <p className="text-xs text-slate-300 font-medium mb-3 font-sans">{translations[lang].copilotReady}</p>
          <button
            onClick={fetchAIAnalysis}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer font-sans shadow-sm"
          >
            <Bot className="w-4 h-4" />
            {translations[lang].copilotTriggerBtn}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-xs text-blue-300 animate-pulse font-mono">
            {translations[lang].copilotLoading}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400 mb-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">{translations[lang].copilotError}</h4>
            <p className="text-slate-300 mt-1">{error}</p>
            <button
               onClick={fetchAIAnalysis}
              className="mt-2 text-[10px] bg-red-900/30 text-red-200 px-2 py-1 rounded hover:bg-red-900/50 cursor-pointer font-sans"
            >
              {translations[lang].copilotRetryBtn}
            </button>
          </div>
        </div>
      )}

      {/* Report text */}
      {reportText && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs leading-relaxed text-slate-300 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-800">
            <div className={`whitespace-pre-wrap ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
              {reportText}
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-sans">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              {translations[lang].copilotSuccessBadge}
            </span>
            <button
              onClick={fetchAIAnalysis}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline cursor-pointer font-sans"
            >
              <RefreshCw className="w-3 h-3" />
              {translations[lang].copilotRefreshBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
