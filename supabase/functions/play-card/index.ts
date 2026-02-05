// ============================================
// play-card Edge Function
// ============================================
// Handles card play, turn validation, trick resolution,
// player elimination, game end detection, and first-turn rules
// Deploy: npx supabase functions deploy play-card
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// ================================
// TYPES
// ================================

interface PlayCardRequest {
    room_id: string;
    card_suit: string;
    card_rank: string;
}

interface Player {
    id: string;
    user_id: string;
    position: number;
    is_active: boolean;
    finished: boolean;
}

interface TrickCard {
    player_id: string;
    card_suit: string;
    card_rank: string;
}

interface HandCard {
    player_id: string;
    card_suit: string;
    card_rank: string;
    in_pile: boolean;
}

const RANK_VALUES: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// ================================
// PURE LOGIC HELPERS
// ================================

function findTrickWinner(trick: TrickCard[], activeSuit: string): string {
    const suitCards = trick.filter((c) => c.card_suit === activeSuit);
    if (suitCards.length === 0) return trick[0]?.player_id || "";

    return suitCards.reduce((winner, current) => {
        return (RANK_VALUES[current.card_rank] || 0) > (RANK_VALUES[winner.card_rank] || 0)
            ? current
            : winner;
    }).player_id;
}

function getNextEligiblePlayer(players: Player[], currentId: string): string | null {
    const eligiblePlayers = players
        .filter((p) => p.is_active && !p.finished)
        .sort((a, b) => a.position - b.position);

    if (eligiblePlayers.length === 0) return null;

    const idx = eligiblePlayers.findIndex((p) => p.id === currentId);
    const nextIdx = (idx + 1) % eligiblePlayers.length;
    return eligiblePlayers[nextIdx].id;
}

function countPlayersWithCards(players: Player[], allHands: HandCard[]): number {
    let count = 0;
    for (const p of players) {
        if (!p.is_active) continue;
        const playerCards = allHands.filter((h) => h.player_id === p.id && !h.in_pile);
        if (playerCards.length > 0) count++;
    }
    return count;
}

function findLastPlayerWithCards(players: Player[], allHands: HandCard[]): Player | null {
    for (const p of players) {
        if (!p.is_active) continue;
        const playerCards = allHands.filter((h) => h.player_id === p.id && !h.in_pile);
        if (playerCards.length > 0) return p;
    }
    return null;
}

// ================================
// EDGE FUNCTION HANDLER
// ================================

serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. SETUP SUPABASE
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const authHeader = req.headers.get("Authorization");

        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader! } },
        });

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 2. AUTHENTICATE USER
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. PARSE REQUEST
        const { room_id, card_suit, card_rank }: PlayCardRequest = await req.json();

        // 4. FETCH GAME STATE
        const [roomRes, playersRes, handsRes] = await Promise.all([
            adminClient.from("rooms").select("*").eq("id", room_id).single(),
            adminClient.from("players").select("*").eq("room_id", room_id).order("position"),
            adminClient.from("hands").select("*").eq("room_id", room_id),
        ]);

        if (roomRes.error || playersRes.error || handsRes.error) {
            return new Response(
                JSON.stringify({ success: false, error: "Failed to fetch game state" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const room = roomRes.data;
        const players: Player[] = playersRes.data;
        let allHands: HandCard[] = handsRes.data;
        const isFirstTrick: boolean = room.is_first_trick ?? true;

        // 5. BASIC VALIDATIONS
        if (room.status !== "playing") {
            return new Response(
                JSON.stringify({ success: false, error: "Game is not playing" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const player = players.find((p) => p.user_id === user.id);
        if (!player) {
            return new Response(
                JSON.stringify({ success: false, error: "Player not found" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (player.finished) {
            return new Response(
                JSON.stringify({ success: false, error: "You have already finished" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (room.current_turn_player_id !== player.id) {
            return new Response(
                JSON.stringify({ success: false, error: "Not your turn" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const playerHand = allHands.filter((h) => h.player_id === player.id && !h.in_pile);
        const hasCard = playerHand.some((h) => h.card_suit === card_suit && h.card_rank === card_rank);

        if (!hasCard) {
            return new Response(
                JSON.stringify({ success: false, error: "Card not in hand" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ================================
        // 6. FIRST TRICK SPECIAL RULES
        // ================================
        const currentTrick: TrickCard[] = room.trick_cards || [];
        const activeSuit: string | null = room.active_suit;
        const eventsToBroadcast: Record<string, unknown>[] = [];
        const eligiblePlayers = players.filter((p) => p.is_active && !p.finished);

        // First card of first trick MUST be Ace of Spades
        if (isFirstTrick && currentTrick.length === 0) {
            if (card_suit !== "spades" || card_rank !== "A") {
                return new Response(
                    JSON.stringify({ success: false, error: "First card must be Ace of Spades" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Determine if this would be THULLA (but suppress during first trick)
        let isThulla = false;
        if (activeSuit && activeSuit !== card_suit) {
            const hasActiveSuit = playerHand.some((h) => h.card_suit === activeSuit);
            if (hasActiveSuit) {
                return new Response(
                    JSON.stringify({ success: false, error: `Must follow suit: ${activeSuit}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            // THULLA is DISABLED during first trick
            isThulla = !isFirstTrick;
        }

        let nextTurnPlayerId: string | null = null;

        // ================================
        // 7. EXECUTE MOVE
        // ================================
        if (isThulla) {
            // THULLA: Pile winner collects all (only after first trick)
            const winnerId = findTrickWinner(currentTrick, activeSuit!);

            await adminClient.from("hands")
                .update({ player_id: winnerId, in_pile: false })
                .match({ room_id, player_id: player.id, card_suit, card_rank });

            for (const tCard of currentTrick) {
                await adminClient.from("hands")
                    .update({ player_id: winnerId, in_pile: false })
                    .match({ room_id, player_id: tCard.player_id, card_suit: tCard.card_suit, card_rank: tCard.card_rank });
            }

            await adminClient.from("hands")
                .update({ player_id: winnerId, in_pile: false })
                .eq("room_id", room_id)
                .eq("in_pile", true);

            nextTurnPlayerId = winnerId;

            eventsToBroadcast.push({
                type: "THULLA_TRIGGERED",
                trigger_player_id: player.id,
                pickup_player_id: winnerId,
            });

        } else {
            // NORMAL PLAY (including first trick)
            const newTrickCard: TrickCard = { player_id: player.id, card_suit, card_rank };
            const updatedTrick = [...currentTrick, newTrickCard];
            const isTrickFull = updatedTrick.length === eligiblePlayers.length;

            if (isTrickFull) {
                // Trick complete
                const trickSuit = isFirstTrick ? "spades" : (activeSuit || card_suit);
                const winnerId = findTrickWinner(updatedTrick, trickSuit);

                // For first trick: Ace of Spades player (starter) always gets next turn
                if (isFirstTrick) {
                    // Find Ace of Spades player (should be the first to play)
                    const acePlayer = updatedTrick.find((t) => t.card_suit === "spades" && t.card_rank === "A");
                    nextTurnPlayerId = acePlayer?.player_id || winnerId;
                } else {
                    nextTurnPlayerId = winnerId;
                }

                // Delete trick cards from hands
                for (const tCard of updatedTrick) {
                    await adminClient.from("hands")
                        .delete()
                        .match({ room_id, card_suit: tCard.card_suit, card_rank: tCard.card_rank });
                }

                allHands = allHands.filter((h) =>
                    !updatedTrick.some((t) => t.card_suit === h.card_suit && t.card_rank === h.card_rank)
                );

                // Update room - clear first trick flag
                await adminClient.from("rooms").update({
                    active_suit: null,
                    trick_cards: [],
                    current_turn_player_id: nextTurnPlayerId,
                    is_first_trick: false,  // First trick is now complete
                }).eq("id", room_id);

                if (isFirstTrick) {
                    eventsToBroadcast.push({ type: "FIRST_TRICK_RESOLVED", winner_player_id: nextTurnPlayerId });
                }
                eventsToBroadcast.push({ type: "TRICK_CLEARED", winner_player_id: nextTurnPlayerId });

            } else {
                // Trick continues
                nextTurnPlayerId = getNextEligiblePlayer(players, player.id);

                await adminClient.from("rooms").update({
                    active_suit: activeSuit || card_suit,
                    trick_cards: updatedTrick,
                    current_turn_player_id: nextTurnPlayerId,
                }).eq("id", room_id);
            }

            eventsToBroadcast.push({
                type: "CARD_PLAYED",
                player_id: player.id,
                card: { suit: card_suit, rank: card_rank },
                is_thulla: false,
            });
        }

        // ================================
        // 8. PLAYER FINISHING
        // ================================
        const remainingCards = playerHand.filter(
            (h) => !(h.card_suit === card_suit && h.card_rank === card_rank)
        );

        if (remainingCards.length === 0 && !isThulla) {
            await adminClient.from("players")
                .update({ finished: true })
                .eq("id", player.id);

            eventsToBroadcast.push({
                type: "PLAYER_FINISHED",
                player_id: player.id,
                position: player.position,
            });

            player.finished = true;
        }

        // ================================
        // 9. GAME END CHECK
        // ================================
        const { data: updatedHands } = await adminClient
            .from("hands")
            .select("*")
            .eq("room_id", room_id);

        const currentHands = updatedHands || allHands;
        const playersWithCards = countPlayersWithCards(players, currentHands);

        let gameEnded = false;
        let loserId: string | null = null;

        if (playersWithCards <= 1) {
            const loser = findLastPlayerWithCards(players, currentHands);
            loserId = loser?.id || null;
            gameEnded = true;

            await adminClient.from("rooms")
                .update({
                    status: "finished",
                    loser_player_id: loserId,
                    active_suit: null,
                    trick_cards: [],
                    current_turn_player_id: null,
                    is_first_trick: false,
                })
                .eq("id", room_id);

            eventsToBroadcast.push({
                type: "GAME_ENDED",
                loser_player_id: loserId,
                loser_position: loser?.position || null,
            });

        } else if (nextTurnPlayerId) {
            const nextPlayer = players.find((p) => p.id === nextTurnPlayerId);
            if (nextPlayer?.finished || !nextPlayer?.is_active) {
                nextTurnPlayerId = getNextEligiblePlayer(players, nextTurnPlayerId);
            }

            // Only update if not already updated in trick completion
            if (!isThulla) {
                eventsToBroadcast.push({
                    type: "TURN_CHANGED",
                    player_id: nextTurnPlayerId,
                });
            }
        }

        // ================================
        // 10. BROADCAST
        // ================================
        const channel = adminClient.channel(`room:${room_id}`);
        for (const event of eventsToBroadcast) {
            await channel.send({
                type: "broadcast",
                event: "game_event",
                payload: { ...event, timestamp: Date.now() },
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                next_turn: nextTurnPlayerId,
                game_ended: gameEnded,
                loser_id: loserId,
                is_first_trick: isFirstTrick,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal error";
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
