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
    // Save enrolled subject (optimistic — plan page will initiate the AI call)
    router.push(`/plan/${subjectId}`);
  }

  return (
    <div className="min-h-screen mesh-bg p-8">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Choose a <span className="gradient-text">Subject</span>
        </h1>
        <p className="text-slate-400">Select a subject to get your AI-generated 4-week study plan</p>
      </motion.div>

      {/* SEARCH & FILTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="subject-search"
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`filter-${cat.id}`}
              onClick={() => setCategory(cat.id)}
              className={`btn-secondary text-sm py-2 px-4 ${category === cat.id ? "!bg-indigo-600/20 !border-indigo-500/40 !text-indigo-300" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* SUBJECT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((subject, i) => (
          <motion.button
            key={subject.id}
            id={`subject-${subject.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSelect(subject.id)}
            disabled={loading === subject.id}
            className="card glass-hover p-6 text-left group relative overflow-hidden cursor-pointer disabled:opacity-60 w-full"
          >
            {/* Gradient bg blob */}
            <div
              className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${subject.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
            />

            <div className="text-4xl mb-4">{subject.icon}</div>
            <p className="text-xs font-semibold mb-1" style={{ color: subject.color }}>
              {subject.category.toUpperCase()}
            </p>
            <h3 className="font-bold text-white text-sm mb-2 leading-tight">{subject.name}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{subject.description}</p>

            <div className={`mt-4 flex items-center gap-2 text-xs font-semibold bg-gradient-to-r ${subject.gradient} bg-clip-text text-transparent`}>
              {loading === subject.id ? (
                <>
                  <Loader2 size={14} className="animate-spin text-indigo-400" />
                  <span className="text-indigo-400">Planning...</span>
                </>
              ) : (
                "Start Learning →"
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          No subjects found for <strong>"{search}"</strong>
        </div>
      )}
    </div>
  );
}
