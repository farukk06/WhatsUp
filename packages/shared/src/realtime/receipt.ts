import type { RealtimeSchemaVersion } from "./common";

export type MessageDeliveredPayload = {
    conversationId: string;
    messageId: string;
    seq: number;
};

export type ConversationReadPayload = {
    conversationId: string;
    lastReadSeq: number;
};

export type MessageReceiptStatus = "DELIVERED" | "READ";

export type MessageReceiptPayload = {
    schemaVersion: RealtimeSchemaVersion;
    conversationId: string;
    messageId: string;
    userId: string;
    seq: number;
    status: MessageReceiptStatus;
    readAt: string | null;
};