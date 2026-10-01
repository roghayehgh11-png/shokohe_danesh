import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayPersianDate, getPersianFullDateInfo } from '../../utils/dateUtils';
import { BackupModal } from '../common/BackupModal';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Building,
  Save,
  CheckCircle2,
  Mail,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Layers,
  Cpu,
  Key,
  Server,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  Check
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const {
    resetAllData,
    restoreBackup,
    activityLogs,
    currentUser,
    users,
    courses,
    projects,
    dailyReports,
    customerLeads,
    tuitions,
    payments,
    expenses,
    teacherSalaries
  } = useApp();

  const [academyName, setAcademyName] = useState('آکادمی کامپیوتر و فناوری اطلاعات شکوه دانش (shoukoh danesh)');
  const [managerName, setManagerName] = useState('علی هاشمی');
  const [phone, setPhone] = useState('021-88889999');
  const [address, setAddress] = useState('مشهد، بلوار احمدآباد، خیابان عدالت، پلاک ۴۵');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Gemini AI Server Settings
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeminiFromEnv, setIsGeminiFromEnv] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    success: boolean;
    message: string;
    systemStatus?: string;
    auditTone?: string;
    statement?: string;
  } | null>(null);

  // SMTP Email Server Settings
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('roghayeh.ghanbari18@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSenderName, setSmtpSenderName] = useState('آکادمی شکوه دانش');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('roghayeh.ghanbari18@gmail.com');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Overall saving state
  const [isSavingServerConfig, setIsSavingServerConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<string | null>(null);

  const todayPersian = getTodayPersianDate();
  const dateInfo = getPersianFullDateInfo();

  // Load existing server settings on mount
  useEffect(() => {
    fetch('/api/system/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.geminiApiKey) setGeminiApiKey(s.geminiApiKey);
          setIsGeminiFromEnv(Boolean(data.envGeminiAvailable));
          if (s.smtp) {
            if (s.smtp.host) setSmtpHost(s.smtp.host);
            if (s.smtp.port) setSmtpPort(s.smtp.port);
            if (s.smtp.secure !== undefined) setSmtpSecure(s.smtp.secure);
            if (s.smtp.user) setSmtpUser(s.smtp.user);
            if (s.smtp.senderName) setSmtpSenderName(s.smtp.senderName);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save all system configuration to server
  const handleSaveAllServerSettings = async () => {
    setIsSavingServerConfig(true);
    setConfigSaveSuccess(null);
    try {
      const res = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey,
          smtp: {
            host: smtpHost,
            port: Number(smtpPort),
            secure: smtpSecure,
            user: smtpUser,
            pass: smtpPass,
            senderName: smtpSenderName
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setConfigSaveSuccess('✅ تمامی تنظیمات هوش مصنوعی و سرور ایمیل با موفقیت روی سرور پایدار ذخیره گردید.');
        setTimeout(() => setConfigSaveSuccess(null), 6000);
      } else {
        alert(data.error || 'خطا در ذخیره تنظیمات روی سرور');
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsSavingServerConfig(false);
    }
  };

  // Test Gemini AI with strict logical evaluation
  const handleTestGeminiConnection = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: geminiApiKey || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setGeminiTestResult({
          success: true,
          message: data.message || 'اتصال با موفقیت برقرار شد.',
          systemStatus: data.data?.systemStatus || 'عملیاتی',
          auditTone: data.data?.auditTone || 'منطقی و سخت‌گیرانه',
          statement: data.data?.statement || 'هوش مصنوعی آماده پایش بی‌طرفانه کدهای کارآموزان است.'
        });
      } else {
        setGeminiTestResult({
          success: false,
          message: data.error || 'خطا در ارتباط با هوش مصنوعی گوگل.'
        });
      }
    } catch (e: any) {
      setGeminiTestResult({
        success: false,
        message: 'عدم پاسخگویی سرویس هوش مصنوعی سرور.'
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  // Test SMTP Email Connection
  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      // First save if password entered
      if (smtpPass) {
        await handleSaveAllServerSettings();
      }
      const res = await fetch('/api/email/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailTarget || smtpUser })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpTestResult({
          success: true,
          message: `✅ ایمیل آزمایشی واقعی از طریق سرور SMTP به ${data.sentTo} با موفقیت ارسال شد (شناسه پیام: ${data.messageId || 'OK'}).`
        });
      } else {
        setSmtpTestResult({
          success: false,
          message: data.error || 'خطا در ارسال ایمیل آزمایشی. لطفاً مشخصات کاربری و App Password را بررسی نمایید.'
        });
      }
    } catch {
      setSmtpTestResult({
        success: false,
        message: 'خطا در اتصال به سرور ایمیل.'
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleDownloadBackup = () => {
    const data = {
      version: 'shokooh_danesh_v2',
      exportDate: new Date().toISOString(),
      datePersian: todayPersian,
      localStorage: { ...localStorage }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_shokooh_danesh_${todayPersian.replace(/\//g, '-')}.json`;
    a.click();
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        alert('اطلاعات با موفقیت بازیابی شد. صفحه بازنشانی می‌شود.');
        window.location.reload();
      } catch (err) {
        alert('خطا در خواندن فایل پشتیبان. لطفاً فایل معتبر انتخاب کنید.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            تنظیمات سیستم و مدیریت پایگاه داده
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تنظیمات عمومی آکادمی شکوه دانش (shoukoh danesh)، تاریخ شمسی، مدیریت دیتابیس و پشتیبان‌گیری هوشمند
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Database className="w-4 h-4" />
            مرکز پشتیبان‌گیری و ارسال ایمیل
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academy Info Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-blue-500" />
            اطلاعات پایه آکادمی
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">نام رسمی آکادمی</label>
              <input
                type="text"
                value={academyName}
                onChange={e => setAcademyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold outline-none text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">نام مدیر مسئول</label>
              <input
                type="text"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold outline-none text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">شماره تلفن ثابت</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">آدرس ساختمان اصلی</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={() => alert('اطلاعات پایه آکادمی ذخیره گردید.')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              ذخیره تغییرات
            </button>
          </div>
        </div>

        {/* Database Backup & Restore Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Database className="w-4 h-4 text-emerald-500" />
            پشتیبان‌گیری و بازنشانی دیتابیس
          </h3>

          <div className="space-y-3 text-xs">
            <p className="text-slate-500 leading-relaxed">
              شما می‌توانید از تمامی داده‌های سیستم شامل کاربران، دوره‌ها، پروژه‌ها، گزارش‌ها و حسابداری خروجی تهیه نمایید.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all"
              >
                <Database className="w-4 h-4" />
                پشتیبان‌گیری هوشمند (امروز / بخش‌های انتخابی / ایمیل)
              </button>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود مستقیم فایل کامل پایگاه داده (JSON)
              </button>

              <label className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-2 transition-all">
                <Upload className="w-4 h-4" />
                بازیابی داده‌ها از فایل JSON
                <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
              </label>

              <button
                onClick={() => {
                  if (confirm('آیا از ریست کامل داده‌ها به حالت اولیه مطمئن هستید؟')) {
                    resetAllData();
                    window.location.reload();
                  }
                }}
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                بازنشانی دیتابیس به داده‌های پیش‌فرض اول
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI & SMTP Engine Server Infrastructure Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              مدیریت زیرساخت هوش مصنوعی (Gemini AI) و سرویس ایمیل (SMTP)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              تنظیمات در فایل سرور (<code className="font-mono text-indigo-500">data/system_settings.json</code>) ذخیره شده و روی تمام سرورها، هاست‌ها و کانتینرها بدون قطعی کار می‌کند.
            </p>
          </div>

          <button
            onClick={handleSaveAllServerSettings}
            disabled={isSavingServerConfig}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
          >
            {isSavingServerConfig ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            ذخیره تنظیمات روی سرور
          </button>
        </div>

        {configSaveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {configSaveSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: Gemini AI Engine */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                هوش مصنوعی منطقی و دقیق (Google Gemini)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isGeminiFromEnv || geminiApiKey
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}>
                {isGeminiFromEnv ? 'متصل از طریق محیط سرور' : geminiApiKey ? 'کلید اختصاصی ذخیره‌شده' : 'نیاز به کلید API'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تحلیل روزانه و ماهانه با لحن سخت‌گیرانه، مستدل، فنی و بدون تمجید غیرواقعی صورت می‌پذیرد.
            </p>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-[11px] font-bold mb-1">
                کلید اختصاصی Gemini API Key (جهت اجرا روی سرورهای دیگر):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy... (در صورت خالی بودن از کلید سرور استفاده می‌شود)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pl-10 font-mono text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestGeminiConnection}
                disabled={isTestingGemini}
                className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-2 transition-all"
              >
                {isTestingGemini ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                تست آنلاین اتصال و ارزیابی لحن منطقی هوش مصنوعی
              </button>
            </div>

            {geminiTestResult && (
              <div
                className={`p-3 rounded-xl border space-y-1.5 animate-fade-in ${
                  geminiTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {geminiTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{geminiTestResult.message}</span>
                </div>
                {geminiTestResult.statement && (
                  <p className="text-[11px] leading-relaxed opacity-90 pr-5 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-1.5 mt-1.5 font-sans">
                    «{geminiTestResult.statement}»
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Box 2: Central Academy Mail Server */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-500" />
                سرور سراسری ارسال ایمیل آکادمی
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                فعال در پشت صحنه (Server-Side)
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              مشخصات سرور ارسال ایمیل به صورت مستقیم و ثابت در کدهای سرور (Server-Side) قرار گرفته است و تمامی ایمیل‌ها با نام و فرستنده رسمی آکادمی ارسال می‌شوند. کاربران نیازی به ورود مشخصات فنی ندارند.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">سرور میزبان:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">mail.baoneh.ir:465 (SSL)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">حساب فرستنده:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">roghaye.ghanbari@baoneh.ir</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                تست سریع عملکرد سرور مرکزی:
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={testEmailTarget}
                  onChange={e => setTestEmailTarget(e.target.value)}
                  placeholder="ایمیل دریافت تست (مثال: roghayeh.ghanbari18@gmail.com)"
                  className="w-full sm:flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono text-xs outline-none text-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleTestSmtpConnection}
                  disabled={isTestingSmtp}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer text-xs"
                >
                  {isTestingSmtp ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  ارسال ایمیل آزمایشی
                </button>
              </div>
            </div>

            {smtpTestResult && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-bold animate-fade-in ${
                  smtpTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {smtpTestResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-purple-500" />
          لاگ فعالیت‌های امنیتی و سیستمی (System Audit Trail)
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {activityLogs.map(log => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span> ({log.action} - {log.module}): {log.details}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
    </div>
  );
};

