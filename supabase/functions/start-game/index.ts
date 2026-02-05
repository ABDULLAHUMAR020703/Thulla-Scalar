// ============================================
// start-game Edge Function
// ============================================
// Validates game start request and initializes game
// Deploy to: supabase/functions/start-game
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES
// ============================================

interface StartGameRequest {
    room_id: string;
}

interface Card {
    suit: "spades" | "hearts" | "diamonds" | "clubs";
    rank: string;
}

interface Player {
    id: string;
    user_id: string;
    position: number;
}

// ============================================
// DECK UTILITIES
// ============================================

const SUITS: Card["suit"][] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function findAceOfSpadesHolder(
    hands: { player_id: string; card_suit: string; card_rank: string }[]
): string | null {
    const aceHolder = hands.find(
        (h) => h.card_suit === "spades" && h.card_rank === "A"
    );
    return aceHolder?.player_id ?? null;
}

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

serve(async (req: Request) => {
    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    // Handle preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Initialize Supabase client with user auth
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const authHeader = req.headers.get("Authorization")!;

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // 2. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized", code: "AUTH_REQUIRED" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Parse request body
        const { room_id }: StartGameRequest = await req.json();

        if (!room_id) {
            return new Response(
                JSON.stringify({ error: "room_id is required", code: "MISSING_ROOM_ID" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Get room details
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

        // 5. Validate host
        if (room.host_id !== user.id) {
            return new Response(
                JSON.stringify({ error: "Only the host can start the game", code: "NOT_HOST" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 6. Validate room status
        if (room.status !== "waiting") {
            return new Response(
                JSON.stringify({ error: "Game has already started", code: "GAME_STARTED" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 7. Get active players
        const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id, user_id, position")
            .eq("room_id", room_id)
            .eq("is_active", true)
            .order("position", { ascending: true });

        if (playersError || !players) {
            return new Response(
                JSON.stringify({ error: "Failed to get players", code: "PLAYERS_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 8. Validate player count
        const maxPlayers = room.max_players ?? 4;
        if (players.length !== maxPlayers) {
            return new Response(
                JSON.stringify({
                    error: `Waiting for players (${players.length}/${maxPlayers})`,
                    code: "NOT_ENOUGH_PLAYERS",
                    current: players.length,
                    required: maxPlayers,
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ============================================
        // GAME INITIALIZATION
        // ============================================

        // 9. Clear any existing hands
        await supabase.from("hands").delete().eq("room_id", room_id);

        // 10. Create and shuffle deck
        const deck = shuffleDeck(createDeck());
        const cardsPerPlayer = Math.floor(deck.length / players.length);

        // 11. Distribute cards to players
        const handInserts: { room_id: string; player_id: string; card_suit: string; card_rank: string }[] = [];

        players.forEach((player: Player, playerIndex: number) => {
            const startIdx = playerIndex * cardsPerPlayer;
            const playerCards = deck.slice(startIdx, startIdx + cardsPerPlayer);

            playerCards.forEach((card) => {
                handInserts.push({
                    room_id: room_id,
                    player_id: player.id,
                    card_suit: card.suit,
                    card_rank: card.rank,
                });
            });
        });

        const { error: handsError } = await supabase.from("hands").insert(handInserts);

        if (handsError) {
            return new Response(
                JSON.stringify({ error: "Failed to deal cards", code: "DEAL_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 12. Find Ace of Spades holder
        const starterPlayerId = findAceOfSpadesHolder(handInserts);

        if (!starterPlayerId) {
            return new Response(
                JSON.stringify({ error: "Could not find Ace of Spades", code: "ACE_NOT_FOUND" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 13. Update room to playing state
        const { error: updateError } = await supabase
            .from("rooms")
            .update({
                status: "playing",
                current_turn_player_id: starterPlayerId,
                active_suit: "spades",
            })
            .eq("id", room_id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: "Failed to start game", code: "UPDATE_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 14. Success response
        return new Response(
            JSON.stringify({
                success: true,
                message: "Game started successfully",
                data: {
                    room_id: room_id,
                    status: "playing",
                    starter_player_id: starterPlayerId,
                    active_suit: "spades",
                    player_count: players.length,
                    cards_per_player: cardsPerPlayer,
                },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Start game error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
