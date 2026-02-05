"use client";

import { motion, useMotionValue, PanInfo } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Card, Suit } from "@/context/GameProvider";
import PlayingCard from "./PlayingCard";
import { isCardPlayable, isSeniorCard } from "../utils/cardUtils";

interface PlayerHandProps {
    cards: Card[];
    isCurrentPlayer?: boolean;
    isSpectator?: boolean;
    selectedCardId?: string | null;
    onCardClick?: (card: Card) => void;
    onCardSelect?: (card: Card | null) => void;
    leadSuit?: Suit | null;
    pile?: Card[];
    trumpSuit?: Suit | null;
}

export default function PlayerHand({
    cards,
    isCurrentPlayer = false,
    isSpectator = false,
    selectedCardId = null,
    onCardClick,
    onCardSelect,
    leadSuit = null,
    pile = [],
    trumpSuit = null,
}: PlayerHandProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(320);
    const scrollX = useMotionValue(0);

    // Calculate container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    // Card layout calculations - mobile optimized
    const cardWidth = 65;
    const cardHeight = 95;
    const maxCards = cards.length;

    // Fan curve parameters - less aggressive on mobile
    const maxRotation = maxCards > 5 ? 20 : 15;
    const maxLift = 15;
    const overlapPercent = maxCards > 7 ? 0.5 : maxCards > 5 ? 0.4 : 0.35;

    const effectiveCardWidth = cardWidth * (1 - overlapPercent);
    const totalWidth = cardWidth + (maxCards - 1) * effectiveCardWidth;
    const needsScroll = totalWidth > containerWidth;

    // Drag constraints
    const minScroll = needsScroll ? -(totalWidth - containerWidth + 40) : 0;
    const maxScroll = 0;

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        const targetX = scrollX.get() + offset + velocity * 0.2;
        const clampedX = Math.max(minScroll, Math.min(maxScroll, targetX));
        scrollX.set(clampedX);
    };

    const handleCardClick = (card: Card) => {
        // Spectators cannot play cards
        if (isSpectator) return;
        const canPlay = isCurrentPlayer && isCardPlayable(card, cards, leadSuit);

        if (!canPlay) return;

        if (selectedCardId === card.id) {
            // Double tap to play
            onCardClick?.(card);
            onCardSelect?.(null);
        } else {
            // First tap to select
            onCardSelect?.(card);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full max-w-[400px] mx-auto transition-opacity duration-300 ${isSpectator ? 'opacity-50' : ''}`}
            style={{ height: cardHeight + maxLift + 30 }}
        >
            {/* Hand area background glow */}
            {isCurrentPlayer && !isSpectator && (
                <div
                    className="absolute inset-x-0 bottom-0 h-24 pointer-events-none opacity-30"
                    style={{
                        background: "radial-gradient(ellipse at center bottom, rgba(0,229,255,0.15) 0%, transparent 70%)",
                    }}
                />
            )}

            {/* Scroll indicator (left) */}
            {needsScroll && (
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{ opacity: scrollX.get() < -10 ? 0 : 0.6 }}
                >
                    <div className="w-6 h-16 bg-gradient-to-r from-[#0B0F1A] to-transparent rounded-r-lg" />
                </motion.div>
            )}

            {/* Scroll indicator (right) */}
            {needsScroll && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-60">
                    <div className="w-6 h-16 bg-gradient-to-l from-[#0B0F1A] to-transparent rounded-l-lg" />
                </div>
            )}

            {/* Cards container */}
            <motion.div
                className="relative flex items-end justify-center touch-pan-x"
                style={{
                    x: scrollX,
                    width: needsScroll ? totalWidth + 40 : "100%",
                }}
                drag={needsScroll ? "x" : false}
                dragConstraints={{ left: minScroll, right: maxScroll }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
            >
                {cards.map((card, index) => {
                    // Calculate fan curve position
                    const centerIndex = (maxCards - 1) / 2;
                    const normalizedPos = (index - centerIndex) / Math.max(centerIndex, 1);

                    // Rotation follows a curve (more at edges)
                    const rotation = normalizedPos * maxRotation;

                    // Vertical offset (cards at edges are lower)
                    const yOffset = Math.abs(normalizedPos) * maxLift;

                    // Horizontal position
                    const xOffset = index * effectiveCardWidth;

                    // Check if card is playable (spectators can never play)
                    const canPlay = !isSpectator && isCurrentPlayer && isCardPlayable(card, cards, leadSuit);

                    // Check if this is the senior card
                    const isSenior = pile.length > 0 &&
                        pile.some(p => p.id === card.id) &&
                        isSeniorCard(card, pile, trumpSuit);

                    const isSelected = selectedCardId === card.id;

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute origin-bottom"
                            style={{
                                left: xOffset,
                                zIndex: isSelected ? 50 : index,
                            }}
                            animate={{
                                rotate: isSelected ? 0 : rotation,
                                y: isSelected ? -yOffset - 16 : -yOffset,
                            }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        >
                            <PlayingCard
                                card={card}
                                index={index}
                                isPlayable={canPlay}
                                isDisabled={!canPlay || isSpectator}
                                isSelected={isSelected}
                                isSenior={isSenior}
                                isFaceUp={isCurrentPlayer}
                                isDraggable={isCurrentPlayer && canPlay}
                                onClick={() => handleCardClick(card)}
                                size="md"
                            />
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Card count badge */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 right-2 px-2 py-0.5 rounded-full bg-[#0d2e1c]/90 border border-[#c9a227]/40 shadow-lg z-30"
            >
                <span className="text-xs font-bold text-[#00E5FF]">{cards.length}</span>
                <span className="text-[10px] text-[#B0BEC5] ml-1">cards</span>
            </motion.div>
        </div>
    );
}
