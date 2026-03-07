"use client";
// src/app/(app)/dashboard/page.tsx
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Youtube, ClipboardList, BarChart2, FileUp, ArrowRight, Sparkles } from "lucide-react";

const quickActions = [
  {
    id: "choose-subject",
    href: "/subjects",
    icon: BookOpen,
    label: "Choose a Subject",
    desc: "Pick from 14 subjects and start your journey",
    gradient: "from-indigo-500 to-purple-600",
    glow: "rgba(99,102,241,0.25)",
  },
  {
    id: "study-plan",
    href: "/plan",
    icon: ClipboardList,
    label: "Study Plan",
    desc: "View your AI-generated weekly study schedule",
    gradient: "from-sky-500 to-cyan-600",
    glow: "rgba(14,165,233,0.25)",
  },
  {
    id: "resources",
    href: "/resources",
    icon: Youtube,
    label: "Resources",
    desc: "Watch curated YouTube videos for each topic",
    gradient: "from-red-500 to-rose-600",
    glow: "rgba(239,68,68,0.25)",
  },
  {
    id: "mock-test",
    href: "/test",
    icon: ClipboardList,
    label: "Mock Test",
    desc: "Take AI-generated tests and upload your answers",
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(245,158,11,0.25)",
  },
  {
    id: "feedback",
    href: "/feedback",
    icon: BarChart2,
    label: "Feedback",
    desc: "See strengths, weaknesses and improvement tips",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.25)",
  },
  {
    id: "paper-upload",
    href: "/paper",
    icon: FileUp,
    label: "Upload Paper",
    desc: "Upload a university paper — get a mock version",
    gradient: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.25)",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";

  return (
    <div className="min-h-screen mesh-bg p-8">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-indigo-400" />
          <span className="text-indigo-400 text-sm font-medium">AI Learning Platform</span>
        </div>
        <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Welcome back, <span className="gradient-text">{firstName}!</span>
        </h1>
        <p className="text-slate-400">What would you like to study today?</p>
      </motion.div>

      {/* QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              href={action.href}
              id={action.id}
              className="card glass-hover p-6 flex flex-col gap-4 group h-full block"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${action.gradient.replace("from-", "").split(" to-").map(() => "").join(",")})`,
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  boxShadow: `0 8px 24px ${action.glow}`,
                }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.gradient}`}>
                  <action.icon size={22} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{action.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{action.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-sm group-hover:text-indigo-400 transition-colors">
                <span>Open</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🚀</span> How EduAgent Works
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          {[
            ["1", "Choose Subject", "Pick from 14 subjects"],
            ["2", "AI Planning", "Get a 4-week study plan"],
            ["3", "Learn", "Watch YouTube videos per topic"],
            ["4", "Test", "Take AI-generated mock tests"],
            ["5", "Submit Answers", "Upload handwritten sheets"],
            ["6", "Get Feedback", "Improve with AI insights"],
          ].map(([num, title, desc]) => (
            <div key={num} className="flex items-start gap-3 flex-1">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                {num}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
