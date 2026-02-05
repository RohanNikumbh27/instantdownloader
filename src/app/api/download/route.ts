import { NextRequest, NextResponse } from "next/server";

// Types for the response
interface MediaData {
    type: "image" | "video" | "carousel";
    url: string;
    thumbnail?: string;
    caption?: string;
    urls?: string[];
}

// Helper to extract shortcode from Instagram URL
function extractShortcode(url: string): string | null {
    const patterns = [
        /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/stories\/[^/]+\/(\d+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) {
            return match[1];
        }
    }
    return null;
}

// Clean URL
function cleanUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
        return url;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        const shortcode = extractShortcode(url);
        if (!shortcode) {
            return NextResponse.json(
                { error: "Invalid Instagram URL. Please use a valid post, reel, or story URL." },
                { status: 400 }
            );
        }

        const cleanedUrl = cleanUrl(url);

        // Check for RapidAPI key
        const rapidApiKey = process.env.RAPIDAPI_KEY;

        if (rapidApiKey) {
            // Use RapidAPI Instagram Downloader
            try {
                const response = await fetch('https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-and-media', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': rapidApiKey,
                        'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com'
                    },
                    body: JSON.stringify({ url: cleanedUrl })
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.Type === 'Post' || data.Type === 'Reel') {
                        const media = data.media?.[0];
                        if (media) {
                            return NextResponse.json({
                                type: media.type === 'video' ? 'video' : 'image',
                                url: media.uri,
                                thumbnail: data.thumbnail,
                                caption: data.caption,
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('RapidAPI error:', e);
            }
        }

        // Try using a free public API (cobalt.tools - open source, works reliably)
        try {
            const response = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    url: cleanedUrl,
                    isNoTTWatermark: true,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.status === 'stream' || data.status === 'redirect') {
                    const mediaUrl = data.url;
                    const isVideo = mediaUrl?.includes('.mp4') || data.type === 'video';

                    return NextResponse.json({
                        type: isVideo ? 'video' : 'image',
                        url: mediaUrl,
                    } as MediaData);
                }

                if (data.status === 'picker' && data.picker) {
                    // Carousel/multiple items
                    const urls = data.picker.map((item: { url: string }) => item.url);
                    return NextResponse.json({
                        type: 'carousel',
                        url: urls[0],
                        urls: urls,
                    });
                }
            }
        } catch (e) {
            console.error('Cobalt error:', e);
        }

        // Try using savetik.co API (works for Instagram too)
        try {
            const formData = new URLSearchParams();
            formData.append('url', cleanedUrl);

            const response = await fetch('https://savetik.co/api/ajaxSearch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                body: formData.toString(),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.status === 'ok' && data.data) {
                    // Parse the HTML for download links
                    const htmlContent = data.data;

                    // Find video/image download links
                    const linkMatch = htmlContent.match(/href="(https?:\/\/[^"]+(?:\.mp4|\.jpg)[^"]*)"/i);
                    if (linkMatch) {
                        const mediaUrl = linkMatch[1].replace(/&amp;/g, '&');
                        const isVideo = mediaUrl.includes('.mp4');

                        return NextResponse.json({
                            type: isVideo ? 'video' : 'image',
                            url: mediaUrl,
                        } as MediaData);
                    }
                }
            }
        } catch (e) {
            console.error('Savetik error:', e);
        }

        // If nothing works, return helpful error
        return NextResponse.json(
            {
                error: "Unable to fetch media from Instagram. The post may be private or Instagram is blocking automated requests.",
                suggestion: "For reliable downloads, add a RAPIDAPI_KEY to your .env.local file. Get a free key from rapidapi.com/search/instagram%20downloader",
                shortcode: shortcode,
            },
            { status: 503 }
        );

    } catch (error) {
        console.error("Download API error:", error);
        return NextResponse.json(
            { error: "Internal server error. Please try again." },
            { status: 500 }
        );
    }
}
