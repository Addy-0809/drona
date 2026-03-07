"use client";
// src/app/(app)/resources/[topicId]/page.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink, Youtube, Loader2, Clock } from "lucide-react";

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
    <div className="min-h-screen mesh-bg p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Youtube size={20} className="text-red-400" />
          <span className="text-red-400 text-sm font-medium">Free Resources</span>
        </div>
        <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {topic || "Resources"}
        </h1>
        {subject && <p className="text-slate-400">{subject}</p>}
      </motion.div>

      {loading && (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin text-red-400" />
          <p className="text-slate-400">Finding the best videos for you...</p>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}. Make sure your YouTube API key is configured.
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {videos.map((video, i) => (
            <motion.a
              key={video.videoId}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              id={`video-${video.videoId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card glass-hover overflow-hidden flex flex-col group"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-0.5 text-xs text-white flex items-center gap-1">
                  <Youtube size={10} className="text-red-400" />
                  YouTube
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">{video.title}</h3>
                <p className="text-xs text-slate-500">{video.channel}</p>
                <p className="text-xs text-slate-600 line-clamp-2 flex-1">{video.description}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(video.publishedAt).getFullYear()}
                  </span>
                  <span className="text-xs text-red-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Watch <ExternalLink size={10} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          No videos found. Try a different topic or check your YouTube API key.
        </div>
      )}
    </div>
  );
}
