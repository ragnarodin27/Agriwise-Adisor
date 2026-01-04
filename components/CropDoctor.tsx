import React, { useState, useEffect } from 'react';
import { diagnoseCrop } from '../services/geminiService';
import { Camera, Upload, AlertTriangle, CheckCircle, X, Loader2, FileText, ImageIcon, ThumbsUp, ThumbsDown, Share2, RotateCw, RotateCcw, Crop as CropIcon, Send, RefreshCw, ChevronRight, Undo2, Zap, WifiOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

// Declare ml5 globally from the script tag
declare const ml5: any;

const SAMPLES = [
  {
    id: 1,
    label: 'Maize Nitrogen Deficiency',
    symptoms: 'Older leaves turning yellow in a V-shape starting from the tip. Stunted growth observed.',
    image: null
  },
  {
    id: 2,
    label: 'Tomato Early Blight',
    symptoms: 'Dark concentric spots on lower leaves (bullseye pattern). Leaves turning yellow and dropping.',
    image: null
  },
];

const CropDoctor: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  // Offline ML State
  const [classifier, setClassifier] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [offlineResult, setOfflineResult] = useState<{label: string, confidence: number}[] | null>(null);

  const LOADING_MESSAGES = [
    "Analyzing visual patterns...",
    "Checking for deficiency signatures...",
    "Comparing with pest databases...",
    "Generating treatment plan..."
  ];

  // Initialize Offline Model
  useEffect(() => {
      const loadModel = async () => {
          if (typeof ml5 !== 'undefined') {
              try {
                  console.log("Loading offline model...");
                  const loadedClassifier = await ml5.imageClassifier('MobileNet');
                  setClassifier(loadedClassifier);
                  setIsModelLoading(false);
                  console.log("Offline model loaded");
              } catch (e) {
                  console.error("Failed to load offline model", e);
                  setIsModelLoading(false);
              }
          } else {
               setTimeout(loadModel, 1000);
          }
      };
      loadModel();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
        interval = setInterval(() => {
            setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 1500);
    } else {
        setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleOfflineIdentify = () => {
      if (!classifier || !selectedImage) return;
      const img = document.createElement('img');
      img.src = selectedImage;
      img.onload = () => {
          classifier.classify(img, (error: any, results: any[]) => {
              if (error) {
                  console.error(error);
                  return;
              }
              if (results && results.length > 0) {
                  setOfflineResult(results.map(r => ({
                      label: r.label,
                      confidence: r.confidence
                  })));
              }
          });
      };
  };

  const processImageForAnalysis = (imageSrc: string): Promise<string> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1024; 
              let width = img.width;
              let height = img.height;
              
              if (width > MAX_WIDTH) {
                  height = (MAX_WIDTH / width) * height;
                  width = MAX_WIDTH;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                  resolve(dataUrl);
              } else {
                  resolve(imageSrc);
              }
          };
          img.onerror = () => resolve(imageSrc);
          img.src = imageSrc;
      });
  };

  const rotateImage = (degrees: number) => {
    if (!selectedImage) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      if (Math.abs(degrees) === 90) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(degrees * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      setSelectedImage(canvas.toDataURL());
      setOfflineResult(null); 
    };
    img.src = selectedImage;
  };

  const cropSquare = () => {
    if (!selectedImage) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      setSelectedImage(canvas.toDataURL());
      setOfflineResult(null); 
    };
    img.src = selectedImage;
  };

  const resetImage = () => {
    if (originalImage) {
        setSelectedImage(originalImage);
        setOfflineResult(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        setError("Image size too large. Please choose an image under 10MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setOriginalImage(result);
        setDiagnosis(null);
        setError(null);
        setFeedback(null);
        setOfflineResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !symptoms.trim()) {
      setError("Please provide an image OR describe symptoms.");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setFeedbackComment('');
    setShowFeedbackInput(false);
    
    try {
      let imageArg = null;
      if (selectedImage) {
        const processedImage = await processImageForAnalysis(selectedImage);
        const match = processedImage.match(/^data:(.*);base64,(.*)$/);
        if (!match) throw new Error("Invalid image format");
        imageArg = { mimeType: match[1], data: match[2] };
      }

      // Pass language to service
      const result = await diagnoseCrop(imageArg, symptoms, language);
      setDiagnosis(result);
    } catch (err) {
      setError("Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample: typeof SAMPLES[0]) => {
      setSymptoms(sample.symptoms);
      setSelectedImage(null);
      setOriginalImage(null);
      setDiagnosis(null);
      setError(null);
      setShowSampleMenu(false);
      setOfflineResult(null);
  };

  const handleShare = async () => {
      if (!diagnosis) return;
      const text = `Crop Doctor Diagnosis:\n\n${diagnosis}\n\nDiagnosed via AgriWise Advisor.`;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Crop Diagnosis',
                  text: text
              });
          } catch (err) {
              console.log('Share canceled');
          }
      } else {
          navigator.clipboard.writeText(text);
          alert("Diagnosis copied to clipboard!");
      }
  };

  const handleFeedbackSubmit = () => {
      console.log("Feedback submitted:", feedback, feedbackComment);
      setShowFeedbackInput(false);
      alert("Thank you for your feedback!");
  };

  const clearImage = () => {
    setSelectedImage(null);
    setOriginalImage(null);
    setOfflineResult(null);
  };

  const resetAll = () => {
      setSelectedImage(null);
      setOriginalImage(null);
      setSymptoms('');
      setDiagnosis(null);
      setError(null);
      setFeedback(null);
      setFeedbackComment('');
      setShowFeedbackInput(false);
      setOfflineResult(null);
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <Camera size={24} strokeWidth={2.5} />
            </div>
            {t('nav.doctor')}
            </h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">AI-powered pest & disease ID.</p>
        </div>
        
        <div className="relative">
             <button 
                onClick={() => setShowSampleMenu(!showSampleMenu)}
                className="text-xs bg-white text-slate-600 border border-slate-200 shadow-sm px-3 py-1.5 rounded-full font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"
             >
                 Load Sample <ChevronRight size={14} className={`transform transition-transform ${showSampleMenu ? 'rotate-90' : ''}`}/>
             </button>
             {showSampleMenu && (
                 <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowSampleMenu(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden max-h-80 overflow-y-auto">
                     {SAMPLES.map(s => (
                         <button 
                            key={s.id}
                            onClick={() => handleLoadSample(s)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 text-slate-700 border-b border-slate-50 last:border-0 transition-colors"
                         >
                             <div className="font-bold text-green-700 mb-0.5">{s.label}</div>
                             <div className="text-xs text-slate-400 truncate">{s.symptoms}</div>
                         </button>
                     ))}
                 </div>
                 </>
             )}
        </div>
      </header>

      {/* Offline Mode Banner */}
      {!isModelLoading && classifier && (
          <div className="bg-white border border-amber-200/50 text-amber-800 px-4 py-2 rounded-xl mb-4 flex items-center gap-2 text-sm shadow-sm animate-in fade-in slide-in-from-top-1">
             <div className="bg-amber-100 p-1 rounded-full"><WifiOff size={14} className="text-amber-600"/></div>
             <span className="font-bold text-xs">Offline Ready</span>
          </div>
      )}

      <div className="space-y-4">
        {!selectedImage && !diagnosis && (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-green-400 hover:bg-green-50/10 transition-all cursor-pointer relative h-64 group">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2 gap-1 group-hover:scale-110 group-hover:bg-green-100 transition-all duration-300 shadow-sm">
                    <Camera size={28} />
                </div>
                <div>
                <p className="font-bold text-slate-700 text-lg">Take Photo</p>
                <p className="text-xs text-slate-400 font-medium mt-1">or upload from gallery</p>
                </div>
            </div>
        )}

        {selectedImage && !diagnosis && (
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 flex justify-center mb-3 group">
                    <img src={selectedImage} alt="Crop to analyze" className="h-64 object-contain" />
                    <button 
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <X size={18} />
                    </button>
                    
                    {offlineResult && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-green-100 animate-in slide-in-from-bottom-2">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1 tracking-wider">
                                <Zap size={10} className="text-amber-500" fill="currentColor"/> Quick Scan
                             </h4>
                             <div className="flex items-center justify-between">
                                 <div>
                                     <span className="block font-bold text-slate-800 text-base capitalize">{offlineResult[0].label}</span>
                                     <span className="text-xs font-medium text-slate-500">{(offlineResult[0].confidence * 100).toFixed(1)}% Confidence</span>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                    <button onClick={() => rotateImage(-90)} className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 transition-colors"><RotateCcw size={14}/> Left</button>
                    <button onClick={() => rotateImage(90)} className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 transition-colors"><RotateCw size={14}/> Right</button>
                    <button onClick={cropSquare} className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 transition-colors"><CropIcon size={14}/> Center</button>
                    {originalImage && selectedImage !== originalImage && (
                        <button onClick={resetImage} className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"><Undo2 size={14}/> Reset</button>
                    )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                        onClick={handleOfflineIdentify}
                        disabled={!classifier || isModelLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-sm font-bold transition-colors border border-amber-100"
                    >
                        {isModelLoading ? (
                             <><Loader2 size={16} className="animate-spin"/> Loading Model...</>
                        ) : (
                             <><Zap size={16} fill="currentColor" /> Quick ID (Offline)</>
                        )}
                    </button>
                </div>
            </div>
        )}
        
        {selectedImage && diagnosis && (
             <div className="relative rounded-2xl overflow-hidden shadow-sm bg-slate-100 h-24 flex justify-center items-center">
                 <img src={selectedImage} alt="Analyzed" className="h-full object-cover w-full opacity-50" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                     <CheckCircle className="text-green-400" size={20} />
                     <span className="text-white text-sm font-bold">Analysis Complete</span>
                 </div>
             </div>
        )}

        {!diagnosis && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-slate-400"/> Additional Context
                </label>
                <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms like 'yellowing leaves', 'spots', etc..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none text-sm min-h-[80px] bg-slate-50 placeholder-slate-400 transition-shadow"
                />
            </div>
        )}

        {!diagnosis && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/10 transition-all transform active:scale-[0.98] ${
                loading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="text-base">Diagnosing...</span>
              ) : (
                <>
                  <CheckCircle size={24} /> Start Diagnosis
                </>
              )}
            </button>
        )}

        {loading && (
            <div className="space-y-6 animate-in fade-in pt-4">
                <div className="flex justify-center">
                     <div className="flex flex-col items-center gap-3 text-center">
                         <div className="relative">
                             <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-20 animate-pulse"></div>
                             <Loader2 className="animate-spin text-green-600 relative z-10" size={32}/> 
                         </div>
                         <span className="text-sm font-bold text-slate-600">{LOADING_MESSAGES[loadingMsgIndex]}</span>
                     </div>
                </div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
        )}

        {diagnosis && (
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-extrabold text-xl text-slate-800">Diagnosis Report</h3>
                  <button onClick={handleShare} className="text-slate-400 hover:text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors">
                      <Share2 size={20} />
                  </button>
              </div>
              
              <div className="prose prose-sm prose-green max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
                 <ReactMarkdown>{diagnosis}</ReactMarkdown>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Was this helpful?</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setFeedback('helpful'); setShowFeedbackInput(false); }}
                            className={`p-2 rounded-full transition-all ${feedback === 'helpful' ? 'bg-green-100 text-green-700 scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            <ThumbsUp size={18} />
                        </button>
                        <button 
                            onClick={() => { setFeedback('not-helpful'); setShowFeedbackInput(true); }}
                            className={`p-2 rounded-full transition-all ${feedback === 'not-helpful' ? 'bg-red-100 text-red-700 scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            <ThumbsDown size={18} />
                        </button>
                    </div>
                  </div>
                  {showFeedbackInput && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                          <textarea
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              placeholder="Tell us what was incorrect..."
                              className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-red-300 bg-slate-50 min-h-[80px] mb-2 placeholder-slate-400"
                          />
                          <button onClick={handleFeedbackSubmit} className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-1 ml-auto shadow-sm shadow-red-200">Submit Feedback <Send size={12}/></button>
                      </div>
                  )}
              </div>

              <button 
                onClick={resetAll}
                className="mt-6 w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18}/> New Scan
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CropDoctor;