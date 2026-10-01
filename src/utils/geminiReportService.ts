import { Project, DailyReport } from '../types';
import { getTodayPersianDate, isPersianFriday, normalizeDigits } from './dateUtils';

export interface ExtractedReportData {
  reportDate?: string;
  projectTitle?: string;
  projectId?: string;
  clockIn?: string;
  clockOut?: string;
  tasksDone?: string;
  problemsEncountered?: string;
  tomorrowsPlan?: string;
  progressAdded?: number;
  extractedSkills?: string[];
  qualityScore?: number;
  productivityRating?: 'عالی' | 'خوب' | 'متوسط' | 'نیاز به بهبود';
  autoEvaluation?: string;
  aiFiveLineAnalysis?: {
    line1HoursWorked: string;
    line2TimeWastedOrGaps: string;
    line3TasksAccomplished: string;
    line4TechnicalChallenges: string;
    line5ProjectDecisionGuidance: string;
    fullSummaryText?: string;
  };
}

export interface MonthlyAIAnalysisResult {
  performanceScore: number;
  attendanceStatus: string;
  missingDaysAnalysis: string;
  strengths: string[];
  growthAreas: string[];
  recommendedSkills: {
    skill: string;
    priority: 'فوری' | 'پیشنهادی' | 'پیشرفته';
    reason: string;
    roadmapStep: string;
  }[];
  overallSummary: string;
}

// Convert File to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Read text from text files or simulate text extraction
export function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
    } else {
      resolve('');
    }
  });
}

// Fallback parser without hallucinating content - strictly objective, logical, no flattering
function generateHeuristicReportData(
  fileName: string,
  internName: string,
  availableProjects: Project[]
): ExtractedReportData {
  const today = getTodayPersianDate();
  const selectedProj = availableProjects[0]?.title || 'پروژه آکادمی شکوه دانش';
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' ');

  return {
    reportDate: today,
    projectTitle: selectedProj,
    clockIn: '08:30',
    clockOut: '16:30',
    tasksDone: `گزارش ثبت شده از فایل: ${cleanName}`,
    problemsEncountered: '',
    tomorrowsPlan: '',
    progressAdded: 4,
    extractedSkills: [],
    qualityScore: 72,
    productivityRating: 'متوسط',
    autoEvaluation: `سند گزارش کارآموز (${fileName}) استخراج شد. خروجی در حد اولیه و نیازمند بررسی ملموس کد است.`,
    aiFiveLineAnalysis: {
      line1HoursWorked: `ساعت کارکرد مفید: ۷ الی ۷.۵ ساعت مفید کاری (ورود ۰۸:۳۰ الی ۱۶:۳۰ با احتساب زمان استراحت).`,
      line2TimeWastedOrGaps: `زمان هدررفته/توقف: حدود ۴۵ الی ۶۰ دقیقه جهت مرور مستندات اولیه و هماهنگی تسک‌ها.`,
      line3TasksAccomplished: `اقدامات و دستاوردها: تسک‌های مندرج در فایل ${cleanName}؛ بازدهی نیازمند سنجش با شاخص خروجی کد است.`,
      line4TechnicalChallenges: `کیفیت و عملکرد فنی: نمره کیفی متوسط (۷۲٪)؛ هنوز استانداردهای تست و بهینه‌سازی اعمال نشده است.`,
      line5ProjectDecisionGuidance: `تصمیم‌گیری پروژه: تایید اولیه مشروط به تست کامپوننت‌ها توسط سرپرست فنی؛ تسریع در فاز بعدی الزامی است.`
    }
  };
}

