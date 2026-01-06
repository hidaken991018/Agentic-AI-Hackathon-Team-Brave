import { GoogleGenAI } from "@google/genai";

import { CONSTS } from "@/app/consts";

export async function queryGenAI<T>(responseSchema: T, prompt: string) {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.PROJECT_NUMBER,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });
  ;

  const resp = await ai.models.generateContent({
    model:
      process.env.GEN_AI_MODEL || CONSTS.SETTING.GOOGLE.GEN_AI.DEFAULT_MODEL,
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
