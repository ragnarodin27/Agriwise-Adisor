
import React, { useEffect, useState } from 'react';
import { LocationData, AppView, UserProfile } from '../types';
import { getWeatherAndTip, WeatherData } from '../services/geminiService';
import { 
  Bell, Sun, Leaf, FlaskConical, Store, Sprout, ScanLine, User, 
  Wind, Droplets, AlertCircle, TrendingUp, ShieldAlert, ChevronRight, Zap, CloudRain, Database, 
  Thermometer, Cloud, Navigation, X, Bug
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface DashboardProps {
  location: LocationData | null;
  userProfile: UserProfile | null;
  onNavigate: (view: any) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setLocation: (loc: LocationData | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ location, userProfile, onNavigate, setLocation }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [dismissedPest, setDismissedPest] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (location) {
      setLoading(true);
      getWeatherAndTip(location, language)
        .then(setWeatherData)
        .catch(() => setWeatherData(null))
        .finally(() => setLoading(false));
    }
  }, [location, language]);

  const quickActions = [
    { label: t('dashboard.quick_scan'), icon: ScanLine, view: AppView.DOCTOR, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('dashboard.quick_soil'), icon: FlaskConical, view: AppView.SOIL, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: t('dashboard.quick_market'), icon: Store, view: AppView.MARKET, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('dashboard.quick_tasks'), icon: Sprout, view: 'TASKS' as any, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
  ];

  return (
    <div className="p-4 pb-32 space-y-6 animate-in fade-in duration-500 text-agri-text dark:text-emerald-50 relative">
      
      <header className="flex justify-between items-center pt-4 relative z-10 px-2">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(AppView.PROFILE)}>
           <div className="w-14 h-14 rounded-3xl bg-white dark:bg-[#1C2B22] border-2 border-white dark:border-emerald-900/20 shadow-soft flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 active:scale-95">
              {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : <User size={28} className="text-agri-gray/50 dark:text-emerald-500/40" />}
           </div>
           <div>
              <p className="text-[10px] font-black text-agri-gray dark:text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Database size={10} /> {loading ? 'Syncing...' : t('dashboard.local_engine')}
              </p>
              <h1 className="text-2xl font-black text-agri-text dark:text-emerald-50 leading-none font-heading">
                {userProfile ? userProfile.name.split(' ')[0] : 'Farmer'}
              </h1>
           </div>
        </div>
        <button className="p-3.5 bg-white dark:bg-[#1C2B22] rounded-[1.25rem] shadow-soft text-agri-text dark:text-emerald-400 relative border border-white dark:border-white/5 active:scale-90 transition-all">
           <Bell size={20} />
        </button>
      </header>

      {/* Weather Alert */}
      {weatherData?.alert && !dismissedAlert && (
        <div className="relative z-20 px-2">
           <div className={`p-4 rounded-[2rem] shadow-lg flex items-center gap-4 border-2 animate-in slide-in-from-top-4 ${
             weatherData.alert.severity === 'High' 
               ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-200' 
               : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-200'
           }`}>
             <div className={`p-3 rounded-2xl ${weatherData.alert.severity === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                <ShieldAlert size={24} />
             </div>
             <div className="flex-1">
                <h4 className="font-black text-xs uppercase tracking-widest mb-0.5">{weatherData.alert.type} Alert</h4>
                <p className="text-xs font-bold leading-tight">{weatherData.alert.message}</p>
             </div>
             <button onClick={() => setDismissedAlert(true)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                <X size={18} />
             </button>
           </div>
        </div>
      )}

      {/* Pest Risk Alert */}
      {weatherData?.pest_risk && !dismissedPest && (
        <div className="relative z-20 px-2">
          <div className={`p-6 rounded-[2.5rem] bg-indigo-900 text-white shadow-2xl border border-indigo-700 animate-in slide-in-from-right-4`}>
             <div className="flex justify-between items-start mb-4">
               <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                  <Bug size={24} className="text-indigo-300" />
               </div>
               <button onClick={() => setDismissedPest(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                  <X size={16} />
               </button>
             </div>
             <div className="space-y-3">
               <div>
                 <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block ${weatherData.pest_risk.risk_level === 'High' ? 'bg-red-500' : 'bg-amber-500'}`}>
                   {weatherData.pest_risk.risk_level} Pest Risk
                 </span>
                 <h4 className="text-xl font-black">{weatherData.pest_risk.species} Outbreak Possible</h4>
               </div>
               <p className="text-xs font-bold text-indigo-100/70 leading-relaxed italic">
                 "{weatherData.pest_risk.identification_key}"
               </p>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black uppercase text-indigo-300 mb-1">Organic Counter-Measure</p>
                 <p className="text-xs font-bold">{weatherData.pest_risk.organic_treatment}</p>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Weather Station Grid */}
      <section className="relative z-10 grid grid-cols-2 gap-4">
         <div className="col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-teal-950 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
               <Sun size={120} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Local Weather Node</span>
                  <div className="flex items-baseline gap-2">
                     <span className="text-6xl font-black tracking-tighter">{weatherData?.temperature || '--°'}</span>
                     <span className="text-xl font-bold opacity-80">{weatherData?.condition || 'Analyzing...'}</span>
                  </div>
               </div>
               <p className="text-sm font-bold leading-relaxed mt-6 max-w-[80%] opacity-90">
                 {weatherData?.farming_tip || 'Awaiting sensor data...'}
               </p>
            </div>
         </div>

         <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between group overflow-hidden">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                  <Droplets size={20} />
               </div>
               <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Humidity</span>
            </div>
            <span className="text-2xl font-black dark:text-emerald-50">{weatherData?.humidity || '--%'}</span>
            <div className="absolute -bottom-4 -right-4 text-blue-500/10 group-hover:scale-125 transition-transform"><Droplets size={80}/></div>
         </div>

         <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between group overflow-hidden">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                  <Sun size={20} />
               </div>
               <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">UV Index</span>
            </div>
            <span className="text-2xl font-black dark:text-emerald-50">{weatherData?.uvIndex || '--'}</span>
            <div className="absolute -bottom-4 -right-4 text-amber-500/10 group-hover:scale-125 transition-transform"><Sun size={80}/></div>
         </div>
      </section>

      {/* Yield Potential Score Card */}
      <section className="relative z-10">
         <div className="bg-white dark:bg-[#1C2B22] rounded-[2.5rem] p-8 shadow-soft border border-white dark:border-white/5 flex items-center justify-between overflow-hidden group">
            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-400 dark:text-emerald-500/60 uppercase tracking-[0.2em]">{t('dashboard.yield_index')}</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 dark:text-emerald-50 tracking-tighter">84</span>
                  <span className="text-sm font-bold text-emerald-500">/ 100</span>
               </div>
               <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={12} /> {t('dashboard.yield_trend')}
               </p>
            </div>
            <div className="relative w-28 h-28">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" 
                    strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 0.84)} 
                    strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-out" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <Sprout size={28} className="text-emerald-500" />
               </div>
            </div>
         </div>
      </section>

      {/* Primary Actions Grid */}
      <section className="grid grid-cols-4 gap-3 relative z-10">
         {quickActions.map((action, i) => (
            <button 
              key={i} 
              onClick={() => onNavigate(action.view)}
              className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-[#1C2B22] rounded-[2rem] shadow-sm border border-slate-50 dark:border-white/5 transition-all active:scale-90 group"
            >
               <div className={`p-3.5 rounded-2xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon size={22} />
               </div>
               <span className="text-[9px] font-black uppercase text-slate-500 dark:text-emerald-500 tracking-widest text-center">{action.label}</span>
            </button>
         ))}
      </section>

      {/* Chat CTA */}
      <section 
        onClick={() => onNavigate(AppView.CHAT)}
        className="bg-emerald-600 dark:bg-emerald-700 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden group cursor-pointer active:scale-98 transition-all z-10"
      >
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
            <Leaf size={160} />
         </div>
         <div className="relative z-10 flex items-center gap-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
               <Zap size={28} fill="currentColor" />
            </div>
            <div>
               <h4 className="text-xl font-black font-heading leading-tight mb-1">{t('dashboard.consult_ai')}</h4>
               <p className="text-xs text-white/70 font-bold uppercase tracking-widest">{t('dashboard.consult_desc')}</p>
            </div>
         </div>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
