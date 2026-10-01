import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  BookOpen,
  FolderKanban,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  FileCheck,
  UserPlus,
  ArrowRight,
  Bell,
  Sparkles,
  ChevronLeft,
  MapPin,
  Phone,
  Building2,
  Wifi,
  Share2,
  ExternalLink
} from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const {
    currentUser,
    users,
    courses,
    projects,
    dailyReports,
    customerLeads,
    tuitions,
    payments,
    setActiveModule,
    notifications,
    getVisibleGroupLinksForUser
  } = useApp();

  const userVisibleGroups = getVisibleGroupLinksForUser(currentUser);

  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalInterns = users.filter(u => u.role === 'intern').length;

  const pendingReports = dailyReports.filter(r => r.status === 'submitted');
  const totalIncome = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalDebts = tuitions.reduce((acc, t) => acc + t.remainingAmount, 0);

  const newLeadsCount = customerLeads.filter(l => l.status === 'new_lead').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-800/50">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30 text-blue-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            سامانه جامع مدیریت آکادمی رمز دانش (Ramz Danesh)
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">
            سلام، مدیر گرامی! به پنل مدیریتی خوش آمدید.
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed opacity-90">
            خلاصه وضعیت امروز: {pendingReports.length} گزارش کارآموز منتظر بررسی، {newLeadsCount} متقاضی جدید در CRM و {tuitions.filter(t => t.remainingAmount > 0).length} پرونده دارای مانده شهریه.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10 flex-wrap">
          <button
            onClick={() => setActiveModule('financial')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" />
            ثبت تراکنش شهریه
          </button>
          <button
            onClick={() => setActiveModule('daily_reports')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4" />
            بررسی گزارش‌ها ({pendingReports.length})
          </button>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Student / Intern Academy Identity Card */}
      {currentUser.role !== 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <img
                src="/app-logo.jpg"
                alt="لوگوی رمز دانش"
                className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white p-0.5 object-contain shadow-sm shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/src/assets/images/ramz_danesh_logo_1790837789382.jpg';
                }}
              />
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  شناسنامه و مشخصات رسمی آکادمی رمز دانش
                </h2>
                <p className="text-[11px] text-slate-500">مشخصات معتبر مرکز و راه‌های ارتباطی جهت استفاده دانشجویان و کارآموزان</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200">
              ✔ مرکز رسمی مجاز فناوری اطلاعات
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                آدرس آکادمی:
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                مشهد، احمدآباد، خیابان عدالت، پلاک ۴۵
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                تلفن‌های تماس و پشتیبانی:
              </span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                ۰۵۱-۳۸۴۰۰۰۰۰ | ۰۹۱۲۰۰۰۰۰۰۰
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                ساعات کاری و پاسخگویی:
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                شنبه تا پنج‌شنبه: ۸:۰۰ الی ۲۰:۰۰
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                امکانات و مسیر دسترسی:
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                دسترسی مترو طالقانی، پارکینگ، ۳ سایت پیشرفته و فیبر نوری
              </p>
            </div>
          </div>
        </div>
      )}

      {/* High Density Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Students */}
        <div
          onClick={() => setActiveModule('users')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>دانشجویان کل</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalStudents} <span className="text-xs text-slate-400 font-sans font-normal">نفر</span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>+{totalInterns} کارآموز فعال</span>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </p>
        </div>

        {/* Metric 2: Courses */}
        <div
          onClick={() => setActiveModule('courses')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>دوره‌ها و کلاس‌های فعال</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {courses.length} <span className="text-xs text-slate-400 font-sans font-normal">کلاس</span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>با {totalTeachers} استاد تخصصی</span>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </p>
        </div>

        {/* Metric 3: Active Income */}
        <div
          onClick={() => setActiveModule('financial')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>درآمد کل واریزی</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalIncome.toLocaleString('fa-IR')} <span className="text-xs text-slate-400 font-sans font-normal">تومان</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center justify-between">
            <span>تراکنش‌های ثبت شده</span>
            <ChevronLeft className="w-4 h-4" />
          </p>
        </div>

        {/* Metric 4: Debtors Balance */}
        <div
          onClick={() => setActiveModule('financial')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <span>مانده طلب از شهریه‌ها</span>
            <span className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-300 font-mono">
            {totalDebts.toLocaleString('fa-IR')} <span className="text-xs font-sans font-normal">تومان</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center justify-between">
            <span>مشاهده بدهکاران</span>
            <ChevronLeft className="w-4 h-4" />
          </p>
        </div>
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 span): Pending Daily Reports & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Reports Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                گزارش‌های روزانه در انتظار بررسی ({pendingReports.length})
              </h3>
              <button
                onClick={() => setActiveModule('daily_reports')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                مشاهده همه
              </button>
            </div>

            <div className="space-y-3">
              {pendingReports.length > 0 ? (
                pendingReports.map(rep => (
                  <div key={rep.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rep.internAvatar ? (
                        <img src={rep.internAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {rep.internName ? rep.internName.charAt(0) : 'ک'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{rep.internName}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{rep.projectTitle} ({rep.workedHours} ساعت کار)</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModule('daily_reports')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow"
                    >
                      بررسی
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">تمامی گزارش‌های روزانه کارآموزان بررسی شده‌اند.</p>
              )}
            </div>
          </div>

          {/* Active Projects Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                پروژه‌های عملی فعال کارآموزان ({projects.length})
              </h3>
              <button
                onClick={() => setActiveModule('projects')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                مدیریت Kanban
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.slice(0, 4).map(p => (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{p.title}</h4>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">{p.progressPercentage}٪</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPercentage}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400">مسئول: {p.leadInternName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): CRM Leads & Notifications */}
        <div className="space-y-6">
          {/* CRM Quick Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                متقاضیان جدید CRM
              </h3>
              <button
                onClick={() => setActiveModule('users')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                مدیریت لیدها
              </button>
            </div>

            <div className="space-y-2.5">
              {customerLeads.slice(0, 4).map(lead => (
                <div key={lead.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{lead.fullName}</h4>
                    <span className="text-[10px] text-slate-400">{lead.interestedCourseCategory} ({lead.referralSource})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {lead.status === 'new_lead' ? 'لید جدید' : 'در حال پیگیری'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Group Links Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-500" />
                لینک گروه‌ها و کانال‌ها
              </h3>
              <button
                onClick={() => setActiveModule('messages')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                {currentUser.role === 'admin' ? 'مدیریت لینک‌ها' : 'مشاهده همه'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {userVisibleGroups.slice(0, 3).map(group => (
                <div
                  key={group.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {group.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {group.isPublic ? 'عمومی (همه اعضا)' : 'کلاسی / اختصاصی'}
                    </span>
                  </div>
                  <a
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 rounded-lg shrink-0 transition-colors"
                    title="ورود به گروه"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                اعلان‌های اخیر سیستم
              </h3>
              <button
                onClick={() => setActiveModule('notifications')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                ارسال اعلان
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {notifications.slice(0, 3).map(n => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{n.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
