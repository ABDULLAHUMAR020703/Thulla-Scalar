"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/services/supabase";
import { GameEvent, GameEventType } from "@/services/gameBroadcast";

// ================================
// TYPES
// ================================

export interface UseGameSubscriptionOptions {
    roomId: string | null;
    onTurnChanged?: (playerId: string, playerName: string) => void;
    onCardPlayed?: (playerId: string, card: { suit: string; rank: string }, isThulla: boolean) => void;
    onThullaTriggered?: (triggerPlayerId: string, pickupPlayerId: string, pickupPlayerName: string) => void;
    onTrickCleared?: (winnerPlayerId: string, activeSuit: string | null) => void;
    onPilePicked?: (playerId: string, cardCount: number) => void;
    onAnyEvent?: (event: GameEvent) => void;
    enabled?: boolean;
}

// ================================
// GAME SUBSCRIPTION HOOK
// ================================

/**
 * Subscribe to realtime game events
 * 
 * IMPORTANT: This hook only RECEIVES events - it does NOT mutate state
 * After receiving an event, fetch fresh state from database
 */
export function useGameSubscription(options: UseGameSubscriptionOptions) {
    const {
        roomId,
        onTurnChanged,
        onCardPlayed,
        onThullaTriggered,
        onTrickCleared,
        onPilePicked,
        onAnyEvent,
        enabled = true,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Event handler
    const handleEvent = useCallback(
        (payload: { payload: GameEvent & { timestamp: number } }) => {
            const event = payload.payload;

            console.log(`[GameSub] Received: ${event.type}`, event);
            setLastEvent(event);

            // Call specific handler
            switch (event.type) {
                case "TURN_CHANGED":
                    onTurnChanged?.(event.player_id, event.player_name);
                    break;
                case "CARD_PLAYED":
                    onCardPlayed?.(event.player_id, event.card, event.is_thulla);
                    break;
                case "THULLA_TRIGGERED":
                    onThullaTriggered?.(
                        event.trigger_player_id,
                        event.pickup_player_id,
                        event.pickup_player_name
                    );
                    break;
                case "TRICK_CLEARED":
                    onTrickCleared?.(event.winner_player_id, event.active_suit);
                    break;
                case "PILE_PICKED":
                    onPilePicked?.(event.player_id, event.card_count);
                    break;
            }

            // Call generic handler
            onAnyEvent?.(event);
        },
        [onTurnChanged, onCardPlayed, onThullaTriggered, onTrickCleared, onPilePicked, onAnyEvent]
    );

    // Subscribe to channel
    useEffect(() => {
        if (!roomId || !enabled) {
            setIsConnected(false);
            return;
        }

        const channel = supabase.channel(`room:${roomId}`);
        channelRef.current = channel;

        channel
            .on("broadcast", { event: "game_event" }, handleEvent)
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    setIsConnected(true);
                    console.log(`[GameSub] Connected to room: ${roomId}`);
                } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                    setIsConnected(false);
                    console.log(`[GameSub] Disconnected from room: ${roomId}`);
                }
            });

        return () => {
            console.log(`[GameSub] Unsubscribing from room: ${roomId}`);
            supabase.removeChannel(channel);
            channelRef.current = null;
            setIsConnected(false);
        };
    }, [roomId, enabled, handleEvent]);

    return {
        isConnected,
        lastEvent,
    };
}

// ================================
// DATABASE SYNC HOOK
// ================================

/**
 * Subscribe to database changes for a room
 * Use this for state synchronization
 */
export function useRoomDatabaseSync(options: {
    roomId: string | null;
    onRoomUpdate?: (room: Record<string, unknown>) => void;
    onPlayerUpdate?: (player: Record<string, unknown>) => void;
    onHandUpdate?: () => void;
    enabled?: boolean;
}) {
    const { roomId, onRoomUpdate, onPlayerUpdate, onHandUpdate, enabled = true } = options;
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!roomId || !enabled) return;

        const channel = supabase
            .channel(`db-sync:${roomId}`)
            // Room changes
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
                (payload) => {
                    console.log("[DBSync] Room updated");
                    onRoomUpdate?.(payload.new);
                }
            )
            // Player changes
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
                (payload) => {
                    console.log("[DBSync] Player updated");
                    onPlayerUpdate?.(payload.new);
                }
            )
            // Hand changes
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "hands", filter: `room_id=eq.${roomId}` },
                () => {
                    console.log("[DBSync] Hands updated");
                    onHandUpdate?.();
                }
            )
            .subscribe((status) => {
                setIsConnected(status === "SUBSCRIBED");
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, enabled, onRoomUpdate, onPlayerUpdate, onHandUpdate]);

    return { isConnected };
}
