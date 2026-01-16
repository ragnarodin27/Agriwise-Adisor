
import React, { useState, useEffect, useRef } from 'react';
import { diagnoseCrop } from '../services/geminiService';
import { 
  Camera, AlertTriangle, CheckCircle, X, Loader2, Zap, RefreshCw, 
  ChevronRight, Share2, Sprout, Bug, Mountain, Image as ImageIcon, 
  Beaker, Info, ThumbsUp, ThumbsDown, Scissors, Crop, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

const SAMPLES = [
  { id: 'n_def', label: 'Nitrogen Deficiency', crop: 'Corn', symptoms: 'Yellow V-shape on older leaves.', category: 'Nutrient' },
  { id: 'l_blight', label: 'Late Blight', crop: 'Tomato', symptoms: 'Dark water-soaked spots, white fuzz.', category: 'Fungal' },
  { id: 'aphids', label: 'Aphid Swarm', crop: 'Wheat', symptoms: 'Sticky residue, curled new leaves.', category: 'Pest' },
  { id: 'rust', label: 'Leaf Rust', crop: 'Wheat', symptoms: 'Orange-brown pustules on leaf surface.', category: 'Fungal' },
  { id: 'wilt', label: 'Bacterial Wilt', crop: 'Cucumber', symptoms: 'Leaves suddenly drooping while green.', category: 'Bacterial' },
  { id: 'k_def', label: 'Potash Deficiency', crop: 'Fruit Trees', symptoms: 'Leaf edges appearing burnt or scorched.', category: 'Nutrient' }
];

const CropDoctor: React.FC = () => {
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
        setIsCropping(true); // Enter crop mode automatically
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
      alert("Report copied to clipboard!");
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
      <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
      <div className="h-4 bg-slate-100 rounded-lg w-5/6"></div>
      <div className="h-32 bg-slate-50 rounded-2xl w-full"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-slate-100 rounded-xl"></div>
        <div className="h-10 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 pb-24 min-h-screen bg-slate-50 flex flex-col gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <header className="flex justify-between items-start pt-2">
        <div>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('nav.doctor')}</h2>
          </div>
          <p className="text-slate-500 mt-1 text-sm font-medium italic">Advanced Diagnostic Suite v3.2</p>
        </div>
        <button 
          onClick={() => setShowSamples(!showSamples)}
          className="bg-white p-2.5 rounded-2xl text-slate-400 border border-slate-200 shadow-sm hover:text-orange-600 transition-colors"
        >
          <Beaker size={22} />
        </button>
      </header>

      {showSamples && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-[2rem] animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-black text-orange-800 uppercase tracking-widest">Global Samples</h4>
            <button onClick={() => setShowSamples(false)}><X size={16} className="text-orange-400"/></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLES.map(s => (
              <button 
                key={s.id}
                onClick={() => { setSymptoms(`${s.crop}: ${s.symptoms}`); setShowSamples(false); }}
                className="flex flex-col gap-1 bg-white p-3 rounded-2xl border border-orange-100 text-left hover:border-orange-400 transition-all group"
              >
                <div className="text-[10px] font-black text-orange-600 uppercase">{s.category}</div>
                <div className="text-xs font-bold text-slate-800 line-clamp-1">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isCropping && selectedImage ? (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Crop size={18} className="text-orange-500" /> Focus Analysis
            </h3>
            <button onClick={() => setIsCropping(false)} className="text-slate-400"><X size={20}/></button>
          </div>
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 mb-6">
            <img src={selectedImage} className="w-full h-full object-contain opacity-50" />
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-white/50 rounded-full"></div>
               </div>
            </div>
          </div>
          <button 
            onClick={() => setIsCropping(false)}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Check size={16} /> Confirm Focus Area
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            {!selectedImage && !diagnosis ? (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-64 rounded-[2.5rem] border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center p-8 hover:border-orange-500 transition-all cursor-pointer shadow-sm"
                >
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  <div className="bg-orange-50 p-6 rounded-full text-orange-600 mb-4">
                    <Camera size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Launch Camera</h4>
                  <p className="text-sm text-slate-400">Target the affected area</p>
                </div>
                
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full bg-white border border-slate-200 py-4 rounded-3xl flex items-center justify-center gap-3 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <ImageIcon size={20} className="text-orange-500" />
                  Upload Gallery Photo
                </button>
              </div>
            ) : selectedImage && !diagnosis ? (
              <div className="relative h-80 rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl">
                <img src={selectedImage} className="w-full h-full object-cover" alt="Subject" />
                <div className="absolute inset-x-0 h-1 bg-orange-400/50 top-0 animate-scan"></div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => setIsCropping(true)} className="bg-black/50 text-white p-2.5 rounded-2xl"><Crop size={20} /></button>
                  <button onClick={() => setSelectedImage(null)} className="bg-black/50 text-white p-2.5 rounded-2xl"><X size={20} /></button>
                </div>
              </div>
            ) : diagnosis ? (
              <div className="relative h-32 rounded-[2rem] overflow-hidden shadow-lg">
                <img src={selectedImage || ''} className="w-full h-full object-cover blur-sm opacity-50" alt="Analyzed" />
                <div className="absolute inset-0 bg-orange-600/30 flex items-center justify-center gap-3">
                  <CheckCircle className="text-white" size={28} />
                  <span className="text-white font-black text-xl">Report Generated</span>
                </div>
              </div>
            ) : null}
          </div>

          {!diagnosis && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                <Info size={12}/> Symptom Context
              </label>
              <textarea 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className={`w-full bg-white border border-slate-200 rounded-3xl p-5 text-sm outline-none focus:border-orange-500 shadow-sm min-h-[100px] ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder="Describe leaf color, texture, and duration of issue..."
              />
            </div>
          )}

          {!diagnosis ? (
            <button 
              onClick={handleAnalyze}
              disabled={loading || (!selectedImage && !symptoms)}
              className={`w-full h-16 rounded-3xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
                loading ? 'bg-slate-100 text-slate-400' : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Initiate Omni-Scan"}
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
              <div className="bg-white rounded-[2.5rem] p-7 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-5">
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">AI Diagnostic Report</h3>
                  <button onClick={handleShare} className="text-slate-400 hover:text-orange-600 transition-colors flex items-center gap-2">
                    <Share2 size={20} />
                  </button>
                </div>
                
                {loading ? renderSkeleton() : (
                  <div className={`prose prose-sm prose-slate max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
                    <ReactMarkdown>{diagnosis}</ReactMarkdown>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                  {!feedback.submitted ? (
                    <>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-500">Was this diagnosis helpful?</span>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => setFeedback({ ...feedback, helpful: true, submitted: true })} 
                             className="p-2.5 bg-green-50 text-green-600 rounded-xl active:scale-90 transition-transform"
                           >
                             <ThumbsUp size={18} />
                           </button>
                           <button 
                             onClick={() => setFeedback({ ...feedback, helpful: false })} 
                             className={`p-2.5 rounded-xl active:scale-90 transition-transform ${feedback.helpful === false ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}
                           >
                             <ThumbsDown size={18} />
                           </button>
                         </div>
                      </div>
                      
                      {feedback.helpful === false && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <textarea 
                            value={feedback.text}
                            onChange={(e) => setFeedback({ ...feedback, text: e.target.value })}
                            placeholder="Tell us what was missing or incorrect..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs outline-none focus:border-red-400 mb-2"
                          />
                          <button 
                            onClick={() => setFeedback({ ...feedback, submitted: true })}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in zoom-in-95">
                      <Check size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Feedback Recorded. Thank you!</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setDiagnosis(null); setSelectedImage(null); setSymptoms(''); setFeedback({ submitted: false, helpful: null, text: '' }); }}
                  className="mt-6 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-lg"
                >
                  <RefreshCw size={18} /> New Diagnostic Cycle
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-3xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(320px); }
        }
        .animate-scan {
          animation: scan 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default CropDoctor;
