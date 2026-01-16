
import React, { useState } from 'react';
import { MapPin, Sparkles, ScanLine, Sprout, ChevronRight, Zap, Edit2 } from 'lucide-react';
import { LocationData } from '../types';

interface OnboardingProps {
  onComplete: () => void;
  onManualLocation: (loc: LocationData) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onManualLocation }) => {
  const [step, setStep] = useState(1);
  const [showManual, setShowManual] = useState(false);
  const [coords, setCoords] = useState({ lat: '', lon: '' });

  const steps = [
    {
      title: "Welcome to AgriWise",
      description: "Your digital partner for precision farming. We use advanced AI to help you grow more, with less.",
      icon: <Sparkles className="text-amber-500" size={48} />,
      color: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/40"
    },
    {
      title: "Hyper-Local Insights",
      description: "To provide real-time weather alerts and local market prices, we need to know where your farm is located.",
      icon: <MapPin className="text-blue-500" size={48} />,
      color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40",
      isLocation: true
    },
    {
      title: "Omni-Scan AI",
      description: "Snap a photo of any crop disease or pest. Our AI diagnostic engine provides an instant action plan.",
      icon: <ScanLine className="text-orange-500" size={48} />,
      color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/40"
    },
    {
      title: "Smart Crop Planning",
      description: "Plan your seasons with data. Get crop rotations, companion planting, and harvest windows tailored to your soil.",
      icon: <Sprout className="text-green-500" size={48} />,
      color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40"
    }
  ];

  const currentData = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleManualSave = () => {
    const loc = { latitude: parseFloat(coords.lat), longitude: parseFloat(coords.lon) };
    onManualLocation(loc);
    localStorage.setItem('manual_location', JSON.stringify(loc));
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className={`absolute inset-0 bg-gradient-to-b ${currentData.color} opacity-40 transition-colors duration-700`}></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${step === i + 1 ? 'w-8 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} 
            />
          ))}
        </div>

        {/* Icon Container */}
        <div className="mb-8 p-8 bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl shadow-slate-900/5 dark:shadow-none animate-in zoom-in-95 duration-500">
           {currentData.icon}
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight animate-in slide-in-from-bottom-4 duration-500">
          {currentData.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed mb-12 px-4 animate-in slide-in-from-bottom-6 duration-700">
          {currentData.description}
        </p>

        {/* CTA Button */}
        <div className="w-full space-y-3">
          <button 
            onClick={handleNext}
            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-black active:scale-95 transition-all shadow-slate-900/10"
          >
            {currentData.isLocation ? (
              <><Zap size={20} fill="currentColor"/> Enable Location</>
            ) : step === steps.length ? (
              "Start Farming Better"
            ) : (
              <>Continue <ChevronRight size={22} /></>
            )}
          </button>

          {currentData.isLocation && (
            <button 
              onClick={() => setShowManual(true)}
              className="w-full py-4 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Edit2 size={14} /> Enter Coordinates Manually
            </button>
          )}
        </div>
        
        {step === 2 && (
          <p className="mt-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
            Privacy First: Your data stays on your device
          </p>
        )}
      </div>

      {showManual && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Manual Entry</h3>
            <div className="space-y-4 mb-8">
              <input 
                type="number" 
                placeholder="Latitude" 
                value={coords.lat} 
                onChange={e => setCoords({...coords, lat: e.target.value})}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none" 
              />
              <input 
                type="number" 
                placeholder="Longitude" 
                value={coords.lon} 
                onChange={e => setCoords({...coords, lon: e.target.value})}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none" 
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowManual(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Back</button>
              <button onClick={handleManualSave} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Save & Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
