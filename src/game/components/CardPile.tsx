"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, Suit } from "@/context/GameProvider";
import PlayingCard from "./PlayingCard";
import { findWinningCard } from "../utils/cardUtils";

interface CardPileProps {
    cards: Card[];
    trumpSuit?: Suit | null;
    maxVisible?: number;
    onClear?: () => void;
    isClearing?: boolean;
}

export default function CardPile({
    cards,
    trumpSuit = null,
    maxVisible = 4,
    onClear,
    isClearing = false,
}: CardPileProps) {
    const visibleCards = cards.slice(-maxVisible);
    const hiddenCount = Math.max(0, cards.length - maxVisible);

    // Find the winning/senior card
    const winningInfo = findWinningCard(cards, trumpSuit);
    const leadSuit = cards.length > 0 ? cards[0].suit : null;

    return (
        <div className="relative">
            {/* Pile container */}
            <motion.div
                className="relative w-[160px] h-[120px] sm:w-[180px] sm:h-[140px] flex items-center justify-center"
                animate={{
                    scale: isClearing ? 0.8 : 1,
                    opacity: isClearing ? 0 : 1,
                }}
            >
                {/* Stack depth shadow */}
                {cards.length > 0 && (
                    <motion.div
                        className="absolute rounded-xl bg-black/40"
                        style={{
                            width: 70,
                            height: 100,
                            filter: "blur(12px)",
                        }}
                        animate={{
                            y: Math.min(cards.length * 2, 8),
                            opacity: 0.4 + cards.length * 0.05,
                        }}
                    />
                )}

                {/* Stacked cards with throw animation */}
                <AnimatePresence mode="popLayout">
                    {visibleCards.map((card, index) => {
                        const actualIndex = hiddenCount + index;
                        const isWinning = winningInfo?.card.id === card.id;

                        // Calculate offset for natural stacking
                        const baseRotation = (actualIndex % 2 === 0 ? 1 : -1) * (index * 4);
                        const xOffset = (index - visibleCards.length / 2) * 10;
                        const yOffset = -index * 2;

                        return (
                            <motion.div
                                key={card.id}
                                className="absolute"
                                initial={{
                                    opacity: 0,
                                    scale: 0.3,
                                    y: 120,
                                    x: 0,
                                    rotate: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: xOffset,
                                    y: yOffset,
                                    rotate: baseRotation,
                                    zIndex: index,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    y: -30,
                                    transition: { duration: 0.2 },
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 350,
                                    damping: 22,
                                    mass: 0.8,
                                }}
                            >
                                <PlayingCard
                                    card={card}
                                    index={index}
                                    isPlayable={false}
                                    isFaceUp={true}
                                    isSenior={isWinning}
                                    size="md"
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty state */}
                {cards.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-[65px] h-[95px] rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                        }}
                    >
                        <span className="text-white/40 text-xs text-center px-2">
                            Play a card
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* Pile counter badge */}
            {cards.length > 0 && (
                <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="px-2.5 py-0.5 rounded-full bg-[#0d2e1c]/95 border border-[#c9a227]/40 shadow-lg">
                        <span className="text-xs font-bold text-[#00E5FF]">{cards.length}</span>
                        <span className="text-[10px] text-[#B0BEC5] ml-1">in pile</span>
                    </div>
                </motion.div>
            )}

            {/* Active suit indicator */}
            {leadSuit && (
                <ActiveSuitIndicator suit={leadSuit} />
            )}
        </div>
    );
}

// Active Suit Indicator Component
interface ActiveSuitIndicatorProps {
    suit: Suit;
}

const suitSymbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const suitColors: Record<Suit, string> = {
    hearts: "#DC2626",
    diamonds: "#DC2626",
    clubs: "#FFFFFF",
    spades: "#FFFFFF",
};

function ActiveSuitIndicator({ suit }: ActiveSuitIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -right-14 sm:-right-16 top-1/2 -translate-y-1/2"
        >
            <div className="relative">
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: suitColors[suit], filter: "blur(8px)" }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Badge */}
                <div className="relative px-2 py-1.5 rounded-lg bg-[#0d2e1c]/95 border border-[#c9a227]/40">
                    <div className="text-[8px] text-[#c9a227] uppercase tracking-wider mb-0.5 text-center">
                        Lead
                    </div>
                    <motion.div
                        style={{ color: suitColors[suit] }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-xl text-center"
                    >
                        {suitSymbols[suit]}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
