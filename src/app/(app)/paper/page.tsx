"use client";
// src/app/(app)/paper/page.tsx
// University paper upload and mock paper generation
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, FileText, Download, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export default function PaperUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    paperAnalysis: {
      subject: string;
      institution: string;
      totalMarks: number;
      duration: string;
      sections: Array<{ sectionName: string; questionType: string; numberOfQuestions: number; marksPerQuestion: number; totalMarks: number; instructions: string }>;
      topicsCovered: string[];
      difficultyLevel: string;
    };
    mockPaper: {
      title: string;
      subject: string;
      duration: string;
      totalMarks: number;
      instructions: string[];
      sections: Array<{
        sectionName: string;
        instructions: string;
        questions: Array<{ questionNumber: string; question: string; marks: number; type: string; options?: string[] }>;
      }>;
    };
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  function handleFile(f: File) {
    if (f.type.startsWith("image/") || f.type === "application/pdf") {
      setFile(f);
    }
  }

  async function handleAnalyse() {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("paper", file);
      const res = await fetch("/api/agent/paper", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) {
      console.error("Paper analysis failed:", e);
    } finally {
      setLoading(false);
    }
  }

  function downloadMockPaper() {
    if (!analysis?.mockPaper) return;
    const content = generatePaperText(analysis.mockPaper);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EduAgent_Mock_${analysis.mockPaper.subject.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function generatePaperText(paper: NonNullable<typeof analysis>["mockPaper"] | null) {
    if (!paper) return "";
    let text = `${paper.title}\nSubject: ${paper.subject}\nDuration: ${paper.duration} | Total Marks: ${paper.totalMarks}\n\nINSTRUCTIONS:\n`;
    paper.instructions.forEach((inst, i) => { text += `${i + 1}. ${inst}\n`; });
    text += "\n";
    paper.sections.forEach((sec) => {
      text += `\n${sec.sectionName}\n${sec.instructions}\n${"─".repeat(60)}\n`;
      sec.questions.forEach((q) => {
        text += `\nQ${q.questionNumber}. ${q.question} [${q.marks} marks]\n`;
        if (q.options) q.options.forEach((opt, i) => { text += `  ${String.fromCharCode(65 + i)}. ${opt}\n`; });
      });
    });
    return text;
  }

  return (
    <div className="min-h-screen mesh-bg p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-pink-400" />
          <span className="text-pink-400 text-sm font-medium">AI Paper Analyser</span>
        </div>
        <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Upload <span className="gradient-text">Question Paper</span>
        </h1>
        <p className="text-slate-400">Upload your university paper — AI analyses it and generates a similar mock paper</p>
      </motion.div>

      {!analysis ? (
        <div className="max-w-xl">
          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
              dragging ? "border-pink-500 bg-pink-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/2"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} id="paper-upload-input" type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileText size={40} className="text-pink-400" />
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                <span className="badge badge-indigo">Ready to analyse</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Upload size={28} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Upload University Question Paper</p>
                  <p className="text-slate-500 text-sm">Scan or photograph your paper</p>
                  <p className="text-slate-600 text-xs mt-1">JPG, PNG, or PDF</p>
                </div>
              </div>
            )}
          </motion.div>

          {file && (
            <button
              id="analyse-paper-btn"
              onClick={handleAnalyse}
              disabled={loading}
              className="btn-primary w-full mt-4 justify-center disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Analysing paper...</>
              ) : (
                <><Sparkles size={18} /> Analyse & Generate Mock Paper</>
              )}
            </button>
          )}

          {loading && (
            <div className="mt-4 glass rounded-xl p-4 text-sm text-slate-400 text-center space-y-1">
              <p>Gemini Vision is reading your question paper...</p>
              <p className="text-slate-600">Identifying patterns, marks distribution, and question types</p>
            </div>
          )}
        </div>
      ) : (
        /* RESULTS */
        <div className="max-w-4xl space-y-5">
          {/* Analysis summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <h2 className="font-semibold text-white mb-4 text-lg">📋 Paper Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                ["Subject", analysis.paperAnalysis.subject],
                ["Total Marks", analysis.paperAnalysis.totalMarks],
                ["Duration", analysis.paperAnalysis.duration],
                ["Difficulty", analysis.paperAnalysis.difficultyLevel],
              ].map(([k, v]) => (
                <div key={k} className="glass rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">{k}</p>
                  <p className="text-sm font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Topics Covered</p>
              <div className="flex flex-wrap gap-2">
                {analysis.paperAnalysis.topicsCovered.map((t) => (
                  <span key={t} className="badge badge-indigo">{t}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mock paper */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-white text-lg">📄 Generated Mock Paper</h2>
                <p className="text-slate-500 text-sm mt-1">{analysis.mockPaper.subject} · {analysis.mockPaper.duration} · {analysis.mockPaper.totalMarks} marks</p>
              </div>
              <button
                id="download-mock-paper-btn"
                onClick={downloadMockPaper}
                className="btn-primary text-sm py-2 px-4"
              >
                <Download size={15} /> Download
              </button>
            </div>

            {/* Instructions */}
            <div className="glass rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Instructions</p>
              <ol className="list-decimal list-inside space-y-1">
                {analysis.mockPaper.instructions.map((inst, i) => (
                  <li key={i} className="text-sm text-slate-300">{inst}</li>
                ))}
              </ol>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {analysis.mockPaper.sections.map((sec, si) => (
                <div key={si} className="border border-white/8 rounded-xl overflow-hidden">
                  <button
                    id={`section-toggle-${si}`}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                    onClick={() => setExpandedSection(expandedSection === si ? null : si)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="badge badge-indigo">{sec.sectionName}</span>
                      <span className="text-sm text-slate-400">{sec.questions.length} questions</span>
                    </div>
                    {expandedSection === si ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  <AnimatePresence>
                    {expandedSection === si && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <p className="text-xs text-slate-500 px-4 pt-3">{sec.instructions}</p>
                        <div className="p-4 space-y-4">
                          {sec.questions.map((q) => (
                            <div key={q.questionNumber} className="p-3 rounded-lg bg-white/2 border border-white/5">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-white"><span className="font-bold text-indigo-400">Q{q.questionNumber}.</span> {q.question}</p>
                                <span className="badge badge-yellow shrink-0 ml-3">{q.marks}m</span>
                              </div>
                              {q.options && (
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                  {q.options.map((opt, i) => (
                                    <p key={i} className="text-xs text-slate-400">{String.fromCharCode(65 + i)}. {opt}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

          <button
            id="upload-another-btn"
            onClick={() => { setFile(null); setAnalysis(null); }}
            className="btn-secondary"
          >
            Upload Another Paper
          </button>
        </div>
      )}
    </div>
  );
}
