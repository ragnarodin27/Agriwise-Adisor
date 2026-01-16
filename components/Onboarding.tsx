
import React, { useState } from 'react';
import { MapPin, Sparkles, ScanLine, Sprout, ChevronRight, Zap } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Welcome to AgriWise",
      description: "Your digital partner for precision farming. We use advanced AI to help you grow more, with less.",
      icon: <Sparkles className="text-amber-500" size={48} />,
      color: "from-amber-50 to-amber-100"
    },
    {
      title: "Hyper-Local Insights",
      description: "To provide real-time weather alerts and local market prices, we need to know where your farm is located.",
      icon: <MapPin className="text-blue-500" size={48} />,
      color: "from-blue-50 to-blue-100",
      isLocation: true
    },
    {
      title: "Omni-Scan AI",
      description: "Snap a photo of any crop disease or pest. Our AI diagnostic engine provides an instant action plan.",
      icon: <ScanLine className="text-orange-500" size={48} />,
      color: "from-orange-50 to-orange-100"
    },
    {
      title: "Smart Crop Planning",
      description: "Plan your seasons with data. Get crop rotations, companion planting, and harvest windows tailored to your soil.",
      icon: <Sprout className="text-green-500" size={48} />,
      color: "from-green-50 to-green-100"
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

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className={`absolute inset-0 bg-gradient-to-b ${currentData.color} opacity-40 transition-colors duration-700`}></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${step === i + 1 ? 'w-8 bg-slate-900' : 'w-1.5 bg-slate-200'}`} 
            />
          ))}
        </div>

        {/* Icon Container */}
        <div className="mb-8 p-8 bg-white rounded-[3rem] shadow-xl shadow-slate-900/5 animate-in zoom-in-95 duration-500">
           {currentData.icon}
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight animate-in slide-in-from-bottom-4 duration-500">
          {currentData.title}
        </h1>
        <p className="text-slate-500 text-base font-medium leading-relaxed mb-12 px-4 animate-in slide-in-from-bottom-6 duration-700">
          {currentData.description}
        </p>

        {/* CTA Button */}
        <button 
          onClick={handleNext}
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-black active:scale-95 transition-all shadow-slate-900/10"
        >
          {currentData.isLocation ? (
            <><Zap size={20} fill="currentColor"/> Enable Smart Features</>
          ) : step === steps.length ? (
            "Start Farming Better"
          ) : (
            <>Continue <ChevronRight size={22} /></>
          )}
        </button>
        
        {step === 2 && (
          <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Privacy First: Your data stays on your device
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
