"use client";
// src/app/(app)/resources/materials/page.tsx — Student Materials Library
// Students can browse teacher-uploaded study materials
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, BookOpen, Loader2, ArrowLeft,
  Download, Clock, User, Search,
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
  teacherEmail: string;
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

export default function MaterialsLibrary() {
  const { data: session, status } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    (async () => {
      try {
        const url = filterSubject
          ? `/api/teacher/materials?subjectId=${filterSubject}`
          : "/api/teacher/materials";
        const res = await fetch(url);
        const data = await res.json();
        setMaterials(data.materials || []);
      } catch { /* non-fatal */ }
      finally { setLoading(false); }
    })();
  }, [status, filterSubject]);

  const filteredMaterials = search
    ? materials.filter(
        (m) =>
          m.fileName.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase()) ||
          m.teacherName.toLowerCase().includes(search.toLowerCase())
      )
    : materials;

  // Group by subject
  const bySubject = new Map<string, Material[]>();
  for (const m of filteredMaterials) {
    const list = bySubject.get(m.subjectId) || [];
    list.push(m);
    bySubject.set(m.subjectId, list);
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2rem" }}>
        <Link href="/resources" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "#8b7355", fontSize: "0.82rem", fontWeight: 600,
          textDecoration: "none", marginBottom: "1rem",
        }}>
          <ArrowLeft size={14} /> Back to Resources
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(1.4rem, 3vw, 1.8rem)", color: "#3d2f0d", margin: 0 }}>
              Study Materials Library
            </h1>
            <p style={{ color: "#8b7355", fontSize: "0.85rem", margin: 0 }}>
              Notes, PDFs, and reference materials uploaded by your teachers
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#a0845e" }} />
          <input
            type="text" placeholder="Search materials..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.65rem 1rem 0.65rem 2.5rem",
              borderRadius: "0.75rem", border: "1.5px solid rgba(184,134,11,0.2)",
              background: "rgba(255,252,240,0.8)", fontSize: "0.85rem",
              color: "#3d2f0d", outline: "none",
            }}
          />
        </div>

        {/* Subject filter */}
        <select
          value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setLoading(true); }}
          style={{
            padding: "0.65rem 1rem", borderRadius: "0.75rem",
            border: "1.5px solid rgba(184,134,11,0.2)", background: "rgba(255,252,240,0.8)",
            fontSize: "0.85rem", color: "#3d2f0d", cursor: "pointer", outline: "none",
          }}
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.shortName}</option>
          ))}
        </select>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 0", gap: "1rem" }}>
          <Loader2 size={32} style={{ color: "#B8860B", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#8b7355", fontWeight: 600 }}>Loading materials...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div style={{
          padding: "3rem", borderRadius: "1.25rem",
          background: "rgba(255,252,240,0.7)", border: "1.5px solid rgba(184,134,11,0.12)",
          textAlign: "center",
        }}>
          <FileText size={40} style={{ color: "#d4c4a0", margin: "0 auto 1rem" }} />
          <p style={{ fontWeight: 700, color: "#8b7355", marginBottom: 4 }}>No materials found</p>
          <p style={{ color: "#a0845e", fontSize: "0.85rem" }}>
            {search ? "Try a different search term." : "Teachers haven't uploaded materials for this subject yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {Array.from(bySubject.entries()).map(([sid, mats], sIdx) => {
            const subject = SUBJECTS.find((s) => s.id === sid);
            const color = subject?.color ?? "#6366f1";

            return (
              <motion.section key={sid}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + sIdx * 0.05 }}
              >
                {/* Subject header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>{subject?.icon ?? "📘"}</span>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#3d2f0d", margin: 0 }}>
                    {subject?.name ?? sid}
                  </h3>
                  <span style={{
                    padding: "2px 8px", borderRadius: "2rem",
                    background: `${color}10`, border: `1px solid ${color}20`,
                    fontSize: "0.7rem", fontWeight: 700, color,
                  }}>
                    {mats.length} file{mats.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Material cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem" }}>
                  {mats.map((m, i) => (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      style={{
                        padding: "1.15rem 1.25rem", borderRadius: "1rem",
                        background: "rgba(255,252,240,0.8)", border: `1.5px solid ${color}15`,
                        transition: "all 0.25s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${color}10`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: `${color}10`, border: `1px solid ${color}20`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.2rem", flexShrink: 0,
                        }}>
                          {fileIcon(m.mimeType)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontWeight: 700, fontSize: "0.88rem", color: "#3d2f0d",
                            marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {m.fileName}
                          </p>
                          {m.description && (
                            <p style={{ color: "#8b7355", fontSize: "0.75rem", marginBottom: 4, lineHeight: 1.4 }}>
                              {m.description}
                            </p>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ color: "#a0845e", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 3 }}>
                              <User size={10} /> {m.teacherName}
                            </span>
                            <span style={{ color: "#b8a080", fontSize: "0.7rem" }}>{fmtSize(m.fileSize)}</span>
                            <span style={{ color: "#b8a080", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} /> {fmtDate(m.uploadedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}
