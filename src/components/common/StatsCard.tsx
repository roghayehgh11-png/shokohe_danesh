import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'info',
  onClick
}) => {
  let badgeColor = 'text-blue-500 dark:text-blue-400';
  if (badgeType === 'success') badgeColor = 'text-green-500 dark:text-green-400';
  if (badgeType === 'warning') badgeColor = 'text-amber-500 dark:text-amber-400';
  if (badgeType === 'danger') badgeColor = 'text-rose-500 dark:text-rose-400';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
        onClick ? 'cursor-pointer hover:shadow' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">
          {title}
        </span>
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      </div>

      <div className="flex items-end justify-between mt-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono leading-none">
          {value}
        </span>
        {badgeText && (
          <span className={`text-xs font-mono ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
