"use client";
// src/app/(app)/feedback/[testId]/page.tsx
// Feedback report with Recharts radar chart
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Lightbulb, Target } from "lucide-react";

interface Feedback {
  summary: string;
  percentage: number;
  grade: string;
  topicAnalysis: Array<{ topic: string; score: number; status: string; recommendation: string }>;
  strengths: Array<{ area: string; description: string }>;
  improvements: Array<{ area: string; description: string; tips: string[] }>;
  studyRecommendations: Array<{ priority: string; topic: string; action: string; resources: string[] }>;
  nextSteps: string;
}

export default function FeedbackPage() {
  const { testId } = useParams<{ testId: string }>();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeedback() {
      try {
        // In production: fetch from Firestore. For now generate it.
        const mockResults = { score: 75, total: 100, topics: ["Core Concepts", "Applications", "Problem Solving"] };
        const res = await fetch("/api/agent/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId, subjectName: "Selected Subject", testResults: mockResults }),
        });
        const data = await res.json();
        setFeedback(data.feedback);
      } catch (e) {
        console.error("Failed to load feedback:", e);
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, [testId]);

  const radarData = feedback?.topicAnalysis.map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + "…" : t.topic,
    score: t.score,
    fullMark: 100,
  })) ?? [];

  const gradeColor = (g: string) => {
    if (g.startsWith("A")) return "text-emerald-400";
    if (g.startsWith("B")) return "text-blue-400";
    if (g.startsWith("C")) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="text-slate-400">Generating your personalised feedback report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Performance <span className="gradient-text">Feedback</span>
        </h1>
        {feedback && <p className="text-slate-400">{feedback.summary}</p>}
      </motion.div>

      {feedback && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">
          {/* GRADE + RADAR */}
          <div className="space-y-5">
            {/* Grade card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Your Grade</h2>
                <Target size={18} className="text-indigo-400" />
              </div>
              <div className="flex items-center gap-6">
                <div className={`text-8xl font-black ${gradeColor(feedback.grade)}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {feedback.grade}
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{feedback.percentage}%</p>
                  <p className="text-slate-500 text-sm">Overall Score</p>
                </div>
              </div>
            </motion.div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card p-6">
                <h2 className="font-semibold text-white mb-4">Topic Performance</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f8fafc" }}
                      formatter={(val: number) => [`${val}%`, "Score"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* Strengths */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-5">
              <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Strong Areas
              </h3>
              <div className="space-y-3">
                {feedback.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-white">{s.area}</p>
                      <p className="text-xs text-slate-500">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Improvements */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card p-5">
              <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <TrendingDown size={16} /> Areas to Improve
              </h3>
              <div className="space-y-4">
                {feedback.improvements.map((imp, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-white mb-1">{imp.area}</p>
                    <p className="text-xs text-slate-500 mb-2">{imp.description}</p>
                    <ul className="space-y-1">
                      {imp.tips.map((tip, j) => (
                        <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">→</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-5">
              <h3 className="font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                <Lightbulb size={16} /> Study Recommendations
              </h3>
              <div className="space-y-3">
                {feedback.studyRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/2 border border-white/5">
                    <span className={`badge shrink-0 ${rec.priority === "high" ? "badge-red" : "badge-indigo"}`}>
                      {rec.priority}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{rec.topic}</p>
                      <p className="text-xs text-slate-400">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">🚀 Next Steps</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feedback.nextSteps}</p>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
