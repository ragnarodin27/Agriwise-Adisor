import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LocationData, UserProfile } from "../types";
import { LANGUAGES } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (code: string) => 
  LANGUAGES.find(l => l.code === code)?.name || 'English';

const SYSTEM_INSTRUCTION = (lang: string, profile?: any) => `
You are AgriChatbot, a world-class 20x senior agricultural agronomist and technology expert. 
Your expertise covers sustainable, regenerative, and precision farming.
User Language: ${getLanguageName(lang)}.

LEGAL & GLOBAL COMPLIANCE:
- Adhere strictly to agricultural data privacy laws.
- Respect intellectual property regarding seed patents and chemical trademarks.

INTELLIGENCE CAPABILITIES:
- Identity: Always identify as AgriChatbot.
- Multimodal Analysis: Use vision to analyze soil/crops with molecular-level detail.
- Regenerative Focus: Prioritize organic methods (compost, biochar, IPM) over synthetic inputs.
- Location Sensitivity: Factor in localized climate, weather patterns, and regional market trends using coordinates.

FARMER CONTEXT:
${profile ? `- Farmer Name: ${profile.name}
- Land: ${profile.landSize} ${profile.landUnit}, Soil: ${profile.soilType}
- Active Crops: ${profile.cropsGrown?.join(', ') || 'Various'}
` : '- No profile context provided.'}
`;

export interface WeatherData {
  temperature: string;
  condition: string;
  humidity?: string;
  windSpeed?: string;
  uvIndex?: string;
  farming_tip: string;
  alert?: {
    type: string;
    message: string;
    severity: 'High' | 'Medium' | 'Low';
  };
  pest_risk?: {
    species: string;
    risk_level: 'High' | 'Medium' | 'Low';
    organic_treatment: string;
    identification_key: string;
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
    n: number; p: number; k: number; iron: number; zinc: number; manganese: number; copper: number; boron: number;
  };
  ecological_comparison: {
    organic_benefits: string[];
    synthetic_drawbacks: string[];
    summary: string;
  };
  recommendation?: {
    action_title: string;
    material: string;
    quantity: string;
    timing: string;
    superiority_reason: string;
  };
  historical_trends?: {
    labels: string[]; n: number[]; p: number[]; k: number[];
  };
  visual_findings?: string[];
  texture_confidence?: {
    type: string;
    confidence: number;
  };
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
  name: string; type: string; distance_km: number; description: string; address?: string; phone_number?: string; url?: string;
}

export interface CropRecommendation {
  name: string; 
  match_score: number; 
  key_benefit: string; 
  companion_plant?: string;
  companion_benefit?: string; 
  maturity_days?: string; 
  harvest_window?: string; 
  pest_risk?: { level: 'Low' | 'Medium' | 'High'; details: string }; 
  market_demand?: { level: 'Low' | 'Medium' | 'High'; details: string };
}

export interface PlantingCalendarItem {
  crop: string; planting_months: number[]; harvest_months: number[]; notes: string;
}

export interface RotationStep {
  year: number;
  period: string;
  crop: string;
  reason: string;
}

export interface CropPlanResult {
  analysis: string; 
  recommendations?: CropRecommendation[]; 
  rotation_plan?: RotationStep[]; 
  planting_calendar?: PlantingCalendarItem[];
}

export interface PestOutbreak {
  location: { lat: number; lng: number; radius: number };
  pest_name: string;
  risk_level: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface PestGuideItem {
  name: string;
  scientific_name: string;
  description: string;
  symptoms: string[];
  organic_control: string;
  chemical_control: string;
  prevalence_season: string;
  type?: 'Insect' | 'Fungus' | 'Virus' | 'Bacteria';
}

async function apiRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      const delay = Math.pow(2, 4 - retries) * 1000;
      await new Promise(r => setTimeout(r, delay));
      return apiRetry(fn, retries - 1);
    }
    throw error;
  }
}

const pendingRequests = new Map<string, Promise<any>>();

async function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) return pendingRequests.get(key);
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

