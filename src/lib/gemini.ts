import { GoogleGenAI, Type } from "@google/genai";
import { MoodType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectMoodFromImage(base64Image: string): Promise<{ mood: MoodType; confidence: number; suggestions: string[] }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze the person's facial expression in this image. Detect their primary mood from this list: happy, sad, tired, stressed, calm, energetic. Also provide 3 short wellness suggestions based on this mood. Return the result as a JSON object with 'mood', 'confidence' (0-1), and 'suggestions' (array of strings).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING, enum: ["happy", "sad", "tired", "stressed", "calm", "energetic"] },
            confidence: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["mood", "confidence", "suggestions"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Image Mood Detection Error:", error);
    throw error;
  }
}

export async function detectMoodFromText(text: string): Promise<{ mood: MoodType; confidence: number; suggestions: string[] }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the mood of this text: "${text}". Detect the primary mood from this list: happy, sad, tired, stressed, calm, energetic. Also provide 3 short wellness suggestions based on this mood. Return the result as a JSON object with 'mood', 'confidence' (0-1), and 'suggestions' (array of strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING, enum: ["happy", "sad", "tired", "stressed", "calm", "energetic"] },
            confidence: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["mood", "confidence", "suggestions"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Text Mood Detection Error:", error);
    throw error;
  }
}

export async function getChatResponse(history: { role: 'user' | 'model'; parts: { text: string }[] }[], message: string) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are MoodMirror AI, an empathetic emotional and lifestyle assistant. Your goal is to help users understand and manage their emotions. Be supportive, kind, and provide practical wellness and productivity suggestions. Keep responses concise and engaging.",
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}
