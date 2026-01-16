
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { planCropStrategy, CropPlanResult } from '../services/geminiService';
import { Sprout, RotateCw, HeartHandshake, Calendar as CalendarIcon, Leaf, Loader2, AlertCircle, Shield, Bug, Zap, ArrowDown, Activity, Gauge, TrendingUp, Sun, DollarSign, UserCheck, Archive, X, Clock, CheckCircle, ChevronRight, MapPin, Globe, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface CropRecommenderProps {
  location: LocationData | null;
  retryLocation?: () => void;
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

const CropRecommender: React.FC<CropRecommenderProps> = ({ location, retryLocation }) => {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('recommend');
  const [soilType, setSoilType] = useState('Loam');
  const [cropInput, setCropInput] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [result, setResult] = useState<CropPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFilter = (filter: string) => {
    setFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
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
    } catch (err: any) {
      console.error("Planning Error:", err);
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
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-xl shadow-sm border border-green-200/50">
              <Globe size={24} className="text-green-700" />
            </div>
            {t('nav.plan')}
          </h2>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-wider">Hyper-Localized Strategy Engine</p>
        </div>
        {isLocationActive && (
          <div className="bg-white px-3 py-1.5 rounded-full border border-green-100 shadow-sm flex items-center gap-2 animate-in fade-in zoom-in">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </header>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id as Mode); setResult(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 ${mode === tab.id ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  <tab.icon size={14} /> {tab.label}
              </button>
          ))}
      </div>

      <div className="space-y-4">
        {!isLocationActive ? (
            <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 text-center animate-in zoom-in-95">
                <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner">
                    <MapPin size={32} />
                </div>
                <h4 className="font-black text-rose-900 text-lg mb-2">Location Not Detected</h4>
                <p className="text-xs font-bold text-rose-700/60 mb-6 leading-relaxed">
                  Precision planning requires your farm's coordinates to analyze local climate patterns and soil maps.
                </p>
                <button 
                  onClick={retryLocation}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Zap size={14} fill="currentColor"/> Activate Precise Mode
                </button>
            </div>
        ) : (
            <>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-1">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={10}/> Soil Profile</label>
                     <select value={soilType} onChange={(e) => setSoilType(e.target.value)} className="w-full p-3 border-2 border-slate-50 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none focus:border-green-500 transition-all text-xs">
                        <option value="Loam">Balanced Loam</option>
                        <option value="Sandy">Fast-Drain Sandy</option>
                        <option value="Clay">Rich Clay</option>
                        <option value="Silt">Fine Silt</option>
                     </select>
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Filter size={10}/> Focus Crop</label>
                      <input 
                        type="text" 
                        value={cropInput} 
                        onChange={(e) => { setCropInput(e.target.value); if(error) setError(null); }} 
                        placeholder="e.g. Tomato" 
                        className="w-full p-3 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none focus:border-green-500 text-xs" 
                      />
                   </div>
                 </div>

                 {mode === 'recommend' && (
                     <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Target Preferences</label>
                          <div className="grid grid-cols-2 gap-2">
                              {FILTER_OPTIONS.map((opt) => (
                                  <button 
                                      key={opt.label} 
                                      onClick={() => toggleFilter(opt.label)} 
                                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tight border-2 transition-all text-left ${filters.includes(opt.label) ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'}`}
                                  >
                                      <opt.icon size={12} /> <span className="truncate">{opt.label}</span>
                                  </button>
                              ))}
                          </div>
                     </div>
                 )}
              </div>

              {error && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 animate-in shake">
                      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <p className="text-xs font-bold text-amber-800">{error}</p>
                  </div>
              )}

              <button 
                onClick={handlePlan} 
                disabled={loading} 
                className={`w-full py-5 rounded-[1.75rem] font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-black'}`}
              >
                  {loading ? <><Loader2 className="animate-spin" /> Analyzing Location...</> : <><Zap size={18} fill="currentColor"/> Generate Precision Plan</>}
              </button>
            </>
        )}

        {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
                {/* Result Cards */}
                {mode === 'recommend' && result.recommendations && result.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Top Climate Matches</h4>
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-black text-lg text-slate-900 group-hover:text-green-700 transition-colors">{rec.name}</h5>
                          <div className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                            {rec.match_score}% MATCH
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mb-3 leading-relaxed">{rec.key_benefit}</p>
                        
                        {rec.climate_fit && (
                          <div className="bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5"><MapPin size={10} className="text-green-500"/> {rec.climate_fit}</p>
                          </div>
                        )}

                        <div className="flex gap-4">
                          {rec.maturity_days && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <Clock size={12} className="text-slate-300"/> {rec.maturity_days} Days
                            </div>
                          )}
                          {rec.harvest_window && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <CalendarIcon size={12} className="text-slate-300"/> {rec.harvest_window}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detail Analysis */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                        <Activity size={18} />
                        <h4 className="font-black text-[10px] uppercase tracking-widest">Regional Agronomy Report</h4>
                    </div>
                    <div className="prose prose-sm prose-slate max-w-none prose-strong:text-slate-900 prose-headings:text-slate-900 prose-p:leading-relaxed text-slate-600">
                        <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                </div>

                {/* Other specialized results rendering ... (Rotation, Companion, etc) */}
                {mode === 'rotation' && result.rotation_plan && (
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-6 flex items-center gap-2"><RotateCw size={14}/> 4-Phase Location Sequence</h4>
                     <div className="space-y-8">
                       {result.rotation_plan.map((step, idx) => (
                         <div key={idx} className="flex gap-4 relative">
                            {idx < result.rotation_plan!.length - 1 && <div className="absolute left-3 top-6 w-0.5 h-12 bg-slate-800"></div>}
                            <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-slate-900 flex items-center justify-center text-[10px] font-black shrink-0 relative z-10">{idx+1}</div>
                            <div>
                               <span className="text-[10px] font-black uppercase text-slate-500">{step.period}</span>
                               <h5 className="font-black text-lg">{step.crop}</h5>
                               <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.reason}</p>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommender;
