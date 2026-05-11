// src/lib/semantic-grader.ts
// NLP-based Semantic Answer Grading Pipeline for Drona
// Combines concept decomposition, embedding similarity, keyword matching,
// and completeness heuristics to fairly grade student answers regardless
// of phrasing, synonyms, or explanation style.

import { getEmbeddings, cosineSimilarity } from "./embeddings";
import { textLLM, jsonParser } from "./langchain";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { retrieveContext } from "./rag";

// ── Types ───────────────────────────────────────────────────────────────────

export interface GradeResult {
  marksAwarded: number;
  maxMarks: number;
  semanticScore: number;
  keywordScore: number;
  completenessScore: number;
  conceptsCovered: string[];
  conceptsMissed: string[];
  feedback: string;
}

// ── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHT_SEMANTIC = 0.60;
const WEIGHT_KEYWORD = 0.30;
const WEIGHT_COMPLETENESS = 0.10;

// ── Concept Decomposition ───────────────────────────────────────────────────

const conceptPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert at breaking down academic answers into atomic concepts.
Extract the distinct factual concepts from the given text.
Return ONLY valid JSON: {{ "concepts": ["concept 1", "concept 2", ...] }}
Each concept should be a short, self-contained factual statement.
If the text is empty, nonsensical, or says "not submitted", return {{ "concepts": [] }}.`,
  ],
  ["human", `Extract atomic concepts from this answer:\n\n"{text}"`],
]);

const conceptChain = conceptPrompt.pipe(textLLM).pipe(jsonParser);

/**
 * Break a text into atomic concepts using LLM.
 * Returns an array of concept strings.
 */
async function decomposeIntoConcepts(text: string): Promise<string[]> {
  if (!text || text.trim().length < 5) return [];
  try {
    const result = await conceptChain.invoke({ text: text.slice(0, 2000) });
    const concepts = (result as { concepts?: string[] }).concepts;
    return Array.isArray(concepts) ? concepts : [];
  } catch (err) {
    console.error("[SemanticGrader] Concept decomposition failed:", err);
    return [];
  }
}

// ── Semantic Similarity ─────────────────────────────────────────────────────

/**
 * Compute semantic coverage: how well student concepts cover expected concepts.
 * Uses pairwise cosine similarity between concept embeddings.
 * Returns { score: 0-1, covered: string[], missed: string[] }
 */
async function computeSemanticCoverage(
  studentConcepts: string[],
  expectedConcepts: string[]
): Promise<{ score: number; covered: string[]; missed: string[] }> {
  if (expectedConcepts.length === 0) return { score: 1, covered: [], missed: [] };
  if (studentConcepts.length === 0) return { score: 0, covered: [], missed: expectedConcepts };

  try {
    const embeddings = getEmbeddings();

    // Embed all concepts in batch
    const studentVecs = await embeddings.embedDocuments(studentConcepts);
    const expectedVecs = await embeddings.embedDocuments(expectedConcepts);

    const covered: string[] = [];
    const missed: string[] = [];
    let totalSim = 0;

    // For each expected concept, find the best matching student concept
    for (let i = 0; i < expectedConcepts.length; i++) {
      let bestSim = 0;
      for (let j = 0; j < studentConcepts.length; j++) {
        const sim = cosineSimilarity(expectedVecs[i], studentVecs[j]);
        if (sim > bestSim) bestSim = sim;
      }

      // Threshold: 0.70 = "covered this concept"
      if (bestSim >= 0.70) {
        covered.push(expectedConcepts[i]);
        totalSim += bestSim;
      } else {
        missed.push(expectedConcepts[i]);
        totalSim += bestSim * 0.3; // Partial credit for loosely related content
      }
    }

    const score = Math.min(1, totalSim / expectedConcepts.length);
    return { score, covered, missed };
  } catch (err) {
    console.error("[SemanticGrader] Semantic similarity failed:", err);
    return { score: 0, covered: [], missed: expectedConcepts };
  }
}

// ── Keyword Matching ────────────────────────────────────────────────────────

/**
 * Simple suffix-based stemmer for English words.
 * Strips common suffixes to normalize word forms.
 */
function simpleStem(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (w.length <= 3) return w;
  // Strip common suffixes
  for (const suffix of ["ation", "tion", "sion", "ment", "ness", "ity", "ing", "ous", "ive", "ful", "less", "able", "ible", "ally", "ily", "ly", "ed", "er", "es", "s"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      return w.slice(0, w.length - suffix.length);
    }
  }
  return w;
}

/**
 * Compute keyword match score.
 * Uses case-insensitive stemmed matching for robustness.
 * Returns score between 0 and 1.
 */
export function computeKeywordScore(studentAnswer: string, keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 1;
  if (!studentAnswer || studentAnswer.trim().length === 0) return 0;

  const answerLower = studentAnswer.toLowerCase();
  const answerStems = new Set(
    answerLower.split(/\s+/).map(simpleStem).filter(s => s.length > 0)
  );

  let matched = 0;
  for (const keyword of keywords) {
    const kwLower = keyword.toLowerCase();
    // Direct substring match
    if (answerLower.includes(kwLower)) {
      matched++;
      continue;
    }
    // Stemmed match — check if any word stem matches keyword stem
    const kwStem = simpleStem(kwLower);
    if (kwStem.length > 0 && answerStems.has(kwStem)) {
      matched++;
      continue;
    }
    // Multi-word keyword: check if all words appear
    const kwWords = kwLower.split(/\s+/);
    if (kwWords.length > 1 && kwWords.every(w => answerLower.includes(w))) {
      matched++;
    }
  }

  return matched / keywords.length;
}

// ── Completeness Heuristic ──────────────────────────────────────────────────

/**
 * Score based on answer length relative to expected answer.
 * Very short answers get penalized, but we don't require exact length match.
 */
export function computeCompletenessScore(
  studentAnswer: string,
  expectedAnswer: string
): number {
  if (!studentAnswer || studentAnswer.trim().length === 0) return 0;

  const studentLen = studentAnswer.trim().split(/\s+/).length;
  const expectedLen = Math.max(1, expectedAnswer.trim().split(/\s+/).length);

  // Ratio of student length to expected length
  const ratio = studentLen / expectedLen;

  if (ratio >= 0.8) return 1.0;      // Sufficiently detailed
  if (ratio >= 0.5) return 0.8;      // Mostly complete
  if (ratio >= 0.3) return 0.5;      // Partially complete
  if (ratio >= 0.15) return 0.3;     // Very brief
  return 0.1;                         // Barely anything
}

// ── Main Grading Function ───────────────────────────────────────────────────

/**
 * Grade a single student answer using the NLP semantic pipeline.
 *
 * Pipeline:
 *   1. Decompose expected + student answers into atomic concepts
 *   2. Compute semantic similarity between concept sets
 *   3. Compute keyword coverage
 *   4. Compute completeness score
 *   5. Weighted combination → final marks
 *   6. Generate qualitative feedback with RAG context
 */
export async function gradeAnswer(params: {
  studentAnswer: string;
  expectedAnswer: string;
  keywords: string[];
  maxMarks: number;
  question: string;
  subjectId?: string;
}): Promise<GradeResult> {
  const { studentAnswer, expectedAnswer, keywords, maxMarks, question, subjectId } = params;

  // Handle empty / not submitted
  if (!studentAnswer || studentAnswer.trim().length < 3 || studentAnswer.toLowerCase().includes("not submitted")) {
    return {
      marksAwarded: 0,
      maxMarks,
      semanticScore: 0,
      keywordScore: 0,
      completenessScore: 0,
      conceptsCovered: [],
      conceptsMissed: [],
      feedback: "No answer was provided. Please attempt this question next time.",
    };
  }

  // Step 1: Concept decomposition (parallel)
  const [studentConcepts, expectedConcepts] = await Promise.all([
    decomposeIntoConcepts(studentAnswer),
    decomposeIntoConcepts(expectedAnswer),
  ]);

  // Step 2: Semantic coverage
  const semantic = await computeSemanticCoverage(studentConcepts, expectedConcepts);

  // Step 3: Keyword matching
  const keywordScore = computeKeywordScore(studentAnswer, keywords);

  // Step 4: Completeness
  const completenessScore = computeCompletenessScore(studentAnswer, expectedAnswer);

  // Step 5: Weighted combination
  const weightedScore =
    semantic.score * WEIGHT_SEMANTIC +
    keywordScore * WEIGHT_KEYWORD +
    completenessScore * WEIGHT_COMPLETENESS;

  // Convert to marks (round to nearest 0.5)
  const rawMarks = weightedScore * maxMarks;
  const marksAwarded = Math.round(rawMarks * 2) / 2;

  // Step 6: Generate feedback
  let feedback = "";
  try {
    // Get RAG context if subject is available
    let ragContext = "";
    if (subjectId) {
      ragContext = await retrieveContext(subjectId, question, 2);
    }

    const feedbackLines: string[] = [];

    if (semantic.covered.length > 0) {
      feedbackLines.push(`Concepts well covered: ${semantic.covered.join(", ")}.`);
    }
    if (semantic.missed.length > 0) {
      feedbackLines.push(`Missing concepts: ${semantic.missed.join(", ")}.`);
    }

    const matchedKw = keywords.filter(kw => studentAnswer.toLowerCase().includes(kw.toLowerCase()));
    const missedKw = keywords.filter(kw => !studentAnswer.toLowerCase().includes(kw.toLowerCase()));
    if (matchedKw.length > 0) {
      feedbackLines.push(`Keywords mentioned: ${matchedKw.join(", ")}.`);
    }
    if (missedKw.length > 0) {
      feedbackLines.push(`Keywords missing: ${missedKw.join(", ")}.`);
    }

    if (completenessScore < 0.5) {
      feedbackLines.push("Your answer could be more detailed and thorough.");
    }

    if (ragContext) {
      feedbackLines.push(`Tip: Review the core concepts — ${ragContext.slice(0, 200)}...`);
    }

    feedback = feedbackLines.join(" ");
  } catch {
    feedback = `Score: ${marksAwarded}/${maxMarks}. Semantic coverage: ${Math.round(semantic.score * 100)}%.`;
  }

  return {
    marksAwarded: Math.max(0, Math.min(maxMarks, marksAwarded)),
    maxMarks,
    semanticScore: Math.round(semantic.score * 100) / 100,
    keywordScore: Math.round(keywordScore * 100) / 100,
    completenessScore: Math.round(completenessScore * 100) / 100,
    conceptsCovered: semantic.covered,
    conceptsMissed: semantic.missed,
    feedback,
  };
}

/**
 * Grade multiple answers in parallel with concurrency control.
 * Used for grading an entire test's short answers at once.
 */
export async function gradeAllAnswers(
  answers: Array<{
    questionId: string;
    question: string;
    studentAnswer: string;
    expectedAnswer: string;
    keywords: string[];
    maxMarks: number;
  }>,
  subjectId?: string
): Promise<Map<string, GradeResult>> {
  const results = new Map<string, GradeResult>();

  // Process 2 at a time to avoid rate limits
  const CONCURRENCY = 2;
  for (let i = 0; i < answers.length; i += CONCURRENCY) {
    const batch = answers.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((a) =>
        gradeAnswer({
          studentAnswer: a.studentAnswer,
          expectedAnswer: a.expectedAnswer,
          keywords: a.keywords,
          maxMarks: a.maxMarks,
          question: a.question,
          subjectId,
        })
      )
    );

    for (let j = 0; j < batch.length; j++) {
      results.set(batch[j].questionId, batchResults[j]);
    }
  }

  return results;
}