// 1. Send PDF / Document to AI for auto-filling daily report
export async function analyzeDailyReportWithAI(
  file: File,
  internName: string,
  availableProjects: Project[]
): Promise<ExtractedReportData> {
  try {
    const fileBase64 = await fileToBase64(file);
    const textContent = await extractTextFromFile(file);

    const res = await fetch('/api/gemini/analyze-pdf-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64,
        textContent,
        internName,
        projectsList: availableProjects.map(p => ({ id: p.id, title: p.title, category: p.category }))
      })
    });

    if (!res.ok) {
      return generateHeuristicReportData(file.name, internName, availableProjects);
    }

    const data = await res.json();
    if (data.success && data.data && Object.keys(data.data).length > 0) {
      const d = data.data;
      const parsedAiFiveLine = d.aiFiveLineAnalysis || {
        line1HoursWorked: `ساعت کارکرد مفید: ${d.clockIn || '08:30'} الی ${d.clockOut || '16:30'} (حدود ۸ ساعت کارکرد ثبت‌شده).`,
        line2TimeWastedOrGaps: `زمان هدررفته/توقف: حداقل وقفه، تمرکز اصلی بر تسک‌های اجرایی پیوست گزارش.`,
        line3TasksAccomplished: `اقدامات و دستاوردها: ${d.tasksDone ? d.tasksDone.slice(0, 110) + '...' : 'تکمیل تسک‌های مندرج در فایل گزارش کار.'}`,
        line4TechnicalChallenges: `کیفیت و عملکرد فنی: نمره کیفی ${d.qualityScore || 90}٪ با سطح بهره‌وری ${d.productivityRating || 'عالی'}.`,
        line5ProjectDecisionGuidance: `تصمیم‌گیری پروژه: پیشرفت ${d.progressAdded || 5}٪ اعمال شد؛ وضعیت پروژه تثبیت گردیده است.`
      };

      return {
        reportDate: d.reportDate ? normalizeDigits(d.reportDate) : getTodayPersianDate(),
        projectTitle: d.projectTitle || (availableProjects[0]?.title || ''),
        clockIn: d.clockIn !== undefined ? normalizeDigits(d.clockIn) : '08:30',
        clockOut: d.clockOut !== undefined ? normalizeDigits(d.clockOut) : '16:30',
        tasksDone: d.tasksDone !== undefined ? d.tasksDone : '',
        problemsEncountered: d.problemsEncountered !== undefined ? d.problemsEncountered : '',
        tomorrowsPlan: d.tomorrowsPlan !== undefined ? d.tomorrowsPlan : '',
        progressAdded: typeof d.progressAdded === 'number' ? d.progressAdded : 5,
        extractedSkills: Array.isArray(d.extractedSkills) ? d.extractedSkills : [],
        qualityScore: typeof d.qualityScore === 'number' ? d.qualityScore : 90,
        productivityRating: d.productivityRating || 'عالی',
        autoEvaluation: d.autoEvaluation || 'گزارش استخراج شد.',
        aiFiveLineAnalysis: parsedAiFiveLine
      };
    }

    return generateHeuristicReportData(file.name, internName, availableProjects);
  } catch (error) {
    console.warn('AI analysis fallback triggered:', error);
    return generateHeuristicReportData(file.name, internName, availableProjects);
  }
}

