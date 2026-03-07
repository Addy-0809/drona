// src/app/(app)/plan/page.tsx
// Redirect /plan → /subjects when no subject is selected
import { redirect } from "next/navigation";
export default function PlanIndexPage() {
  redirect("/subjects");
}
