import type { RealtimeSchemaVersion } from "./common";

export type TypingStartPayload = {
    conversationId: string;
};

export type TypingStopPayload = {
    conversationId: string;
};

export type TypingUpdatePayload = {
    schemaVersion: RealtimeSchemaVersion;
    conversationId: string;
    userId: string;
    isTyping: boolean;
};