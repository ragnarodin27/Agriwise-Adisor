
import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Leaf, Clock, Phone, X, Map as MapIcon, Bookmark, LocateFixed, ExternalLink, Filter } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SupplierMapProps {
  location: LocationData | null;
}

const SupplierMap: React.FC<SupplierMapProps> = ({ location }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
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

      // @ts-ignore
      L.circle([location.latitude, location.longitude], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: 800
      }).addTo(mapRef.current);
    }
  }, [location, viewMode]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const listToShow = viewMode === 'nearby' ? suppliers : favorites;

    listToShow.forEach(s => {
      const offsetLat = (Math.random() - 0.5) * 0.05;
      const offsetLng = (Math.random() - 0.5) * 0.05;
      const lat = location ? location.latitude + offsetLat : 0;
      const lng = location ? location.longitude + offsetLng : 0;
      
      // @ts-ignore
      const marker = L.marker([lat, lng])
        .addTo(mapRef.current)
        .on('click', () => setSelectedSupplier(s));
      
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

  const handleSearch = async () => {
    if (!location) return;
    setLoading(true);
    setViewMode('nearby');
    try {
      const searchQuery = isOrganicOnly 
        ? `Certified organic agricultural suppliers ${query ? 'for ' + query : ''}` 
        : query || "Agricultural suppliers";
        
      const data = await findSuppliers(searchQuery, location, 'en');
      setSuppliers(data.suppliers);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const displayedList = viewMode === 'nearby' ? suppliers : favorites;

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      
       {/* Background Illustrations */}
       <div className="fixed inset-0 pointer-events-none z-0">
           <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/World%20Map.png" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-auto opacity-[0.03] grayscale-[50%]" alt=""/>
           <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Tractor.png" className="absolute bottom-24 -right-10 w-48 h-48 opacity-[0.03] grayscale-[50%]" alt=""/>
       </div>

       <header className="mb-4 flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    <MapPin size={24} strokeWidth={2.5} />
                  </div>
                  {t('nav.find')}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">Network Locator</p>
            </div>
            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
               <button 
                 onClick={() => setViewMode('nearby')}
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === 'nearby' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600' : 'text-slate-400'}`}
               >
                 Nearby
               </button>
               <button 
                 onClick={() => setViewMode('favorites')}
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === 'favorites' ? 'bg-red-50 dark:bg-slate-700 text-red-600' : 'text-slate-400'}`}
               >
                 Saved
               </button>
            </div>
      </header>

      {viewMode === 'nearby' && (
        <div className="mb-4 space-y-3 relative z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm placeholder:text-slate-400" 
                placeholder="Find seeds, tools, feed..." 
              />
            </div>
            <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <Navigation size={22} />}
            </button>
          </div>
          
          <button 
            onClick={() => setIsOrganicOnly(!isOrganicOnly)}
            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 w-full justify-center ${
            isOrganicOnly 
                ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-200' 
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-green-300'
            }`}
          >
            <Leaf size={14} fill={isOrganicOnly ? "currentColor" : "none"} /> 
            {isOrganicOnly ? 'Certified Organic Filter Active' : 'Filter: Certified Organic Only'}
          </button>
        </div>
      )}

      {/* Map */}
      <div className="mb-6 h-64 w-full relative group z-10">
        <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700" />
        <button 
            className="absolute bottom-4 right-4 z-[400] bg-white dark:bg-slate-900 text-slate-700 dark:text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"
            onClick={() => { if(location && mapRef.current) mapRef.current.setView([location.latitude, location.longitude], 13); }}
        >
            <LocateFixed size={20} />
        </button>
      </div>
      
      {/* List */}
      <div className="space-y-4 relative z-10">
        {displayedList.length > 0 ? displayedList.map((s, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedSupplier(s)} 
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:border-indigo-200 cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl text-indigo-600">
                 <MapIcon size={20} />
              </div>
              <div className="flex items-center gap-2">
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1">
                   {s.distance_km} km
                 </span>
                 <button 
                   onClick={(e) => toggleFavorite(e, s)} 
                   className={`p-2 rounded-lg transition-all active:scale-95 ${favorites.some(f => f.name === s.name) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-400'}`}
                 >
                   <Heart size={18} fill={favorites.some(f => f.name === s.name) ? "currentColor" : "none"} />
                 </button>
              </div>
            </div>
            
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{s.name}</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{s.description}</p>
            
            <div className="flex items-center gap-3 border-t border-slate-50 dark:border-slate-800 pt-3">
               {s.type && <span className="text-[10px] font-bold text-slate-400 uppercase">{s.type}</span>}
               {s.hours && <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 ml-auto"><Clock size={10} /> Open</span>}
            </div>
          </div>
        )) : (
           <div className="text-center py-10 opacity-50">
              {viewMode === 'favorites' ? (
                <>
                  <Bookmark size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">No favorites saved.</p>
                </>
              ) : (
                <>
                  <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">No results nearby.</p>
                </>
              )}
           </div>
        )}
      </div>

      {selectedSupplier && (
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center pointer-events-none p-4 pb-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedSupplier(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl relative pointer-events-auto animate-in slide-in-from-bottom-10 duration-300">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 opacity-50"></div>
             
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedSupplier.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase px-2 py-1 rounded-md">{selectedSupplier.type}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedSupplier(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
             </div>

             <div className="space-y-4 mb-8">
               <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  {selectedSupplier.address && (
                    <div className="flex gap-3 items-start">
                       <MapPin size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                       <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedSupplier.address}</p>
                    </div>
                  )}
                  {selectedSupplier.phone_number && (
                    <div className="flex gap-3 items-center">
                       <Phone size={18} className="text-indigo-500 shrink-0" />
                       <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedSupplier.phone_number}</p>
                    </div>
                  )}
               </div>

               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{selectedSupplier.description}</p>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedSupplier.address || selectedSupplier.name)}`, '_blank')}
                 className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
               >
                 <Navigation size={16} /> Navigate
               </button>
               {selectedSupplier.url ? (
                  <a href={selectedSupplier.url} target="_blank" rel="noopener noreferrer" className="border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                    <ExternalLink size={16} /> Website
                  </a>
               ) : (
                  <button disabled className="border-2 border-slate-100 dark:border-slate-800 text-slate-300 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                    <ExternalLink size={16} /> No Site
                  </button>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierMap;
