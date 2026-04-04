"use client";
// src/app/(app)/resources/[topicId]/page.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Clock, ArrowLeft, X, Play, Maximize2, CheckCircle2 } from "lucide-react";

interface Video {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

export default function ResourcesPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic") || "";
  const subject = searchParams.get("subject") || "";
  const subjectId = searchParams.get("subjectId") || "";

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [topicMarked, setTopicMarked] = useState(false); // true once progress saved
  const markingRef = useRef(false); // prevent double-saves

  // Close modal on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setSelectedVideo(null);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-mark this topic as completed when a video is played
  const markTopicComplete = useCallback(async () => {
    if (!subjectId || !topicId || !topic || markingRef.current || topicMarked) return;
    markingRef.current = true;
    try {
      // 1. Load existing progress so we preserve other completed topics
      const existing = await fetch(`/api/progress?subjectId=${subjectId}`);
      const prog = existing.ok ? await existing.json() : {};
      const ids: string[] = prog.completedTopicIds || [];
      const names: string[] = prog.completedTopics || [];
      const nameMap: Record<string, string> = prog.topicNameMap || {};

      // 2. Append this topic if not already present
      if (!ids.includes(topicId)) {
        ids.push(topicId);
        names.push(topic);
        nameMap[topicId] = topic;
      }

      // 3. Save back via API (merges with existing plan data)
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          subjectName: subject,
          completedTopics: names,
          completedTopicIds: ids,
          topicNameMap: nameMap,
          // Preserve plan + planId if stored
          ...(prog.plan ? { plan: prog.plan } : {}),
          ...(prog.planId ? { planId: prog.planId } : {}),
        }),
      });
      if (res.ok) {
        setTopicMarked(true);
        // Update sessionStorage cache so plan page shows this topic as complete
        try {
          const keys = Object.keys(sessionStorage);
          // Find ALL matching plan cache keys for this subjectId
          const planKeys = keys.filter(k => k.includes(subjectId) && k.startsWith("plan_cache_"));
          for (const planKey of planKeys) {
            try {
              const cached = JSON.parse(sessionStorage.getItem(planKey) || "{}");
              if (!cached.completedTopicIds?.includes(topicId)) {
                cached.completedTopicIds = [...(cached.completedTopicIds || []), topicId];
                cached.topicNameMap = { ...(cached.topicNameMap || {}), [topicId]: topic };
                sessionStorage.setItem(planKey, JSON.stringify(cached));
              }
            } catch {
              // If the cache is corrupted, remove it so plan page re-fetches cleanly
              sessionStorage.removeItem(planKey);
            }
          }
        } catch { /* non-fatal */ }
      }
    } catch (e) {
      console.error("[resources] Failed to mark topic complete:", e);
    }
  }, [subjectId, topicId, topic, subject, topicMarked]);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch(`/api/youtube?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setVideos(data.videos);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    }
    if (topic) fetchVideos();
  }, [topic, subject]);

  // Helper: open video modal + trigger progress mark
  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    // Immediately invalidate the plan page's sessionStorage cache so that when
    // the user navigates back, the plan page is forced to re-read from Firestore
    // (picking up the newly-completed topic) instead of using stale cached data.
    if (subjectId) {
      try {
        Object.keys(sessionStorage)
          .filter(k => k.startsWith("plan_cache_") && k.includes(subjectId))
          .forEach(k => sessionStorage.removeItem(k));
      } catch { /* non-fatal */ }
    }
    markTopicComplete(); // fire-and-forget
  };

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "#a0845e", fontSize: "0.82rem", fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={14} /> Back to Study Plan
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
          }}>
            <Youtube size={20} color="#fff" />
          </div>
          <p style={{ color: "#ef4444", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Free Resources — Play in App
          </p>
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 900, color: "#3d2f0d", marginBottom: "0.25rem" }}>
          {topic || "Resources"}
        </h1>
        {subject && <p style={{ color: "#8b7355", fontSize: "0.9rem" }}>{subject}</p>}

        {/* Topic marked toast */}
        <AnimatePresence>
          {topicMarked && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: "0.75rem",
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "0.5rem 1rem", borderRadius: "0.75rem",
                background: "rgba(16,185,129,0.1)",
                border: "1.5px solid rgba(16,185,129,0.25)",
                color: "#10b981", fontSize: "0.82rem", fontWeight: 600,
              }}
            >
              <CheckCircle2 size={15} /> Topic marked as studied! You can now take mock tests.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* LOADING */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5rem 0", gap: "1rem" }}>
          <div style={{ position: "relative", width: 56, height: 56 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid rgba(239,68,68,0.15)", borderTopColor: "#ef4444", animation: "spin 1s linear infinite" }} />
            <Youtube size={20} style={{ position: "absolute", inset: 0, margin: "auto", color: "#ef4444" }} />
          </div>
          <p style={{ color: "#5a4a22", fontWeight: 600 }}>Finding the best videos for you...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{ padding: "1.25rem 1.5rem", borderRadius: "1rem", background: "rgba(192,57,43,0.06)", border: "1.5px solid rgba(192,57,43,0.2)", color: "#c0392b", fontSize: "0.88rem", maxWidth: "500px" }}>
          {error}. Make sure your YouTube API key is configured.
        </div>
      )}

      {/* VIDEO GRID */}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {videos.map((video, i) => (
            <motion.div
              key={video.videoId}
              id={`video-${video.videoId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => openVideo(video)}
              style={{
                display: "flex", flexDirection: "column",
                borderRadius: "1.25rem",
                background: "rgba(255,252,240,0.7)",
                border: "1.5px solid rgba(184,134,11,0.12)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(239,68,68,0.25)";
                el.style.boxShadow = "0 12px 40px rgba(239,68,68,0.08), 0 4px 12px rgba(0,0,0,0.04)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(184,134,11,0.12)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Thumbnail — 16:9 */}
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", overflow: "hidden", background: "#1a1a1a" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Play overlay */}
                <div className="play-overlay" style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.3s",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "#ef4444",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 24px rgba(239,68,68,0.6)",
                  }}>
                    <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
                  </div>
                </div>
                {/* In-app badge */}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(0,0,0,0.75)", borderRadius: "6px",
                  padding: "3px 8px",
                  display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "0.68rem", fontWeight: 700, color: "#fff", backdropFilter: "blur(4px)",
                }}>
                  <Play size={9} fill="#ef4444" color="#ef4444" /> Play in App
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "1rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#3d2f0d",
                  lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden", margin: 0,
                }}>
                  {video.title}
                </h3>
                <p style={{ color: "#B8860B", fontSize: "0.78rem", fontWeight: 600, margin: 0 }}>{video.channel}</p>
                <p style={{
                  color: "#8b7355", fontSize: "0.75rem", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden", flex: 1, margin: 0,
                }}>
                  {video.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "10px", borderTop: "1px solid rgba(184,134,11,0.1)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#a0845e", fontSize: "0.72rem" }}>
                    <Clock size={11} /> {new Date(video.publishedAt).getFullYear()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600 }}>
                    <Play size={11} /> Watch Now
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#8b7355" }}>
          No videos found. Try a different topic or check your YouTube API key.
        </div>
      )}

      {/* Hover style for play overlay */}
      <style>{`div:hover .play-overlay { opacity: 1 !important; }`}</style>

      {/* ── IN-APP VIDEO MODAL ── */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            key="video-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedVideo(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.88)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1.5rem",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 900,
                borderRadius: "1.5rem",
                background: "rgba(30,20,5,0.97)",
                border: "1px solid rgba(239,68,68,0.2)",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Modal header */}
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: "1rem 1.25rem 0.75rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                  <p style={{ color: "#ef4444", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3px" }}>
                    <Youtube size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    {selectedVideo.channel}
                  </p>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#f5e9c8", margin: 0, lineHeight: 1.4 }}>
                    {selectedVideo.title}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <a
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in YouTube"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: "0.5rem",
                      background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444", textDecoration: "none", transition: "background 0.2s",
                    }}
                  >
                    <Maximize2 size={14} />
                  </a>
                  <button
                    id="close-video-modal"
                    onClick={() => setSelectedVideo(null)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: "0.5rem",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#a0845e", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* iframe player — 16:9 */}
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#000" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: "100%", height: "100%",
                    border: "none",
                  }}
                />
              </div>

              {/* Footer hint */}
              <div style={{ padding: "0.6rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "#6b5a3a", fontSize: "0.7rem", margin: 0 }}>
                  Press <kbd style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace", fontSize: "0.68rem" }}>Esc</kbd> or click outside to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
