import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Shield, User, Lock, Eye, EyeOff, LogIn, Globe, CheckCircle2, Terminal } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { id: string; username: string; role: string; nameAr: string; nameEn: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isLightMode] = useState(() => document.documentElement.classList.contains('theme-light'));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch {
      setError(lang === 'ar' ? 'فشل الاتصال بالخادم' : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const iconDir = lang === 'ar' ? 'right' : 'left';
  const oppositeIconDir = lang === 'ar' ? 'left' : 'right';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isLightMode ? 'bg-slate-100' : 'bg-slate-950'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className={`rounded-2xl p-8 shadow-2xl ${isLightMode ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
          {/* Language Toggle - Top Right */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200' : 'text-slate-500 hover:text-slate-300 bg-slate-950 hover:bg-slate-800'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${isLightMode ? 'bg-blue-50 border-blue-200' : 'bg-blue-600/20 border-blue-500/30'}`}>
              <Shield className={`w-8 h-8 ${isLightMode ? 'text-blue-600' : 'text-blue-500'}`} />
            </div>
            <h1 className={`text-2xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {lang === 'ar' ? 'نظام مراقبة الاختبارات' : 'Exam Integrity System'}
            </h1>
            <p className={`text-sm mt-2 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {lang === 'ar' ? 'تسجيل الدخول إلى لوحة المراقبة' : 'Login to Proctoring Dashboard'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold block ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <User className={`absolute ${iconDir}-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  className={`w-full rounded-xl py-3 text-sm outline-none transition placeholder:text-slate-500 ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${isLightMode ? 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-slate-950 border border-slate-800 text-white focus:border-blue-500'}`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold block ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute ${iconDir}-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                  className={`w-full rounded-xl py-3 text-sm outline-none transition placeholder:text-slate-500 ${lang === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'} ${isLightMode ? 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-slate-950 border border-slate-800 text-white focus:border-blue-500'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${oppositeIconDir}-3 top-1/2 -translate-y-1/2 cursor-pointer transition ${isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs text-center rounded-lg py-2.5 px-3 ${isLightMode ? 'text-red-600 bg-red-50 border border-red-200' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>
          </form>

          {/* Demo Credentials */}
          <div className={`mt-6 pt-6 border-t ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
            <p className={`text-[10px] font-bold text-center mb-3 uppercase tracking-wider ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <Terminal className="w-3 h-3 inline-block -mt-0.5 mr-1" />
              {lang === 'ar' ? 'بيانات الدخول التجريبية' : 'Demo Credentials'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className={`rounded-lg p-3 border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <p className={`font-bold mb-1 flex items-center gap-1.5 ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === 'ar' ? 'مدير' : 'Admin'}
                </p>
                <p className={`font-mono ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>admin / admin123</p>
              </div>
              <div className={`rounded-lg p-3 border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <p className={`font-bold mb-1 flex items-center gap-1.5 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === 'ar' ? 'مراقب' : 'Proctor'}
                </p>
                <p className={`font-mono ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>proctor / proctor123</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
