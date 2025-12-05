
import { GoogleGenAI, Type } from "@google/genai";
import { PayrollRecord, LineType, RecordStatus } from '../types';

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
    1. Extract 'companyName', 'totalEmployees', 'estimatedNewPayroll', 'estimatedLandingDate', 'cardsIssued', 'cardSchedule', 'lastVisitDate', 'progressNotes', 'probability'.
    2. Convert relative dates (e.g., "today", "next Friday") into ISO 8601 Date strings (YYYY-MM-DD).
    3. If 'cardsIssued' is not mentioned, default to 0.
    4. 'status' should be one of "跟进中", "已落地", "无法落地". Detect intent like "failed", "gave up" for "无法落地". Default to "跟进中".
    5. 'probability' is a number from 0 to 100. If not explicitly stated, infer based on sentiment (e.g., "very likely" = 80, "uncertain" = 40). Default to 50.
    6. 'line' should default to the user's line unless explicitly stated.
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
            estimatedNewPayroll: { type: Type.NUMBER },
            estimatedLandingDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            cardsIssued: { type: Type.NUMBER },
            cardSchedule: { type: Type.STRING, description: "YYYY-MM-DD format" },
            lastVisitDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            probability: { type: Type.NUMBER, description: "0-100" },
            progressNotes: { type: Type.STRING },
            status: { type: Type.STRING, enum: [RecordStatus.FOLLOWING, RecordStatus.COMPLETED, RecordStatus.FAILED] },
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
