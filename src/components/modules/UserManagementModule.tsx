import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, CustomerLead, LeadStatus } from '../../types';
import { EditableSelect } from '../common/EditableSelect';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  PlusCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowLeftRight,
  PieChart as PieIcon,
  CheckCircle2,
  XCircle,
  Shield,
  GraduationCap,
  Briefcase,
  Paperclip,
  Trash2,
  Edit,
  UserCheck,
  Share2,
  Sparkles,
  Eye,
  Download,
  ExternalLink,
  X,
  FileCheck
} from 'lucide-react';

export const UserManagementModule: React.FC = () => {
  const {
    currentUser,
    users,
    customerLeads,
    courses,
    projects,
    addUser,
    updateUser,
    deleteUser,
    addCustomerLead,
    updateCustomerLead,
    deleteCustomerLead,
    updateLeadStatus,
    addLeadNote,
    convertLeadToStudent
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'crm'>('users');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userDuplicateError, setUserDuplicateError] = useState<string | null>(null);
  const [uName, setUName] = useState('');
  const [uUsername, setUUsername] = useState('');
  const [uPassword, setUPassword] = useState('123456');
  const [uEmail, setUEmail] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uRole, setURole] = useState<string>('student');
  const [uSkills, setUSkills] = useState('');
  const [uBio, setUBio] = useState('');
  const [uAge, setUAge] = useState<number | undefined>(undefined);
  const [uIsUnder18, setUIsUnder18] = useState<boolean>(false);
  const [uParentsName, setUParentsName] = useState('');
  const [uParentsPhone, setUParentsPhone] = useState('');
  const [uParentsAddress, setUParentsAddress] = useState('');
  const [uEmergencyPhone, setUEmergencyPhone] = useState('');
  const [uResumeName, setUResumeName] = useState('');
  const [uResumeUrl, setUResumeUrl] = useState<string | undefined>(undefined);
  const [uResumeSize, setUResumeSize] = useState<string | undefined>(undefined);
  const [uEnrolledCourseIds, setUEnrolledCourseIds] = useState<string[]>([]);
  const [uReferralSource, setUReferralSource] = useState<string>('معرفی دوستان');
  const [uPersonalityNotes, setUPersonalityNotes] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // CRM Form State
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadDuplicateError, setLeadDuplicateError] = useState<string | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCity, setLeadCity] = useState('مشهد');
  const [leadOccupation, setLeadOccupation] = useState('');
  const [leadCourseCat, setLeadCourseCat] = useState('پایتون');
  const [leadSource, setLeadSource] = useState<string>('معرفی دوستان');
  const [crmSourceFilter, setCrmSourceFilter] = useState<string>('all');
  const [crmAnalyticsScope, setCrmAnalyticsScope] = useState<'crm_only' | 'all'>('crm_only');

  // Convert Lead Modal state
  const [selectedLead, setSelectedLead] = useState<CustomerLead | null>(null);
  const [targetCourseId, setTargetCourseId] = useState('');

  // Cancellation Reason state
  const [cancellingLeadId, setCancellingLeadId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('بالا بودن شهریه');

  // Resume Viewer State
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [viewingResume, setViewingResume] = useState<{
    userName: string;
    fileName: string;
    fileUrl: string;
    fileSize?: string;
    isText?: boolean;
    textContent?: string;
  } | null>(null);

  // Handle resume file upload - strictly PDF (.pdf) or Text (.txt)
  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeError(null);
    const fileNameLower = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isTxt = file.type === 'text/plain' || fileNameLower.endsWith('.txt');

    if (!isPdf && !isTxt) {
      setResumeError('فرمت نامعتبر است! رزومه فقط با پسوند PDF (.pdf) یا فایل متنی (.txt) قابل قبول است.');
      return;
    }

    setIsUploadingResume(true);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = Number(sizeInMb) < 0.1 ? `${Math.round(file.size / 1024)} KB` : `${sizeInMb} MB`;

    if (isTxt) {
      const textReader = new FileReader();
      textReader.onload = () => {
        const text = (textReader.result as string) || '';
        // Also create data URL for download/preview
        const dataUrlReader = new FileReader();
        dataUrlReader.onload = () => {
          setUResumeUrl(dataUrlReader.result as string);
          setUResumeName(file.name);
          setUResumeSize(formattedSize);
          setIsUploadingResume(false);
        };
        dataUrlReader.readAsDataURL(file);
      };
      textReader.onerror = () => {
        setIsUploadingResume(false);
      };
      textReader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setUResumeUrl(reader.result as string);
        setUResumeName(file.name);
        setUResumeSize(formattedSize);
        setIsUploadingResume(false);
      };
      reader.onerror = () => {
        setUResumeName(file.name);
        setUResumeSize(formattedSize);
        setUResumeUrl(URL.createObjectURL(file));
        setIsUploadingResume(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Resume Viewer
  const handleOpenResumeViewer = (user: User) => {
    if (!user.resumeUrl && !user.resumeName) return;

    const fileName = user.resumeName || 'resume.pdf';
    const isText = fileName.toLowerCase().endsWith('.txt');

    let textContent = '';
    if (isText && user.resumeUrl && user.resumeUrl.startsWith('data:text/plain;base64,')) {
      try {
        const base64Data = user.resumeUrl.split(',')[1];
        textContent = decodeURIComponent(escape(atob(base64Data)));
      } catch (e) {
        textContent = 'متن رزومه بارگذاری شده';
      }
    }

    setViewingResume({
      userName: user.name,
      fileName,
      fileUrl: user.resumeUrl || '',
      fileSize: user.resumeSize,
      isText,
      textContent
    });
  };

  // Comprehensive Helper to normalize referral channel names
  const normalizeSource = (src?: string): string => {
    if (!src || typeof src !== 'string' || !src.trim()) return 'نامشخص';
    const s = src.trim().replace(/[\u200c\s]+/g, ' ').toLowerCase();
    
    if (s.includes('اینستا') || s.includes('insta')) return 'اینستاگرام';
    if (s.includes('بله') || s.includes('ble') || s.includes('bale')) return 'پیام‌رسان بله';
    if (s.includes('ایتا') || s.includes('eitaa')) return 'پیام‌رسان ایتا';
    if (s.includes('تلگرام') || s.includes('tg') || s.includes('telegram')) return 'تلگرام';
    if (s.includes('دوست') || s.includes('آشنا') || s.includes('معرف') || s.includes('همکار')) return 'معرفی دوستان';
    if (s.includes('سایت') || s.includes('وب') || s.includes('site') || s.includes('web') || s.includes('گوگل') || s.includes('google')) return 'وب‌سایت و گوگل';
    if (s.includes('دیوار') || s.includes('divar') || s.includes('شیپور') || s.includes('sheypoor')) return 'دیوار و شیپور';
    if (s.includes('پیامک') || s.includes('sms') || s.includes('اس ام اس')) return 'پیامک تبلیغاتی';
    if (s.includes('حضور') || s.includes('مراجعه') || s.includes('تلفن') || s.includes('تماس')) return 'مراجعه حضوری و تماس';
    if (s.includes('تبلیغ') || s.includes('بنر') || s.includes('تراکت') || s.includes('بیلبورد')) return 'تبلیغات و بنر';
    
    // Return custom entered channel preserved as clean label
    return src.trim();
  };

  const normalizeTeacherName = (name?: string) => {
    if (!name) return '';
    return name
      .replace(/^(استاد|مهندس|خانم|آقای|دکتر|سرکار خانم|جناب آقای)\s+/gi, '')
      .trim()
      .toLowerCase();
  };

  // Filter users by role permissions: Teacher only sees students/interns of their own courses
  const teacherCourses = courses.filter(
    c => (c.teacherId && (c.teacherId === currentUser.id || c.teacherId === currentUser.username)) ||
         (normalizeTeacherName(c.teacherName) && normalizeTeacherName(c.teacherName) === normalizeTeacherName(currentUser.name))
  );
  const teacherCourseIds = new Set(teacherCourses.map(c => c.id));
  const teacherStudentIds = new Set<string>();
  teacherCourses.forEach(c => (c.studentIds || []).forEach(id => teacherStudentIds.add(id)));

  const isUserVisibleForCurrentRole = (u: User) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'teacher') {
      if (u.id === currentUser.id) return true;
      if (teacherStudentIds.has(u.id)) return true;
      if (u.enrolledCourseIds && u.enrolledCourseIds.some(cid => teacherCourseIds.has(cid))) return true;
      return false;
    }
    return true;
  };

  const visibleUsers = users
    .filter(isUserVisibleForCurrentRole)
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => u.name.includes(searchTerm) || u.phone.includes(searchTerm));

  // Dynamic Multi-Channel Referral Analytics
  const { sourceList, totalSourceEntries } = (() => {
    const channelMeta: Record<string, { icon: string; color: string }> = {
      'اینستاگرام': { icon: '📸', color: 'bg-pink-500' },
      'پیام‌رسان بله': { icon: '🟢', color: 'bg-emerald-600' },
      'پیام‌رسان ایتا': { icon: '🟠', color: 'bg-amber-600' },
      'معرفی دوستان': { icon: '🤝', color: 'bg-emerald-500' },
      'تلگرام': { icon: '✈️', color: 'bg-sky-500' },
      'وب‌سایت و گوگل': { icon: '🌐', color: 'bg-blue-500' },
      'دیوار و شیپور': { icon: '📱', color: 'bg-rose-500' },
      'پیامک تبلیغاتی': { icon: '💬', color: 'bg-purple-500' },
      'مراجعه حضوری و تماس': { icon: '🏢', color: 'bg-cyan-500' },
      'تبلیغات و بنر': { icon: '📢', color: 'bg-amber-500' },
      'سایر': { icon: '✨', color: 'bg-slate-500' },
      'نامشخص': { icon: '❓', color: 'bg-slate-400' }
    };

    const countMap: Record<string, number> = {};
    const recordsToAnalyze: Array<{ source?: string }> = [];

    // 1. Analyze customerLeads
    customerLeads.forEach(l => {
      const src = l.referralSource || (l as any).source || (l as any).channel;
      recordsToAnalyze.push({ source: src });
    });

    // 2. Optionally include system users if scope is 'all'
    if (crmAnalyticsScope === 'all') {
      users.forEach(u => {
        if (u.referralSource) {
          recordsToAnalyze.push({ source: u.referralSource });
        }
      });
    }

    const total = recordsToAnalyze.length;

    recordsToAnalyze.forEach(r => {
      const key = normalizeSource(r.source);
      countMap[key] = (countMap[key] || 0) + 1;
    });

    // Default primary channels to present consistently
    const defaultChannels = [
      'معرفی دوستان',
      'اینستاگرام',
      'پیام‌رسان بله',
      'پیام‌رسان ایتا',
      'وب‌سایت و گوگل',
      'دیوار و شیپور',
      'پیامک تبلیغاتی',
      'مراجعه حضوری و تماس'
    ];

    // Merge default channels with ANY custom channel names found in live data
    const allChannelNames = Array.from(new Set([...defaultChannels, ...Object.keys(countMap)]));

    const list = allChannelNames
      .map(name => {
        const count = countMap[name] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const meta = channelMeta[name] || { icon: '🎯', color: 'bg-indigo-500' };
        return {
          name,
          count,
          percentage,
          icon: meta.icon,
          color: meta.color
        };
      })
      .sort((a, b) => {
        // Channels with recorded leads come first (descending by count)
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name, 'fa');
      });

    return { sourceList: list, totalSourceEntries: total };
  })();

  const handleOpenUserModal = (user?: User) => {
    setUserDuplicateError(null);
    if (user) {
      setEditingUserId(user.id);
      setUName(user.name);
      setUUsername(user.username || '');
      setUPassword(user.password || '123456');
      setUEmail(user.email);
      setUPhone(user.phone);
      setURole(user.role);
      setUSkills(user.skills.join(', '));
      setUBio(user.bio || '');
      setUAge(user.age);
      setUIsUnder18((user.age !== undefined && user.age < 18) || !!user.parentsName);
      setUParentsName(user.parentsName || '');
      setUParentsPhone(user.parentsPhone || '');
      setUParentsAddress(user.parentsAddress || '');
      setUEmergencyPhone(user.emergencyPhone || '');
      setUResumeName(user.resumeName || '');
      setUResumeUrl(user.resumeUrl);
      setUResumeSize(user.resumeSize);
      setUEnrolledCourseIds(user.enrolledCourseIds || []);
      setUReferralSource(user.referralSource || 'معرفی دوستان');
      setUPersonalityNotes(user.personalityNotes || '');
    } else {
      setEditingUserId(null);
      setUName('');
      setUUsername('');
      setUPassword('123456');
      setUEmail('');
      setUPhone('');
      setURole('student');
      setUSkills('');
      setUBio('');
      setUAge(undefined);
      setUIsUnder18(false);
      setUParentsName('');
      setUParentsPhone('');
      setUParentsAddress('');
      setUEmergencyPhone('');
      setUResumeName('');
      setUResumeUrl(undefined);
      setUResumeSize(undefined);
      setUEnrolledCourseIds([]);
      setUReferralSource('معرفی دوستان');
      setUPersonalityNotes('');
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName.trim() || !uPhone.trim()) return;

    // Duplicate check: phone number must be unique
    const dupPhone = users.find(u => u.id !== editingUserId && u.phone.trim() === uPhone.trim());
    if (dupPhone) {
      setUserDuplicateError(`کاربری با شماره تماس «${uPhone}» قبلاً در سیستم ثبت شده است (${dupPhone.name}). لطفاً از شماره تماس غیرتکراری استفاده کنید.`);
      return;
    }

    // Duplicate check: username if provided must be unique
    if (uUsername.trim()) {
      const dupUsername = users.find(u => u.id !== editingUserId && u.username && u.username.toLowerCase() === uUsername.trim().toLowerCase());
      if (dupUsername) {
        setUserDuplicateError(`نام کاربری «${uUsername}» قبلاً برای (${dupUsername.name}) ثبت شده است. نام کاربری دیگری انتخاب کنید.`);
        return;
      }
    }

    const isUnder18Calculated = (uAge !== undefined && uAge < 18) || uIsUnder18;

    const userData = {
      name: uName.trim(),
      username: uUsername.trim() || undefined,
      password: uPassword || '123456',
      email: uEmail.trim() || `${Date.now()}@shokooh.ir`,
      phone: uPhone.trim(),
      role: uRole as UserRole,
      avatar: uRole === 'teacher' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      skills: uSkills ? uSkills.split(',').map(s => s.trim()) : [],
      bio: uBio,
      personalityNotes: uPersonalityNotes || undefined,
      status: 'active' as const,
      age: uAge,
      isUnder18: isUnder18Calculated,
      parentsName: isUnder18Calculated ? uParentsName : undefined,
      parentsPhone: isUnder18Calculated ? uParentsPhone : undefined,
      parentsAddress: isUnder18Calculated ? uParentsAddress : undefined,
      emergencyPhone: isUnder18Calculated ? uEmergencyPhone : undefined,
      referralSource: uReferralSource,
      resumeName: uResumeName || undefined,
      resumeUrl: uResumeUrl || undefined,
      resumeSize: uResumeSize || undefined,
      resumeDate: uResumeName ? new Date().toLocaleDateString('fa-IR') : undefined,
      enrolledCourseIds: uEnrolledCourseIds
    };

    if (editingUserId) {
      updateUser(editingUserId, userData);
    } else {
      addUser(userData);
    }
    setIsUserModalOpen(false);
  };

  const handleOpenLeadModal = (lead?: CustomerLead) => {
    setLeadDuplicateError(null);
    if (lead) {
      setEditingLeadId(lead.id);
      setLeadName(lead.fullName);
      setLeadPhone(lead.phone);
      setLeadEmail(lead.email || '');
      setLeadCity(lead.city || 'مشهد');
      setLeadOccupation(lead.occupation || '');
      setLeadCourseCat(lead.interestedCourseCategory || 'پایتون');
      setLeadSource(lead.referralSource || 'معرفی دوستان');
    } else {
      setEditingLeadId(null);
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadCity('مشهد');
      setLeadOccupation('');
      setLeadCourseCat('پایتون');
      setLeadSource('معرفی دوستان');
    }
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;

    // Check duplicate lead by phone
    const dupLead = customerLeads.find(l => l.id !== editingLeadId && l.phone.trim() === leadPhone.trim());
    if (dupLead) {
      setLeadDuplicateError(`پرونده لیدی با شماره تماس «${leadPhone}» قبلاً ثبت شده است (${dupLead.fullName}).`);
      return;
    }

    if (editingLeadId) {
      updateCustomerLead(editingLeadId, {
        fullName: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || undefined,
        city: leadCity.trim() || undefined,
        occupation: leadOccupation.trim() || undefined,
        interestedCourseCategory: leadCourseCat,
        referralSource: leadSource
      });
    } else {
      addCustomerLead({
        fullName: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || undefined,
        city: leadCity.trim() || undefined,
        occupation: leadOccupation.trim() || undefined,
        interestedCourseCategory: leadCourseCat,
        referralSource: leadSource,
        assignedConsultant: 'مدیر کل'
      });
    }

    setIsLeadModalOpen(false);
    setEditingLeadId(null);
    setLeadName('');
    setLeadPhone('');
  };

  const handleConfirmConvert = () => {
    if (!selectedLead || !targetCourseId) return;
    convertLeadToStudent(selectedLead.id, targetCourseId);
    setIsConvertModalOpen(false);
    setSelectedLead(null);
  };

  const handleConfirmCancellation = (leadId: string) => {
    updateLeadStatus(leadId, 'cancelled', cancelReasonText);
    setCancellingLeadId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            مدیریت جامع کاربران، کارآموزان و CRM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اطلاعات اساتید، کارآموزان (به همراه رزومه)، دانشجویان (به همراه مشخصات ولی) و لیدهای جذب مشتری
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            کاربران سیستم ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'crm'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            مدیریت مشتریان CRM ({customerLeads.length})
          </button>
        </div>
      </div>

      {/* Tab 1: System Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="جستجوی نام یا تلفن کاربر..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-800 dark:text-white"
              >
                <option value="all">همه نقش‌ها</option>
                <option value="admin">مدیران</option>
                <option value="teacher">مدرسان</option>
                <option value="intern">کارآموزان</option>
                <option value="student">دانشجویان</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenUserModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              افزودن کاربر جدید
            </button>
          </div>

          {currentUser.role === 'teacher' && (
            <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
              <span>
                👨‍🏫 <strong>پنل اختصاصی مدرس ({currentUser.name}):</strong> نمایش کامل مشخصات و یادداشت‌های رفتاری/فردی دانشجویان و کارآموزان ثبت‌نام‌شده در دوره‌های شما
              </span>
              <span className="font-mono font-bold bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-lg">
                {visibleUsers.length} کاربر
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleUsers.map(user => (
                <div
                  key={user.id}
                  className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 relative hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${
                        user.role === 'admin' ? 'bg-gradient-to-tr from-purple-700 to-indigo-600' :
                        user.role === 'teacher' ? 'bg-gradient-to-tr from-blue-700 to-cyan-600' :
                        user.role === 'intern' ? 'bg-gradient-to-tr from-indigo-700 to-purple-600' :
                        'bg-gradient-to-tr from-emerald-600 to-teal-500'
                      }`}>
                        {user.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {user.name}
                          {((user.age !== undefined && user.age < 18) || user.isUnder18 || user.parentsName) && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold border border-amber-300/60">
                              زیر ۱۸ سال {user.age ? `(${user.age})` : ''}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user.phone}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                      user.role === 'intern' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {user.role === 'admin' && '👑 مدیر'}
                      {user.role === 'teacher' && '👨‍🏫 مدرس'}
                      {user.role === 'intern' && '💻 کارآموز'}
                      {user.role === 'student' && '🎓 دانشجو'}
                    </span>
                  </div>

                  {/* Under 18 Details for Any Role */}
                  {(user.parentsName || user.parentsPhone || ((user.age !== undefined && user.age < 18) || user.isUnder18)) && (
                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-[11px] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>اطلاعات پدر / ولی قانونی (کاربر زیر ۱۸ سال):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-amber-800 dark:text-amber-300 font-medium">
                        <p>نام پدر: <strong className="font-bold">{user.parentsName || 'ثبت‌نشده'}</strong></p>
                        <p className="font-mono">تماس پدر: <strong className="font-bold">{user.parentsPhone || 'ثبت‌نشده'}</strong></p>
                      </div>
                      {user.parentsAddress && (
                        <p className="text-amber-700 dark:text-amber-400 text-[10px]">آدرس محل سکونت: {user.parentsAddress}</p>
                      )}
                    </div>
                  )}

                  {/* Personality Notes display if present */}
                  {user.personalityNotes && (
                    <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/70 text-[11px] space-y-1">
                      <span className="font-bold text-purple-900 dark:text-purple-300 block">🧠 یادداشت‌های فردی و شخصیتی:</span>
                      <p className="text-purple-800 dark:text-purple-300/90 leading-relaxed">{user.personalityNotes}</p>
                    </div>
                  )}

                  {/* Resume Badge & Actions for Any User */}
                  {(user.resumeName || user.resumeUrl) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-indigo-900 dark:text-indigo-200 truncate max-w-[170px]" title={user.resumeName}>
                            {user.resumeName || 'رزومه ضمیمه‌شده'}
                          </p>
                          <div className="flex items-center gap-2">
                            {user.resumeSize && <span className="text-[10px] text-indigo-500">{user.resumeSize}</span>}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                              {user.resumeName?.toLowerCase().endsWith('.txt') ? 'TXT' : 'PDF'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenResumeViewer(user)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1"
                          title="مشاهده محتوای رزومه"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مشاهده رزومه</span>
                        </button>
                        {user.resumeUrl && (
                          <a
                            href={user.resumeUrl}
                            download={user.resumeName || 'resume.pdf'}
                            className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="دانلود فایل"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenUserModal(user)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="ویرایش کاربر"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`آیا از حذف کاربر «${user.name}» اطمینان دارید؟`)) {
                          deleteUser(user.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="حذف کاربر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 2: CRM Customer Leads */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          {/* Referral Source Stats Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-500" />
                  تحلیل و آمار کانال‌های ورود و نحوه آشنایی با آکادمی
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  محاسبه برخط درصدهای ورود و جذب متقاضیان — روی هر کانال کلیک کنید تا متقاضیان آن فیلتر شوند
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch between CRM Only and All Database */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCrmAnalyticsScope('crm_only')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      crmAnalyticsScope === 'crm_only'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    متقاضیان CRM ({customerLeads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrmAnalyticsScope('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      crmAnalyticsScope === 'all'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    کل پرونده‌ها
                  </button>
                </div>

                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0">
                  مجموع: {totalSourceEntries} نفر
                </span>
              </div>
            </div>

            {/* Dynamic Multi-Channel Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {sourceList.map(item => {
                const isSelected = crmSourceFilter === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCrmSourceFilter(isSelected ? 'all' : item.name)}
                    className={`p-3 rounded-xl space-y-2 border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : item.count > 0
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/60 opacity-65 hover:opacity-100'
                    }`}
                    title={item.count > 0 ? `کلیک کنید تا متقاضیان «${item.name}» فیلتر شوند` : undefined}
                  >
                    <div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-700 dark:text-slate-200 font-bold truncate flex items-center gap-1">
                          <span>{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className={`font-mono font-black text-sm ${item.count > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {item.percentage}٪
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${item.count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                          {item.count} نفر
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {crmSourceFilter !== 'all' && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                <span className="text-blue-800 dark:text-blue-200 font-bold flex items-center gap-1.5">
                  <span>فیلتر فعال کانال جذب:</span>
                  <span className="underline decoration-blue-500 underline-offset-4 font-black">«{crmSourceFilter}»</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCrmSourceFilter('all')}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-lg font-bold hover:bg-blue-100 text-[11px] shadow-xs border border-blue-200 dark:border-blue-700"
                >
                  نمایش همه متقاضیان (حذف فیلتر)
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">جدول لیدها و متقاضیان دوره</h3>
                {crmSourceFilter !== 'all' && (
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[11px] font-bold">
                    کانال: {crmSourceFilter}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleOpenLeadModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                ثبت مخاطب جدید CRM
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">نام متقاضی</th>
                    <th className="p-3">شماره تماس</th>
                    <th className="p-3">دوره مورد علاقه</th>
                    <th className="p-3">کانال آشنایی</th>
                    <th className="p-3">وضعیت CRM</th>
                    <th className="p-3 text-center">تبدیل به دانشجو / عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerLeads
                    .filter(lead => {
                      if (crmSourceFilter === 'all') return true;
                      const norm = normalizeSource(lead.referralSource);
                      return norm === crmSourceFilter || lead.referralSource === crmSourceFilter;
                    })
                    .map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{lead.fullName}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{lead.phone}</td>
                      <td className="p-3 text-blue-600 dark:text-blue-400 font-medium">{lead.interestedCourseCategory}</td>
                      <td className="p-3 text-slate-500">{lead.referralSource}</td>
                      <td className="p-3">
                        <select
                          value={lead.status}
                          onChange={e => {
                            const newSt = e.target.value as LeadStatus;
                            if (newSt === 'cancelled') {
                              setCancellingLeadId(lead.id);
                            } else {
                              updateLeadStatus(lead.id, newSt);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold outline-none border ${
                            lead.status === 'enrolled' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            lead.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="new_lead">لید جدید</option>
                          <option value="contacted">تماس گرفته شده</option>
                          <option value="consultation">مشاوره شده</option>
                          <option value="pending_decision">در حال تصمیم‌گیری</option>
                          <option value="enrolled">ثبت‌نام شده</option>
                          <option value="cancelled">انصراف / لغو</option>
                        </select>

                        {lead.status === 'cancelled' && lead.cancellationReason && (
                          <span className="block text-[10px] text-rose-600 mt-1">علت انصراف: {lead.cancellationReason}</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {lead.status !== 'enrolled' && (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsConvertModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow transition-all flex items-center gap-1"
                              title="تبدیل ۱ کلیک به دانشجو"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              تبدیل به دانشجو
                            </button>
                          )}
                          {lead.status === 'enrolled' && (
                            <span className="text-emerald-600 font-bold text-[11px] px-2">✔ ثبت‌نام شده</span>
                          )}
                          <button
                            onClick={() => handleOpenLeadModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="ویرایش متقاضی"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`آیا از حذف پرونده متقاضی «${lead.fullName}» مطمئن هستید؟`)) {
                                deleteCustomerLead(lead.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="حذف متقاضی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: User Add/Edit */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingUserId ? 'ویرایش مشخصات کاربر' : 'تعریف کاربر جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="userForm" onSubmit={handleSaveUser} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 pr-2 pl-2 space-y-3.5 text-xs">
              {userDuplicateError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{userDuplicateError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    value={uName}
                    onChange={e => setUName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">شماره همراه</label>
                  <input
                    type="text"
                    value={uPhone}
                    onChange={e => setUPhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">نام کاربری (جهت ورود)</label>
                  <input
                    type="text"
                    placeholder="مثلاً: admin یا rezaei"
                    value={uUsername}
                    onChange={e => setUUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1">رمز عبور (پیش‌فرض: 123456)</label>
                  <input
                    type="text"
                    value={uPassword}
                    onChange={e => setUPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">نقش کاربر</label>
                  <EditableSelect
                    value={uRole}
                    onChange={val => setURole(val)}
                    options={[
                      { value: 'student', label: '🎓 دانشجو' },
                      { value: 'intern', label: '💻 کارآموز' },
                      { value: 'teacher', label: '👨‍🏫 مدرس / استاد' },
                      { value: 'admin', label: '👑 مدیر سیستم' }
                    ]}
                    placeholder="انتخاب یا نوشتن نقش کاربر..."
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">نحوه آشنایی با آکادمی *</label>
                  <EditableSelect
                    id="user_referral_select"
                    storageKey="crm_referral_sources"
                    value={uReferralSource}
                    onChange={val => setUReferralSource(val)}
                    options={[
                      { value: 'معرفی دوستان', label: '🤝 معرفی دوستان و آشنایان' },
                      { value: 'اینستاگرام', label: '📸 اینستاگرام' },
                      { value: 'وب‌سایت آکادمی', label: '🌐 وب‌سایت آکادمی' },
                      { value: 'تبلیغات و بنر', label: '📢 تبلیغات محیطی و بنر' },
                      { value: 'پیامک تبلیغاتی', label: '💬 پیامک تبلیغاتی' },
                      { value: 'دیوار و شیپور', label: '📱 دیوار و شیپور' },
                      { value: 'مراجعه حضوری', label: '🏢 مراجعه حضوری' },
                      { value: 'سایر', label: '✨ سایر کانال‌ها' }
                    ]}
                    placeholder="انتخاب یا تایپ نحوه آشنایی..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">سن کاربر (جهت بررسی زیر ۱۸ سال)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="مثلاً 16"
                    value={uAge || ''}
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setUAge(val);
                      if (val !== undefined) {
                        setUIsUnder18(val < 18);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setUIsUnder18(!uIsUnder18)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border ${
                      uIsUnder18 || (uAge !== undefined && uAge < 18)
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {uIsUnder18 || (uAge !== undefined && uAge < 18) ? 'زیر ۱۸ سال است ✔' : 'زیر ۱۸ سال؟'}
                  </button>
                </div>
              </div>

              {/* Universal Conditional Fields for Under 18 (Any Role) */}
              {(uIsUnder18 || (uAge !== undefined && uAge < 18)) && (
                <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                      مشخصات پدر / ولی قانونی (الزامی برای کلیه کاربران زیر ۱۸ سال):
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-amber-900 dark:text-amber-300 font-bold mb-1">
                        نام و نام خانوادگی پدر / ولی *
                      </label>
                      <input
                        type="text"
                        placeholder="مثلاً: محمد حسینی"
                        value={uParentsName}
                        onChange={e => setUParentsName(e.target.value)}
                        required={uIsUnder18 || (uAge !== undefined && uAge < 18)}
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2.5 outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-amber-900 dark:text-amber-300 font-bold mb-1">
                        شماره تماس همراه پدر / ولی *
                      </label>
                      <input
                        type="tel"
                        placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                        value={uParentsPhone}
                        onChange={e => setUParentsPhone(e.target.value)}
                        required={uIsUnder18 || (uAge !== undefined && uAge < 18)}
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2.5 font-mono outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-amber-900 dark:text-amber-300 font-bold mb-1">
                        آدرس محل سکونت والدین
                      </label>
                      <input
                        type="text"
                        placeholder="مشهد، خیابان راهنمایی..."
                        value={uParentsAddress}
                        onChange={e => setUParentsAddress(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2.5 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-amber-900 dark:text-amber-300 font-bold mb-1">
                        تلفن تماس اضطراری منزل / محل کار ولی
                      </label>
                      <input
                        type="tel"
                        placeholder="۰۵۱-۳۸۴۰۰۰۰۰"
                        value={uEmergencyPhone}
                        onChange={e => setUEmergencyPhone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl p-2.5 font-mono outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Resume File Upload Section (Drag & Drop / Picker - strictly PDF or TXT) */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    آپلود فایل رزومه یا مدارک تحصیلی (فقط فرمت PDF یا متنی TXT):
                  </label>
                  {uResumeName && (
                    <button
                      type="button"
                      onClick={() => {
                        setUResumeName('');
                        setUResumeUrl(undefined);
                        setUResumeSize(undefined);
                        setResumeError(null);
                      }}
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      حذف فایل
                    </button>
                  )}
                </div>

                {resumeError && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resumeError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="flex-1 w-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 rounded-xl p-3 bg-white dark:bg-slate-900 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,application/pdf,text/plain"
                      onChange={handleResumeFileUpload}
                      className="hidden"
                    />
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
                      {isUploadingResume ? 'در حال بارگذاری...' : 'کلیک کنید یا فایل رزومه (PDF یا TXT) را انتخاب نمایید'}
                    </span>
                  </label>

                  {uResumeName && (
                    <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl flex items-center gap-2 text-xs shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{uResumeName}</p>
                        {uResumeSize && <p className="text-[10px] text-slate-400">{uResumeSize}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Course Assignment for Student / Intern */}
              {(uRole === 'student' || uRole === 'intern') && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/80 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800 dark:text-white">تخصیص دوره‌ها و کلاس‌های آموزشی به این کاربر:</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    کلاس‌هایی که تیک می‌زنید در پنل کاربری این {uRole === 'student' ? 'دانشجو' : 'کارآموز'} نمایش داده خواهد شد.
                  </p>
                  {courses.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">هنوز دوره‌ای در سامانه تعریف نشده است.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pt-1">
                      {courses.map(course => {
                        const isChecked = uEnrolledCourseIds.includes(course.id);
                        return (
                          <label
                            key={course.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-blue-100/70 dark:bg-blue-900/40 border-blue-400 text-blue-900 dark:text-blue-200 font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setUEnrolledCourseIds([...uEnrolledCourseIds, course.id]);
                                } else {
                                  setUEnrolledCourseIds(uEnrolledCourseIds.filter(id => id !== course.id));
                                }
                              }}
                              className="rounded text-blue-600 w-4 h-4"
                            />
                            <span className="truncate">{course.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                  یادداشت ویژگی‌های فردی، رفتاری و شخصیتی (قابل مشاهده توسط مدرس مربوطه)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثلاً: بسیار دقیق و باانگیزه، علاقه‌مند به کار تیمی، نیاز به تمرین بیشتر در الگوریتم..."
                  value={uPersonalityNotes}
                  onChange={e => setUPersonalityNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">کانال آشنایی با آکادمی (Referral Source)</label>
                <EditableSelect
                  id="user_referral_source_select"
                  storageKey="crm_referral_sources"
                  value={uReferralSource}
                  onChange={val => setUReferralSource(val)}
                  options={[
                    { value: 'معرفی دوستان', label: '🤝 معرفی دوستان و آشنایان' },
                    { value: 'اینستاگرام', label: '📸 اینستاگرام' },
                    { value: 'پیام‌رسان بله', label: '🟢 پیام‌رسان بله' },
                    { value: 'پیام‌رسان ایتا', label: '🟠 پیام‌رسان ایتا' },
                    { value: 'تلگرام', label: '✈️ تلگرام' },
                    { value: 'وب‌سایت و گوگل', label: '🌐 وب‌سایت و گوگل' },
                    { value: 'دیوار و شیپور', label: '📱 دیوار و شیپور' },
                    { value: 'پیامک تبلیغاتی', label: '💬 پیامک تبلیغاتی' },
                    { value: 'مراجعه حضوری و تماس', label: '🏢 مراجعه حضوری و تماس تلفنی' },
                    { value: 'تبلیغات و بنر', label: '📢 تبلیغات محیطی و تراکت' },
                    { value: 'سایر', label: '✨ سایر' }
                  ]}
                  placeholder="انتخاب یا تایپ نحوه آشنایی..."
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">مهارت‌ها (با کاما جدا کنید)</label>
                <input
                  type="text"
                  placeholder="Python, WordPress, React"
                  value={uSkills}
                  onChange={e => setUSkills(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow"
                >
                  ذخیره اطلاعات
                </button>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Convert Lead to Student */}
      {isConvertModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                تبدیل لید به دانشجو
              </h3>
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 pr-1 pl-1 space-y-3.5 text-xs">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                با تایید این مرحله، برای <strong className="text-slate-900 dark:text-white">{selectedLead.fullName}</strong> یک اکانت دانشجو ایجاد شده و پرونده مالی و ثبت‌نام وی صادر می‌شود.
              </p>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">انتخاب دوره آموزشی برای ثبت‌نام</label>
                <EditableSelect
                  value={targetCourseId}
                  onChange={val => {
                    const cMatch = courses.find(c => c.title === val || c.id === val);
                    setTargetCourseId(cMatch ? cMatch.id : val);
                  }}
                  displayLabel={courses.find(c => c.id === targetCourseId)?.title}
                  options={courses.map(c => ({
                    value: c.id,
                    label: c.title
                  }))}
                  placeholder="انتخاب یا تایپ نام دوره آموزشی..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleConfirmConvert}
                disabled={!targetCourseId}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow"
              >
                تایید و صدور کارت ثبت‌نام
              </button>
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cancellation Reason Selection */}
      {cancellingLeadId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                علت انصراف متقاضی
              </h3>
              <button
                type="button"
                onClick={() => setCancellingLeadId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 pr-1 pl-1 space-y-3.5 text-xs">
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">دلیل انصراف را انتخاب یا وارد کنید:</label>
              <EditableSelect
                value={cancelReasonText}
                onChange={val => setCancelReasonText(val)}
                options={[
                  { value: 'بالا بودن شهریه', label: 'بالا بودن شهریه' },
                  { value: 'عدم تطابق ساعت کلاس', label: 'عدم تطابق ساعت کلاس' },
                  { value: 'دوری مسافت', label: 'دوری مسافت' },
                  { value: 'ثبت‌نام در مرکز دیگر', label: 'ثبت‌نام در مرکز دیگر' },
                  { value: 'عدم پاسخگویی تماس', label: 'عدم پاسخگویی به تماس' },
                  { value: 'مشکلات شخصی / مالی', label: 'مشکلات شخصی / مالی' },
                  { value: 'سایر دلایل شخصی', label: 'سایر دلایل شخصی' }
                ]}
                placeholder="انتخاب یا نوشتن علت انصراف..."
              />
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => handleConfirmCancellation(cancellingLeadId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
              >
                ثبت انصراف
              </button>
              <button
                type="button"
                onClick={() => setCancellingLeadId(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: CRM Lead Add */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col my-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">ثبت پرونده مشتری جدید در CRM</h3>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 pr-1 pl-1 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">نام متقاضی</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">شماره تماس همراه</label>
                <input
                  type="text"
                  value={leadPhone}
                  onChange={e => setLeadPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">دوره مورد علاقه</label>
                <EditableSelect
                  value={leadCourseCat}
                  onChange={val => setLeadCourseCat(val)}
                  options={[
                    { value: 'برنامه‌نویسی پایتون', label: 'برنامه‌نویسی پایتون' },
                    { value: 'طراحی سایت و وردپرس', label: 'طراحی سایت و وردپرس' },
                    { value: 'فرانت‌اند ری‌اکت', label: 'فرانت‌اند ری‌اکت' },
                    { value: 'هوش مصنوعی و یادگیری ماشین', label: 'هوش مصنوعی و یادگیری ماشین' },
                    { value: 'ICDL و مهارت‌های اداری', label: 'ICDL و مهارت‌های اداری' },
                    { value: 'گرافیک و فتوشاپ', label: 'گرافیک و فتوشاپ' }
                  ]}
                  placeholder="انتخاب یا تایپ دوره مورد علاقه..."
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">کانال آشنایی (Referral Source)</label>
                <EditableSelect
                  id="lead_source_select"
                  storageKey="crm_referral_sources"
                  value={leadSource}
                  onChange={val => setLeadSource(val)}
                  options={[
                    { value: 'معرفی دوستان', label: '🤝 معرفی دوستان و آشنایان' },
                    { value: 'اینستاگرام', label: '📸 اینستاگرام' },
                    { value: 'پیام‌رسان بله', label: '🟢 پیام‌رسان بله' },
                    { value: 'پیام‌رسان ایتا', label: '🟠 پیام‌رسان ایتا' },
                    { value: 'تلگرام', label: '✈️ تلگرام' },
                    { value: 'وب‌سایت و گوگل', label: '🌐 وب‌سایت و گوگل' },
                    { value: 'دیوار و شیپور', label: '📱 دیوار و شیپور' },
                    { value: 'پیامک تبلیغاتی', label: '💬 پیامک تبلیغاتی' },
                    { value: 'مراجعه حضوری و تماس', label: '🏢 مراجعه حضوری و تماس تلفنی' },
                    { value: 'تبلیغات و بنر', label: '📢 تبلیغات محیطی و تراکت' },
                    { value: 'سایر', label: '✨ سایر' }
                  ]}
                  placeholder="انتخاب یا تایپ نحوه آشنایی..."
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow"
                >
                  ثبت پرونده
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume In-App Viewer Modal */}
      {viewingResume && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>مشاهده رزومه: {viewingResume.userName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                      {viewingResume.isText ? 'متنی (.txt)' : 'PDF'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    نام فایل: {viewingResume.fileName} {viewingResume.fileSize ? `(${viewingResume.fileSize})` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {viewingResume.fileUrl && (
                  <>
                    <a
                      href={viewingResume.fileUrl}
                      download={viewingResume.fileName}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">دانلود فایل</span>
                    </a>
                    <a
                      href={viewingResume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">باز کردن در تب جدید</span>
                    </a>
                  </>
                )}
                <button
                  onClick={() => setViewingResume(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 min-h-[400px]">
              {viewingResume.isText ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner max-h-[500px] overflow-y-auto" dir="ltr">
                  {viewingResume.textContent || 'محتوای متنی فایل رزومه خالی یا بارگذاری نشده است.'}
                </div>
              ) : viewingResume.fileUrl ? (
                <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-sm">
                  <iframe
                    src={viewingResume.fileUrl}
                    title={viewingResume.fileName}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  فایل رزومه برای این کاربر به صورت مستقیم بارگذاری نشده است.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>فرمت‌های مورد تأیید آکادمی: فقط PDF و Text</span>
              </span>
              <button
                onClick={() => setViewingResume(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
