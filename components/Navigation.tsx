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
    <div className="sticky bottom-0 left-0 right-0 z-50 px-2 pb-2 pt-0">
      <nav className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] rounded-2xl mx-auto pb-safe">
        <div className="flex items-center justify-between px-1 py-1 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                className={`group flex flex-col items-center justify-center min-w-[64px] h-[60px] rounded-xl transition-all duration-300 snap-center shrink-0 ${
                  isActive 
                    ? 'text-green-700 bg-green-50 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                   <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? "fill-green-200/50" : ""}
                   />
                </div>
                <span className={`text-[9px] font-bold mt-1 tracking-tight transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Navigation;