
import React, { useState, useRef, useEffect } from 'react';
import { diagnoseCrop, DiagnosisResult, generateSpeech } from '../services/geminiService';
import { 
  Loader2, ScanLine, Camera, Image as ImageIcon, Bug, Shield, RefreshCw, Zap, X, Sparkles, AlertTriangle, ShieldCheck, ChevronRight, Sprout, Map as MapIcon, LocateFixed, CalendarPlus, CheckCircle, Volume2, Info, ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';
import { LocationData } from '../types';

interface CropDoctorProps {
  logActivity?: (type: string, desc: string, icon: string) => void;
  location: LocationData | null;
}

type Step = 'init' | 'analyzing' | 'result';
type TreatmentType = 'organic' | 'chemical';

const CropDoctor: React.FC<CropDoctorProps> = ({ logActivity, location }) => {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>('init'); 
  const [targetCrop, setTargetCrop] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('organic');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        setCapturedImage(base64);
        await analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setStep('analyzing');
    try {
      const match = base64Image.match(/^data:(.*);base64,(.*)$/);
      const result = await diagnoseCrop(match ? { mimeType: match[1], data: match[2] } : null, targetCrop || "Crop", language);
      setDiagnosis(result);
      setStep('result');
      if (logActivity) logActivity('SCAN', `Diagnosis: ${result?.diagnosis}`, '🩺');
    } catch (error) {
      setStep('init');
    }
  };

  const speakResult = async () => {
    if (!diagnosis || isSpeaking) return;
    setIsSpeaking(true);
    const textToSpeak = `Diagnosis: ${diagnosis.diagnosis}. Severity: ${diagnosis.severity}. Recommended Action: ${diagnosis.action_today}. ${treatmentType === 'organic' ? 'Organic Treatment:' + diagnosis.organic_treatment : 'Chemical Treatment:' + diagnosis.chemical_treatment}`;
    
    try {
      const base64Audio = await generateSpeech(textToSpeak, language);
      if (base64Audio) {
        const audioBlob = await (await fetch(`data:audio/pcm;base64,${base64Audio}`)).blob();
        const url = URL.createObjectURL(audioBlob);
        if (audioRef.current) audioRef.current.src = url;
        else {
           audioRef.current = new Audio(url);
           audioRef.current.onended = () => setIsSpeaking(false);
        }
        audioRef.current.play();
      }
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 pb-24 ${step === 'analyzing' ? 'bg-black' : 'bg-slate-50 dark:bg-[#0E1F17]'}`}>
      {step !== 'analyzing' && (
        <header className="px-6 pt-10 mb-8 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="bg-rose-600 p-2.5 rounded-xl text-white shadow-lg">
                 <ScanLine size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-emerald-50">Crop Doctor</h2>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Vision Diagnostic</p>
              </div>
           </div>
           {step === 'result' && (
             <button onClick={speakResult} className={`p-3 rounded-xl transition-all ${isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-white dark:bg-[#1C2B22] text-rose-600 shadow-soft'}`}>
               <Volume2 size={20} />
             </button>
           )}
        </header>
      )}

      {step === 'init' && (
        <div className="px-6 space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 text-center">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Identify Target Crop</label>
              <input 
                type="text" 
                value={targetCrop}
                onChange={(e) => setTargetCrop(e.target.value)}
                placeholder="e.g. Wheat, Tomato, Rice..." 
                className="w-full bg-slate-50 dark:bg-[#0E1F17] p-5 rounded-2xl font-black text-sm dark:text-emerald-50 outline-none border-2 border-transparent focus:border-rose-500 mb-6 text-center"
              />
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button 
                onClick={startScan}
                disabled={!targetCrop.trim()}
                className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest bg-rose-600 text-white shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
              >
                <Camera size={18} /> Launch Full-Screen Scanner
              </button>
           </div>
           
           <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-4">
              <ShieldCheck className="text-emerald-600 mt-1 shrink-0" size={24} />
              <div>
                <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-600 mb-1">Precision Guarantee</h4>
                <p className="text-xs font-bold text-slate-600 dark:text-emerald-50/60 leading-relaxed">Our AI analyzes visual pathology markers to identify deficiencies, fungal infections, and pest damage.</p>
              </div>
           </div>
        </div>
      )}

      {step === 'analyzing' && capturedImage && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
           <div className="absolute top-6 left-6 z-10">
             <button onClick={() => setStep('init')} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"><X size={24} /></button>
           </div>
           
           <img src={capturedImage} className="w-full h-full object-cover opacity-60" />
           
           {/* Visual Scan Overlay */}
           <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-emerald-500 rounded-3xl opacity-50">
               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1"></div>
               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1"></div>
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1"></div>
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1"></div>
             </div>
             <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] animate-scanner-line"></div>
           </div>
           
           <div className="absolute bottom-12 left-0 right-0 px-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="text-emerald-500 animate-spin mb-2" />
                <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500">Neural Pathology Mapping</p>
                <p className="text-white/50 text-[10px] font-bold">Scanning pixel vectors for disease markers...</p>
              </div>
           </div>
           <style>{`
             @keyframes scanner-line {
               0% { top: 0%; }
               100% { top: 100%; }
             }
             .animate-scanner-line { animation: scanner-line 3s linear infinite; }
           `}</style>
        </div>
      )}

      {step === 'result' && diagnosis && (
        <div className="px-6 space-y-6 animate-in slide-in-from-bottom-10 pb-20">
           {/* Summary Block */}
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${diagnosis.severity === 'Critical' ? 'bg-red-500' : diagnosis.severity === 'High' ? 'bg-orange-500' : 'bg-amber-500'}`}></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-emerald-50 mb-1">{diagnosis.diagnosis}</h3>
                   <div className="flex items-center gap-2">
                     <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${diagnosis.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                       {diagnosis.severity} Severity
                     </span>
                     {diagnosis.confidence && <span className="text-[9px] font-bold text-slate-400">{Math.round(diagnosis.confidence * 100)}% Confidence</span>}
                   </div>
                </div>
                {capturedImage && <img src={capturedImage} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />}
              </div>

              {/* Toggle for Treatments */}
              <div className="bg-slate-50 dark:bg-[#0E1F17] p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 mb-6">
                 {(['organic', 'chemical'] as const).map(type => (
                   <button 
                    key={type}
                    onClick={() => setTreatmentType(type)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${treatmentType === type ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md' : 'text-slate-400'}`}
                   >
                     {type}
                   </button>
                 ))}
              </div>

              {/* 3 Blocks of Result */}
              <div className="space-y-4">
                 {/* 1. ISSUE BLOCK */}
                 <div className="flex gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl h-fit"><Bug size={18}/></div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Biological Issue</h4>
                      <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/70 leading-relaxed">{diagnosis.diagnosis}</p>
                    </div>
                 </div>

                 {/* 2. SEVERITY/URGENCY BLOCK */}
                 <div className="flex gap-4 p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl h-fit"><AlertTriangle size={18}/></div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Immediate Action Required</h4>
                      <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/70 leading-relaxed">{diagnosis.action_today}</p>
                    </div>
                 </div>

                 {/* 3. TREATMENT BLOCK */}
                 <div className={`flex gap-4 p-5 rounded-3xl border ${treatmentType === 'organic' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30'}`}>
                    <div className={`p-2.5 rounded-xl h-fit ${treatmentType === 'organic' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {treatmentType === 'organic' ? <ShieldCheck size={18}/> : <FlaskConical size={18}/>}
                    </div>
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${treatmentType === 'organic' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {treatmentType === 'organic' ? 'Organic Prescription' : 'Precision Chemical Fix'}
                      </h4>
                      <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/70 leading-relaxed">
                        {treatmentType === 'organic' ? diagnosis.organic_treatment : diagnosis.chemical_treatment}
                      </p>
                    </div>
                 </div>
              </div>
           </div>

           <button onClick={() => setStep('init')} className="w-full py-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 hover:text-rose-600 transition-colors">
              <RefreshCw size={14} /> Reset Diagnostic Engine
           </button>
        </div>
      )}
    </div>
  );
};

const FlaskConical = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v8L4.5 20.29A2 2 0 0 0 6.2 23h11.6a2 2 0 0 0 1.7-2.71L14 10V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
);

export default CropDoctor;