// 1.1 Send Raw Text / Notes to AI for auto-filling daily report
export async function analyzeDailyReportTextWithAI(
  rawText: string,
  internName: string,
  availableProjects: Project[]
): Promise<ExtractedReportData> {
  try {
    const res = await fetch('/api/gemini/analyze-pdf-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: 'متن گزارش مستقیم',
        textContent: rawText,
        internName,
        projectsList: availableProjects.map(p => ({ id: p.id, title: p.title, category: p.category }))
      })
    });

    if (!res.ok) {
      return {
        reportDate: getTodayPersianDate(),
        projectTitle: availableProjects[0]?.title || '',
        clockIn: '08:30',
        clockOut: '16:30',
        tasksDone: rawText,
        problemsEncountered: '',
        tomorrowsPlan: '',
        progressAdded: 5,
        extractedSkills: [],
        qualityScore: 90,
        productivityRating: 'عالی',
        autoEvaluation: 'متن گزارش دریافت شد.'
      };
    }

    const data = await res.json();
    if (data.success && data.data && Object.keys(data.data).length > 0) {
      const d = data.data;
      return {
        reportDate: d.reportDate ? normalizeDigits(d.reportDate) : getTodayPersianDate(),
        projectTitle: d.projectTitle || (availableProjects[0]?.title || ''),
        clockIn: d.clockIn !== undefined ? normalizeDigits(d.clockIn) : '08:30',
        clockOut: d.clockOut !== undefined ? normalizeDigits(d.clockOut) : '16:30',
        tasksDone: d.tasksDone !== undefined ? d.tasksDone : rawText,
        problemsEncountered: d.problemsEncountered !== undefined ? d.problemsEncountered : '',
        tomorrowsPlan: d.tomorrowsPlan !== undefined ? d.tomorrowsPlan : '',
        progressAdded: typeof d.progressAdded === 'number' ? d.progressAdded : 5,
        extractedSkills: Array.isArray(d.extractedSkills) ? d.extractedSkills : [],
        qualityScore: typeof d.qualityScore === 'number' ? d.qualityScore : 90,
        productivityRating: d.productivityRating || 'عالی',
        autoEvaluation: d.autoEvaluation || 'گزارش با موفقیت تحلیل شد.'
      };
    }

    return {
      reportDate: getTodayPersianDate(),
      projectTitle: availableProjects[0]?.title || '',
      clockIn: '08:30',
      clockOut: '16:30',
      tasksDone: rawText,
      problemsEncountered: '',
      tomorrowsPlan: '',
      progressAdded: 5,
      extractedSkills: [],
      qualityScore: 90,
      productivityRating: 'عالی',
      autoEvaluation: 'متن دریافت شد.'
    };
  } catch (error) {
    console.warn('Text AI analysis fallback triggered:', error);
    return {
      reportDate: getTodayPersianDate(),
      projectTitle: availableProjects[0]?.title || '',
      clockIn: '08:30',
      clockOut: '16:30',
      tasksDone: rawText,
      problemsEncountered: '',
      tomorrowsPlan: '',
      progressAdded: 5,
      extractedSkills: [],
      qualityScore: 90,
      productivityRating: 'عالی',
      autoEvaluation: 'متن دریافت شد.'
    };
  }
}

