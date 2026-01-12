
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { planCropStrategy, CropPlanResult } from '../services/geminiService';
import { Sprout, ListFilter, Loader2, AlertCircle, RotateCw, HeartHandshake, Calendar as CalendarIcon, Leaf, Check, Search, ArrowRight, XCircle, CheckCircle, Sun, Shield, DollarSign, Zap, UserCheck, TrendingUp, Archive, X, Droplets, Bug, Scale, Flower, Clock, ArrowDown, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface CropRecommenderProps {
  location: LocationData | null;
}

type Mode = 'recommend' | 'rotation' | 'companion' | 'calendar';

const FILTER_OPTIONS = [
    { label: 'Drought Tolerant', icon: Sun, color: 'text-orange-500' },
    { label: 'Pest Resistant', icon: Shield, color: 'text-red-500' },
    { label: 'High Market Demand', icon: DollarSign, color: 'text-green-600' },
    { label: 'Short Growing Cycle', icon: Zap, color: 'text-yellow-500' },
    { label: 'Nitrogen Fixing', icon: Sprout, color: 'text-emerald-500' },
    { label: 'Low Maintenance', icon: UserCheck, color: 'text-blue-500' },
    { label: 'High Yield', icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Storage Friendly', icon: Archive, color: 'text-amber-600' },
];

const CropRecommender: React.FC<CropRecommenderProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('recommend');
  const [soilType, setSoilType] = useState('Loam');
  const [cropInput, setCropInput] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [result, setResult] = useState<CropPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedSoil = localStorage.getItem('agriwise_pref_soil');
    const savedFilters = localStorage.getItem('agriwise_pref_filters');
    
    if (savedSoil) setSoilType(savedSoil);
    if (savedFilters) {
        try {
            setFilters(JSON.parse(savedFilters));
        } catch (e) {
            console.error("Failed to load filters from storage", e);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agriwise_pref_soil', soilType);
  }, [soilType]);

  useEffect(() => {
    localStorage.setItem('agriwise_pref_filters', JSON.stringify(filters));
  }, [filters]);

  const toggleFilter = (filter: string) => {
    setFilters(prev => 
        prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
      setFilters([]);
  };

  const handlePlan = async () => {
    if (!location) {
        setError("Location is required to analyze climate data.");
        return;
    }
    
    if ((mode === 'companion' || mode === 'calendar') && !cropInput.trim()) {
        setError("Please enter a crop name for this feature.");
        return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const advice = await planCropStrategy({ 
          mode, 
          soilType, 
          filters,
          cropInput 
      }, location, language);
      setResult(advice);
    } catch (err) {
      setError("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
      { id: 'recommend', label: 'Suggest', icon: Leaf },
      { id: 'rotation', label: 'Rotation', icon: RotateCw },
      { id: 'companion', label: 'Companion', icon: HeartHandshake },
      { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  ];

  return (
    <div className="p-4 pb-24 min-h-screen bg-green-50/50">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg">
            <Sprout size={24} className="text-green-700" />
          </div>
          {t('nav.plan')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Expert planning based on your saved preferences and local climate.</p>
      </header>

      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-green-100 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = mode === tab.id;
              return (
                  <button
                    key={tab.id}
                    onClick={() => { setMode(tab.id as Mode); setResult(null); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        isActive 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-green-50'
                    }`}
                  >
                      <Icon size={16} /> {tab.label}
                  </button>
              );
          })}
      </div>

      <div className="space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100 space-y-4">
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type (Saved)</label>
             <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white transition-all"
             >
                <option value="Loam">Loam (Balanced)</option>
                <option value="Sandy">Sandy (Drains fast)</option>
                <option value="Clay">Clay (Holds water)</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay Loam">Clay Loam</option>
                <option value="Silt">Silt</option>
             </select>
           </div>

           {mode === 'recommend' && (
               <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListFilter size={18} className="text-green-600" /> 
                        Preferred Traits
                    </div>
                    {filters.length > 0 && (
                        <button onClick={clearFilters} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                            <X size={12}/> Clear
                        </button>
                    )}
                </label>
                <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.map((opt) => {
                        const isSelected = filters.includes(opt.label);
                        const Icon = opt.icon;
                        return (
                            <button
                                key={opt.label}
                                onClick={() => toggleFilter(opt.label)}
                                className={`
                                    group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                                    ${isSelected
                                        ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                                    }
                                `}
                            >
                                <Icon 
                                    size={14} 
                                    className={isSelected ? 'text-white' : opt.color} 
                                />
                                {opt.label}
                                {isSelected && (
                                    <Check size={12} className="ml-1 text-white" strokeWidth={3} />
                                )}
                            </button>
                        );
                    })}
                </div>
               </div>
           )}

           {mode !== 'recommend' && (
               <div className="animate-in fade-in slide-in-from-top-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                       {mode === 'rotation' ? 'Current / Previous Crop' : 'Target Crop(s)'}
                   </label>
                   <input 
                      type="text"
                      value={cropInput}
                      onChange={(e) => setCropInput(e.target.value)}
                      placeholder={mode === 'calendar' ? "e.g., Tomatoes, Peppers, Lettuce" : "e.g., Corn (Maize)"}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                   />
               </div>
           )}
        </div>

        {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
        )}

        <button
            onClick={handlePlan}
            disabled={loading || !location}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
              loading || !location ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" /> Analyzing Suitability...
              </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    {mode === 'calendar' ? <Search size={18}/> : null}
                    {mode === 'recommend' && "Calculate Best Crops"}
                    {mode === 'rotation' && "Generate Plan"}
                    {mode === 'companion' && "Find Partners"}
                    {mode === 'calendar' && "Planting Schedule"}
                </span>
            )}
        </button>

        {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                
                {mode === 'recommend' && result.recommendations && (
                    <div className="grid grid-cols-1 gap-4">
                        {result.recommendations.map((rec, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-green-100 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-green-400 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Sprout size={80} />
                                </div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="flex flex-col">
                                        <h4 className="font-black text-slate-900 text-xl flex items-center gap-2">
                                            {rec.name}
                                        </h4>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1 w-fit">
                                            {rec.match_score}% Climate Match
                                        </span>
                                    </div>
                                    <div className="bg-green-600 text-white p-2 rounded-xl">
                                        <Leaf size={20}/>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 z-10">
                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                        "{rec.key_benefit}"
                                    </p>
                                </div>
                                {rec.harvest_window && (
                                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 mt-1 z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                                                <Clock size={16} className="text-emerald-600" />
                                                Harvest Timeline
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-600 bg-white px-2 py-1 rounded-md shadow-xs border border-emerald-100">
                                                EST: {rec.harvest_window}
                                            </span>
                                        </div>
                                        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-bold uppercase">
                                            <span>Planting</span>
                                            <span className="text-emerald-600">Maturity Window</span>
                                            <span>Harvest</span>
                                        </div>
                                        {rec.maturity_days && (
                                            <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                                <Zap size={10}/> Cycle: ~{rec.maturity_days} days from sowing to peak yield.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {mode === 'rotation' && result.rotation_plan && (
                    <div className="bg-white p-5 rounded-[2rem] border border-green-100 shadow-xl shadow-green-900/5">
                        <h4 className="font-black text-gray-800 mb-6 flex items-center gap-3 uppercase tracking-widest text-sm">
                            <RotateCw size={18} className="text-green-600 animate-spin-slow"/> 
                            Visual Rotation Cycle
                        </h4>
                        
                        <div className="relative space-y-0 pl-4 border-l-2 border-dashed border-green-200 ml-4 mb-6">
                            {result.rotation_plan.map((step, idx) => (
                                <div key={idx} className="relative pb-8 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                    {/* Timeline Node */}
                                    <div className="absolute -left-[25px] top-0 w-10 h-10 bg-white rounded-full border-4 border-green-100 flex items-center justify-center shadow-md z-10">
                                        <div className="bg-green-600 w-4 h-4 rounded-full"></div>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-inner group hover:bg-white hover:border-green-300 transition-all cursor-default">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                                            <div>
                                                <span className="text-[10px] font-black text-green-700 bg-green-100/50 px-2 py-1 rounded-lg uppercase tracking-wider">{step.period}</span>
                                                <h5 className="font-black text-slate-800 text-lg mt-1 tracking-tight">{step.crop}</h5>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {step.nutrient_impact && (
                                                    <div className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-black border border-blue-100">
                                                        <Droplets size={10}/> N+
                                                    </div>
                                                )}
                                                {step.pest_break && (
                                                    <div className="flex items-center gap-1 text-[9px] bg-rose-50 text-rose-700 px-2 py-1 rounded-full font-black border border-rose-100">
                                                        <Bug size={10}/> Pest Break
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.reason}</p>
                                        
                                        {(step.nutrient_impact || step.yield_impact) && (
                                            <div className="mt-3 flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {step.nutrient_impact && <span className="flex items-center gap-1"><Sprout size={10}/> {step.nutrient_impact}</span>}
                                                {step.yield_impact && <span className="flex items-center gap-1"><TrendingUp size={10}/> {step.yield_impact}</span>}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {idx < result.rotation_plan.length - 1 && (
                                        <div className="absolute left-[-15px] bottom-0 flex flex-col items-center">
                                            <ArrowDown size={14} className="text-green-300" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
                            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                                Sustainability Tip: This sequence optimizes soil nitrogen levels and minimizes specific pest life-cycles naturally.
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'companion' && (result.companions || result.avoid) && (
                    <div className="space-y-4">
                        {result.companions?.map((c, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg text-green-900">{c.name}</span>
                                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full font-black uppercase tracking-widest">{c.role}</span>
                                </div>
                                <p className="text-sm text-gray-600">{c.benefit}</p>
                            </div>
                        ))}
                        {result.avoid?.map((a, i) => (
                            <div key={i} className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <span className="font-bold block text-red-900 mb-1">{a.name} (Avoid)</span>
                                <span className="text-xs text-red-700 leading-tight block">{a.reason}</span>
                            </div>
                        ))}
                    </div>
                )}

                {mode === 'calendar' && result.calendar && (
                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <CalendarIcon size={18} className="text-green-600"/> Seasonal Guide
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {result.calendar.map((month, i) => (
                                <div key={i} className={`p-3 rounded-lg border text-center ${month.tasks.length > 0 ? 'bg-green-50 border-green-200 shadow-xs' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                    <span className="block text-xs font-black text-gray-400 uppercase mb-2">{month.month}</span>
                                    <div className="space-y-1">
                                        {month.tasks.map((t, idx) => (
                                            <span key={idx} className="block text-[9px] bg-white rounded px-1.5 py-1 border border-green-100 text-green-800 font-bold">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
                    <h3 className="font-black text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2 uppercase tracking-tight">
                        Expert Strategy Report
                    </h3>
                    <div className="prose prose-sm prose-green max-w-none">
                        <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CropRecommender;
