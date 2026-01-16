
import React, { useState, useEffect } from 'react';
import { LocationData, GroundingChunk } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Filter, ExternalLink, Leaf, CheckCircle, Clock, Phone, X, Map } from 'lucide-react';
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
  const [filterDistance, setFilterDistance] = useState(50);
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

  const openDirections = (s: Supplier) => {
    const destination = s.address ? encodeURIComponent(s.address) : encodeURIComponent(s.name);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 relative">
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
           
           <div className="flex gap-4 items-center">
              <div className="flex-1">
                 <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full text-xs bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2.5 font-bold outline-none">
                    <option value="All">All Categories</option>
                    <option value="Organic Fertilizer">Organic Fertilizer</option>
                    <option value="Seed">Heirloom Seeds</option>
                    <option value="Equipment">Tools & Machinery</option>
                 </select>
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[9px] font-black uppercase text-slate-400">Search Radius</span>
                    <span className="text-xs font-black text-orange-600">{filterDistance} km</span>
                 </div>
                 <input 
                   type="range" 
                   min="5" 
                   max="200" 
                   step="5" 
                   value={filterDistance} 
                   onChange={(e) => setFilterDistance(Number(e.target.value))} 
                   className="w-full h-1.5 bg-slate-100 rounded-lg accent-orange-600 cursor-pointer" 
                 />
              </div>
           </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        {displayedSuppliers.map((s, idx) => {
          const isCertified = s.description?.toLowerCase().includes('organic') || s.type?.toLowerCase().includes('organic');
          return (
            <div key={idx} onClick={() => setSelectedSupplier(s)} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md">
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
                    <span className="text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                       <Navigation size={10} /> {s.distance_km} km
                    </span>
                  </div>
                </div>
                <button onClick={(e) => toggleFavorite(e, s)} className={`p-2 rounded-xl transition-all ${favorites.some(f => f.name === s.name) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300'}`}><Heart size={20} fill={favorites.some(f => f.name === s.name) ? "currentColor" : "none"} /></button>
              </div>
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

      {/* Detailed Popup / Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedSupplier(null)}></div>
          <div className="bg-white w-full max-w-md p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 m-0 sm:m-4 max-h-[85vh] overflow-y-auto">
             <button onClick={() => setSelectedSupplier(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
               <X size={20} />
             </button>
             
             <div className="mb-6 pr-10">
               <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedSupplier.name}</h2>
               <span className="inline-block bg-orange-100 text-orange-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">{selectedSupplier.type}</span>
             </div>

             <div className="space-y-4 mb-8">
               {selectedSupplier.address && (
                 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <MapPin className="text-slate-400 mt-0.5 shrink-0" size={18} />
                    <p className="text-sm font-medium text-slate-700">{selectedSupplier.address}</p>
                 </div>
               )}
               
               {selectedSupplier.phone_number && (
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Phone className="text-slate-400 shrink-0" size={18} />
                    <a href={`tel:${selectedSupplier.phone_number}`} className="text-sm font-bold text-blue-600 hover:underline">{selectedSupplier.phone_number}</a>
                 </div>
               )}

               {selectedSupplier.hours && (
                 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Clock className="text-slate-400 mt-0.5 shrink-0" size={18} />
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-line">{selectedSupplier.hours}</p>
                 </div>
               )}

               <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About</h4>
                 <p className="text-sm text-slate-600 leading-relaxed">{selectedSupplier.description}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => openDirections(selectedSupplier)} 
                 className="bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all hover:bg-black"
               >
                 <Navigation size={16} /> Get Directions
               </button>
               {selectedSupplier.url ? (
                  <a 
                    href={selectedSupplier.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-slate-100 text-slate-800 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-slate-50"
                  >
                    <ExternalLink size={16} /> Website
                  </a>
               ) : (
                  <button disabled className="bg-slate-50 text-slate-300 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                    <ExternalLink size={16} /> No Website
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
