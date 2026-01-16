
import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, MessageSquareText, ScanLine, Store, MapPin, Droplets, Sprout, FlaskConical } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = React.memo(({ currentView, onViewChange }) => {
  const { t, isRTL } = useLanguage();

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
    <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 safe-pb px-2 py-1">
      <nav className={`flex items-center justify-between gap-1 overflow-x-auto no-scrollbar ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center justify-center flex-1 min-w-[56px] h-14 rounded-2xl transition-all duration-300 transform active:scale-90 touch-none ${
                isActive 
                  ? 'text-green-700 bg-green-50/80 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={isActive ? "animate-bounce-subtle" : ""}>
                <Icon 
                  size={isActive ? 22 : 20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-all duration-300 ${isActive ? "scale-110 mb-0.5" : "scale-100"}`}
                />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});

export default Navigation;
