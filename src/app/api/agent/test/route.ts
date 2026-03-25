// src/app/api/agent/test/route.ts
// Examiner Agent — generates mock test questions from completed topics
// Firestore is optional — test generation works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { textModel } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Sanitize AI-generated JSON text to prevent "Bad control character" errors.
 * Strips markdown fences, removes invisible Unicode, replaces literal control
 * characters inside strings, and trims trailing commas before ] or }.
 */
function sanitizeJsonText(raw: string): string {
  // 1. Strip markdown code fences
  let text = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  // 2. Remove BOM and zero-width chars
  text = text.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "");
  // 3. Replace control characters (0x00-0x1F) that aren't valid JSON whitespace
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  // 4. Fix unescaped newlines/tabs inside JSON string values
  let result = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      result += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
    }
    result += ch;
  }
  // 5. Remove trailing commas before ] or }
  result = result.replace(/,\s*([}\]])/g, "$1");
  return result;
}

/**
 * Try to extract JSON from text that might have extra content around it.
 * Looks for the outermost { ... } block.
 */
function extractJsonBlock(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    console.log("[test] session resolved:", JSON.stringify({ hasSession: !!session, userId: session?.user?.id, email: session?.user?.email }));
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      console.error("[test] Unauthorized — no user ID or email in session");
      return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
    }

    const { subjectId, subjectName, completedTopics } = await req.json();
    const topicList = completedTopics.join(", ");

    const basePrompt = `You are a university exam paper setter. Create a comprehensive mock test for a student who has studied the following topics in ${subjectName}: ${topicList}.

Return ONLY valid JSON in this exact format:
{
  "title": "Mock Test: ${subjectName}",
  "duration": 60,
  "totalMarks": 50,
  "mcqs": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of the correct answer",
      "marks": 2,
      "topic": "Relevant topic name"
    }
  ],
  "shortAnswers": [
    {
      "id": "sa1",
      "question": "Short answer question here?",
      "expectedAnswer": "Model answer that the evaluator should look for",
      "marks": 5,
      "topic": "Relevant topic name",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Requirements:
- Exactly 10 MCQs (each 2 marks = 20 marks total)
- Exactly 6 short answer questions (each 5 marks = 30 marks total)
- Cover all the provided topics evenly
- MCQ correctAnswer is the 0-indexed position in options array
- Questions should be university-level difficulty
- Short answers should have clear expected answers with key concepts listed
- Do NOT include any text outside the JSON object
- Do NOT use special characters or line breaks inside string values`;

    // Retry loop: try up to 2 times in case of JSON parse failure
    let test = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const prompt = attempt === 0
          ? basePrompt
          : basePrompt + "\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a raw JSON object with no markdown formatting, no code fences, and no extra text.";

        const result = await textModel.generateContent(prompt);
        const rawText = result.response.text().trim();
        console.log(`[test] Attempt ${attempt + 1} — raw response length: ${rawText.length}`);

        // Try sanitize → parse
        let jsonText = sanitizeJsonText(rawText);
        try {
          test = JSON.parse(jsonText);
        } catch {
          // Try extracting the JSON block first, then sanitize
          console.warn(`[test] Attempt ${attempt + 1} — initial parse failed, trying extraction`);
          jsonText = sanitizeJsonText(extractJsonBlock(rawText));
          test = JSON.parse(jsonText);
        }
        break; // Parse succeeded
      } catch (parseErr) {
        lastError = parseErr instanceof Error ? parseErr.message : "JSON parse failed";
        console.warn(`[test] Attempt ${attempt + 1} JSON parse failed:`, lastError);
        if (attempt === 1) {
          throw new Error(`Failed to parse AI response after 2 attempts: ${lastError}`);
        }
      }
    }

    if (!test) {
      throw new Error("No test data generated");
    }

    // Save to Firestore — optional
    let testId = `local-${Date.now()}`;
    try {
      const db = adminDb();
      if (db) {
        const { FieldValue } = await import("firebase-admin/firestore");
        const testRef = db.collection("tests").doc();
        await testRef.set({
          id: testRef.id,
          userId,
          subjectId,
          subjectName,
          completedTopics,
          test,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        });
        testId = testRef.id;
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ test, testId });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Examiner agent error:", errMsg);
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Gemini API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Gemini model not found — the model may have been deprecated."
      : `Failed to generate test: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
