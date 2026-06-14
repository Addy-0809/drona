// src/lib/static-plans.ts
// Pre-generated study plans — ONE plan per subject, identical for every user.
//
// Study plans are the same for everyone, so instead of generating them with the
// LLM on every request (~15-30s wait + token cost), they are generated ONCE by
// `npm run seed:plans` (see scripts/seed-plans.ts) and committed as JSON. Serving
// them from this static module makes the plan endpoint instant and removes the
// per-request LLM dependency entirely — it works even when the Firestore Admin
// SDK is unavailable on Vercel.
//
// To (re)generate plans: run `npm run seed:plans`, then commit the updated
// src/lib/static-plans.data.json.

import plansData from "./static-plans.data.json";

export interface PlanTopic {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  day: number;
}

export interface PlanWeek {
  weekNumber: number;
  title: string;
  goal: string;
  topics: PlanTopic[];
}

export interface StudyPlan {
  subject: string;
  totalWeeks: number;
  weeks: PlanWeek[];
}

/** Map of subjectId → pre-generated study plan. Populated by the seed script. */
export const STATIC_PLANS = plansData as Record<string, StudyPlan>;

/** Returns the pre-generated plan for a subject, or undefined if not seeded. */
export function getStaticPlan(subjectId: string): StudyPlan | undefined {
  return STATIC_PLANS[subjectId];
}
