"use client";
// src/app/(app)/teacher/page.tsx — Teacher Dashboard
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Upload, BookOpen, FileText, Users, TrendingUp,
  GraduationCap, Loader2, ArrowRight, Trash2, Clock,
} from "lucide-react";
import { SUBJECTS } from "@/lib/subjects";

interface Material {
  id: string;
  subjectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  description: string;
  textLength: number;
  teacherName: string;
  uploadedAt: string | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string) {
  if (mime === "application/pdf") return "📄";
  if (mime === "text/plain") return "📝";
  if (mime.startsWith("image/")) return "🖼️";
  return "📎";
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const role = (session?.user as Record<string, unknown> | undefined)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || role !== "teacher") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/teacher/materials?teacherOnly=true");
        const data = await res.json();
        setMaterials(data.materials || []);
      } catch { /* non-fatal */ }
      finally { setLoading(false); }
    })();
  }, [status, session, role]);

  const handleDelete = async (materialId: string) => {
    if (!confirm("Delete this material? This cannot be undone.")) return;
    setDeleting(materialId);
    try {
      const res = await fetch("/api/teacher/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      }
    } catch { /* non-fatal */ }
    finally { setDeleting(null); }
  };

  const firstName = session?.user?.name?.split(" ")[0] ?? "Teacher";

  // Group materials by subject
  const bySubject = new Map<string, Material[]>();
  for (const m of materials) {
    const list = bySubject.get(m.subjectId) || [];
    list.push(m);
    bySubject.set(m.subjectId, list);
  }

  const totalCharacters = materials.reduce((s, m) => s + m.textLength, 0);
  const subjectsCovered = bySubject.size;

  // Not a teacher — show access denied
  if (!loading && role !== "teacher") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          textAlign: "center", padding: "3rem", borderRadius: "1.5rem",
          background: "rgba(255,252,240,0.8)", border: "1.5px solid rgba(192,57,43,0.2)",
          maxWidth: 420,
        }}>
          <GraduationCap size={48} style={{ color: "#c0392b", marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#3d2f0d", marginBottom: "0.5rem" }}>
            Teacher Access Only
          </h2>
          <p style={{ color: "#8b7355", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
            This portal is restricted to authorized teachers. If you are a teacher, please contact the administrator to get access.
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
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5rem 0", gap: "1rem" }}>
          <Loader2 size={32} style={{ color: "#B8860B", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#8b7355", fontWeight: 600 }}>Loading teacher portal...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* ══════ HERO ══════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "2rem 2.5rem", borderRadius: "1.5rem",
              background: "linear-gradient(135deg, rgba(16,185,129,0.09) 0%, rgba(20,184,166,0.06) 50%, rgba(255,252,240,0.8) 100%)",
              border: "1.5px solid rgba(16,185,129,0.2)", marginBottom: "2rem",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.1), transparent)" }} />

            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              {session?.user?.image ? (
                <Image src={session.user.image} alt={session.user.name ?? "Teacher"} width={88} height={88}
                  style={{ borderRadius: "50%", border: "3px solid #10b981", boxShadow: "0 4px 20px rgba(16,185,129,0.3)", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 88, height: 88, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #10b981, #14b8a6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: "2rem",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                }}>
                  {session?.user?.name?.[0] ?? "T"}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <GraduationCap size={16} style={{ color: "#10b981" }} />
                  <span style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Teacher Portal</span>
                </div>
                <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#3d2f0d", marginBottom: 4 }}>
                  Welcome, {firstName}!
                </h1>
                <p style={{ color: "#8b7355", fontSize: "0.88rem" }}>
                  Upload notes, PDFs, and reference material for your students. Drona uses your uploads for AI-powered content generation.
                </p>
              </div>

              {/* Stat pills */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {[
                  { icon: FileText, label: "Uploads", value: materials.length, color: "#10b981" },
                  { icon: BookOpen, label: "Subjects", value: subjectsCovered, color: "#6366f1" },
                  { icon: TrendingUp, label: "Characters", value: totalCharacters > 1000 ? `${(totalCharacters / 1000).toFixed(0)}K` : totalCharacters, color: "#f59e0b" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{
                    padding: "0.9rem 1.25rem", borderRadius: "1rem",
                    background: "rgba(255,252,240,0.8)", border: `1.5px solid ${color}20`,
                    textAlign: "center", minWidth: 90,
                  }}>
                    <Icon size={18} style={{ color, marginBottom: 4 }} />
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#3d2f0d", lineHeight: 1 }}>{value}</p>
                    <p style={{ color: "#8b7355", fontSize: "0.7rem", fontWeight: 500, marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ══════ UPLOAD CTA ══════ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: "2rem" }}>
            <Link href="/teacher/upload" style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1.5rem 2rem", borderRadius: "1.25rem",
              background: "linear-gradient(135deg, #10b981, #14b8a6)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 8px 30px rgba(16,185,129,0.25)",
              transition: "all 0.3s",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: "rgba(255,255,255,0.2)", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Upload size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.1rem", marginBottom: 4 }}>
                  Upload Study Material
                </h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                  Upload PDFs, notes, or images — Drona will extract text and use it for RAG-powered content generation
                </p>
              </div>
              <ArrowRight size={20} />
            </Link>
          </motion.div>

          {/* ══════ RECENT UPLOADS ══════ */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} color="#fff" />
              </div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#3d2f0d", margin: 0 }}>
                Your Uploads
              </h2>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", padding: "3px 10px", borderRadius: "2rem" }}>
                {materials.length} file{materials.length !== 1 ? "s" : ""}
              </span>
            </div>

            {materials.length === 0 ? (
              <div style={{ padding: "2.5rem", borderRadius: "1.25rem", background: "rgba(255,252,240,0.7)", border: "1.5px solid rgba(184,134,11,0.12)", textAlign: "center" }}>
                <Upload size={32} style={{ color: "#d4c4a0", margin: "0 auto 1rem" }} />
                <p style={{ color: "#8b7355", fontWeight: 600, marginBottom: 4 }}>No materials uploaded yet</p>
                <p style={{ color: "#a0845e", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  Upload your first study material to help students and power Drona&apos;s AI.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {materials.map((m, i) => {
                  const subject = SUBJECTS.find((s) => s.id === m.subjectId);
                  const color = subject?.color ?? "#6366f1";

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "1rem 1.25rem", borderRadius: "1rem",
                        background: "rgba(255,252,240,0.8)", border: "1.5px solid rgba(184,134,11,0.1)",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* File icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${color}15`, border: `1.5px solid ${color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.3rem", flexShrink: 0,
                      }}>
                        {fileIcon(m.mimeType)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#3d2f0d", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.fileName}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ padding: "1px 8px", borderRadius: "0.4rem", background: `${color}12`, fontSize: "0.68rem", fontWeight: 700, color }}>
                            {subject?.shortName ?? m.subjectId}
                          </span>
                          <span style={{ color: "#a0845e", fontSize: "0.7rem" }}>
                            {fmtSize(m.fileSize)}
                          </span>
                          <span style={{ color: "#a0845e", fontSize: "0.7rem" }}>
                            {m.textLength.toLocaleString()} chars extracted
                          </span>
                          <span style={{ color: "#b8a080", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 3 }}>
                            <Clock size={10} /> {fmtDate(m.uploadedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 34, height: 34, borderRadius: "50%",
                          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                          color: "#ef4444", cursor: "pointer", flexShrink: 0,
                          opacity: deleting === m.id ? 0.5 : 1,
                        }}
                        title="Delete material"
                      >
                        {deleting === m.id ? (
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
