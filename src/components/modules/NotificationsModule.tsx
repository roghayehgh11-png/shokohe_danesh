import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationTarget } from '../../types';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Smartphone,
  Clock,
  CheckCheck,
  AlertTriangle,
  Info,
  Calendar,
  MessageSquare
} from 'lucide-react';

export const NotificationsModule: React.FC = () => {
  const { notifications, sendNotification, markNotificationAsRead, users, courses } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<NotificationTarget>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetPhone, setTargetPhone] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    sendNotification(title, message, targetType, targetUserId || undefined, targetPhone || undefined);

    setTitle('');
    setMessage('');
    setActiveTab('list');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            مدیریت اعلان‌ها و اطلاع‌رسانی کلاس‌ها
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ارسال اعلان‌های گروهی، یادآوری ۳۰ دقیقه قبل از شروع کلاس‌ها و پیام‌های پیامکی به کاربران
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            لیست اعلان‌ها ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            ارسال اعلان جدید
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.read
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 shrink-0 mt-0.5">
                    {n.type === 'class_reminder' ? <Clock className="w-5 h-5 text-amber-500" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    {n.targetType && (
                      <span className="inline-block text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded mt-2">
                        گیرندگان: {n.targetType === 'all' && 'همه کاربران'}
                        {n.targetType === 'teachers' && 'استادان'}
                        {n.targetType === 'students' && 'دانشجویان'}
                        {n.targetType === 'interns' && 'کارآموزان'}
                        {n.targetType === 'single_user' && 'کاربر مشخص'}
                        {n.targetType === 'phone_sms' && `پیامک به ${n.targetPhone}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">{n.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            فرمت پیام و انتخاب مخاطبان
          </h3>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">عنوان اعلان / یادآوری</label>
              <input
                type="text"
                placeholder="مثلاً: ⏰ یادآوری شروع کلاس وردپرس یا اطلاعیه تعطیلی رسمی"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-slate-800 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">متن اعلان</label>
              <textarea
                rows={4}
                placeholder="متن کامل پیام جهت نمایش در پنل یا ارسال SMS..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-slate-800 dark:text-white leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">گیرندگان پیام و کانال ارسال</label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as NotificationTarget)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-slate-800 dark:text-white font-semibold"
              >
                <option value="all">عمومی (ارسال به تمامی کاربران سیستم)</option>
                <option value="teachers">📲 ارسال مستقیم به گوشی مدرسان و اساتید (Mobile Push / SMS)</option>
                <option value="single_user">📲 ارسال مستقیم به گوشی مدیر یا کاربر خاص</option>
                <option value="students">فقط دانشجویان ثبت‌نام شده</option>
                <option value="interns">فقط کارآموزان پروژه‌ای</option>
                <option value="phone_sms">ارسال پیامک مستقیم به شماره همراه (SMS Gateway)</option>
              </select>
            </div>

            {/* Mobile Notification Status Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-[11px] text-emerald-800 dark:text-emerald-200">
                <span className="font-bold block">سامانه ارسال نوتیفیکیشن همگام‌سازی شده به گوشی (Push Service & SMS Gateway):</span>
                اعلان‌های ارسالی به مدرسان و مدیر بلافاصله به صورت Pop-Up روی تلفن همراه گیرنده ظاهر خواهد شد.
              </div>
            </div>

            {targetType === 'single_user' && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">انتخاب کاربر</label>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-slate-800 dark:text-white"
                >
                  <option value="">-- انتخاب از لیست کاربران --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.phone}) - {u.role}</option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'phone_sms' && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">شماره همراه گیرنده</label>
                <input
                  type="text"
                  placeholder="09121111111"
                  value={targetPhone}
                  onChange={e => setTargetPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-mono outline-none text-slate-800 dark:text-white"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              ارسال فوری اعلان
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
