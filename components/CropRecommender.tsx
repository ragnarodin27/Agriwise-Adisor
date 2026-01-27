
import React, { useState, useEffect, useMemo } from 'react';
import { LocationData } from '../types';
import { planCropStrategy, CropPlanResult, RotationStep } from '../services/geminiService';
import { Sprout, RotateCw, HeartHandshake, Calendar as CalendarIcon, Leaf, Loader2, AlertCircle, Shield, Bug, Zap, Activity, TrendingUp, Sun, DollarSign, UserCheck, Archive, X, Clock, MapPin, Globe, Filter, Info, Heart, CloudRain, Snowflake, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface CropRecommenderProps {
  location: LocationData | null;
  retryLocation?: () => void;
}

type Mode = 'recommend' | 'rotation' | 'companion' | 'calendar';

const FILTER_OPTIONS = [
    { label: 'Drought Tolerant', icon: Sun },
    { label: 'Pest Resistant', icon: Shield },
    { label: 'High Market Demand', icon: DollarSign },
    { label: 'Short Growing Cycle', icon: Zap },
    { label: 'Nitrogen Fixing', icon: Sprout },
    { label: 'Low Maintenance', icon: UserCheck },
    { label: 'High Yield', icon: TrendingUp },
    { label: 'Storage Friendly', icon: Archive }
];

const SeasonalIcon = ({ period }: { period: string }) => {
  const p = period.toLowerCase();
  if (p.includes('summer') || p.includes('hot') || p.includes('kharif')) return <Sun size={14} className="text-amber-500" />;
  if (p.includes('monsoon') || p.includes('rain')) return <CloudRain size={14} className="text-blue-500" />;
  if (p.includes('winter') || p.includes('cold') || p.includes('rabi')) return <Snowflake size={14} className="text-sky-400" />;
  return <Leaf size={14} className="text-emerald-500" />;
};

const MonthGrid = ({ planting, harvest }: { planting: number[], harvest: number[] }) => {
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    return (
        <div className="flex gap-1 w-full mt-2">
            {months.map((m, i) => {
                let bg = 'bg-slate-100 dark:bg-slate-800';
                let text = 'text-slate-300 dark:text-slate-600';
                
                if (planting.includes(i)) {
                    bg = 'bg-emerald-500';
                    text = 'text-white';
                } else if (harvest.includes(i)) {
                    bg = 'bg-amber-500';
                    text = 'text-white';
                }

                return (
                    <div key={i} className={`flex-1 aspect-[3/4] rounded-md ${bg} flex items-center justify-center text-[8px] font-black ${text}`}>
                        {m}
                    </div>
                );
            })}
        </div>
    );
};

const RotationTimeline = ({ plan }: { plan: RotationStep[] }) => {
  return (
    <div className="relative pb-8 overflow-x-auto no-scrollbar">
      <div className="flex gap-4 min-w-max px-2">
        {plan.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center group">
            {/* Year marker if first step of year or start */}
            <div className="mb-4 text-center">
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                Year {step.year} • {step.period}
              </span>
            </div>
            
            {/* Node */}
            <div className="relative">
              {idx < plan.length - 1 && (
                <div className="absolute top-1/2 left-full w-4 h-[2px] bg-slate-200 dark:bg-white/10 -translate-y-1/2"></div>
              )}
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1C2B22] border-2 border-emerald-500/20 shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 group-hover:border-emerald-500">
                <SeasonalIcon period={step.period} />
              </div>
            </div>

            {/* Info */}
            <div className="mt-4 text-center w-32">
              <h5 className="text-xs font-black text-slate-800 dark:text-emerald-50 truncate">{step.crop}</h5>
              <p className="text-[9px] text-slate-400 font-bold leading-tight mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {step.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CropRecommender: React.FC<CropRecommenderProps> = ({ location, retryLocation }) => {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('recommend');
  const [soilType, setSoilType] = useState(() => localStorage.getItem('agri_soil_type') || 'Loam');
  const [filters, setFilters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('agri_filters');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [cropInput, setCropInput] = useState('');
  const [result, setResult] = useState<CropPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('crop_favorites');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const handlePlan = async () => {
    if (!location || location.error) {
      setError("Location access required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const advice = await planCropStrategy({ mode, soilType, filters, cropInput }, location, language);
      setResult(advice);
    } catch (err) {
      setError("Strategic Advisor busy. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
      { id: 'recommend', label: 'Suggest', icon: Leaf },
      { id: 'rotation', label: 'Rotation', icon: RotateCw },
      { id: 'companion', label: 'Companion', icon: HeartHandshake },
      { id: 'calendar', label: 'Calendar', icon: CalendarIcon }
  ];

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 dark:bg-[#0E1F17] relative">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-emerald-50 flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"><Globe size={24} /></div>
            {t('nav.plan')}
          </h2>
          <p className="text-slate-500 dark:text-emerald-500/60 mt-1 text-[10px] font-black uppercase tracking-widest">Regional Growth Engine</p>
        </div>
      </header>

      <div className="flex bg-white dark:bg-[#1C2B22] p-1.5 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id as Mode); setResult(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 ${mode === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                  <tab.icon size={14} /> {tab.label}
              </button>
          ))}
      </div>

      <div className="space-y-4">
        {location && !location.error ? (
          <>
            <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Soil Type</label>
                   <select value={soilType} onChange={(e) => setSoilType(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-[#0E1F17] rounded-2xl font-bold text-xs outline-none">
                      <option value="Loam">Loam</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Clay">Clay</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Target Crop</label>
                   <input type="text" value={cropInput} onChange={e => setCropInput(e.target.value)} placeholder="e.g. Rice" className="w-full p-3.5 bg-slate-50 dark:bg-[#0E1F17] rounded-2xl font-bold text-xs outline-none" />
                </div>
              </div>
              <button onClick={handlePlan} disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} fill="currentColor"/> Generate Plan</>}
              </button>
            </div>

            {result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                {mode === 'rotation' && result.rotation_plan && (
                  <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-soft">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Rotation Timeline</h4>
                    <RotationTimeline plan={result.rotation_plan} />
                  </div>
                )}
                
                {mode === 'calendar' && result.planting_calendar && (
                   <div className="space-y-4">
                      {result.planting_calendar.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#1C2B22] p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5">
                          <h5 className="font-black text-slate-900 dark:text-emerald-50 mb-2">{item.crop}</h5>
                          <MonthGrid planting={item.planting_months} harvest={item.harvest_months} />
                        </div>
                      ))}
                   </div>
                )}

                <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-soft prose prose-sm dark:prose-invert max-w-none">
                  <h4 className="font-black text-[10px] uppercase text-emerald-600 mb-4 tracking-[0.2em]">Strategy Analysis</h4>
                  <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
             <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-sm font-bold text-slate-400">Please enable GPS to access the Strategic Advisor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommender;
