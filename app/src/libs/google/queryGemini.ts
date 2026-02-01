import { GoogleGenAI } from "@google/genai";

import { getEnv } from "@/config";
import { CONSTS } from "@/consts";

let aiClient: GoogleGenAI | null = null;

async function getAIClient(): Promise<GoogleGenAI> {
  if (!aiClient) {
    const project = await getEnv("GCP_PROJECT_NUMBER");
    const location = await getEnv("VERTEX_GEMINI_LOCATION");

    aiClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }
  return aiClient;
}

export async function queryGemini<T>(responseSchema: T, prompt: string) {
  const ai = await getAIClient();
  const model =
    (await getEnv("GEMINI_MODEL")) || CONSTS.SETTING.GOOGLE.GEN_AI.DEFAULT_MODEL;

  const resp = await ai.models.generateContent({
    model,
    contents: [
      {
        role: CONSTS.SETTING.GOOGLE.GEN_AI.ROLE,
        parts: [{ text: prompt }],
      },
    ],
    config: {
      responseMimeType: CONSTS.SETTING.GOOGLE.GEN_AI.RESPONSE_TYPE,
      responseSchema,
    },
  });

  return resp.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
