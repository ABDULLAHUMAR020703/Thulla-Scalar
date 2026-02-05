"use client";

import { motion } from "framer-motion";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { useGame, Card, Suit } from "@/context/GameProvider";
import PlayerHand from "./PlayerHand";
import PlayingCard from "./PlayingCard";
import CardPile from "./CardPile";
import { getLeadSuit, isCardPlayable } from "../utils/cardUtils";

// Droppable Play Area Component
function PlayArea({ children, isMyTurn }: { children: React.ReactNode; isMyTurn: boolean }) {
    const { setNodeRef, isOver } = useDroppable({ id: "play-area" });

    return (
        <motion.div
            ref={setNodeRef}
            className={`
        relative rounded-3xl 
        border-2 border-dashed 
        flex items-center justify-center
        transition-all duration-300
        ${isOver
                    ? "border-[#00E5FF] bg-[#00E5FF]/10 shadow-[inset_0_0_60px_rgba(0,229,255,0.2)]"
                    : isMyTurn
                        ? "border-[#00E5FF]/50 bg-[#00E5FF]/5 shadow-[inset_0_0_40px_rgba(0,229,255,0.1)]"
                        : "border-white/10 bg-white/[0.02]"
                }
      `}
            animate={{
                scale: isOver ? 1.02 : 1,
            }}
        >
            {/* Glow pulse when it's player's turn */}
            {isMyTurn && !isOver && (
                <motion.div
                    className="absolute inset-0 rounded-3xl"
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

export default function GameBoard() {
    const { gameState, currentPlayer, isMyTurn, playCard } = useGame();
    const [activeCard, setActiveCard] = useState<Card | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const leadSuit = getLeadSuit(gameState.pile);

    const handleDragEnd = (event: DragEndEvent) => {
        const { over } = event;

        if (over && over.id === "play-area" && activeCard) {
            // Check if card is playable
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
            <div className="relative w-full min-h-[600px] flex flex-col items-center justify-between py-20 px-4">

                {/* Opponents Row */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center gap-8 flex-wrap mb-6"
                >
                    {gameState.players
                        .filter((p) => p.id !== currentPlayer?.id)
                        .map((player, i) => (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center"
                            >
                                {/* Avatar */}
                                <div className="relative mb-2">
                                    <div className="absolute inset-0 bg-[#7C4DFF] rounded-full blur-lg opacity-30" />
                                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] flex items-center justify-center text-white font-bold text-xl border-2 border-[#7C4DFF]/50 shadow-lg">
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00E676] border-2 border-[#0B0F1A]" />
                                </div>

                                <span className="text-sm text-white font-medium">{player.name}</span>

                                {/* Card count */}
                                <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-white/[0.06]">
                                    <span className="text-sm font-bold text-[#00E5FF]">{player.hand.length}</span>
                                    <span className="text-xs text-[#607D8B]">cards</span>
                                </div>
                            </motion.div>
                        ))}
                </motion.div>

                {/* Center Play Area with Pile */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative my-6"
                >
                    <PlayArea isMyTurn={isMyTurn}>
                        <div className="p-8">
                            <CardPile
                                cards={gameState.pile}
                                trumpSuit={gameState.trumpSuit}
                            />
                        </div>
                    </PlayArea>

                    {/* Turn indicator */}
                    {isMyTurn && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2"
                        >
                            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-[#0B0F1A] text-sm font-bold shadow-lg shadow-[#00E5FF]/30">
                                Your Turn!
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Trump & Deck Row */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                    {/* Deck */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="relative">
                            {/* Stacked deck effect */}
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="absolute w-[55px] h-[80px] rounded-lg bg-gradient-to-br from-[#1a2138] to-[#0f1423] border border-[#00E5FF]/10"
                                    style={{
                                        top: i * -2,
                                        left: i * 1.5,
                                        zIndex: 3 - i,
                                    }}
                                />
                            ))}
                            <div className="relative z-10 w-[55px] h-[80px] rounded-lg bg-gradient-to-br from-[#1a2138] to-[#0f1423] border border-[#00E5FF]/20 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                                <span className="text-xl font-bold text-[#00E5FF]">{gameState.deck.length}</span>
                                <span className="text-[9px] text-[#607D8B] uppercase tracking-wider">Deck</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trump indicator */}
                    {gameState.trumpSuit && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
                        >
                            <div className="text-[9px] text-[#607D8B] uppercase tracking-wider mb-1 text-center">
                                Trump
                            </div>
                            <div className="text-2xl text-center">
                                {gameState.trumpSuit === "hearts" && <span className="text-[#FF1744]">♥</span>}
                                {gameState.trumpSuit === "diamonds" && <span className="text-[#FF1744]">♦</span>}
                                {gameState.trumpSuit === "clubs" && <span className="text-white">♣</span>}
                                {gameState.trumpSuit === "spades" && <span className="text-white">♠</span>}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Current Player Hand */}
                {currentPlayer && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full mt-8"
                    >
                        <PlayerHand
                            cards={currentPlayer.hand}
                            isCurrentPlayer={true}
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
        </DndContext>
    );
}
