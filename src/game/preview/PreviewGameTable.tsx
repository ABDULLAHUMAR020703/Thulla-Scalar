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
    isSenior?: boolean;
}

// Suit symbols and colors
const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const SUIT_COLORS: Record<Suit, string> = {
    hearts: "#dc2626",
    diamonds: "#dc2626",
    clubs: "#1a1a1a",
    spades: "#1a1a1a",
};

// Casino-style Card Display Component
function CardDisplay({ card, isPlayable, onClick, faceDown, small, isSenior }: CardDisplayProps) {
    const width = small ? "w-10" : "w-14 sm:w-16";
    const height = small ? "h-14" : "h-20 sm:h-24";

    if (faceDown) {
        // Premium card back design
        return (
            <div
                className={`${width} ${height} rounded-lg shadow-lg overflow-hidden`}
                style={{
                    background: "linear-gradient(145deg, #1a4d2e 0%, #0d2818 100%)",
                    border: "2px solid #c9a227",
                }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <div
                        className="w-6 h-8 rounded flex items-center justify-center"
                        style={{
                            background: "linear-gradient(135deg, #c9a227 0%, #8b6914 100%)",
                        }}
                    >
                        <span className="text-xs font-bold text-[#0d2818]">T</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.button
            onClick={onClick}
            disabled={!isPlayable}
            className={`${width} ${height} rounded-lg shadow-lg flex flex-col items-center justify-center relative overflow-hidden transition-all`}
            style={{
                background: "linear-gradient(145deg, #fffef5 0%, #f5f0e1 100%)",
                border: isPlayable
                    ? "2px solid #c9a227"
                    : isSenior
                        ? "2px solid #ffd700"
                        : "2px solid #d4c9a8",
                boxShadow: isPlayable
                    ? "0 4px 20px rgba(201, 162, 39, 0.4)"
                    : isSenior
                        ? "0 0 15px rgba(255, 215, 0, 0.6)"
                        : "0 2px 8px rgba(0,0,0,0.2)",
                opacity: isPlayable ? 1 : 0.8,
                cursor: isPlayable ? "pointer" : "default",
            }}
            whileHover={isPlayable ? { scale: 1.08, y: -8 } : undefined}
            whileTap={isPlayable ? { scale: 0.95 } : undefined}
        >
            <span
                className={`font-bold ${small ? "text-xs" : "text-lg"}`}
                style={{
                    color: SUIT_COLORS[card.suit],
                    fontFamily: "Georgia, serif",
                }}
            >
                {card.rank}
            </span>
            <span
                className={small ? "text-sm" : "text-xl"}
                style={{ color: SUIT_COLORS[card.suit] }}
            >
                {SUIT_SYMBOLS[card.suit]}
            </span>

            {/* Senior card indicator */}
            {isSenior && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ffd700] flex items-center justify-center">
                    <span className="text-[8px]">👑</span>
                </div>
            )}
        </motion.button>
    );
}

// Human Player Hand (Bottom) - Casino style
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
            className="fixed bottom-0 left-0 right-0 z-50 p-4 backdrop-blur-xl"
            style={{
                background: isCurrentPlayer
                    ? "linear-gradient(180deg, rgba(26, 92, 53, 0.6) 0%, rgba(13, 41, 24, 0.9) 100%)"
                    : "linear-gradient(180deg, rgba(13, 25, 18, 0.6) 0%, rgba(10, 15, 12, 0.95) 100%)",
                borderTop: isCurrentPlayer
                    ? "2px solid rgba(201, 162, 39, 0.6)"
                    : "1px solid rgba(201, 162, 39, 0.2)",
            }}
        >
            {/* Your Turn Indicator */}
            {isCurrentPlayer && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full font-bold text-sm"
                    style={{
                        background: "linear-gradient(135deg, #c9a227 0%, #f5d67a 50%, #c9a227 100%)",
                        color: "#0d2818",
                        boxShadow: "0 4px 20px rgba(201, 162, 39, 0.5)",
                    }}
                >
                    Your Turn!
                </motion.div>
            )}

            {/* Cards */}
            <div className="flex justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
                <AnimatePresence>
                    {player.hand.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: index * 0.03 } }}
                            exit={{ y: -100, opacity: 0 }}
                            style={{ marginLeft: index > 0 ? -16 : 0 }}
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

            <div className="text-center mt-2 text-xs" style={{ color: "#8fae94" }}>
                {player.hand.length} cards
            </div>
        </motion.div>
    );
}

// Bot Player Display - Casino style
interface BotPlayerDisplayProps {
    player: PreviewPlayer;
    position: "top" | "left" | "right";
    isCurrentPlayer: boolean;
}

