import { Card, Player, Suit } from "@/context/GameProvider";
import {
    GameEvent,
    CardPlayedPayload,
    GameStartPayload,
    ThullaTriggeredPayload,
    TrickClearedPayload,
    PilePickupPayload,
    TurnChangedPayload,
} from "./events";
import { GameEngineState, GameAction } from "../engine/gameEngine";
import { sortCards } from "../utils/cardUtils";

// ================================
// SYNC TYPES
// ================================

export interface SyncState {
    lastSequence: number;
    pendingActions: GameAction[];
    isHost: boolean;
    localPlayerId: string;
}

// ================================
// EVENT TO ACTION MAPPER
// ================================

/**
 * Convert a remote game event to a local game action
 * Handles optimistic updates by detecting if action is from self
 */
export function eventToAction(
    event: GameEvent,
    localPlayerId: string
): GameAction | null {
    // Skip events from self (already applied optimistically)
    const isFromSelf = event.senderId === localPlayerId;

    switch (event.type) {
        case "GAME_START": {
            const payload = event.payload as GameStartPayload;
            // Game start applies to everyone
            return { type: "START_GAME", players: payload.players, trumpSuit: payload.trumpSuit };
        }

        case "CARD_PLAYED": {
            if (isFromSelf) return null; // Already applied locally
            const payload = event.payload as CardPlayedPayload;
            return { type: "PLAY_CARD", playerId: payload.playerId, card: payload.card };
        }

        case "TRICK_CLEARED": {
            if (isFromSelf) return null;
            return { type: "RESET_TRICK" };
        }

        case "PILE_PICKUP": {
            // Handle pile pickup if not from self
            // This would require a custom action in the game engine
            return null;
        }

        default:
            return null;
    }
}

/**
 * Apply remote events to local game state
 */
export function applyRemoteEvent(
    state: GameEngineState,
    event: GameEvent,
    localPlayerId: string,
    dispatch: (action: GameAction) => void
): void {
    const action = eventToAction(event, localPlayerId);
    if (action) {
        dispatch(action);
    }
}

// ================================
// CONFLICT RESOLUTION
// ================================

/**
 * Detect if there's a conflict between local and remote state
 */
export function detectConflict(
    localState: GameEngineState,
    remoteEvent: GameEvent
): boolean {
    // Simple conflict detection based on sequence
    // Could be extended for more sophisticated conflict resolution
    return false;
}

/**
 * Resolve conflicts by preferring server/host state
 */
export function resolveConflict(
    localState: GameEngineState,
    remoteEvent: GameEvent,
    isHost: boolean
): GameEngineState {
    // Host's state is authoritative
    if (!isHost) {
        // Apply remote state
        // This would require reconstructing state from events
    }
    return localState;
}

// ================================
// STATE SERIALIZATION
// ================================

/**
 * Serialize game state for transmission
 * (Minimal payload to reduce bandwidth)
 */
export function serializeState(state: GameEngineState): object {
    return {
        round: state.round,
        status: state.status,
        currentPlayerId: state.currentPlayerId,
        trumpSuit: state.trumpSuit,
        pile: state.pile.map((c) => c.id),
        trickStarterId: state.trickStarterId,
        scores: state.scores,
    };
}

/**
 * Reconstruct player hands from deal event
 */
export function reconstructHands(
    players: Player[],
    hands: Record<string, Card[]>
): Player[] {
    return players.map((player) => ({
        ...player,
        hand: sortCards(hands[player.id] ?? []),
    }));
}

// ================================
// OPTIMISTIC UPDATE HELPERS
// ================================

/**
 * Create an optimistic update for playing a card
 */
export function createOptimisticCardPlay(
    state: GameEngineState,
    playerId: string,
    card: Card
): Partial<GameEngineState> {
    // Find player and remove card from hand
    const playerIndex = state.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return {};

    const updatedPlayers = [...state.players];
    updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        hand: updatedPlayers[playerIndex].hand.filter((c) => c.id !== card.id),
    };

    return {
        players: updatedPlayers,
        pile: [...state.pile, card],
    };
}

/**
 * Rollback optimistic update if server rejects
 */
export function rollbackOptimisticUpdate(
    state: GameEngineState,
    originalState: Partial<GameEngineState>
): GameEngineState {
    return {
        ...state,
        ...originalState,
    };
}
