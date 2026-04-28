"use client";
// src/app/(app)/test/results/[testId]/page.tsx
// Test results — MCQ breakdown (right/wrong/unanswered) + handwritten upload for short answers
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, CheckCircle2, XCircle, MinusCircle,
  FileImage, BarChart2, Camera, ChevronDown, ChevronUp,
} from "lucide-react";

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

interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  questionResults: Array<{
    questionId: string;
    question: string;
    studentAnswer: string;
    marksAwarded: number;
    maxMarks: number;
    feedback: string;
  }>;
}

export default function TestResultsPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [test, setTest] = useState<Test | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [loadingTest, setLoadingTest] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [grading, setGrading] = useState<GradingResult | null>(null);

  // Which MCQ cards have their explanation expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // ── Tab: "mcq" | "short" ───────────────────────────────────────────────────
  const [tab, setTab] = useState<"mcq" | "short">("mcq");

  // ── Load test data + saved MCQ answers ────────────────────────────────────
  useEffect(() => {
    if (!testId) return;

    // Restore MCQ answers saved in localStorage by the test page
    try {
      const saved = localStorage.getItem(`mcqAnswers_${testId}`);
      if (saved) setMcqAnswers(JSON.parse(saved));
    } catch { /* non-fatal */ }

    // Fetch the test document from Firestore via a lightweight API call
    (async () => {
      try {
        const res = await fetch(`/api/agent/test-data?testId=${testId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.test) {
            setTest(data.test);
            setLoadingTest(false);
            return;
          }
        }
      } catch { /* non-fatal */ }

      // Fallback: load test data from localStorage (saved by the test-taking page)
      try {
        const saved = localStorage.getItem(`testData_${testId}`);
        if (saved) {
          setTest(JSON.parse(saved));
        }
      } catch { /* non-fatal */ }

      setLoadingTest(false);
    })();
  }, [testId]);

  // ── MCQ stats ─────────────────────────────────────────────────────────────
  const mcqStats = (() => {
    if (!test) return { correct: 0, wrong: 0, unanswered: 0, score: 0, max: 0 };
    let correct = 0, wrong = 0, unanswered = 0, score = 0;
    for (const q of test.mcqs) {
      const chosen = mcqAnswers[q.id];
      if (chosen === undefined) { unanswered++; }
      else if (chosen === q.correctAnswer) { correct++; score += q.marks; }
      else { wrong++; }
    }
    return { correct, wrong, unanswered, score, max: test.mcqs.reduce((s, q) => s + q.marks, 0) };
  })();

  // ── File upload helpers ────────────────────────────────────────────────────
  function handleFile(f: File) {
    if (f.type.startsWith("image/") || f.type === "application/pdf") setFile(f);
  }

  async function handleUpload(skipUpload = false) {
    if (!testId) return;
    setUploading(true);
    try {
      const form = new FormData();
      if (!skipUpload && file) form.append("image", file);
      form.append("testId", testId);
      form.append("noImage", skipUpload ? "true" : "false");

      // Send expected answers (marking scheme) so the AI can evaluate the uploaded answers
      if (test?.shortAnswers) {
        const expectedAnswers = test.shortAnswers.reduce((acc, sa) => {
          acc[sa.id] = {
            question: sa.question,
            expectedAnswer: sa.expectedAnswer,
            marks: sa.marks,
            keywords: sa.keywords,
            topic: sa.topic,
          };
          return acc;
        }, {} as Record<string, unknown>);
        form.append("expectedAnswers", JSON.stringify(expectedAnswers));
      }

      const res = await fetch("/api/agent/grade", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGrading(data.grading);
      setTab("short");

      // Also save MCQ scores to Firestore for the feedback page to access
      try {
        await fetch("/api/agent/save-mcq-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            mcqScore: mcqStats.score,
            mcqMax: mcqStats.max,
            mcqCorrect: mcqStats.correct,
            mcqTotal: test?.mcqs?.length ?? 0,
          }),
        });
      } catch { /* non-fatal — feedback page has localStorage fallback */ }
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(false);
    }
  }

  const scoreColor = (pct: number) =>
    pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen mesh-bg p-4 md:p-8">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-4xl font-black mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Test <span className="gradient-text">Results</span>
        </h1>
        <p className="text-slate-400 text-sm">
          MCQ results are shown below · Upload your handwritten sheet to grade short answers
        </p>
      </motion.div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {(["mcq", "short"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.45rem 1.2rem", borderRadius: "2rem", border: "none",
              fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
              background: tab === t
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : "rgba(255,255,255,0.05)",
              color: tab === t ? "#fff" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            {t === "mcq" ? `MCQs · ${mcqStats.score}/${mcqStats.max}` : "Short Answers"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ MCQ TAB ══════════════════════════════════════════════════════════ */}
        {tab === "mcq" && (
          <motion.div key="mcq" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Score summary row */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {[
                { label: "Correct", value: mcqStats.correct, color: "#34d399", icon: "✅" },
                { label: "Wrong",   value: mcqStats.wrong,   color: "#f87171", icon: "❌" },
                { label: "Skipped", value: mcqStats.unanswered, color: "#94a3b8", icon: "—" },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: "1 1 120px", padding: "1rem 1.25rem",
                  borderRadius: "1rem", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)", textAlign: "center",
                }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: s.color, fontFamily: "'Outfit',sans-serif" }}>
                    {s.icon} {s.value}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.2rem" }}>{s.label}</div>
                </div>
              ))}
              <div style={{
                flex: "1 1 120px", padding: "1rem 1.25rem",
                borderRadius: "1rem", background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.2)", textAlign: "center",
              }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#818cf8", fontFamily: "'Outfit',sans-serif" }}>
                  {mcqStats.score}/{mcqStats.max}
                </div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.2rem" }}>MCQ Marks</div>
              </div>
            </div>

            {/* Per-question breakdown */}
            {loadingTest ? (
              <div className="flex items-center gap-3 py-12 justify-center text-slate-500">
                <Loader2 size={20} className="animate-spin" /> Loading questions...
              </div>
            ) : !test ? (
              <div className="text-slate-500 text-sm py-8 text-center">
                Question data unavailable — results may be from a previous session.
              </div>
            ) : (
              <div className="space-y-3 max-w-3xl">
                {test.mcqs.map((q, idx) => {
                  const chosen = mcqAnswers[q.id];
                  const isCorrect = chosen === q.correctAnswer;
                  const isSkipped = chosen === undefined;
                  const isExpanded = expanded[q.id];

                  const statusColor = isSkipped ? "#94a3b8" : isCorrect ? "#34d399" : "#f87171";
                  const statusIcon = isSkipped
                    ? <MinusCircle size={18} style={{ color: "#94a3b8" }} />
                    : isCorrect
                    ? <CheckCircle2 size={18} style={{ color: "#34d399" }} />
                    : <XCircle size={18} style={{ color: "#f87171" }} />;
                  const cardBorder = isSkipped
                    ? "rgba(255,255,255,0.07)"
                    : isCorrect
                    ? "rgba(52,211,153,0.2)"
                    : "rgba(248,113,113,0.2)";
                  const cardBg = isSkipped
                    ? "rgba(255,255,255,0.03)"
                    : isCorrect
                    ? "rgba(52,211,153,0.04)"
                    : "rgba(248,113,113,0.04)";

                  return (
                    <div key={q.id} style={{
                      borderRadius: "1rem", border: `1px solid ${cardBorder}`,
                      background: cardBg, overflow: "hidden",
                    }}>
                      {/* Question header */}
                      <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700, minWidth: "1.5rem", paddingTop: "2px" }}>
                          Q{idx + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "#f1f5f9", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "0.6rem" }}>
                            {q.question}
                          </p>
                          {/* Options */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {q.options.map((opt, oi) => {
                              const isChosen = chosen === oi;
                              const isRight = oi === q.correctAnswer;
                              let bg = "rgba(255,255,255,0.03)";
                              let border = "rgba(255,255,255,0.07)";
                              let color = "#94a3b8";
                              if (isRight) { bg = "rgba(52,211,153,0.1)"; border = "rgba(52,211,153,0.4)"; color = "#34d399"; }
                              if (isChosen && !isRight) { bg = "rgba(248,113,113,0.1)"; border = "rgba(248,113,113,0.4)"; color = "#f87171"; }
                              return (
                                <div key={oi} style={{
                                  padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                  border: `1px solid ${border}`, background: bg, color,
                                  fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.5rem",
                                }}>
                                  <span style={{ fontWeight: 700, minWidth: "1rem" }}>{String.fromCharCode(65 + oi)}.</span>
                                  {opt}
                                  {isRight && <CheckCircle2 size={13} style={{ marginLeft: "auto", color: "#34d399" }} />}
                                  {isChosen && !isRight && <XCircle size={13} style={{ marginLeft: "auto", color: "#f87171" }} />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                          {statusIcon}
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: statusColor }}>
                            {isSkipped ? "—" : isCorrect ? `+${q.marks}` : "0"}/{q.marks}
                          </span>
                        </div>
                      </div>

                      {/* Expand explanation for wrong/skipped */}
                      {(!isCorrect) && (
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          style={{
                            width: "100%", padding: "0.5rem 1.25rem",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            color: "#818cf8", fontSize: "0.75rem", fontWeight: 600,
                          }}
                        >
                          <span>💡 See explanation</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                      {isExpanded && (
                        <div style={{
                          padding: "0.75rem 1.25rem 1rem",
                          background: "rgba(99,102,241,0.06)",
                          borderTop: "1px solid rgba(99,102,241,0.12)",
                          fontSize: "0.82rem", color: "#c7d2fe", lineHeight: 1.7,
                        }}>
                          <strong style={{ color: "#818cf8" }}>Correct answer: </strong>
                          {q.options[q.correctAnswer]}
                          <br />
                          <span style={{ color: "#94a3b8" }}>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA to short answers tab */}
            <div className="mt-6 max-w-3xl">
              <button
                onClick={() => setTab("short")}
                className="btn-primary w-full justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                Submit Short Answers →
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ SHORT ANSWERS TAB ════════════════════════════════════════════════ */}
        {tab === "short" && (
          <motion.div key="short" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl">

            {!grading ? (
              <>
                {/* Upload zone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                    dragging ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    id="answer-upload-input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileImage size={40} className="text-indigo-400" />
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                      <span className="badge badge-green">Ready to upload</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Camera size={28} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium mb-1">Upload Answer Sheet</p>
                        <p className="text-slate-500 text-sm">Drag & drop or click · JPG, PNG, PDF</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Upload & Grade button */}
                {file && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    id="grade-upload-btn"
                    onClick={() => handleUpload(false)}
                    disabled={uploading}
                    className="btn-primary w-full mt-4 justify-center disabled:opacity-60"
                  >
                    {uploading
                      ? <><Loader2 size={18} className="animate-spin" /> AI is reading your answers...</>
                      : <><Upload size={18} /> Grade with AI</>}
                  </motion.button>
                )}

                {/* Skip option */}
                {!file && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <button
                      id="skip-upload-btn"
                      onClick={() => handleUpload(true)}
                      disabled={uploading}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                        padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
                        border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)",
                        color: "#f87171", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                        opacity: uploading ? 0.5 : 1,
                      }}
                    >
                      {uploading
                        ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                        : <><XCircle size={16} /> Skip — mark short answers as 0</>}
                    </button>
                    <p style={{ color: "#64748b", fontSize: "0.72rem", textAlign: "center", marginTop: "0.5rem" }}>
                      MCQs are already graded above. Short answers get 0 marks if no sheet is uploaded.
                    </p>
                  </motion.div>
                )}

                {uploading && (
                  <div className="mt-4 glass rounded-xl p-4 text-sm text-slate-400 text-center">
                    {file ? "Drona is reading your handwriting..." : "Submitting — short answers marked 0..."}
                  </div>
                )}

                {/* View feedback (already graded) */}
                <div className="mt-6 glass rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-3">Already graded? View your full performance report:</p>
                  <button
                    id="go-to-feedback-btn"
                    onClick={() => router.push(`/feedback/${testId}`)}
                    className="btn-secondary w-full justify-center text-sm"
                  >
                    <BarChart2 size={16} /> View Feedback Report
                  </button>
                </div>
              </>
            ) : (
              /* SHORT ANSWER GRADING RESULTS */
              <div className="space-y-4">
                {/* Score card */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-white">Short Answer Score</h2>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className={`text-5xl font-black ${scoreColor(grading.percentage)}`}>{grading.totalScore}</span>
                    <span className="text-xl text-slate-500 mb-1">/ {grading.maxScore}</span>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className="progress-fill" style={{ width: `${grading.percentage}%` }} />
                  </div>
                  <p className={`text-sm font-medium ${scoreColor(grading.percentage)}`}>{grading.percentage}%</p>
                  <p className="text-slate-400 text-sm mt-3">{grading.overallFeedback}</p>
                </motion.div>

                {/* Per-question results */}
                <div className="space-y-3">
                  {grading.questionResults.map((qr) => {
                    const pct = qr.maxMarks > 0 ? qr.marksAwarded / qr.maxMarks : 0;
                    const col = pct >= 0.75 ? "#34d399" : pct > 0 ? "#fbbf24" : "#f87171";
                    return (
                      <div key={qr.questionId} style={{
                        borderRadius: "0.875rem", padding: "1rem 1.25rem",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                          <p style={{ color: "#f1f5f9", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.5 }}>{qr.question}</p>
                          <span style={{ color: col, fontWeight: 800, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                            {qr.marksAwarded}/{qr.maxMarks}
                          </span>
                        </div>
                        <p style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
                          Your answer: <span style={{ color: "#94a3b8" }}>{qr.studentAnswer}</span>
                        </p>
                        <p style={{ color: "#818cf8", fontSize: "0.75rem" }}>{qr.feedback}</p>
                      </div>
                    );
                  })}
                </div>

                <button
                  id="view-full-feedback-btn"
                  onClick={() => router.push(`/feedback/${testId}`)}
                  className="btn-primary w-full justify-center"
                >
                  <BarChart2 size={18} /> View Full Feedback Report
                </button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
