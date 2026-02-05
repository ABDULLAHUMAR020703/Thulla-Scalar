"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <NavigationLayout>
      {/* Casino-style background */}
      <div
        className="flex flex-col min-h-[calc(100dvh-80px)] px-4 py-6 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center top, #1a2e1c 0%, #0d1912 40%, #0a0f0c 100%)",
        }}
      >
        {/* Subtle felt texture overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 opacity-20 pointer-events-none">
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#c9a227]/60 rounded-tl-lg" />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none">
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#c9a227]/60 rounded-tr-lg" />
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 opacity-20 pointer-events-none">
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#c9a227]/60 rounded-bl-lg" />
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-24 opacity-20 pointer-events-none">
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#c9a227]/60 rounded-br-lg" />
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-6"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full bg-gradient-to-r from-[#1a5c35] to-[#c9a227] blur-2xl opacity-40" />

            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-2xl p-[3px] shadow-[0_0_30px_rgba(201,162,39,0.2)]"
              style={{
                background: "linear-gradient(135deg, #c9a227 0%, #8b6914 50%, #c9a227 100%)",
              }}
            >
              <div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(145deg, #1a4d2e 0%, #0d2818 100%)",
                }}
              >
                <span className="text-4xl sm:text-5xl">🃏</span>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 tracking-tight"
              style={{
                background: "linear-gradient(135deg, #c9a227 0%, #f5d67a 50%, #c9a227 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 20px rgba(201, 162, 39, 0.3)",
              }}
            >
              THULLA
            </h1>
            <p className="text-[#8fae94] text-base sm:text-lg font-medium tracking-wide">
              The Ultimate Card Battle
            </p>
          </motion.div>

          {/* CTA Buttons - PRESERVED EXACTLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4 w-full max-w-sm px-4"
          >
            {/* Quick Match - Primary CTA */}
            <Link href="/game/lobby" className="w-full">
              <button
                className="w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #1a5c35 0%, #2d7a4a 50%, #1a5c35 100%)",
                  border: "2px solid #c9a227",
                  color: "#f5d67a",
                  boxShadow: "0 4px 20px rgba(26, 92, 53, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                ⚡ Quick Match
              </button>
            </Link>

            {/* Create & Join Row */}
            <div className="flex gap-3">
              <Link href="/game/create" className="flex-1">
                <button
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "rgba(26, 77, 46, 0.4)",
                    border: "1px solid rgba(201, 162, 39, 0.4)",
                    color: "#c9a227",
                  }}
                >
                  Create Room
                </button>
              </Link>
              <Link href="/game/join" className="flex-1">
                <button
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(201, 162, 39, 0.5)",
                    color: "#c9a227",
                  }}
                >
                  Join Room
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Minimal Features - Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center gap-8 pt-6 pb-2 relative z-10"
        >
          {[
            { icon: "👥", label: "4 Players" },
            { icon: "⚡", label: "Real-time" },
            { icon: "🏆", label: "Ranked" },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <span className="text-xl block mb-1">{feature.icon}</span>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[#8fae94]">
                {feature.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </NavigationLayout>
  );
}
