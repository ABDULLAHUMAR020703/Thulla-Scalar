"use client";

import { motion } from "framer-motion";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { useGame, Card, Suit } from "@/context/GameProvider";
import PlayerHand from "./PlayerHand";
import PlayingCard from "./PlayingCard";
import CardPile from "./CardPile";
import SpectatorBadge from "./SpectatorBadge";
import { getLeadSuit, isCardPlayable } from "../utils/cardUtils";

// Casino Table Center - Droppable Play Area
function CasinoTableCenter({ children, isMyTurn }: { children: React.ReactNode; isMyTurn: boolean }) {
    const { setNodeRef, isOver } = useDroppable({ id: "play-area" });

    return (
        <motion.div
            ref={setNodeRef}
            className={`
                relative w-[200px] h-[160px] sm:w-[240px] sm:h-[180px]
                rounded-[50%] 
                flex items-center justify-center
                transition-all duration-300
                ${isOver
                    ? "shadow-[inset_0_0_40px_rgba(0,229,255,0.3)]"
                    : isMyTurn
                        ? "shadow-[inset_0_0_30px_rgba(0,229,255,0.15)]"
                        : ""
                }
            `}
            style={{
                background: isOver
                    ? "radial-gradient(ellipse at center, rgba(0,229,255,0.1) 0%, transparent 70%)"
                    : "transparent",
            }}
            animate={{ scale: isOver ? 1.02 : 1 }}
        >
            {/* Glow pulse when it's player's turn */}
            {isMyTurn && !isOver && (
                <motion.div
                    className="absolute inset-0 rounded-[50%] pointer-events-none"
                    animate={{
                        boxShadow: [
                            "inset 0 0 20px rgba(0, 229, 255, 0.1)",
                            "inset 0 0 40px rgba(0, 229, 255, 0.2)",
                            "inset 0 0 20px rgba(0, 229, 255, 0.1)",
                        ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
            {children}
        </motion.div>
    );
}

// Player Seat Component
interface PlayerSeatProps {
    player: {
        id: string;
        name: string;
        hand: Card[];
        finished: boolean;
    };
    position: "top" | "left" | "right";
    isCurrentTurn: boolean;
}

function PlayerSeat({ player, position, isCurrentTurn }: PlayerSeatProps) {
    const positionStyles = {
        top: "top-2 left-1/2 -translate-x-1/2",
        left: "left-2 top-1/2 -translate-y-1/2",
        right: "right-2 top-1/2 -translate-y-1/2",
    };

    const cardFanRotation = {
        top: 0,
        left: 90,
        right: -90,
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute ${positionStyles[position]} z-10`}
        >
            <div className={`flex flex-col items-center ${position === "left" ? "flex-row" : position === "right" ? "flex-row-reverse" : ""}`}>
                {/* Avatar with turn indicator */}
                <div className="relative mb-1">
                    {isCurrentTurn && (
                        <motion.div
                            className="absolute -inset-1 rounded-full bg-[#00E5FF]"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                    <div className={`
                        relative w-10 h-10 sm:w-12 sm:h-12 rounded-full 
                        bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] 
                        flex items-center justify-center text-white font-bold text-sm sm:text-lg 
                        border-2 ${isCurrentTurn ? "border-[#00E5FF]" : "border-[#7C4DFF]/50"} 
                        shadow-lg
                    `}>
                        {player.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00E676] border-2 border-[#1a4d2e]" />
                    {/* Finished badge */}
                    {player.finished && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px]">
                            ✓
                        </div>
                    )}
                </div>

                {/* Name and card count */}
                <div className="text-center mt-1">
                    <span className="text-xs text-white font-medium block truncate max-w-[60px] sm:max-w-[80px]">
                        {player.name}
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-xs font-bold text-[#00E5FF]">{player.hand.length}</span>
                        <span className="text-[10px] text-[#607D8B]">cards</span>
                    </div>
                </div>

                {/* Face-down card fan */}
                {player.hand.length > 0 && (
                    <div
                        className="relative mt-2 h-8"
                        style={{ transform: `rotate(${cardFanRotation[position]}deg)` }}
                    >
                        {Array.from({ length: Math.min(player.hand.length, 5) }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-5 h-7 rounded bg-gradient-to-br from-[#2a3f5f] to-[#1a2a40] border border-[#00E5FF]/20"
                                style={{
                                    left: i * 6,
                                    transform: `rotate(${(i - 2) * 4}deg)`,
                                    zIndex: i,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function GameBoard() {
    const { gameState, currentPlayer, isMyTurn, isSpectator, playCard } = useGame();
    const [activeCard, setActiveCard] = useState<Card | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const leadSuit = getLeadSuit(gameState.pile);

    // Get opponents (exclude current player)
    const opponents = gameState.players.filter((p) => p.id !== currentPlayer?.id);
    const opponentPositions: ("top" | "left" | "right")[] = ["top", "left", "right"];

    const handleDragEnd = (event: DragEndEvent) => {
        const { over } = event;

        if (over && over.id === "play-area" && activeCard) {
            if (currentPlayer && isCardPlayable(activeCard, currentPlayer.hand, leadSuit)) {
                playCard(activeCard);
                setSelectedCardId(null);
            }
        }

        setActiveCard(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const cardId = String(event.active.id);
        const card = currentPlayer?.hand.find((c) => c.id === cardId);
        if (card) {
            setActiveCard(card);
        }
    };

    const handleCardPlay = (card: Card) => {
        if (isMyTurn && currentPlayer && isCardPlayable(card, currentPlayer.hand, leadSuit)) {
            playCard(card);
            setSelectedCardId(null);
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">

                {/* Casino Table */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full max-w-[500px] aspect-[1.3/1] mx-auto"
                >
                    {/* Table Surface - Oval felt */}
                    <div
                        className="absolute inset-0 rounded-[50%]"
                        style={{
                            background: "radial-gradient(ellipse at center, #1a5c35 0%, #134428 50%, #0d2e1c 100%)",
                            boxShadow: `
                                inset 0 0 60px rgba(0,0,0,0.5),
                                inset 0 2px 4px rgba(255,255,255,0.05),
                                0 10px 40px rgba(0,0,0,0.5)
                            `,
                        }}
                    />

                    {/* Brass/Gold edge trim */}
                    <div
                        className="absolute inset-0 rounded-[50%] pointer-events-none"
                        style={{
                            border: "4px solid transparent",
                            borderImage: "linear-gradient(145deg, #c9a227 0%, #8b6914 50%, #c9a227 100%) 1",
                            borderRadius: "50%",
                            boxShadow: "0 0 20px rgba(201, 162, 39, 0.2)",
                        }}
                    />

                    {/* Felt texture pattern */}
                    <div
                        className="absolute inset-0 rounded-[50%] opacity-30 pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* Player Seats */}
                    {opponents.slice(0, 3).map((player, i) => (
                        <PlayerSeat
                            key={player.id}
                            player={player}
                            position={opponentPositions[i]}
                            isCurrentTurn={gameState.currentPlayerId === player.id}
                        />
                    ))}

                    {/* Center - Card Pile Area */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CasinoTableCenter isMyTurn={isMyTurn}>
                            <CardPile
                                cards={gameState.pile}
                                trumpSuit={gameState.trumpSuit}
                            />
                        </CasinoTableCenter>
                    </div>

                    {/* Trump Indicator - Bottom left of table */}
                    {gameState.trumpSuit && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute bottom-4 left-4 z-20"
                        >
                            <div className="px-2 py-1.5 rounded-lg bg-[#0d2e1c]/90 border border-[#c9a227]/40 backdrop-blur-sm">
                                <div className="text-[8px] text-[#c9a227] uppercase tracking-wider mb-0.5 text-center">
                                    Trump
                                </div>
                                <div className="text-xl text-center">
                                    {gameState.trumpSuit === "hearts" && <span className="text-[#FF1744]">♥</span>}
                                    {gameState.trumpSuit === "diamonds" && <span className="text-[#FF1744]">♦</span>}
                                    {gameState.trumpSuit === "clubs" && <span className="text-white">♣</span>}
                                    {gameState.trumpSuit === "spades" && <span className="text-white">♠</span>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Deck Count - Bottom right */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute bottom-4 right-4 z-20"
                    >
                        <div className="px-2 py-1.5 rounded-lg bg-[#0d2e1c]/90 border border-[#c9a227]/40 backdrop-blur-sm">
                            <div className="text-[8px] text-[#c9a227] uppercase tracking-wider mb-0.5 text-center">
                                Deck
                            </div>
                            <div className="text-lg font-bold text-[#00E5FF] text-center">
                                {gameState.deck.length}
                            </div>
                        </div>
                    </motion.div>

                    {/* Turn indicator */}
                    {isMyTurn && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20"
                        >
                            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-[#0B0F1A] text-sm font-bold shadow-lg shadow-[#00E5FF]/30">
                                Your Turn!
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Current Player Hand - Fixed at bottom */}
                {currentPlayer && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full mt-6 sm:mt-8"
                    >
                        <PlayerHand
                            cards={currentPlayer.hand}
                            isCurrentPlayer={true}
                            isSpectator={isSpectator}
                            selectedCardId={selectedCardId}
                            onCardClick={handleCardPlay}
                            onCardSelect={(card) => setSelectedCardId(card?.id ?? null)}
                            leadSuit={leadSuit}
                            pile={gameState.pile}
                            trumpSuit={gameState.trumpSuit}
                        />
                    </motion.div>
                )}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeCard && (
                    <PlayingCard
                        card={activeCard}
                        isPlayable={true}
                        isFaceUp={true}
                        size="md"
                    />
                )}
            </DragOverlay>

            {/* Spectator Badge */}
            {isSpectator && <SpectatorBadge />}
        </DndContext>
    );
}
