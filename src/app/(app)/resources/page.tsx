// src/app/(app)/resources/page.tsx
// Redirect /resources to /subjects 
import { redirect } from "next/navigation";
export default function ResourcesIndexPage() {
  redirect("/subjects");
}
