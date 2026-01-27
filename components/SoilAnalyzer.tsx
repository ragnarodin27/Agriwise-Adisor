
import React, { useState, useRef } from 'react';
import { analyzeSoil, SoilAnalysisResult } from '../services/geminiService';
import { LocationData } from '../types';
import { 
  Loader2, Leaf, Camera, Microscope, History, ShieldCheck, Globe2, Sparkles, Brain, Eye, TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SoilAnalyzerProps {
  location: LocationData | null;
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const MicronutrientBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-emerald-500/60">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 dark:bg-emerald-950 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000 ease-out shadow-glow`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const HealthGauge = ({ score }: { score: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score < 40 ? 'text-red-500' : score < 70 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto group">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out shadow-glow`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-black tracking-tighter ${color} transition-all group-hover:scale-110`}>{score}</span>
        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest mt-1">Health Index</span>
      </div>
    </div>
  );
};

const TrendChart = ({ data }: { data: NonNullable<SoilAnalysisResult['historical_trends']> }) => {
  const maxVal = Math.max(...(data.n || []), ...(data.p || []), ...(data.k || []), 10);
  const normalize = (val: number) => 100 - ((val / maxVal) * 80 + 10); 
  
  const getPoints = (arr: number[]) => arr.map((val, i) => {
    const x = (i / (arr.length - 1)) * 300; 
    const y = normalize(val);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-white dark:bg-[#1C2B22] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-soft">
      <div className="flex items-center justify-between mb-6">
         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-emerald-500/60">Nutrient History (Simulated)</h4>
         <div className="flex gap-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">N</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">P</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">K</span></div>
         </div>
      </div>
      <div className="relative">
         <svg viewBox="0 0 300 100" className="w-full h-32 overflow-visible">
            {/* Grid lines */}
            {[20, 50, 80].map(y => (
              <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" strokeDasharray="4"/>
            ))}
            
            {data.n && <polyline points={getPoints(data.n)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {data.p && <polyline points={getPoints(data.p)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {data.k && <polyline points={getPoints(data.k)} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
         </svg>
      </div>
      <div className="flex justify-between mt-4 border-t border-slate-100 dark:border-white/5 pt-2">
         {data.labels?.map((l, i) => (
            <span key={i} className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase">{l}</span>
         ))}
      </div>
    </div>
  );
};

const SoilAnalyzer: React.FC<SoilAnalyzerProps> = ({ location, logActivity }) => {
  const [activeTab, setActiveTab] = useState<'diagnose' | 'log'>('diagnose');
  const [formData, setFormData] = useState({ crop: '', ph: '6.5', organicMatter: '2.5', type: 'Loam' });
  const [result, setResult] = useState<SoilAnalysisResult & { visual_findings?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ mimeType: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const match = base64.match(/^data:(.*);base64,(.*)$/);
        if (match) {
          setImage({ mimeType: match[1], data: match[2] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await analyzeSoil({ ...formData, image }, location, 'en');
      setResult(data);
      if (logActivity) logActivity('SOIL', `Visual & Lab Bio-analysis for ${formData.crop}`, '🧪');
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pb-32 font-sans bg-slate-50 dark:bg-[#0E1F17] transition-all duration-500">
      <header className="px-6 pt-10 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 dark:text-emerald-50 flex items-center gap-4">
                <div className="bg-amber-800 dark:bg-amber-700 p-3 rounded-2xl text-white shadow-lg">
                  <Microscope size={28} />
                </div>
                Soil Biology
            </h2>
            <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
               <Brain size={20} />
            </div>
          </div>
          <div className="bg-white dark:bg-[#1C2B22] p-1.5 rounded-[1.75rem] mt-8 border border-slate-100 dark:border-white/5 flex gap-1 shadow-soft">
             <button onClick={() => setActiveTab('diagnose')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'diagnose' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 dark:text-emerald-500/40'}`}>Diagnostics</button>
             <button onClick={() => setActiveTab('log')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'log' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 dark:text-emerald-500/40'}`}>Past Analysis</button>
          </div>
      </header>

      {activeTab === 'diagnose' ? (
        !result ? (
          <div className="px-6 space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 space-y-8">
                   <div className="space-y-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden relative ${image ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-white/10'}`}
                      >
                         {image ? (
                           <>
                             <img src={`data:${image.mimeType};base64,${image.data}`} className="w-full h-full object-cover opacity-60" />
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Eye size={32} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Image Ready for AI</span>
                             </div>
                           </>
                         ) : (
                           <>
                             <div className="p-4 bg-slate-50 dark:bg-[#0E1F17] rounded-full text-slate-400">
                                <Camera size={28} />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Soil Photo for Visual Check</span>
                           </>
                         )}
                         <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500/60 tracking-widest pl-2">Target Crop</label>
                        <input type="text" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 border-2 border-transparent focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Heirloom Tomato" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Known pH</label>
                          <input type="number" step="0.1" value={formData.ph} onChange={e => setFormData({...formData, ph: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Organic Matter %</label>
                          <input type="number" step="0.1" value={formData.organicMatter} onChange={e => setFormData({...formData, organicMatter: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500" />
                        </div>
                      </div>
                   </div>
                   <button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
                     {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18}/> {image ? 'Analyze Photo + Data' : 'Initiate Lab Analysis'}</>}
                   </button>
              </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-10 pb-20 px-4 space-y-6">
              {/* Health Score Gauge */}
              <div className="bg-white dark:bg-[#1C2B22] p-10 rounded-[3rem] text-center border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 shadow-glow"></div>
                 <HealthGauge score={result.health_score} />
                 
                 <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                    <MicronutrientBar label="Nitrogen (N)" value={result.nutrients?.n || 0} color="bg-blue-500" />
                    <MicronutrientBar label="Phosphorus (P)" value={result.nutrients?.p || 0} color="bg-emerald-500" />
                    <MicronutrientBar label="Potassium (K)" value={result.nutrients?.k || 0} color="bg-amber-500" />
                    <MicronutrientBar label="Iron (Fe)" value={result.nutrients?.iron || 0} color="bg-orange-500" />
                    <MicronutrientBar label="Zinc (Zn)" value={result.nutrients?.zinc || 0} color="bg-indigo-500" />
                    <MicronutrientBar label="Boron (B)" value={result.nutrients?.boron || 0} color="bg-rose-500" />
                 </div>
              </div>

              {/* Visual Findings */}
              {result.visual_findings && result.visual_findings.length > 0 && (
                <div className="bg-emerald-500/10 dark:bg-[#1C2B22] border border-emerald-500/30 rounded-[2.5rem] p-8 shadow-soft space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                      <Eye size={20} />
                    </div>
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Vision Analysis findings</h4>
                  </div>
                  <ul className="space-y-2">
                    {result.visual_findings.map((finding, idx) => (
                      <li key={idx} className="flex gap-3 text-xs font-bold text-slate-700 dark:text-emerald-50/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ecological Impact Analysis */}
              <div className="bg-white dark:bg-[#1C2B22] rounded-[2.5rem] p-8 shadow-soft border border-slate-100 dark:border-white/5 space-y-4 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <Globe2 size={80} />
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                      <Globe2 size={20} />
                    </div>
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-800 dark:text-emerald-400">Ecological Impact Analysis</h4>
                  </div>
                  <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none border-l-2 border-blue-500/20 pl-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                     <ReactMarkdown>{result.ecological_comparison}</ReactMarkdown>
                  </div>
              </div>

              {/* Recommendation Card */}
              <div className="bg-slate-900 dark:bg-[#1C2B22] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden text-left group">
                  <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Leaf size={180} />
                  </div>
                  <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase mb-6 shadow-glow animate-pulse">
                    <ShieldCheck size={14} /> Organic Priority Recommendation
                  </div>
                  
                  <div className="relative z-10">
                    <h5 className="font-black text-2xl text-emerald-50 mb-3 leading-tight">{result.recommendation?.material}</h5>
                    <p className="text-xs text-emerald-50/70 italic mb-6 leading-relaxed max-w-xs">{result.recommendation?.superiority_reason}</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <span className="text-[8px] font-black uppercase text-emerald-400 mb-1">Quantity</span>
                          <span className="text-sm font-bold">{result.recommendation?.quantity}</span>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <div className="flex items-center gap-1 mb-1">
                             <TrendingUp size={10} className="text-emerald-400" />
                             <span className="text-[8px] font-black uppercase text-emerald-400">Timing</span>
                          </div>
                          <span className="text-sm font-bold">{result.recommendation?.timing}</span>
                       </div>
                    </div>
                  </div>
              </div>

              <button onClick={() => { setResult(null); setImage(null); }} className="w-full py-6 text-slate-400 dark:text-emerald-500/40 font-black uppercase text-[10px] tracking-[0.3em] hover:text-emerald-600 transition-colors">Reset Lab Parameters</button>
          </div>
        )
      ) : (
        <div className="px-6 animate-in fade-in">
           {result?.historical_trends ? (
             <div className="space-y-6">
               <TrendChart data={result.historical_trends} />
               <div className="p-6 bg-white dark:bg-[#1C2B22] rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Trend Analysis</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nitrogen levels are stabilizing due to recent cover cropping. Continue monitoring Potassium before the next flowering stage.
                  </p>
               </div>
             </div>
           ) : (
             <div className="py-20 text-center opacity-30 flex flex-col items-center">
               <History size={48} className="mb-4" />
               <p className="text-xs font-black uppercase tracking-widest">No Analysis Data Available</p>
               <p className="text-[10px] mt-2 max-w-[200px]">Run a diagnostic check to generate simulated historical trends.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SoilAnalyzer;
