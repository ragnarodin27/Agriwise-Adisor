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
  // ... (Other samples can remain static or be translated dynamically if strictly needed, keeping static for now to save space)
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
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <header className="mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg">
                <Camera size={24} className="text-green-700" />
            </div>
            {t('nav.doctor')}
            </h2>
            <p className="text-gray-600 mt-1 text-sm">Identify pests & diseases instantly.</p>
        </div>
        
        <div className="relative">
             <button 
                onClick={() => setShowSampleMenu(!showSampleMenu)}
                className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
             >
                 Load Sample <ChevronRight size={14} className={`transform transition-transform ${showSampleMenu ? 'rotate-90' : ''}`}/>
             </button>
             {showSampleMenu && (
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden max-h-80 overflow-y-auto">
                     {SAMPLES.map(s => (
                         <button 
                            key={s.id}
                            onClick={() => handleLoadSample(s)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 text-gray-700 border-b border-gray-50 last:border-0"
                         >
                             <div className="font-semibold text-green-800">{s.label}</div>
                             <div className="text-xs text-gray-500 truncate">{s.symptoms}</div>
                         </button>
                     ))}
                 </div>
             )}
        </div>
      </header>

      {/* Offline Mode Banner */}
      {!isModelLoading && classifier && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg mb-4 flex items-center gap-2 text-sm shadow-sm animate-in fade-in slide-in-from-top-1">
             <WifiOff size={16} className="text-amber-600"/>
             <span className="font-medium">Offline Mode Ready:</span>
             <span className="text-amber-700">Using on-device AI for instant analysis.</span>
          </div>
      )}

      <div className="space-y-4">
        {!selectedImage && !diagnosis && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-green-400 transition-colors cursor-pointer relative h-48 group">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-1 gap-1 group-hover:scale-110 transition-transform">
                    <Camera size={20} />
                    <span className="text-gray-300">|</span>
                    <ImageIcon size={20} />
                </div>
                <div>
                <p className="font-semibold text-gray-700">Take Photo or Upload</p>
                <p className="text-xs text-gray-400 mt-1">Select from Camera or Gallery</p>
                </div>
            </div>
        )}

        {selectedImage && !diagnosis && (
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
                <div className="relative rounded-lg overflow-hidden bg-black flex justify-center mb-3">
                    <img src={selectedImage} alt="Crop to analyze" className="h-64 object-contain" />
                    <button 
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 backdrop-blur-sm transition-colors"
                    >
                        <X size={20} />
                    </button>
                    
                    {offlineResult && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-green-100 animate-in slide-in-from-bottom-2">
                             <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                <Zap size={12} className="text-amber-500" fill="currentColor"/> Instant ID
                             </h4>
                             <div className="flex items-center justify-between">
                                 <div>
                                     <span className="block font-bold text-gray-800 text-lg capitalize">{offlineResult[0].label}</span>
                                     <span className="text-xs text-gray-500">{(offlineResult[0].confidence * 100).toFixed(1)}% Confidence</span>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                    <button onClick={() => rotateImage(-90)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"><RotateCcw size={16}/> Left</button>
                    <button onClick={() => rotateImage(90)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"><RotateCw size={16}/> Right</button>
                    <button onClick={cropSquare} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"><CropIcon size={16}/> Crop Center</button>
                    {originalImage && selectedImage !== originalImage && (
                        <button onClick={resetImage} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"><Undo2 size={16}/> Reset</button>
                    )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                        onClick={handleOfflineIdentify}
                        disabled={!classifier || isModelLoading}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold transition-colors border border-amber-200"
                    >
                        {isModelLoading ? (
                             <><Loader2 size={16} className="animate-spin"/> Loading Model...</>
                        ) : (
                             <><Zap size={16} /> Identify Species (Offline)</>
                        )}
                    </button>
                </div>
            </div>
        )}
        
        {selectedImage && diagnosis && (
             <div className="relative rounded-xl overflow-hidden shadow-sm bg-gray-100 h-32 flex justify-center items-center">
                 <img src={selectedImage} alt="Analyzed" className="h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-2">
                     <span className="text-white text-xs font-medium">Analyzed Image</span>
                 </div>
             </div>
        )}

        {!diagnosis && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Describe Symptoms (Optional)
                </label>
                <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., Yellowing leaves with black spots, small white insects..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm min-h-[80px]"
                />
            </div>
        )}

        {!diagnosis && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all ${
                loading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CheckCircle size={20} /> Diagnose Health (Online)
                </>
              )}
            </button>
        )}

        {loading && (
            <div className="space-y-4 animate-in fade-in">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-green-500 h-1.5 rounded-full animate-[shimmer_1.5s_infinite] w-2/3 ml-[-50%]"></div>
                </div>
                <div className="flex justify-center">
                     <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-100 shadow-sm transition-all duration-300">
                         <Loader2 className="animate-spin" size={18}/> 
                         <span className="text-sm font-medium">{LOADING_MESSAGES[loadingMsgIndex]}</span>
                     </div>
                </div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm">{error}</p>
            </div>
        )}

        {diagnosis && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <h3 className="font-bold text-lg text-gray-800">Diagnosis Report</h3>
                  <button onClick={handleShare} className="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors">
                      <Share2 size={20} />
                  </button>
              </div>
              
              <div className="prose prose-sm prose-green max-w-none">
                 <ReactMarkdown>{diagnosis}</ReactMarkdown>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Was this helpful?</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setFeedback('helpful'); setShowFeedbackInput(false); }}
                            className={`p-2 rounded-full transition-colors ${feedback === 'helpful' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <ThumbsUp size={18} />
                        </button>
                        <button 
                            onClick={() => { setFeedback('not-helpful'); setShowFeedbackInput(true); }}
                            className={`p-2 rounded-full transition-colors ${feedback === 'not-helpful' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:bg-gray-50'}`}
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
                              placeholder="What was missing or incorrect?"
                              className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-300 bg-gray-50 min-h-[60px] mb-2"
                          />
                          <button onClick={handleFeedbackSubmit} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700 flex items-center gap-1 ml-auto">Submit Feedback <Send size={12}/></button>
                      </div>
                  )}
              </div>

              <button 
                onClick={resetAll}
                className="mt-4 w-full py-2 border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16}/> Start New Diagnosis
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CropDoctor;