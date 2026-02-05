import { Card, Suit, Rank } from "@/context/GameProvider";

// Rank values for comparison (Thulla specific ordering)
const RANK_VALUES: Record<Rank, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
};

/**
 * Get the numeric value of a card's rank
 */
export function getRankValue(rank: Rank): number {
    return RANK_VALUES[rank];
}

/**
 * Compare two cards by rank
 * Returns positive if card1 > card2, negative if card1 < card2, 0 if equal
 */
export function compareCards(card1: Card, card2: Card): number {
    return getRankValue(card1.rank) - getRankValue(card2.rank);
}

/**
 * Find the senior (highest) card of a specific suit from a list of cards
 */
export function findSeniorCard(cards: Card[], suit: Suit): Card | null {
    const suitCards = cards.filter((card) => card.suit === suit);
    if (suitCards.length === 0) return null;

    return suitCards.reduce((senior, card) => {
        return compareCards(card, senior) > 0 ? card : senior;
    });
}

/**
 * Find the winning card from the current pile
 * In Thulla, the highest card of the lead suit wins (unless trumped)
 */
export function findWinningCard(
    pile: Card[],
    trumpSuit: Suit | null
): { card: Card; index: number } | null {
    if (pile.length === 0) return null;

    const leadSuit = pile[0].suit;
    let winningIndex = 0;
    let winningCard = pile[0];

    for (let i = 1; i < pile.length; i++) {
        const card = pile[i];
        const currentWinning = winningCard;

        // Trump beats non-trump
        if (trumpSuit) {
            const cardIsTrump = card.suit === trumpSuit;
            const winningIsTrump = currentWinning.suit === trumpSuit;

            if (cardIsTrump && !winningIsTrump) {
                winningCard = card;
                winningIndex = i;
                continue;
            }

            if (!cardIsTrump && winningIsTrump) {
                continue;
            }

            // Both are trump or both are not trump
            if (cardIsTrump && winningIsTrump) {
                if (compareCards(card, currentWinning) > 0) {
                    winningCard = card;
                    winningIndex = i;
                }
                continue;
            }
        }

        // Same suit comparison
        if (card.suit === leadSuit && compareCards(card, currentWinning) > 0) {
            winningCard = card;
            winningIndex = i;
        }
    }

    return { card: winningCard, index: winningIndex };
}

/**
 * Check if a card is playable based on hand and lead suit
 */
export function isCardPlayable(
    card: Card,
    hand: Card[],
    leadSuit: Suit | null
): boolean {
    // If no lead suit, any card is playable
    if (!leadSuit) return true;

    // If player has cards of lead suit, they must play that suit
    const hasLeadSuit = hand.some((c) => c.suit === leadSuit);
    if (hasLeadSuit) {
        return card.suit === leadSuit;
    }

    // Player doesn't have lead suit, can play any card
    return true;
}

/**
 * Check if a card is the senior card in the current pile
 */
export function isSeniorCard(
    card: Card,
    pile: Card[],
    trumpSuit: Suit | null
): boolean {
    if (pile.length === 0) return false;

    const winning = findWinningCard(pile, trumpSuit);
    return winning?.card.id === card.id;
}

/**
 * Get the lead suit from the pile
 */
export function getLeadSuit(pile: Card[]): Suit | null {
    if (pile.length === 0) return null;
    return pile[0].suit;
}

/**
 * Sort cards by suit then by rank
 */
export function sortCards(cards: Card[]): Card[] {
    const suitOrder: Record<Suit, number> = {
        spades: 0,
        hearts: 1,
        diamonds: 2,
        clubs: 3,
    };

    return [...cards].sort((a, b) => {
        const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
        if (suitDiff !== 0) return suitDiff;
        return getRankValue(a.rank) - getRankValue(b.rank);
    });
}

/**
 * Group cards by suit
 */
export function groupCardsBySuit(cards: Card[]): Record<Suit, Card[]> {
    return cards.reduce(
        (groups, card) => {
            groups[card.suit].push(card);
            return groups;
        },
        {
            hearts: [],
            diamonds: [],
            clubs: [],
            spades: [],
        } as Record<Suit, Card[]>
    );
}
