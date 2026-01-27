
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  DOCTOR = 'DOCTOR',
  MARKET = 'MARKET',
  SUPPLIERS = 'SUPPLIERS',
  SOIL = 'SOIL',
  IRRIGATION = 'IRRIGATION',
  RECOMMENDER = 'RECOMMENDER',
  PROFILE = 'PROFILE',
  TASKS = 'TASKS'
}

export interface UserProfile {
  name: string;
  mobile: string;
  email?: string;
  avatar?: string; // base64 image string
  landSize?: string;
  landUnit?: 'Acres' | 'Hectares' | 'Bigha';
  soilType?: string;
  cropsGrown?: string[];
  location?: LocationData;
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
  icon: string;
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
