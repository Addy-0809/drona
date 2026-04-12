"use client";
// src/app/(app)/test/[subjectId]/page.tsx
// Mock test taking page — supports ?week=N for per-week tests or full syllabus
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSubjectById } from "@/lib/subjects";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Send, ClipboardList, BookOpen } from "lucide-react";

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
  topic: string;
}

interface ShortAnswer {
  id: string;
  question: string;
  expectedAnswer: string;
  marks: number;
  topic: string;
  keywords: string[];
}

interface Test {
  title: string;
  duration: number;
  totalMarks: number;
  mcqs: MCQ[];
  shortAnswers: ShortAnswer[];
}

interface Topic {
  id: string;
  name: string;
  day: number;
  description: string;
  estimatedHours: number;
}

interface Week {
  weekNumber: number;
  title: string;
  goal: string;
  topics: Topic[];
}

export default function TestPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = getSubjectById(subjectId);

  // week=N means only test week N topics; absent = full syllabus
  const weekParam = searchParams.get("week");
  const targetWeek = weekParam ? parseInt(weekParam, 10) : null;

  const [test, setTest] = useState<Test | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [testLabel, setTestLabel] = useState("Mock Test");
  const [loadingMessage, setLoadingMessage] = useState("");

  const generateTest = async (topics: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, subjectName: subject?.name, completedTopics: topics }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error ${res.status}`);
      }
      const data = await res.json();
      if (!data.test) throw new Error("No test data received from AI");
      setTest(data.test);
      setTestId(data.testId);
      setTimeLeft(data.test.duration * 60);
    } catch (e) {
      console.error("Failed to load test:", e);
      setError(e instanceof Error ? e.message : "Failed to generate test");
    } finally {
      setLoading(false);
    }
  };

  // Helper: fetch or generate a plan and return its topics for a given week (or all weeks)
  // NOTE: Returns ALL topics regardless of completion status — no study gate.
  const getTopicsFromPlan = async (weekNumber: number | null): Promise<string[]> => {
    // 1. Try to fetch existing plan from progress API
    try {
      const progressRes = await fetch(`/api/progress?subjectId=${subjectId}`);
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        const topicNameMap: Record<string, string> = progressData.topicNameMap || {};

        // If we have a plan stored, use ALL its topics (not just completed ones)
        if (progressData.plan) {
          const plan = progressData.plan as { weeks: Week[] };
          if (weekNumber !== null) {
            const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
            // Return all topics for this week regardless of completion
            if (week) return week.topics.map(t => topicNameMap[t.id] || t.name);
            // Week not found in plan — fall through to generate fresh plan below
          } else {
            // Full syllabus — all topics from plan
            return plan.weeks.flatMap(w => w.topics.map(t => topicNameMap[t.id] || t.name));
          }
        }
        // No plan stored at all — fall through to AI generation below
      }
    } catch {
      // Non-fatal — fall through to AI generation
    }

    // 2. No stored plan — generate a fresh plan via AI and use all its topics
    setLoadingMessage("Generating study plan first...");
    const planRes = await fetch("/api/agent/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, subjectName: subject?.name }),
    });
    if (!planRes.ok) throw new Error("Failed to generate study plan");
    const planData = await planRes.json();
    const plan = planData.plan as { weeks: Week[] };
    if (!plan) throw new Error("No plan data received");

    if (weekNumber !== null) {
      const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
      if (!week) throw new Error(`Week ${weekNumber} not found in generated plan`);
      return week.topics.map(t => t.name);
    }
    return plan.weeks.flatMap(w => w.topics.map(t => t.name));
  };

  // Fetch progress / plan topics, then generate test — no completion gate
  useEffect(() => {
    if (!subject) return;
    const init = async () => {
      try {
        setLoadingMessage(targetWeek ? `Preparing Week ${targetWeek} test...` : "Preparing full syllabus test...");
        const topics = await getTopicsFromPlan(targetWeek);
        if (targetWeek !== null) {
          setTestLabel(`Week ${targetWeek} Test`);
        } else {
          setTestLabel("Full Syllabus Test");
        }
        setLoadingMessage("AI is generating your questions...");
        generateTest(topics);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to prepare test");
        setLoading(false);
      }
    };
    init();
  }, [subjectId, subject, targetWeek]);

  // Countdown timer
  useEffect(() => {
    if (test && timeLeft > 0 && !submitted) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && test && !submitted) {
      handleSubmit();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [test, timeLeft, submitted]);

  const allQuestions: Array<{ type: "mcq" | "short"; data: MCQ | ShortAnswer }> = [
    ...(test?.mcqs || []).map((q) => ({ type: "mcq" as const, data: q })),
    ...(test?.shortAnswers || []).map((q) => ({ type: "short" as const, data: q })),
  ];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  function handleSubmit() {
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (testId) router.push(`/test/results/${testId}`);
  }

  const answeredCount = Object.keys(mcqAnswers).length + Object.keys(shortAnswers).filter(k => shortAnswers[k]?.trim()).length;

  if (!subject) return <div className="p-8 text-red-400">Subject not found.</div>;

  return (
    <div className="min-h-screen mesh-bg p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 className="text-3xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className={`bg-gradient-to-r ${subject.gradient} bg-clip-text text-transparent`}>
                {subject.shortName}
              </span>{" "}{testLabel}
            </h1>
            {/* Week badge */}
            {targetWeek !== null && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 12px", borderRadius: "2rem",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontSize: "0.72rem", fontWeight: 700,
              }}>
                <ClipboardList size={11} /> Week {targetWeek}
              </span>
            )}
            {targetWeek === null && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 12px", borderRadius: "2rem",
                background: "linear-gradient(135deg, #10b981, #14b8a6)",
                color: "#fff", fontSize: "0.72rem", fontWeight: 700,
              }}>
                <BookOpen size={11} /> Full Syllabus
              </span>
            )}
          </div>
          {test && <p className="text-slate-400 text-sm mt-1">{test.totalMarks} marks · {test.duration} minutes</p>}
        </motion.div>
        {/* Timer */}
        {test && !submitted && (
          <div className={`flex items-center gap-2 glass px-4 py-2 rounded-xl ${timeLeft < 300 ? "border-red-500/30 text-red-400" : "text-slate-300"}`}>
            <Clock size={16} />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>



      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center py-24 gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p style={{ color: "#5a4a22" }}>{loadingMessage || (targetWeek ? `Preparing Week ${targetWeek} test...` : "Preparing full syllabus test...")}</p>
          <p style={{ color: "#a0845e", fontSize: "0.85rem" }}>Your personalised mock test will be ready shortly</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="max-w-md mx-auto py-16 text-center">
          <div style={{ padding: "2rem", borderRadius: "1.25rem", background: "rgba(255,252,240,0.8)", border: "1.5px solid rgba(192,57,43,0.2)" }}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 style={{ color: "#3d2f0d", fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Failed to Generate Test</h3>
            <p style={{ color: "#c0392b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>{error}</p>
            <button
              onClick={() => { setError(null); window.location.reload(); }}
              style={{ padding: "0.6rem 1.5rem", borderRadius: "0.75rem", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {test && !submitted && (
        <div className="max-w-3xl mx-auto">
          {/* Question nav pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {allQuestions.map((_, i) => {
              const q = allQuestions[i];
              const answered = q.type === "mcq"
                ? mcqAnswers[(q.data as MCQ).id] !== undefined
                : !!(shortAnswers[(q.data as ShortAnswer).id]?.trim());
              return (
                <button
                  key={i}
                  id={`nav-q${i + 1}`}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentQ === i ? "bg-indigo-500 text-white" : answered ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-500 border border-white/10"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card p-6 mb-6"
            >
              {allQuestions[currentQ] && (() => {
                const q = allQuestions[currentQ];
                const isMCQ = q.type === "mcq";
                const data = q.data;
                return (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`badge ${isMCQ ? "badge-indigo" : "badge-yellow"}`}>
                            {isMCQ ? "MCQ" : "Short Answer"}
                          </span>
                          <span className="text-xs text-slate-500">{data.marks} marks · {data.topic}</span>
                        </div>
                        <p className="text-white font-medium leading-relaxed">
                          Q{currentQ + 1}. {data.question}
                        </p>
                      </div>
                    </div>

                    {isMCQ ? (
                      <div className="space-y-3">
                        {(data as MCQ).options.map((opt, idx) => (
                          <button
                            key={idx}
                            id={`option-${currentQ}-${idx}`}
                            onClick={() => setMcqAnswers((prev) => ({ ...prev, [(data as MCQ).id]: idx }))}
                            className={`option-btn ${mcqAnswers[(data as MCQ).id] === idx ? "selected" : ""}`}
                          >
                            <span className="font-semibold mr-3 text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        id={`short-answer-${currentQ}`}
                        className="input min-h-32 resize-none"
                        placeholder="Write your answer here..."
                        value={shortAnswers[(data as ShortAnswer).id] || ""}
                        onChange={(e) => setShortAnswers((prev) => ({ ...prev, [(data as ShortAnswer).id]: e.target.value }))}
                      />
                    )}
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {/* NAVIGATION */}
          <div className="flex items-center justify-between">
            <button
              id="prev-question"
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((q) => q - 1)}
              className="btn-secondary disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span className="text-slate-500 text-sm">{answeredCount}/{allQuestions.length} answered</span>

            {currentQ < allQuestions.length - 1 ? (
              <button id="next-question" onClick={() => setCurrentQ((q) => q + 1)} className="btn-primary">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button id="submit-test" onClick={handleSubmit} className="btn-primary bg-gradient-to-r from-emerald-500 to-teal-600">
                <Send size={16} /> Submit Test
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
