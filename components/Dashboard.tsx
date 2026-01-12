
import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { getWeatherAndTip, WeatherAlert, WeatherData } from '../services/geminiService';
import { CloudSun, Sprout, TrendingUp, AlertCircle, FlaskConical, Droplets, Calendar, Globe, AlertTriangle, ChevronRight, Wind, MapPin, Thermometer } from 'lucide-react';
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
    <div className="p-4 pb-32 space-y-4">
      
      {/* Header Section - Tightened */}
      <header className="flex justify-between items-center pt-1">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('app_name')}</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
             {t('subtitle')}
          </p>
        </div>
        
        {/* Language Selector */}
        <div className="relative z-20">
             <button 
               onClick={() => setShowLangMenu(!showLangMenu)}
               className="h-8 pl-2 pr-1 bg-white rounded-full flex items-center gap-1.5 text-slate-700 font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
             >
                <span className="text-sm leading-none">{LANGUAGES.find(l => l.code === language)?.flag}</span>
                <span className="text-[10px] uppercase">{language}</span>
                <ChevronRight size={12} className={`text-slate-400 transition-transform duration-300 ${showLangMenu ? 'rotate-90' : ''}`}/>
             </button>
             
             {showLangMenu && (
                 <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 z-20 overflow-hidden transform transition-all origin-top-right animate-in fade-in scale-95 duration-200">
                     <div className="p-1 max-h-64 overflow-y-auto">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-3 transition-colors ${language === lang.code ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {language === lang.code && <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                            </button>
                        ))}
                     </div>
                 </div>
                 </>
             )}
        </div>
      </header>

      {/* Critical Weather Alert Banner - Thinner */}
      {weatherData?.alert && weatherData.alert.type !== 'None' ? (
          <div className={`relative overflow-hidden p-3 rounded-xl flex items-center gap-3 shadow-sm border animate-in slide-in-from-top-4 duration-500 ${
              weatherData.alert.severity === 'High' 
              ? 'bg-red-50 border-red-100 text-red-900' 
              : 'bg-amber-50 border-amber-100 text-amber-900'
          }`}>
              <div className={`p-1.5 rounded-lg shrink-0 ${weatherData.alert.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                <AlertTriangle size={18} strokeWidth={2.5} />
              </div>
              <div className="relative z-10 flex-1">
                  <p className="text-[11px] font-bold leading-tight line-clamp-2">
                    <span className="font-black uppercase mr-1">{weatherData.alert.type}:</span>
                    {weatherData.alert.message}
                  </p>
              </div>
          </div>
      ) : (
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/50 flex items-center gap-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                  <AlertCircle size={18} />
              </div>
              <div>
                  <h4 className="text-[10px] font-black uppercase text-amber-800/60">General Alert</h4>
                  <p className="text-[11px] font-bold text-amber-900/60 tracking-tight">No active weather alerts for this region</p>
              </div>
          </div>
      )}

      {/* Advanced Weather Card - MINIMIZED */}
      <div className="relative group overflow-hidden rounded-[2rem] shadow-xl shadow-emerald-900/10 transition-all duration-500 border border-white/10">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"></div>
         
         <div className="relative p-5 text-white">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-2 py-0.5 mb-2 w-fit border border-white/5">
                        <MapPin size={10} className="text-emerald-300" />
                        <span className="text-[9px] font-black tracking-tight text-emerald-50">
                            {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Detecting Location..."}
                        </span>
                    </div>
                    {loading ? (
                        <div className="h-8 w-32 bg-white/20 rounded-xl animate-pulse"></div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black tracking-tighter leading-none drop-shadow-md">
                                {weatherData?.temperature || "--"}
                            </span>
                            <div className="pb-0.5">
                                <span className="block text-sm font-bold text-emerald-50 leading-none">{weatherData?.condition || "Waiting..."}</span>
                                <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-400/80 mt-1">Current Condition</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                    <CloudSun size={32} className="text-white drop-shadow-lg" />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-400/20 rounded-xl text-blue-100">
                        <Droplets size={16} />
                    </div>
                    <div>
                        <span className="block text-[8px] font-bold uppercase tracking-widest text-blue-200/60">Humidity</span>
                        <span className="text-sm font-black">{weatherData?.humidity || "0%"}</span>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-400/20 rounded-xl text-amber-100">
                        <Wind size={16} />
                    </div>
                    <div>
                        <span className="block text-[8px] font-bold uppercase tracking-widest text-amber-200/60">Wind</span>
                        <span className="text-sm font-black">Light</span>
                    </div>
                </div>
            </div>

            <div className="bg-black/15 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/5 shadow-inner">
                <div className="flex items-start gap-3">
                    <div className="bg-emerald-400/20 p-2 rounded-xl shrink-0">
                        <Sprout size={18} className="text-emerald-100" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-emerald-200/70 uppercase tracking-widest block mb-1">{t('dashboard.tip')}</span>
                        {loading ? (
                            <div className="space-y-1.5">
                                <div className="h-2 w-32 bg-white/10 rounded-full animate-pulse"></div>
                                <div className="h-2 w-20 bg-white/10 rounded-full animate-pulse"></div>
                            </div>
                        ) : (
                            <p className="text-[11px] font-bold leading-relaxed text-emerald-50">
                                {weatherData?.farming_tip || (location ? "Analyzing local climate..." : "Enable location for advice.")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Main Feature: Chat Advisor - Scaled down */}
      <button 
           onClick={() => onNavigate('CHAT')}
           className="w-full bg-white p-4 rounded-[1.75rem] shadow-sm border border-slate-100 hover:border-emerald-200 transition-all group relative overflow-hidden text-left"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full opacity-40"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-105 transition-all">
                    <Sprout size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="font-black text-slate-800 text-base tracking-tight">{t('nav.advisor')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ask pests, soil, planning</p>
                </div>
            </div>
            <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ChevronRight size={18} />
            </div>
          </div>
      </button>

      {/* Quick Actions Grid - More compact */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { view: 'DOCTOR', label: t('nav.doctor'), sub: 'Identify diseases', icon: AlertCircle, color: 'orange' },
          { view: 'SOIL', label: t('nav.soil'), sub: 'Nutrient analysis', icon: FlaskConical, color: 'amber' },
          { view: 'IRRIGATION', label: t('nav.water'), sub: 'Smart watering', icon: Droplets, color: 'blue' },
          { view: 'RECOMMENDER', label: t('nav.plan'), sub: 'Crop strategy', icon: Calendar, color: 'purple' },
        ].map((action) => (
          <button 
            key={action.view}
            onClick={() => onNavigate(action.view)}
            className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all flex flex-col items-start gap-3 group"
          >
            <div className={`h-11 w-11 bg-${action.color}-50 rounded-xl flex items-center justify-center text-${action.color}-600 group-hover:scale-110 transition-transform`}>
              <action.icon size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-black text-slate-800 block text-sm tracking-tight">{action.label}</span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{action.sub}</span>
            </div>
          </button>
        ))}
      </div>

       <button 
           onClick={() => onNavigate('MARKET')}
           className="w-full bg-indigo-50/40 p-4 rounded-3xl border border-indigo-100 hover:bg-white transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
                 <span className="font-black text-indigo-900 block text-sm tracking-tight">{t('nav.market')}</span>
                 <span className="text-[10px] text-indigo-600/70 font-bold uppercase">Live prices & trends</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
  );
};

export default Dashboard;
