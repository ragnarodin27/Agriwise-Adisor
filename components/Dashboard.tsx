import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { getWeatherAndTip, WeatherAlert } from '../services/geminiService';
import { CloudSun, Sprout, TrendingUp, AlertCircle, FlaskConical, Droplets, Calendar, Globe, AlertTriangle, ChevronRight, Wind, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../translations';

interface DashboardProps {
  location: LocationData | null;
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ location, onNavigate }) => {
  const [weatherData, setWeatherData] = useState<{ weather: string; tip: string; alert?: WeatherAlert } | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (location && !weatherData) {
      setLoading(true);
      getWeatherAndTip(location, language)
        .then(setWeatherData)
        .catch(() => setWeatherData(null))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, language]); // Re-fetch if language changes

  return (
    <div className="p-5 pb-32 space-y-6">
      
      {/* Header Section */}
      <header className="flex justify-between items-center pt-2">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('app_name')}</h1>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
             {t('subtitle')}
          </p>
        </div>
        
        {/* Language Selector */}
        <div className="relative z-20">
             <button 
               onClick={() => setShowLangMenu(!showLangMenu)}
               className="h-10 pl-3 pr-2 bg-white rounded-full flex items-center gap-2 text-slate-700 font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
             >
                <span className="text-xl leading-none">{LANGUAGES.find(l => l.code === language)?.flag}</span>
                <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 ${showLangMenu ? 'rotate-90' : ''}`}/>
             </button>
             
             {showLangMenu && (
                 <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 z-20 overflow-hidden transform transition-all origin-top-right animate-in fade-in scale-95 duration-200">
                     <div className="p-2 max-h-80 overflow-y-auto">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-colors ${language === lang.code ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {language === lang.code && <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>}
                            </button>
                        ))}
                     </div>
                 </div>
                 </>
             )}
        </div>
      </header>

      {/* Critical Weather Alert Banner */}
      {weatherData?.alert && weatherData.alert.type !== 'None' && (
          <div className={`relative overflow-hidden p-4 rounded-2xl flex items-start gap-4 shadow-sm border animate-in slide-in-from-top-4 duration-500 ${
              weatherData.alert.severity === 'High' 
              ? 'bg-red-50 border-red-100 text-red-900' 
              : 'bg-amber-50 border-amber-100 text-amber-900'
          }`}>
              <div className={`p-2.5 rounded-full shrink-0 ${weatherData.alert.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div className="relative z-10">
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                      {weatherData.alert.type} Alert
                      {weatherData.alert.severity === 'High' && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">SEVERE</span>}
                  </h3>
                  <p className="text-sm font-medium leading-relaxed opacity-90">{weatherData.alert.message}</p>
              </div>
          </div>
      )}

      {/* Weather Card */}
      <div className="relative group overflow-hidden rounded-3xl shadow-lg shadow-green-900/10 transition-transform hover:scale-[1.01] duration-300">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-700"></div>
         {/* Decorative circles */}
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl"></div>
         
         <div className="relative p-6 text-white">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-1 flex items-center gap-1">
                        {location ? <><MapPin size={10} /> Local Weather</> : <><Globe size={10}/> Global</>}
                    </h2>
                    {loading ? (
                        <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                        <div className="text-3xl font-bold tracking-tight">
                            {weatherData ? weatherData.weather.split('.')[0] : "No Data"}
                        </div>
                    )}
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
                    <CloudSun size={32} className="text-white drop-shadow-md" />
                </div>
            </div>
            
            <div className="bg-black/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                    <div className="bg-emerald-400/20 p-1.5 rounded-lg shrink-0">
                        <Sprout size={18} className="text-emerald-100" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block mb-0.5">{t('dashboard.tip')}</span>
                        {loading ? (
                            <div className="space-y-1">
                                <div className="h-3 w-48 bg-white/10 rounded animate-pulse"></div>
                                <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <p className="text-sm font-medium leading-relaxed text-emerald-50">
                                {weatherData?.tip || (location ? "Analyzing conditions..." : "Enable location for local tips.")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Main Feature: Chat Advisor */}
      <button 
           onClick={() => onNavigate('CHAT')}
           className="w-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all group relative overflow-hidden text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Sprout size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-800 transition-colors">{t('nav.advisor')}</h3>
                    <p className="text-sm text-slate-500 font-medium">Ask about pests, soil, or planning</p>
                </div>
            </div>
            <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ChevronRight size={20} />
            </div>
          </div>
      </button>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('DOCTOR')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-100 transition-all flex flex-col items-start gap-3 group"
        >
          <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">{t('nav.doctor')}</span>
            <span className="text-xs text-slate-400 font-medium">Identify diseases</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('SOIL')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-100 transition-all flex flex-col items-start gap-3 group"
        >
          <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
            <FlaskConical size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">{t('nav.soil')}</span>
            <span className="text-xs text-slate-400 font-medium">Nutrient analysis</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('IRRIGATION')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all flex flex-col items-start gap-3 group"
        >
          <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
            <Droplets size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">{t('nav.water')}</span>
            <span className="text-xs text-slate-400 font-medium">Smart watering</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('RECOMMENDER')}
          className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-100 transition-all flex flex-col items-start gap-3 group"
        >
          <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
            <Calendar size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">{t('nav.plan')}</span>
            <span className="text-xs text-slate-400 font-medium">Crop strategy</span>
          </div>
        </button>
      </div>

       <button 
           onClick={() => onNavigate('MARKET')}
           className="w-full bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 hover:bg-indigo-50 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
                 <span className="font-bold text-indigo-900 block">{t('nav.market')}</span>
                 <span className="text-xs text-indigo-600/70 font-medium">Live prices & trends</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-indigo-300" />
        </button>
    </div>
  );
};

export default Dashboard;