interface BatchProgressHUDProps {
  batchProgress: number | null;
  batchOpName: string;
  lang: string;
  isLightMode: boolean;
}

export default function BatchProgressHUD({ batchProgress, batchOpName, lang, isLightMode }: BatchProgressHUDProps) {
  if (batchProgress === null) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className={`p-6 rounded-2xl max-w-sm w-full mx-auto space-y-4 shadow-2xl text-center ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
        <div className="relative flex items-center justify-center h-16 w-16 mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-800 border-t-blue-500"></div>
          <span className={`absolute text-[10px] font-black font-mono ${isLightMode ? 'text-blue-600' : 'text-blue-300'}`}>{batchProgress}%</span>
        </div>
        <div className="space-y-1">
          <h4 className={`text-sm font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
            {lang === 'ar' ? 'معالجة جماعية ذكية' : 'Executing Batch Command'}
          </h4>
          <p className={`text-[11px] font-medium leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {batchOpName}
          </p>
        </div>
        <div className={`w-full rounded-full h-2 overflow-hidden border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-850'}`}>
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${batchProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
