"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, Suit } from "@/context/GameProvider";
import { PreviewPlayer, TrickCard } from "../preview/gameStateMachine";

interface PreviewPlayerHandProps {
    player: PreviewPlayer;
    isCurrentPlayer: boolean;
    isHuman: boolean;
    canPlayCard: (cardId: string) => boolean;
    onPlayCard: (cardId: string) => void;
}

interface CardDisplayProps {
    card: Card;
    isPlayable: boolean;
    onClick?: () => void;
    faceDown?: boolean;
    small?: boolean;
}

// Suit symbols and colors
const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const SUIT_COLORS: Record<Suit, string> = {
    hearts: "text-[#FF1744]",
    diamonds: "text-[#FF1744]",
    clubs: "text-[#1a1a1a]",
    spades: "text-[#1a1a1a]",
};

// Card Display Component
function CardDisplay({ card, isPlayable, onClick, faceDown, small }: CardDisplayProps) {
    const sizeClasses = small
        ? "w-10 h-14 text-xs"
        : "w-14 h-20 sm:w-16 sm:h-24 text-sm";

    if (faceDown) {
        return (
            <div className={`${sizeClasses} rounded-lg bg-gradient-to-br from-[#1a237e] to-[#0d47a1] border border-white/20 shadow-lg`}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-6 h-8 rounded border border-white/30 bg-white/10" />
                </div>
            </div>
        );
    }

    return (
        <motion.button
            onClick={onClick}
            disabled={!isPlayable}
            className={`${sizeClasses} rounded-lg bg-white shadow-lg border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${isPlayable
                ? "border-[#00E5FF] cursor-pointer hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] hover:-translate-y-2"
                : "border-gray-300 opacity-70 cursor-not-allowed"
                }`}
            whileHover={isPlayable ? { scale: 1.05 } : undefined}
            whileTap={isPlayable ? { scale: 0.95 } : undefined}
        >
            <span className={`font-bold ${small ? "text-xs" : "text-lg"} ${SUIT_COLORS[card.suit]}`}>
                {card.rank}
            </span>
            <span className={`${small ? "text-sm" : "text-xl"} ${SUIT_COLORS[card.suit]}`}>
                {SUIT_SYMBOLS[card.suit]}
            </span>
        </motion.button>
    );
}

// Human Player Hand (Bottom)
export function PreviewPlayerHand({
    player,
    isCurrentPlayer,
    isHuman,
    canPlayCard,
    onPlayCard
}: PreviewPlayerHandProps) {
    if (!isHuman) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${isCurrentPlayer ? "bg-[#00E5FF]/10" : "bg-[#0B0F1A]/90"
                } backdrop-blur-xl border-t border-white/10`}
        >
            {isCurrentPlayer && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#00E5FF] text-[#0B0F1A] text-sm font-bold"
                >
                    Your Turn!
                </motion.div>
            )}

            <div className="flex justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
                <AnimatePresence>
                    {player.hand.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: index * 0.05 } }}
                            exit={{ y: -100, opacity: 0 }}
                            style={{ marginLeft: index > 0 ? -20 : 0 }}
                        >
                            <CardDisplay
                                card={card}
                                isPlayable={canPlayCard(card.id)}
                                onClick={() => onPlayCard(card.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="text-center mt-2 text-sm text-[#607D8B]">
                {player.hand.length} cards
            </div>
        </motion.div>
    );
}

// Bot Player Display
interface BotPlayerDisplayProps {
    player: PreviewPlayer;
    position: "top" | "left" | "right";
    isCurrentPlayer: boolean;
}

export function BotPlayerDisplay({ player, position, isCurrentPlayer }: BotPlayerDisplayProps) {
    const positionClasses = {
        top: "fixed top-20 left-1/2 -translate-x-1/2",
        left: "fixed left-4 top-1/2 -translate-y-1/2",
        right: "fixed right-4 top-1/2 -translate-y-1/2",
    };

    const cardLayout = position === "top" ? "flex-row" : "flex-col";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${positionClasses[position]} z-40`}
        >
            <div className={`p-3 rounded-xl ${isCurrentPlayer
                ? "bg-[#00E5FF]/20 border-2 border-[#00E5FF]"
                : "bg-white/[0.04] border border-white/10"
                } backdrop-blur-xl`}>
                {/* Player info */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{player.avatar}</span>
                    <span className={`text-sm font-semibold ${player.hasFinished ? "text-[#00E676]" : "text-white"
                        }`}>
                        {player.name}
                    </span>
                    {isCurrentPlayer && (
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-xs text-[#00E5FF]"
                        >
                            🎯
                        </motion.span>
                    )}
                </div>

                {/* Cards (face down) */}
                <div className={`flex ${cardLayout} gap-0.5`}>
                    {player.hand.slice(0, Math.min(player.hand.length, 6)).map((_, i) => (
                        <div
                            key={i}
                            className="w-6 h-9 rounded bg-gradient-to-br from-[#1a237e] to-[#0d47a1] border border-white/20"
                            style={{
                                marginLeft: position === "top" && i > 0 ? -12 : 0,
                                marginTop: position !== "top" && i > 0 ? -20 : 0,
                            }}
                        />
                    ))}
                    {player.hand.length > 6 && (
                        <span className="text-xs text-[#607D8B] ml-1">
                            +{player.hand.length - 6}
                        </span>
                    )}
                </div>

                <div className="text-center mt-1 text-xs text-[#607D8B]">
                    {player.hand.length} cards
                </div>
            </div>
        </motion.div>
    );
}

