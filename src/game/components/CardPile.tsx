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
                className="relative w-[180px] h-[140px] flex items-center justify-center"
                animate={{
                    scale: isClearing ? 0.8 : 1,
                    opacity: isClearing ? 0 : 1,
                }}
            >
                {/* Stack depth shadow */}
                {cards.length > 0 && (
                    <div
                        className="absolute inset-0 rounded-2xl bg-black/30 blur-xl"
                        style={{
                            transform: `translateY(${Math.min(cards.length * 2, 10)}px)`,
                        }}
                    />
                )}

                {/* Stacked cards */}
                <AnimatePresence mode="popLayout">
                    {visibleCards.map((card, index) => {
                        const actualIndex = hiddenCount + index;
                        const isWinning = winningInfo?.card.id === card.id;

                        // Calculate offset for depth illusion
                        const rotation = (actualIndex % 2 === 0 ? 1 : -1) * (index * 3 + Math.random() * 2);
                        const xOffset = (index - visibleCards.length / 2) * 12;
                        const yOffset = -index * 3;

                        return (
                            <motion.div
                                key={card.id}
                                className="absolute"
                                initial={{
                                    opacity: 0,
                                    scale: 0.5,
                                    y: -80,
                                    rotate: -30,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: xOffset,
                                    y: yOffset,
                                    rotate: rotation,
                                    zIndex: index,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    y: 30,
                                    transition: { duration: 0.2 },
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25,
                                    delay: 0.05,
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
                        className="w-[65px] h-[95px] rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center"
                    >
                        <span className="text-[#607D8B] text-xs text-center px-2">
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
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="px-3 py-1 rounded-full bg-[#0B0F1A]/90 border border-[#00E5FF]/30 backdrop-blur-sm shadow-lg">
                        <span className="text-sm font-bold text-[#00E5FF]">{cards.length}</span>
                        <span className="text-xs text-[#607D8B] ml-1">in pile</span>
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
    hearts: "#FF1744",
    diamonds: "#FF1744",
    clubs: "#FFFFFF",
    spades: "#FFFFFF",
};

function ActiveSuitIndicator({ suit }: ActiveSuitIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -right-16 top-1/2 -translate-y-1/2"
        >
            <div className="relative">
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-xl blur-lg"
                    style={{ backgroundColor: suitColors[suit] }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Badge */}
                <div className="relative px-3 py-2 rounded-xl bg-[#0B0F1A]/90 border border-white/10 backdrop-blur-sm">
                    <div className="text-[10px] text-[#607D8B] uppercase tracking-wider mb-0.5">
                        Lead
                    </div>
                    <motion.div
                        style={{ color: suitColors[suit] }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-2xl text-center"
                    >
                        {suitSymbols[suit]}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
