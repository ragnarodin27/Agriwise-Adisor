
import React, { useState, useEffect, useCallback, ReactNode, Component } from 'react';
import Navigation from './Navigation';
import Dashboard from './Dashboard';
import Onboarding from './Onboarding';
import TaskManager from './TaskManager';
import { AppView, LocationData, UserProfile } from '../types';
import { LanguageProvider } from '../LanguageContext';

// Direct imports to ensure instant transitions without "Loading..." screens
import ChatAdvisor from './ChatAdvisor';
import CropDoctor from './CropDoctor';
import MarketView from './MarketView';
import SupplierMap from './SupplierMap';
import SoilAnalyzer from './SoilAnalyzer';
import IrrigationAdvisor from './IrrigationAdvisor';
import CropRecommender from './CropRecommender';
import ProfileEditor from './ProfileEditor';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Robust Error Boundary to handle runtime crashes gracefully.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any) { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error: Error, errorInfo: any) { 
    console.error("App Crash:", error, errorInfo); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#0E1F17]">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
             <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-emerald-50 mb-2">System Interruption</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-200"
          >
            Restart Application
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const BackgroundBlobs = () => (
  <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
    {/* Dark Mode Ambient Glows */}
    <div className="absolute top-0 right-0 w-[80%] h-[60%] bg-emerald-900/10 blur-[120px] dark:opacity-100 opacity-0 transition-opacity duration-1000"></div>
    <div className="absolute bottom-0 left-0 w-[60%] h-[50%] bg-teal-900/10 blur-[120px] dark:opacity-100 opacity-0 transition-opacity duration-1000"></div>

    <svg className="absolute top-[-20%] right-[-20%] w-[120%] h-[auto] text-blob-cyan dark:text-emerald-900 opacity-80 dark:opacity-20 animate-pulse-slow" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,85.8,-8.1C81.5,4.2,70.2,14.5,60.6,23.4C51,32.3,43.1,39.8,34.5,45.9C25.9,52,16.6,56.7,6.4,59.3C-3.8,61.9,-14.9,62.4,-25.6,58.8C-36.3,55.2,-46.6,47.5,-55.5,37.6C-64.4,27.7,-71.9,15.6,-73.3,2.8C-74.7,-10,-70,-23.5,-62.4,-35.1C-54.8,-46.7,-44.3,-56.4,-32.6,-64.8C-20.9,-73.2,-8,-80.3,3.7,-86.7C15.4,-93.1,30.5,-103.6,44.7,-76.4Z" transform="translate(100 100)" />
    </svg>
    
    <svg className="absolute bottom-[-10%] left-[-30%] w-[130%] h-[auto] text-blob-green dark:text-teal-950 opacity-80 dark:opacity-20 animate-float" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M41.5,-71.3C52.7,-65.4,60.3,-51.7,66.8,-38.3C73.3,-24.9,78.7,-11.8,75.9,-0.3C73.1,11.2,62.1,21.1,53.2,30.8C44.3,40.5,37.5,50,28.8,56.1C20.1,62.2,9.5,64.9,-1.4,67.3C-12.3,69.7,-25.1,71.8,-36.8,67.5C-48.5,63.2,-59.1,52.5,-66.2,39.9C-73.3,27.3,-76.9,12.8,-73.3,2.8C-74.7,-10,-70,-23.5,-62.4,-35.1C-54.8,-46.7,-44.3,-56.4,-32.6,-64.8C-20.9,-73.2,-8,-80.3,3.7,-86.7C15.4,-93.1,30.5,-103.6,44.7,-76.4Z" transform="translate(100 100)" />
    </svg>

    <style>{`
      @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -20px); } 100% { transform: translate(0, 0); } }
      @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 0.6; } }
      .animate-float { animation: float 20s infinite ease-in-out; }
      .animate-pulse-slow { animation: pulse-slow 15s infinite ease-in-out; }
    `}</style>
  </div>
);

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Auto Night Theme Detection
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6; // Dark mode between 6PM and 6AM
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
     try {
       const saved = localStorage.getItem('agri_user_profile');
       return saved ? JSON.parse(saved) : null;
     } catch { return null; }
  });

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('agriwise_onboarding_done');
    if (!hasCompletedOnboarding) setShowOnboarding(true);
    
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const requestLocation = useCallback(() => {
    const manual = localStorage.getItem('manual_location');
    if (manual) {
      setLocation(JSON.parse(manual));
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Location unavailable."),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('agri_user_profile', JSON.stringify(profile));
    setCurrentView(AppView.DASHBOARD);
  };

  const renderActiveView = () => {
    const props = { location, onNavigate: handleNavigate, userProfile };
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard {...props} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} setLocation={() => {}} />;
      case AppView.CHAT: return <ChatAdvisor location={location} />;
      case AppView.DOCTOR: return <CropDoctor />;
      case AppView.MARKET: return <MarketView location={location} />;
      case AppView.SUPPLIERS: return <SupplierMap location={location} />;
      case AppView.SOIL: return <SoilAnalyzer location={location} />;
      case AppView.IRRIGATION: return <IrrigationAdvisor location={location} />;
      case AppView.RECOMMENDER: return <CropRecommender location={location} retryLocation={requestLocation} />;
      case AppView.PROFILE: return <ProfileEditor currentProfile={userProfile} onSave={handleSaveProfile} onCancel={() => setCurrentView(AppView.DASHBOARD)} />;
      case 'TASKS' as any: return <TaskManager />;
      default: return <Dashboard {...props} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} setLocation={() => {}} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0E1F17] transition-colors duration-500 relative overflow-x-hidden">
      <BackgroundBlobs />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} onManualLocation={() => {}} />}
      <main className="flex-1 relative z-10 w-full max-w-2xl mx-auto min-h-screen pb-24">
        {renderActiveView()}
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto w-full">
          <Navigation currentView={currentView} onViewChange={handleNavigate} />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  </ErrorBoundary>
);

export default App;
