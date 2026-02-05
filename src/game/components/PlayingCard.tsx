"use client";

import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Card as CardType } from "@/context/GameProvider";
import CardFace from "./CardFace";
import CardBack from "./CardBack";

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

const sizes = {
    sm: { width: 50, height: 72 },
    md: { width: 65, height: 95 },
    lg: { width: 80, height: 116 },
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

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    // Card face content - using the unified CardFace component
    const cardFace = isFaceUp ? (
        <CardFace
            rank={card.rank}
            suit={card.suit}
            width={sizeConfig.width}
            height={sizeConfig.height}
        />
    ) : (
        <CardBack />
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

            {/* Card container with paper background for front face */}
            <div
                className="relative w-full h-full rounded-lg overflow-hidden"
                style={{
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: isFaceUp
                        ? "linear-gradient(145deg, #FFFEF8 0%, #F5F3E8 50%, #EBE8DC 100%)"
                        : "transparent"
                }}
            >
                {cardFace}
            </div>
        </motion.div>
    );
}
