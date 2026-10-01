import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtitle = 'آکادمی فناوری و آموزش تخصصی'
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const dimensionClass = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular Logo Container */}
      <div
        className={`${dimensionClass} relative rounded-full overflow-hidden shrink-0 bg-white p-0.5 shadow-md border-2 border-slate-800 dark:border-slate-700 flex items-center justify-center transition-transform hover:scale-105`}
      >
        <img
          src="/app-logo.jpg"
          alt="لوگوی رسمی رمز دانش"
          className="w-full h-full object-contain rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== '/src/assets/images/ramz_danesh_logo_1790837789382.jpg') {
              target.src = '/src/assets/images/ramz_danesh_logo_1790837789382.jpg';
            }
          }}
        />
      </div>

      {/* Optional Brand Text */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-black text-sm tracking-tight leading-snug">
              رمز دانش
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
              RAMZ
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
