
import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { getWeatherAndTip, WeatherData } from '../services/geminiService';
import { CloudSun, Sprout, TrendingUp, AlertCircle, FlaskConical, Droplets, Calendar, AlertTriangle, ChevronRight, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../translations';

interface DashboardProps {
  location: LocationData | null;
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ location, onNavigate }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (location) {
      setLoading(true);
      getWeatherAndTip(location, language)
        .then(setWeatherData)
        .catch(() => setWeatherData(null))
        .finally(() => setLoading(false));
    }
  }, [location, language]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">{t('app_name')}</h1>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{t('subtitle')}</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)} 
            className="h-10 px-3 bg-white rounded-2xl flex items-center gap-2 font-bold border border-slate-200 shadow-sm active:scale-95 transition-transform"
          >
             <span className="text-xl leading-none">{LANGUAGES.find(l => l.code === language)?.flag}</span>
             <span className="text-xs uppercase tracking-tight text-slate-600">{language}</span>
             <ChevronRight size={14} className={`text-slate-400 transition-transform ${showLangMenu ? 'rotate-90' : ''}`}/>
          </button>
          {showLangMenu && (
             <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[2rem] shadow-2xl z-50 p-2 border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 gap-1 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {LANGUAGES.map(l => (
                     <button 
                        key={l.code} 
                        onClick={() => { setLanguage(l.code); setShowLangMenu(false); }} 
                        className={`w-full text-left px-4 py-3 rounded-2xl text-xs flex items-center justify-between transition-colors ${language === l.code ? 'bg-green-600 text-white font-black shadow-lg shadow-green-200' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{l.flag}</span>
                          <span>{l.name}</span>
                        </div>
                        {language === l.code && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                     </button>
                  ))}
                </div>
             </div>
          )}
        </div>
      </header>

      {weatherData?.alert && weatherData.alert.type !== 'None' && (
          <div className={`p-5 rounded-[2.5rem] border shadow-sm animate-in slide-in-from-top-4 flex items-start gap-4 ${
              weatherData.alert.severity === 'High' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-amber-50 border-amber-100 text-amber-900'
          }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${weatherData.alert.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                <AlertTriangle size={22} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase mb-1 tracking-widest opacity-70">{weatherData.alert.type} Warning</h4>
                  <p className="text-xs font-bold leading-relaxed">{weatherData.alert.message}</p>
              </div>
          </div>
      )}

      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/10 group transition-all duration-500 hover:shadow-green-900/10 min-h-[180px]">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-900"></div>
         <div className="relative p-6 sm:p-8 text-white h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 mb-3 w-fit border border-white/5">
                        <MapPin size={10} className="text-emerald-300" />
                        <span className="text-[9px] font-black tracking-widest text-emerald-50 uppercase">
                            {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Locating..."}
                        </span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">{weatherData?.temperature || "--"}</span>
                        <div className="pb-1">
                            <span className="block text-xs sm:text-sm font-black text-emerald-100 uppercase tracking-wide">{weatherData?.condition || "Consulting..."}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-3 sm:p-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg">
                  <CloudSun size={32} className="text-white sm:w-10 sm:h-10" />
                </div>
            </div>
            <div className="bg-black/20 backdrop-blur-xl rounded-[1.75rem] p-4 border border-white/10 group-hover:bg-black/30 transition-colors">
                <div className="flex items-start gap-4">
                    <div className="bg-emerald-400/20 p-2 rounded-xl text-emerald-300 shrink-0">
                      <Sprout size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold leading-relaxed text-emerald-50/90">{weatherData?.farming_tip || "Consulting localized agronomist reports..."}</p>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { view: 'CHAT', label: t('nav.advisor'), icon: Sprout, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { view: 'DOCTOR', label: t('nav.doctor'), icon: AlertCircle, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600' },
          { view: 'SOIL', label: t('nav.soil'), icon: FlaskConical, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
          { view: 'RECOMMENDER', label: t('nav.plan'), icon: Calendar, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600' },
        ].map((action) => (
          <button 
            key={action.view} 
            onClick={() => onNavigate(action.view)} 
            className="bg-white p-5 rounded-[2.25rem] shadow-sm border border-slate-100 hover:border-emerald-200 transition-all active:scale-95 flex flex-col items-start gap-4 group h-36"
          >
            <div className={`h-12 w-12 ${action.bg} ${action.text} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
              <action.icon size={24} strokeWidth={2.5} />
            </div>
            <span className="font-black text-slate-800 text-sm tracking-tight">{action.label}</span>
          </button>
        ))}
      </div>

       <button 
        onClick={() => onNavigate('MARKET')} 
        className="w-full bg-blue-50 p-5 rounded-[2.25rem] border border-blue-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-blue-100/50 shadow-sm"
      >
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-md shadow-blue-900/5 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <span className="block font-black text-blue-900 text-base">{t('nav.market')}</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Real-time Insights</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-200/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ChevronRight size={20} className="text-blue-500" />
          </div>
        </button>
    </div>
  );
};

export default Dashboard;