
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, Search, Loader2, BarChart3, LineChart, Leaf, ArrowUpRight, Info, Calendar, CheckCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface MarketViewProps {
  location: LocationData | null;
}

const MarketView: React.FC<MarketViewProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [period, setPeriod] = useState('Month');
  const [result, setResult] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // Prioritize organic data if toggle is active
      const q = isOrganicOnly 
        ? `Certified organic ${query || 'major commodities'}` 
        : query || 'Major agricultural commodities';
      
      const data = await getMarketAnalysis(q, 'All', period, location || undefined, language);
      setResult(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchPrices(); 
  }, [isOrganicOnly, period]);

  const renderChart = (prices: { label: string, price: number }[]) => {
    if (!prices || prices.length < 2) return null;
    
    const max = Math.max(...prices.map(p => p.price));
    const min = Math.min(...prices.map(p => p.price));
    const range = (max - min) || 1;
    const padding = range * 0.2;
    const lower = Math.max(0, min - padding);
    const upper = max + padding;
    const hRange = upper - lower;

    return (
      <div className={`bg-white p-6 rounded-[2.5rem] border transition-all duration-500 shadow-xl mb-6 overflow-hidden relative ${isOrganicOnly ? 'border-emerald-100 shadow-emerald-500/5' : 'border-slate-100'}`}>
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <TrendingUp size={14} className={isOrganicOnly ? "text-emerald-500" : "text-blue-500"} /> 
             {isOrganicOnly ? 'Organic Price Trend' : 'Standard Market Trend'}
           </h4>
           <div className="flex items-center gap-2">
             <div className={`h-2 w-2 rounded-full transition-colors ${isOrganicOnly ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></div>
             <span className="text-[10px] font-black uppercase text-slate-400">
               {isOrganicOnly ? 'Premium Value' : 'Base Value'}
             </span>
           </div>
        </div>
        
        <div className="relative h-40 w-full mb-2">
           <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Gradient Area */}
              <path 
                d={`M0,100 ${prices.map((p, i) => `L${(i / (prices.length - 1)) * 100},${100 - ((p.price - lower) / hRange) * 100}`).join(' ')} L100,100 Z`} 
                fill={isOrganicOnly ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)"} 
                className="transition-all duration-500"
              />
              {/* Main Line */}
              <path 
                d={prices.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / (prices.length - 1)) * 100},${100 - ((p.price - lower) / hRange) * 100}`).join(' ')} 
                fill="none" 
                stroke={isOrganicOnly ? "#10b981" : "#3B82F6"} 
                strokeWidth="3" 
                vectorEffect="non-scaling-stroke" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
              {/* Data points */}
              {prices.map((p, i) => (
                <circle 
                  key={i}
                  cx={(i / (prices.length - 1)) * 100} 
                  cy={100 - ((p.price - lower) / hRange) * 100} 
                  r="1.8"
                  fill="white"
                  stroke={isOrganicOnly ? "#10b981" : "#3B82F6"}
                  strokeWidth="1"
                  className="transition-all duration-500"
                />
              ))}
           </svg>
        </div>
        
        <div className="flex justify-between px-1">
           {prices.map((p, i) => (
             <div key={i} className="flex flex-col items-center">
               <span className="text-[8px] font-black text-slate-300 uppercase mb-1">{p.label}</span>
               <span className={`text-[9px] font-black transition-colors ${isOrganicOnly ? 'text-emerald-600' : 'text-slate-600'}`}>
                 ${p.price.toFixed(1)}
               </span>
             </div>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-32 min-h-screen bg-slate-50">
      <header className="mb-6 pt-2">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl text-white shadow-lg transition-colors ${isOrganicOnly ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <Store size={22} strokeWidth={2.5} />
          </div>
          {t('nav.market')}
        </h2>
        <p className="text-slate-500 text-xs font-medium mt-1">Real-time commodity data and forecasting.</p>
      </header>

      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && fetchPrices()}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 text-sm focus:border-blue-500 transition-colors" 
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
        
        {/* Organic Toggle Section */}
        <div className={`p-4 rounded-3xl border-2 transition-all duration-500 flex items-center justify-between ${isOrganicOnly ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-all ${isOrganicOnly ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                <Leaf size={18} />
              </div>
              <div>
                <span className={`block font-black text-xs uppercase tracking-tight ${isOrganicOnly ? 'text-emerald-900' : 'text-slate-500'}`}>
                  Organic Focus Lens
                </span>
                <span className={`block text-[9px] font-bold ${isOrganicOnly ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isOrganicOnly ? 'Highlighting ecological premiums' : 'Standard wholesale data'}
                </span>
              </div>
           </div>
           <button 
             onClick={() => setIsOrganicOnly(!isOrganicOnly)} 
             className={`w-12 h-6 rounded-full transition-all relative ${isOrganicOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}
           >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isOrganicOnly ? 'left-7' : 'left-1'}`}></div>
           </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400 ml-1" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="flex-1 bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
          >
             <option value="Current">Current Prices</option>
             <option value="Month">Past 30 Days</option>
             <option value="Year">Past 12 Months</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <div className="relative">
            <Loader2 className={`animate-spin ${isOrganicOnly ? 'text-emerald-500' : 'text-blue-500'}`} size={40} />
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp size={16} className={isOrganicOnly ? 'text-emerald-500' : 'text-blue-500'} />
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-widest animate-pulse">Syncing Global Indexes...</p>
        </div>
      ) : result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Organic Premium Banner */}
          {isOrganicOnly && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden group border border-white/10">
               <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-125 transition-transform">
                 <Sparkles size={120} />
               </div>
               <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={14} className="text-emerald-300" />
                    <h4 className="font-black text-xs uppercase tracking-widest">Organic Premium Logic</h4>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-50 leading-relaxed max-w-[240px]">
                    Regional analysis shows 15-40% price premiums for certified ecological produce in your current geo-zone.
                  </p>
               </div>
               <ArrowUpRight size={28} className="text-emerald-300 shrink-0" />
            </div>
          )}

          {/* Visualization Section */}
          {period !== 'Current' && result.prices && renderChart(result.prices)}

          {/* Analysis Content */}
          <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all duration-500 ${isOrganicOnly ? 'border-emerald-100' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 mb-6 ${isOrganicOnly ? 'text-emerald-600' : 'text-blue-600'}`}>
              <Info size={18} />
              <h3 className="font-black text-xs uppercase tracking-widest">Market Intelligence Report</h3>
            </div>
            <div className={`prose prose-sm prose-slate max-w-none prose-headings:font-black prose-li:text-slate-600 ${isOrganicOnly ? 'prose-strong:text-emerald-700' : 'prose-strong:text-blue-700'}`}>
               <ReactMarkdown>{result.analysis}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;
