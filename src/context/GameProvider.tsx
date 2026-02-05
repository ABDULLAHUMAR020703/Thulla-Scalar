"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { useGameSubscription } from "@/hooks/useGameSubscription";
import { useGameAudio } from "@/hooks/useGameAudio";
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
    finished: boolean;  // True when player has emptied hand (spectator mode)
}

export type GameStatus = "waiting" | "playing" | "paused" | "finished";

// Using GameEngineState as the source of truth
export type GameState = GameEngineState;

interface GameContextType {
    gameState: GameState;
    currentPlayer: Player | null;
    isMyTurn: boolean;
    isSpectator: boolean;  // True when current player has finished
    myPlayerId: string | null;
    playCard: (card: Card) => void;
    drawCard: () => void;
    resetGame: () => void;
    setGameState: (state: GameState) => void;
    startMultiplayerGame: (roomId: string) => void;
    // Audio controls
    isMuted: boolean;
    toggleMute: () => void;
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

    // TODO: Get actual myPlayerId from auth context
    const myPlayerId: string | null = null; // Placeholder - should come from auth

    // 2. AUDIO SYSTEM
    const gameAudio = useGameAudio({ myPlayerId });

    // 3. SUBSCRIPTION (Multiplayer Events)
    const handleGameEvent = useCallback((event: GameEvent) => {
        console.log("[GameProvider] Received Event:", event);

        switch (event.type) {
            case "CARD_PLAYED":
                // Play card sound
                gameAudio.onCardPlayed();

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
                // THULLA_TRIGGERED audio is handled by useThullaEffects
                break;

            case "GAME_STARTED":
                // Play card deal sound
                gameAudio.onGameStarted(gameState.roomId || "local");
                break;

            case "PLAYER_FINISHED":
                // Player has emptied their hand and is out of turn rotation
                console.log(`[GameProvider] Player ${event.player_id} finished (position ${event.position})`);

                // Play win sound if it's the local player
                gameAudio.onPlayerFinished(event.player_id);

                dispatch({
                    type: "MARK_PLAYER_FINISHED",
                    playerId: event.player_id
                } as GameAction);
                break;

            case "GAME_ENDED":
                // Game is over - one player remains with cards (the loser)
                console.log(`[GameProvider] Game ended! Loser: ${event.loser_player_id}`);

                // Play lose sound if local player is the loser
                if (event.loser_player_id) {
                    gameAudio.onGameEnded(event.loser_player_id);
                }

                dispatch({ type: "END_GAME" });
                break;
        }
    }, [gameAudio, gameState.roomId]);

    // Active connection only if roomId is present (and not "local" placeholder)
    useGameSubscription({
        roomId: (gameState.roomId && gameState.roomId !== "local") ? gameState.roomId : null,
        onAnyEvent: handleGameEvent,
        enabled: !!(gameState.roomId && gameState.roomId !== "local")
    });

    // 4. DERIVED STATE
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    const myPlayer = myPlayerId ? gameState.players.find(p => p.id === myPlayerId) : null;
    const isMyTurn = myPlayerId ? currentPlayer?.id === myPlayerId : false;
    const isSpectator = myPlayer?.finished ?? false;

    // 5. ACTIONS
    const playCard = async (card: Card) => {
        if (!currentPlayer) return;

        // Block spectators from playing
        if (isSpectator) {
            console.log("[GameProvider] Cannot play - you are spectating");
            return;
        }

        // Multiplayer Logic
        if (gameState.roomId && gameState.roomId !== "local") {
            try {
                const { invokePlayCard } = await import("@/services/gameActions");
                const result = await invokePlayCard(gameState.roomId, card.suit, card.rank);

                if (!result.success) {
                    console.error("Play card failed:", result.error);
                }
            } catch (err) {
                console.error("Play card exception:", err);
            }
        } else {
            // Local play - also trigger sound
            gameAudio.onCardPlayed();
            dispatch({ type: "PLAY_CARD", playerId: currentPlayer.id, card });
        }
    };

    const drawCard = () => {
        // Not used in main play?
    };

    const resetGame = () => {
        gameAudio.reset();
        dispatch({ type: "END_GAME" });
    };

    return (
        <GameContext.Provider
            value={{
                gameState,
                setGameState: () => { },
                currentPlayer,
                isMyTurn,
                isSpectator,
                myPlayerId,
                playCard,
                drawCard,
                resetGame,
                startMultiplayerGame: (id) => {/* handle */ },
                // Audio controls
                isMuted: gameAudio.isMuted,
                toggleMute: gameAudio.toggleMute,
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
