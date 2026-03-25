"use client";
// src/app/(app)/dashboard/page.tsx
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Youtube, ClipboardList,
  FileUp, ArrowRight, Sparkles, GraduationCap,
  Brain, Target, TrendingUp, CheckCircle2, BarChart3,
} from "lucide-react";
import { getSubjectById } from "@/lib/subjects";

interface SubjectProgress {
  completedTopics: string[];
  totalStudied: number;
  subjectName: string | null;
  updatedAt: string | null;
}

const quickActions = [
  {
    id: "choose-subject",
    href: "/subjects",
    icon: BookOpen,
    label: "Choose a Subject",
    desc: "Pick from 14 subjects and start your journey",
    color: "#6366f1",
    bg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    lightBg: "rgba(99,102,241,0.08)",
  },
  {
    id: "study-plan",
    href: "/plan",
    icon: ClipboardList,
    label: "Study Plan",
    desc: "View your AI-generated weekly study schedule",
    color: "#0ea5e9",
    bg: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    lightBg: "rgba(14,165,233,0.08)",
  },
  {
    id: "resources",
    href: "/resources",
    icon: Youtube,
    label: "Resources",
    desc: "Watch curated YouTube videos for every topic",
    color: "#ef4444",
    bg: "linear-gradient(135deg, #ef4444, #f97316)",
    lightBg: "rgba(239,68,68,0.08)",
  },
  {
    id: "mock-test",
    href: "/test",
    icon: Target,
    label: "Mock Tests",
    desc: "Take AI-generated tests to evaluate your knowledge",
    color: "#f59e0b",
    bg: "linear-gradient(135deg, #f59e0b, #f97316)",
    lightBg: "rgba(245,158,11,0.08)",
  },
  {
    id: "feedback",
    href: "/feedback",
    icon: TrendingUp,
    label: "Performance",
    desc: "See your strengths, weaknesses and AI feedback",
    color: "#10b981",
    bg: "linear-gradient(135deg, #10b981, #14b8a6)",
    lightBg: "rgba(16,185,129,0.08)",
  },
  {
    id: "paper-upload",
    href: "/paper",
    icon: FileUp,
    label: "Paper Analysis",
    desc: "Upload a university paper — get a mock version",
    color: "#ec4899",
    bg: "linear-gradient(135deg, #ec4899, #a855f7)",
    lightBg: "rgba(236,72,153,0.08)",
  },
];

