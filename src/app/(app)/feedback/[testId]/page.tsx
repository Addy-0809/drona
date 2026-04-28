"use client";
// src/app/(app)/feedback/[testId]/page.tsx
// Feedback report with Recharts radar chart
// Fetches actual test results from Firestore + localStorage MCQ answers
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
        // ── 1. Try to get pre-computed scores from localStorage (saved by results page) ──
        let actualResults: Record<string, unknown> | null = null;
        let subjectName = "Selected Subject";

        try {
          const saved = localStorage.getItem(`feedbackScores_${testId}`);
          if (saved) {
            const scores = JSON.parse(saved);
            // Get subject name from test-data if available
            try {
              const testRes = await fetch(`/api/agent/test-data?testId=${testId}`);
              if (testRes.ok) {
                const td = await testRes.json();
                if (td.subjectName) subjectName = td.subjectName;
              }
            } catch { /* non-fatal */ }

            actualResults = {
              score: scores.score,
              total: scores.total,
              percentage: scores.percentage,
              mcqScore: scores.mcqScore,
              mcqMax: scores.mcqMax,
              mcqCorrect: scores.mcqCorrect,
              mcqTotal: scores.mcqTotal,
              shortAnswerScore: scores.shortAnswerScore,
              shortAnswerMax: scores.shortAnswerMax,
              topicBreakdown: scores.topicBreakdown,
              topics: scores.topics,
            };
            console.log("[feedback] Using pre-computed scores from localStorage:", actualResults);
          }
        } catch { /* non-fatal */ }

        // ── 2. Fallback: reconstruct from API calls if localStorage is empty ──
        if (!actualResults) {
          console.log("[feedback] No localStorage scores, reconstructing from APIs...");

          // Fetch test questions
          let testData: { test?: { mcqs?: Array<{ id: string; correctAnswer: number; marks: number; topic: string }>; shortAnswers?: Array<{ id: string; marks: number; topic: string }>; totalMarks?: number }; subjectName?: string } = {};
          try {
            const testRes = await fetch(`/api/agent/test-data?testId=${testId}`);
            if (testRes.ok) testData = await testRes.json();
          } catch { /* non-fatal */ }

          if (testData.subjectName) subjectName = testData.subjectName;

          // Get MCQ answers from localStorage
          let mcqAnswers: Record<string, number> = {};
          try {
            const saved = localStorage.getItem(`mcqAnswers_${testId}`);
            if (saved) mcqAnswers = JSON.parse(saved);
          } catch { /* non-fatal */ }

          // Get grading results from testResults collection
          let gradingData: { totalScore?: number; maxScore?: number } | null = null;
          let storedMcqScore: number | null = null;
          let storedMcqMax: number | null = null;
          try {
            const gradeRes = await fetch(`/api/agent/test-results?testId=${testId}`);
            if (gradeRes.ok) {
              const gd = await gradeRes.json();
              gradingData = gd.grading || null;
              if (gd.mcqScore !== undefined) storedMcqScore = gd.mcqScore;
              if (gd.mcqMax !== undefined) storedMcqMax = gd.mcqMax;
            }
          } catch { /* non-fatal */ }

          // Calculate MCQ score
          const mcqs = testData.test?.mcqs || [];
          let mcqScore = 0;
          let mcqMax = 0;
          const topicScores: Record<string, { earned: number; max: number }> = {};

          if (Object.keys(mcqAnswers).length > 0 && mcqs.length > 0) {
            for (const q of mcqs) {
              mcqMax += q.marks;
              if (!topicScores[q.topic]) topicScores[q.topic] = { earned: 0, max: 0 };
              topicScores[q.topic].max += q.marks;
              const chosen = mcqAnswers[q.id];
              if (chosen !== undefined && chosen === q.correctAnswer) {
                mcqScore += q.marks;
                topicScores[q.topic].earned += q.marks;
              }
            }
          } else if (storedMcqScore !== null) {
            mcqScore = storedMcqScore;
            mcqMax = storedMcqMax ?? mcqs.reduce((s, q) => s + q.marks, 0);
          } else {
            mcqMax = mcqs.reduce((s, q) => s + q.marks, 0);
          }

          const saScore = gradingData?.totalScore ?? 0;
          const saMax = gradingData?.maxScore ?? (testData.test?.shortAnswers || []).reduce((s, q) => s + q.marks, 0);
          const totalScore = mcqScore + saScore;
          const totalMax = mcqMax + saMax;
          const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

          const topicBreakdown = Object.entries(topicScores).map(([topic, scores]) => ({
            topic, earned: scores.earned, max: scores.max,
            percentage: scores.max > 0 ? Math.round((scores.earned / scores.max) * 100) : 0,
          }));

          actualResults = {
            score: totalScore, total: totalMax, percentage,
            mcqScore, mcqMax,
            mcqCorrect: mcqs.filter(q => mcqAnswers[q.id] !== undefined && mcqAnswers[q.id] === q.correctAnswer).length,
            mcqTotal: mcqs.length,
            shortAnswerScore: saScore, shortAnswerMax: saMax,
            topicBreakdown,
            topics: topicBreakdown.map(t => t.topic),
          };
          console.log("[feedback] Reconstructed results from APIs:", actualResults);
        }

        // ── 3. Send to feedback agent ────────────────────────────────────
        console.log("[feedback] Sending to feedback agent:", { subjectName, actualResults });

        const res = await fetch("/api/agent/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId, subjectName, testResults: actualResults }),
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
                      formatter={(val: unknown) => [`${Number(val)}%`, "Score"]}
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
