// src/lib/rag.ts
// RAG (Retrieval-Augmented Generation) infrastructure for Drona
// Loads subject knowledge bases, chunks them, embeds into in-memory vector store,
// and provides context retrieval for grounding LLM outputs in real subject material.

import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEmbeddings } from "./embeddings";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import * as path from "path";

// ── Cache: one vector store per subject (lazy-loaded) ───────────────────────
const storeCache = new Map<string, MemoryVectorStore>();
const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), "src", "data", "knowledge-base");

// Text splitter tuned for academic content — moderate chunk size with overlap
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1200,
  chunkOverlap: 250,
  separators: ["\n## ", "\n### ", "\n#### ", "\n\n", "\n", ". ", " "],
});

/**
 * Load and index the knowledge base for a given subject.
 * Returns a cached MemoryVectorStore if already loaded.
 */
async function loadSubjectStore(subjectId: string): Promise<MemoryVectorStore | null> {
  // Return cached store if available
  if (storeCache.has(subjectId)) {
    return storeCache.get(subjectId)!;
  }

  const filePath = path.join(KNOWLEDGE_BASE_DIR, `${subjectId}.md`);

  // Check if knowledge base file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`[RAG] No knowledge base found for subject: ${subjectId}`);
    return null;
  }

  try {
    console.log(`[RAG] Loading knowledge base for: ${subjectId}`);
    const rawText = fs.readFileSync(filePath, "utf-8");

    // Split into chunks
    const docs = await splitter.createDocuments(
      [rawText],
      [{ source: filePath, subjectId }]
    );

    console.log(`[RAG] Created ${docs.length} chunks for ${subjectId}`);

    // Create in-memory vector store with embeddings
    const embeddings = getEmbeddings();
    const store = await MemoryVectorStore.fromDocuments(docs, embeddings);

    // Cache it
    storeCache.set(subjectId, store);
    console.log(`[RAG] Vector store cached for: ${subjectId}`);

    return store;
  } catch (err) {
    console.error(`[RAG] Failed to load knowledge base for ${subjectId}:`, err);
    return null;
  }
}

/**
 * Retrieve relevant context from the knowledge base for a subject.
 *
 * @param subjectId - The subject identifier (matches filename in knowledge-base/)
 * @param query - The search query (e.g. topic name, question text)
 * @param topK - Number of most relevant chunks to retrieve (default: 5)
 * @returns Concatenated context string, or empty string if no KB available
 */
export async function retrieveContext(
  subjectId: string,
  query: string,
  topK: number = 5
): Promise<string> {
  try {
    const store = await loadSubjectStore(subjectId);
    if (!store) return "";

    const results: Document[] = await store.similaritySearch(query, topK);

    if (results.length === 0) return "";

    // Format retrieved chunks with separators
    const context = results
      .map((doc, i) => `[Reference ${i + 1}]\n${doc.pageContent}`)
      .join("\n\n---\n\n");

    console.log(`[RAG] Retrieved ${results.length} chunks for query: "${query.slice(0, 60)}..."`);
    return context;
  } catch (err) {
    console.error(`[RAG] Retrieval error for ${subjectId}:`, err);
    return "";
  }
}

/**
 * Retrieve context for multiple queries at once (e.g. a list of topics).
 * De-duplicates chunks across queries.
 */
export async function retrieveMultiContext(
  subjectId: string,
  queries: string[],
  topKPerQuery: number = 3
): Promise<string> {
  try {
    const store = await loadSubjectStore(subjectId);
    if (!store) return "";

    const seenContent = new Set<string>();
    const allDocs: Document[] = [];

    for (const query of queries) {
      const results = await store.similaritySearch(query, topKPerQuery);
      for (const doc of results) {
        // De-duplicate by first 100 chars
        const key = doc.pageContent.slice(0, 100);
        if (!seenContent.has(key)) {
          seenContent.add(key);
          allDocs.push(doc);
        }
      }
    }

    if (allDocs.length === 0) return "";

    const context = allDocs
      .slice(0, 12) // Cap at 12 unique chunks
      .map((doc, i) => `[Reference ${i + 1}]\n${doc.pageContent}`)
      .join("\n\n---\n\n");

    console.log(`[RAG] Multi-query retrieved ${allDocs.length} unique chunks for ${subjectId}`);
    return context;
  } catch (err) {
    console.error(`[RAG] Multi-retrieval error for ${subjectId}:`, err);
    return "";
  }
}

/** Clear cached vector store for a subject (useful for hot-reload) */
export function clearSubjectCache(subjectId?: string) {
  if (subjectId) {
    storeCache.delete(subjectId);
  } else {
    storeCache.clear();
  }
}
