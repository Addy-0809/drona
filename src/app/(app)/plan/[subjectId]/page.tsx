"use client";
// src/app/(app)/plan/[subjectId]/page.tsx
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSubjectById } from "@/lib/subjects";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Youtube, Loader2, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";

interface Topic {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  day: number;
}

interface Week {
  weekNumber: number;
  title: string;
  goal: string;
  topics: Topic[];
}

interface Plan {
  subject: string;
  totalWeeks: number;
  weeks: Week[];
}

export default function PlanPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = getSubjectById(subjectId);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, subjectName: subject?.name }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error ${res.status}`);
      }
      const data = await res.json();
      if (!data.plan) {
        throw new Error("No plan data received from AI");
      }
      setPlan(data.plan);
      setPlanId(data.planId);
    } catch (e) {
      console.error("Failed to load plan:", e);
      setError(e instanceof Error ? e.message : "Failed to generate study plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subject) fetchPlan();
  }, [subjectId, subject]);

  const toggleTopic = (topicId: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const totalTopics = plan?.weeks.flatMap((w) => w.topics).length ?? 0;
  const progressPct = totalTopics ? Math.round((completedTopics.size / totalTopics) * 100) : 0;

  if (!subject) return <div className="p-8 text-red-400">Subject not found.</div>;

  return (
    <div className="min-h-screen mesh-bg p-8">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className={`inline-flex items-center gap-2 text-3xl mb-3`}>
          <span>{subject.icon}</span>
          <h1 className="text-4xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className={`bg-gradient-to-r ${subject.gradient} bg-clip-text text-transparent`}>
              {subject.shortName}
            </span>{" "}
            Study Plan
          </h1>
        </div>
        <p className="text-slate-400 mb-4">{subject.description}</p>

        {/* PROGRESS */}
        {plan && (
          <div className="glass rounded-xl p-4 max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Overall Progress</span>
              <span className="text-indigo-400 font-semibold">{completedTopics.size}/{totalTopics} topics</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">{progressPct}% complete</span>
              {progressPct === 100 && (
                <Link href={`/test/${subjectId}?planId=${planId}`} className="text-xs text-emerald-400 flex items-center gap-1">
                  <Trophy size={12} /> Take the test!
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <BookOpen size={20} className="absolute inset-0 m-auto text-indigo-400" />
          </div>
          <p className="text-slate-400">Gemini AI is creating your personalised study plan...</p>
          <p className="text-slate-600 text-sm">This may take 15-30 seconds</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="max-w-md mx-auto py-16 text-center">
          <div className="glass rounded-2xl p-8 border border-red-500/20">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Failed to Generate Plan</h3>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button onClick={fetchPlan} className="btn-primary text-sm py-2 px-6" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* WEEKS ACCORDION */}
      {plan && (
        <div className="space-y-4 max-w-3xl">
          {plan.weeks.map((week) => {
            const weekTopicIds = week.topics.map((t) => t.id);
            const weekCompleted = weekTopicIds.filter((id) => completedTopics.has(id)).length;
            const weekPct = Math.round((weekCompleted / week.topics.length) * 100);
            const isOpen = expandedWeek === week.weekNumber;

            return (
              <motion.div
                key={week.weekNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: week.weekNumber * 0.1 }}
                className="card overflow-hidden"
              >
                {/* WEEK HEADER */}
                <button
                  id={`week-${week.weekNumber}-toggle`}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/3 transition-colors"
                  onClick={() => setExpandedWeek(isOpen ? 0 : week.weekNumber)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-gradient-to-br ${subject.gradient} shrink-0`}>
                    W{week.weekNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{week.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{week.goal}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{weekCompleted}/{week.topics.length}</p>
                      <p className="text-xs text-indigo-400">{weekPct}%</p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </button>

                {/* WEEK PROGRESS BAR */}
                <div className="px-5 pb-1">
                  <div className="progress-bar" style={{ height: "3px" }}>
                    <div className="progress-fill" style={{ width: `${weekPct}%` }} />
                  </div>
                </div>

                {/* TOPICS LIST */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-3 space-y-3 border-t border-white/5">
                        {week.topics.map((topic) => {
                          const done = completedTopics.has(topic.id);
                          return (
                            <div
                              key={topic.id}
                              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${done ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-white/2 border border-white/5"}`}
                            >
                              <button
                                id={`topic-check-${topic.id}`}
                                onClick={() => toggleTopic(topic.id)}
                                className="mt-0.5 shrink-0"
                              >
                                {done
                                  ? <CheckCircle2 size={20} className="text-emerald-400" />
                                  : <Circle size={20} className="text-slate-600" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${done ? "text-slate-400 line-through" : "text-white"}`}>
                                  Day {topic.day}: {topic.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                                <p className="text-xs text-slate-600 mt-1">~{topic.estimatedHours}h</p>
                              </div>
                              <Link
                                href={`/resources/${topic.id}?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(subject.name)}`}
                                id={`topic-resources-${topic.id}`}
                                className="shrink-0 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Youtube size={14} />
                                Videos
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
