"use client";

import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Card as CardType, Suit } from "@/context/GameProvider";

interface PlayingCardProps {
    card: CardType;
    index?: number;
    isPlayable?: boolean;
    isFaceUp?: boolean;
    isSelected?: boolean;
    isSenior?: boolean;
    isDisabled?: boolean;
    onClick?: () => void;
    isDraggable?: boolean;
    size?: "sm" | "md" | "lg";
}

const suitSymbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const suitColors: Record<Suit, { main: string; shadow: string }> = {
    hearts: { main: "#FF1744", shadow: "rgba(255, 23, 68, 0.5)" },
    diamonds: { main: "#FF1744", shadow: "rgba(255, 23, 68, 0.5)" },
    clubs: { main: "#1a1a1a", shadow: "rgba(0, 0, 0, 0.3)" },
    spades: { main: "#1a1a1a", shadow: "rgba(0, 0, 0, 0.3)" },
};

const sizes = {
    sm: { width: 50, height: 72, rank: "text-xs", symbol: "text-lg", center: "text-2xl" },
    md: { width: 65, height: 95, rank: "text-sm", symbol: "text-xs", center: "text-4xl" },
    lg: { width: 80, height: 116, rank: "text-base", symbol: "text-sm", center: "text-5xl" },
};

export default function PlayingCard({
    card,
    index = 0,
    isPlayable = true,
    isFaceUp = true,
    isSelected = false,
    isSenior = false,
    isDisabled = false,
    onClick,
    isDraggable = false,
    size = "md",
}: PlayingCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: card.id,
        disabled: !isDraggable || !isPlayable || isDisabled,
    });

    const sizeConfig = sizes[size];
    const suitColor = suitColors[card.suit];

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    // Card face content
    const cardFace = isFaceUp ? (
        <div className="relative w-full h-full bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg overflow-hidden">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none" />

            {/* Top Left - Rank & Suit */}
            <div
                className="absolute top-1 left-1.5 flex flex-col items-center leading-none"
                style={{ color: suitColor.main }}
            >
                <span className={`${sizeConfig.rank} font-bold`}>{card.rank}</span>
                <span className={sizeConfig.symbol}>{suitSymbols[card.suit]}</span>
            </div>

            {/* Center Symbol */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: suitColor.main }}
            >
                <span
                    className={`${sizeConfig.center} drop-shadow-sm`}
                    style={{ textShadow: `0 2px 8px ${suitColor.shadow}` }}
                >
                    {suitSymbols[card.suit]}
                </span>
            </div>

            {/* Bottom Right - Rank & Suit (Rotated) */}
            <div
                className="absolute bottom-1 right-1.5 flex flex-col items-center rotate-180 leading-none"
                style={{ color: suitColor.main }}
            >
                <span className={`${sizeConfig.rank} font-bold`}>{card.rank}</span>
                <span className={sizeConfig.symbol}>{suitSymbols[card.suit]}</span>
            </div>

            {/* Senior card crown indicator */}
            {isSenior && (
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-1 -right-1 z-10"
                >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                        <span className="text-xs">👑</span>
                    </div>
                </motion.div>
            )}
        </div>
    ) : (
        // Card back
        <div className="relative w-full h-full rounded-lg bg-gradient-to-br from-[#1a2138] to-[#0f1423] border border-[#00E5FF]/20 overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-2 border border-[#00E5FF]/15 rounded-md">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(0, 229, 255, 0.05) 4px,
              rgba(0, 229, 255, 0.05) 8px
            )`,
                    }}
                />
            </div>
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF]/20 to-[#7C4DFF]/20 border border-[#00E5FF]/30 flex items-center justify-center">
                    <span className="text-sm">🃏</span>
                </div>
            </div>
        </div>
    );

    return (
        <motion.div
            ref={setNodeRef}
            style={{
                ...style,
                width: sizeConfig.width,
                height: sizeConfig.height,
            }}
            {...(isDraggable && !isDisabled ? { ...listeners, ...attributes } : {})}
            initial={{ opacity: 0, y: -30, rotateY: 180 }}
            animate={{
                opacity: isDisabled ? 0.4 : 1,
                y: isSelected ? -16 : 0,
                rotateY: 0,
                scale: isDragging ? 1.15 : isSelected ? 1.05 : 1,
                zIndex: isDragging ? 100 : isSelected ? 50 : index,
                filter: isDisabled ? "grayscale(100%)" : "none",
            }}
            whileHover={isPlayable && !isDisabled ? {
                y: -14,
                scale: 1.08,
                transition: { duration: 0.15 },
            } : undefined}
            whileTap={isPlayable && !isDisabled ? { scale: 0.95 } : undefined}
            transition={{
                duration: 0.25,
                delay: index * 0.03,
                type: "spring",
                stiffness: 400,
                damping: 25,
            }}
            onClick={!isDisabled ? onClick : undefined}
            className={`
        relative rounded-lg shadow-lg cursor-pointer select-none
        ${isPlayable && !isDisabled ? "cursor-pointer" : "cursor-not-allowed"}
      `}
        >
            {/* Senior card glow ring */}
            {isSenior && (
                <motion.div
                    className="absolute -inset-1 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 opacity-75 blur-sm"
                    animate={{
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}

            {/* Neon border on hover/select */}
            <motion.div
                className={`
          absolute -inset-[2px] rounded-lg opacity-0
          bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF]
        `}
                animate={{
                    opacity: isSelected ? 0.8 : isDragging ? 1 : 0,
                }}
            />

            {/* Card content */}
            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl">
                {cardFace}
            </div>

            {/* Dragging shadow */}
            {isDragging && (
                <div className="absolute inset-0 rounded-lg bg-black/20 blur-xl -z-10 translate-y-4" />
            )}
        </motion.div>
    );
}
