import { Card, Suit } from "@/context/GameProvider";
import { PreviewPlayer, PreviewGameState, getRankValue, playerHasSuit } from "./gameStateMachine";

// ================================
// AI DECISION TYPES
// ================================

export interface AIDecision {
    card: Card;
    isThulla: boolean;
    thinkingTime: number;
    reasoning: string;
}

// ================================
// AI DECISION LOGIC
// ================================

/**
 * Get random thinking delay (500-1200ms base)
 */
function getThinkingDelay(speed: number): number {
    const baseDelay = 500 + Math.random() * 700;
    return baseDelay / speed;
}

/**
 * Get the lowest card from a list
 */
function getLowestCard(cards: Card[]): Card {
    return cards.reduce((lowest, card) =>
        getRankValue(card.rank) < getRankValue(lowest.rank) ? card : lowest
    );
}

/**
 * Get cards of a specific suit
 */
function getCardsOfSuit(hand: Card[], suit: Suit): Card[] {
    return hand.filter(card => card.suit === suit);
}

/**
 * Main AI decision function
 * Implements the rule-based bot logic:
 * 
 * IF active suit exists:
 *   IF bot has suit → play LOWEST card of that suit
 *   ELSE → trigger THULLA, play lowest card in hand
 * 
 * IF no active suit:
 *   → Play lowest card in hand (starts new trick)
 */
export function makeBotDecision(
    bot: PreviewPlayer,
    state: PreviewGameState
): AIDecision {
    const { activeSuit } = state;
    const hand = bot.hand;

    if (hand.length === 0) {
        throw new Error(`Bot ${bot.name} has no cards to play`);
    }

    let selectedCard: Card;
    let isThulla = false;
    let reasoning: string;

    if (activeSuit !== null) {
        // Active suit exists - must try to follow
        const suitCards = getCardsOfSuit(hand, activeSuit);

        if (suitCards.length > 0) {
            // Has matching suit - play lowest of that suit
            selectedCard = getLowestCard(suitCards);
            reasoning = `Following suit with lowest ${activeSuit}`;
        } else {
            // No matching suit - THULLA time!
            selectedCard = getLowestCard(hand);
            isThulla = true;
            reasoning = `No ${activeSuit} in hand - THULLA triggered!`;
        }
    } else {
        // No active suit - bot starts the trick
        // Play lowest card to minimize risk
        selectedCard = getLowestCard(hand);
        reasoning = `Starting trick with lowest card`;
    }

    return {
        card: selectedCard,
        isThulla,
        thinkingTime: getThinkingDelay(state.speed),
        reasoning,
    };
}

/**
 * Check if current player is a bot
 */
export function isCurrentPlayerBot(state: PreviewGameState): boolean {
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    return currentPlayer?.isBot ?? false;
}

/**
 * Get current player
 */
export function getCurrentPlayer(state: PreviewGameState): PreviewPlayer | null {
    return state.players.find(p => p.id === state.currentPlayerId) ?? null;
}

/**
 * Debug log for AI decisions
 */
export function logAIDecision(bot: PreviewPlayer, decision: AIDecision): void {
    console.log(
        `[AI] ${bot.name}: ${decision.reasoning}`,
        `| Card: ${decision.card.rank} of ${decision.card.suit}`,
        decision.isThulla ? "| 🔥 THULLA!" : ""
    );
}
