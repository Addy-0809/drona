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
/**
 * Load teacher-uploaded materials from Firestore for a given subject.
 * Returns an array of text strings extracted from uploaded documents.
 */
async function loadTeacherMaterials(subjectId: string): Promise<string[]> {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const db = adminDb();
    if (!db) return [];

    const snap = await db
      .collection("teacherMaterials")
      .where("subjectId", "==", subjectId)
      .orderBy("uploadedAt", "desc")
      .limit(50)
      .get();

    if (snap.empty) return [];

    const texts: string[] = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.extractedText && typeof d.extractedText === "string" && d.extractedText.length > 10) {
        texts.push(d.extractedText);
      }
    }

    console.log(`[RAG] Loaded ${texts.length} teacher materials for: ${subjectId}`);
    return texts;
  } catch (err) {
    console.warn(`[RAG] Could not load teacher materials for ${subjectId}:`, err);
    return [];
  }
}

async function loadSubjectStore(subjectId: string): Promise<MemoryVectorStore | null> {
  // Return cached store if available
  if (storeCache.has(subjectId)) {
    return storeCache.get(subjectId)!;
  }

  const allDocs: Document[] = [];
  const filePath = path.join(KNOWLEDGE_BASE_DIR, `${subjectId}.md`);

  try {
    // 1. Load built-in knowledge base (if exists)
    if (fs.existsSync(filePath)) {
      console.log(`[RAG] Loading built-in KB for: ${subjectId}`);
      const rawText = fs.readFileSync(filePath, "utf-8");
      const kbDocs = await splitter.createDocuments(
        [rawText],
        [{ source: filePath, subjectId, type: "knowledge-base" }]
      );
      allDocs.push(...kbDocs);
      console.log(`[RAG] Built-in KB: ${kbDocs.length} chunks`);
    }

    // 2. Load teacher-uploaded materials from Firestore
    const teacherTexts = await loadTeacherMaterials(subjectId);
    for (const text of teacherTexts) {
      const teacherDocs = await splitter.createDocuments(
        [text],
        [{ source: "teacher-upload", subjectId, type: "teacher-material" }]
      );
      allDocs.push(...teacherDocs);
    }
    if (teacherTexts.length > 0) {
      console.log(`[RAG] Teacher materials added: ${teacherTexts.length} documents`);
    }

    // If no documents at all, return null
    if (allDocs.length === 0) {
      console.warn(`[RAG] No knowledge base or teacher materials found for: ${subjectId}`);
      return null;
    }

    console.log(`[RAG] Total chunks for ${subjectId}: ${allDocs.length}`);

    // Create in-memory vector store with embeddings
    const embeddings = getEmbeddings();
    const store = await MemoryVectorStore.fromDocuments(allDocs, embeddings);

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

/**
 * Invalidate the cached vector store for a subject.
 * Called after teacher uploads/deletes materials so the next query
 * re-indexes everything including the new content.
 */
export function invalidateSubjectCache(subjectId: string) {
  storeCache.delete(subjectId);
  console.log(`[RAG] Cache invalidated for: ${subjectId}`);
}
