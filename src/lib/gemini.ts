// src/lib/gemini.ts
// Google Gemini AI client
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Text model for planning, test generation, feedback
// NOTE: gemini-1.5-pro was deprecated (404). Using gemini-2.0-flash instead.
export const textModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings,
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

// Vision model for evaluating handwritten answers and paper analysis
export const visionModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings,
  generationConfig: {
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 8192,
  },
});

export default genAI;

