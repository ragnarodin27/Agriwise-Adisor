
import React, { useEffect, useState } from 'react';
import { LocationData, AppView, UserProfile } from '../types';
import { getWeatherAndTip, WeatherData } from '../services/geminiService';
import { 
  Bell, Leaf, FlaskConical, Store, Sprout, ScanLine, User,
  AlertCircle, TrendingUp, ShieldAlert, Zap, CloudRain, Database
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface DashboardProps {
  location: LocationData | null;
  userProfile: UserProfile | null;
  onNavigate: (view: any) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setLocation: (loc: LocationData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ location, userProfile, onNavigate }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    if (location) {
      setLoading(true);
      getWeatherAndTip(location, language)
        .then(setWeatherData)
        .catch(() => setWeatherData(null))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, language]);

  const weekForecast = [
    { day: 'Today', temp: '32°', icon: '☀️', risk: 'Low', riskColor: 'bg-emerald-500' },
    { day: 'Tue', temp: '31°', icon: '☀️', risk: 'Low', riskColor: 'bg-emerald-500' },
    { day: 'Wed', temp: '29°', icon: '⛅', risk: 'Med', riskColor: 'bg-amber-500' },
    { day: 'Thu', temp: '28°', icon: '🌧️', risk: 'High', riskColor: 'bg-red-500' },
    { day: 'Fri', temp: '30°', icon: '⛅', risk: 'Med', riskColor: 'bg-amber-500' },
    { day: 'Sat', temp: '33°', icon: '☀️', risk: 'Low', riskColor: 'bg-emerald-500' },
    { day: 'Sun', temp: '34°', icon: '🔥', risk: 'High', riskColor: 'bg-red-500' },
  ];

  const quickActions = [
    { label: 'Scan', icon: ScanLine, view: AppView.DOCTOR, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Soil', icon: FlaskConical, view: AppView.SOIL, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Market', icon: Store, view: AppView.MARKET, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Tasks', icon: Sprout, view: 'TASKS' as any, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  return (
    <div className="p-4 pb-32 space-y-6 animate-in fade-in duration-500 text-agri-text dark:text-emerald-50 relative">
      
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Person%20Farmer%20Light%20Skin%20Tone.png" className="absolute top-24 -right-12 w-72 h-72 opacity-[0.03] rotate-12" alt="" />
         <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Tractor.png" className="absolute bottom-10 -left-8 w-64 h-64 opacity-[0.03]" alt="" />
      </div>

      <header className="flex justify-between items-center pt-4 relative z-10 px-2">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(AppView.PROFILE)}>
           <div className="w-14 h-14 rounded-3xl bg-white dark:bg-[#1C2B22] border-2 border-white dark:border-emerald-900/20 shadow-soft flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 active:scale-95">
              {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : <User size={28} className="text-agri-gray/50 dark:text-emerald-500/40" />}
           </div>
           <div>
              <p className="text-[10px] font-black text-agri-gray dark:text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Database size={10} /> {loading ? 'Syncing...' : 'Local Engine Ready'}
              </p>
              <h1 className="text-2xl font-black text-agri-text dark:text-emerald-50 leading-none font-heading">
                {userProfile ? userProfile.name.split(' ')[0] : 'Farmer'}
              </h1>
           </div>
        </div>
        <button className="p-3.5 bg-white dark:bg-[#1C2B22] rounded-[1.25rem] shadow-soft text-agri-text dark:text-emerald-400 relative border border-white dark:border-white/5 active:scale-90 transition-all">
           <Bell size={20} />
           <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-[2.5px] border-white dark:border-[#1C2B22]"></span>
        </button>
      </header>

      {/* Yield Potential Score Card */}
      <section className="relative z-10">
         <div className="bg-white dark:bg-[#1C2B22] rounded-[2.5rem] p-8 shadow-soft border border-white dark:border-white/5 flex items-center justify-between overflow-hidden group">
            <div className="space-y-1">
               <span className="text-[10px] font-black text-slate-400 dark:text-emerald-500/60 uppercase tracking-[0.2em]">Regional Yield Index</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 dark:text-emerald-50 tracking-tighter">84</span>
                  <span className="text-sm font-bold text-emerald-500">/ 100</span>
               </div>
               <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={12} /> Positive soil moisture trend
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
                  <Sprout size={28} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
               </div>
            </div>
         </div>
      </section>

      {/* Weather Ribbon */}
      <section className="space-y-4 relative z-10">
         <div className="flex justify-between items-center px-3">
            <h3 className="font-black text-[11px] uppercase text-slate-400 dark:text-emerald-500 tracking-widest">7-Day Agro-Outlook</h3>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><CloudRain size={10} /> Optimal Planting Conditions</span>
         </div>
         <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            {weekForecast.map((f, i) => (
               <div key={i} className="flex flex-col items-center gap-3 min-w-[76px] p-5 rounded-[1.75rem] bg-white dark:bg-[#1C2B22] border border-slate-50 dark:border-white/5 shadow-sm transition-transform active:scale-95">
                  <span className="text-[9px] font-black text-slate-400 dark:text-emerald-500 uppercase">{f.day}</span>
                  <span className="text-2xl drop-shadow-sm">{f.icon}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-emerald-50">{f.temp}</span>
                  <div className="w-full h-1 mt-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                     <div className={`h-full ${f.riskColor} w-full`}></div>
                  </div>
                  <span className="text-[7px] font-black uppercase text-slate-400 dark:text-emerald-500/40 tracking-tighter">{f.risk} Risk</span>
               </div>
            ))}
         </div>
      </section>

      {/* AI Alert Ribbon */}
      {(weatherData?.farming_tip || weatherData?.alert) && (
        <section className="relative z-10 animate-in slide-in-from-top-4">
           <div className="bg-amber-950 dark:bg-[#1C2B22] border-2 border-amber-500/20 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform text-amber-500">
                 <ShieldAlert size={140} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-amber-500/20">
                    <AlertCircle size={22} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">AI Priority Alert</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-amber-50 dark:text-emerald-50/80">
                {weatherData.farming_tip || "Localized soil moisture surge detected. Adjust irrigation cycles to prevent potential fungal root stress."}
              </p>
           </div>
        </section>
      )}

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
               <span className="text-[9px] font-black uppercase text-slate-500 dark:text-emerald-500 tracking-widest">{action.label}</span>
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
               <h4 className="text-xl font-black font-heading leading-tight mb-1">Consult AI Advisor</h4>
               <p className="text-xs text-white/70 font-bold uppercase tracking-widest">Natural & Regenerative Logic</p>
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
