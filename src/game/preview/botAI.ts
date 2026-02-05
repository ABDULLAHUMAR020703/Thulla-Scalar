import { Card, Suit, Player } from "@/context/GameProvider";
import { getPlayableCards } from "../engine/trickEngine";
import { TrickState } from "../engine/trickEngine";
import { getRankValue } from "../utils/cardUtils";

// ================================
// BOT TYPES
// ================================

export type BotDifficulty = "easy" | "medium" | "hard";

export interface BotPlayer extends Player {
    isBot: true;
    difficulty: BotDifficulty;
}

export interface BotDecision {
    card: Card;
    delay: number;
    reasoning?: string;
}

// ================================
// BOT AI LOGIC
// ================================

/**
 * Generate a random delay for bot thinking time
 */
export function getBotDelay(difficulty: BotDifficulty): number {
    switch (difficulty) {
        case "easy":
            return 800 + Math.random() * 400; // 800-1200ms
        case "medium":
            return 600 + Math.random() * 400; // 600-1000ms
        case "hard":
            return 400 + Math.random() * 300; // 400-700ms
    }
}

/**
 * Easy bot: Plays random valid card
 */
function easyBotDecision(playableCards: Card[]): Card {
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex];
}

/**
 * Medium bot: Tries to win tricks, avoids high cards when can't win
 */
function mediumBotDecision(
    playableCards: Card[],
    trick: TrickState,
    trumpSuit: Suit | null
): Card {
    // First card of trick: play middle-value card
    if (trick.plays.length === 0) {
        const sorted = [...playableCards].sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank));
        const middleIndex = Math.floor(sorted.length / 2);
        return sorted[middleIndex];
    }

    const leadSuit = trick.leadSuit!;
    const suitCards = playableCards.filter((c) => c.suit === leadSuit);

    // Has matching suit
    if (suitCards.length > 0) {
        // Find highest card in trick of lead suit
        const trickHighest = trick.plays
            .filter((p) => p.card.suit === leadSuit)
            .reduce((max, p) => (getRankValue(p.card.rank) > getRankValue(max.card.rank) ? p : max));

        // Try to beat it with lowest winning card
        const winners = suitCards.filter((c) => getRankValue(c.rank) > getRankValue(trickHighest.card.rank));
        if (winners.length > 0) {
            return winners.sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank))[0];
        }

        // Can't win, play lowest card
        return suitCards.sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank))[0];
    }

    // No matching suit - play lowest card of any suit
    return playableCards.sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank))[0];
}

/**
 * Hard bot: Strategic play with card counting (simplified)
 */
function hardBotDecision(
    playableCards: Card[],
    trick: TrickState,
    trumpSuit: Suit | null,
    hand: Card[]
): Card {
    // Use medium logic as base
    const mediumChoice = mediumBotDecision(playableCards, trick, trumpSuit);

    // Additional hard bot logic: preserve trump cards
    if (trumpSuit && trick.plays.length > 0) {
        const nonTrumpCards = playableCards.filter((c) => c.suit !== trumpSuit);
        if (nonTrumpCards.length > 0 && mediumChoice.suit === trumpSuit) {
            // Don't waste trump if we have alternatives and can't win anyway
            return nonTrumpCards.sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank))[0];
        }
    }

    return mediumChoice;
}

/**
 * Main bot decision function
 */
export function makeBotDecision(
    bot: BotPlayer,
    trick: TrickState,
    trumpSuit: Suit | null
): BotDecision {
    const playableCards = getPlayableCards(bot, trick);

    if (playableCards.length === 0) {
        throw new Error("Bot has no playable cards");
    }

    if (playableCards.length === 1) {
        return {
            card: playableCards[0],
            delay: getBotDelay(bot.difficulty) * 0.5,
            reasoning: "Only one option",
        };
    }

    let card: Card;
    let reasoning: string;

    switch (bot.difficulty) {
        case "easy":
            card = easyBotDecision(playableCards);
            reasoning = "Random choice";
            break;
        case "medium":
            card = mediumBotDecision(playableCards, trick, trumpSuit);
            reasoning = "Strategic play";
            break;
        case "hard":
            card = hardBotDecision(playableCards, trick, trumpSuit, bot.hand);
            reasoning = "Optimized play";
            break;
    }

    return {
        card,
        delay: getBotDelay(bot.difficulty),
        reasoning,
    };
}

// ================================
// BOT CREATION
// ================================

const BOT_NAMES = ["Bot Alice", "Bot Bob", "Bot Charlie", "Bot Diana", "Bot Eve"];
const BOT_AVATARS = ["🤖", "🎮", "🃏", "🎯", "🎲"];

/**
 * Create bot players
 */
export function createBotPlayers(
    count: number,
    difficulty: BotDifficulty = "medium"
): BotPlayer[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `bot-${i + 1}`,
        name: BOT_NAMES[i % BOT_NAMES.length],
        avatar: BOT_AVATARS[i % BOT_AVATARS.length],
        hand: [],
        score: 0,
        isReady: true,
        isHost: false,
        isBot: true as const,
        difficulty,
    }));
}

/**
 * Check if a player is a bot
 */
export function isBot(player: Player): player is BotPlayer {
    return "isBot" in player && player.isBot === true;
}
