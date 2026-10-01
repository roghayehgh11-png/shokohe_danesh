import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, CourseCategory } from '../../types';
import {
  getTodayPersianDate,
  calculateCourseSessionsTimeline,
  MonthlySessionsBreakdown,
  getPersianYearEndRange,
  isPersianLeapYear,
  generateCourseCode,
  normalizeCourseTitle
} from '../../utils/dateUtils';
import { FormattedCurrencyInput } from '../common/FormattedCurrencyInput';
import { EditableSelect } from '../common/EditableSelect';
import {
  BookOpen,
  PlusCircle,
  Users,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  UserCheck,
  FileText,
  CheckCircle2,
  Paperclip,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Building2,
  Phone,
  ShieldCheck,
  Search,
  User,
  Coins,
  X,
  AlertCircle,
  RotateCw,
  ExternalLink,
  Share2,
  Hash,
  Sparkles
} from 'lucide-react';

export const CoursesModule: React.FC = () => {
  const { courses, users, addCourse, updateCourse, deleteCourse, addUser, currentUser, groupLinks, setActiveModule } = useApp();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Teacher Module Tabs & Search Queries
  const [teacherActiveTab, setTeacherActiveTab] = useState<'courses' | 'students'>('courses');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Helper to normalize teacher names for clean comparison (removes honorifics like استاد/مهندس)
  const normalizeTeacherName = (name?: string) => {
    if (!name) return '';
    return name
      .replace(/^(استاد|مهندس|خانم|آقای|دکتر|سرکار خانم|جناب آقای)\s+/gi, '')
      .trim()
      .toLowerCase();
  };

  const isCourseTaughtByTeacher = (course: Course, teacherUser: typeof currentUser) => {
    if (!teacherUser) return false;
    // 1. Direct ID match
    if (course.teacherId && (course.teacherId === teacherUser.id || course.teacherId === teacherUser.username)) {
      return true;
    }
    // 2. Exact cleaned name match
    const cClean = normalizeTeacherName(course.teacherName);
    const uClean = normalizeTeacherName(teacherUser.name);
    if (cClean && uClean && (cClean === uClean)) {
      return true;
    }
    return false;
  };

  // Visible courses based on user role
  const visibleCourses = courses.filter(course => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'teacher') {
      return isCourseTaughtByTeacher(course, currentUser);
    }
    if (currentUser.role === 'student' || currentUser.role === 'intern') {
      const isEnrolledInCourse = course.studentIds?.includes(currentUser.id);
      const isUserEnrolledCourse = currentUser.enrolledCourseIds?.includes(course.id);
      return isEnrolledInCourse || isUserEnrolledCourse;
    }
    return true;
  });

  // Filter courses by search query (title, code, teacher, category)
  const filteredVisibleCourses = visibleCourses.filter(course => {
    if (!courseSearchQuery.trim()) return true;
    const q = courseSearchQuery.trim().toLowerCase();
    const matchesTitle = (course.title || '').toLowerCase().includes(q);
    const matchesCode = (course.code || '').toLowerCase().includes(q);
    const matchesTeacher = (course.teacherName || '').toLowerCase().includes(q);
    const matchesCategory = (course.category || '').toLowerCase().includes(q);
    return matchesTitle || matchesCode || matchesTeacher || matchesCategory;
  });

  // Calculate teacher's enrolled students
  const teacherCourses = courses.filter(c => isCourseTaughtByTeacher(c, currentUser));
  const teacherEnrolledStudentIds = Array.from(new Set(teacherCourses.flatMap(c => c.studentIds || [])));
  const teacherStudentsList = users.filter(u => 
    (u.role === 'student' || u.role === 'intern') && 
    (teacherEnrolledStudentIds.includes(u.id) || (u.enrolledCourseIds && u.enrolledCourseIds.some(cid => teacherCourses.some(tc => tc.id === cid))))
  );
  const totalTeacherStudentsCount = teacherCourses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

  // New Teacher Form State
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('123');

  // Course Form State
  const [courseCode, setCourseCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('برنامه‌نویسی پایتون');
  const [teacherId, setTeacherId] = useState('');
  const [manualTeacherName, setManualTeacherName] = useState('');
  const [useManualTeacher, setUseManualTeacher] = useState(false);
  const [capacity, setCapacity] = useState(15);
  const [scheduleDays, setScheduleDays] = useState('روزهای زوج (شنبه، دوشنبه، چهارشنبه)');
  const [customDays, setCustomDays] = useState<string[]>(['شنبه', 'دوشنبه', 'چهارشنبه']);
  const [customDatesInput, setCustomDatesInput] = useState('');
  const [startDate, setStartDate] = useState(getTodayPersianDate());
  const [endDate, setEndDate] = useState(`${getTodayPersianDate().split('/')[0] || '1405'}/12/29`);
  const [isScheduleCustomMode, setIsScheduleCustomMode] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('16:00 - 18:00');
  const [room, setRoom] = useState('سایت شماره ۱');
  const [price, setPrice] = useState(5000000);
  const [teacherWage, setTeacherWage] = useState(2000000);
  const [description, setDescription] = useState('');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const activeTeachers = users.filter(u => u.role === 'teacher' && u.status === 'active');

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherPhone) return;

    addUser({
      name: newTeacherName,
      phone: newTeacherPhone,
      email: newTeacherEmail || `${Date.now()}@teacher.ir`,
      username: newTeacherUsername || `teacher_${Date.now().toString().slice(-4)}`,
      password: newTeacherPassword || '123',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skills: ['مدرس رسمی شکوه دانش'],
      bio: 'استاد مجرب آکادمی فنی حرفه‌ای شکوه دانش',
      status: 'active'
    });

    setIsTeacherModalOpen(false);
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherEmail('');
    setNewTeacherUsername('');
  };

  const handleOpenModal = (course?: Course) => {
    setDuplicateError(null);
    if (course) {
      setEditingCourseId(course.id);
      setCourseCode(course.code || generateCourseCode(course.startDate || getTodayPersianDate(), courses.map(c => c.code), course.id));
      setTitle(course.title);
      setCategory(course.category);
      setTeacherId(course.teacherId);
      setManualTeacherName(course.teacherName);
      setUseManualTeacher(!activeTeachers.some(t => t.id === course.teacherId));
      setCapacity(course.capacity);
      setScheduleDays(course.scheduleDays);
      setCustomDays(course.customScheduleDays || ['شنبه', 'دوشنبه', 'چهارشنبه']);
      setCustomDatesInput((course.customDatesList || []).join('، '));
      setStartDate(course.startDate || getTodayPersianDate());
      setEndDate(course.endDate || `${getTodayPersianDate().split('/')[0] || '1405'}/12/29`);
      setIsScheduleCustomMode(!!(course.customDatesList && course.customDatesList.length > 0));
      setScheduleTime(course.scheduleTime);
      setRoom(course.room);
      setPrice(course.price);
      setTeacherWage(course.teacherWage || 0);
      setDescription(course.description);
    } else {
      setEditingCourseId(null);
      const range1405 = getPersianYearEndRange(1405);
      const initialCode = generateCourseCode(range1405.startDate, courses.map(c => c.code));
      setCourseCode(initialCode);
      setTitle('');
      setCategory('برنامه‌نویسی پایتون');
      setTeacherId(activeTeachers[0]?.id || '');
      setManualTeacherName('');
      setUseManualTeacher(false);
      setCapacity(15);
      setScheduleDays('روزهای زوج (شنبه، دوشنبه، چهارشنبه)');
      setCustomDays(['شنبه', 'دوشنبه', 'چهارشنبه']);
      setCustomDatesInput('');
      setStartDate(range1405.startDate);
      setEndDate(range1405.endDate);
      setIsScheduleCustomMode(false);
      setScheduleTime('17:00 - 19:00');
      setRoom('سایت شماره ۱');
      setPrice(5500000);
      setTeacherWage(2000000);
      setDescription('');
    }
    setIsModalOpen(true);
  };

  // Quick Persian Calendar range presets (Adapting to year 1405 and auto-refreshing for all years)
  const handleApplyCalendarPreset = (preset: 'year1405_full' | 'year1405_remaining' | 'first_half' | 'second_half') => {
    const today = getTodayPersianDate();
    const todayYear = parseInt(today.split('/')[0], 10) || 1405;
    const targetYear = todayYear < 1405 ? 1405 : todayYear;
    const isLeap = isPersianLeapYear(targetYear);
    const yearEndDay = isLeap ? '30' : '29';

    let newStart = startDate;
    let newEnd = endDate;

    if (preset === 'year1405_full') {
      newStart = `${targetYear}/01/01`;
      newEnd = `${targetYear}/12/${yearEndDay}`;
    } else if (preset === 'year1405_remaining') {
      newStart = today.startsWith(String(targetYear)) ? today : `${targetYear}/01/01`;
      newEnd = `${targetYear}/12/${yearEndDay}`;
    } else if (preset === 'first_half') {
      newStart = `${targetYear}/01/01`;
      newEnd = `${targetYear}/06/31`;
    } else if (preset === 'second_half') {
      newStart = `${targetYear}/07/01`;
      newEnd = `${targetYear}/12/${yearEndDay}`;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    // Auto refresh course code to match the chosen year & start date
    setCourseCode(generateCourseCode(newStart, courses.map(c => c.code), editingCourseId));
  };

  // Real-time schedule calculation
  const currentParsedCustomDates = customDatesInput
    ? customDatesInput.split(/[\n,،]+/).map(s => s.trim()).filter(Boolean)
    : undefined;

  const currentScheduleAnalysis = calculateCourseSessionsTimeline(
    startDate,
    endDate,
    customDays,
    isScheduleCustomMode ? currentParsedCustomDates : undefined
  );

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    // Strict duplicate course check by title (Prevents any duplicate course names)
    const normTitle = normalizeCourseTitle(cleanTitle);
    const duplicateByTitle = courses.find(
      c => c.id !== editingCourseId && normalizeCourseTitle(c.title) === normTitle
    );
    if (duplicateByTitle) {
      setDuplicateError(`خطا در ثبت دوره: کلاسی با نام «${duplicateByTitle.title}» (کد دوره: ${duplicateByTitle.code || '---'}) از قبل در سامانه ثبت شده است! سیستم اجازه ثبت کلاس‌های هم‌نام را نمی‌دهد. لطفاً جهت تفکیک، عنوان متفاوتی برای این کلاس انتخاب فرمایید.`);
      return;
    }

    // Strict duplicate course code check
    const cleanCode = courseCode.trim();
    if (cleanCode) {
      const duplicateByCode = courses.find(
        c => c.id !== editingCourseId && c.code && c.code.trim().toUpperCase() === cleanCode.toUpperCase()
      );
      if (duplicateByCode) {
        setDuplicateError(`خطا در کد دوره: کد «${cleanCode}» قبلاً برای دوره «${duplicateByCode.title}» استفاده شده است! لطفاً کد دیگری وارد فرمایید.`);
        return;
      }
    }

    const activeScheduleDaysText = isScheduleCustomMode
      ? `برنامه سفارشی‌سازی شده (${customDays.join('، ')})`
      : customDays.join('، ');

    // Check for duplicate room and time slot conflict
    const duplicateSlot = courses.find(
      c => c.id !== editingCourseId &&
           c.room.trim() === room.trim() &&
           c.scheduleTime.trim() === scheduleTime.trim() &&
           c.startDate.trim() === startDate.trim() &&
           (c.scheduleDays.trim() === activeScheduleDaysText || (c.customScheduleDays && c.customScheduleDays.some(d => customDays.includes(d))))
    );
    if (duplicateSlot) {
      setDuplicateError(`تداخل در تعریف دوره: کلاسی با نام «${duplicateSlot.title}» قبلاً برای همین سالن/اتاق (${room})، در روزهای (${duplicateSlot.scheduleDays}) و ساعت (${scheduleTime}) ثبت شده است!`);
      return;
    }

    setDuplicateError(null);

    let finalTeacherName = manualTeacherName;
    let finalTeacherId = teacherId;

    if (!useManualTeacher) {
      const selectedTeacherObj = users.find(u => u.id === teacherId);
      if (selectedTeacherObj) {
        finalTeacherName = selectedTeacherObj.name;
        finalTeacherId = selectedTeacherObj.id;
      }
    } else if (!finalTeacherId) {
      finalTeacherId = `teacher-custom-${Date.now()}`;
    }

    if (!finalTeacherName) {
      finalTeacherName = 'استاد شکوه دانش';
    }

    const calculatedTimeline = calculateCourseSessionsTimeline(
      startDate,
      endDate,
      customDays,
      isScheduleCustomMode ? currentParsedCustomDates : undefined
    );

    const finalCode = cleanCode || generateCourseCode(startDate, courses.map(c => c.code), editingCourseId);

    const coursePayload = {
      code: finalCode,
      title,
      category: category as CourseCategory,
      teacherId: finalTeacherId,
      teacherName: finalTeacherName,
      capacity,
      scheduleDays: activeScheduleDaysText,
      scheduleTime,
      room,
      price,
      teacherWage,
      description,
      startDate,
      endDate,
      customScheduleDays: customDays,
      customDatesList: isScheduleCustomMode ? currentParsedCustomDates : undefined,
      monthlySessionAnalysis: calculatedTimeline.monthlyBreakdown.map(m => ({
        monthName: m.monthName,
        sessionCount: m.totalSessions,
        dates: m.sessionDates.map(d => d.date),
        holidaysExcludedCount: m.holidaysEncountered.length
      }))
    };

    if (editingCourseId) {
      updateCourse(editingCourseId, coursePayload);
    } else {
      addCourse({
        ...coursePayload,
        status: 'active'
      });
    }

    setIsModalOpen(false);
  };

  const filteredTeacherStudents = teacherStudentsList.filter(s =>
    (s.name || '').toLowerCase().includes((studentSearchQuery || '').toLowerCase()) ||
    (s.phone || '').includes(studentSearchQuery || '')
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. STUDENT VIEW: Official Academy Information Card at the Top */}
      {currentUser.role === 'student' && (
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-blue-700/40">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    آکادمی فناوری اطلاعات و زبان شکوه دانش
                  </h2>
                  <p className="text-xs text-blue-200/80 mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    دارای مجوز رسمی از سازمان آموزش فنی و حرفه‌ای کشور (کد مرکز: ۲۴۸۹۱)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  ● وضعیت پرونده شما: دانش‌آموخته فعال
                </span>
              </div>
            </div>

            {/* Academy Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>آدرس و نشانی مرکز:</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  مشهد، بلوار احمدآباد، خیابان عدالت، پلاک ۴۵ (دسترسی مستقیم ایستگاه مترو طالقانی)
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>تلفن‌های تماس و پشتیبانی:</span>
                </div>
                <p className="text-slate-200 text-[11px] font-mono leading-relaxed">
                  ۰۵۱-۳۸۴۰۰۰۰۰ | ۰۹۱۲۰۰۰۰۰۰۰
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>ساعات کاری و پاسخگویی:</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  همه روزه شنبه تا پنج‌شنبه: ۸:۰۰ صبح الی ۲۰:۳۰ شب
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEACHER STATS & TABS */}
      {currentUser.role === 'teacher' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">تعداد کل دوره‌های تحت تدریس</span>
              <div className="text-2xl font-black text-blue-600 font-mono">
                {teacherCourses.length} <span className="text-xs text-slate-400 font-sans">کلاس فعال</span>
              </div>
              <p className="text-[11px] text-slate-500">تخصیص‌یافته توسط مدیریت آکادمی</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">تعداد کل دانشجویان شما</span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {totalTeacherStudentsCount} <span className="text-xs text-slate-400 font-sans">دانشجو</span>
              </div>
              <p className="text-[11px] text-emerald-600">مجموع ثبت‌نامی‌های تمام کلاس‌ها</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-slate-400 font-medium">برنامه هفتگی تدریس</span>
              <div className="text-base font-bold text-slate-800 dark:text-white truncate">
                {teacherCourses.map(c => c.scheduleDays).join(' / ') || 'ثبت نشده'}
              </div>
              <p className="text-[11px] text-slate-400">ساعات حضور در سایت‌های آموزشی</p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold w-fit">
            <button
              onClick={() => setTeacherActiveTab('courses')}
              className={`px-4 py-2 rounded-lg transition-all ${
                teacherActiveTab === 'courses' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500'
              }`}
            >
              کلاس‌ها و دوره‌های من ({teacherCourses.length})
            </button>
            <button
              onClick={() => setTeacherActiveTab('students')}
              className={`px-4 py-2 rounded-lg transition-all ${
                teacherActiveTab === 'students' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500'
              }`}
            >
              لیست دانشجویان من ({totalTeacherStudentsCount})
            </button>
          </div>
        </div>
      )}

      {/* Header Bar for Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            {currentUser.role === 'student' || currentUser.role === 'intern'
              ? 'کلاس‌ها و دوره‌های آموزشی ثبت‌نام شده'
              : currentUser.role === 'teacher'
              ? teacherActiveTab === 'courses' ? 'کلاس‌های تحت تدریس من' : 'دانشجویان کلاس‌های من'
              : 'مدیریت دوره‌ها و کلاس‌های آموزشی شکوه دانش'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentUser.role === 'student'
              ? 'لیست دوره‌هایی که توسط مدیریت آکادمی برای شما تعیین گردیده است.'
              : currentUser.role === 'teacher'
              ? 'مشاهده تایم کلاس‌ها، تعداد دانشجویان در هر دوره و نظارت آموزشی'
              : 'برنامه‌ریزی سرفصل‌ها، تخصیص استاد، ظرفیت کلاس‌ها و زمان‌بندی روزهای زوج و فرد'}
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition-all shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              ثبت مدرس جدید
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              تعریف دوره جدید
            </button>
          </div>
        )}
      </div>

      {/* TEACHER STUDENTS TAB */}
      {currentUser.role === 'teacher' && teacherActiveTab === 'students' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو در بین دانشجویان من..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs outline-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold">
              تعداد نمایش: {filteredTeacherStudents.length} دانشجو
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">نام و نام خانوادگی</th>
                  <th className="p-3.5">شماره تماس</th>
                  <th className="p-3.5">دوره‌های تحت تدریس شما</th>
                  <th className="p-3.5">وضعیت تحصیلی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTeacherStudents.map(student => {
                  const studentCourses = teacherCourses.filter(c => 
                    c.studentIds?.includes(student.id) || student.enrolledCourseIds?.includes(c.id)
                  );
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center text-[10px] font-black">
                          {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{student.phone}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {studentCourses.map(sc => (
                            <span key={sc.id} className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                              {sc.title}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          فعال در کلاس
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Courses Cards Grid with Search and Course Code */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجوی دوره بر اساس عنوان، کد دوره (مثلاً 1404-0415) یا مدرس..."
                value={courseSearchQuery}
                onChange={e => setCourseSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-8 py-2 text-xs outline-none text-slate-800 dark:text-white"
              />
              {courseSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCourseSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
              <span>تعداد کلاس‌های یافت‌شده: <strong className="text-slate-900 dark:text-white font-mono">{filteredVisibleCourses.length}</strong></span>
            </div>
          </div>

          {filteredVisibleCourses.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {courseSearchQuery
                  ? 'دوره‌ای با مشخصات جستجو شده یافت نشد'
                  : currentUser.role === 'student' || currentUser.role === 'intern'
                  ? 'هنوز در کلاسی توسط مدیریت ثبت‌نام نشده‌اید'
                  : currentUser.role === 'teacher'
                  ? 'هنوز دوره‌ای به شما تخصیص داده نشده است'
                  : 'هیچ دوره‌ای تعریف نشده است'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {courseSearchQuery
                  ? 'می‌توانید عنوان دوره، کد دوره، نام مدرس یا دسته‌بندی را بررسی نمایید.'
                  : currentUser.role === 'student' || currentUser.role === 'intern'
                  ? 'به محض ثبت‌نام شما در دوره‌ها توسط مدیریت آکادمی، جزئیات کلاس‌ها در این بخش نمایش داده خواهد شد.'
                  : currentUser.role === 'teacher'
                  ? 'مدیریت آکادمی دوره‌های مربوط به شما را در این بخش فعال خواهد کرد.'
                  : 'سامانه آماده تعریف دوره‌ها و کلاس‌های جدید آموزشی است.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVisibleCourses.map(course => {
                const isSelected = selectedCourse?.id === course.id;
                const enrolledPercentage = Math.round((course.enrolledCount / course.capacity) * 100);

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                            {course.category === 'scratch' ? 'اسکرچ کودکان' :
                             course.category === 'wordpress' ? 'طراحی سایت وردپرس' :
                             course.category === 'python' ? 'برنامه‌نویسی پایتون' :
                             course.category === 'seo' ? 'سئو تخصصی' :
                             course.category === 'programming' ? 'برنامه‌نویسی عمومی' :
                             course.category === 'icdl' ? 'مهارت‌های هفتگانه ICDL' :
                             course.category}
                          </span>

                          {course.code && (
                            <span
                              className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 flex items-center gap-1"
                              title={`کد یکتا کلاس: ${course.code} (شامل سال برگزاری و تاریخ شروع)`}
                            >
                              <Hash className="w-3 h-3 text-amber-500" />
                              کد: {course.code}
                            </span>
                          )}
                        </div>

                        {currentUser.role === 'admin' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenModal(course)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="ویرایش دوره"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`آیا از حذف دوره «${course.title}» مطمئن هستید؟`)) {
                                  deleteCourse(course.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="حذف دوره"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Info Pills */}
                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>مدرس: <strong className="text-slate-900 dark:text-white font-bold">{course.teacherName}</strong></span>
                        </div>
                        {(currentUser.role === 'admin' || currentUser.role === 'teacher') && course.teacherWage !== undefined && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                            حق‌التدریس: {course.teacherWage.toLocaleString('fa-IR')} ت
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{course.scheduleDays} | ساعت: <strong className="font-mono text-blue-600">{course.scheduleTime}</strong></span>
                      </div>

                      {course.startDate && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>بازه دوره: <strong className="font-mono text-slate-800 dark:text-slate-200">{course.startDate}</strong> تا <strong className="font-mono text-slate-800 dark:text-slate-200">{course.endDate || 'پایان سال'}</strong></span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>مکان برگزاری: {course.room}</span>
                      </div>
                    </div>

                    {/* Progress Bar for Capacity */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>تعداد دانشجویان دوره: <strong>{course.enrolledCount}</strong> از {course.capacity} نفر</span>
                        <span className="font-mono font-bold text-blue-600">{enrolledPercentage}٪</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${enrolledPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Associated Class Group Links */}
                    {(() => {
                      const courseGroup = groupLinks.find(g => g.active && g.courseIds?.includes(course.id));
                      if (courseGroup) {
                        return (
                          <div className="pt-2">
                            <a
                              href={courseGroup.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">گروه کلاس: {courseGroup.title}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0">
                                <span>ورود</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            </a>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Price & Expand button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">شهریه مصوب:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {course.price.toLocaleString('fa-IR')} <span className="text-[10px] font-sans font-normal text-slate-400">تومان</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedCourse(isSelected ? null : course)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                    >
                      {isSelected ? 'بستن جزییات' : 'مشاهده سرفصل‌ها'}
                      {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Details Section */}
                  {isSelected && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs animate-fade-in">
                      {/* Course Identity Pill */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <Hash className="w-3.5 h-3.5 text-amber-500" />
                          کد اختصاصی دوره: <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{course.code || '---'}</strong>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                          تاریخ شروع: {course.startDate} | پایان: {course.endDate}
                        </span>
                      </div>

                      {/* Monthly Sessions Breakdown if available */}
                      {course.monthlySessionAnalysis && course.monthlySessionAnalysis.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            برنامه جلسات ماهانه و تقویم کلاس
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {course.monthlySessionAnalysis.map((m, idx) => (
                              <div key={idx} className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-0.5">
                                <p className="font-bold text-emerald-900 dark:text-emerald-200">{m.monthName}</p>
                                <p className="font-black text-emerald-700 dark:text-emerald-400 font-mono">{m.sessionCount} جلسه</p>
                                {m.holidaysExcludedCount ? (
                                  <p className="text-[10px] text-rose-500">حذف {m.holidaysExcludedCount} روز تعطیل</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        جلسات و تکالیف دوره
                      </h4>

                      {course.sessions.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {course.sessions.map(sess => (
                            <div key={sess.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                                <span>جلسه {sess.sessionNumber}: {sess.title}</span>
                                <span className="text-[10px] font-mono text-slate-400">{sess.date}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">مباحث: {sess.topics.join('، ')}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">جلسه‌ای برای این دوره ثبت نشده است.</p>
                      )}

                      {/* Course Group Links in Details */}
                      {(() => {
                        const relatedGroups = groupLinks.filter(g => g.active && (g.isPublic || g.courseIds?.includes(course.id)));
                        return (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5">
                                <Share2 className="w-4 h-4 text-emerald-500" />
                                گروه‌های ارتباطی و کانال این کلاس
                              </span>
                              {currentUser.role === 'admin' && (
                                <button
                                  onClick={() => setActiveModule('messages')}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                                >
                                  مدیریت لینک‌ها در پیام‌رسان
                                </button>
                              )}
                            </h4>

                            {relatedGroups.length === 0 ? (
                              <p className="text-slate-400 text-[11px]">هنوز لینک گروهی برای این کلاس توسط مدیر تعریف نشده است.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {relatedGroups.map(g => (
                                  <div key={g.id} className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <strong className="block text-slate-900 dark:text-white text-xs truncate">
                                        {g.title}
                                      </strong>
                                      <p className="text-[10px] text-slate-500 truncate">
                                        {g.description || (g.isPublic ? 'گروه عمومی آکادمی' : 'گروه اختصاصی دانشجویان این دوره')}
                                      </p>
                                    </div>
                                    <a
                                      href={g.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
                                    >
                                      <span>ورود به گروه</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* Modal: Add/Edit Course (With dropdown or manual teacher input) */}
      {/* Modal 1: Add / Edit Course */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingCourseId ? 'ویرایش دوره آموزشی' : 'تعریف دوره جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 pr-2 pl-2 space-y-3.5 text-xs">
              {duplicateError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-shake shadow-md">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span className="leading-relaxed">{duplicateError}</span>
                </div>
              )}

              {/* Course Title and Automated Unique Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                    عنوان دوره آموزشی * <span className="text-[10px] font-normal text-rose-500">(کلاس هم‌نام مجاز نیست)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً برنامه‌نویسی پایتون مقدماتی تا پیشرفته"
                    value={title}
                    onChange={e => {
                      setTitle(e.target.value);
                      if (duplicateError) setDuplicateError(null);
                    }}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 text-[11px]">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      کد کلاس *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoCode = generateCourseCode(startDate, courses.map(c => c.code), editingCourseId);
                        setCourseCode(autoCode);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-0.5"
                      title="تولید خودکار کد با سال و تاریخ شروع"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      تولید خودکار
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="مثلاً 1404-0415"
                    value={courseCode}
                    onChange={e => {
                      setCourseCode(e.target.value);
                      if (duplicateError) setDuplicateError(null);
                    }}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono font-bold text-xs text-center tracking-wider"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">شامل سال و تاریخ شروع جهت تفکیک کلاس‌ها</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">دسته‌بندی دوره (انتخاب یا تایپ دستی)</label>
                  <EditableSelect
                    value={category}
                    onChange={setCategory}
                    options={[
                      { value: 'برنامه‌نویسی پایتون', label: '🐍 برنامه‌نویسی پایتون' },
                      { value: 'طراحی سایت وردپرس', label: '🌐 طراحی سایت وردپرس' },
                      { value: 'برنامه‌نویسی اسکرچ', label: '🧩 برنامه‌نویسی اسکرچ کودکان' },
                      { value: 'سئو تخصصی', label: '📈 سئو و بهینه‌سازی وب' },
                      { value: 'مهارت‌های ICDL', label: '💻 مهارت‌های هفت‌گانه ICDL' },
                      { value: 'فرانت‌اند و ری‌اکت', label: '⚛ فرانت‌اند و React' },
                      { value: 'هوش مصنوعی', label: '🤖 هوش مصنوعی و دیتا ساینس' }
                    ]}
                    placeholder="انتخاب یا تایپ دسته‌بندی..."
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">مدرس دوره (انتخاب یا تایپ نام جدید)</label>
                  <EditableSelect
                    value={useManualTeacher ? manualTeacherName : (activeTeachers.find(t => t.id === teacherId)?.name || manualTeacherName || teacherId)}
                    onChange={val => {
                      const matched = activeTeachers.find(t => t.name === val || t.id === val);
                      if (matched) {
                        setTeacherId(matched.id);
                        setManualTeacherName(matched.name);
                        setUseManualTeacher(false);
                      } else {
                        setTeacherId('');
                        setManualTeacherName(val);
                        setUseManualTeacher(true);
                      }
                    }}
                    options={activeTeachers.map(t => ({
                      value: t.name,
                      label: t.name
                    }))}
                    placeholder="انتخاب استاد یا تایپ نام مدرس..."
                    required
                  />
                </div>
              </div>

              {/* Financial: Tuition and Teacher Wage with 3-digit comma separation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                    شهریه مصوب دوره * (تفکیک ۳ رقمی)
                  </label>
                  <FormattedCurrencyInput
                    value={price}
                    onChange={setPrice}
                    unit="تومان"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">مبلغ پرداختی هر دانشجو برای کل دوره</span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    حق‌التدریس مصوب استاد *
                  </label>
                  <FormattedCurrencyInput
                    value={teacherWage}
                    onChange={setTeacherWage}
                    unit="تومان"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">دستمزد تعیین‌شده مدیر برای پرداخت به مدرس</span>
                </div>
              </div>

              {/* Schedule Dates & Days Section with Persian Calendar 1405 & Real-time Calculation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    تقویم شمسی دوره (سال ۱۴۰۵) و محاسبه خودکار جلسات
                  </span>
                  
                  {/* Calendar 1405 Presets & Custom toggle */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyCalendarPreset('year1405_remaining')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center gap-1 transition-colors"
                      title="تنظیم بازه از تاریخ امروز تا پایان اسفند ۱۴۰۵"
                    >
                      <RotateCw className="w-3 h-3" />
                      تا پایان سال ۱۴۰۵
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCalendarPreset('year1405_full')}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                    >
                      کل سال ۱۴۰۵
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCalendarPreset('first_half')}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                    >
                      نیمسال ۱
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCalendarPreset('second_half')}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                    >
                      نیمسال ۲
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduleCustomMode(!isScheduleCustomMode)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        isScheduleCustomMode
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isScheduleCustomMode ? '✓ روزهای دلخواه' : '+ روزها/تاریخ‌های دلخواه'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                      تاریخ شروع دوره (شمسی) *
                    </label>
                    <input
                      type="text"
                      value={startDate}
                      onChange={e => {
                        const newStart = e.target.value;
                        setStartDate(newStart);
                        if (!courseCode || courseCode.length <= 12) {
                          setCourseCode(generateCourseCode(newStart, courses.map(c => c.code), editingCourseId));
                        }
                      }}
                      required
                      placeholder="۱۴۰۵/۰۱/۱۵"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                      تاریخ پایان دوره (شمسی) *
                    </label>
                    <input
                      type="text"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                      placeholder="۱۴۰۵/۰۶/۳۰"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Custom Days Selection */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
                    روزهای تشکیل کلاس در هفته:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map(day => {
                      const isSelected = customDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (customDays.length > 1) {
                                setCustomDays(customDays.filter(d => d !== day));
                              }
                            } else {
                              setCustomDays([...customDays, day]);
                            }
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Dates input if enabled */}
                {isScheduleCustomMode && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      تاریخ‌های مشخص دلخواه (با کاما یا سرخط جدا کنید - اختیاری):
                    </label>
                    <textarea
                      rows={2}
                      value={customDatesInput}
                      onChange={e => setCustomDatesInput(e.target.value)}
                      placeholder="مثلاً: 1405/02/04, 1405/02/11, 1405/02/18, 1405/02/25"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 outline-none text-slate-800 dark:text-white font-mono text-xs"
                    />
                  </div>
                )}

                {/* Real-time Session Calculations Result */}
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <span className="font-bold text-blue-950 dark:text-blue-200">
                      📊 محاسبه دقیق تقویم: مجموع جلسات مفید: <strong className="text-blue-600 dark:text-blue-400 text-sm font-black">{currentScheduleAnalysis.totalSessions} جلسه</strong>
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
                      تعطیلات رسمی حذف‌شده: {currentScheduleAnalysis.totalHolidaysExcluded} روز
                    </span>
                  </div>

                  {/* Monthly Session breakdown badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentScheduleAnalysis.monthlyBreakdown.map((m, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[11px] flex items-center gap-1.5"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300">{m.monthName}:</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 font-mono">{m.totalSessions} جلسه</span>
                        {m.holidaysEncountered.length > 0 && (
                          <span className="text-[10px] text-rose-500 font-medium" title={m.holidaysEncountered.map(h => `${h.date}: ${h.title}`).join('\n')}>
                            ({m.holidaysEncountered.length} تعطیلی)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">ظرفیت کلاس (نفر)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                    ساعت کلاس (دستی/انتخاب) *
                  </label>
                  <EditableSelect
                    id="course_schedule_time"
                    storageKey="course_schedule_times"
                    value={scheduleTime}
                    onChange={setScheduleTime}
                    options={[
                      '۰۹:۰۰ - ۱۱:۰۰',
                      '۱۱:۳۰ - ۱۳:۳۰',
                      '۱۴:۰۰ - ۱۶:۰۰',
                      '۱۶:۰۰ - ۱۸:۰۰',
                      '۱۷:۰۰ - ۱۹:۰۰',
                      '۱۸:۰۰ - ۲۰:۰۰',
                      '۱۹:۰۰ - ۲۱:۰۰'
                    ]}
                    placeholder="ساعت برگزاری..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                  مکان یا سایت برگزاری (دستی/انتخاب) *
                </label>
                <EditableSelect
                  id="course_room_select"
                  storageKey="course_room_locations"
                  value={room}
                  onChange={setRoom}
                  options={[
                    'سایت شماره ۱ (سیستم‌های مهندسی)',
                    'سایت شماره ۲ (لپ‌تاپ کارآموزان)',
                    'کلاس تئوری شماره ۱۰۱',
                    'کلاس تئوری شماره ۱۰۲',
                    'آزمایشگاه شبکه و امنیت',
                    'سالن وبینار و سمینار'
                  ]}
                  placeholder="مکان برگزاری..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">توضیحات، سرفصل‌ها و پیش‌نیازها</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="توضیحاتی در مورد سرفصل‌ها و اهداف دوره..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                ></textarea>
              </div>

              {duplicateError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{duplicateError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow"
                >
                  {editingCourseId ? 'ذخیره تغییرات' : 'ایجاد دوره'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Teacher */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                ثبت استاد و مدرس جدید
              </h3>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 pr-2 pl-2 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  placeholder="مثلاً دکتر مریم کاظمی"
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">شماره تماس مستقیم *</label>
                <input
                  type="text"
                  placeholder="0915xxxxxxx"
                  value={newTeacherPhone}
                  onChange={e => setNewTeacherPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">نام کاربری ورود</label>
                  <input
                    type="text"
                    placeholder="teacher_username"
                    value={newTeacherUsername}
                    onChange={e => setNewTeacherUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">کلمه عبور پیش‌فرض</label>
                  <input
                    type="text"
                    value={newTeacherPassword}
                    onChange={e => setNewTeacherPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                >
                  ثبت مشخصات استاد
                </button>
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
