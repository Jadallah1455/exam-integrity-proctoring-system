import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface TourStep {
  target: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

const tourSteps: TourStep[] = [
  {
    target: '#sidebar-section',
    titleAr: 'الشريط الجانبي',
    titleEn: 'Sidebar Navigation',
    descAr: 'من هنا تتنقل بين الأقسام الرئيسية: لوحة المعلومات، خريطة الحرارة، وثائق API، إعدادات المحرك، وسجل التدقيق. يمكنك طي الشريط بالضغط على زر السهم.',
    descEn: 'Navigate between main sections: Dashboard, Heatmap, API Docs, Engine Control, and Auditor Log. Collapse the sidebar using the arrow button.',
  },
  {
    target: '#stats-cards-section',
    titleAr: 'بطاقات الإحصائيات',
    titleEn: 'Stats Cards',
    descAr: 'تعرض ملخصاً سريعاً لأعداد الطلاب الكلي، حالات الخطورة العالية والمتوسطة، الحالات الآمنة، وتضاربات عناوين IP.',
    descEn: 'Quick summary of total candidates, high/medium risk cases, safe cases, and IP address conflicts.',
  },
  {
    target: '#exam-performance-section',
    titleAr: 'تحليل الأداء والخطورة',
    titleEn: 'Performance & Risk Analysis',
    descAr: 'يربط بين مستويات صعوبة الامتحانات ومتوسط مؤشرات الخطورة السلوكية. يمكنك التبديل بين عرض الأعمدة والرادار.',
    descEn: 'Correlates exam difficulty levels with behavioral risk metrics. Toggle between bar and radar chart views.',
  },
  {
    target: '#alerts-section',
    titleAr: 'سجل الإنذارات',
    titleEn: 'Alerts Log',
    descAr: 'قائمة بالطلاب الذين تجاوزوا حد الأمان المحدد. يعرض مسببات الخطورة مثل تبديل الإطارات، النسخ واللصق، مغادرة الشاشة.',
    descEn: 'List of students who exceeded the safety threshold. Shows risk triggers like tab switches, copy/paste, and window defocus.',
  },
  {
    target: '#temporal-cheat-heatmap-section',
    titleAr: 'البصمة الزمنية',
    titleEn: 'Temporal Heatmap',
    descAr: 'خريطة حرارية تظهر فترات النشاط المشبوه عبر زمن الاختبار. الألوان الداكنة = آمن، الحمراء = بؤر خطيرة. اضغط على أي خلية لتفاصيل الطلاب المساهمين.',
    descEn: 'Heatmap showing suspicious activity periods across exam time. Dark = safe, Red = critical hotspots. Click any cell for student details.',
  },
  {
    target: '#charts-section',
    titleAr: 'الرسوم البيانية',
    titleEn: 'Charts & Analytics',
    descAr: 'رسوم بيانية متقدمة: منحنى توزيع الخطورة، مقارنة الوسائط، وتحليل أنماط الغش لتقييم أداء القاعة.',
    descEn: 'Advanced charts: risk distribution curve, mode comparison, and cheat pattern analysis for classroom assessment.',
  },
  {
    target: '#ip-comparison-section',
    titleAr: 'أداة المقارنة',
    titleEn: 'IP Comparison Tool',
    descAr: 'تقارن عناوين IP وزمن الحل بين الطلاب لاكتشاف حالات التطابق والتضارب التي تشير إلى غش منظم.',
    descEn: 'Compares IP addresses and solve times between students to detect matches and conflicts indicating organized cheating.',
  },
  {
    target: '#forensic-inspector-section',
    titleAr: 'المحقق الجنائي',
    titleEn: 'Forensic Inspector',
    descAr: 'أداة تحقيق عميقة تفحص تسلسل الأحداث لكل طالب: توقيت تبديل الإطارات، عمليات الحافظة، وفترات مغادرة الشاشة.',
    descEn: 'Deep investigation tool examining per-student event sequences: tab switch timing, clipboard operations, and focus loss periods.',
  },
];

export default function SiteTour({ lang, isLightMode }: { lang: 'ar' | 'en'; isLightMode?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const startTour = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTour = () => {
    setIsOpen(false);
  };

  if (!visible && !isOpen) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Floating help button */}
      {!isOpen && (
        <button
          onClick={startTour}
          className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${
            isLightMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title={lang === 'ar' ? 'جولة تعريفية' : 'Site Tour'}
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div
            className={`relative w-[90vw] max-w-lg rounded-2xl shadow-2xl p-6 transition-all duration-300 ${
              isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
          >
            {/* Close button */}
            <button
              onClick={closeTour}
              className={`absolute top-3 right-3 p-1 rounded-lg transition-colors cursor-pointer ${
                isLightMode ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step indicator */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentStep + 1} / {tourSteps.length}
                </span>
                <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                  />
                </div>
              </div>
              <h3 className={`text-lg font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {lang === 'ar' ? step.titleAr : step.titleEn}
              </h3>
            </div>

            {/* Description */}
            <div className={`p-4 rounded-xl mb-6 text-sm leading-relaxed ${
              isLightMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'
            }`}>
              {lang === 'ar' ? step.descAr : step.descEn}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentStep === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : isLightMode
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'السابق' : 'Prev'}
              </button>

              {currentStep < tourSteps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isLightMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {lang === 'ar' ? 'التالي' : 'Next'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={closeTour}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isLightMode
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {lang === 'ar' ? 'ابدأ الاستخدام' : 'Start Using'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
