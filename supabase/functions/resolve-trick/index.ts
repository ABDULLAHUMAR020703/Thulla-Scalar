// ============================================
// resolve-trick Edge Function
// ============================================
// Handles trick resolution when all players have played
// Deploy: npx supabase functions deploy resolve-trick
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// ================================
// TYPES
// ================================

interface ResolveTrickRequest {
    room_id: string;
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

// ================================
// RANK VALUES
// ================================

const RANK_VALUES: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// ================================
// HELPERS
// ================================

function findTrickWinner(trick: TrickCard[], activeSuit: string): string | null {
    const suitCards = trick.filter((t: TrickCard) => t.card_suit === activeSuit);

    if (suitCards.length === 0) return null;

    const winner = suitCards.reduce((highest: TrickCard, current: TrickCard) => {
        const currentValue = RANK_VALUES[current.card_rank] || 0;
        const highestValue = RANK_VALUES[highest.card_rank] || 0;
        return currentValue > highestValue ? current : highest;
    });

    return winner.player_id;
}

// ================================
// EDGE FUNCTION
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
        const authHeader = req.headers.get("Authorization")!;

        const userClient = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 2. AUTHENTICATE USER
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. PARSE REQUEST
        const { room_id }: ResolveTrickRequest = await req.json();

        if (!room_id) {
            return new Response(
                JSON.stringify({ error: "Missing room_id", code: "INVALID_REQUEST" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. FETCH ROOM
        const { data: room, error: roomError } = await adminClient
            .from("rooms")
            .select("*")
            .eq("id", room_id)
            .single();

        if (roomError || !room) {
            return new Response(
                JSON.stringify({ error: "Room not found", code: "ROOM_NOT_FOUND" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. VALIDATE GAME STATUS
        if (room.status !== "playing") {
            return new Response(
                JSON.stringify({ error: "Game is not active", code: "GAME_NOT_ACTIVE" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 6. GET TRICK CARDS
        const trickCards: TrickCard[] = room.trick_cards || [];
        const activeSuit = room.active_suit;

        if (trickCards.length === 0) {
            return new Response(
                JSON.stringify({ error: "No cards in trick", code: "EMPTY_TRICK" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 7. FETCH PLAYERS
        const { data: players, error: playersError } = await adminClient
            .from("players")
            .select("id, user_id, position, is_active")
            .eq("room_id", room_id)
            .order("position", { ascending: true });

        if (playersError || !players) {
            return new Response(
                JSON.stringify({ error: "Failed to fetch players", code: "PLAYERS_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 8. VALIDATE TRICK IS COMPLETE
        const activePlayers = players.filter((p: Player) => p.is_active);
        if (trickCards.length < activePlayers.length) {
            return new Response(
                JSON.stringify({ error: "Trick not complete", code: "TRICK_INCOMPLETE" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 9. FIND WINNER
        const winnerId = findTrickWinner(trickCards, activeSuit);

        if (!winnerId) {
            return new Response(
                JSON.stringify({ error: "Could not determine winner", code: "NO_WINNER" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 10. CLEAR TRICK AND SET WINNER AS NEXT TURN
        const { error: updateError } = await adminClient
            .from("rooms")
            .update({
                trick_cards: [],
                active_suit: null,
                current_turn_player_id: winnerId,
            })
            .eq("id", room_id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: "Failed to update room", code: "UPDATE_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 11. DELETE TRICK CARDS FROM HANDS (they're discarded)
        for (const card of trickCards) {
            await adminClient
                .from("hands")
                .delete()
                .eq("room_id", room_id)
                .eq("card_suit", card.card_suit)
                .eq("card_rank", card.card_rank)
                .eq("in_pile", true);
        }

        // 12. BROADCAST EVENT
        const channel = adminClient.channel(`room:${room_id}`);

        await channel.send({
            type: "broadcast",
            event: "game_event",
            payload: {
                type: "TRICK_CLEARED",
                winner_player_id: winnerId,
                active_suit: null,
                timestamp: Date.now(),
            },
        });

        // 13. SUCCESS RESPONSE
        const winnerPlayer = players.find((p: Player) => p.id === winnerId);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Trick resolved",
                data: {
                    winner_id: winnerId,
                    winner_position: winnerPlayer?.position || 0,
                    cards_cleared: trickCards.length,
                },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: unknown) {
        console.error("Resolve trick error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
