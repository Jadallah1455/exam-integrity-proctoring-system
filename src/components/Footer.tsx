interface FooterProps {
  currentT: Record<string, string>;
  isLightMode: boolean;
}

export default function Footer({ currentT, isLightMode }: FooterProps) {
  return (
    <footer className={`py-8 px-6 text-center text-xs mt-auto ${isLightMode ? 'text-slate-400 border-t border-slate-200 bg-white' : 'text-slate-500 border-t border-slate-900 bg-slate-900/40'}`}>
      <div className="max-w-7xl mx-auto space-y-3 font-sans">
        <p>{currentT.footerTitle}</p>
        <p className="font-mono text-[10px]">{currentT.footerCopyright}</p>
      </div>
    </footer>
  );
}
