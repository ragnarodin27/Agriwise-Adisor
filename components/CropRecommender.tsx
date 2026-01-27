
import React, { useState } from 'react';
import { LocationData } from '../types';
import { planCropStrategy, CropPlanResult } from '../services/geminiService';
import { Sprout, RotateCw, HeartHandshake, Calendar as CalendarIcon, Leaf, Loader2, AlertCircle, Shield, Zap, Activity, TrendingUp, Sun, DollarSign, UserCheck, Archive, Clock, CheckCircle, ChevronRight, MapPin, Globe, Filter, ShieldCheck, Beaker, CloudRain, Snowflake, CalendarDays } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface CropRecommenderProps {
  location: LocationData | null;
  retryLocation?: () => void;
}

type Mode = 'recommend' | 'rotation' | 'companion' | 'calendar';

const FILTER_OPTIONS = [
    { label: 'Drought Tolerant', icon: Sun, color: 'text-risk-amber' },
    { label: 'Pest Resistant', icon: Shield, color: 'text-critical-red' },
    { label: 'High Market Demand', icon: DollarSign, color: 'text-farmer-green' },
    { label: 'Short Growing Cycle', icon: Zap, color: 'text-yellow-500' },
    { label: 'Nitrogen Fixing', icon: Sprout, color: 'text-emerald-500' },
    { label: 'Low Maintenance', icon: UserCheck, color: 'text-blue-500' },
    { label: 'High Yield', icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Storage Friendly', icon: Archive, color: 'text-amber-600' },
];

const SeasonalIcon = ({ period }: { period: string }) => {
  const p = period.toLowerCase();
  if (p.includes('summer') || p.includes('hot') || p.includes('kharif')) return <Sun size={14} className="text-amber-500" />;
  if (p.includes('monsoon') || p.includes('rain')) return <CloudRain size={14} className="text-blue-500" />;
  if (p.includes('winter') || p.includes('cold') || p.includes('rabi')) return <Snowflake size={14} className="text-sky-400" />;
  return <Leaf size={14} className="text-emerald-500" />;
};

const CropRecommender: React.FC<CropRecommenderProps> = ({ location, retryLocation }) => {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('recommend');
  
  const [soilType, setSoilType] = useState(() => localStorage.getItem('agri_soil_type') || 'Loam');
  const [filters, setFilters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('agri_filters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cropInput, setCropInput] = useState('');
  const [result, setResult] = useState<CropPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSoilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSoilType(val);
    localStorage.setItem('agri_soil_type', val);
  };

  const toggleFilter = (filter: string) => {
    setFilters(prev => {
      const next = prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter];
      localStorage.setItem('agri_filters', JSON.stringify(next));
      return next;
    });
  };

  const handlePlan = async () => {
    if (!location || location.error) {
      setError("Precise location is needed for local climate modeling.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const advice = await planCropStrategy({ mode, soilType, filters, cropInput }, location, language);
      setResult(advice);
    } catch {
      setError("AI Planning Service is busy. Please try again in 10 seconds.");
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

  const isLocationActive = location && !location.error;

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 dark:bg-[#0E1F17] relative overflow-hidden">
      
      <div className="fixed inset-0 pointer-events-none z-0">
           <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Spiral%20Calendar.png" className="absolute top-20 right-0 w-56 h-56 opacity-[0.03] rotate-12 grayscale-[50%]" alt=""/>
           <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Natural/Seedling.png" className="absolute bottom-32 -left-8 w-48 h-48 opacity-[0.03] -rotate-12 grayscale-[50%]" alt=""/>
      </div>

      <header className="mb-6 flex justify-between items-start relative z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-emerald-50 flex items-center gap-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl shadow-sm border border-emerald-200/50">
              <Globe size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            {t('nav.plan')}
          </h2>
          <p className="text-slate-500 dark:text-emerald-500/60 mt-1 text-xs font-bold uppercase tracking-wider">Hyper-Localized Strategy Engine</p>
        </div>
        {isLocationActive && (
          <div className="bg-white dark:bg-[#1C2B22] px-3 py-1.5 rounded-full border border-emerald-100 dark:border-white/5 shadow-sm flex items-center gap-2 animate-in fade-in zoom-in">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 dark:text-emerald-500/60">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </header>

      <div className="flex bg-white dark:bg-[#1C2B22] p-1 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5 mb-6 overflow-x-auto no-scrollbar relative z-10">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id as Mode); setResult(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 ${mode === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 dark:text-emerald-500/40 hover:bg-slate-50'}`}
              >
                  <tab.icon size={14} /> {tab.label}
              </button>
          ))}
      </div>

      <div className="space-y-4 relative z-10">
        {!isLocationActive ? (
            <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 text-center animate-in zoom-in-95">
                <div className="bg-red-100 dark:bg-red-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner">
                    <MapPin size={32} />
                </div>
                <h4 className="font-black text-red-900 dark:text-red-400 text-lg mb-2">Location Not Detected</h4>
                <p className="text-xs font-bold text-red-700/60 dark:text-red-200/40 mb-6 leading-relaxed">
                  Precision planning requires coordinates for climate analysis.
                </p>
                <button 
                  onClick={retryLocation}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Zap size={14} fill="currentColor"/> Activate GPS
                </button>
            </div>
        ) : (
            <>
              <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-1">
                     <label className="block text-[10px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={10}/> Soil Profile</label>
                     <select value={soilType} onChange={handleSoilChange} className="w-full p-3 border-2 border-slate-50 dark:border-[#0E1F17] rounded-2xl bg-slate-50 dark:bg-[#0E1F17] font-bold text-slate-700 dark:text-emerald-50 outline-none focus:border-emerald-500 transition-all text-xs">
                        <option value="Loam">Balanced Loam</option>
                        <option value="Sandy">Fast-Drain Sandy</option>
                        <option value="Clay">Rich Clay</option>
                        <option value="Silt">Fine Silt</option>
                     </select>
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Filter size={10}/> Focus Crop</label>
                      <input 
                        type="text" 
                        value={cropInput} 
                        onChange={(e) => { setCropInput(e.target.value); if(error) setError(null); }} 
                        placeholder="e.g. Tomato" 
                        className="w-full p-3 border-2 border-slate-50 dark:border-[#0E1F17] bg-slate-50 dark:bg-[#0E1F17] rounded-2xl font-bold text-slate-700 dark:text-emerald-50 outline-none focus:border-emerald-500 text-xs" 
                      />
                   </div>
                 </div>

                 {mode === 'recommend' && (
                     <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest">Growth Target Preferences</label>
                          <div className="grid grid-cols-2 gap-2">
                              {FILTER_OPTIONS.map((opt) => (
                                  <button 
                                      key={opt.label} 
                                      onClick={() => toggleFilter(opt.label)} 
                                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tight border-2 transition-all text-left ${filters.includes(opt.label) ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-[#0E1F17] border-slate-50 dark:border-white/5 text-slate-400 dark:text-emerald-500/40'}`}
                                  >
                                      <opt.icon size={12} /> <span className="truncate">{opt.label}</span>
                                  </button>
                              ))}
                          </div>
                     </div>
                 )}
              </div>

              {error && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3 animate-in shake">
                      <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-200">{error}</p>
                  </div>
              )}

              <button 
                onClick={handlePlan} 
                disabled={loading} 
                className={`w-full py-5 rounded-[1.75rem] font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-slate-300' : 'bg-slate-900 dark:bg-emerald-600 hover:bg-black'}`}
              >
                  {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Zap size={18} fill="currentColor"/> Generate Precision Plan</>}
              </button>
            </>
        )}

        {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
                {/* Result Highlights */}
                {(mode === 'recommend' || mode === 'companion') && result.recommendations && result.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest px-2">
                      {mode === 'companion' ? 'Ideal Biological Partners' : 'Top Climate Matches'}
                    </h4>
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-soft group relative overflow-hidden transition-all hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-4">
                          <h5 className="font-black text-lg text-slate-900 dark:text-emerald-50 group-hover:text-emerald-600 transition-colors">{rec.name}</h5>
                          <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            {rec.match_score}% MATCH
                          </div>
                        </div>
                        <div className="space-y-3 mb-4">
                             <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                                  <p className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                     <Beaker size={12} /> Biological Logic
                                  </p>
                                  <p className="text-xs text-blue-900/80 dark:text-blue-100/60 font-medium leading-relaxed">{rec.key_benefit}</p>
                             </div>
                             {mode === 'companion' && rec.companion_benefit && (
                               <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                                  <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                     <ShieldCheck size={12} /> Symbiotic Advantage
                                  </p>
                                  <p className="text-xs text-emerald-900/80 dark:text-emerald-50/70 font-bold leading-relaxed">{rec.companion_benefit}</p>
                               </div>
                             )}
                        </div>
                        <div className="flex gap-4">
                          {rec.maturity_days && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-emerald-500/40">
                              <Clock size={12}/> {rec.maturity_days} Days
                            </div>
                          )}
                          {rec.harvest_window && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-emerald-500/40">
                              <CalendarIcon size={12}/> {rec.harvest_window}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rotational Succession Visualizer - Enabled for both Rotation and Calendar modes */}
                {(mode === 'rotation' || mode === 'calendar') && result.rotation_plan && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest px-2">Annual Rotation Sequence</h4>
                    <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
                       <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-2">
                            <RotateCw size={18} className="text-emerald-600 animate-spin-slow" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-emerald-50">Crop Succession Calendar</span>
                         </div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Year-Over-Year</div>
                       </div>

                       <div className="relative">
                          {/* Main Timeline Spine */}
                          <div className="absolute left-[20px] top-4 bottom-4 w-[2px] bg-emerald-100 dark:bg-emerald-900/30"></div>

                          <div className="space-y-2">
                             {result.rotation_plan.map((step, idx) => {
                               const isNewYear = idx % 3 === 0;
                               const yearNum = Math.floor(idx / 3) + 1;
                               return (
                               <div key={idx} className="relative">
                                  {isNewYear && (
                                     <div className="relative pl-12 pt-4 pb-6 group">
                                        <div className="absolute left-[13px] top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-600 dark:bg-emerald-500 rounded-full border-4 border-white dark:border-[#1C2B22] z-20 shadow-md"></div>
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Year {yearNum} Cycle</span>
                                        </div>
                                     </div>
                                  )}
                                  
                                  <div className="relative pl-12 pb-8 group last:pb-0">
                                      {/* Milestone Node */}
                                      <div className="absolute left-4 top-2 w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-white dark:bg-[#1C2B22] z-10 transition-all group-hover:scale-125 group-hover:bg-emerald-500"></div>
                                      
                                      {/* Calendar Event Card */}
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0E1F17] px-3 py-1.5 rounded-full border border-slate-100 dark:border-white/5">
                                              <SeasonalIcon period={step.period} />
                                              <span className="text-[9px] font-black uppercase text-slate-600 dark:text-emerald-400 tracking-wider">{step.period}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Phase {idx + 1}</span>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-[#0E1F17] p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-colors hover:border-emerald-500/30 group">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2.5 bg-white dark:bg-[#1C2B22] rounded-xl text-emerald-600 shadow-sm">
                                                  <Sprout size={18} />
                                              </div>
                                              <h5 className="font-black text-xl text-slate-900 dark:text-emerald-50">{step.crop}</h5>
                                            </div>
                                            
                                            <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/5">
                                              <p className="text-[9px] font-black uppercase text-emerald-600/70 tracking-widest mb-1">Agronomic Reasoning</p>
                                              <p className="text-xs text-slate-600 dark:text-emerald-50/70 leading-relaxed font-medium">{step.reason}</p>
                                            </div>
                                            
                                            {/* Visual Duration Indicator */}
                                            <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-emerald-900/20 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 delay-300" 
                                                style={{ width: `${100 / (result.rotation_plan?.length || 1)}%` }}
                                              ></div>
                                            </div>
                                        </div>
                                      </div>
                                  </div>
                               </div>
                               );
                             })}
                          </div>
                       </div>
                       
                       {/* Success Footer */}
                       <div className="mt-12 p-5 bg-emerald-600 rounded-[2rem] text-white flex items-center justify-between shadow-lg shadow-emerald-900/20">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/20 rounded-lg">
                                <CheckCircle size={18} />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Full Rotation Cycle</p>
                                <p className="text-xs font-bold leading-none">365-Day Soil Optimization Active</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="opacity-40" />
                       </div>
                    </div>
                  </div>
                )}

                {/* Analysis Deep Dive */}
                <div className="bg-white dark:bg-[#1C2B22] rounded-[3rem] p-8 shadow-soft border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-emerald-500/60">
                        <Activity size={18} />
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Regional Agronomy Report</h4>
                    </div>
                    <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none text-slate-600 dark:text-emerald-50/80 leading-relaxed">
                        <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                </div>
            </div>
        )}
      </div>

      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default CropRecommender;
