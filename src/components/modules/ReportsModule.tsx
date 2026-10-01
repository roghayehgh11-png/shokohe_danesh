import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  DollarSign,
  BookOpen,
  FolderKanban,
  FileText,
  Clock,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { TodayTeamWorkSummary } from './TodayTeamWorkSummary';
import { getTodayPersianDate, normalizeDigits } from '../../utils/dateUtils';

export const ReportsModule: React.FC = () => {
  const {
    tuitions,
    payments,
    expenses,
    users,
    courses,
    projects,
    dailyReports,
    customerLeads,
    setActiveModule
  } = useApp();

  const [selectedReportType, setSelectedReportType] = useState<
    'today_work' | 'financial' | 'students' | 'interns' | 'crm'
  >('today_work');

  const todayPersian = getTodayPersianDate();

  const handleExportCSV = () => {
    let headers = '';
    let rows = '';

    if (selectedReportType === 'today_work') {
      const todayReps = dailyReports.filter(r => normalizeDigits(r.date) === normalizeDigits(todayPersian));
      headers = 'کد,نام کارآموز,پروژه,ساعت ورود,ساعت خروج,ساعت کارکرد,شرح کار امروز,وضعیت\n';
      rows = todayReps.map(r => `${r.id},${r.internName},${r.projectTitle},${r.clockIn},${r.clockOut},${r.workedHours},"${(r.tasksDone || '').replace(/"/g, '""')}",${r.status}`).join('\n');
    } else if (selectedReportType === 'financial') {
      headers = 'کد,نام دانشجو,دوره,شهریه کل,پرداخت شده,باقی مانده,وضعیت\n';
      rows = tuitions.map(t => `${t.id},${t.studentName},${t.courseTitle},${t.finalAmount},${t.paidAmount},${t.remainingAmount},${t.status}`).join('\n');
    } else if (selectedReportType === 'students') {
      headers = 'کد,نام,تلفن,نقش,تاریخ ورود\n';
      rows = users.map(u => `${u.id},${u.name},${u.phone},${u.role},${u.joinDate}`).join('\n');
    } else if (selectedReportType === 'interns') {
      headers = 'کد,نام کارآموز,تاریخ,پروژه,ساعت ورود,ساعت خروج,ساعت کارکرد,کارهای انجام شده,وضعیت\n';
      rows = dailyReports.map(r => `${r.id},${r.internName},${r.date},${r.projectTitle},${r.clockIn},${r.clockOut},${r.workedHours},"${(r.tasksDone || '').replace(/"/g, '""')}",${r.status}`).join('\n');
    } else if (selectedReportType === 'crm') {
      headers = 'کد,نام متقاضی,تلفن,دوره,کانال آشنایی,وضعیت\n';
      rows = customerLeads.map(l => `${l.id},${l.fullName},${l.phone},${l.interestedCourseCategory},${l.referralSource},${l.status}`).join('\n');
    }

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `گزارش_${selectedReportType}_آکادمی_شکوه_دانش.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            مرکز گزارش‌های مدیریتی و خروجی‌های رسمی آکادمی شکوه دانش (shoukoh danesh)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پایش لحظه‌ای فعالیت امروز پرسنل، استخراج فایل اکسل (CSV) و خروجی چاپی از تمام بخش‌های آماری آکادمی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            دانلود فایل اکسل (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            چاپ گزارش
          </button>
        </div>
      </div>

      {/* Prominent Small Box: Today's Team Work Summary */}
      <TodayTeamWorkSummary
        onSelectReport={() => setActiveModule('daily_reports')}
        onReviewReport={() => setActiveModule('daily_reports')}
      />

      {/* Tabs Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedReportType('today_work')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            selectedReportType === 'today_work' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          گزارش کار امروز تیم
        </button>

        <button
          onClick={() => setSelectedReportType('financial')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            selectedReportType === 'financial' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          گزارش جامع مالی و شهریه‌ها
        </button>

        <button
          onClick={() => setSelectedReportType('students')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            selectedReportType === 'students' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          گزارش کاربران و پرسنل
        </button>

        <button
          onClick={() => setSelectedReportType('interns')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            selectedReportType === 'interns' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          سوابق کلیه گزارش‌های روزانه
        </button>

        <button
          onClick={() => setSelectedReportType('crm')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            selectedReportType === 'crm' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          گزارش جذب و لیدهای CRM
        </button>
      </div>

      {/* Report Data Table Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <span>پیش‌نمایش جدول خروجی</span>
            <span className="text-xs text-blue-600 font-mono">({selectedReportType})</span>
          </h3>

          {selectedReportType === 'today_work' && (
            <button
              onClick={() => setActiveModule('daily_reports')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              رفتن به ماژول تخصصی گزارش روزانه ◀
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {selectedReportType === 'today_work' && (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">نام کارآموز</th>
                  <th className="p-3">پروژه</th>
                  <th className="p-3">ساعت حضور</th>
                  <th className="p-3">مدت</th>
                  <th className="p-3">شرح فعالیت انجام‌شده امروز</th>
                  <th className="p-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dailyReports.filter(r => normalizeDigits(r.date) === normalizeDigits(todayPersian)).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      هنوز هیچ گزارش کاری برای تاریخ امروز ({todayPersian}) ثبت نشده است. از کادر بالای صفحه می‌توانید پیگیری و یادآوری ارسال کنید.
                    </td>
                  </tr>
                ) : (
                  dailyReports
                    .filter(r => normalizeDigits(r.date) === normalizeDigits(todayPersian))
                    .map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {r.internName?.charAt(0) || 'ک'}
                          </div>
                          <span>{r.internName}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{r.projectTitle}</td>
                        <td className="p-3 font-mono text-blue-600 font-bold">{r.clockIn} الی {r.clockOut}</td>
                        <td className="p-3 font-mono font-bold">{r.workedHours} ساعت</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.tasksDone}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {r.status === 'approved' ? 'تأیید شده' : 'در انتظار'}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {selectedReportType === 'financial' && (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">نام دانشجو</th>
                  <th className="p-3">دوره آموزشی</th>
                  <th className="p-3">شهریه مصوب</th>
                  <th className="p-3">مبلغ دریافتی</th>
                  <th className="p-3">باقی مانده</th>
                  <th className="p-3">وضعیت تسویه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tuitions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{t.studentName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{t.courseTitle}</td>
                    <td className="p-3 font-mono">{t.finalAmount.toLocaleString('fa-IR')} تومان</td>
                    <td className="p-3 font-mono text-emerald-600 font-bold">{t.paidAmount.toLocaleString('fa-IR')} تومان</td>
                    <td className="p-3 font-mono text-rose-600 font-bold">{t.remainingAmount.toLocaleString('fa-IR')} تومان</td>
                    <td className="p-3 font-bold">{t.status === 'paid' ? 'تسویه شده' : 'بدهکار'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReportType === 'students' && (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">نام کاربر</th>
                  <th className="p-3">شماره تماس</th>
                  <th className="p-3">نقش سیستم</th>
                  <th className="p-3">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{u.phone}</td>
                    <td className="p-3 font-bold text-blue-600">
                      {u.role === 'admin' ? 'مدیر کل' : u.role === 'teacher' ? 'مدرس' : u.role === 'intern' ? 'کارآموز' : 'دانشجو'}
                    </td>
                    <td className="p-3 font-mono text-slate-400">{u.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReportType === 'interns' && (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">نام کارآموز</th>
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">پروژه</th>
                  <th className="p-3">حضور</th>
                  <th className="p-3">ساعت کارکرد</th>
                  <th className="p-3">کارهای انجام شده</th>
                  <th className="p-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dailyReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      هیچ گزارش کاری تا این لحظه ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  dailyReports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{r.internName}</td>
                      <td className="p-3 font-mono">{r.date}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{r.projectTitle}</td>
                      <td className="p-3 font-mono">{r.clockIn} تا {r.clockOut}</td>
                      <td className="p-3 font-mono font-bold">{r.workedHours} ساعت</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.tasksDone}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {r.status === 'approved' ? 'تأیید شده' : 'در انتظار'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {selectedReportType === 'crm' && (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-3">نام متقاضی</th>
                  <th className="p-3">شماره همراه</th>
                  <th className="p-3">دوره مورد نظر</th>
                  <th className="p-3">کانال ورودی</th>
                  <th className="p-3">وضعیت پیگیری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customerLeads.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{l.fullName}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{l.phone}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{l.interestedCourseCategory || 'عمومی'}</td>
                    <td className="p-3 font-mono text-slate-400">{l.referralSource}</td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        l.status === 'registered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {l.status === 'registered' ? 'ثبت‌نام قطعی' : 'در حال پیگیری'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
