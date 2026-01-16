
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { analyzeSoil, SoilAnalysisResult, getWeatherAndTip, diagnoseCrop } from '../services/geminiService';
import { LocationData } from '../types';
import { FlaskConical, Sprout, Loader2, AlertCircle, History, Info, ChevronDown, ChevronUp, Plus, Trash2, TrendingUp, AlertTriangle, HelpCircle, Edit2, Save, X, Hammer, Droplet, Activity, Link as LinkIcon, FileText, Zap, Camera, Image as ImageIcon, Filter, BarChart3, Search, Scan, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';
import { jsPDF } from "jspdf";

interface SoilAnalyzerProps {
  location: LocationData | null;
}

interface SoilResult {
  id: string;
  date: string;
  dateISO?: string;
  crop: string;
  analysis: string;
  normalized_n?: number;
  normalized_p?: number;
  normalized_k?: number;
  ph?: number;
  organicMatter?: string;
  imageUrl?: string;
  textureLabel?: string;
  confidence?: number;
}

interface AmendmentLogItem {
  id: string;
  date: string;
  type: string;
  notes: string;
  linkedAnalysisId?: string;
}

const TEXTURE_INFO: Record<string, string> = {
    'Sandy': 'Drains very fast, low nutrient retention. Warmed up quickly in spring.',
    'Clay': 'Retains water and nutrients well but drains slowly. Can be hard to till.',
    'Loam': 'Ideal balance. Good drainage and retention. Fertile and easy to work.',
    'Silt': 'Retains water well, fertile, but can compact easily.',
    'Peat': 'High organic matter, holds moisture, acidic. Good for specific crops.',
    'Sandy Loam': 'Mostly sand with some silt/clay. Good drainage, decent retention.',
    'Clay Loam': 'Mostly clay with better drainage properties than pure clay.',
    'Silty Clay': 'Heavy soil, retains moisture and nutrients, can be slow draining.'
};

const PARAM_GUIDANCE = {
    ph: "Optimal: 6.0 - 7.0 for most crops. Below 5.5 is strongly acidic; above 7.5 is alkaline.",
    om: "Typical: 3% - 6%. Low: < 2%. Organic matter improves water retention and nutrient availability.",
    n: "Typical: 20 - 50 ppm. Crucial for leaf growth and protein synthesis. (mg/kg or ppm)",
    p: "Optimal: 25 - 50 ppm. Essential for root development, flowering, and energy transfer.",
    k: "Optimal: 150 - 250 ppm. Vital for water regulation, disease resistance, and fruit quality.",
    mg: "Optimal: 50 - 150 ppm. Core of chlorophyll molecule; essential for photosynthesis.",
    b: "Optimal: 0.5 - 2.0 ppm. Crucial for cell wall formation and reproductive growth.",
    cu: "Optimal: 1 - 5 ppm. Involved in photosynthesis and enzyme activation."
};

const SoilAnalyzer: React.FC<SoilAnalyzerProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({
    crop: '',
    ph: '',
    organicMatter: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    boron: '',
    copper: '',
    magnesium: '',
    micronutrients: '',
    type: 'Loam',
    soilMoisture: '50' 
  });
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SoilResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Visual Analysis State
  const [visualImage, setVisualImage] = useState<string | null>(null);
  const [visualAnalysis, setVisualAnalysis] = useState<string | null>(null);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [visualConfidence, setVisualConfidence] = useState<number | null>(null);
  const [visualTextureLabel, setVisualTextureLabel] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [filterCrop, setFilterCrop] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterLinkedId, setFilterLinkedId] = useState('');

  const [amendments, setAmendments] = useState<AmendmentLogItem[]>([]);
  const [newAmendment, setNewAmendment] = useState({ 
      date: new Date().toISOString().split('T')[0], 
      type: '', 
      notes: '',
      linkedAnalysisId: '' 
  });

  useEffect(() => {
    const saved = localStorage.getItem('soilHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error("Failed to parse history"); }
    }
    const savedAmendments = localStorage.getItem('soilAmendments');
    if (savedAmendments) {
        try {
            setAmendments(JSON.parse(savedAmendments));
        } catch (e) { console.error("Failed to parse amendments"); }
    }
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setVisualImage(base64);
        handleAnalyzePhoto(base64);
      };
      reader.readAsDataURL(file);
    }
    // Clear value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleAnalyzePhoto = async (base64: string) => {
    setIsVisualLoading(true);
    setVisualAnalysis(null);
    setVisualConfidence(null);
    setVisualTextureLabel(null);
    setError(null);
    try {
      const match = base64.match(/^data:(.*);base64,(.*)$/);
      if (!match) throw new Error("Invalid image format");
      
      const imagePart = { mimeType: match[1], data: match[2] };
      
      // Specialized prompt for deep visual indicators
      const prompt = `
        As an agronomist, perform a high-precision visual analysis of this soil sample.
        
        IDENTIFY:
        1. Texture Class: (Sandy, Clay, Loam, Silt, etc.)
        2. Visual Confidence Score: (0-100%)
        3. Indicators of Nutrient Deficiency: Look for specific colors (yellowing/salting), textures (crusting/compaction).
        4. Organic Matter (OM) Content: Estimate based on color darkness and visible organic debris.
        
        FORMAT YOUR RESPONSE:
        Start exactly with "RESULT: [TEXTURE NAME] | [CONFIDENCE]%"
        Followed by a detailed breakdown of:
        - "Visual Indicators Detected"
        - "Organic Matter Assessment"
        - "Physical Structure Observations"
      `;

      const aiResponse = await diagnoseCrop(imagePart, prompt, language);
      setVisualAnalysis(aiResponse);
      
      // Extract structure: "RESULT: Clay Loam | 85%"
      const headerMatch = aiResponse.match(/RESULT:\s+(.*?)\s+\|\s+(\d+)%/i);
      if (headerMatch) {
          const texture = headerMatch[1].trim();
          const confidence = parseInt(headerMatch[2]);
          setVisualTextureLabel(texture);
          setVisualConfidence(confidence);
          
          // Pre-fill form if confidence is high
          if (confidence > 70) {
              const matchedKey = Object.keys(TEXTURE_INFO).find(k => k.toLowerCase() === texture.toLowerCase());
              if (matchedKey) {
                  setFormData(prev => ({ ...prev, type: matchedKey }));
              }
          }
      }
    } catch (err) {
      setError("AI Visual Analysis failed. Please try a clearer photo.");
    } finally {
      setIsVisualLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAutoPopulate = async () => {
    if (!location) {
      setError("Location is required for live environmental data.");
      return;
    }
    setAutoPopulating(true);
    setError(null);
    try {
      const weather = await getWeatherAndTip(location, language);
      setFormData(prev => ({
        ...prev,
        soilMoisture: weather.humidity.replace(/[^0-9]/g, '') || '50',
        micronutrients: `Auto-derived from ${weather.condition} conditions at ${weather.temperature}.`
      }));
    } catch (err) {
      setError("Could not fetch live weather context.");
    } finally {
      setAutoPopulating(false);
    }
  };

  const handleLoadSample = () => {
    setFormData({
      crop: 'Corn (Maize)',
      ph: '5.2',
      organicMatter: '2.5',
      nitrogen: 'Low (15 ppm)',
      phosphorus: 'Medium (25 ppm)',
      potassium: 'High (180 ppm)',
      boron: '0.5 ppm',
      copper: '0.2 ppm',
      magnesium: '100 ppm',
      micronutrients: 'Zinc is low',
      type: 'Clay Loam',
      soilMoisture: '35'
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop || !formData.ph) {
      setError("Please fill in at least the Crop and pH fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisData = await analyzeSoil(formData, location || undefined, language);
      setResult(analysisData);

      const newRecord: SoilResult = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        dateISO: new Date().toISOString(),
        crop: formData.crop,
        analysis: analysisData.analysis,
        normalized_n: analysisData.normalized_n,
        normalized_p: analysisData.normalized_p,
        normalized_k: analysisData.normalized_k,
        ph: parseFloat(formData.ph),
        organicMatter: formData.organicMatter,
        imageUrl: visualImage || undefined,
        textureLabel: visualTextureLabel || formData.type,
        confidence: visualConfidence || undefined
      };
      
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('soilHistory', JSON.stringify(updatedHistory));

    } catch (err) {
      setError("Failed to analyze soil data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
      if (!result) return;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(34, 197, 94); 
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("AgriWise Soil Report", 15, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 33);
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("1. Analysis Overview", 15, 50);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 53, pageWidth - 15, 53);
      doc.setFontSize(10);
      doc.text(`Target Crop: ${formData.crop}`, 20, 60);
      doc.text(`Soil Texture: ${formData.type}`, 20, 66);
      doc.text(`pH Level: ${formData.ph}`, 20, 72);
      doc.text(`Organic Matter: ${formData.organicMatter || 'Not specified'}%`, 20, 78);
      doc.setFontSize(14);
      doc.text("2. Soil Health Index", 15, 90);
      doc.line(15, 93, pageWidth - 15, 93);
      const score = result.health_score || 0;
      doc.setFontSize(32);
      doc.setTextColor(score > 70 ? 34 : 239, score > 70 ? 197 : 68, score > 70 ? 94 : 68);
      doc.text(`${score}/100`, 20, 108);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const healthLabel = score > 75 ? "Excellent Condition" : score > 50 ? "Stable / Good" : "Requires Intervention";
      doc.text(healthLabel, 20, 115);
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("3. Nutrient Profile", 15, 130);
      doc.line(15, 133, pageWidth - 15, 133);
      doc.setFontSize(10);
      const nutrients = [
          { name: "Nitrogen (N)", score: result.normalized_n, ref: result.typical_n },
          { name: "Phosphorus (P)", score: result.normalized_p, ref: result.typical_p },
          { name: "Potassium (K)", score: result.normalized_k, ref: result.typical_k }
      ];
      nutrients.forEach((n, i) => {
          const y = 142 + (i * 12);
          doc.setTextColor(71, 85, 105);
          doc.text(`${n.name}:`, 20, y);
          doc.setFont("helvetica", "bold");
          doc.text(`${n.score}/100`, 60, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(`(Target Ref: ${n.ref})`, 80, y);
          doc.setFontSize(10);
      });
      doc.setFontSize(14);
      doc.text("4. AI Recommendation & Strategy", 15, 185);
      doc.line(15, 188, pageWidth - 15, 188);
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const cleanAnalysis = result.analysis.replace(/\*\*/g, '');
      const splitText = doc.splitTextToSize(cleanAnalysis, pageWidth - 30);
      let cursorY = 195;
      splitText.forEach((line: string) => {
          if (cursorY > 280) {
              doc.addPage();
              cursorY = 20;
          }
          doc.text(line, 15, cursorY);
          cursorY += 5;
      });
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`AgriWise Advisor - Precision Soil Intelligence Report | Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
      }
      doc.save(`AgriWise_Soil_Report_${formData.crop.replace(/\s+/g, '_')}.pdf`);
  };

  const resetForm = () => {
    setResult(null);
    setVisualImage(null);
    setVisualAnalysis(null);
    setVisualConfidence(null);
    setVisualTextureLabel(null);
    setFormData({
      crop: '',
      ph: '',
      organicMatter: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      boron: '',
      copper: '',
      magnesium: '',
      micronutrients: '',
      type: 'Loam',
      soilMoisture: '50'
    });
  };

  const addAmendment = () => {
      if(!newAmendment.type) return;
      const newItem: AmendmentLogItem = { ...newAmendment, id: Date.now().toString() };
      const updated = [newItem, ...amendments];
      setAmendments(updated);
      localStorage.setItem('soilAmendments', JSON.stringify(updated));
      setNewAmendment({ date: new Date().toISOString().split('T')[0], type: '', notes: '', linkedAnalysisId: '' });
  };

  const deleteAmendment = (id: string) => {
      const updated = amendments.filter(a => a.id !== id);
      setAmendments(updated);
      localStorage.setItem('soilAmendments', JSON.stringify(updated));
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('soilHistory', JSON.stringify(updated));
  };

  const phVal = parseFloat(formData.ph);
  const isPhAcidic = !isNaN(phVal) && phVal < 5.5;
  const isPhAlkaline = !isNaN(phVal) && phVal > 7.5;
  const showPhWarning = isPhAcidic || isPhAlkaline;

  const getNutrientColor = (val: number) => {
      if (val < 35) return '#EF4444'; 
      if (val >= 35 && val < 45) return '#F59E0B'; 
      if (val >= 45 && val < 75) return '#22C55E'; 
      if (val >= 75 && val < 85) return '#F59E0B'; 
      return '#EF4444'; 
  };

  const renderHealthGauge = (score: number) => {
      const radius = 50;
      const stroke = 12;
      const circumference = Math.PI * radius; 
      const normalizedScore = Math.max(0, Math.min(100, score));
      const offset = circumference - (normalizedScore / 100) * circumference;
      let colorClass = 'text-red-500';
      let strokeColor = '#EF4444';
      let label = "Poor";
      if (score > 40) { 
          colorClass = 'text-yellow-500'; 
          strokeColor = '#EAB308';
          label = "Average";
      }
      if (score > 75) { 
          colorClass = 'text-green-500'; 
          strokeColor = '#22C55E';
          label = "Excellent";
      }
      return (
          <div className="flex flex-col items-center justify-center py-4">
             <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
                 <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 70" preserveAspectRatio="xMidYMax meet">
                     <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#F3F4F6" strokeWidth={stroke} strokeLinecap="round" />
                     <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
                 </svg>
                 <div className="relative z-10 flex flex-col items-center mb-1">
                     <span className={`text-5xl font-extrabold ${colorClass} tracking-tighter`}>{Math.round(score)}</span>
                     <span className={`text-xs font-bold uppercase tracking-widest ${colorClass} bg-white/50 px-2 rounded-full mt-1`}>{label}</span>
                 </div>
             </div>
             <p className="text-gray-400 text-xs mt-2 font-medium">Soil Health Index (0-100)</p>
          </div>
      );
  };

  const renderTrendChart = () => {
      const data = [...history]
        .filter(h => h.normalized_n !== undefined)
        .sort((a, b) => new Date(a.dateISO || a.date).getTime() - new Date(b.dateISO || b.date).getTime())
        .slice(-10);

      if (data.length < 2) {
          return (
              <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 mb-6 text-center">
                  <BarChart3 className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">At least 2 analyses required for trend visualization</p>
              </div>
          );
      }

      const width = 300;
      const height = 120;
      const padding = 15;
      const step = (width - padding * 2) / (data.length - 1);
      const getY = (val: number) => height - padding - (val / 100) * (height - padding * 2);

      const createPath = (key: 'normalized_n' | 'normalized_p' | 'normalized_k') => {
          return data.map((point, i) => {
              const x = padding + i * step;
              const y = getY(point[key] || 0);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
      };

      return (
          <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={16} className="text-amber-600" /> Nutrient Intelligence
                  </h4>
                  <div className="flex gap-2">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span className="text-[10px] font-bold text-gray-400 uppercase">N</span></div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-[10px] font-bold text-gray-400 uppercase">P</span></div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span className="text-[10px] font-bold text-gray-400 uppercase">K</span></div>
                  </div>
              </div>
              
              <div className="relative">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    <line x1={padding} y1={getY(0)} x2={width-padding} y2={getY(0)} stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={padding} y1={getY(50)} x2={width-padding} y2={getY(50)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padding} y1={getY(100)} x2={width-padding} y2={getY(100)} stroke="#f1f5f9" strokeWidth="1" />
                    
                    <path d={createPath('normalized_n')} fill="none" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={createPath('normalized_p')} fill="none" stroke="#22C55E" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={createPath('normalized_k')} fill="none" stroke="#F97316" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {data.map((d, i) => (
                        <g key={i}>
                            <circle cx={padding + i * step} cy={getY(d.normalized_n || 0)} r="3.5" fill={getNutrientColor(d.normalized_n || 0)} stroke="white" strokeWidth="1.5" />
                            <circle cx={padding + i * step} cy={getY(d.normalized_p || 0)} r="3.5" fill={getNutrientColor(d.normalized_p || 0)} stroke="white" strokeWidth="1.5" />
                            <circle cx={padding + i * step} cy={getY(d.normalized_k || 0)} r="3.5" fill={getNutrientColor(d.normalized_k || 0)} stroke="white" strokeWidth="1.5" />
                        </g>
                    ))}
                </svg>
                
                <div className="flex justify-between mt-3 border-t border-gray-50 pt-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(data[0].dateISO || data[0].date).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                    <span className="text-[9px] font-black text-amber-600/60 uppercase">Optimal = Green Nodes</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(data[data.length-1].dateISO || data[data.length-1].date).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                </div>
              </div>
          </div>
      );
  };

  const filteredHistory = history.filter(item => {
    if (filterCrop && !item.crop.toLowerCase().includes(filterCrop.toLowerCase())) return false;
    if (filterStartDate || filterEndDate) {
        const itemDate = item.dateISO ? new Date(item.dateISO) : new Date(item.date);
        if (filterStartDate) {
            const start = new Date(filterStartDate);
            if (itemDate < start) return false;
        }
        if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
        }
    }
    return true;
  });

  const displayedAmendments = useMemo(() => {
    let list = [...amendments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterLinkedId) {
        list = list.filter(a => a.linkedAnalysisId === filterLinkedId);
    }
    return list;
  }, [amendments, filterLinkedId]);

  const InputLabelWithTooltip = ({ label, guidanceKey, className = "" }: { label: string, guidanceKey: keyof typeof PARAM_GUIDANCE, className?: string }) => (
    <div className={`relative group flex items-center gap-1.5 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <HelpCircle size={14} className="text-gray-400 cursor-help transition-colors group-hover:text-amber-600" />
        <div className="absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl border border-white/10 translate-y-2 group-hover:translate-y-0">
            <div className="font-bold text-amber-400 uppercase tracking-widest mb-1">{label} Guide</div>
            {PARAM_GUIDANCE[guidanceKey]}
        </div>
    </div>
  );

  return (
    <div className="p-4 pb-24 min-h-screen bg-amber-50/50">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-lg">
            <FlaskConical size={24} className="text-amber-700" />
          </div>
          {t('nav.soil')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Analyze soil test results or use AI visual diagnostics.</p>
      </header>

      {/* Visual Analysis Section */}
      <div className="mb-6 space-y-4">
          <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => cameraInputRef.current?.click()} 
                className="flex-1 bg-amber-600 text-white p-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-200 active:scale-95 transition-all"
              >
                <Camera size={18} /> Camera Scan
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
              </button>
              <button 
                type="button" 
                onClick={() => galleryInputRef.current?.click()} 
                className="flex-1 bg-white border border-amber-200 text-amber-800 p-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <ImageIcon size={18} /> From Gallery
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </button>
          </div>

          {visualImage && (
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-amber-100 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative h-56 bg-slate-900">
                    <img src={visualImage} className="w-full h-full object-cover opacity-80" alt="Soil Scan" />
                    
                    {/* Scanning Overlay */}
                    {isVisualLoading && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <Loader2 className="animate-spin text-amber-400 mb-4" size={40} />
                            <h4 className="text-white font-black uppercase tracking-widest text-xs">AI Soil Diagnostics in Progress</h4>
                            <p className="text-white/60 text-[10px] mt-2 font-medium">Detecting texture, organic matter, and visual indicators...</p>
                        </div>
                    )}

                    {/* Confidence Badge */}
                    {!isVisualLoading && visualConfidence && (
                        <div className="absolute top-4 left-4 animate-in slide-in-from-left-4 duration-500">
                            <div className="bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-white border border-white/20 shadow-lg">
                                <div className="flex items-center gap-2">
                                    <Scan size={14} className="text-emerald-200" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Confidence: {visualConfidence}%</span>
                                </div>
                                <div className="text-lg font-black leading-tight mt-0.5">{visualTextureLabel}</div>
                            </div>
                        </div>
                    )}

                    {/* Close Button */}
                    <button 
                        onClick={() => { setVisualImage(null); setVisualAnalysis(null); }} 
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/40 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {visualAnalysis && (
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                            <Target size={18} className="animate-pulse" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Visual Diagnostic Report</h3>
                        </div>
                        <div className="prose prose-sm prose-amber max-w-none text-slate-600 font-medium">
                            <ReactMarkdown>{visualAnalysis}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
          )}
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleLoadSample} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold hover:bg-amber-200 transition-colors shadow-sm">Load Sample Data</button>
            <button type="button" disabled={autoPopulating || !location} onClick={handleAutoPopulate} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50">
              {autoPopulating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Use Live Weather
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-amber-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Crop</label>
              <input type="text" name="crop" value={formData.crop} onChange={handleChange} placeholder="Tomatoes, Corn, Wheat..." className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <InputLabelWithTooltip label="pH Level" guidanceKey="ph" />
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 cursor-help">Texture <Info size={14} className="text-gray-400"/></label>
                <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{TEXTURE_INFO[formData.type] || 'Select a soil type.'}</div>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold">
                  {Object.keys(TEXTURE_INFO).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.1" min="0" max="14" name="ph" value={formData.ph} onChange={handleChange} placeholder="e.g., 6.5" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
              <div className="opacity-0 pointer-events-none h-0">Spacing Placeholder</div>
            </div>

            {showPhWarning && (
                <div className="bg-orange-50 text-orange-900 p-3 rounded-2xl text-sm border border-orange-200 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-2 font-bold"><AlertTriangle className="text-orange-600" size={18} /> Action Needed: {isPhAcidic ? "Raise pH" : "Lower pH"}</div>
                    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                        <div className="bg-orange-100 p-2 rounded-full">{isPhAcidic ? <Hammer size={20} className="text-gray-600"/> : <Droplet size={20} className="text-yellow-600"/>}</div>
                        <div>
                            <span className="block font-semibold">{isPhAcidic ? "Apply Agricultural Lime" : "Apply Elemental Sulfur"}</span>
                            <span className="text-xs text-orange-700">{isPhAcidic ? "Crushed limestone neutralizes acidity." : "Sulfur bacteria create acid."}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1"><Sprout size={16} className="text-green-600"/> Nutrient Levels</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                 <div className="space-y-1">
                    <InputLabelWithTooltip label="Nitrogen (N)" guidanceKey="n" />
                    <input type="text" name="nitrogen" value={formData.nitrogen} onChange={handleChange} placeholder="e.g. 30" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
                 </div>
                 <div className="space-y-1">
                    <InputLabelWithTooltip label="Phosphorus (P)" guidanceKey="p" />
                    <input type="text" name="phosphorus" value={formData.phosphorus} onChange={handleChange} placeholder="e.g. 40" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
                 </div>
                 <div className="space-y-1">
                    <InputLabelWithTooltip label="Potassium (K)" guidanceKey="k" />
                    <input type="text" name="potassium" value={formData.potassium} onChange={handleChange} placeholder="e.g. 200" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
                 </div>
                 <div className="space-y-1">
                    <InputLabelWithTooltip label="Organic Matter" guidanceKey="om" />
                    <input type="text" name="organicMatter" value={formData.organicMatter} onChange={handleChange} placeholder="e.g. 3.5%" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
                 </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full py-3 rounded-2xl font-bold text-white shadow-md transition-all ${loading ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg'}`}>
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Finalizing Health Report...</span> : "Generate Health Plan"}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-amber-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-100 pb-4 mb-4 gap-4">
                    <h3 className="font-bold text-xl text-amber-900">Soil Health Card</h3>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button onClick={handleExportPDF} className="flex-1 sm:flex-none text-sm flex items-center justify-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 px-4 py-2 bg-emerald-50 rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-95"><FileText size={16}/> Export PDF</button>
                        <button onClick={resetForm} className="flex-1 sm:flex-none text-sm text-gray-500 font-medium hover:text-amber-600 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">New Scan</button>
                    </div>
                </div>
                <div className="mb-8 border-b border-gray-100 pb-6">
                    {renderHealthGauge(result.health_score || 50)}
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-1"><Activity size={16}/> Nutrient Status & Needs</h4>
                    {[
                        { label: 'Nitrogen (N)', val: result.normalized_n, req: result.typical_n, color: getNutrientColor(result.normalized_n || 0) },
                        { label: 'Phosphorus (P)', val: result.normalized_p, req: result.typical_p, color: getNutrientColor(result.normalized_p || 0) },
                        { label: 'Potassium (K)', val: result.normalized_k, req: result.typical_k, color: getNutrientColor(result.normalized_k || 0) }
                    ].map((nutrient, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-2xl">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-black text-gray-800">{nutrient.label}</span>
                                <span className="text-xs font-bold text-gray-500">Need: {nutrient.req}</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden relative">
                                <div className="h-full transition-all duration-1000" style={{ width: `${Math.min(nutrient.val, 100)}%`, backgroundColor: nutrient.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-amber-100">
                <div className="prose prose-sm prose-amber max-w-none text-slate-600 font-medium leading-relaxed"><ReactMarkdown>{result.analysis}</ReactMarkdown></div>
            </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-8 space-y-4">
           {renderTrendChart()}
           <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group transition-all hover:border-amber-200">
              <div className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-widest text-xs group-hover:text-amber-700"><History size={18} /> Visual History Archives</div>
              {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
           {showHistory && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest col-span-full"><Filter size={12}/> Filter Archives</div>
                    <input type="text" placeholder="Search by crop..." value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)} className="p-2.5 text-xs font-bold border rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-amber-500/20" />
                </div>
                {filteredHistory.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                {item.imageUrl ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md border border-slate-200 flex-shrink-0 group relative cursor-zoom-in">
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="Soil Thumbnail" />
                                        {item.confidence && (
                                            <div className="absolute inset-x-0 bottom-0 bg-emerald-600/90 text-[8px] text-white font-black text-center py-0.5">
                                                {item.confidence}%
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0">
                                        <FlaskConical size={24} />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg">{item.crop}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.textureLabel || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteHistory(item.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={18}/></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-blue-50/50 p-2 rounded-xl text-center">
                                <span className="block text-[8px] font-black text-blue-400 uppercase">N Score</span>
                                <span className="text-xs font-black text-blue-700">{item.normalized_n || 0}%</span>
                            </div>
                            <div className="bg-green-50/50 p-2 rounded-xl text-center">
                                <span className="block text-[8px] font-black text-green-400 uppercase">P Score</span>
                                <span className="text-xs font-black text-green-700">{item.normalized_p || 0}%</span>
                            </div>
                            <div className="bg-orange-50/50 p-2 rounded-xl text-center">
                                <span className="block text-[8px] font-black text-orange-400 uppercase">K Score</span>
                                <span className="text-xs font-black text-orange-700">{item.normalized_k || 0}%</span>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SoilAnalyzer;
