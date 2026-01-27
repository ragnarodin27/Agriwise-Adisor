import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AppView, LocationData } from '../types';
import { 
  Camera, User, Save, ChevronLeft, Map, 
  Settings, Bell, Moon, Sun, RefreshCw, 
  Trash2, Sprout, Hash, CheckCircle2, FlaskConical, History, ShieldCheck, Database, Mail, MapPin, LocateFixed, Sparkles, Loader2, Plus, Signal, SignalHigh, SignalLow
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { getCropSuggestions } from '../services/geminiService';
import LanguageSelector from './LanguageSelector';

interface ExtendedProfile extends UserProfile {
  landSize?: string;
  landUnit?: 'Acres' | 'Hectares' | 'Bigha';
  soilType?: string;
  cropHistory?: string[];
  cropsGrown?: string[];
  location?: LocationData;
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
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ currentProfile, onSave, onCancel, isDarkMode, toggleTheme }) => {
  const { t, language, setLanguage } = useLanguage();
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
      location: { latitude: 0, longitude: 0 },
      notifications: { weather: true, market: true, pests: true }
    };
  });

  const [newCrop, setNewCrop] = useState('');
  const [lastSync] = useState(new Date().toLocaleString());
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedCrops, setSuggestedCrops] = useState<string[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const lat = formData.location?.latitude || 20.5937;
      const lng = formData.location?.longitude || 78.9629;
      
      // @ts-ignore
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([lat, lng], 5);
      // @ts-ignore
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

      if (formData.location?.latitude) {
        // @ts-ignore
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        mapRef.current.setView([lat, lng], 13);
        
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          setFormData(prev => ({ ...prev, location: { latitude: pos.lat, longitude: pos.lng } }));
        });
      }

      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          // @ts-ignore
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        }
        setFormData(prev => ({ ...prev, location: { latitude: lat, longitude: lng } }));
      });
    }
  }, []);

  const locateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(accuracy);
        setIsLocating(false);
        setFormData(prev => ({ ...prev, location: { latitude, longitude } }));
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            // @ts-ignore
            markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
          }
        }
      }, (err) => {
        setIsLocating(false);
      }, { enableHighAccuracy: true });
    }
  };

  const handleFetchSuggestions = async () => {
    if (!formData.location?.latitude) return;
    setSuggesting(true);
    try {
      const list = await getCropSuggestions(formData.location, formData.soilType || 'Loam', language);
      setSuggestedCrops(list);
    } catch (e) {} finally { setSuggesting(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const addCrop = (cropName?: string) => {
    const val = (cropName || newCrop).trim();
    if (val && !formData.cropsGrown?.includes(val)) {
      setFormData(prev => ({ ...prev, cropsGrown: [...(prev.cropsGrown || []), val] }));
      setNewCrop('');
      setSuggestedCrops(prev => prev.filter(c => c !== val));
    }
  };

  const removeCrop = (crop: string) => {
    setFormData(prev => ({ ...prev, cropsGrown: prev.cropsGrown?.filter(c => c !== crop) }));
  };

  const handleSave = () => {
    onSave(formData);
    localStorage.setItem('agri_user_profile', JSON.stringify(formData));
    localStorage.setItem('manual_location', JSON.stringify(formData.location));
  };

  const getSignalIcon = () => {
    if (isLocating) return <Loader2 className="animate-spin text-indigo-500" size={14} />;
    if (gpsAccuracy === null) return null;
    if (gpsAccuracy < 20) return <SignalHigh className="text-emerald-500" size={14} />;
    if (gpsAccuracy < 100) return <Signal className="text-amber-500" size={14} />;
    return <SignalLow className="text-rose-500" size={14} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1F17] pb-32 transition-colors duration-500 font-sans">
      <header className="pt-safe-top px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#0E1F17]/80 backdrop-blur-md z-30 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 bg-white dark:bg-[#1C2B22] rounded-2xl shadow-sm text-slate-800 dark:text-emerald-50 active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-emerald-50">{t('profile.title')}</h2>
            <p className="text-[9px] font-black text-slate-400 dark:text-emerald-500 uppercase tracking-widest">Farm Management Center</p>
          </div>
        </div>
        <button onClick={handleSave} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
          <Save size={24} />
        </button>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {/* Farm Pinpoint Map */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-500 flex items-center gap-2"><MapPin size={14}/> Farm Location</h3>
              <div className="flex items-center gap-3">
                 {getSignalIcon()}
                 <button onClick={locateMe} disabled={isLocating} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl active:scale-95 transition-all">
                    <LocateFixed size={14}/> {isLocating ? 'Locating...' : 'Get GPS'}
                 </button>
              </div>
           </div>
           <div className="h-64 w-full rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 relative shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
           </div>
           {formData.location?.latitude !== 0 && (
             <div className="text-center space-y-1">
               <p className="text-[10px] font-bold text-slate-400">
                 Coordinates: {formData.location?.latitude.toFixed(5)}, {formData.location?.longitude.toFixed(5)}
               </p>
               {gpsAccuracy && (
                 <p className={`text-[9px] font-black uppercase tracking-widest ${gpsAccuracy < 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
                   Accuracy: within {gpsAccuracy.toFixed(1)} meters
                 </p>
               )}
             </div>
           )}
        </section>

        {/* Farmer Information */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-8">
          <div className="flex flex-col items-center">
            <div onClick={() => fileInputRef.current?.click()} className="relative w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-[#0E1F17] shadow-xl overflow-hidden group cursor-pointer transition-transform hover:scale-105 bg-slate-100 dark:bg-black/20">
              {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={48} /></div>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={28} /></div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest pl-2">{t('profile.name')}</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest pl-2">{t('profile.mobile')}</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 pl-12 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-emerald-500 tracking-widest pl-2">{t('profile.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 pl-12 rounded-2xl font-bold text-slate-800 dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Crops Management */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-500 flex items-center gap-2"><Sprout size={14}/> {t('profile.active_crops')}</h3>
            <button 
              onClick={handleFetchSuggestions} 
              disabled={suggesting || !formData.location?.latitude} 
              className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-30"
            >
              {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12}/>}
              AI Suggestions
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.cropsGrown?.map(crop => (
              <span key={crop} className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wide flex items-center gap-3 border border-emerald-100 dark:border-emerald-800/30">
                {crop} <button onClick={() => removeCrop(crop)} className="hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
              </span>
            ))}
          </div>

          {suggestedCrops.length > 0 && (
             <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[2.5rem] space-y-3 animate-in fade-in zoom-in-95">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Recommended for your area:</p>
                <div className="flex flex-wrap gap-2">
                   {suggestedCrops.map(crop => (
                      <button key={crop} onClick={() => addCrop(crop)} className="bg-white dark:bg-[#1C2B22] px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 dark:text-emerald-500 border border-slate-100 dark:border-white/5 flex items-center gap-2 active:scale-95">
                         <Plus size={12}/> {crop}
                      </button>
                   ))}
                </div>
             </div>
          )}

          <div className="flex gap-2 relative">
             <input 
               type="text" 
               value={newCrop} 
               onChange={e => setNewCrop(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && addCrop()} 
               placeholder="Custom crop name..." 
               className="w-full bg-slate-50 dark:bg-[#0E1F17] p-4 rounded-2xl font-bold text-sm dark:text-emerald-50 outline-none border-2 border-transparent focus:border-emerald-500 transition-all" 
             />
             <button onClick={() => addCrop()} className="bg-emerald-600 text-white px-5 rounded-2xl shadow-lg active:scale-95">
                <Plus size={20}/>
             </button>
          </div>
        </section>

        {/* System Preferences */}
        <section className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3.5rem] shadow-sm border border-slate-50 dark:border-white/5 space-y-6">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-500 flex items-center gap-2 px-2"><Settings size={14}/> Interface Preferences</h3>

           <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-slate-50 dark:bg-[#0E1F17] rounded-xl text-slate-600 dark:text-emerald-400 border border-slate-100 dark:border-white/5">{isDarkMode ? <Moon size={20}/> : <Sun size={20}/>}</div>
                 <span className="font-black text-sm text-slate-800 dark:text-emerald-50">{t('profile.dark_mode')}</span>
              </div>
              <button onClick={toggleTheme} className={`w-14 h-8 rounded-full transition-all relative ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                 <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
              </button>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('profile.language')}</label>
              <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
           </div>
        </section>

        <div className="bg-emerald-900/10 dark:bg-emerald-500/5 p-6 rounded-[2.5rem] border border-emerald-500/10 flex items-center gap-5">
          <div className="p-4 bg-white dark:bg-[#1C2B22] rounded-3xl text-emerald-600 shadow-soft">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">{t('profile.privacy')}</p>
            <p className="text-[10px] text-emerald-700/60 dark:text-emerald-500/40 leading-relaxed font-bold italic">{t('profile.privacy_desc')}</p>
          </div>
        </div>

        <p className="text-center text-[10px] font-black text-slate-300 dark:text-emerald-900/30 uppercase tracking-[0.3em] pt-8">AgriWise Intelligence Node v3.0.1 • Precision Secured</p>
      </div>
    </div>
  );
};

export default ProfileEditor;