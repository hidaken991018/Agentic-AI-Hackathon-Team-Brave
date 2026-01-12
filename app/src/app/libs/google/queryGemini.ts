import { GoogleGenAI } from "@google/genai";

import { CONSTS } from "@/app/consts";

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_NUMBER,
  location: process.env.VERTEX_GEMINI_LOCATION,
});

export async function queryGemini<T>(responseSchema: T, prompt: string) {
  const resp = await ai.models.generateContent({
    model:
      process.env.GEMINI_MODEL || CONSTS.SETTING.GOOGLE.GEN_AI.DEFAULT_MODEL,
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