export const analyzeSoil = async (soilData: any, location?: LocationData, language: string = 'en'): Promise<SoilAnalysisResult> => {
  return apiRetry(async () => {
    const parts: any[] = [];
    const textPrompt = `Perform a deep soil biology analysis for ${soilData.crop || 'general farming'}. 
    Inputs: pH ${soilData.ph}, Organic Matter ${soilData.organicMatter}%, Type ${soilData.type}. 
    ${soilData.image ? "Analyze texture and visual health from the provided photo." : ""}
    
    MUST prioritize organic amendments. 
    
    RETURN JSON ONLY:
    {
      "health_score": number,
      "nutrients": { "n": number, "p": number, "k": number, "iron": number, "zinc": number, "manganese": number, "copper": number, "boron": number },
      "analysis": "string",
      "ecological_comparison": {
        "organic_benefits": ["benefit focused on biodiversity", "benefit focused on soil structure", "benefit focused on environmental safety"],
        "synthetic_drawbacks": ["drawback focused on microbiome", "drawback focused on groundwater", "drawback focused on long-term dependence"],
        "summary": "detailed comparison emphasizing organic advantages"
      },
      "recommendation": { "action_title": "string", "material": "string", "quantity": "string", "timing": "string", "superiority_reason": "string" },
      "visual_findings": ["string"],
      "texture_confidence": { "type": "string", "confidence": number },
      "historical_trends": { "labels": ["string"], "n": [number], "p": [number], "k": [number] }
    }`;
    
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
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const getMarketAnalysis = async (query: string, category: string, period: string, location?: LocationData, language: string = 'en'): Promise<MarketAnalysisResult> => {
  const dedupeKey = `market_${query}_${period}_${language}`;
  return dedupeRequest(dedupeKey, () => apiRetry(async () => {
    const prompt = `Agricultural market intelligence for "${query}" near coordinates ${location?.latitude}, ${location?.longitude}. Compare local mandi prices with organic premiums.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
    });
    return JSON.parse(response.text || '{}');
  }));
};

export const diagnoseCrop = async (image: any, cropName: string, language: string = 'en'): Promise<DiagnosisResult | null> => {
  return apiRetry(async () => {
    const parts: any[] = [{ text: `Diagnose health issues for ${cropName} and suggest organic treatments.` }];
    if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || 'null');
  });
};

export const getWeatherAndTip = async (location: LocationData, language: string = 'en'): Promise<WeatherData> => {
  const cacheKey = `weather_${location.latitude}_${location.longitude}`;
  return dedupeRequest(cacheKey, () => apiRetry(async () => {
    const prompt = `Current weather and farming outlook for lat: ${location.latitude}, lng: ${location.longitude}. 
    Return JSON with temp, condition, humidity, wind, UV, and a specific seasonal farming tip.
    ALSO check for:
    1. Severe weather alerts (frost, heavy rain, heatwave) and include an 'alert' object if necessary with 'type', 'message', and 'severity' ('High' | 'Medium' | 'Low').
    2. Potential pest outbreaks in this region based on current weather (e.g. humid weather + specific crops) and historical data. Include a 'pest_risk' object with species, risk_level, organic_treatment, and identification_key.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
    });
    return JSON.parse(response.text || '{}');
  }));
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

export const summarizeConversation = async (history: any[], language: string = 'en'): Promise<string> => {
  return apiRetry(async () => {
    const prompt = `Summarize the following agricultural advisor conversation history into a concise, actionable bullet-point list.
    Focus on key advice given and user concerns.
    Language: ${getLanguageName(language)}.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: "You are a specialized summarization engine for agricultural advice. Keep it professional and brief.", 
      }
    });
    return response.text || "No summary available.";
  });
};

export const generateSpeech = async (text: string, language: string = 'en'): Promise<string | undefined> => {
  return apiRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: 'user', parts: [{ text: `Speak in ${language}: ${text}` }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const findSuppliers = async (query: string, location: LocationData, language: string = 'en'): Promise<{ suppliers: Supplier[] }> => {
  return dedupeRequest(`suppliers_${query}`, () => apiRetry(async () => {
    const prompt = `Identify agriculture suppliers for "${query}" near ${location.latitude}, ${location.longitude}. Return JSON array of objects with name, type, distance_km, description, and contact info.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
    });
    return JSON.parse(response.text || '{"suppliers": []}');
  }));
};

