export type UserRole = 'admin' | 'teacher' | 'intern' | 'student';

export interface EducationalHistory {
  id: string;
  title: string;
  institution: string;
  year: string;
}

export interface WorkHistory {
  id: string;
  title: string;
  company: string;
  duration: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  password?: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  skills: string[];
  bio?: string;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  
  // Under 18 parent details
  age?: number;
  isUnder18?: boolean;
  fatherName?: string;
  parentsName?: string;
  parentsPhone?: string;
  parentsAddress?: string;
  emergencyPhone?: string;

  // Referral Source
  referralSource?: string;

  // Documents & Resumes
  resumeUrl?: string;
  resumeName?: string;
  resumeSize?: string;
  resumeDate?: string;
  documents?: { name: string; url: string; date: string }[];

  // Background
  educationalHistory?: EducationalHistory[];
  workHistory?: WorkHistory[];

  enrolledCourseIds?: string[];
  assignedProjectIds?: string[];
  activityHistory?: { date: string; action: string }[];

  // Personality & Special Notes
  personalityNotes?: string;
  specialNotes?: string;
}

export type CourseCategory = 'scratch' | 'wordpress' | 'python' | 'seo' | 'programming' | 'icdl';

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'code';
  url: string;
  date: string;
}

export interface CourseHomework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  submissionsCount: number;
}

export interface CourseSession {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  time: string;
  topics: string[];
  completed: boolean;
}

export interface Course {
  id: string;
  code?: string; // کد اختصاصی و یکتای دوره شامل سال برگزاری و تاریخ شروع
  title: string;
  category: CourseCategory;
  teacherId: string;
  teacherName: string;
  capacity: number;
  enrolledCount: number;
  scheduleDays: string; // e.g., "زوج (شنبه، دوشنبه، چهارشنبه)"
  scheduleTime: string; // e.g., "16:00 - 18:00"
  room: string;
  status: 'enrolling' | 'active' | 'completed';
  price: number; // Toman
  teacherWage?: number; // Toman - حق‌التدریس تعیین شده برای استاد
  description: string;
  startDate: string;
  endDate: string;
  customScheduleDays?: string[]; // e.g. ['شنبه', 'دوشنبه', 'چهارشنبه']
  customDatesList?: string[]; // specific custom dates if specified
  monthlySessionAnalysis?: {
    month: string;
    sessionsCount: number;
    dates: string[];
    holidaysExemptedCount: number;
  }[];
  studentIds: string[];
  materials: CourseMaterial[];
  homeworks: CourseHomework[];
  sessions: CourseSession[];
}

export type ProjectStatus = 'new' | 'in_progress' | 'needs_review' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  date: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  uploadedBy: string;
  date: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientName?: string;
  leadInternId: string;
  leadInternName: string;
  teamInternIds: string[];
  supervisorTeacherId?: string;
  startDate?: string;
  deadline: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  progressPercentage: number;
  tasks: ProjectTask[];
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  category: string;
  createdAt: string;
  autoMovedByAi?: boolean;
  aiTransitionReason?: string;
  lastAiAnalysisDate?: string;
}

export type DailyReportStatus = 'submitted' | 'approved' | 'needs_revision' | 'rejected';

export interface DailyReport {
  id: string;
  internId: string;
  internName: string;
  internAvatar: string;
  date: string;
  clockIn: string;
  clockOut: string;
  workedHours: number;
  projectId: string;
  projectTitle: string;
  tasksDone: string;
  problemsEncountered: string;
  tomorrowsPlan: string;
  progressAdded: number;
  attachmentName?: string;
  
  // PDF Report Details & Auto Analysis
  pdfFileName?: string;
  pdfFileUrl?: string;
  pdfFileSize?: string;
  pdfPageCount?: number;
  pdfAnalyzed?: boolean;
  aiAnalysis?: {
    workedHours: number;
    extractedTasks: string[];
    technicalKeyPoints: string[];
    challengesIdentified: string[];
    qualityScore: number; // 0 to 100
    productivityRating: 'عالی' | 'خوب' | 'متوسط' | 'نیاز به بهبود';
    autoEvaluation: string;
  };
  
