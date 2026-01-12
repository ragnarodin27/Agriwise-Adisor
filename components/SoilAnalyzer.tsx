
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { analyzeSoil, SoilAnalysisResult, getWeatherAndTip, diagnoseCrop } from '../services/geminiService';
import { LocationData } from '../types';
import { FlaskConical, Sprout, Loader2, AlertCircle, History, Info, ChevronDown, ChevronUp, Plus, Trash2, TrendingUp, AlertTriangle, HelpCircle, Edit2, Save, X, Hammer, Droplet, Activity, Link as LinkIcon, FileText, Zap, Camera, Image as ImageIcon, Filter, BarChart3, Search } from 'lucide-react';
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
  const [showGuide, setShowGuide] = useState(false);
  
  const [visualImage, setVisualImage] = useState<string | null>(null);
  const [visualAnalysis, setVisualAnalysis] = useState<string | null>(null);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [filterCrop, setFilterCrop] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterLinkedId, setFilterLinkedId] = useState('');
  
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editHistoryValue, setEditHistoryValue] = useState('');

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
        setVisualImage(reader.result as string);
        handleAnalyzePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzePhoto = async (base64: string) => {
    setIsVisualLoading(true);
    setVisualAnalysis(null);
    setError(null);
    try {
      const match = base64.match(/^data:(.*);base64,(.*)$/);
      if (!match) throw new Error("Invalid image format");
      
      const imagePart = { mimeType: match[1], data: match[2] };
      const result = await diagnoseCrop(
        imagePart, 
        "Analyze this soil sample for physical properties: color, texture, possible nutrient deficiencies, and organic matter indicators.", 
        language
      );
      setVisualAnalysis(result);
    } catch (err) {
      setError("Visual soil analysis failed.");
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
        organicMatter: formData.organicMatter
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

  const startEditHistory = (item: SoilResult) => {
    setEditingHistoryId(item.id);
    setEditHistoryValue(item.crop);
  };

  const saveEditHistory = (id: string) => {
    const updated = history.map(h => h.id === id ? { ...h, crop: editHistoryValue } : h);
    setHistory(updated);
    localStorage.setItem('soilHistory', JSON.stringify(updated));
    setEditingHistoryId(null);
  };

  const cancelEditHistory = () => {
    setEditingHistoryId(null);
    setEditHistoryValue('');
  };

  const getNumericValue = (val: string) => {
      const match = val.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
  };

  const phVal = parseFloat(formData.ph);
  const isPhAcidic = !isNaN(phVal) && phVal < 5.5;
  const isPhAlkaline = !isNaN(phVal) && phVal > 7.5;
  const showPhWarning = isPhAcidic || isPhAlkaline;

  const nVal = getNumericValue(formData.nitrogen);
  const pVal = getNumericValue(formData.phosphorus);
  const kVal = getNumericValue(formData.potassium);
  const hasNutrientInput = nVal > 0 || pVal > 0 || kVal > 0;

  const getNutrientColor = (val: number) => {
      // Scale: 0-30: Red (Deficient), 40-70: Green (Optimal), 80-100: Orange/Red (Excess)
      if (val < 35) return '#EF4444'; // Red
      if (val >= 35 && val < 45) return '#F59E0B'; // Amber
      if (val >= 45 && val < 75) return '#22C55E'; // Green
      if (val >= 75 && val < 85) return '#F59E0B'; // Amber
      return '#EF4444'; // Red (Excess)
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

  return (
    <div className="p-4 pb-24 min-h-screen bg-amber-50/50">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-lg">
            <FlaskConical size={24} className="text-amber-700" />
          </div>
          {t('nav.soil')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Analyze soil test results or use live environmental data.</p>
      </header>

      {visualImage && (
        <div className="mb-6 bg-white rounded-2xl overflow-hidden shadow-xl border border-amber-200 animate-in fade-in slide-in-from-top-4">
          <div className="relative h-48 bg-slate-900">
            <img src={visualImage} className="w-full h-full object-cover opacity-60" alt="Soil sample" />
            <div className="absolute inset-0 flex items-center justify-center">
              {isVisualLoading ? (
                <div className="flex flex-col items-center gap-3">
                   <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-white text-sm font-black uppercase tracking-widest animate-pulse">Scanning Texture...</span>
                </div>
              ) : (
                <div className="bg-amber-500/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-black flex items-center gap-2 shadow-lg">
                   <Zap size={20} className="animate-pulse" /> Visual Assessment Complete
                </div>
              )}
            </div>
            <button onClick={() => { setVisualImage(null); setVisualAnalysis(null); }} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
              <X size={18} />
            </button>
          </div>
          {visualAnalysis && (
            <div className="p-5">
              <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info size={14}/> Observed physical traits
              </h4>
              <div className="prose prose-sm prose-amber max-w-none">
                <ReactMarkdown>{visualAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleLoadSample} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold hover:bg-amber-200 transition-colors shadow-sm">Load Sample Data</button>
            <button type="button" disabled={autoPopulating || !location} onClick={handleAutoPopulate} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50">
              {autoPopulating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Use Live Weather Data
            </button>
            <button type="button" onClick={() => photoInputRef.current?.click()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-1.5">
              <Camera size={12} /> Analyze Soil by Photo
              <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-amber-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Crop</label>
              <input type="text" name="crop" value={formData.crop} onChange={handleChange} placeholder="e.g., Tomatoes, Corn, Wheat" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 cursor-help">pH Level <HelpCircle size={14} className="text-gray-400"/></label>
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{PARAM_GUIDANCE.ph}</div>
                <input type="number" step="0.1" min="0" max="14" name="ph" value={formData.ph} onChange={handleChange} placeholder="e.g., 6.5" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 cursor-help">Texture <Info size={14} className="text-gray-400"/></label>
                <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{TEXTURE_INFO[formData.type] || 'Select a soil type to see details.'}</div>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                  {Object.keys(TEXTURE_INFO).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {showPhWarning && (
                <div className="bg-orange-50 text-orange-900 p-3 rounded-2xl text-sm border border-orange-200 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-2 font-bold"><AlertTriangle className="text-orange-600" size={18} /> Action Needed: {isPhAcidic ? "Raise pH" : "Lower pH"}</div>
                    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                        <div className="bg-orange-100 p-2 rounded-full">{isPhAcidic ? <Hammer size={20} className="text-gray-600"/> : <Droplet size={20} className="text-yellow-600"/>}</div>
                        <div>
                            <span className="block font-semibold">{isPhAcidic ? "Apply Agricultural Lime" : "Apply Elemental Sulfur"}</span>
                            <span className="text-xs text-orange-700">{isPhAcidic ? "Crushed limestone neutralizes acidity." : "Sulfur bacteria create acid to lower pH."}</span>
                        </div>
                    </div>
                </div>
            )}
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1"><Sprout size={16} className="text-green-600"/> Nutrient Levels</span>
                <button type="button" onClick={() => setShowGuide(!showGuide)} className="text-gray-400 hover:text-green-600"><Info size={16} /></button>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1 cursor-help">N (ppm) <HelpCircle size={10} className="text-gray-400"/></label>
                  <input type="text" name="nitrogen" value={formData.nitrogen} onChange={handleChange} placeholder="e.g. 30" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1 cursor-help">P (ppm) <HelpCircle size={10} className="text-gray-400"/></label>
                  <input type="text" name="phosphorus" value={formData.phosphorus} onChange={handleChange} placeholder="e.g. 40" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1 cursor-help">K (ppm) <HelpCircle size={10} className="text-gray-400"/></label>
                  <input type="text" name="potassium" value={formData.potassium} onChange={handleChange} placeholder="e.g. 200" className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full py-3 rounded-2xl font-bold text-white shadow-md transition-all ${loading ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg'}`}>
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Analyzing Soil...</span> : "Get Recommendations"}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-md border border-amber-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-100 pb-4 mb-4 gap-4">
                    <h3 className="font-bold text-xl text-amber-900">Soil Health Card</h3>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button onClick={handleExportPDF} className="flex-1 sm:flex-none text-sm flex items-center justify-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 px-4 py-2 bg-emerald-50 rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-95"><FileText size={16}/> Export Report</button>
                        <button onClick={resetForm} className="flex-1 sm:flex-none text-sm text-gray-500 font-medium hover:text-amber-600 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">New Analysis</button>
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
                <div className="prose prose-sm prose-amber max-w-none"><ReactMarkdown>{result.analysis}</ReactMarkdown></div>
            </div>
        </div>
      )}

      {/* Enhanced Amendment Log Section */}
      <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
         <h3 className="font-black text-gray-800 mb-6 flex items-center justify-between gap-2 uppercase tracking-widest text-sm">
            <div className="flex items-center gap-2">
                <History size={18} className="text-amber-600"/> Amendment Log
            </div>
            <div className="relative h-9 min-w-[120px]">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"><Search size={14}/></div>
                <select 
                    value={filterLinkedId}
                    onChange={(e) => setFilterLinkedId(e.target.value)}
                    className="w-full h-full pl-7 pr-4 text-[10px] font-black uppercase bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                    <option value="">All Logs</option>
                    {history.map(h => <option key={h.id} value={h.id}>{h.crop} ({h.date})</option>)}
                </select>
            </div>
         </h3>
         
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 mb-6">
             <div className="grid grid-cols-2 gap-3">
                 <input type="date" value={newAmendment.date} onChange={e => setNewAmendment({...newAmendment, date: e.target.value})} className="border rounded-xl px-3 py-2 text-xs font-bold text-gray-600 outline-none w-full" />
                 <input type="text" placeholder="Product Type" value={newAmendment.type} onChange={e => setNewAmendment({...newAmendment, type: e.target.value})} className="border rounded-xl px-3 py-2 text-xs font-bold outline-none w-full" />
             </div>
             {history.length > 0 && (
                <select value={newAmendment.linkedAnalysisId} onChange={e => setNewAmendment({...newAmendment, linkedAnalysisId: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-xs text-gray-600 outline-none font-bold bg-white">
                    <option value="">-- Link to Analysis (Optional) --</option>
                    {history.map(h => <option key={h.id} value={h.id}>{h.date} - {h.crop}</option>)}
                </select>
             )}
             <div className="flex gap-2">
                <input type="text" placeholder="Quantity/Notes..." value={newAmendment.notes} onChange={e => setNewAmendment({...newAmendment, notes: e.target.value})} className="flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                <button onClick={addAmendment} className="bg-amber-600 text-white px-4 rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center shadow-lg shadow-amber-200"><Plus size={20} /></button>
             </div>
         </div>

         <div className="space-y-3 max-h-72 overflow-y-auto pr-1 no-scrollbar">
             {displayedAmendments.length === 0 && <p className="text-xs text-gray-400 text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No matching amendments found.</p>}
             {displayedAmendments.map(item => (
                 <div key={item.id} className="flex justify-between items-start bg-white p-4 rounded-2xl text-sm border border-slate-100 shadow-sm hover:border-amber-200 transition-all animate-in slide-in-from-bottom-2">
                     <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                             <span className="font-black text-slate-800">{item.type}</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.date}</span>
                         </div>
                         {item.notes && <p className="text-xs text-slate-500 font-medium">{item.notes}</p>}
                         {item.linkedAnalysisId && (
                             <div className="inline-flex items-center gap-1.5 text-[9px] font-black bg-amber-50 text-amber-700 px-2 py-1 rounded-lg mt-2 uppercase tracking-tight border border-amber-100">
                                 <LinkIcon size={10}/> Response to {history.find(h => h.id === item.linkedAnalysisId)?.crop || "Analysis"}
                             </div>
                         )}
                     </div>
                     <button onClick={() => deleteAmendment(item.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                 </div>
             ))}
         </div>
      </div>
      
      {history.length > 0 && !result && (
        <div className="mt-8 space-y-4">
           {renderTrendChart()}
           <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group transition-all hover:border-amber-200">
              <div className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-widest text-xs group-hover:text-amber-700"><History size={18} /> Past Reports History</div>
              {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
           {showHistory && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest col-span-full"><Filter size={12}/> Filter Archives</div>
                    <input type="text" placeholder="Search by crop..." value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)} className="p-2.5 text-xs font-bold border rounded-xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-amber-500/20" />
                    <div className="flex gap-2">
                        <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="flex-1 p-2.5 text-xs font-bold border rounded-xl bg-slate-50/50 outline-none" />
                        <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="flex-1 p-2.5 text-xs font-bold border rounded-xl bg-slate-50/50 outline-none" />
                    </div>
                </div>
                {filteredHistory.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-black text-slate-800 text-lg">{item.crop}</h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => deleteHistory(item.id)} className="p-2 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
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
                        <div className="line-clamp-3 text-xs text-slate-600 font-medium leading-relaxed opacity-70"><ReactMarkdown>{item.analysis}</ReactMarkdown></div>
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
