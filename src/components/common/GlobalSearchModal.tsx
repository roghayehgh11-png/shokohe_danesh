import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { Search, BookOpen, Users, FolderKanban, UserPlus, DollarSign } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { courses, users, projects, customerLeads, tuitions, setActiveModule } = useApp();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredCourses = courses.filter(c => c.title.includes(query) || c.teacherName.includes(query));
  const filteredUsers = users.filter(u => u.name.includes(query) || u.phone.includes(query) || u.email.includes(query));
  const filteredProjects = projects.filter(p => p.title.includes(query) || p.leadInternName.includes(query));
  const filteredLeads = customerLeads.filter(l => l.fullName.includes(query) || l.phone.includes(query));
  const filteredTuitions = tuitions.filter(t => t.studentName.includes(query) || t.courseTitle.includes(query) || t.studentPhone.includes(query));

  const handleSelectModule = (mod: any) => {
    setActiveModule(mod);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="جستجوی سراسری سیستم" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام کاربر، عنوان دوره، پروژه، مشتری CRM یا پرونده مالی..."
            className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
          />
        </div>

        {query.trim() === '' ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            عبارت مورد نظر خود را برای جستجو وارد کنید.
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pl-1">
            {/* Courses */}
            {filteredCourses.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> دوره‌ها ({filteredCourses.length})
                </h4>
                <div className="space-y-1">
                  {filteredCourses.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectModule('courses')}
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors text-sm"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.title}</span>
                      <span className="text-xs text-slate-500">{c.teacherName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {filteredUsers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" /> کاربران ({filteredUsers.length})
                </h4>
                <div className="space-y-1">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectModule('users')}
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                        )}
                        <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{u.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {filteredProjects.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-amber-500" /> پروژه‌ها ({filteredProjects.length})
                </h4>
                <div className="space-y-1">
                  {filteredProjects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectModule('projects')}
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors text-sm"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{p.title}</span>
                      <span className="text-xs text-slate-500">مسئول: {p.leadInternName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Leads */}
            {filteredLeads.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-purple-500" /> مشتریان CRM ({filteredLeads.length})
                </h4>
                <div className="space-y-1">
                  {filteredLeads.map(l => (
                    <div
                      key={l.id}
                      onClick={() => handleSelectModule('users')}
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors text-sm"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{l.fullName}</span>
                      <span className="text-xs text-slate-500">{l.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial / Tuitions */}
            {filteredTuitions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> حساب‌های مالی و شهریه ({filteredTuitions.length})
                </h4>
                <div className="space-y-1">
                  {filteredTuitions.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectModule('financial')}
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors text-sm"
                    >
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">{t.studentName} - {t.courseTitle}</span>
                        <span className="text-xs text-slate-500">باقی‌مانده: {t.remainingAmount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${t.remainingAmount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {t.remainingAmount > 0 ? 'بدهکار' : 'تسویه'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
