
import React, { useState, useEffect } from 'react';
import { LocationData, GroundingChunk } from '../types';
import { findSuppliers, Supplier } from '../services/geminiService';
import { MapPin, Navigation, Search, Loader2, Heart, Filter, ExternalLink, Leaf, CheckCircle, Clock, Phone, X, Star, Map as MapIcon } from 'lucide-react';
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
  const [favorites, setFavorites] = useState<Supplier[]>([]);
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);

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
      const searchQuery = isOrganicOnly ? `Certified organic agricultural suppliers for ${query}` : query;
      const data = await findSuppliers(searchQuery, location, language);
      setSuppliers(data.suppliers);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 pb-24 min-h-screen">
       <header className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                {t('nav.find')}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">Network Locator</p>
      </header>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl py-2 -mx-4 px-4 mb-4">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" 
              placeholder="Find seeds, tools, feed..." 
            />
          </div>
          <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Navigation size={22} />}
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           <button 
             onClick={() => setIsOrganicOnly(!isOrganicOnly)}
             className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${
                isOrganicOnly 
                  ? 'bg-green-600 text-white border-green-600 shadow-green-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-green-300'
             }`}
           >
             <Leaf size={12} fill={isOrganicOnly ? "currentColor" : "none"} /> Certified Organic
           </button>
           <button className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 whitespace-nowrap">
             Open Now
           </button>
           <button className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 whitespace-nowrap">
             Top Rated
           </button>
        </div>
      </div>
      
      {/* Results List */}
      <div className="space-y-4">
        {suppliers.map((s, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedSupplier(s)} 
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all hover:shadow-lg hover:border-indigo-200 cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl text-indigo-600">
                 <MapIcon size={20} />
              </div>
              <div className="flex items-center gap-1">
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1">
                   <Navigation size={10} /> {s.distance_km} km
                 </span>
                 <button onClick={(e) => toggleFavorite(e, s)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
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
        ))}
        
        {suppliers.length === 0 && !loading && (
           <div className="text-center py-20 opacity-50">
              <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Area Scanned. No Results.</p>
           </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedSupplier(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 m-0 sm:m-4 max-h-[85vh] overflow-y-auto border border-white/10">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
             
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedSupplier.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase px-2 py-1 rounded-md">{selectedSupplier.type}</span>
                     <div className="flex gap-0.5 text-amber-400">
                        {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                     </div>
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
                  {selectedSupplier.hours && (
                    <div className="flex gap-3 items-start">
                       <Clock size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                       <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedSupplier.hours}</p>
                    </div>
                  )}
               </div>

               <div className="prose prose-sm prose-slate dark:prose-invert">
                 <p className="text-slate-500 dark:text-slate-400">{selectedSupplier.description}</p>
               </div>
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
