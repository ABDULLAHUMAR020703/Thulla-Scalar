"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ThullaOverlayProps {
    isVisible: boolean;
    playerName?: string;
    onComplete?: () => void;
}

export default function ThullaOverlay({
    isVisible,
    playerName = "Player",
    onComplete,
}: ThullaOverlayProps) {
    const [phase, setPhase] = useState<"shake" | "text" | "collect" | "done">("shake");

    useEffect(() => {
        if (!isVisible) {
            setPhase("shake");
            return;
        }

        // Animation sequence
        const timeline = [
            { phase: "shake" as const, delay: 0 },
            { phase: "text" as const, delay: 200 },
            { phase: "collect" as const, delay: 1800 },
            { phase: "done" as const, delay: 2800 },
        ];

        const timeouts: NodeJS.Timeout[] = [];

        timeline.forEach(({ phase, delay }) => {
            const timeout = setTimeout(() => {
                setPhase(phase);
                if (phase === "done") {
                    onComplete?.();
                }
            }, delay);
            timeouts.push(timeout);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && phase !== "done" && (
                <>
                    {/* Red flash overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0.4, 0.2, 0.3, 0.1, 0],
                        }}
                        transition={{ duration: 0.5, times: [0, 0.1, 0.2, 0.3, 0.5, 1] }}
                        className="fixed inset-0 z-[100] bg-[#FF1744] pointer-events-none"
                    />

                    {/* Screen shake container */}
                    <motion.div
                        className="fixed inset-0 z-[101] pointer-events-none"
                        animate={phase === "shake" ? {
                            x: [0, -10, 10, -10, 10, -5, 5, 0],
                            y: [0, 5, -5, 5, -5, 2, -2, 0],
                        } : {}}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {/* THULLA Text */}
                        <AnimatePresence>
                            {(phase === "text" || phase === "collect") && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.3, y: 50 }}
                                    animate={{
                                        opacity: 1,
                                        scale: [0.3, 1.2, 1],
                                        y: 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 1.5,
                                        y: -100,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        scale: { times: [0, 0.6, 1], duration: 0.5 },
                                    }}
                                    className="fixed inset-0 flex flex-col items-center justify-center"
                                >
                                    {/* Glow background */}
                                    <motion.div
                                        className="absolute w-[600px] h-[300px] rounded-full blur-3xl"
                                        style={{
                                            background: "radial-gradient(circle, rgba(255,23,68,0.6) 0%, transparent 70%)",
                                        }}
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.6, 0.8, 0.6],
                                        }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />

                                    {/* Main text */}
                                    <motion.h1
                                        className="relative text-7xl md:text-9xl font-black tracking-wider"
                                        style={{
                                            color: "#FF1744",
                                            textShadow: `
                        0 0 20px rgba(255,23,68,0.8),
                        0 0 40px rgba(255,23,68,0.6),
                        0 0 60px rgba(255,23,68,0.4),
                        0 0 80px rgba(255,23,68,0.2)
                      `,
                                        }}
                                        animate={{
                                            scale: [1, 1.05, 1],
                                        }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                    >
                                        THULLA!
                                    </motion.h1>

                                    {/* Player name */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-6 px-6 py-3 rounded-full bg-[#FF1744]/20 border border-[#FF1744]/50"
                                    >
                                        <span className="text-lg font-semibold text-white">
                                            {playerName} picks up the pile!
                                        </span>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Particles/sparks effect */}
                    {phase === "text" && (
                        <motion.div className="fixed inset-0 z-[99] pointer-events-none overflow-hidden">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-[#FF1744]"
                                    style={{
                                        left: `${50 + (Math.random() - 0.5) * 20}%`,
                                        top: "50%",
                                        boxShadow: "0 0 10px #FF1744, 0 0 20px #FF1744",
                                    }}
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{
                                        x: (Math.random() - 0.5) * 400,
                                        y: (Math.random() - 0.5) * 400,
                                        scale: [0, 1, 0],
                                        opacity: [1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 1,
                                        delay: Math.random() * 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
