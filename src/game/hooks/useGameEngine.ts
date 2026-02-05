"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { Card, Suit, Player } from "@/context/GameProvider";
import {
    GameEngineState,
    GameAction,
    gameReducer,
    createInitialGameState,
    createDeck,
    dealCards,
    GameAnimations,
} from "../engine/gameEngine";
import { canPlayCard, getPlayableCards } from "../engine/trickEngine";

interface UseGameEngineOptions {
    roomId: string;
    autoResetTrick?: boolean;
    trickResetDelay?: number;
}

export function useGameEngine(options: UseGameEngineOptions) {
    const { roomId, autoResetTrick = true, trickResetDelay = 1500 } = options;

    const [state, dispatch] = useReducer(
        gameReducer,
        roomId,
        createInitialGameState
    );

    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-reset trick after animation
    useEffect(() => {
        if (autoResetTrick && (state.animations.clearPile || state.animations.collectPile)) {
            resetTimeoutRef.current = setTimeout(() => {
                dispatch({ type: "RESET_TRICK" });
            }, trickResetDelay);
        }

        return () => {
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
        };
    }, [state.animations.clearPile, state.animations.collectPile, autoResetTrick, trickResetDelay]);

    // Start a new game
    const startGame = useCallback((players: Player[], trumpSuit: Suit) => {
        dispatch({ type: "START_GAME", players, trumpSuit });

        // Deal cards after a short delay
        setTimeout(() => {
            const deck = createDeck();
            const { hands } = dealCards(deck, players.length, 13);

            const handsMap: Record<string, Card[]> = {};
            players.forEach((player, index) => {
                handsMap[player.id] = hands[index];
            });

            dispatch({ type: "DEAL_CARDS", hands: handsMap });
        }, 500);
    }, []);

    // Play a card
    const playCard = useCallback((playerId: string, card: Card) => {
        dispatch({ type: "PLAY_CARD", playerId, card });
    }, []);

    // Reset current trick
    const resetTrick = useCallback(() => {
        dispatch({ type: "RESET_TRICK" });
    }, []);

    // Start a new round
    const startRound = useCallback(() => {
        dispatch({ type: "START_ROUND" });

        // Deal new cards
        setTimeout(() => {
            const deck = createDeck();
            const { hands } = dealCards(deck, state.players.length, 13);

            const handsMap: Record<string, Card[]> = {};
            state.players.forEach((player, index) => {
                handsMap[player.id] = hands[index];
            });

            dispatch({ type: "DEAL_CARDS", hands: handsMap });
        }, 500);
    }, [state.players]);

    // Clear a specific animation
    const clearAnimation = useCallback((animation: keyof GameAnimations) => {
        dispatch({ type: "CLEAR_ANIMATION", animation });
    }, []);

    // End the game
    const endGame = useCallback(() => {
        dispatch({ type: "END_GAME" });
    }, []);

    // Get current player
    const currentPlayer = state.players.find(
        (p) => p.id === state.currentPlayerId
    );

    // Check if it's a specific player's turn
    const isPlayerTurn = useCallback(
        (playerId: string) => state.currentPlayerId === playerId,
        [state.currentPlayerId]
    );

    // Get playable cards for a player
    const getPlayerPlayableCards = useCallback(
        (player: Player) => getPlayableCards(player, state.currentTrick),
        [state.currentTrick]
    );

    // Check if a specific card can be played
    const canPlay = useCallback(
        (card: Card, player: Player) => canPlayCard(card, player, state.currentTrick),
        [state.currentTrick]
    );

    return {
        // State
        state,
        players: state.players,
        pile: state.pile,
        trumpSuit: state.trumpSuit,
        status: state.status,
        round: state.round,
        currentPlayerId: state.currentPlayerId,
        currentPlayer,
        currentTrick: state.currentTrick,
        lastTrickResult: state.lastTrickResult,
        animations: state.animations,
        scores: state.scores,

        // Actions
        startGame,
        playCard,
        resetTrick,
        startRound,
        clearAnimation,
        endGame,

        // Helpers
        isPlayerTurn,
        getPlayerPlayableCards,
        canPlay,
    };
}
