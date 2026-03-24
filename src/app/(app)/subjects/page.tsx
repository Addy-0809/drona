"use client";
// src/app/(app)/subjects/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS } from "@/lib/subjects";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Subjects" },
  { id: "cs", label: "Computer Science" },
  { id: "math", label: "Mathematics" },
  { id: "science", label: "Science" },
];

export default function SubjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = SUBJECTS.filter((s) => {
    const matchCat = category === "all" || s.category === category;
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function handleSelect(subjectId: string) {
    setLoading(subjectId);
    router.push(`/plan/${subjectId}`);
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "2.5rem",
          fontWeight: 900,
          color: "#3d2f0d",
          marginBottom: "0.5rem",
        }}>
          Choose a{" "}
          <span style={{
            background: "linear-gradient(135deg, #b45309, #d97706, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Subject</span>
        </h1>
        <p style={{ color: "#8b7355", fontSize: "1rem" }}>
          Select a subject to get your AI-generated 4-week study plan
        </p>
      </motion.div>

      {/* SEARCH & FILTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "2.5rem",
          maxWidth: "600px",
          margin: "0 auto 2.5rem",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search size={16} style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#a0845e",
          }} />
          <input
            id="subject-search"
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              borderRadius: "1rem",
              border: "1.5px solid #d4c4a0",
              background: "rgba(255, 252, 240, 0.8)",
              color: "#3d2f0d",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`filter-${cat.id}`}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "2rem",
                border: category === cat.id ? "1.5px solid #b45309" : "1.5px solid #d4c4a0",
                background: category === cat.id ? "rgba(180, 83, 9, 0.1)" : "rgba(255, 252, 240, 0.6)",
                color: category === cat.id ? "#b45309" : "#8b7355",
                fontSize: "0.85rem",
                fontWeight: category === cat.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* SUBJECT ICON GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "1.5rem",
        maxWidth: "900px",
        margin: "0 auto",
      }}>
        {filtered.map((subject, i) => (
          <motion.button
            key={subject.id}
            id={`subject-${subject.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 200 }}
            onClick={() => handleSelect(subject.id)}
            disabled={loading === subject.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1.5rem 0.75rem",
              borderRadius: "1.25rem",
              border: "1.5px solid transparent",
              background: "rgba(255, 252, 240, 0.5)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            whileHover={{
              y: -8,
              scale: 1.03,
              transition: { duration: 0.25 },
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(255, 252, 240, 0.95)";
              el.style.borderColor = subject.color;
              el.style.boxShadow = `0 8px 32px ${subject.color}22, 0 0 20px ${subject.color}15`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(255, 252, 240, 0.5)";
              el.style.borderColor = "transparent";
              el.style.boxShadow = "none";
            }}
          >
            {/* Floating icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3 + (i % 3) * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                fontSize: "2.75rem",
                lineHeight: 1,
                filter: `drop-shadow(0 4px 8px ${subject.color}33)`,
              }}
            >
              {subject.icon}
            </motion.div>

            {/* Subject name — bold and illuminating */}
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "0.85rem",
              color: "#3d2f0d",
              textAlign: "center",
              lineHeight: 1.2,
              textShadow: `0 0 20px ${subject.color}40`,
              transition: "text-shadow 0.3s, color 0.3s",
            }}>
              {subject.shortName}
            </span>

            {/* Loading indicator */}
            {loading === subject.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 252, 240, 0.9)",
                  borderRadius: "1.25rem",
                }}
              >
                <Loader2 size={20} style={{ color: subject.color }} className="animate-spin" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#8b7355" }}>
          No subjects found for <strong>&quot;{search}&quot;</strong>
        </div>
      )}

      {/* Glow keyframes */}
      <style jsx global>{`
        @keyframes subtleGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.08); }
        }
      `}</style>
    </div>
  );
}
