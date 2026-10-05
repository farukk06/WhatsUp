import type { RealtimeSchemaVersion } from "./common";

export type PresenceStatus = "ONLINE" | "OFFLINE";

export type PresenceUpdatePayload = {
    schemaVersion: RealtimeSchemaVersion;
    userId: string;
    status: PresenceStatus;
    lastSeenAt: string | null;
};