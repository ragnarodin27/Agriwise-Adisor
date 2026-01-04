import React, { useState, useEffect } from 'react';
import { analyzeSoil, SoilAnalysisResult } from '../services/geminiService';
import { LocationData } from '../types';
import { FlaskConical, Sprout, Loader2, AlertCircle, History, Info, ChevronDown, ChevronUp, Plus, Trash2, TrendingUp, AlertTriangle, HelpCircle, Edit2, Save, X, Hammer, Droplet, Activity, Link as LinkIcon, Download, Filter } from 'lucide-react';
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
    type: 'Loam'
  });
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SoilResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [filterCrop, setFilterCrop] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      type: 'Clay Loam'
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
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(30, 100, 30); // Dark Green
      doc.text("AgriWise Soil Analysis Report", 15, 20);
      
      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 15, 30);
      doc.text(`Target Crop: ${formData.crop}`, 15, 36);
      doc.text(`Soil Type: ${formData.type}`, 15, 42);
      doc.text(`pH Level: ${formData.ph} | Organic Matter: ${formData.organicMatter || 'N/A'}%`, 15, 48);
      
      // Health Score
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 55, 195, 55);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Overall Soil Health Score: ${result.health_score}/100`, 15, 65);
      
      // Nutrient Summary
      doc.setFontSize(12);
      doc.text("Nutrient Status:", 15, 75);
      doc.setFontSize(10);
      doc.text(`• Nitrogen (N): ${result.normalized_n}/100 (Typical: ${result.typical_n})`, 20, 82);
      doc.text(`• Phosphorus (P): ${result.normalized_p}/100 (Typical: ${result.typical_p})`, 20, 88);
      doc.text(`• Potassium (K): ${result.normalized_k}/100 (Typical: ${result.typical_k})`, 20, 94);
      
      if (formData.magnesium || formData.boron || formData.copper) {
          doc.text(`• Micronutrients: Mg: ${formData.magnesium || '-'}, B: ${formData.boron || '-'}, Cu: ${formData.copper || '-'}`, 20, 100);
      }

      // Detailed Analysis
      doc.setFontSize(12);
      doc.text("AI Analysis & Recommendations:", 15, 112);
      
      doc.setFontSize(10);
      // Strip markdown **bold** characters for PDF text
      const cleanAnalysis = result.analysis.replace(/\*\*/g, '').replace(/###/g, '');
      const splitAnalysis = doc.splitTextToSize(cleanAnalysis, 180);
      doc.text(splitAnalysis, 15, 120);
      
      // Add companion advice if space permits
      if (result.companion_advice) {
          let currentY = 120 + (splitAnalysis.length * 5); // Approx line height
          if (currentY > 260) {
              doc.addPage();
              currentY = 20;
          } else {
              currentY += 10;
          }
          
          doc.setFontSize(12);
          doc.text("Companion Advice:", 15, currentY);
          doc.setFontSize(10);
          const cleanAdvice = result.companion_advice.replace(/\*\*/g, '');
          const splitAdvice = doc.splitTextToSize(cleanAdvice, 180);
          doc.text(splitAdvice, 15, currentY + 8);
      }

      doc.save(`AgriWise_Soil_Report_${formData.crop}.pdf`);
  };

  const resetForm = () => {
    setResult(null);
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
      type: 'Loam'
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

  const sortedAmendments = [...amendments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const renderHealthGauge = (score: number) => {
      const radius = 50;
      const stroke = 12;
      // Semi-circle circumference (PI * r)
      const circumference = Math.PI * radius; 
      const normalizedScore = Math.max(0, Math.min(100, score));
      // Calculate offset for semi-circle
      const offset = circumference - (normalizedScore / 100) * circumference;
      
      let colorClass = 'text-red-500';
      let strokeColor = '#EF4444'; // Red-500
      let label = "Poor";
      
      if (score > 40) { 
          colorClass = 'text-yellow-500'; 
          strokeColor = '#EAB308'; // Yellow-500
          label = "Average";
      }
      if (score > 75) { 
          colorClass = 'text-green-500'; 
          strokeColor = '#22C55E'; // Green-500
          label = "Excellent";
      }

      return (
          <div className="flex flex-col items-center justify-center py-4">
             <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
                 <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 70" preserveAspectRatio="xMidYMax meet">
                     {/* Background Track */}
                     <path 
                        d="M10,60 A50,50 0 0,1 110,60"
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                     />
                     
                     {/* Progress Bar */}
                     <path 
                        d="M10,60 A50,50 0 0,1 110,60"
                        fill="none"
                        stroke={strokeColor} 
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                     />
                 </svg>
                 
                 {/* Center Text */}
                 <div className="relative z-10 flex flex-col items-center mb-1">
                     <span className={`text-5xl font-extrabold ${colorClass} tracking-tighter`}>{Math.round(score)}</span>
                     <span className={`text-xs font-bold uppercase tracking-widest ${colorClass} bg-white/50 px-2 rounded-full mt-1`}>
                        {label}
                     </span>
                 </div>
             </div>
             <p className="text-gray-400 text-xs mt-2 font-medium">Soil Health Index (0-100)</p>
          </div>
      );
  };

  const renderTrendChart = () => {
      const data = history.filter(h => h.normalized_n !== undefined).slice(0, 10).reverse();
      if (data.length < 2) return null;

      const width = 300;
      const height = 100;
      const padding = 10;
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
          <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp size={16} /> Nutrient Trends (Normalized)
              </h4>
              <div className="relative">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#eee" strokeDasharray="4 4" />
                    <path d={createPath('normalized_n')} fill="none" stroke="#3B82F6" strokeWidth="2" />
                    <path d={createPath('normalized_p')} fill="none" stroke="#22C55E" strokeWidth="2" />
                    <path d={createPath('normalized_k')} fill="none" stroke="#F97316" strokeWidth="2" />
                    {data.map((d, i) => (
                        <g key={i}>
                            <circle cx={padding + i * step} cy={getY(d.normalized_n || 0)} r="2" fill="#3B82F6" />
                            <circle cx={padding + i * step} cy={getY(d.normalized_p || 0)} r="2" fill="#22C55E" />
                            <circle cx={padding + i * step} cy={getY(d.normalized_k || 0)} r="2" fill="#F97316" />
                        </g>
                    ))}
                </svg>
                <div className="flex justify-center gap-4 mt-2 text-[10px]">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Nitrogen</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Phosphorus</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> Potassium</span>
                </div>
              </div>
          </div>
      );
  };

  const filteredHistory = history.filter(item => {
    if (filterCrop && !item.crop.toLowerCase().includes(filterCrop.toLowerCase())) {
        return false;
    }
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

  return (
    <div className="p-4 pb-24 min-h-screen bg-amber-50/50">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-lg">
            <FlaskConical size={24} className="text-amber-700" />
          </div>
          {t('nav.soil')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Enter your soil test results for AI-powered fertilization advice.</p>
      </header>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button 
            type="button"
            onClick={handleLoadSample}
            className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium hover:bg-amber-200 transition-colors w-full sm:w-auto"
          >
            Load Sample Data
          </button>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-100 space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Crop</label>
              <input
                type="text"
                name="crop"
                value={formData.crop}
                onChange={handleChange}
                placeholder="e.g., Tomatoes, Corn, Wheat"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 cursor-help">
                    pH Level <HelpCircle size={14} className="text-gray-400"/>
                </label>
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Optimal pH allows roots to absorb nutrients. Most crops prefer 6.0 - 7.0.
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  name="ph"
                  value={formData.ph}
                  onChange={handleChange}
                  placeholder="e.g., 6.5"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 cursor-help">
                    Texture <Info size={14} className="text-gray-400"/>
                </label>
                <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                   {TEXTURE_INFO[formData.type] || 'Select a soil type to see details.'}
                   <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                </div>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  {Object.keys(TEXTURE_INFO).map(t => (
                      <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organic Matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="organicMatter"
                    value={formData.organicMatter}
                    onChange={handleChange}
                    placeholder="e.g., 2.5"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
              </div>
            </div>

            {showPhWarning && (
                <div className="bg-orange-50 text-orange-900 p-3 rounded-xl text-sm border border-orange-200 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-2 font-bold">
                        <AlertTriangle className="text-orange-600" size={18} />
                        Action Needed: {isPhAcidic ? "Raise pH" : "Lower pH"}
                    </div>
                    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                        <div className="bg-orange-100 p-2 rounded-full">
                            {isPhAcidic ? <Hammer size={20} className="text-gray-600"/> : <Droplet size={20} className="text-yellow-600"/>}
                        </div>
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
                <button type="button" onClick={() => setShowGuide(!showGuide)} className="text-gray-400 hover:text-green-600">
                   <Info size={16} />
                </button>
              </h3>
              
              {showGuide && (
                <div className="mb-4 bg-green-50 p-3 rounded-lg text-xs text-green-900 border border-green-100">
                  <p className="font-bold mb-1">Deficiency Guide:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Nitrogen (N):</strong> Yellowing of older/lower leaves, stunted growth.</li>
                    <li><strong>Phosphorus (P):</strong> Leaves turn purple/reddish, poor root growth.</li>
                    <li><strong>Potassium (K):</strong> Scorched/brown leaf edges, weak stems.</li>
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nitrogen (N)</label>
                  <input
                    type="text"
                    name="nitrogen"
                    value={formData.nitrogen}
                    onChange={handleChange}
                    placeholder="Level"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phosphorus (P)</label>
                  <input
                    type="text"
                    name="phosphorus"
                    value={formData.phosphorus}
                    onChange={handleChange}
                    placeholder="Level"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Potassium (K)</label>
                  <input
                    type="text"
                    name="potassium"
                    value={formData.potassium}
                    onChange={handleChange}
                    placeholder="Level"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {hasNutrientInput && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 animate-in fade-in">
                       <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Input Visualization (Est.)</h4>
                       <div className="space-y-2">
                           <div className="flex items-center gap-2 text-xs">
                              <span className="w-4 font-bold text-blue-600">N</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${Math.min((nVal / 200) * 100, 100)}%`}}></div>
                              </div>
                              <span className="w-8 text-right text-gray-500">{nVal}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                              <span className="w-4 font-bold text-green-600">P</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${Math.min((pVal / 100) * 100, 100)}%`}}></div>
                              </div>
                              <span className="w-8 text-right text-gray-500">{pVal}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                              <span className="w-4 font-bold text-orange-600">K</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 transition-all duration-500" style={{width: `${Math.min((kVal / 300) * 100, 100)}%`}}></div>
                              </div>
                              <span className="w-8 text-right text-gray-500">{kVal}</span>
                           </div>
                       </div>
                  </div>
              )}

              <div className="mt-4 pt-2 border-t border-gray-100">
                 <h4 className="text-xs font-semibold text-gray-500 mb-2">Micronutrients</h4>
                 <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Magnesium (Mg)</label>
                        <input type="text" name="magnesium" value={formData.magnesium} onChange={handleChange} placeholder="ppm or notes" className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none"/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Boron (B)</label>
                        <input type="text" name="boron" value={formData.boron} onChange={handleChange} placeholder="ppm or notes" className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none"/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Copper (Cu)</label>
                        <input type="text" name="copper" value={formData.copper} onChange={handleChange} placeholder="ppm or notes" className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none"/>
                    </div>
                 </div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Other Micronutrients</label>
                 <input
                    type="text"
                    name="micronutrients"
                    value={formData.micronutrients}
                    onChange={handleChange}
                    placeholder="Other notes (e.g. Zinc is low)"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
              </div>
            </div>

          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
              loading ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" /> Analyzing Soil...
              </span>
            ) : "Get Recommendations"}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
                <div className="flex justify-between items-center border-b border-amber-100 pb-4 mb-4">
                    <h3 className="font-bold text-xl text-amber-900">Soil Health Card</h3>
                    <div className="flex gap-2">
                        <button onClick={handleExportPDF} className="text-sm flex items-center gap-1 text-green-600 hover:text-green-700 px-3 py-1 bg-green-50 rounded-lg transition-colors">
                            <Download size={14}/> Report (PDF)
                        </button>
                        <button onClick={resetForm} className="text-sm text-gray-500 hover:text-amber-600 underline">
                            New Analysis
                        </button>
                    </div>
                </div>
                
                <div className="mb-8 border-b border-gray-100 pb-6">
                    {renderHealthGauge(result.health_score || 50)}
                    <p className="text-center text-sm text-gray-500 mt-2 px-6">
                        {result.health_score > 80 ? "Excellent balance!" : result.health_score > 50 ? "Good, but needs some adjustments." : "Critical attention needed."}
                    </p>
                </div>

                {!isNaN(phVal) && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-1 text-gray-600">
                            <span>Acidic (0)</span>
                            <span className="font-bold text-amber-800">pH {phVal}</span>
                            <span>Alkaline (14)</span>
                        </div>
                        <div className="h-4 w-full bg-gradient-to-r from-red-400 via-green-400 to-blue-400 rounded-full relative">
                             <div 
                                className="absolute top-0 w-1 h-5 bg-black border border-white -mt-0.5"
                                style={{ left: `${(phVal / 14) * 100}%` }}
                             />
                        </div>
                        <p className="text-center text-xs mt-1 text-gray-500">Optimal range: 6.0 - 7.0</p>
                    </div>
                )}

                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                        <Activity size={16}/> Nutrient Status & Needs
                    </h4>
                    
                    {[
                        { label: 'Nitrogen (N)', val: result.normalized_n, req: result.typical_n, color: 'bg-blue-500' },
                        { label: 'Phosphorus (P)', val: result.normalized_p, req: result.typical_p, color: 'bg-green-500' },
                        { label: 'Potassium (K)', val: result.normalized_k, req: result.typical_k, color: 'bg-orange-500' }
                    ].map((nutrient, i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-medium">{nutrient.label}</span>
                                <div className="text-right">
                                    <span className="block text-[10px] text-gray-400 uppercase">Typical Need</span>
                                    <span className="text-xs font-semibold text-gray-700">{nutrient.req}</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden relative">
                                <div className={`h-full ${nutrient.color} transition-all duration-1000`} style={{ width: `${Math.min(nutrient.val, 100)}%` }}></div>
                                <div className="absolute top-0 bottom-0 w-0.5 bg-gray-800 opacity-30 z-10 border-l border-dashed border-gray-400" style={{ left: '50%' }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1 relative">
                                <span>Low</span>
                                <span className="text-gray-600 font-medium">Optimal</span>
                                <span>Excess</span>
                            </div>
                        </div>
                    ))}
                </div>

                {result.companion_advice && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl mt-6 flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                     <div className="bg-green-100 p-2 rounded-full h-fit text-green-700 shadow-sm shrink-0">
                        <Sprout size={20}/>
                     </div>
                     <div>
                       <h4 className="font-bold text-green-900 text-sm">Soil Synergy Tip</h4>
                       <p className="text-green-800 text-sm mt-1 leading-relaxed">{result.companion_advice}</p>
                     </div>
                  </div>
                )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
                <div className="prose prose-sm prose-amber max-w-none">
                    <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>
            </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <History size={18} className="text-amber-600"/> Amendment Log
         </h3>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
             <input 
                type="date" 
                value={newAmendment.date}
                onChange={e => setNewAmendment({...newAmendment, date: e.target.value})}
                className="border rounded-lg px-2 py-2 text-sm text-gray-600 outline-none focus:border-amber-400 w-full"
             />
             <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Type (e.g. Lime)"
                    value={newAmendment.type}
                    onChange={e => setNewAmendment({...newAmendment, type: e.target.value})}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 min-w-0"
                />
             </div>
             {history.length > 0 && (
                <div className="sm:col-span-2">
                    <select
                        value={newAmendment.linkedAnalysisId}
                        onChange={e => setNewAmendment({...newAmendment, linkedAnalysisId: e.target.value})}
                        className="w-full border rounded-lg px-2 py-2 text-sm text-gray-600 outline-none focus:border-amber-400 bg-white"
                    >
                        <option value="">-- Link to an Analysis (Optional) --</option>
                        {history.map(h => (
                            <option key={h.id} value={h.id}>{h.date} - {h.crop}</option>
                        ))}
                    </select>
                </div>
             )}
             <div className="sm:col-span-2 flex gap-2">
                 <input 
                    type="text" 
                    placeholder="Notes (e.g. 50kg per acre)..."
                    value={newAmendment.notes}
                    onChange={e => setNewAmendment({...newAmendment, notes: e.target.value})}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 w-full"
                />
                <button 
                    onClick={addAmendment}
                    className="bg-amber-600 text-white p-2 rounded-lg hover:bg-amber-700 shrink-0"
                >
                    <Plus size={20} />
                </button>
             </div>
         </div>

         <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
             {amendments.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No amendments logged yet.</p>}
             {sortedAmendments.map(item => (
                 <div key={item.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                     <div>
                         <div className="flex items-center gap-2">
                             <span className="font-bold text-gray-700">{item.type}</span>
                             <span className="text-xs text-gray-400">{item.date}</span>
                         </div>
                         {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                         {item.linkedAnalysisId && (
                             <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-1">
                                 <LinkIcon size={8}/> Linked to Analysis
                             </span>
                         )}
                     </div>
                     <button onClick={() => deleteAmendment(item.id)} className="text-red-400 hover:text-red-600 p-1">
                         <Trash2 size={16} />
                     </button>
                 </div>
             ))}
         </div>
      </div>
      
      {history.length > 0 && !result && (
        <div className="mt-8">
           {renderTrendChart()}
           
           <button 
             onClick={() => setShowHistory(!showHistory)}
             className="flex items-center justify-between w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 group"
           >
              <div className="flex items-center gap-2 font-semibold text-gray-700 group-hover:text-amber-700">
                <History size={18} /> Past Analyses
              </div>
              {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
           
           {showHistory && (
             <div className="mt-2 space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 col-span-full">
                        <Filter size={12}/> Filter History
                    </div>
                    <input 
                        type="text" 
                        placeholder="Filter by Crop Name..."
                        value={filterCrop}
                        onChange={(e) => setFilterCrop(e.target.value)}
                        className="p-2 text-xs border rounded-lg bg-white outline-none focus:border-amber-400"
                    />
                    <div className="flex gap-1">
                        <input 
                            type="date" 
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="flex-1 p-2 text-xs border rounded-lg bg-white outline-none focus:border-amber-400"
                            placeholder="Start"
                        />
                         <input 
                            type="date" 
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="flex-1 p-2 text-xs border rounded-lg bg-white outline-none focus:border-amber-400"
                            placeholder="End"
                        />
                    </div>
                </div>

                {filteredHistory.length === 0 && <p className="text-center text-xs text-gray-400 py-2">No matching records found.</p>}

                {filteredHistory.map(item => {
                    const linkedAmendments = amendments.filter(a => a.linkedAnalysisId === item.id);
                    return (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 text-sm">
                            <div className="flex justify-between items-center mb-2">
                            {editingHistoryId === item.id ? (
                                <div className="flex flex-1 gap-2 mr-2">
                                    <input 
                                        value={editHistoryValue}
                                        onChange={(e) => setEditHistoryValue(e.target.value)}
                                        className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                                        autoFocus
                                    />
                                    <button onClick={() => saveEditHistory(item.id)} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100"><Save size={14}/></button>
                                    <button onClick={cancelEditHistory} className="text-gray-500 bg-gray-50 p-1 rounded hover:bg-gray-100"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-900">{item.crop}</span>
                                        {item.organicMatter && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">OM: {item.organicMatter}%</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEditHistory(item)} className="text-gray-400 hover:text-blue-500 bg-gray-50 p-1 rounded hover:bg-blue-50 transition-colors">
                                            <Edit2 size={14}/>
                                        </button>
                                        <button onClick={() => deleteHistory(item.id)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-1 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </>
                            )}
                            </div>
                            {editingHistoryId !== item.id && <span className="block text-gray-400 text-xs mb-1">{item.date}</span>}
                            
                            {linkedAmendments.length > 0 && (
                                <div className="mb-2 bg-amber-50 p-2 rounded border border-amber-100">
                                    <p className="text-[10px] font-bold text-amber-700 mb-1">Interventions:</p>
                                    {linkedAmendments.map(la => (
                                        <div key={la.id} className="text-[10px] text-gray-600 flex gap-1">
                                            <span>• {la.type}</span>
                                            <span className="text-gray-400">({la.notes})</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="text-gray-600 line-clamp-3">
                            <ReactMarkdown>{item.analysis.substring(0, 150) + "..."}</ReactMarkdown>
                            </div>
                        </div>
                    );
                })}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SoilAnalyzer;