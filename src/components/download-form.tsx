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
    platform?: "instagram" | "starmaker";
}

export function DownloadForm() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showExternalOption, setShowExternalOption] = useState(false);
    const [result, setResult] = useState<DownloadResult | null>(null);

    const detectPlatform = (inputUrl: string): "instagram" | "starmaker" | null => {
        if (inputUrl.includes("instagram.com")) return "instagram";
        if (inputUrl.includes("starmakerstudios.com") || inputUrl.includes("starmaker.co")) return "starmaker";
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
        return false;
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
            setError("");
            setShowExternalOption(false);
            setResult(null);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Could not access clipboard");
        }
    };

    const handleDownload = async () => {
        if (!url.trim()) {
            setError("Please enter a URL");
            return;
        }

        const platform = detectPlatform(url);
        if (!platform) {
            setError("Unsupported URL. Please use Instagram or StarMaker links.");
            return;
        }

        if (!validateUrl(url)) {
            if (platform === "instagram") {
                setError("Please enter a valid Instagram post, reel, or story URL");
            } else {
                setError("Please enter a valid StarMaker recording URL");
            }
            return;
        }

        setLoading(true);
        setError("");
        setShowExternalOption(false);
        setResult(null);

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
                                placeholder="Paste Instagram or StarMaker URL..."
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError("");
                                    setShowExternalOption(false);
                                    setResult(null);
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
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                                    <span>StarMaker detected</span>
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
                            className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                        >
                            <div className="flex items-start gap-4">
                                {result.thumbnail ? (
                                    <img
                                        src={result.thumbnail}
                                        alt="Preview"
                                        className="w-20 h-20 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                                        {result.platform === "starmaker" ? (
                                            <Music className="w-8 h-8 text-white" />
                                        ) : (
                                            <Play className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm text-green-500 font-medium mb-1">
                                        ✓ Media found!
                                    </p>
                                    {result.title && (
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                            {result.title}
                                        </p>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={downloadMedia}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Save {result.type === "video" ? "Video" : result.type === "audio" ? "Audio" : "Image"}
                                    </motion.button>
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
