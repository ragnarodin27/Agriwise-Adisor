import React, { useState, useRef, useEffect, useMemo } from 'react';
import { analyzeSoil, SoilAnalysisResult } from '../services/geminiService';
import { nativeStore } from '../services/nativeStore';
import { LocationData } from '../types';
import { 
  Loader2, Leaf, Camera, Microscope, History, ShieldCheck, Sprout, Globe2, Sparkles, Brain, Eye, Info, TrendingUp, Save, CheckCircle, Plus, Trash2, Calendar, Download, FileText, LayoutGrid, ChevronRight, PieChart, Activity, Gauge, Zap, ChevronDown, Bug, Recycle, Wind, ArrowRight, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SoilAnalyzerProps {
  location: LocationData | null;
  logActivity?: (type: string, desc: string, icon: string) => void;
}

interface SoilLog {
  id: string;
  date: string;
  crop: string;
  score: number;
  recommendation: string;
  nutrients: SoilAnalysisResult['nutrients'];
  image?: string;
  soilType?: string;
}

const PARAM_GUIDANCE = {
  ph: {
    title: "pH Level",
    desc: "Measures acidity/alkalinity. Most crops prefer 6.0-7.0 (Neutral).",
    importance: "Affects nutrient availability and microbial activity."
  },
  organicMatter: {
    title: "Organic Matter",
    desc: "Target 3-5% for healthy soil biology.",
    importance: "Improves water retention and provides slow-release nutrients."
  },
  texture: {
    title: "Soil Texture",
    desc: "Ratio of sand, silt, and clay.",
    importance: "Determines drainage and root penetration capability."
  }
};

const EcologicalComparison = ({ data }: { data: SoilAnalysisResult['ecological_comparison'] }) => {
  return (
    <div className="bg-white dark:bg-[#1C2B22] rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-soft overflow-hidden">
      <div className="bg-emerald-600 p-6 text-white">
        <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <Globe2 size={18} /> Ecological Impact Analysis
        </h4>
        <p className="text-[10px] font-bold text-white/70 mt-1 uppercase tracking-tighter">Regenerative vs. Synthetic Framework</p>
      </div>
      
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Organic Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck size={16} />
              <span className="font-black text-[10px] uppercase tracking-widest">Organic Benefits</span>
            </div>
            <ul className="space-y-3">
              {data.organic_benefits.map((b, i) => (
                <li key={i} className="flex gap-2 text-xs font-bold text-slate-700 dark:text-emerald-50/80 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Synthetic Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle size={16} />
              <span className="font-black text-[10px] uppercase tracking-widest">Synthetic Risks</span>
            </div>
            <ul className="space-y-3">
              {data.synthetic_drawbacks.map((d, i) => (
                <li key={i} className="flex gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed opacity-80">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></div>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-emerald-950/20 rounded-[2rem] border border-slate-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold text-slate-600 dark:text-emerald-50/70 leading-relaxed italic">
            "{data.summary}"
          </p>
        </div>
      </div>
    </div>
  );
};

const Tooltip = ({ title, desc, importance }: { title: string, desc: string, importance: string }) => (
  <div className="group relative inline-block ml-1">
    <Info size={12} className="text-slate-300 hover:text-emerald-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
      <p className="font-black uppercase tracking-widest mb-1 text-emerald-400">{title}</p>
      <p className="mb-1 font-bold">{desc}</p>
      <p className="opacity-60 italic">{importance}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const NPKTrendChart = ({ history }: { history: SoilLog[] }) => {
  const chartData = useMemo(() => {
    const limited = [...history].slice(0, 8).reverse();
    const height = 150;
    const width = 350;
    const padding = 20;
    
    const getPoints = (key: 'n' | 'p' | 'k') => {
      if (limited.length < 2) return "0,0";
      return limited.map((log, i) => {
        const x = padding + (i / (limited.length - 1)) * (width - 2 * padding);
        const val = (log.nutrients as any)[key] || 0;
        const y = height - padding - ((val / 100) * (height - 2 * padding));
        return `${x},${y}`;
      }).join(' ');
    };

    return { 
        n: getPoints('n'), 
        p: getPoints('p'), 
        k: getPoints('k'), 
        width, 
        height, 
        padding,
        labels: limited.map(l => l.date.split('/')[0] + '/' + l.date.split('/')[1])
    };
  }, [history]);

  if (history.length < 2) return (
    <div className="py-10 text-center opacity-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem]">
      <Activity size={32} className="mx-auto mb-2 text-slate-400"/>
      <p className="text-[10px] font-black uppercase tracking-widest">History builds trends</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-soft">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Nutrient Dynamics</h4>
          <p className="text-lg font-black dark:text-emerald-50">8-Sample Sequence</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[8px] font-black uppercase text-slate-400">N</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] font-black uppercase text-slate-400">P</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[8px] font-black uppercase text-slate-400">K</span></div>
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-auto overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <line 
                    key={i}
                    x1={chartData.padding} 
                    y1={chartData.padding + p * (chartData.height - 2 * chartData.padding)} 
                    x2={chartData.width - chartData.padding} 
                    y2={chartData.padding + p * (chartData.height - 2 * chartData.padding)} 
                    stroke="currentColor" 
                    className="text-slate-100 dark:text-white/5" 
                    strokeDasharray="2,2"
                />
            ))}
            
            <polyline points={chartData.n} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={chartData.p} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={chartData.k} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {chartData.labels.map((label, i) => (
                <text 
                    key={i} 
                    x={chartData.padding + (i / (chartData.labels.length - 1)) * (chartData.width - 2 * chartData.padding)} 
                    y={chartData.height} 
                    textAnchor="middle" 
                    className="text-[8px] font-black fill-slate-300 dark:fill-emerald-500/30 uppercase tracking-tighter"
                >
                    {label}
                </text>
            ))}
        </svg>
      </div>
    </div>
  );
};

const HealthGauge = ({ score }: { score: number }) => {
  const radius = 40;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (score / 100) * circum;
  const color = score < 40 ? 'text-red-500' : score < 70 ? 'text-amber-500' : 'text-emerald-500';
  const bg = score < 40 ? 'bg-red-500' : score < 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="relative flex flex-col items-center justify-center w-52 h-52 mx-auto">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out shadow-glow`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-6xl font-black tracking-tighter ${color}`}>{score}</span>
        <div className={`mt-2 px-4 py-1 rounded-full text-white text-[8px] font-black uppercase tracking-widest ${bg}`}>
           {score < 40 ? 'Degraded' : score < 70 ? 'Moderate' : 'Elite'}
        </div>
      </div>
    </div>
  );
};

const SoilAnalyzer: React.FC<SoilAnalyzerProps> = ({ location, logActivity }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'diagnose' | 'log' | 'amendments'>('diagnose');
  const [formData, setFormData] = useState({ crop: '', ph: 'Neutral (6.0 - 7.0)', organicMatter: '2.5', type: 'Loam' });
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [savedLogs, setSavedLogs] = useState<SoilLog[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nativeStore.getAll('soil_logs').then(logs => {
      if (logs) setSavedLogs(logs.sort((a, b) => Number(b.id) - Number(a.id)));
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const match = base64.match(/^data:(.*);base64,(.*)$/);
        if (match) setImage({ mimeType: match[1], data: match[2] });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setJustSaved(false);
    try {
      const data = await analyzeSoil({ ...formData, image }, location, 'en');
      setResult(data);
      if (logActivity) logActivity('SOIL', `Regenerative analysis: ${formData.crop}`, '🔬');
    } catch (err) {} finally { setLoading(false); }
  };

  const saveToNativeDB = async () => {
    if (!result) return;
    const newLog: SoilLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      crop: formData.crop || 'Field Sample',
      score: result.health_score,
      recommendation: result.recommendation?.material || 'General Care',
      nutrients: result.nutrients,
      image: image?.data,
      soilType: result.texture_confidence?.type || formData.type
    };
    await nativeStore.put('soil_logs', newLog);
    setSavedLogs([newLog, ...savedLogs]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="min-h-screen pb-32 font-sans bg-slate-50 dark:bg-[#0E1F17] transition-all duration-500">
      <header className="px-6 pt-10 mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-emerald-50 flex items-center gap-4">
            <div className="bg-amber-800 dark:bg-amber-700 p-3 rounded-2xl text-white shadow-lg"><Microscope size={28} /></div>
            Soil Intelligence
        </h2>
        <div className="bg-white dark:bg-[#1C2B22] p-1.5 rounded-[1.75rem] mt-8 border border-slate-100 dark:border-white/5 flex gap-1 shadow-soft">
           {(['diagnose', 'log', 'amendments'] as const).map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 dark:text-emerald-500/40'}`}>
               {tab === 'diagnose' ? 'Lab' : tab === 'log' ? 'History' : 'Nutrition'}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'diagnose' && (
        <div className="px-6 space-y-6 animate-in fade-in">
          {!result ? (
            <div className="space-y-6">
                <div 
                  onClick={triggerCamera} 
                  className={`group relative w-full h-64 rounded-[3.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all overflow-hidden ${image ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-white/10 hover:border-emerald-400 bg-white dark:bg-[#1C2B22]'}`}
                >
                  {image ? (
                    <>
                      <img src={`data:${image.mimeType};base64,${image.data}`} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-600 bg-black/10 backdrop-blur-[2px]">
                        <CheckCircle size={48} className="drop-shadow-lg" />
                        <span className="text-[11px] font-black uppercase mt-3 tracking-[0.2em]">Sample captured & ready</span>
                        <button onClick={(e) => { e.stopPropagation(); setImage(null); }} className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/40 rounded-xl text-[9px] font-black uppercase transition-all">Retake Photo</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center p-8 text-center">
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] text-emerald-600 shadow-inner mb-4 transition-transform group-hover:scale-110">
                        <Camera size={48} />
                      </div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-emerald-50 mb-1">Analyze Soil by Photo</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">AI detects texture, pH indicators & visible deficiencies</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>

                <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] shadow-soft border border-slate-100 dark:border-white/5 space-y-8">
                    <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 pl-2 tracking-widest">Planned Crop</label>
                          <input type="text" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" placeholder="e.g. Basmati Rice" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 pl-2 tracking-widest flex items-center gap-1">
                                pH Profile <Tooltip {...PARAM_GUIDANCE.ph} />
                              </label>
                              <select value={formData.ph} onChange={e => setFormData({...formData, ph: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-xs text-slate-800 dark:text-emerald-50 outline-none">
                                <option>Acidic (pH < 6.0)</option>
                                <option>Neutral (6.0 - 7.0)</option>
                                <option>Alkaline (pH > 7.0)</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 pl-2 tracking-widest flex items-center gap-1">
                                Texture <Tooltip {...PARAM_GUIDANCE.texture} />
                              </label>
                              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-xs text-slate-800 dark:text-emerald-50 outline-none">
                                <option>Loam (Balanced)</option>
                                <option>Sandy (Drainage)</option>
                                <option>Clay (Heavy)</option>
                                <option>Silt (Fine)</option>
                              </select>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between px-2 mb-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                              Organic Carbon % <Tooltip {...PARAM_GUIDANCE.organicMatter} />
                            </label>
                            <span className="text-xs font-black text-emerald-600">{formData.organicMatter}%</span>
                          </div>
                          <input type="range" min="0.5" max="5.0" step="0.1" value={formData.organicMatter} onChange={e => setFormData({...formData, organicMatter: e.target.value})} className="w-full h-2 bg-slate-100 dark:bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                        </div>
                    </div>
                    <button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
                      {loading ? <Loader2 className="animate-spin" /> : (image ? <><Sparkles size={18}/> Process Photo Intelligence</> : <><Zap size={18}/> Start Analysis</>)}
                    </button>
                </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-10 pb-20 space-y-6">
                <div className="flex justify-between items-center px-4">
                  <button onClick={() => { setResult(null); setImage(null); }} className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest hover:text-emerald-600 transition-colors"><ChevronRight className="rotate-180" size={14}/> Back to Lab</button>
                  <button onClick={saveToNativeDB} disabled={justSaved} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${justSaved ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-900 dark:bg-emerald-600 text-white active:scale-95'}`}>
                    {justSaved ? <CheckCircle size={16} /> : <Save size={16} />} {justSaved ? 'Stored' : 'Save'}
                  </button>
                </div>

                <div className="bg-white dark:bg-[#1C2B22] p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden text-center">
                  <div className={`absolute top-0 left-0 w-full h-2 ${result.health_score < 40 ? 'bg-red-500' : result.health_score < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  <HealthGauge score={result.health_score} />
                  
                  {result.texture_confidence && (
                    <div className="mt-8">
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Visual ID</span>
                      <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                          <span className="text-sm font-black dark:text-emerald-50">{result.texture_confidence.type}</span>
                          <span className="text-[9px] font-black text-emerald-600 opacity-60">{result.texture_confidence.confidence}% match</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ecological Comparison - PRIMARY FOCUS */}
                <EcologicalComparison data={result.ecological_comparison} />

                {result.visual_findings && result.visual_findings.length > 0 && (
                  <div className="bg-white dark:bg-[#1C2B22] rounded-[3rem] p-8 border border-slate-100 dark:border-white/5 shadow-soft">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-600 mb-6 flex items-center gap-2"><Eye size={18}/> Visual Deficiency Check</h4>
                    <ul className="space-y-4">
                      {result.visual_findings.map((f, i) => <li key={i} className="text-xs font-bold text-slate-600 dark:text-emerald-50/70 flex gap-3"><div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0"><AlertTriangle size={10} className="text-amber-600"/></div>{f}</li>)}
                    </ul>
                  </div>
                )}

                <div className="bg-slate-900 dark:bg-[#1C2B22] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform"><Leaf size={180} /></div>
                    <div className="bg-emerald-600 inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg">Regenerative Priority</div>
                    <h5 className="font-black text-3xl text-emerald-50 mb-3 leading-tight">{result.recommendation?.material}</h5>
                    <p className="text-xs text-emerald-50/70 italic mb-8 leading-relaxed font-medium">
                      <Sparkles size={14} className="inline mr-2 text-emerald-400"/> {result.recommendation?.superiority_reason}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm"><span className="text-[8px] font-black uppercase text-emerald-400 block mb-2 tracking-widest">Quantity</span><span className="text-base font-black">{result.recommendation?.quantity}</span></div>
                      <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm"><span className="text-[8px] font-black uppercase text-emerald-400 block mb-2 tracking-widest">Timing</span><span className="text-base font-black">{result.recommendation?.timing}</span></div>
                    </div>
                </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'log' && (
        <div className="px-6 animate-in fade-in pb-24 space-y-6">
           <NPKTrendChart history={savedLogs} />
           <div className="space-y-4">
             {savedLogs.map(log => (
               <div key={log.id} className="bg-white dark:bg-[#1C2B22] p-5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm flex gap-4 items-center group relative overflow-hidden transition-all hover:border-emerald-200">
                 {log.image && <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-white/5"><img src={`data:image/jpeg;base64,${log.image}`} className="w-full h-full object-cover" /></div>}
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                     <div><h4 className="font-black text-slate-900 dark:text-emerald-50 text-base">{log.crop}</h4><span className="text-[9px] text-slate-400 uppercase tracking-widest">{log.date} • {log.soilType}</span></div>
                     <div className={`px-3 py-1 rounded-full text-[9px] font-black ${log.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{log.score}%</div>
                   </div>
                 </div>
                 <button onClick={() => nativeStore.delete('soil_logs', log.id).then(() => setSavedLogs(prev => prev.filter(l => l.id !== log.id)))} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default SoilAnalyzer;