export const planCropStrategy = async (data: any, location: LocationData, language: string = 'en'): Promise<CropPlanResult> => {
  return apiRetry(async () => {
    const prompt = `Develop a precision crop strategy for mode: ${data.mode}. 
    Context:
    - Target Crop: ${data.cropInput || 'Not specified'}
    - Soil Profile: ${data.soilType}
    - Farmer Preferences: ${data.filters?.join(', ') || 'Standard'}
    - Coordinates: ${location.latitude}, ${location.longitude}
    
    INSTRUCTIONS:
    - If suggesting crops, ALWAYS include a "companion_plant" and "companion_benefit" for each crop to deter pests or improve soil.
    - If creating a rotation plan, provide a JSON array of objects with "year", "period" (season), "crop", and "reason".
    
    Return JSON with detailed analysis and the following structures where appropriate.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language), 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return JSON.parse(response.text || '{}');
  }));
};

export const getIrrigationAdvice = async (data: any, location: LocationData, language: string = 'en'): Promise<string> => {
  return apiRetry(async () => {
   const response = await ai.models.generateContent({
     model: 'gemini-3-flash-preview',
     contents: [{ role: 'user', parts: [{ text: `Provide precision irrigation advice for ${data.crop} at ${data.stage} stage. Current soil moisture: ${data.moisture}%. Location: ${location.latitude}, ${location.longitude}.` }] }],
     config: { systemInstruction: SYSTEM_INSTRUCTION(language), tools: [{ googleSearch: {} }] }
   });
   return response.text || "";
  });
};

export const getFertilizerSchedule = async (crop: string, stage: string, soilData: any, language: string = 'en'): Promise<FertilizerSchedule[]> => {
 return apiRetry(async () => {
   const prompt = `Generate a regenerative/organic nutrition schedule for ${crop} during the ${stage} growth stage. Return as a JSON array of FertilizerSchedule objects.`;
   const response = await ai.models.generateContent({
     model: 'gemini-3-flash-preview',
     contents: [{ role: 'user', parts: [{ text: prompt }] }],
     config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json" }
   });
   return JSON.parse(response.text || '[]');
 });
};

export const getCropSuggestions = async (location: LocationData, soilType: string, language: string = 'en'): Promise<string[]> => {
 return apiRetry(async () => {
   const prompt = `Suggest 5 high-yield crops suitable for ${soilType} soil at lat: ${location.latitude}, lng: ${location.longitude}.`;
   const response = await ai.models.generateContent({
     model: 'gemini-3-flash-preview',
     contents: [{ role: 'user', parts: [{ text: prompt }] }],
     config: { 
       systemInstruction: SYSTEM_INSTRUCTION(language), 
       responseMimeType: "application/json",
       responseSchema: { type: Type.OBJECT, properties: { crops: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["crops"] }
     }
   });
   return JSON.parse(response.text || '{"crops":[]}').crops;
 });
};

export const getPestOutbreakRisks = async (location: LocationData, language: string = 'en'): Promise<PestOutbreak[]> => {
  return dedupeRequest(`pest_map_${location.latitude}_${location.longitude}`, () => apiRetry(async () => {
    const prompt = `Generate a JSON list of 4 hypothetical pest outbreak hotspots near lat:${location.latitude}, lng:${location.longitude} based on typical regional crops and current weather.
    Each item must have: location (lat, lng offset slightly from center), radius (meters), pest_name, risk_level (High/Medium/Low), description.
    Return JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  }));
};

export const getPestEncyclopedia = async (query: string, location: LocationData, language: string = 'en'): Promise<PestGuideItem[]> => {
  return dedupeRequest(`pest_guide_${query}`, () => apiRetry(async () => {
    const prompt = `Generate a pest encyclopedia guide for "${query || 'common agricultural pests'}" relevant to lat:${location.latitude}, lng:${location.longitude}.
    Return JSON array of 5 items with: name, scientific_name, description, type (Insect/Fungus/Virus), symptoms (array), organic_control, chemical_control, prevalence_season.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION(language), responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  }));
};