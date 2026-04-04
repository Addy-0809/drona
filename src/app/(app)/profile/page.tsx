"use client";
// src/app/(app)/profile/page.tsx — Student Profile
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpen, Target, CheckCircle2, TrendingUp, Trophy,
  Calendar, Clock, BarChart3, ArrowRight, ClipboardList,
  Star, Zap, Flame, Award, GraduationCap, Loader2,
} from "lucide-react";
import { getSubjectById } from "@/lib/subjects";

/* ─────────────── Types ─────────────── */
interface SubjectProgress {
  completedTopics: string[];
  totalStudied: number;
  subjectName: string | null;
  updatedAt: string | null;
  totalTopicsInPlan: number;
  currentWeek: number;
}

interface TestRecord {
  testId: string;
  subjectId: string | null;
  subjectName: string | null;
  createdAt: string | null;
  topicsCount: number;
  totalMarks: number;
  weekNumber: number | null;
  hasFeedback: boolean;
  score: number | null;
  percentage: number | null;
  grade: string | null;
}

interface ProfileData {
  progress: Record<string, SubjectProgress>;
  tests: TestRecord[];
}

/* ─────────────── Helpers ─────────────── */
function scoreColor(pct: number) {
  if (pct >= 75) return "#10b981";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "#10b981";
  if (grade.startsWith("B")) return "#3b82f6";
  if (grade.startsWith("C")) return "#f59e0b";
  return "#ef4444";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtShortDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ─────────────── Achievements config ─────────────── */
const ACHIEVEMENTS = [
  { id: "first_topic",   icon: "🎯", label: "First Step",      desc: "Completed your first topic",        check: (p: Record<string, SubjectProgress>, t: TestRecord[]) => Object.values(p).some(s => s.totalStudied > 0) },
  { id: "five_topics",   icon: "📚", label: "Deep Dive",        desc: "Completed 5+ topics",               check: (p: Record<string, SubjectProgress>) => Object.values(p).reduce((s, x) => s + x.totalStudied, 0) >= 5 },
  { id: "ten_topics",    icon: "🔥", label: "On Fire",          desc: "Completed 10+ topics",              check: (p: Record<string, SubjectProgress>) => Object.values(p).reduce((s, x) => s + x.totalStudied, 0) >= 10 },
  { id: "multi_subject", icon: "⭐", label: "Polymath",         desc: "Studying 2+ subjects",              check: (p: Record<string, SubjectProgress>) => Object.keys(p).filter(k => p[k].totalStudied > 0).length >= 2 },
  { id: "first_test",    icon: "🏆", label: "Test Taker",       desc: "Took your first mock test",        check: (_: Record<string, SubjectProgress>, t: TestRecord[]) => t.length > 0 },
  { id: "first_score",   icon: "📊", label: "Score Seeker",     desc: "Got your first test score",        check: (_: Record<string, SubjectProgress>, t: TestRecord[]) => t.some(x => x.percentage !== null) },
  { id: "ace_test",      icon: "💯", label: "Ace",              desc: "Scored 90%+ in a test",            check: (_: Record<string, SubjectProgress>, t: TestRecord[]) => t.some(x => (x.percentage ?? 0) >= 90) },
  { id: "pass_test",     icon: "✅", label: "Passing Grade",    desc: "Scored 75%+ in a test",            check: (_: Record<string, SubjectProgress>, t: TestRecord[]) => t.some(x => (x.percentage ?? 0) >= 75) },
];

/* ─────────────── Page ─────────────── */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Still hydrating — keep spinner, don't fetch yet
    if (status === "loading") return;
    // Not signed in — stop spinner, show nothing
    if (status === "unauthenticated" || !session?.user?.email) {
      setLoading(false);
      return;
    }
    // Authenticated — fetch profile data (with one auto-retry for transient auth issues)
    (async () => {
      const attempt = async () => {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      };
      try {
        const json = await attempt();
        setData(json);
      } catch {
        // One automatic retry after 1.5 s — handles transient session-cookie
        // timing issues where the server isn't ready immediately.
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const json = await attempt();
          setData(json);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session?.user?.email]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";
  const studiedSubjects = data
    ? Object.entries(data.progress).filter(([, s]) => s.totalStudied > 0)
    : [];
  const totalTopics = studiedSubjects.reduce((s, [, p]) => s + p.totalStudied, 0);
  const testsTaken = data?.tests.length ?? 0;

  /* achievements */
  const earned = data
    ? ACHIEVEMENTS.filter(a => a.check(data.progress, data.tests))
    : [];

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5rem 0", gap: "1rem" }}>
          <Loader2 size={32} style={{ color: "#B8860B", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#8b7355", fontWeight: 600 }}>Loading your profile...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && !loading && (
        <div style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "2rem", borderRadius: "1.25rem", background: "rgba(255,252,240,0.8)", border: "1.5px solid rgba(192,57,43,0.2)" }}>
          <p style={{ color: "#c0392b", marginBottom: "0.5rem" }}>⚠️ {error}</p>
          <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.65rem", background: "#B8860B", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ══════════════ A — HERO CARD ══════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "2rem 2.5rem",
              borderRadius: "1.5rem",
              background: "linear-gradient(135deg, rgba(184,134,11,0.09) 0%, rgba(218,165,32,0.06) 50%, rgba(255,252,240,0.8) 100%)",
              border: "1.5px solid rgba(184,134,11,0.2)",
              marginBottom: "2rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "linear-gradient(135deg, rgba(218,165,32,0.1), transparent)" }} />
            <div style={{ position: "absolute", bottom: -30, right: 100, width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, rgba(99,102,241,0.07), transparent)" }} />

            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              {/* Avatar */}
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={88}
                  height={88}
                  style={{ borderRadius: "50%", border: "3px solid #DAA520", boxShadow: "0 4px 20px rgba(184,134,11,0.3)", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 88, height: 88, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #DAA520, #B8860B)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: "2rem",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: "0 4px 20px rgba(184,134,11,0.3)",
                }}>
                  {session?.user?.name?.[0] ?? "S"}
                </div>
              )}

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <GraduationCap size={16} style={{ color: "#B8860B" }} />
                  <span style={{ color: "#B8860B", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Student Profile</span>
                </div>
                <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#3d2f0d", marginBottom: 4, lineHeight: 1.2 }}>
                  {session?.user?.name ?? "Student"}
                </h1>
                <p style={{ color: "#8b7355", fontSize: "0.88rem" }}>{session?.user?.email}</p>
              </div>

              {/* Stat pills */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {[
                  { icon: CheckCircle2, label: "Topics Done", value: totalTopics, color: "#10b981" },
                  { icon: BookOpen,     label: "Subjects",    value: studiedSubjects.length, color: "#6366f1" },
                  { icon: Target,       label: "Tests Taken", value: testsTaken, color: "#f59e0b" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{
                    padding: "0.9rem 1.25rem",
                    borderRadius: "1rem",
                    background: "rgba(255,252,240,0.8)",
                    border: `1.5px solid ${color}20`,
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

          {/* ══════════════ B — STUDY PROGRESS ══════════════ */}
          {studiedSubjects.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={18} color="#fff" />
                </div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#3d2f0d", margin: 0 }}>Study Progress</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {studiedSubjects.map(([sid, info], i) => {
                  const subject = getSubjectById(sid);
                  const color = subject?.color ?? "#6366f1";
                  const pct = info.totalTopicsInPlan > 0
                    ? Math.round((info.totalStudied / info.totalTopicsInPlan) * 100)
                    : 0;
                  const currentWeek: number = (info as unknown as Record<string, number>).currentWeek ?? 1;

                  return (
                    <motion.div
                      key={sid}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      style={{
                        padding: "1.25rem 1.5rem",
                        borderRadius: "1.25rem",
                        background: "rgba(255,252,240,0.8)",
                        border: `1.5px solid ${color}20`,
                        transition: "all 0.25s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${color}12`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                    >
                      {/* Subject header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: "1.5rem" }}>{subject?.icon ?? "📘"}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#3d2f0d", margin: 0 }}>
                            {subject?.shortName ?? info.subjectName ?? sid}
                          </p>
                          <p style={{ color: "#8b7355", fontSize: "0.72rem", margin: 0 }}>
                            Week {currentWeek} · {info.totalStudied} topics done
                          </p>
                        </div>
                        <span style={{ padding: "2px 10px", borderRadius: "2rem", background: `${color}12`, border: `1px solid ${color}25`, fontSize: "0.72rem", fontWeight: 700, color }}>
                          {pct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 6, borderRadius: 99, background: "rgba(184,134,11,0.1)", marginBottom: 8, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 + i * 0.05 }}
                          style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                        <span style={{ color: "#a0845e", fontSize: "0.7rem" }}>{info.totalStudied}/{info.totalTopicsInPlan || "?"} topics</span>
                        {info.updatedAt && (
                          <span style={{ color: "#b8a080", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 3 }}>
                            <Clock size={10} /> {fmtShortDate(info.updatedAt)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link href={`/plan/${sid}`} style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "0.45rem", borderRadius: "0.65rem",
                          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                          color: "#fff", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none",
                        }}>
                          <ClipboardList size={12} /> Continue
                        </Link>
                        <Link href={`/test/${sid}`} style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "0.45rem 0.75rem", borderRadius: "0.65rem",
                          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                          color: "#f59e0b", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none",
                        }}>
                          <Target size={12} /> Test
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ══════════════ C — TEST HISTORY ══════════════ */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trophy size={18} color="#fff" />
              </div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#3d2f0d", margin: 0 }}>Test History</h2>
              {testsTaken > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "3px 10px", borderRadius: "2rem" }}>
                  {testsTaken} test{testsTaken > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {testsTaken === 0 ? (
              <div style={{ padding: "2.5rem", borderRadius: "1.25rem", background: "rgba(255,252,240,0.7)", border: "1.5px solid rgba(184,134,11,0.12)", textAlign: "center" }}>
                <Target size={32} style={{ color: "#d4c4a0", margin: "0 auto 1rem" }} />
                <p style={{ color: "#8b7355", fontWeight: 600, marginBottom: 4 }}>No tests taken yet</p>
                <p style={{ color: "#a0845e", fontSize: "0.82rem", marginBottom: "1rem" }}>Complete some topics and take a mock test to see your results here.</p>
                <Link href="/subjects" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1.25rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #B8860B, #DAA520)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
                  <BookOpen size={14} /> Start Studying
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data!.tests.map((test, i) => {
                  const subject = test.subjectId ? getSubjectById(test.subjectId) : null;
                  const color = subject?.color ?? "#6366f1";
                  const testType = test.weekNumber ? `Week ${test.weekNumber} Test` : "Full Syllabus";

                  return (
                    <motion.div
                      key={test.testId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "1rem 1.25rem",
                        borderRadius: "1rem",
                        background: "rgba(255,252,240,0.8)",
                        border: "1.5px solid rgba(184,134,11,0.1)",
                        flexWrap: "wrap",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.background = "rgba(255,252,240,0.95)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(184,134,11,0.1)"; e.currentTarget.style.background = "rgba(255,252,240,0.8)"; }}
                    >
                      {/* Subject icon */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1.5px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        {subject?.icon ?? "📝"}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#3d2f0d", marginBottom: 2 }}>
                          {test.subjectName ?? "Unknown Subject"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ padding: "1px 8px", borderRadius: "0.4rem", background: `${color}12`, fontSize: "0.68rem", fontWeight: 700, color }}>{testType}</span>
                          <span style={{ color: "#a0845e", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 3 }}>
                            <Calendar size={10} /> {fmtDate(test.createdAt)}
                          </span>
                          <span style={{ color: "#b8a080", fontSize: "0.7rem" }}>{test.topicsCount} topics covered</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div style={{ textAlign: "center", minWidth: 90, flexShrink: 0 }}>
                        {test.percentage !== null ? (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginBottom: 4 }}>
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: scoreColor(test.percentage) }}>
                                {test.percentage}%
                              </span>
                              {test.grade && (
                                <span style={{ padding: "2px 8px", borderRadius: "0.4rem", background: `${gradeColor(test.grade)}18`, border: `1px solid ${gradeColor(test.grade)}30`, fontSize: "0.75rem", fontWeight: 800, color: gradeColor(test.grade) }}>
                                  {test.grade}
                                </span>
                              )}
                            </div>
                            {/* Mini score bar */}
                            <div style={{ height: 4, borderRadius: 99, background: "rgba(184,134,11,0.1)", overflow: "hidden", width: 90 }}>
                              <div style={{ height: "100%", width: `${test.percentage}%`, borderRadius: 99, background: scoreColor(test.percentage), transition: "width 0.6s ease" }} />
                            </div>
                          </>
                        ) : (
                          <span style={{ padding: "4px 12px", borderRadius: "0.5rem", background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.15)", fontSize: "0.72rem", fontWeight: 600, color: "#a0845e" }}>
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Link to feedback */}
                      <Link
                        href={test.hasFeedback ? `/feedback/${test.testId}` : `/test/results/${test.testId}`}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 34, height: 34, borderRadius: "50%",
                          background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.15)",
                          color: "#B8860B", textDecoration: "none", flexShrink: 0,
                          transition: "all 0.2s",
                        }}
                        title={test.hasFeedback ? "View feedback" : "Grade answers"}
                      >
                        <ArrowRight size={15} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* ══════════════ D — ACHIEVEMENTS ══════════════ */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #DAA520, #B8860B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={18} color="#fff" />
              </div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#3d2f0d", margin: 0 }}>Achievements</h2>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 600, color: "#DAA520", background: "rgba(218,165,32,0.1)", border: "1px solid rgba(218,165,32,0.2)", padding: "3px 10px", borderRadius: "2rem" }}>
                {earned.length}/{ACHIEVEMENTS.length} unlocked
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {ACHIEVEMENTS.map((ach, i) => {
                const isEarned = data ? ach.check(data.progress, data.tests) : false;
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.04, type: "spring", stiffness: 200 }}
                    style={{
                      padding: "1.1rem",
                      borderRadius: "1rem",
                      background: isEarned ? "rgba(255,252,240,0.9)" : "rgba(255,252,240,0.4)",
                      border: isEarned ? "1.5px solid rgba(218,165,32,0.25)" : "1.5px solid rgba(184,134,11,0.08)",
                      textAlign: "center",
                      opacity: isEarned ? 1 : 0.45,
                      transition: "all 0.3s",
                      filter: isEarned ? "none" : "grayscale(60%)",
                      position: "relative",
                    }}
                  >
                    {isEarned && (
                      <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Star size={9} color="#fff" fill="#fff" />
                      </div>
                    )}
                    <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>{ach.icon}</span>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: isEarned ? "#3d2f0d" : "#8b7355", marginBottom: 3 }}>{ach.label}</p>
                    <p style={{ color: "#a0845e", fontSize: "0.68rem", lineHeight: 1.4 }}>{ach.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </>
      )}
    </div>
  );
}
