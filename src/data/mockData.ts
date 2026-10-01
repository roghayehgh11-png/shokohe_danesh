import {
  User,
  Course,
  Project,
  DailyReport,
  CustomerLead,
  ChatMessage,
  ChatChannel,
  ActivityLog,
  SystemNotification,
  TuitionRecord,
  PaymentTransaction,
  InstallmentPlan,
  ExpenseRecord,
  TeacherSalaryRecord,
  GroupLink
} from '../types';

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'علی هاشمی',
    username: 'ali_hashemi',
    password: '123',
    email: 'hashemi@shokooh.ir',
    phone: '09121111111',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skills: ['مدیریت آکادمی', 'معماری نرم‌افزار', 'تحلیل مالی', 'مدیریت پروژه'],
    bio: 'مدیر کل آکادمی فناوری اطلاعات شکوه دانش (shoukoh danesh).',
    status: 'active',
    joinDate: '1402/01/01',
    educationalHistory: [],
    workHistory: []
  },
  {
    id: 'u-2',
    name: 'مهندس سارا راد',
    username: 'sara_rad',
    password: '123',
    email: 'sara.rad@shokooh.ir',
    phone: '09122222222',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    skills: ['برنامه‌نویسی React', 'طراحی وب و وردپرس', 'پایتون'],
    bio: 'مدرس ارشد دوره‌های تخصصی فرانت‌اند و برنامه‌نویسی وب.',
    status: 'active',
    joinDate: '1402/02/10',
    educationalHistory: [],
    workHistory: []
  },
  {
    id: 'u-3',
    name: 'رضا کرمی',
    username: 'reza_karami',
    password: '123',
    email: 'reza.karami@shokooh.ir',
    phone: '09123333333',
    role: 'intern',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    skills: ['توسعه React', 'TypeScript', 'مستندسازی پروژه'],
    bio: 'کارآموز واحد توسعه نرم‌افزار و فرانت‌اند.',
    status: 'active',
    joinDate: '1403/01/15',
    educationalHistory: [],
    workHistory: []
  },
  {
    id: 'u-4',
    name: 'مینا احمدی',
    username: 'mina_ahmadi',
    password: '123',
    email: 'mina.ahmadi@shokooh.ir',
    phone: '09124444444',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    skills: ['پایتون مقدماتی', 'مهارت‌های هفتگانه ICDL'],
    bio: 'دانشجوی دوره‌های تخصصی برنامه‌نویسی و کامپیوتر.',
    status: 'active',
    joinDate: '1403/03/01',
    educationalHistory: [],
    workHistory: []
  }
];

export const initialCourses: Course[] = [];

export const initialProjects: Project[] = [];

export const initialDailyReports: DailyReport[] = [];

export const initialCustomerLeads: CustomerLead[] = [];

export const initialTuitions: TuitionRecord[] = [];

export const initialPayments: PaymentTransaction[] = [];

export const initialInstallments: InstallmentPlan[] = [];

export const initialExpenses: ExpenseRecord[] = [];

export const initialTeacherSalaries: TeacherSalaryRecord[] = [];

export const initialChatChannels: ChatChannel[] = [
  { id: 'c-bale', name: 'گروه رسمی پیام‌رسان بله (ble.ir/join/8PR5Yn669h)', type: 'group', unreadCount: 0, lastMessage: 'اتصال به گروه بله فعال است', lastMessageTime: 'هم‌اکنون' },
  { id: 'c-general', name: 'کانال عمومی و اطلاعیه‌های آکادمی', type: 'group', unreadCount: 0, lastMessage: '', lastMessageTime: '' }
];

export const initialMessages: ChatMessage[] = [];

export const initialActivityLogs: ActivityLog[] = [
  { id: 'log-init', userId: 'u-1', userName: 'علی هاشمی', userRole: 'admin', action: 'راه‌اندازی سامانه', module: 'سیستم', timestamp: '1402/01/01 - 08:00', details: 'سامانه مدیریت آکادمی با موفقیت آماده بهره‌برداری شد.' }
];

export const initialNotifications: SystemNotification[] = [];

export const initialGroupLinks: GroupLink[] = [
  {
    id: 'grp-public-bale',
    title: 'گروه رسمی آکادمی شکوه دانش در پیام‌رسان بله',
    platform: 'bale',
    url: 'https://ble.ir/join/8PR5Yn669h',
    description: 'گروه جامع و عمومی اطلاع‌رسانی، تعامل و پاسخگویی به کلیه دانشجویان، کارآموزان و اساتید',
    audienceType: 'all',
    courseIds: [],
    isPublic: true,
    createdBy: 'علی هاشمی (مدیر کل)',
    createdAt: '1403/01/01',
    active: true
  },
  {
    id: 'grp-interns-team',
    title: 'گروه تخصصی کارآموزان پروژه‌های آکادمی',
    platform: 'bale',
    url: 'https://ble.ir/join/interns_shokooh',
    description: 'هماهنگی تسک‌ها، گزارش کار روزانه و منتورینگ تیم توسعه و طراحی نرم‌افزار',
    audienceType: 'interns',
    courseIds: [],
    isPublic: false,
    createdBy: 'علی هاشمی (مدیر کل)',
    createdAt: '1403/01/15',
    active: true
  },
  {
    id: 'grp-teachers-board',
    title: 'کانال اساتید و هیئت علمی آکادمی',
    platform: 'eitaa',
    url: 'https://eitaa.com/shokooh_teachers',
    description: 'اطلاعیه‌ها و هماهنگی‌های آموزشی و اداری ویژه مدرسین محترم',
    audienceType: 'teachers',
    courseIds: [],
    isPublic: false,
    createdBy: 'علی هاشمی (مدیر کل)',
    createdAt: '1403/02/01',
    active: true
  }
];
