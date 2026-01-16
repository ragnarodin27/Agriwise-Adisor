
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, Search, Loader2, BarChart3, LineChart, Leaf, ArrowUpRight, Info, Calendar, CheckCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface MarketViewProps {
  location: LocationData | null;
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const MarketView: React.FC<MarketViewProps> = ({ location, logActivity }) => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [period, setPeriod] = useState('Month');
  const [result, setResult] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const q = isOrganicOnly 
        ? `Certified organic ${query || 'major commodities'}` 
        : query || 'Major agricultural commodities';
      
      const data = await getMarketAnalysis(q, 'All', period, location || undefined, language);
      setResult(data);
      if (logActivity) {
        logActivity('MARKET', `Viewed market insights for ${query || 'commodities'}`, '📈');
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchPrices(); 
  }, [isOrganicOnly, period]);

  // Chart and UI logic remains same, but uses dark mode classes
  return (
    <div className="p-4 pb-32 min-h-screen">
      <header className="mb-6 pt-2 px-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl text-white shadow-lg transition-colors ${isOrganicOnly ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <Store size={22} strokeWidth={2.5} />
          </div>
          {t('nav.market')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Real-time commodity data and forecasting.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && fetchPrices()}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-700 dark:text-white text-sm focus:border-blue-500 transition-colors" 
              placeholder="Search crop markets..." 
            />
          </div>
          <button 
            onClick={fetchPrices} 
            disabled={loading}
            className={`text-white px-5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-md ${isOrganicOnly ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Search"}
          </button>
        </div>
        
        {/* Organic Toggle */}
        <div className={`p-4 rounded-3xl border-2 transition-all duration-500 flex items-center justify-between ${isOrganicOnly ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-all ${isOrganicOnly ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                <Leaf size={18} />
              </div>
              <div>
                <span className={`block font-black text-xs uppercase tracking-tight ${isOrganicOnly ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-500'}`}>
                  Organic Focus Lens
                </span>
              </div>
           </div>
           <button 
             onClick={() => setIsOrganicOnly(!isOrganicOnly)} 
             className={`w-12 h-6 rounded-full transition-all relative ${isOrganicOnly ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
           >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isOrganicOnly ? 'left-7' : 'left-1'}`}></div>
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Loader2 className={`animate-spin ${isOrganicOnly ? 'text-emerald-500' : 'text-blue-500'}`} size={40} />
          <p className="text-xs font-black uppercase tracking-widest animate-pulse">Syncing Indexes...</p>
        </div>
      ) : result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {isOrganicOnly && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden group border border-white/10">
               <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={14} className="text-emerald-300" />
                    <h4 className="font-black text-xs uppercase tracking-widest">Organic Premium Logic</h4>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-50 leading-relaxed max-w-[240px]">
                    Regional analysis shows 15-40% price premiums for certified ecological produce.
                  </p>
               </div>
               <ArrowUpRight size={28} className="text-emerald-300 shrink-0" />
            </div>
          )}
          
          <div className={`bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border transition-all duration-500 ${isOrganicOnly ? 'border-emerald-100 dark:border-emerald-800' : 'border-slate-100 dark:border-slate-700'}`}>
            <div className={`flex items-center gap-2 mb-6 ${isOrganicOnly ? 'text-emerald-600' : 'text-blue-600'}`}>
              <Info size={18} />
              <h3 className="font-black text-xs uppercase tracking-widest">Market Intelligence Report</h3>
            </div>
            <div className={`prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-li:text-slate-600 ${isOrganicOnly ? 'prose-strong:text-emerald-700' : 'prose-strong:text-blue-700'}`}>
               <ReactMarkdown>{result.analysis}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;
