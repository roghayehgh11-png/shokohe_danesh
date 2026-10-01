import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GroupLink, GroupPlatform, GroupAudienceType } from '../../types';
import {
  Users,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  Shield,
  BookOpen,
  GraduationCap,
  Briefcase,
  Globe,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';

interface GroupLinksSectionProps {
  courseIdFilter?: string; // Optional: show only links for this specific course
  compact?: boolean; // For dashboard or small widget
}

const PLATFORM_CONFIG: Record<GroupPlatform, { name: string; color: string; bgLight: string; bgDark: string; border: string; text: string }> = {
  bale: {
    name: 'پیام‌رسان بله',
    color: '#10b981',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  eitaa: {
    name: 'پیام‌رسان ایتا',
    color: '#f97316',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800/60',
    text: 'text-orange-700 dark:text-orange-300'
  },
  telegram: {
    name: 'تلگرام',
    color: '#0ea5e9',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-700 dark:text-sky-300'
  },
  rubika: {
    name: 'روبیکا',
    color: '#8b5cf6',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/60',
    text: 'text-purple-700 dark:text-purple-300'
  },
  whatsapp: {
    name: 'واتساپ',
    color: '#22c55e',
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-950/40',
    border: 'border-green-200 dark:border-green-800/60',
    text: 'text-green-700 dark:text-green-300'
  },
  shad: {
    name: 'شاد',
    color: '#2563eb',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/60',
    text: 'text-blue-700 dark:text-blue-300'
  },
  discord: {
    name: 'دیسکورد',
    color: '#6366f1',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    text: 'text-indigo-700 dark:text-indigo-300'
  },
  other: {
    name: 'لینک اختصاصی',
    color: '#64748b',
    bgLight: 'bg-slate-50',
    bgDark: 'dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300'
  }
};

export const GroupLinksSection: React.FC<GroupLinksSectionProps> = ({
  courseIdFilter,
  compact = false
}) => {
  const {
    currentUser,
    courses,
    groupLinks,
    addGroupLink,
    updateGroupLink,
    deleteGroupLink,
    toggleGroupLinkActive,
    getVisibleGroupLinksForUser
  } = useApp();

  const isAdmin = currentUser.role === 'admin';

  // Filters & State
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'courses' | 'interns' | 'teachers'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupLink | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState<GroupPlatform>('bale');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAudienceType, setFormAudienceType] = useState<GroupAudienceType>('courses');
  const [formCourseIds, setFormCourseIds] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);

  // Calculate visible links for the user
  const userVisibleLinks = useMemo(() => {
    let list = getVisibleGroupLinksForUser(currentUser);

    // If filtered by specific courseId (e.g. inside course details card)
    if (courseIdFilter) {
      list = list.filter(g => g.isPublic || g.audienceType === 'all' || (g.courseIds && g.courseIds.includes(courseIdFilter)));
    }

    return list;
  }, [getVisibleGroupLinksForUser, currentUser, courseIdFilter, groupLinks]);

  // Filtered by UI controls
  const displayedLinks = useMemo(() => {
    return userVisibleLinks.filter(link => {
      // Platform Filter
      if (platformFilter !== 'all' && link.platform !== platformFilter) {
        return false;
      }

      // Tab Filter
      if (activeTab === 'public' && !link.isPublic && link.audienceType !== 'all') {
        return false;
      }
      if (activeTab === 'courses' && link.audienceType !== 'courses' && (!link.courseIds || link.courseIds.length === 0)) {
        return false;
      }
      if (activeTab === 'interns' && link.audienceType !== 'interns') {
        return false;
      }
      if (activeTab === 'teachers' && link.audienceType !== 'teachers') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = link.title.toLowerCase().includes(q);
        const matchDesc = (link.description || '').toLowerCase().includes(q);
        const matchCourses = link.courseIds?.some(cid => {
          const c = courses.find(cr => cr.id === cid);
          return c ? c.title.toLowerCase().includes(q) : false;
        });
        if (!matchTitle && !matchDesc && !matchCourses) {
          return false;
        }
      }

      return true;
    });
  }, [userVisibleLinks, platformFilter, activeTab, searchQuery, courses]);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openAddModal = () => {
    setEditingGroup(null);
    setFormTitle('');
    setFormPlatform('bale');
    setFormUrl('');
    setFormDescription('');
    setFormAudienceType('courses');
    setFormCourseIds(courses.length > 0 ? [courses[0].id] : []);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (group: GroupLink) => {
    setEditingGroup(group);
    setFormTitle(group.title);
    setFormPlatform(group.platform);
    setFormUrl(group.url);
    setFormDescription(group.description || '');
    setFormAudienceType(group.audienceType);
    setFormCourseIds(group.courseIds || []);
    setFormActive(group.active);
    setIsModalOpen(true);
  };

  const handleToggleCourseSelection = (courseId: string) => {
    setFormCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      alert('لطفاً عنوان گروه و آدرس لینک را وارد نمایید.');
      return;
    }

    if (formAudienceType === 'courses' && formCourseIds.length === 0) {
      alert('لطفاً حداقل یک کلاس/دوره را برای این گروه انتخاب کنید.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      platform: formPlatform,
      url: formUrl.trim(),
      description: formDescription.trim(),
      audienceType: formAudienceType,
      courseIds: formAudienceType === 'courses' ? formCourseIds : [],
      isPublic: formAudienceType === 'all',
      active: formActive
    };

    if (editingGroup) {
      updateGroupLink(editingGroup.id, payload);
    } else {
      addGroupLink(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`آیا از حذف لینک گروه «${title}» مطمئن هستید؟`)) {
      deleteGroupLink(id);
    }
  };

  // Helper to format course names for badge
  const getCourseNames = (ids?: string[]) => {
    if (!ids || ids.length === 0) return [];
    return ids.map(id => courses.find(c => c.id === id)?.title).filter(Boolean);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                لینک گروه‌ها و کانال‌های کلاسی آکادمی
              </h2>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-full">
                {displayedLinks.length} گروه فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  پنل مدیریت کامل: امکان تعریف و تخصیص لینک به کلاس‌های دلخواه
                </span>
              ) : currentUser.role === 'student' ? (
                'نمایش اختصاصی: گروه‌های عمومی آکادمی + گروه‌های کلاس‌هایی که در آن‌ها ثبت‌نام کرده‌اید'
              ) : currentUser.role === 'teacher' ? (
                'نمایش اختصاصی: گروه‌های عمومی + کانال اساتید + گروه‌های کلاس‌های تحت تدریس شما'
              ) : (
                'نمایش اختصاصی: گروه‌های عمومی + گروه‌های تخصصی و هماهنگی تیم کارآموزان'
              )}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن لینک گروه جدید</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      {!compact && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              همه گروه‌ها ({userVisibleLinks.length})
            </button>

            <button
              onClick={() => setActiveTab('public')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeTab === 'public'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              عمومی (همه)
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeTab === 'courses'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              کلاس‌ها و دوره‌ها
            </button>

            {(isAdmin || currentUser.role === 'intern') && (
              <button
                onClick={() => setActiveTab('interns')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                  activeTab === 'interns'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                کارآموزی
              </button>
            )}

            {(isAdmin || currentUser.role === 'teacher') && (
              <button
                onClick={() => setActiveTab('teachers')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                  activeTab === 'teachers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                اساتید
              </button>
            )}
          </div>

          {/* Search & Platform Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجوی گروه، دوره..."
                className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none text-slate-800 dark:text-slate-100 focus:border-blue-500"
              />
            </div>

            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="all">همه پلتفرم‌ها</option>
              <option value="bale">پیام‌رسان بله</option>
              <option value="eitaa">پیام‌رسان ایتا</option>
              <option value="telegram">تلگرام</option>
              <option value="rubika">روبیکا</option>
              <option value="whatsapp">واتساپ</option>
              <option value="shad">شاد</option>
            </select>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {displayedLinks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 opacity-40" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            گروهی با این مشخصات یافت نشد
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAdmin
              ? 'هنوز لینکی برای این دسته‌بندی اضافه نکرده‌اید. با کلیک بر روی دکمه «افزودن لینک گروه جدید» می‌توانید گروه کلاسی یا عمومی جدیدی تعریف کنید.'
              : 'در حال حاضر گروه کلاسی جدیدی برای دوره‌های شما فعال نیست. با شروع جلسات، لینک‌های مربوطه توسط مدیر درج خواهند شد.'}
          </p>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              افزودن گروه جدید
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedLinks.map(link => {
            const platformConf = PLATFORM_CONFIG[link.platform] || PLATFORM_CONFIG.other;
            const courseNames = getCourseNames(link.courseIds);
            const isCopied = copiedId === link.id;

            return (
              <div
                key={link.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${platformConf.border} p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group`}
              >
                {/* Top Accent Strip */}
                <div
                  className="absolute top-0 right-0 left-0 h-1"
                  style={{ backgroundColor: platformConf.color }}
                />

                {/* Card Header */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${platformConf.bgLight} ${platformConf.bgDark}`}
                        style={{ color: platformConf.color }}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${platformConf.bgLight} ${platformConf.bgDark} ${platformConf.text}`}
                        >
                          {platformConf.name}
                        </span>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white mt-1 leading-snug">
                          {link.title}
                        </h3>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleGroupLinkActive(link.id)}
                          title={link.active ? 'غیرفعال‌سازی لینک' : 'فعال‌سازی مجدد لینک'}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            link.active
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Radio className={`w-3.5 h-3.5 ${link.active ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                        </button>
                        <button
                          onClick={() => openEditModal(link)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                          title="ویرایش مشخصات و دسترسی"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id, link.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="حذف گروه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {link.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {link.description}
                    </p>
                  )}

                  {/* Target Audience Badge */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                    {link.isPublic || link.audienceType === 'all' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-500" />
                        عمومی (تمام دانشجویان و همکاران)
                      </span>
                    ) : link.audienceType === 'interns' ? (
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-lg border border-purple-200/60 dark:border-purple-800 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-purple-500" />
                        مختص کارآموزان پروژه‌ها
                      </span>
                    ) : link.audienceType === 'teachers' ? (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-lg border border-amber-200/60 dark:border-amber-800 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-amber-500" />
                        مختص اساتید و هیئت علمی
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-lg border border-blue-200/60 dark:border-blue-800 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          مختص کلاس‌های:
                        </span>
                        {courseNames.map((name, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-md"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clean Link URL Display */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate dir-ltr text-left">
                      {link.url.replace(/^https?:\/\//, '')}
                    </span>
                    <button
                      onClick={() => handleCopy(link.id, link.url)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 p-1 rounded-md transition-colors"
                      title="کپی لینک"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(link.id, link.url)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>کپی آدرس</span>
                      </>
                    )}
                  </button>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow hover:opacity-90"
                    style={{ backgroundColor: platformConf.color }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>ورود به گروه</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingGroup ? 'ویرایش لینک گروه' : 'افزودن لینک گروه جدید توسط مدیر'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تنظیم مخاطبین، دوره‌های تحت پوشش و آدرس پیام‌رسان
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  عنوان گروه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: گروه بله کلاس پایتون مقدماتی (کد 102)"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              {/* Platform and URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    پلتفرم پیام‌رسان <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPlatform}
                    onChange={e => setFormPlatform(e.target.value as GroupPlatform)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-white font-bold"
                  >
                    <option value="bale">پیام‌رسان بله (Bale)</option>
                    <option value="eitaa">پیام‌رسان ایتا (Eitaa)</option>
                    <option value="telegram">تلگرام (Telegram)</option>
                    <option value="rubika">روبیکا (Rubika)</option>
                    <option value="whatsapp">واتساپ (WhatsApp)</option>
                    <option value="shad">شاد (Shad)</option>
                    <option value="discord">دیسکورد (Discord)</option>
                    <option value="other">سایر / لینک وبینار</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    لینک عضویت (URL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://ble.ir/join/..."
                    value={formUrl}
                    onChange={e => setFormUrl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono dir-ltr text-left"
                  />
                </div>
              </div>

              {/* Audience Type */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-900 dark:text-white">
                  مخاطبین و سطح دسترسی لینک <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  انتخاب کنید که این لینک در پنل چه کاربرانی نمایش داده شود:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      formAudienceType === 'courses'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={formAudienceType === 'courses'}
                      onChange={() => setFormAudienceType('courses')}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-bold">
                        مختص کلاس‌ها و دوره‌های خاص
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        تنها دانشجویان ثبت‌نامی و مدرس این کلاس‌ها لینک را خواهند دید.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      formAudienceType === 'all'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={formAudienceType === 'all'}
                      onChange={() => setFormAudienceType('all')}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-bold">
                        عمومی برای همه اعضا
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        کلیه دانشجویان، کارآموزان، اساتید و مدیران لینک را می‌بینند.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      formAudienceType === 'interns'
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={formAudienceType === 'interns'}
                      onChange={() => setFormAudienceType('interns')}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-bold">
                        مختص کارآموزان آکادمی
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        تیم توسعه و پروژه‌های کارآموزی
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      formAudienceType === 'teachers'
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={formAudienceType === 'teachers'}
                      onChange={() => setFormAudienceType('teachers')}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-bold">
                        مختص اساتید و مدرسین
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        کانال هماهنگی هیئت علمی
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Course Selection Checkboxes if Audience is 'courses' */}
              {formAudienceType === 'courses' && (
                <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-900/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      انتخاب کلاس‌ها و دوره‌های مرتبط با این گروه:
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      {formCourseIds.length} کلاس انتخاب شده
                    </span>
                  </div>

                  {courses.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2">
                      هنوز دوره‌ای در سیستم تعریف نشده است. ابتدا از ماژول مدیریت دوره‌ها دوره‌ای ایجاد کنید یا نوع گروه را روی «عمومی» بگذارید.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {courses.map(course => {
                        const isChecked = formCourseIds.includes(course.id);
                        return (
                          <label
                            key={course.id}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${
                              isChecked
                                ? 'bg-white dark:bg-slate-800 border-blue-500 font-bold text-blue-700 dark:text-blue-300 shadow-sm'
                                : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCourseSelection(course.id)}
                                className="rounded text-blue-600"
                              />
                              <span className="truncate">{course.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {course.teacherName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  توضیحات یا راهنما (اختیاری)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: کانال ارسال تمرین‌ها و لینک کلاس‌های آنلاین"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <label htmlFor="activeCheck" className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  لینک فعال باشد و به کاربران مجاز نمایش داده شود
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingGroup ? 'ذخیره تغییرات گروه' : 'ایجاد و ثبت لینک گروه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
