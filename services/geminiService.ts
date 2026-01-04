// ... existing imports
import { GoogleGenAI, Type } from "@google/genai";
import { LocationData, GroundingChunk } from "../types";
import { LANGUAGES } from "../translations";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (code: string) => {
    return LANGUAGES.find(l => l.code === code)?.name || 'English';
};

// Helper to inject language instruction
const getSystemInstruction = (lang: string) => `You are AgriWise, an expert agricultural advisor for farmers. 
Your goal is to provide practical, localized, and actionable advice.
- Prioritize organic and sustainable practices where possible, but give conventional options if effective.
- Be concise. Farmers are busy.
- If location data is provided, use it to tailor weather and soil advice.
- Use metric units (Celsius, Hectares, Liters) unless the user specifically asks for Imperial.
- Format responses with clear headings and bullet points.
- IMPORTANT: Provide your ENTIRE response in ${getLanguageName(lang)} language.`;

/**
 * Chat with the advisor using Search Grounding
 */
export const chatWithAdvisor = async (
  message: string, 
  history: { role: string; parts: { text: string }[] }[],
  location?: LocationData,
  language: string = 'en'
): Promise<{ text: string; sources: GroundingChunk[] }> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    let prompt = message;
    if (location) {
      prompt += `\n\n(Context: User is located at Lat: ${location.latitude}, Lng: ${location.longitude})`;
    }
    prompt += `\n(Please reply in ${getLanguageName(language)})`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: getSystemInstruction(language),
        tools: [{ googleSearch: {} }] 
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text || "I couldn't generate a response. Please try again.",
      sources: groundingChunks as GroundingChunk[]
    };
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

/**
 * Diagnose crop disease from an image and/or symptoms
 */
export const diagnoseCrop = async (
  image: { data: string; mimeType: string } | null,
  symptoms: string,
  language: string = 'en'
): Promise<string> => {
  try {
    const hasImage = !!image;
    const model = hasImage ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';

    const parts: any[] = [];
    
    if (image) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    let prompt = `Act as an expert plant pathologist and agricultural advisor. Response Language: ${getLanguageName(language)}. `;
    if (hasImage) {
        prompt += "Identify this plant and analyze it for pests, diseases, or nutrient deficiencies based on the visual evidence in the image.";
    }
    if (symptoms) {
        prompt += `\nFarmer's observed symptoms: "${symptoms}".`;
    }
    
    prompt += `\nProvide a comprehensive diagnosis report in ${getLanguageName(language)} including:
    1. **Identification**: Common Name and Scientific Name.
    2. **Severity Assessment**: Mild, Moderate, or Severe.
    3. **Analysis**: Key characteristics and symptoms.
    4. **Control Methods**: Organic and IPM methods.
    5. **External Resources**: 2-3 links.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts }
    });

    return response.text || "Could not generate a diagnosis.";
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw error;
  }
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

/**
 * Analyze soil data
 */
export const analyzeSoil = async (
  soilData: {
    crop: string;
    ph: string;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    type: string;
    organicMatter?: string;
    boron?: string;
    copper?: string;
    magnesium?: string;
    micronutrients?: string;
  },
  location?: LocationData,
  language: string = 'en'
): Promise<SoilAnalysisResult> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const prompt = `Act as an expert agronomist. Analyze soil test results for: ${soilData.crop || 'General Crops'}.
    Language: ${getLanguageName(language)}.

    Soil Parameters:
    - Soil Texture: ${soilData.type}
    - pH Level: ${soilData.ph}
    - Organic Matter: ${soilData.organicMatter || 'Not provided'}
    - Nitrogen (N): ${soilData.nitrogen}
    - Phosphorus (P): ${soilData.phosphorus}
    - Potassium (K): ${soilData.potassium}
    - Magnesium (Mg): ${soilData.magnesium || 'Not provided'}
    - Boron (B): ${soilData.boron || 'Not provided'}
    - Copper (Cu): ${soilData.copper || 'Not provided'}
    - Other Micronutrients: ${soilData.micronutrients || 'Not provided'}
    ${location ? `- Location: Lat ${location.latitude}, Lng ${location.longitude}` : ''}

    Tasks:
    1. Search for typical/optimal N-P-K and OM requirements for ${soilData.crop}.
    2. Provide a detailed soil management plan including pH adjustment, OM management, and Fertilization Strategy.
    3. Normalize N, P, K values (0-100 scale) based on sufficiency for the crop.
    4. Calculate Soil Health Score (0-100). IMPORTANT: Heavily weight Organic Matter content (if provided) and pH suitability in this score.
    5. Evaluate Micronutrients (Boron, Copper, Magnesium) if provided and include in analysis.
    
    Return JSON format. Ensure text fields 'analysis', 'companion_advice', 'typical_n', 'typical_p', 'typical_k' are in ${getLanguageName(language)}.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(language),
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: `Detailed analysis in ${getLanguageName(language)}` },
            typical_n: { type: Type.STRING },
            typical_p: { type: Type.STRING },
            typical_k: { type: Type.STRING },
            normalized_n: { type: Type.NUMBER },
            normalized_p: { type: Type.NUMBER },
            normalized_k: { type: Type.NUMBER },
            health_score: { type: Type.NUMBER },
            companion_advice: { type: Type.STRING, description: `Advice in ${getLanguageName(language)}` },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from advisor");
    
    return JSON.parse(text) as SoilAnalysisResult;
  } catch (error) {
    console.error("Soil Analysis Error:", error);
    throw error;
  }
};

