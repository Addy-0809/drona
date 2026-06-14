// scripts/seed-plans.ts
// One-time generator for study plans. Runs the SAME LangGraph plan agent used in
// production for every subject, then writes the results to
// src/lib/static-plans.data.json (committed to the repo).
//
// Study plans are identical for all users, so we pre-generate them once instead of
// calling the LLM on every request. Re-run this whenever you want to refresh the
// plans, then commit the updated JSON.
//
// Usage:  npm run seed:plans
//
// Requires GEMINI_API_KEY (read from the environment or .env.local).
// Existing plans are preserved — a subject that fails to generate keeps its old
// plan rather than being wiped.

import * as fs from "fs";
import * as path from "path";

const OUT_PATH = path.join(process.cwd(), "src", "lib", "static-plans.data.json");

/** Minimal .env.local loader — sets vars BEFORE any LLM module is imported. */
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

function loadExistingPlans(): Record<string, unknown> {
  try {
    if (fs.existsSync(OUT_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    }
  } catch {
    /* fall through to empty */
  }
  return {};
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "✗ GEMINI_API_KEY not found. Set it in your environment or .env.local before running."
    );
    process.exit(1);
  }

  // Import AFTER env is loaded — langchain reads GEMINI_API_KEY at module init.
  const { SUBJECTS } = await import("../src/lib/subjects");
  const { planGraph } = await import("../src/lib/langgraph");

  const plans = loadExistingPlans();
  let ok = 0;
  let failed = 0;

  console.log(`Generating study plans for ${SUBJECTS.length} subjects...\n`);

  for (const subject of SUBJECTS) {
    process.stdout.write(`  • ${subject.name} (${subject.id}) ... `);
    try {
      const result = await planGraph.invoke({
        subjectName: subject.name,
        subjectId: subject.id,
        userId: "seed",
        completedTopics: [],
      });

      if (result.error || !result.plan) {
        console.log(`SKIPPED (${result.error ?? "no plan returned"})`);
        failed++;
        continue;
      }

      plans[subject.id] = result.plan;
      ok++;
      console.log("done");
    } catch (err) {
      console.log(`ERROR (${err instanceof Error ? err.message : String(err)})`);
      failed++;
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(plans, null, 2) + "\n", "utf-8");

  console.log(
    `\n✓ Wrote ${Object.keys(plans).length} plans to ${path.relative(process.cwd(), OUT_PATH)}` +
      ` (${ok} generated, ${failed} failed/skipped this run)`
  );
  console.log("  Commit the updated static-plans.data.json to ship the plans.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
