export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  DOCTOR = 'DOCTOR',
  MARKET = 'MARKET',
  SUPPLIERS = 'SUPPLIERS',
  SOIL = 'SOIL',
  IRRIGATION = 'IRRIGATION',
  RECOMMENDER = 'RECOMMENDER'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isLoading?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  error?: string;
}

export interface WeatherSummary {
  temperature: string;
  condition: string;
  forecast: string;
  icon: string; // Emoji representation
}

export interface MarketItem {
  crop: string;
  price: string;
  trend: 'up' | 'down' | 'stable';
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        snippet: string;
      }[];
    }[];
  };
}