const steps = [
  { num: "01", icon: BookOpen, title: "Choose Subject", desc: "Pick from 14 curated subjects" },
  { num: "02", icon: Brain, title: "AI Plans Your Path", desc: "Get a personalized 4-week schedule" },
  { num: "03", icon: Youtube, title: "Learn with Videos", desc: "YouTube lectures for every topic" },
  { num: "04", icon: Target, title: "Take Mock Tests", desc: "AI-generated exam papers" },
  { num: "05", icon: GraduationCap, title: "Upload Answers", desc: "Submit handwritten answer sheets" },
  { num: "06", icon: TrendingUp, title: "Get AI Feedback", desc: "Detailed performance analysis" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";
  const [progressMap, setProgressMap] = useState<Record<string, SubjectProgress>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Fetch all-subjects progress on mount
  useEffect(() => {
    if (!session?.user?.email) return;
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            setProgressMap(data.progress);
          }
        }
      } catch {
        // Non-fatal
      } finally {
        setProgressLoaded(true);
      }
    };
    fetchProgress();
  }, [session?.user?.email]);

  const studiedSubjects = Object.entries(progressMap)
    .filter(([, info]) => info.totalStudied > 0)
    .sort((a, b) => {
      // Sort by most recently updated
      const dateA = a[1].updatedAt ? new Date(a[1].updatedAt).getTime() : 0;
      const dateB = b[1].updatedAt ? new Date(b[1].updatedAt).getTime() : 0;
      return dateB - dateA;
    });

  const totalTopicsCompleted = studiedSubjects.reduce((sum, [, info]) => sum + info.totalStudied, 0);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* HERO HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: "2.5rem",
          padding: "2rem 2.5rem",
          borderRadius: "1.5rem",
          background: "linear-gradient(135deg, rgba(184,134,11,0.08) 0%, rgba(218,165,32,0.06) 100%)",
          border: "1px solid rgba(184,134,11,0.15)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 120, height: 120, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(218,165,32,0.12), rgba(184,134,11,0.05))",
        }} />
        <div style={{
          position: "absolute", bottom: -20, right: 60,
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Sparkles size={16} style={{ color: "#DAA520" }} />
            <span style={{ color: "#B8860B", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              AI Learning Platform
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 900,
            color: "#3d2f0d",
            marginBottom: "0.5rem",
            lineHeight: 1.2,
          }}>
            {greeting},{" "}
            <span style={{
              background: "linear-gradient(135deg, #B8860B, #DAA520, #CD853F)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {firstName}!
            </span>
          </h1>
          <p style={{ color: "#8b7355", fontSize: "1rem", maxWidth: "500px" }}>
            {studiedSubjects.length > 0
              ? `You're studying ${studiedSubjects.length} subject${studiedSubjects.length > 1 ? "s" : ""} with ${totalTopicsCompleted} topics completed. Keep going!`
              : "What would you like to study today? Pick up where you left off or start something new."
            }
          </p>
        </div>
      </motion.div>

      {/* YOUR PROGRESS SECTION — only shown when user has studied at least 1 subject */}
      {progressLoaded && studiedSubjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: "2.5rem" }}
        >
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #14b8a6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BarChart3 size={16} color="#fff" />
            </div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              color: "#3d2f0d",
              margin: 0,
            }}>
              Your Progress
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#10b981",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
              padding: "3px 10px",
              borderRadius: "2rem",
            }}>
              {totalTopicsCompleted} topics completed
            </span>
          </div>

          {/* Subject progress cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}>
            {studiedSubjects.map(([sid, info], i) => {
              const subject = getSubjectById(sid);
              const subjectColor = subject?.color || "#6366f1";
              const subjectIcon = subject?.icon || "📘";
              const subjectShortName = subject?.shortName || info.subjectName || sid;

              return (
                <motion.div
                  key={sid}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderRadius: "1.25rem",
                    background: "rgba(255,252,240,0.7)",
                    border: `1.5px solid ${subjectColor}20`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = "translateY(-3px)";
                    el.style.borderColor = subjectColor + "40";
                    el.style.boxShadow = `0 8px 30px ${subjectColor}12, 0 2px 8px rgba(0,0,0,0.03)`;
                    el.style.background = "rgba(255,252,240,0.95)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = "translateY(0)";
                    el.style.borderColor = subjectColor + "20";
                    el.style.boxShadow = "none";
                    el.style.background = "rgba(255,252,240,0.7)";
                  }}
                >
                  {/* Top row: icon + name + topic count */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "1.5rem" }}>{subjectIcon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#3d2f0d",
                        margin: 0,
                      }}>
                        {subjectShortName}
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "2px 8px",
                      borderRadius: "0.5rem",
                      background: `${subjectColor}10`,
                      border: `1px solid ${subjectColor}20`,
                    }}>
                      <CheckCircle2 size={12} style={{ color: subjectColor }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: subjectColor }}>
                        {info.totalStudied} topics
                      </span>
                    </div>
                  </div>

                  {/* Recent topics */}
                  {info.completedTopics.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: "4px",
                      }}>
                        {info.completedTopics.slice(0, 3).map((topic, idx) => (
                          <span key={idx} style={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            color: "#8b7355",
                            background: "rgba(184,134,11,0.06)",
                            border: "1px solid rgba(184,134,11,0.1)",
                            padding: "2px 8px",
                            borderRadius: "0.4rem",
                            maxWidth: "150px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {topic}
                          </span>
                        ))}
                        {info.completedTopics.length > 3 && (
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: "#a0845e",
                            padding: "2px 6px",
                          }}>
                            +{info.completedTopics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/plan/${sid}`}
                      style={{
                        flex: 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "0.65rem",
                        background: `linear-gradient(135deg, ${subjectColor}, ${subjectColor}dd)`,
                        color: "#fff",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: `0 2px 10px ${subjectColor}25`,
                        transition: "all 0.2s",
                      }}
                    >
                      <ClipboardList size={12} /> Continue
                    </Link>
                    <Link
                      href={`/test/${sid}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "0.65rem",
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        color: "#f59e0b",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        transition: "all 0.2s",
                      }}
                    >
                      <Target size={12} /> Test
                    </Link>
                  </div>

                  {/* Updated time */}
                  {info.updatedAt && (
                    <p style={{
                      margin: "8px 0 0",
                      fontSize: "0.68rem",
                      color: "#b8a080",
                    }}>
                      Last studied: {new Date(info.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short",
                      })}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* QUICK ACTION CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2.5rem",
      }}>
        {quickActions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (studiedSubjects.length > 0 ? 0.3 : 0) + i * 0.06, type: "spring", stiffness: 200 }}
          >
            <Link
              href={action.href}
              id={action.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "1.5rem",
                borderRadius: "1.25rem",
                background: "rgba(255,252,240,0.7)",
                border: "1.5px solid rgba(184,134,11,0.12)",
                textDecoration: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-4px)";
                el.style.borderColor = action.color + "40";
                el.style.boxShadow = `0 12px 40px ${action.color}15, 0 4px 12px rgba(0,0,0,0.04)`;
                el.style.background = "rgba(255,252,240,0.95)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0)";
                el.style.borderColor = "rgba(184,134,11,0.12)";
                el.style.boxShadow = "none";
                el.style.background = "rgba(255,252,240,0.7)";
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: action.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 4px 16px ${action.color}30`,
              }}>
                <action.icon size={22} color="#fff" />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#3d2f0d",
                  marginBottom: "4px",
                }}>
                  {action.label}
                </h3>
                <p style={{
                  color: "#8b7355",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {action.desc}
                </p>
              </div>

              {/* Arrow */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: action.lightBg,
                flexShrink: 0,
                alignSelf: "center",
                transition: "transform 0.2s",
              }}>
                <ArrowRight size={14} color={action.color} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* HOW IT WORKS — TIMELINE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: studiedSubjects.length > 0 ? 0.6 : 0.5 }}
        style={{
          padding: "2rem",
          borderRadius: "1.5rem",
          background: "linear-gradient(135deg, rgba(184,134,11,0.05), rgba(218,165,32,0.03))",
          border: "1px solid rgba(184,134,11,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #DAA520, #B8860B)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "#3d2f0d",
            margin: 0,
          }}>
            How Drona Works
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (studiedSubjects.length > 0 ? 0.7 : 0.6) + i * 0.06 }}
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                background: "rgba(255,252,240,0.6)",
                border: "1px solid rgba(184,134,11,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "0.75rem",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "rgba(184,134,11,0.08)",
                  border: "1px solid rgba(184,134,11,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <step.icon size={18} style={{ color: "#B8860B" }} />
                </div>
              </div>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "#DAA520",
                letterSpacing: "0.1em",
                display: "block",
                marginBottom: "4px",
              }}>
                STEP {step.num}
              </span>
              <h4 style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#3d2f0d",
                marginBottom: "4px",
              }}>
                {step.title}
              </h4>
              <p style={{
                color: "#8b7355",
                fontSize: "0.75rem",
                lineHeight: 1.4,
                margin: 0,
              }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
