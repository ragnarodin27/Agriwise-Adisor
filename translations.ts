export type LanguageCode = 'en' | 'hi' | 'pa' | 'ta' | 'te' | 'bn' | 'es' | 'fr';

export const LANGUAGES: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const TRANSLATIONS: Record<LanguageCode, any> = {
  en: {
    app_name: "AgriWise",
    subtitle: "Your Daily Farm Companion",
    nav: { home: 'Home', advisor: 'Advisor', doctor: 'Dr. Crop', soil: 'Soil', water: 'Water', plan: 'Plan', market: 'Market', find: 'Find' },
  },
  hi: {
    app_name: "एग्रीवाइज",
    subtitle: "आपका दैनिक कृषि साथी",
    nav: { home: 'होम', advisor: 'सलाहकार', doctor: 'डॉ. क्रॉप', soil: 'मिट्टी', water: 'पानी', plan: 'योजना', market: 'बाज़ार', find: 'खोजें' },
  },
  pa: {
    app_name: "ਐਗਰੀਵਾਈਜ਼",
    subtitle: "ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਖੇਤੀ ਸਾਥੀ",
    nav: { home: 'ਘਰ', advisor: 'ਸਲਾਹਕਾਰ', doctor: 'ਡਾ. ਫਸਲ', soil: 'ਮਿੱਟੀ', water: 'ਪਾਣੀ', plan: 'ਯੋਜਨਾ', market: 'ਮਾਰਕੀਟ', find: 'ਲੱਭੋ' },
  },
  ta: {
     app_name: "அக்ரிவைஸ்",
     subtitle: "உங்கள் தினசரி விவசாயத் தோழன்",
     nav: { home: 'முகப்பு', advisor: 'ஆலோசகர்', doctor: 'பயிர் மருத்துவர்', soil: 'மண்', water: 'நீர்', plan: 'திட்டம்', market: 'சந்தை', find: 'தேடு' }
  },
  te: {
      app_name: "అగ్రివైజ్",
      subtitle: "మీ రోజువారీ వ్యవసాయ సహచరుడు",
      nav: { home: 'హోమ్', advisor: 'సలహాదారు', doctor: 'డా. పంట', soil: 'నేల', water: 'నీరు', plan: 'ప్రణాళిక', market: 'మార్కెట్', find: 'కనుగొనండి' }
  },
  bn: {
      app_name: "এগ্রিওয়াইজ",
      subtitle: "আপনার দৈনিক কৃষি সঙ্গী",
      nav: { home: 'হোম', advisor: 'পরামর্শদাতা', doctor: 'ডঃ ফসল', soil: 'মাটি', water: 'জল', plan: 'পরিকল্পনা', market: 'বাজার', find: 'খুঁজুন' }
  },
  es: {
      app_name: "AgriWise",
      subtitle: "Tu Compañero Agrícola Diario",
      nav: { home: 'Inicio', advisor: 'Asesor', doctor: 'Dr. Cultivo', soil: 'Suelo', water: 'Riego', plan: 'Plan', market: 'Mercado', find: 'Buscar' }
  },
  fr: {
      app_name: "AgriWise",
      subtitle: "Votre compagnon agricole quotidien",
      nav: { home: 'Accueil', advisor: 'Conseiller', doctor: 'Dr. Plante', soil: 'Sol', water: 'Eau', plan: 'Plan', market: 'Marché', find: 'Trouver' }
  }
};