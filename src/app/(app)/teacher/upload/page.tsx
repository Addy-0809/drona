"use client";
// src/app/(app)/teacher/upload/page.tsx — Upload study materials
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  ArrowLeft, Loader2, X, GraduationCap, ArrowRight,
} from "lucide-react";
import { SUBJECTS } from "@/lib/subjects";

export default function TeacherUploadPage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file || !subjectId) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", subjectId);
      formData.append("description", description);

      const res = await fetch("/api/teacher/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: data.message });
        setFile(null);
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setResult({ success: false, message: data.error || "Upload failed" });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  // Access denied for non-teachers
  if (role !== "teacher") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          textAlign: "center", padding: "3rem", borderRadius: "1.5rem",
          background: "rgba(255,252,240,0.8)", border: "1.5px solid rgba(192,57,43,0.2)",
          maxWidth: 420,
        }}>
          <GraduationCap size={48} style={{ color: "#c0392b", marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#3d2f0d" }}>Teacher Access Only</h2>
          <p style={{ color: "#8b7355", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
            Only authorized teachers can upload materials.
          </p>
          <Link href="/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "0.6rem 1.5rem", borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #B8860B, #DAA520)",
            color: "#fff", fontWeight: 700, textDecoration: "none",
          }}>
            <ArrowRight size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2rem" }}>
        <Link href="/teacher" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "#8b7355", fontSize: "0.82rem", fontWeight: 600,
          textDecoration: "none", marginBottom: "1rem",
        }}>
          <ArrowLeft size={14} /> Back to Teacher Dashboard
        </Link>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 900,
          fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#3d2f0d",
        }}>
          Upload Study Material
        </h1>
        <p style={{ color: "#8b7355", fontSize: "0.9rem" }}>
          Upload notes, PDFs, or images. Drona will extract the text and use it to generate better content for students.
        </p>
      </motion.div>

      {/* Subject selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#3d2f0d", marginBottom: 8 }}>
          Select Subject *
        </label>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          style={{
            width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
            border: "1.5px solid rgba(184,134,11,0.2)", background: "rgba(255,252,240,0.8)",
            fontSize: "0.9rem", fontWeight: 500, color: "#3d2f0d",
            fontFamily: "'Inter', sans-serif", cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">Choose a subject...</option>
          {SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Description (optional) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", color: "#3d2f0d", marginBottom: 8 }}>
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Chapter 5 — Normalization notes"
          style={{
            width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
            border: "1.5px solid rgba(184,134,11,0.2)", background: "rgba(255,252,240,0.8)",
            fontSize: "0.9rem", color: "#3d2f0d", fontFamily: "'Inter', sans-serif",
            outline: "none",
          }}
        />
      </motion.div>

      {/* Drag-and-drop zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "3rem 2rem", borderRadius: "1.25rem",
          border: `2px dashed ${dragging ? "#10b981" : "rgba(184,134,11,0.25)"}`,
          background: dragging ? "rgba(16,185,129,0.05)" : "rgba(255,252,240,0.6)",
          textAlign: "center", cursor: "pointer",
          transition: "all 0.3s",
          marginBottom: "1.5rem",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem",
            }}>
              {file.type === "application/pdf" ? "📄" : file.type === "text/plain" ? "📝" : "🖼️"}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#3d2f0d" }}>{file.name}</p>
              <p style={{ color: "#8b7355", fontSize: "0.8rem" }}>
                {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                color: "#ef4444", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={40} style={{ color: dragging ? "#10b981" : "#B8860B", marginBottom: "1rem" }} />
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#3d2f0d", marginBottom: 4 }}>
              {dragging ? "Drop your file here!" : "Drag & drop your file here"}
            </p>
            <p style={{ color: "#8b7355", fontSize: "0.82rem" }}>
              or click to browse · PDF, TXT, JPEG, PNG, WebP · Max 10MB
            </p>
          </>
        )}
      </motion.div>

      {/* Upload button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <button
          onClick={handleUpload}
          disabled={!file || !subjectId || uploading}
          style={{
            width: "100%", padding: "0.85rem",
            borderRadius: "0.85rem", border: "none",
            background: (!file || !subjectId || uploading)
              ? "rgba(184,134,11,0.15)"
              : "linear-gradient(135deg, #10b981, #14b8a6)",
            color: (!file || !subjectId || uploading) ? "#a0845e" : "#fff",
            fontWeight: 800, fontSize: "1rem",
            fontFamily: "'Outfit', sans-serif",
            cursor: (!file || !subjectId || uploading) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: (!file || !subjectId || uploading) ? "none" : "0 4px 20px rgba(16,185,129,0.3)",
            transition: "all 0.3s",
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Extracting text & uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload & Index for RAG
            </>
          )}
        </button>
      </motion.div>

      {/* Result message */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: "1.5rem", padding: "1.25rem",
            borderRadius: "1rem",
            background: result.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1.5px solid ${result.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            display: "flex", alignItems: "flex-start", gap: "0.75rem",
          }}
        >
          {result.success ? (
            <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertCircle size={20} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
          )}
          <div>
            <p style={{
              fontWeight: 700, fontSize: "0.9rem",
              color: result.success ? "#065f46" : "#991b1b",
              marginBottom: 4,
            }}>
              {result.success ? "Upload Successful!" : "Upload Failed"}
            </p>
            <p style={{
              fontSize: "0.82rem",
              color: result.success ? "#047857" : "#b91c1c",
            }}>
              {result.message}
            </p>
            {result.success && (
              <Link href="/teacher" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: "0.75rem", color: "#10b981", fontWeight: 700,
                fontSize: "0.82rem", textDecoration: "none",
              }}>
                <ArrowLeft size={12} /> Back to Dashboard
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{
          marginTop: "2rem", padding: "1.25rem 1.5rem",
          borderRadius: "1rem", background: "rgba(99,102,241,0.05)",
          border: "1px solid rgba(99,102,241,0.12)",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#3d2f0d", marginBottom: 8 }}>
          How it works
        </p>
        <ul style={{ paddingLeft: "1.25rem", margin: 0, color: "#8b7355", fontSize: "0.82rem", lineHeight: 1.8 }}>
          <li>Drona extracts all text from your uploaded file using AI</li>
          <li>The extracted content is chunked and embedded into a vector store</li>
          <li>When students study this subject, Drona uses your material for RAG-powered content</li>
          <li>Study plans, test questions, and feedback are all grounded in your uploaded notes</li>
          <li>Students can also browse uploaded materials in the Resources section</li>
        </ul>
      </motion.div>
    </div>
  );
}
