
import { GoogleGenAI, Type } from "@google/genai";
import { LocationData, GroundingChunk } from "../types";
import { LANGUAGES } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (code: string) => 
  LANGUAGES.find(l => l.code === code)?.name || 'English';

const SYSTEM_INSTRUCTION = (lang: string) => `
You are AgriWise, an elite 13X senior agricultural agronomist and Regenerative Agriculture Champion. 
User Language: ${getLanguageName(lang)}.

CORE PHILOSOPHY:
- ALWAYS prioritize organic, biological, and regenerative farming methods.
- ALWAYS explain the differences between chemical (synthetic) fertilizers/pesticides and organic alternatives.
- Warn against the "chemical treadmill" and the degradation of soil health caused by synthetic over-reliance.

OPERATIONAL GUIDELINES:
- Use localized scientific terminology.
- Use Markdown for structured reports.
`;

// Added missing exports for types used in components
export interface WeatherData {
  temperature: string;
  condition: string;
  farming_tip: string;
  alert?: {
    type: string;
    message: string;
    severity: 'High' | 'Medium' | 'Low';
  };
}

export interface MarketAnalysisResult {
  analysis: string;
  prices: { label: string; price: number }[];
}

export interface Supplier {
  name: string;
  type: string;
  distance_km: number;
  description: string;
  url?: string;
}

export interface CropPlanResult {
  analysis: string;
  recommendations?: {
    name: string;
    match_score: number;
    key_benefit: string;
    climate_fit?: string;
    maturity_days?: number;
    harvest_window?: string;
  }[];
  rotation_plan?: {
    period: string;
    crop: string;
    reason: string;
  }[];
}

export interface SoilAnalysisResult {
  analysis: string;
  health_score: number;
  typical_n: string;
  typical_p: string;
  typical_k: string;
  normalized_n: number;
  normalized_p: number;
  normalized_k: number;
  companion_advice: string;
  visual_indicators?: string[];
  texture_confidence?: { type: string; score: number };
}

async function apiRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await new Promise(r => setTimeout(r, 2000 / retries));
      return apiRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const analyzeSoil = async (soilData: any, location?: LocationData, language: string = 'en'): Promise<SoilAnalysisResult> => {
  return apiRetry(async () => {
    const parts: any[] = [];
    
    let prompt = `Analyze this soil health profile.
    Location: ${location ? `${location.latitude}, ${location.longitude}` : 'Unknown'}
    Data: pH ${soilData.ph}, Organic Matter ${soilData.organicMatter}%, Type ${soilData.type}.
    
    If an image is provided:
    1. Identify visual indicators of nutrient deficiency (e.g. coloration, texture).
    2. Estimate organic matter content visually.
    3. Determine soil texture with a confidence score.
    4. Provide biological recommendations for improvement.
    
    Return a JSON object with:
    - analysis: Markdown string
    - health_score: 0-100
    - typical_n/p/k: text descriptions
    - normalized_n/p/k: 0-100 values
    - visual_indicators: string array of identified traits
    - texture_confidence: { type: string, score: number }`;

    parts.push({ text: prompt });
    
    if (soilData.image) {
      parts.push({
        inlineData: {
          mimeType: soilData.image.mimeType,
          data: soilData.image.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            health_score: { type: Type.NUMBER },
            typical_n: { type: Type.STRING },
            typical_p: { type: Type.STRING },
            typical_k: { type: Type.STRING },
            normalized_n: { type: Type.NUMBER },
            normalized_p: { type: Type.NUMBER },
            normalized_k: { type: Type.NUMBER },
            visual_indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            texture_confidence: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                score: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};

export const planCropStrategy = async (data: any, location: LocationData, language: string = 'en'): Promise<any> => { return {}; };
export const chatWithAdvisor = async (message: string, history: any[], location?: LocationData, language: string = 'en') => { return {text: "", sources: []}; };
export const diagnoseCrop = async (image: any, symptoms: string, language: string = 'en') => { return ""; };
export const findSuppliers = async (query: string, location: LocationData, language: string = 'en') => { return {suppliers: [], sources: []} as any; };
export const getWeatherAndTip = async (location: LocationData, language: string = 'en') => { return {} as any; };
export const getIrrigationAdvice = async (data: any, location: LocationData, language: string = 'en') => { return ""; };
export const getMarketAnalysis = async (query: string, category: string, period: string, location?: LocationData, language: string = 'en') => { return {} as any; };
