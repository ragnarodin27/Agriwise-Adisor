
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
- Be concise, professional, and encouraging.
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
  prices: { label: string; price: number }[];
}

export interface Supplier {
  name: string;
  type: string;
  distance_km: number;
  description: string;
  url?: string;
  address?: string;
  phone_number?: string;
  hours?: string;
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

    CRITICAL REQUIREMENT:
    In the 'analysis' Markdown, you MUST include a distinct section titled "## Long-Term Ecological Impact: Organic vs Synthetic".
    Compare the benefits of using organic amendments versus synthetic fertilizers for this specific soil case.
    Emphasize:
    - Soil Health (improving structure, water retention).
    - Biodiversity (supporting microbial life, earthworms).
    - Environmental Impact (reducing runoff, carbon sequestration).
    
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

export const findSuppliers = async (query: string, location: LocationData, language: string = 'en') => {
  return apiRetry(async () => {
    const prompt = `Find 3-5 agricultural suppliers or shops near ${location.latitude}, ${location.longitude} matching this query: "${query}".
    Include real addresses, phone numbers, and hours if available. Estimate distance from coordinates.
    Return JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
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
                  distance_km: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING },
                  address: { type: Type.STRING },
                  phone_number: { type: Type.STRING },
                  hours: { type: Type.STRING },
                },
                required: ['name', 'distance_km', 'description']
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return { 
      suppliers: parsed.suppliers || [], 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  });
};

export const chatWithAdvisor = async (message: string, history: any[], location?: LocationData, language: string = 'en') => {
  return apiRetry(async () => {
    const conversation = [
      ...history.map(h => ({
         role: h.role,
         parts: h.parts
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const locContext = location 
      ? `\nUser Location Coordinates: ${location.latitude}, ${location.longitude}. Use this to provide localized advice (weather, soil type assumptions, pests).`
      : '\nUser Location: Unknown. Advise generally or ask for location if critical.';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: conversation,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language) + locContext + 
          `\n\nROLE: You are an expert agricultural consultant. 
           TASK: Answer questions about farming, crops, pests, and soil. 
           STYLE: Professional, concise, actionable. Use lists and bold text for readability.
           GROUNDING: Use Search to find the latest data on pests, prices, or weather if asked.`,
        tools: [{ googleSearch: {} }]
      }
    });

    return { 
      text: response.text || "I was unable to generate a response. Please try again.", 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  });
};

export const diagnoseCrop = async (image: any, symptoms: string, language: string = 'en') => {
  return apiRetry(async () => {
    const parts: any[] = [{ text: `Diagnose this crop issue. Symptoms described: ${symptoms}. Provide organic treatment options. Return a Markdown report.` }];
    if (image) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION(language) 
      }
    });
    return response.text || "Diagnosis failed.";
  });
};

export const getWeatherAndTip = async (location: LocationData, language: string = 'en') => {
  return apiRetry(async () => {
    const prompt = `Current weather conditions for ${location.latitude}, ${location.longitude} and a short specific farming tip for this weather. Return JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
           type: Type.OBJECT,
           properties: {
             temperature: { type: Type.STRING },
             condition: { type: Type.STRING },
             farming_tip: { type: Type.STRING },
             alert: {
               type: Type.OBJECT,
               properties: {
                 type: { type: Type.STRING },
                 message: { type: Type.STRING },
                 severity: { type: Type.STRING, enum: ["High", "Medium", "Low", "None"] }
               }
             }
           }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const getMarketAnalysis = async (query: string, category: string, period: string, location?: LocationData, language: string = 'en'): Promise<MarketAnalysisResult> => {
  return apiRetry(async () => {
    const locStr = location ? `near ${location.latitude}, ${location.longitude}` : 'Global/Regional';
    
    const prompt = `Provide a market analysis for "${query}" ${locStr}.
    Period: ${period}.
    Focus on current prices, trends, and demand.
    
    CRITICAL: If the query involves "organic", explicitly compare organic prices vs conventional prices. 
    Highlight the "Organic Premium" (percentage increase) for these crops in the analysis.
    
    Return JSON with:
    - analysis: Markdown text summary (concise, bullet points, price comparisons).
    - prices: Array of { label: string, price: number } (use average market price estimates in local currency if possible, or USD).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            prices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as MarketAnalysisResult;
  });
};

export const planCropStrategy = async (data: any, location: LocationData, language: string = 'en'): Promise<CropPlanResult> => {
  return apiRetry(async () => {
    const isPestFilter = data.filters.includes('Pest Resistant');
    const pestInstruction = isPestFilter 
      ? "CRITICAL: The user has selected 'Pest Resistant'. You MUST use Google Search to find current/common pests for this location and crop type. Prioritize varieties with specific resistance to these local pests in your recommendations."
      : "";

    const prompt = `Generate a crop plan. Mode: ${data.mode}. Soil: ${data.soilType}. Crop: ${data.cropInput}. Filters: ${data.filters.join(', ')}.
    Location: ${location.latitude}, ${location.longitude}.
    ${pestInstruction}
    
    Return JSON with:
    - analysis: Markdown explanation.
    - recommendations: Array of { name, match_score, key_benefit, climate_fit, maturity_days, harvest_window }.
    - rotation_plan: Array of { period, crop, reason }.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
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
                  climate_fit: { type: Type.STRING },
                  maturity_days: { type: Type.NUMBER },
                  harvest_window: { type: Type.STRING }
                }
              }
            },
            rotation_plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  period: { type: Type.STRING },
                  crop: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const getIrrigationAdvice = async (data: any, location: LocationData, language: string = 'en'): Promise<string> => {
   return apiRetry(async () => {
    const prompt = `Provide precise irrigation advice. 
    Crop: ${data.crop} (${data.stage}). 
    Soil Moisture: ${data.moisture}%. 
    Recent Rain: ${data.rainSensor}mm.
    Location: ${location.latitude}, ${location.longitude}.
    
    Consider local weather forecast (temperature/humidity) to advise on:
    1. Water quantity needed today (mm/liters).
    2. Best time to water.
    3. Next watering schedule.
    
    Return response in Markdown format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "Unable to generate advice.";
   });
};
