// src/app/(app)/layout.tsx
// Layout for all authenticated pages — horizontal top navbar + ethnic beige theme
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="app-inner" style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fdf6e3 0%, #f8eec8 40%, #fdf0d5 100%)",
      color: "#3d2f0d",
    }}>
      <Navbar />
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {children}
      </main>
    </div>
  );
}
