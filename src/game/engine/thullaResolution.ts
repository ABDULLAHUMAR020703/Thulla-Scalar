/**
 * THULLA Resolution Logic
 * 
 * Pure logic for THULLA detection and resolution. No direct database writes.
 * All mutations go through Edge Functions via gameActions.ts.
 */

import { Card, Suit, Rank } from "@/context/GameProvider";

// ================================
// TYPES
// ================================

export interface TrickCard {
    playerId: string;
    card: Card;
    isThulla: boolean;
}

export interface Player {
    id: string;
    userId: string;
    position: number;
    isActive: boolean;
    hasCards: boolean;
}

// ================================
// RANK VALUES
// ================================

const RANK_VALUES: Record<Rank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// ================================
// FIND SENIOR CARD (Pure Logic)
// ================================

/**
 * Find the highest card of the active suit in a trick
 * Returns the player who played it (will receive pile)
 */
export function findSeniorCardPlayer(
    trickCards: TrickCard[],
    activeSuit: Suit
): { playerId: string; card: Card } | null {
    const suitCards = trickCards.filter((t) => t.card.suit === activeSuit);

    if (suitCards.length === 0) {
        return null;
    }

    const senior = suitCards.reduce((highest, current) => {
        const currentValue = RANK_VALUES[current.card.rank];
        const highestValue = RANK_VALUES[highest.card.rank];
        return currentValue > highestValue ? current : highest;
    });

    return { playerId: senior.playerId, card: senior.card };
}

// ================================
// THULLA VALIDATION (Pure Logic)
// ================================

/**
 * Validate THULLA trigger
 * Returns true if card played doesn't match active suit AND player has no cards of that suit
 */
export function isThullaTriggered(
    cardSuit: Suit,
    activeSuit: Suit | null,
    playerHasSuit: boolean
): boolean {
    // No active suit = first card, not THULLA
    if (!activeSuit) return false;

    // Card matches suit = not THULLA
    if (cardSuit === activeSuit) return false;

    // Card doesn't match AND player doesn't have the suit = valid off-suit play (not THULLA)
    // Card doesn't match AND player HAS the suit = THULLA (cheating/broke rules)
    return playerHasSuit;
}

// ================================
// HELPER: Get Next Active Player (Pure Logic)
// ================================

export function getNextActivePlayer(
    players: { id: string; position: number; isActive: boolean }[],
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
