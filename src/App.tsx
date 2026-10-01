import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { ShieldAlert, ArrowRight } from 'lucide-react';

// Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { UserManagementModule } from './components/modules/UserManagementModule';
import { CoursesModule } from './components/modules/CoursesModule';
import { ProjectsModule } from './components/modules/ProjectsModule';
import { DailyReportsModule } from './components/modules/DailyReportsModule';
import { FinancialModule } from './components/modules/FinancialModule';
import { NotificationsModule } from './components/modules/NotificationsModule';
import { MessagesModule } from './components/modules/MessagesModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { SettingsModule } from './components/modules/SettingsModule';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['dashboard', 'reports', 'users', 'courses', 'projects', 'daily_reports', 'financial', 'notifications', 'messages', 'settings'],
  teacher: ['courses', 'financial', 'daily_reports', 'notifications', 'messages'],
  intern: ['daily_reports', 'projects', 'notifications', 'messages'],
  student: ['courses', 'notifications', 'messages']
};

const MainLayout: React.FC = () => {
  const { activeModule, setActiveModule, currentUser } = useApp();

  const allowedModules = ROLE_PERMISSIONS[currentUser.role] || ['courses'];
  const isModuleAllowed = allowedModules.includes(activeModule);

  // Auto redirect if current activeModule is not allowed for role
  React.useEffect(() => {
    if (!allowedModules.includes(activeModule)) {
      setActiveModule(allowedModules[0] as any);
    }
  }, [currentUser.role, activeModule, allowedModules, setActiveModule]);

  const renderActiveModule = () => {
    if (!isModuleAllowed) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/80 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                عدم داشتن سطح دسترسی مجاز
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                نقش فعلی شما ({currentUser.role === 'teacher' ? 'مدرس' : currentUser.role === 'intern' ? 'کارآموز' : currentUser.role === 'student' ? 'دانشجو' : 'مهمان'}) مجوز مشاهده این بخش را ندارد.
              </p>
            </div>
            <button
              onClick={() => setActiveModule(allowedModules[0] as any)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <span>بازگشت به بخش مجاز</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'users':
        return <UserManagementModule />;
      case 'courses':
        return <CoursesModule />;
      case 'projects':
        return <ProjectsModule />;
      case 'daily_reports':
        return <DailyReportsModule />;
      case 'financial':
        return <FinancialModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'messages':
        return <MessagesModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-800 dark:text-slate-100 bg-[#F1F5F9] dark:bg-slate-950" dir="rtl">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Search Modal */}
      <GlobalSearchModal />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
