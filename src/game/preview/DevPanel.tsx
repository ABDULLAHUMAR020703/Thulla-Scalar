"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PreviewSettings } from "./previewEngine";
import { BotDifficulty } from "./botAI";

interface DevPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    settings: PreviewSettings;
    onSettingsChange: (settings: Partial<PreviewSettings>) => void;
    onTriggerThulla: () => void;
    onClearTrick: () => void;
    onForceTurn: () => void;
    onTriggerDeal: () => void;
    onExitPreview: () => void;
    isPaused: boolean;
    onTogglePause: () => void;
}

export default function DevPanel({
    isOpen,
    onToggle,
    settings,
    onSettingsChange,
    onTriggerThulla,
    onClearTrick,
    onForceTurn,
    onTriggerDeal,
    onExitPreview,
    isPaused,
    onTogglePause,
}: DevPanelProps) {
    return (
        <>
            {/* Toggle Button */}
            <motion.button
                onClick={onToggle}
                className="fixed top-20 right-4 z-[200] p-2 rounded-lg bg-[#7C4DFF] text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="text-sm">🛠️</span>
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="fixed top-16 right-0 bottom-0 w-72 z-[199] bg-[#0B0F1A]/95 backdrop-blur-xl border-l border-[#7C4DFF]/30 overflow-y-auto"
                    >
                        <div className="p-4 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-[#7C4DFF]">Dev Panel</h3>
                                <button
                                    onClick={onToggle}
                                    className="p-1 text-[#607D8B] hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Pause Control */}
                            <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                                <button
                                    onClick={onTogglePause}
                                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${isPaused
                                        ? "bg-[#00E676] text-[#0B0F1A]"
                                        : "bg-[#FF9100] text-[#0B0F1A]"
                                        }`}
                                >
                                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                                </button>
                            </div>

                            {/* Speed Control */}
                            <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                                <label className="block text-xs text-[#B0BEC5] uppercase tracking-wider mb-2">
                                    Game Speed: {settings.gameSpeed.toFixed(1)}x
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.25"
                                    value={settings.gameSpeed}
                                    onChange={(e) =>
                                        onSettingsChange({ gameSpeed: parseFloat(e.target.value) })
                                    }
                                    className="w-full accent-[#00E5FF]"
                                />
                                <div className="flex justify-between text-[10px] text-[#607D8B] mt-1">
                                    <span>0.5x</span>
                                    <span>1x</span>
                                    <span>2x</span>
                                    <span>3x</span>
                                </div>
                            </div>

                            {/* Bot Difficulty */}
                            <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                                <label className="block text-xs text-[#B0BEC5] uppercase tracking-wider mb-2">
                                    Bot Difficulty
                                </label>
                                <div className="flex gap-2">
                                    {(["easy", "medium", "hard"] as BotDifficulty[]).map((diff) => (
                                        <button
                                            key={diff}
                                            onClick={() => onSettingsChange({ botDifficulty: diff })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${settings.botDifficulty === diff
                                                ? "bg-[#00E5FF] text-[#0B0F1A]"
                                                : "bg-white/[0.06] text-[#607D8B] hover:bg-white/10"
                                                }`}
                                        >
                                            {diff}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <p className="text-xs text-[#B0BEC5] uppercase tracking-wider">
                                    Actions
                                </p>

                                <button
                                    onClick={onTriggerThulla}
                                    className="w-full py-2.5 rounded-lg bg-[#FF1744]/20 border border-[#FF1744]/50 text-[#FF1744] font-semibold hover:bg-[#FF1744]/30 transition-colors"
                                >
                                    🔥 Trigger THULLA
                                </button>

                                <button
                                    onClick={onClearTrick}
                                    className="w-full py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
                                >
                                    🧹 Clear Trick
                                </button>

                                <button
                                    onClick={onForceTurn}
                                    className="w-full py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
                                >
                                    ⏭ Force Turn Change
                                </button>

                                <button
                                    onClick={onTriggerDeal}
                                    className="w-full py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
                                >
                                    🃏 Trigger Deal Animation
                                </button>
                            </div>

                            {/* Exit Preview */}
                            <button
                                onClick={onExitPreview}
                                className="w-full py-3 rounded-lg bg-[#FF1744] text-white font-semibold hover:bg-[#FF1744]/90 transition-colors"
                            >
                                Exit Preview Mode
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
