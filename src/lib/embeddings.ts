// src/lib/embeddings.ts
// Google Gemini Embedding model singleton for RAG and semantic grading
// Uses text-embedding-004 for high-quality dense vector representations

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let _embeddings: GoogleGenerativeAIEmbeddings | null = null;

/** Lazy singleton — avoids re-instantiation across hot reloads */
export function getEmbeddings(): GoogleGenerativeAIEmbeddings {
  if (!_embeddings) {
    _embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }
  return _embeddings;
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 = identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
