"use client";

import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";
import { GameEvent, GameEventType, createEvent } from "./events";
import { getRoomChannelName } from "@/services/gameBroadcast";

// ================================
// TYPES
// ================================

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export interface RealtimeClientOptions {
    roomId: string;
    playerId: string;
    onEvent: (event: GameEvent) => void;
    onStatusChange?: (status: ConnectionStatus) => void;
    onError?: (error: Error) => void;
    heartbeatInterval?: number;
    reconnectAttempts?: number;
    reconnectDelay?: number;
}

interface BroadcastMessage {
    type: string;
    event: string;
    payload: GameEvent;
}

// ================================
// REALTIME CLIENT
// ================================

export class RealtimeGameClient {
    private channel: RealtimeChannel | null = null;
    private roomId: string;
    private playerId: string;
    private onEvent: (event: GameEvent) => void;
    private onStatusChange?: (status: ConnectionStatus) => void;
    private onError?: (error: Error) => void;

    private heartbeatInterval: number;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private reconnectAttempts: number;
    private reconnectDelay: number;
    private currentReconnectAttempt = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;

    private eventSequence = 0;
    private status: ConnectionStatus = "disconnected";
    private pendingEvents: GameEvent[] = [];

    constructor(options: RealtimeClientOptions) {
        this.roomId = options.roomId;
        this.playerId = options.playerId;
        this.onEvent = options.onEvent;
        this.onStatusChange = options.onStatusChange;
        this.onError = options.onError;
        this.heartbeatInterval = options.heartbeatInterval ?? 20000; // 20s default
        this.reconnectAttempts = options.reconnectAttempts ?? 5;
        this.reconnectDelay = options.reconnectDelay ?? 2000;
    }

    // ================================
    // CONNECTION MANAGEMENT
    // ================================

    /**
     * Connect to the game room channel
     */
    async connect(): Promise<void> {
        if (this.status === "connected" || this.status === "connecting") {
            return;
        }

        this.setStatus("connecting");

        try {
            // Create broadcast channel for the room
            const channelName = getRoomChannelName(this.roomId);
            console.log(`[Realtime] Connecting to channel: ${channelName}`);

            this.channel = supabase.channel(channelName, {
                config: {
                    broadcast: { self: true }, // Receive own broadcasts
                },
            });

            // Subscribe to broadcast events
            this.channel.on("broadcast", { event: "game_event" }, (payload) => {
                this.handleBroadcast(payload as BroadcastMessage);
            });

            // Handle presence (optional, for player list)
            this.channel.on("presence", { event: "sync" }, () => {
                // Could track online players here
            });

            // Subscribe to channel
            this.channel.subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    this.setStatus("connected");
                    this.currentReconnectAttempt = 0;
                    this.startHeartbeat();
                    this.flushPendingEvents();
                } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                    this.handleDisconnect();
                }
            });
        } catch (error) {
            this.setStatus("disconnected");
            this.onError?.(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Disconnect from the channel
     */
    async disconnect(): Promise<void> {
        this.stopHeartbeat();
        this.stopReconnect();

        if (this.channel) {
            await supabase.removeChannel(this.channel);
            this.channel = null;
        }

        this.setStatus("disconnected");
    }

    /**
     * Handle unexpected disconnect
     */
    private handleDisconnect(): void {
        this.stopHeartbeat();

        if (this.currentReconnectAttempt < this.reconnectAttempts) {
            this.setStatus("reconnecting");
            this.scheduleReconnect();
        } else {
            this.setStatus("disconnected");
            this.onError?.(new Error("Max reconnect attempts reached"));
        }
    }

    /**
     * Schedule a reconnection attempt
     */
    private scheduleReconnect(): void {
        this.stopReconnect();

        const delay = this.reconnectDelay * Math.pow(2, this.currentReconnectAttempt);

        this.reconnectTimer = setTimeout(async () => {
            this.currentReconnectAttempt++;
            try {
                await this.connect();
            } catch {
                this.handleDisconnect();
            }
        }, delay);
    }

    private stopReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // ================================
    // HEARTBEAT
    // ================================

    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, this.heartbeatInterval);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private sendHeartbeat(): void {
        this.broadcast("HEARTBEAT", {
            playerId: this.playerId,
            timestamp: Date.now(),
        });
    }

    // ================================
    // BROADCASTING
    // ================================

    /**
     * Broadcast an event to all players in the room
     */
    broadcast<T>(type: GameEventType, payload: T): void {
        const event = createEvent(
            type,
            payload,
            this.playerId,
            this.roomId,
            ++this.eventSequence
        );

        if (this.status !== "connected" || !this.channel) {
            // Queue event for later
            this.pendingEvents.push(event);
            return;
        }

        this.channel.send({
            type: "broadcast",
            event: "game_event",
            payload: event,
        });
    }

    /**
     * Flush pending events after reconnection
     */
    private flushPendingEvents(): void {
        const events = [...this.pendingEvents];
        this.pendingEvents = [];

        events.forEach((event) => {
            if (this.channel) {
                this.channel.send({
                    type: "broadcast",
                    event: "game_event",
                    payload: event,
                });
            }
        });
    }

    /**
     * Handle incoming broadcast
     */
    private handleBroadcast(message: BroadcastMessage): void {
        const event = message.payload;

        // Skip heartbeats from self
        if (event.type === "HEARTBEAT" && event.senderId === this.playerId) {
            return;
        }

        this.onEvent(event);
    }

    // ================================
    // HELPERS
    // ================================

    private setStatus(status: ConnectionStatus): void {
        if (this.status !== status) {
            this.status = status;
            this.onStatusChange?.(status);
        }
    }

    getStatus(): ConnectionStatus {
        return this.status;
    }

    getRoomId(): string {
        return this.roomId;
    }

    getPlayerId(): string {
        return this.playerId;
    }
}

// ================================
// FACTORY FUNCTION
// ================================

export function createRealtimeClient(
    options: RealtimeClientOptions
): RealtimeGameClient {
    return new RealtimeGameClient(options);
}
