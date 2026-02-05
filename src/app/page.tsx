"use client";

import { motion } from "framer-motion";
import { Instagram, Download, Zap, Shield, Music } from "lucide-react";
import { DownloadForm } from "@/components/download-form";
import { Particles } from "@/components/ui/particles";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Ripple } from "@/components/ui/ripple";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Download in seconds with our optimized servers",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "No login required, your privacy is protected",
  },
  {
    icon: Download,
    title: "HD Quality",
    description: "Get the best quality available for all media",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={80}
        color="#E1306C"
        staticity={30}
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-orange-500/15 to-pink-500/15 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 blur-xl opacity-50 rounded-3xl animate-pulse" />
                <div className="relative bg-background/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                  <Download className="w-12 h-12 text-foreground" />
                </div>
                {/* Floating Icons */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-6 -top-6 bg-gradient-to-tr from-purple-600 to-pink-600 p-2 rounded-xl shadow-lg"
                >
                  <Instagram className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute -left-6 -bottom-6 bg-gradient-to-tr from-yellow-400 to-orange-500 p-2 rounded-xl shadow-lg"
                >
                  <Music className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="text-foreground">Instant</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">Downloader</span>
            </h1>

            <AnimatedShinyText className="text-xl md:text-2xl text-muted-foreground/80">
              Download Instagram Posts, Reels, Stories & StarMaker Songs in HD
            </AnimatedShinyText>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base"
          >
            Just paste the Instagram or StarMaker URL and download your favorite content instantly.
            No login required. Free and unlimited.
          </motion.p>
        </motion.div>

        {/* Download Form */}
        <DownloadForm />

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 md:mt-28"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative group"
              >
                <div className="glass rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 instagram-gradient rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                    <div className="relative instagram-gradient w-12 h-12 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Supported Formats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">Supported formats</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Posts", "Reels", "Stories", "Carousels", "IGTV"].map((format) => (
              <span
                key={format}
                className="px-4 py-2 text-sm glass rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                {format}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 pt-8 border-t border-border/50 text-center"
        >
          <p className="text-muted-foreground text-sm">
            Made with ❤️ by{" "}
            <span className="instagram-gradient-text font-semibold">ROHANTA</span>
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            This tool is for personal use only. Please respect content creators&apos; rights.
          </p>
        </motion.footer>
      </div>

      {/* Ripple effect at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-96 overflow-hidden pointer-events-none">
        <Ripple mainCircleOpacity={0.1} />
      </div>
    </main>
  );
}
