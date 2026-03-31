import { GoogleGenAI, Type } from "@google/genai";
import { JikboData } from "./types";

export const generateJikboData = async (
  apiKey: string,
  base64File: string,
  mimeType: string,
  userInstruction: string
): Promise<JikboData> => {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert Korean middle school English teacher creating a "Jikbo" (Exam Last Minute Review) document.
  Analyze the provided textbook PDF/Image materials.
  Extract content to fill a strict JSON schema for a review sheet.
  
  Language: Korean (for explanations/definitions) and English (for content).
  
  Structure requirements:
  1. Vocabulary: 
     - Select the top 10 most important words for Synonyms.
     - Select the top 10 most important words for Antonyms.
     - Select the top 10 most important Idioms/Collocations. **IMPORTANT: Provide the meaning for each collocation.**
     - Select the top 10 most important words for Definitions.
     - Focus on high-frequency exam words.
  2. Dialog: Identify 2 key communicative functions (Listen & Talk), their variations, and correct/incorrect responses.
  3. Grammar: Identify the 2 main grammar points of the lesson. Provide construction rules and examples.
  4. Reading: **Do NOT extract the full passage.** Instead, select 10 to 15 key sentences from the main text.
     - Prioritize sentences that contain the lesson's key grammar points.
     - Prioritize sentences that are crucial for understanding the story flow.
     - Provide the English sentence, a Korean translation, and a brief grammar point/note.
  
  If the file contains multiple lessons, focus on the lesson mentioned in the user instruction or the first full lesson found.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64File,
          },
        },
        {
          text: `Generate Jikbo data. Context: ${userInstruction}. Return ONLY JSON.`,
        },
      ],
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meta: {
            type: Type.OBJECT,
            properties: {
              publisher: { type: Type.STRING, description: "e.g., 동아(윤)" },
              grade: { type: Type.STRING, description: "e.g., 2" },
              lesson: { type: Type.STRING, description: "e.g., Lesson 08" },
              schoolLevel: { type: Type.STRING, description: "e.g., MIDDLE SCHOOL" },
            },
          },
          vocab: {
            type: Type.OBJECT,
            properties: {
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g., 'royal(왕의) = regal'" },
              antonyms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g., 'allow(허락하다) ↔ forbid(금지하다)'" },
              collocations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    expression: { type: Type.STRING, description: "e.g., a few ~" },
                    meaning: { type: Type.STRING, description: "e.g., 몇몇의" },
                  },
                },
                description: "Idioms or phrases with meaning",
              },
              definitions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    enDefinition: { type: Type.STRING },
                  },
                },
              },
            },
          },
          dialog: {
            type: Type.OBJECT,
            properties: {
              part1: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  mainExpression: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  variations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  responseGood: { type: Type.ARRAY, items: { type: Type.STRING } },
                  responseBad: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
              part2: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  mainExpression: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  variations: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
              extra: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    expression: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                },
              },
            },
          },
          grammar: {
            type: Type.OBJECT,
            properties: {
              point1: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  construction: { type: Type.STRING },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        en: { type: Type.STRING },
                        ko: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
              point2: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  construction: { type: Type.STRING },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        en: { type: Type.STRING },
                        ko: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
          },
          reading: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              paragraphs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    ko: { type: Type.STRING },
                    grammarNote: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  try {
    return JSON.parse(text) as JikboData;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("Invalid JSON format from Gemini");
  }
};