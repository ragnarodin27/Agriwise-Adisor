import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { getWeatherAndTip, WeatherAlert } from '../services/geminiService';
import { CloudSun, Sprout, TrendingUp, AlertCircle, FlaskConical, Droplets, Calendar, Globe, AlertTriangle } from 'lucide-react';
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
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">{t('app_name')}</h1>
          <p className="text-sm text-green-700">{t('subtitle')}</p>
        </div>
        
        {/* Language Selector */}
        <div className="relative">
             <button 
               onClick={() => setShowLangMenu(!showLangMenu)}
               className="h-10 px-3 bg-white rounded-full flex items-center gap-2 text-green-800 font-bold border border-green-200 shadow-sm hover:bg-green-50 transition-colors"
             >
                <span className="text-lg">{LANGUAGES.find(l => l.code === language)?.flag}</span>
                <span className="text-xs uppercase">{language}</span>
             </button>
             
             {showLangMenu && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                     {LANGUAGES.map(lang => (
                         <button
                             key={lang.code}
                             onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                             className={`w-full text-left px-4 py-3 text-sm hover:bg-green-50 flex items-center gap-3 ${language === lang.code ? 'bg-green-50 font-bold text-green-900' : 'text-gray-700'}`}
                         >
                             <span className="text-lg">{lang.flag}</span>
                             <span>{lang.name}</span>
                         </button>
                     ))}
                 </div>
             )}
        </div>
      </header>

      {/* Critical Weather Alert Banner */}
      {weatherData?.alert && weatherData.alert.type !== 'None' && (
          <div className={`p-4 rounded-xl flex items-start gap-3 shadow-md border animate-in fade-in slide-in-from-top-2 ${
              weatherData.alert.severity === 'High' 
              ? 'bg-red-50 border-red-200 text-red-900' 
              : 'bg-orange-50 border-orange-200 text-orange-900'
          }`}>
              <div className={`p-2 rounded-full shrink-0 ${weatherData.alert.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                      {weatherData.alert.type} Warning
                      {weatherData.alert.severity === 'High' && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded">SEVERE</span>}
                  </h3>
                  <p className="text-sm font-medium leading-relaxed opacity-90">{weatherData.alert.message}</p>
              </div>
          </div>
      )}

      {/* Weather Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <CloudSun size={80} />
        </div>
        <h2 className="text-lg font-semibold mb-2">{t('dashboard.weather')}</h2>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-white/30 rounded w-3/4"></div>
            <div className="h-4 bg-white/30 rounded w-1/2"></div>
          </div>
        ) : weatherData ? (
          <div>
            <p className="text-xl font-medium mb-1">{weatherData.weather}</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <span className="text-xs uppercase tracking-wider font-bold opacity-80">{t('dashboard.tip')}</span>
              <p className="text-sm mt-1 leading-relaxed">{weatherData.tip}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm opacity-90">
            {location ? "Loading weather data..." : "Enable location to see local weather."}
          </p>
        )}
      </div>

      {/* Quick Actions Grid */}
      <h3 className="font-bold text-gray-800 text-lg">{t('dashboard.quick_actions')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('DOCTOR')}
          className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group"
        >
          <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
            <AlertCircle size={20} />
          </div>
          <span className="font-medium text-gray-700 text-sm text-center">{t('nav.doctor')}</span>
        </button>

        <button 
          onClick={() => onNavigate('SOIL')}
          className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group"
        >
          <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <FlaskConical size={20} />
          </div>
          <span className="font-medium text-gray-700 text-sm text-center">{t('nav.soil')}</span>
        </button>

        <button 
          onClick={() => onNavigate('IRRIGATION')}
          className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group"
        >
          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Droplets size={20} />
          </div>
          <span className="font-medium text-gray-700 text-sm text-center">{t('nav.water')}</span>
        </button>

        <button 
          onClick={() => onNavigate('RECOMMENDER')}
          className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group"
        >
          <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
            <Calendar size={20} />
          </div>
          <span className="font-medium text-gray-700 text-sm text-center">{t('nav.plan')}</span>
        </button>

        <button 
           onClick={() => onNavigate('MARKET')}
           className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2 group col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="font-medium text-gray-700">{t('nav.market')}</span>
          </div>
        </button>
        
        <button 
           onClick={() => onNavigate('CHAT')}
           className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow col-span-2 flex items-center justify-between px-6 group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Sprout size={24} />
            </div>
            <div className="text-left">
              <span className="font-medium text-gray-700 block">{t('nav.advisor')}</span>
            </div>
          </div>
          <div className="text-gray-400 group-hover:translate-x-1 transition-transform">→</div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;