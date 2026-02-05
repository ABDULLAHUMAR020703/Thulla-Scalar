// ============================================
// pass-turn Edge Function
// ============================================
// Handles turn passing when player cannot/chooses not to play
// Deploy: npx supabase functions deploy pass-turn
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// ================================
// TYPES
// ================================

interface PassTurnRequest {
    room_id: string;
}

interface Player {
    id: string;
    user_id: string;
    position: number;
    is_active: boolean;
}

// ================================
// HELPERS
// ================================

function getNextActivePlayer(players: Player[], currentId: string): string | null {
    const activePlayers = players
        .filter((p: Player) => p.is_active)
        .sort((a: Player, b: Player) => a.position - b.position);

    if (activePlayers.length === 0) return null;

    const currentIndex = activePlayers.findIndex((p: Player) => p.id === currentId);
    if (currentIndex === -1) return activePlayers[0].id;

    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].id;
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
        const { room_id }: PassTurnRequest = await req.json();

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

        // 6. FETCH PLAYERS
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

        // 7. FIND REQUESTING PLAYER
        const player = players.find((p: Player) => p.user_id === user.id);
        if (!player) {
            return new Response(
                JSON.stringify({ error: "Player not in room", code: "PLAYER_NOT_FOUND" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 8. VALIDATE TURN
        if (room.current_turn_player_id !== player.id) {
            return new Response(
                JSON.stringify({ error: "Not your turn", code: "NOT_YOUR_TURN" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 9. CALCULATE NEXT PLAYER
        const nextPlayerId = getNextActivePlayer(players, player.id);

        if (!nextPlayerId) {
            return new Response(
                JSON.stringify({ error: "No next player available", code: "NO_NEXT_PLAYER" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 10. UPDATE ROOM
        const { error: updateError } = await adminClient
            .from("rooms")
            .update({ current_turn_player_id: nextPlayerId })
            .eq("id", room_id);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: "Failed to update turn", code: "UPDATE_ERROR" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 11. BROADCAST EVENT
        const nextPlayer = players.find((p: Player) => p.id === nextPlayerId);
        const channel = adminClient.channel(`room:${room_id}`);

        await channel.send({
            type: "broadcast",
            event: "game_event",
            payload: {
                type: "TURN_CHANGED",
                player_id: nextPlayerId,
                player_name: nextPlayer?.user_id || "",
                timestamp: Date.now(),
            },
        });

        // 12. SUCCESS RESPONSE
        return new Response(
            JSON.stringify({
                success: true,
                message: "Turn passed",
                data: {
                    previous_player_id: player.id,
                    next_player_id: nextPlayerId,
                },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: unknown) {
        console.error("Pass turn error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
