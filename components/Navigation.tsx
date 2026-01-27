
import React from 'react';
import { AppView } from '../types';
import { MessageSquareText, ScanLine, Store, Home, Grid } from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = React.memo(({ currentView, onViewChange }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Home', icon: Home },
    { view: AppView.DOCTOR, label: 'Scan', icon: ScanLine },
    { view: AppView.CHAT, label: 'Chat', icon: MessageSquareText },
    { view: AppView.MARKET, label: 'Market', icon: Store },
    { view: 'TASKS' as any, label: 'Tasks', icon: Grid },
  ];

  return (
    <div className="bg-white border-t border-slate-50 safe-pb px-6 py-3 rounded-t-[40px] shadow-[0_-10px_60px_rgba(0,0,0,0.03)]">
      <nav className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className="flex flex-col items-center justify-center gap-1 min-w-[56px] transition-all duration-300 group"
            >
              <div className={`p-3 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-agri-teal text-white shadow-lg shadow-agri-teal/30 -translate-y-2 scale-110' 
                  : 'text-slate-300 group-hover:text-agri-teal/60'
              }`}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-agri-teal rounded-full animate-in zoom-in duration-300 -mt-1"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
});

export default Navigation;
