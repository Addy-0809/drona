// src/app/(app)/test/page.tsx
// Redirect /test → /subjects
import { redirect } from "next/navigation";
export default function TestIndexPage() {
  redirect("/subjects");
}
