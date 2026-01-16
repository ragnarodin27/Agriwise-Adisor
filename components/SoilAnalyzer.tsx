
import React, { useState, useEffect, useRef } from 'react';
import { analyzeSoil, SoilAnalysisResult } from '../services/geminiService';
import { LocationData } from '../types';
import { 
  FlaskConical, Sprout, Loader2, ChevronDown, ChevronUp, AlertTriangle, 
  Recycle, ShieldCheck, HeartPulse, Leaf, Check, Waves, Info, 
  Camera, History, TrendingUp, BookOpen, PlusCircle, Save, Calendar,
  FileDown, Share2, Activity, ChevronRight, ImageIcon, Eye, Gauge, Award, 
  ShieldAlert, Sparkles, Microscope, Layers, RotateCw, Bug, Droplets, Beaker
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface SoilAnalyzerProps {
  location: LocationData | null;
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const SoilAnalyzer: React.FC<SoilAnalyzerProps> = ({ location, logActivity }) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({ crop: '', ph: '', organicMatter: '', type: 'Loam' });
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPractices, setShowPractices] = useState(false);

  // Simplified handling for brevity in this redesign focus
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call delay for UX or real call
      const data = await analyzeSoil(formData, location, language);
      setResult(data);
      if (logActivity) logActivity('SOIL', `Analyzed soil for ${formData.crop}`, '🧪');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const NutrientBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{value}% Optimal</span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 pb-24 min-h-screen">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-200 dark:shadow-none">
            <FlaskConical size={24} strokeWidth={2.5} />
          </div>
          {t('nav.soil')}
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">Regenerative Soil Lab</p>
      </header>

      {!result ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-8">
               <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600">
                 <Beaker size={24} />
               </div>
               <div>
                 <h3 className="font-black text-lg text-slate-900 dark:text-white">Sample Input</h3>
                 <p className="text-xs text-slate-400 font-medium">Enter field measurements</p>
               </div>
             </div>

             <div className="space-y-5">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Current Crop</label>
                 <input 
                   type="text" 
                   value={formData.crop} 
                   onChange={e => setFormData({...formData, crop: e.target.value})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                   placeholder="e.g. Winter Wheat"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Soil pH</label>
                    <input 
                      type="number" 
                      value={formData.ph} 
                      onChange={e => setFormData({...formData, ph: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      placeholder="6.5"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Org. Matter %</label>
                    <input 
                      type="number" 
                      value={formData.organicMatter} 
                      onChange={e => setFormData({...formData, organicMatter: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      placeholder="3.0"
                    />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Texture Class</label>
                 <select 
                   value={formData.type} 
                   onChange={e => setFormData({...formData, type: e.target.value})}
                   className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                 >
                   <option>Loam</option>
                   <option>Clay</option>
                   <option>Sandy</option>
                   <option>Silt</option>
                   <option>Peat</option>
                 </select>
               </div>
             </div>

             <button 
               onClick={handleSubmit} 
               disabled={loading}
               className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
             >
               {loading ? <Loader2 className="animate-spin" /> : <><Microscope size={18} /> Analyze Composition</>}
             </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6">
          {/* Scientific Dashboard Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
               <Activity size={120} />
             </div>
             
             <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white">Analysis Report</h3>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ID: {Date.now().toString().slice(-6)}</span>
               </div>
               <div className="text-right">
                 <span className="block text-4xl font-black text-emerald-600">{result.health_score}</span>
                 <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Health Index</span>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
               <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-2 mb-4">
                   <Gauge size={16} className="text-blue-500" />
                   <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Nutrient Profile</h4>
                 </div>
                 <NutrientBar label="Nitrogen (N)" value={result.normalized_n} color="bg-blue-500" />
                 <NutrientBar label="Phosphorus (P)" value={result.normalized_p} color="bg-purple-500" />
                 <NutrientBar label="Potassium (K)" value={result.normalized_k} color="bg-orange-500" />
               </div>

               <div>
                 <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">AI Interpretation</h4>
                 <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-emerald-600">
                   <ReactMarkdown>{result.analysis.split('##')[0]}</ReactMarkdown>
                 </div>
               </div>
             </div>
          </div>

          {/* Organic vs Synthetic Comparison Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="bg-emerald-500/20 p-2 rounded-xl backdrop-blur-sm">
                      <Leaf className="text-emerald-400" size={24} />
                   </div>
                   <h3 className="font-black text-lg uppercase tracking-wider text-emerald-100">Regenerative Impact</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                      <h4 className="text-xs font-black uppercase text-emerald-300 mb-2 flex items-center gap-2">
                        <Check size={12}/> Organic Method
                      </h4>
                      <p className="text-xs text-emerald-50/80 leading-relaxed font-medium">
                        Builds long-term humus, enhances water retention by 20-30%, and fosters mycorrhizal networks vital for nutrient uptake.
                      </p>
                   </div>
                   <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                      <h4 className="text-xs font-black uppercase text-red-300 mb-2 flex items-center gap-2">
                        <AlertTriangle size={12}/> Synthetic Risk
                      </h4>
                      <p className="text-xs text-red-50/80 leading-relaxed font-medium">
                        High salt index degrades soil structure over time, leading to compaction, runoff, and dependency on increasing dosages.
                      </p>
                   </div>
                </div>
             </div>
          </div>

          <button onClick={() => setResult(null)} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            Analyze Another Sample
          </button>
        </div>
      )}
    </div>
  );
};

export default SoilAnalyzer;
