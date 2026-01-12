
import { GoogleGenAI, Type } from "@google/genai";
import { LocationData, GroundingChunk } from "../types";
import { LANGUAGES } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (code: string) => 
  LANGUAGES.find(l => l.code === code)?.name || 'English';

/**
 * Global System Instruction for AgriWise 13X Expert AI.
 */
const SYSTEM_INSTRUCTION = (lang: string) => `
You are AgriWise, an elite 13X senior agricultural agronomist. 
User Language: ${getLanguageName(lang)}.

OPERATIONAL GUIDELINES:
- Use localized scientific terminology for soil and pest management.
- Prioritize Integrated Pest Management (IPM) and regenerative soil practices.
- If location data is available, consider regional climate and soil types.
- Always respond in the requested language: ${getLanguageName(lang)}.
- Use Markdown for structured reports.
`;

/**
 * Interface definitions for exported types used in components.
 */
export interface WeatherAlert {
  type: string;
  severity: string;
  message: string;
}

export interface WeatherData {
  weather_summary: string;
  temperature: string;
  condition: string;
  humidity: string;
  farming_tip: string;
  alert: WeatherAlert;
}

export interface MarketAnalysisResult {
  analysis: string;
  prices: { label: string; price: number }[];
}

export interface Supplier {
  name: string;
  type: string;
  address?: string;
  phone?: string;
  distance_km: number;
  direction: string;
  description: string;
  hours?: string;
  url?: string;
}

export interface CropPlanResult {
  analysis: string;
  recommendations?: { 
    name: string; 
    match_score: number; 
    key_benefit: string;
    harvest_window?: string; 
    maturity_days?: number;
  }[];
  rotation_plan?: { period: string; crop: string; reason: string; nutrient_impact?: string; pest_break?: string; yield_impact?: string }[];
  companions?: { name: string; role: string; benefit: string }[];
  avoid?: { name: string; reason: string }[];
  calendar?: { month: string; tasks: string[] }[];
}

/**
 * Standard retry mechanism for handling rate limits (429) and temporary outages.
 */
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

export const chatWithAdvisor = async (
  message: string, 
  history: { role: string; parts: { text: string }[] }[],
  location?: LocationData,
  language: string = 'en'
): Promise<{ text: string; sources: GroundingChunk[] }> => {
  return apiRetry(async () => {
    let prompt = message;
    if (location) prompt += `\n(User Location: ${location.latitude}, ${location.longitude})`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        tools: [{ googleSearch: {} }] 
      }
    });

    return {
      text: response.text || "Error generating response.",
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[]
    };
  });
};

export const diagnoseCrop = async (
  image: { data: string; mimeType: string } | null,
  symptoms: string,
  language: string = 'en'
): Promise<string> => {
  return apiRetry(async () => {
    const parts: any[] = [];
    if (image) parts.push({ inlineData: image });
    parts.push({ text: `
      Identify if this is a TREE/PLANT, INSECT, or SOIL.
      Provide a detailed identification, health assessment, and immediate action plan.
      Farmer's Notes: "${symptoms || 'Visual identification only'}"
      Reply in: ${getLanguageName(language)}
    ` });

    const response = await ai.models.generateContent({
      // Use gemini-2.5-flash-image for image tasks
      model: image ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview',
      contents: { parts },
      config: { systemInstruction: SYSTEM_INSTRUCTION(language) }
    });

    return response.text || "Diagnostic analysis failed.";
  });
};

export interface SoilAnalysisResult {
  analysis: string;
  typical_n: string;
  typical_p: string;
  typical_k: string;
  normalized_n: number;
  normalized_p: number;
  normalized_k: number;
  health_score: number;
  companion_advice: string;
}

export const analyzeSoil = async (
  soilData: any,
  location?: LocationData,
  language: string = 'en'
): Promise<SoilAnalysisResult> => {
  return apiRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Soil Data: ${JSON.stringify(soilData)}. Environmental Context: ${location?.latitude}, ${location?.longitude}. Local Weather/Climate Context should be considered.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            typical_n: { type: Type.STRING },
            typical_p: { type: Type.STRING },
            typical_k: { type: Type.STRING },
            normalized_n: { type: Type.NUMBER },
            normalized_p: { type: Type.NUMBER },
            normalized_k: { type: Type.NUMBER },
            health_score: { type: Type.NUMBER },
            companion_advice: { type: Type.STRING }
          },
          required: ["analysis", "health_score"]
        },
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const findSuppliers = async (
  query: string,
  location: LocationData,
  language: string = 'en'
): Promise<{ suppliers: Supplier[]; sources: GroundingChunk[] }> => {
  return apiRetry(async () => {
    // We use Google Search grounding to find real businesses
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find real-world agricultural suppliers for "${query}" near coordinates ${location.latitude}, ${location.longitude}. Provide their name, estimated distance, and a brief description.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suppliers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  address: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  distance_km: { type: Type.NUMBER },
                  direction: { type: Type.STRING, description: "N, S, E, W, etc." },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{"suppliers":[]}');
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
    
    return {
      suppliers: parsed.suppliers,
      sources: sources
    };
  });
};

export const getWeatherAndTip = async (location: LocationData, language: string = 'en'): Promise<WeatherData> => {
  return apiRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for real-time weather at coordinates ${location.latitude}, ${location.longitude}. Provide specific temperature, condition, and agricultural impact.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather_summary: { type: Type.STRING },
            temperature: { type: Type.STRING, description: "Current temperature with unit" },
            condition: { type: Type.STRING, description: "Short condition like Sunny, Rainy, etc." },
            humidity: { type: Type.STRING, description: "Humidity percentage" },
            farming_tip: { type: Type.STRING },
            alert: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                severity: { type: Type.STRING },
                message: { type: Type.STRING }
              }
            }
          },
          required: ["temperature", "condition", "farming_tip"]
        },
        tools: [{ googleSearch: {} }] 
      }
    });
    const data = JSON.parse(response.text || '{}');
    return data as WeatherData;
  });
};

export const getIrrigationAdvice = async (data: any, location: LocationData, language: string = 'en') => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Irrigation advice for ${data.crop}. Growth stage: ${data.stage}. Moisture: ${data.moisture}%`,
    config: { systemInstruction: SYSTEM_INSTRUCTION(language), tools: [{ googleSearch: {} }] }
  });
  return response.text || "";
};

export const planCropStrategy = async (data: any, location: LocationData, language: string = 'en'): Promise<CropPlanResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Strategy mode: ${data.mode}. Soil: ${data.soilType}. Crop: ${data.cropInput || 'N/A'}. Filters: ${data.filters?.join(', ') || 'None'}. Provide harvest window details based on local climate for recommendations.`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION(language), 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                match_score: { type: Type.NUMBER },
                key_benefit: { type: Type.STRING },
                harvest_window: { type: Type.STRING },
                maturity_days: { type: Type.NUMBER }
              },
              required: ["name", "match_score", "key_benefit"]
            }
          },
          rotation_plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING },
                crop: { type: Type.STRING },
                reason: { type: Type.STRING },
                nutrient_impact: { type: Type.STRING },
                pest_break: { type: Type.STRING },
                yield_impact: { type: Type.STRING }
              }
            }
          },
          companions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                benefit: { type: Type.STRING }
              }
            }
          },
          avoid: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          },
          calendar: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        },
        required: ["analysis"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getMarketAnalysis = async (query: string, category: string, period: string, location?: LocationData, language: string = 'en'): Promise<MarketAnalysisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Market analysis for ${query}. Category: ${category}. Period: ${period}`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION(language), 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || '{}');
};
