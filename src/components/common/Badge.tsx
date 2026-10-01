import React from 'react';
import { ProjectStatus, ProjectPriority, LeadStatus, DailyReportStatus } from '../../types';

interface BadgeProps {
  type: 'project_status' | 'project_priority' | 'lead_status' | 'report_status' | 'patent_stage' | 'custom';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  let label = value;
  let bg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  if (type === 'project_status') {
    switch (value as ProjectStatus) {
      case 'new':
        label = 'جدید';
        bg = 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
        break;
      case 'in_progress':
        label = 'در حال انجام';
        bg = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
        break;
      case 'needs_review':
        label = 'نیازمند بازبینی';
        bg = 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
        break;
      case 'completed':
        label = 'تکمیل شده';
        bg = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
        break;
      case 'archived':
        label = 'آرشیو شده';
        bg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        break;
    }
  } else if (type === 'project_priority') {
    switch (value as ProjectPriority) {
      case 'urgent':
        label = 'فوری';
        bg = 'bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-300';
        break;
      case 'high':
        label = 'بالا';
        bg = 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
        break;
      case 'medium':
        label = 'متوسط';
        bg = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
        break;
      case 'low':
        label = 'پایین';
        bg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        break;
    }
  } else if (type === 'lead_status') {
    switch (value as LeadStatus) {
      case 'new_lead':
        label = 'مخاطب جدید';
        bg = 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
        break;
      case 'contacted':
        label = 'تماس گرفته شد';
        bg = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
        break;
      case 'consultation':
        label = 'جلسه مشاوره';
        bg = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        break;
      case 'pending_decision':
        label = 'در انتظار تصمیم';
        bg = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
        break;
      case 'enrolled':
        label = 'ثبت‌نام کرد';
        bg = 'bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300';
        break;
      case 'cancelled':
        label = 'انصراف داد';
        bg = 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        break;
    }
  } else if (type === 'report_status') {
    switch (value as DailyReportStatus) {
      case 'submitted':
        label = 'در انتظار بررسی';
        bg = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        break;
      case 'approved':
        label = 'تأیید شده';
        bg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        break;
      case 'needs_revision':
        label = 'نیازمند اصلاح';
        bg = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
        break;
    }
  } else if (type === 'patent_stage') {
    switch (value) {
      case 'idea_submission':
        label = '۱. ثبت ایده اولیه';
        bg = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
        break;
      case 'prior_art_search':
        label = '۲. استعلام سوابق اختراع';
        bg = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
        break;
      case 'specification_draft':
        label = '۳. تنظیم توصیفنامه و ادعانامه';
        bg = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
        break;
      case 'official_filing':
        label = '۴. پرونده رسمی اظهارنامه';
        bg = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        break;
      case 'registered':
        label = '۵. ثبت نهایی و صدور گواهی';
        bg = 'bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${bg} ${className}`}>
      {label}
    </span>
  );
};
