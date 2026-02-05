/**
 * Game Start Logic
 * 
 * Pure logic for game start. No direct database writes.
 * All mutations go through Edge Functions via gameActions.ts.
 */

import { Card, Suit, Rank } from "@/context/GameProvider";

// ================================
// ACE OF SPADES GAME START LOGIC (Pure)
// ================================

/**
 * Find which player holds the Ace of Spades
 * This player will start the game
 */
export function findAceOfSpadesHolder<T extends { id: string; hand: Card[] }>(
    players: T[]
): T | null {
    for (const player of players) {
        const hasAceOfSpades = player.hand.some(
            (card) => card.suit === "spades" && card.rank === "A"
        );
        if (hasAceOfSpades) {
            return player;
        }
    }
    return null;
}

/**
 * Validate that a player actually holds Ace of Spades
 */
export function playerHasAceOfSpades(hand: Card[]): boolean {
    return hand.some((card) => card.suit === "spades" && card.rank === "A");
}

/**
 * Get Ace of Spades card from a hand
 */
export function getAceOfSpades(hand: Card[]): Card | null {
    return hand.find((card) => card.suit === "spades" && card.rank === "A") ?? null;
}

/**
 * Validate first move is Ace of Spades
 * First trick must start with Ace of Spades
 */
export function validateFirstMove(card: Card, isFirstTrick: boolean): boolean {
    if (!isFirstTrick) return true;
    return card.suit === "spades" && card.rank === "A";
}

// ================================
// TURN ORDER (CLOCKWISE) - Pure Logic
// ================================

export interface PlayerWithPosition {
    id: string;
    position: number;
    isActive: boolean;
}

/**
 * Get next player in clockwise order
 * Skips inactive/finished players
 */
export function getNextPlayerClockwise(
    players: PlayerWithPosition[],
    currentPlayerId: string
): string | null {
    const activePlayers = players
        .filter((p) => p.isActive)
        .sort((a, b) => a.position - b.position);

    if (activePlayers.length === 0) return null;

    const currentIndex = activePlayers.findIndex((p) => p.id === currentPlayerId);
    if (currentIndex === -1) return activePlayers[0].id;

    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].id;
}

/**
 * Validate it's the correct player's turn
 */
export function validatePlayerTurn(
    currentTurnPlayerId: string,
    playerId: string
): boolean {
    return currentTurnPlayerId === playerId;
}
