"use client";

import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import { Card, Suit, Player } from "@/context/GameProvider";
import {
    GameEngineState,
    gameReducer,
    createInitialGameState,
    createDeck,
    shuffleDeck,
} from "../engine/gameEngine";
import { createTrickState, getPlayableCards } from "../engine/trickEngine";
import { sortCards } from "../utils/cardUtils";
import { BotPlayer, createBotPlayers, makeBotDecision, isBot, BotDifficulty } from "./botAI";

// ================================
// PREVIEW ENGINE TYPES
// ================================

export interface PreviewSettings {
    botCount: number;
    botDifficulty: BotDifficulty;
    gameSpeed: number; // 0.5 to 2.0
    autoPlay: boolean;
}

export interface PreviewState {
    isActive: boolean;
    isPaused: boolean;
    settings: PreviewSettings;
    gameState: GameEngineState;
    humanPlayerId: string;
}

const DEFAULT_SETTINGS: PreviewSettings = {
    botCount: 3,
    botDifficulty: "medium",
    gameSpeed: 1.0,
    autoPlay: false,
};

// ================================
// PREVIEW ENGINE HOOK
// ================================

export function usePreviewEngine() {
    const [previewState, setPreviewState] = useState<PreviewState>({
        isActive: false,
        isPaused: false,
        settings: DEFAULT_SETTINGS,
        gameState: createInitialGameState("preview-room"),
        humanPlayerId: "human-player",
    });

    const [gameState, dispatch] = useReducer(
        gameReducer,
        "preview-room",
        createInitialGameState
    );

    const botTimerRef = useRef<NodeJS.Timeout | null>(null);
    const settingsRef = useRef(previewState.settings);

    // Keep settings ref updated
    useEffect(() => {
        settingsRef.current = previewState.settings;
    }, [previewState.settings]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (botTimerRef.current) {
                clearTimeout(botTimerRef.current);
            }
        };
    }, []);

    // ================================
    // BOT TURN HANDLING
    // ================================

    const processBotTurn = useCallback(() => {
        if (!previewState.isActive || previewState.isPaused) return;
        if (gameState.status !== "playing") return;

        const currentPlayer = gameState.players.find(
            (p) => p.id === gameState.currentPlayerId
        );

        if (!currentPlayer || !isBot(currentPlayer)) return;

        // Bot makes decision
        const decision = makeBotDecision(
            currentPlayer,
            gameState.currentTrick,
            gameState.trumpSuit
        );

        // Apply speed multiplier
        const delay = decision.delay / settingsRef.current.gameSpeed;

        botTimerRef.current = setTimeout(() => {
            dispatch({
                type: "PLAY_CARD",
                playerId: currentPlayer.id,
                card: decision.card,
            });
        }, delay);
    }, [previewState.isActive, previewState.isPaused, gameState]);

    // Watch for bot turns
    useEffect(() => {
        if (!previewState.isActive) return;
        if (gameState.status !== "playing") return;

        const currentPlayer = gameState.players.find(
            (p) => p.id === gameState.currentPlayerId
        );

        if (currentPlayer && isBot(currentPlayer)) {
            processBotTurn();
        }
    }, [gameState.currentPlayerId, previewState.isActive, processBotTurn]);

    // Auto-reset trick after animations
    useEffect(() => {
        if (gameState.animations.clearPile || gameState.animations.collectPile) {
            const delay = 1500 / settingsRef.current.gameSpeed;
            const timer = setTimeout(() => {
                dispatch({ type: "RESET_TRICK" });
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [gameState.animations.clearPile, gameState.animations.collectPile]);

    // ================================
    // PREVIEW CONTROLS
    // ================================

    /**
     * Start preview mode
     */
    const startPreview = useCallback((settings: Partial<PreviewSettings> = {}) => {
        const finalSettings = { ...DEFAULT_SETTINGS, ...settings };

        // Create human player
        const humanPlayer: Player = {
            id: "human-player",
            name: "You",
            hand: [],
            score: 0,
            isReady: true,
            isHost: true,
            position: 0,
            is_active: true,
        };

        // Create bot players
        const bots = createBotPlayers(finalSettings.botCount, finalSettings.botDifficulty);
        const allPlayers = [humanPlayer, ...bots];

        // Create and shuffle deck
        const deck = shuffleDeck(createDeck());

        // Deal cards
        const cardsPerPlayer = 13;
        const hands: Record<string, Card[]> = {};

        allPlayers.forEach((player, index) => {
            const start = index * cardsPerPlayer;
            const end = start + cardsPerPlayer;
            hands[player.id] = sortCards(deck.slice(start, end));
        });

        // Random trump suit
        const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
        const trumpSuit = suits[Math.floor(Math.random() * suits.length)];

        // Start game
        dispatch({ type: "START_GAME", players: allPlayers, trumpSuit });

        setTimeout(() => {
            dispatch({ type: "DEAL_CARDS", hands });
        }, 100);

        setPreviewState({
            isActive: true,
            isPaused: false,
            settings: finalSettings,
            gameState: createInitialGameState("preview-room"),
            humanPlayerId: humanPlayer.id,
        });
    }, []);

    /**
     * Stop preview mode
     */
    const stopPreview = useCallback(() => {
        if (botTimerRef.current) {
            clearTimeout(botTimerRef.current);
        }

        setPreviewState((prev) => ({
            ...prev,
            isActive: false,
            isPaused: false,
        }));
    }, []);

    /**
     * Toggle pause
     */
    const togglePause = useCallback(() => {
        setPreviewState((prev) => ({
            ...prev,
            isPaused: !prev.isPaused,
        }));
    }, []);

    /**
     * Update settings
     */
    const updateSettings = useCallback((settings: Partial<PreviewSettings>) => {
        setPreviewState((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...settings },
        }));
    }, []);

    // ================================
    // DEV PANEL ACTIONS
    // ================================

    /**
     * Force trigger Thulla animation
     */
    const triggerThulla = useCallback(() => {
        // Simulate thulla animation state
        dispatch({ type: "CLEAR_ANIMATION", animation: "showThulla" });
        // Manually set animation (would need custom action in reducer)
    }, []);

    /**
     * Force clear trick
     */
    const forceClearTrick = useCallback(() => {
        dispatch({ type: "RESET_TRICK" });
    }, []);

    /**
     * Force turn change
     */
    const forceTurnChange = useCallback(() => {
        if (gameState.players.length === 0) return;

        const currentIndex = gameState.players.findIndex(
            (p) => p.id === gameState.currentPlayerId
        );
        const nextIndex = (currentIndex + 1) % gameState.players.length;
        const nextPlayer = gameState.players[nextIndex];

        // Would need custom action in reducer for this
        console.log("Force turn to:", nextPlayer.name);
    }, [gameState.players, gameState.currentPlayerId]);

    /**
     * Trigger deal animation
     */
    const triggerDealAnimation = useCallback(() => {
        dispatch({ type: "CLEAR_ANIMATION", animation: "dealCards" });
        setTimeout(() => {
            // Reset animation flag
        }, 100);
    }, []);

    // ================================
    // PLAYER ACTIONS
    // ================================

    /**
     * Human player plays a card
     */
    const playCard = useCallback((card: Card) => {
        if (gameState.currentPlayerId !== previewState.humanPlayerId) {
            console.warn("Not your turn!");
            return false;
        }

        dispatch({
            type: "PLAY_CARD",
            playerId: previewState.humanPlayerId,
            card,
        });

        return true;
    }, [gameState.currentPlayerId, previewState.humanPlayerId]);

    // ================================
    // COMPUTED VALUES
    // ================================

    const humanPlayer = gameState.players.find(
        (p) => p.id === previewState.humanPlayerId
    );

    const isHumanTurn = gameState.currentPlayerId === previewState.humanPlayerId;

    const humanPlayableCards = humanPlayer
        ? getPlayableCards(humanPlayer, gameState.currentTrick)
        : [];

    return {
        // State
        isActive: previewState.isActive,
        isPaused: previewState.isPaused,
        settings: previewState.settings,
        gameState,
        humanPlayer,
        isHumanTurn,
        humanPlayableCards,

        // Controls
        startPreview,
        stopPreview,
        togglePause,
        updateSettings,

        // Player actions
        playCard,

        // Dev panel actions
        triggerThulla,
        forceClearTrick,
        forceTurnChange,
        triggerDealAnimation,
    };
}
