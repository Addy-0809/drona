"use client";
// src/app/(app)/resources/[topicId]/page.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink, Youtube, Loader2, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "";
  const subject = searchParams.get("subject") || "";

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2rem" }}>
        {/* Back link */}
        <Link
          href="/subjects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#a0845e",
            fontSize: "0.82rem",
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={14} />
          Back to Subjects
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
          }}>
            <Youtube size={20} color="#fff" />
          </div>
          <div>
            <p style={{
              color: "#ef4444",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}>
              Free Resources
            </p>
          </div>
        </div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
          fontWeight: 900,
          color: "#3d2f0d",
          marginBottom: "0.25rem",
        }}>
          {topic || "Resources"}
        </h1>
        {subject && (
          <p style={{ color: "#8b7355", fontSize: "0.9rem" }}>{subject}</p>
        )}
      </motion.div>

      {/* LOADING */}
      {loading && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "5rem 0", gap: "1rem",
        }}>
          <div style={{ position: "relative", width: 56, height: 56 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "3px solid rgba(239,68,68,0.15)",
              borderTopColor: "#ef4444",
              animation: "spin 1s linear infinite",
            }} />
            <Youtube size={20} style={{
              position: "absolute", inset: 0, margin: "auto", color: "#ef4444",
            }} />
          </div>
          <p style={{ color: "#5a4a22", fontWeight: 600 }}>Finding the best videos for you...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{
          padding: "1.25rem 1.5rem",
          borderRadius: "1rem",
          background: "rgba(192,57,43,0.06)",
          border: "1.5px solid rgba(192,57,43,0.2)",
          color: "#c0392b",
          fontSize: "0.88rem",
          maxWidth: "500px",
        }}>
          {error}. Make sure your YouTube API key is configured.
        </div>
      )}

      {/* VIDEO GRID */}
      {!loading && !error && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}>
          {videos.map((video, i) => (
            <motion.a
              key={video.videoId}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              id={`video-${video.videoId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "1.25rem",
                background: "rgba(255,252,240,0.7)",
                border: "1.5px solid rgba(184,134,11,0.12)",
                overflow: "hidden",
                textDecoration: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
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
              {/* Thumbnail — proper 16:9 */}
              <div style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%", /* 16:9 ratio */
                overflow: "hidden",
                background: "#1a1a1a",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Play overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.3)",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
                  className="play-overlay"
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "#ef4444",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
                  }}>
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: "18px solid white",
                      borderTop: "11px solid transparent",
                      borderBottom: "11px solid transparent",
                      marginLeft: "3px",
                    }} />
                  </div>
                </div>
                {/* YouTube badge */}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(0,0,0,0.7)",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "0.68rem", fontWeight: 600,
                  color: "#fff",
                  backdropFilter: "blur(4px)",
                }}>
                  <Youtube size={10} style={{ color: "#ef4444" }} />
                  YouTube
                </div>
              </div>

              {/* Content */}
              <div style={{
                padding: "1rem 1.25rem 1.25rem",
                display: "flex", flexDirection: "column", gap: "6px",
                flex: 1,
              }}>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#3d2f0d",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  margin: 0,
                }}>
                  {video.title}
                </h3>
                <p style={{
                  color: "#B8860B",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  margin: 0,
                }}>
                  {video.channel}
                </p>
                <p style={{
                  color: "#8b7355",
                  fontSize: "0.75rem",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  flex: 1,
                  margin: 0,
                }}>
                  {video.description}
                </p>

                {/* Footer */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(184,134,11,0.1)",
                }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    color: "#a0845e", fontSize: "0.72rem",
                  }}>
                    <Clock size={11} />
                    {new Date(video.publishedAt).getFullYear()}
                  </span>
                  <span style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    color: "#ef4444", fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    Watch <ExternalLink size={11} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#8b7355" }}>
          No videos found. Try a different topic or check your YouTube API key.
        </div>
      )}

      {/* Hover style for play overlay */}
      <style>{`
        a:hover .play-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
