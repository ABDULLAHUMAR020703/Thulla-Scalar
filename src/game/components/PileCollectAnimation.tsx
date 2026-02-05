"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/context/GameProvider";

interface PileCollectAnimationProps {
    isVisible: boolean;
    cards: Card[];
    targetPosition: { x: number; y: number };
    onComplete?: () => void;
}

export default function PileCollectAnimation({
    isVisible,
    cards,
    targetPosition,
    onComplete,
}: PileCollectAnimationProps) {
    return (
        <AnimatePresence onExitComplete={onComplete}>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[95] pointer-events-none"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {cards.slice(0, 8).map((card, index) => (
                        <motion.div
                            key={card.id}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            initial={{
                                x: (index % 3 - 1) * 20,
                                y: (Math.floor(index / 3) - 1) * 10,
                                rotate: (index - cards.length / 2) * 5,
                                scale: 1,
                            }}
                            animate={{
                                x: targetPosition.x - window.innerWidth / 2,
                                y: targetPosition.y - window.innerHeight / 2,
                                rotate: 360,
                                scale: 0.3,
                                opacity: [1, 1, 0],
                            }}
                            transition={{
                                duration: 0.8,
                                delay: index * 0.05,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        >
                            {/* Simplified card representation */}
                            <div
                                className="w-[65px] h-[95px] rounded-lg bg-white border-2 border-gray-200 shadow-lg"
                                style={{
                                    boxShadow: "0 0 20px rgba(255, 23, 68, 0.5)",
                                }}
                            />
                        </motion.div>
                    ))}

                    {/* Trail effect */}
                    {cards.length > 0 && (
                        <motion.div
                            className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-[#FF1744]"
                            initial={{ scale: 1, opacity: 0.8 }}
                            animate={{
                                x: [0, targetPosition.x - window.innerWidth / 2],
                                y: [0, targetPosition.y - window.innerHeight / 2],
                                scale: [1, 0],
                                opacity: [0.8, 0],
                            }}
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                            }}
                            style={{
                                boxShadow: "0 0 30px #FF1744, 0 0 60px #FF1744",
                            }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
