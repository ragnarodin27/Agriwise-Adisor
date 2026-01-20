import React, { useState, useEffect, useCallback, ReactNode, Component } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import TaskManager from './components/TaskManager';
import { AppView, LocationData, UserProfile } from './types';
import { LanguageProvider } from './LanguageContext';

// Direct imports
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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
             <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">System Interruption</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-200"
          >
            Restart Application
          </button>
        </div>
      );
    }
    // Correct access to props for class components - React.Component provides 'props'
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
     try {
       const saved = localStorage.getItem('agri_user_profile');
       return saved ? JSON.parse(saved) : null;
     } catch {
       return null;
     }
  });

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('agriwise_onboarding_done');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
    
    // Apply theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const requestLocation = useCallback(() => {
    // Check for manual override first
    const manual = localStorage.getItem('manual_location');
    if (manual) {
      setLocation(JSON.parse(manual));
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ 
            latitude: pos.coords.latitude, 
            longitude: pos.coords.longitude 
          });
        },
        (err) => {
          console.warn("Location error:", err.message);
          setLocation({
            latitude: 0,
            longitude: 0,
            error: err.code === 1 ? "Permission Denied" : "Location Unavailable"
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('agriwise_onboarding_done', 'true');
    setShowOnboarding(false);
    requestLocation();
  };

  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('agri_user_profile', JSON.stringify(profile));
    setCurrentView(AppView.DASHBOARD);
  };

  const logActivity = (type: string, description: string, icon: string) => {
    const activity = { id: Date.now(), type, description, icon, timestamp: Date.now() };
    const saved = JSON.parse(localStorage.getItem('agri_activities') || '[]');
    localStorage.setItem('agri_activities', JSON.stringify([activity, ...saved].slice(0, 10)));
  };

  const renderActiveView = () => {
    const dashboardProps = { 
      location, 
      userProfile, 
      onNavigate: handleNavigate, 
      isDarkMode, 
      toggleTheme, 
      setLocation 
    };

    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard {...dashboardProps} />;
      case AppView.CHAT: return <ChatAdvisor location={location} />;
      case AppView.DOCTOR: return <CropDoctor logActivity={logActivity} />;
      case AppView.MARKET: return <MarketView location={location} logActivity={logActivity} />;
      case AppView.SUPPLIERS: return <SupplierMap location={location} />;
      case AppView.SOIL: return <SoilAnalyzer location={location} logActivity={logActivity} />;
      case AppView.IRRIGATION: return <IrrigationAdvisor location={location} />;
      case AppView.RECOMMENDER: return <CropRecommender location={location} retryLocation={requestLocation} />;
      case AppView.PROFILE: return <ProfileEditor currentProfile={userProfile} onSave={handleSaveProfile} onCancel={() => setCurrentView(AppView.DASHBOARD)} />;
      case 'TASKS' as any: return <TaskManager />;
      default: return <Dashboard {...dashboardProps} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-farmer-bg dark:bg-slate-950 transition-colors duration-300 relative overflow-x-hidden safe-pl safe-pr">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} onManualLocation={setLocation} />}
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent pointer-events-none z-0"></div>
      
      <main className="flex-1 relative z-10 w-full max-w-2xl mx-auto px-1 sm:px-4 pb-24">
        {renderActiveView()}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-pb">
        <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_30px_rgba(0,0,0,0.05)]">
          <div className="w-full max-w-2xl mx-auto">
            <Navigation currentView={currentView} onViewChange={handleNavigate} />
          </div>
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