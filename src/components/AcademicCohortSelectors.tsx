import { UserCog, BookOpen, FileText } from 'lucide-react';

interface Teacher {
  id: string; nameAr: string; nameEn: string;
}
interface Subject {
  id: string; teacherId: string; nameAr: string; nameEn: string;
}
interface Exam {
  id: string; subjectId: string; nameAr: string; nameEn: string;
}

interface AcademicCohortSelectorsProps {
  selectedTeacherId: string;
  selectedSubjectId: string;
  selectedExamId: string;
  teachers: Teacher[];
  subjects: Subject[];
  exams: Exam[];
  lang: string;
  isLightMode: boolean;
  onTeacherChange: (teacherId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onExamChange: (examId: string) => void;
}

export default function AcademicCohortSelectors({
  selectedTeacherId,
  selectedSubjectId,
  selectedExamId,
  teachers,
  subjects,
  exams,
  lang,
  isLightMode,
  onTeacherChange,
  onSubjectChange,
  onExamChange,
}: AcademicCohortSelectorsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex flex-col gap-0.5 min-w-0 w-full sm:w-auto sm:min-w-[130px] lg:min-w-[150px]">
        <label className={`text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 ${isLightMode ? 'text-slate-600' : 'text-slate-450'}`}>
          <UserCog className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLightMode ? 'text-blue-500' : 'text-blue-400'}`} />
          <span className="truncate">{lang === 'ar' ? 'الأستاذ المراقب:' : 'Proctor / Teacher:'}</span>
        </label>
        <div className="relative">
          <select
            value={selectedTeacherId}
            onChange={(e) => onTeacherChange(e.target.value)}
            className={`w-full text-xs rounded-lg pl-2 pr-7 py-1.5 sm:py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer ${isLightMode ? 'bg-white border border-slate-300 text-slate-700' : 'bg-slate-950 border border-slate-800 text-slate-200'}`}
          >
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {lang === 'ar' ? t.nameAr : t.nameEn}
              </option>
            ))}
          </select>
          <span className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-[8px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-450'}`}>▼</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 w-full sm:w-auto sm:min-w-[130px] lg:min-w-[150px]">
        <label className={`text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          <BookOpen className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLightMode ? 'text-emerald-500' : 'text-emerald-400'}`} />
          <span className="truncate">{lang === 'ar' ? 'المادة الدراسية:' : 'Subject:'}</span>
        </label>
        <div className="relative">
          <select
            value={selectedSubjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            className={`w-full text-xs rounded-lg pl-2 pr-7 py-1.5 sm:py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer ${isLightMode ? 'bg-white border border-slate-300 text-slate-700' : 'bg-slate-950 border border-slate-800 text-slate-200'}`}
          >
            {subjects.filter(s => s.teacherId === selectedTeacherId).map(s => (
              <option key={s.id} value={s.id}>
                {lang === 'ar' ? s.nameAr : s.nameEn}
              </option>
            ))}
          </select>
          <span className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-[8px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-450'}`}>▼</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 w-full sm:w-auto sm:min-w-[160px] lg:min-w-[180px]">
        <label className={`text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 ${isLightMode ? 'text-slate-600' : 'text-slate-450'}`}>
          <FileText className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLightMode ? 'text-amber-500' : 'text-amber-400'}`} />
          <span className="truncate">{lang === 'ar' ? 'الامتحان النشط:' : 'Active Exam:'}</span>
        </label>
        <div className="relative">
          <select
            value={selectedExamId}
            onChange={(e) => onExamChange(e.target.value)}
            className={`w-full text-xs font-bold rounded-lg pl-2 pr-7 py-1.5 sm:py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer ${isLightMode ? 'bg-white border border-blue-300 text-blue-700' : 'bg-slate-950 border border-blue-500/40 text-blue-300'}`}
          >
            {exams.filter(ex => ex.subjectId === selectedSubjectId).map(ex => (
              <option key={ex.id} value={ex.id}>
                {lang === 'ar' ? ex.nameAr : ex.nameEn}
              </option>
            ))}
          </select>
          <span className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-[8px] font-bold ${isLightMode ? 'text-blue-500' : 'text-blue-400'}`}>▼</span>
        </div>
      </div>
    </div>
  );
}