  // 5-line executive AI analysis for managers/admins
  aiFiveLineAnalysis?: {
    line1HoursWorked: string; // خلاصه ساعت کارکرد مفید
    line2TimeWastedOrGaps: string; // چقدر هدر داد یا فاصله و اتلاف زمانی
    line3TasksAccomplished: string; // چه کارهایی کرد و خروجی‌های اصلی
    line4TechnicalChallenges: string; // چالش‌ها، باگ‌ها و عملکرد کیفی
    line5ProjectDecisionGuidance: string; // راهنما و توصیه تصمیم‌گیری برای ادامه پروژه
    fullSummaryText?: string;
  };

  status: DailyReportStatus;
  reviewerFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface MonthlyInternSummary {
  internId: string;
  internName: string;
  month: string;
  totalWorkedHours: number;
  reportsSubmittedCount: number;
  pdfReportsCount: number;
  projectsInvolvedCount: number;
  overallProgressPercentage: number;
  averageQualityScore: number;
  performanceComparison: string; // e.g. "+۱۲٪ نسبت به ماه قبل"
  keyStrengths: string[];
  growthRecommendations: string[];
  dailyHoursBreakdown: { date: string; hours: number }[];
}

export type LeadStatus = 'new_lead' | 'contacted' | 'consultation' | 'pending_decision' | 'enrolled' | 'cancelled';

export interface ConsultationNote {
  id: string;
  authorName: string;
  date: string;
  note: string;
}

export interface CustomerLead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  occupation: string;
  interestedCourseCategory: string;
  referralSource: 'سایت' | 'دوستان' | 'اینستاگرام' | 'تبلیغات' | 'سایر' | string;
  status: LeadStatus;
  cancellationReason?: string; // "بالا بودن شهریه", "عدم تطابق ساعت کلاس", "دوری مسافت", etc.
  notes: ConsultationNote[];
  visitDate: string;
  assignedConsultant: string;
  createdAt: string;
  convertedToStudentId?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

// Financial Types
export type PaymentMethod = 'card' | 'cash' | 'cheque' | 'online';

export interface TuitionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  courseId: string;
  courseTitle: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  tuitionId?: string;
  studentId: string;
  studentName: string;
  courseTitle?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  trackingCode: string;
  description?: string;
  createdAt: string;
}

export interface InstallmentPlan {
  id: string;
  tuitionId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  trackingCode?: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'rent' | 'utilities' | 'salaries' | 'equipment' | 'marketing' | 'other';
  amount: number;
  date: string;
  recipientName?: string;
  description?: string;
  receiptCode?: string;
}

export interface TeacherSalaryRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string;
  amount: number;
  paymentDate: string;
  hoursCount?: number;
  status: 'paid' | 'pending';
  trackingCode?: string;
}

// Chat & Notifications
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  text: string;
  attachmentName?: string;
  attachmentUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

// Group Links Management
export type GroupPlatform = 'bale' | 'eitaa' | 'telegram' | 'rubika' | 'whatsapp' | 'shad' | 'discord' | 'other';

export type GroupAudienceType = 'all' | 'courses' | 'interns' | 'teachers' | 'students';

export interface GroupLink {
  id: string;
  title: string;
  platform: GroupPlatform;
  url: string;
  description?: string;
  audienceType: GroupAudienceType; // 'all' (عمومی), 'courses' (مختص کلاس‌ها), 'interns' (مختص کارآموزان), 'teachers' (مختص اساتید), 'students' (مختص دانشجویان)
  courseIds?: string[]; // شناسه‌های کلاس‌هایی که این گروه متعلق به آن‌هاست
  isPublic: boolean; // آیا گروه عمومی است و همه کاربران آن را می‌بینند
  createdBy: string;
  createdAt: string;
  active: boolean;
}

export type NotificationTarget = 'all' | 'teachers' | 'interns' | 'students' | 'admins' | 'single_user';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert' | 'class_reminder' | 'admin_announcement';
  linkModule?: string;
  targetType?: NotificationTarget;
  targetUserId?: string;
  targetPhone?: string;
  createdBy?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  timestamp: string;
  details?: string;
}

export type ActiveModule =
  | 'dashboard'
  | 'reports'
  | 'users'
  | 'courses'
  | 'projects'
  | 'daily_reports'
  | 'financial'
  | 'messages'
  | 'notifications'
  | 'settings';