export interface Supplier {
  name: string;
  type: string;
  address?: string;
  phone?: string;
  hours?: string;
  distance_km: number;
  direction: string;
  description: string;
}

/**
 * Find nearby suppliers
 */
export const findSuppliers = async (
  query: string,
  location: LocationData,
  language: string = 'en'
): Promise<{ suppliers: Supplier[]; sources: GroundingChunk[] }> => {
  try {
    const model = 'gemini-2.5-flash';

    // Note: Search queries to Maps often work best in English or local script, 
    // but the output description should be in user language.
    const response = await ai.models.generateContent({
      model,
      contents: `Find 5-7 best places for: ${query} near Lat ${location.latitude}, Lng ${location.longitude}. 
      Return a JSON list of suppliers. 
      Translate descriptions and types to ${getLanguageName(language)}.
      For each, provide: name, type, address, phone, hours, distance_km, direction, description.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        },
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
                  hours: { type: Type.STRING },
                  distance_km: { type: Type.NUMBER },
                  direction: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (!text) return { suppliers: [], sources: groundingChunks as GroundingChunk[] };

    const data = JSON.parse(text);
    return {
      suppliers: data.suppliers || [],
      sources: groundingChunks as GroundingChunk[]
    };
  } catch (error) {
    console.error("Maps Error:", error);
    throw error;
  }
};

/**
 * Get irrigation advice
 */
export const getIrrigationAdvice = async (
    data: { crop: string; stage: string; moisture: number; rainSensor: number },
    location: LocationData,
    language: string = 'en'
  ): Promise<string> => {
    try {
      const model = 'gemini-3-flash-preview';
      const prompt = `Act as an irrigation expert. 
      Crop: ${data.crop}
      Growth Stage: ${data.stage}
      Current Soil Moisture Level: ${data.moisture}%
      Rain Sensor: ${data.rainSensor} mm
      Location: ${location.latitude}, ${location.longitude}
      
      Output Language: ${getLanguageName(language)}.

      Task:
      1. Check real-time weather.
      2. Analyze water needs.
      3. Provide specific watering recommendation.
      `;
  
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: getSystemInstruction(language),
          tools: [{ googleSearch: {} }] 
        }
      });
  
      return response.text || "Unable to generate irrigation advice.";
    } catch (error) {
      console.error("Irrigation Error:", error);
      throw error;
    }
};

export interface CropPlanResult {
    analysis: string;
    recommendations?: { name: string; match_score: number; key_benefit: string }[];
    rotation_plan?: { 
      period: string; 
      crop: string; 
      reason: string;
      nutrient_impact: string; 
      pest_break: string;
      yield_impact: string;
    }[];
    companions?: { name: string; role: string; benefit: string }[];
    avoid?: { name: string; reason: string }[];
    calendar?: { month: string; tasks: string[] }[];
}

/**
 * Plan crop strategy
 */
export const planCropStrategy = async (
    data: { 
      mode: 'recommend' | 'rotation' | 'companion' | 'calendar';
      soilType: string; 
      filters?: string[]; 
      cropInput?: string; 
    },
    location: LocationData,
    language: string = 'en'
  ): Promise<CropPlanResult> => {
    try {
      const model = 'gemini-3-flash-preview';
      
      let prompt = `You are an expert local agronomist acting for a farmer at coordinates: ${location.latitude}, ${location.longitude}.
      Current Date: ${new Date().toLocaleDateString()}.
      Soil Profile: ${data.soilType}.
      IMPORTANT: All output text (analysis, reasons, benefits, tasks) must be in ${getLanguageName(language)}.
      \n`;

      let schema: any;

      switch (data.mode) {
        case 'recommend':
          prompt += `OBJECTIVE: Recommend top 3-5 crops.
          Constraints: Soil ${data.soilType}, Filters: ${data.filters?.join(', ') || 'None'}.
          If 'Pest Resistant' filter is active, prioritize resistant crops for local pests.
          Research local markets and weather.
          Output JSON. 'key_benefit' should be in ${getLanguageName(language)}.
          `;
          
          schema = {
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
                             key_benefit: { type: Type.STRING }
                         }
                     }
                 }
             }
          };
          break;
        
        case 'rotation':
          prompt += `Task: Create a 3-4 year scientifically optimized crop rotation plan starting from ${data.cropInput || 'a standard regional crop'}.
          
          SCIENTIFIC STRATEGY: Implement a Strict Nutrient Balancing Cycle:
          1. Heavy Feeders (e.g., Corn, Tomatoes, Brassicas) -> Deplete Nitrogen (-N).
          2. Light Feeders/Root Crops (e.g., Carrots, Onions) -> Scavenge remaining nutrients.
          3. Nitrogen Fixers (e.g., Beans, Peas, Cover Crops) -> Restore Nitrogen (+N) and Soil Health.
          
          Identify the starting crop type and choose the NEXT crop in this cycle. 
          Also ensure botanical family rotation to break pest/disease cycles (e.g. don't follow Solanaceae with Solanaceae).
          
          Include DETAILED specific details for each step:
          - Nutrient Impact: detailed explanation of depletion or replenishment (e.g., "Heavy Nitrogen consumer, requires compost" or "Legume fixing ~100kg N/ha").
          - Pest Break: explain specifically how it disrupts the previous crop's pest/disease cycle.
          - Yield Impact: estimated yield benefit (percentage or qualitative) vs continuous cropping.

          Output JSON. 'reason', 'period', 'nutrient_impact', 'pest_break', and 'yield_impact' should be in ${getLanguageName(language)}.
          `;
          
          schema = {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING },
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
                }
            }
         };
          break;
        
        case 'companion':
          prompt += `Task: Suggest companion plants for: ${data.cropInput}.
          For each companion, identify its specific **Role** (e.g., Pest Repellent, Nitrogen Fixer, Trap Crop, Pollinator Attractor) and provide a **Detailed Benefit** explanation (how it helps growth or deters specific pests).
          Output JSON. 'benefit', 'role', and 'reason' should be in ${getLanguageName(language)}.
          `;
          schema = {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING },
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
                }
            }
         };
          break;
          
        case 'calendar':
          prompt += `Task: Create a planting/harvesting calendar for: ${data.cropInput}.
          Output JSON. 'month' and 'tasks' should be in ${getLanguageName(language)}.
          `;
          schema = {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING },
                calendar: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            month: { type: Type.STRING },
                            tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            }
         };
          break;
      }
  
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: getSystemInstruction(language),
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
  
      const text = response.text;
      if (!text) throw new Error("No plan generated");
      return JSON.parse(text) as CropPlanResult;

    } catch (error) {
      console.error("Crop Planner Error:", error);
      throw error;
    }
};

export interface MarketAnalysisResult {
    analysis: string;
    prices: { label: string; price: number }[];
}

/**
 * Get market analysis with structured data for charts
 */
export const getMarketAnalysis = async (
    query: string,
    category: string,
    period: string,
    location?: LocationData,
    language: string = 'en'
): Promise<MarketAnalysisResult> => {
    try {
        const model = 'gemini-3-flash-preview';
        let prompt = `Provide a market price report`;
      
        if (query) prompt += ` for ${query}`;
        else prompt += ` for staple crops`;

        if (category !== 'All') prompt += ` specifically in the ${category} category`;
        
        if (period !== 'Current') {
            prompt += `. Include historical price trends for the past ${period.toLowerCase()} to show volatility`;
        } else {
            prompt += `. List current wholesale prices`;
        }

        if (location) prompt += ` relevant to the region around coordinates ${location.latitude}, ${location.longitude}`;

        prompt += `.
        
        Output JSON Format:
        - analysis: Comprehensive text analysis in ${getLanguageName(language)}.
        - prices: Array of objects with 'label' (e.g. "Jan", "Feb" or "Week 1") and 'price' (numeric value) to represent the trend or current list.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: getSystemInstruction(language),
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
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

        const text = response.text;
        if (!text) throw new Error("No market data generated");
        return JSON.parse(text) as MarketAnalysisResult;

    } catch (error) {
        console.error("Market Data Error:", error);
        throw error;
    }
};

export interface WeatherAlert {
    type: string;
    severity: string;
    message: string;
}

/**
 * Get a quick weather summary and daily tip with alerts
 */
export const getWeatherAndTip = async (location: LocationData, language: string = 'en'): Promise<{ weather: string; tip: string; alert?: WeatherAlert }> => {
  try {
     const model = 'gemini-3-flash-preview';
     const response = await ai.models.generateContent({
       model,
       contents: `What is the current weather and a brief 3-day forecast for coordinates ${location.latitude}, ${location.longitude}? 
       Then, provide ONE short, actionable farming tip for this specific weather condition. 
       ALSO, analyze if there are any CRITICAL weather alerts for farmers (Frost, Heavy Rain, Heatwave, High Winds, Drought, Storm).
       If there is a critical alert, provide the type, severity (High/Medium/Low), and a short warning message.
       If no critical alert, set alert type to "None".

       Return JSON with keys: 'weather_summary' (max 20 words), 'farming_tip' (max 20 words), and 'alert' object.
       Translate values to ${getLanguageName(language)}.`,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.OBJECT,
           properties: {
             weather_summary: { type: Type.STRING },
             farming_tip: { type: Type.STRING },
             alert: {
               type: Type.OBJECT,
               properties: {
                 type: { type: Type.STRING },
                 severity: { type: Type.STRING },
                 message: { type: Type.STRING }
               }
             }
           }
         },
         tools: [{ googleSearch: {} }] 
       }
     });

     const jsonText = response.text;
     if (!jsonText) throw new Error("No data returned");
     
     const data = JSON.parse(jsonText);
     return {
       weather: data.weather_summary,
       tip: data.farming_tip,
       alert: data.alert
     };
  } catch (error) {
    console.error("Weather Error:", error);
    return {
      weather: "Weather data unavailable",
      tip: "Check your local forecast manually today."
    };
  }
};