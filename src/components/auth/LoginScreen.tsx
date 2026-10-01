import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Globe,
  ExternalLink
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) {
      setErrorMessage('لطفاً نام کاربری، شماره همراه یا ایمیل خود را وارد نمایید.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('لطفاً رمز عبور خود را وارد نمایید.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = login(identity, password);
      if (!res.success) {
        setErrorMessage(res.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
      setLoading(false);
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none" dir="rtl">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto bg-white p-1 shadow-xl shadow-blue-500/20 border-2 border-slate-700 flex items-center justify-center">
            <img
              src="/app-logo.jpg"
              alt="لوگوی رمز دانش"
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/src/assets/images/ramz_danesh_logo_1790837789382.jpg';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              آکادمی رمز دانش
            </h1>
            <p className="text-[11px] font-mono tracking-widest text-orange-400 font-bold uppercase mt-0.5">
              RAMZ DANESH
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              سامانه جامع و هوشمند مدیریت آکادمی
            </p>
          </div>

          {/* Security Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-[11px] font-semibold text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ورود امن به پرتال کاربری</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Secure Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              نام کاربری، شماره همراه یا ایمیل:
            </label>
            <div className="relative">
              <input
                type="text"
                value={identity}
                onChange={e => {
                  setIdentity(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="نام کاربری یا شماره همراه خود را وارد کنید"
                autoComplete="username"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl py-2.5 pr-10 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              رمز عبور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="رمز عبور حساب کاربری"
                autoComplete="current-password"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl py-2.5 pr-10 pl-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>ورود به سامانه</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info & Website Link */}
        <div className="text-center text-[11px] text-slate-500 border-t border-slate-800/60 pt-4 space-y-3">
          <a
            href="https://ramzedanesh.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 font-bold text-xs rounded-xl transition-all shadow-sm group"
          >
            <Globe className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>وب‌سایت رسمی رمز دانش (ramzedanesh.com)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75 group-hover:translate-x-[-2px] transition-transform" />
          </a>

          <div className="space-y-1 pt-1 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              دسترسی به سامانه منحصراً با نام کاربری و رمز عبور معتبر امکان‌پذیر است.
            </p>
            <p className="text-[10px] text-slate-500">
              در صورت فراموشی یا عدم دریافت اطلاعات ورود، با مدیریت آکادمی هماهنگ فرمایید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
