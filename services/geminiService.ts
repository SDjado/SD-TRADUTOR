
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DocumentSummary } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeDocument(base64Image: string, targetLanguage: string): Promise<DocumentSummary> {
    const prompt = `Analyze this document. Perform OCR and provide a clear summary in ${targetLanguage}. 
    Identify the document type, sender, any due dates or financial values, the level of urgency, 
    a brief 3-5 line explanation of what it says, and a list of specific actions the user must take. 
    Format the response as JSON.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            sender: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            value: { type: Type.STRING },
            urgency: { type: Type.STRING, description: 'Low, Medium, High, or Critical' },
            briefExplanation: { type: Type.STRING },
            requiredActions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ['type', 'sender', 'urgency', 'briefExplanation', 'requiredActions']
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}') as DocumentSummary;
    } catch (e) {
      console.error("Failed to parse summary JSON", e);
      throw new Error("Could not process document summary.");
    }
  }

  async generateSpeech(text: string, language: string): Promise<ArrayBuffer> {
    // Determine a voice name based on language roughly (Gemini TTS prebuilt voices)
    // Common voices: 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
    let voiceName = 'Kore'; 
    if (language.includes('es')) voiceName = 'Puck';
    if (language.includes('ar')) voiceName = 'Zephyr';

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this clearly in ${language}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");

    return this.decodeBase64(base64Audio);
  }

  private decodeBase64(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const geminiService = new GeminiService();
