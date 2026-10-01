import React from 'react';
import { useApp } from '../../context/AppContext';
import { GroupLinksSection } from '../common/GroupLinksSection';
import {
  Share2,
  Radio,
  ExternalLink
} from 'lucide-react';

export const MessagesModule: React.FC = () => {
  const { currentUser, getVisibleGroupLinksForUser } = useApp();
  const myVisibleGroups = getVisibleGroupLinksForUser(currentUser);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-blue-500" />
              مرکز پیام‌رسان‌ها و لینک گروه‌های آکادمی
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
              <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
              متصل به بله، ایتا و پیام‌رسان‌ها
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دسترسی سریع به گروه‌های کلاسی، کارآموزی، هماهنگی اساتید و کانال‌های رسمی اطلاع‌رسانی به تفکیک نقش و دوره
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800">
            تعداد گروه‌های مجاز برای شما: <span className="font-mono">{myVisibleGroups.length}</span> گروه
          </span>
          <a
            href="https://ble.ir/join/8PR5Yn669h"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            title="ورود به گروه رسمی بله آکادمی"
          >
            <span>ورود به بله</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Groups & Messenger Links Content */}
      <GroupLinksSection />
    </div>
  );
};
