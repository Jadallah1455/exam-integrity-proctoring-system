import { Lock, HelpCircle } from 'lucide-react';

interface ProctorTimeoutLockProps {
  lang: 'ar' | 'en';
  isLightMode: boolean;
  isLocked: boolean;
  onUnlock: () => void;
}

export default function ProctorTimeoutLock({ lang, isLightMode, isLocked, onUnlock }: ProctorTimeoutLockProps) {
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-4">
          <h3 className={`text-xl font-bold tracking-wide ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
            {lang === 'ar' ? 'جلسة المراقب معلقة' : 'Proctor Session Suspended'}
          </h3>
          <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {lang === 'ar'
              ? 'تم قفل لوحة التحكم تلقائياً للتأمين بعد مرور فترة من خمول النشاط السلوكي.'
              : 'The proctoring panel has been secured automatically due to inactivity timeout.'}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('passcode') as HTMLInputElement).value;
            if (input === 'admin') {
              onUnlock();
            } else {
              alert(lang === 'ar' ? 'كلمة المرور غير صحيحة! جرب "admin"' : 'Passcode incorrect! Hint: use "admin"');
            }
          }}
          className="space-y-4 text-left"
        >
          <div className="space-y-2">
            <label className={`block text-[10px] uppercase font-mono tracking-widest font-extrabold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {lang === 'ar' ? 'أدخل كلمة مرور رخصة المراقبة:' : 'Verify Proctor Passcode:'}
            </label>
            <input
              type="password"
              name="passcode"
              placeholder="••••"
              autoFocus
              required
              className={`w-full text-center tracking-widest font-mono p-3 rounded-xl focus:outline-none focus:border-indigo-500 text-lg ${isLightMode ? 'bg-white text-slate-800 border border-slate-300' : 'bg-slate-950 text-white border border-slate-800'}`}
            />
          </div>

          <div className={`p-3 rounded-xl ${isLightMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-950/30 border border-amber-900/30'}`}>
            <span className={`block text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
              <HelpCircle className="w-3 h-3" />{lang === 'ar' ? 'إرشاد الوصول السريع الآمن:' : 'Quick Access Instruction:'}
            </span>
            <span className={`block text-[9.5px] mt-1 font-medium leading-normal ${isLightMode ? 'text-amber-800' : 'text-amber-400'}`}>
              {lang === 'ar'
                ? 'المرور الافتراضي المفعل لحماية السيرفر هو "admin". أدخلها لإعادة الاتصال باللوحة.'
                : 'The default passcode is "admin". Input it to grant unlock.'}
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />{lang === 'ar' ? 'إلغاء تعليق الجلسة' : 'De-authorize & Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
