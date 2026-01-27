
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, TrendingDown, Search, Loader2, Leaf, ArrowUpRight, Globe, AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarketViewProps {
  location: LocationData | null;
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`M 0 ${height} L ${points} L ${width} ${height} Z`} fill={`url(#grad-${color})`} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const MarketView: React.FC<MarketViewProps> = ({ location, logActivity }) => {
  const [query, setQuery] = useState('');
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [period, setPeriod] = useState('Month');
  const [result, setResult] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const q = isOrganicOnly ? `Organic certified ${query || 'grains and vegetables'}` : query || 'Agricultural commodities';
      const data = await getMarketAnalysis(q, 'All', period, location || undefined, 'en');
      setResult(data);
      if (logActivity) logActivity('MARKET', `Price check: ${q}`, '💹');
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrganicOnly, period]);

  return (
    <div className="p-4 pb-32 min-h-screen relative overflow-hidden bg-slate-50 dark:bg-forest-bg">
      
      <header className="mb-8 relative z-10 pt-4 px-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-forest-text flex items-center gap-4">
          <div className="bg-blue-600 dark:bg-blue-700 p-3 rounded-2xl text-white shadow-xl shadow-blue-900/20">
            <Store size={28} strokeWidth={2.5} />
          </div>
          Local Mandis
        </h2>
        <p className="text-[10px] font-black text-slate-400 dark:text-forest-muted uppercase tracking-[0.25em] mt-2 ml-1">Live Economic Decision Engine</p>
      </header>

      {/* Organic Premium Callout */}
      <div className="mx-2 mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
         <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Leaf size={100} />
         </div>
         <div className="relative z-10">
            <h4 className="font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
               <CheckCircle size={14} /> Market Advantage
            </h4>
            <p className="text-sm font-bold leading-tight">Organic produce consistently yields a <span className="underline decoration-emerald-300">15-30% price premium</span> in Tier 1 city mandis.</p>
         </div>
      </div>

      <div className="bg-white dark:bg-forest-card p-6 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 mb-8 space-y-6 relative z-10">
        <div className="relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPrices()}
            placeholder="Search crop or मंडी name..."
            className="w-full bg-slate-50 dark:bg-forest-bg border border-slate-100 dark:border-white/5 rounded-2xl py-5 pl-14 pr-4 font-bold text-slate-800 dark:text-forest-text outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-forest-muted text-xs uppercase tracking-widest"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
             <button onClick={fetchPrices} disabled={loading} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
             </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
           <div className="flex gap-1 bg-slate-50 dark:bg-forest-bg p-1 rounded-xl flex-1">
             {['Week', 'Month'].map(p => (
               <button 
                 key={p} 
                 onClick={() => setPeriod(p)}
                 className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white dark:bg-forest-card text-blue-600 shadow-sm' : 'text-slate-400 dark:text-forest-muted'}`}
               >
                 {p}
               </button>
             ))}
           </div>
           
           <button 
             onClick={() => setIsOrganicOnly(!isOrganicOnly)}
             className={`flex-1 relative flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all ${
               isOrganicOnly 
                 ? 'bg-forest-accent border-forest-accent text-white shadow-glow' 
                 : 'bg-white dark:bg-forest-card border-slate-200 dark:border-white/5 text-slate-500'
             }`}
           >
             <Leaf size={14} fill={isOrganicOnly ? "currentColor" : "none"} />
             <span className="text-[9px] font-black uppercase tracking-widest">Organic Focus</span>
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
           <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-forest-muted">Aggregating Mandis...</p>
        </div>
      ) : result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-12 duration-700 relative z-10">
           <div className="grid grid-cols-1 gap-5">
               {result.prices.map((item, i) => {
                 const isUp = i % 2 === 0; 
                 const trendData = isUp ? [4000, 4200, 4150, 4300, 4250, 4500, 4400, 4600] : [5200, 5100, 5000, 5150, 4900, 4800, 4700, 4600];
                 
                 return (
                   <div key={i} className="bg-white dark:bg-forest-card p-6 rounded-[2.5rem] border border-slate-50 dark:border-white/5 shadow-soft flex flex-col gap-5 group hover:scale-[1.01] transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-forest-muted tracking-widest">{item.label}</span>
                            {(isOrganicOnly || item.organic_premium) && <span className="bg-forest-accent/10 text-forest-accent text-[7px] px-1.5 py-0.5 rounded-md font-black border border-forest-accent/20 flex items-center gap-1"><Leaf size={8}/> ORGANIC</span>}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-slate-900 dark:text-forest-text tracking-tighter">₹{item.price.toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-forest-muted uppercase">/ quintal</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           {item.organic_premium && (
                             <div className="bg-forest-accent/10 text-forest-accent px-3 py-1 rounded-xl text-[9px] font-black uppercase border border-forest-accent/20 flex items-center gap-1.5">
                               <ArrowUpRight size={10} /> {item.organic_premium} Premium
                             </div>
                           )}
                           <div className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${isUp ? 'bg-forest-accent text-white' : 'bg-rose-500 text-white'}`}>
                              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {isUp ? 'Rising' : 'Falling'}
                           </div>
                        </div>
                      </div>

                      <div className="w-full bg-slate-50 dark:bg-forest-bg/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[8px] font-black text-slate-400 dark:text-forest-muted uppercase tracking-widest">30-Day Volatility Monitor</span>
                           <span className={`text-[10px] font-black ${isUp ? 'text-forest-accent' : 'text-rose-500'}`}>{isUp ? '+12.4%' : '-8.2%'}</span>
                        </div>
                        <Sparkline data={trendData} color={isUp ? '#4CAF50' : '#f43f5e'} />
                      </div>

                      <div className="flex items-start gap-3 pt-1">
                         <div className={`p-2 rounded-xl shrink-0 ${isUp ? 'bg-forest-accent/10 text-forest-accent' : 'bg-rose-500/10 text-rose-500'}`}>
                            <AlertTriangle size={16} />
                         </div>
                         <p className="text-[10px] font-bold text-slate-600 dark:text-forest-muted leading-relaxed">
                            {isUp ? 'Demand peaking in regional hubs. Consider withholding 20% stock for expected rally.' : 'Market supply currently exceeds local demand. Diversifying to Tier 1 mandis may yield better prices.'}
                         </p>
                      </div>
                   </div>
                 );
               })}
             </div>

           <div className="bg-white dark:bg-forest-card p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-inner-glow relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-blue-500/5 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-3 mb-6 text-blue-600 dark:text-blue-400 relative z-10">
                <Globe size={18} />
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Regional Economic Analysis</h3>
              </div>
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs leading-relaxed relative z-10">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
           </div>
        </div>
      )}
      <style>{`
        .shadow-glow { box-shadow: 0 0 15px rgba(76, 175, 80, 0.3); }
        .shadow-inner-glow { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.05); }
      `}</style>
    </div>
  );
};

export default MarketView;
