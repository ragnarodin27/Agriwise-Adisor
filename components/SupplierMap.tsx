
import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Leaf, X, Map as MapIcon, Bookmark, LocateFixed, ExternalLink, Sprout, Hammer, FlaskConical, Tractor, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SupplierMapProps {
  location: LocationData | null;
}

const CATEGORIES = [
  { id: 'seeds', label: 'Seeds', icon: Sprout },
  { id: 'fertilizer', label: 'Fertilizer', icon: FlaskConical },
  { id: 'tools', label: 'Tools', icon: Hammer },
  { id: 'machinery', label: 'Machinery', icon: Tractor }
];

const SupplierMap: React.FC<SupplierMapProps> = ({ location }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [favorites, setFavorites] = useState<Supplier[]>([]);
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'nearby' | 'favorites'>('nearby');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('supplierFavorites');
    if (saved) try { setFavorites(JSON.parse(saved)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current && location) {
      // @ts-ignore
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([location.latitude, location.longitude], 13);
      // @ts-ignore
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }
  }, [location]);

  useEffect(() => {
    if (!mapRef.current || !location) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const listToShow = viewMode === 'nearby' ? suppliers : favorites;

    listToShow.forEach(s => {
      // Small randomized offset for visualization if multiple items at same place
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;
      const lat = location.latitude + offsetLat;
      const lng = location.longitude + offsetLng;
      
      const popupContent = `
        <div class="p-2 min-w-[120px] font-sans">
          <p class="text-[10px] font-black text-indigo-600 uppercase mb-0.5">${s.type}</p>
          <h4 class="text-sm font-black text-slate-800 mb-1">${s.name}</h4>
          <p class="text-[9px] font-bold text-slate-400 mb-2">${s.distance_km ? s.distance_km + ' km away' : 'Nearby'}</p>
          <button class="w-full bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest py-1.5 rounded-lg view-details-btn">View Details</button>
        </div>
      `;

      // @ts-ignore
      const marker = L.marker([lat, lng])
        .addTo(mapRef.current)
        .bindPopup(popupContent, { closeButton: false, className: 'custom-map-popup' })
        .on('click', () => {
          // Leaflet handles showing popup. We also want details.
          // But to be specifically interactive as requested:
        });
      
      marker.on('popupopen', () => {
        const btn = document.querySelector('.view-details-btn');
        btn?.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedSupplier(s);
        });
      });
      
      markersRef.current.push(marker);
    });
  }, [suppliers, favorites, viewMode, location]);

  const toggleFavorite = (e: React.MouseEvent, s: Supplier) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.name === s.name);
    let newFavs = isFav ? favorites.filter(f => f.name !== s.name) : [...favorites, s];
    setFavorites(newFavs);
    localStorage.setItem('supplierFavorites', JSON.stringify(newFavs));
  };

  const handleSearch = async (categoryOverride?: string | null) => {
    if (!location) return;
    setLoading(true);
    setViewMode('nearby');
    try {
      const cat = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const baseQuery = query || "Agricultural suppliers";
      const categoryQuery = cat ? `${cat} ` : '';
      const searchQuery = isOrganicOnly 
        ? `Certified organic agricultural ${categoryQuery}suppliers ${query ? 'for ' + query : ''}` 
        : `${categoryQuery}${baseQuery}`;
        
      const data = await findSuppliers(searchQuery, location, 'en');
      setSuppliers(data.suppliers);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const toggleCategory = (catId: string) => {
    const newCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCat);
    handleSearch(newCat);
  };

  const displayedList = viewMode === 'nearby' ? suppliers : favorites;

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 dark:bg-[#0E1F17] relative overflow-hidden">
       <header className="mb-4 flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
                    <MapPin size={24} strokeWidth={2.5} />
                  </div>
                  {t('nav.find')}
              </h2>
            </div>
            <div className="flex bg-white dark:bg-[#1C2B22] p-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
               <button onClick={() => setViewMode('nearby')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === 'nearby' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-400'}`}>Nearby</button>
               <button onClick={() => setViewMode('favorites')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === 'favorites' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'text-slate-400'}`}>Saved</button>
            </div>
      </header>

      <div className="mb-4 space-y-3 relative z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white dark:bg-[#1C2B22] border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-11 pr-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm placeholder:text-slate-400" placeholder="Find seeds, tools, feed..." />
          </div>
          <button onClick={() => handleSearch()} disabled={loading} className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Navigation size={22} />}
          </button>
        </div>

        {/* Categories and Organic Toggle */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          <button 
            onClick={() => {
              const newOrganic = !isOrganicOnly;
              setIsOrganicOnly(newOrganic);
              // Trigger search immediately on organic toggle for better UX
              setTimeout(() => handleSearch(), 0);
            }} 
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 ${
              isOrganicOnly 
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' 
                : 'bg-white dark:bg-[#1C2B22] text-emerald-600 border-emerald-100 dark:border-emerald-900/20'
            }`}
          >
            <ShieldCheck size={16} fill={isOrganicOnly ? "white" : "none"} />
            Certified Organic
          </button>

          <div className="w-[1px] h-10 bg-slate-200 dark:bg-white/10 shrink-0 mx-1"></div>

          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white dark:bg-[#1C2B22] text-slate-500 border-slate-200 dark:border-white/5'
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 h-64 w-full relative group z-10">
        <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700" />
        <button className="absolute bottom-4 right-4 z-[400] bg-white dark:bg-[#1C2B22] text-slate-700 dark:text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all" onClick={() => { if(location && mapRef.current) mapRef.current.setView([location.latitude, location.longitude], 13); }}>
            <LocateFixed size={20} />
        </button>
      </div>
      
      <div className="space-y-4 relative z-10">
        {displayedList.length > 0 ? displayedList.map((s, idx) => (
          <div key={idx} onClick={() => setSelectedSupplier(s)} className="bg-white dark:bg-[#1C2B22] rounded-[2rem] p-5 shadow-soft border border-slate-100 dark:border-white/5 transition-all hover:shadow-lg hover:border-indigo-200 cursor-pointer group">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{s.type}</span>
                {s.description.toLowerCase().includes('organic') && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                    <Leaf size={8} /> Organic
                  </span>
                )}
              </div>
              <button onClick={(e) => toggleFavorite(e, s)} className={`p-2 rounded-lg transition-all active:scale-95 ${favorites.some(f => f.name === s.name) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-400'}`}>
                <Heart size={18} fill={favorites.some(f => f.name === s.name) ? "currentColor" : "none"} />
              </button>
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600">{s.name}</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{s.description}</p>
          </div>
        )) : ( <div className="text-center py-10 opacity-50"><p className="text-xs font-black uppercase tracking-widest text-slate-400">No results found.</p></div> )}
      </div>

      {selectedSupplier && (
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-4 pb-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedSupplier(null)}></div>
          <div className="bg-white dark:bg-[#1C2B22] w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
             <button onClick={() => setSelectedSupplier(null)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedSupplier.name}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{selectedSupplier.description}</p>
             <div className="grid grid-cols-2 gap-3">
               <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedSupplier.address || selectedSupplier.name)}`} target="_blank" rel="noopener noreferrer" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl">
                 <Navigation size={16} /> Navigate
               </a>
               {selectedSupplier.url && <a href={selectedSupplier.url} target="_blank" rel="noopener noreferrer" className="border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><ExternalLink size={16} /> Website</a>}
             </div>
          </div>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-map-popup .leaflet-popup-content-wrapper { border-radius: 16px; padding: 0; overflow: hidden; }
        .custom-map-popup .leaflet-popup-content { margin: 0; }
        .custom-map-popup .leaflet-popup-tip-container { display: none; }
      `}</style>
    </div>
  );
};

export default SupplierMap;
