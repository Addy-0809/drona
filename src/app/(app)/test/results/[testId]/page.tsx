"use client";
// src/app/(app)/test/results/[testId]/page.tsx
// Test results + handwritten answer sheet upload page
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle2, FileImage, BarChart2, Camera } from "lucide-react";

export default function TestResultsPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [grading, setGrading] = useState<{
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
  } | null>(null);

  function handleFile(f: File) {
    if (f.type.startsWith("image/") || f.type === "application/pdf") {
      setFile(f);
    }
  }

  async function handleUpload() {
    if (!file || !testId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("testId", testId);
      form.append("expectedAnswers", JSON.stringify({})); // pass actual answers in production

      const res = await fetch("/api/agent/grade", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGrading(data.grading);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(false);
    }
  }

  const scoreColor = (pct: number) => pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen mesh-bg p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span className="gradient-text">Test Results</span>
        </h1>
        <p className="text-slate-400">Upload your handwritten answer sheet for AI grading</p>
      </motion.div>

      {!grading ? (
        <div className="max-w-xl">
          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
              dragging ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/2"
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
                  <p className="text-slate-500 text-sm">Drag & drop or click to browse</p>
                  <p className="text-slate-600 text-xs mt-1">Supports JPG, PNG, PDF</p>
                </div>
              </div>
            )}
          </motion.div>

          {file && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              id="grade-upload-btn"
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary w-full mt-4 justify-center disabled:opacity-60"
            >
              {uploading ? (
                <><Loader2 size={18} className="animate-spin" /> AI is reading your answers...</>
              ) : (
                <><Upload size={18} /> Grade with AI</>
              )}
            </motion.button>
          )}

          {uploading && (
            <div className="mt-4 glass rounded-xl p-4 text-sm text-slate-400 text-center">
              Gemini Vision is reading your handwriting and evaluating your answers...
            </div>
          )}

          {/* Go to Feedback button */}
          <div className="mt-6 glass rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Already graded? View your performance report:</p>
            <button
              id="go-to-feedback-btn"
              onClick={() => router.push(`/feedback/${testId}`)}
              className="btn-secondary w-full justify-center text-sm"
            >
              <BarChart2 size={16} /> View Feedback Report
            </button>
          </div>
        </div>
      ) : (
        /* GRADING RESULTS */
        <div className="max-w-3xl space-y-5">
          {/* Score card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Your Score</h2>
              <CheckCircle2 size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className={`text-6xl font-black ${scoreColor(grading.percentage)}`}>
                {grading.totalScore}
              </span>
              <span className="text-2xl text-slate-500 mb-2">/ {grading.maxScore}</span>
            </div>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: `${grading.percentage}%` }} />
            </div>
            <p className={`text-sm font-medium ${scoreColor(grading.percentage)}`}>{grading.percentage}%</p>
            <p className="text-slate-400 text-sm mt-3">{grading.overallFeedback}</p>
          </motion.div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">✅ Strengths</h3>
              <ul className="space-y-2">
                {grading.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">⚠️ Needs Work</h3>
              <ul className="space-y-2">
                {grading.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Question Breakdown</h3>
            <div className="space-y-4">
              {grading.questionResults.map((qr) => (
                <div key={qr.questionId} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-white font-medium">{qr.question}</p>
                    <span className={`text-sm font-bold shrink-0 ml-4 ${qr.marksAwarded >= qr.maxMarks ? "text-emerald-400" : qr.marksAwarded > 0 ? "text-yellow-400" : "text-red-400"}`}>
                      {qr.marksAwarded}/{qr.maxMarks}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">Your answer: {qr.studentAnswer}</p>
                  <p className="text-xs text-slate-400">{qr.feedback}</p>
                </div>
              ))}
            </div>
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
    </div>
  );
}
