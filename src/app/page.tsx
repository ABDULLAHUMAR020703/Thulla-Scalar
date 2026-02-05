"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <NavigationLayout>
      <div className="flex flex-col min-h-[calc(100vh-144px)] px-4 py-8">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] blur-2xl opacity-30 animate-glow-pulse" />

            <div className="relative w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-[#00E5FF] to-[#7C4DFF] p-[2px] shadow-[0_0_40px_rgba(0,229,255,0.3)]">
              <div className="w-full h-full rounded-3xl bg-[#0B0F1A] flex items-center justify-center">
                <span className="text-5xl">🃏</span>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-3 text-gradient tracking-tight">
              THULLA
            </h1>
            <p className="text-[#B0BEC5] text-lg md:text-xl">
              The Ultimate Card Battle
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-6 mb-10"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00E5FF] neon-text">1.2K</div>
              <div className="text-xs text-[#607D8B] uppercase tracking-wider">Online</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-[#7C4DFF] neon-text-secondary">256</div>
              <div className="text-xs text-[#607D8B] uppercase tracking-wider">Games</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00E676]">Top 5%</div>
              <div className="text-xs text-[#607D8B] uppercase tracking-wider">Rank</div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-3 w-full max-w-xs"
          >
            <Link href="/game/lobby" className="w-full">
              <Button variant="primary" size="lg" fullWidth>
                ⚡ Quick Match
              </Button>
            </Link>

            <div className="flex gap-3">
              <Link href="/game/create" className="flex-1">
                <Button variant="ghost" fullWidth>
                  Create Room
                </Button>
              </Link>
              <Link href="/game/join" className="flex-1">
                <Button variant="outline" fullWidth glow={false}>
                  Join Room
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mt-8"
        >
          {[
            { icon: "👥", label: "4 Players", color: "#00E5FF" },
            { icon: "⚡", label: "Real-time", color: "#7C4DFF" },
            { icon: "🏆", label: "Ranked", color: "#00E676" },
          ].map((feature, i) => (
            <Card
              key={i}
              variant="default"
              padding="md"
              className="text-center"
            >
              <span className="text-2xl mb-2 block">{feature.icon}</span>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: feature.color }}
              >
                {feature.label}
              </span>
            </Card>
          ))}
        </motion.div>
      </div>
    </NavigationLayout>
  );
}
