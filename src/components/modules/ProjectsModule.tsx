import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus, ProjectPriority } from '../../types';
import { getTodayPersianDate } from '../../utils/dateUtils';
import { EditableSelect } from '../common/EditableSelect';
import {
  FolderKanban,
  PlusCircle,
  Clock,
  UserCheck,
  CheckSquare,
  MessageSquare,
  Paperclip,
  AlertCircle,
  Send,
  MoreVertical,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Sparkles,
  Bot,
  RefreshCw
} from 'lucide-react';

export const ProjectsModule: React.FC = () => {
  const {
    projects,
    users,
    addProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    autoSyncProjectsStages,
    toggleProjectTask,
    addProjectComment,
    currentUser
  } = useApp();

  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isAiSyncing, setIsAiSyncing] = useState(false);
  const [aiSyncFeedback, setAiSyncFeedback] = useState<string | null>(null);

  const handleManualAiSync = () => {
    setIsAiSyncing(true);
    setAiSyncFeedback(null);
    setTimeout(() => {
      const res = autoSyncProjectsStages();
      setIsAiSyncing(false);
      if (res.changedCount > 0) {
        setAiSyncFeedback(`هوش مصنوعی با موفقیت ${res.changedCount} پروژه را با توجه به گزارش‌های جدید جابه‌جا و وضعیت پیشرفت را تنظیم کرد.`);
      } else {
        setAiSyncFeedback(`تمام پروژه‌ها دقیقاً در مرحله متناسب با گزارش‌های کاری و تسک‌های ثبت‌شده هستند.`);
      }
      setTimeout(() => setAiSyncFeedback(null), 7000);
    }, 600);
  };

  // Filter projects by role
  const visibleProjects = projects.filter(p => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'teacher') return p.supervisorTeacherId === currentUser.id;
    if (currentUser.role === 'intern') {
      return p.leadInternId === currentUser.id || p.teamInternIds?.includes(currentUser.id);
    }
    return false;
  });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [leadInternId, setLeadInternId] = useState('');
  const [supervisorTeacherId, setSupervisorTeacherId] = useState('');
  const [manualSupervisorName, setManualSupervisorName] = useState('');
  const [useManualSupervisor, setUseManualSupervisor] = useState(false);
  const currentY = getTodayPersianDate().split('/')[0] || '1405';
  const [deadline, setDeadline] = useState(`${currentY}/12/29`);
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [category, setCategory] = useState('طراحی سایت وردپرس');

  const interns = users.filter(u => u.role === 'intern' && u.status === 'active');
  const teachers = users.filter(u => u.role === 'teacher' && u.status === 'active');

  const handleOpenProjectModal = (project?: Project) => {
    setDuplicateError(null);
    if (project) {
      setEditingProjectId(project.id);
      setTitle(project.title);
      setDescription(project.description);
      setClientName(project.clientName);
      setLeadInternId(project.leadInternId);
      setSupervisorTeacherId(project.supervisorTeacherId || '');
      setManualSupervisorName('');
      setUseManualSupervisor(false);
      setDeadline(project.deadline);
      setPriority(project.priority);
      setCategory(project.category);
    } else {
      setEditingProjectId(null);
      setTitle('');
      setDescription('');
      setClientName('');
      setLeadInternId(interns[0]?.id || '');
      setSupervisorTeacherId('');
      setManualSupervisorName('');
      setUseManualSupervisor(false);
      setDeadline(`${currentY}/12/29`);
      setPriority('high');
      setCategory('طراحی سایت وردپرس');
    }
    setIsModalOpen(true);
  };

  const handleDeleteProject = (id: string, projectTitle: string) => {
    if (window.confirm(`آیا از حذف پروژه «${projectTitle}» اطمینان دارید؟`)) {
      deleteProject(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !leadInternId) return;

    // Check duplicate project title
    const isDuplicate = projects.some(
      p => p.id !== editingProjectId && p.title.trim().toLowerCase() === cleanTitle.toLowerCase()
    );
    if (isDuplicate) {
      setDuplicateError(`پروژه‌ای با عنوان «${cleanTitle}» قبلاً ثبت شده است! لطفاً عنوان متفاوتی انتخاب فرمایید.`);
      return;
    }
    setDuplicateError(null);

    const leadIntern = users.find(u => u.id === leadInternId);
    let finalSupervisorId = supervisorTeacherId;
    if (useManualSupervisor && manualSupervisorName) {
      finalSupervisorId = `sup-${Date.now()}`;
    }

    if (editingProjectId) {
      updateProject(editingProjectId, {
        title: cleanTitle,
        description,
        clientName,
        leadInternId,
        leadInternName: leadIntern ? leadIntern.name : 'کارآموز',
        supervisorTeacherId: finalSupervisorId || undefined,
        deadline,
        priority,
        category
      });
    } else {
      addProject({
        title: cleanTitle,
        description,
        clientName,
        leadInternId,
        leadInternName: leadIntern ? leadIntern.name : 'کارآموز',
        teamInternIds: [leadInternId],
        supervisorTeacherId: finalSupervisorId || undefined,
        startDate: getTodayPersianDate(),
        deadline: deadline || getTodayPersianDate(),
        priority,
        status: 'new',
        progressPercentage: 10,
        category,
        tasks: [
          { id: `t-${Date.now()}-1`, title: 'بررسی نیازمندی‌های اولیه کارفرما', completed: true },
          { id: `t-${Date.now()}-2`, title: 'طراحی ساختار دیتابیس / فرانت‌اند', completed: false }
        ]
      });
    }

    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setClientName('');
    setManualSupervisorName('');
    setUseManualSupervisor(false);
    setEditingProjectId(null);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !commentText) return;

    addProjectComment(selectedProject.id, commentText);
    setCommentText('');

    // refresh selected project reference
    const updatedProj = projects.find(p => p.id === selectedProject.id);
    if (updatedProj) setSelectedProject(updatedProj);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-500" />
            مدیریت پروژه‌های واقعی و Kanban کارآموزان
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پیگیری مراحل پیشرفت پروژه‌های تجاری، تخصیص کارآموز مسئول، بررسی چک‌لیست و کامنت‌های نظارتی
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveView('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'kanban' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-500'
              }`}
            >
              بورد کانبان
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-500'
              }`}
            >
              جدول پروژه‌ها
            </button>
          </div>

          <button
            onClick={handleManualAiSync}
            disabled={isAiSyncing}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            title="تحلیل خودکار گزارش کارها و انتقال هوشمند پروژه‌ها بین مراحل ۴گانه"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${isAiSyncing ? 'animate-spin' : ''}`} />
            <span>{isAiSyncing ? 'در حال تحلیل گزارش‌ها...' : 'جابه‌جایی خودکار با هوش مصنوعی'}</span>
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <button
              onClick={() => handleOpenProjectModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              تعریف پروژه جدید
            </button>
          )}
        </div>
      </div>

      {/* AI Sync Feedback Toast/Banner */}
      {aiSyncFeedback && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold">{aiSyncFeedback}</span>
          </div>
          <button
            onClick={() => setAiSyncFeedback(null)}
            className="p-1 hover:bg-indigo-200/50 rounded-lg text-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Kanban Board */}
      {activeView === 'kanban' && (
        visibleProjects.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {currentUser.role === 'intern' ? 'هنوز پروژه‌ای به شما تخصیص داده نشده است' : 'هیچ پروژه‌ای تعریف نشده است'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {currentUser.role === 'intern'
                ? 'به محض تخصیص پروژه تجاری یا کارآموزی توسط استاد ناظر یا مدیر، در این بخش نمایش داده خواهد شد.'
                : 'برای شروع کارآموزان روی دکمه «تعریف پروژه جدید» کلیک کنید.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {[
              { id: 'new', title: 'جدید / تعریف شده', dotColor: 'bg-slate-400', color: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40' },
              { id: 'in_progress', title: 'در حال انجام', dotColor: 'bg-blue-500', color: 'border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20' },
              { id: 'needs_review', title: 'در انتظار بازبینی مدیر', dotColor: 'bg-amber-500', color: 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20' },
              { id: 'completed', title: 'تکمیل و تحویل شده', dotColor: 'bg-emerald-500', color: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20' }
            ].map(col => {
              const columnProjects = visibleProjects.filter(p => p.status === col.id);

              return (
                <div
                  key={col.id}
                  className={`rounded-2xl border ${col.color} p-3.5 flex flex-col h-[260px] shadow-sm transition-all`}
                >
                  {/* Pinned Column Header with Project Count */}
                  <div className="flex items-center justify-between font-extrabold text-xs text-slate-800 dark:text-white pb-2 mb-1.5 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></span>
                      <span>{col.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-[11px] font-mono font-bold border border-blue-200/60 dark:border-blue-800">
                      <span>{columnProjects.length}</span>
                      <span className="text-[10px] font-sans font-normal">پروژه</span>
                    </span>
                  </div>

                  {/* Scrollable Column Cards Container (Size of 1 project, scrolls inside) */}
                  <div className="flex-1 overflow-y-auto pr-1 pl-1 space-y-3 min-h-0">
                    {columnProjects.length === 0 ? (
                      <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-400 dark:text-slate-500 text-xs">
                        <p className="text-[11px]">پروژه‌ای در این ستون نیست</p>
                      </div>
                    ) : (
                      columnProjects.map(proj => (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedProject(proj)}
                          className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                              {proj.category}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                proj.priority === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                                proj.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {proj.priority === 'urgent' && 'فوری'}
                                {proj.priority === 'high' && 'اولویت بالا'}
                                {proj.priority === 'medium' && 'معمولی'}
                              </span>

                              {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                                <div className="flex items-center gap-0.5 opacity-80 hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenProjectModal(proj);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                    title="ویرایش پروژه"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(proj.id, proj.title);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                    title="حذف پروژه"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors">
                            {proj.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            کارفرما: {proj.clientName}
                          </p>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>پیشرفت:</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{proj.progressPercentage}٪</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${proj.progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* AI Auto-Move Indicator */}
                          {proj.autoMovedByAi && (
                            <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg border border-indigo-200/60 dark:border-indigo-800/40 text-[10px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 font-medium">
                              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">جابه‌جایی خودکار توسط هوش مصنوعی بر اساس گزارش کار</span>
                            </div>
                          )}

                          {/* Intern Footer */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                              <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{proj.leadInternName}</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">{proj.deadline}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* List Table View */}
      {activeView === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          {visibleProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              پروژه‌ای برای نمایش وجود ندارد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">عنوان پروژه</th>
                    <th className="p-4">کارفرما</th>
                    <th className="p-4">کارآموز مسئول</th>
                    <th className="p-4">وضعیت</th>
                    <th className="p-4">پیشرفت</th>
                    <th className="p-4">مهلت تحویل</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {visibleProjects.map(proj => (
                    <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{proj.title}</td>
                      <td className="p-4 text-slate-500">{proj.clientName}</td>
                      <td className="p-4 font-medium">{proj.leadInternName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          proj.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          proj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          proj.status === 'needs_review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {proj.status === 'completed' && 'تکمیل شده'}
                          {proj.status === 'in_progress' && 'در حال انجام'}
                          {proj.status === 'needs_review' && 'در انتظار بازبینی'}
                          {proj.status === 'new' && 'جدید'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-blue-600">{proj.progressPercentage}٪</td>
                      <td className="p-4 font-mono text-slate-400">{proj.deadline}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            مشاهده
                          </button>
                          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                            <>
                              <button
                                onClick={() => handleOpenProjectModal(proj)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="ویرایش پروژه"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(proj.id, proj.title)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="حذف پروژه"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex-1 pr-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">{selectedProject.category}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{selectedProject.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">کارفرما: {selectedProject.clientName}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProject.status}
                  onChange={e => {
                    updateProjectStatus(selectedProject.id, e.target.value as ProjectStatus);
                    setSelectedProject({ ...selectedProject, status: e.target.value as ProjectStatus });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="new">جدید</option>
                  <option value="in_progress">در حال انجام</option>
                  <option value="needs_review">در انتظار بازبینی</option>
                  <option value="completed">تکمیل شده</option>
                </select>

                {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                  <>
                    <button
                      onClick={() => {
                        const projToEdit = selectedProject;
                        setSelectedProject(null);
                        handleOpenProjectModal(projToEdit);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="ویرایش پروژه"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteProject(selectedProject.id, selectedProject.title);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="حذف پروژه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedProject.description}
            </p>

            {/* AI Stage Transition Status Banner if moved by AI */}
            {selectedProject.aiTransitionReason && (
              <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>دلیل و تحلیل هوش مصنوعی برای این مرحله:</span>
                  {selectedProject.lastAiAnalysisDate && (
                    <span className="text-[10px] text-slate-400 font-mono mr-auto">({selectedProject.lastAiAnalysisDate})</span>
                  )}
                </div>
                <p className="text-indigo-800 dark:text-indigo-200 text-[11px] leading-relaxed">
                  {selectedProject.aiTransitionReason}
                </p>
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                نظرات و بازخورد استاد ناظر
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedProject.comments.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>{c.userName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{c.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="افزودن پیام یا دستورالعمل جدید..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow">
                  ارسال
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Define New Project */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProjectId ? 'ویرایش اطلاعات پروژه' : 'تعریف پروژه جدید برای کارآموزان'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{duplicateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">عنوان پروژه</label>
                <input
                  type="text"
                  placeholder="مثلاً طراحی وبسایت شرکت تجاری پارس"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    setDuplicateError(null);
                  }}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">نام سفارش‌دهنده / کارفرما</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">کارآموز مسئول پروژه *</label>
                  <EditableSelect
                    value={leadInternId}
                    onChange={val => setLeadInternId(val)}
                    options={interns.map(i => ({
                      value: i.id,
                      label: `💻 ${i.name} (${i.phone})`
                    }))}
                    placeholder="انتخاب یا نوشتن نام کارآموز..."
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">استاد ناظر پروژه</label>
                  <EditableSelect
                    value={supervisorTeacherId}
                    onChange={val => setSupervisorTeacherId(val)}
                    options={teachers.map(t => ({
                      value: t.id,
                      label: `👨‍🏫 ${t.name}`
                    }))}
                    placeholder="انتخاب یا نوشتن نام استاد ناظر..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">اولویت پروژه</label>
                  <EditableSelect
                    value={priority}
                    onChange={val => setPriority(val as ProjectPriority)}
                    options={[
                      { value: 'urgent', label: '🔥 فوری و اضطراری' },
                      { value: 'high', label: '⚡ بالا' },
                      { value: 'medium', label: '🔹 متوسط' },
                      { value: 'low', label: '☕ عادی' }
                    ]}
                    placeholder="انتخاب یا نوشتن اولویت..."
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-bold">دسته‌بندی فنی</label>
                  <EditableSelect
                    id="project_category_select"
                    storageKey="project_categories"
                    value={category}
                    onChange={val => setCategory(val)}
                    options={[
                      { value: 'طراحی سایت وردپرس', label: 'طراحی سایت وردپرس' },
                      { value: 'توسعه فرانت‌اند React', label: 'توسعه فرانت‌اند React' },
                      { value: 'برنامه‌نویسی پایتون و بک‌اند', label: 'برنامه‌نویسی پایتون و بک‌اند' },
                      { value: 'هوش مصنوعی و پردازش تصویر', label: 'هوش مصنوعی و پردازش تصویر' },
                      { value: 'اپلیکیشن موبایل', label: 'اپلیکیشن موبایل' }
                    ]}
                    placeholder="انتخاب یا نوشتن دسته‌بندی فنی..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">مهلت تحویل (ددلاین)</label>
                <input
                  type="text"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono outline-none text-slate-800 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">شرح دقیق نیازمندی‌های پروژه</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-white"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow"
                >
                  {editingProjectId ? 'ذخیره تغییرات پروژه' : 'ایجاد پروژه'}
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
    </div>
  );
};
