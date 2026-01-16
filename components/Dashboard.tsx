
import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { getWeatherAndTip, WeatherData } from '../services/geminiService';
import { 
  CloudSun, Sprout, TrendingUp, AlertCircle, FlaskConical, Droplets, 
  Calendar, AlertTriangle, ChevronRight, MapPin, Moon, Sun, Clock, 
  CheckSquare, History, Edit2, X, BellRing
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../translations';

interface DashboardProps {
  location: LocationData | null;
  onNavigate: (view: any) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setLocation: (loc: LocationData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ location, onNavigate, isDarkMode, toggleTheme, setLocation }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [manualCoords, setManualCoords] = useState({ lat: '', lon: '' });

  useEffect(() => {
    if (location) {
      setLoading(true);
      getWeatherAndTip(location, language)
        .then(setWeatherData)
        .catch(() => setWeatherData(null))
        .finally(() => setLoading(false));
    }
    const savedActivities = JSON.parse(localStorage.getItem('agri_activities') || '[]');
    setActivities(savedActivities);
  }, [location, language]);

  const handleManualSave = () => {
    const loc = { latitude: parseFloat(manualCoords.lat), longitude: parseFloat(manualCoords.lon) };
    setLocation(loc);
    localStorage.setItem('manual_location', JSON.stringify(loc));
    setShowLocModal(false);
  };

  const getTimeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center px-1">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{t('app_name')}</h1>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all text-slate-600 dark:text-amber-400"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)} 
              className="h-10 px-3 bg-white dark:bg-slate-800 rounded-2xl flex items-center gap-2 font-bold border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
            >
               <span className="text-xl leading-none">{LANGUAGES.find(l => l.code === language)?.flag}</span>
               <ChevronRight size={14} className={`text-slate-400 transition-transform ${showLangMenu ? 'rotate-90' : ''}`}/>
            </button>
            {showLangMenu && (
               <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl z-50 p-2 border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 gap-1 max-h-[50vh] overflow-y-auto no-scrollbar">
                    {LANGUAGES.map(l => (
                       <button 
                          key={l.code} 
                          onClick={() => { setLanguage(l.code); setShowLangMenu(false); }} 
                          className={`w-full text-left px-4 py-3 rounded-2xl text-xs flex items-center justify-between transition-colors ${language === l.code ? 'bg-green-600 text-white font-black shadow-lg shadow-green-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{l.flag}</span>
                            <span>{l.name}</span>
                          </div>
                       </button>
                    ))}
                  </div>
               </div>
            )}
          </div>
        </div>
      </header>

      {/* Weather Alert */}
      {weatherData?.alert && weatherData.alert.type !== 'None' && (
          <div className={`p-5 rounded-[2.5rem] border shadow-sm animate-in slide-in-from-top-4 flex items-start gap-4 ${
              weatherData.alert.severity === 'High' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-900 dark:text-red-100' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-100'
          }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${weatherData.alert.severity === 'High' ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200' : 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200'}`}>
                <BellRing size={22} className="animate-ring" />
              </div>
              <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase mb-1 tracking-widest opacity-70">{weatherData.alert.type} Warning</h4>
                  <p className="text-xs font-bold leading-relaxed">{weatherData.alert.message}</p>
              </div>
          </div>
      )}

      {/* Hero Weather Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/10 group transition-all duration-500 hover:shadow-green-900/10 min-h-[180px]">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-900"></div>
         <div className="relative p-6 sm:p-8 text-white h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button 
                      onClick={() => setShowLocModal(true)}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 mb-3 w-fit border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                    >
                        <MapPin size={10} className="text-emerald-300" />
                        <span className="text-[9px] font-black tracking-widest text-emerald-50 uppercase">
                            {location ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : "Locating..."}
                        </span>
                        <Edit2 size={10} className="text-white/50" />
                    </button>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">{weatherData?.temperature || "--"}</span>
                        <div className="pb-1">
                            <span className="block text-xs sm:text-sm font-black text-emerald-100 uppercase tracking-wide">{weatherData?.condition || "Consulting..."}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-3 sm:p-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-lg">
                  <CloudSun size={32} className="text-white" />
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

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { view: 'CHAT', label: t('nav.advisor'), icon: Sprout, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
          { view: 'DOCTOR', label: t('nav.doctor'), icon: AlertCircle, bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
          { view: 'SOIL', label: t('nav.soil'), icon: FlaskConical, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
          { view: 'TASKS', label: 'Farm Log', icon: CheckSquare, bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
        ].map((action) => (
          <button 
            key={action.view} 
            onClick={() => onNavigate(action.view)} 
            className="bg-white dark:bg-slate-800 p-5 rounded-[2.25rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:border-emerald-200 transition-all active:scale-95 flex flex-col items-start gap-4 group h-36"
          >
            <div className={`h-12 w-12 ${action.bg} ${action.text} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
              <action.icon size={24} strokeWidth={2.5} />
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <section className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <History size={14} /> Recent Intelligence
          </h3>
        </div>
        <div className="space-y-4">
          {activities.length > 0 ? activities.map(act => (
            <div key={act.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate(act.type)}>
              <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                 <span className="text-lg">{act.icon || '📝'}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{act.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-slate-300" />
                  <span className="text-[9px] font-black uppercase text-slate-400">{getTimeAgo(act.timestamp)}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          )) : (
            <div className="text-center py-4">
              <p className="text-[10px] font-black text-slate-300 uppercase">No recent activity</p>
            </div>
          )}
        </div>
      </section>

      {/* Manual Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowLocModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100">
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-2xl text-amber-600">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Manual Coordinates</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 font-medium">If automatic detection fails, enter your farm's GPS coordinates for precise climate data.</p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1">Latitude</label>
                <input 
                  type="number" 
                  value={manualCoords.lat} 
                  onChange={e => setManualCoords({...manualCoords, lat: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="e.g. 28.6139" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1">Longitude</label>
                <input 
                  type="number" 
                  value={manualCoords.lon} 
                  onChange={e => setManualCoords({...manualCoords, lon: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="e.g. 77.2090" 
                />
              </div>
            </div>
            <button 
              onClick={handleManualSave}
              className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/10 active:scale-95 transition-all"
            >
              Update Location
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          5% { transform: rotate(20deg); }
          10% { transform: rotate(-20deg); }
          15% { transform: rotate(20deg); }
          20% { transform: rotate(-20deg); }
          25% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-ring {
          animation: ring 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
