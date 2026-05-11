// src/lib/langchain.ts
// LangChain integration — wraps Gemini API calls via LangChain's ChatGoogleGenerativeAI
// Provides prompt templates, output parsers, and chains for structured AI interactions
// RAG-aware: prompts include {subjectContext} for injected retrieval-augmented context

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

// ── LangChain-wrapped Gemini models ──────────────────────────────────────────

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/** Text-based LLM for planning, test generation, and feedback */
export const textLLM = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 8192,
  safetySettings,
});

/** Vision-capable LLM for grading handwritten answers and paper analysis */
export const visionLLM = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
  temperature: 0.3,
  topP: 0.9,
  maxOutputTokens: 8192,
  safetySettings,
});

// ── Reusable JSON output parser ─────────────────────────────────────────────

export const jsonParser = new JsonOutputParser();

// ── Prompt Templates (RAG-enhanced with {subjectContext}) ───────────────────

export const planPromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert academic tutor. You create detailed, realistic 4-week study plans for university students.
Use the following reference material to ensure your plan covers real, accurate topics and concepts.
Always respond with ONLY valid JSON, no markdown, no code fences.

REFERENCE MATERIAL:
{subjectContext}`,
  ],
  [
    "human",
    `Create a detailed 4-week study plan for a university student learning "{subjectName}".

Return ONLY valid JSON in this exact format:
{{
  "subject": "{subjectName}",
  "totalWeeks": 4,
  "weeks": [
    {{
      "weekNumber": 1,
      "title": "Week title here",
      "goal": "What student will achieve this week",
      "topics": [
        {{
          "id": "topic-id-slug",
          "name": "Topic Name",
          "description": "Brief description of the topic",
          "estimatedHours": 2,
          "day": 1
        }}
      ]
    }}
  ]
}}

Requirements:
- 4 weeks total, each with 5-7 topics
- Topics from beginner to advanced progressively
- estimatedHours between 1 and 4
- day between 1 and 7 (spread across the week)
- topic IDs must be lowercase with hyphens (slugs)
- Make it realistic for a university student
- Use ONLY topics that are accurate and present in the reference material`,
  ],
]);

export const testPromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a university exam paper setter. You create comprehensive mock tests with MCQs and short answer questions.
Use the following reference material to create accurate, factually correct questions and answers.
Always respond with ONLY valid JSON, no markdown, no code fences.

REFERENCE MATERIAL:
{subjectContext}`,
  ],
  [
    "human",
    `Create a comprehensive mock test covering the following topics in {subjectName}: {topicList}.

Return ONLY valid JSON in this exact format:
{{
  "title": "Mock Test: {subjectName}",
  "duration": 60,
  "totalMarks": 50,
  "mcqs": [
    {{
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of the correct answer",
      "marks": 2,
      "topic": "Relevant topic name"
    }}
  ],
  "shortAnswers": [
    {{
      "id": "sa1",
      "question": "Short answer question here?",
      "expectedAnswer": "Model answer that the evaluator should look for",
      "marks": 5,
      "topic": "Relevant topic name",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }}
  ]
}}

Requirements:
- Exactly 10 MCQs (each 2 marks = 20 marks total)
- Exactly 6 short answer questions (each 5 marks = 30 marks total)
- Cover all the provided topics evenly
- MCQ correctAnswer is the 0-indexed position in options array
- Questions should be university-level difficulty
- Short answers should have clear expected answers with key concepts listed
- All questions and answers MUST be factually accurate based on the reference material
- Keywords should include the most important technical terms for each answer
- Do NOT include any text outside the JSON object
- Do NOT use special characters or line breaks inside string values`,
  ],
]);

export const feedbackPromptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert educational coach. You analyse student test performance and provide detailed constructive feedback.
Use the following reference material to give accurate study recommendations grounded in real subject knowledge.
Always respond with ONLY valid JSON, no markdown, no code fences.

REFERENCE MATERIAL:
{subjectContext}`,
  ],
  [
    "human",
    `Analyse this student's test performance and provide detailed constructive feedback.

Subject: {subjectName}
Test Results: {testResults}

Return ONLY valid JSON in this exact format:
{{
  "summary": "2-3 sentence overall assessment",
  "percentage": 75,
  "grade": "B+",
  "topicAnalysis": [
    {{
      "topic": "Topic Name",
      "score": 80,
      "status": "strong",
      "recommendation": "What to do next with this topic"
    }}
  ],
  "strengths": [
    {{ "area": "Area name", "description": "Why this is a strength" }}
  ],
  "improvements": [
    {{
      "area": "Area name",
      "description": "What needs work",
      "tips": ["Specific tip 1", "Specific tip 2"]
    }}
  ],
  "studyRecommendations": [
    {{
      "priority": "high",
      "topic": "Topic name",
      "action": "Specific action to take",
      "resources": ["Resource suggestion"]
    }}
  ],
  "nextSteps": "What the student should focus on in the next week"
}}

topic status: "strong" (>= 80%), "moderate" (50-79%), "weak" (< 50%)
grade: standard letter grade A+/A/B+/B/C+/C/D/F
Be encouraging but honest. Base recommendations on the reference material.`,
  ],
]);

// ── LangChain Chains (Prompt → LLM → Parser) ───────────────────────────────

/** Study plan generation chain (RAG-aware — requires subjectContext input) */
export const planChain = planPromptTemplate.pipe(textLLM).pipe(jsonParser);

/** Mock test generation chain (RAG-aware — requires subjectContext input) */
export const testChain = testPromptTemplate.pipe(textLLM).pipe(jsonParser);

/** Feedback analysis chain (RAG-aware — requires subjectContext input) */
export const feedbackChain = feedbackPromptTemplate.pipe(textLLM).pipe(jsonParser);
