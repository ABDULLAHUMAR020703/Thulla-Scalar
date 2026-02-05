import { supabase } from "@/services/supabase";

// ================================
// TYPES
// ================================

export type RoomStatus = "waiting" | "starting" | "playing" | "finished";

export interface Room {
    id: string;
    room_code: string;
    host_id: string;
    status: RoomStatus;
    max_players: number;
    created_at: string;
    current_turn_player_id: string | null;
    active_suit: string | null;
}

export interface Player {
    id: string;
    room_id: string;
    user_id: string;
    name: string;
    avatar: string;
    position: number;
    is_active: boolean;
    joined_at: string;
}

export interface RoomServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ================================
// ROOM CODE GENERATION
// ================================

/**
 * Generate unique 6-character room code
 */
function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Check if room code already exists
 */
async function isRoomCodeUnique(code: string): Promise<boolean> {
    const { data } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_code", code)
        .eq("status", "waiting")
        .single();

    return !data;
}

/**
 * Generate unique room code with retry
 */
async function generateUniqueRoomCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const code = generateRoomCode();
        if (await isRoomCodeUnique(code)) {
            return code;
        }
        attempts++;
    }

    throw new Error("Failed to generate unique room code");
}

// ================================
// ROOM CREATION
// ================================

export interface CreateRoomParams {
    hostId: string;
    hostName: string;
    hostAvatar?: string;
    maxPlayers?: number;
}

/**
 * Create a new game room
 * - Generates unique room code
 * - Sets status = 'waiting'
 * - Adds host as first player at position 0
 */
