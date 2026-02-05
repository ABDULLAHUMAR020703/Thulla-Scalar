import { Card, Suit, Player } from "@/context/GameProvider";

// ================================
// EVENT TYPES
// ================================

export type GameEventType =
    | "GAME_START"
    | "CARD_PLAYED"
    | "TURN_CHANGED"
    | "THULLA_TRIGGERED"
    | "TRICK_CLEARED"
    | "PILE_PICKUP"
    | "PLAYER_JOINED"
    | "PLAYER_LEFT"
    | "PLAYER_READY"
    | "GAME_ENDED"
    | "HEARTBEAT";

// ================================
// EVENT PAYLOADS
// ================================

export interface GameStartPayload {
    players: Player[];
    trumpSuit: Suit;
    starterId: string;
    hands: Record<string, Card[]>;
}

export interface CardPlayedPayload {
    playerId: string;
    card: Card;
    timestamp: number;
}

export interface TurnChangedPayload {
    nextPlayerId: string;
    previousPlayerId: string;
}

export interface ThullaTriggeredPayload {
    playerId: string;
    playerName: string;
    offendingCard: Card;
    leadSuit: Suit;
}

export interface TrickClearedPayload {
    winnerId: string;
    winningCard: Card;
}

export interface PilePickupPayload {
    playerId: string;
    cards: Card[];
}

export interface PlayerJoinedPayload {
    player: Player;
}

export interface PlayerLeftPayload {
    playerId: string;
}

export interface PlayerReadyPayload {
    playerId: string;
    isReady: boolean;
}

export interface GameEndedPayload {
    winnerId: string;
    scores: Record<string, number>;
}

export interface HeartbeatPayload {
    playerId: string;
    timestamp: number;
}

// ================================
// GAME EVENT
// ================================

export interface GameEvent<T = unknown> {
    type: GameEventType;
    payload: T;
    senderId: string;
    roomId: string;
    timestamp: number;
    sequence: number;
}

// Type-safe event creators
export function createEvent<T>(
    type: GameEventType,
    payload: T,
    senderId: string,
    roomId: string,
    sequence: number
): GameEvent<T> {
    return {
        type,
        payload,
        senderId,
        roomId,
        timestamp: Date.now(),
        sequence,
    };
}

// Event type guards
export function isGameStartEvent(
    event: GameEvent
): event is GameEvent<GameStartPayload> {
    return event.type === "GAME_START";
}

export function isCardPlayedEvent(
    event: GameEvent
): event is GameEvent<CardPlayedPayload> {
    return event.type === "CARD_PLAYED";
}

export function isTurnChangedEvent(
    event: GameEvent
): event is GameEvent<TurnChangedPayload> {
    return event.type === "TURN_CHANGED";
}

export function isThullaTriggeredEvent(
    event: GameEvent
): event is GameEvent<ThullaTriggeredPayload> {
    return event.type === "THULLA_TRIGGERED";
}

export function isTrickClearedEvent(
    event: GameEvent
): event is GameEvent<TrickClearedPayload> {
    return event.type === "TRICK_CLEARED";
}

export function isPilePickupEvent(
    event: GameEvent
): event is GameEvent<PilePickupPayload> {
    return event.type === "PILE_PICKUP";
}
