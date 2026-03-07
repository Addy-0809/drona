// src/app/(app)/feedback/page.tsx
// Redirect /feedback → /subjects
import { redirect } from "next/navigation";
export default function FeedbackIndexPage() {
  redirect("/subjects");
}
