import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ChatAdvisor from './components/ChatAdvisor';
import CropDoctor from './components/CropDoctor';
import MarketView from './components/MarketView';
import SupplierMap from './components/SupplierMap';
import SoilAnalyzer from './components/SoilAnalyzer';
import IrrigationAdvisor from './components/IrrigationAdvisor';
import CropRecommender from './components/CropRecommender';
import { AppView, LocationData } from './types';
import { LanguageProvider } from './LanguageContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    // Attempt to get user location on startup
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location permission denied or unavailable.", error);
        }
      );
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard location={location} onNavigate={setCurrentView} />;
      case AppView.CHAT:
        return <ChatAdvisor location={location} />;
      case AppView.DOCTOR:
        return <CropDoctor />;
      case AppView.MARKET:
        return <MarketView location={location} />;
      case AppView.SUPPLIERS:
        return <SupplierMap location={location} />;
      case AppView.SOIL:
        return <SoilAnalyzer location={location} />;
      case AppView.IRRIGATION:
        return <IrrigationAdvisor location={location} />;
      case AppView.RECOMMENDER:
        return <CropRecommender location={location} />;
      default:
        return <Dashboard location={location} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden">
      {renderView()}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;