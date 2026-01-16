
import React, { useState, useEffect } from 'react';
import { LocationData, GroundingChunk } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Filter, ExternalLink, Leaf, CheckCircle } from 'lucide-react';
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

  const [favorites, setFavorites] = useState<Supplier[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [filterDistance, setFilterDistance] = useState(100);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('supplierFavorites');
    if (saved) try { setFavorites(JSON.parse(saved)); } catch (e) { console.error(e); }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, s: Supplier) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.name === s.name);
    let newFavs = isFav ? favorites.filter(f => f.name !== s.name) : [...favorites, s];
    setFavorites(newFavs);
    localStorage.setItem('supplierFavorites', JSON.stringify(newFavs));
  };

  const handleSearch = async () => {
    if (!query.trim() || !location) return;
    setLoading(true);
    try {
      const searchQuery = isOrganicOnly 
        ? `Certified organic agricultural suppliers for ${query}` 
        : query;
      const data = await findSuppliers(searchQuery, location, language);
      setSuppliers(data.suppliers);
      setSources(data.sources);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const displayedSuppliers = (showFavoritesOnly ? favorites : suppliers).filter(s => {
      if (showFavoritesOnly) return true;
      const matchesType = filterType === 'All' || s.type?.toLowerCase().includes(filterType.toLowerCase()) || s.name.toLowerCase().includes(filterType.toLowerCase());
      const matchesDist = s.distance_km <= filterDistance;
      const isOrganicMatch = !isOrganicOnly || s.description?.toLowerCase().includes('organic') || s.type?.toLowerCase().includes('organic');
      return matchesType && matchesDist && isOrganicMatch;
  });

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
       <header className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-xl"><MapPin size={24} className="text-orange-700" /></div>
                {t('nav.find')}
            </h2>
      </header>

      <div className="space-y-4">
        <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-200 flex gap-2">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 px-4 py-3 outline-none text-slate-700 text-sm font-medium" placeholder="Search suppliers..." />
          <button onClick={handleSearch} disabled={loading} className="bg-orange-600 text-white p-3 rounded-2xl shadow-lg transition-all active:scale-95">{loading ? <Loader2 className="animate-spin" /> : <Search size={24} />}</button>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Filter size={14}/> Discovery Filters</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsOrganicOnly(!isOrganicOnly)}
                  className={`text-[10px] px-3 py-1.5 rounded-full border-2 font-black uppercase tracking-tight flex items-center gap-1.5 transition-all ${isOrganicOnly ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                >
                  <Leaf size={14} /> Organic Certified
                </button>
                <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-bold ${showFavoritesOnly ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><Heart size={14} fill={showFavoritesOnly ? "currentColor" : "none"}/></button>
              </div>
           </div>
           
           <div className="flex gap-2">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2.5 font-bold outline-none">
                  <option value="All">All Categories</option>
                  <option value="Organic Fertilizer">Organic Fertilizer</option>
                  <option value="Seed">Heirloom Seeds</option>
                  <option value="Equipment">Tools & Machinery</option>
              </select>
              <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 mb-1"><span>Radius</span><span>{filterDistance} km</span></div>
                  <input type="range" min="5" max="200" step="5" value={filterDistance} onChange={(e) => setFilterDistance(Number(e.target.value))} className="w-full h-1 bg-slate-100 rounded-lg accent-orange-600" />
              </div>
           </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        {displayedSuppliers.map((s, idx) => {
          const isCertified = s.description?.toLowerCase().includes('organic') || s.type?.toLowerCase().includes('organic');
          return (
            <div key={idx} onClick={() => setSelectedSupplier(s)} className={`bg-white rounded-[2rem] p-5 shadow-sm border-2 transition-all cursor-pointer ${selectedSupplier?.name === s.name ? 'border-emerald-500 shadow-emerald-100 shadow-xl' : 'border-slate-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight flex items-center gap-2">
                    {s.name}
                    {isCertified && (
                      <div className="bg-emerald-100 text-emerald-700 p-1 rounded-full"><CheckCircle size={14} /></div>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{s.type || "Supplier"}</span>
                    {isCertified && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Leaf size={10}/> Bio-Certified
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={(e) => toggleFavorite(e, s)} className={`p-2 rounded-xl transition-all ${favorites.some(f => f.name === s.name) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300'}`}><Heart size={20} fill={favorites.some(f => f.name === s.name) ? "currentColor" : "none"} /></button>
              </div>
              {selectedSupplier?.name === s.name && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in">
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">{s.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.name}`); }} className="bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"><Navigation size={14}/> Directions</button>
                    {s.url && <a href={s.url} target="_blank" onClick={(e) => e.stopPropagation()} className="bg-white border-2 border-slate-100 text-slate-800 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"><ExternalLink size={14}/> Visit Site</a>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {displayedSuppliers.length === 0 && !loading && (
           <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in">
              <MapPin className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold">No results found for current filters.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default SupplierMap;
