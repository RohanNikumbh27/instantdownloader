import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core"; // Using distube fork for better maintenance

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url || !ytdl.validateURL(url)) {
            return NextResponse.json(
                { error: "Invalid YouTube URL" },
                { status: 400 }
            );
        }

        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;

        // Filter formats: 
        // Video: MUST have video. 
        // Audio: MUST have audio AND NO video.
        const videoFormats = ytdl.filterFormats(info.formats, (f) => !!f.hasVideo);
        const audioFormats = ytdl.filterFormats(info.formats, (f) => !!f.hasAudio && !f.hasVideo);

        // Helper to estimate size if contentLength is missing
        const getSize = (f: ytdl.videoFormat) => {
            if (f.contentLength) return parseInt(f.contentLength);
            if (f.bitrate && videoDetails.lengthSeconds) {
                return Math.floor((f.bitrate * parseInt(videoDetails.lengthSeconds)) / 8);
            }
            return 0;
        };

        // Simplify format data for frontend
        const simplifiedFormats = videoFormats.map((f) => ({
            itag: f.itag,
            qualityLabel: f.qualityLabel,
            container: f.container,
            hasAudio: f.hasAudio,
            hasVideo: f.hasVideo,
            url: f.url,
            size: getSize(f),
            fps: f.fps
        })).sort((a, b) => {
            // Sort by resolution (qualityLabel like "720p") descending
            const getRes = (s: string) => parseInt(s) || 0;
            return getRes(b.qualityLabel) - getRes(a.qualityLabel);
        });

        const simplifiedAudioFormats = audioFormats.map((f) => ({
            itag: f.itag,
            qualityLabel: `${f.audioBitrate}kbps`, // Use bitrate as label
            container: f.container,
            hasAudio: f.hasAudio,
            hasVideo: f.hasVideo,
            audioBitrate: f.audioBitrate,
            size: getSize(f)
        })).sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))
            .filter((v, i, a) => a.findIndex(t => t.itag === v.itag) === i); // Remove duplicate itags

        // Remove duplicates based on quality label AND audio presence
        // We prefer formats with audio if available for a given resolution
        const uniqueVideoFormats = simplifiedFormats.filter((v, i, a) => {
            // Find index of first format with same quality
            const firstIndex = a.findIndex(t => t.qualityLabel === v.qualityLabel);
            // If current is the first, keep it
            if (i === firstIndex) return true;
            // If current has audio and the first one didn't, we effectively want to swap/keep this one? 
            // Actually, let's just keep ALL variants for now, or improve deduplication.
            // User wants "all options". Let's show: "720p (MP4)" and "720p (WebM)" etc.
            // But listing 10 "720p" items is bad.

            // Better strategy: Group by quality.
            // For this API, let's just return distinct combos of Quality + Container + AudioPresence.
            return a.findIndex(t => t.qualityLabel === v.qualityLabel && t.container === v.container && t.hasAudio === v.hasAudio) === i;
        });

        // Get best audio (for quick download if needed, though UI will show list)
        const bestAudio = simplifiedAudioFormats[0];


        return NextResponse.json({
            title: videoDetails.title,
            thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url, // Highest quality usually last
            duration: videoDetails.lengthSeconds,
            formats: uniqueVideoFormats,
            audioFormats: simplifiedAudioFormats, // Return all audio formats
            bestAudio: bestAudio
        });

    } catch (error) {
        console.error("YouTube Info Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch video info" },
            { status: 500 }
        );
    }
}
