// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

export const viewport: Viewport = {
  themeColor: "#B8860B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Drona — AI-Powered Learning Platform",
  description:
    "As Dronacharya guided the Pandavas, Drona's AI shapes your learning path with personalised study plans, YouTube resources, mock tests, and feedback across 14 subjects.",
  keywords: "Drona, AI education, study planner, mock tests, DSA, DBMS, university exam",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Drona" },
  openGraph: {
    title: "Drona — AI-Powered Learning Platform",
    description: "Your personal AI Guru for university exams",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
