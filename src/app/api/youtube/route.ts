// src/app/api/youtube/route.ts
// YouTube Data API v3 — fetches relevant educational videos for a given topic
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || "";
    const subject = searchParams.get("subject") || "";

    const query = encodeURIComponent(`${subject} ${topic} tutorial lecture explained`);
    const apiKey = process.env.YOUTUBE_API_KEY;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=medium&relevanceLanguage=en&maxResults=6&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

    const data = await res.json();

    const videos = (data.items || []).map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        description: string;
        thumbnails: { medium: { url: string } };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos, query: `${subject} ${topic}` });
  } catch (err) {
    console.error("YouTube API error:", err);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
