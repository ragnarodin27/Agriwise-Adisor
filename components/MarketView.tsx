import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getMarketAnalysis, MarketAnalysisResult } from '../services/geminiService';
import { Store, TrendingUp, Search, Loader2 } from 'lucide-react';
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
      if (!prices || prices.length < 2) return null;
      
      const height = 150;
      const width = 100; // Percent
      const maxPrice = Math.max(...prices.map(p => p.price)) * 1.1;
      const minPrice = Math.min(...prices.map(p => p.price)) * 0.9;
      const range = maxPrice - minPrice || 1;
      
      const points = prices.map((p, i) => {
          const x = (i / (prices.length - 1)) * 100;
          const y = 100 - ((p.price - minPrice) / range) * 100;
          return `${x},${y}`;
      }).join(' ');

      return (
          <div className="mb-6 bg-white p-4 rounded-xl border border-blue-50">
             <h4 className="text-sm font-bold text-gray-700 mb-4">Price Trend</h4>
             <div className="relative h-40 w-full">
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                     {/* Grid lines */}
                     <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="0.5" />
                     <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
                     <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" strokeWidth="0.5" />
                     
                     {/* Line */}
                     <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                     
                     {/* Points */}
                     {prices.map((p, i) => {
                         const x = (i / (prices.length - 1)) * 100;
                         const y = 100 - ((p.price - minPrice) / range) * 100;
                         return (
                             <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" className="hover:r-5 transition-all" />
                         );
                     })}
                 </svg>
                 {/* Labels */}
                 <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                     {prices.map((p, i) => (
                         <div key={i} className="text-center" style={{ width: `${100/prices.length}%` }}>
                             <span className="block truncate">{p.label}</span>
                             <span className="font-bold text-blue-600">{p.price}</span>
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