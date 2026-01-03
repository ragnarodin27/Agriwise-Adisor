import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Filter, Phone, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface SupplierMapProps {
  location: LocationData | null;
}

const SupplierMap: React.FC<SupplierMapProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Filters & Favorites State
  const [favorites, setFavorites] = useState<Supplier[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [filterService, setFilterService] = useState(''); // Text input for service
  const [filterDistance, setFilterDistance] = useState(50); // Default 50km
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
    setSelectedSupplier(null);
    setShowFavoritesOnly(false); 
    try {
      const data = await findSuppliers(query, location, language);
      setSuppliers(data.suppliers);
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
                         s.type.toLowerCase().includes(filterType.toLowerCase()) || 
                         s.name.toLowerCase().includes(filterType.toLowerCase());
      
      const matchesService = !filterService || 
                             s.description.toLowerCase().includes(filterService.toLowerCase()) || 
                             s.type.toLowerCase().includes(filterService.toLowerCase());

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
          <div className="relative w-full h-[300px] bg-gray-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center mb-6 border border-gray-700">
              <svg width="300" height="300" className="opacity-80">
                  <circle cx="150" cy="150" r="40" stroke="#374151" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
                  <circle cx="150" cy="150" r="80" stroke="#374151" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
                  <circle cx="150" cy="150" r="120" stroke="#374151" strokeWidth="1" fill="none" />
                  <line x1="150" y1="30" x2="150" y2="270" stroke="#374151" strokeWidth="1" />
                  <line x1="30" y1="150" x2="270" y2="150" stroke="#374151" strokeWidth="1" />
                  <circle cx="150" cy="150" r="5" fill="#3B82F6" className="animate-pulse" />
                  {listToMap.map((s, i) => {
                      const deg = getDirectionAngle(s.direction);
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
                                fill={isSel ? "#F97316" : "#EF4444"} 
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
              <div className="absolute top-2 right-2 text-[10px] text-gray-400">
                  <span className="block">Range: {Math.round(maxDist)}km</span>
                  <span className="block text-blue-400">● You</span>
                  <span className="block text-red-500">● Supplier</span>
              </div>
          </div>
      );
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
       <header className="mb-6">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <MapPin size={24} className="text-orange-700" />
          </div>
          {t('nav.find')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Locate fertilizers, equipment, or buyers near you.</p>
      </header>

      {!location && (
         <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm mb-4">
           Please enable location services to find nearby suppliers.
         </div>
      )}

      <div className="space-y-4">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 outline-none text-gray-700 text-sm"
            placeholder="Search location type..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            disabled={loading || !location}
            className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Search size={20} />}
          </button>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-3">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Filter size={12}/> Filter Results
              </h3>
              <button 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${showFavoritesOnly ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                 <Heart size={12} fill={showFavoritesOnly ? "currentColor" : "none"}/> Favorites
              </button>
           </div>
           
           {!showFavoritesOnly && (
               <div className="space-y-2">
                  <div className="flex gap-2">
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-orange-300"
                    >
                        <option value="All">All Categories</option>
                        <option value="Fertilizer">Fertilizer</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Seed">Seeds</option>
                        <option value="Market">Markets</option>
                    </select>

                    <input 
                        type="text"
                        placeholder="Service (e.g. Organic, Repair)"
                        value={filterService}
                        onChange={(e) => setFilterService(e.target.value)}
                        className="flex-[1.5] text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-orange-300"
                    />
                  </div>

                  <div className="pt-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Max Distance</span>
                          <span className="font-bold text-orange-600">{filterDistance} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="200" 
                        step="5"
                        value={filterDistance}
                        onChange={(e) => setFilterDistance(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                  </div>
               </div>
           )}
        </div>
      </div>
      
      <div className="mt-4">
          {!loading && displayedSuppliers.length > 0 && renderRadarMap()}
          
          {displayedSuppliers.length === 0 && !loading && (favorites.length > 0 || suppliers.length > 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">
                  No suppliers match your current filters.
              </div>
          )}
      </div>

      {displayedSuppliers.length > 0 && (
        <div className="mt-4 space-y-4">
           <p className="text-sm text-gray-600 font-semibold">
               {showFavoritesOnly ? 'Your Favorites' : `Found ${displayedSuppliers.length} places`}
           </p>
           
           <div className="grid gap-4">
             {displayedSuppliers.map((s, idx) => (
                 <div 
                   key={idx}
                   onClick={() => setSelectedSupplier(s)}
                   className={`bg-white rounded-xl p-4 shadow-sm border transition-all cursor-pointer relative ${
                       selectedSupplier?.name === s.name ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-100'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="font-bold text-gray-800 text-base">{s.name}</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">{s.type}</span>
                        </div>
                        <div className="text-right">
                             <button 
                                onClick={(e) => toggleFavorite(e, s)}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                             >
                                 <Heart size={18} fill={isFavorite(s) ? "#EF4444" : "none"} className={isFavorite(s) ? "text-red-500" : ""} />
                             </button>
                        </div>
                   </div>
                   
                   <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                       <span className="flex items-center gap-1"><Navigation size={12}/> {s.distance_km} km ({s.direction})</span>
                       {s.hours && <span className="flex items-center gap-1"><Clock size={12}/> {s.hours}</span>}
                   </div>
                   
                   {selectedSupplier?.name === s.name && (
                       <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
                           <p className="text-sm text-gray-600 mb-2">{s.description}</p>
                           {s.address && (
                               <div className="text-xs text-gray-500 mb-1 flex items-start gap-1">
                                   <MapPin size={12} className="shrink-0 mt-0.5"/> {s.address}
                               </div>
                           )}
                           {s.phone && (
                               <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                   <Phone size={12}/> {s.phone}
                               </div>
                           )}
                           
                           <button 
                              onClick={(e) => { e.stopPropagation(); getDirections(s); }}
                              className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 flex items-center justify-center gap-2 shadow-sm"
                           >
                               <Navigation size={16} /> Navigate to Location
                           </button>
                       </div>
                   )}
                 </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplierMap;