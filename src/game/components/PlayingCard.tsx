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
    hearts: { main: "#DC2626", shadow: "rgba(220, 38, 38, 0.4)" },
    diamonds: { main: "#DC2626", shadow: "rgba(220, 38, 38, 0.4)" },
    clubs: { main: "#1a1a1a", shadow: "rgba(0, 0, 0, 0.3)" },
    spades: { main: "#1a1a1a", shadow: "rgba(0, 0, 0, 0.3)" },
};

const sizes = {
    sm: { width: 50, height: 72, rank: "text-xs", symbol: "text-[10px]", center: "text-2xl" },
    md: { width: 65, height: 95, rank: "text-sm", symbol: "text-xs", center: "text-3xl" },
    lg: { width: 80, height: 116, rank: "text-base", symbol: "text-sm", center: "text-4xl" },
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

    // Card face content - realistic poker card design
    const cardFace = isFaceUp ? (
        <div className="relative w-full h-full rounded-lg overflow-hidden"
            style={{
                background: "linear-gradient(145deg, #FFFEF8 0%, #F5F3E8 50%, #EBE8DC 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.05)",
            }}
        >
            {/* Card texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Top Left - Rank & Suit */}
            <div
                className="absolute top-1 left-1.5 flex flex-col items-center leading-none"
                style={{ color: suitColor.main }}
            >
                <span className={`${sizeConfig.rank} font-bold`} style={{ fontFamily: "Georgia, serif" }}>
                    {card.rank}
                </span>
                <span className={sizeConfig.symbol}>{suitSymbols[card.suit]}</span>
            </div>

            {/* Center Symbol - Large suit */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: suitColor.main }}
            >
                <span
                    className={`${sizeConfig.center} drop-shadow-sm`}
                    style={{
                        textShadow: `0 2px 4px ${suitColor.shadow}`,
                        fontFamily: "Georgia, serif",
                    }}
                >
                    {suitSymbols[card.suit]}
                </span>
            </div>

            {/* Bottom Right - Rank & Suit (Rotated) */}
            <div
                className="absolute bottom-1 right-1.5 flex flex-col items-center rotate-180 leading-none"
                style={{ color: suitColor.main }}
            >
                <span className={`${sizeConfig.rank} font-bold`} style={{ fontFamily: "Georgia, serif" }}>
                    {card.rank}
                </span>
                <span className={sizeConfig.symbol}>{suitSymbols[card.suit]}</span>
            </div>

            {/* Senior card crown indicator */}
            {isSenior && (
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-1 -right-1 z-10"
                >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                        <span className="text-[10px]">👑</span>
                    </div>
                </motion.div>
            )}
        </div>
    ) : (
        // Card back - Premium casino design
        <div
            className="relative w-full h-full rounded-lg overflow-hidden"
            style={{
                background: "linear-gradient(145deg, #1e3a5f 0%, #0f2744 50%, #0a1929 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)",
            }}
        >
            {/* Decorative border */}
            <div className="absolute inset-1.5 border border-[#3d5a80]/40 rounded-md" />

            {/* Diamond pattern */}
            <div className="absolute inset-2 opacity-20">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 4px,
                            rgba(61, 90, 128, 0.3) 4px,
                            rgba(61, 90, 128, 0.3) 5px
                        ),
                        repeating-linear-gradient(
                            -45deg,
                            transparent,
                            transparent 4px,
                            rgba(61, 90, 128, 0.3) 4px,
                            rgba(61, 90, 128, 0.3) 5px
                        )`,
                    }}
                />
            </div>

            {/* Center emblem */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a227]/30 to-[#8b6914]/30 border border-[#c9a227]/40 flex items-center justify-center">
                    <span className="text-[#c9a227] text-sm font-bold" style={{ fontFamily: "Georgia, serif" }}>T</span>
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
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{
                opacity: isDisabled ? 0.5 : 1,
                y: isSelected ? -12 : 0,
                rotateY: 0,
                scale: isDragging ? 1.12 : isSelected ? 1.05 : 1,
                zIndex: isDragging ? 100 : isSelected ? 50 : index,
                filter: isDisabled ? "saturate(0.3)" : "none",
            }}
            whileTap={isPlayable && !isDisabled ? { scale: 0.97 } : undefined}
            transition={{
                duration: 0.2,
                delay: index * 0.02,
                type: "spring",
                stiffness: 400,
                damping: 28,
            }}
            onClick={!isDisabled ? onClick : undefined}
            className={`
                relative select-none
                ${isPlayable && !isDisabled ? "cursor-pointer active:cursor-grabbing" : "cursor-not-allowed"}
            `}
        >
            {/* Card shadow */}
            <div
                className="absolute inset-0 rounded-lg -z-10"
                style={{
                    boxShadow: isDragging
                        ? "0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3)"
                        : isSelected
                            ? "0 8px 20px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)"
                            : "0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)",
                    transform: isDragging ? "translateY(8px)" : "translateY(2px)",
                }}
            />

            {/* Senior card glow ring */}
            {isSenior && (
                <motion.div
                    className="absolute -inset-1 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 -z-10"
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ filter: "blur(4px)" }}
                />
            )}

            {/* Selection glow */}
            {isSelected && !isSenior && (
                <motion.div
                    className="absolute -inset-[3px] rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] -z-10"
                    animate={{ opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ filter: "blur(3px)" }}
                />
            )}

            {/* Card content with border */}
            <div
                className="relative w-full h-full rounded-lg overflow-hidden"
                style={{
                    border: "1px solid rgba(0,0,0,0.15)",
                }}
            >
                {cardFace}
            </div>
        </motion.div>
    );
}
