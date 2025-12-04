import { GoogleGenAI, Type } from "@google/genai";
import { PayrollRecord, LineType, RecordStatus } from '../types';

// NOTE: In a real app, strict error handling for missing API keys is needed.
// This assumes process.env.API_KEY is available as per instructions.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const parseSmartInput = async (
  input: string, 
  userContext: { name: string, id: string, line: LineType }
): Promise<Partial<PayrollRecord>> => {
  
  const today = new Date().toISOString().split('T')[0];

  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are a data entry assistant for a bank. 
    Your task is to extract payroll reserve information from natural language text into a structured JSON object.
    
    Current Date: ${today}
    User Context: The user is ${userContext.name} from the ${userContext.line} line.

    Rules:
    1. Extract 'companyName', 'totalEmployees', 'estimatedPayroll', 'landingDate', 'cardsIssued', 'cardSchedule', 'lastVisitDate', 'progressNotes'.
    2. Convert relative dates (e.g., "today", "next Friday") into ISO 8601 Date strings (YYYY-MM-DD).
    3. If 'cardsIssued' is not mentioned, default to 0.
    4. If 'status' is implied (e.g., "finished", "done"), set it to COMPLETED, otherwise FOLLOWING.
    5. 'progressNotes' should summarize the qualitative details.
    6. 'line' should default to the user's line unless explicitly stated otherwise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            totalEmployees: { type: Type.NUMBER },
            estimatedPayroll: { type: Type.NUMBER },
            landingDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            cardsIssued: { type: Type.NUMBER },
            cardSchedule: { type: Type.STRING, description: "YYYY-MM-DD format" },
            lastVisitDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            progressNotes: { type: Type.STRING },
            status: { type: Type.STRING, enum: [RecordStatus.FOLLOWING, RecordStatus.COMPLETED, RecordStatus.PAUSED] },
            line: { type: Type.STRING, enum: [LineType.COMPANY, LineType.RETAIL, LineType.PERSONAL] }
          },
          required: ["companyName", "progressNotes"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<PayrollRecord>;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};