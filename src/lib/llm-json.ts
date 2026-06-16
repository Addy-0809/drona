// src/lib/llm-json.ts
// Robust extraction + repair of JSON returned by an LLM.
//
// Models often wrap JSON in markdown fences, add prose around it, or — most
// commonly — emit raw newlines/tabs inside string values (e.g. a question that
// spans lines or contains a code snippet). That produces
// "Unterminated string in JSON at position N". This helper strips fences,
// isolates the outermost object, and as a fallback escapes stray control
// characters that appear *inside* string literals.

/** Escape raw control characters that appear inside JSON string literals. */
function escapeControlCharsInStrings(s: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) {
      out += c;
      escaped = false;
      continue;
    }
    if (c === "\\") {
      out += c;
      escaped = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      out += c;
      continue;
    }
    if (inString && (c === "\n" || c === "\r" || c === "\t")) {
      out += c === "\n" ? "\\n" : c === "\r" ? "\\r" : "\\t";
      continue;
    }
    out += c;
  }
  return out;
}

/**
 * Parse a JSON object out of a raw LLM response. Strips markdown code fences,
 * isolates the outermost `{ … }`, and on a parse failure retries after escaping
 * stray control characters inside strings. Throws if it still can't parse.
 */
export function parseLLMJson<T = unknown>(raw: string): T {
  let text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  // Isolate the outermost JSON object — drops any prose before/after it.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // Most common cause: unescaped newlines/tabs inside string values.
    return JSON.parse(escapeControlCharsInStrings(text)) as T;
  }
}
