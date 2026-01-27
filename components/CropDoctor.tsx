import React, { useState, useRef, useEffect } from 'react';
import { diagnoseCrop, DiagnosisResult, generateSpeech, getPestOutbreakRisks, getPestEncyclopedia, PestOutbreak, PestGuideItem } from '../services/geminiService';
import { 
  Loader2, ScanLine, Camera, Image as ImageIcon, Bug, Shield, RefreshCw, Zap, X, Sparkles, AlertTriangle, ShieldCheck, ChevronRight, Sprout, Map as MapIcon, LocateFixed, CalendarPlus, CheckCircle, Volume2, Info, ArrowLeft, Search, BookOpen, AlertOctagon, Microscope, Flower
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';
import { LocationData } from '../types';

interface CropDoctorProps {
  logActivity?: (type: string, desc: string, icon: string) => void;
  location: LocationData | null;
}

type Tab = 'scanner' | 'map' | 'guide';
type Step = 'init' | 'analyzing' | 'result';
type TreatmentType = 'organic' | 'chemical';

const CropDoctor: React.FC<CropDoctorProps> = ({ logActivity, location }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  
  // Scanner State
  const [step, setStep] = useState<Step>('init'); 
  const [targetCrop, setTargetCrop] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('organic');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Map State
  const [outbreaks, setOutbreaks] = useState<PestOutbreak[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Guide State
  const [pestQuery, setPestQuery] = useState('');
  const [pests, setPests] = useState<PestGuideItem[]>([]);
  const [guideLoading, setGuideLoading] = useState(false);
  const [selectedPest, setSelectedPest] = useState<PestGuideItem | null>(null);

  // Load Map Data
  useEffect(() => {
    if (activeTab === 'map' && location && outbreaks.length === 0) {
      setMapLoading(true);
      getPestOutbreakRisks(location, language).then(data => {
        setOutbreaks(data);
        setMapLoading(false);
      });
    }
  }, [activeTab, location, language]);

  // Load Initial Guide Data
  useEffect(() => {
    if (activeTab === 'guide' && location && pests.length === 0) {
      handleSearchPests('');
    }
  }, [activeTab, location]);

  // Map Initialization
  useEffect(() => {
    if (activeTab === 'map' && location && mapContainerRef.current && !mapRef.current) {
        // @ts-ignore
        mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([location.latitude, location.longitude], 12);
        // @ts-ignore
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(mapRef.current);

        // Add user location marker
        // @ts-ignore
        const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-ring"></div>`
        });
        // @ts-ignore
        L.marker([location.latitude, location.longitude], { icon: userIcon }).addTo(mapRef.current);
    }
  }, [activeTab, location]);

  // Render Map Outbreaks
  useEffect(() => {
    if (!mapRef.current || outbreaks.length === 0) return;
    
    outbreaks.forEach(outbreak => {
        const color = outbreak.risk_level === 'High' ? '#ef4444' : outbreak.risk_level === 'Medium' ? '#f59e0b' : '#3b82f6';
        // @ts-ignore
        L.circle([outbreak.location.lat, outbreak.location.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            radius: outbreak.location.radius
        }).addTo(mapRef.current).bindPopup(`
            <div class="p-2 font-sans">
                <p class="text-[9px] font-black uppercase tracking-widest" style="color:${color}">${outbreak.risk_level} Risk</p>
                <h4 class="text-sm font-black text-slate-900">${outbreak.pest_name}</h4>
                <p class="text-[10px] text-slate-500 leading-tight mt-1">${outbreak.description}</p>
            </div>
        `);
    });
  }, [outbreaks]);

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

  const handleSearchPests = async (q: string) => {
    if (!location) return;
    setGuideLoading(true);
    try {
        const data = await getPestEncyclopedia(q, location, language);
        setPests(data);
    } catch (e) { console.error(e); } finally { setGuideLoading(false); }
  };

  const tabs = [
      { id: 'scanner', label: 'Doctor', icon: ScanLine },
      { id: 'map', label: 'Outbreaks', icon: MapIcon },
      { id: 'guide', label: 'Library', icon: BookOpen },
  ];

  return (
    <div className={`min-h-screen transition-all duration-500 pb-24 ${step === 'analyzing' ? 'bg-black' : 'bg-slate-50 dark:bg-[#0E1F17]'}`}>
      
      {/* Header & Tabs */}
      {step !== 'analyzing' && (
        <>
            <header className="px-6 pt-10 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-200 dark:shadow-none">
                        <Microscope size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-emerald-50">Crop Doctor</h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Diagnostics</p>
                    </div>
                </div>
                {step === 'result' && (
                    <button onClick={speakResult} className={`p-3 rounded-2xl transition-all ${isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-white dark:bg-[#1C2B22] text-rose-600 shadow-soft'}`}>
                        <Volume2 size={20} />
                    </button>
                )}
            </header>
            
            <div className="px-6 mb-6">
                <div className="bg-white dark:bg-[#1C2B22] p-1.5 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5 flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as Tab); if(tab.id==='scanner') setStep('init'); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
      )}

      {/* SCANNER VIEW */}
      {activeTab === 'scanner' && (
        <>
            {step === 'init' && (
                <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] shadow-soft border border-slate-100 dark:border-white/5 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-orange-400"></div>
                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center animate-pulse-slow">
                                <ScanLine size={32} className="text-rose-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-emerald-50 mb-2">Identify & Cure</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
                            Snap a photo of any sick plant. Our AI detects pests, fungi, and nutrient deficiencies instantly.
                        </p>
                        
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                value={targetCrop}
                                onChange={(e) => setTargetCrop(e.target.value)}
                                placeholder="Enter Crop Name (e.g. Wheat)" 
                                className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-sm text-center outline-none border-2 border-transparent focus:border-rose-400 transition-all placeholder:text-slate-300"
                            />
                            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <button 
                                onClick={startScan}
                                disabled={!targetCrop.trim()}
                                className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest bg-rose-500 text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                            >
                                <Camera size={18} /> Start Diagnosis
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'analyzing' && capturedImage && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden animate-in fade-in duration-500">
                    <div className="absolute top-6 left-6 z-10">
                        <button onClick={() => setStep('init')} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"><X size={24} /></button>
                    </div>
                    
                    <img src={capturedImage} className="w-full h-full object-cover opacity-60" />
                    
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-rose-500 rounded-[2rem] opacity-50 shadow-[0_0_40px_rgba(244,63,94,0.4)]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)] animate-scanner-line"></div>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-16 left-0 right-0 px-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={32} className="text-rose-500 animate-spin" />
                            <p className="text-sm font-black uppercase tracking-[0.3em] text-rose-500">Analyzing Tissue</p>
                        </div>
                    </div>
                    <style>{`
                        @keyframes scanner-line { 0% { top: 0%; } 100% { top: 100%; } }
                        .animate-scanner-line { animation: scanner-line 2s ease-in-out infinite; }
                    `}</style>
                </div>
            )}

            {step === 'result' && diagnosis && (
                <div className="px-6 space-y-6 animate-in slide-in-from-bottom-10 pb-20">
                    <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${diagnosis.severity === 'Critical' ? 'bg-red-500' : diagnosis.severity === 'High' ? 'bg-orange-500' : 'bg-amber-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-emerald-50 mb-2">{diagnosis.diagnosis}</h3>
                                <div className="flex gap-2">
                                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl ${diagnosis.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {diagnosis.severity} Severity
                                    </span>
                                </div>
                            </div>
                            {capturedImage && <img src={capturedImage} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />}
                        </div>

                        {/* Toggle */}
                        <div className="bg-slate-100 dark:bg-black/20 p-1.5 rounded-2xl flex mb-6">
                            {(['organic', 'chemical'] as const).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setTreatmentType(type)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${treatmentType === type ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4 items-start p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl shrink-0"><AlertTriangle size={20}/></div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Immediate Action</h4>
                                    <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/80 leading-relaxed">{diagnosis.action_today}</p>
                                </div>
                            </div>

                            <div className={`flex gap-4 items-start p-5 rounded-[2rem] border ${treatmentType === 'organic' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'}`}>
                                <div className={`p-2.5 rounded-xl shrink-0 ${treatmentType === 'organic' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {treatmentType === 'organic' ? <ShieldCheck size={20}/> : <Zap size={20}/>}
                                </div>
                                <div>
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${treatmentType === 'organic' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                        {treatmentType === 'organic' ? 'Natural Prescription' : 'Chemical Control'}
                                    </h4>
                                    <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/80 leading-relaxed">
                                        {treatmentType === 'organic' ? diagnosis.organic_treatment : diagnosis.chemical_treatment}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => setStep('init')} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 hover:text-rose-500 transition-colors">
                        <RefreshCw size={14} /> New Scan
                    </button>
                </div>
            )}
        </>
      )}

      {/* MAP VIEW */}
      {activeTab === 'map' && (
        <div className="px-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
            <div className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-white/5 mb-4">
                <div className="flex items-center gap-3 text-amber-500 mb-2">
                    <AlertOctagon size={20} />
                    <h3 className="font-black text-sm uppercase tracking-wide">Regional Prediction</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    AI analysis of weather patterns suggests these areas are at high risk for pest outbreaks in the next 7 days.
                </p>
            </div>
            
            <div className="flex-1 min-h-[400px] relative rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-white/5">
                <div ref={mapContainerRef} className="w-full h-full bg-slate-100 dark:bg-slate-800" />
                {mapLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500]">
                        <div className="bg-white dark:bg-[#1C2B22] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                            <Loader2 className="animate-spin text-rose-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white">Scanning Region...</span>
                        </div>
                    </div>
                )}
                <button 
                  className="absolute bottom-4 right-4 z-[400] bg-white dark:bg-[#1C2B22] text-slate-700 dark:text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all" 
                  onClick={() => { if(location && mapRef.current) mapRef.current.setView([location.latitude, location.longitude], 12); }}
                >
                    <LocateFixed size={20} />
                </button>
            </div>
        </div>
      )}

      {/* GUIDE VIEW */}
      {activeTab === 'guide' && (
        <div className="px-6 pb-24 animate-in fade-in slide-in-from-right-4">
            <div className="relative mb-6">
                <input 
                    type="text" 
                    value={pestQuery}
                    onChange={(e) => setPestQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPests(pestQuery)}
                    placeholder="Search pests (e.g. Aphids)..." 
                    className="w-full bg-white dark:bg-[#1C2B22] p-4 pl-12 rounded-2xl font-bold text-sm outline-none border border-slate-100 dark:border-white/5 focus:border-rose-400 shadow-sm transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>

            {guideLoading ? (
                <div className="flex flex-col items-center py-20">
                    <Loader2 className="animate-spin text-rose-500 mb-4" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consulting Entomology Database...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pests.map((pest, idx) => (
                        <div key={idx} onClick={() => setSelectedPest(pest)} className="bg-white dark:bg-[#1C2B22] p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 active:scale-[0.98] transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-emerald-50 mb-1 group-hover:text-rose-500 transition-colors">{pest.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold italic">{pest.scientific_name}</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400">
                                    {pest.type === 'Fungus' ? <Sprout size={18}/> : <Bug size={18}/>}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">{pest.description}</p>
                            <div className="flex gap-2">
                                <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide">
                                    {pest.type || 'Pest'}
                                </span>
                                <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide">
                                    {pest.prevalence_season}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pest Detail Modal */}
            {selectedPest && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1C2B22] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
                        <button onClick={() => setSelectedPest(null)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-500"><X size={20}/></button>
                        
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-emerald-50 mb-1">{selectedPest.name}</h2>
                            <p className="text-sm text-slate-400 italic font-medium">{selectedPest.scientific_name}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem]">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Identification</h4>
                                <p className="text-sm font-bold text-slate-700 dark:text-emerald-50/80 leading-relaxed">{selectedPest.description}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-2">Symptoms</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPest.symptoms.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold border border-rose-100 dark:border-rose-900/30">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-5 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Organic Control</h4>
                                    <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/80 leading-relaxed">{selectedPest.organic_control}</p>
                                </div>
                                <div className="p-5 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-2"><Zap size={14}/> Chemical Control (IPM)</h4>
                                    <p className="text-xs font-bold text-slate-700 dark:text-emerald-50/80 leading-relaxed">{selectedPest.chemical_control}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CropDoctor;