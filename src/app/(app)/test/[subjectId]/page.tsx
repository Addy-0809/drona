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
  const [noProgress, setNoProgress] = useState(false);
  const [testLabel, setTestLabel] = useState("Mock Test");

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

  // Fetch progress, then filter by week if needed, then generate test
  useEffect(() => {
    if (!subject) return;
    const init = async () => {
      try {
        const progressRes = await fetch(`/api/progress?subjectId=${subjectId}`);
        if (!progressRes.ok) { setNoProgress(true); setLoading(false); return; }

        const progressData = await progressRes.json();
        const completedTopicIds: string[] = progressData.completedTopicIds || [];
        const completedTopicNames: string[] = progressData.completedTopics || [];
        const topicNameMap: Record<string, string> = progressData.topicNameMap || {};

        if (completedTopicIds.length === 0 && completedTopicNames.length === 0) {
          setNoProgress(true); setLoading(false); return;
        }

        // Week-specific test requested
        if (targetWeek !== null) {
          // If plan is available, filter by that week's topics
          if (progressData.plan) {
            const plan = progressData.plan as { weeks: Week[] };
            const week = plan.weeks.find((w) => w.weekNumber === targetWeek);
            if (!week) { setError(`Week ${targetWeek} not found in study plan`); setLoading(false); return; }

            const weekTopicIds = week.topics.map((t) => t.id);
            const weekTopicNamesLC = week.topics.map((t) => t.name.toLowerCase());

            // Strategy 1: match by exact topic IDs
            const allIdsPresent = weekTopicIds.every(id => completedTopicIds.includes(id));

            // Strategy 2: match by topic names (case-insensitive)
            const nameMatchCount = completedTopicNames.filter(n => weekTopicNamesLC.includes(n.toLowerCase())).length;
            const allNamesCovered = nameMatchCount >= weekTopicIds.length;

            // Gate: ONLY block if NEITHER strategy can confirm all week topics are done
            if (!allIdsPresent && !allNamesCovered) {
              setNoProgress(true); setLoading(false); return;
            }

            // Always use the plan's topic names for the prompt (most reliable for AI)
            const weekTopicNames = week.topics.map(t => topicNameMap[t.id] || t.name);
            setTestLabel(`Week ${targetWeek} Test`);
            generateTest(weekTopicNames);
            return;
          }

          // No plan data in Firestore — fall back to using all completed topics
          // (treat it as a full test rather than blocking the user)
          const topics = completedTopicNames.length > 0
            ? completedTopicNames
            : completedTopicIds.map(id => topicNameMap[id] || id);
          setTestLabel(`Week ${targetWeek} Test`);
          generateTest(topics);
          return;
        }

        // Full syllabus test — use stored topic names directly
        const topics = completedTopicNames.length > 0
          ? completedTopicNames
          : completedTopicIds.map(id => topicNameMap[id] || id);

        setTestLabel("Full Syllabus Test");
        generateTest(topics);
      } catch {
        setNoProgress(true);
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

      {/* NO PROGRESS */}
      {noProgress && !loading && !error && (
        <div className="max-w-md mx-auto py-16 text-center">
          <div style={{ padding: "2rem", borderRadius: "1.25rem", background: "rgba(255,252,240,0.8)", border: "1.5px solid rgba(184,134,11,0.2)" }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.2)" }}>
              <span className="text-2xl">📚</span>
            </div>
            <h3 style={{ color: "#3d2f0d", fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
              {targetWeek ? `Complete Week ${targetWeek} First!` : "Study First!"}
            </h3>
            <p style={{ color: "#8b7355", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              {targetWeek
                ? `You haven't completed all topics in Week ${targetWeek} yet. Finish them, then come back for the test.`
                : "You haven't completed any topics in this subject yet. Complete some topics in your study plan first, then come back for a mock test."}
            </p>
            <a
              href={`/plan/${subjectId}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "0.6rem 1.5rem", borderRadius: "0.75rem", border: "none",
                background: `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)`,
                color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                textDecoration: "none", cursor: "pointer",
                boxShadow: `0 4px 16px ${subject.color}30`,
              }}
            >
              Go to Study Plan →
            </a>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center py-24 gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p style={{ color: "#5a4a22" }}>Examiner AI is preparing your {targetWeek ? `Week ${targetWeek}` : "full syllabus"} test...</p>
          <p style={{ color: "#a0845e", fontSize: "0.85rem" }}>Generating questions based on your completed topics</p>
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
              onClick={() => { setNoProgress(false); setError(null); window.location.reload(); }}
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
