
import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, MessageSquareText, ScanLine, Store, ClipboardList, Home, Grid } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = React.memo(({ currentView, onViewChange }) => {
  const { t } = useLanguage();

  const navItems = [
    { view: AppView.DASHBOARD, label: t('nav.home'), icon: Home },
    { view: AppView.DOCTOR, label: t('nav.doctor'), icon: ScanLine },
    { view: AppView.CHAT, label: t('nav.chat'), icon: MessageSquareText },
    { view: AppView.MARKET, label: t('nav.market'), icon: Store },
    { view: AppView.TASKS, label: t('nav.tasks'), icon: Grid }
  ];

  return (
    <div className="bg-white dark:bg-[#0E1F17] border-t border-slate-50 dark:border-white/5 safe-pb px-6 py-3 rounded-t-[40px] shadow-[0_-10px_60px_rgba(0,0,0,0.03)] dark:shadow-none relative z-50">
      <nav className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className="flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300 group"
              aria-label={item.label}
            >
              <div className={`p-3 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-agri-teal dark:bg-emerald-600 text-white shadow-lg shadow-agri-teal/30 dark:shadow-emerald-900/40 -translate-y-2 scale-110' 
                  : 'text-slate-300 dark:text-emerald-500/30 group-hover:text-agri-teal/60 dark:group-hover:text-emerald-500'
              }`}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-agri-teal dark:bg-emerald-600 rounded-full animate-in zoom-in duration-300 -mt-1"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
});

export default Navigation;
