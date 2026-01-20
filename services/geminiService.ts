
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LocationData, GroundingChunk, UserProfile } from "../types";
import { LANGUAGES } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (code: string) => 
  LANGUAGES.find(l => l.code === code)?.name || 'English';

const SYSTEM_INSTRUCTION = (lang: string, profile?: any) => `
You are AgriChatbot, a world-class 20x senior agricultural agronomist and tech expert specializing in sustainable farming.
User Language: ${getLanguageName(lang)}.

LEGAL & GLOBAL COMPLIANCE:
- Data Protection: Adhere strictly to GDPR (EU), CCPA (California), and regional agricultural data privacy laws (e.g., India's DPDP Act).
- Intellectual Property: Respect seed patents, chemical trademarks, and proprietary farming techniques. Avoid recommending illegal seed varieties or unlicensed chemicals.
- Global Scope: Provide advice based on FAO (Food and Agriculture Organization) standards and localized best practices.
- Medical/Legal Disclaimer: You provide agricultural advice, not medical or legal certification.

INTELLIGENCE CAPABILITIES:
- AgriChatbot Identity: Always identify as AgriChatbot.
- Multimodal Analysis: Use Gemini's vision to analyze crops/soil from images with extreme precision.
- Regenerative Focus: Prioritize organic fertilizers, IPM (Integrated Pest Management), and climate-resilient crop rotations.
- Location Sensitivity: Use latitude/longitude to factor in localized climate, humidity, and regional soil maps.

FARMER CONTEXT:
${profile ? `- Farmer Name: ${profile.name}
- Land: ${profile.landSize} ${profile.landUnit}, Soil: ${profile.soilType}
- Active Crops: ${profile.cropsGrown?.join(', ') || 'Various'}
` : '- No profile context provided.'}
`;

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
  prices: { label: string; price: number; organic_premium?: string }[];
}

export interface FertilizerSchedule {
  task: string;
  material: string;
  timing: string;
  dosage: string;
}

export interface SoilAnalysisResult {
  analysis: string;
  health_score: number;
  nutrients: {
    n: number;
    p: number;
    k: number;
    iron: number;
    zinc: number;
    manganese: number;
    copper: number;
    boron: number;
  };
  ecological_comparison: string;
  recommendation?: {
    action_title: string;
    material: string;
    quantity: string;
    timing: string;
    superiority_reason: string;
  };
  historical_trends?: {
    labels: string[];
    n: number[];
    p: number[];
    k: number[];
  };
  visual_findings?: string[];
}

export interface DiagnosisResult {
  diagnosis: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  action_today: string;
  organic_treatment: string;
  chemical_treatment: string;
  confidence?: number;
}

export interface Supplier {
  name: string;
  type: string;
  distance_km: number;
  description: string;
  address?: string;
  phone_number?: string;
  url?: string;
  hours?: string;
}

export interface CropPlanResult {
  analysis: string;
  recommendations?: any[];
  rotation_plan?: any[];
}

async function apiRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await new Promise(r => setTimeout(r, 1500 / retries));
      return apiRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const analyzeSoil = async (soilData: any, location?: LocationData, language: string = 'en'): Promise<SoilAnalysisResult> => {
  return apiRetry(async () => {
    const parts: any[] = [];
    const textPrompt = `Perform a deep soil biology analysis for ${soilData.crop}. Inputs: pH ${soilData.ph}, Organic Matter ${soilData.organicMatter}%, Type ${soilData.type}. 
    ${soilData.image ? "An image of the soil is provided. Use vision to identify texture, color (indicating organic matter content), and any visible biological health signs." : ""}
    Provide a health_score (0-100), full nutrient levels, and an ecological comparison. 
    Include 'visual_findings' as a string array if an image was provided.`;
    
    parts.push({ text: textPrompt });
    if (soilData.image) {
      parts.push({ inlineData: { mimeType: soilData.image.mimeType, data: soilData.image.data } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const getMarketAnalysis = async (query: string, category: string, period: string, location?: LocationData, language: string = 'en'): Promise<MarketAnalysisResult> => {
  return apiRetry(async () => {
    const prompt = `Real-time market intelligence for "${query}". Check trends for the last ${period}. Highlight local prices vs global organic premiums.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }] 
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const diagnoseCrop = async (image: any, cropName: string, language: string = 'en'): Promise<DiagnosisResult | null> => {
  return apiRetry(async () => {
    const parts: any[] = [{ text: `Analyze this image for ${cropName} health. Identify pests/pathogens and provide organic IPM treatments.` }];
    if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(response.text || 'null');
  });
};

export const getWeatherAndTip = async (location: LocationData, language: string = 'en') => {
  return apiRetry(async () => {
    const prompt = `Agro-meteorological outlook for lat: ${location.latitude}, lng: ${location.longitude}. Provide specific farming interventions based on rain/temp forecasts.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }] 
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const chatWithAdvisor = async (message: string, history: any[], location?: LocationData, language: string = 'en', profile?: any) => {
  return apiRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language, profile), 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  });
};

export const generateSpeech = async (text: string, language: string = 'en'): Promise<string | undefined> => {
  return apiRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: 'user', parts: [{ text: `Translate and speak in ${language} with a warm, professional agronomic tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const getIrrigationAdvice = async (data: any, location: LocationData, language: string = 'en'): Promise<string> => {
   return apiRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `Irrigation guidance for ${data.crop} at ${data.stage} growth stage. Current soil moisture estimate: ${data.moisture}%.` }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
   });
};

export const getFertilizerSchedule = async (crop: string, stage: string, soilData: any, language: string = 'en'): Promise<FertilizerSchedule[]> => {
  return apiRetry(async () => {
    const prompt = `Create a precision organic nutrition schedule for ${crop} (${stage}). Soil pH: ${soilData.ph}. Respond with a JSON array of FertilizerSchedule objects.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  });
};

export const findSuppliers = async (query: string, location: LocationData, language: string = 'en'): Promise<{ suppliers: Supplier[] }> => {
  return apiRetry(async () => {
    const prompt = `Find agricultural suppliers near lat: ${location.latitude}, lng: ${location.longitude} for query: "${query}". Return a JSON object with a "suppliers" array of objects with keys: name, type, distance_km, description, address, phone_number, url.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || '{"suppliers": []}');
  });
};

export const planCropStrategy = async (data: any, location: LocationData, language: string = 'en'): Promise<CropPlanResult> => {
  return apiRetry(async () => {
    const prompt = `Develop a crop strategy for mode: ${data.mode}. Soil: ${data.soilType}, Filters: ${data.filters?.join(', ')}, Crop Focus: ${data.cropInput}. Location: ${location.latitude}, ${location.longitude}. 
    Return JSON with analysis, recommendations, and rotation_plan.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || '{}');
  });
};
