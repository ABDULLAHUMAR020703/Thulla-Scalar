"use client";

import { motion } from "framer-motion";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { GameBoard } from "@/game/components";

export default function PlayPage() {
    return (
        <NavigationLayout showNav={false} showHeader={false}>
            {/* Game Table Background */}
            <div className="min-h-screen game-table relative">
                {/* Top HUD Bar */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0F1A]/80 border-b border-white/[0.06] safe-area-padding"
                >
                    <div className="flex items-center justify-between h-14 px-4">
                        {/* Back Button */}
                        <button className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/10 transition-colors">
                            <span className="text-lg">←</span>
                        </button>

                        {/* Room Info */}
                        <div className="text-center">
                            <div className="text-sm font-semibold text-white">Room #A5F3</div>
                            <div className="text-xs text-[#607D8B]">Round 1 of 5</div>
                        </div>

                        {/* Menu Button */}
                        <button className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/10 transition-colors">
                            <span className="text-lg">⚙️</span>
                        </button>
                    </div>
                </motion.div>

                {/* Game Stats HUD */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="fixed top-20 left-4 z-40"
                >
                    <div className="hud-panel space-y-3">
                        <div className="hud-stat">
                            <span className="hud-stat-value">12</span>
                            <span className="hud-stat-label">Cards</span>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div className="hud-stat">
                            <span className="hud-stat-value text-[#00E676]">2</span>
                            <span className="hud-stat-label">Wins</span>
                        </div>
                    </div>
                </motion.div>

                {/* Timer HUD */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="fixed top-20 right-4 z-40"
                >
                    <div className="hud-panel">
                        <div className="hud-stat">
                            <span className="hud-stat-value text-[#FF9100]">0:45</span>
                            <span className="hud-stat-label">Time Left</span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Game Content */}
                <div className="pt-16">
                    <GameBoard />
                </div>

                {/* Action Bar (Bottom) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0F1A]/90 border-t border-white/[0.06]"
                >
                    <div className="flex items-center justify-center gap-4 h-20 px-4 pb-[var(--safe-area-bottom)]">
                        <button className="btn btn-ghost btn-sm">
                            <span className="mr-2">💬</span>
                            Chat
                        </button>
                        <button className="btn btn-primary btn-lg animate-pulse-neon">
                            Play Card
                        </button>
                        <button className="btn btn-ghost btn-sm">
                            <span className="mr-2">🃏</span>
                            Draw
                        </button>
                    </div>
                </motion.div>
            </div>
        </NavigationLayout>
    );
}
