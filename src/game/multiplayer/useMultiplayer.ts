"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
    RealtimeGameClient,
    createRealtimeClient,
    ConnectionStatus,
} from "./realtimeClient";
import {
    GameEvent,
    GameEventType,
    CardPlayedPayload,
    GameStartPayload,
    ThullaTriggeredPayload,
    TrickClearedPayload,
    PilePickupPayload,
    TurnChangedPayload,
    isCardPlayedEvent,
    isGameStartEvent,
    isThullaTriggeredEvent,
    isTrickClearedEvent,
    isPilePickupEvent,
    isTurnChangedEvent,
} from "./events";
import { Card, Suit, Player } from "@/context/GameProvider";

// ================================
// TYPES
// ================================

export interface MultiplayerState {
    isConnected: boolean;
    status: ConnectionStatus;
    roomId: string | null;
    playerId: string | null;
    error: string | null;
}

export interface MultiplayerEventHandlers {
    onGameStart?: (payload: GameStartPayload) => void;
    onCardPlayed?: (payload: CardPlayedPayload) => void;
    onTurnChanged?: (payload: TurnChangedPayload) => void;
    onThullaTriggered?: (payload: ThullaTriggeredPayload) => void;
    onTrickCleared?: (payload: TrickClearedPayload) => void;
    onPilePickup?: (payload: PilePickupPayload) => void;
    onPlayerJoined?: (player: Player) => void;
    onPlayerLeft?: (playerId: string) => void;
    onError?: (error: Error) => void;
}

interface UseMultiplayerOptions {
    roomId: string;
    playerId: string;
    handlers: MultiplayerEventHandlers;
    autoConnect?: boolean;
}

// ================================
// HOOK
// ================================

export function useMultiplayer(options: UseMultiplayerOptions) {
    const { roomId, playerId, handlers, autoConnect = true } = options;

    const clientRef = useRef<RealtimeGameClient | null>(null);
    const handlersRef = useRef(handlers);

    const [state, setState] = useState<MultiplayerState>({
        isConnected: false,
        status: "disconnected",
        roomId: null,
        playerId: null,
        error: null,
    });

    // Keep handlers ref updated
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    // Event dispatcher
    const handleEvent = useCallback((event: GameEvent) => {
        const h = handlersRef.current;

        if (isGameStartEvent(event)) {
            h.onGameStart?.(event.payload);
        } else if (isCardPlayedEvent(event)) {
            h.onCardPlayed?.(event.payload);
        } else if (isTurnChangedEvent(event)) {
            h.onTurnChanged?.(event.payload);
        } else if (isThullaTriggeredEvent(event)) {
            h.onThullaTriggered?.(event.payload);
        } else if (isTrickClearedEvent(event)) {
            h.onTrickCleared?.(event.payload);
        } else if (isPilePickupEvent(event)) {
            h.onPilePickup?.(event.payload);
        } else if (event.type === "PLAYER_JOINED") {
            h.onPlayerJoined?.(event.payload as Player);
        } else if (event.type === "PLAYER_LEFT") {
            h.onPlayerLeft?.((event.payload as { playerId: string }).playerId);
        }
    }, []);

    // Status change handler
    const handleStatusChange = useCallback((status: ConnectionStatus) => {
        setState((prev) => ({
            ...prev,
            status,
            isConnected: status === "connected",
        }));
    }, []);

    // Error handler
    const handleError = useCallback((error: Error) => {
        setState((prev) => ({ ...prev, error: error.message }));
        handlersRef.current.onError?.(error);
    }, []);

    // Connect to room
    const connect = useCallback(async () => {
        if (clientRef.current) {
            await clientRef.current.disconnect();
        }

        const client = createRealtimeClient({
            roomId,
            playerId,
            onEvent: handleEvent,
            onStatusChange: handleStatusChange,
            onError: handleError,
            heartbeatInterval: 20000,
        });

        clientRef.current = client;
        setState((prev) => ({ ...prev, roomId, playerId, error: null }));

        await client.connect();
    }, [roomId, playerId, handleEvent, handleStatusChange, handleError]);

    // Disconnect from room
    const disconnect = useCallback(async () => {
        if (clientRef.current) {
            await clientRef.current.disconnect();
            clientRef.current = null;
        }
        setState({
            isConnected: false,
            status: "disconnected",
            roomId: null,
            playerId: null,
            error: null,
        });
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect && roomId && playerId) {
            connect();
        }

        return () => {
            clientRef.current?.disconnect();
        };
    }, [autoConnect, roomId, playerId, connect]);

    // ================================
    // BROADCAST ACTIONS
    // ================================

    const broadcast = useCallback(<T>(type: GameEventType, payload: T) => {
        clientRef.current?.broadcast(type, payload);
    }, []);

    // Optimistic card play
    const playCard = useCallback((card: Card) => {
        broadcast<CardPlayedPayload>("CARD_PLAYED", {
            playerId,
            card,
            timestamp: Date.now(),
        });
    }, [broadcast, playerId]);

    // Start game
    const startGame = useCallback((players: Player[], trumpSuit: Suit, hands: Record<string, Card[]>) => {
        broadcast<GameStartPayload>("GAME_START", {
            players,
            trumpSuit,
            starterId: playerId,
            hands,
        });
    }, [broadcast, playerId]);

    // Thulla triggered
    const triggerThulla = useCallback((
        targetPlayerId: string,
        playerName: string,
        offendingCard: Card,
        leadSuit: Suit
    ) => {
        broadcast<ThullaTriggeredPayload>("THULLA_TRIGGERED", {
            playerId: targetPlayerId,
            playerName,
            offendingCard,
            leadSuit,
        });
    }, [broadcast]);

    // Clear trick
    const clearTrick = useCallback((winnerId: string, winningCard: Card) => {
        broadcast<TrickClearedPayload>("TRICK_CLEARED", {
            winnerId,
            winningCard,
        });
    }, [broadcast]);

    // Pile pickup
    const pickupPile = useCallback((cards: Card[]) => {
        broadcast<PilePickupPayload>("PILE_PICKUP", {
            playerId,
            cards,
        });
    }, [broadcast, playerId]);

    return {
        // State
        ...state,

        // Connection
        connect,
        disconnect,

        // Actions (with optimistic updates)
        playCard,
        startGame,
        triggerThulla,
        clearTrick,
        pickupPile,
        broadcast,
    };
}
