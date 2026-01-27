
import React, { useState } from 'react';
import { MapPin, Sparkles, ScanLine, Sprout, ChevronRight, Zap, Edit2, Loader2 } from 'lucide-react';
import { LocationData } from '../types';
import { useLanguage } from '../LanguageContext';

interface OnboardingProps {
  onComplete: () => void;
  onManualLocation: (loc: LocationData) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onManualLocation }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [showManual, setShowManual] = useState(false);
  const [coords, setCoords] = useState({ lat: '', lon: '' });
  const [locating, setLocating] = useState(false);

  const steps = [
    {
      title: t('onboarding.welcome_title'),
      description: t('onboarding.welcome_desc'),
      icon: <Sparkles className="text-amber-500 animate-pulse" size={64} />,
    },
    {
      title: t('onboarding.location_title'),
      description: t('onboarding.location_desc'),
      icon: <MapPin className="text-blue-500 animate-bounce" size={64} />,
      isLocation: true
    },
    {
      title: t('onboarding.scan_title'),
      description: t('onboarding.scan_desc'),
      icon: <ScanLine className="text-orange-500 animate-pulse" size={64} />,
    },
    {
      title: t('onboarding.plan_title'),
      description: t('onboarding.plan_desc'),
      icon: <Sprout className="text-green-500 animate-bounce" size={64} />,
    }
  ];

  const currentData = steps[step - 1];

  const handleNext = () => {
    if (currentData.isLocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          onManualLocation(loc);
          setLocating(false);
          setStep(step + 1);
        },
        (err) => {
          setLocating(false);
          setShowManual(true);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }
    
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
    setStep(step + 1);
    setShowManual(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-agri-bg dark:bg-[#0E1F17] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Background Blobs (Organic Shapes) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-[-10%] right-[-20%] w-[150%] h-auto text-blob-cyan dark:text-emerald-900 opacity-80 dark:opacity-20 animate-pulse-slow" viewBox="0 0 200 200">
          <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,85.8,-8.1C81.5,4.2,70.2,14.5,60.6,23.4C51,32.3,43.1,39.8,34.5,45.9C25.9,52,16.6,56.7,6.4,59.3C-3.8,61.9,-14.9,62.4,-25.6,58.8C-36.3,55.2,-46.6,47.5,-55.5,37.6C-64.4,27.7,-71.9,15.6,-73.3,2.8C-74.7,-10,-70,-23.5,-62.4,-35.1C-54.8,-46.7,-44.3,-56.4,-32.6,-64.8C-20.9,-73.2,-8,-80.3,3.7,-86.7C15.4,-93.1,30.5,-103.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
        <svg className="absolute bottom-[-10%] left-[-20%] w-[140%] h-auto text-blob-green dark:text-teal-950 opacity-80 dark:opacity-20 animate-float" viewBox="0 0 200 200">
          <path fill="currentColor" d="M41.5,-71.3C52.7,-65.4,60.3,-51.7,66.8,-38.3C73.3,-24.9,78.7,-11.8,75.9,-0.3C73.1,11.2,62.1,21.1,53.2,30.8C44.3,40.5,37.5,50,28.8,56.1C20.1,62.2,9.5,64.9,-1.4,67.3C-12.3,69.7,-25.1,71.8,-36.8,67.5C-48.5,63.2,-59.1,52.5,-66.2,39.9C-73.3,27.3,-76.9,12.8,-73.9,0.1C-70.9,-12.6,-61.3,-23.5,-51.7,-32.8C-42.1,-42.1,-32.5,-49.8,-22.1,-56.3C-11.7,-62.8,-0.5,-68.1,12.2,-73.9C24.9,-79.7,30.3,-77.2,41.5,-71.3Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${step === i + 1 ? 'w-8 bg-agri-teal dark:bg-emerald-500' : 'w-1.5 bg-agri-gray/30 dark:bg-emerald-900/30'}`} 
            />
          ))}
        </div>

        {/* Icon Container */}
        <div className="mb-8 p-10 bg-white dark:bg-[#1C2B22] rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 border border-slate-50 dark:border-white/5">
           {currentData.icon}
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-black text-agri-text dark:text-emerald-50 mb-4 tracking-tight animate-in slide-in-from-bottom-4 duration-500">
          {currentData.title}
        </h1>
        <p className="text-agri-gray dark:text-emerald-400/60 text-base font-medium leading-relaxed mb-12 px-4 animate-in slide-in-from-bottom-6 duration-700">
          {currentData.description}
        </p>

        {/* CTA Button */}
        <div className="w-full space-y-3">
          <button 
            onClick={handleNext}
            disabled={locating}
            className="w-full bg-agri-teal dark:bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-agri-dark active:scale-95 transition-all shadow-agri-teal/20"
          >
            {locating ? <Loader2 className="animate-spin" /> : currentData.isLocation ? (
              <><Zap size={20} fill="currentColor"/> {t('onboarding.btn_location')}</>
            ) : step === steps.length ? (
              t('onboarding.btn_start')
            ) : (
              <>{t('onboarding.btn_next')} <ChevronRight size={22} /></>
            )}
          </button>

          {currentData.isLocation && (
            <button 
              onClick={() => setShowManual(true)}
              className="w-full py-4 text-agri-gray dark:text-emerald-500/50 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Edit2 size={14} /> {t('onboarding.btn_manual')}
            </button>
          )}
        </div>
        
        {step === 2 && (
          <p className="mt-4 text-[10px] font-black uppercase text-agri-gray dark:text-emerald-500/30 tracking-widest">
            {t('onboarding.privacy_note')}
          </p>
        )}
      </div>

      {showManual && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1C2B22] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white/10">
            <h3 className="text-xl font-black text-agri-text dark:text-white mb-6">Manual Entry</h3>
            <div className="space-y-4 mb-8">
              <input 
                type="number" 
                placeholder="Latitude" 
                value={coords.lat} 
                onChange={e => setCoords({...coords, lat: e.target.value})}
                className="w-full p-4 bg-agri-bg dark:bg-[#0E1F17] border border-agri-mint/20 dark:border-white/5 rounded-2xl font-bold text-agri-text dark:text-white outline-none focus:border-agri-teal" 
              />
              <input 
                type="number" 
                placeholder="Longitude" 
                value={coords.lon} 
                onChange={e => setCoords({...coords, lon: e.target.value})}
                className="w-full p-4 bg-agri-bg dark:bg-[#0E1F17] border border-agri-mint/20 dark:border-white/5 rounded-2xl font-bold text-agri-text dark:text-white outline-none focus:border-agri-teal" 
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowManual(false)} className="flex-1 py-4 text-agri-gray dark:text-emerald-500 font-black text-xs uppercase tracking-widest">Back</button>
              <button onClick={handleManualSave} className="flex-[2] py-4 bg-agri-teal dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Save & Next</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(10px, -20px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.6; }
        }
        .animate-float { animation: float 20s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 15s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default Onboarding;
