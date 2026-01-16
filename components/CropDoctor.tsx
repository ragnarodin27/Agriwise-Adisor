
import React, { useState, useRef } from 'react';
import { diagnoseCrop } from '../services/geminiService';
import { 
  Camera, X, Loader2, Zap, RefreshCw, Share2, 
  Image as ImageIcon, ScanLine, AlertTriangle, CheckCircle2, 
  ThermometerSun, Sprout, FileText, ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface CropDoctorProps {
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const CropDoctor: React.FC<CropDoctorProps> = ({ logActivity }) => {
  const { language, t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDiagnosis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !symptoms.trim()) return;
    
    setScanning(true);
    // Simulate scanning effect
    setTimeout(async () => {
      setScanning(false);
      setLoading(true);
      try {
        let imageArg = null;
        if (selectedImage) {
          const match = selectedImage.match(/^data:(.*);base64,(.*)$/);
          if (match) imageArg = { mimeType: match[1], data: match[2] };
        }
        const result = await diagnoseCrop(imageArg, symptoms, language);
        setDiagnosis(result);
        if (logActivity) logActivity('DOCTOR', 'Completed diagnostic scan', '🩺');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="p-4 pb-24 min-h-screen">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-200 dark:shadow-none">
              <ScanLine size={24} strokeWidth={2.5} />
            </div>
            {t('nav.doctor')}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">AI Pathology Engine v4.0</p>
        </div>
      </header>

      {/* Main Interface */}
      <div className="space-y-6">
        {!selectedImage ? (
          <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4">
            {/* Camera Trigger */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative group overflow-hidden bg-slate-900 dark:bg-slate-800 h-64 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 shadow-xl transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50"></div>
              
              <div className="relative z-10 bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Camera size={40} className="text-white" />
              </div>
              <h3 className="relative z-10 text-xl font-black text-white mb-1">Initiate Scan</h3>
              <p className="relative z-10 text-slate-400 text-xs font-bold uppercase tracking-widest">Capture Symptom Area</p>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            </button>

            {/* Gallery Trigger */}
            <button 
              onClick={() => galleryInputRef.current?.click()}
              className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 py-6 rounded-[2rem] flex items-center justify-center gap-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ImageIcon size={20} />
              <span>Import from Archive</span>
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
             {/* Preview Card */}
             <div className="relative bg-black rounded-[2.5rem] overflow-hidden shadow-2xl mb-6 group">
                <img src={selectedImage} className={`w-full h-80 object-cover opacity-80 transition-all duration-700 ${scanning ? 'scale-110 blur-sm' : 'scale-100'}`} />
                
                {/* Scanner Overlay Animation */}
                {scanning && (
                  <div className="absolute inset-0 z-20">
                    <div className="w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] absolute top-0 animate-scan"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                          <Loader2 className="text-green-500 animate-spin" />
                          <span className="text-white font-mono text-xs uppercase tracking-widest">Analyzing Tissue...</span>
                       </div>
                    </div>
                  </div>
                )}

                {/* Controls Overlay */}
                {!scanning && !diagnosis && (
                  <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-b from-black/60 via-transparent to-black/80">
                     <div className="flex justify-end">
                        <button onClick={() => setSelectedImage(null)} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition-colors">
                           <X size={20} />
                        </button>
                     </div>
                     <div className="space-y-4">
                        <input 
                           type="text" 
                           value={symptoms} 
                           onChange={(e) => setSymptoms(e.target.value)}
                           placeholder="Describe visible symptoms (optional)..."
                           className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-white placeholder:text-white/50 text-sm font-medium outline-none focus:bg-white/20 transition-all"
                        />
                        <button 
                           onClick={handleAnalyze}
                           className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                           <Zap size={18} fill="currentColor" /> Run Diagnosis
                        </button>
                     </div>
                  </div>
                )}
             </div>

             {/* Diagnosis Report */}
             {diagnosis && !loading && (
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-8">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                     <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl text-green-600 dark:text-green-400">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h3 className="font-black text-xl text-slate-900 dark:text-white">Diagnostic Report</h3>
                        <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                           <CheckCircle2 size={12} className="text-green-500" /> AI Confidence: High
                        </p>
                     </div>
                  </div>

                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-relaxed prose-li:marker:text-orange-500">
                     <ReactMarkdown>{diagnosis}</ReactMarkdown>
                  </div>

                  <div className="mt-8 flex gap-3">
                     <button onClick={() => { setDiagnosis(null); setSelectedImage(null); setSymptoms(''); }} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                        <RefreshCw size={16} /> New Scan
                     </button>
                     <button className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
                        <Share2 size={16} /> Save PDF
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default CropDoctor;
