
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getIrrigationAdvice, getFertilizerSchedule, FertilizerSchedule, getWeatherAndTip } from '../services/geminiService';
import { 
  Droplets, Loader2, Plus, Trash2, Calendar, Droplet, Clock, Zap, History, Leaf, Beaker, CheckCircle2, CloudRain
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

// Added missing interface definition
interface IrrigationAdvisorProps {
  location: LocationData | null;
}

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

  const fetchFertilizerPlan = async () => {
    if (!formData.crop) return;
    setLoading(true);
    try {
      const plan = await getFertilizerSchedule(formData.crop, formData.stage, { ph: '6.5' }, language);
      setFertSchedule(plan);
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-blue-50/50 dark:bg-[#0E1F17] relative">
      <header className="mb-6 relative z-10">
        <h2 className="text-2xl font-black text-blue-900 dark:text-emerald-50 flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg">
            <Droplets size={24} />
          </div>
          Water & Nutrients
        </h2>
        <div className="flex bg-white dark:bg-[#1C2B22] p-1 rounded-xl mt-6 border border-blue-100 dark:border-white/5 shadow-sm max-w-full overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('plan')} className={`flex-1 py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'plan' ? 'bg-blue-600 text-white' : 'text-blue-400'}`}>Water Plan</button>
          <button onClick={() => setActiveTab('fertilizer')} className={`flex-1 py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'fertilizer' ? 'bg-emerald-600 text-white' : 'text-emerald-400'}`}>Nutrition</button>
          <button onClick={() => setActiveTab('log')} className={`flex-1 py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'log' ? 'bg-blue-600 text-white' : 'text-blue-400'}`}>Usage Log</button>
        </div>
      </header>

      {activeTab === 'plan' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-blue-50 dark:border-white/5 space-y-6">
              <input type="text" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} placeholder="Focus Crop (e.g. Rice)" className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold dark:text-emerald-50 outline-none border-2 border-transparent focus:border-blue-200" />
              <div className="grid grid-cols-2 gap-4">
                 <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-xs dark:text-emerald-50">
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                 </select>
                 <input type="number" value={formData.moisture} onChange={e => setFormData({...formData, moisture: Number(e.target.value)})} className="bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold dark:text-emerald-50" />
              </div>
              <button onClick={() => getIrrigationAdvice(formData, location!, language).then(setResult)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Calculate Usage</button>
           </div>
           {result && (
              <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] border border-blue-100 dark:border-white/5">
                 <div className="prose prose-sm prose-blue dark:prose-invert"><ReactMarkdown>{result}</ReactMarkdown></div>
              </div>
           )}
        </div>
      )}

      {activeTab === 'fertilizer' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-emerald-50 dark:border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                 <Beaker size={14}/> Regenerative Nutrition Plan
              </h3>
              <p className="text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-tight">Customized for {formData.crop || 'your crop'}</p>
              <button onClick={fetchFertilizerPlan} disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                 {loading ? <Loader2 className="animate-spin"/> : <><Zap size={16}/> Schedule Applications</>}
              </button>
           </div>
           
           <div className="space-y-3">
              {fertSchedule.map((item, i) => (
                 <div key={i} className="bg-white dark:bg-[#1C2B22] p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl shrink-0"><Leaf size={20}/></div>
                    <div>
                       <h4 className="font-black text-slate-900 dark:text-emerald-50">{item.task}</h4>
                       <p className="text-xs text-slate-500 mb-2">{item.material} • {item.dosage}</p>
                       <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-lg uppercase tracking-widest">{item.timing}</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[2.5rem] shadow-soft border border-blue-50 dark:border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Manual Usage Entry</h3>
              <div className="flex gap-2">
                 <input type="text" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} placeholder="Liters / Vol" className="flex-1 bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold dark:text-emerald-50" />
                 <button onClick={addLog} className="bg-blue-600 text-white px-6 rounded-2xl font-black"><Plus/></button>
              </div>
           </div>
           
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Usage History vs Weather</h4>
              {logs.map(log => (
                 <div key={log.id} className="bg-white dark:bg-[#1C2B22] p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex justify-between items-center group">
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
                    <button onClick={() => {}} className="text-slate-200 group-hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default IrrigationAdvisor;