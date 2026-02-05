// ============================================
// resolve-thulla Edge Function
// ============================================
// Handles THULLA resolution server-side
// Ensures pile receiver starts next trick
// Deploy to: supabase/functions/resolve-thulla
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// ================================
// TYPES
// ================================

interface ResolveThullaRequest {
    room_id: string;
    trigger_player_id: string; // Player who triggered THULLA
    trick_cards: { player_id: string; card_suit: string; card_rank: string }[];
    active_suit: string;
}

interface Player {
    id: string;
    user_id: string;
    position: number;
    is_active: boolean;
}

// ================================
// RANK VALUES
// ================================

const RANK_VALUES: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// ================================
// FIND SENIOR CARD (HIGHEST OF ACTIVE SUIT)
// ================================

function findPileReceiver(
    trickCards: { player_id: string; card_suit: string; card_rank: string }[],
    activeSuit: string
): string | null {
    // Filter cards matching active suit
    const suitCards = trickCards.filter((c) => c.card_suit === activeSuit);

    if (suitCards.length === 0) {
        return null;
    }

    // Find highest rank
    const senior = suitCards.reduce((highest, current) => {
        const currentValue = RANK_VALUES[current.card_rank] ?? 0;
        const highestValue = RANK_VALUES[highest.card_rank] ?? 0;
        return currentValue > highestValue ? current : highest;
    });

    return senior.player_id;
}

// ================================
// GET NEXT ACTIVE PLAYER (FALLBACK)
// ================================

function getNextActivePlayer(
    players: Player[],
    currentPlayerId: string
): string | null {
    const activePlayers = players
        .filter((p) => p.is_active)
        .sort((a, b) => a.position - b.position);

    if (activePlayers.length === 0) return null;

    const currentIndex = activePlayers.findIndex((p) => p.id === currentPlayerId);
    if (currentIndex === -1) return activePlayers[0].id;

    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].id;
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
        // 1. Initialize Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // Service role for server actions
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Parse request
        const { room_id, trigger_player_id, trick_cards, active_suit }: ResolveThullaRequest = await req.json();

        if (!room_id || !trick_cards || !active_suit) {
            return new Response(
                JSON.stringify({ error: "Missing required fields", code: "MISSING_FIELDS" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Get room state
        const { data: room, error: roomError } = await supabase
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

        // 4. Get all players
        const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id, user_id, position, is_active")
            .eq("room_id", room_id)
            .order("position", { ascending: true });

        if (playersError || !players) {
            return new Response(
                JSON.stringify({ error: "Failed to get players", code: "PLAYERS_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. Find pile receiver (highest card of active suit)
        let pileReceiverId = findPileReceiver(trick_cards, active_suit);

        // 6. EDGE CASE: Pile receiver not found
        if (!pileReceiverId) {
            // Fallback to trigger player
            pileReceiverId = trigger_player_id;
        }

        // 7. EDGE CASE: Check if pile receiver is still active
        const receiver = players.find((p) => p.id === pileReceiverId);
        if (!receiver || !receiver.is_active) {
            // Receiver inactive - move turn to next active player
            pileReceiverId = getNextActivePlayer(players, pileReceiverId!) ?? players[0]?.id;
        }

        // 8. Get all cards in current pile + trick
        const { data: pileCards } = await supabase
            .from("hands")
            .select("*")
            .eq("room_id", room_id)
            .eq("in_pile", true);

        // Combine pile + trick cards for receiver
        const allPileCards = [
            ...(pileCards ?? []).map((c) => ({ card_suit: c.card_suit, card_rank: c.card_rank })),
            ...trick_cards.map((c) => ({ card_suit: c.card_suit, card_rank: c.card_rank })),
        ];

        // 9. Clear pile status from hands
        await supabase
            .from("hands")
            .update({ in_pile: false })
            .eq("room_id", room_id);

        // 10. Add pile cards to receiver's hand
        const insertCards = allPileCards.map((card) => ({
            room_id: room_id,
            player_id: pileReceiverId,
            card_suit: card.card_suit,
            card_rank: card.card_rank,
            in_pile: false,
        }));

        if (insertCards.length > 0) {
            await supabase.from("hands").insert(insertCards);
        }

        // 11. Update room state - pile receiver starts next trick
        const { error: updateError } = await supabase
            .from("rooms")
            .update({
                current_turn_player_id: pileReceiverId,
                active_suit: null, // Reset for new trick
                trick_cards: [], // Clear trick
            })
            .eq("id", room_id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: "Failed to update room", code: "UPDATE_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 12. Broadcast THULLA_RESOLVED event
        const channel = supabase.channel(`room:${room_id}`);
        await channel.send({
            type: "broadcast",
            event: "game_event",
            payload: {
                type: "THULLA_RESOLVED",
                pile_receiver_id: pileReceiverId,
                next_turn_player_id: pileReceiverId,
                cards_picked_up: allPileCards.length,
                trigger_player_id: trigger_player_id,
                timestamp: Date.now(),
            },
        });

        // 13. Get receiver name for response
        const receiverPlayer = players.find((p) => p.id === pileReceiverId);

        // 14. Success response
        return new Response(
            JSON.stringify({
                success: true,
                message: "THULLA resolved",
                data: {
                    pile_receiver_id: pileReceiverId,
                    next_turn_player_id: pileReceiverId,
                    cards_picked_up: allPileCards.length,
                    receiver_position: receiverPlayer?.position ?? 0,
                },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Resolve THULLA error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
