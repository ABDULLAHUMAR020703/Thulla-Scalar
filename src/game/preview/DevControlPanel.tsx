"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PreviewGameState } from "./gameStateMachine";

interface DevControlPanelProps {
    state: PreviewGameState;
    isOpen: boolean;
    onToggle: () => void;
    onPause: () => void;
    onResume: () => void;
    onSetSpeed: (speed: number) => void;
    onStepNext: () => void;
    onForceThulla: () => void;
    onRestart: () => void;
}

const SPEED_OPTIONS = [
    { value: 0.5, label: "0.5x" },
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 4, label: "4x" },
];

export default function DevControlPanel({
    state,
    isOpen,
    onToggle,
    onPause,
    onResume,
    onSetSpeed,
    onStepNext,
    onForceThulla,
    onRestart,
}: DevControlPanelProps) {
    const { isPaused, speed, status, round, currentPlayerId, players } = state;
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                onClick={onToggle}
                className="fixed top-20 right-4 z-[200] p-3 rounded-xl bg-[#7C4DFF] text-white shadow-lg shadow-[#7C4DFF]/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                🛠️
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="fixed top-16 right-0 bottom-0 w-80 z-[199] bg-[#0B0F1A]/98 backdrop-blur-xl border-l border-[#7C4DFF]/30 overflow-y-auto"
                    >
                        <div className="p-5 space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-[#7C4DFF]">Dev Controls</h3>
                                <button
                                    onClick={onToggle}
                                    className="p-2 text-[#607D8B] hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Game Status */}
                            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#607D8B]">Status</span>
                                    <span className={`font-semibold ${status === "playing" ? "text-[#00E676]" :
                                            status === "thulla" ? "text-[#FF1744]" :
                                                status === "finished" ? "text-[#00E5FF]" :
                                                    "text-white"
                                        }`}>
                                        {status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#607D8B]">Round</span>
                                    <span className="text-white font-semibold">{round}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#607D8B]">Current Turn</span>
                                    <span className="text-white font-semibold">
                                        {currentPlayer?.name ?? "-"}
                                        {currentPlayer?.isBot ? " 🤖" : " 👤"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#607D8B]">Active Suit</span>
                                    <span className="text-white font-semibold">
                                        {state.activeSuit ?? "None"}
                                    </span>
                                </div>
                            </div>

                            {/* Pause/Resume */}
                            <button
                                onClick={isPaused ? onResume : onPause}
                                className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${isPaused
                                        ? "bg-[#00E676] text-[#0B0F1A] shadow-lg shadow-[#00E676]/30"
                                        : "bg-[#FF9100] text-[#0B0F1A] shadow-lg shadow-[#FF9100]/30"
                                    }`}
                            >
                                {isPaused ? "▶ Resume" : "⏸ Pause"}
                            </button>

                            {/* Speed Control */}
                            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                                <label className="block text-xs text-[#B0BEC5] uppercase tracking-wider mb-3">
                                    Simulation Speed
                                </label>
                                <div className="flex gap-2">
                                    {SPEED_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onSetSpeed(opt.value)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${speed === opt.value
                                                    ? "bg-[#00E5FF] text-[#0B0F1A] shadow-md"
                                                    : "bg-white/[0.06] text-[#607D8B] hover:bg-white/10"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <p className="text-xs text-[#B0BEC5] uppercase tracking-wider mb-2">
                                    Debug Actions
                                </p>

                                <button
                                    onClick={onStepNext}
                                    disabled={status !== "playing"}
                                    className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    ⏭ Step Next Turn
                                </button>

                                <button
                                    onClick={onForceThulla}
                                    disabled={status !== "playing"}
                                    className="w-full py-3 rounded-xl bg-[#FF1744]/20 border border-[#FF1744]/50 text-[#FF1744] font-semibold hover:bg-[#FF1744]/30 transition-colors disabled:opacity-50"
                                >
                                    🔥 Force THULLA
                                </button>

                                <button
                                    onClick={onRestart}
                                    className="w-full py-3 rounded-xl bg-[#7C4DFF]/20 border border-[#7C4DFF]/50 text-[#7C4DFF] font-semibold hover:bg-[#7C4DFF]/30 transition-colors"
                                >
                                    🔄 Restart Game
                                </button>
                            </div>

                            {/* Player States */}
                            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                                <p className="text-xs text-[#B0BEC5] uppercase tracking-wider mb-3">
                                    Players
                                </p>
                                <div className="space-y-2">
                                    {players.map((player) => (
                                        <div
                                            key={player.id}
                                            className={`flex items-center justify-between p-2 rounded-lg ${player.id === currentPlayerId
                                                    ? "bg-[#00E5FF]/10 border border-[#00E5FF]/30"
                                                    : "bg-white/[0.02]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{player.avatar}</span>
                                                <span className={`text-sm ${player.hasFinished ? "text-[#00E676]" : "text-white"
                                                    }`}>
                                                    {player.name}
                                                </span>
                                            </div>
                                            <span className="text-sm text-[#607D8B]">
                                                {player.hand.length} cards
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
