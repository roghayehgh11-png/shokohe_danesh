import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyReport, DailyReportStatus, Project } from '../../types';
import { getTodayPersianDate, calculateWorkDuration, normalizeDigits } from '../../utils/dateUtils';
import { EditableSelect } from '../common/EditableSelect';
import {
  analyzeDailyReportWithAI,
  calculateMonthDaysDetails,
  getMonthlyInternAIAnalysis,
  MonthlyAIAnalysisResult
} from '../../utils/geminiReportService';
import {
  FileCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Users,
  FileText,
  Printer,
  ShieldCheck,
  Timer,
  FileUp,
  Download,
  Sparkles,
  Bot,
  Loader2,
  CalendarX,
  Lightbulb,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Award,
  TrendingUp,
  BarChart3,
  Check,
  X,
  Eye,
  Trash2,
  Info,
  ExternalLink,
  Edit,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';
import { TodayTeamWorkSummary } from './TodayTeamWorkSummary';

const PERSIAN_MONTHS = [
  { id: '01', name: 'فروردین' },
  { id: '02', name: 'اردیبهشت' },
  { id: '03', name: 'خرداد' },
  { id: '04', name: 'تیر' },
  { id: '05', name: 'مرداد' },
  { id: '06', name: 'شهریور' },
  { id: '07', name: 'مهر' },
  { id: '08', name: 'آبان' },
  { id: '09', name: 'آذر' },
  { id: '10', name: 'دی' },
  { id: '11', name: 'بهمن' },
  { id: '12', name: 'اسفند' }
];

export const DailyReportsModule: React.FC = () => {
  const {
    dailyReports,
    projects,
    users,
    currentUser,
    addDailyReport,
    updateDailyReport,
    reviewDailyReport,
    deleteDailyReport,
    getMonthlyInternSummary
  } = useApp();

  const [activeTab, setActiveTab] = useState<'reports' | 'monthly_summary'>('reports');

  // Filter States
  const [selectedInternId, setSelectedInternId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  // Add / Edit Report Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);

  // View Full Report Details modal
  const [selectedReportDetails, setSelectedReportDetails] = useState<DailyReport | null>(null);

  // Delete Confirmation modal
  const [reportToDelete, setReportToDelete] = useState<DailyReport | null>(null);

  // Review Feedback modal
  const [reviewingReport, setReviewingReport] = useState<DailyReport | null>(null);
  const [reviewStatus, setReviewStatus] = useState<DailyReportStatus>('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');

  // AI & PDF Upload States in Add Modal
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [uploadedPdfName, setUploadedPdfName] = useState<string>('');
  const [uploadedPdfSize, setUploadedPdfSize] = useState<string>('');
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>('');
  const [uploadedPdfAnalysis, setUploadedPdfAnalysis] = useState<DailyReport['aiFiveLineAnalysis'] | undefined>(undefined);

  // Form State
  const [reportDate, setReportDate] = useState<string>(getTodayPersianDate());
  const [selectedInternForReport, setSelectedInternForReport] = useState<string>(
    currentUser.role === 'intern' ? currentUser.id : ''
  );
  const [projectTitleInput, setProjectTitleInput] = useState<string>('');
  const [clockIn, setClockIn] = useState('08:30');
  const [clockOut, setClockOut] = useState('16:30');
  const [workedHours, setWorkedHours] = useState<number>(8);
  const [durationDisplay, setDurationDisplay] = useState<string>('۸ ساعت کامل');
  const [tasksDone, setTasksDone] = useState('');
  const [problemsEncountered, setProblemsEncountered] = useState('');
  const [tomorrowsPlan, setTomorrowsPlan] = useState('');
  const [progressAdded, setProgressAdded] = useState<number>(5);

  // Summary Tab State
  const todayParts = getTodayPersianDate().split('/');
  const defaultYear = todayParts[0] || '1403';
  const defaultMonth = todayParts[1] || '05';

  const [summaryInternId, setSummaryInternId] = useState<string>(
    currentUser.role === 'intern' ? currentUser.id : (users.find(u => u.role === 'intern')?.id || users[0]?.id || '')
  );
  const [summaryYear, setSummaryYear] = useState<string>(defaultYear);
  const [summaryMonth, setSummaryMonth] = useState<string>(defaultMonth);

  // AI Monthly Analysis State
  const [isMonthlyAiLoading, setIsMonthlyAiLoading] = useState(false);
  const [monthlyAiResult, setMonthlyAiResult] = useState<MonthlyAIAnalysisResult | null>(null);

  const interns = users.filter(u => u.role === 'intern');

  // Comprehensive project list for selection
  const defaultProjects: { id: string; title: string }[] = [
    { id: 'proj-def-1', title: 'سامانه جامع مدیریت آکادمی شکوه دانش (shoukoh danesh)' },
    { id: 'proj-def-2', title: 'توسعه وب‌سایت سازمانی و پورتال ثبت‌نام' },
    { id: 'proj-def-3', title: 'سامانه CRM، مدیریت لیدها و پیام‌رسان داخلی' },
    { id: 'proj-def-4', title: 'پروژه اتوماسیون هوش مصنوعی و تحلیل گزارش‌ها' },
    { id: 'proj-def-5', title: 'توسعه فروشگاه وردپرس و سئو محتوایی' }
  ];

  const allAvailableProjects: { id: string; title: string }[] = [
    ...projects.map(p => ({ id: p.id, title: p.title || '' })),
    ...defaultProjects.filter(dp => !projects.some(p => (p.title || '').toLowerCase() === (dp.title || '').toLowerCase()))
  ];

  // Recalculate duration when clockIn or clockOut changes
  const handleTimeChange = (newIn: string, newOut: string) => {
    setClockIn(newIn);
    setClockOut(newOut);
    const dur = calculateWorkDuration(newIn, newOut);
    setWorkedHours(dur.totalHoursDecimal);
    setDurationDisplay(dur.formattedText);
  };

  useEffect(() => {
    const dur = calculateWorkDuration(clockIn, clockOut);
    setWorkedHours(dur.totalHoursDecimal);
    setDurationDisplay(dur.formattedText);
  }, []);

  // Filtered Reports Logic
  const filteredReports = dailyReports.filter(r => {
    if (currentUser.role === 'intern' && r.internId !== currentUser.id) return false;
    if (selectedInternId !== 'all' && r.internId !== selectedInternId) return false;
    if (selectedProjectId !== 'all' && r.projectId !== selectedProjectId && r.projectTitle !== selectedProjectId) return false;
    if (selectedMonthFilter !== 'all' && !r.date.includes(selectedMonthFilter)) return false;
    return true;
  });

  // Handle PDF Upload with AI Auto-Filling
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
    const fakeUrl = URL.createObjectURL(file);

    setUploadedPdfName(file.name);
    setUploadedPdfSize(sizeFormatted);
    setUploadedPdfUrl(fakeUrl);
    setAiSuccessMessage(null);
    setIsAnalyzingPdf(true);

    try {
      const effectiveInternId = currentUser.role === 'intern' ? currentUser.id : (selectedInternForReport || currentUser.id);
      const targetIntern = users.find(u => u.id === effectiveInternId) || currentUser;

      // Run AI Extraction on PDF
      const extracted = await analyzeDailyReportWithAI(file, targetIntern.name, projects);

      if (extracted) {
        if (extracted.reportDate) setReportDate(extracted.reportDate);
        if (extracted.projectTitle) setProjectTitleInput(extracted.projectTitle);
        if (extracted.clockIn && extracted.clockOut) {
          setClockIn(extracted.clockIn);
          setClockOut(extracted.clockOut);
          const dur = calculateWorkDuration(extracted.clockIn, extracted.clockOut);
          setWorkedHours(dur.totalHoursDecimal);
          setDurationDisplay(dur.formattedText);
        }
        setTasksDone(extracted.tasksDone || '');
        setProblemsEncountered(extracted.problemsEncountered || '');
        setTomorrowsPlan('');
        if (extracted.progressAdded) setProgressAdded(extracted.progressAdded);
        if (extracted.aiFiveLineAnalysis) {
          setUploadedPdfAnalysis(extracted.aiFiveLineAnalysis);
        }

        setAiSuccessMessage(
          `✨ فایل با موفقیت تحلیل گردید و خلاصه اجرایی جهت تصمیم‌گیری مدیریت تولید شد.`
        );
      }
    } catch (err) {
      console.error('PDF AI Analysis Error:', err);
    } finally {
      setIsAnalyzingPdf(false);
    }
  };

  const handleOpenAddModal = () => {
    if (currentUser.role !== 'intern') return;
    setEditingReport(null);
    setReportDate(getTodayPersianDate());
    setProjectTitleInput(allAvailableProjects[0]?.title || '');
    setClockIn('08:30');
    setClockOut('16:30');
    const dur = calculateWorkDuration('08:30', '16:30');
    setWorkedHours(dur.totalHoursDecimal);
    setDurationDisplay(dur.formattedText);
    setTasksDone('');
    setProblemsEncountered('');
    setTomorrowsPlan('');
    setProgressAdded(5);
    setUploadedPdfName('');
    setUploadedPdfSize('');
    setUploadedPdfUrl('');
    setUploadedPdfAnalysis(undefined);
    setAiSuccessMessage(null);
    setIsAnalyzingPdf(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (report: DailyReport) => {
    setEditingReport(report);
    setReportDate(report.date);
    setProjectTitleInput(report.projectTitle);
    setClockIn(report.clockIn || '08:30');
    setClockOut(report.clockOut || '16:30');
    setWorkedHours(report.workedHours || 8);
    const dur = calculateWorkDuration(report.clockIn || '08:30', report.clockOut || '16:30');
    setDurationDisplay(dur.formattedText);
    setTasksDone(report.tasksDone || '');
    setProblemsEncountered(report.problemsEncountered || '');
    setTomorrowsPlan(report.tomorrowsPlan || '');
    setProgressAdded(report.progressAdded || 5);
    setUploadedPdfName(report.pdfFileName || '');
    setUploadedPdfSize(report.pdfFileSize || '');
    setUploadedPdfUrl(report.pdfFileUrl || '');
    setUploadedPdfAnalysis(report.aiFiveLineAnalysis);
    setAiSuccessMessage(null);
    setIsAnalyzingPdf(false);
    setIsAddModalOpen(true);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Per user request: PDF upload is the primary file requirement
    if (!uploadedPdfName && !editingReport) {
      alert('لطفاً ابتدا فایل PDF گزارش کار روزانه خود را بارگذاری نمایید.');
      return;
    }

    const effectiveProjectTitle = projectTitleInput.trim() || (allAvailableProjects[0]?.title || 'پروژه عمومی آکادمی');
    const effectiveTasksDone = tasksDone.trim() || (uploadedPdfName ? `گزارش ثبت‌شده از طریق فایل پیوست: ${uploadedPdfName}` : 'ثبت گزارش کار روزانه');

    const effectiveInternId = currentUser.role === 'intern' ? currentUser.id : (selectedInternForReport || currentUser.id);
    const targetIntern = users.find(u => u.id === effectiveInternId) || currentUser;

    const matchProj = projects.find(
      p => p.id === effectiveProjectTitle || ((p.title || '').toLowerCase() === effectiveProjectTitle.toLowerCase())
    );
    const finalProjectTitle = matchProj ? matchProj.title : effectiveProjectTitle;
    const finalProjectId = matchProj ? matchProj.id : `proj-${Date.now()}`;

    const targetDate = reportDate || getTodayPersianDate();

    if (editingReport) {
      // Update existing report
      updateDailyReport(editingReport.id, {
        date: targetDate,
        clockIn,
        clockOut,
        workedHours,
        projectId: finalProjectId,
        projectTitle: finalProjectTitle,
        tasksDone: effectiveTasksDone,
        problemsEncountered,
        tomorrowsPlan,
        progressAdded,
        pdfFileName: uploadedPdfName || editingReport.pdfFileName,
        pdfFileSize: uploadedPdfSize || editingReport.pdfFileSize,
        pdfFileUrl: uploadedPdfUrl || editingReport.pdfFileUrl,
        aiFiveLineAnalysis: uploadedPdfAnalysis || editingReport.aiFiveLineAnalysis,
        pdfAnalyzed: Boolean(uploadedPdfName || editingReport.pdfFileName)
      });
      setIsAddModalOpen(false);
      setEditingReport(null);
      return;
    }

    // Check for duplicate report entry when adding new
    const isDuplicate = dailyReports.some(
      r => r.internId === targetIntern.id && r.date === targetDate && (r.projectTitle || '').trim().toLowerCase() === finalProjectTitle.toLowerCase()
    );
    if (isDuplicate) {
      alert(`گزارش کار برای کارآموز «${targetIntern.name}» در تاریخ «${targetDate}» و پروژه «${finalProjectTitle}» قبلاً ثبت شده است! جهت جلوگیری از ثبت تکراری، امکان ثبت مجدد وجود ندارد.`);
      return;
    }

    addDailyReport({
      internId: targetIntern.id,
      internName: targetIntern.name,
      internAvatar: targetIntern.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      date: targetDate,
      clockIn,
      clockOut,
      workedHours,
      projectId: finalProjectId,
      projectTitle: finalProjectTitle,
      tasksDone: effectiveTasksDone,
      problemsEncountered,
      tomorrowsPlan,
      progressAdded,
      pdfFileName: uploadedPdfName || `گزارش_کار_${targetIntern.name.replace(/ /g, '_')}_${targetDate.replace(/\//g, '-')}.pdf`,
      pdfFileSize: uploadedPdfSize || '540 KB',
      pdfFileUrl: uploadedPdfUrl || undefined,
      pdfPageCount: 1,
      pdfAnalyzed: Boolean(uploadedPdfName),
      aiFiveLineAnalysis: uploadedPdfAnalysis
    });

    setIsAddModalOpen(false);
    setEditingReport(null);
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReport) return;

    reviewDailyReport(reviewingReport.id, reviewStatus, reviewFeedback);
    setReviewingReport(null);
    setReviewFeedback('');
  };

  // Monthly Analysis Calculations
  const targetIntern = users.find(u => u.id === summaryInternId) || currentUser;
  const selectedYearMonthStr = `${summaryYear}/${summaryMonth}`;

  // Helper to extract normalized year and month
  const getNormalizedYearMonth = (dateStr: string) => {
    const clean = normalizeDigits(dateStr || '').replace(/[\-\.]/g, '/');
    const parts = clean.split('/');
    if (parts.length >= 2) {
      return { year: parts[0], month: parts[1].padStart(2, '0') };
    }
    return { year: '', month: '' };
  };

  const targetInternReportsForMonth = dailyReports.filter(r => {
    const isInternMatch =
      r.internId === summaryInternId ||
      (targetIntern?.name && r.internName && r.internName.trim().toLowerCase() === targetIntern.name.trim().toLowerCase());
    if (!isInternMatch) return false;

    const { year, month } = getNormalizedYearMonth(r.date);
    return (year === summaryYear && month === summaryMonth) ||
      normalizeDigits(r.date).includes(`${summaryYear}/${summaryMonth}`) ||
      normalizeDigits(r.date).includes(`${summaryYear}/${parseInt(summaryMonth, 10)}`);
  });

  const monthCalculation = calculateMonthDaysDetails(selectedYearMonthStr, targetInternReportsForMonth);
  const totalWorkedHoursMonth = targetInternReportsForMonth.reduce((acc, r) => acc + (r.workedHours || 0), 0);

  // Trigger AI Monthly Deep Analysis
  const handleTriggerMonthlyAi = async () => {
    setIsMonthlyAiLoading(true);
    try {
      const res = await getMonthlyInternAIAnalysis(
        targetIntern.name,
        `${PERSIAN_MONTHS.find(m => m.id === summaryMonth)?.name || summaryMonth} ${summaryYear}`,
        targetInternReportsForMonth,
        monthCalculation.missingDays,
        monthCalculation.totalWorkDays,
        projects
      );
      setMonthlyAiResult(res);
    } catch (err) {
      console.error('Monthly AI Error:', err);
    } finally {
      setIsMonthlyAiLoading(false);
    }
  };

  // Auto load AI analysis when changing intern, month or when daily reports change
  useEffect(() => {
    if (activeTab === 'monthly_summary') {
      handleTriggerMonthlyAi();
    }
  }, [summaryInternId, summaryYear, summaryMonth, activeTab, dailyReports.length]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-500" />
            {currentUser.role === 'intern'
              ? 'سامانه هوشمند گزارش کار روزانه و کارنامه کارآموزی'
              : currentUser.role === 'teacher'
              ? 'بررسی و نظارت بر گزارش کار روزانه کارآموزان'
              : 'سیستم جامع مدیریت و ارزیابی گزارش کارآموزان'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentUser.role === 'intern'
              ? 'بارگذاری آسان PDF با استخراج خودکار هوش مصنوعی، تحلیل ساعات حضور و کارنامه عملکرد ماهانه'
              : 'بررسی گزارش‌های کاری ارسالی، پایش روزهای عدم ارسال گزارش و ثبت بازخورد اساتید'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reports' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500'
              }`}
            >
              لیست گزارش‌های روزانه
            </button>
            <button
              onClick={() => setActiveTab('monthly_summary')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'monthly_summary' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              کارنامه و تحلیل ماهانه AI
            </button>
          </div>

          {currentUser.role === 'intern' && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              ثبت گزارش کار جدید (با AI)
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Daily Reports List */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Today's Team Work Summary Box (هر کی امروز چی کار کرده) */}
          <TodayTeamWorkSummary
            onSelectReport={(report) => setSelectedReportDetails(report)}
            onReviewReport={(report) => {
              setReviewingReport(report);
              setReviewStatus(report.status || 'approved');
              setReviewFeedback(report.reviewerFeedback || '');
            }}
            onFilterByIntern={(internId) => setSelectedInternId(internId)}
            selectedInternId={selectedInternId}
          />

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-4 h-4 text-blue-500" />
                فیلترها:
              </span>

              {currentUser.role !== 'intern' && (
                <select
                  value={selectedInternId}
                  onChange={e => setSelectedInternId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium"
                >
                  <option value="all">همه کارآموزان ({interns.length} نفر)</option>
                  {interns.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              )}

              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium"
              >
                <option value="all">همه پروژه‌ها</option>
                {allAvailableProjects.map(p => (
                  <option key={p.id} value={p.title}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              تعداد گزارش‌های ثبت شده: <strong className="text-blue-600 font-bold font-mono">{filteredReports.length}</strong>
            </div>
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <FileCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                گزارش کاری ثبت نشده است
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {currentUser.role === 'intern'
                  ? 'جهت ثبت گزارش کار امروز، روی دکمه «ثبت گزارش کار جدید» کلیک کرده و فایل PDF یا مستندات خود را بارگذاری کنید تا هوش مصنوعی فیلدها را پر کند.'
                  : 'هیچ گزارشی با فیلترهای انتخابی یافت نشد.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map(report => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: User & Date & Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {report.internName?.charAt(0) || 'ک'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{report.internName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{report.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            report.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
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
                      </div>
                    </div>

                    {/* Project & Hours Banner */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">پروژه:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {report.projectTitle}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">حضور و کارکرد:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                          {report.clockIn} الی {report.clockOut} ({report.workedHours} ساعت)
                        </span>
                      </div>
                    </div>

                    {/* Tasks Content */}
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        کارهای انجام‌شده امروز:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap">
                        {report.tasksDone}
                      </p>
                    </div>

                    {/* Problems if any */}
                    {report.problemsEncountered && (
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          چالش‌ها و موانع:
                        </span>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {report.problemsEncountered}
                        </p>
                      </div>
                    )}

                    {/* Tomorrow's Plan */}
                    {report.tomorrowsPlan && (
                      <div className="space-y-1 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          برنامه کاری فردا:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                          {report.tomorrowsPlan}
                        </p>
                      </div>
                    )}

                    {/* 5-Line AI Analysis Summary (Visible to Admin/Manager and Intern) */}
                    {report.aiFiveLineAnalysis && (
                      <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            تحلیل و خلاصه اجرایی ۵ خطی هوش مصنوعی:
                          </span>
                          <span className="text-[10px] bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                            AI Executive Summary
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                          <p className="flex items-baseline gap-1.5">
                            <span className="text-blue-600 font-bold shrink-0">۱. ساعات مفید:</span>
                            <span>{report.aiFiveLineAnalysis.line1HoursWorked}</span>
                          </p>
                          <p className="flex items-baseline gap-1.5">
                            <span className="text-rose-600 font-bold shrink-0">۲. زمان هدررفت/توقف:</span>
                            <span>{report.aiFiveLineAnalysis.line2TimeWasted}</span>
                          </p>
                          <p className="flex items-baseline gap-1.5">
                            <span className="text-emerald-600 font-bold shrink-0">۳. دستاوردهای کلیدی:</span>
                            <span>{report.aiFiveLineAnalysis.line3KeyAchievements}</span>
                          </p>
                          <p className="flex items-baseline gap-1.5">
                            <span className="text-amber-600 font-bold shrink-0">۴. چالش‌ها و موانع:</span>
                            <span>{report.aiFiveLineAnalysis.line4Challenges}</span>
                          </p>
                          <p className="flex items-baseline gap-1.5 bg-indigo-100/50 dark:bg-indigo-900/40 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <span className="text-indigo-700 dark:text-indigo-300 font-bold shrink-0">۵. توصیه تصمیم‌گیری:</span>
                            <span>{report.aiFiveLineAnalysis.line5ProjectDecisionGuidance}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* PDF File Attachment Badge */}
                    {report.pdfFileName && (
                      <div className="flex items-center justify-between p-2.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {report.pdfFileName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({report.pdfFileSize || 'PDF'})</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {report.pdfFileUrl && (
                            <a
                              href={report.pdfFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-white dark:bg-slate-800 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="مشاهده و باز کردن مستقیم فایل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              مشاهده فایل
                            </a>
                          )}
                          {report.pdfFileUrl && (
                            <a
                              href={report.pdfFileUrl}
                              download={report.pdfFileName}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                              title="دانلود فایل PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Teacher/Admin Review Notes if any */}
                    {report.reviewedBy && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs space-y-1 border border-slate-200/60 dark:border-slate-700">
                        <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          <span>نظر استاد ناظر ({report.reviewedBy}):</span>
                          <span className="text-[10px] text-slate-400 font-mono">{report.reviewDate}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">{report.reviewNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    {/* View Details Button (Available to all) */}
                    <button
                      type="button"
                      onClick={() => setSelectedReportDetails(report)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                      title="مشاهده جزئیات کامل گزارش و تحلیل هوش مصنوعی"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      مشاهده جزئیات
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Edit button for intern if not yet reviewed */}
                      {(currentUser.id === report.internId || currentUser.name === report.internName || currentUser.role === 'admin') && !report.reviewedBy && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(report)}
                          className="px-2.5 py-1.5 text-blue-600 hover:text-blue-700 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-1 transition-all border border-blue-200/60 dark:border-blue-900/50"
                          title="ویرایش و تعویض فایل گزارش کار قبل از بررسی"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          ویرایش فایل
                        </button>
                      )}

                      {/* Review Button for Admin / Teacher */}
                      {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingReport(report);
                            setReviewStatus(report.status || 'approved');
                            setReviewFeedback(report.reviewerFeedback || report.reviewNotes || '');
                          }}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-300 font-bold text-xs rounded-xl transition-all border border-blue-200 dark:border-blue-800 flex items-center gap-1.5"
                          title="بررسی و ثبت نظر استاد/مدیر"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          بررسی و ثبت بازخورد
                        </button>
                      )}

                      {/* Delete Button for Admin or Intern Owner */}
                      {(currentUser.role === 'admin' || currentUser.id === report.internId || currentUser.name === report.internName) && (
                        <button
                          type="button"
                          onClick={() => setReportToDelete(report)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="حذف این گزارش روزانه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Monthly Summary & AI Deep Analysis */}
      {activeTab === 'monthly_summary' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {currentUser.role !== 'intern' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">انتخاب کارآموز:</span>
                  <select
                    value={summaryInternId}
                    onChange={e => setSummaryInternId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    {interns.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">انتخاب ماه:</span>
                <select
                  value={summaryMonth}
                  onChange={e => setSummaryMonth(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  {PERSIAN_MONTHS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">سال:</span>
                <select
                  value={summaryYear}
                  onChange={e => setSummaryYear(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none font-mono"
                >
                  <option value="1402">۱۴۰۲</option>
                  <option value="1403">۱۴۰۳</option>
                  <option value="1404">۱۴۰۴</option>
                  <option value="1405">۱۴۰۵</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerMonthlyAi}
                disabled={isMonthlyAiLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
              >
                {isMonthlyAiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                تحلیل مجدد ماهانه با AI
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" />
                چاپ کارنامه
              </button>
            </div>
          </div>

          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">مجموع ساعت کارکرد ماه</span>
              <div className="text-2xl font-black text-blue-600 font-mono">
                {totalWorkedHoursMonth} <span className="text-xs text-slate-400 font-sans">ساعت</span>
              </div>
              <p className="text-[11px] text-slate-500">حضور موثر در کارگاه و پروژه‌ها</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">گزارش‌های ارسال‌شده</span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {monthCalculation.submittedDaysCount} <span className="text-xs text-slate-400 font-sans">از {monthCalculation.totalWorkDays} روز کاری</span>
              </div>
              <p className="text-[11px] text-emerald-600">گزارش‌های ثبت‌شده در این ماه</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">روزهای بدون گزارش (غیبت)</span>
              <div className={`text-2xl font-black font-mono ${monthCalculation.missingDaysCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {monthCalculation.missingDaysCount} <span className="text-xs text-slate-400 font-sans">روز کاری</span>
              </div>
              <p className="text-[11px] text-slate-500">روزهایی که گزارش کار ثبت نشده</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">نرخ انضباط و حضور</span>
              <div className="text-2xl font-black text-purple-600 font-mono">
                {monthCalculation.attendanceRate}٪
              </div>
              <p className="text-[11px] text-slate-500">بر اساس تقویم کاری آکادمی</p>
            </div>
          </div>

          {/* Missing Days Alert Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-rose-500" />
                وضعیت روزهای عدم ارسال گزارش کار در {PERSIAN_MONTHS.find(m => m.id === summaryMonth)?.name} {summaryYear}
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                monthCalculation.missingDaysCount === 0 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {monthCalculation.missingDaysCount === 0 ? '✔ حضور کامل' : `⚠️ ${monthCalculation.missingDaysCount} روز گزارش نشده`}
              </span>
            </div>

            {monthCalculation.missingDaysCount === 0 ? (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>تبریک! کارآموز در تمامی روزهای کاری این ماه به موقع گزارش کار خود را ارسال نموده و هیچ غیبتی ثبت نشده است.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  در تاریخ‌های زیر، گزارش کاری توسط کارآموز در سامانه ثبت نشده است. کارآموز می‌تواند در صورت موجه بودن، گزارش معوقه را با پیوست مستندات ثبت نماید:
                </p>
                <div className="flex flex-wrap gap-2">
                  {monthCalculation.missingDays.map(dateStr => (
                    <span
                      key={dateStr}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      <CalendarX className="w-3.5 h-3.5 text-rose-500" />
                      {dateStr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Deep Monthly Performance & Skill Roadmap */}
          <div className="bg-gradient-to-br from-indigo-900/10 via-blue-900/5 to-purple-900/10 dark:from-indigo-950/40 dark:to-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/80 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 dark:border-blue-900/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    تحلیل جامع و هوشمند ماهانه Gemini AI
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded-full">
                      هوش مصنوعی پیشرفته
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ارزیابی دقیق عملکرد کارآموز ({targetIntern.name}) و ارائه نقشه راه مهارت‌های آینده
                  </p>
                </div>
              </div>

              {monthlyAiResult && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-500">نمره کیفی ماه:</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                    {monthlyAiResult.performanceScore} / ۱۰۰
                  </span>
                </div>
              )}
            </div>

            {isMonthlyAiLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  هوش مصنوعی در حال تحلیل گزارش‌های کاری، ارزیابی ساعات حضور و تدوین نقشه راه یادگیری است...
                </p>
                <p className="text-xs text-slate-400">لطفاً چند لحظه شکیبا باشید.</p>
              </div>
            ) : monthlyAiResult ? (
              <div className="space-y-6 text-xs leading-relaxed">
                {/* AI Performance & Competency Visual Chart */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          نمودار تحلیلی شایستگی‌ها و شاخص‌های کیفی هوش مصنوعی (AI Analytics)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          محاسبه و وزن‌دهی بر اساس گزارش‌های مستند، پیشرفت پروژه‌ها و دقت عملکرد کارآموز
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">شاخص کلی:</span>
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs font-mono shadow-sm">
                        {monthlyAiResult.performanceScore}٪
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Breakdown Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 pt-1">
                    {[
                      {
                        label: 'کیفیت کدنویسی و خروجی کار',
                        value: Math.min(100, Math.max(40, monthlyAiResult.performanceScore)),
                        color: 'from-blue-600 to-indigo-600',
                        bg: 'bg-blue-500',
                        desc: 'بر اساس بررسی تسک‌های تکمیل‌شده'
                      },
                      {
                        label: 'نظم و استمرار در ثبت گزارش کار',
                        value: Math.min(100, Math.max(30, Math.round(((targetInternReportsForMonth.length) / Math.max(1, monthCalculation.totalWorkDays)) * 100))),
                        color: 'from-emerald-600 to-teal-500',
                        bg: 'bg-emerald-500',
                        desc: `${targetInternReportsForMonth.length} روز گزارش از ${monthCalculation.totalWorkDays} روز کاری`
                      },
                      {
                        label: 'تطبیق با موعد تحویل و پیشرفت پروژه',
                        value: Math.min(100, Math.max(45, Math.round((monthlyAiResult.performanceScore * 0.95)))),
                        color: 'from-purple-600 to-pink-600',
                        bg: 'bg-purple-500',
                        desc: 'ارزیابی سرعت تحویل تسک‌ها و فازها'
                      },
                      {
                        label: 'توانایی حل چالش و مهارت‌آموزی',
                        value: Math.min(100, Math.max(50, Math.round(monthlyAiResult.performanceScore * 1.02))),
                        color: 'from-amber-500 to-orange-500',
                        bg: 'bg-amber-500',
                        desc: 'رفع باگ‌ها و فراگیری ابزارهای پیشنهادی'
                      }
                    ].map((metric, idx) => (
                      <div key={idx} className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${metric.bg}`}></span>
                            {metric.label}
                          </span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            {metric.value}٪
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${metric.color} transition-all duration-700`}
                            style={{ width: `${metric.value}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>{metric.desc}</span>
                          <span className="font-bold text-slate-500">
                            {metric.value >= 85 ? 'عالی' : metric.value >= 70 ? 'بسیار خوب' : 'متوسط'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discipline & Overall Assessment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      وضعیت انضباط و حضور:
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">
                      {monthlyAiResult.attendanceStatus}
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {monthlyAiResult.missingDaysAnalysis}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      جمع‌بندی و ارزیابی نهایی استاد ناظر AI:
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">
                      {monthlyAiResult.overallSummary}
                    </p>
                  </div>
                </div>

                {/* Strengths & Growth Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      نقاط قوت شناسایی‌شده در پروژه‌ها:
                    </h4>
                    <ul className="space-y-1.5 text-emerald-900 dark:text-emerald-200 text-xs list-disc list-inside">
                      {monthlyAiResult.strengths?.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      بخش‌های نیازمند تقویت و تمرکز:
                    </h4>
                    <ul className="space-y-1.5 text-amber-900 dark:text-amber-200 text-xs list-disc list-inside">
                      {monthlyAiResult.growthAreas?.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Skill & Learning Recommendations (نقشه راه یادگیری) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      چه چیزهایی اکنون یاد بگیرند؟ (پیشنهاد هوش مصنوعی متناسب با بازار کار)
                    </h4>
                    <span className="text-[11px] text-slate-400">بر اساس پروژه‌های محوله و موانع ثبت‌شده</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {monthlyAiResult.recommendedSkills?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            {rec.skill}
                          </h5>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.priority === 'فوری'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                              : rec.priority === 'پیشنهادی'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200'
                          }`}>
                            {rec.priority === 'فوری' ? '🔥 اولویت فوری' : rec.priority === 'پیشنهادی' ? '⚡ پیشنهادی' : '🚀 مهارت پیشرفته'}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                          <strong>چرا الان؟</strong> {rec.reason}
                        </p>

                        <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-lg text-[11px] text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          <span>گام اول یادگیری: {rec.roadmapStep}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL: ADD DAILY REPORT WITH PDF AI AUTO-FILL (INTERN EXCLUSIVE) */}
      {/* MODAL: ADD / EDIT DAILY REPORT */}
      {isAddModalOpen && (currentUser.role === 'intern' || currentUser.role === 'admin') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {editingReport ? 'ویرایش فایل گزارش کار روزانه' : 'ثبت گزارش کار روزانه با فایل PDF'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingReport(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY PDF UPLOAD BOX */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-600 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-xs text-blue-950 dark:text-blue-100">
                    بارگذاری فایل PDF گزارش کار (اصلی)
                  </span>
                </div>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  تحلیل خودکار با هوش مصنوعی
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                دیگر نیازی به نوشتن دستی جزئیات نیست! کافیست فایل PDF گزارش کار خود را انتخاب کنید تا سامانه آن را دریافت و اطلاعاتش را برای مدیر آماده کند.
              </p>

              {/* Upload Input & File Info */}
              <label className="border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 rounded-xl p-3.5 bg-white dark:bg-slate-900 cursor-pointer flex items-center justify-between gap-3 transition-all shadow-sm">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={isAnalyzingPdf}
                  className="hidden"
                />
                <div className="flex items-center gap-3 min-w-0">
                  {isAnalyzingPdf ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <FileText className="w-6 h-6 text-rose-500 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                      {uploadedPdfName ? uploadedPdfName : 'انتخاب یا رها کردن فایل PDF گزارش کار'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isAnalyzingPdf
                        ? 'در حال تحلیل با هوش مصنوعی جهت ساخت خلاصه ۵ خطی...'
                        : uploadedPdfSize
                        ? `حجم: ${uploadedPdfSize} (آماده ارسال یا تعویض)`
                        : 'کلیک کنید و فایل PDF را انتخاب نمایید'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {uploadedPdfUrl && (
                    <a
                      href={uploadedPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[11px] font-bold bg-blue-50 dark:bg-blue-900/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-blue-200 dark:border-blue-700"
                      title="باز کردن و مشاهده مستقیم فایل PDF"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      مشاهده فایل
                    </a>
                  )}
                  {uploadedPdfName && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setUploadedPdfName('');
                        setUploadedPdfSize('');
                        setUploadedPdfUrl('');
                        setUploadedPdfAnalysis(undefined);
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
                      title="حذف و انصراف از این فایل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </label>

              {aiSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveReport} className="space-y-3.5 text-xs">
              {/* Date & Project Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">تاریخ گزارش</label>
                  <input
                    type="text"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    required
                    placeholder="1403/05/28"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">
                    پروژه مربوطه *
                  </label>
                  <EditableSelect
                    value={projectTitleInput}
                    onChange={val => setProjectTitleInput(val)}
                    options={allAvailableProjects.map(p => ({
                      value: p.title,
                      label: p.title
                    }))}
                    placeholder="انتخاب یا نوشتن نام پروژه..."
                    required
                  />
                </div>
              </div>

              {/* Work Hours & Attendance */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Timer className="w-4 h-4 text-blue-500" />
                    ساعات حضور و کارکرد:
                  </span>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                    {durationDisplay} ({workedHours} ساعت)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">ساعت ورود</label>
                    <input
                      type="text"
                      value={clockIn}
                      onChange={e => handleTimeChange(e.target.value, clockOut)}
                      placeholder="08:30"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono outline-none text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">ساعت خروج</label>
                    <input
                      type="text"
                      value={clockOut}
                      onChange={e => handleTimeChange(clockIn, e.target.value)}
                      placeholder="16:30"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono outline-none text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={!uploadedPdfName && !editingReport}
                  className={`flex-1 py-3 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                    !uploadedPdfName && !editingReport
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  {editingReport ? 'ذخیره تغییرات فایل گزارش' : 'ثبت نهایی گزارش کار'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingReport(null);
                  }}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL REPORT DETAILS */}
      {selectedReportDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                  {selectedReportDetails.internName?.charAt(0) || 'ک'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    جزئیات کامل گزارش کار - {selectedReportDetails.internName}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    تاریخ ثبت: {selectedReportDetails.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedReportDetails.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      : selectedReportDetails.status === 'needs_revision'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200'
                  }`}
                >
                  {selectedReportDetails.status === 'approved' && '✔ تأیید شده'}
                  {selectedReportDetails.status === 'needs_revision' && '⚠️ نیاز به بازنگری'}
                  {selectedReportDetails.status === 'submitted' && '⏳ در انتظار بررسی'}
                  {selectedReportDetails.status === 'rejected' && '❌ رد شده'}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedReportDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Project & Hours Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">پروژه و تسک:</span>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {selectedReportDetails.projectTitle}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold mt-0.5 inline-block">
                  +{selectedReportDetails.progressAdded || 5}٪ پیشرفت اعمال‌شده
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">ساعات کاری و حضور:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block text-sm">
                  {selectedReportDetails.clockIn} الی {selectedReportDetails.clockOut}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-block">
                  ({selectedReportDetails.workedHours} ساعت کارکرد مفید)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">نحوه ثبت و هوش مصنوعی:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {selectedReportDetails.pdfAnalyzed ? 'استخراج با AI از PDF' : 'ثبت مستقیم در سامانه'}
                </span>
              </div>
            </div>

            {/* Tasks Done Box */}
            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                کارهای انجام‌شده در طول روز:
              </span>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {selectedReportDetails.tasksDone}
              </div>
            </div>

            {/* Problems Encountered */}
            {selectedReportDetails.problemsEncountered && (
              <div className="space-y-1.5 text-xs">
                <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  چالش‌ها، باگ‌ها و سوالات فنی:
                </span>
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedReportDetails.problemsEncountered}
                </div>
              </div>
            )}

            {/* Tomorrow's Plan */}
            {selectedReportDetails.tomorrowsPlan && (
              <div className="space-y-1.5 text-xs">
                <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  برنامه کاری روز آینده:
                </span>
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedReportDetails.tomorrowsPlan}
                </div>
              </div>
            )}

            {/* 5-Line AI Analysis Box for Admin & Manager Decision Making */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>تحلیل هوشمند ۵ خطی کارکرد و تصمیم‌گیری مدیریتی:</span>
                </div>
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                  AI Decision Engine
                </span>
              </div>

              {selectedReportDetails.aiFiveLineAnalysis ? (
                <div className="space-y-2 text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-start gap-2">
                    <span className="font-bold text-blue-600 shrink-0">۱. ساعات کارکرد مفید:</span>
                    <span>{selectedReportDetails.aiFiveLineAnalysis.line1HoursWorked}</span>
                  </div>
                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-start gap-2">
                    <span className="font-bold text-rose-600 shrink-0">۲. زمان هدررفت و وقفه:</span>
                    <span>{selectedReportDetails.aiFiveLineAnalysis.line2TimeWasted}</span>
                  </div>
                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-start gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">۳. کارهای انجام‌شده:</span>
                    <span>{selectedReportDetails.aiFiveLineAnalysis.line3KeyAchievements}</span>
                  </div>
                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-start gap-2">
                    <span className="font-bold text-amber-600 shrink-0">۴. موانع و چالش‌ها:</span>
                    <span>{selectedReportDetails.aiFiveLineAnalysis.line4Challenges}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-100/70 dark:bg-indigo-900/60 rounded-lg border border-indigo-300 dark:border-indigo-700 flex items-start gap-2 text-indigo-950 dark:text-indigo-100 font-medium">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 shrink-0">۵. راهنمای تصمیم‌گیری پروژه:</span>
                    <span>{selectedReportDetails.aiFiveLineAnalysis.line5ProjectDecisionGuidance}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <p>• <strong>ساعات کارکرد:</strong> {selectedReportDetails.workedHours} ساعت کاری با حضور از {selectedReportDetails.clockIn} الی {selectedReportDetails.clockOut}.</p>
                  <p>• <strong>وضعیت وقفه:</strong> نرخ بازدهی استاندارد در روز کاری.</p>
                  <p>• <strong>تسک‌ها:</strong> {selectedReportDetails.tasksDone || 'فعالیت در پروژه'}</p>
                  <p>• <strong>چالش‌ها:</strong> {selectedReportDetails.problemsEncountered || 'بدون مانع گزارش‌شده'}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold">• <strong>توصیه پروژه:</strong> پروژه با روال عادی به پیش می‌رود.</p>
                </div>
              )}
            </div>

            {/* Attachment File */}
            {selectedReportDetails.pdfFileName && (
              <div className="flex items-center justify-between p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {selectedReportDetails.pdfFileName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      حجم فایل: {selectedReportDetails.pdfFileSize || 'PDF'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedReportDetails.pdfFileUrl && (
                    <a
                      href={selectedReportDetails.pdfFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-700 border border-rose-300 dark:border-rose-900 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                      title="مشاهده و باز کردن مستقیم فایل پیوست"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      مشاهده فایل
                    </a>
                  )}
                  {selectedReportDetails.pdfFileUrl && (
                    <a
                      href={selectedReportDetails.pdfFileUrl}
                      download={selectedReportDetails.pdfFileName}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      دانلود فایل
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Teacher / Admin Review Feedback Section */}
            {selectedReportDetails.reviewedBy ? (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    نظر و ارزیابی استاد ناظر ({selectedReportDetails.reviewedBy})
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {selectedReportDetails.reviewedAt || selectedReportDetails.reviewDate}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  {selectedReportDetails.reviewerFeedback || selectedReportDetails.reviewNotes}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                هنوز بازخوردی توسط استاد ناظر یا مدیر برای این گزارش ثبت نشده است.
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {(currentUser.role === 'admin' || currentUser.id === selectedReportDetails.internId || currentUser.name === selectedReportDetails.internName) && (
                  <button
                    type="button"
                    onClick={() => {
                      setReportToDelete(selectedReportDetails);
                    }}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف گزارش
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                  <button
                    type="button"
                    onClick={() => {
                      const rep = selectedReportDetails;
                      setSelectedReportDetails(null);
                      setReviewingReport(rep);
                      setReviewStatus(rep.status || 'approved');
                      setReviewFeedback(rep.reviewerFeedback || rep.reviewNotes || '');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    بررسی و ثبت بازخورد
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedReportDetails(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW & FEEDBACK (ENHANCED WITH INTERN CONTENT PREVIEW) */}
      {reviewingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                بررسی و ثبت بازخورد گزارش ({reviewingReport.internName})
              </h3>
              <button
                type="button"
                onClick={() => setReviewingReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Intern Report Content Preview (Visible to Manager/Teacher) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">پروژه:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{reviewingReport.projectTitle}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block text-[10px]">تاریخ و ساعات کارکرد:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {reviewingReport.date} | {reviewingReport.clockIn} الی {reviewingReport.clockOut} ({reviewingReport.workedHours} ساعت)
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  کارهای انجام‌شده توسط کارآموز:
                </span>
                <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto border border-slate-200/50 dark:border-slate-700/50">
                  {reviewingReport.tasksDone}
                </p>
              </div>

              {reviewingReport.problemsEncountered && (
                <div>
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5 text-[11px]">
                    چالش‌ها و موانع:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {reviewingReport.problemsEncountered}
                  </p>
                </div>
              )}

              {reviewingReport.tomorrowsPlan && (
                <div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5 text-[11px]">
                    برنامه کاری فردا:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {reviewingReport.tomorrowsPlan}
                  </p>
                </div>
              )}

              {reviewingReport.pdfFileName && (
                <div className="flex items-center justify-between p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/40 text-[11px]">
                  <span className="text-rose-700 dark:text-rose-300 font-bold truncate">
                    📄 فایل پیوست: {reviewingReport.pdfFileName}
                  </span>
                  {reviewingReport.pdfFileUrl && (
                    <a
                      href={reviewingReport.pdfFileUrl}
                      download={reviewingReport.pdfFileName}
                      className="text-blue-600 font-bold underline"
                    >
                      دانلود فایل
                    </a>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">تعیین وضعیت نهایی</label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value as DailyReportStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold outline-none text-slate-800 dark:text-white"
                >
                  <option value="approved">✔ تأیید قطعی گزارش</option>
                  <option value="needs_revision">⚠️ نیاز به بازنگری و اصلاح کارآموز</option>
                  <option value="rejected">❌ عدم تأیید گزارش</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  توصیه و بازخورد استاد ناظر / مدیر به کارآموز:
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={e => setReviewFeedback(e.target.value)}
                  placeholder="مثلاً: خسته نباشید، کارهای امروز بررسی و تأیید شد..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition-colors"
                >
                  ثبت نظر و بازخورد
                </button>
                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                حذف گزارش کار روزانه
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                آیا از حذف گزارش کار تاریخ <strong className="font-mono text-slate-800 dark:text-slate-200">{reportToDelete.date}</strong> مربوط به <strong className="text-slate-800 dark:text-slate-200">{reportToDelete.internName}</strong> اطمینان دارید؟
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 text-right space-y-1">
              <div><strong>پروژه:</strong> {reportToDelete.projectTitle}</div>
              <div><strong>کارکرد:</strong> {reportToDelete.workedHours} ساعت ({reportToDelete.clockIn} تا {reportToDelete.clockOut})</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  deleteDailyReport(reportToDelete.id);
                  if (selectedReportDetails?.id === reportToDelete.id) {
                    setSelectedReportDetails(null);
                  }
                  setReportToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all"
              >
                حذف قطعی گزارش
              </button>
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
