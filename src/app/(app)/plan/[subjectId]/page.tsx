"use client";
// src/app/(app)/plan/[subjectId]/page.tsx
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSubjectById } from "@/lib/subjects";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Youtube, Loader2, BookOpen, Trophy, Clock } from "lucide-react";
import Link from "next/link";

interface Topic {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  day: number;
}

interface Week {
  weekNumber: number;
  title: string;
  goal: string;
  topics: Topic[];
}

interface Plan {
  subject: string;
  totalWeeks: number;
  weeks: Week[];
}

export default function PlanPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = getSubjectById(subjectId);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, subjectName: subject?.name }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error ${res.status}`);
      }
      const data = await res.json();
      if (!data.plan) {
        throw new Error("No plan data received from AI");
      }
      setPlan(data.plan);
      setPlanId(data.planId);
    } catch (e) {
      console.error("Failed to load plan:", e);
      setError(e instanceof Error ? e.message : "Failed to generate study plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subject) fetchPlan();
  }, [subjectId, subject]);

  const toggleTopic = (topicId: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const totalTopics = plan?.weeks.flatMap((w) => w.topics).length ?? 0;
  const progressPct = totalTopics ? Math.round((completedTopics.size / totalTopics) * 100) : 0;

  if (!subject) return <div style={{ padding: "2rem", color: "#c0392b" }}>Subject not found.</div>;

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2rem" }}>
        {/* Subject name + icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.5rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${subject.color}20, ${subject.color}10)`,
            border: `1.5px solid ${subject.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem",
          }}>
            {subject.icon}
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 900,
              color: "#3d2f0d",
              lineHeight: 1.2,
            }}>
              <span style={{ color: subject.color }}>{subject.shortName}</span> Study Plan
            </h1>
          </div>
        </div>
        <p style={{ color: "#8b7355", fontSize: "0.9rem", marginBottom: "1.25rem", marginLeft: "60px" }}>
          {subject.description}
        </p>

        {/* PROGRESS BAR */}
        {plan && (
          <div style={{
            padding: "1.25rem 1.5rem",
            borderRadius: "1rem",
            background: "rgba(255,252,240,0.7)",
            border: "1.5px solid rgba(184,134,11,0.12)",
            maxWidth: "480px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#8b7355", fontSize: "0.85rem", fontWeight: 500 }}>Overall Progress</span>
              <span style={{ color: subject.color, fontSize: "0.85rem", fontWeight: 700 }}>
                {completedTopics.size}/{totalTopics} topics
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 99, background: "rgba(184,134,11,0.08)",
              overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  height: "100%", borderRadius: 99,
                  background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)`,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <span style={{ color: "#a0845e", fontSize: "0.78rem" }}>{progressPct}% complete</span>
              {progressPct === 100 && (
                <Link
                  href={`/test/${subjectId}?planId=${planId}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    color: "#10b981", fontSize: "0.78rem", fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Trophy size={12} /> Take the test!
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "5rem 0", gap: "1rem",
        }}>
          <div style={{ position: "relative", width: 64, height: 64 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              border: `3px solid ${subject.color}20`,
              borderTopColor: subject.color,
              animation: "spin 1s linear infinite",
            }} />
            <BookOpen size={22} style={{
              position: "absolute", inset: 0, margin: "auto",
              color: subject.color,
            }} />
          </div>
          <p style={{ color: "#5a4a22", fontWeight: 600 }}>
            Gemini AI is creating your personalised study plan...
          </p>
          <p style={{ color: "#a0845e", fontSize: "0.85rem" }}>This may take 15–30 seconds</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div style={{ maxWidth: "420px", margin: "4rem auto", textAlign: "center" }}>
          <div style={{
            padding: "2rem",
            borderRadius: "1.25rem",
            background: "rgba(255,252,240,0.8)",
            border: "1.5px solid rgba(192,57,43,0.2)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(192,57,43,0.08)",
              border: "1.5px solid rgba(192,57,43,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "1.5rem",
            }}>⚠️</div>
            <h3 style={{ color: "#3d2f0d", fontWeight: 700, marginBottom: "0.5rem", fontFamily: "'Outfit', sans-serif" }}>
              Failed to Generate Plan
            </h3>
            <p style={{ color: "#c0392b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>{error}</p>
            <button
              onClick={fetchPlan}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)`,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: `0 4px 16px ${subject.color}30`,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* WEEKS ACCORDION */}
      {plan && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "800px" }}>
          {plan.weeks.map((week) => {
            const weekTopicIds = week.topics.map((t) => t.id);
            const weekCompleted = weekTopicIds.filter((id) => completedTopics.has(id)).length;
            const weekPct = Math.round((weekCompleted / week.topics.length) * 100);
            const isOpen = expandedWeek === week.weekNumber;

            return (
              <motion.div
                key={week.weekNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: week.weekNumber * 0.08 }}
                style={{
                  borderRadius: "1.25rem",
                  background: "rgba(255,252,240,0.7)",
                  border: isOpen
                    ? `1.5px solid ${subject.color}30`
                    : "1.5px solid rgba(184,134,11,0.12)",
                  overflow: "hidden",
                  transition: "border-color 0.3s",
                }}
              >
                {/* WEEK HEADER */}
                <button
                  id={`week-${week.weekNumber}-toggle`}
                  onClick={() => setExpandedWeek(isOpen ? 0 : week.weekNumber)}
                  style={{
                    width: "100%",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* Week number badge */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: "0.8rem",
                    fontFamily: "'Outfit', sans-serif",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${subject.color}25`,
                  }}>
                    W{week.weekNumber}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#3d2f0d",
                      marginBottom: "2px",
                    }}>
                      {week.title}
                    </p>
                    <p style={{ color: "#8b7355", fontSize: "0.78rem", margin: 0 }}>
                      {week.goal}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "#5a4a22", fontSize: "0.78rem", fontWeight: 600 }}>
                        {weekCompleted}/{week.topics.length}
                      </p>
                      <p style={{ color: subject.color, fontSize: "0.72rem", fontWeight: 700 }}>
                        {weekPct}%
                      </p>
                    </div>
                    {isOpen
                      ? <ChevronUp size={16} style={{ color: "#a0845e" }} />
                      : <ChevronDown size={16} style={{ color: "#a0845e" }} />
                    }
                  </div>
                </button>

                {/* WEEK PROGRESS BAR */}
                <div style={{ padding: "0 1.5rem 4px" }}>
                  <div style={{ height: 3, borderRadius: 99, background: "rgba(184,134,11,0.08)" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${weekPct}%`,
                      background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)`,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>

                {/* TOPICS LIST */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        padding: "0.75rem 1.5rem 1.5rem",
                        borderTop: "1px solid rgba(184,134,11,0.08)",
                        display: "flex", flexDirection: "column", gap: "0.6rem",
                      }}>
                        {week.topics.map((topic) => {
                          const done = completedTopics.has(topic.id);
                          return (
                            <div
                              key={topic.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                                padding: "0.9rem 1rem",
                                borderRadius: "0.85rem",
                                background: done
                                  ? "rgba(16,185,129,0.06)"
                                  : "rgba(255,252,240,0.5)",
                                border: done
                                  ? "1px solid rgba(16,185,129,0.2)"
                                  : "1px solid rgba(184,134,11,0.08)",
                                transition: "all 0.2s",
                              }}
                            >
                              {/* Checkbox */}
                              <button
                                id={`topic-check-${topic.id}`}
                                onClick={() => toggleTopic(topic.id)}
                                style={{
                                  marginTop: 2, flexShrink: 0,
                                  background: "none", border: "none",
                                  cursor: "pointer", padding: 0,
                                }}
                              >
                                {done
                                  ? <CheckCircle2 size={20} style={{ color: "#10b981" }} />
                                  : <Circle size={20} style={{ color: "#d4c4a0" }} />
                                }
                              </button>

                              {/* Topic content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: "0.88rem",
                                  fontWeight: 600,
                                  color: done ? "#a0845e" : "#3d2f0d",
                                  textDecoration: done ? "line-through" : "none",
                                  marginBottom: "3px",
                                  fontFamily: "'Outfit', sans-serif",
                                }}>
                                  Day {topic.day}: {topic.name}
                                </p>
                                <p style={{ color: "#8b7355", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>
                                  {topic.description}
                                </p>
                                <div style={{
                                  display: "flex", alignItems: "center", gap: "4px",
                                  color: "#a0845e", fontSize: "0.72rem",
                                  marginTop: "6px",
                                }}>
                                  <Clock size={11} />
                                  ~{topic.estimatedHours}h
                                </div>
                              </div>

                              {/* Video link */}
                              <Link
                                href={`/resources/${topic.id}?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(subject.name)}`}
                                id={`topic-resources-${topic.id}`}
                                style={{
                                  display: "flex", alignItems: "center", gap: "4px",
                                  flexShrink: 0,
                                  padding: "0.35rem 0.7rem",
                                  borderRadius: "0.5rem",
                                  background: "rgba(239,68,68,0.06)",
                                  border: "1px solid rgba(239,68,68,0.15)",
                                  color: "#ef4444",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  transition: "all 0.2s",
                                }}
                              >
                                <Youtube size={12} />
                                Videos
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
