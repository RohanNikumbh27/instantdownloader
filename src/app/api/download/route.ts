import { NextRequest, NextResponse } from "next/server";

// Types for the response
interface MediaData {
    type: "image" | "video" | "audio" | "carousel";
    url: string;
    thumbnail?: string;
    title?: string;
    urls?: string[];
    platform?: "instagram" | "starmaker";
}

// ==================== INSTAGRAM HELPERS ====================

function extractInstagramShortcode(url: string): string | null {
    const patterns = [
        /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/stories\/[^/]+\/(\d+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

// ==================== STARMAKER HELPERS ====================

function extractStarMakerRecordingId(url: string): string | null {
    // Match recordingId from URL query params
    const match = url.match(/recordingId=(\d+)/);
    return match?.[1] || null;
}

function isStarMakerUrl(url: string): boolean {
    return url.includes('starmakerstudios.com') ||
        url.includes('starmaker.co') ||
        url.includes('m.starmaker');
}

function isInstagramUrl(url: string): boolean {
    return url.includes('instagram.com');
}

// Clean URL
function cleanUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
    } catch {
        return url;
    }
}

// ==================== INSTAGRAM DOWNLOAD ====================

async function downloadInstagram(url: string, shortcode: string): Promise<MediaData | null> {
    // Try Instagram's public embed
    try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const response = await fetch(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (response.ok) {
            const html = await response.text();

            const videoMatch = html.match(/"video_url":"([^"]+)"/);
            if (videoMatch) {
                return {
                    type: 'video',
                    url: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
                    platform: 'instagram',
                };
            }

            const imageMatch = html.match(/"display_url":"([^"]+)"/);
            if (imageMatch) {
                return {
                    type: 'image',
                    url: imageMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
                    platform: 'instagram',
                };
            }
        }
    } catch (e) {
        console.error('Instagram embed error:', e);
    }

    return null;
}

// ==================== STARMAKER DOWNLOAD ====================

async function downloadStarMaker(url: string, recordingId: string): Promise<MediaData | null> {
    // Direct download URL pattern for StarMaker
    const downloadUrl = `https://static.smintro.com/production/uploading/recordings/${recordingId}/master.mp4`;

    // Verify the URL is accessible
    try {
        const response = await fetch(downloadUrl, { method: 'HEAD' });

        if (response.ok) {
            // Try to fetch metadata from the original page
            let title = `StarMaker Recording ${recordingId}`;
            let thumbnail: string | undefined;

            try {
                const pageResponse = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                });

                if (pageResponse.ok) {
                    const html = await pageResponse.text();

                    // Extract og:title
                    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
                    if (titleMatch) {
                        title = titleMatch[1];
                    }

                    // Extract og:image
                    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
                    if (imageMatch) {
                        thumbnail = imageMatch[1];
                    }
                }
            } catch {
                // Metadata fetch failed, use defaults
            }

            return {
                type: 'video',
                url: downloadUrl,
                title,
                thumbnail,
                platform: 'starmaker',
            };
        }
    } catch (e) {
        console.error('StarMaker download error:', e);
    }

    // Try alternative CDN
    try {
        const altUrl = `https://static-v7.smintro.com/production/uploading/recordings/${recordingId}/master.mp4`;
        const response = await fetch(altUrl, { method: 'HEAD' });

        if (response.ok) {
            return {
                type: 'video',
                url: altUrl,
                title: `StarMaker Recording ${recordingId}`,
                platform: 'starmaker',
            };
        }
    } catch {
        // Alt CDN failed
    }

    return null;
}

// ==================== MAIN HANDLER ====================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const cleanedUrl = cleanUrl(url);

        // ========== STARMAKER ==========
        if (isStarMakerUrl(cleanedUrl)) {
            const recordingId = extractStarMakerRecordingId(cleanedUrl);

            if (!recordingId) {
                return NextResponse.json(
                    { error: "Invalid StarMaker URL. Please use a valid recording share link." },
                    { status: 400 }
                );
            }

            const result = await downloadStarMaker(cleanedUrl, recordingId);

            if (result) {
                return NextResponse.json(result);
            }

            return NextResponse.json(
                { error: "Unable to fetch StarMaker recording. Please check if the link is valid." },
                { status: 503 }
            );
        }

        // ========== INSTAGRAM ==========
        if (isInstagramUrl(cleanedUrl)) {
            const shortcode = extractInstagramShortcode(cleanedUrl);

            if (!shortcode) {
                return NextResponse.json(
                    { error: "Invalid Instagram URL. Please use a valid post, reel, or story URL." },
                    { status: 400 }
                );
            }

            const result = await downloadInstagram(cleanedUrl, shortcode);

            if (result) {
                return NextResponse.json(result);
            }

            // Instagram blocked - return fallback flag
            return NextResponse.json(
                {
                    error: "Unable to fetch media. The post may be private or Instagram is blocking requests.",
                    fallback: true,
                    platform: 'instagram',
                },
                { status: 503 }
            );
        }

        // ========== UNSUPPORTED PLATFORM ==========
        return NextResponse.json(
            { error: "Unsupported URL. Please use Instagram or StarMaker links." },
            { status: 400 }
        );

    } catch (error) {
        console.error("Download API error:", error);
        return NextResponse.json(
            { error: "Internal server error. Please try again." },
            { status: 500 }
        );
    }
}
