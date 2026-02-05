"use client";

import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import {
    PreviewGameState,
    PreviewAction,
    previewGameReducer,
    createInitialState,
    AnimationEvent,
} from "./gameStateMachine";
import {
    makeBotDecision,
    isCurrentPlayerBot,
    getCurrentPlayer,
    logAIDecision,
} from "./aiDecisionSystem";

// ================================
// TURN SCHEDULER HOOK
// ================================

export interface UsePreviewGameOptions {
    onAnimationEvent?: (event: AnimationEvent) => void;
    enableLogging?: boolean;
}

export function usePreviewGame(options: UsePreviewGameOptions = {}) {
    const { onAnimationEvent, enableLogging = true } = options;

    const [state, dispatch] = useReducer(previewGameReducer, null, createInitialState);
    const [isRunning, setIsRunning] = useState(false);

    const botTimerRef = useRef<NodeJS.Timeout | null>(null);
    const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const stateRef = useRef(state);

    // Keep state ref updated
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (botTimerRef.current) clearTimeout(botTimerRef.current);
            if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        };
    }, []);

    // Handle animation events
    useEffect(() => {
        if (state.pendingAnimations.length > 0 && onAnimationEvent) {
            const animation = state.pendingAnimations[0];
            onAnimationEvent(animation);
        }
    }, [state.pendingAnimations, onAnimationEvent]);

    // ================================
    // BOT TURN PROCESSOR
    // ================================

    const processBotTurn = useCallback(() => {
        const currentState = stateRef.current;

        if (currentState.isPaused) return;
        if (currentState.status !== "playing") return;
        if (!isCurrentPlayerBot(currentState)) return;

        const bot = getCurrentPlayer(currentState);
        if (!bot || bot.hand.length === 0) return;

        // Make decision
        const decision = makeBotDecision(bot, currentState);

        if (enableLogging) {
            logAIDecision(bot, decision);
        }

        // Schedule card play with thinking delay
        botTimerRef.current = setTimeout(() => {
            dispatch({
                type: "PLAY_CARD",
                playerId: bot.id,
                card: decision.card,
            });
        }, decision.thinkingTime);
    }, [enableLogging]);

    // Watch for bot turns
    useEffect(() => {
        if (!isRunning) return;
        if (state.isPaused) return;
        if (state.status !== "playing") return;

        if (isCurrentPlayerBot(state)) {
            // Small delay before bot starts thinking
            const delay = 200 / state.speed;
            botTimerRef.current = setTimeout(processBotTurn, delay);
        }

        return () => {
            if (botTimerRef.current) clearTimeout(botTimerRef.current);
        };
    }, [state.currentPlayerId, state.status, state.isPaused, isRunning, state.speed, processBotTurn]);

    // ================================
    // TRICK RESOLUTION
    // ================================

    useEffect(() => {
        if (state.status === "thulla" || state.status === "trickEnd") {
            // Auto-resolve trick after animation delay
            const delay = (state.status === "thulla" ? 2000 : 1000) / state.speed;

            animationTimerRef.current = setTimeout(() => {
                dispatch({ type: "RESOLVE_TRICK" });
            }, delay);

            return () => {
                if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
            };
        }
    }, [state.status, state.speed]);

    // ================================
    // DEAL ANIMATION COMPLETION
    // ================================

    useEffect(() => {
        if (state.status === "dealing") {
            const delay = 1500 / state.speed;

            animationTimerRef.current = setTimeout(() => {
                dispatch({ type: "DEAL_COMPLETE" });
                setIsRunning(true);
            }, delay);

            return () => {
                if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
            };
        }
    }, [state.status, state.speed]);

    // ================================
    // GAME CONTROLS
    // ================================

    const startGame = useCallback(() => {
        if (enableLogging) console.log("[Preview] Starting game...");
        dispatch({ type: "START_GAME" });
    }, [enableLogging]);

    const pause = useCallback(() => {
        if (enableLogging) console.log("[Preview] Paused");
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
        dispatch({ type: "PAUSE" });
    }, [enableLogging]);

    const resume = useCallback(() => {
        if (enableLogging) console.log("[Preview] Resumed");
        dispatch({ type: "RESUME" });
    }, [enableLogging]);

    const setSpeed = useCallback((speed: number) => {
        if (enableLogging) console.log(`[Preview] Speed set to ${speed}x`);
        dispatch({ type: "SET_SPEED", speed });
    }, [enableLogging]);

    const stepNext = useCallback(() => {
        if (enableLogging) console.log("[Preview] Stepping to next turn");
        // Force process current bot turn immediately
        processBotTurn();
    }, [enableLogging, processBotTurn]);

    const forceThulla = useCallback(() => {
        if (enableLogging) console.log("[Preview] Forcing THULLA");
        dispatch({ type: "FORCE_THULLA" });
    }, [enableLogging]);

    const restart = useCallback(() => {
        if (enableLogging) console.log("[Preview] Restarting game");
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        setIsRunning(false);
        dispatch({ type: "RESTART" });
    }, [enableLogging]);

    // ================================
    // HUMAN PLAYER ACTIONS
    // ================================

    const playCard = useCallback((cardId: string) => {
        const humanPlayer = state.players.find(p => !p.isBot);
        if (!humanPlayer) return false;

        if (state.currentPlayerId !== humanPlayer.id) {
            console.warn("[Preview] Not your turn!");
            return false;
        }

        const card = humanPlayer.hand.find(c => c.id === cardId);
        if (!card) {
            console.warn("[Preview] Card not found in hand");
            return false;
        }

        // Validate card can be played
        if (state.activeSuit !== null) {
            const hasSuit = humanPlayer.hand.some(c => c.suit === state.activeSuit);
            if (hasSuit && card.suit !== state.activeSuit) {
                console.warn("[Preview] Must follow suit!");
                return false;
            }
        }

        if (enableLogging) {
            console.log(`[Human] Playing ${card.rank} of ${card.suit}`);
        }

        dispatch({
            type: "PLAY_CARD",
            playerId: humanPlayer.id,
            card,
        });

        return true;
    }, [state.players, state.currentPlayerId, state.activeSuit, enableLogging]);

    // ================================
    // COMPUTED VALUES
    // ================================

    const humanPlayer = state.players.find(p => !p.isBot);
    const isHumanTurn = humanPlayer?.id === state.currentPlayerId;
    const currentPlayer = getCurrentPlayer(state);

    const canPlayCard = useCallback((cardId: string): boolean => {
        if (!isHumanTurn) return false;
        if (!humanPlayer) return false;

        const card = humanPlayer.hand.find(c => c.id === cardId);
        if (!card) return false;

        if (state.activeSuit === null) return true;

        const hasSuit = humanPlayer.hand.some(c => c.suit === state.activeSuit);
        if (!hasSuit) return true;

        return card.suit === state.activeSuit;
    }, [isHumanTurn, humanPlayer, state.activeSuit]);

    return {
        // State
        state,
        isRunning,
        humanPlayer,
        isHumanTurn,
        currentPlayer,

        // Controls
        startGame,
        pause,
        resume,
        setSpeed,
        stepNext,
        forceThulla,
        restart,

        // Player actions
        playCard,
        canPlayCard,
    };
}
