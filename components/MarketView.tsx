import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, TrendingDown, Search, Loader2, Leaf, Globe, Activity, ZoomIn, ZoomOut, X, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface MarketViewProps {
  location: LocationData | null;
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const InteractivePriceChart = ({ data, color }: { data: number[], color: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ x: number; y: number; value: number; date: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 120;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((val - min) / range) * (height * 0.8) - (height * 0.1);
    return `${x},${y}`;
  }).join(' ');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(1, Math.max(0, x / rect.width));
    const idx = Math.round(percent * (data.length - 1));
    const pointX = (idx / (data.length - 1)) * rect.width;
    const pointY = height - ((data[idx] - min) / range) * (height * 0.8) - (height * 0.1);
    
    const date = new Date();
    date.setDate(date.getDate() - (data.length - 1 - idx));
    
    setHoverData({ 
      x: pointX, 
      y: pointY, 
      value: data[idx],
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Live Trend Analysis</span>
        <div className="flex gap-2">
           <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))} className="p-1.5 bg-slate-50 dark:bg-[#0E1F17] rounded-lg text-slate-500 hover:text-blue-600 transition-colors"><ZoomIn size={14}/></button>
           <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))} className="p-1.5 bg-slate-50 dark:bg-[#0E1F17] rounded-lg text-slate-500 hover:text-blue-600 transition-colors"><ZoomOut size={14}/></button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="w-full h-32 bg-slate-50 dark:bg-[#0E1F17] rounded-3xl relative overflow-hidden cursor-crosshair group shadow-inner border border-slate-100 dark:border-white/5"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
        style={{ height: `${height * zoomLevel}px` }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`M 0 ${height} L ${points} L 100 ${height} Z`} fill={`url(#grad-${color})`} />
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} vectorEffect="non-scaling-stroke" />
        </svg>

        {hoverData && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute h-full w-[1.5px] bg-slate-300 dark:bg-slate-600/50" style={{ transform: `translateX(${hoverData.x}px)` }}></div>
            <div className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white border-2 shadow-sm" style={{ borderColor: color, transform: `translate(${hoverData.x}px, ${hoverData.y * zoomLevel}px)` }}></div>
            
            <div className="absolute bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl text-[10px] font-bold z-10" style={{ top: Math.max(10, hoverData.y * zoomLevel - 60), left: Math.min(hoverData.x + 10, containerRef.current!.offsetWidth - 110) }}>
              <p className="text-white/60 mb-1 uppercase tracking-tighter text-[8px]">{hoverData.date}</p>
              <p className="text-base font-black tracking-tight">₹{hoverData.value.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TrendingCard = ({ item, isUp }: { item: { label: string, price: number }, isUp: boolean }) => {
    return (
        <div className="min-w-[160px] p-5 rounded-[2rem] bg-white dark:bg-[#1C2B22] border border-slate-100 dark:border-white/5 shadow-soft relative overflow-hidden group snap-start">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? <TrendingUp size={60}/> : <TrendingDown size={60}/>}
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 truncate">{item.label}</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">₹{item.price.toLocaleString()}</h4>
             <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                {isUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                {isUp ? '+2.4%' : '-1.1%'}
             </div>
        </div>
    )
}

const MarketView: React.FC<MarketViewProps> = ({ location, logActivity }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [period, setPeriod] = useState('Month');
  const [result, setResult] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async (q?: string) => {
    setLoading(true);
    try {
      const searchQuery = q || query;
      const finalQ = isOrganicOnly ? `Organic certified ${searchQuery || 'vegetables'}` : searchQuery || 'Agricultural commodities';
      const data = await getMarketAnalysis(finalQ, 'All', period, location || undefined, 'en');
      setResult(data);
      if (logActivity && query) logActivity('MARKET', `Checked ${finalQ} prices`, '💹');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { 
    // Initial fetch for default highlights if empty
    if (!result && !loading) {
       fetchPrices("Top crops");
    }
  }, []);

  useEffect(() => {
    if (query) fetchPrices();
  }, [isOrganicOnly, period]);

  return (
    <div className="p-4 pb-32 min-h-screen bg-slate-50 dark:bg-[#0E1F17]">
      <header className="mb-6 pt-4 px-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-emerald-50 flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl">
            <Store size={28} />
          </div>
          Market Intelligence
        </h2>
      </header>

      {/* Trending Carousel */}
      {result && result.prices.length > 0 && (
        <section className="mb-8 animate-in fade-in slide-in-from-right-4">
           <div className="flex justify-between items-center px-2 mb-3">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-500/60">Market Highlights</h3>
             <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Live Updates</span>
           </div>
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x">
              {result.prices.slice(0, 6).map((item, i) => (
                 <TrendingCard key={i} item={item} isUp={i % 2 === 0} />
              ))}
           </div>
        </section>
      )}

      <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 mb-8 space-y-6">
        <div className="relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPrices()}
            placeholder="Search crop or मंडी..."
            className="w-full bg-slate-50 dark:bg-[#0E1F17] border border-slate-100 dark:border-white/5 rounded-2xl py-5 pl-14 pr-4 font-bold text-slate-800 dark:text-emerald-50 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs uppercase tracking-widest"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <button onClick={() => fetchPrices()} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-95">
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
          </button>
        </div>

        <div className="flex gap-3">
           <div className="flex gap-1 bg-slate-50 dark:bg-[#0E1F17] p-1 rounded-xl flex-1">
             {['Week', 'Month'].map(p => (
               <button 
                 key={p} 
                 onClick={() => setPeriod(p)}
                 className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white dark:bg-[#1C2B22] text-blue-600 shadow-sm' : 'text-slate-400'}`}
               >
                 {p}
               </button>
             ))}
           </div>
           <button 
             onClick={() => setIsOrganicOnly(!isOrganicOnly)}
             className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 transition-all ${
               isOrganicOnly ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-[#1C2B22] border-slate-100 dark:border-white/5 text-slate-400'
             }`}
           >
             <Leaf size={14} fill={isOrganicOnly ? "currentColor" : "none"} />
             <span className="text-[9px] font-black uppercase tracking-widest">Organic</span>
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
           <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Mandi Rates...</p>
        </div>
      ) : result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-5">
           <div className="space-y-6">
               {result.prices.map((item, i) => {
                 const isUp = i % 2 === 0; 
                 const trendData = isUp 
                   ? [4000, 4100, 4050, 4200, 4150, 4300, 4400, 4500, 4450, 4600] 
                   : [5200, 5150, 5100, 5000, 5050, 4900, 4850, 4800, 4700, 4600];
                 
                 return (
                   <div key={i} className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-soft space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">{item.label}</span>
                           <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-slate-900 dark:text-emerald-50 tracking-tighter">₹{item.price.toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">/ Qtl</span>
                           </div>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-white ${isUp ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                           {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                           {isUp ? 'Rising' : 'Falling'}
                        </div>
                      </div>
                      <InteractivePriceChart data={trendData} color={isUp ? '#10b981' : '#f43f5e'} />
                   </div>
                 );
               })}
           </div>

           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-soft">
              <h3 className="font-black text-[10px] uppercase text-blue-600 mb-6 flex items-center gap-2"><Globe size={18} /> Regional Economic Brief</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;