// Center Pile Display
interface CenterPileProps {
    trick: TrickCard[];
    activeSuit: Suit | null;
    seniorCardId: string | null;
}

export function CenterPile({ trick, activeSuit, seniorCardId }: CenterPileProps) {
    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            {/* Active Suit Indicator */}
            {activeSuit && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/[0.1] border border-white/20 backdrop-blur-xl"
                >
                    <span className={`text-2xl ${SUIT_COLORS[activeSuit]}`}>
                        {SUIT_SYMBOLS[activeSuit]}
                    </span>
                </motion.div>
            )}

            {/* Cards in Trick */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                <AnimatePresence>
                    {trick.map((trickCard, index) => {
                        const angle = (index * 90) - 45;
                        const radius = 30;
                        const x = Math.cos((angle * Math.PI) / 180) * radius;
                        const y = Math.sin((angle * Math.PI) / 180) * radius;
                        const isSenior = trickCard.card.id === seniorCardId;

                        return (
                            <motion.div
                                key={trickCard.card.id}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{
                                    scale: 1,
                                    rotate: angle / 4,
                                    x,
                                    y,
                                }}
                                exit={{ scale: 0, y: -100 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="absolute"
                            >
                                <div className={`relative ${isSenior ? "ring-2 ring-[#FFD700] ring-offset-2 ring-offset-[#0B0F1A]" : ""}`}>
                                    <CardDisplay
                                        card={trickCard.card}
                                        isPlayable={false}
                                        small
                                    />
                                    {trickCard.isThulla && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 text-xl"
                                        >
                                            🔥
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {trick.length === 0 && (
                    <div className="w-16 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                        <span className="text-[#607D8B] text-xs">Play here</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// THULLA Animation Overlay
interface ThullaOverlayProps {
    isVisible: boolean;
    pickupPlayerName: string;
}

export function ThullaOverlay({ isVisible, pickupPlayerName }: ThullaOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
                >
                    {/* Red flash */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-red-500"
                    />

                    {/* THULLA text */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="text-center"
                    >
                        <motion.h1
                            className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
                            style={{
                                textShadow: "0 0 40px rgba(255,0,0,0.8), 0 0 80px rgba(255,100,0,0.6)",
                                WebkitTextStroke: "2px rgba(255,255,255,0.3)",
                            }}
                            animate={{
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 0.5, repeat: 3 }}
                        >
                            THULLA!
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 text-xl text-white font-semibold"
                        >
                            {pickupPlayerName} picks up the pile! 🔥
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Game Finished Overlay
interface GameFinishedOverlayProps {
    isVisible: boolean;
    winnerName: string;
    isHumanWinner: boolean;
    onRestart: () => void;
}

export function GameFinishedOverlay({
    isVisible,
    winnerName,
    isHumanWinner,
    onRestart
}: GameFinishedOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="text-center p-8"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="text-8xl mb-6"
                        >
                            {isHumanWinner ? "🎉" : "🤖"}
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                            {isHumanWinner ? "You Win!" : "Game Over!"}
                        </h1>

                        <p className="text-xl text-[#B0BEC5] mb-8">
                            {winnerName} finished first!
                        </p>

                        <motion.button
                            onClick={onRestart}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-[#0B0F1A] font-bold text-lg shadow-lg shadow-[#00E5FF]/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Play Again
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
