
import React, { useState, useRef } from 'react';
import { diagnoseCrop, DiagnosisResult } from '../services/geminiService';
import { 
  ScanLine, Camera, Bug, RefreshCw, X, Sparkles, AlertTriangle, ShieldCheck, ChevronRight, Sprout
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const PEST_DB = [
  { 
    name: 'Aphids', 
    symptom: 'Small green/black insects, curled sticky leaves, stunted growth.', 
    remedy: 'Strong water jet, Neem oil spray, or introducing Ladybugs.', 
    icon: '🦟',
    category: 'Insect',
    organic_logic: 'Biological control via predators and essential oil disruption.'
  },
  { 
    name: 'Early Blight', 
    symptom: 'Circular brown spots on older leaves with yellow halos.', 
    remedy: 'Remove infected leaves, apply baking soda spray, or copper fungicide (organic certified).', 
    icon: '🍂',
    category: 'Fungal',
    organic_logic: 'Altering leaf pH to prevent fungal spore germination.'
  },
  { 
    name: 'Spider Mites', 
    symptom: 'Yellow stippling on leaves, fine silk webbing on undersides.', 
    remedy: 'Maintain high humidity, introduce Phytoseiulus mites, or use horticultural soap.', 
    icon: '🕷️',
    category: 'Arachnid',
    organic_logic: 'Physical removal and environmental modification to disrupt breeding.'
  }
];

type Step = 'init' | 'analyzing' | 'result' | 'database';

const CropDoctor: React.FC<any> = ({ logActivity }) => {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>('init'); 
  const [targetCrop, setTargetCrop] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [selectedPest, setSelectedPest] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScan = () => {
    if (!targetCrop.trim()) return;
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setStep('analyzing');
    try {
      const match = base64Image.match(/^data:(.*);base64,(.*)$/);
      const result = await diagnoseCrop(match ? { mimeType: match[1], data: match[2] } : null, targetCrop || "Target Crop", language);
      setDiagnosis(result);
      setStep('result');
      if (logActivity) logActivity('SCAN', `AI Crop Diagnosis: ${result?.diagnosis} on ${targetCrop}`, '🩺');
    } catch (error) {
      console.error(error);
      setStep('init');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1F17] relative transition-all duration-500">
      <header className="px-6 pt-10 mb-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-rose-600 p-2.5 rounded-xl text-white shadow-lg shadow-rose-900/20">
               <ScanLine size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-emerald-50">Crop Doctor</h2>
               <p className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest">Vision Intelligence</p>
            </div>
         </div>
         <button onClick={() => setStep('database')} className="p-3 bg-white dark:bg-[#1C2B22] rounded-2xl shadow-sm dark:text-emerald-400">
            <Bug size={20} />
         </button>
      </header>

      {step === 'init' && (
        <div className="px-6 space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600 mb-6">
                 <Sprout size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-emerald-50 mb-2">Identify Target</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-emerald-500/60 mb-8 max-w-[200px] leading-relaxed">Enter the crop name before initiating the AI multimodal scan.</p>
              
              <div className="w-full mb-6">
                 <input 
                   type="text" 
                   value={targetCrop}
                   onChange={(e) => setTargetCrop(e.target.value)}
                   placeholder="e.g. Rice, Wheat, Tomato..." 
                   className="w-full bg-slate-50 dark:bg-[#0E1F17] p-5 rounded-2xl font-black text-sm dark:text-emerald-50 outline-none border-2 border-transparent focus:border-rose-500 transition-all placeholder:text-slate-300"
                 />
              </div>

              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button 
                onClick={startScan}
                disabled={!targetCrop.trim()}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${targetCrop.trim() ? 'bg-rose-600 text-white shadow-rose-600/20 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                <Camera size={18} /> Take Photo <ChevronRight size={18} />
              </button>
              
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Gemini 3 Pro Vision enabled for pathogen detection</p>
           </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
           <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-rose-500/20 border-t-rose-600 animate-spin" />
              <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-600" />
           </div>
           <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-emerald-500 mb-2">Gemini Vision Intelligence</p>
              <p className="text-sm font-bold text-slate-800 dark:text-emerald-50 animate-pulse">Scanning for Pathogens & Pests...</p>
           </div>
        </div>
      )}

      {step === 'result' && diagnosis && (
        <div className="px-6 space-y-6 animate-in slide-in-from-bottom-10 pb-20">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${diagnosis.severity === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-emerald-50 leading-none mb-1">{diagnosis.diagnosis}</h3>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Diagnostic Report • {targetCrop}</span>
                 </div>
                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${diagnosis.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {diagnosis.severity} Severity
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-3xl flex gap-3">
                    <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                    <div>
                       <p className="text-[9px] font-black uppercase text-rose-600 mb-1">AI Observation</p>
                       <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/70">{diagnosis.action_today}</p>
                    </div>
                 </div>

                 <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2 mb-3">
                       <ShieldCheck size={18} className="text-emerald-600" />
                       <h5 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Regenerative Prescription</h5>
                    </div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400 mb-2 leading-relaxed">{diagnosis.organic_treatment}</p>
                 </div>
              </div>
           </div>

           <button onClick={() => { setStep('init'); setDiagnosis(null); }} className="w-full py-6 text-slate-400 dark:text-emerald-500/40 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 hover:text-rose-600 transition-colors">
              <RefreshCw size={14} /> Start New Scan
           </button>
        </div>
      )}

      {step === 'database' && (
        <div className="px-6 space-y-4 pb-32 animate-in fade-in">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-emerald-500">Pest Library</h3>
              <button onClick={() => setStep('init')} className="text-xs font-bold text-rose-600">Back</button>
           </div>
           {PEST_DB.map((pest, i) => (
              <button key={i} onClick={() => setSelectedPest(pest)} className="w-full bg-white dark:bg-[#1C2B22] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-start gap-4 text-left group transition-all hover:border-rose-200">
                 <div className="text-4xl group-hover:scale-110 transition-transform">{pest.icon}</div>
                 <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-emerald-50">{pest.name}</h4>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 dark:text-emerald-500/40 block mb-2">{pest.category}</span>
                    <p className="text-[10px] text-slate-500 dark:text-emerald-500/60 line-clamp-2">{pest.symptom}</p>
                 </div>
              </button>
           ))}
        </div>
      )}

      {selectedPest && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end">
           <div className="w-full bg-white dark:bg-[#1C2B22] rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                    <span className="text-5xl">{selectedPest.icon}</span>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-emerald-50">{selectedPest.name}</h2>
                       <span className="bg-rose-50 text-rose-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">{selectedPest.category}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedPest(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20}/></button>
              </div>
              <div className="space-y-6">
                 <div className="bg-slate-50 dark:bg-[#0E1F17] p-5 rounded-3xl">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Symptoms</h5>
                    <p className="text-sm font-medium text-slate-700 dark:text-emerald-50/70">{selectedPest.symptom}</p>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Organic Action</h5>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400 mb-3">{selectedPest.remedy}</p>
                    <div className="pt-3 border-t border-emerald-100 dark:border-emerald-800/30">
                       <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Ecological Logic</p>
                       <p className="text-[11px] text-emerald-800/60 dark:text-emerald-500/60 italic leading-relaxed">{selectedPest.organic_logic}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CropDoctor;
