import { supabase } from "@/services/supabase";
import { Card, Suit } from "@/context/GameProvider";

// ================================
// GAME EVENT TYPES
// ================================

export type GameEventType =
    | "TURN_CHANGED"
    | "CARD_PLAYED"
    | "THULLA_TRIGGERED"
    | "TRICK_CLEARED"
    | "PILE_PICKED";

export interface TurnChangedEvent {
    type: "TURN_CHANGED";
    player_id: string;
    player_name: string;
}

export interface CardPlayedEvent {
    type: "CARD_PLAYED";
    player_id: string;
    card: Card;
    is_thulla: boolean;
}

export interface ThullaTriggeredEvent {
    type: "THULLA_TRIGGERED";
    trigger_player_id: string;
    pickup_player_id: string;
    pickup_player_name: string;
}

export interface TrickClearedEvent {
    type: "TRICK_CLEARED";
    winner_player_id: string;
    active_suit: Suit | null;
}

export interface PilePickedEvent {
    type: "PILE_PICKED";
    player_id: string;
    card_count: number;
}

export interface GameStartedEvent {
    type: "GAME_STARTED";
    room_id: string;
    starter_player_id: string;
    active_suit: "spades"; // Initial active suit is always spades
    timestamp: number;
}

export type GameEvent =
    | GameStartedEvent
    | TurnChangedEvent
    | CardPlayedEvent
    | ThullaTriggeredEvent
    | TrickClearedEvent
    | PilePickedEvent;

// ================================
// CHANNEL HELPERS
// ================================

export function getRoomChannelName(roomId: string): string {
    return `room:${roomId}`;
}

// ================================
// BROADCAST HANDLER (Server-side calls this)
// ================================

/**
 * Broadcast a game event to all players in a room
 * NOTE: This does NOT mutate game state - database is source of truth
 */
export async function broadcastGameEvent(
    roomId: string,
    event: GameEvent
): Promise<{ success: boolean; error?: string }> {
    try {
        const channelName = getRoomChannelName(roomId);
        const channel = supabase.channel(channelName);

        await channel.send({
            type: "broadcast",
            event: "game_event",
            payload: {
                ...event,
                timestamp: Date.now(),
            },
        });

        console.log(`[Broadcast] ${event.type} to room ${roomId}`);
        return { success: true };
    } catch (error) {
        console.error("[Broadcast] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Broadcast failed",
        };
    }
}

// ================================
// SPECIFIC EVENT BROADCASTERS
// ================================

export async function broadcastTurnChanged(
    roomId: string,
    playerId: string,
    playerName: string
) {
    return broadcastGameEvent(roomId, {
        type: "TURN_CHANGED",
        player_id: playerId,
        player_name: playerName,
    });
}

export async function broadcastCardPlayed(
    roomId: string,
    playerId: string,
    card: Card,
    isThulla: boolean = false
) {
    return broadcastGameEvent(roomId, {
        type: "CARD_PLAYED",
        player_id: playerId,
        card,
        is_thulla: isThulla,
    });
}

export async function broadcastThullaTriggered(
    roomId: string,
    triggerPlayerId: string,
    pickupPlayerId: string,
    pickupPlayerName: string
) {
    return broadcastGameEvent(roomId, {
        type: "THULLA_TRIGGERED",
        trigger_player_id: triggerPlayerId,
        pickup_player_id: pickupPlayerId,
        pickup_player_name: pickupPlayerName,
    });
}

export async function broadcastTrickCleared(
    roomId: string,
    winnerPlayerId: string,
    activeSuit: Suit | null
) {
    return broadcastGameEvent(roomId, {
        type: "TRICK_CLEARED",
        winner_player_id: winnerPlayerId,
        active_suit: activeSuit,
    });
}

export async function broadcastPilePicked(
    roomId: string,
    playerId: string,
    cardCount: number
) {
    return broadcastGameEvent(roomId, {
        type: "PILE_PICKED",
        player_id: playerId,
        card_count: cardCount,
    });
}
