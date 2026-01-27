
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { 
  Camera, User, Save, ChevronLeft, Map, 
  Settings, Bell, Moon, Sun,
  Trash2, FlaskConical, History, ShieldCheck, Database
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../translations';

interface ExtendedProfile extends UserProfile {
  landSize?: string;
  landUnit?: 'Acres' | 'Hectares' | 'Bigha';
  soilType?: string;
  cropHistory?: string[];
  cropsGrown?: string[];
  notifications: {
    weather: boolean;
    market: boolean;
    pests: boolean;
  };
}

interface ProfileEditorProps {
  currentProfile: UserProfile | null;
  onSave: (profile: any) => void;
  onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ onSave, onCancel }) => {
  const { language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState<ExtendedProfile>(() => {
    const saved = localStorage.getItem('agri_user_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: '',
      mobile: '',
      email: '',
      avatar: '',
      landSize: '',
      landUnit: 'Acres',
      soilType: 'Loam',
      cropHistory: [],
      cropsGrown: [],
      notifications: { weather: true, market: true, pests: true }
    };
  });

  const [newCrop, setNewCrop] = useState('');
  const [lastSync] = useState(new Date().toLocaleString());
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const addCrop = () => {
    if (newCrop.trim() && !formData.cropsGrown?.includes(newCrop.trim())) {
      setFormData(prev => ({ ...prev, cropsGrown: [...(prev.cropsGrown || []), newCrop.trim()] }));
      setNewCrop('');
    }
  };

  const removeCrop = (crop: string) => {
    setFormData(prev => ({ ...prev, cropsGrown: prev.cropsGrown?.filter(c => c !== crop) }));
  };

  const handleSave = () => {
    onSave(formData);
    localStorage.setItem('agri_user_profile', JSON.stringify(formData));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1F17] pb-32 transition-colors duration-500 font-sans">
      <header className="pt-safe-top px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#0E1F17]/80 backdrop-blur-md z-30 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 bg-white dark:bg-[#1C2B22] rounded-2xl shadow-sm text-slate-800 dark:text-emerald-50 active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-emerald-50">Farm Profile</h2>
            <p className="text-[9px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest">Command Center</p>
          </div>
        </div>
        <button onClick={handleSave} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
          <Save size={24} />
        </button>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {/* Offline Status & Cache Intelligence */}
        <div className="bg-emerald-50 dark:bg-[#1C2B22] p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-800/30 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Database size={20}/>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Edge Cache Status</p>
                 <p className="text-xs font-bold text-emerald-800 dark:text-emerald-50/70">Synced: {lastSync}</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Online</span>
              <span className="bg-emerald-500 w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
           </div>
        </div>

        {/* Farmer Information */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <User size={120} />
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div onClick={() => fileInputRef.current?.click()} className="relative w-32 h-32 rounded-full border-4 border-white dark:border-[#0E1F17] shadow-xl overflow-hidden group cursor-pointer transition-transform hover:scale-105">
              {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-[#0E1F17] text-slate-400"><User size={48} /></div>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={28} /></div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="grid grid-cols-1 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest pl-2">Farmer Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest pl-2">Mobile Number</label>
              <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" />
            </div>
          </div>
        </section>

        {/* Farm Infrastructure */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-500 flex items-center gap-2 px-2"><Map size={14}/> Land & Soil</h3>
          
          <div className="flex gap-4">
             <div className="flex-[2] space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">Land Size</label>
                <input type="number" value={formData.landSize} onChange={e => setFormData({...formData, landSize: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50" placeholder="e.g. 10" />
             </div>
             <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">Unit</label>
                <select value={formData.landUnit} onChange={e => setFormData({...formData, landUnit: e.target.value as any})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 text-xs outline-none">
                   <option value="Acres">Acres</option>
                   <option value="Hectares">Hectares</option>
                   <option value="Bigha">Bigha</option>
                </select>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-1"><FlaskConical size={10}/> Soil Type</label>
             <select value={formData.soilType} onChange={e => setFormData({...formData, soilType: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 text-xs outline-none">
                <option value="Loam">Balanced Loam</option>
                <option value="Sandy">Sandy (Quick Drain)</option>
                <option value="Clay">Rich Clay</option>
                <option value="Silt">Fine Silt</option>
             </select>
          </div>

          <div className="space-y-4 pt-2">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-1"><History size={10}/> Active Crops</label>
             <div className="flex flex-wrap gap-2">
                {formData.cropsGrown?.map(crop => (
                  <span key={crop} className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-2 border border-emerald-100 dark:border-emerald-800">
                    {crop} <button onClick={() => removeCrop(crop)} className="hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                  </span>
                ))}
                <div className="flex-1 min-w-[140px] relative">
                   <input 
                     type="text" 
                     value={newCrop} 
                     onChange={e => setNewCrop(e.target.value)} 
                     onKeyDown={e => e.key === 'Enter' && addCrop()} 
                     placeholder="Add Crop..." 
                     className="w-full bg-slate-50 dark:bg-[#0E1F17] p-3 rounded-xl font-bold text-xs dark:text-emerald-50 outline-none border border-transparent focus:border-emerald-500 transition-all" 
                   />
                   <button onClick={addCrop} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 bg-white dark:bg-[#1C2B22] p-1 rounded-lg shadow-sm">
                    <PlusCircleIcon size={18}/>
                   </button>
                </div>
             </div>
          </div>
        </section>

        {/* Global Settings & Interface */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-8">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-500 flex items-center gap-2 px-2"><Settings size={14}/> Preferences</h3>

           <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-slate-50 dark:bg-[#0E1F17] rounded-xl text-slate-600 dark:text-emerald-400 border border-slate-100 dark:border-white/5">{isDarkMode ? <Moon size={20}/> : <Sun size={20}/>}</div>
                 <span className="font-black text-sm text-slate-800 dark:text-emerald-50">Dark Mode</span>
              </div>
              <button onClick={toggleTheme} className={`w-14 h-8 rounded-full transition-all relative ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                 <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
              </button>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">System Language</label>
              <div className="grid grid-cols-2 gap-2">
                 {LANGUAGES.slice(0, 4).map(l => (
                    <button 
                      key={l.code} 
                      onClick={() => setLanguage(l.code)}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${language === l.code ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-[#0E1F17] border-transparent text-slate-400'}`}
                    >
                      <span className="font-bold text-xs">{l.name}</span>
                      <span className="text-lg">{l.flag}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-white/5">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 flex items-center gap-2"><Bell size={12}/> Smart Alerts</h4>
              <div className="space-y-3">
                 {Object.entries(formData.notifications).map(([key, val]) => (
                   <div key={key} className="flex items-center justify-between bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-emerald-50/70 capitalize">{key} Updates</span>
                      </div>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: !val } }))}
                        className={`w-10 h-6 rounded-full transition-all relative ${val ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${val ? 'right-1' : 'left-1'}`}></div>
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        <div className="bg-emerald-900/10 dark:bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10 flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-[#1C2B22] rounded-2xl text-emerald-600 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Data Privacy</p>
            <p className="text-[10px] text-emerald-700/60 dark:text-emerald-500/40 leading-relaxed font-medium">Your farm profile is stored locally and encrypted on this device. We do not sell your personal agricultural data.</p>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-300 dark:text-emerald-900/30 uppercase tracking-[0.2em] pt-4">AgriWise Intelligence v2.8.5 • Local Model Active</p>
      </div>
    </div>
  );
};

const PlusCircleIcon = ({size}: {size:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
);

export default ProfileEditor;
