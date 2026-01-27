
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getIrrigationAdvice, getFertilizerSchedule, FertilizerSchedule, getWeatherAndTip } from '../services/geminiService';
import { 
  Droplets, Loader2, Plus, Trash2, Calendar, Droplet, Zap, Leaf, Beaker, CloudRain, TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface IrrigationEvent {
  id: string;
  date: string;
  amount: string;
  crop: string;
  weatherCondition?: string;
}

interface IrrigationAdvisorProps {
  location: LocationData | null;
}

const GROWTH_STAGES = [
  { id: 'Seedling', label: 'Seedling', icon: '🌱' },
  { id: 'Vegetative', label: 'Vegetative', icon: '🌿' },
  { id: 'Flowering', label: 'Flowering', icon: '🌸' },
  { id: 'Fruiting', label: 'Fruiting', icon: '🍅' },
  { id: 'Maturity', label: 'Maturity', icon: '🌾' }
];

const IrrigationAdvisor: React.FC<IrrigationAdvisorProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'plan' | 'log' | 'fertilizer'>('plan');
  const [formData, setFormData] = useState({ crop: '', stage: 'Vegetative', moisture: 50 });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<IrrigationEvent[]>([]);
  const [newLog, setNewLog] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
  const [fertSchedule, setFertSchedule] = useState<FertilizerSchedule[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('irrigation_logs');
    if (saved) setLogs(JSON.parse(saved));
    if (location) getWeatherAndTip(location, language).then(setWeatherData);
    
    // Auto-detect stage if planting date exists in profile (simplified for now)
    const savedCrop = localStorage.getItem('last_selected_crop');
    if (savedCrop) setFormData(prev => ({ ...prev, crop: savedCrop }));
  }, [location, language]);

  const addLog = () => {
    if (!newLog.amount || !formData.crop) return;
    const item: IrrigationEvent = { 
      id: Date.now().toString(), 
      crop: formData.crop, 
      weatherCondition: weatherData?.condition || 'Unknown',
      ...newLog 
    };
    const updated = [item, ...logs];
    setLogs(updated);
    localStorage.setItem('irrigation_logs', JSON.stringify(updated));
    setNewLog({ ...newLog, amount: '' });
  };

  const handleGetAdvice = async () => {
    if (!formData.crop) return;
    setLoading(true);
    try {
        const advice = await getIrrigationAdvice(formData, location!, language);
        setResult(advice);
        localStorage.setItem('last_selected_crop', formData.crop);
    } catch (e) {
        console.error(e);
        setResult("Could not fetch advice at the moment.");
    } finally {
        setLoading(false);
    }
  };

  const fetchFertilizerPlan = async () => {
    if (!formData.crop) return;
    setLoading(true);
    try {
      const plan = await getFertilizerSchedule(formData.crop, formData.stage, { ph: '6.5' }, language);
      setFertSchedule(plan);
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 dark:bg-[#0E1F17] relative">
      <header className="mb-6 relative z-10 pt-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-emerald-50 flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg">
            <Droplets size={24} />
          </div>
          Water & Nutrients
        </h2>
        <div className="flex bg-white dark:bg-[#1C2B22] p-1.5 rounded-[1.75rem] mt-6 border border-slate-100 dark:border-white/5 shadow-sm">
          <button onClick={() => setActiveTab('plan')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'plan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>Water Plan</button>
          <button onClick={() => setActiveTab('fertilizer')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'fertilizer' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Nutrition</button>
          <button onClick={() => setActiveTab('log')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'log' ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400'}`}>Usage Log</button>
        </div>
      </header>

      {activeTab === 'plan' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-slate-50 dark:border-white/5 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Target Crop</label>
                <input type="text" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} placeholder="Focus Crop (e.g. Rice)" className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-blue-500" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-2"><TrendingUp size={14}/> Current Growth Stage</label>
                <div className="grid grid-cols-5 gap-2">
                  {GROWTH_STAGES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFormData({ ...formData, stage: s.id })}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${formData.stage === s.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'bg-slate-50 border-transparent dark:bg-[#0E1F17]'}`}
                    >
                      <span className="text-xl mb-1">{s.icon}</span>
                      <span className="text-[8px] font-black uppercase text-slate-400">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Soil Moisture</label>
                  <span className="text-xs font-black text-blue-600">{formData.moisture}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={formData.moisture} 
                  onChange={e => setFormData({...formData, moisture: Number(e.target.value)})} 
                  className="w-full h-2 bg-slate-100 dark:bg-blue-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <button onClick={handleGetAdvice} disabled={loading || !formData.crop} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Calculate Water Dosage"}
              </button>
           </div>
           {result && (
              <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] border border-blue-100 dark:border-white/5 shadow-soft animate-in slide-in-from-bottom-5">
                 <div className="prose prose-sm prose-blue dark:prose-invert max-w-none"><ReactMarkdown>{result}</ReactMarkdown></div>
              </div>
           )}
        </div>
      )}

      {activeTab === 'fertilizer' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-emerald-50 dark:border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                 <Beaker size={14}/> Regenerative Nutrition Plan
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-tight">Stage: {formData.stage} for {formData.crop || 'your crop'}</p>
              <button onClick={fetchFertilizerPlan} disabled={loading || !formData.crop} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                 {loading ? <Loader2 className="animate-spin"/> : <><Zap size={16}/> Schedule Applications</>}
              </button>
           </div>
           
           <div className="space-y-3">
              {fertSchedule.map((item, i) => (
                 <div key={i} className="bg-white dark:bg-[#1C2B22] p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl shrink-0"><Leaf size={20}/></div>
                    <div>
                       <h4 className="font-black text-slate-900 dark:text-emerald-50">{item.task}</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{item.material} • {item.dosage}</p>
                       <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-lg uppercase tracking-widest">{item.timing}</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-slate-50 dark:border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-4">Manual Usage Entry</h3>
              <div className="flex gap-2">
                 <input type="text" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} placeholder="Liters / Vol" className="flex-1 bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50" />
                 <button onClick={addLog} className="bg-slate-800 text-white px-6 rounded-2xl font-black"><Plus/></button>
              </div>
           </div>
           
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Usage History</h4>
              {logs.map(log => (
                 <div key={log.id} className="bg-white dark:bg-[#1C2B22] p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex justify-between items-center group shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><Droplet size={18}/></div>
                       <div>
                          <h5 className="font-black text-slate-800 dark:text-emerald-50">{log.amount} for {log.crop}</h5>
                          <div className="flex items-center gap-3">
                             <span className="text-[9px] font-bold text-slate-400 uppercase">{log.date}</span>
                             <span className="text-[9px] font-black text-blue-400 uppercase flex items-center gap-1"><CloudRain size={10}/> {log.weatherCondition}</span>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => {}} className="text-slate-200 group-hover:text-red-400 transition-colors p-2"><Trash2 size={16}/></button>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default IrrigationAdvisor;
