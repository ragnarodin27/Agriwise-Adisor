
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, Search, Loader2, BarChart3, LineChart, ArrowUpRight, ArrowDownRight, Info, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface MarketViewProps {
  location: LocationData | null;
}

const MarketView: React.FC<MarketViewProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [period, setPeriod] = useState('Current');
  const [result, setResult] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const fetchPrices = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await getMarketAnalysis(
        query || "Major agricultural commodities",
        category,
        period,
        location || undefined,
        language
      );
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ analysis: "Unable to fetch market data at this time.", prices: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [language]);

  const renderChart = (prices: { label: string, price: number }[]) => {
      if (!prices || prices.length < 2) {
          return (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 text-center mb-6">
                  <BarChart3 className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Historical data pending for this commodity</p>
              </div>
          );
      }
      
      const maxPrice = Math.max(...prices.map(p => p.price));
      const minPrice = Math.min(...prices.map(p => p.price));
      const rangeVal = maxPrice - minPrice;
      // Pad top and bottom to avoid lines hitting the edges
      const padding = rangeVal === 0 ? (maxPrice || 10) : rangeVal * 0.2;
      const upperBound = maxPrice + padding;
      const lowerBound = Math.max(0, minPrice - padding);
      const range = upperBound - lowerBound || 1;

      return (
          <div className="mb-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex justify-between items-start mb-8">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar size={14} className="text-blue-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Movement</h4>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Price Fluctuations</h3>
                 </div>
                 <div className="flex bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1.5 gap-1.5 border border-slate-200/50">
                     <button 
                       onClick={() => setChartType('line')}
                       className={`p-2 rounded-xl transition-all duration-300 ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                         <LineChart size={20} />
                     </button>
                     <button 
                       onClick={() => setChartType('bar')}
                       className={`p-2 rounded-xl transition-all duration-300 ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                         <BarChart3 size={20} />
                     </button>
                 </div>
             </div>
             
             <div className="relative h-64 w-full pl-10 pb-10">
                  {/* Y-Axis Labels */}
                  <div className="absolute left-0 top-0 bottom-10 w-8 flex flex-col justify-between text-[9px] text-slate-400 font-black text-right pr-3 border-r border-slate-100/50">
                      <span>{Math.round(upperBound)}</span>
                      <span className="opacity-40">{Math.round(lowerBound + range * 0.75)}</span>
                      <span>{Math.round(lowerBound + range * 0.5)}</span>
                      <span className="opacity-40">{Math.round(lowerBound + range * 0.25)}</span>
                      <span>{Math.round(lowerBound)}</span>
                  </div>

                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                     {/* Horizontal Grid lines */}
                     {[0, 25, 50, 75, 100].map(y => (
                         <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f8fafc" strokeWidth="1" />
                     ))}

                     {chartType === 'line' ? (
                         <>
                             <defs>
                                 <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                                     <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                 </linearGradient>
                             </defs>
                             {/* Area Fill */}
                             <path 
                                d={`M0,100 ${prices.map((p, i) => {
                                    const x = (i / (prices.length - 1)) * 100;
                                    const y = 100 - ((p.price - lowerBound) / range) * 100;
                                    return `L${x},${y}`;
                                }).join(' ')} L100,100 Z`}
                                fill="url(#chartGradient)"
                                className="animate-in fade-in duration-1000"
                             />
                             {/* Path Line */}
                             <path 
                                d={prices.map((p, i) => {
                                    const count = prices.length - 1 || 1;
                                    const x = (i / count) * 100;
                                    const y = 100 - ((p.price - lowerBound) / range) * 100;
                                    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                                }).join(' ')}
                                fill="none" 
                                stroke="#3B82F6" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                className="animate-in slide-in-from-left-4 duration-1000"
                             />
                              {/* Points */}
                              {prices.map((p, i) => {
                                  const count = prices.length - 1 || 1;
                                  const x = (i / count) * 100;
                                  const y = 100 - ((p.price - lowerBound) / range) * 100;
                                  return (
                                      <g key={i}>
                                        <circle cx={x} cy={y} r="2.5" fill="#3B82F6" stroke="white" strokeWidth="1.5" />
                                      </g>
                                  );
                              })}
                         </>
                     ) : (
                         prices.map((p, i) => {
                             const barWidth = 60 / prices.length;
                             const xCenter = (i / prices.length) * 100 + (100 / prices.length) / 2;
                             const y = 100 - ((p.price - lowerBound) / range) * 100;
                             const barHeight = 100 - y;
                             return (
                                 <rect 
                                    key={i} 
                                    x={xCenter - barWidth/2} 
                                    y={y} 
                                    width={barWidth} 
                                    height={barHeight} 
                                    fill={i === prices.length - 1 ? "#2563EB" : "#3B82F6"} 
                                    rx="2" 
                                    className="animate-in slide-in-from-bottom-4 duration-500" 
                                    style={{ animationDelay: `${i * 80}ms` }} 
                                 />
                             );
                         })
                     )}
                 </svg>

                 {/* X-Axis Labels */}
                 <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[8px] text-slate-400 pt-4 border-t border-slate-100/50 font-black uppercase tracking-tight">
                     {prices.map((p, i) => (
                         <div key={i} className="text-center truncate px-0.5" style={{ width: `${100/prices.length}%` }}>
                             {p.label}
                         </div>
                     ))}
                 </div>
             </div>
             
             {/* Key Metrics Summary */}
             <div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-50 pt-6">
                <div className="bg-emerald-50/50 p-3 rounded-2xl flex items-center gap-3 border border-emerald-100/50">
                    <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                        <ArrowUpRight size={16} strokeWidth={3} />
                    </div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ceiling</span>
                        <span className="text-sm font-black text-emerald-800">{Math.round(maxPrice).toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-2xl flex items-center gap-3 border border-rose-100/50">
                    <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm">
                        <ArrowDownRight size={16} strokeWidth={3} />
                    </div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Floor</span>
                        <span className="text-sm font-black text-rose-800">{Math.round(minPrice).toLocaleString()}</span>
                    </div>
                </div>
             </div>
          </div>
      );
  };

  return (
    <div className="p-4 pb-32 min-h-screen bg-slate-50">
       <header className="mb-6 pt-2">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Store size={22} strokeWidth={2.5} />
          </div>
          {t('nav.market')}
        </h2>
        <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Real-time commodity intelligence</p>
      </header>

      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 space-y-4">
        <div className="flex gap-2">
            <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Search e.g., Wheat, Soybeans..."
                />
            </div>
            <button 
              onClick={fetchPrices}
              disabled={loading}
              className="bg-blue-600 text-white px-5 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100"
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : "Analyze"}
            </button>
        </div>
        
        <div className="flex gap-3">
            <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 p-3 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
                <option value="All">All Categories</option>
                <option value="Grains & Cereals">Grains</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Livestock">Livestock</option>
            </select>
            <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex-1 p-3 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
                <option value="Current">Current</option>
                <option value="Month">Month Trend</option>
                <option value="Year">Yearly View</option>
            </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-5">
          <div className="relative">
             <Loader2 className="animate-spin text-blue-500" size={48} />
             <div className="absolute inset-0 bg-blue-500/10 blur-xl animate-pulse rounded-full"></div>
          </div>
          <div className="text-center">
             <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">Querying Global Markets</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-referencing live price data...</p>
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-6">
           {period !== 'Current' && result.prices.length > 0 && renderChart(result.prices)}

           <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-5 text-blue-900 font-black uppercase tracking-widest text-[10px] bg-blue-50 w-fit px-4 py-1.5 rounded-full border border-blue-100">
                    <TrendingUp size={14} className="animate-bounce" /> Expert Market Sentiment
                </div>
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-strong:text-slate-900 prose-headings:text-slate-900">
                    <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>
                
                {result.prices.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-50">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detailed Price Index</h5>
                        <div className="space-y-3">
                            {result.prices.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-black text-slate-700">{p.label}</span>
                                    <span className="text-sm font-black text-blue-600">{Math.round(p.price).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
           </div>
           
           <div className="bg-blue-600 rounded-[2rem] p-6 text-white flex items-center gap-4 shadow-xl shadow-blue-200">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                    <Info size={24} />
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Market Advisory</h4>
                    <p className="text-xs font-medium text-blue-50 leading-tight mt-1">Insights are generated via real-time research grounding of global commodity reports.</p>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;
