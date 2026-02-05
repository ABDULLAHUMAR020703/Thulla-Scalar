"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { useGameSubscription } from "@/hooks/useGameSubscription";
import { gameReducer, createInitialGameState, GameEngineState, GameAction } from "@/game/engine/gameEngine";
import { GameEvent } from "@/services/gameBroadcast";

// ================================
// TYPES
// ================================

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
    id: string; // Used for React keys
    suit: Suit;
    rank: Rank;
}

export interface Player {
    id: string;
    name: string;
    avatar?: string;
    hand: Card[];
    score: number;
    isReady: boolean;
    isHost: boolean;
    position: number;
    is_active: boolean;
}

export type GameStatus = "waiting" | "playing" | "paused" | "finished";

// Using GameEngineState as the source of truth
export type GameState = GameEngineState;

interface GameContextType {
    gameState: GameState;
    currentPlayer: Player | null;
    isMyTurn: boolean;
    playCard: (card: Card) => void;
    drawCard: () => void;
    resetGame: () => void;
    setGameState: (state: GameState) => void; // Kept for compatibility but should avoid
    startMultiplayerGame: (roomId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
    children: ReactNode;
    initialRoomId?: string;
}

// ================================
// GAME PROVIDER
// ================================

export function GameProvider({ children, initialRoomId }: GameProviderProps) {
    // 1. STATE MANAGEMENT (Reducer)
    const [gameState, dispatch] = useReducer(
        gameReducer,
        initialRoomId || "local",
        createInitialGameState
    );

    // 2. SUBSCRIPTION (Multiplayer Events)
    const handleGameEvent = useCallback((event: GameEvent) => {
        console.log("[GameProvider] Received Event:", event);

        switch (event.type) {
            case "CARD_PLAYED":
                // Synthesize Card with ID
                const playedCard = {
                    id: `card-${event.card.suit}-${event.card.rank}`,
                    suit: event.card.suit,
                    rank: event.card.rank
                } as Card;

                dispatch({
                    type: "PLAY_CARD",
                    playerId: event.player_id,
                    card: playedCard
                });
                break;

            case "TURN_CHANGED":
            case "TRICK_CLEARED":
            case "THULLA_TRIGGERED":
                // These events are currently implicit in local reducer's PLAY_CARD logic.
                // If we want to support them specifically (e.g. if server logic differs), 
                // we might need specific actions. 
                // For now, trusting PLAY_CARD sequence is enough for visualization.
                // OR we can implement explicit sync actions.
                break;

            case "GAME_STARTED":
                // Handle game start
                // We need payload data (players, etc) to START_GAME.
                // But event payload from start-game might differ from GameAction?
                // Start-game sends: { type: "GAME_STARTED", room_id, starter_player_id, ... }
                // We need fetch logic to get players? 
                // Or we trust the lobby state?
                break;
        }
    }, []);

    // Active connection only if roomId is present (and not "local" placeholder)
    useGameSubscription({
        roomId: (gameState.roomId && gameState.roomId !== "local") ? gameState.roomId : null,
        onAnyEvent: handleGameEvent,
        enabled: !!(gameState.roomId && gameState.roomId !== "local")
    });

    // 3. DERIVED STATE
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    const isMyTurn = currentPlayer?.id === gameState.currentPlayerId; // Only valid if we know "me". 

    // 4. ACTIONS
    const playCard = async (card: Card) => {
        if (!currentPlayer) return;

        // Multiplayer Logic
        if (gameState.roomId && gameState.roomId !== "local") {
            try {
                // Use gameActions service for Edge Function call
                const { invokePlayCard } = await import("@/services/gameActions");
                const result = await invokePlayCard(gameState.roomId, card.suit, card.rank);

                if (!result.success) {
                    console.error("Play card failed:", result.error);
                }
                // Do NOT dispatch. Wait for broadcast.
            } catch (err) {
                console.error("Play card exception:", err);
            }
        } else {
            // Local Logic
            dispatch({ type: "PLAY_CARD", playerId: currentPlayer.id, card });
        }
    };

    const drawCard = () => {
        // Not used in main play?
    };

    const resetGame = () => {
        dispatch({ type: "END_GAME" });
    };

    return (
        <GameContext.Provider
            value={{
                gameState,
                setGameState: () => { }, // No-op
                currentPlayer,
                isMyTurn, // This logic is flawed for multiplayer but kept for compilation
                playCard,
                drawCard,
                resetGame,
                startMultiplayerGame: (id) => {/* handle */ }
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}
