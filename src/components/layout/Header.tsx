import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { BackupModal } from '../common/BackupModal';
import { getPersianFullDateInfo, PersianFullDateInfo } from '../../utils/dateUtils';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ShieldAlert,
  UserCheck,
  LogOut,
  User as UserIcon,
  Calendar as CalendarIcon,
  Clock,
  Database,
  RefreshCw,
  X
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    notifications,
    markNotificationAsRead,
    activeModule,
    setActiveModule,
    logout,
    cloudSyncStatus,
    lastSyncTime,
    refreshDatabases
  } = useApp();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // دریافت هوشمند آدرس لوگو از پارامترهای URL یا مسیر نسبی
  const getLogoUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('logo_url') || './app-logo.jpg';
  };

  // Live Persian Date and Time
  const [liveDateInfo, setLiveDateInfo] = useState<PersianFullDateInfo>(() => getPersianFullDateInfo());

  useEffect(() => {
    // Update live clock every second
    const timer = setInterval(() => {
      setLiveDateInfo(getPersianFullDateInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle Dark mode
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isKKey = e.key?.toLowerCase() === 'k' || e.key === 'ن' || e.code === 'KeyK' || e.keyCode === 75;
      if ((e.ctrlKey || e.metaKey) && isKKey) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 gap-3">
        {/* Left Section: Search input (desktop) and Logo (mobile) */}
        <div className="flex items-center gap-2">
          {/* Mobile Brand Logo */}
          <div className="flex items-center gap-2 sm:hidden shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-slate-700 shadow-sm flex items-center justify-center">
              <img
                src={getLogoUrl()}
                alt="لوگوی رمز دانش"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="font-extrabold text-xs text-slate-800 dark:text-white truncate">رمز دانش</span>
          </div>

          <div className="relative w-48 sm:w-60 md:w-72 hidden sm:block">
            <input
              type="text"
              onClick={() => setIsSearchOpen(true)}
              placeholder="جستجوی سریع (Ctrl+K)..."
              readOnly
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-1.5 pr-9 pl-12 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 cursor-pointer placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            <kbd className="hidden lg:inline-block absolute left-3 top-2 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[9px] text-slate-400 font-mono pointer-events-none">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Center Section: Live Persian Calendar & Clock Bar */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-3 sm:px-4 py-1.5 shadow-sm text-xs select-none">
          {/* Persian Date */}
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs whitespace-nowrap">
              {liveDateInfo.fullFormatted}
            </span>
          </div>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 hidden xs:block"></div>

          {/* Live Digital Clock */}
          <div className="flex items-center gap-1.5 font-mono font-black text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-inner text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
            <span className="tracking-wider">{liveDateInfo.timeStr}</span>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh Database Button */}
          <button
            onClick={() => refreshDatabases()}
            disabled={cloudSyncStatus === 'syncing'}
            className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60 ${
              cloudSyncStatus === 'syncing'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300'
            }`}
            title={`رفرش دیتابیس‌ها و به‌‌روزرسانی اطلاعات${lastSyncTime ? ` (آخرین رفرش: ${lastSyncTime})` : ''}`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                cloudSyncStatus === 'syncing'
                  ? 'animate-spin text-amber-500'
                  : 'text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500'
              }`}
            />
            <span className="text-[11px] font-bold">
              {cloudSyncStatus === 'syncing' ? 'در حال رفرش...' : 'رفرش دیتابیس‌ها'}
            </span>
          </button>

          {/* Quick Backup Button for Admin */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsBackupOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all"
              title="پشتیبان‌گیری هوشمند از اطلاعات و ارسال به ایمیل"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">بک‌آپ اطلاعات</span>
            </button>
          )}

          {/* Role Display / Switcher for Admin Only */}
          <div className="relative">
            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-xs font-medium transition-all"
                  title="تغییر نقش (مخصوص مدیر کل)"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="truncate max-w-[130px] hidden sm:inline">نقش: <strong className="font-bold">{currentUser.name} (مدیر)</strong></span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isRoleDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 text-xs animate-fade-in"
                    onClick={() => setIsRoleDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                        <span>تغییر اکانت شبیه‌ساز (مدیریت)</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRoleDropdownOpen(false);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="بستن"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {users.slice(0, 6).map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          localStorage.setItem('ramz_danesh_prod_v1_auth_user_id', u.id);
                          if (u.role === 'intern') setActiveModule('daily_reports');
                          else if (u.role === 'student' || u.role === 'teacher') setActiveModule('courses');
                          else setActiveModule('dashboard');
                        }}
                        className={`w-full text-right px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          currentUser.id === u.id ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {u.role === 'admin' && '👑 مدیر آکادمی'}
                              {u.role === 'teacher' && '👨‍🏫 مدرس'}
                              {u.role === 'intern' && '💻 کارآموز'}
                              {u.role === 'student' && '🎓 دانشجو'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-medium cursor-default">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[140px]">
                  کاربر: <strong className="font-bold">{currentUser.name}</strong> ({currentUser.role === 'teacher' ? 'مدرس' : currentUser.role === 'intern' ? 'کارآموز' : 'دانشجو'})
                </span>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white">اعلان‌های سیستم</h4>
                    <span className="text-[10px] text-slate-400">({notifications.length} پیام)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="بستن پنجره اعلان‌ها"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkModule) setActiveModule(n.linkModule as any);
                        setIsNotifOpen(false);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                        !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span>{n.title}</span>
                        <span className="text-[10px] font-normal text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="تغییر حالت شب/روز"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 rounded-xl text-xs font-bold transition-all"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">خروج</span>
          </button>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
};