import React, { useState, useEffect, useRef } from 'react';
import { diagnoseCrop } from '../services/geminiService';
import { Camera, AlertTriangle, CheckCircle, X, Loader2, Zap, RefreshCw, ChevronRight, Share2, Sprout, Bug, Mountain, Image as ImageIcon, Beaker, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

const SAMPLES = [
  {
    id: 'n_def',
    label: 'Nitrogen Deficiency',
    crop: 'Corn (Maize)',
    symptoms: 'Older leaves turning yellow in a V-shape from the tip down the midrib. Stunted growth.',
    category: 'Nutrient'
  },
  {
    id: 'l_blight',
    label: 'Late Blight',
    crop: 'Potato/Tomato',
    symptoms: 'Dark, water-soaked spots on leaves with white fungal growth on the underside during humid weather.',
    category: 'Fungal'
  },
  {
    id: 'aphids',
    label: 'Aphid Swarm',
    crop: 'Rose/Wheat',
    symptoms: 'Clusters of small green/black insects on new shoots. Sticky honeydew residue and curled leaves.',
    category: 'Pest'
  },
  {
    id: 'iron_ch',
    label: 'Iron Chlorosis',
    crop: 'Citrus/Blueberry',
    symptoms: 'Yellowing between green veins on the youngest leaves. Common in high pH soils.',
    category: 'Nutrient'
  }
];

const CropDoctor: React.FC = () => {
  const { language, t, isRTL } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showSamples, setShowSamples] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const MESSAGES = [
    "Analyzing visual patterns...",
    "Comparing species DNA markers...",
    "Assessing symptomatic evidence...",
    "Localized agronomist review in progress...",
    "Generating actionable report..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => setLoadingMsgIdx(prev => (prev + 1) % MESSAGES.length), 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDiagnosis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSample = (sample: typeof SAMPLES[0]) => {
    setSymptoms(`${sample.crop}: ${sample.symptoms}`);
    setDiagnosis(null);
    setShowSamples(false);
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !symptoms.trim()) return;
    setLoading(true);
    setError(null);
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
          <p className="text-slate-500 mt-1 text-sm font-medium italic">Advanced Diagnostic Suite v3.1</p>
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
            <h4 className="text-sm font-black text-orange-800 uppercase tracking-widest">Sample Library</h4>
            <button onClick={() => setShowSamples(false)}><X size={16} className="text-orange-400"/></button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLES.map(s => (
              <button 
                key={s.id}
                onClick={() => loadSample(s)}
                className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-orange-100 text-left hover:border-orange-400 transition-all group"
              >
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  {s.category === 'Pest' ? <Bug size={16}/> : <Sprout size={16}/>}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">{s.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{s.crop}: {s.symptoms}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
              <p className="text-sm text-slate-400">Capture a live photo of the issue</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">Or</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button 
              onClick={() => galleryInputRef.current?.click()}
              className="w-full bg-white border border-slate-200 py-4 rounded-3xl flex items-center justify-center gap-3 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <ImageIcon size={20} className="text-orange-500" />
              Upload from Gallery
            </button>
          </div>
        ) : selectedImage && !diagnosis ? (
          <div className="relative h-80 rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl">
            <img src={selectedImage} className="w-full h-full object-cover" alt="Subject" />
            <div className="absolute inset-x-0 h-1 bg-orange-400/50 top-0 animate-scan"></div>
            <button 
              onClick={() => setSelectedImage(null)} 
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-black/50 text-white p-2.5 rounded-2xl`}
            >
              <X size={20} />
            </button>
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
          <div className={`flex justify-between items-center px-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Info size={12}/> Observation Notes
            </span>
            <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Sprout size={14}/> Plant</div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Bug size={14}/> Pest</div>
            </div>
          </div>
          <textarea 
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className={`w-full bg-white border border-slate-200 rounded-3xl p-5 text-sm outline-none focus:border-orange-500 shadow-sm min-h-[100px] ${isRTL ? 'text-right' : 'text-left'}`}
            placeholder="e.g., Small yellow spots on upper tomato leaves, spreading fast..."
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
          {loading ? (
            <><Loader2 className="animate-spin" /> {MESSAGES[loadingMsgIdx]}</>
          ) : (
            <>Run Diagnostic <ChevronRight size={24}/></>
          )}
        </button>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-white rounded-[2.5rem] p-7 shadow-2xl border border-slate-100">
            <div className={`flex justify-between items-center mb-6 border-b border-slate-50 pb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className="font-black text-xl text-slate-900 tracking-tight">Technical Analysis</h3>
              <button className="text-slate-400 hover:text-orange-600 transition-colors"><Share2 size={20} /></button>
            </div>
            <div className={`prose prose-sm prose-slate max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
              <ReactMarkdown>{diagnosis}</ReactMarkdown>
            </div>
            <button 
              onClick={() => { setDiagnosis(null); setSelectedImage(null); setSymptoms(''); }}
              className="mt-10 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-lg"
            >
              <RefreshCw size={18} /> Perform New Scan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-3xl flex items-center gap-3 animate-bounce">
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
