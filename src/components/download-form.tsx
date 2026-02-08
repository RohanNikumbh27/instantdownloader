"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Link2, Clipboard, Loader2, AlertCircle, CheckCircle2, ExternalLink, Music, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface DownloadResult {
    type: "image" | "video" | "audio" | "carousel";
    url: string;
    thumbnail?: string;
    title?: string;
    platform?: "instagram" | "starmaker" | "youtube";
}

interface YoutubeFormat {
    itag: number;
    qualityLabel: string;
    container: string;
    hasAudio: boolean;
    hasVideo: boolean;
    url: string;
    size?: number;
}

interface YoutubeInfo {
    title: string;
    thumbnail: string;
    duration: string;
    formats: YoutubeFormat[];
    audioFormats: YoutubeFormat[];
    bestAudio: YoutubeFormat;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return "Unknown";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function DownloadForm() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showExternalOption, setShowExternalOption] = useState(false);

    const [result, setResult] = useState<DownloadResult | null>(null);
    const [youtubeInfo, setYoutubeInfo] = useState<YoutubeInfo | null>(null);
    const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
    const [downloadingItem, setDownloadingItem] = useState<number | null>(null); // itag of currently downloading item



    const detectPlatform = (inputUrl: string): "instagram" | "starmaker" | "youtube" | null => {
        if (inputUrl.includes("instagram.com")) return "instagram";
        if (inputUrl.includes("starmakerstudios.com") || inputUrl.includes("starmaker.co")) return "starmaker";
        if (inputUrl.match(/(youtube\.com|youtu\.be)/)) return "youtube";
        return null;
    };

    const validateUrl = (inputUrl: string): boolean => {
        const platform = detectPlatform(inputUrl);
        if (platform === "instagram") {
            return /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|stories)\/[A-Za-z0-9_-]+/.test(inputUrl);
        }
        if (platform === "starmaker") {
            return /recordingId=\d+/.test(inputUrl);
        }

        if (platform === "youtube") {
            return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(inputUrl);
        }
        return false;
    };

    const extractUrl = (text: string): string => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = text.match(urlRegex);
        return match ? match[0] : text;
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const extractedUrl = extractUrl(text);
            setUrl(extractedUrl);
            setError(""); // Keep existing error clear
            setShowExternalOption(false); // Keep existing option clear

            setResult(null); // Keep existing result clear
            setYoutubeInfo(null);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // Auto download if valid URL found
            if (extractedUrl && extractedUrl !== text) { // Simplified condition: if a URL was extracted and it's different from the raw text
                handleDownload(extractedUrl);
            } else if (extractedUrl && extractedUrl === text && validateUrl(extractedUrl)) { // If the text itself is a valid URL, also auto-download
                handleDownload(extractedUrl);
            }
        } catch (err) {
            console.error("Failed to read clipboard:", err);
            setError("Could not access clipboard"); // Re-add specific error message
        }
    };

    const handleDownload = async (overrideUrl?: string | unknown) => {
        const inputUrl = (typeof overrideUrl === "string" ? overrideUrl : "") || url;
        const targetUrl = extractUrl(inputUrl); // Also extract if typed/pasted manually without the paste button

        if (!targetUrl.trim()) { // Use targetUrl for validation
            setError("Please enter a URL");
            return;
        }

        // Update state if we extracted a clean URL from a messy input
        if (targetUrl !== inputUrl) {
            setUrl(targetUrl);
        }

        setError("");
        setShowExternalOption(false);

        setResult(null);
        setYoutubeInfo(null);
        setLoading(true);

        const platform = detectPlatform(targetUrl); // Use targetUrl for platform detection
        if (!platform) {
            setError("Unsupported URL. Please use Instagram, StarMaker, or YouTube links.");
        }

        if (!validateUrl(url)) {
            if (platform === "instagram") {
                setError("Please enter a valid Instagram post, reel, or story URL");
            } else if (platform === "starmaker") {
                setError("Please enter a valid StarMaker recording URL");
            } else if (platform === "youtube") {
                setError("Please enter a valid YouTube URL");
            }
            return;
        }

        setLoading(true);
        setError("");
        setShowExternalOption(false);

        setResult(null);
        setYoutubeInfo(null);

        // Handle YouTube Separately
        if (platform === "youtube") {
            try {
                const response = await fetch("/api/youtube/info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: targetUrl }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "Failed to fetch YouTube info");
                    setLoading(false);
                    return;
                }

                setYoutubeInfo(data);
            } catch (err) {
                setError("Failed to fetch YouTube info");
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.fallback && platform === "instagram") {
                    setShowExternalOption(true);
                }
                setError(data.error || "Failed to fetch media");
                return;
            }

            // Show result with preview
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const downloadMedia = async () => {
        if (!result?.url) return;

        setDownloading(true);
        try {
            const response = await fetch(result.url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;

            const platform = result.platform || "media";
            const ext = result.type === "video" ? "mp4" : result.type === "audio" ? "mp3" : "jpg";
            link.download = `${platform}_${Date.now()}.${ext}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(result.url, "_blank");
        } finally {
            setDownloading(false);
        }
    };

    const handleYoutubeDownload = async (itag: number, title: string, ext: string = "mp4") => {
        setDownloadingItem(itag);
        try {
            // Create a hidden iframe or link to trigger the download endpoint
            const downloadUrl = `/api/youtube/download?url=${encodeURIComponent(url)}&itag=${itag}&title=${encodeURIComponent(title)}&ext=${ext}`;

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', ''); // hint to browser
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e) {
            setError("Download failed to start");
        } finally {
            // Small delay to reset state visually
            setTimeout(() => setDownloadingItem(null), 2000);
        }
    };

    const openExternalDownloader = (service: string) => {
        const encodedUrl = encodeURIComponent(url);
        const services: Record<string, string> = {
            snapinsta: `https://snapinsta.app/en2?url=${encodedUrl}`,
            saveinsta: `https://www.saveinsta.cam/?url=${encodedUrl}`,
            igram: `https://igram.io/?url=${encodedUrl}`,
            saveig: `https://saveig.app/en?url=${encodedUrl}`,
        };
        window.open(services[service] || services.snapinsta, "_blank");
    };

    const platform = detectPlatform(url);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-strong rounded-2xl p-6 md:p-8"
            >
                <div className="flex flex-col gap-4">
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                type="url"
                                placeholder="Paste Instagram, StarMaker, or YouTube URL..."
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError("");
                                    setShowExternalOption(false);
                                    setResult(null);
                                    setYoutubeInfo(null);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                                className="pl-12 h-14 bg-secondary/50 border-border/50 rounded-xl text-base focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePaste}
                            className="h-14 px-4 bg-secondary/50 hover:bg-secondary rounded-xl border border-border/50 transition-colors"
                        >
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="clipboard" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <Clipboard className="w-5 h-5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>

                    {/* Platform indicator */}
                    {platform && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            {platform === "instagram" ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                                    <span>Instagram detected</span>
                                </>
                            ) : platform === "starmaker" ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                                    <span>StarMaker detected</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-red-600" />
                                    <span>YouTube detected</span>
                                </>
                            )}
                        </motion.div>
                    )}

                    <ShimmerButton
                        onClick={handleDownload}
                        disabled={loading}
                        className="w-full h-14 text-lg font-semibold"
                        shimmerColor="#ffffff"
                        background={platform === "starmaker"
                            ? "linear-gradient(45deg, #f59e0b, #f97316, #ef4444)"
                            : platform === "youtube"
                                ? "linear-gradient(45deg, #ff0000, #cc0000)"
                                : "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
                        }
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Fetching...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Download className="w-5 h-5" />
                                Download
                            </span>
                        )}
                    </ShimmerButton>
                </div>

                {/* Success Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-8"
                        >
                            <div className="relative overflow-hidden rounded-2xl bg-secondary/30 border border-white/10 p-6 backdrop-blur-md">
                                {/* Background Glow */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${result.platform === "starmaker"
                                    ? "from-orange-500/20 to-red-500/20"
                                    : "from-pink-500/20 to-purple-500/20"
                                    } rounded-full blur-3xl -z-10`} />

                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                    {/* Thumbnail */}
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative shrink-0"
                                    >
                                        <div className={`absolute inset-0 rounded-2xl blur-lg opacity-50 ${result.platform === "starmaker"
                                            ? "bg-gradient-to-br from-orange-500 to-red-500"
                                            : "bg-gradient-to-br from-pink-500 to-purple-500"
                                            }`} />
                                        {result.thumbnail ? (
                                            <img
                                                src={result.thumbnail}
                                                alt="Preview"
                                                className="relative w-32 h-32 md:w-24 md:h-24 rounded-2xl object-cover shadow-xl border border-white/20"
                                            />
                                        ) : (
                                            <div className="relative w-32 h-32 md:w-24 md:h-24 rounded-2xl bg-secondary flex items-center justify-center border border-white/10">
                                                {result.platform === "starmaker" ? (
                                                    <Music className="w-10 h-10 text-muted-foreground" />
                                                ) : (
                                                    <Play className="w-10 h-10 text-muted-foreground" />
                                                )}
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Content Info */}
                                    <div className="flex-1 text-center md:text-left space-y-4 w-full">
                                        <div>
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${result.platform === "starmaker"
                                                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                                    : "bg-pink-500/10 text-pink-500 border border-pink-500/20"
                                                    }`}>
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Media Ready
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-white/5 capitalize">
                                                    {result.type}
                                                </span>
                                            </div>

                                            <h3 className="font-medium text-lg leading-tight line-clamp-2">
                                                {result.title || "Ready to download"}
                                            </h3>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={downloadMedia}
                                                disabled={downloading}
                                                className={`flex-1 h-12 rounded-xl font-medium flex items-center justify-center gap-2 text-white shadow-lg transition-all ${result.platform === "starmaker"
                                                    ? "bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-orange-500/25"
                                                    : "bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-pink-500/25"
                                                    } ${downloading ? "opacity-80 cursor-wait" : "hover:opacity-90"}`}
                                            >
                                                {downloading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Downloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="w-5 h-5" />
                                                        Save {result.type === "video" ? "Video" : result.type === "audio" ? "Audio" : "Image"}
                                                    </>
                                                )}
                                            </motion.button>

                                            <button
                                                onClick={() => window.open(result.url, "_blank")}
                                                className="h-12 px-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* YouTube Result */}
                <AnimatePresence>
                    {youtubeInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-8"
                        >
                            <div className="relative overflow-hidden rounded-2xl bg-secondary/30 border border-white/10 p-6 backdrop-blur-md">
                                {/* Background Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl -z-10" />

                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                    {/* Thumbnail */}
                                    <motion.img
                                        src={youtubeInfo.thumbnail}
                                        alt={youtubeInfo.title}
                                        className="w-full md:w-48 aspect-video rounded-xl object-cover shadow-lg border border-white/10"
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                    />

                                    <div className="flex-1 w-full">
                                        <h3 className="text-lg font-semibold line-clamp-2 mb-4">{youtubeInfo.title}</h3>

                                        {/* Tabs */}
                                        <div className="flex p-1 bg-secondary/50 rounded-xl mb-4">
                                            <button
                                                onClick={() => setActiveTab("video")}
                                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "video"
                                                    ? "bg-white text-black shadow-sm"
                                                    : "text-muted-foreground hover:text-white"
                                                    }`}
                                            >
                                                Video
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("audio")}
                                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "audio"
                                                    ? "bg-white text-black shadow-sm"
                                                    : "text-muted-foreground hover:text-white"
                                                    }`}
                                            >
                                                Audio
                                            </button>
                                        </div>

                                        {/* Format List */}
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {(activeTab === "video" ? youtubeInfo.formats : youtubeInfo.audioFormats).map((fmt) => (
                                                <div
                                                    key={fmt.itag}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeTab === "video"
                                                            ? "bg-orange-500/20 text-orange-500"
                                                            : "bg-purple-500/20 text-purple-500"
                                                            }`}>
                                                            {activeTab === "video" ? "MP4" : "MP3"}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm flex items-center gap-2">
                                                                {fmt.qualityLabel || (activeTab === "video" ? "Video" : "Audio")}
                                                                {activeTab === "video" && !fmt.hasAudio && (
                                                                    <span className="text-[10px] uppercase tracking-wider bg-secondary/50 border border-white/10 px-1.5 py-0.5 rounded text-muted-foreground" title="Video only, no sound">
                                                                        No Sound
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatBytes(fmt.size || 0)} • {fmt.container}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleYoutubeDownload(fmt.itag, youtubeInfo.title, fmt.container)}
                                                        disabled={downloadingItem === fmt.itag}
                                                        className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${downloadingItem === fmt.itag
                                                            ? "bg-secondary text-muted-foreground cursor-wait"
                                                            : "bg-white text-black hover:bg-white/90"
                                                            }`}
                                                    >
                                                        {downloadingItem === fmt.itag ? (
                                                            <>
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="w-3 h-3" />
                                                                Download
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                    {error && !showExternalOption && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                            <p className="text-destructive text-sm">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* External Download Options (Instagram only) */}
                <AnimatePresence>
                    {showExternalOption && url && platform === "instagram" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-6 space-y-4"
                        >
                            <div className="text-center">
                                <p className="text-muted-foreground text-sm mb-2">
                                    Instagram is blocking direct downloads. Choose a service below:
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: "snapinsta", name: "SnapInsta", color: "from-pink-500 to-rose-500" },
                                    { id: "saveinsta", name: "SaveInsta", color: "from-purple-500 to-violet-500" },
                                    { id: "igram", name: "iGram", color: "from-orange-500 to-amber-500" },
                                    { id: "saveig", name: "SaveIG", color: "from-blue-500 to-cyan-500" },
                                ].map((service) => (
                                    <motion.button
                                        key={service.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => openExternalDownloader(service.id)}
                                        className={`p-4 rounded-xl bg-gradient-to-r ${service.color} text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {service.name}
                                    </motion.button>
                                ))}
                            </div>

                            <p className="text-center text-xs text-muted-foreground/60">
                                These services open in a new tab with your URL pre-filled
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
