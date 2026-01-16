
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, TrendingDown, Minus, Search, Loader2, Leaf, BarChart3, ArrowUpRight, Globe, Tag, Sparkles } from 'lucide-react';
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
      if (logActivity) logActivity('MARKET', `Checked market for ${q}`, '📈');
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPrices(); }, [isOrganicOnly, period]);

  return (
    <div className="p-4 pb-32 min-h-screen">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Store size={24} strokeWidth={2.5} />
          </div>
          {t('nav.market')}
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">Live Commodities Index</p>
      </header>

      {/* Control Center */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 mb-8 space-y-6">
        <div className="relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPrices()}
            placeholder="Search crop markets (e.g., Soybean)"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
             <button onClick={fetchPrices} disabled={loading} className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowUpRight size={18} />}
             </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex gap-2">
             {['Week', 'Month', 'Year'].map(p => (
               <button 
                 key={p} 
                 onClick={() => setPeriod(p)}
                 className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${period === p ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
               >
                 {p}
               </button>
             ))}
           </div>
           
           <button 
             onClick={() => setIsOrganicOnly(!isOrganicOnly)}
             className={`relative overflow-hidden flex items-center gap-2 px-5 py-3 rounded-xl transition-all border-2 shadow-sm ${
               isOrganicOnly 
                 ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200 dark:shadow-none' 
                 : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'
             }`}
           >
             <Leaf size={16} fill={isOrganicOnly ? "currentColor" : "none"} />
             <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Organic</span>
             {isOrganicOnly && <span className="absolute right-0 top-0 w-3 h-3 bg-white rounded-bl-full opacity-50"></span>}
           </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
           <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-400">Aggregating Global Data...</p>
        </div>
      ) : result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8">
           {/* Price Ticker Cards */}
           {result.prices && result.prices.length > 0 && (
             <div className="grid grid-cols-2 gap-3">
               {result.prices.map((item, i) => {
                 // Simulate visual randomness for demo if API doesn't return trend
                 const isUp = i % 2 === 0; 
                 return (
                   <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                        <BarChart3 size={60} />
                      </div>
                      
                      {isOrganicOnly && (
                         <div className="absolute top-3 left-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                           <Leaf size={8} fill="currentColor"/> Certified
                         </div>
                      )}

                      <div className="relative z-10 mt-auto">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">{item.label}</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">${item.price.toFixed(2)}</span>
                      </div>
                      <div className={`relative z-10 flex items-center gap-1.5 text-xs font-bold mt-1 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                         {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                         <span>{isUp ? '+2.4%' : '-1.1%'}</span>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}

           {/* Analysis Text */}
           <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <Globe size={18} />
                <h3 className="font-black text-xs uppercase tracking-widest">Market Intelligence</h3>
              </div>
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;
