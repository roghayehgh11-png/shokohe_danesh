import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayPersianDate, getPersianFullDateInfo } from '../../utils/dateUtils';
import { cleanAndNormalizeEmail } from '../../utils/emailUtils';
import {
  Database,
  Download,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  DollarSign,
  MessageSquare,
  Shield,
  X,
  Sparkles,
  Copy,
  Check,
  History,
  Trash2,
  AlertCircle,
  Upload,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_EMAIL_HISTORY_KEY = 'shokooh_danesh_backup_emails_history';
const DEFAULT_SAVED_EMAILS = [
  'roghayeh.ghanbari18@gmail.com',
  'manager@shokooh.ir',
  'admin@shokooh-danesh.ir'
];

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    courses,
    projects,
    dailyReports,
    customerLeads,
    tuitions,
    payments,
    installments,
    expenses,
    teacherSalaries,
    messages,
    notifications,
    activityLogs,
    restoreBackup
  } = useApp();

  // Backup Scope Mode: 'today' | 'all' | 'custom'
  const [scopeMode, setScopeMode] = useState<'today' | 'all' | 'custom'>('today');

  // Custom module selection states
  const [selectedModules, setSelectedModules] = useState({
    users: true,
    courses: true,
    crm: true,
    projects: true,
    dailyReports: true,
    financial: true,
    messages: true,
    logs: true
  });

  // Email input, optional user message, and suggestions state
  const [targetEmail, setTargetEmail] = useState('roghayeh.ghanbari18@gmail.com');
  const [userNote, setUserNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [savedEmails, setSavedEmails] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_EMAIL_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_SAVED_EMAILS;
  });
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);

  // Status & notifications
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const todayPersian = getTodayPersianDate();
  const dateInfo = getPersianFullDateInfo();

  // Real-time email auto-correction analysis
  const emailAnalysis = cleanAndNormalizeEmail(targetEmail);

  // Immediate alternative fallback: send via local mail client + auto download
  const handleSendViaMailClient = () => {
    const activeTarget = emailAnalysis.normalized || targetEmail;
    handleDownloadBackup();
    const subject = encodeURIComponent(`بک‌آپ اطلاعات آکادمی شکوه دانش - تاریخ ${todayPersian}`);
    const noteContent = userNote ? `\n\nتوضیحات تکمیلی کاربر:\n${userNote}` : '';
    const body = encodeURIComponent(
      `با سلام و احترام،\n\nفایل بک‌آپ داده‌های آکادمی شکوه دانش (تاریخ ${todayPersian}) پیوست این ایمیل گردید.${noteContent}\n\nتعداد کل رکوردهای خالص: ${generateBackupPayload().summary.totalRecords}\nفرستنده: ${currentUser.name} (${currentUser.role})\n\n(فایل json پشتیبان به صورت خودکار در سیستم شما دانلود شد؛ لطفاً آن را به این ایمیل پیوست نمایید.)`
    );
    window.location.href = `mailto:${activeTarget}?subject=${subject}&body=${body}`;
  };

  // Save email to history
  const saveEmailToHistory = (email: string) => {
    const cleaned = cleanAndNormalizeEmail(email).normalized;
    if (!cleaned || !cleaned.includes('@')) return;
    const updated = [cleaned, ...savedEmails.filter(e => (e || '').toLowerCase() !== cleaned.toLowerCase())].slice(0, 10);
    setSavedEmails(updated);
    try {
      localStorage.setItem(STORAGE_EMAIL_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Remove email from history
  const removeEmailFromHistory = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = savedEmails.filter(e => e !== emailToRemove);
    setSavedEmails(updated);
    try {
      localStorage.setItem(STORAGE_EMAIL_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Close email dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(e.target as Node) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(e.target as Node)
      ) {
        setIsEmailDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter emails based on current input
  const filteredEmailSuggestions = savedEmails.filter(e =>
    (e || '').toLowerCase().includes((targetEmail || '').toLowerCase().trim())
  );

  // Pure Data Sanitizer: Strips all files, images, attachments binaries, photos and base64 strings
  // Ensures backup contains exclusively pure system records, text, numbers and forms
  const sanitizePureDataRecords = (data: any): any => {
    if (!data) return data;

    const cleanItem = (item: any): any => {
      if (!item || typeof item !== 'object') return item;

      if (Array.isArray(item)) {
        return item.map(cleanItem);
      }

      const cleaned: Record<string, any> = {};
      for (const [key, val] of Object.entries(item)) {
        const lowerKey = key.toLowerCase();

        // 1. Exclude file and image properties
        if (
          lowerKey === 'avatar' ||
          lowerKey === 'image' ||
          lowerKey === 'imagedata' ||
          lowerKey === 'base64' ||
          lowerKey === 'resumeurl' ||
          lowerKey === 'resumebase64' ||
          lowerKey === 'resumesize' ||
          lowerKey === 'photo' ||
          lowerKey === 'localstoragedump' ||
          lowerKey === 'filecontent' ||
          lowerKey === 'blob'
        ) {
          continue; // Strip completely
        }

        // 2. Attachments & Materials: Keep only text metadata (id, title, date, name), strip binary urls
        if (lowerKey === 'attachments' && Array.isArray(val)) {
          cleaned[key] = val.map((att: any) => ({
            id: att.id,
            name: att.name || att.title || 'پیوست',
            date: att.date || att.createdAt,
            uploadedBy: att.uploadedBy
          }));
          continue;
        }

        if (lowerKey === 'materials' && Array.isArray(val)) {
          cleaned[key] = val.map((mat: any) => ({
            id: mat.id,
            title: mat.title,
            type: mat.type
          }));
          continue;
        }

        // 3. Strip large base64 or data URLs from any other text fields
        if (typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('data:application/') || (val.length > 1500 && !val.includes(' ')))) {
          continue;
        }

        if (typeof val === 'object' && val !== null) {
          cleaned[key] = cleanItem(val);
        } else {
          cleaned[key] = val;
        }
      }
      return cleaned;
    };

    return cleanItem(data);
  };

  // Generate backup data payload based on selected scope (Pure Data Only - No Files or Images)
  const generateBackupPayload = () => {
    const nowIso = new Date().toISOString();

    if (scopeMode === 'today') {
      const todayReports = dailyReports.filter(r => r.date === todayPersian || r.createdAt?.includes(todayPersian));
      const todayPayments = payments.filter(p => p.paymentDate === todayPersian || p.createdAt?.includes(todayPersian));
      const todayExpenses = expenses.filter(e => e.expenseDate === todayPersian || e.createdAt?.includes(todayPersian));
      const todayTuitions = tuitions.filter(t => t.createdAt === todayPersian || t.createdAt?.includes(todayPersian));
      const todayLeads = customerLeads.filter(l => l.contactDate === todayPersian || l.createdAt?.includes(todayPersian));
      const todayLogs = activityLogs.filter(a => a.timestamp?.includes(todayPersian));
      const todayMessages = messages.filter(m => m.timestamp?.includes(todayPersian));

      return {
        backupType: 'TODAY_INCREMENTAL_PURE_DATA_BACKUP',
        backupFormat: 'TEXT_RECORDS_ONLY',
        backupDatePersian: todayPersian,
        timestamp: nowIso,
        operator: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        },
        summary: {
          dailyReportsCount: todayReports.length,
          paymentsCount: todayPayments.length,
          expensesCount: todayExpenses.length,
          tuitionsCount: todayTuitions.length,
          leadsCount: todayLeads.length,
          messagesCount: todayMessages.length,
          logsCount: todayLogs.length,
          totalRecords: todayReports.length + todayPayments.length + todayExpenses.length + todayTuitions.length + todayLeads.length + todayMessages.length + todayLogs.length
        },
        data: sanitizePureDataRecords({
          dailyReports: todayReports,
          payments: todayPayments,
          expenses: todayExpenses,
          tuitions: todayTuitions,
          installments: installments,
          customerLeads: todayLeads,
          messages: todayMessages,
          activityLogs: todayLogs
        })
      };
    }

    if (scopeMode === 'all') {
      return {
        backupType: 'FULL_SYSTEM_PURE_DATA_SNAPSHOT',
        backupFormat: 'TEXT_RECORDS_ONLY',
        backupDatePersian: todayPersian,
        timestamp: nowIso,
        operator: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        },
        summary: {
          usersCount: users.length,
          coursesCount: courses.length,
          projectsCount: projects.length,
          dailyReportsCount: dailyReports.length,
          leadsCount: customerLeads.length,
          tuitionsCount: tuitions.length,
          paymentsCount: payments.length,
          installmentsCount: installments.length,
          expensesCount: expenses.length,
          salariesCount: teacherSalaries.length,
          messagesCount: messages.length,
          notificationsCount: notifications.length,
          logsCount: activityLogs.length,
          totalRecords: users.length + courses.length + projects.length + dailyReports.length + customerLeads.length + tuitions.length + payments.length + installments.length + expenses.length + teacherSalaries.length + messages.length + notifications.length + activityLogs.length
        },
        data: sanitizePureDataRecords({
          users,
          courses,
          projects,
          dailyReports,
          customerLeads,
          tuitions,
          payments,
          installments,
          expenses,
          teacherSalaries,
          messages,
          notifications,
          activityLogs
        })
      };
    }

    // Custom Selected Modules
    const customData: Record<string, any> = {};
    const customSummary: Record<string, number> = {};
    let totalCount = 0;

    if (selectedModules.users) {
      customData.users = users;
      customSummary.usersCount = users.length;
      totalCount += users.length;
    }
    if (selectedModules.courses) {
      customData.courses = courses;
      customSummary.coursesCount = courses.length;
      totalCount += courses.length;
    }
    if (selectedModules.crm) {
      customData.customerLeads = customerLeads;
      customSummary.leadsCount = customerLeads.length;
      totalCount += customerLeads.length;
    }
    if (selectedModules.projects) {
      customData.projects = projects;
      customSummary.projectsCount = projects.length;
      totalCount += projects.length;
    }
    if (selectedModules.dailyReports) {
      customData.dailyReports = dailyReports;
      customSummary.dailyReportsCount = dailyReports.length;
      totalCount += dailyReports.length;
    }
    if (selectedModules.financial) {
      customData.tuitions = tuitions;
      customData.payments = payments;
      customData.installments = installments;
      customData.expenses = expenses;
      customData.teacherSalaries = teacherSalaries;
      customSummary.financialRecordsCount = tuitions.length + payments.length + installments.length + expenses.length + teacherSalaries.length;
      totalCount += customSummary.financialRecordsCount;
    }
    if (selectedModules.messages) {
      customData.messages = messages;
      customSummary.messagesCount = messages.length;
      totalCount += messages.length;
    }
    if (selectedModules.logs) {
      customData.activityLogs = activityLogs;
      customData.notifications = notifications;
      customSummary.logsCount = activityLogs.length + notifications.length;
      totalCount += customSummary.logsCount;
    }

    return {
      backupType: 'CUSTOM_SELECTIVE_PURE_DATA_BACKUP',
      backupFormat: 'TEXT_RECORDS_ONLY',
      backupDatePersian: todayPersian,
      timestamp: nowIso,
      operator: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      },
      summary: {
        ...customSummary,
        totalRecords: totalCount
      },
      data: sanitizePureDataRecords(customData)
    };
  };

  // Handle Download JSON
  const handleDownloadBackup = () => {
    const payload = generateBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const prefix = scopeMode === 'today' ? 'today_backup' : scopeMode === 'all' ? 'full_snapshot' : 'custom_backup';
    link.href = url;
    link.download = `shokooh_danesh_${prefix}_${todayPersian.replace(/\//g, '-')}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: 'success',
      text: 'فایل پشتیبان با موفقیت بر روی دستگاه شما ذخیره گردید.',
      details: `حجم تقریبی: ${(blob.size / 1024).toFixed(1)} کیلوبایت | تعداد رکوردها: ${payload.summary.totalRecords}`
    });
  };

  // Handle Direct Upload/Restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.localStorage) {
          Object.keys(parsed.localStorage).forEach(key => {
            localStorage.setItem(key, parsed.localStorage[key]);
          });
        }
        if (parsed.data?.localStorageDump) {
          Object.keys(parsed.data.localStorageDump).forEach(key => {
            localStorage.setItem(key, parsed.data.localStorageDump[key]);
          });
        }
        restoreBackup(parsed);
        setStatusMessage({
          type: 'success',
          text: 'اطلاعات با موفقیت از فایل پشتیبان بازیابی گردید.',
          details: 'تمامی بخش‌ها شامل کاربران، دوره‌ها، پروژه‌ها و امور مالی همگام‌سازی شدند.'
        });
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: 'خطا در خواندن فایل پشتیبان.',
          details: 'لطفاً مطمئن شوید که فایل انتخابی یک فایل JSON معتبر بکاپ شکوه دانش است.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleCopyBackup = () => {
    const payload = generateBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2500);
  };

  // Handle Send via Direct In-App Email Dispatcher
  const handleSendBackupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const destinationEmail = emailAnalysis.normalized || targetEmail.trim();

    if (!destinationEmail || !destinationEmail.includes('@')) {
      setStatusMessage({
        type: 'error',
        text: 'لطفاً یک آدرس ایمیل معتبر وارد فرمایید.'
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    // Save this email to history
    saveEmailToHistory(destinationEmail);

    const payload = generateBackupPayload();

    const scopeTitle =
      scopeMode === 'today'
        ? `داده‌های ثبت‌شده امروز (${todayPersian})`
        : scopeMode === 'all'
        ? `کل داده‌های دیتابیس آکادمی`
        : `بخش‌های انتخابی سامانه`;

    const emailSubject = `بک‌آپ اطلاعات آکادمی شکوه دانش - ${scopeTitle} - تاریخ ${todayPersian}`;
    const emailBody = `با سلام و احترام،\n\nفایل پشتیبان سامانه جامع مدیریت آکادمی فناوری اطلاعات شکوه دانش با موفقیت صادر و ارسال گردید.\n\n` +
      `📌 مشخصات بسته پشتیبان:\n` +
      `- نوع بک‌آپ: ${scopeTitle}\n` +
      `- تاریخ شمسی: ${dateInfo.fullFormatted}\n` +
      `- زمان ایجاد: ${dateInfo.timeStr}\n` +
      `- کاربر صادرکننده: ${currentUser.name} (${currentUser.role})\n` +
      `- مجموع رکوردهای بسته: ${payload.summary.totalRecords} رکورد\n\n` +
      (userNote ? `💬 توضیحات فرستنده:\n${userNote}\n\n` : '') +
      `آکادمی کامپیوتر و فناوری اطلاعات شکوه دانش`;

    try {
      const response = await fetch('/api/email/send-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: destinationEmail,
          subject: emailSubject,
          bodyText: emailBody,
          backupPayload: payload,
          senderName: currentUser.name,
          userMessage: userNote.trim()
        })
      });

      const resData = await response.json();

      if (resData.success) {
        const correctionNote = resData.wasCorrected
          ? ` (آدرس ورودی «${resData.originalEmail}» به صورت خودکار اصلاح شد)`
          : '';
        setStatusMessage({
          type: 'success',
          text: `✅ فایل پشتیبان با موفقیت از طریق سرور مرکزی آکادمی به ${resData.recipient || destinationEmail} ارسال گردید.${correctionNote}`,
          details: `کد رهگیری: ${resData.trackingId || 'SHK-SUCCESS'} | شیوه ارسال: ${resData.deliveredVia || 'سرور مرکزی'} | رکوردهای انتقال‌یافته: ${payload.summary.totalRecords} رکورد`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: resData.error || 'خطا در ارسال مستقیم ایمیل از سرور.',
          details: 'در صورت تمایل می‌توانید با کلیک بر روی دکمه «ارسال با برنامه ایمیل»، فایل را مستقیماً از طریق نرم‌افزار ایمیل ویندوز/موبایل خود ارسال فرمایید.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور مرکزی.',
        details: 'ارتباط موقتاً با مشکل مواجه شد. لطفاً مجدداً امتحان کنید یا از دکمه «ارسال با برنامه ایمیل» استفاده فرمایید.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Only Admin or Manager has access, but show friendly fallback instead of blocking
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">دسترسی مدیریت مورد نیاز است</h3>
          <p className="text-xs text-slate-500">قابلیت پشتیبان‌گیری و ارسال ایمیل اطلاعات، در اختیار مدیر آکادمی می‌باشد.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-500"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                مرکز پشتیبان‌گیری جامع و ارسال به ایمیل
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                  مخصوص مدیر
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تهیه نسخه پشتیبان امن، تفکیکی و ارسال به ایمیل — <strong className="text-emerald-600 dark:text-emerald-400 font-bold">صرفاً اطلاعات و رکوردهای واردشده در سیستم (بدون فایل‌ها و تصاویر)</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Date and Time Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>تاریخ و زمان فعلی سامانه:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">{dateInfo.fullFormatted}</span>
          </div>
          <span className="font-mono font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-xl text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            ساعت: {dateInfo.timeStr}
          </span>
        </div>

        {/* Step 1: Select Scope */}
        <div className="space-y-3">
          <label className="block text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" />
            ۱. انتخاب محدوده اطلاعات برای پشتیبان‌گیری:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Scope 1: Today's data */}
            <button
              type="button"
              onClick={() => setScopeMode('today')}
              className={`p-3.5 rounded-2xl text-right transition-all border flex flex-col justify-between gap-1.5 ${
                scopeMode === 'today'
                  ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  اطلاعات وارد شده امروز
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                گزارش‌های روزانه، پرداخت‌ها، هزینه‌ها و لیدهای ثبت‌شده در تاریخ امروز ({todayPersian})
              </p>
            </button>

            {/* Scope 2: Full Database */}
            <button
              type="button"
              onClick={() => setScopeMode('all')}
              className={`p-3.5 rounded-2xl text-right transition-all border flex flex-col justify-between gap-1.5 ${
                scopeMode === 'all'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  کل پایگاه داده (Full)
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                تمام کاربران، دوره‌ها، کلاس‌ها، پروژه‌ها، تراکنش‌ها، لاگ‌ها و چت‌ها
              </p>
            </button>

            {/* Scope 3: Custom Modules */}
            <button
              type="button"
              onClick={() => setScopeMode('custom')}
              className={`p-3.5 rounded-2xl text-right transition-all border flex flex-col justify-between gap-1.5 ${
                scopeMode === 'custom'
                  ? 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-100 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                  انتخاب بخش‌های خاص
                </span>
                <Layers className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                انتخاب دلخواه و سفارشی ماژول‌ها و بخش‌های مورد نظر
              </p>
            </button>
          </div>
        </div>

        {/* Custom Modules Checkboxes (if custom selected) */}
        {scopeMode === 'custom' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fade-in text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">بخش‌های مورد نظر را تیک بزنید:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'users', label: 'کاربران و اساتید', icon: Users },
                { key: 'courses', label: 'دوره‌ها و کلاس‌ها', icon: GraduationCap },
                { key: 'crm', label: 'سرنخ‌ها و CRM', icon: Briefcase },
                { key: 'projects', label: 'پروژه‌ها و کارآموزان', icon: Layers },
                { key: 'dailyReports', label: 'گزارش‌های روزانه', icon: FileText },
                { key: 'financial', label: 'امور مالی و دریافتی‌ها', icon: DollarSign },
                { key: 'messages', label: 'پیام‌رسان و چت‌ها', icon: MessageSquare },
                { key: 'logs', label: 'لاگ‌های امنیتی سیستم', icon: Shield }
              ].map(mod => {
                const Icon = mod.icon;
                const isChecked = selectedModules[mod.key as keyof typeof selectedModules];
                return (
                  <label
                    key={mod.key}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e =>
                        setSelectedModules(prev => ({
                          ...prev,
                          [mod.key]: e.target.checked
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate text-[11px]">{mod.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Email Destination with Smart Auto-Correction & Central Server Dispatch */}
        <form onSubmit={handleSendBackupEmail} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-500" />
              ۲. ارسال مستقیم فایل و گزارش پشتیبان به ایمیل:
            </label>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>سرور مرکزی ارسال ایمیل آکادمی فعال است</span>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={emailInputRef}
                  type="text"
                  required
                  value={targetEmail}
                  onChange={e => {
                    setTargetEmail(e.target.value);
                    setIsEmailDropdownOpen(true);
                  }}
                  onFocus={() => setIsEmailDropdownOpen(true)}
                  placeholder="آدرس ایمیل خود را وارد کنید (مثلاً: roghayeh.ghanbari18@gmail.com)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-4 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
                title="ارسال مستقیم بک‌آپ به ایمیل از طریق سرور مرکزی آکادمی"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                ارسال به ایمیل
              </button>

              <button
                type="button"
                onClick={handleSendViaMailClient}
                className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                title="دانلود خودکار فایل و باز کردن نرم‌افزار ایمیل (Outlook/Gmail Web)"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">ارسال با برنامه ایمیل</span>
              </button>
            </div>

            {/* Smart Email Autocomplete Dropdown */}
            {isEmailDropdownOpen && filteredEmailSuggestions.length > 0 && (
              <div
                ref={emailDropdownRef}
                className="absolute right-0 left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-scale-up max-h-56 overflow-y-auto"
              >
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <History className="w-3 h-3" />
                    ایمیل‌های ذخیره‌شده (انتخاب سریع)
                  </span>
                  <span>{filteredEmailSuggestions.length} مورد</span>
                </div>

                {filteredEmailSuggestions.map(email => (
                  <div
                    key={email}
                    onClick={() => {
                      setTargetEmail(email);
                      setIsEmailDropdownOpen(false);
                    }}
                    className="px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold">
                        @
                      </div>
                      <span className="font-mono text-slate-800 dark:text-slate-200 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {email}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={e => removeEmailFromHistory(e, email)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                      title="حذف از تاریخچه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Email Auto-Correction Banner */}
          {targetEmail && emailAnalysis.wasCorrected && (
            <div className="flex items-center justify-between bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 p-2.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>اصلاح هوشمند نگارش ایمیل:</strong> آدرس ورودی به صورت خودکار اصلاح شد و به عنوان <code className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700 dark:text-emerald-300">{emailAnalysis.normalized}</code> ارسال خواهد شد.
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 hidden sm:inline">
                {emailAnalysis.correctionReason || 'تطبیق خودکار دامنه'}
              </span>
            </div>
          )}

          {/* Optional User Message Field Toggle & Input */}
          <div className="pt-1">
            {!showNoteField ? (
              <button
                type="button"
                onClick={() => setShowNoteField(true)}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>+ افزودن متن پیام یا توضیحات به ایمیل (اختیاری)</span>
              </button>
            ) : (
              <div className="space-y-1.5 animate-fade-in bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                    متن پیام یا توضیحات ارسالی به همراه فایل پشتیبان:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUserNote('');
                      setShowNoteField(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    انصراف و حذف متن
                  </button>
                </div>
                <textarea
                  value={userNote}
                  onChange={e => setUserNote(e.target.value)}
                  placeholder="در صورت تمایل، یادداشت، توضیحات یا پیام خود را اینجا بنویسید تا درون ایمیل قرار گیرد..."
                  rows={2}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white resize-none"
                />
              </div>
            )}
          </div>
        </form>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            {statusMessage.details && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pr-6">
                {statusMessage.details}
              </p>
            )}
          </div>
        )}

        {/* Alternative Export Options: Direct Download, Copy & Restore */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              دانلود فایل JSON بکاپ
            </button>

            <label className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              بازیابی از فایل JSON
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleCopyBackup}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
              title="کپی ساختار JSON در کلیپ‌بورد"
            >
              {copiedToClipboard ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  کپی JSON
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
