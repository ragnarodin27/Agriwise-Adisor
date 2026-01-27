import React, { useState, useEffect, useCallback, ReactNode, Component } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import TaskManager from './components/TaskManager';
import { AppView, LocationData, UserProfile } from './types';
import { LanguageProvider } from './LanguageContext';
import { nativeStore } from './services/nativeStore';

// Direct imports to ensure instant transitions
import ChatAdvisor from './components/ChatAdvisor';
import CropDoctor from './components/CropDoctor';
import MarketView from './components/MarketView';
import SupplierMap from './components/SupplierMap';
import SoilAnalyzer from './components/SoilAnalyzer';
import IrrigationAdvisor from './components/IrrigationAdvisor';
import CropRecommender from './components/CropRecommender';
import ProfileEditor from './components/ProfileEditor';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AgriWise App Error:", error, errorInfo);
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
            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg"
          >
            Restart Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const BackgroundBlobs = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 20, 
        y: (e.clientY / window.innerHeight - 0.5) * 20 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 right-0 w-[80%] h-[60%] bg-emerald-900/10 blur-[120px] dark:opacity-100 opacity-0 transition-opacity duration-1000" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}></div>
      <div className="absolute bottom-0 left-0 w-[60%] h-[50%] bg-teal-900/10 blur-[120px] dark:opacity-100 opacity-0 transition-opacity duration-1000" style={{ transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px)` }}></div>
      <svg className="absolute top-[-20%] right-[-20%] w-[120%] h-[auto] text-blob-cyan dark:text-emerald-900 opacity-80 dark:opacity-20 animate-pulse-slow" viewBox="0 0 200 200" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}><path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,85.8,-8.1C81.5,4.2,70.2,14.5,60.6,23.4C51,32.3,43.1,39.8,34.5,45.9C25.9,52,16.6,56.7,6.4,59.3C-3.8,61.9,-14.9,62.4,-25.6,58.8C-36.3,55.2,-46.6,47.5,-55.5,37.6C-64.4,27.7,-71.9,15.6,-73.3,2.8C-74.7,-10,-70,-23.5,-62.4,-35.1C-54.8,-46.7,-44.3,-56.4,-32.6,-64.8C-20.9,-73.2,-8,-80.3,3.7,-86.7C15.4,-93.1,30.5,-103.6,44.7,-76.4Z" transform="translate(100 100)" /></svg>
      <style>{`
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 0.6; } }
        .animate-pulse-slow { animation: pulse-slow 15s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    nativeStore.init().then(async () => {
      const onboardingDone = localStorage.getItem('agriwise_onboarding_done');
      if (!onboardingDone) setShowOnboarding(true);
      const profiles = await nativeStore.getAll('profile');
      if (profiles && profiles.length > 0) {
        const main = profiles.find(p => p.key === 'main');
        if (main) setUserProfile(main);
      }
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const requestLocation = useCallback(() => {
    const manual = localStorage.getItem('manual_location');
    if (manual) { 
      try { setLocation(JSON.parse(manual)); return; } catch (e) { console.error(e); }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Location unavailable."),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    await nativeStore.put('profile', { key: 'main', ...profile });
    setCurrentView(AppView.DASHBOARD);
  };

  const logActivity = (type: string, description: string, icon: string) => {
    const activity = { id: Date.now().toString(), type, description, icon, timestamp: Date.now() };
    nativeStore.put('tasks', activity);
  };

  const renderActiveView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: 
        return (
          <Dashboard 
            location={location} 
            userProfile={userProfile} 
            onNavigate={handleNavigate} 
            isDarkMode={isDarkMode} 
            toggleTheme={() => setIsDarkMode(!isDarkMode)} 
            setLocation={(loc: LocationData | null) => setLocation(loc)} 
          />
        );
      case AppView.CHAT: return <ChatAdvisor location={location} />;
      case AppView.DOCTOR: return <CropDoctor location={location} logActivity={logActivity} />;
      case AppView.MARKET: return <MarketView location={location} logActivity={logActivity} />;
      case AppView.SUPPLIERS: return <SupplierMap location={location} />;
      case AppView.SOIL: return <SoilAnalyzer location={location} logActivity={logActivity} />;
      case AppView.IRRIGATION: return <IrrigationAdvisor location={location} />;
      case AppView.RECOMMENDER: return <CropRecommender location={location} retryLocation={requestLocation} />;
      case AppView.PROFILE: return (
        <ProfileEditor 
          currentProfile={userProfile} 
          onSave={handleSaveProfile} 
          onCancel={() => setCurrentView(AppView.DASHBOARD)} 
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      );
      case AppView.TASKS: return <TaskManager />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0E1F17] transition-colors duration-500 relative overflow-x-hidden">
      <BackgroundBlobs />
      {showOnboarding && <Onboarding onComplete={() => { localStorage.setItem('agriwise_onboarding_done', 'true'); setShowOnboarding(false); }} onManualLocation={(loc) => setLocation(loc)} />}
      <main className="flex-1 relative z-10 w-full max-w-2xl mx-auto min-h-screen pb-24 animate-in fade-in duration-500">
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
    <LanguageProvider><AppContent /></LanguageProvider>
  </ErrorBoundary>
);

export default App;