import React, { useState } from 'react';
import { LocationData } from '../types';
import { getIrrigationAdvice } from '../services/geminiService';
import { Droplets, CloudRain, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface IrrigationAdvisorProps {
  location: LocationData | null;
}

const IrrigationAdvisor: React.FC<IrrigationAdvisorProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({
    crop: '',
    stage: 'Vegetative',
    moisture: 50, 
    rainSensor: 0 
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
        setError("Location is required for weather-based advice.");
        return;
    }
    if (!formData.crop) {
        setError("Please enter a crop name.");
        return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const advice = await getIrrigationAdvice(formData, location, language);
      setResult(advice);
    } catch (err) {
      setError("Failed to get advice. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-blue-50/50">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Droplets size={24} className="text-blue-700" />
          </div>
          {t('nav.water')}
        </h2>
        <p className="text-gray-600 mt-1 text-sm">Real-time watering advice based on local weather and soil moisture.</p>
      </header>

      {!location && (
         <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm mb-4">
           Please enable location services to get accurate weather data.
         </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <input
              type="text"
              value={formData.crop}
              onChange={(e) => setFormData({...formData, crop: e.target.value})}
              placeholder="e.g., Rice, Cotton, Peppers"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Growth Stage</label>
             <select
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             >
                <option value="Germination">Germination / Seedling</option>
                <option value="Vegetative">Vegetative Growth</option>
                <option value="Flowering">Flowering</option>
                <option value="Fruiting">Fruiting / Grain Filling</option>
                <option value="Harvest">Maturation / Harvest</option>
             </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Soil Moisture</label>
                <span className="text-xs font-bold text-blue-600">{formData.moisture}%</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={formData.moisture} 
                onChange={(e) => setFormData({...formData, moisture: Number(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Bone Dry</span>
                <span>Saturated</span>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                 <CloudRain size={16} /> Rainfall (Past 24h)
             </label>
             <div className="flex items-center gap-2">
                 <input
                    type="number"
                    min="0"
                    value={formData.rainSensor}
                    onChange={(e) => setFormData({...formData, rainSensor: Number(e.target.value)})}
                    placeholder="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <span className="text-sm text-gray-500">mm</span>
             </div>
             <p className="text-[10px] text-gray-400 mt-1">Enter rainfall from a manual gauge or sensor.</p>
          </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
        )}

        <button
            type="submit"
            disabled={loading || !location}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
              loading || !location ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" /> Calculating...
              </span>
            ) : "Get Watering Plan"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-md border border-blue-100 animate-in fade-in slide-in-from-bottom-4">
           <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-50">
             <CloudRain className="text-blue-500" />
             <h3 className="font-bold text-lg text-gray-800">Irrigation Plan</h3>
           </div>
           <div className="prose prose-sm prose-blue max-w-none">
             <ReactMarkdown>{result}</ReactMarkdown>
           </div>
        </div>
      )}
    </div>
  );
};

export default IrrigationAdvisor;