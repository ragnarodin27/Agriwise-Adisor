import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { planCropStrategy, CropPlanResult } from '../services/geminiService';
import { Sprout, ListFilter, Loader2, AlertCircle, RotateCw, HeartHandshake, Calendar as CalendarIcon, Leaf, Check, Search, ArrowRight, XCircle, CheckCircle, Sun, Shield, DollarSign, Zap, UserCheck, TrendingUp, Archive, X, Droplets, Bug, Scale, Flower } from 'lucide-react';
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
    const savedSoil = localStorage.getItem('cropPlan_soilType');
    const savedFilters = localStorage.getItem('cropPlan_filters');
    
    if (savedSoil) setSoilType(savedSoil);
    if (savedFilters) {
        try {
            setFilters(JSON.parse(savedFilters));
        } catch (e) {
            console.error("Error parsing saved filters", e);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cropPlan_soilType', soilType);
  }, [soilType]);

  useEffect(() => {
    localStorage.setItem('cropPlan_filters', JSON.stringify(filters));
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

  const getRoleIcon = (role: string) => {
      const r = role.toLowerCase();
      if (r.includes('pest') || r.includes('trap') || r.includes('repel')) return Shield;
      if (r.includes('nitrogen') || r.includes('nutrient') || r.includes('fix')) return Sprout;
      if (r.includes('shade') || r.includes('shelter')) return Sun;
      if (r.includes('pollinat')) return Flower;
      return CheckCircle;
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-green-50/50">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg">
            <Sprout size={24} className="text-green-700" />
          </div>
          {t('nav.plan')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Advanced planning: Rotation, Companions, and Local suitability.</p>
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
             <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
             <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
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
                        Filter Traits
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
                   <p className="text-[10px] text-gray-400 mt-1">
                       {mode === 'rotation' && "Leave blank if starting fresh."}
                       {mode === 'calendar' && "Search for typical planting & harvesting dates for your region."}
                   </p>
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
                <Loader2 className="animate-spin" /> 
                {mode === 'recommend' ? 'Analyzing Region...' : 'Generating Plan...'}
              </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    {mode === 'calendar' ? <Search size={18}/> : null}
                    {mode === 'recommend' && "Find Best Crops"}
                    {mode === 'rotation' && "Create Rotation Plan"}
                    {mode === 'companion' && "Find Companions"}
                    {mode === 'calendar' && "Find Planting Dates"}
                </span>
            )}
        </button>

        {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Visual Widgets based on Mode */}
                
                {/* Recommendation Cards */}
                {mode === 'recommend' && result.recommendations && (
                    <div className="grid grid-cols-1 gap-3">
                        {result.recommendations.map((rec, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Sprout size={60} />
                                </div>
                                <div className="flex justify-between items-start z-10">
                                    <h4 className="font-bold text-green-900 text-lg flex items-center gap-2">
                                        <div className="bg-green-50 p-1.5 rounded-lg text-green-600">
                                            <Leaf size={16}/>
                                        </div>
                                        {rec.name}
                                    </h4>
                                    <span className="text-xs font-bold bg-green-600 text-white px-2 py-1 rounded-lg shadow-sm">
                                        {rec.match_score}% Match
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden z-10">
                                    <div className="h-full bg-green-500" style={{ width: `${rec.match_score}%` }}></div>
                                </div>
                                <div className="bg-green-50/50 p-2 rounded-lg border border-green-50 z-10">
                                    <p className="text-sm text-gray-700 leading-tight">
                                        <span className="font-semibold text-green-700 text-xs uppercase tracking-wide block mb-1">Local Insight</span>
                                        {rec.key_benefit}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Visual Rotation Timeline - Year-Over-Year View */}
                {mode === 'rotation' && result.rotation_plan && (
                    <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm">
                        <div className="mb-6 bg-green-50 p-3 rounded-lg border border-green-100">
                            <h5 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <RotateCw size={12}/> Scientific Principle: Nutrient Cycling
                            </h5>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">1</div>
                                    <span>Heavy Feeder</span>
                                </div>
                                <div className="h-px bg-green-300 w-full mx-2"></div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">2</div>
                                    <span>Light Feeder</span>
                                </div>
                                <div className="h-px bg-green-300 w-full mx-2"></div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
                                    <span>Legume (Fix N)</span>
                                </div>
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <RotateCw size={18} className="text-green-600"/> Recommended Sequence
                        </h4>
                        
                        {/* Grouped by Year View */}
                        <div className="space-y-6">
                            {Object.entries(result.rotation_plan.reduce((acc, step) => {
                                // Extract Year from period string (e.g. "Year 1 Season 1")
                                const yearMatch = step.period.match(/Year\s*(\d+)/i);
                                const year = yearMatch ? `Year ${yearMatch[1]}` : 'Planned Sequence';
                                if (!acc[year]) acc[year] = [];
                                acc[year].push(step);
                                return acc;
                            }, {} as Record<string, typeof result.rotation_plan>)).map(([year, steps]) => (
                                <div key={year} className="relative">
                                    {/* Year Label */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            {year}
                                        </div>
                                        <div className="h-px bg-green-100 flex-1"></div>
                                    </div>
                                    
                                    {/* Seasons Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {steps.map((step, idx) => (
                                            <div key={idx} className="bg-green-50 p-4 rounded-xl border border-green-100 relative group hover:shadow-md transition-shadow">
                                                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500 rounded-l-xl"></div>
                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded">
                                                            {step.period.replace(/Year\s*\d+\s*/i, '') || step.period}
                                                        </span>
                                                    </div>
                                                    <h5 className="font-bold text-gray-800 text-lg mb-2">{step.crop}</h5>
                                                    
                                                    {/* Enhanced Details */}
                                                    <div className="space-y-1.5 mb-2">
                                                        {step.nutrient_impact && (
                                                            <div className="flex items-start gap-2 text-xs text-blue-800 bg-blue-50 px-2 py-1.5 rounded leading-relaxed">
                                                                <Droplets size={14} className="shrink-0 mt-0.5 text-blue-600"/>
                                                                <span>{step.nutrient_impact}</span>
                                                            </div>
                                                        )}
                                                        {step.pest_break && (
                                                            <div className="flex items-start gap-2 text-xs text-red-800 bg-red-50 px-2 py-1.5 rounded leading-relaxed">
                                                                <Bug size={14} className="shrink-0 mt-0.5 text-red-600"/>
                                                                <span>{step.pest_break}</span>
                                                            </div>
                                                        )}
                                                        {step.yield_impact && (
                                                            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 px-2 py-1.5 rounded leading-relaxed">
                                                                <Scale size={14} className="shrink-0 mt-0.5 text-amber-600"/>
                                                                <span>{step.yield_impact}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-start gap-2 text-xs text-gray-600 border-t border-green-100 pt-2 mt-2">
                                                        <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0"/>
                                                        <span className="leading-relaxed">{step.reason}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Companion Planting Visuals */}
                {mode === 'companion' && (result.companions || result.avoid) && (
                    <div className="space-y-6">
                        {result.companions && result.companions.length > 0 && (
                            <div>
                                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                    <CheckCircle size={18} /> Beneficial Partners
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {result.companions.map((c, i) => {
                                        const RoleIcon = c.role ? getRoleIcon(c.role) : CheckCircle;
                                        return (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-lg text-green-900">{c.name}</span>
                                                    {c.role && (
                                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                                                            <RoleIcon size={12}/> {c.role}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    {c.benefit}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {result.avoid && result.avoid.length > 0 && (
                             <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                    <XCircle size={18} /> Harmful Neighbors
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {result.avoid.map((a, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg text-sm shadow-sm">
                                            <span className="font-bold block text-red-900 mb-1">{a.name}</span>
                                            <span className="text-xs text-gray-500 leading-tight block">{a.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Calendar Grid */}
                {mode === 'calendar' && result.calendar && (
                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <CalendarIcon size={18} className="text-green-600"/> Seasonal Guide
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {result.calendar.map((month, i) => (
                                <div key={i} className={`p-2 rounded-lg border text-center ${month.tasks.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                    <span className="block text-xs font-bold text-gray-500 uppercase mb-1">{month.month.substring(0, 3)}</span>
                                    {month.tasks.length > 0 ? (
                                        <div className="space-y-1">
                                            {month.tasks.map((t, idx) => (
                                                <span key={idx} className="block text-[10px] bg-white rounded px-1 py-0.5 border border-green-100 text-green-800 truncate">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-300">-</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <Leaf size={20} className="text-green-600"/> Detailed Analysis
                    </h3>
                    <div className="prose prose-sm prose-green max-w-none">
                        <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                    {mode === 'recommend' && (
                        <div className="mt-4 text-xs text-gray-400 italic">
                            * Based on real-time data: local markets, pest alerts, and micro-climate.
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommender;