import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, Search, Loader2, BarChart3, LineChart } from 'lucide-react';
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
        query,
        category,
        period,
        location || undefined,
        language
      );
      setResult(data);
    } catch (e) {
      console.error(e);
      // Fallback
      setResult({ analysis: "Unable to fetch market data at this time.", prices: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const renderChart = (prices: { label: string, price: number }[]) => {
      if (!prices || prices.length === 0) return null;
      
      const maxPrice = Math.max(...prices.map(p => p.price));
      const minPrice = Math.min(...prices.map(p => p.price));
      // Add padding to range to prevent flat lines at top/bottom
      const padding = (maxPrice - minPrice) * 0.1 || (maxPrice > 0 ? maxPrice * 0.1 : 10);
      const upperBound = maxPrice + padding;
      const lowerBound = Math.max(0, minPrice - padding);
      const range = upperBound - lowerBound;

      return (
          <div className="mb-6 bg-white p-5 rounded-xl border border-blue-100 shadow-sm animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
                 <div>
                    <h4 className="text-sm font-bold text-gray-800">Price Movement</h4>
                    <p className="text-xs text-gray-500">Historical trend for {period.toLowerCase()}</p>
                 </div>
                 <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                     <button 
                       onClick={() => setChartType('line')}
                       className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                       title="Line Chart"
                     >
                         <LineChart size={16} />
                     </button>
                     <button 
                       onClick={() => setChartType('bar')}
                       className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                       title="Bar Chart"
                     >
                         <BarChart3 size={16} />
                     </button>
                 </div>
             </div>
             
             <div className="relative h-56 w-full pl-8 pb-6">
                  {/* Y-Axis Labels */}
                  <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400 py-1 font-medium text-right pr-2 border-r border-gray-100">
                      <span>{Math.round(upperBound)}</span>
                      <span>{Math.round(lowerBound + range * 0.75)}</span>
                      <span>{Math.round(lowerBound + range * 0.5)}</span>
                      <span>{Math.round(lowerBound + range * 0.25)}</span>
                      <span>{Math.round(lowerBound)}</span>
                  </div>

                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                     {/* Horizontal Grid lines */}
                     {[0, 25, 50, 75, 100].map(y => (
                         <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2 2" />
                     ))}

                     {chartType === 'line' ? (
                         <>
                             <defs>
                                 <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                                     <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                 </linearGradient>
                             </defs>
                             
                             {prices.length > 1 && (
                                 <path 
                                    d={`M0,100 ${prices.map((p, i) => {
                                        const x = (i / (prices.length - 1)) * 100;
                                        const y = 100 - ((p.price - lowerBound) / range) * 100;
                                        return `L${x},${y}`;
                                    }).join(' ')} L100,100 Z`}
                                    fill="url(#chartGradient)"
                                 />
                             )}

                             <polyline 
                                points={prices.map((p, i) => {
                                    const count = prices.length > 1 ? prices.length - 1 : 1;
                                    const x = (i / count) * 100;
                                    const y = 100 - ((p.price - lowerBound) / range) * 100;
                                    return `${x},${y}`;
                                }).join(' ')} 
                                fill="none" 
                                stroke="#3B82F6" 
                                strokeWidth="2" 
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                             />
                             
                              {prices.map((p, i) => {
                                  const count = prices.length > 1 ? prices.length - 1 : 1;
                                  const x = (i / count) * 100;
                                  const y = 100 - ((p.price - lowerBound) / range) * 100;
                                  return (
                                      <g key={i} className="group">
                                          <circle cx={x} cy={y} r="3" fill="#3B82F6" stroke="white" strokeWidth="2" className="group-hover:r-5 transition-all cursor-pointer shadow-sm" />
                                          <rect x={x - 10} y={y - 15} width="20" height="10" fill="transparent" /> {/* Hit area */}
                                          {/* Tooltip */}
                                          <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                              <rect x={x - 15} y={y - 25} width="30" height="16" rx="4" fill="#1e293b" />
                                              <text x={x} y={y - 14} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{p.price}</text>
                                          </g>
                                      </g>
                                  );
                              })}
                         </>
                     ) : (
                         // Bar Chart
                         prices.map((p, i) => {
                             const barWidth = Math.min(10, 80 / prices.length); // Limit width
                             const xCenter = (i / prices.length) * 100 + (100 / prices.length) / 2;
                             const y = 100 - ((p.price - lowerBound) / range) * 100;
                             const barHeight = 100 - y;
                             
                             return (
                                 <g key={i} className="group">
                                    <rect 
                                        x={xCenter - barWidth/2}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        fill="#3B82F6"
                                        rx="1"
                                        className="group-hover:fill-blue-600 transition-colors cursor-pointer"
                                    />
                                    {/* Tooltip */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <rect x={xCenter - 15} y={y - 20} width="30" height="16" rx="4" fill="#1e293b" />
                                        <text x={xCenter} y={y - 9} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{p.price}</text>
                                    </g>
                                 </g>
                             );
                         })
                     )}
                 </svg>

                 {/* X-Axis Labels */}
                 <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                     {prices.map((p, i) => (
                         <div key={i} className="text-center truncate px-0.5" style={{ width: `${100/prices.length}%` }}>
                             {p.label}
                         </div>
                     ))}
                 </div>
             </div>
          </div>
      );
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
       <header className="mb-6">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Store size={24} className="text-blue-700" />
          </div>
          {t('nav.market')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Real-time pricing and trends.</p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-3">
        <div className="flex gap-2">
            <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg outline-none text-gray-700 text-sm focus:border-blue-500"
            placeholder="Search specific crop..."
            />
            <button 
            onClick={fetchPrices}
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Search size={20} />}
            </button>
        </div>
        
        <div className="flex gap-2">
            <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 outline-none"
            >
                <option value="All">All Categories</option>
                <option value="Grains & Cereals">Grains</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Pulses">Pulses</option>
            </select>
            <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 outline-none"
            >
                <option value="Current">Current Price</option>
                <option value="Month">1 Month Trend</option>
                <option value="Year">1 Year Trend</option>
            </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm">Scanning market reports...</p>
        </div>
      )}

      {!loading && result && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-50 animate-in fade-in">
           {period !== 'Current' && result.prices.length > 0 && renderChart(result.prices)}

           <div className="flex items-center gap-2 mb-4 text-blue-800 font-semibold border-b border-blue-100 pb-2">
              <TrendingUp size={18} />
              <span>Report Analysis</span>
           </div>
           <div className="prose prose-sm prose-blue max-w-none">
             <ReactMarkdown>{result.analysis}</ReactMarkdown>
           </div>
           <div className="mt-4 text-xs text-gray-400 text-center">
             Data provided by AI analysis of public web sources. Verify with local traders.
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;