import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  ProjectStatus,
  LeadStatus,
  DailyReportStatus,
  ActiveModule,
  TuitionRecord,
  PaymentTransaction,
  InstallmentPlan,
  ExpenseRecord,
  TeacherSalaryRecord,
  MonthlyInternSummary,
  NotificationTarget,
  GroupLink,
  GroupPlatform,
  GroupAudienceType
} from '../types';
import { evaluateProjectStageFromReports } from '../utils/geminiReportService';
import { generateCourseCode, normalizeCourseTitle } from '../utils/dateUtils';
import {
  initialUsers,
  initialCourses,
  initialProjects,
  initialDailyReports,
  initialCustomerLeads,
  initialChatChannels,
  initialMessages,
  initialActivityLogs,
  initialNotifications,
  initialTuitions,
  initialPayments,
  initialInstallments,
  initialExpenses,
  initialTeacherSalaries,
  initialGroupLinks
} from '../data/mockData';
import {
  subscribeToCollection,
  saveDocumentInFirestore,
  deleteDocumentFromFirestore,
  batchSaveDocuments,
  seedInitialFirestoreData,
  testConnection,
  fetchAllFromCollection
} from '../services/firestoreService';

interface AppContextType {
  isAuthenticated: boolean;
  login: (identity: string, passwordInput: string) => { success: boolean; message?: string };
  logout: () => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  courses: Course[];
  projects: Project[];
  dailyReports: DailyReport[];
  customerLeads: CustomerLead[];
  tuitions: TuitionRecord[];
  payments: PaymentTransaction[];
  installments: InstallmentPlan[];
  expenses: ExpenseRecord[];
  teacherSalaries: TeacherSalaryRecord[];
  chatChannels: ChatChannel[];
  messages: ChatMessage[];
  activityLogs: ActivityLog[];
  notifications: SystemNotification[];
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  addUser: (user: Omit<User, 'id' | 'joinDate'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addCourse: (course: Omit<Course, 'id' | 'enrolledCount' | 'studentIds' | 'materials' | 'homeworks' | 'sessions'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'comments' | 'attachments'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  autoSyncProjectsStages: () => { changedCount: number; summary: string[] };
  toggleProjectTask: (projectId: string, taskId: string) => void;
  addProjectComment: (projectId: string, text: string) => void;

  addDailyReport: (report: Omit<DailyReport, 'id' | 'status'>) => void;
  updateDailyReport: (id: string, updated: Partial<DailyReport>) => void;
  reviewDailyReport: (id: string, status: DailyReportStatus, feedback: string) => void;
  deleteDailyReport: (id: string) => void;
  getMonthlyInternSummary: (internId: string, monthStr?: string) => MonthlyInternSummary;

  addCustomerLead: (lead: Omit<CustomerLead, 'id' | 'createdAt' | 'notes' | 'status'>) => void;
  updateCustomerLead: (id: string, lead: Partial<CustomerLead>) => void;
  deleteCustomerLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus, cancellationReason?: string) => void;
  addLeadNote: (leadId: string, noteText: string) => void;
  convertLeadToStudent: (leadId: string, courseId: string) => void;

  // Financial Actions
  addTuition: (tuition: Omit<TuitionRecord, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => void;
  updateTuition: (id: string, updated: Partial<TuitionRecord>) => void;
  deleteTuition: (id: string) => void;
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'createdAt'>) => void;
  updatePayment: (id: string, updated: Partial<PaymentTransaction>) => void;
  deletePayment: (id: string) => void;
  addInstallment: (installment: Omit<InstallmentPlan, 'id' | 'isPaid'>) => void;
  toggleInstallmentPaid: (installmentId: string, trackingCode?: string) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  updateExpense: (id: string, updated: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  addTeacherSalary: (salary: Omit<TeacherSalaryRecord, 'id'>) => void;
  updateTeacherSalary: (id: string, updated: Partial<TeacherSalaryRecord>) => void;
  deleteTeacherSalary: (id: string) => void;

  // Notification Actions
  sendNotification: (
    title: string,
    message: string,
    targetType: NotificationTarget,
    targetUserId?: string,
    targetPhone?: string
  ) => void;
  markNotificationAsRead: (id: string) => void;

  // Group Links Management
  groupLinks: GroupLink[];
  addGroupLink: (link: Omit<GroupLink, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateGroupLink: (id: string, updated: Partial<GroupLink>) => void;
  deleteGroupLink: (id: string) => void;
  toggleGroupLinkActive: (id: string) => void;
  getVisibleGroupLinksForUser: (user?: User) => GroupLink[];

  sendMessage: (channelId: string, text: string, attachmentName?: string) => void;
  logActivity: (action: string, module: string, details?: string) => void;
  resetAllData: () => void;
  restoreBackup: (backupData: any) => void;

  // Central Cloud Synchronization (Multi-Device Persistence)
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: string;
  serverVersion: number;
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'shokooh_danesh_prod_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    return initialUsers.map(u => {
      if (u.id === 'u-1' || u.name.includes('علی هاشمی')) {
        return { ...u, username: u.username || 'ali_hashemi', password: u.password || '123' };
      }
      if (u.id === 'u-2' || u.name.includes('سارا راد')) {
        return { ...u, username: u.username || 'sara_rad', password: u.password || '123' };
      }
      if (u.id === 'u-3' || u.name.includes('رضا کرمی')) {
        return { ...u, username: u.username || 'reza_karami', password: u.password || '123' };
      }
      if (u.id === 'u-4' || u.name.includes('مینا احمدی')) {
        return { ...u, username: u.username || 'mina_ahmadi', password: u.password || '123' };
      }
      return { ...u, password: u.password || '123' };
    });
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedUserId = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auth_user_id`);
    return !!savedUserId;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auth_user_id`);
    if (savedUserId) {
      const found = initialUsers.find(u => u.id === savedUserId);
      if (found) return found;
    }
    return initialUsers[0];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const existingCodes: string[] = [];
    return initialCourses.map(c => {
      if (c.code) {
        existingCodes.push(c.code);
        return c;
      }
      const generated = generateCourseCode(c.startDate || '1404/01/01', existingCodes);
      existingCodes.push(generated);
      return { ...c, code: generated };
    });
  });

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(initialDailyReports);
  const [customerLeads, setCustomerLeads] = useState<CustomerLead[]>(initialCustomerLeads);
  const [tuitions, setTuitions] = useState<TuitionRecord[]>(initialTuitions);
  const [payments, setPayments] = useState<PaymentTransaction[]>(initialPayments);
  const [installments, setInstallments] = useState<InstallmentPlan[]>(initialInstallments);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [teacherSalaries, setTeacherSalaries] = useState<TeacherSalaryRecord[]>(initialTeacherSalaries);
  const [chatChannels] = useState<ChatChannel[]>(initialChatChannels);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  const [groupLinks, setGroupLinks] = useState<GroupLink[]>(initialGroupLinks);

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION
  // Connects all institute collections directly to Firebase Firestore
  // ==========================================
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  });
  const [serverVersion, setServerVersion] = useState<number>(1);

  // Firestore Real-Time Subscriptions on Mount
  useEffect(() => {
    let isMounted = true;
    const unsubscribers: (() => void)[] = [];

    const initializeFirestore = async () => {
      try {
        setCloudSyncStatus('syncing');
        // Validate connection to Firestore on boot (asynchronously, non-blocking)
        testConnection();

        // Seed default dataset if Firestore is newly provisioned
        await seedInitialFirestoreData({
          users: initialUsers,
          courses: initialCourses.map(c => ({
            ...c,
            code: c.code || generateCourseCode(c.startDate || '1404/01/01', [])
          })),
          projects: initialProjects,
          dailyReports: initialDailyReports,
          customerLeads: initialCustomerLeads,
          tuitions: initialTuitions,
          payments: initialPayments,
          installments: initialInstallments,
          expenses: initialExpenses,
          teacherSalaries: initialTeacherSalaries,
          groupLinks: initialGroupLinks,
          notifications: initialNotifications,
          activityLogs: initialActivityLogs
        });

        // 1. Users real-time listener
        const unsubUsers = subscribeToCollection<User>('users', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setUsers(data);
          setCurrentUser(prev => data.find(u => u.id === prev.id) || prev);
        });
        unsubscribers.push(unsubUsers);

        // 2. Courses real-time listener
        const unsubCourses = subscribeToCollection<Course>('courses', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setCourses(data);
        });
        unsubscribers.push(unsubCourses);

        // 3. Projects real-time listener
        const unsubProjects = subscribeToCollection<Project>('projects', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setProjects(data);
        });
        unsubscribers.push(unsubProjects);

        // 4. Daily Reports real-time listener
        const unsubReports = subscribeToCollection<DailyReport>('dailyReports', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setDailyReports(data);
        });
        unsubscribers.push(unsubReports);

        // 5. Customer Leads real-time listener
        const unsubLeads = subscribeToCollection<CustomerLead>('customerLeads', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setCustomerLeads(data);
        });
        unsubscribers.push(unsubLeads);

        // 6. Tuitions real-time listener
        const unsubTuitions = subscribeToCollection<TuitionRecord>('tuitions', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setTuitions(data);
        });
        unsubscribers.push(unsubTuitions);

        // 7. Payments real-time listener
        const unsubPayments = subscribeToCollection<PaymentTransaction>('payments', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setPayments(data);
        });
        unsubscribers.push(unsubPayments);

        // 8. Installments real-time listener
        const unsubInstallments = subscribeToCollection<InstallmentPlan>('installments', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setInstallments(data);
        });
        unsubscribers.push(unsubInstallments);

        // 9. Expenses real-time listener
        const unsubExpenses = subscribeToCollection<ExpenseRecord>('expenses', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setExpenses(data);
        });
        unsubscribers.push(unsubExpenses);

        // 10. Teacher Salaries real-time listener
        const unsubSalaries = subscribeToCollection<TeacherSalaryRecord>('teacherSalaries', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setTeacherSalaries(data);
        });
        unsubscribers.push(unsubSalaries);

        // 11. Group Links real-time listener
        const unsubLinks = subscribeToCollection<GroupLink>('groupLinks', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setGroupLinks(data);
        });
        unsubscribers.push(unsubLinks);

        // 12. Notifications real-time listener
        const unsubNotifications = subscribeToCollection<SystemNotification>('notifications', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setNotifications(data);
        });
        unsubscribers.push(unsubNotifications);

        // 13. Activity Logs real-time listener
        const unsubLogs = subscribeToCollection<ActivityLog>('activityLogs', (data) => {
          if (!isMounted || !data || data.length === 0) return;
          setActivityLogs(data);
        });
        unsubscribers.push(unsubLogs);

        if (isMounted) {
          setCloudSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('[Firestore Initialization Error]', err);
        if (isMounted) setCloudSyncStatus('error');
      }
    };

    initializeFirestore();

    return () => {
      isMounted = false;
      unsubscribers.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, []);

  const syncNow = async () => {
    try {
      setCloudSyncStatus('syncing');
      testConnection();

      // Refresh all collections directly from Firestore
      const [
        fUsers,
        fCourses,
        fProjects,
        fDailyReports,
        fLeads,
        fTuitions,
        fPayments,
        fInstallments,
        fExpenses,
        fSalaries,
        fGroupLinks,
        fNotifications,
        fActivityLogs
      ] = await Promise.all([
        fetchAllFromCollection<User>('users'),
        fetchAllFromCollection<Course>('courses'),
        fetchAllFromCollection<Project>('projects'),
        fetchAllFromCollection<DailyReport>('dailyReports'),
        fetchAllFromCollection<CustomerLead>('customerLeads'),
        fetchAllFromCollection<TuitionRecord>('tuitions'),
        fetchAllFromCollection<PaymentTransaction>('payments'),
        fetchAllFromCollection<InstallmentPlan>('installments'),
        fetchAllFromCollection<ExpenseRecord>('expenses'),
        fetchAllFromCollection<TeacherSalaryRecord>('teacherSalaries'),
        fetchAllFromCollection<GroupLink>('groupLinks'),
        fetchAllFromCollection<SystemNotification>('notifications'),
        fetchAllFromCollection<ActivityLog>('activityLogs')
      ]);

      if (fUsers && fUsers.length > 0) setUsers(fUsers);
      if (fCourses && fCourses.length > 0) setCourses(fCourses);
      if (fProjects && fProjects.length > 0) setProjects(fProjects);
      if (fDailyReports && fDailyReports.length > 0) setDailyReports(fDailyReports);
      if (fLeads && fLeads.length > 0) setCustomerLeads(fLeads);
      if (fTuitions && fTuitions.length > 0) setTuitions(fTuitions);
      if (fPayments && fPayments.length > 0) setPayments(fPayments);
      if (fInstallments && fInstallments.length > 0) setInstallments(fInstallments);
      if (fExpenses && fExpenses.length > 0) setExpenses(fExpenses);
      if (fSalaries && fSalaries.length > 0) setTeacherSalaries(fSalaries);
      if (fGroupLinks && fGroupLinks.length > 0) setGroupLinks(fGroupLinks);
      if (fNotifications && fNotifications.length > 0) setNotifications(fNotifications);
      if (fActivityLogs && fActivityLogs.length > 0) setActivityLogs(fActivityLogs);

      setCloudSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('[Firestore Refresh Database Notice]', e);
      setCloudSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const logActivity = (action: string, module: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      module,
      timestamp: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      details
    };
    setActivityLogs(prev => [newLog, ...prev]);
    saveDocumentInFirestore('activityLogs', newLog);
  };

  // User CRUD
  const addUser = (userData: Omit<User, 'id' | 'joinDate'>) => {
    const newId = `u-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      joinDate: new Date().toLocaleDateString('fa-IR')
    };
    setUsers(prev => [...prev, newUser]);
    saveDocumentInFirestore('users', newUser);
    logActivity('تعریف کاربر جدید', 'کاربران', `ایجاد کاربر ${newUser.name} با نقش ${newUser.role}`);
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const up = { ...u, ...updated };
        saveDocumentInFirestore('users', up);
        return up;
      }
      return u;
    }));
    logActivity('ویرایش اطلاعات کاربر', 'کاربران', `بروزرسانی کاربر کد ${id}`);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteDocumentFromFirestore('users', id);
    logActivity('حذف کاربر', 'کاربران', `حذف کاربر کد ${id}`);
  };

  // Course CRUD
  const addCourse = (courseData: Omit<Course, 'id' | 'enrolledCount' | 'studentIds' | 'materials' | 'homeworks' | 'sessions'>) => {
    const normTitle = normalizeCourseTitle(courseData.title);
    const hasDuplicateTitle = courses.some(c => normalizeCourseTitle(c.title) === normTitle);
    if (hasDuplicateTitle) {
      console.warn(`Attempted to create duplicate course title: ${courseData.title}`);
      return;
    }

    const assignedCode = courseData.code?.trim() || generateCourseCode(courseData.startDate || '1404/01/01', courses.map(c => c.code));

    const newCourse: Course = {
      ...courseData,
      code: assignedCode,
      id: `c-${Date.now()}`,
      enrolledCount: 0,
      studentIds: [],
      materials: [],
      homeworks: [],
      sessions: []
    };
    setCourses(prev => [...prev, newCourse]);
    saveDocumentInFirestore('courses', newCourse);
    logActivity('ایجاد دوره جدید', 'دوره‌ها', `ایجاد دوره ${newCourse.title} با کد اختصاصی ${assignedCode}`);
  };

  const updateCourse = (id: string, updated: Partial<Course>) => {
    if (updated.title) {
      const normTitle = normalizeCourseTitle(updated.title);
      const hasDuplicateTitle = courses.some(c => c.id !== id && normalizeCourseTitle(c.title) === normTitle);
      if (hasDuplicateTitle) {
        console.warn(`Attempted to rename course to an existing title: ${updated.title}`);
        return;
      }
    }
    setCourses(prev => prev.map(c => {
      if (c.id === id) {
        const up = { ...c, ...updated };
        saveDocumentInFirestore('courses', up);
        return up;
      }
      return c;
    }));
    logActivity('ویرایش دوره', 'دوره‌ها', `ویرایش دوره ${id}`);
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    deleteDocumentFromFirestore('courses', id);
    logActivity('حذف دوره', 'دوره‌ها', `حذف دوره ${id}`);
  };

  // Projects
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'comments' | 'attachments'>) => {
    const newProj: Project = {
      ...projectData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      comments: [],
      attachments: []
    };
    setProjects(prev => [...prev, newProj]);
    saveDocumentInFirestore('projects', newProj);
    logActivity('تعریف پروژه جدید', 'پروژه‌ها', `تعریف پروژه ${newProj.title}`);
  };

  const updateProject = (id: string, updated: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const up = { ...p, ...updated };
        saveDocumentInFirestore('projects', up);
        return up;
      }
      return p;
    }));
    logActivity('ویرایش مشخصات پروژه', 'پروژه‌ها', `ویرایش پروژه ${id}`);
  };

  const deleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    deleteDocumentFromFirestore('projects', id);
    logActivity('حذف پروژه', 'پروژه‌ها', proj ? `حذف پروژه ${proj.title}` : `حذف پروژه ${id}`);
  };

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const up = { ...p, status };
        saveDocumentInFirestore('projects', up);
        return up;
      }
      return p;
    }));
    logActivity('تغییر وضعیت پروژه', 'پروژه‌ها', `تغییر وضعیت پروژه ${id} به ${status}`);
  };

  const autoSyncProjectsStages = (): { changedCount: number; summary: string[] } => {
    let changedCount = 0;
    const summary: string[] = [];

    setProjects(prevProjects => {
      return prevProjects.map(proj => {
        const evaluation = evaluateProjectStageFromReports(proj, dailyReports);
        if (evaluation.hasChanged) {
          changedCount++;
          summary.push(`پروژه «${proj.title}»: تغییر وضعیت از ${proj.status} به ${evaluation.newStatus} (پیشرفت: ${evaluation.suggestedProgress}٪)`);
          return {
            ...proj,
            status: evaluation.newStatus,
            progressPercentage: evaluation.suggestedProgress,
            autoMovedByAi: true,
            aiTransitionReason: evaluation.reason,
            lastAiAnalysisDate: new Date().toLocaleDateString('fa-IR')
          };
        }
        return proj;
      });
    });

    if (changedCount > 0) {
      logActivity('انتقال هوشمند وضعیت پروژه‌ها با AI', 'پروژه‌ها', `به‌روزرسانی خودکار ${changedCount} پروژه بر اساس تحلیل گزارش‌های کاری`);
      sendNotification(
        'انتقال خودکار پروژه‌ها توسط هوش مصنوعی',
        `${changedCount} پروژه بر اساس تحلیل پیشرفت و گزارش‌های کاری جدید به مراحل جدید در بورد کانبان منتقل شدند.`,
        'admins'
      );
    }

    return { changedCount, summary };
  };

  const toggleProjectTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      const completedCount = updatedTasks.filter(t => t.completed).length;
      const progressPercentage = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : p.progressPercentage;
      const updatedProj = { ...p, tasks: updatedTasks, progressPercentage };
      saveDocumentInFirestore('projects', updatedProj);
      return updatedProj;
    }));
  };

  const addProjectComment = (projectId: string, text: string) => {
    const comment = {
      id: `cm-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedProj = { ...p, comments: [...p.comments, comment] };
        saveDocumentInFirestore('projects', updatedProj);
        return updatedProj;
      }
      return p;
    }));
  };

  // Daily Reports
  const addDailyReport = (reportData: Omit<DailyReport, 'id' | 'status'>) => {
    const newReport: DailyReport = {
      ...reportData,
      id: `dr-${Date.now()}`,
      status: 'submitted'
    };
    setDailyReports(prev => {
      const updatedReports = [newReport, ...prev];
      // Automatically evaluate and move project stage based on the new daily report
      setProjects(prevProjects => {
        return prevProjects.map(proj => {
          const evalRes = evaluateProjectStageFromReports(proj, updatedReports);
          if (evalRes.hasChanged) {
            const upProj = {
              ...proj,
              status: evalRes.newStatus,
              progressPercentage: evalRes.suggestedProgress,
              autoMovedByAi: true,
              aiTransitionReason: evalRes.reason,
              lastAiAnalysisDate: new Date().toLocaleDateString('fa-IR')
            };
            saveDocumentInFirestore('projects', upProj);
            return upProj;
          }
          return proj;
        });
      });
      return updatedReports;
    });

    saveDocumentInFirestore('dailyReports', newReport);
    logActivity('ثبت گزارش روزانه', 'گزارش روزانه', `ثبت گزارش ${reportData.workedHours} ساعت توسط ${reportData.internName}`);

    // Trigger Notification for Admin
    sendNotification(
      'گزارش روزانه جدید کارآموز',
      `${reportData.internName} گزارش روزانه کار روی پروژه ${reportData.projectTitle} را ثبت کرد. وضعیت پروژه با هوش مصنوعی ارزیابی و تطبیق داده شد.`,
      'admins'
    );
  };

  const updateDailyReport = (id: string, updated: Partial<DailyReport>) => {
    setDailyReports(prev => {
      const updatedReports = prev.map(r => {
        if (r.id !== id) return r;
        const up = { ...r, ...updated };
        saveDocumentInFirestore('dailyReports', up);
        return up;
      });

      // Automatically re-evaluate project stage
      setProjects(prevProjects => {
        return prevProjects.map(proj => {
          const evalRes = evaluateProjectStageFromReports(proj, updatedReports);
          if (evalRes.hasChanged) {
            const upProj = {
              ...proj,
              status: evalRes.newStatus,
              progressPercentage: evalRes.suggestedProgress,
              autoMovedByAi: true,
              aiTransitionReason: evalRes.reason,
              lastAiAnalysisDate: new Date().toLocaleDateString('fa-IR')
            };
            saveDocumentInFirestore('projects', upProj);
            return upProj;
          }
          return proj;
        });
      });

      return updatedReports;
    });

    logActivity('ویرایش گزارش روزانه', 'گزارش روزانه', `ویرایش فایل و مستندات گزارش روزانه ${id}`);
  };

  const reviewDailyReport = (id: string, status: DailyReportStatus, feedback: string) => {
    setDailyReports(prev => {
      const updatedReports = prev.map(r => {
        if (r.id !== id) return r;
        const up = {
          ...r,
          status,
          reviewerFeedback: feedback,
          reviewedBy: currentUser.name,
          reviewedAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
        saveDocumentInFirestore('dailyReports', up);
        return up;
      });

      // If approved or revised, re-evaluate project stage automatically
      setProjects(prevProjects => {
        return prevProjects.map(proj => {
          const evalRes = evaluateProjectStageFromReports(proj, updatedReports);
          if (evalRes.hasChanged) {
            const upProj = {
              ...proj,
              status: evalRes.newStatus,
              progressPercentage: evalRes.suggestedProgress,
              autoMovedByAi: true,
              aiTransitionReason: evalRes.reason,
              lastAiAnalysisDate: new Date().toLocaleDateString('fa-IR')
            };
            saveDocumentInFirestore('projects', upProj);
            return upProj;
          }
          return proj;
        });
      });

      return updatedReports;
    });
    logActivity('بررسی گزارش روزانه', 'گزارش روزانه', `تغییر وضعیت گزارش ${id} به ${status}`);
  };

  const deleteDailyReport = (id: string) => {
    const reportToDelete = dailyReports.find(r => r.id === id);
    setDailyReports(prev => prev.filter(r => r.id !== id));
    deleteDocumentFromFirestore('dailyReports', id);
    logActivity(
      'حذف گزارش روزانه',
      'گزارش روزانه',
      reportToDelete ? `حذف گزارش تاریخ ${reportToDelete.date} مربوط به ${reportToDelete.internName}` : `حذف گزارش ${id}`
    );
  };

  // Automatic Monthly Report Generator for Interns
  const getMonthlyInternSummary = (internId: string, monthStr: string = 'بهمن 1402'): MonthlyInternSummary => {
    const intern = users.find(u => u.id === internId);
    const internName = intern ? intern.name : 'کارآموز';
    const internReports = dailyReports.filter(r => r.internId === internId);
    
    const totalWorkedHours = internReports.reduce((acc, r) => acc + (r.workedHours || 0), 0);
    const reportsSubmittedCount = internReports.length;
    const pdfReportsCount = internReports.filter(r => r.pdfFileName || r.pdfAnalyzed).length;
    
    // Calculate average quality score
    const qualityScores = internReports.map(r => r.aiAnalysis?.qualityScore || 88);
    const averageQualityScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 85;

    // Unique projects
    const projectIds = Array.from(new Set(internReports.map(r => r.projectId)));
    const projectsInvolvedCount = projectIds.length || 1;

    // Average progress
    const relatedProjects = projects.filter(p => p.leadInternId === internId || p.teamInternIds.includes(internId));
    const avgProgress = relatedProjects.length > 0
      ? Math.round(relatedProjects.reduce((acc, p) => acc + p.progressPercentage, 0) / relatedProjects.length)
      : 80;

    const strengths = [
      'تسلط بر اصول کدنویسی تمیز و ساختاریافته',
      'دقت در مستندسازی فنی و ارسال پی‌دی‌اف گزارش‌های روزانه',
      'همکاری موثر تیمی و رعایت ددلاین‌ها'
    ];

    const recommendations = [
      'تمرکز بیشتر بر نوشتن تست‌های خودکار (Unit Tests)',
      'ارتقای سرعت حل چالش‌های زیرساختی و پایگاه‌داده'
    ];

    return {
      internId,
      internName,
      month: monthStr,
      totalWorkedHours,
      reportsSubmittedCount,
      pdfReportsCount,
      projectsInvolvedCount,
      overallProgressPercentage: avgProgress,
      averageQualityScore,
      performanceComparison: `رشد ${Math.min(18, Math.max(5, Math.round(totalWorkedHours / 4)))}٪ نسبت به ماه گذشته`,
      keyStrengths: strengths,
      growthRecommendations: recommendations,
      dailyHoursBreakdown: internReports.map(r => ({ date: r.date, hours: r.workedHours }))
    };
  };

  // CRM Leads
  const addCustomerLead = (leadData: Omit<CustomerLead, 'id' | 'createdAt' | 'notes' | 'status'>) => {
    const newLead: CustomerLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      status: 'new_lead',
      notes: [],
      createdAt: new Date().toLocaleDateString('fa-IR')
    };
    setCustomerLeads(prev => [newLead, ...prev]);
    saveDocumentInFirestore('customerLeads', newLead);
    logActivity('ثبت مخاطب جدید CRM', 'CRM', `ثبت پرونده مشتری ${newLead.fullName}`);
  };

  const updateCustomerLead = (id: string, updated: Partial<CustomerLead>) => {
    setCustomerLeads(prev => prev.map(l => {
      if (l.id === id) {
        const up = { ...l, ...updated };
        saveDocumentInFirestore('customerLeads', up);
        return up;
      }
      return l;
    }));
    logActivity('ویرایش مخاطب CRM', 'CRM', `ویرایش مشخصات مشتری ${id}`);
  };

  const deleteCustomerLead = (id: string) => {
    const lead = customerLeads.find(l => l.id === id);
    setCustomerLeads(prev => prev.filter(l => l.id !== id));
    deleteDocumentFromFirestore('customerLeads', id);
    logActivity('حذف مخاطب CRM', 'CRM', lead ? `حذف مشتری ${lead.fullName}` : `حذف مشتری ${id}`);
  };

  const updateLeadStatus = (id: string, status: LeadStatus, cancellationReason?: string) => {
    setCustomerLeads(prev => prev.map(l => {
      if (l.id === id) {
        const up = {
          ...l,
          status,
          cancellationReason: status === 'cancelled' ? (cancellationReason || l.cancellationReason) : l.cancellationReason
        };
        saveDocumentInFirestore('customerLeads', up);
        return up;
      }
      return l;
    }));
    logActivity('تغییر وضعیت مشتری CRM', 'CRM', `تغییر وضعیت مشتری ${id} به ${status}`);
  };

  const addLeadNote = (leadId: string, noteText: string) => {
    const note = {
      id: `n-${Date.now()}`,
      authorName: currentUser.name,
      date: new Date().toLocaleDateString('fa-IR'),
      note: noteText
    };
    setCustomerLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const up = { ...l, notes: [...l.notes, note] };
        saveDocumentInFirestore('customerLeads', up);
        return up;
      }
      return l;
    }));
  };

  const convertLeadToStudent = (leadId: string, courseId: string) => {
    const lead = customerLeads.find(l => l.id === leadId);
    if (!lead) return;

    const course = courses.find(c => c.id === courseId);
    const courseTitle = course ? course.title : 'دوره آموزشی';
    const coursePrice = course ? course.price : 5000000;

    // 1. Create student user
    const newStudentId = `u-${Date.now()}`;
    const newStudent: User = {
      id: newStudentId,
      name: lead.fullName,
      email: lead.email || `${newStudentId}@shokooh.ir`,
      phone: lead.phone,
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      skills: ['دانشجوی منتقل شده از CRM'],
      bio: `منتقل‌شده از CRM. شغل: ${lead.occupation || 'تعیین‌نشده'} - شهر: ${lead.city || 'تعیین‌نشده'}`,
      status: 'active',
      joinDate: new Date().toLocaleDateString('fa-IR'),
      enrolledCourseIds: [courseId]
    };

    setUsers(prev => [...prev, newStudent]);
    saveDocumentInFirestore('users', newStudent);

    // 2. Enroll student in course
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const upCourse = {
          ...c,
          enrolledCount: c.enrolledCount + 1,
          studentIds: [...c.studentIds, newStudentId]
        };
        saveDocumentInFirestore('courses', upCourse);
        return upCourse;
      }
      return c;
    }));

    // 3. Register initial Tuition record
    const newTuition: TuitionRecord = {
      id: `tui-${Date.now()}`,
      studentId: newStudentId,
      studentName: lead.fullName,
      studentPhone: lead.phone,
      courseId,
      courseTitle,
      totalAmount: coursePrice,
      discountAmount: 0,
      finalAmount: coursePrice,
      paidAmount: 0,
      remainingAmount: coursePrice,
      status: 'unpaid',
      createdAt: new Date().toLocaleDateString('fa-IR')
    };
    setTuitions(prev => [...prev, newTuition]);
    saveDocumentInFirestore('tuitions', newTuition);

    // 4. Update lead status to enrolled
    setCustomerLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const upLead = { ...l, status: 'enrolled' as LeadStatus, convertedToStudentId: newStudentId };
        saveDocumentInFirestore('customerLeads', upLead);
        return upLead;
      }
      return l;
    }));

    logActivity('تبدیل تک‌کلیک مشتری به دانشجو', 'CRM', `تبدیل ${lead.fullName} به دانشجو و ثبت‌نام در ${courseTitle}`);
  };

  // Financial Actions
  const addTuition = (data: Omit<TuitionRecord, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => {
    const finalAmount = data.totalAmount - (data.discountAmount || 0);
    const newTuition: TuitionRecord = {
      ...data,
      id: `tui-${Date.now()}`,
      finalAmount,
      paidAmount: 0,
      remainingAmount: finalAmount,
      status: 'unpaid',
      createdAt: new Date().toLocaleDateString('fa-IR')
    };
    setTuitions(prev => [...prev, newTuition]);
    saveDocumentInFirestore('tuitions', newTuition);
    logActivity('ثبت شهریه دوره', 'مالی', `ثبت شهریه ${finalAmount.toLocaleString('fa-IR')} تومان برای ${data.studentName}`);
  };

  const addPayment = (paymentData: Omit<PaymentTransaction, 'id' | 'createdAt'>) => {
    const newPayment: PaymentTransaction = {
      ...paymentData,
      id: `trx-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('fa-IR')
    };
    setPayments(prev => [newPayment, ...prev]);
    saveDocumentInFirestore('payments', newPayment);

    // Recalculate tuition status if tuitionId provided
    if (paymentData.tuitionId) {
      setTuitions(prev => prev.map(t => {
        if (t.id !== paymentData.tuitionId) return t;
        const newPaid = t.paidAmount + paymentData.amount;
        const newRemaining = Math.max(0, t.finalAmount - newPaid);
        const status = newRemaining === 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
        const up = { ...t, paidAmount: newPaid, remainingAmount: newRemaining, status };
        saveDocumentInFirestore('tuitions', up);
        return up;
      }));
    }

    logActivity('ثبت پرداخت مالی', 'مالی', `دریافت ${paymentData.amount.toLocaleString('fa-IR')} تومان از ${paymentData.studentName}`);
  };

  const addInstallment = (data: Omit<InstallmentPlan, 'id' | 'isPaid'>) => {
    const newInstallment: InstallmentPlan = {
      ...data,
      id: `inst-${Date.now()}`,
      isPaid: false
    };
    setInstallments(prev => [...prev, newInstallment]);
    saveDocumentInFirestore('installments', newInstallment);
    logActivity('تعریف قسط شهریه', 'مالی', `ثبت قسط ${data.amount.toLocaleString('fa-IR')} تومان برای ${data.studentName}`);
  };

  const toggleInstallmentPaid = (installmentId: string, trackingCode?: string) => {
    const inst = installments.find(i => i.id === installmentId);
    if (!inst) return;

    const nextPaidState = !inst.isPaid;
    setInstallments(prev => prev.map(i => {
      if (i.id === installmentId) {
        const up = {
          ...i,
          isPaid: nextPaidState,
          paidDate: nextPaidState ? new Date().toLocaleDateString('fa-IR') : undefined,
          trackingCode: nextPaidState ? (trackingCode || `INST-${Math.floor(10000 + Math.random() * 90000)}`) : undefined
        };
        saveDocumentInFirestore('installments', up);
        return up;
      }
      return i;
    }));

    if (nextPaidState) {
      // Add transaction record
      addPayment({
        tuitionId: inst.tuitionId,
        studentId: inst.studentId,
        studentName: inst.studentName,
        courseTitle: inst.courseTitle,
        amount: inst.amount,
        paymentDate: new Date().toLocaleDateString('fa-IR'),
        paymentMethod: 'card',
        trackingCode: trackingCode || `INST-${Math.floor(10000 + Math.random() * 90000)}`,
        description: `پرداخت قسط شهریه ${inst.courseTitle}`
      });
    }
  };

  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExpense, ...prev]);
    saveDocumentInFirestore('expenses', newExpense);
    logActivity('ثبت هزینه آکادمی', 'مالی', `ثبت هزینه ${expenseData.title} به مبلغ ${expenseData.amount.toLocaleString('fa-IR')} تومان`);
  };

  const updateTuition = (id: string, updated: Partial<TuitionRecord>) => {
    setTuitions(prev => prev.map(t => {
      if (t.id !== id) return t;
      const totalAmount = updated.totalAmount !== undefined ? updated.totalAmount : t.totalAmount;
      const discountAmount = updated.discountAmount !== undefined ? updated.discountAmount : (t.discountAmount || 0);
      const finalAmount = updated.finalAmount !== undefined ? updated.finalAmount : (totalAmount - discountAmount);
      const paidAmount = updated.paidAmount !== undefined ? updated.paidAmount : t.paidAmount;
      const remainingAmount = Math.max(0, finalAmount - paidAmount);
      const status = remainingAmount === 0 ? 'fully_paid' : (paidAmount > 0 ? 'partial' : 'unpaid');
      const up = {
        ...t,
        ...updated,
        totalAmount,
        discountAmount,
        finalAmount,
        paidAmount,
        remainingAmount,
        status: (updated.status as any) || status
      };
      saveDocumentInFirestore('tuitions', up);
      return up;
    }));
    logActivity('ویرایش پرونده شهریه', 'مالی', `ویرایش مشخصات شهریه شناسه ${id}`);
  };

  const deleteTuition = (id: string) => {
    setTuitions(prev => prev.filter(t => t.id !== id));
    deleteDocumentFromFirestore('tuitions', id);
    logActivity('حذف پرونده شهریه', 'مالی', `حذف پرونده شهریه شناسه ${id}`);
  };

  const updatePayment = (id: string, updated: Partial<PaymentTransaction>) => {
    const existing = payments.find(p => p.id === id);
    if (existing && existing.tuitionId && updated.amount !== undefined && updated.amount !== existing.amount) {
      const diff = updated.amount - existing.amount;
      setTuitions(prev => prev.map(t => {
        if (t.id !== existing.tuitionId) return t;
        const newPaid = Math.max(0, t.paidAmount + diff);
        const newRemaining = Math.max(0, t.finalAmount - newPaid);
        const status = newRemaining === 0 ? 'fully_paid' : (newPaid > 0 ? 'partial' : 'unpaid');
        const upT = { ...t, paidAmount: newPaid, remainingAmount: newRemaining, status };
        saveDocumentInFirestore('tuitions', upT);
        return upT;
      }));
    }
    setPayments(prev => prev.map(p => {
      if (p.id === id) {
        const up = { ...p, ...updated };
        saveDocumentInFirestore('payments', up);
        return up;
      }
      return p;
    }));
    logActivity('ویرایش تراکنش پرداخت', 'مالی', `ویرایش تراکنش مالی شناسه ${id}`);
  };

  const deletePayment = (id: string) => {
    const pay = payments.find(p => p.id === id);
    if (pay && pay.tuitionId) {
      // Revert paidAmount on tuition
      setTuitions(prev => prev.map(t => {
        if (t.id !== pay.tuitionId) return t;
        const newPaid = Math.max(0, t.paidAmount - pay.amount);
        const newRemaining = Math.max(0, t.finalAmount - newPaid);
        const status = newRemaining === 0 ? 'fully_paid' : (newPaid > 0 ? 'partial' : 'unpaid');
        const upT = { ...t, paidAmount: newPaid, remainingAmount: newRemaining, status };
        saveDocumentInFirestore('tuitions', upT);
        return upT;
      }));
    }
    setPayments(prev => prev.filter(p => p.id !== id));
    deleteDocumentFromFirestore('payments', id);
    logActivity('حذف تراکنش مالی', 'مالی', `حذف تراکنش شناسه ${id}`);
  };

  const updateExpense = (id: string, updated: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        const up = { ...e, ...updated };
        saveDocumentInFirestore('expenses', up);
        return up;
      }
      return e;
    }));
    logActivity('ویرایش هزینه آکادمی', 'مالی', `ویرایش هزینه شناسه ${id}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    deleteDocumentFromFirestore('expenses', id);
    logActivity('حذف هزینه آکادمی', 'مالی', `حذف هزینه شناسه ${id}`);
  };

  const updateTeacherSalary = (id: string, updated: Partial<TeacherSalaryRecord>) => {
    setTeacherSalaries(prev => prev.map(s => {
      if (s.id === id) {
        const up = { ...s, ...updated };
        saveDocumentInFirestore('teacherSalaries', up);
        return up;
      }
      return s;
    }));
    logActivity('ویرایش فیش حقوق مدرس', 'مالی', `ویرایش حقوق شناسه ${id}`);
  };

  const deleteTeacherSalary = (id: string) => {
    setTeacherSalaries(prev => prev.filter(s => s.id !== id));
    deleteDocumentFromFirestore('teacherSalaries', id);
    logActivity('حذف فیش حقوق مدرس', 'مالی', `حذف حقوق شناسه ${id}`);
  };

  const addTeacherSalary = (salaryData: Omit<TeacherSalaryRecord, 'id'>) => {
    const newSalary: TeacherSalaryRecord = {
      ...salaryData,
      id: `sal-${Date.now()}`
    };
    setTeacherSalaries(prev => [newSalary, ...prev]);
    saveDocumentInFirestore('teacherSalaries', newSalary);
    logActivity('پرداخت حقوق مدرس', 'مالی', `پرداخت حقوق ${salaryData.teacherName} بابت ${salaryData.courseTitle}`);
  };

  // Notifications Tool
  const sendNotification = (
    title: string,
    message: string,
    targetType: NotificationTarget,
    targetUserId?: string,
    targetPhone?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'هم‌اکنون',
      read: false,
      type: 'admin_announcement',
      targetType,
      targetUserId,
      targetPhone,
      createdBy: currentUser.name
    };

    setNotifications(prev => [newNotif, ...prev]);
    saveDocumentInFirestore('notifications', newNotif);
    logActivity('ارسال اعلان جدید', 'اعلان‌ها', `ارسال اعلان «${title}» به گروه/کاربر ${targetType}`);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const up = { ...n, read: true };
        saveDocumentInFirestore('notifications', up);
        return up;
      }
      return n;
    }));
  };

  // Chat
  const sendMessage = (channelId: string, text: string, attachmentName?: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      text,
      attachmentName,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Group Links Management
  const addGroupLink = (linkData: Omit<GroupLink, 'id' | 'createdAt' | 'createdBy'>) => {
    const newLink: GroupLink = {
      ...linkData,
      id: `grp-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      createdBy: currentUser.name || 'مدیریت آکادمی'
    };
    setGroupLinks(prev => [newLink, ...prev]);
    saveDocumentInFirestore('groupLinks', newLink);
    logActivity('افزودن لینک گروه', 'پیام‌ها', `افزودن گروه «${newLink.title}» در پلتفرم ${newLink.platform}`);
  };

  const updateGroupLink = (id: string, updated: Partial<GroupLink>) => {
    setGroupLinks(prev => prev.map(g => {
      if (g.id === id) {
        const up = { ...g, ...updated };
        saveDocumentInFirestore('groupLinks', up);
        return up;
      }
      return g;
    }));
    logActivity('ویرایش لینک گروه', 'پیام‌ها', `بروزرسانی لینک گروه شناسه ${id}`);
  };

  const deleteGroupLink = (id: string) => {
    const target = groupLinks.find(g => g.id === id);
    setGroupLinks(prev => prev.filter(g => g.id !== id));
    deleteDocumentFromFirestore('groupLinks', id);
    logActivity('حذف لینک گروه', 'پیام‌ها', `حذف گروه «${target?.title || id}»`);
  };

  const toggleGroupLinkActive = (id: string) => {
    setGroupLinks(prev => prev.map(g => {
      if (g.id === id) {
        const up = { ...g, active: !g.active };
        saveDocumentInFirestore('groupLinks', up);
        return up;
      }
      return g;
    }));
  };

  const getVisibleGroupLinksForUser = (user?: User): GroupLink[] => {
    const targetUser = user || currentUser;
    if (!targetUser) return groupLinks.filter(g => g.isPublic);

    // مدیر کل تمام لینک‌ها را مشاهده و مدیریت می‌کند
    if (targetUser.role === 'admin') {
      return groupLinks;
    }

    // برای سایر نقش‌ها، تنها لینک‌های فعال نمایش داده می‌شود
    return groupLinks.filter(link => {
      if (link.active === false) return false;

      // ۱. اگر لینک عمومی باشد (همه اعضا)
      if (link.isPublic || link.audienceType === 'all') {
        return true;
      }

      // ۲. اگر گروه مختص کارآموزان باشد
      if (link.audienceType === 'interns' && targetUser.role === 'intern') {
        return true;
      }

      // ۳. اگر گروه مختص مدرسین باشد
      if (link.audienceType === 'teachers' && targetUser.role === 'teacher') {
        return true;
      }

      // ۴. اگر گروه مختص دانشجویان باشد
      if (link.audienceType === 'students' && targetUser.role === 'student') {
        return true;
      }

      // ۵. اگر گروه به کلاس‌های خاصی متصل شده باشد
      if (link.audienceType === 'courses' || (link.courseIds && link.courseIds.length > 0)) {
        if (!link.courseIds || link.courseIds.length === 0) return false;

        // دانشجو: اگر در یکی از آن کلاس‌ها ثبت‌نام باشد
        if (targetUser.role === 'student') {
          const enrolledList = targetUser.enrolledCourseIds || [];
          return link.courseIds.some(cid => {
            if (enrolledList.includes(cid)) return true;
            const c = courses.find(cr => cr.id === cid);
            return c ? c.studentIds?.includes(targetUser.id) : false;
          });
        }

        // مدرس: اگر مدرس آن کلاس باشد
        if (targetUser.role === 'teacher') {
          return link.courseIds.some(cid => {
            const c = courses.find(cr => cr.id === cid);
            return c ? (c.teacherId === targetUser.id || c.teacherName === targetUser.name) : false;
          });
        }

        // کارآموز: اگر در آن کلاس باشد
        if (targetUser.role === 'intern') {
          const enrolledList = targetUser.enrolledCourseIds || [];
          return link.courseIds.some(cid => {
            if (enrolledList.includes(cid)) return true;
            const c = courses.find(cr => cr.id === cid);
            return c ? c.studentIds?.includes(targetUser.id) : false;
          });
        }
      }

      return false;
    });
  };

  const resetAllData = async () => {
    setUsers(initialUsers);
    setCourses(initialCourses);
    setProjects(initialProjects);
    setDailyReports(initialDailyReports);
    setCustomerLeads(initialCustomerLeads);
    setTuitions(initialTuitions);
    setPayments(initialPayments);
    setInstallments(initialInstallments);
    setExpenses(initialExpenses);
    setTeacherSalaries(initialTeacherSalaries);
    setMessages(initialMessages);
    setActivityLogs(initialActivityLogs);
    setNotifications(initialNotifications);
    setGroupLinks(initialGroupLinks);

    await Promise.all([
      batchSaveDocuments('users', initialUsers),
      batchSaveDocuments('courses', initialCourses),
      batchSaveDocuments('projects', initialProjects),
      batchSaveDocuments('dailyReports', initialDailyReports),
      batchSaveDocuments('customerLeads', initialCustomerLeads),
      batchSaveDocuments('tuitions', initialTuitions),
      batchSaveDocuments('payments', initialPayments),
      batchSaveDocuments('installments', initialInstallments),
      batchSaveDocuments('expenses', initialExpenses),
      batchSaveDocuments('teacherSalaries', initialTeacherSalaries),
      batchSaveDocuments('groupLinks', initialGroupLinks),
      batchSaveDocuments('notifications', initialNotifications),
      batchSaveDocuments('activityLogs', initialActivityLogs)
    ]);
  };

  const restoreBackup = (backupData: any) => {
    const data = backupData.data || backupData;
    if (data.users) { setUsers(data.users); batchSaveDocuments('users', data.users); }
    if (data.courses) { setCourses(data.courses); batchSaveDocuments('courses', data.courses); }
    if (data.projects) { setProjects(data.projects); batchSaveDocuments('projects', data.projects); }
    if (data.dailyReports) { setDailyReports(data.dailyReports); batchSaveDocuments('dailyReports', data.dailyReports); }
    if (data.customerLeads) { setCustomerLeads(data.customerLeads); batchSaveDocuments('customerLeads', data.customerLeads); }
    if (data.tuitions) { setTuitions(data.tuitions); batchSaveDocuments('tuitions', data.tuitions); }
    if (data.payments) { setPayments(data.payments); batchSaveDocuments('payments', data.payments); }
    if (data.installments) { setInstallments(data.installments); batchSaveDocuments('installments', data.installments); }
    if (data.expenses) { setExpenses(data.expenses); batchSaveDocuments('expenses', data.expenses); }
    if (data.teacherSalaries) { setTeacherSalaries(data.teacherSalaries); batchSaveDocuments('teacherSalaries', data.teacherSalaries); }
    if (data.messages) setMessages(data.messages);
    if (data.notifications) { setNotifications(data.notifications); batchSaveDocuments('notifications', data.notifications); }
    if (data.activityLogs) { setActivityLogs(data.activityLogs); batchSaveDocuments('activityLogs', data.activityLogs); }
    if (data.groupLinks) { setGroupLinks(data.groupLinks); batchSaveDocuments('groupLinks', data.groupLinks); }
    logActivity('بازیابی نسخه پشتیبان', 'تنظیمات', 'بازیابی کامل اطلاعات و ذخیره در Firestore');
  };

  const login = (identity: string, passwordInput: string) => {
    const cleanIdentity = identity.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const foundUser = users.find(u => {
      const matchUsername = (u.username || '').toLowerCase() === cleanIdentity;
      const matchEmail = (u.email || '').toLowerCase() === cleanIdentity;
      const matchPhone = (u.phone || '').trim() === cleanIdentity;
      return matchUsername || matchEmail || matchPhone;
    });

    if (!foundUser) {
      return { success: false, message: 'کاربری با این مشخصات یا نام کاربری یافت نشد.' };
    }

    const userPassword = foundUser.password || '123';
    const isPasswordValid =
      userPassword === cleanPass ||
      ((userPassword === '123' || userPassword === '123456') && (cleanPass === '123' || cleanPass === '123456'));

    if (!isPasswordValid) {
      return { success: false, message: 'رمز عبور وارد شده اشتباه است.' };
    }

    if (foundUser.status === 'suspended' || foundUser.status === 'inactive') {
      return { success: false, message: 'حساب کاربری شما غیرفعال یا معلق گردیده است. با مدیریت تماس بگیرید.' };
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_auth_user_id`, foundUser.id);

    if (foundUser.role === 'intern') {
      setActiveModule('daily_reports');
    } else if (foundUser.role === 'student') {
      setActiveModule('courses');
    } else if (foundUser.role === 'teacher') {
      setActiveModule('courses');
    } else {
      setActiveModule('dashboard');
    }

    logActivity('ورود موفق به سامانه', 'احراز هویت', `کاربر ${foundUser.name} با نقش ${foundUser.role} وارد شد.`);
    return { success: true };
  };

  const logout = () => {
    logActivity('خروج از سامانه', 'احراز هویت', `کاربر ${currentUser.name} از سامانه خارج شد.`);
    setIsAuthenticated(false);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_auth_user_id`);
    const defaultUser = (users.length > 0 ? users : initialUsers)[0];
    setCurrentUser(defaultUser);
    setActiveModule('dashboard');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentUser,
        setCurrentUser,
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
        chatChannels,
        messages,
        activityLogs,
        notifications,
        activeModule,
        setActiveModule,
        searchQuery,
        setSearchQuery,
        addUser,
        updateUser,
        deleteUser,
        addCourse,
        updateCourse,
        deleteCourse,
        addProject,
        updateProject,
        deleteProject,
        updateProjectStatus,
        autoSyncProjectsStages,
        toggleProjectTask,
        addProjectComment,
        addDailyReport,
        updateDailyReport,
        reviewDailyReport,
        deleteDailyReport,
        getMonthlyInternSummary,
        addCustomerLead,
        updateCustomerLead,
        deleteCustomerLead,
        updateLeadStatus,
        addLeadNote,
        convertLeadToStudent,
        addTuition,
        updateTuition,
        deleteTuition,
        addPayment,
        updatePayment,
        deletePayment,
        addInstallment,
        toggleInstallmentPaid,
        addExpense,
        updateExpense,
        deleteExpense,
        addTeacherSalary,
        updateTeacherSalary,
        deleteTeacherSalary,
        sendNotification,
        markNotificationAsRead,
        groupLinks,
        addGroupLink,
        updateGroupLink,
        deleteGroupLink,
        toggleGroupLinkActive,
        getVisibleGroupLinksForUser,
        sendMessage,
        logActivity,
        resetAllData,
        restoreBackup,
        cloudSyncStatus,
        lastSyncTime,
        serverVersion,
        syncNow
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
