
import React, { useState, useEffect, useRef } from 'react';
import { diagnoseCrop } from '../services/geminiService';
import { 
  Camera, AlertTriangle, CheckCircle, X, Loader2, Zap, RefreshCw, 
  ChevronRight, Share2, Sprout, Bug, Mountain, Image as ImageIcon, 
  Beaker, Info, ThumbsUp, ThumbsDown, Scissors, Crop, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface CropDoctorProps {
  logActivity?: (type: string, desc: string, icon: string) => void;
}

const SAMPLES = [
  { id: 'n_def', label: 'Nitrogen Deficiency', crop: 'Corn', symptoms: 'Yellow V-shape on older leaves.', category: 'Nutrient' },
  { id: 'l_blight', label: 'Late Blight', crop: 'Tomato', symptoms: 'Dark water-soaked spots, white fuzz.', category: 'Fungal' },
  { id: 'aphids', label: 'Aphid Swarm', crop: 'Wheat', symptoms: 'Sticky residue, curled new leaves.', category: 'Pest' },
  { id: 'rust', label: 'Leaf Rust', crop: 'Wheat', symptoms: 'Orange-brown pustules on leaf surface.', category: 'Fungal' },
  { id: 'wilt', label: 'Bacterial Wilt', crop: 'Cucumber', symptoms: 'Leaves suddenly drooping while green.', category: 'Bacterial' },
  { id: 'k_def', label: 'Potash Deficiency', crop: 'Fruit Trees', symptoms: 'Leaf edges appearing burnt or scorched.', category: 'Nutrient' }
];

const CropDoctor: React.FC<CropDoctorProps> = ({ logActivity }) => {
  const { language, t, isRTL } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [feedback, setFeedback] = useState<{ submitted: boolean; helpful: boolean | null; text: string }>({ submitted: false, helpful: null, text: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsCropping(true); 
        setDiagnosis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !symptoms.trim()) return;
    setLoading(true);
    setError(null);
    setFeedback({ submitted: false, helpful: null, text: '' });
    try {
      let imageArg = null;
      if (selectedImage) {
        const match = selectedImage.match(/^data:(.*);base64,(.*)$/);
        if (match) imageArg = { mimeType: match[1], data: match[2] };
      }
      const result = await diagnoseCrop(imageArg, symptoms, language);
      setDiagnosis(result);
      if (logActivity) {
        logActivity('DOCTOR', 'Performed crop diagnosis scan', '🔍');
      }
    } catch (err) {
      setError("AI analysis failed. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const text = `AgriWise Crop Diagnosis:\n\n${diagnosis}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'AgriWise Diagnosis', text });
      } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className={`p-4 pb-24 min-h-screen flex flex-col gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <header className="flex justify-between items-start pt-2 px-1">
        <div>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('nav.doctor')}</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium italic">Advanced Diagnostic Suite v3.2</p>
        </div>
        <button 
          onClick={() => setShowSamples(!showSamples)}
          className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:text-orange-600 transition-colors"
        >
          <Beaker size={22} />
        </button>
      </header>

      {/* Main UI similar to existing but with dark mode compatibility */}
      {isCropping && selectedImage ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Crop size={18} className="text-orange-500" /> Focus Analysis
            </h3>
            <button onClick={() => setIsCropping(false)} className="text-slate-400"><X size={20}/></button>
          </div>
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 mb-6">
            <img src={selectedImage} className="w-full h-full object-contain opacity-50" />
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
          </div>
          <button 
            onClick={() => setIsCropping(false)}
            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Check size={16} /> Confirm Focus Area
          </button>
        </div>
      ) : (
        <>
          {!diagnosis ? (
            <div className="space-y-4">
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-64 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center text-center p-8 hover:border-orange-500 transition-all cursor-pointer shadow-sm"
                >
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-full text-orange-600 mb-4">
                    <Camera size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Launch Camera</h4>
                  <p className="text-sm text-slate-400">Target the affected area</p>
                </div>
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 rounded-3xl flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                >
                  <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <ImageIcon size={20} className="text-orange-500" />
                  Upload Gallery Photo
                </button>
            </div>
          ) : (
             <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-7 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-8">
                <div className="flex justify-between items-center mb-6 border-b border-slate-50 dark:border-slate-700 pb-5">
                  <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">AI Diagnostic Report</h3>
                  <button onClick={handleShare} className="text-slate-400 hover:text-orange-600 transition-colors flex items-center gap-2">
                    <Share2 size={20} />
                  </button>
                </div>
                <div className={`prose prose-sm prose-slate dark:prose-invert max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
                  <ReactMarkdown>{diagnosis}</ReactMarkdown>
                </div>
                <button 
                  onClick={() => { setDiagnosis(null); setSelectedImage(null); setSymptoms(''); }}
                  className="mt-8 w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-lg"
                >
                  <RefreshCw size={18} /> New Diagnosis Scan
                </button>
             </div>
          )}
        </>
      )}
    </div>
  );
};

export default CropDoctor;
