// src/app/(app)/layout.tsx
// Layout for all authenticated pages — includes sidebar
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
