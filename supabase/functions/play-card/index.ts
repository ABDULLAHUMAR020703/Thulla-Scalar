// ============================================
// play-card Edge Function
// ============================================
// Handles card play, turn validation, and trick resolution
// Deploy: npx supabase functions deploy play-card
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// ================================
// TYPES (Inline - no external imports)
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
}

interface TrickCard {
    player_id: string;
    card_suit: string;
    card_rank: string;
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

function getNextActivePlayer(players: Player[], currentId: string): string {
    const activePlayers = players
        .filter((p) => p.is_active)
        .sort((a, b) => a.position - b.position);

    if (activePlayers.length === 0) return currentId;

    const idx = activePlayers.findIndex((p) => p.id === currentId);
    const nextIdx = (idx + 1) % activePlayers.length;
    return activePlayers[nextIdx].id;
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

        // 4. FETCH GAME STATE (Parallel)
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
        const allHands = handsRes.data;

        // 5. VALIDATIONS
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

        if (room.current_turn_player_id !== player.id) {
            return new Response(
                JSON.stringify({ success: false, error: "Not your turn" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const playerHand = allHands.filter(
            (h: { player_id: string; in_pile: boolean }) => h.player_id === player.id && !h.in_pile
        );
        const hasCard = playerHand.some(
            (h: { card_suit: string; card_rank: string }) => h.card_suit === card_suit && h.card_rank === card_rank
        );

        if (!hasCard) {
            return new Response(
                JSON.stringify({ success: false, error: "Card not in hand" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 6. GAME RULES
        const currentTrick: TrickCard[] = room.trick_cards || [];
        const activeSuit: string | null = room.active_suit;
        let isThulla = false;
        let nextTurnPlayerId: string;
        const eventsToBroadcast: Record<string, unknown>[] = [];

        // Suit following check
        if (activeSuit && activeSuit !== card_suit) {
            const hasActiveSuit = playerHand.some(
                (h: { card_suit: string }) => h.card_suit === activeSuit
            );
            if (hasActiveSuit) {
                return new Response(
                    JSON.stringify({ success: false, error: `Must follow suit: ${activeSuit}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            isThulla = true;
        }

        // 7. EXECUTE MOVE
        if (isThulla) {
            // THULLA: Pile winner collects all
            const winnerId = findTrickWinner(currentTrick, activeSuit!);

            // Transfer played card to winner
            await adminClient.from("hands")
                .update({ player_id: winnerId, in_pile: false })
                .match({ room_id, player_id: player.id, card_suit, card_rank });

            // Transfer trick cards to winner
            for (const tCard of currentTrick) {
                await adminClient.from("hands")
                    .update({ player_id: winnerId, in_pile: false })
                    .match({ room_id, player_id: tCard.player_id, card_suit: tCard.card_suit, card_rank: tCard.card_rank });
            }

            // Transfer pile to winner
            await adminClient.from("hands")
                .update({ player_id: winnerId, in_pile: false })
                .eq("room_id", room_id)
                .eq("in_pile", true);

            // Reset room
            await adminClient.from("rooms").update({
                active_suit: null,
                trick_cards: [],
                current_turn_player_id: winnerId,
            }).eq("id", room_id);

            nextTurnPlayerId = winnerId;

            eventsToBroadcast.push({
                type: "THULLA_TRIGGERED",
                trigger_player_id: player.id,
                pickup_player_id: winnerId,
            });

        } else {
            // NORMAL PLAY
            const newTrickCard: TrickCard = { player_id: player.id, card_suit, card_rank };
            const updatedTrick = [...currentTrick, newTrickCard];
            const activePlayers = players.filter((p) => p.is_active);
            const isTrickFull = updatedTrick.length === activePlayers.length;

            if (isTrickFull) {
                // Trick complete
                const winnerId = findTrickWinner(updatedTrick, activeSuit || card_suit);
                nextTurnPlayerId = winnerId;

                // Delete trick cards from hands
                for (const tCard of updatedTrick) {
                    await adminClient.from("hands")
                        .delete()
                        .match({ room_id, card_suit: tCard.card_suit, card_rank: tCard.card_rank });
                }

                // Reset room
                await adminClient.from("rooms").update({
                    active_suit: null,
                    trick_cards: [],
                    current_turn_player_id: winnerId,
                }).eq("id", room_id);

                eventsToBroadcast.push({ type: "TRICK_CLEARED", winner_player_id: winnerId });

            } else {
                // Trick continues
                nextTurnPlayerId = getNextActivePlayer(players, player.id);

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

            eventsToBroadcast.push({
                type: "TURN_CHANGED",
                player_id: nextTurnPlayerId,
            });
        }

        // 8. BROADCAST EVENTS
        const channel = adminClient.channel(`room:${room_id}`);
        for (const event of eventsToBroadcast) {
            await channel.send({
                type: "broadcast",
                event: "game_event",
                payload: { ...event, timestamp: Date.now() },
            });
        }

        return new Response(
            JSON.stringify({ success: true, next_turn: nextTurnPlayerId }),
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
