"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface RoomCodeHeaderProps {
    roomCode: string | null;
    isLoading?: boolean;
    playerCount?: number;
    maxPlayers?: number;
    isHost?: boolean;
    roomStatus?: "waiting" | "playing" | "finished";
}

/**
 * Persistent header showing room code
 * Visible in lobby and game screens
 */
export default function RoomCodeHeader({
    roomCode,
    isLoading = false,
    playerCount = 0,
    maxPlayers = 4,
    isHost = false,
    roomStatus = "waiting",
}: RoomCodeHeaderProps) {
    const [copied, setCopied] = useState(false);

    // Copy room code to clipboard
    const handleCopy = async () => {
        if (!roomCode) return;

        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Status colors
    const statusColors = {
        waiting: "bg-yellow-500",
        playing: "bg-green-500",
        finished: "bg-blue-500",
    };

    if (!roomCode && !isLoading) return null;

    return (
        <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-[90] bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-white/10"
        >
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                {/* Left: Room Code */}
                <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className="flex items-center gap-2">
                        <motion.div
                            className={`w-2 h-2 rounded-full ${statusColors[roomStatus]}`}
                            animate={{ opacity: roomStatus === "waiting" ? [1, 0.4, 1] : 1 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-xs text-[#607D8B] uppercase tracking-wider">
                            {roomStatus === "waiting" ? "Lobby" : roomStatus === "playing" ? "Live" : "Ended"}
                        </span>
                    </div>

                    {/* Room Code */}
                    <motion.button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/10 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <span className="text-[#607D8B]">Loading...</span>
                        ) : (
                            <>
                                <span className="text-[#00E5FF] font-mono font-bold tracking-widest">
                                    {roomCode}
                                </span>
                                <motion.span
                                    key={copied ? "check" : "copy"}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-xs"
                                >
                                    {copied ? "✓" : "📋"}
                                </motion.span>
                            </>
                        )}
                    </motion.button>

                    {/* Host badge */}
                    {isHost && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#7C4DFF]/20 text-[#7C4DFF] font-semibold">
                            HOST
                        </span>
                    )}
                </div>

                {/* Right: Player Count */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        {/* Player dots */}
                        {Array.from({ length: maxPlayers }).map((_, i) => (
                            <motion.div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${i < playerCount
                                        ? "bg-[#00E5FF]"
                                        : "bg-white/20"
                                    }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                    <span className="text-sm text-[#B0BEC5]">
                        {playerCount}/{maxPlayers}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
