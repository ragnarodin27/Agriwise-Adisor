
import React, { useState, useEffect, useRef } from 'react';
import { analyzeSoil, SoilAnalysisResult } from '../services/geminiService';
import { LocationData } from '../types';
import { 
  FlaskConical, Sprout, Loader2, ChevronDown, ChevronUp, AlertTriangle, 
  Recycle, ShieldCheck, HeartPulse, Leaf, Check, Waves, Info, 
  Camera, History, TrendingUp, BookOpen, PlusCircle, Save, Calendar,
  FileDown, Share2, Activity, ChevronRight, ImageIcon, Eye, Gauge, Award, 
  ShieldAlert, Sparkles, Microscope
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface SoilAnalyzerProps {
  location: LocationData | null;
}

interface SoilEntry extends SoilAnalysisResult {
  date: string;
  id: string;
  crop: string;
  organicMatter: string;
  thumbnail?: string;
}

const SoilAnalyzer: React.FC<SoilAnalyzerProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({ crop: '', ph: '', organicMatter: '', type: 'Loam' });
  const [soilPhoto, setSoilPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SoilEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('soil_history_v3');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (data: SoilAnalysisResult) => {
    const entry: SoilEntry = {
      ...data,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      crop: formData.crop || 'Unnamed Plot',
      organicMatter: formData.organicMatter || 'N/A',
      thumbnail: soilPhoto || undefined
    };
    const newHistory = [entry, ...history].slice(0, 15);
    setHistory(newHistory);
    localStorage.setItem('soil_history_v3', JSON.stringify(newHistory));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSoilPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let imageArg = null;
      if (soilPhoto) {
        const match = soilPhoto.match(/^data:(.*);base64,(.*)$/);
        if (match) imageArg = { mimeType: match[1], data: match[2] };
      }
      const data = await analyzeSoil({ ...formData, image: imageArg }, location || undefined, language);
      setResult(data);
      saveToHistory(data);
    } catch (err) { 
      setError("Visual analysis failed. Ensure photo is clear."); 
    } finally { 
      setLoading(false); 
    }
  };

  const renderHealthGauge = (score: number) => {
    const rotation = (score / 100) * 180 - 90;
    return (
      <div className="relative flex flex-col items-center justify-center pt-4 pb-2 scale-90">
        <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="15" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-gradient)" strokeWidth="15" strokeLinecap="round" strokeDasharray={`${(score / 100) * 251.3} 251.3`} className="transition-all duration-1000 ease-out" />
          <g transform={`rotate(${rotation}, 100, 100)`}>
            <line x1="100" y1="100" x2="100" y2="35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill="#1e293b" />
          </g>
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#eab308" /><stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-2 text-center">
          <span className="text-3xl font-black text-slate-900">{score}%</span>
          <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Biological Health</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 flex justify-between items-start pt-2 px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-2xl shadow-sm border border-amber-200">
              <FlaskConical size={24} className="text-amber-700" />
            </div>
            {t('nav.soil')}
          </h2>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest">Biological Regenerative Lab</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all ${showHistory ? 'bg-amber-600 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>
          <History size={20} />
        </button>
      </header>

      {showHistory && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-8 px-1 space-y-3">
          {history.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-transform" onClick={() => { setResult(entry); setSoilPhoto(entry.thumbnail || null); }}>
              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                {entry.thumbnail ? <img src={entry.thumbnail} className="w-full h-full object-cover" /> : <FlaskConical className="w-full h-full p-3 text-slate-300" />}
              </div>
              <div className="flex-1">
                <h5 className="font-black text-slate-800 text-sm">{entry.crop}</h5>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.date} • Health: {entry.health_score}%</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}
        </div>
      )}

      {!result ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} className="text-amber-500" />
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Specimen Analysis</h3>
            </div>
            
            {!soilPhoto ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-amber-400 transition-all group">
                  <Camera size={32} className="text-slate-300 group-hover:text-amber-500 mb-2" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Camera</span>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                </button>
                <button onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-amber-400 transition-all group">
                  <ImageIcon size={32} className="text-slate-300 group-hover:text-amber-500 mb-2" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Gallery</span>
                  <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </button>
              </div>
            ) : (
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-inner border border-slate-200">
                <img src={soilPhoto} className="w-full h-full object-cover" />
                <button onClick={() => setSoilPhoto(null)} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-xl backdrop-blur-md"><PlusCircle className="rotate-45" size={20} /></button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
             <input type="text" value={formData.crop} onChange={(e) => setFormData({...formData, crop: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:border-amber-500 transition-colors" placeholder="Plot Identifier / Crop Name" />
             <div className="grid grid-cols-2 gap-4">
               <input type="number" step="0.1" value={formData.ph} onChange={(e) => setFormData({...formData, ph: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" placeholder="Soil pH (Optional)" />
               <input type="number" step="0.1" value={formData.organicMatter} onChange={(e) => setFormData({...formData, organicMatter: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800" placeholder="Org. Matter %" />
             </div>
          </div>

          <button 
            onClick={() => handleSubmit()} 
            disabled={loading || !soilPhoto} 
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Eye size={18}/> Analyze Biological State</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
           {/* Result Header with Organic Priority Badge */}
           <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 overflow-hidden relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-2xl text-slate-900">Soil Microbiome</h3>
                  <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full w-fit">
                    <Leaf size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Organic Priority Analysis</span>
                  </div>
                </div>
                <button onClick={() => setResult(null)} className="h-10 w-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center"><PlusCircle className="rotate-45" size={20} /></button>
              </div>

              <div className="flex items-center gap-6 mb-8">
                 <div className="h-28 w-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl rotate-3 shrink-0">
                    <img src={soilPhoto || ''} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">{renderHealthGauge(result.health_score)}</div>
              </div>

              {result.texture_confidence && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Award className="text-emerald-600" size={20} />
                      <div>
                        <span className="block text-[8px] font-black uppercase text-emerald-600">Identified Biotype</span>
                        <span className="block text-sm font-black text-slate-800">{result.texture_confidence.type}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="block text-[10px] font-black text-emerald-700">{result.texture_confidence.score}%</span>
                      <span className="block text-[8px] font-black uppercase text-emerald-400">Visual Match</span>
                   </div>
                </div>
              )}
           </div>

           {/* Regenerative Directive Card */}
           <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[3rem] p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/20 rounded-xl"><Recycle size={20} /></div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-200">Regenerative Directive</h4>
                </div>
                
                <div className="prose prose-sm prose-invert max-w-none text-emerald-50 leading-relaxed mb-8">
                    <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>

                {/* Primary Choices Educational Highlight */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/5">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-3 flex items-center gap-2">
                     <Microscope size={14}/> Ecological Why?
                   </h5>
                   <p className="text-[11px] font-medium leading-relaxed opacity-90 italic">
                     "Biological inputs like compost, worm castings, and biochar don't just supply nutrients; they rebuild the 'Soil Food Web'. By fostering microbial diversity, you improve water retention and natural pest resistance—superior to synthetic inputs that degrade soil structure over time."
                   </p>
                </div>
              </div>
           </div>

           {/* Cautionary Information for Synthetics */}
           <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2.5rem] flex items-start gap-4">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0"><ShieldAlert size={20}/></div>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1 flex items-center gap-2">
                  Chemical Caution
                </h5>
                <p className="text-[11px] font-bold text-amber-700 leading-tight">
                  Synthetic N-P-K salts provide temporary growth but often burn beneficial mycorrhizal fungi. Over-reliance leads to soil salinity and the 'chemical treadmill' effect.
                </p>
              </div>
           </div>
           
           <button onClick={() => setResult(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
             Start New Analysis
           </button>
        </div>
      )}
    </div>
  );
};

export default SoilAnalyzer;
