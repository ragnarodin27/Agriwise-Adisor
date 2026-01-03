import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, MessageSquareText, ScanLine, Store, MapPin, Droplets, Sprout, FlaskConical } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { t } = useLanguage();

  const navItems = [
    { view: AppView.DASHBOARD, label: t('nav.home'), icon: LayoutDashboard },
    { view: AppView.CHAT, label: t('nav.advisor'), icon: MessageSquareText },
    { view: AppView.DOCTOR, label: t('nav.doctor'), icon: ScanLine },
    { view: AppView.SOIL, label: t('nav.soil'), icon: FlaskConical },
    { view: AppView.IRRIGATION, label: t('nav.water'), icon: Droplets },
    { view: AppView.RECOMMENDER, label: t('nav.plan'), icon: Sprout },
    { view: AppView.MARKET, label: t('nav.market'), icon: Store },
    { view: AppView.SUPPLIERS, label: t('nav.find'), icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 shadow-lg z-50 pb-safe">
      <div className="flex items-center h-16 max-w-md mx-auto px-2 overflow-x-auto no-scrollbar gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 shrink-0 ${
                isActive ? 'text-green-700' : 'text-gray-400 hover:text-green-600'
              }`}
            >
              <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;