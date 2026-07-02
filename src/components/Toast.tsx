import { Bell } from 'lucide-react';

interface ToastProps {
  toast: { messageAr: string; messageEn: string } | null;
  lang: string;
}

export default function Toast({ toast, lang }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      id="interactive-proctor-toast"
      className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 max-w-sm z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg shrink-0">
        <Bell className="w-4 h-4 animate-bounce" />
      </div>
      <div>
        <p className="text-xs font-bold leading-relaxed">
          {lang === 'ar' ? toast.messageAr : toast.messageEn}
        </p>
      </div>
    </div>
  );
}
