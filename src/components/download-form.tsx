"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Link2, Clipboard, Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export function DownloadForm() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showExternalOption, setShowExternalOption] = useState(false);

    const validateInstagramUrl = (inputUrl: string): boolean => {
        const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|stories)\/[A-Za-z0-9_-]+/;
        return instagramRegex.test(inputUrl);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
            setError("");
            setShowExternalOption(false);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Could not access clipboard");
        }
    };

    const handleDownload = async () => {
        if (!url.trim()) {
            setError("Please enter an Instagram URL");
            return;
        }

        if (!validateInstagramUrl(url)) {
            setError("Please enter a valid Instagram post, reel, or story URL");
            return;
        }

        setLoading(true);
        setError("");
        setShowExternalOption(false);

        try {
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Show external download options
                setShowExternalOption(true);
                setError(data.error || "Failed to fetch media");
                return;
            }

            // Direct download the media
            if (data.url) {
                await downloadMedia(data.url, data.type);
            }
        } catch (err) {
            setShowExternalOption(true);
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const downloadMedia = async (mediaUrl: string, type: string) => {
        try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `instagram_${Date.now()}.${type === "video" ? "mp4" : "jpg"}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(mediaUrl, "_blank");
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
                                placeholder="Paste Instagram URL here..."
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError("");
                                    setShowExternalOption(false);
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
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="clipboard"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Clipboard className="w-5 h-5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>

                    <ShimmerButton
                        onClick={handleDownload}
                        disabled={loading}
                        className="w-full h-14 text-lg font-semibold"
                        shimmerColor="#ffffff"
                        background="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
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

                {/* External Download Options */}
                <AnimatePresence>
                    {showExternalOption && url && (
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
