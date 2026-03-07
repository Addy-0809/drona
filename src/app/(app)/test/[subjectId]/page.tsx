"use client";
// src/app/(app)/test/[subjectId]/page.tsx
// Mock test taking page
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSubjectById } from "@/lib/subjects";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Send } from "lucide-react";

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

export default function TestPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = getSubjectById(subjectId);

  const [test, setTest] = useState<Test | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch topics from plan to generate test
  useEffect(() => {
    async function generateTest() {
      try {
        // For demo, use some default topics. In production, fetch from the plan.
        const completedTopics = ["Introduction", "Core Concepts", "Advanced Topics", "Problem Solving", "Applications"];
        const res = await fetch("/api/agent/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId, subjectName: subject?.name, completedTopics }),
        });
        const data = await res.json();
        setTest(data.test);
        setTestId(data.testId);
        setTimeLeft(data.test.duration * 60);
      } catch (e) {
        console.error("Failed to load test:", e);
      } finally {
        setLoading(false);
      }
    }
    if (subject) generateTest();
  }, [subjectId, subject]);

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
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className={`bg-gradient-to-r ${subject.gradient} bg-clip-text text-transparent`}>
              {subject.shortName}
            </span>{" "}Mock Test
          </h1>
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
          <p className="text-slate-400">Examiner AI is preparing your test...</p>
          <p className="text-slate-600 text-sm">Generating questions based on your study topics</p>
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
              <button
                id="next-question"
                onClick={() => setCurrentQ((q) => q + 1)}
                className="btn-primary"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                id="submit-test"
                onClick={handleSubmit}
                className="btn-primary bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Send size={16} /> Submit Test
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