export function BotPlayerDisplay({ player, position, isCurrentPlayer }: BotPlayerDisplayProps) {
    const positionClasses = {
        top: "fixed top-16 left-1/2 -translate-x-1/2",
        left: "fixed left-3 top-1/2 -translate-y-1/2",
        right: "fixed right-3 top-1/2 -translate-y-1/2",
    };

    const cardLayout = position === "top" ? "flex-row" : "flex-col";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${positionClasses[position]} z-40`}
        >
            <div
                className="p-3 rounded-xl backdrop-blur-xl"
                style={{
                    background: isCurrentPlayer
                        ? "rgba(26, 92, 53, 0.6)"
                        : "rgba(13, 25, 18, 0.6)",
                    border: isCurrentPlayer
                        ? "2px solid #c9a227"
                        : "1px solid rgba(201, 162, 39, 0.3)",
                    boxShadow: isCurrentPlayer
                        ? "0 0 20px rgba(201, 162, 39, 0.3)"
                        : "none",
                }}
            >
                {/* Player info */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{player.avatar}</span>
                    <span
                        className="text-xs sm:text-sm font-semibold"
                        style={{ color: player.hasFinished ? "#4ade80" : "#f5d67a" }}
                    >
                        {player.name}
                    </span>
                    {isCurrentPlayer && (
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-xs"
                        >
                            🎯
                        </motion.span>
                    )}
                    {player.hasFinished && (
                        <span className="text-xs">✓</span>
                    )}
                </div>

                {/* Cards (face down) */}
                <div className={`flex ${cardLayout} gap-0.5`}>
                    {player.hand.slice(0, Math.min(player.hand.length, 5)).map((_, i) => (
                        <div
                            key={i}
                            className="w-5 h-7 rounded"
                            style={{
                                background: "linear-gradient(145deg, #1a4d2e 0%, #0d2818 100%)",
                                border: "1px solid rgba(201, 162, 39, 0.4)",
                                marginLeft: position === "top" && i > 0 ? -10 : 0,
                                marginTop: position !== "top" && i > 0 ? -18 : 0,
                            }}
                        />
                    ))}
                    {player.hand.length > 5 && (
                        <span className="text-xs ml-1" style={{ color: "#8fae94" }}>
                            +{player.hand.length - 5}
                        </span>
                    )}
                </div>

                <div className="text-center mt-1 text-xs" style={{ color: "#8fae94" }}>
                    {player.hand.length}
                </div>
            </div>
        </motion.div>
    );
}

// Center Pile Display - Casino style
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
                    className="absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-xl"
                    style={{
                        background: "rgba(26, 77, 46, 0.8)",
                        border: "1px solid rgba(201, 162, 39, 0.4)",
                    }}
                >
                    <span
                        className="text-2xl"
                        style={{ color: SUIT_COLORS[activeSuit] === "#dc2626" ? "#dc2626" : "#f5d67a" }}
                    >
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
                                initial={{ scale: 0, rotate: -180, y: 150 }}
                                animate={{
                                    scale: 1,
                                    rotate: angle / 4,
                                    x,
                                    y,
                                }}
                                exit={{ scale: 0, y: -100 }}
                                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                                className="absolute"
                            >
                                <div className="relative">
                                    <CardDisplay
                                        card={trickCard.card}
                                        isPlayable={false}
                                        small
                                        isSenior={isSenior}
                                    />
                                    {trickCard.isThulla && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 text-lg"
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
                    <div
                        className="w-14 h-20 rounded-xl border-2 border-dashed flex items-center justify-center"
                        style={{ borderColor: "rgba(201, 162, 39, 0.3)" }}
                    >
                        <span className="text-xs" style={{ color: "#8fae94" }}>Play</span>
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
                            className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
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
                            className="mt-4 text-lg sm:text-xl text-white font-semibold"
                        >
                            {pickupPlayerName} picks up the pile! 🔥
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Game Finished Overlay - Casino style
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
                    className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-xl"
                    style={{ background: "rgba(10, 15, 12, 0.9)" }}
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="text-center p-8"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="text-7xl sm:text-8xl mb-6"
                        >
                            {isHumanWinner ? "🎉" : "🤖"}
                        </motion.div>

                        <h1
                            className="text-3xl sm:text-5xl font-black mb-4"
                            style={{
                                background: isHumanWinner
                                    ? "linear-gradient(135deg, #c9a227 0%, #f5d67a 50%, #c9a227 100%)"
                                    : "linear-gradient(135deg, #8fae94 0%, #4ade80 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {isHumanWinner ? "You Win!" : "Game Over!"}
                        </h1>

                        <p className="text-lg" style={{ color: "#8fae94" }}>
                            {winnerName} finished first!
                        </p>

                        <motion.button
                            onClick={onRestart}
                            className="mt-8 px-8 py-4 rounded-xl font-bold text-lg transition-all"
                            style={{
                                background: "linear-gradient(135deg, #1a5c35 0%, #2d7a4a 50%, #1a5c35 100%)",
                                border: "2px solid #c9a227",
                                color: "#f5d67a",
                                boxShadow: "0 4px 20px rgba(26, 92, 53, 0.4)",
                            }}
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
