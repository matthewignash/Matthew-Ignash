import { GoogleGenAI, Type } from "@google/genai";
import { LearningMap } from "../types";

// Lazy initialization of the client to avoid immediate access to process.env
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

// Define the response schema matching our UbD data structure
const CURRICULUM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bigIdea: { type: Type.STRING, description: "The central concept or narrative of the unit." },
    essentialQuestions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Open-ended questions that guide learning." 
    },
    stage1_understandings: { type: Type.STRING, description: "Enduring understandings (Big Ideas)." },
    stage1_knowledge_skills: { type: Type.STRING, description: "Specific knowledge and skills, including formulas." },
    standards: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Curriculum standards codes found in the text." }
  }
};

export const genaiService = {
  /**
   * Parses an image containing curriculum content and extracts structured UbD data.
   * Converts math formulas to Google Sheets compatible Unicode strings.
   */
  parseCurriculumImage: async (base64Image: string): Promise<Partial<LearningMap['ubdData']>> => {
    try {
      // Clean base64 string if it contains the header
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

      const client = getAiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          responseMimeType: "application/json",
          responseSchema: CURRICULUM_SCHEMA,
          systemInstruction: `You are an expert curriculum developer and mathematician. 
          Analyze the provided image of a curriculum document (e.g., AP, IB, NGSS). 
          Extract the following fields: Big Idea, Essential Questions, Understandings, and Knowledge/Skills.
          
          CRITICAL INSTRUCTION FOR MATH FORMULAS:
          - The output must be stored in a simple database or Google Sheet.
          - Do NOT use LaTeX or complex formatting.
          - Convert all mathematical formulas and chemical equations into single-line Unicode strings.
          - Use Unicode subscripts and superscripts where possible (e.g., H₂O, x², ΔH).
          - Use Greek letters directly (e.g., Δ, Σ, π, θ).
          - Example: Instead of "\\Delta H = \\Sigma", write "ΔH = Σ".
          - Example: Instead of "x squared", write "x²".
          
          If the image contains specific formulas (like Ideal Gas Law or Hess's Law), include them explicitly in the 'stage1_knowledge_skills' section.`
        },
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            },
            {
              text: "Extract the curriculum data from this image."
            }
          ]
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
      return {};
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
};