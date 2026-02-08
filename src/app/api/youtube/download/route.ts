import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const itag = searchParams.get("itag");
    const title = searchParams.get("title") || "video";

    if (!url || !itag) {
        return NextResponse.json(
            { error: "URL and itag are required" },
            { status: 400 }
        );
    }

    try {
        const headers = new Headers();
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_");

        // Use the extension provided by the frontend, or default to mp4
        const ext = searchParams.get("ext") || "mp4";
        headers.set("Content-Disposition", `attachment; filename="${safeTitle}.${ext}"`);

        // Create a stream
        // Note: Next.js App Router (edge/node) streaming response
        // We need to pipe the ytdl stream to the response

        // Using simple stream passing. 
        // We are running in Node env (default for App Router unless edge specified)

        // Using highWaterMark to improve stability
        const stream = ytdl(url, {
            quality: Number(itag),
            highWaterMark: 1 << 25, // 32MB buffer
            filter: 'audioandvideo' // fallback, though quality itag overrides
        });

        // Convert Node stream to Web ReadableStream with better error handling
        const readableStream = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => controller.enqueue(chunk));
                stream.on('end', () => controller.close());
                stream.on('error', (err) => {
                    console.error("Stream Error:", err);
                    controller.error(err);
                });
            },
            cancel() {
                stream.destroy();
            }
        });

        return new NextResponse(readableStream, {
            headers,
        });

    } catch (error) {
        console.error("YouTube Download Error:", error);
        return NextResponse.json(
            { error: "Failed to download video" },
            { status: 500 }
        );
    }
}