export async function createRoom(
    params: CreateRoomParams
): Promise<RoomServiceResult<{ room: Room; roomCode: string }>> {
    const { hostId, hostName, hostAvatar = "👤", maxPlayers = 4 } = params;

    try {
        // 1. Generate unique room code
        const roomCode = await generateUniqueRoomCode();

        // 2. Create room
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .insert({
                room_code: roomCode,
                host_id: hostId,
                status: "waiting",
                max_players: maxPlayers,
                current_turn_player_id: null,
                active_suit: null,
            })
            .select()
            .single();

        if (roomError) {
            console.error("[Room] Creation failed:", roomError);
            return { success: false, error: roomError.message };
        }

        // 3. Add host as first player (position 0)
        const { error: playerError } = await supabase.from("players").insert({
            room_id: room.id,
            user_id: hostId,
            name: hostName,
            avatar: hostAvatar,
            position: 0,
            is_active: true,
        });

        if (playerError) {
            console.error("[Room] Failed to add host as player:", playerError);
            // Rollback room creation
            await supabase.from("rooms").delete().eq("id", room.id);
            return { success: false, error: playerError.message };
        }

        console.log(`[Room] Created: ${roomCode} by ${hostName}`);

        return {
            success: true,
            data: { room, roomCode },
        };
    } catch (error) {
        console.error("[Room] Unexpected error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ================================
// JOIN ROOM
// ================================

export interface JoinRoomParams {
    roomCode: string;
    userId: string;
    userName: string;
    userAvatar?: string;
}

/**
 * Join an existing room via room code
 * 
 * Validations:
 * - Room must exist
 * - Room status must be 'waiting'
 * - Room must not be full
 * - Player must not already be in room
 */
export async function joinRoom(
    params: JoinRoomParams
): Promise<RoomServiceResult<{ room: Room; position: number }>> {
    const { roomCode, userId, userName, userAvatar = "👤" } = params;

    try {
        // 1. Find room by code
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("*")
            .eq("room_code", roomCode.toUpperCase())
            .single();

        if (roomError || !room) {
            return { success: false, error: "Room not found" };
        }

        // 2. Validate room status
        if (room.status !== "waiting") {
            return { success: false, error: "Game has already started" };
        }

        // 3. Get current player count
        const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id, user_id, position")
            .eq("room_id", room.id)
            .eq("is_active", true);

        if (playersError) {
            return { success: false, error: "Failed to check room capacity" };
        }

        // 4. Check if room is full
        if (players.length >= room.max_players) {
            return { success: false, error: "Room is full" };
        }

        // 5. Check if player already in room
        const alreadyJoined = players.some((p) => p.user_id === userId);
        if (alreadyJoined) {
            return { success: false, error: "You are already in this room" };
        }

        // 6. Calculate next position (clockwise order)
        const nextPosition = players.length;

        // 7. Add player
        const { error: insertError } = await supabase.from("players").insert({
            room_id: room.id,
            user_id: userId,
            name: userName,
            avatar: userAvatar,
            position: nextPosition,
            is_active: true,
        });

        if (insertError) {
            console.error("[Room] Failed to join:", insertError);
            return { success: false, error: insertError.message };
        }

        console.log(`[Room] ${userName} joined ${roomCode} at position ${nextPosition}`);

        return {
            success: true,
            data: { room, position: nextPosition },
        };
    } catch (error) {
        console.error("[Room] Join error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ================================
// GET ROOM STATE
// ================================

/**
 * Get current room state with players
 */
export async function getRoomState(
    roomId: string
): Promise<RoomServiceResult<{ room: Room; players: Player[] }>> {
    try {
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", roomId)
            .single();

        if (roomError || !room) {
            return { success: false, error: "Room not found" };
        }

        const { data: players, error: playersError } = await supabase
            .from("players")
            .select("*")
            .eq("room_id", roomId)
            .eq("is_active", true)
            .order("position", { ascending: true });

        if (playersError) {
            return { success: false, error: "Failed to get players" };
        }

        return { success: true, data: { room, players: players ?? [] } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ================================
// HOST-ONLY GAME START
// ================================

export interface StartGameParams {
    roomId: string;
    requesterId: string; // Must be host
}

/**
 * Start game (HOST ONLY)
 * 
 * Validations:
 * - Requester must be host
 * - Room status must be 'waiting'
 * - Room must be full (player_count === max_players)
 */
export async function startGame(
    params: StartGameParams
): Promise<RoomServiceResult<{ room: Room }>> {
    const { roomId, requesterId } = params;

    try {
        // 1. Get room
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", roomId)
            .single();

        if (roomError || !room) {
            return { success: false, error: "Room not found" };
        }

        // 2. Validate requester is host
        if (room.host_id !== requesterId) {
            return { success: false, error: "Only the host can start the game" };
        }

        // 3. Validate room status
        if (room.status !== "waiting") {
            return { success: false, error: "Game has already started" };
        }

        // 4. Get player count
        const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id")
            .eq("room_id", roomId)
            .eq("is_active", true);

        if (playersError) {
            return { success: false, error: "Failed to check player count" };
        }

        // 5. Validate room is full
        if (players.length !== room.max_players) {
            return {
                success: false,
                error: `Waiting for players (${players.length}/${room.max_players})`,
            };
        }

        // 6. Update room status to 'starting'
        const { data: updatedRoom, error: updateError } = await supabase
            .from("rooms")
            .update({ status: "starting" })
            .eq("id", roomId)
            .select()
            .single();

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        console.log(`[Room] Game starting: ${roomId}`);

        return { success: true, data: { room: updatedRoom } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ================================
// LEAVE ROOM
// ================================

/**
 * Get count of active players in room
 */
export async function getActivePlayerCount(roomId: string): Promise<number> {
    const { data, error } = await supabase
        .from("players")
        .select("id")
        .eq("room_id", roomId)
        .eq("is_active", true);

    if (error) {
        console.error("[Room] Failed to count players:", error);
        return -1;
    }

    return data?.length ?? 0;
}

/**
 * Cleanup empty room
 * Sets room status to 'ended' if no active players
 */
async function cleanupEmptyRoom(roomId: string): Promise<void> {
    const activeCount = await getActivePlayerCount(roomId);

    if (activeCount === 0) {
        const { error } = await supabase
            .from("rooms")
            .update({ status: "ended" })
            .eq("id", roomId);

        if (error) {
            console.error("[Room] Cleanup failed:", error);
        } else {
            console.log(`[Room] Room ${roomId} ended (no active players)`);
        }
    }
}

/**
 * Player leaves room
 * - Sets player.is_active = false
 * - Triggers room cleanup if empty
 */
export async function leaveRoom(
    roomId: string,
    userId: string
): Promise<RoomServiceResult<{ roomEnded: boolean }>> {
    try {
        // 1. Mark player as inactive
        const { error } = await supabase
            .from("players")
            .update({ is_active: false })
            .eq("room_id", roomId)
            .eq("user_id", userId);

        if (error) {
            return { success: false, error: error.message };
        }

        console.log(`[Room] Player ${userId} left room ${roomId}`);

        // 2. Check if room is now empty and cleanup
        const activeCount = await getActivePlayerCount(roomId);
        let roomEnded = false;

        if (activeCount === 0) {
            await cleanupEmptyRoom(roomId);
            roomEnded = true;
        }

        return { success: true, data: { roomEnded } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Force cleanup of stale rooms
 * Call periodically to clean rooms stuck in playing state
 */
export async function cleanupStaleRooms(): Promise<number> {
    // Find rooms with no active players that aren't ended
    const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id")
        .neq("status", "ended");

    if (roomsError || !rooms) {
        console.error("[Room] Failed to fetch rooms for cleanup:", roomsError);
        return 0;
    }

    let cleanedCount = 0;

    for (const room of rooms) {
        const activeCount = await getActivePlayerCount(room.id);

        if (activeCount === 0) {
            await cleanupEmptyRoom(room.id);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        console.log(`[Room] Cleaned up ${cleanedCount} stale rooms`);
    }

    return cleanedCount;
}

// ================================
// VALIDATION HELPERS
// ================================

/**
 * Check if user is host of room
 */
export async function isHost(
    roomId: string,
    userId: string
): Promise<boolean> {
    const { data } = await supabase
        .from("rooms")
        .select("host_id")
        .eq("id", roomId)
        .single();

    return data?.host_id === userId;
}

/**
 * Check if room can be started
 */
export async function canStartGame(roomId: string): Promise<{
    canStart: boolean;
    playerCount: number;
    maxPlayers: number;
    reason?: string;
}> {
    const result = await getRoomState(roomId);

    if (!result.success || !result.data) {
        return { canStart: false, playerCount: 0, maxPlayers: 0, reason: "Room not found" };
    }

    const { room, players } = result.data;

    if (room.status !== "waiting") {
        return {
            canStart: false,
            playerCount: players.length,
            maxPlayers: room.max_players,
            reason: "Game already started",
        };
    }

    if (players.length !== room.max_players) {
        return {
            canStart: false,
            playerCount: players.length,
            maxPlayers: room.max_players,
            reason: `Waiting for ${room.max_players - players.length} more player(s)`,
        };
    }

    return {
        canStart: true,
        playerCount: players.length,
        maxPlayers: room.max_players,
    };
}
