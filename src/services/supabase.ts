import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Database Types (will be generated from Supabase in production)
export interface Database {
    public: {
        Tables: {
            rooms: {
                Row: {
                    id: string;
                    code: string;
                    host_id: string;
                    status: string;
                    max_players: number;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["rooms"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
            };
            players: {
                Row: {
                    id: string;
                    user_id: string;
                    room_id: string;
                    name: string;
                    score: number;
                    is_ready: boolean;
                    joined_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["players"]["Row"], "id" | "joined_at">;
                Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
            };
            game_state: {
                Row: {
                    id: string;
                    room_id: string;
                    current_player_id: string;
                    deck: string;
                    pile: string;
                    trump_suit: string | null;
                    round: number;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["game_state"]["Row"], "id" | "updated_at">;
                Update: Partial<Database["public"]["Tables"]["game_state"]["Insert"]>;
            };
        };
    };
}

// Room functions
export async function createRoom(hostId: string, maxPlayers: number = 4) {
    const code = generateRoomCode();

    const { data, error } = await supabase
        .from("rooms")
        .insert({
            code,
            host_id: hostId,
            status: "waiting",
            max_players: maxPlayers,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function joinRoom(roomCode: string, userId: string, playerName: string) {
    // Find room by code
    const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .single();

    if (roomError) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already in progress");

    // Check player count
    const { count } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id);

    if (count && count >= room.max_players) {
        throw new Error("Room is full");
    }

    // Add player to room
    const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
            user_id: userId,
            room_id: room.id,
            name: playerName,
            score: 0,
            is_ready: false,
        })
        .select()
        .single();

    if (playerError) throw playerError;
    return { room, player };
}

export async function leaveRoom(playerId: string) {
    const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);

    if (error) throw error;
}

// Realtime subscriptions
export function subscribeToRoom(roomId: string, callback: (payload: any) => void) {
    return supabase
        .channel(`room:${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "game_state",
                filter: `room_id=eq.${roomId}`,
            },
            callback
        )
        .subscribe();
}

export function subscribeToPlayers(roomId: string, callback: (payload: any) => void) {
    return supabase
        .channel(`players:${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "players",
                filter: `room_id=eq.${roomId}`,
            },
            callback
        )
        .subscribe();
}

// Utility functions
function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
