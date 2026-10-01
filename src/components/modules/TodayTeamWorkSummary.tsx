import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyReport, User } from '../../types';
import {
  getTodayPersianDate,
  getPersianFullDateInfo,
  normalizeDigits
} from '../../utils/dateUtils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Eye,
  FileCheck,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Check,
  Timer,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  FileText
} from 'lucide-react';

interface TodayTeamWorkSummaryProps {
  onSelectReport?: (report: DailyReport) => void;
  onReviewReport?: (report: DailyReport) => void;
  onFilterByIntern?: (internId: string) => void;
  selectedInternId?: string;
  className?: string;
}

export const TodayTeamWorkSummary: React.FC<TodayTeamWorkSummaryProps> = ({
  onSelectReport,
  onReviewReport,
  onFilterByIntern,
  selectedInternId = 'all',
  className = ''
}) => {
  const {
    users,
    dailyReports,
    currentUser,
    projects,
    sendNotification,
    addDailyReport
  } = useApp();

  const todayPersianStr = getTodayPersianDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayPersianStr);
  const [filterMode, setFilterMode] = useState<'all' | 'submitted' | 'pending'>('all');
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [remindedUserIds, setRemindedUserIds] = useState<{ [id: string]: boolean }>({});
  const [reminderAllSent, setReminderAllSent] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Get date information for display
  const dateInfo = useMemo(() => {
    try {
      if (selectedDate === todayPersianStr) {
        return getPersianFullDateInfo();
      }
      return {
        fullFormatted: selectedDate,
        weekday: '',
        shortFormatted: selectedDate
      };
    } catch {
      return {
        fullFormatted: selectedDate,
        weekday: '',
        shortFormatted: selectedDate
      };
    }
  }, [selectedDate, todayPersianStr]);

  // All interns (or users who should submit reports)
  const internsList: User[] = useMemo(() => {
    const list = users.filter(u => u.role === 'intern');
    if (list.length > 0) return list;
    // Fallback: any user who has reports
    const internIdsWithReports = new Set(dailyReports.map(r => r.internId));
    const fallback = users.filter(u => internIdsWithReports.has(u.id));
    return fallback.length > 0 ? fallback : users.filter(u => u.role !== 'admin');
  }, [users, dailyReports]);

  // Reports matching selected date
  const reportsForDate = useMemo(() => {
    const normTarget = normalizeDigits(selectedDate);
    return dailyReports.filter(r => normalizeDigits(r.date) === normTarget);
  }, [dailyReports, selectedDate]);

  // Map each intern to their report for this date (if any)
  const teamStatusList = useMemo(() => {
    return internsList.map(intern => {
      // Find report for this intern on selectedDate
      const report = reportsForDate.find(r => r.internId === intern.id);

      // Find last known report for this intern (if no report today)
      let lastReport: DailyReport | undefined;
      if (!report) {
        const internReports = dailyReports
          .filter(r => r.internId === intern.id)
          .sort((a, b) => b.date.localeCompare(a.date));
        lastReport = internReports[0];
      }

      return {
        intern,
        report,
        hasReport: Boolean(report),
        lastReport
      };
    });
  }, [internsList, reportsForDate, dailyReports]);

  // Statistics
  const totalCount = teamStatusList.length;
  const submittedCount = teamStatusList.filter(t => t.hasReport).length;
  const pendingCount = totalCount - submittedCount;
  const totalWorkedHours = teamStatusList.reduce((acc, curr) => acc + (curr.report?.workedHours || 0), 0);
  const participationRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  // Filtered list based on filterMode
  const displayedTeamList = useMemo(() => {
    return teamStatusList.filter(item => {
      if (filterMode === 'submitted') return item.hasReport;
      if (filterMode === 'pending') return !item.hasReport;
      return true;
    });
  }, [teamStatusList, filterMode]);

  // Navigation between days
  const handleStepDay = (step: number) => {
    const parts = normalizeDigits(selectedDate).split('/');
    if (parts.length === 3) {
      let y = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let d = parseInt(parts[2], 10) + step;
      if (d < 1) {
        d = 30;
        m -= 1;
        if (m < 1) {
          m = 12;
          y -= 1;
        }
      } else if (d > 30) {
        d = 1;
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
      }
      setSelectedDate(`${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`);
    }
  };

  const handleResetToToday = () => {
    setSelectedDate(todayPersianStr);
  };

  // Send reminder notification to a single intern
  const handleSendReminder = (intern: User) => {
    sendNotification(
      'یادآوری ثبت گزارش کار روزانه',
      `کارآموز گرامی ${intern.name}، لطفاً گزارش کار روزانه امروز (${selectedDate}) خود را در بخش گزارش‌ها ثبت نمایید.`,
      'user',
      intern.id,
      'high'
    );
    setRemindedUserIds(prev => ({ ...prev, [intern.id]: true }));
    setTimeout(() => {
      setRemindedUserIds(prev => ({ ...prev, [intern.id]: false }));
    }, 4000);
  };

  // Send reminder to all pending interns
  const handleSendReminderToAll = () => {
    const pendingInterns = teamStatusList.filter(t => !t.hasReport).map(t => t.intern);
    pendingInterns.forEach(intern => {
      sendNotification(
        'یادآوری فوری ثبت گزارش کار روزانه',
        `همکار گرامی ${intern.name}، گزارش کار روزانه شما برای تاریخ ${selectedDate} هنوز دریافت نشده است. لطفاً نسبت به ثبت آن اقدام فرمایید.`,
        'user',
        intern.id,
        'high'
      );
    });
    setReminderAllSent(true);
    setTimeout(() => setReminderAllSent(false), 4000);
  };

  // Generate a realistic sample report for today if manager wants to test immediately
  const handleAddSampleReportForTesting = () => {
    const targetIntern = internsList.find(i => !reportsForDate.some(r => r.internId === i.id)) || internsList[0];
    if (!targetIntern) return;

    const sampleProject = projects[0]?.title || 'سامانه جامع مدیریت آکادمی شکوه دانش (shoukoh danesh)';
    const sampleTasks = 'تکمیل کامپوننت فرم ثبت‌نام دوره‌ها، رفع باگ ریسپانسیو در تبلت، تست نهایی سناریوهای اتصال به پایگاه داده و هماهنگی با مدیر فنی.';
    const sampleProblems = 'چالش تطبیق فونت فارسی وزیر در خروجی PDF که با به‌روزرسانی استایل مرتفع شد.';

    addDailyReport({
      internId: targetIntern.id,
      internName: targetIntern.name,
      internAvatar: targetIntern.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      date: selectedDate,
      clockIn: '08:30',
      clockOut: '16:30',
      workedHours: 8,
      projectId: projects[0]?.id || 'proj-sample-1',
      projectTitle: sampleProject,
      tasksDone: sampleTasks,
      problemsEncountered: sampleProblems,
      tomorrowsPlan: 'آزمون بارگذاری مستندات و اتصال به سرویس پیام‌رسان بله',
      progressAdded: 15,
      pdfFileName: `گزارش_کار_${targetIntern.name.replace(/ /g, '_')}_${selectedDate.replace(/\//g, '-')}.pdf`,
      pdfFileSize: '480 KB',
      pdfAnalyzed: true,
      aiFiveLineAnalysis: {
        line1HoursWorked: '۸ ساعت کارکرد کامل و مفید از ۸:۳۰ تا ۱۶:۳۰',
        line2TimeWastedOrGaps: 'بدون اتلاف وقت مشهود، تمرکز مستقیم بر روی وظایف محوله',
        line3TasksAccomplished: 'تکمیل کامپوننت فرم ثبت‌نام و برطرف‌سازی باگ ریسپانسیو تبلت',
        line4TechnicalChallenges: 'مسئله فونت وزیر در تبدیل مستندات که با موفقیت حل گردید',
        line5ProjectDecisionGuidance: 'پیشرفت عالی و آماده ادغام در نسخه اصلی پروژه'
      },
      status: 'submitted'
    });

    setDemoNotice(`یک گزارش کار نمونه برای «${targetIntern.name}» در تاریخ ${selectedDate} با موفقیت ثبت شد.`);
    setTimeout(() => setDemoNotice(null), 5000);
  };

  const isToday = normalizeDigits(selectedDate) === normalizeDigits(todayPersianStr);

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/90 dark:border-blue-900/50 shadow-md shadow-blue-500/5 overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-l from-blue-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                کادر وضعیت کار امروز تیم (هر کی امروز چی کار کرده؟)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 border border-white/20 text-white backdrop-blur-sm">
                {isToday ? 'امروز' : 'تاریخ انتخابی'}
              </span>
            </div>
            <p className="text-xs text-blue-100 opacity-95">
              پایش لحظه‌ای فعالیت، ساعات حضور و شرح وظایف انجام‌شده توسط کارآموزان و پرسنل
            </p>
          </div>

          {/* Date Navigator Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="flex items-center bg-black/20 backdrop-blur-md rounded-xl p-1 border border-white/10 text-xs">
              <button
                onClick={() => handleStepDay(1)}
                title="روز بعد"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 font-mono font-bold text-xs tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-200" />
                <span>{selectedDate}</span>
              </div>

              <button
                onClick={() => handleStepDay(-1)}
                title="روز قبل"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                onClick={handleResetToToday}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1"
                title="بازگشت به تاریخ امروز"
              >
                <RotateCcw className="w-3 h-3" />
                امروز
              </button>
            )}

            <button
              onClick={() => setIsCompact(prev => !prev)}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-xl border border-white/15 transition-all"
            >
              {isCompact ? 'نمایش با جزئیات' : 'نمایش فشرده'}
            </button>
          </div>
        </div>

        {/* Quick Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/15 text-xs">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
            <div className="text-blue-100 text-[11px] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-200" />
              کل کارآموزان
            </div>
            <div className="text-lg font-black text-white mt-0.5 font-mono">
              {totalCount} <span className="text-[11px] font-normal opacity-80">نفر</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
            <div className="text-emerald-100 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              گزارش ثبت شده
            </div>
            <div className="text-lg font-black text-emerald-300 mt-0.5 font-mono">
              {submittedCount}{' '}
              <span className="text-[11px] font-normal text-emerald-100 opacity-90">({participationRate}٪)</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
            <div className="text-amber-100 text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              در انتظار گزارش
            </div>
            <div className="text-lg font-black text-amber-300 mt-0.5 font-mono">
              {pendingCount} <span className="text-[11px] font-normal opacity-80">نفر</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
            <div className="text-indigo-100 text-[11px] flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-indigo-200" />
              مجموع کارکرد امروز
            </div>
            <div className="text-lg font-black text-white mt-0.5 font-mono">
              {totalWorkedHours}{' '}
              <span className="text-[11px] font-normal opacity-80">ساعت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Action Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium text-[11px]">نمایش:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            همه ({totalCount})
          </button>
          <button
            onClick={() => setFilterMode('submitted')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterMode === 'submitted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            گزارش‌داده‌ها ({submittedCount})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterMode === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-amber-400" />
            بدون گزارش ({pendingCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleSendReminderToAll}
              disabled={reminderAllSent}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all"
            >
              {reminderAllSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  یادآوری به همه ارسال شد
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  ارسال یادآوری به {pendingCount} نفر بدون گزارش
                </>
              )}
            </button>
          )}

          {submittedCount === 0 && (
            <button
              onClick={handleAddSampleReportForTesting}
              className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
              title="جهت تست سریع مدیر، یک گزارش کار نمونه برای امروز ثبت می‌کند"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ثبت گزارش نمونه برای تست
            </button>
          )}
        </div>
      </div>

      {/* Demo notification alert if triggered */}
      {demoNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-2 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {demoNotice}
          </span>
          <button onClick={() => setDemoNotice(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Team Members Work Cards List */}
      <div className="p-4 sm:p-5 space-y-3">
        {displayedTeamList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs">موردی با این فیلتر یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayedTeamList.map(({ intern, report, hasReport, lastReport }) => {
              const isReminded = remindedUserIds[intern.id];
              const isSelectedInParent = selectedInternId === intern.id;

              return (
                <div
                  key={intern.id}
                  className={`rounded-xl border transition-all p-3.5 sm:p-4 ${
                    hasReport
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                      : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30 hover:border-amber-300'
                  } ${isSelectedInParent ? 'ring-2 ring-blue-500 bg-blue-50/40 dark:bg-blue-950/30' : ''}`}
                >
                  {/* Member Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar with status indicator dot */}
                      <div className="relative shrink-0">
                        {intern.avatar ? (
                          <img
                            src={intern.avatar}
                            alt={intern.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {intern.name.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            hasReport ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                          }`}
                          title={hasReport ? 'گزارش ثبت شده' : 'هنوز گزارش نداده'}
                        />
                      </div>

                      {/* Name & Role */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {intern.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                            {intern.phone || intern.email}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{intern.bio || 'کارآموز واحد فنی'}</span>
                          {onFilterByIntern && (
                            <button
                              onClick={() => onFilterByIntern(isSelectedInParent ? 'all' : intern.id)}
                              className={`text-[10px] underline font-medium ${
                                isSelectedInParent ? 'text-red-500 font-bold' : 'text-blue-500 hover:text-blue-600'
                              }`}
                            >
                              {isSelectedInParent ? '✕ لغو فیلتر لیست' : '🔍 فیلتر این کارآموز در لیست'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Report Status Badge & Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {hasReport && report ? (
                        <>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                              report.status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : report.status === 'needs_revision'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200'
                            }`}
                          >
                            {report.status === 'approved' && '✔ تأیید شده'}
                            {report.status === 'needs_revision' && '⚠️ نیاز به بازنگری'}
                            {report.status === 'submitted' && '⏳ در انتظار بررسی'}
                            {report.status === 'rejected' && '❌ رد شده'}
                          </span>

                          {onSelectReport && (
                            <button
                              onClick={() => onSelectReport(report)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              مشاهده کامل
                            </button>
                          )}

                          {currentUser.role !== 'intern' && onReviewReport && (
                            <button
                              onClick={() => onReviewReport(report)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              ثبت نظر / تأیید
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            هنوز گزارش امروز را ثبت نکرده است
                          </span>

                          <button
                            onClick={() => handleSendReminder(intern)}
                            disabled={isReminded}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                          >
                            {isReminded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                یادآوری ارسال شد
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                ارسال یادآوری فوری
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Member Work Body (When Reported) */}
                  {hasReport && report && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
                      {/* Project & Hours Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-slate-400 text-[11px]">پروژه:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {report.projectTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {report.clockIn} الی {report.clockOut}
                            </span>
                            <span className="text-[11px] bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded-md font-sans">
                              ({report.workedHours} ساعت)
                            </span>
                          </div>

                          {report.progressAdded ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                              <TrendingUp className="w-3 h-3" />
                              +{report.progressAdded}٪ پیشرفت
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* What was done today (Tasks Description) */}
                      {!isCompact && (
                        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-[11px]">
                              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              شرح کارهای انجام‌شده امروز (چی کار کرده؟):
                            </span>
                            {report.pdfFileName && (
                              <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                📎 پیوست: {report.pdfFileName}
                              </span>
                            )}
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium pr-1">
                            {report.tasksDone || 'گزارش کار ثبت شده بدون شرح تفصیلی'}
                          </p>

                          {/* AI 5-line summary highlights if available */}
                          {report.aiFiveLineAnalysis && (
                            <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/60 flex items-start gap-1.5 text-[11px] text-indigo-900 dark:text-indigo-300 bg-white/60 dark:bg-slate-900/60 p-2 rounded-md">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-bold">خلاصه تحلیل هوش مصنوعی: </strong>
                                <span>{report.aiFiveLineAnalysis.line3TasksAccomplished}</span>
                                {report.aiFiveLineAnalysis.line5ProjectDecisionGuidance && (
                                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    💡 توصیه AI: {report.aiFiveLineAnalysis.line5ProjectDecisionGuidance}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Problems / Challenges if any */}
                          {report.problemsEncountered && (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-bold">چالش / مشکل گزارش‌شده: </span>
                              <span className="truncate">{report.problemsEncountered}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* When NOT Reported: Last Report Details */}
                  {!hasReport && (
                    <div className="mt-2.5 pt-2.5 border-t border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {lastReport ? (
                            <>
                              آخرین گزارش کار ثبت شده: <strong className="font-mono text-slate-700 dark:text-slate-300">{lastReport.date}</strong> (پروژه: {lastReport.projectTitle})
                            </>
                          ) : (
                            'تاکنون هیچ گزارش کاری از این کارآموز ثبت نشده است.'
                          )}
                        </span>
                      </div>

                      {lastReport && onSelectReport && (
                        <button
                          onClick={() => onSelectReport(lastReport)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px]"
                        >
                          مشاهده آخرین گزارش ثبت‌شده ◀
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
