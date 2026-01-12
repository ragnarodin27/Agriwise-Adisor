export type LanguageCode = 'en' | 'hi' | 'pa' | 'ta' | 'te' | 'bn' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar';

export const LANGUAGES: { code: LanguageCode; name: string; flag: string; dir?: 'rtl' | 'ltr' }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<LanguageCode, any> = {
  en: {
    app_name: "AgriWise",
    subtitle: "Your Daily Farm Companion",
    nav: { home: 'Home', advisor: 'Advisor', doctor: 'Omni-Scan', soil: 'Soil', water: 'Water', plan: 'Plan', market: 'Market', find: 'Find' },
  },
  de: {
    app_name: "AgriWise",
    subtitle: "Ihr täglicher Farm-Begleiter",
    nav: { home: 'Start', advisor: 'Berater', doctor: 'Omni-Scan', soil: 'Boden', water: 'Wasser', plan: 'Planung', market: 'Markt', find: 'Finden' },
  },
  ja: {
    app_name: "AgriWise",
    subtitle: "あなたの毎日の農場パートナー",
    nav: { home: 'ホーム', advisor: 'アドバイザー', doctor: 'オムニスキャン', soil: '土壌', water: '灌漑', plan: '計画', market: '市場', find: '検索' },
  },
  zh: {
    app_name: "智农顾问 (AgriWise)",
    subtitle: "您的每日耕作伴侣",
    nav: { home: '首页', advisor: '顾问', doctor: '全能扫描', soil: '土壤', water: '灌溉', plan: '规划', market: '市场', find: '查找' },
  },
  ar: {
    app_name: "أجري وايز",
    subtitle: "رفيقك اليومي في المزرعة",
    nav: { home: 'الرئيسية', advisor: 'المستشار', doctor: 'الفحص الشامل', soil: 'التربة', water: 'الري', plan: 'التخطيط', market: 'السوق', find: 'بحث' },
  },
  hi: {
    app_name: "एग्रीवाइज",
    subtitle: "आपका दैनिक कृषि साथी",
    nav: { home: 'होम', advisor: 'सलाहकार', doctor: 'सर्व-स्कैन', soil: 'मिट्टी', water: 'पानी', plan: 'योजना', market: 'बाज़ार', find: 'खोजें' },
  },
  pa: {
    app_name: "ਐਗਰੀਵਾਈਜ਼",
    subtitle: "ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਖੇਤੀ ਸਾਥੀ",
    nav: { home: 'ਘਰ', advisor: 'ਸਲਾਹਕਾਰ', doctor: 'ਸਕੈਨ', soil: 'ਮਿੱਟੀ', water: 'ਪਾਣੀ', plan: 'ਯੋਜਨਾ', market: 'ਮਾਰਕੀਟ', find: 'ਲੱਭੋ' },
  },
  ta: {
     app_name: "அக்ரிவைஸ்",
     subtitle: "உங்கள் தினசரி விவசாயத் தோழன்",
     nav: { home: 'முகப்பு', advisor: 'ஆலோசகர்', doctor: 'ஸ்கேன்', soil: 'மண்', water: 'நீர்', plan: 'திட்டம்', market: 'சந்தை', find: 'தேடு' }
  },
  te: {
      app_name: "అగ్రివైజ్",
      subtitle: "మీ రోజువారీ వ్యవసాయ సహచరుడు",
      nav: { home: 'హోమ్', advisor: 'సలహాదారు', doctor: 'స్కాన్', soil: 'నేల', water: 'నీరు', plan: 'ప్రణాళిక', market: 'మార్కెట్', find: 'కనుగొనండి' }
  },
  bn: {
      app_name: "এগ্রিওয়াইজ",
      subtitle: "আপনার দৈনিক কৃষি সঙ্গী",
      nav: { home: 'হোম', advisor: 'পরামর্শদাতা', doctor: 'স্ক্যানার', soil: 'মাটি', water: 'জল', plan: 'পরিকল্পনা', market: 'বাজার', find: 'খুঁজুন' }
  },
  es: {
      app_name: "AgriWise",
      subtitle: "Tu Compañero Agrícola Diario",
      nav: { home: 'Inicio', advisor: 'Asesor', doctor: 'Omni-Scan', soil: 'Suelo', water: 'Riego', plan: 'Plan', market: 'Mercado', find: 'Buscar' }
  },
  fr: {
      app_name: "AgriWise",
      subtitle: "Votre compagnon agricole quotidien",
      nav: { home: 'Accueil', advisor: 'Conseiller', doctor: 'Omni-Scan', soil: 'Sol', water: 'Eau', plan: 'Plan', market: 'Marché', find: 'Trouver' }
  }
};