import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface IntegrityProfileProps {
  studentId: string | number;
  studentName: string;
  sizeClass?: string;
  lang?: 'ar' | 'en';
  isLightMode?: boolean;
}

export default function IntegrityProfile({
  studentId,
  studentName,
  sizeClass = "w-8 h-8",
  lang = "ar",
  isLightMode = false,
}: IntegrityProfileProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasPhoto, setHasPhoto] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const getInitialsAndHash = (name: string) => {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    let initials = '';
    
    if (parts.length > 0) {
      const firstPart = parts[0];
      const firstLetter = Array.from(firstPart)[0];
      if (firstLetter) initials += firstLetter;
      
      if (parts.length > 1) {
        const secondPart = parts[1];
        const secondLetter = Array.from(secondPart)[0];
        if (secondLetter) initials += secondLetter;
      }
    }
    initials = initials.toUpperCase();

    const colors = [
      'from-blue-600 to-indigo-700 text-blue-100',
      'from-emerald-600 to-teal-700 text-emerald-100',
      'from-purple-600 to-pink-700 text-purple-100',
      'from-orange-600 to-red-700 text-orange-100',
      'from-fuchsia-600 to-rose-700 text-fuchsia-100',
      'from-cyan-600 to-blue-700 text-cyan-100'
    ];
    
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = colors[Math.abs(hash) % colors.length];
    
    return { initials, colorClass };
  };

  const { initials, colorClass } = getInitialsAndHash(studentName);

  useEffect(() => {
    let active = true;
    const fetchPhoto = async () => {
      setLoading(true);
      setErrorStatus(false);
      try {
        const response = await fetch(`/api/moodle/profile-photo?studentId=${encodeURIComponent(studentId)}`);
        const data = await response.json();
        if (active) {
          if (data.success && data.photoUrl) {
            setPhotoUrl(data.photoUrl);
            setHasPhoto(true);
          } else {
            setPhotoUrl(null);
            setHasPhoto(false);
          }
        }
      } catch {
        if (active) {
          setErrorStatus(true);
          setHasPhoto(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPhoto();
    return () => { active = false; };
  }, [studentId]);

  const handleMouseEnter = () => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const popupWidth = 256;
      const gap = 8;
      let left: number;
      if (lang === 'ar') {
        left = rect.left - popupWidth - gap;
        if (left < 8) {
          left = rect.right + gap;
          if (left + popupWidth > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - popupWidth - 8);
          }
        }
      } else {
        left = rect.right + gap;
        if (left + popupWidth > window.innerWidth - 8) {
          left = rect.left - popupWidth - gap;
          if (left < 8) {
            left = 8;
          }
        }
      }
      setPopupPos({ top: rect.bottom + 4, left });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPopupPos(null);
  };

  return (
    <>
      <div
        ref={avatarRef}
        className="relative inline-block shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {hasPhoto && photoUrl ? (
          <div className={`${sizeClass} rounded-full overflow-hidden border border-slate-700 shadow-md relative group select-none`}>
            <img 
              src={photoUrl} 
              alt={studentName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => {
                setHasPhoto(false);
                setPhotoUrl(null);
              }}
            />
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900 border border-slate-900"></span>
          </div>
        ) : (
          <div className={`${sizeClass} rounded-full flex items-center justify-center text-[10px] font-black select-none bg-gradient-to-br shadow-inner border border-slate-800 ${colorClass}`}>
            {initials || "ST"}
          </div>
        )}
      </div>

      {isHovered && popupPos && (
        <div
          className="fixed z-[99999] w-64 rounded-xl p-4 shadow-2xl border animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: popupPos.top,
            left: popupPos.left,
            backgroundColor: isLightMode ? '#ffffff' : '#0f172a',
            borderColor: isLightMode ? '#e2e8f0' : '#1e293b',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-3">
            <div className={`flex items-center gap-2 border-b pb-2 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
              <UserCheck className={`w-4 h-4 shrink-0 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <div className="min-w-0 flex-1">
                <span className={`block text-xs font-black truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{studentName}</span>
                <span className={`block text-[9px] font-mono ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>Moodle ID: {studentId}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div className={`flex justify-between items-center p-1.5 rounded border ${isLightMode ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-950/40 text-slate-300 border-slate-950'}`}>
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'ar' ? 'صورة البيومترية لمودل:' : 'Moodle Portrait Photo:'}
                </span>
                {loading ? (
                  <span className="text-slate-500 font-mono text-[9px] animate-pulse">
                    {lang === 'ar' ? 'جاري التحقق...' : 'Loading...'}
                  </span>
                ) : hasPhoto ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {lang === 'ar' ? 'مسجلة ✓' : 'VERIFIED ✓'}
                  </span>
                ) : (
                  <span className="text-amber-600 text-[9.5px] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {lang === 'ar' ? 'غير متوفر ⚠️' : 'NOT FOUND ⚠️'}
                  </span>
                )}
              </div>

              <div className={`flex justify-between items-center p-1.5 rounded border ${isLightMode ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-950/40 text-slate-300 border-slate-950'}`}>
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'ar' ? 'حالة النزاهة والهوية:' : 'Assurance Rating:'}
                </span>
                <span className={`font-black ${hasPhoto ? (isLightMode ? 'text-emerald-600' : 'text-emerald-400') : ''}`}>
                  {hasPhoto ? (lang === 'ar' ? 'مثبتة (مستوى أ)' : 'CLASS A (Verified)') : (lang === 'ar' ? 'بديل حيوي' : 'Standard Fallback')}
                </span>
              </div>
              
              <div className={`p-1 px-2 text-[9px] leading-tight font-medium rounded border ${isLightMode ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-500 border-slate-850/60'}`}>
                {lang === 'ar' 
                  ? 'يتم استدعاء الصورة آلياً من مخزن API الموحد لنظام إدارة التعلم مودل.'
                  : 'Retrieval triggers standard OAuth credentials mapping via proctoring interface.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
