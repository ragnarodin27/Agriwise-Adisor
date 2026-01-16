import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import Navigation from './Navigation';
import Dashboard from './Dashboard';
import Onboarding from './Onboarding';
import { AppView, LocationData } from '../types';
import { LanguageProvider } from '../LanguageContext';

// Direct imports to ensure instant transitions without "Loading..." screens
import ChatAdvisor from './ChatAdvisor';
import CropDoctor from './CropDoctor';
import MarketView from './MarketView';
import SupplierMap from './SupplierMap';
import SoilAnalyzer from './SoilAnalyzer';
import IrrigationAdvisor from './IrrigationAdvisor';
import CropRecommender from './CropRecommender';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Robust Error Boundary to handle runtime crashes gracefully.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error: Error) { 
    console.error("App Crash:", error); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
             <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">System Interruption</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-200"
          >
            Restart Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('agriwise_onboarding_done');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ 
            latitude: pos.coords.latitude, 
            longitude: pos.coords.longitude 
          });
        },
        (err) => console.warn("Location unavailable."),
        { enableHighAccuracy: false, timeout: 5000 }
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

  const renderActiveView = () => {
    const props = { location, onNavigate: handleNavigate };
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard {...props} />;
      case AppView.CHAT: return <ChatAdvisor {...props} />;
      case AppView.DOCTOR: return <CropDoctor />;
      case AppView.MARKET: return <MarketView {...props} />;
      case AppView.SUPPLIERS: return <SupplierMap {...props} />;
      case AppView.SOIL: return <SoilAnalyzer {...props} />;
      case AppView.IRRIGATION: return <IrrigationAdvisor {...props} />;
      case AppView.RECOMMENDER: return <CropRecommender {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-x-hidden">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} onManualLocation={() => {}} />}
      
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-green-50 to-transparent pointer-events-none z-0"></div>
      
      <main className="flex-1 relative z-10 w-full max-md mx-auto min-h-screen pb-24">
        {renderActiveView()}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto w-full bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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