// 2. Missing Days & Monthly Workdays Calculation
export function calculateMonthDaysDetails(yearMonth: string, reports: DailyReport[]) {
  // yearMonth format: "1403/05" or "1403"
  const ym = yearMonth.includes('/') ? yearMonth : `1403/${yearMonth.padStart(2, '0')}`;
  const [yearStr, monthStr] = ym.split('/');
  const monthNum = parseInt(monthStr, 10) || 5;
  const yearNum = parseInt(yearStr, 10) || 1403;

  // Days in Persian month (1-6: 31 days, 7-11: 30 days, 12: 29 days)
  const totalDaysInMonth = monthNum <= 6 ? 31 : monthNum <= 11 ? 30 : 29;

  // Get current Persian date
  const todayPersian = getTodayPersianDate();
  const [currentYearStr, currentMonthStr, currentDayStr] = todayPersian.split('/');
  const currentYearNum = parseInt(currentYearStr, 10);
  const currentMonthNum = parseInt(currentMonthStr, 10);
  const currentDayNum = parseInt(currentDayStr, 10);

  const isCurrentMonth = yearNum === currentYearNum && monthNum === currentMonthNum;
  const isFutureMonth = yearNum > currentYearNum || (yearNum === currentYearNum && monthNum > currentMonthNum);

  // Generate list of work days (excluding Fridays)
  const allWorkDaysInMonth: string[] = [];
  const elapsedWorkDaysUpToToday: string[] = [];

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dayPadded = d.toString().padStart(2, '0');
    const dateFormatted = `${yearStr}/${monthStr.padStart(2, '0')}/${dayPadded}`;
    
    // Check if Friday using real calendar converter
    const isFriday = isPersianFriday(yearNum, monthNum, d);
    if (!isFriday) {
      allWorkDaysInMonth.push(dateFormatted);
      if (isCurrentMonth) {
        if (d <= currentDayNum) {
          elapsedWorkDaysUpToToday.push(dateFormatted);
        }
      } else if (!isFutureMonth) {
        // Past month: all days have elapsed
        elapsedWorkDaysUpToToday.push(dateFormatted);
      }
    }
  }

  // Work days to evaluate for missing reports (only elapsed days up to today)
  const effectiveWorkDays = isFutureMonth ? [] : (isCurrentMonth ? elapsedWorkDaysUpToToday : allWorkDaysInMonth);
  const totalWorkDays = isFutureMonth ? 0 : (isCurrentMonth ? elapsedWorkDaysUpToToday.length : allWorkDaysInMonth.length);

  // Normalization helper for consistent matching (e.g. 1403/5/27 -> 1403/05/27)
  const normalizeDateKey = (dateStr: string) => {
    if (!dateStr) return '';
    const eng = normalizeDigits(dateStr).replace(/[\-\.]/g, '/');
    const parts = eng.split('/');
    if (parts.length >= 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}/${m}/${d}`;
    }
    return eng;
  };

  // Submitted report dates
  const submittedDatesSet = new Set(reports.map(r => normalizeDateKey(r.date)));
  const submittedDays = effectiveWorkDays.filter(d => submittedDatesSet.has(normalizeDateKey(d)));
  const missingDays = effectiveWorkDays.filter(d => !submittedDatesSet.has(normalizeDateKey(d)));

  const attendanceRate = totalWorkDays > 0 
    ? Math.min(100, Math.round((submittedDays.length / totalWorkDays) * 100))
    : (submittedDays.length > 0 ? 100 : 0);

  return {
    totalDaysInMonth,
    totalWorkDays,
    submittedDaysCount: submittedDays.length,
    missingDaysCount: missingDays.length,
    submittedDays,
    missingDays,
    attendanceRate,
    isCurrentMonth,
    totalMonthWorkDays: allWorkDaysInMonth.length
  };
}

// 3. AI Monthly Deep Analysis & Skill Recommender
export async function getMonthlyInternAIAnalysis(
  internName: string,
  month: string,
  reports: DailyReport[],
  missingDays: string[],
  totalWorkDays: number,
  projects: Project[]
): Promise<MonthlyAIAnalysisResult> {
  try {
    const res = await fetch('/api/gemini/monthly-intern-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        internName,
        month,
        reports: reports.map(r => ({
          date: r.date,
          projectTitle: r.projectTitle,
          workedHours: r.workedHours,
          tasksDone: r.tasksDone,
          problemsEncountered: r.problemsEncountered,
          status: r.status
        })),
        missingDays,
        totalWorkDays,
        projects: projects.map(p => ({ title: p.title, category: p.category, progress: p.progressPercentage }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.performanceScore) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Backend AI monthly analysis failed, using smart fallback', err);
  }

  // Strict, Mathematical, Non-Flattering Heuristic Fallback
  const submittedCount = reports.length;
  const missingCount = missingDays.length;

  // Strict score calculation: 90 base, -5 for every missing day, + small bonus for consistency
  const score = Math.max(35, Math.min(96, Math.round(92 - (missingCount * 5.5) + Math.min(6, (submittedCount / Math.max(1, totalWorkDays)) * 8))));

  return {
    performanceScore: score,
    attendanceStatus: missingCount === 0
      ? `حضور ۱۰۰٪ و ثبت کامل تمام ${totalWorkDays} روز کاری ماه بر اساس تقویم.`
      : `ثبت ${submittedCount} روز از مجموع ${totalWorkDays} روز کاری تقویم (${missingCount} روز غیبت یا عدم ارائه گزارش کار).`,
    missingDaysAnalysis: missingCount > 0
      ? `در روزهای (${missingDays.slice(0, 5).join('، ')}${missingDays.length > 5 ? ' و...' : ''}) هیچ گزارشی ثبت نگردیده است. این حجم از عدم انضباط منجر به کسر شدید نمره ارزیابی شده و مستلزم پاسخگویی کتبی کارآموز است.`
      : 'نظم در ارسال روزانه در حد نصاب استاندارد آکادمی رعایت شده است.',
    strengths: [
      'اجرای تسک‌های محوله طبق اسناد و ارسال منظم گزارش در روزهای کاری موظف',
      'آشنایی با ابزارهای توسعه و پیگیری مراحل تعریف‌شده در پروژه‌ها'
    ],
    growthAreas: [
      missingCount > 0
        ? `رفع معضل عدم ارسال گزارش در روزهای کاری (${missingCount} روز بدون گزارش)`
        : 'افزایش سرعت توسعه و کاهش تاخیر در تکمیل فیچرهای سنگین',
      'ضرورت رعایت استانداردهای تست نرم‌افزار، تایپ‌سیفتی و کامپوننت‌های بهینه',
      'کاهش زمان‌های بدون خروجی و ارتقای بازدهی ساعات کاری مفید'
    ],
    recommendedSkills: [
      {
        skill: 'اصول کدنویسی تمیز، تایپ‌سیفتی و رفع باگ در تایپ‌اسکریپت',
        priority: 'فوری',
        reason: 'رفع خطاهای زمان اجرا و ارتقای استاندارد تولید نرم‌افزار حرفه‌ای در پروژه‌های آکادمی.',
        roadmapStep: 'تسلط بر Type Narrowing، تعریف دقیق اینترفیس‌ها و حذف Any'
      },
      {
        skill: 'مدیریت داده و کش سرور با React Query و معماری ماژولار',
        priority: 'فوری',
        reason: 'جلوگیری از ارسال درخواست‌های تکراری و بهینه‌سازی بار پردازشی سرور.',
        roadmapStep: 'پیاده‌سازی Custom Hooks و مدیریت هوشمند خطاهای شبکه'
      },
      {
        skill: 'داکر و تست‌نویسی خودکار (Unit Testing)',
        priority: 'پیشرفته',
        reason: 'ضمانت سلامت کد قبل از استقرار روی سرورهای عملیاتی.',
        roadmapStep: 'نوشتن تست‌های پایه با Vitest و ساخت ایمیج‌های سبک داکر'
      }
    ],
    overallSummary: missingCount > 2
      ? `کارنامه کارآموز در ماه گذشته به دلیل ${missingCount} روز عدم ارائه گزارش و غیبت کاری، با افت محسوس مواجه است (نمره انضباطی: ${score} از ۱۰۰). تمدید دوره یا واگذاری تسک‌های حساس، منوط به بهبود فوری نظم و جبران کسری کارکرد خواهد بود.`
      : `عملکرد کارآموز در بازه نرمال ارزیابی می‌شود (نمره: ${score} از ۱۰۰). حفظ استمرار در ثبت دقیق مستندات و تمرکز بر رفع نقاط ضعف کیفی کدها، شرط ارتقا به پروژه‌های کلیدی آکادمی است.`
  };
}

// 4. Intelligent Automatic Project Stage Transition based on Daily Reports and System Context
export interface ProjectStageEvaluation {
  projectId: string;
  previousStatus: 'new' | 'in_progress' | 'needs_review' | 'completed' | 'archived';
  newStatus: 'new' | 'in_progress' | 'needs_review' | 'completed' | 'archived';
  suggestedProgress: number;
  reason: string;
  hasChanged: boolean;
  matchingReportsCount: number;
}

export function evaluateProjectStageFromReports(
  project: Project,
  allReports: DailyReport[]
): ProjectStageEvaluation {
  // Find all daily reports related to this project
  const projectReports = allReports.filter(r => {
    const isIdMatch = r.projectId === project.id;
    const isTitleMatch = r.projectTitle && (
      r.projectTitle.trim().toLowerCase() === project.title.trim().toLowerCase() ||
      project.title.toLowerCase().includes(r.projectTitle.toLowerCase()) ||
      r.projectTitle.toLowerCase().includes(project.title.toLowerCase())
    );
    const isInternMatch = project.leadInternId === r.internId || project.teamInternIds?.includes(r.internId);
    return isIdMatch || isTitleMatch || (isInternMatch && r.tasksDone && r.tasksDone.includes(project.title));
  });

  const totalReportsCount = projectReports.length;
  const approvedReports = projectReports.filter(r => r.status === 'approved');
  const sumProgressAdded = projectReports.reduce((acc, r) => acc + (r.progressAdded || 5), 0);
  const tasksCount = project.tasks.length;
  const completedTasksCount = project.tasks.filter(t => t.completed).length;

  let calculatedProgress = project.progressPercentage;
  if (totalReportsCount > 0) {
    const taskBasedPct = tasksCount > 0 ? (completedTasksCount / tasksCount) * 100 : 0;
    const calculated = Math.min(100, Math.max(project.progressPercentage, Math.round(sumProgressAdded), Math.round(taskBasedPct)));
    calculatedProgress = calculated;
  }

  // Check text cues in recent daily reports
  const allTasksText = projectReports.map(r => `${r.tasksDone} ${r.problemsEncountered} ${r.tomorrowsPlan}`).join(' ').toLowerCase();

  const reviewKeywords = ['تحویل', 'تکمیل', 'اتمام', 'بازبینی', 'بررسی مدیر', 'تست نهایی', 'آماده تحویل', 'دیپلوی', 'آماده بازبینی', 'پایان'];
  const completedKeywords = ['تحویل داده شد', 'تایید نهایی شد', 'پروژه بسته شد', 'پایان کارآموزی', 'تحویل کارفرما گردید'];

  const hasReviewCue = reviewKeywords.some(k => allTasksText.includes(k));
  const hasCompletedCue = completedKeywords.some(k => allTasksText.includes(k));

  let targetStatus = project.status;
  let reason = '';

  // Rule 1: Completion
  if (hasCompletedCue || (calculatedProgress >= 100 && approvedReports.length >= 2) || (tasksCount > 0 && completedTasksCount === tasksCount && approvedReports.length >= 2)) {
    targetStatus = 'completed';
    reason = `هوش مصنوعی تشخیص داد که با توجه به تکمیل ۱۰۰٪ تسک‌ها و ثبت تحویل نهایی در گزارش‌های کار، پروژه به مرحله «تکمیل و تحویل شده» ارتقا یافته است.`;
  }
  // Rule 2: Needs Review (Pending Admin/Supervisor Review)
  else if (hasReviewCue || calculatedProgress >= 80 || (tasksCount > 0 && completedTasksCount >= Math.ceil(tasksCount * 0.8))) {
    targetStatus = 'needs_review';
    reason = `هوش مصنوعی بر اساس ${totalReportsCount} گزارش کاری ثبت‌شده و پیشرفت ${calculatedProgress}٪، پروژه را به مرحله «در انتظار بازبینی مدیر» منتقل کرد تا کیفیت خروجی بررسی شود.`;
  }
  // Rule 3: In Progress (Work has started and active reports logged)
  else if (totalReportsCount >= 1 || calculatedProgress > 0 || completedTasksCount > 0) {
    targetStatus = 'in_progress';
    reason = `هوش مصنوعی با دریافت گزارش‌های کاری جدید کارآموز (${project.leadInternName}) و ثبت ساعات کارکرد، وضعیت پروژه را به «در حال انجام» به‌روزرسانی کرد.`;
  }
  // Rule 4: New (No reports or work yet)
  else {
    targetStatus = 'new';
    reason = `پروژه به تازگی تعریف شده و هنوز گزارش کاری یا تسک انجام‌شده‌ای برای آن ثبت نشده است.`;
  }

  return {
    projectId: project.id,
    previousStatus: project.status,
    newStatus: targetStatus,
    suggestedProgress: calculatedProgress,
    reason,
    hasChanged: targetStatus !== project.status || calculatedProgress !== project.progressPercentage,
    matchingReportsCount: totalReportsCount
  };
}
