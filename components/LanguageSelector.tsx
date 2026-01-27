import React from 'react';
import { LANGUAGES, LanguageCode } from '../translations';
import { Check } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`
            relative p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group overflow-hidden
            active:scale-95
            ${currentLanguage === lang.code 
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md scale-[1.02]' 
              : 'bg-white dark:bg-[#1C2B22] border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-500 dark:text-slate-400'
            }
          `}
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-2xl filter drop-shadow-sm mb-1">{lang.flag}</span>
            <span className="font-black text-[10px] uppercase tracking-widest opacity-80">{lang.name}</span>
          </div>
          {currentLanguage === lang.code && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 text-white rounded-full p-1 shadow-sm animate-in zoom-in duration-300">
               <Check size={12} strokeWidth={4} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;