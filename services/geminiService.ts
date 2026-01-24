import { GoogleGenAI, Type } from "@google/genai";
import { ParseResult, EventType } from "../types";

// HANDLING API KEY:
// 1. Try standard process.env (Create-React-App / Node)
// 2. Try import.meta.env (Vite) - requires ts-ignore or specific config
// 3. Fallback to empty string (will throw error later)
// @ts-ignore
const API_KEY = process.env.API_KEY || (import.meta && import.meta.env ? import.meta.env.VITE_API_KEY : '') || ''; 

// Using gemini-3-flash-preview for multimodal capabilities (Text/Audio -> JSON)
const MODEL_NAME = 'gemini-3-flash-preview';

const SYSTEM_INSTRUCTION = `
You are an AI assistant for a baby tracking app called BabyLog. 
Your job is to interpret user inputs (voice audio or text) and extract structured data about baby events.
The current local time of the user is provided in the prompt. Use it to calculate exact timestamps for relative times like "10 minutes ago" or "at 8pm".

The supported event types are:
- feed (bottle, breast, amount, side)
- sleep (start time, end time if specified)
- diaper (wet, dirty, mixed, color, texture)
- symptom (cough, fever, rash, etc.)
- movement (kicks, rolling)
- measurement (weight, height, temperature)
- note (general observations)

Return a JSON object matching the requested schema. 
If information is missing, infer logically or leave fields null/undefined.
For 'details', create a flat object with relevant properties (e.g., { "side": "left", "durationMinutes": 15 }).
`;

export const GeminiService = {
  /**
   * Parses text or audio input into a structured BabyEvent.
   */
  parseInput: async (
    input: { text?: string; audioBase64?: string; mimeType?: string }
  ): Promise<ParseResult> => {
    if (!API_KEY) {
      console.error("Gemini API Key is missing. Ensure REACT_APP_API_KEY or VITE_API_KEY is set in your environment.");
      throw new Error("Missing Gemini API Key configuration.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const parts: any[] = [];
    
    // Add Audio Part if exists
    if (input.audioBase64) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType || 'audio/webm',
          data: input.audioBase64
        }
      });
      parts.push({ text: "Listen to this audio log and extract the event details." });
    }

    // Add Text Part if exists
    if (input.text) {
      parts.push({ text: input.text });
    }
    
    // Add Contextual Time (Local System Time)
    // Using toString() gives "Day Mon DD YYYY HH:MM:SS GMT-XXXX (Timezone)" 
    // This allows Gemini to know the user's actual offset.
    parts.push({ text: `Current User Time: ${new Date().toString()}` });

    // Define JSON Schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: Object.values(EventType),
          description: "The category of the event"
        },
        startTime: {
          type: Type.STRING,
          description: "ISO 8601 date string for when the event started (include timezone offset if possible, otherwise UTC)"
        },
        endTime: {
          type: Type.STRING,
          nullable: true,
          description: "ISO 8601 date string for when the event ended (if applicable)"
        },
        details: {
          type: Type.OBJECT,
          description: "Key-value pairs specific to the event type (e.g. amountml, side, status)",
          nullable: true,
          properties: {
             method: { type: Type.STRING, nullable: true },
             amountml: { type: Type.NUMBER, nullable: true },
             side: { type: Type.STRING, nullable: true },
             status: { type: Type.STRING, nullable: true },
             value: { type: Type.NUMBER, nullable: true },
             unit: { type: Type.STRING, nullable: true },
             description: { type: Type.STRING, nullable: true }
          }
        },
        notes: {
          type: Type.STRING,
          nullable: true,
          description: "Any additional natural language notes"
        }
      },
      required: ["type", "startTime"]
    };

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("No response from Gemini");

      const result = JSON.parse(jsonText) as ParseResult;

      // --- NORMALIZE TIME (Round to Minute) ---
      // We strip seconds and milliseconds to ensure clean duration calculations.
      if (result.startTime) {
        const d = new Date(result.startTime);
        d.setSeconds(0, 0);
        result.startTime = d.toISOString();
      }
      if (result.endTime) {
        const d = new Date(result.endTime);
        d.setSeconds(0, 0);
        result.endTime = d.toISOString();
      }

      return result;

    } catch (error) {
      console.error("Gemini Parse Error:", error);
      throw error;
    }
  }
};