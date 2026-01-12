
import React, { useState, useEffect } from 'react';
import { LocationData, GroundingChunk } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Filter, Phone, Clock, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SupplierMapProps {
  location: LocationData | null;
}

const SupplierMap: React.FC<SupplierMapProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Filters & Favorites State
  const [favorites, setFavorites] = useState<Supplier[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [filterService, setFilterService] = useState(''); // Text input for service
  const [filterDistance, setFilterDistance] = useState(100); // Default 100km for wider search
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load Favorites
  useEffect(() => {
    const saved = localStorage.getItem('supplierFavorites');
    if (saved) {
        try {
            setFavorites(JSON.parse(saved));
        } catch (e) { console.error(e); }
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, s: Supplier) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.name === s.name);
    let newFavs;
    if (isFav) {
        newFavs = favorites.filter(f => f.name !== s.name);
    } else {
        newFavs = [...favorites, s];
    }
    setFavorites(newFavs);
    localStorage.setItem('supplierFavorites', JSON.stringify(newFavs));
  };

  const isFavorite = (s: Supplier) => favorites.some(f => f.name === s.name);

  const getDirections = (s: Supplier) => {
    const destination = s.address ? s.address : `${s.name} ${s.type}`;
    const params = new URLSearchParams();
    params.append('api', '1');
    params.append('destination', destination);
    if (location) {
        params.append('origin', `${location.latitude},${location.longitude}`);
    }
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, '_blank');
  };

  const handleSearch = async () => {
    if (!query.trim() || !location) return;
    setLoading(true);
    setSuppliers([]);
    setSources([]);
    setSelectedSupplier(null);
    setShowFavoritesOnly(false); 
    try {
      const data = await findSuppliers(query, location, language);
      setSuppliers(data.suppliers);
      setSources(data.sources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDirectionAngle = (dir: string) => {
      const map: Record<string, number> = {
          'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
          'S': 180, 'SW': 225, 'W': 270, 'NW': 315
      };
      return (map[dir.toUpperCase()] ?? 0);
  };

  // Filter Logic
  const sourceList = showFavoritesOnly ? favorites : suppliers;
  const displayedSuppliers = sourceList.filter(s => {
      if (showFavoritesOnly) return true; 
      
      const matchesType = filterType === 'All' || 
                         s.type?.toLowerCase().includes(filterType.toLowerCase()) || 
                         s.name.toLowerCase().includes(filterType.toLowerCase());
      
      const matchesService = !filterService || 
                             s.description.toLowerCase().includes(filterService.toLowerCase()) || 
                             s.type?.toLowerCase().includes(filterService.toLowerCase());

      const matchesDist = s.distance_km <= filterDistance;
      
      return matchesType && matchesDist && matchesService;
  });

  const renderRadarMap = () => {
      const listToMap = displayedSuppliers;
      if (!listToMap.length) return null;
      
      const maxDist = Math.max(...listToMap.map(s => s.distance_km), 10);
      const radius = 120;
      const center = 150;

      return (
          <div className="relative w-full h-[300px] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center mb-6 border border-slate-700">
              <svg width="300" height="300" className="opacity-80">
                  <circle cx="150" cy="150" r="40" stroke="#334155" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
                  <circle cx="150" cy="150" r="80" stroke="#334155" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
                  <circle cx="150" cy="150" r="120" stroke="#334155" strokeWidth="1" fill="none" />
                  <line x1="150" y1="30" x2="150" y2="270" stroke="#334155" strokeWidth="1" />
                  <line x1="30" y1="150" x2="270" y2="150" stroke="#334155" strokeWidth="1" />
                  <circle cx="150" cy="150" r="5" fill="#3B82F6" className="animate-pulse" />
                  {listToMap.map((s, i) => {
                      const deg = getDirectionAngle(s.direction || 'N');
                      const rad = (deg - 90) * (Math.PI / 180); 
                      const distRatio = Math.min(s.distance_km / maxDist, 1);
                      const r = distRatio * radius;
                      const x = center + r * Math.cos(rad);
                      const y = center + r * Math.sin(rad);
                      const isSel = selectedSupplier?.name === s.name;

                      return (
                          <g key={i} onClick={() => setSelectedSupplier(s)} className="cursor-pointer hover:opacity-100 transition-opacity">
                              <circle 
                                cx={x} cy={y} 
                                r={isSel ? "8" : "6"} 
                                fill={isSel ? "#F97316" : "#22C55E"} 
                                stroke="white" 
                                strokeWidth="2" 
                                className="transition-all"
                              />
                              {isSel && (
                                <circle cx={x} cy={y} r="12" stroke="#F97316" strokeWidth="1" fill="none" className="animate-ping" />
                              )}
                          </g>
                      );
                  })}
              </svg>
              <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 backdrop-blur-sm">
                  <span className="block mb-1 font-bold text-slate-200">Radar View (Max {Math.round(maxDist)}km)</span>
                  <span className="block text-blue-400">● Your Farm</span>
                  <span className="block text-emerald-500">● Live Search Result</span>
              </div>
          </div>
      );
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
       <header className="mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-xl">
                    <MapPin size={24} className="text-orange-700" />
                </div>
                {t('nav.find')}
            </h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">Verified by Google Search</p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-200 flex gap-2 ring-4 ring-slate-100 focus-within:ring-orange-100 transition-all">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 outline-none text-slate-700 text-sm font-medium"
            placeholder="Search e.g. 'Seed shop' or 'Tractor repair'..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            disabled={loading || !location}
            className="bg-orange-600 text-white p-3 rounded-2xl hover:bg-orange-700 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center shadow-lg shadow-orange-200"
          >
            {loading ? <Loader2 className="animate-spin" size={24}/> : <Search size={24} />}
          </button>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Filter size={14}/> Refining Search
              </h3>
              <button 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`text-xs px-4 py-1.5 rounded-full border-2 transition-all font-bold flex items-center gap-2 ${showFavoritesOnly ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}
              >
                 <Heart size={14} fill={showFavoritesOnly ? "currentColor" : "none"}/> Favorites
              </button>
           </div>
           
           {!showFavoritesOnly && (
               <div className="space-y-4">
                  <div className="flex gap-2">
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-700 focus:border-orange-200"
                    >
                        <option value="All">All Types</option>
                        <option value="Fertilizer">Fertilizer</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Seed">Seeds</option>
                        <option value="Market">Markets</option>
                    </select>

                    <input 
                        type="text"
                        placeholder="Key Services..."
                        value={filterService}
                        onChange={(e) => setFilterService(e.target.value)}
                        className="flex-[1.5] text-xs bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-700 focus:border-orange-200"
                    />
                  </div>

                  <div>
                      <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 mb-2">
                          <span>Radius Limit</span>
                          <span className="text-orange-600">{filterDistance} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="200" 
                        step="5"
                        value={filterDistance}
                        onChange={(e) => setFilterDistance(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                  </div>
               </div>
           )}
        </div>
      </div>
      
      <div className="mt-6">
          {!loading && displayedSuppliers.length > 0 && renderRadarMap()}
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
               <Loader2 className="animate-spin text-orange-500" size={40} />
               <p className="text-sm font-bold animate-pulse">Scanning the web for real businesses...</p>
            </div>
          )}

          {displayedSuppliers.length === 0 && !loading && (favorites.length > 0 || suppliers.length > 0) && (
              <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold text-sm">No matches found for your current filters.</p>
              </div>
          )}
      </div>

      {displayedSuppliers.length > 0 && (
        <div className="mt-4 space-y-4">
           <div className="flex justify-between items-center px-2">
               <h3 className="text-sm text-slate-900 font-black uppercase tracking-widest">
                   {showFavoritesOnly ? 'Saved Partners' : 'Search Results'}
               </h3>
               <span className="text-xs font-bold text-slate-400">{displayedSuppliers.length} Results</span>
           </div>
           
           <div className="grid gap-4">
             {displayedSuppliers.map((s, idx) => (
                 <div 
                   key={idx}
                   onClick={() => setSelectedSupplier(s)}
                   className={`bg-white rounded-[2rem] p-5 shadow-sm border-2 transition-all cursor-pointer relative overflow-hidden group ${
                       selectedSupplier?.name === s.name ? 'border-orange-500 shadow-orange-100 shadow-xl' : 'border-slate-50'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-orange-700 transition-colors">{s.name}</h3>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                                    {s.type || "Supplier"}
                                </span>
                                {s.url && (
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                        <Globe size={10}/> Website Verified
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                             <button 
                                onClick={(e) => toggleFavorite(e, s)}
                                className={`p-2.5 rounded-2xl transition-all ${isFavorite(s) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-400'}`}
                             >
                                 <Heart size={20} fill={isFavorite(s) ? "currentColor" : "none"} />
                             </button>
                        </div>
                   </div>
                   
                   <div className="flex justify-between items-center text-xs text-slate-500 mt-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                       <span className="flex items-center gap-1.5 font-bold"><Navigation size={14} className="text-orange-500"/> {s.distance_km} km Away ({s.direction})</span>
                       {s.hours && <span className="flex items-center gap-1.5 font-bold"><Clock size={14} className="text-emerald-500"/> {s.hours}</span>}
                   </div>
                   
                   {selectedSupplier?.name === s.name && (
                       <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                           <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">{s.description}</p>
                           
                           <div className="space-y-2 mb-6">
                               {s.address && (
                                   <div className="text-xs font-bold text-slate-500 flex items-start gap-2">
                                       <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400"/> {s.address}
                                   </div>
                               )}
                               {s.phone && (
                                   <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                       <Phone size={14} className="text-slate-400"/> {s.phone}
                                   </div>
                               )}
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); getDirections(s); }}
                                    className="bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Navigation size={16} /> Get Directions
                                </button>
                                {s.url && (
                                    <a 
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-white border-2 border-slate-100 text-slate-800 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={16} /> Visit Site
                                    </a>
                                )}
                           </div>
                       </div>
                   )}
                 </div>
             ))}
           </div>
        </div>
      )}

      {sources.length > 0 && (
          <div className="mt-10 mb-6 bg-white p-6 rounded-[2rem] border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ExternalLink size={12}/> Information Sources
              </h4>
              <ul className="space-y-3">
                  {sources.map((src, i) => (
                      src.web && (
                          <li key={i} className="flex items-center justify-between group">
                              <span className="text-xs font-bold text-slate-600 truncate mr-4">{src.web.title}</span>
                              <a href={src.web.uri} target="_blank" rel="noopener noreferrer" className="text-orange-600 text-[10px] font-black underline uppercase tracking-tighter shrink-0 opacity-60 group-hover:opacity-100">
                                  View Source
                              </a>
                          </li>
                      )
                  ))}
              </ul>
          </div>
      )}
    </div>
  );
};

export default SupplierMap;
